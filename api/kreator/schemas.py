"""Kształty API Modułu 3 (Pydantic v2) — „Schematy API” w `module-3-tasks.md`.

Żaden model wyjściowy nie ma pola `contact_email` (tylko `has_contact`).
Walidacja gminy (lista `GMINY`) i kategorii (`challenge_taxonomy`) jest w routerach.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

from api.schemas import _EMAIL_RE as EMAIL_RE
from api.schemas import SolutionCard

IdeaStatusLiteral = Literal["DRAFT", "SUBMITTED", "IN_REVIEW", "INVITED", "REJECTED"]
IdeaStageLiteral = Literal["IDEA", "PROTOTYPE", "TESTED", "READY"]
# Statusy, które może ustawić Hub (bez macierzy przejść).
IdeaHubStatusLiteral = Literal["SUBMITTED", "IN_REVIEW", "INVITED", "REJECTED"]
CanvasBlockTypeLiteral = Literal["single", "multi", "list", "text", "partners"]
AssistTargetLiteral = Literal["idea", "canvas_block"]
CallSectionKindLiteral = Literal["text", "info"]
CallStateLiteral = Literal["open", "closed", "upcoming"]


def _not_blank(v: str | None) -> str | None:
    if v is not None and not v.strip():
        raise ValueError("Pole nie może być puste.")
    return v


# --- pomysły ----------------------------------------------------------------------


class IdeaCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    summary: str = Field(min_length=10, max_length=2000)
    essence: str = Field(default="", max_length=2000)
    audience: str = Field(default="", max_length=1000)
    stage: IdeaStageLiteral = "IDEA"
    category: str | None = None
    gmina: str | None = None
    author_name: str | None = Field(default=None, max_length=100)
    contact_email: str | None = Field(default=None, max_length=320, pattern=EMAIL_RE)
    source_report_id: int | None = None

    _title_summary_not_blank = field_validator("title", "summary")(_not_blank)


class IdeaUpdate(BaseModel):
    """Częściowa zmiana — router czyta `model_dump(exclude_unset=True)`."""

    title: str | None = Field(default=None, min_length=3, max_length=200)
    summary: str | None = Field(default=None, min_length=10, max_length=2000)
    essence: str | None = Field(default=None, max_length=2000)
    audience: str | None = Field(default=None, max_length=1000)
    stage: IdeaStageLiteral | None = None
    category: str | None = None
    gmina: str | None = None
    author_name: str | None = Field(default=None, max_length=100)
    contact_email: str | None = Field(default=None, max_length=320, pattern=EMAIL_RE)

    _title_summary_not_blank = field_validator("title", "summary")(_not_blank)


class IdeaListItem(BaseModel):
    id: int
    title: str
    summary: str
    stage: IdeaStageLiteral
    status: IdeaStatusLiteral
    category: str | None = None
    category_label_pl: str | None = None
    gmina: str | None = None
    powiat: str | None = None
    author_name: str | None = None
    has_contact: bool = False
    source_report_id: int | None = None
    canvas_percent: int = 0
    reply_count: int = 0
    created_at: datetime
    updated_at: datetime
    submitted_at: datetime | None = None


class IdeaApplicationRef(BaseModel):
    id: int
    call_id: str
    updated_at: datetime


class IdeaDetail(IdeaListItem):
    essence: str
    audience: str
    applications: list[IdeaApplicationRef] = Field(default_factory=list)


class IdeaStatusChange(BaseModel):
    status: IdeaHubStatusLiteral


class IdeaReply(BaseModel):
    """Odpowiedź Hubu do autora pomysłu. Treść przyjmuje `api.schemas.ReplyCreate`."""

    id: int
    idea_id: int
    author_label: str | None = None
    body: str
    created_at: datetime
    author_verified: Literal[False] = False


# --- kanwa: definicja (data/social-canvas.json) -----------------------------------


class CanvasOption(BaseModel):
    code: str
    label: str
    description: str = ""
    level: int | None = None


class CanvasRole(BaseModel):
    code: str
    label: str
    description: str = ""


class CanvasStatus(BaseModel):
    code: str
    label: str


class CanvasBlock(BaseModel):
    id: str
    sheet: str
    area: str
    type: CanvasBlockTypeLiteral
    title: str
    prompt: str
    help: list[str] = Field(default_factory=list)
    max: int | None = None
    options: list[CanvasOption] = Field(default_factory=list)
    roles: list[CanvasRole] = Field(default_factory=list)
    statuses: list[CanvasStatus] = Field(default_factory=list)


class CanvasArea(BaseModel):
    id: str
    title: str
    blocks: list[str]


class CanvasSheet(BaseModel):
    id: str
    title: str
    areas: list[CanvasArea]


class CanvasDefinition(BaseModel):
    version: str
    source_pl: str
    source_url: str
    sheets: list[CanvasSheet]
    blocks: list[CanvasBlock]


# --- kanwa: postęp, stan, zapis ---------------------------------------------------


class SheetProgress(BaseModel):
    filled: int
    total: int


class CanvasProgress(BaseModel):
    filled: int
    total: int
    percent: int
    by_sheet: dict[str, SheetProgress] = Field(default_factory=dict)


class CanvasState(BaseModel):
    idea_id: int
    blocks: dict[str, Any] = Field(default_factory=dict)
    progress: CanvasProgress
    updated_at: datetime | None = None


class CanvasPatch(BaseModel):
    """Wartość `None` usuwa blok."""

    blocks: dict[str, Any]


# --- asystent i podobne innowacje -------------------------------------------------


class AssistRequest(BaseModel):
    target: AssistTargetLiteral
    block_id: str | None = None


class AssistSuggestion(BaseModel):
    field: str
    value: str
    rationale: str = ""


class AssistResponse(BaseModel):
    available: bool
    questions: list[str] = Field(default_factory=list)
    suggestions: list[AssistSuggestion] = Field(default_factory=list)
    message_pl: str | None = None


class SimilarResponse(BaseModel):
    available: bool
    matched: bool
    solutions: list[SolutionCard] = Field(default_factory=list)
    message_pl: str | None = None


# --- nabory (data/calls/<id>.json) ------------------------------------------------


class CallSection(BaseModel):
    id: str
    title: str
    kind: CallSectionKindLiteral
    prompt: str
    hints: list[str] = Field(default_factory=list)
    required: bool = False
    max_chars: int | None = None
    # odwołania "idea.<pole>" / "canvas.<block_id>"
    prefill: list[str] = Field(default_factory=list)


class CallSource(BaseModel):
    title: str
    url: str


class CallFile(BaseModel):
    """Kształt pliku `data/calls/<id>.json`."""

    id: str
    title: str
    short_pl: str
    program: str
    demo: bool
    based_on: list[CallSource]
    opens_at: date
    closes_at: date
    max_amount: int
    applicant_types: list[str]
    sections: list[CallSection] = Field(default_factory=list)
    statements: list[str] = Field(default_factory=list)


class CallSummary(BaseModel):
    id: str
    title: str
    short_pl: str
    program: str
    demo: bool
    opens_at: date
    closes_at: date
    state: CallStateLiteral
    is_open: bool
    max_amount: int


class CallDetail(CallSummary):
    based_on: list[CallSource]
    applicant_types: list[str]
    sections: list[CallSection]
    statements: list[str]


# --- wnioski grantowe (tabela `applications`) -------------------------------------


class BudgetRow(BaseModel):
    action: str = Field(min_length=1, max_length=300)
    when: str = Field(default="", max_length=100)
    cost: int = Field(ge=0, le=10_000_000)


class GrantApplicationCreate(BaseModel):
    """Body `POST /api/ideas/{id}/applications`."""

    call_id: str = Field(min_length=1, max_length=100)


class GrantApplicationPatch(BaseModel):
    answers: dict[str, str | None] | None = None
    budget: list[BudgetRow] | None = None


class GrantApplicationCheck(BaseModel):
    code: str
    section_id: str | None = None
    message_pl: str


class GrantApplicationDetail(BaseModel):
    id: int
    idea_id: int
    call_id: str
    call_title: str
    answers: dict[str, str] = Field(default_factory=dict)
    budget: list[BudgetRow] = Field(default_factory=list)
    total: int
    max_amount: int
    checks: list[GrantApplicationCheck] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class DraftRequest(BaseModel):
    """Body `POST /api/applications/{id}/draft`."""

    section_id: str = Field(min_length=1, max_length=100)


class DraftResponse(BaseModel):
    available: bool
    section_id: str
    text: str = ""
    message_pl: str | None = None
