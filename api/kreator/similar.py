"""„Czy to już istnieje?” — podobne innowacje z Biblioteki dla pomysłu (ADR-M3-007).

Używa wyszukiwania Modułu 1 (`preprocess` → `run_search`) bez zapisu zgłoszeń
i bez `search_events`. Tylko karty `SOLUTION` (`solutions` + `also_see`); wiedza nigdy.
"""

from __future__ import annotations

import logging
from typing import Protocol

from api.config import settings
from api.kreator.schemas import SimilarResponse
from api.pipeline.orchestrator import run_search
from api.pipeline.preprocess import preprocess
from api.providers import ProviderError

log = logging.getLogger(__name__)

MSG_TOO_VAGUE = "Opisz pomysł dokładniej, żebyśmy mogli poszukać podobnych."
MSG_NO_MATCH = (
    "Nie znaleźliśmy w Bibliotece podobnych rozwiązań. To dobry znak — Twój pomysł może być nowy."
)
MSG_UNAVAILABLE = "Wyszukiwanie podobnych innowacji jest chwilowo niedostępne. Spróbuj później."


class IdeaText(Protocol):
    """Pola fiszki potrzebne do wyszukiwania (wiersz `Idea` albo podobny obiekt)."""

    id: int
    title: str
    summary: str
    essence: str
    audience: str


def idea_query_text(idea: IdeaText) -> str:
    """Tytuł, opis, istota i adresaci — ucięte do `MAX_QUERY_CHARS`."""
    parts = [idea.title, idea.summary, idea.essence, idea.audience]
    text = "\n".join(p.strip() for p in parts if p and p.strip())
    return text[: settings.MAX_QUERY_CHARS]


async def find_similar(idea: IdeaText, *, limit: int) -> SimilarResponse:
    q = preprocess(idea_query_text(idea), None)
    if q.too_vague:
        log.info("m3 similar idea_id=%s too_vague=true", idea.id)
        return SimilarResponse(available=True, matched=False, message_pl=MSG_TOO_VAGUE)

    try:
        result = await run_search(q)
    except ProviderError as exc:
        log.warning("m3 similar idea_id=%s unavailable code=%s", idea.id, exc.code)
        return SimilarResponse(available=False, matched=False, message_pl=MSG_UNAVAILABLE)

    cards = [c for c in result.solutions + result.also_see if c.kind == "SOLUTION"]
    cards = cards[: max(limit, 0)]
    matched = result.matched and bool(cards)
    log.info(
        "m3 similar idea_id=%s gate=%s passed=%s cards=%s",
        idea.id,
        result.gate.source,
        result.gate.passed,
        len(cards) if matched else 0,
    )
    if not matched:
        return SimilarResponse(available=True, matched=False, message_pl=MSG_NO_MATCH)
    return SimilarResponse(available=True, matched=True, solutions=cards)
