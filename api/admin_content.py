"""Moduł 6: zapis treści wpisów z panelu administratora (ADR-M6-002).

Zapis + przebudowa chunków w jednej transakcji. Chunki przebudowywane tylko, gdy zmienił
się `content_hash` (title, summary, body). Błąd providera → rollback i 503 — nic się nie
zmienia. W logach tylko `solution_id`, `reembedded`, `chunk_count` — nigdy wartości pól.
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from api.cards import load_solutions, to_card
from api.corpus import content_hash, rebuild_chunks
from api.errors import ApiError
from api.models import (
    KnowledgeType,
    Solution,
    SolutionChunk,
    SolutionKind,
    SolutionOrigin,
    SolutionStatus,
    Taxonomy,
)
from api.pipeline.preprocess import GMINY
from api.providers import ProviderError, get_embedding_provider
from api.schemas import SolutionAdminCreate, SolutionAdminDetail, SolutionUpsert

log = logging.getLogger(__name__)

NOT_FOUND_MESSAGE = "Nie znaleziono wpisu."
SOURCE_URL_TAKEN_MESSAGE = "Inny wpis ma już ten adres źródła."
EMBEDDING_UNAVAILABLE_MESSAGE = "Nie udało się odświeżyć wyszukiwania. Zmiany nie zostały zapisane."
SOURCE_URL_INDEX = "solutions_source_url_uq"

# Minimalne długości po `strip()` — te same co w `SolutionUpsert`.
_MIN_LEN = {"title": 3, "summary": 10}


def _opt(value: str | None) -> str | None:
    if value is None:
        return None
    return value.strip() or None


def _required(value: str, field: str) -> str:
    cleaned = value.strip()
    if len(cleaned) < _MIN_LEN[field]:
        raise ApiError(
            422, "VALIDATION_ERROR", f"{field}: wymagane co najmniej {_MIN_LEN[field]} znaki."
        )
    return cleaned


def _unique_nonempty(values: list[str]) -> list[str]:
    cleaned = (v.strip() for v in values)
    return list(dict.fromkeys(v for v in cleaned if v))


async def _ensure_category(session: AsyncSession, category: str) -> None:
    exists = await session.scalar(select(Taxonomy.code).where(Taxonomy.code == category))
    if exists is None:
        raise ApiError(422, "VALIDATION_ERROR", f"category: nieznana kategoria {category!r}.")


def _check_knowledge_type(kind: SolutionKind, knowledge_type: str | None) -> KnowledgeType | None:
    if kind == SolutionKind.KNOWLEDGE:
        if knowledge_type is None:
            raise ApiError(
                422,
                "VALIDATION_ERROR",
                "knowledge_type: wpis typu Wiedza wymaga rodzaju (raport albo materiał).",
            )
        return KnowledgeType(knowledge_type)
    if knowledge_type is not None:
        raise ApiError(
            422, "VALIDATION_ERROR", "knowledge_type: rozwiązanie nie ma rodzaju wiedzy."
        )
    return None


async def _normalized_fields(session: AsyncSession, payload: SolutionUpsert) -> dict[str, Any]:
    """Znormalizowane i zwalidowane pola treści (bez `kind` i `knowledge_type`)."""
    gmina = _opt(payload.gmina)
    powiat: str | None = None
    if gmina is not None:
        if gmina not in GMINY:
            raise ApiError(422, "VALIDATION_ERROR", f"gmina: nieznana gmina {gmina!r}.")
        powiat = GMINY[gmina]
    category = _opt(payload.category)
    if category is not None:
        await _ensure_category(session, category)
    return {
        "title": _required(payload.title, "title"),
        "summary": _required(payload.summary, "summary"),
        "body": payload.body.strip(),
        "organization": _opt(payload.organization),
        "gmina": gmina,
        "powiat": powiat,
        "category": category,
        "tags": _unique_nonempty(payload.tags),
        "target_group": _opt(payload.target_group),
        "cost_range": _opt(payload.cost_range),
        "implementation_steps": [s.strip() for s in payload.implementation_steps if s.strip()],
        "source_url": _opt(payload.source_url),
        "source_name": _opt(payload.source_name),
        "media": [m.model_dump() for m in payload.media],
    }


async def save_entry(
    session: AsyncSession, payload: SolutionUpsert, *, solution_id: int | None
) -> tuple[int, bool]:
    """Tworzy (`solution_id is None`, payload = `SolutionAdminCreate`) albo nadpisuje wpis.

    Zwraca `(id, reembedded)`. Commituje; przy błędzie robi rollback i rzuca `ApiError`.
    """
    fields = await _normalized_fields(session, payload)
    new_hash = content_hash(fields["title"], fields["summary"], fields["body"])

    if solution_id is None:
        if not isinstance(payload, SolutionAdminCreate):
            raise TypeError("Nowy wpis wymaga SolutionAdminCreate")
        kind = SolutionKind(payload.kind)
        sol = Solution(
            kind=kind,
            knowledge_type=_check_knowledge_type(kind, payload.knowledge_type),
            origin=SolutionOrigin.CURATED,
            status=SolutionStatus(payload.status),
            evidence_level=payload.evidence_level,
            contact={},
            **fields,
        )
        session.add(sol)
        reembedded = True
    else:
        sol = await session.get(Solution, solution_id)
        if sol is None:
            raise ApiError(404, "NOT_FOUND", NOT_FOUND_MESSAGE)
        sol.knowledge_type = _check_knowledge_type(SolutionKind(sol.kind), payload.knowledge_type)
        for name, value in fields.items():
            setattr(sol, name, value)
        reembedded = new_hash != sol.content_hash

    sol.content_hash = new_hash
    sol.updated_at = func.now()
    try:
        await session.flush()
        if reembedded:
            await rebuild_chunks(session, sol, get_embedding_provider())
        saved_id = sol.id
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        if SOURCE_URL_INDEX in str(exc.orig):
            raise ApiError(409, "SOURCE_URL_TAKEN", SOURCE_URL_TAKEN_MESSAGE) from exc
        raise
    except ProviderError as exc:
        await session.rollback()
        log.warning(
            "admin solution save: embedding failed solution_id=%s (%s/%s)",
            solution_id,
            exc.provider,
            exc.code,
        )
        raise ApiError(503, "EMBEDDING_UNAVAILABLE", EMBEDDING_UNAVAILABLE_MESSAGE) from exc
    return saved_id, reembedded


async def to_admin_detail(
    session: AsyncSession, solution_id: int, *, reembedded: bool | None = None
) -> SolutionAdminDetail:
    rows = await load_solutions(session, [solution_id])
    row = rows.get(solution_id)
    if row is None:
        raise ApiError(404, "NOT_FOUND", NOT_FOUND_MESSAGE)
    sol = row.solution
    chunk_count = await session.scalar(
        select(func.count())
        .select_from(SolutionChunk)
        .where(SolutionChunk.solution_id == solution_id)
    )
    card = to_card(row, rank=1)
    detail = SolutionAdminDetail(
        **card.model_dump(),
        status=getattr(sol.status, "value", sol.status),
        updated_at=sol.updated_at,
        body=sol.body or "",
        chunk_count=chunk_count or 0,
        reembedded=reembedded,
    )
    if reembedded is not None:
        log.info(
            "admin solution saved solution_id=%s reembedded=%s chunk_count=%s",
            solution_id,
            reembedded,
            detail.chunk_count,
        )
    return detail
