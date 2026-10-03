"""Modele M5 1:1 z db/m5-komunikacja.sql. Schemat tworzy wyłącznie plik SQL.

Treść (`subject`, `body`, `title`, `description`, `author_label`) nigdy nie trafia do logów,
a `session_id` nie wychodzi w odpowiedziach API.
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Any

from sqlalchemy import BigInteger, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, ENUM, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.models import Base, ReporterType


class ThreadKind(enum.StrEnum):
    QUESTION = "QUESTION"
    MENTORING = "MENTORING"
    PARTNERSHIP = "PARTNERSHIP"


class ThreadStatus(enum.StrEnum):
    AI_PENDING = "AI_PENDING"
    WAITING_STAFF = "WAITING_STAFF"
    WAITING_USER = "WAITING_USER"
    CLOSED = "CLOSED"


class MessageRole(enum.StrEnum):
    USER = "USER"
    STAFF = "STAFF"
    MENTOR = "MENTOR"
    ASSISTANT = "ASSISTANT"
    SYSTEM = "SYSTEM"


class OrgSector(enum.StrEnum):
    NGO = "NGO"
    JST = "JST"
    PUBLIC = "PUBLIC"
    BUSINESS = "BUSINESS"
    SCIENCE = "SCIENCE"
    RESIDENTS = "RESIDENTS"


class PartnershipIntent(enum.StrEnum):
    OFFER = "OFFER"
    SEEK = "SEEK"


class OfferStatus(enum.StrEnum):
    PUBLISHED = "PUBLISHED"
    CLOSED = "CLOSED"


def _pg_enum(py_enum: type[enum.Enum], name: str) -> ENUM:
    # Typy tworzy db/m5-komunikacja.sql — nie z poziomu SQLAlchemy.
    return ENUM(py_enum, name=name, create_type=False)


class Mentor(Base):
    __tablename__ = "mentors"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    seed_key: Mapped[str | None] = mapped_column(Text, unique=True)
    display_name: Mapped[str] = mapped_column(Text, nullable=False)
    organization: Mapped[str | None] = mapped_column(Text)
    expertise: Mapped[str] = mapped_column(Text, nullable=False)
    categories: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, server_default="{}")


class PartnershipOffer(Base):
    __tablename__ = "partnership_offers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    seed_key: Mapped[str | None] = mapped_column(Text, unique=True)
    intent: Mapped[PartnershipIntent] = mapped_column(
        _pg_enum(PartnershipIntent, "partnership_intent"), nullable=False
    )
    organization: Mapped[str] = mapped_column(Text, nullable=False)
    sector: Mapped[OrgSector] = mapped_column(_pg_enum(OrgSector, "org_sector"), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(Text, ForeignKey("challenge_taxonomy.code"))
    session_id: Mapped[str | None] = mapped_column(Text)
    status: Mapped[OfferStatus] = mapped_column(
        _pg_enum(OfferStatus, "offer_status"),
        nullable=False,
        server_default=OfferStatus.PUBLISHED.value,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class Thread(Base):
    __tablename__ = "threads"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    seed_key: Mapped[str | None] = mapped_column(Text, unique=True)
    kind: Mapped[ThreadKind] = mapped_column(_pg_enum(ThreadKind, "thread_kind"), nullable=False)
    status: Mapped[ThreadStatus] = mapped_column(
        _pg_enum(ThreadStatus, "thread_status"), nullable=False
    )
    subject: Mapped[str] = mapped_column(Text, nullable=False)  # nigdy w logach
    category: Mapped[str | None] = mapped_column(Text, ForeignKey("challenge_taxonomy.code"))
    reporter_type: Mapped[ReporterType] = mapped_column(
        _pg_enum(ReporterType, "reporter_type"),
        nullable=False,
        server_default=ReporterType.OTHER.value,
    )
    author_label: Mapped[str | None] = mapped_column(Text)  # podpis autora, niezweryfikowany
    session_id: Mapped[str | None] = mapped_column(Text)
    partnership_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("partnership_offers.id", ondelete="SET NULL")
    )
    assigned_mentor_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("mentors.id", ondelete="SET NULL")
    )
    last_message_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    user_last_read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    messages: Mapped[list[ThreadMessage]] = relationship(
        back_populates="thread",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ThreadMessage.created_at",
    )


class ThreadMessage(Base):
    __tablename__ = "thread_messages"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    thread_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("threads.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[MessageRole] = mapped_column(_pg_enum(MessageRole, "message_role"), nullable=False)
    author_label: Mapped[str | None] = mapped_column(Text)
    mentor_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("mentors.id", ondelete="SET NULL")
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)  # nigdy w logach
    solution_ids: Mapped[list[int]] = mapped_column(
        ARRAY(BigInteger), nullable=False, server_default="{}"
    )
    meta: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default="{}")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    thread: Mapped[Thread] = relationship(back_populates="messages")
