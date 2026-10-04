"""Moduł 7 — `POST /api/solutions/{id}/adapt-chat`: asystent wdrożenia innowacji (SSE).

Kolejność zdarzeń: `token* → done` albo `token* → error → done`; `done` zawsze na końcu
(nazwy zdarzeń jak w M1, ADR-M7-005). Backend bezstanowy — historia przychodzi w całości
w żądaniu i nie jest zapisywana (ADR-M7-002). Odpowiedź z providera LLM M1 bez zmian:
`get_llm_provider().stream(SYSTEM, user)`, historia w znaczniku `<rozmowa>` (ADR-M7-004).
Walidacja (404/422) przed otwarciem strumienia. W logach bez treści rozmowy i nazwy gminy.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from collections.abc import AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from api.config import settings
from api.db import SessionLocal
from api.errors import ApiError
from api.middleman.context import SolutionContext, gmina_type, load_solution_context
from api.middleman.prompts import SYSTEM, build_user_prompt
from api.middleman.schemas import AdaptChatRequest, AdaptDoneEvent
from api.providers import ProviderError, get_llm_provider
from api.schemas import ErrorEvent, TokenEvent

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["middleman"])

SSE_HEADERS = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}

MESSAGES_PL = {
    "ASSISTANT_UNAVAILABLE": (
        "Asystent jest teraz niedostępny. Opis innowacji znajdziesz na jej stronie, "
        "a z pytaniami możesz zwrócić się do zespołu Hubu."
    ),
    "LLM_UNAVAILABLE": "Asystent nie mógł teraz odpowiedzieć. Spróbuj ponownie za chwilę.",
    "LLM_TIMEOUT": "Odpowiedź trwała zbyt długo. Spróbuj ponownie.",
    "INTERNAL": "Wystąpił nieoczekiwany błąd. Spróbuj ponownie za chwilę.",
}


def _frame(event: str, payload: BaseModel) -> bytes:
    data = json.dumps(payload.model_dump(mode="json"), ensure_ascii=False)
    return f"event: {event}\ndata: {data}\n\n".encode()


def _error(code: str) -> bytes:
    return _frame("error", ErrorEvent(code=code, message_pl=MESSAGES_PL[code]))


def _ms(t0: float) -> int:
    return int(round((time.perf_counter() - t0) * 1000))


def _invalid(message: str) -> ApiError:
    return ApiError(422, "VALIDATION_ERROR", message)


def _validate(body: AdaptChatRequest) -> None:
    messages = body.messages
    if not messages:
        raise _invalid("messages: podaj co najmniej jedną wiadomość.")
    if len(messages) > settings.M7_MAX_MESSAGES:
        raise _invalid("messages: rozmowa jest za długa — zacznij nową.")
    if messages[-1].role != "user":
        raise _invalid("messages: ostatnia wiadomość musi być od użytkownika.")
    for m in messages:
        content = m.content.strip()
        if not content:
            raise _invalid("messages: wiadomość nie może być pusta.")
        if len(content) > settings.M7_MESSAGE_MAX_CHARS:
            raise _invalid(
                f"messages: wiadomość może mieć najwyżej {settings.M7_MESSAGE_MAX_CHARS} znaków."
            )
    gmina = body.context.gmina
    if gmina is not None and gmina_type(gmina) is None:
        raise _invalid(f"context.gmina: nieznana gmina {gmina!r}.")


def _assistant_available() -> bool:
    return bool(settings.M7_ASSISTANT_ENABLED and settings.LLM_ENABLED and settings.llm_api_key)


async def _events(solution: SolutionContext, body: AdaptChatRequest) -> AsyncIterator[bytes]:
    t0 = time.perf_counter()
    first_token_ms: int | None = None
    outcome = "ok"
    try:
        if not _assistant_available():
            outcome = "ASSISTANT_UNAVAILABLE"
            yield _error(outcome)
        else:
            user = build_user_prompt(solution, body.context, body.messages)
            try:
                async with asyncio.timeout(settings.M7_TIMEOUT_SECONDS):
                    async for chunk in get_llm_provider().stream(SYSTEM, user):
                        if not chunk:
                            continue
                        if first_token_ms is None:
                            first_token_ms = _ms(t0)
                        yield _frame("token", TokenEvent(text=chunk))
            except TimeoutError:
                outcome = "LLM_TIMEOUT"
                yield _error(outcome)
            except ProviderError:
                outcome = "LLM_UNAVAILABLE"
                yield _error(outcome)
            except Exception:  # noqa: BLE001 — `done` zawsze, także po nieoczekiwanym błędzie
                log.exception("adapt-chat stream failed solution_id=%d", solution.id)
                outcome = "INTERNAL"
                yield _error(outcome)

        latency = {"total": _ms(t0)}
        if first_token_ms is not None:
            latency["first_token"] = first_token_ms
        yield _frame("done", AdaptDoneEvent(latency_ms=latency))
    except asyncio.CancelledError:
        outcome = "cancelled"  # rozłączenie klienta — nic nie zapisujemy (ADR-M7-002)
        raise
    finally:
        log.info(
            "adapt-chat solution_id=%d messages=%d last_len=%d reporter_type_set=%s "
            "gmina_set=%s outcome=%s first_token_ms=%s total_ms=%d",
            solution.id,
            len(body.messages),
            len(body.messages[-1].content),
            body.context.reporter_type is not None,
            body.context.gmina is not None,
            outcome,
            first_token_ms,
            _ms(t0),
        )


@router.post("/solutions/{solution_id}/adapt-chat")
async def adapt_chat(solution_id: int, body: AdaptChatRequest) -> StreamingResponse:
    """Strumień SSE odpowiedzi asystenta o wdrożeniu innowacji `solution_id`."""
    async with SessionLocal() as session:  # sesja tylko na czas wczytania innowacji
        solution = await load_solution_context(session, solution_id)
    if solution is None:
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono innowacji.")
    _validate(body)
    return StreamingResponse(
        _events(solution, body), media_type="text/event-stream", headers=SSE_HEADERS
    )
