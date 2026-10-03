"""`POST /api/chat` — strumień SSE.

Kolejność: `status* → candidates → (token* [→ answer_retracted] | no_match) → report_saved? → done`;
`error` w dowolnym miejscu, po nim zawsze `done`.

Wyszukiwanie i zapis zgłoszenia działają w zadaniu odpiętym od żądania (`api.tasks.spawn`),
więc rozłączenie klienta (anulowanie generatora) nie przerywa zapisu — także wtedy, gdy klient
rozłączy się jeszcze przed końcem wyszukiwania. Strumień czeka na zapis tylko przed
`report_saved` (maks. SAVE_WAIT_SECONDS).
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from collections.abc import AsyncIterator
from dataclasses import dataclass, field

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from api.config import settings
from api.errors import ApiError
from api.pipeline import orchestrator
from api.pipeline.answer import CitationFilter, generate
from api.pipeline.preprocess import UnknownGminaError, preprocess
from api.pipeline.reports import save_report_and_event, update_search_event
from api.pipeline.types import ProcessedQuery, RetrievalResult, SaveResult, SearchResult
from api.providers import ProviderError, get_llm_provider
from api.schemas import (
    STATUS_LABELS,
    AnswerRetractedEvent,
    CandidatesEvent,
    ChatRequest,
    DoneEvent,
    ErrorEvent,
    NoMatchEvent,
    ReportSavedEvent,
    StatusEvent,
    TokenEvent,
)
from api.tasks import spawn

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])

SEARCH_UNAVAILABLE_PL = "Wyszukiwanie jest chwilowo niedostępne. Spróbuj ponownie za chwilę."
LLM_UNAVAILABLE_PL = (
    "Podsumowanie jest chwilowo niedostępne. Poniżej znajdziesz pasujące rozwiązania."
)
INTERNAL_PL = "Wystąpił nieoczekiwany błąd. Spróbuj ponownie za chwilę."

SSE_HEADERS = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}


def _frame(event: str, payload: BaseModel) -> bytes:
    data = json.dumps(payload.model_dump(mode="json"), ensure_ascii=False)
    return f"event: {event}\ndata: {data}\n\n".encode()


def _status(stage: str) -> bytes:
    return _frame("status", StatusEvent(stage=stage, label_pl=STATUS_LABELS[stage]))


def _error(code: str, message_pl: str) -> bytes:
    return _frame("error", ErrorEvent(code=code, message_pl=message_pl))


def _ms(t0: float) -> int:
    return int(round((time.perf_counter() - t0) * 1000))


@dataclass
class _Pipeline:
    """Wyniki etapów zadania w tle, przekazywane do strumienia przez futures."""

    retrieved: asyncio.Future[tuple[RetrievalResult | None, BaseException | None]]
    finalized: asyncio.Future[tuple[SearchResult | None, BaseException | None]]
    task: asyncio.Task[SaveResult] | None = field(default=None)


def _resolve(fut: asyncio.Future, value: tuple) -> None:
    if not fut.done():
        fut.set_result(value)


async def _search_and_save(q: ProcessedQuery, req: ChatRequest, p: _Pipeline) -> SaveResult:
    """Wyszukiwanie + bezwarunkowy zapis zgłoszenia (także przy awarii providera)."""
    r: RetrievalResult | None = None
    result: SearchResult | None = None
    try:
        try:
            r = await orchestrator.retrieve(q)
        except Exception as exc:  # noqa: BLE001 — błąd przekazujemy do strumienia
            _resolve(p.retrieved, (None, exc))
            _resolve(p.finalized, (None, exc))
        else:
            _resolve(p.retrieved, (r, None))
            try:
                result = await orchestrator.finalize(r)
            except Exception as exc:  # noqa: BLE001
                _resolve(p.finalized, (None, exc))
            else:
                _resolve(p.finalized, (result, None))
    finally:
        # np. anulowanie przy shutdown — strumień nie może czekać w nieskończoność
        cancelled = RuntimeError("search cancelled")
        _resolve(p.retrieved, (None, cancelled))
        _resolve(p.finalized, (None, cancelled))
    return await save_report_and_event(
        query=q,
        query_vec=r.query_vec if r is not None else None,
        request=req,
        search=result,
    )


def _error_for(exc: BaseException) -> bytes:
    if isinstance(exc, ProviderError):
        return _error(exc.code, SEARCH_UNAVAILABLE_PL)
    log.error("chat pipeline failed", exc_info=exc)
    return _error("INTERNAL", INTERNAL_PL)


@dataclass
class _StreamState:
    flags: dict[str, bool] = field(default_factory=dict)
    llm_ms: int | None = None
    wait_for_save: bool = True


async def _body(q: ProcessedQuery, p: _Pipeline, st: _StreamState) -> AsyncIterator[bytes]:
    """Zdarzenia do `candidates` i odpowiedzi włącznie (bez `report_saved` i `done`)."""
    yield _status("preprocess")
    yield _status("search")
    # shield: anulowanie generatora (rozłączenie klienta) nie może anulować futures
    _, err = await asyncio.shield(p.retrieved)
    if err is not None:
        st.wait_for_save = False
        yield _error_for(err)
        return
    yield _status("rerank")
    result, err = await asyncio.shield(p.finalized)
    if err is not None or result is None:
        st.wait_for_save = False
        yield _error_for(err or RuntimeError("no search result"))
        return

    yield _frame(
        "candidates",
        CandidatesEvent(
            solutions=result.solutions, also_see=result.also_see, context=result.context
        ),
    )

    if not result.matched:
        gate = result.gate
        yield _frame("no_match", NoMatchEvent(best_score=gate.score, gate=gate.source))
        return
    if not settings.LLM_ENABLED:
        return  # karty to pełna odpowiedź

    yield _status("answer")
    f = CitationFilter(len(result.solutions))
    t_llm = time.perf_counter()
    try:
        llm = get_llm_provider()
        async for chunk in generate(q.raw, result.solutions, result.best_chunks, q.too_vague, llm):
            out = f.feed(chunk)
            if out:
                yield _frame("token", TokenEvent(text=out))
        tail = f.flush()
        if tail:
            yield _frame("token", TokenEvent(text=tail))
        if f.should_retract:
            st.flags["answer_retracted"] = True
            yield _frame("answer_retracted", AnswerRetractedEvent())
    except ProviderError as exc:
        st.flags["llm_error"] = True
        yield _error(exc.code, LLM_UNAVAILABLE_PL)
    finally:
        st.llm_ms = _ms(t_llm)
        if f.hallucinated:
            st.flags["citation_hallucination"] = True


async def _events(q: ProcessedQuery, req: ChatRequest) -> AsyncIterator[bytes]:
    t0 = time.perf_counter()
    loop = asyncio.get_running_loop()
    p = _Pipeline(retrieved=loop.create_future(), finalized=loop.create_future())
    p.task = spawn(_search_and_save(q, req, p))
    st = _StreamState()

    try:
        async for frame in _body(q, p, st):
            yield frame
    except Exception as exc:  # noqa: BLE001 — `done` zawsze, także po nieoczekiwanym błędzie
        log.error("chat stream failed", exc_info=exc)
        yield _error("INTERNAL", INTERNAL_PL)

    saved: SaveResult | None = None
    if st.wait_for_save:
        try:
            saved = await asyncio.wait_for(asyncio.shield(p.task), settings.SAVE_WAIT_SECONDS)
        except Exception as exc:  # noqa: BLE001 — brak report_saved = zapis nieudany/opóźniony
            log.warning("report not saved before report_saved: %s", type(exc).__name__)
        if saved is not None:
            yield _frame(
                "report_saved",
                ReportSavedEvent(
                    report_id=saved.report_id,
                    similar_count=saved.similar_count,
                    gmina_count=saved.gmina_count,
                ),
            )
            if saved.search_event_id and (st.flags or st.llm_ms is not None):
                spawn(
                    update_search_event(
                        saved.search_event_id,
                        flags=st.flags or None,
                        latency_ms={"llm": st.llm_ms} if st.llm_ms is not None else None,
                    )
                )

    yield _frame(
        "done",
        DoneEvent(
            search_event_id=saved.search_event_id if saved is not None else None,
            latency_ms={"total": _ms(t0)},
        ),
    )


@router.post("/chat")
async def chat(req: ChatRequest) -> StreamingResponse:
    # Preprocessing przed otwarciem strumienia — nieznana gmina to zwykłe 422 JSON.
    try:
        q = preprocess(req.message, req.gmina)
    except UnknownGminaError as exc:
        raise ApiError(422, "VALIDATION_ERROR", f"gmina: nieznana gmina {exc.gmina!r}.") from exc
    log.info("chat request len=%d gmina_set=%s", len(req.message), req.gmina is not None)
    return StreamingResponse(_events(q, req), media_type="text/event-stream", headers=SSE_HEADERS)
