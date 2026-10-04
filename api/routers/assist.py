"""Moduł 3 — Asystent AI (`POST /api/ideas/{id}/assist`) i podobne innowacje (`GET …/similar`)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import settings
from api.db import get_session
from api.errors import ApiError
from api.kreator.assistant import assist_block, assist_idea
from api.kreator.canvas import block_map
from api.kreator.schemas import AssistRequest, AssistResponse, SimilarResponse
from api.kreator.similar import find_similar
from api.routers.ideas import get_idea_or_404

router = APIRouter(prefix="/api", tags=["kreator"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]


@router.get("/ideas/{idea_id}/similar", response_model=SimilarResponse)
async def similar_innovations(idea_id: int, session: SessionDep) -> SimilarResponse:
    idea = await get_idea_or_404(session, idea_id)
    return await find_similar(idea, limit=settings.IDEA_SIMILAR_LIMIT)


@router.post("/ideas/{idea_id}/assist", response_model=AssistResponse)
async def assist(idea_id: int, payload: AssistRequest, session: SessionDep) -> AssistResponse:
    idea = await get_idea_or_404(session, idea_id)
    if payload.target == "idea":
        return await assist_idea(session, idea)

    if not payload.block_id:
        raise ApiError(422, "VALIDATION_ERROR", "block_id: wymagany dla target=canvas_block.")
    block = block_map().get(payload.block_id)
    if block is None:
        raise ApiError(
            422, "VALIDATION_ERROR", f"block_id: nieznany blok kanwy {payload.block_id!r}."
        )
    return await assist_block(session, idea, block)
