"""Kształty API Modułu 5 (Pydantic v2). Bez danych kontaktowych i `session_id` w odpowiedziach."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from api.schemas import ReporterTypeLiteral, SolutionCard

ThreadKindLiteral = Literal["QUESTION", "MENTORING", "PARTNERSHIP"]
ThreadStatusLiteral = Literal["AI_PENDING", "WAITING_STAFF", "WAITING_USER", "CLOSED"]
MessageRoleLiteral = Literal["USER", "STAFF", "MENTOR", "ASSISTANT", "SYSTEM"]
OrgSectorLiteral = Literal["NGO", "JST", "PUBLIC", "BUSINESS", "SCIENCE", "RESIDENTS"]
IntentLiteral = Literal["OFFER", "SEEK"]
OfferStatusLiteral = Literal["PUBLISHED", "CLOSED"]


def _not_blank(v: str) -> str:
    if not v.strip():
        raise ValueError("Pole nie może być puste.")
    return v


def _blank_to_none(v: str | None) -> str | None:
    if v is None:
        return None
    v = v.strip()
    return v or None


# --- żądania ----------------------------------------------------------------------


class ThreadCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: ThreadKindLiteral
    body: str = Field(min_length=1, max_length=4000)
    subject: str | None = Field(default=None, max_length=200)  # None → pierwsze 80 znaków body
    category: str | None = None  # None → preprocess(body).category
    reporter_type: ReporterTypeLiteral = "OTHER"
    author_label: str | None = Field(default=None, max_length=100)
    session_id: str | None = Field(default=None, max_length=100)
    partnership_id: int | None = None  # wymagany dla PARTNERSHIP

    _body = field_validator("body")(_not_blank)
    _optional = field_validator("subject", "category", "author_label")(_blank_to_none)


class MessageCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["USER", "STAFF", "MENTOR"]
    body: str = Field(min_length=1, max_length=4000)
    author_label: str | None = Field(default=None, max_length=100)
    mentor_id: int | None = None  # wymagany dla MENTOR

    _body = field_validator("body")(_not_blank)
    _optional = field_validator("author_label")(_blank_to_none)


class ThreadPatch(BaseModel):
    """`assigned_mentor_id` podane jako null = usunięcie przydziału (sprawdź `model_fields_set`)."""

    model_config = ConfigDict(extra="forbid")

    status: Literal["WAITING_STAFF", "CLOSED"] | None = None
    assigned_mentor_id: int | None = None


class PartnershipCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    intent: IntentLiteral
    organization: str = Field(min_length=2, max_length=300)
    sector: OrgSectorLiteral
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=4000)
    category: str | None = None
    session_id: str | None = Field(default=None, max_length=100)

    _text = field_validator("organization", "title", "description")(_not_blank)
    _optional = field_validator("category")(_blank_to_none)


class PartnershipPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: OfferStatusLiteral


# --- odpowiedzi -------------------------------------------------------------------


class MentorRef(BaseModel):
    id: int
    display_name: str


class Mentor(MentorRef):
    organization: str | None
    expertise: str
    categories: list[str]


class ThreadMessageOut(BaseModel):
    id: int
    role: MessageRoleLiteral
    author_label: str | None
    mentor: MentorRef | None
    body: str
    cards: list[SolutionCard] = Field(default_factory=list)  # tylko ASSISTANT; [n] = pozycja n
    created_at: datetime


class ThreadListItem(BaseModel):
    id: int
    kind: ThreadKindLiteral
    status: ThreadStatusLiteral
    subject: str
    category: str | None
    category_label_pl: str | None
    reporter_type: ReporterTypeLiteral
    author_label: str | None
    partnership_id: int | None
    assigned_mentor: MentorRef | None
    last_message_role: MessageRoleLiteral | None
    last_message_at: datetime
    has_reply: bool
    created_at: datetime


class ThreadDetail(ThreadListItem):
    messages: list[ThreadMessageOut]


class PartnershipOffer(BaseModel):
    id: int
    intent: IntentLiteral
    organization: str
    sector: OrgSectorLiteral
    title: str
    description: str
    category: str | None
    category_label_pl: str | None
    status: OfferStatusLiteral
    created_at: datetime
