"""Kształty API (Pydantic v2) — jedno źródło prawdy dla routerów, SSE i mocków.

Żaden model nie ma pola `contact_email` ani `contact` (twarda reguła).
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator

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


# --- Moduł 4: Tester innowacji ----------------------------------------------------


MaterialTypeLiteral = Literal["FILE", "LINK", "APP", "INSTRUCTION", "OFFLINE_SERVICE"]
TesterTypeLiteral = Literal[
    "RESIDENT",
    "TARGET_MEMBER",
    "CAREGIVER",
    "NGO",
    "JST",
    "SOCIAL_INSTITUTION",
    "OTHER",
]
TestModeLiteral = Literal["ONLINE", "OFFLINE", "HYBRID"]
InnovationTestStatusLiteral = Literal["OPEN", "CLOSED"]
ApplicationStatusLiteral = Literal[
    "SUBMITTED", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELED"
]


def _require_nonblank(value: str, label: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError(f"{label} nie może być puste.")
    return cleaned


class InnovationTestMaterialIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=300)
    type: MaterialTypeLiteral
    locator: str = Field(min_length=1, max_length=2000)
    description: str = Field(default="", max_length=2000)
    sort_order: int = Field(default=0, ge=0, le=10_000)

    @field_validator("title", "locator")
    @classmethod
    def _required_text(cls, v: str, info: ValidationInfo) -> str:
        return _require_nonblank(v, str(info.field_name))


class InnovationTestMaterialRead(BaseModel):
    id: int
    title: str
    type: MaterialTypeLiteral
    locator: str
    description: str
    sort_order: int


class InnovationTestCreate(BaseModel):
    """Kompletny nabór — utworzenie od razu ustawia status OPEN."""

    model_config = ConfigDict(extra="forbid")

    solution_id: int = Field(gt=0)
    title: str = Field(min_length=3, max_length=300)
    goal_description: str = Field(min_length=10, max_length=5000)
    instruction: str = Field(min_length=10, max_length=10_000)
    target_group: str = Field(min_length=2, max_length=500)
    tester_type: str = Field(min_length=2, max_length=500)
    location: str = Field(min_length=2, max_length=500)
    seats_limit: int = Field(gt=0, le=10_000)
    mode: TestModeLiteral
    estimated_duration: str = Field(min_length=1, max_length=200)
    ends_at: datetime
    materials: list[InnovationTestMaterialIn] = Field(min_length=1, max_length=50)

    @field_validator(
        "title",
        "goal_description",
        "instruction",
        "target_group",
        "tester_type",
        "location",
        "estimated_duration",
    )
    @classmethod
    def _required_fields(cls, v: str, info: ValidationInfo) -> str:
        return _require_nonblank(v, str(info.field_name))


class InnovationTestRead(BaseModel):
    id: int
    solution_id: int
    solution_title: str | None = None
    solution_status: str | None = None
    title: str
    goal_description: str
    instruction: str
    target_group: str
    tester_type: str
    location: str
    seats_limit: int
    seats_accepted: int = 0
    mode: TestModeLiteral
    estimated_duration: str
    ends_at: datetime
    status: InnovationTestStatusLiteral
    created_at: datetime
    closed_at: datetime | None = None
    materials: list[InnovationTestMaterialRead] = Field(default_factory=list)


class InnovationTestApplicationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: str = Field(min_length=2, max_length=300)
    email: str = Field(max_length=320, pattern=_EMAIL_RE)
    tester_type: TesterTypeLiteral
    wojewodztwo: str = Field(min_length=2, max_length=100)
    powiat: str = Field(min_length=2, max_length=100)
    gmina: str = Field(min_length=2, max_length=100)
    is_target_group_member: bool
    motivation: str = Field(min_length=10, max_length=4000)
    consent: Literal[True]

    @field_validator("display_name", "wojewodztwo", "powiat", "gmina", "motivation")
    @classmethod
    def _required_app_fields(cls, v: str, info: ValidationInfo) -> str:
        return _require_nonblank(v, str(info.field_name))


class TesterFitSuggestion(BaseModel):
    label_pl: str
    rationale_pl: str
    disclaimer_pl: str = "Sugestia AI, nie decyzja Hubu."


class InnovationTestApplicationRead(BaseModel):
    """Pełny rekord dla panelu Hubu (z kontaktem). Bez plaintext tokenu."""

    id: int
    test_id: int
    display_name: str
    email: str
    tester_type: TesterTypeLiteral
    wojewodztwo: str
    powiat: str
    gmina: str
    is_target_group_member: bool
    motivation: str
    status: ApplicationStatusLiteral
    consent: bool
    consent_version: str
    consented_at: datetime
    rejection_reason: str | None = None
    cancel_reason: str | None = None
    has_access_token: bool = False
    ai_fit_suggestion: TesterFitSuggestion | None = None
    created_at: datetime
    updated_at: datetime
    feedback_id: int | None = None


class InnovationTestApplicationPublic(BaseModel):
    """Potwierdzenie zgłoszenia — bez e-maila i tokenu."""

    id: int
    test_id: int
    status: ApplicationStatusLiteral
    consent_version: str
    message_pl: str = (
        "Zgłoszenie zostało przyjęte. Hub skontaktuje się z Tobą, jeśli zakwalifikuje "
        "Cię do testu."
    )


class InnovationTestDecision(BaseModel):
    """Powód wymagany przy odrzuceniu."""

    model_config = ConfigDict(extra="forbid")

    reason: str = Field(min_length=3, max_length=2000)

    @field_validator("reason")
    @classmethod
    def _reason_not_blank(cls, v: str) -> str:
        return _require_nonblank(v, "reason")


class InnovationTestCancel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: str = Field(min_length=3, max_length=2000)

    @field_validator("reason")
    @classmethod
    def _reason_not_blank(cls, v: str) -> str:
        return _require_nonblank(v, "reason")


class InnovationTestAccessLink(BaseModel):
    """Jednorazowy plaintext token — tylko w odpowiedzi akceptacji / regeneracji."""

    application_id: int
    status: ApplicationStatusLiteral
    access_token: str
    access_path: str


class InnovationTestFeedbackCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    usefulness: int = Field(ge=1, le=5)
    ease_of_use: int = Field(ge=1, le=5)
    accessibility: int = Field(ge=1, le=5)
    fit_to_needs: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=4000)
    improvement: str | None = Field(default=None, max_length=4000)

    @field_validator("comment", "improvement")
    @classmethod
    def _optional_text(cls, v: str | None) -> str | None:
        if v is None:
            return None
        cleaned = v.strip()
        return cleaned or None


class InnovationTestFeedbackRead(BaseModel):
    id: int
    application_id: int
    usefulness: int
    ease_of_use: int
    accessibility: int
    fit_to_needs: int
    comment: str | None = None
    improvement: str | None = None
    comment_visible_to_author: bool
    submitted_at: datetime


class InnovationTestAccessStatus(BaseModel):
    """GET /access/{token} — status udziału bez danych kontaktowych."""

    application_id: int
    test_id: int
    test_title: str
    test_status: InnovationTestStatusLiteral
    status: ApplicationStatusLiteral
    rejection_reason: str | None = None
    cancel_reason: str | None = None
    can_submit_feedback: bool
    feedback: InnovationTestFeedbackRead | None = None


class FeedbackModerate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    comment_visible_to_author: bool


class RatingDistribution(BaseModel):
    score: int
    count: int


class RatingStats(BaseModel):
    average: float | None
    distribution: list[RatingDistribution]


class AnonymousFeedbackComment(BaseModel):
    feedback_id: int
    comment: str | None = None
    improvement: str | None = None
    comment_visible_to_author: bool
    usefulness: int
    ease_of_use: int
    accessibility: int
    fit_to_needs: int


class AiTestReport(BaseModel):
    summary_pl: str
    barriers_pl: list[str] = Field(default_factory=list)
    improvements_pl: list[str] = Field(default_factory=list)
    evidence_feedback_ids: list[int] = Field(default_factory=list)
    disclaimer_pl: str = "Wynik pomocniczy; decyzję podejmuje Hub."


class InnovationTestReport(BaseModel):
    test_id: int
    test_status: InnovationTestStatusLiteral
    applications_total: int
    applications_accepted: int
    applications_completed: int
    applications_canceled: int
    applications_rejected: int
    applications_submitted: int
    feedback_count: int
    small_sample_warning: bool
    usefulness: RatingStats
    ease_of_use: RatingStats
    accessibility: RatingStats
    fit_to_needs: RatingStats
    anonymous_comments: list[AnonymousFeedbackComment] = Field(default_factory=list)
    ai_report: AiTestReport | None = None
    ai_available: bool = False
    ai_error_pl: str | None = None
    ai_model: str | None = None
    ai_prompt_version: str | None = None
    ai_generated_at: datetime | None = None
