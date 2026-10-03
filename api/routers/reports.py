"""Zgłoszenia i odpowiedzi do autora — kontrakt Panelu administratora (T20).

Endpointy otwarte (bez autoryzacji). `contact_email` nigdy nie wychodzi z API: zapytania
wybierają jawnie listę kolumn (`_REPORT_COLUMNS`), a modele odpowiedzi nie mają tego pola.
"""

from __future__ import annotations

import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import get_session
from api.errors import ApiError
from api.models import Report, ReporterType, ReportReply, ReportStatus, Taxonomy
from api.pipeline.reports import find_similar_reports
from api.schemas import (
    Page,
    Reply,
    ReplyCreate,
    ReportDetail,
    ReporterTypeLiteral,
    ReportListItem,
    ReportPatch,
    ReportStatusLiteral,
    SimilarReport,
)

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["reports"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]

# Dozwolone przejścia statusu (PATCH). Ten sam status = 200 bez zmian.
_TRANSITIONS: dict[ReportStatus, frozenset[ReportStatus]] = {
    ReportStatus.NEW: frozenset({ReportStatus.TRIAGED}),
    ReportStatus.TRIAGED: frozenset({ReportStatus.MATCHED, ReportStatus.IN_PROGRESS}),
    ReportStatus.MATCHED: frozenset({ReportStatus.IN_PROGRESS, ReportStatus.CLOSED}),
    ReportStatus.IN_PROGRESS: frozenset({ReportStatus.CLOSED}),
    ReportStatus.CLOSED: frozenset(),
}

# Odpowiedź do autora przenosi zgłoszenie z tych statusów na IN_PROGRESS.
_REPLY_MOVES_TO_IN_PROGRESS = frozenset(
    {ReportStatus.NEW, ReportStatus.TRIAGED, ReportStatus.MATCHED}
)

_REPLY_COUNT = (
    select(func.count(ReportReply.id))
    .where(ReportReply.report_id == Report.id)
    .correlate(Report)
    .scalar_subquery()
    .label("reply_count")
)

# Jawna lista kolumn — bez `contact_email` i `embedding`.
_LIST_COLUMNS = (
    Report.id,
    Report.raw_text,
    Report.category,
    Taxonomy.label_pl.label("category_label_pl"),
    Report.gmina,
    Report.powiat,
    Report.reporter_type,
    Report.severity_self,
    Report.matched,
    Report.status,
    Report.top_solution_id,
    Report.top_rerank_score,
    Report.session_id,
    Report.created_at,
    _REPLY_COUNT,
)
_DETAIL_COLUMNS = (*_LIST_COLUMNS, Report.normalized_text, Report.target_group, Report.extracted)


def _base_select(*columns: Any):
    return (
        select(*columns).select_from(Report).outerjoin(Taxonomy, Taxonomy.code == Report.category)
    )


def _list_item(row: Any) -> ReportListItem:
    return ReportListItem(
        id=row.id,
        raw_text=row.raw_text,
        category=row.category,
        category_label_pl=row.category_label_pl,
        gmina=row.gmina,
        powiat=row.powiat,
        reporter_type=row.reporter_type.value,
        severity_self=row.severity_self,
        matched=row.matched,
        status=row.status.value,
        top_solution_id=row.top_solution_id,
        top_rerank_score=row.top_rerank_score,
        session_id=row.session_id,
        created_at=row.created_at,
        reply_count=row.reply_count or 0,
    )


def _detail(row: Any) -> ReportDetail:
    return ReportDetail(
        **_list_item(row).model_dump(),
        normalized_text=row.normalized_text,
        target_group=row.target_group,
        extracted=row.extracted or {},
    )


def _reply(r: ReportReply) -> Reply:
    return Reply(
        id=r.id,
        report_id=r.report_id,
        author_label=r.author_label,
        body=r.body,
        created_at=r.created_at,
    )


def _not_found(report_id: int) -> ApiError:
    return ApiError(404, "NOT_FOUND", f"Nie znaleziono zgłoszenia o id {report_id}.")


async def _load_detail(session: AsyncSession, report_id: int) -> ReportDetail:
    row = (
        await session.execute(_base_select(*_DETAIL_COLUMNS).where(Report.id == report_id))
    ).one_or_none()
    if row is None:
        raise _not_found(report_id)
    return _detail(row)


async def _ensure_exists(session: AsyncSession, report_id: int) -> None:
    found = await session.scalar(select(Report.id).where(Report.id == report_id))
    if found is None:
        raise _not_found(report_id)


@router.get("/reports", response_model=Page[ReportListItem])
async def list_reports(
    session: SessionDep,
    matched: bool | None = None,
    status: ReportStatusLiteral | None = None,
    category: str | None = None,
    gmina: str | None = None,
    reporter_type: ReporterTypeLiteral | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> Page[ReportListItem]:
    conditions = []
    if matched is not None:
        conditions.append(Report.matched.is_(matched))
    if status is not None:
        conditions.append(Report.status == ReportStatus(status))
    if category is not None:
        conditions.append(Report.category == category)
    if gmina is not None:
        conditions.append(Report.gmina == gmina)
    if reporter_type is not None:
        conditions.append(Report.reporter_type == ReporterType(reporter_type))

    total = await session.scalar(select(func.count(Report.id)).where(*conditions)) or 0
    rows = await session.execute(
        _base_select(*_LIST_COLUMNS)
        .where(*conditions)
        .order_by(Report.created_at.desc(), Report.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return Page[ReportListItem](
        items=[_list_item(r) for r in rows], total=total, limit=limit, offset=offset
    )


@router.get("/reports/{report_id}", response_model=ReportDetail)
async def get_report(report_id: int, session: SessionDep) -> ReportDetail:
    return await _load_detail(session, report_id)


@router.get("/reports/{report_id}/similar", response_model=list[SimilarReport])
async def similar_reports(report_id: int, session: SessionDep) -> list[SimilarReport]:
    await _ensure_exists(session, report_id)
    rows = await find_similar_reports(session, report_id)
    return [SimilarReport(**r) for r in rows]


@router.patch("/reports/{report_id}", response_model=ReportDetail)
async def patch_report(report_id: int, patch: ReportPatch, session: SessionDep) -> ReportDetail:
    current = await session.scalar(
        select(Report.status).where(Report.id == report_id).with_for_update()
    )
    if current is None:
        raise _not_found(report_id)
    target = ReportStatus(patch.status)
    if target != current:
        if target not in _TRANSITIONS[current]:
            await session.rollback()
            raise ApiError(
                409,
                "INVALID_TRANSITION",
                f"Niedozwolona zmiana statusu zgłoszenia: {current.value} → {target.value}.",
            )
        await session.execute(update(Report).where(Report.id == report_id).values(status=target))
        await session.commit()
        log.info(
            "report status changed",
            extra={"report_id": report_id, "from": current.value, "to": target.value},
        )
    return await _load_detail(session, report_id)


@router.post("/reports/{report_id}/replies", response_model=Reply, status_code=201)
async def create_reply(report_id: int, payload: ReplyCreate, session: SessionDep) -> Reply:
    current = await session.scalar(
        select(Report.status).where(Report.id == report_id).with_for_update()
    )
    if current is None:
        raise _not_found(report_id)
    reply = ReportReply(report_id=report_id, author_label=payload.author_label, body=payload.body)
    session.add(reply)
    if current in _REPLY_MOVES_TO_IN_PROGRESS:
        await session.execute(
            update(Report).where(Report.id == report_id).values(status=ReportStatus.IN_PROGRESS)
        )
    await session.flush()
    await session.refresh(reply)
    result = _reply(reply)
    await session.commit()
    log.info(
        "report reply created",
        extra={"report_id": report_id, "reply_id": result.id, "body_len": len(payload.body)},
    )
    return result


@router.get("/reports/{report_id}/replies", response_model=list[Reply])
async def list_replies(report_id: int, session: SessionDep) -> list[Reply]:
    await _ensure_exists(session, report_id)
    rows = await session.scalars(
        select(ReportReply)
        .where(ReportReply.report_id == report_id)
        .order_by(ReportReply.created_at.asc(), ReportReply.id.asc())
    )
    return [_reply(r) for r in rows]
