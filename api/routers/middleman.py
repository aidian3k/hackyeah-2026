"""Moduł 7 — `POST /api/solutions/{id}/adapt-chat`. Zaślepka MI00 — pełna logika w MI02."""

from __future__ import annotations

import json
from collections.abc import AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from api.middleman.schemas import AdaptChatRequest, AdaptDoneEvent
from api.schemas import TokenEvent

router = APIRouter(prefix="/api", tags=["middleman"])

SSE_HEADERS = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}


def _frame(event: str, payload: BaseModel) -> bytes:
    data = json.dumps(payload.model_dump(mode="json"), ensure_ascii=False)
    return f"event: {event}\ndata: {data}\n\n".encode()


@router.post("/solutions/{solution_id}/adapt-chat")
async def adapt_chat(solution_id: int, body: AdaptChatRequest) -> StreamingResponse:
    """Zaślepka MI00 — pełna logika w MI02."""

    async def _events() -> AsyncIterator[bytes]:
        for text in ("To jest ", "odpowiedź ", "testowa."):
            yield _frame("token", TokenEvent(text=text))
        yield _frame("done", AdaptDoneEvent(latency_ms={"total": 0}))

    return StreamingResponse(_events(), media_type="text/event-stream", headers=SSE_HEADERS)
