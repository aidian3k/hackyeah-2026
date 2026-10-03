"""Asystent pierwszego kontaktu (Moduł 5): odpowiedź na nowe pytanie z Biblioteki Innowacji.

Działa w tle (`spawn` z `threads.create_thread`) na własnej sesji. Używa pipeline'u Modułu 1
bez zmian: `preprocess` → `run_search` (bramka „nie wiem” działa bez rerankera) → przy
`LLM_ENABLED` streszczenie z `answer.generate` przez `CitationFilter` (`[n]` = pozycja karty).
Bez LLM, przy błędzie, przekroczeniu czasu albo odrzuceniu tekstu — same karty z krótkim
wstępem. Wątek nigdy nie zostaje w `AI_PENDING`. W logach tylko identyfikatory i liczby.
"""

from __future__ import annotations

import asyncio
import logging

from sqlalchemy import select

from api.comm.models import MessageRole, ThreadMessage, ThreadStatus
from api.comm.threads import add_message, set_status
from api.config import settings
from api.db import SessionLocal
from api.pipeline.answer import CitationFilter, generate
from api.pipeline.orchestrator import run_search
from api.pipeline.preprocess import preprocess
from api.providers import ProviderError, get_llm_provider
from api.schemas import SolutionCard

log = logging.getLogger(__name__)

NO_MATCH_PL = (
    "Nie mam gotowej odpowiedzi w Bibliotece Innowacji. "
    "Pytanie trafiło do zespołu Hubu — odpowiemy w tym wątku."
)
HANDOVER_PL = "Pytanie trafiło do zespołu Hubu — odpowiemy w tym wątku."
CARDS_ONLY_PL = "Te rozwiązania z Biblioteki Innowacji mogą pomóc:"


async def _summary(query: str, cards: list[SolutionCard], best_chunks, too_vague: bool) -> str:
    """Streszczenie z cytowaniami; pusty tekst = odrzucone (brak poprawnych `[n]`)."""
    f = CitationFilter(len(cards))
    parts: list[str] = []
    async with asyncio.timeout(settings.M5_ASSISTANT_TIMEOUT_SECONDS):
        async for chunk in generate(query, cards, best_chunks, too_vague, get_llm_provider()):
            parts.append(f.feed(chunk))
    parts.append(f.flush())
    return "" if f.should_retract else "".join(parts).strip()


async def _first_question(thread_id: int) -> str | None:
    async with SessionLocal() as session:
        return await session.scalar(
            select(ThreadMessage.body)
            .where(ThreadMessage.thread_id == thread_id, ThreadMessage.role == MessageRole.USER)
            .order_by(ThreadMessage.created_at, ThreadMessage.id)
            .limit(1)
        )


async def _hand_over(thread_id: int, body: str) -> None:
    async with SessionLocal() as session:
        await add_message(session, thread_id, role=MessageRole.SYSTEM, body=body)
        await set_status(
            session, thread_id, ThreadStatus.WAITING_STAFF, only_from=ThreadStatus.AI_PENDING
        )


async def run_assistant(thread_id: int) -> None:
    try:
        question = await _first_question(thread_id)
        if not question:
            await _hand_over(thread_id, HANDOVER_PL)
            return

        q = preprocess(question, None)
        result = await run_search(q)
        cards = result.solutions  # tylko SOLUTION; wiedza (result.context) nigdy na kartach
        if not result.gate.passed or not cards:
            await _hand_over(thread_id, NO_MATCH_PL)
            log.info("assistant no match", extra={"thread_id": thread_id})
            return

        text, fallback = "", None
        if not settings.LLM_ENABLED:
            fallback = "no_llm"
        else:
            try:
                text = await _summary(q.raw, cards, result.best_chunks, q.too_vague)
                if not text:
                    fallback = "retracted"
            except (ProviderError, TimeoutError):
                fallback = "error"

        meta = {
            "gate": {
                "source": result.gate.source,
                "score": result.gate.score,
                "threshold": result.gate.threshold,
            }
        }
        if fallback:
            meta["fallback"] = fallback
        async with SessionLocal() as session:
            await add_message(
                session,
                thread_id,
                role=MessageRole.ASSISTANT,
                body=text or CARDS_ONLY_PL,
                solution_ids=[c.id for c in cards],
                meta=meta,
            )
            await set_status(
                session, thread_id, ThreadStatus.WAITING_USER, only_from=ThreadStatus.AI_PENDING
            )
        log.info(
            "assistant answered",
            extra={"thread_id": thread_id, "cards": len(cards), "fallback": fallback},
        )
    except Exception:
        log.exception("assistant failed", extra={"thread_id": thread_id})
        try:
            await _hand_over(thread_id, HANDOVER_PL)
        except Exception:
            log.exception("assistant hand-over failed", extra={"thread_id": thread_id})
