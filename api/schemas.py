"""Kształty API (Pydantic v2) — jedno źródło prawdy dla routerów, SSE i mocków.

Żaden model nie ma pola `contact_email` ani `contact` (twarda reguła).
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

ReporterTypeLiteral = Literal["RESIDENT", "NGO", "JST", "OTHER"]
ReportStatusLiteral = Literal["NEW", "TRIAGED", "MATCHED", "IN_PROGRESS", "CLOSED"]
SolutionKindLiteral = Literal["SOLUTION", "KNOWLEDGE"]

_EMAIL_RE = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

# --- stałe tekstów dla użytkownika -------------------------------------------------

STATUS_LABELS: dict[str, str] = {
    "preprocess": "Analizuję opis problemu...",
    "search": "Szukam w bazie rozwiązań...",
    "rerank": "Wybieram najlepiej pasujące...",
    "answer": "Przygotowuję podsumowanie...",
}

NO_MATCH_MESSAGE_PL = (
    "Nie znalazłem w bazie rozwiązania, które pasuje do tego opisu. "
    "Zgłoszenie zostało zapisane — zespół Hubu je zobaczy."
)


# --- karty rozwiązań --------------------------------------------------------------


class Scores(BaseModel):
    rerank: float | None = None
    rrf: float | None = None
    lex_rank: int | None = None
    vec_rank: int | None = None
    cosine: float | None = None


class MediaItem(BaseModel):
    type: str
    url: str
    title: str | None = None


class SolutionCard(BaseModel):
    id: int
    kind: SolutionKindLiteral
    rank: int
    title: str
    summary: str
    organization: str | None = None
    gmina: str | None = None
    powiat: str | None = None
    category: str | None = None
    category_label_pl: str | None = None
    tags: list[str] = Field(default_factory=list)
    target_group: str | None = None
    cost_range: str | None = None
    implementation_steps: list[str] = Field(default_factory=list)
    source_url: str | None = None
    source_name: str | None = None
    evidence_level: int
    media: list[MediaItem] = Field(default_factory=list)
    origin: str
    scores: Scores | None = None


class SolutionDetail(SolutionCard):
    body: str


# --- czat (SSE) -------------------------------------------------------------------


class ChatRequest(BaseModel):
    message: str = Field(max_length=10_000)
    session_id: str | None = Field(default=None, max_length=100)
    gmina: str | None = None
    severity_self: int | None = Field(default=None, ge=1, le=5)
    reporter_type: ReporterTypeLiteral = "OTHER"
    contact_email: str | None = Field(default=None, max_length=320, pattern=_EMAIL_RE)

    @field_validator("message")
    @classmethod
    def _message_not_blank(cls, v: str) -> str:
        # Treść zostaje dosłownie (raw_text); obcięcie do MAX_QUERY_CHARS robi preprocessing.
        if not v.strip():
            raise ValueError("Wiadomość nie może być pusta.")
        return v


class StatusEvent(BaseModel):
    stage: Literal["preprocess", "search", "rerank", "answer"]
    label_pl: str


class CandidatesEvent(BaseModel):
    solutions: list[SolutionCard]
    also_see: list[SolutionCard]
    context: list[SolutionCard]


class TokenEvent(BaseModel):
    text: str


class AnswerRetractedEvent(BaseModel):
    reason: Literal["no_citations"] = "no_citations"


class NoMatchEvent(BaseModel):
    reason: Literal["below_threshold"] = "below_threshold"
    best_score: float | None
    gate: str
    message_pl: str = NO_MATCH_MESSAGE_PL


class ReportSavedEvent(BaseModel):
    report_id: int
    similar_count: int
    gmina_count: int


class DoneEvent(BaseModel):
    search_event_id: int | None
    latency_ms: dict[str, int]


class ErrorEvent(BaseModel):
    code: str
    message_pl: str


# --- zgłoszenia i panel -----------------------------------------------------------


class Page[T](BaseModel):
    items: list[T]
    total: int
    limit: int
    offset: int


class ReportListItem(BaseModel):
    id: int
    raw_text: str
    category: str | None
    category_label_pl: str | None
    gmina: str | None
    powiat: str | None
    reporter_type: ReporterTypeLiteral
    severity_self: int | None
    matched: bool
    status: ReportStatusLiteral
    top_solution_id: int | None
    top_rerank_score: float | None
    session_id: str | None
    created_at: datetime
    reply_count: int = 0


class ReportDetail(ReportListItem):
    normalized_text: str
    target_group: str | None
    extracted: dict[str, Any] = Field(default_factory=dict)


class SimilarReport(BaseModel):
    id: int
    raw_text: str
    gmina: str | None
    created_at: datetime
    matched: bool
    similarity: float


class ReportPatch(BaseModel):
    status: ReportStatusLiteral


class ReplyCreate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)
    author_label: str | None = Field(default=None, max_length=100)

    @field_validator("body")
    @classmethod
    def _body_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Treść odpowiedzi nie może być pusta.")
        return v


class Reply(BaseModel):
    id: int
    report_id: int
    author_label: str | None
    body: str
    created_at: datetime
    author_verified: Literal[False] = False


# --- rozwiązania ------------------------------------------------------------------


class SolutionSubmit(BaseModel):
    """Zgłoszenie rozwiązania przez użytkownika — bez `contact`, `kind`, `origin`, `status`."""

    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=3, max_length=200)
    summary: str = Field(min_length=10, max_length=2000)
    body: str = Field(default="", max_length=20_000)
    organization: str | None = Field(default=None, max_length=300)
    gmina: str | None = None
    category: str | None = None
    tags: list[str] = Field(default_factory=list, max_length=20)
    target_group: str | None = Field(default=None, max_length=300)
    cost_range: str | None = Field(default=None, max_length=100)
    implementation_steps: list[str] = Field(default_factory=list, max_length=30)
    source_url: str | None = Field(default=None, max_length=2000)
    media: list[MediaItem] = Field(default_factory=list, max_length=10)
    submitted_by_name: str | None = Field(default=None, max_length=200)


class SolutionCreated(BaseModel):
    id: int
    status: Literal["PENDING_REVIEW"] = "PENDING_REVIEW"


class SolutionPatch(BaseModel):
    status: Literal["PUBLISHED", "REJECTED", "ARCHIVED"] | None = None
    evidence_level: int | None = Field(default=None, ge=1, le=5)
    category: str | None = None


# --- panel: skrzynka i statystyki (T22) -------------------------------------------


class Inbox(BaseModel):
    new_reports: int
    new_unmatched: int
    pending_solutions: int
    latest_reports: list[ReportListItem]
    latest_pending: list[SolutionCard]


class StatsByCategory(BaseModel):
    category: str | None
    label_pl: str | None
    total: int
    matched: int
    unmatched: int


class StatsByGmina(BaseModel):
    gmina: str | None
    powiat: str | None
    total: int
    matched: int
    unmatched: int


class StatsByWeek(BaseModel):
    week: date
    total: int
    matched: int
    unmatched: int


class StatsByReporterType(BaseModel):
    reporter_type: ReporterTypeLiteral
    total: int
    matched: int
    unmatched: int


class Stats(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    from_: date = Field(alias="from")
    to: date
    total: int
    matched: int
    unmatched: int
    by_category: list[StatsByCategory]
    by_gmina: list[StatsByGmina]
    by_week: list[StatsByWeek]
    by_reporter_type: list[StatsByReporterType]


# --- meta (T23) -------------------------------------------------------------------


class FeedbackCreate(BaseModel):
    search_event_id: int
    solution_id: int | None = None
    helpful: bool


class TaxonomyItem(BaseModel):
    code: str
    label_pl: str
    description: str
    sort_order: int


class GminaItem(BaseModel):
    name: str
    powiat: str


class Health(BaseModel):
    db: Literal["ok", "error"]
    embedding_provider: str
    rerank_provider: str
    llm_enabled: bool


# --- błędy ------------------------------------------------------------------------


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorBody(BaseModel):
    error: ErrorDetail
