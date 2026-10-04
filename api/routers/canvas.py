"""Moduł 3 — Social Canvas: definicja, stan i zapis kanwy (K02).

Zapis `solution_readiness` ustawia `ideas.stage` (ADR-M3-004); usunięcie bloku wraca do `IDEA`.
Logi: tylko `idea_id`, `block_id` i postęp — nigdy treść kanwy.
"""

from __future__ import annotations

import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import get_session
from api.errors import ApiError
from api.kreator.canvas import load_definition, merge_blocks, progress
from api.kreator.models import Idea, IdeaCanvas, IdeaStage
from api.kreator.schemas import CanvasDefinition, CanvasPatch, CanvasState

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["kreator"])

Session = Annotated[AsyncSession, Depends(get_session)]

READINESS_BLOCK = "solution_readiness"


async def _ensure_idea(session: AsyncSession, idea_id: int) -> None:
    if await session.scalar(select(Idea.id).where(Idea.id == idea_id)) is None:
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono pomysłu.")


async def _state(session: AsyncSession, idea_id: int) -> CanvasState:
    row = (
        await session.execute(
            select(IdeaCanvas.data, IdeaCanvas.updated_at).where(IdeaCanvas.idea_id == idea_id)
        )
    ).first()
    data: dict[str, Any] = dict(row.data) if row and row.data else {}
    return CanvasState(
        idea_id=idea_id,
        blocks=data,
        progress=progress(data),
        updated_at=row.updated_at if row else None,
    )


@router.get("/canvas/definition", response_model=CanvasDefinition)
async def get_definition() -> CanvasDefinition:
    return load_definition()


@router.get("/ideas/{idea_id}/canvas", response_model=CanvasState)
async def get_canvas(idea_id: int, session: Session) -> CanvasState:
    await _ensure_idea(session, idea_id)
    return await _state(session, idea_id)


@router.patch("/ideas/{idea_id}/canvas", response_model=CanvasState)
async def patch_canvas(idea_id: int, body: CanvasPatch, session: Session) -> CanvasState:
    # Blokada wiersza pomysłu serializuje równoległe autozapisy tej samej kanwy.
    locked = await session.scalar(select(Idea.id).where(Idea.id == idea_id).with_for_update())
    if locked is None:
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono pomysłu.")

    current = await session.scalar(select(IdeaCanvas.data).where(IdeaCanvas.idea_id == idea_id))
    try:
        merged = merge_blocks(dict(current or {}), body.blocks)
    except ValueError as exc:
        raise ApiError(422, "VALIDATION_ERROR", str(exc)) from exc

    if body.blocks:
        await session.execute(
            insert(IdeaCanvas)
            .values(idea_id=idea_id, data=merged)
            .on_conflict_do_update(
                index_elements=[IdeaCanvas.idea_id],
                set_={"data": merged, "updated_at": func.now()},
            )
        )
        idea_values: dict[str, Any] = {"updated_at": func.now()}
        if READINESS_BLOCK in body.blocks:
            idea_values["stage"] = IdeaStage(merged.get(READINESS_BLOCK, IdeaStage.IDEA))
        await session.execute(update(Idea).where(Idea.id == idea_id).values(**idea_values))
    await session.commit()

    state = await _state(session, idea_id)
    log.info(
        "canvas patched idea_id=%s blocks=%s percent=%s",
        idea_id,
        sorted(body.blocks),
        state.progress.percent,
    )
    return state
