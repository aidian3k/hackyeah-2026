"""Słowniki dla frontendu (taksonomia, gminy), feedback do wyników wyszukiwania i `/healthz`."""

from __future__ import annotations

import asyncio
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Response
from fastapi.responses import JSONResponse
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import settings
from api.db import engine, get_session
from api.errors import ApiError
from api.models import SearchEvent, Solution, Taxonomy
from api.pipeline.preprocess import GMINY
from api.pipeline.text import strip_accents
from api.schemas import FeedbackCreate, GminaItem, Health, TaxonomyItem

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["meta"])
health_router = APIRouter(tags=["health"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]

DICT_CACHE_CONTROL = "public, max-age=3600"
HEALTH_DB_TIMEOUT_S = 2.0

# Wczytane raz (GMINY ładuje preprocess przy imporcie); sort po nazwie bez ogonków.
_GMINY_SORTED: list[GminaItem] = sorted(
    (GminaItem(name=name, powiat=powiat) for name, powiat in GMINY.items()),
    key=lambda g: (strip_accents(g.name).casefold(), g.name),
)


@router.get("/taxonomy", response_model=list[TaxonomyItem])
async def get_taxonomy(response: Response, session: SessionDep) -> list[TaxonomyItem]:
    rows = (
        await session.execute(select(Taxonomy).order_by(Taxonomy.sort_order, Taxonomy.code))
    ).scalars()
    response.headers["Cache-Control"] = DICT_CACHE_CONTROL
    return [
        TaxonomyItem(
            code=t.code, label_pl=t.label_pl, description=t.description, sort_order=t.sort_order
        )
        for t in rows
    ]


@router.get("/gminy", response_model=list[GminaItem])
async def get_gminy(response: Response) -> list[GminaItem]:
    response.headers["Cache-Control"] = DICT_CACHE_CONTROL
    return _GMINY_SORTED


@router.post("/feedback", status_code=204)
async def post_feedback(body: FeedbackCreate, session: SessionDep) -> Response:
    event = await session.get(SearchEvent, body.search_event_id)
    if event is None:
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono zdarzenia wyszukiwania.")
    if body.solution_id is not None:
        exists = await session.scalar(select(Solution.id).where(Solution.id == body.solution_id))
        if exists is None:
            raise ApiError(422, "VALIDATION_ERROR", "Nie ma rozwiązania o podanym `solution_id`.")
        event.clicked_solution_id = body.solution_id
    event.helpful = body.helpful
    await session.commit()
    log.info(
        "feedback saved",
        extra={"search_event_id": body.search_event_id, "helpful": body.helpful},
    )
    return Response(status_code=204)


async def _db_ok() -> bool:
    try:
        async with asyncio.timeout(HEALTH_DB_TIMEOUT_S):
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:  # noqa: BLE001 — każdy błąd bazy = "error"
        log.warning("healthz: db error: %s", type(exc).__name__)
        return False


@health_router.get("/healthz", response_model=Health)
async def healthz() -> JSONResponse:
    ok = await _db_ok()
    health = Health(
        db="ok" if ok else "error",
        embedding_provider=settings.EMBEDDING_PROVIDER,
        rerank_provider=settings.RERANK_PROVIDER if settings.RERANK_ENABLED else "noop",
        llm_enabled=settings.LLM_ENABLED,
    )
    return JSONResponse(status_code=200 if ok else 503, content=health.model_dump())
