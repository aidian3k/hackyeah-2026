"""Asystent pierwszego kontaktu (Moduł 5) — STUB z PK02; właściwą logikę dodaje PK03."""

from __future__ import annotations

from api.comm.models import MessageRole, ThreadStatus
from api.comm.threads import add_message, set_status
from api.db import SessionLocal

HANDOVER_PL = "Pytanie trafiło do zespołu Hubu — odpowiemy w tym wątku."


async def run_assistant(thread_id: int) -> None:
    async with SessionLocal() as session:
        await add_message(session, thread_id, role=MessageRole.SYSTEM, body=HANDOVER_PL)
        await set_status(
            session, thread_id, ThreadStatus.WAITING_STAFF, only_from=ThreadStatus.AI_PENDING
        )
