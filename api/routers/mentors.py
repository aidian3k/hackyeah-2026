"""Moduł 5 — katalog ekspertów (mentorów). Dane fikcyjne z seeda (`data/mentors.json`)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.comm.models import Mentor as MentorRow
from api.comm.schemas import Mentor
from api.db import get_session

router = APIRouter(prefix="/api", tags=["mentors"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]


@router.get("/mentors", response_model=list[Mentor])
async def list_mentors(session: SessionDep, category: str | None = None) -> list[Mentor]:
    """Wszyscy eksperci; z `category` — najpierw ci z tą kategorią, potem reszta (remis po id)."""
    stmt = select(MentorRow)
    if category:
        stmt = stmt.order_by(MentorRow.categories.any(category).desc(), MentorRow.id)
    else:
        stmt = stmt.order_by(MentorRow.id)
    rows = await session.scalars(stmt)
    return [
        Mentor(
            id=m.id,
            display_name=m.display_name,
            organization=m.organization,
            expertise=m.expertise,
            categories=list(m.categories or []),
        )
        for m in rows
    ]
