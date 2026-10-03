"""Modele SQLAlchemy 1:1 z `db/init.sql`. Schemat tworzy wyłącznie init.sql (bez create_all)."""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    REAL,
    BigInteger,
    Boolean,
    CheckConstraint,
    Computed,
    DateTime,
    ForeignKey,
    Integer,
    SmallInteger,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, ENUM, JSONB, TSVECTOR
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from api.config import settings

EMBEDDING_DIM = settings.EMBEDDING_DIM  # stały wymiar 1024 (ADR-004), jak vector(1024) w init.sql


class SolutionKind(enum.StrEnum):
    SOLUTION = "SOLUTION"
    KNOWLEDGE = "KNOWLEDGE"


class SolutionOrigin(enum.StrEnum):
    CURATED = "CURATED"
    USER_SUBMITTED = "USER_SUBMITTED"
    PROMOTED_FROM_REPORT = "PROMOTED_FROM_REPORT"


class SolutionStatus(enum.StrEnum):
    PUBLISHED = "PUBLISHED"
    PENDING_REVIEW = "PENDING_REVIEW"
    REJECTED = "REJECTED"
    ARCHIVED = "ARCHIVED"


class ReportStatus(enum.StrEnum):
    NEW = "NEW"
    TRIAGED = "TRIAGED"
    MATCHED = "MATCHED"
    IN_PROGRESS = "IN_PROGRESS"
    CLOSED = "CLOSED"


class ReporterType(enum.StrEnum):
    RESIDENT = "RESIDENT"
    NGO = "NGO"
    JST = "JST"
    OTHER = "OTHER"


class InnovationTestStatus(enum.StrEnum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"


class ApplicationStatus(enum.StrEnum):
    SUBMITTED = "SUBMITTED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"
    CANCELED = "CANCELED"


class MaterialType(enum.StrEnum):
    FILE = "FILE"
    LINK = "LINK"
    APP = "APP"
    INSTRUCTION = "INSTRUCTION"
    OFFLINE_SERVICE = "OFFLINE_SERVICE"


class TesterType(enum.StrEnum):
    RESIDENT = "RESIDENT"
    TARGET_MEMBER = "TARGET_MEMBER"
    CAREGIVER = "CAREGIVER"
    NGO = "NGO"
    JST = "JST"
    SOCIAL_INSTITUTION = "SOCIAL_INSTITUTION"
    OTHER = "OTHER"


class TestMode(enum.StrEnum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    HYBRID = "HYBRID"


def _pg_enum(py_enum: type[enum.Enum], name: str) -> ENUM:
    # Typy istnieją już w bazie (init.sql) — nie tworzymy ich z poziomu SQLAlchemy.
    return ENUM(py_enum, name=name, create_type=False)


TS_EXPRESSION = (
    "setweight(to_tsvector('polish_simple', coalesce(title, '')), 'A') || "
    "setweight(to_tsvector('polish_simple', coalesce(heading, '')), 'B') || "
    "setweight(to_tsvector('polish_simple', content), 'C')"
)


class Base(DeclarativeBase):
    pass


class Taxonomy(Base):
    __tablename__ = "challenge_taxonomy"

    code: Mapped[str] = mapped_column(Text, primary_key=True)
    label_pl: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="100")


class Solution(Base):
    __tablename__ = "solutions"
    __table_args__ = (CheckConstraint("evidence_level BETWEEN 1 AND 5"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    kind: Mapped[SolutionKind] = mapped_column(
        _pg_enum(SolutionKind, "solution_kind"),
        nullable=False,
        default=SolutionKind.SOLUTION,
        server_default=SolutionKind.SOLUTION.value,
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False, default="", server_default="")
    organization: Mapped[str | None] = mapped_column(Text)
    gmina: Mapped[str | None] = mapped_column(Text)
    powiat: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(Text, ForeignKey("challenge_taxonomy.code"))
    tags: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, default=list, server_default="{}"
    )
    target_group: Mapped[str | None] = mapped_column(Text)
    cost_range: Mapped[str | None] = mapped_column(Text)
    implementation_steps: Mapped[list[Any]] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]"
    )
    # Nigdy nie wychodzi z API.
    contact: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )
    source_url: Mapped[str | None] = mapped_column(Text)
    source_name: Mapped[str | None] = mapped_column(Text)
    media: Mapped[list[Any]] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]"
    )
    evidence_level: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=1, server_default="1"
    )
    origin: Mapped[SolutionOrigin] = mapped_column(
        _pg_enum(SolutionOrigin, "solution_origin"),
        nullable=False,
        default=SolutionOrigin.CURATED,
        server_default=SolutionOrigin.CURATED.value,
    )
    status: Mapped[SolutionStatus] = mapped_column(
        _pg_enum(SolutionStatus, "solution_status"),
        nullable=False,
        default=SolutionStatus.PUBLISHED,
        server_default=SolutionStatus.PUBLISHED.value,
    )
    content_hash: Mapped[str] = mapped_column(Text, nullable=False)
    submitted_by_name: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    chunks: Mapped[list[SolutionChunk]] = relationship(
        back_populates="solution",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="SolutionChunk.chunk_index",
    )


class SolutionChunk(Base):
    __tablename__ = "solution_chunks"
    __table_args__ = (UniqueConstraint("solution_id", "chunk_index"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    solution_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("solutions.id", ondelete="CASCADE"), nullable=False
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)  # kopia solutions.title
    heading: Mapped[str | None] = mapped_column(Text)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBEDDING_DIM))
    # Kolumna generowana w bazie — tylko do odczytu, nie trafia do INSERT/UPDATE.
    ts: Mapped[str | None] = mapped_column(TSVECTOR, Computed(TS_EXPRESSION, persisted=True))

    solution: Mapped[Solution] = relationship(back_populates="chunks")


class Report(Base):
    __tablename__ = "reports"
    __table_args__ = (CheckConstraint("severity_self BETWEEN 1 AND 5"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)  # nigdy w logach
    normalized_text: Mapped[str] = mapped_column(Text, nullable=False)  # nigdy w logach
    embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBEDDING_DIM))
    category: Mapped[str | None] = mapped_column(Text, ForeignKey("challenge_taxonomy.code"))
    gmina: Mapped[str | None] = mapped_column(Text)
    powiat: Mapped[str | None] = mapped_column(Text)
    target_group: Mapped[str | None] = mapped_column(Text)
    extracted: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )
    severity_self: Mapped[int | None] = mapped_column(SmallInteger)
    contact_email: Mapped[str | None] = mapped_column(Text)  # nigdy z API ani do logów
    reporter_type: Mapped[ReporterType] = mapped_column(
        _pg_enum(ReporterType, "reporter_type"),
        nullable=False,
        default=ReporterType.OTHER,
        server_default=ReporterType.OTHER.value,
    )
    matched: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    top_solution_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("solutions.id"))
    top_rerank_score: Mapped[float | None] = mapped_column(REAL)
    session_id: Mapped[str | None] = mapped_column(Text)
    status: Mapped[ReportStatus] = mapped_column(
        _pg_enum(ReportStatus, "report_status"),
        nullable=False,
        default=ReportStatus.NEW,
        server_default=ReportStatus.NEW.value,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    replies: Mapped[list[ReportReply]] = relationship(
        back_populates="report",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ReportReply.created_at",
    )


class SearchEvent(Base):
    __tablename__ = "search_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    report_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("reports.id", ondelete="SET NULL")
    )
    query: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_query: Mapped[str] = mapped_column(Text, nullable=False)
    results: Mapped[Any] = mapped_column(JSONB, nullable=False)
    lexical_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    vector_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    latency_ms: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )
    clicked_solution_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("solutions.id"))
    helpful: Mapped[bool | None] = mapped_column(Boolean)
    flags: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class ReportReply(Base):
    __tablename__ = "report_replies"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    report_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False
    )
    author_label: Mapped[str | None] = mapped_column(Text)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    report: Mapped[Report] = relationship(back_populates="replies")


class InnovationTest(Base):
    __tablename__ = "innovation_tests"
    __table_args__ = (
        CheckConstraint("seats_limit > 0"),
        CheckConstraint(
            "(status = 'OPEN' AND closed_at IS NULL) OR "
            "(status = 'CLOSED' AND closed_at IS NOT NULL)"
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    solution_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("solutions.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    goal_description: Mapped[str] = mapped_column(Text, nullable=False)
    instruction: Mapped[str] = mapped_column(Text, nullable=False)
    target_group: Mapped[str] = mapped_column(Text, nullable=False)
    tester_type: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(Text, nullable=False)
    seats_limit: Mapped[int] = mapped_column(Integer, nullable=False)
    mode: Mapped[TestMode] = mapped_column(_pg_enum(TestMode, "test_mode"), nullable=False)
    estimated_duration: Mapped[str] = mapped_column(Text, nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[InnovationTestStatus] = mapped_column(
        _pg_enum(InnovationTestStatus, "innovation_test_status"),
        nullable=False,
        default=InnovationTestStatus.OPEN,
        server_default=InnovationTestStatus.OPEN.value,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ai_report: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    ai_model: Mapped[str | None] = mapped_column(Text)
    ai_prompt_version: Mapped[str | None] = mapped_column(Text)
    ai_generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    solution: Mapped[Solution] = relationship()
    materials: Mapped[list[InnovationTestMaterial]] = relationship(
        back_populates="test",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="InnovationTestMaterial.sort_order",
    )
    applications: Mapped[list[InnovationTestApplication]] = relationship(
        back_populates="test",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="InnovationTestApplication.created_at",
    )


class InnovationTestMaterial(Base):
    __tablename__ = "innovation_test_materials"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    test_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("innovation_tests.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[MaterialType] = mapped_column(
        _pg_enum(MaterialType, "material_type"), nullable=False
    )
    locator: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="", server_default="")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    test: Mapped[InnovationTest] = relationship(back_populates="materials")


class InnovationTestApplication(Base):
    __tablename__ = "innovation_test_applications"
    __table_args__ = (
        CheckConstraint("consent = true"),
        CheckConstraint(
            "(status = 'REJECTED' AND rejection_reason IS NOT NULL "
            "AND length(trim(rejection_reason)) > 0) OR (status <> 'REJECTED')"
        ),
        CheckConstraint(
            "(status = 'CANCELED' AND cancel_reason IS NOT NULL "
            "AND length(trim(cancel_reason)) > 0) OR (status <> 'CANCELED')"
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    test_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("innovation_tests.id", ondelete="CASCADE"), nullable=False
    )
    display_name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, nullable=False)  # nigdy w logach ani API publicznym
    email_normalized: Mapped[str] = mapped_column(Text, nullable=False)
    tester_type: Mapped[TesterType] = mapped_column(
        _pg_enum(TesterType, "tester_type"), nullable=False
    )
    wojewodztwo: Mapped[str] = mapped_column(Text, nullable=False)
    powiat: Mapped[str] = mapped_column(Text, nullable=False)
    gmina: Mapped[str] = mapped_column(Text, nullable=False)
    is_target_group_member: Mapped[bool] = mapped_column(Boolean, nullable=False)
    motivation: Mapped[str] = mapped_column(Text, nullable=False)  # nigdy w logach
    status: Mapped[ApplicationStatus] = mapped_column(
        _pg_enum(ApplicationStatus, "application_status"),
        nullable=False,
        default=ApplicationStatus.SUBMITTED,
        server_default=ApplicationStatus.SUBMITTED.value,
    )
    consent: Mapped[bool] = mapped_column(Boolean, nullable=False)
    consent_version: Mapped[str] = mapped_column(Text, nullable=False)
    consented_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    cancel_reason: Mapped[str | None] = mapped_column(Text)
    access_token_hash: Mapped[str | None] = mapped_column(Text)
    access_token_created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    access_token_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ai_fit_suggestion: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    test: Mapped[InnovationTest] = relationship(back_populates="applications")
    feedback: Mapped[InnovationTestFeedback | None] = relationship(
        back_populates="application",
        cascade="all, delete-orphan",
        passive_deletes=True,
        uselist=False,
    )


class InnovationTestFeedback(Base):
    __tablename__ = "innovation_test_feedback"
    __table_args__ = (
        CheckConstraint("usefulness BETWEEN 1 AND 5"),
        CheckConstraint("ease_of_use BETWEEN 1 AND 5"),
        CheckConstraint("accessibility BETWEEN 1 AND 5"),
        CheckConstraint("fit_to_needs BETWEEN 1 AND 5"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    application_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("innovation_test_applications.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    usefulness: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    ease_of_use: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    accessibility: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    fit_to_needs: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text)
    improvement: Mapped[str | None] = mapped_column(Text)
    comment_visible_to_author: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    application: Mapped[InnovationTestApplication] = relationship(back_populates="feedback")
