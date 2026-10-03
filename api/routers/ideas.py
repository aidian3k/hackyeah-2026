"""Moduł 3 — Pomysły: CRUD, wysłanie, status, odpowiedzi Hubu do autora (K03).

Endpointy otwarte (bez autoryzacji, pomysł po samym `id`). `contact_email` nigdy nie wychodzi
z API ani do logów: zapytania wybierają jawną listę kolumn (`_LIST_COLUMNS`), a do odpowiedzi
trafia tylko `has_contact`. Logi: identyfikatory, statusy, długości.
"""

from __future__ import annotations

import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, literal_column, select, update
from sqlalchemy.dialects.postgresql import aggregate_order_by
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import get_session
from api.errors import ApiError
from api.kreator.models import GrantApplication, Idea, IdeaCanvas, IdeaStage, IdeaStatus
from api.kreator.models import IdeaReply as IdeaReplyRow
from api.kreator.schemas import (
    IdeaApplicationRef,
    IdeaCreate,
    IdeaDetail,
    IdeaListItem,
    IdeaReply,
    IdeaStatusChange,
    IdeaStatusLiteral,
    IdeaUpdate,
)
from api.models import Report, Taxonomy
from api.pipeline.preprocess import GMINY
from api.schemas import Page, ReplyCreate

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["kreator"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]

# Blok kanwy zsynchronizowany z `ideas.stage` (ADR-M3-004).
_STAGE_BLOCK = "solution_readiness"

# Pola wymagane do wysłania pomysłu — etykiety do komunikatu IDEA_INCOMPLETE.
_REQUIRED_FOR_SUBMIT = (("essence", "istota pomysłu"), ("audience", "dla kogo jest pomysł"))

_REPLY_COUNT = (
    select(func.count(IdeaReplyRow.id))
    .where(IdeaReplyRow.idea_id == Idea.id)
    .correlate(Idea)
    .scalar_subquery()
    .label("reply_count")
)

_APPLICATIONS = (
    select(
        func.coalesce(
            func.jsonb_agg(
                aggregate_order_by(
                    func.jsonb_build_object(
                        literal_column("'id'"),
                        GrantApplication.id,
                        literal_column("'call_id'"),
                        GrantApplication.call_id,
                        literal_column("'updated_at'"),
                        GrantApplication.updated_at,
                    ),
                    GrantApplication.id,
                )
            ),
            literal_column("'[]'::jsonb"),
        )
    )
    .where(GrantApplication.idea_id == Idea.id)
    .correlate(Idea)
    .scalar_subquery()
    .label("applications")
)

# Jawna lista kolumn — bez `contact_email` (tylko `has_contact`).
_LIST_COLUMNS = (
    Idea.id,
    Idea.title,
    Idea.summary,
    Idea.stage,
    Idea.status,
    Idea.category,
    Taxonomy.label_pl.label("category_label_pl"),
    Idea.gmina,
    Idea.powiat,
    Idea.author_name,
    func.coalesce(func.length(func.btrim(Idea.contact_email)) > 0, False).label("has_contact"),
    Idea.source_report_id,
    IdeaCanvas.data.label("canvas_data"),
    _REPLY_COUNT,
    Idea.created_at,
    Idea.updated_at,
    Idea.submitted_at,
)
_DETAIL_COLUMNS = (*_LIST_COLUMNS, Idea.essence, Idea.audience, _APPLICATIONS)


def _base_select(*columns: Any):
    return (
        select(*columns)
        .select_from(Idea)
        .outerjoin(Taxonomy, Taxonomy.code == Idea.category)
        .outerjoin(IdeaCanvas, IdeaCanvas.idea_id == Idea.id)
    )


def _canvas_percent(data: dict[str, Any] | None) -> int:
    """Postęp kanwy z `api.kreator.canvas.progress` (K02); bez K02 albo pustej kanwy → 0."""
    if not data:
        return 0
    try:
        from api.kreator.canvas import progress  # import leniwy — moduł K02
    except ImportError:
        return 0
    return progress(data).percent


def _list_item(row: Any) -> IdeaListItem:
    return IdeaListItem(
        id=row.id,
        title=row.title,
        summary=row.summary,
        stage=row.stage.value,
        status=row.status.value,
        category=row.category,
        category_label_pl=row.category_label_pl,
        gmina=row.gmina,
        powiat=row.powiat,
        author_name=row.author_name,
        has_contact=bool(row.has_contact),
        source_report_id=row.source_report_id,
        canvas_percent=_canvas_percent(row.canvas_data),
        reply_count=row.reply_count or 0,
        created_at=row.created_at,
        updated_at=row.updated_at,
        submitted_at=row.submitted_at,
    )


def _reply(r: IdeaReplyRow) -> IdeaReply:
    return IdeaReply(
        id=r.id,
        idea_id=r.idea_id,
        author_label=r.author_label,
        body=r.body,
        created_at=r.created_at,
    )


def _not_found(idea_id: int) -> ApiError:
    return ApiError(404, "NOT_FOUND", f"Nie znaleziono pomysłu o id {idea_id}.")


async def get_idea_or_404(session: AsyncSession, idea_id: int) -> Idea:
    idea = await session.get(Idea, idea_id)
    if idea is None:
        raise _not_found(idea_id)
    return idea


async def idea_detail(session: AsyncSession, idea_id: int) -> IdeaDetail:
    """Pełna odpowiedź `IdeaDetail` jednym zapytaniem (kategoria, kanwa, odpowiedzi, wnioski)."""
    row = (
        await session.execute(_base_select(*_DETAIL_COLUMNS).where(Idea.id == idea_id))
    ).one_or_none()
    if row is None:
        raise _not_found(idea_id)
    return IdeaDetail(
        **_list_item(row).model_dump(),
        essence=row.essence,
        audience=row.audience,
        applications=[IdeaApplicationRef(**a) for a in (row.applications or [])],
    )


async def _resolve_gmina(gmina: str | None) -> tuple[str | None, str | None]:
    gmina = (gmina or "").strip() or None
    if gmina is None:
        return None, None
    if gmina not in GMINY:
        raise ApiError(422, "VALIDATION_ERROR", f"gmina: nieznana gmina {gmina!r}.")
    return gmina, GMINY[gmina]


async def _resolve_category(session: AsyncSession, category: str | None) -> str | None:
    category = (category or "").strip() or None
    if category is None:
        return None
    exists = await session.scalar(select(Taxonomy.code).where(Taxonomy.code == category))
    if exists is None:
        raise ApiError(422, "VALIDATION_ERROR", f"category: nieznana kategoria {category!r}.")
    return category


async def _sync_stage_block(session: AsyncSession, idea_id: int, stage: str) -> None:
    """Upsert bloku `solution_readiness` w `idea_canvases` (ADR-M3-004), bez commitu."""
    stmt = pg_insert(IdeaCanvas).values(idea_id=idea_id, data={_STAGE_BLOCK: stage})
    stmt = stmt.on_conflict_do_update(
        index_elements=[IdeaCanvas.idea_id],
        set_={
            "data": IdeaCanvas.data.op("||")(stmt.excluded.data),
            "updated_at": func.now(),
        },
    )
    await session.execute(stmt)


@router.post("/ideas", response_model=IdeaDetail, status_code=201)
async def create_idea(payload: IdeaCreate, session: SessionDep) -> IdeaDetail:
    gmina, powiat = await _resolve_gmina(payload.gmina)
    category = await _resolve_category(session, payload.category)
    if payload.source_report_id is not None:
        found = await session.scalar(select(Report.id).where(Report.id == payload.source_report_id))
        if found is None:
            raise ApiError(
                422,
                "VALIDATION_ERROR",
                f"source_report_id: nie znaleziono zgłoszenia o id {payload.source_report_id}.",
            )

    idea = Idea(
        title=payload.title.strip(),
        summary=payload.summary.strip(),
        essence=payload.essence.strip(),
        audience=payload.audience.strip(),
        stage=IdeaStage(payload.stage),
        category=category,
        gmina=gmina,
        powiat=powiat,
        author_name=(payload.author_name or "").strip() or None,
        contact_email=(payload.contact_email or "").strip() or None,
        source_report_id=payload.source_report_id,
        status=IdeaStatus.DRAFT,
    )
    session.add(idea)
    await session.flush()
    idea_id = idea.id
    if idea.stage != IdeaStage.IDEA:
        await _sync_stage_block(session, idea_id, idea.stage.value)
    await session.commit()
    log.info(
        "idea created idea_id=%s stage=%s source_report_id=%s summary_len=%s",
        idea_id,
        payload.stage,
        payload.source_report_id,
        len(payload.summary),
    )
    return await idea_detail(session, idea_id)


@router.get("/ideas", response_model=Page[IdeaListItem])
async def list_ideas(
    session: SessionDep,
    status: IdeaStatusLiteral | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[IdeaListItem]:
    if status is None:
        conditions = [Idea.status != IdeaStatus.DRAFT]
    else:
        conditions = [Idea.status == IdeaStatus(status)]

    total = await session.scalar(select(func.count(Idea.id)).where(*conditions)) or 0
    rows = await session.execute(
        _base_select(*_LIST_COLUMNS)
        .where(*conditions)
        .order_by(Idea.submitted_at.desc().nulls_last(), Idea.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return Page[IdeaListItem](
        items=[_list_item(r) for r in rows], total=total, limit=limit, offset=offset
    )


@router.get("/ideas/{idea_id}", response_model=IdeaDetail)
async def get_idea(idea_id: int, session: SessionDep) -> IdeaDetail:
    return await idea_detail(session, idea_id)


@router.patch("/ideas/{idea_id}", response_model=IdeaDetail)
async def patch_idea(idea_id: int, patch: IdeaUpdate, session: SessionDep) -> IdeaDetail:
    idea = await get_idea_or_404(session, idea_id)
    changes = patch.model_dump(exclude_unset=True)

    for field in ("title", "summary"):
        if field in changes:
            if changes[field] is None:
                raise ApiError(422, "VALIDATION_ERROR", f"{field}: pole nie może być puste.")
            setattr(idea, field, changes[field].strip())
    for field in ("essence", "audience"):
        if field in changes:
            setattr(idea, field, (changes[field] or "").strip())
    for field in ("author_name", "contact_email"):
        if field in changes:
            setattr(idea, field, (changes[field] or "").strip() or None)
    if "gmina" in changes:
        idea.gmina, idea.powiat = await _resolve_gmina(changes["gmina"])
    if "category" in changes:
        idea.category = await _resolve_category(session, changes["category"])

    stage_changed = False
    if changes.get("stage") is not None:
        new_stage = IdeaStage(changes["stage"])
        stage_changed = new_stage != idea.stage
        idea.stage = new_stage
        # Blok kanwy ustawiamy zawsze, gdy klient podał etap — kanwa i fiszka zgodne.
        await _sync_stage_block(session, idea_id, new_stage.value)

    idea.updated_at = func.now()
    await session.commit()
    log.info(
        "idea updated idea_id=%s fields=%s stage_changed=%s",
        idea_id,
        sorted(changes),
        stage_changed,
    )
    return await idea_detail(session, idea_id)


@router.post("/ideas/{idea_id}/submit", response_model=IdeaDetail)
async def submit_idea(idea_id: int, session: SessionDep) -> IdeaDetail:
    idea = await get_idea_or_404(session, idea_id)
    missing = [label for field, label in _REQUIRED_FOR_SUBMIT if not getattr(idea, field).strip()]
    if missing:
        raise ApiError(422, "IDEA_INCOMPLETE", f"Uzupełnij: {', '.join(missing)}.")
    if idea.status == IdeaStatus.DRAFT:
        idea.status = IdeaStatus.SUBMITTED
        idea.submitted_at = func.now()
        idea.updated_at = func.now()
        await session.commit()
        log.info("idea submitted idea_id=%s", idea_id)
    return await idea_detail(session, idea_id)


@router.post("/ideas/{idea_id}/status", response_model=IdeaDetail)
async def change_status(idea_id: int, payload: IdeaStatusChange, session: SessionDep) -> IdeaDetail:
    current = await session.scalar(select(Idea.status).where(Idea.id == idea_id).with_for_update())
    if current is None:
        raise _not_found(idea_id)
    target = IdeaStatus(payload.status)
    if target != current:
        values: dict[str, Any] = {"status": target, "updated_at": func.now()}
        if current == IdeaStatus.DRAFT:
            # Hub przyjmuje szkic bezpośrednio — uzupełnij datę wysłania (sortowanie listy).
            values["submitted_at"] = func.coalesce(Idea.submitted_at, func.now())
        await session.execute(update(Idea).where(Idea.id == idea_id).values(**values))
        await session.commit()
        log.info(
            "idea status changed idea_id=%s from=%s to=%s", idea_id, current.value, target.value
        )
    return await idea_detail(session, idea_id)


@router.post("/ideas/{idea_id}/replies", response_model=IdeaReply, status_code=201)
async def create_reply(idea_id: int, payload: ReplyCreate, session: SessionDep) -> IdeaReply:
    current = await session.scalar(select(Idea.status).where(Idea.id == idea_id).with_for_update())
    if current is None:
        raise _not_found(idea_id)
    reply = IdeaReplyRow(idea_id=idea_id, author_label=payload.author_label, body=payload.body)
    session.add(reply)
    values: dict[str, Any] = {"updated_at": func.now()}
    if current == IdeaStatus.SUBMITTED:
        values["status"] = IdeaStatus.IN_REVIEW
    await session.execute(update(Idea).where(Idea.id == idea_id).values(**values))
    await session.flush()
    await session.refresh(reply)
    result = _reply(reply)
    await session.commit()
    log.info(
        "idea reply created idea_id=%s reply_id=%s body_len=%s to_in_review=%s",
        idea_id,
        result.id,
        len(payload.body),
        current == IdeaStatus.SUBMITTED,
    )
    return result


@router.get("/ideas/{idea_id}/replies", response_model=list[IdeaReply])
async def list_replies(idea_id: int, session: SessionDep) -> list[IdeaReply]:
    found = await session.scalar(select(Idea.id).where(Idea.id == idea_id))
    if found is None:
        raise _not_found(idea_id)
    rows = await session.scalars(
        select(IdeaReplyRow)
        .where(IdeaReplyRow.idea_id == idea_id)
        .order_by(IdeaReplyRow.created_at.asc(), IdeaReplyRow.id.asc())
    )
    return [_reply(r) for r in rows]
