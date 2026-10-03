"""Moduł 5 — rozmowy z Hubem (wątki). Endpointy otwarte (bez autoryzacji, jak cały PoC)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from api.comm import threads as svc
from api.comm.models import MessageRole
from api.comm.schemas import (
    MessageCreate,
    ThreadCreate,
    ThreadDetail,
    ThreadKindLiteral,
    ThreadListItem,
    ThreadMessageOut,
    ThreadPatch,
    ThreadStatusLiteral,
)
from api.db import get_session
from api.schemas import Page

router = APIRouter(prefix="/api", tags=["threads"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]


@router.post("/threads", response_model=ThreadDetail, status_code=201)
async def create_thread(payload: ThreadCreate, session: SessionDep) -> ThreadDetail:
    thread_id = await svc.create_thread(session, payload)
    return await svc.load_thread(session, thread_id)


@router.get("/threads", response_model=Page[ThreadListItem])
async def list_threads(
    session: SessionDep,
    status: ThreadStatusLiteral | None = None,
    kind: ThreadKindLiteral | None = None,
    mentor_id: int | None = None,
    ids: Annotated[str | None, Query(max_length=1000)] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> Page[ThreadListItem]:
    return await svc.list_threads(
        session,
        status=status,
        kind=kind,
        mentor_id=mentor_id,
        ids=svc.parse_ids(ids),
        limit=limit,
        offset=offset,
    )


@router.get("/threads/{thread_id}", response_model=ThreadDetail)
async def get_thread(thread_id: int, session: SessionDep) -> ThreadDetail:
    return await svc.load_thread(session, thread_id)


@router.post("/threads/{thread_id}/messages", response_model=ThreadMessageOut, status_code=201)
async def add_message(
    thread_id: int, payload: MessageCreate, session: SessionDep
) -> ThreadMessageOut:
    return await svc.add_message(
        session,
        thread_id,
        role=MessageRole(payload.role),
        body=payload.body,
        author_label=payload.author_label,
        mentor_id=payload.mentor_id,
    )


@router.patch("/threads/{thread_id}", response_model=ThreadDetail)
async def patch_thread(thread_id: int, payload: ThreadPatch, session: SessionDep) -> ThreadDetail:
    await svc.patch_thread(session, thread_id, payload)
    return await svc.load_thread(session, thread_id)


@router.post("/threads/{thread_id}/read", status_code=204)
async def mark_read(thread_id: int, session: SessionDep) -> Response:
    await svc.mark_read(session, thread_id)
    return Response(status_code=204)
