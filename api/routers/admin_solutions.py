"""Moduł 6: Baza wiedzy w panelu administratora — lista, szczegóły, dodawanie, edycja treści.

Osobny prefiks `/api/admin/solutions` (ADR-M6-001); publiczne `/api/solutions` bez zmian.
Router tylko waliduje wejście i woła `api.admin_content`. Pole `contact` nigdy nie wychodzi.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.admin_content import save_entry, to_admin_detail
from api.cards import SolutionRow, to_card
from api.config import settings
from api.db import get_session
from api.models import KnowledgeType, Solution, SolutionKind, SolutionStatus, Taxonomy
from api.schemas import (
    KnowledgeTypeLiteral,
    Page,
    SolutionAdminCreate,
    SolutionAdminDetail,
    SolutionAdminItem,
    SolutionKindLiteral,
    SolutionStatusLiteral,
    SolutionUpsert,
)

router = APIRouter(prefix="/api/admin/solutions", tags=["admin-solutions"])

Session = Annotated[AsyncSession, Depends(get_session)]


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("", response_model=Page[SolutionAdminItem])
async def list_admin_solutions(
    session: Session,
    kind: SolutionKindLiteral | None = None,
    knowledge_type: KnowledgeTypeLiteral | None = None,
    status: SolutionStatusLiteral | None = None,
    q: Annotated[str | None, Query(max_length=200)] = None,
    limit: Annotated[int, Query(ge=1, le=settings.ADMIN_LIST_MAX_LIMIT)] = (
        settings.ADMIN_LIST_DEFAULT_LIMIT
    ),
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[SolutionAdminItem]:
    conds = []
    if kind:
        conds.append(Solution.kind == SolutionKind(kind))
    if knowledge_type:
        conds.append(Solution.knowledge_type == KnowledgeType(knowledge_type))
    if status:
        conds.append(Solution.status == SolutionStatus(status))
    q = (q or "").strip() or None
    if q:
        conds.append(Solution.title.ilike("%" + _escape_like(q) + "%", escape="\\"))

    total = await session.scalar(select(func.count()).select_from(Solution).where(*conds))
    stmt = (
        select(Solution, Taxonomy.label_pl)
        .outerjoin(Taxonomy, Taxonomy.code == Solution.category)
        .where(*conds)
        .order_by(Solution.updated_at.desc(), Solution.id.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = (await session.execute(stmt)).all()
    items = [
        SolutionAdminItem(
            **to_card(
                SolutionRow(solution=sol, category_label_pl=label), rank=offset + i + 1
            ).model_dump(),
            status=sol.status.value,
            updated_at=sol.updated_at,
        )
        for i, (sol, label) in enumerate(rows)
    ]
    return Page[SolutionAdminItem](items=items, total=total or 0, limit=limit, offset=offset)


@router.get("/{solution_id}", response_model=SolutionAdminDetail)
async def get_admin_solution(solution_id: int, session: Session) -> SolutionAdminDetail:
    return await to_admin_detail(session, solution_id)


@router.post("", response_model=SolutionAdminDetail, status_code=201)
async def create_admin_solution(
    payload: SolutionAdminCreate, session: Session
) -> SolutionAdminDetail:
    solution_id, reembedded = await save_entry(session, payload, solution_id=None)
    return await to_admin_detail(session, solution_id, reembedded=reembedded)


@router.put("/{solution_id}", response_model=SolutionAdminDetail)
async def update_admin_solution(
    solution_id: int, payload: SolutionUpsert, session: Session
) -> SolutionAdminDetail:
    saved_id, reembedded = await save_entry(session, payload, solution_id=solution_id)
    return await to_admin_detail(session, saved_id, reembedded=reembedded)
