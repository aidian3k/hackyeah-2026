"""Katalog rozwiązań: lista, szczegóły, zgłaszanie nowych (kolejka PENDING_REVIEW) i zatwierdzanie.

Karty budowane wyłącznie przez `api.cards`; pole `contact` nigdy nie wychodzi.
"""

from __future__ import annotations

import logging
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.cards import SolutionRow, load_solutions, to_card, to_detail
from api.corpus import content_hash, rebuild_chunks
from api.db import get_session
from api.errors import ApiError
from api.models import Solution, SolutionKind, SolutionOrigin, SolutionStatus, Taxonomy
from api.pipeline.preprocess import GMINY
from api.providers import ProviderError, get_embedding_provider
from api.schemas import (
    Page,
    SolutionCard,
    SolutionCreated,
    SolutionDetail,
    SolutionPatch,
    SolutionSubmit,
)

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["solutions"])

Session = Annotated[AsyncSession, Depends(get_session)]
StatusLiteral = Literal["PUBLISHED", "PENDING_REVIEW", "REJECTED", "ARCHIVED"]


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


async def _ensure_category(session: AsyncSession, category: str) -> None:
    exists = await session.scalar(select(Taxonomy.code).where(Taxonomy.code == category))
    if exists is None:
        raise ApiError(422, "VALIDATION_ERROR", f"category: nieznana kategoria {category!r}.")


async def _detail(session: AsyncSession, solution_id: int) -> SolutionDetail:
    rows = await load_solutions(session, [solution_id])
    row = rows.get(solution_id)
    if row is None:
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono rozwiązania.")
    return to_detail(row)


@router.get("/solutions", response_model=Page[SolutionCard])
async def list_solutions(
    session: Session,
    kind: Literal["SOLUTION", "KNOWLEDGE"] = "SOLUTION",
    category: str | None = None,
    gmina: str | None = None,
    powiat: str | None = None,
    tag: str | None = None,
    evidence_min: Annotated[int | None, Query(ge=1, le=5)] = None,
    q: Annotated[str | None, Query(max_length=200)] = None,
    status: StatusLiteral = "PUBLISHED",
    sort: Literal["recent", "evidence"] = "recent",
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[SolutionCard]:
    conds = [
        Solution.kind == SolutionKind(kind),
        Solution.status == SolutionStatus(status),
    ]
    if category:
        conds.append(Solution.category == category)
    if gmina:
        conds.append(Solution.gmina == gmina)
    if powiat:
        conds.append(Solution.powiat == powiat)
    if tag:
        conds.append(Solution.tags.any(tag))
    if evidence_min is not None:
        conds.append(Solution.evidence_level >= evidence_min)
    q = (q or "").strip() or None
    if q:
        conds.append(
            Solution.title.op("%")(q)
            | Solution.title.ilike("%" + _escape_like(q) + "%", escape="\\")
        )

    total = await session.scalar(select(func.count()).select_from(Solution).where(*conds))

    order = []
    if q:
        order.append(func.similarity(Solution.title, q).desc())
    if sort == "evidence":
        order.append(Solution.evidence_level.desc())
    order += [Solution.created_at.desc(), Solution.id.desc()]

    stmt = (
        select(Solution, Taxonomy.label_pl)
        .outerjoin(Taxonomy, Taxonomy.code == Solution.category)
        .where(*conds)
        .order_by(*order)
        .limit(limit)
        .offset(offset)
    )
    rows = (await session.execute(stmt)).all()
    items = [
        to_card(SolutionRow(solution=sol, category_label_pl=label), rank=offset + i + 1)
        for i, (sol, label) in enumerate(rows)
    ]
    return Page[SolutionCard](items=items, total=total or 0, limit=limit, offset=offset)


@router.get("/solutions/{solution_id}", response_model=SolutionDetail)
async def get_solution(solution_id: int, session: Session) -> SolutionDetail:
    return await _detail(session, solution_id)


@router.post("/solutions", response_model=SolutionCreated, status_code=201)
async def create_solution(payload: SolutionSubmit, session: Session) -> SolutionCreated:
    powiat: str | None = None
    gmina = (payload.gmina or "").strip() or None
    if gmina is not None:
        if gmina not in GMINY:
            raise ApiError(422, "VALIDATION_ERROR", f"gmina: nieznana gmina {gmina!r}.")
        powiat = GMINY[gmina]
    if payload.category:
        await _ensure_category(session, payload.category)

    sol = Solution(
        kind=SolutionKind.SOLUTION,
        title=payload.title,
        summary=payload.summary,
        body=payload.body,
        organization=payload.organization,
        gmina=gmina,
        powiat=powiat,
        category=payload.category,
        tags=list(payload.tags),
        target_group=payload.target_group,
        cost_range=payload.cost_range,
        implementation_steps=list(payload.implementation_steps),
        contact={},
        source_url=payload.source_url,
        media=[m.model_dump() for m in payload.media],
        evidence_level=1,
        origin=SolutionOrigin.USER_SUBMITTED,
        status=SolutionStatus.PENDING_REVIEW,
        content_hash=content_hash(payload.title, payload.summary, payload.body),
        submitted_by_name=payload.submitted_by_name,
    )
    try:
        session.add(sol)
        await session.flush()
        await rebuild_chunks(session, sol, get_embedding_provider())
        await session.commit()
    except ProviderError as exc:
        await session.rollback()
        log.warning("solution submit: embedding failed (%s/%s)", exc.provider, exc.code)
        raise ApiError(
            503,
            "EMBEDDING_UNAVAILABLE",
            "Usługa embeddingów jest chwilowo niedostępna. Spróbuj ponownie później.",
        ) from exc
    log.info("solution submitted id=%s", sol.id)
    return SolutionCreated(id=sol.id)


@router.patch("/solutions/{solution_id}", response_model=SolutionDetail)
async def patch_solution(
    solution_id: int, payload: SolutionPatch, session: Session
) -> SolutionDetail:
    sol = await session.get(Solution, solution_id)
    if sol is None:
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono rozwiązania.")
    if payload.status is not None:
        sol.status = SolutionStatus(payload.status)
    if payload.evidence_level is not None:
        sol.evidence_level = payload.evidence_level
    if "category" in payload.model_fields_set:
        if payload.category is not None:
            await _ensure_category(session, payload.category)
        sol.category = payload.category
    sol.updated_at = func.now()
    await session.commit()
    log.info("solution patched id=%s fields=%s", solution_id, sorted(payload.model_fields_set))
    return await _detail(session, solution_id)
