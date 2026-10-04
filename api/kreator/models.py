"""Modele SQLAlchemy Modułu 3 — 1:1 z `db/m3-kreator.sql` (bez create_all).

`contact_email` nigdy nie wychodzi z API, do logów ani do promptów.
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Any

from sqlalchemy import BigInteger, DateTime, ForeignKey, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import ENUM, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.models import Base


class IdeaStatus(enum.StrEnum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    IN_REVIEW = "IN_REVIEW"
    INVITED = "INVITED"
    REJECTED = "REJECTED"


class IdeaStage(enum.StrEnum):
    IDEA = "IDEA"
    PROTOTYPE = "PROTOTYPE"
    TESTED = "TESTED"
    READY = "READY"


def _pg_enum(py_enum: type[enum.Enum], name: str) -> ENUM:
    # Typy tworzy db/m3-kreator.sql — nie tworzymy ich z poziomu SQLAlchemy.
    return ENUM(py_enum, name=name, create_type=False)


class Idea(Base):
    __tablename__ = "ideas"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    essence: Mapped[str] = mapped_column(Text, nullable=False, default="", server_default="")
    audience: Mapped[str] = mapped_column(Text, nullable=False, default="", server_default="")
    stage: Mapped[IdeaStage] = mapped_column(
        _pg_enum(IdeaStage, "idea_stage"),
        nullable=False,
        default=IdeaStage.IDEA,
        server_default=IdeaStage.IDEA.value,
    )
    category: Mapped[str | None] = mapped_column(Text, ForeignKey("challenge_taxonomy.code"))
    gmina: Mapped[str | None] = mapped_column(Text)
    powiat: Mapped[str | None] = mapped_column(Text)
    author_name: Mapped[str | None] = mapped_column(Text)  # nigdy w logach
    contact_email: Mapped[str | None] = mapped_column(Text)  # nigdy z API ani do logów
    source_report_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("reports.id", ondelete="SET NULL")
    )
    status: Mapped[IdeaStatus] = mapped_column(
        _pg_enum(IdeaStatus, "idea_status"),
        nullable=False,
        default=IdeaStatus.DRAFT,
        server_default=IdeaStatus.DRAFT.value,
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    canvas: Mapped[IdeaCanvas | None] = relationship(
        back_populates="idea",
        cascade="all, delete-orphan",
        passive_deletes=True,
        uselist=False,
    )
    replies: Mapped[list[IdeaReply]] = relationship(
        back_populates="idea",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="IdeaReply.created_at",
    )
    applications: Mapped[list[GrantApplication]] = relationship(
        back_populates="idea",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="GrantApplication.id",
    )


class IdeaCanvas(Base):
    __tablename__ = "idea_canvases"

    idea_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("ideas.id", ondelete="CASCADE"), primary_key=True
    )
    # {block_id: wartość} — kształty wartości: „Definicja Social Canvas” w module-3-tasks.md.
    data: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    idea: Mapped[Idea] = relationship(back_populates="canvas")


class IdeaReply(Base):
    __tablename__ = "idea_replies"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    idea_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("ideas.id", ondelete="CASCADE"), nullable=False
    )
    author_label: Mapped[str | None] = mapped_column(Text)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    idea: Mapped[Idea] = relationship(back_populates="replies")


class GrantApplication(Base):
    """Wniosek grantowy (tabela `applications`); nie mylić z wnioskami testerów M4."""

    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("idea_id", "call_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    idea_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("ideas.id", ondelete="CASCADE"), nullable=False
    )
    call_id: Mapped[str] = mapped_column(Text, nullable=False)
    # {section_id: tekst}
    answers: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )
    # [{action, when, cost}]
    budget: Mapped[list[Any]] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    idea: Mapped[Idea] = relationship(back_populates="applications")
