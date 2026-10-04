"""Asystent AI Modułu 3: podpowiedzi przy fiszce pomysłu i blokach Social Canvas (ADR-M3-005).

Kontekst promptu: pola fiszki (bez `author_name` i `contact_email`), etykieta wyzwania,
podobne innowacje z Biblioteki (dla fiszki) albo definicja bloku i opisy pozostałych bloków
(dla kanwy). Bez LLM albo przy błędzie → `available: false` i pytania zastępcze.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Literal

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import settings
from api.kreator import prompts
from api.kreator.canvas import block_map, describe_block, load_canvas
from api.kreator.models import Idea
from api.kreator.schemas import AssistResponse, AssistSuggestion, CanvasBlock, IdeaUpdate
from api.kreator.similar import find_similar
from api.models import Taxonomy
from api.providers.base import ProviderError
from api.providers.llm_assist import assist_available, complete_json

log = logging.getLogger(__name__)

IdeaField = Literal["title", "summary", "essence", "audience"]

_TAGS = ("fiszka", "kanwa", "blok", "podobne")
_CLOSING_TAG_RE = re.compile(r"</\s*(" + "|".join(_TAGS) + r")\s*>", re.IGNORECASE)


# --- wyjście modelu (structured outputs) ------------------------------------------


class IdeaSuggestionOut(BaseModel):
    field: IdeaField
    value: str
    rationale: str


class IdeaAssistOut(BaseModel):
    questions: list[str]
    suggestions: list[IdeaSuggestionOut]


class BlockSuggestionOut(BaseModel):
    value: str
    rationale: str


class BlockAssistOut(BaseModel):
    questions: list[str]
    suggestions: list[BlockSuggestionOut]


# --- pomocnicze -------------------------------------------------------------------


def _data(text: str | None) -> str:
    """Treść użytkownika do znacznika: bez zamykających znaczników promptu."""
    return _CLOSING_TAG_RE.sub("", (text or "").strip())


def _clean_list(items: list[str], limit: int) -> list[str]:
    out: list[str] = []
    for item in items:
        s = item.strip()
        if s and s not in out:
            out.append(s)
    return out[: max(limit, 0)]


def _field_max_len(field: str) -> int | None:
    """Limit długości pola fiszki z `IdeaUpdate` (propozycja musi dać się zapisać)."""
    info = IdeaUpdate.model_fields.get(field)
    for meta in info.metadata if info else []:
        max_length = getattr(meta, "max_length", None)
        if max_length is not None:
            return max_length
    return None


def _unavailable(questions: list[str]) -> AssistResponse:
    return AssistResponse(
        available=False,
        questions=_clean_list(questions, settings.M3_ASSIST_MAX_QUESTIONS),
        message_pl=prompts.UNAVAILABLE_PL,
    )


async def _category_label(session: AsyncSession, code: str | None) -> str | None:
    if not code:
        return None
    return await session.scalar(select(Taxonomy.label_pl).where(Taxonomy.code == code))


async def _idea_xml(session: AsyncSession, idea: Idea) -> str:
    """Fiszka w znaczniku `<fiszka>` — celowo bez `author_name` i `contact_email`."""
    label = await _category_label(session, idea.category)
    lines = [
        f"Tytuł: {_data(idea.title)}",
        f"Opis problemu i pomysłu: {_data(idea.summary)}",
        f"Istota pomysłu: {_data(idea.essence) or '(puste)'}",
        f"Dla kogo: {_data(idea.audience) or '(puste)'}",
    ]
    if label:
        lines.append(f"Wyzwanie społeczne: {label}")
    if idea.gmina:
        lines.append(f"Gmina: {idea.gmina}")
    return "<fiszka>\n" + "\n".join(lines) + "\n</fiszka>"


# --- fiszka -----------------------------------------------------------------------


async def assist_idea(session: AsyncSession, idea: Idea) -> AssistResponse:
    if not assist_available():
        log.info("m3 assist idea_id=%s target=idea available=false reason=disabled", idea.id)
        return _unavailable(prompts.IDEA_FALLBACK_QUESTIONS)

    similar = await find_similar(idea, limit=settings.IDEA_SIMILAR_LIMIT)
    parts = [await _idea_xml(session, idea)]
    if similar.matched:
        items = "\n".join(f"- {_data(c.title)}: {_data(c.summary)}" for c in similar.solutions)
        parts.append(f"<podobne>\n{items}\n</podobne>")
    parts.append(
        prompts.IDEA_TASK.format(
            max_questions=settings.M3_ASSIST_MAX_QUESTIONS,
            max_suggestions=settings.M3_ASSIST_MAX_SUGGESTIONS,
        )
    )

    try:
        out = await complete_json(
            prompts.SYSTEM,
            "\n\n".join(parts),
            IdeaAssistOut,
            max_tokens=settings.M3_ASSIST_MAX_TOKENS,
        )
    except ProviderError as exc:
        log.warning("m3 assist idea_id=%s target=idea available=false code=%s", idea.id, exc.code)
        return _unavailable(prompts.IDEA_FALLBACK_QUESTIONS)

    suggestions: list[AssistSuggestion] = []
    for s in out.suggestions:
        value = s.value.strip()
        max_len = _field_max_len(s.field)
        if not value or (max_len is not None and len(value) > max_len):
            continue
        suggestions.append(
            AssistSuggestion(field=s.field, value=value, rationale=s.rationale.strip())
        )
    suggestions = suggestions[: max(settings.M3_ASSIST_MAX_SUGGESTIONS, 0)]
    questions = _clean_list(out.questions, settings.M3_ASSIST_MAX_QUESTIONS)
    log.info(
        "m3 assist idea_id=%s target=idea questions=%s suggestions=%s similar=%s",
        idea.id,
        len(questions),
        len(suggestions),
        len(similar.solutions),
    )
    return AssistResponse(available=True, questions=questions, suggestions=suggestions)


# --- blok kanwy -------------------------------------------------------------------


def _block_fallback(block: CanvasBlock) -> list[str]:
    return list(block.help) if block.help else [block.prompt]


def _block_xml(block: CanvasBlock, value: Any) -> str:
    lines = [f"Tytuł bloku: {block.title}", f"Polecenie: {block.prompt}"]
    if block.help:
        lines.append("Pytania pomocnicze: " + " · ".join(block.help))
    if block.options:
        lines.append("Opcje do wyboru: " + "; ".join(o.label for o in block.options))
    if block.roles:
        lines.append(
            "Role partnerów: " + "; ".join(f"{r.label} ({r.description})" for r in block.roles)
        )
    if block.max:
        lines.append(f"Najwyżej {block.max} pozycje łącznie.")
    current = describe_block(block, value)
    lines.append(f"Obecna wartość: {_data(current) if current else '(pusty)'}")
    return "<blok>\n" + "\n".join(lines) + "\n</blok>"


def _existing_entries(block: CanvasBlock, value: Any) -> set[str]:
    """Wpisy już obecne w bloku (porównanie bez wielkości liter) — do odfiltrowania powtórzeń."""
    items: list[Any] = []
    if block.type == "list" and isinstance(value, list):
        items = value
    elif block.type == "multi" and isinstance(value, dict):
        items = list(value.get("other") or [])
        items += [o.label for o in block.options if o.code in (value.get("selected") or [])]
    elif block.type == "partners" and isinstance(value, list):
        items = [p.get("name", "") for p in value if isinstance(p, dict)]
    return {str(i).strip().casefold() for i in items if str(i).strip()}


async def assist_block(session: AsyncSession, idea: Idea, block: CanvasBlock) -> AssistResponse:
    if not assist_available():
        log.info(
            "m3 assist idea_id=%s target=canvas_block block_id=%s available=false reason=disabled",
            idea.id,
            block.id,
        )
        return _unavailable(_block_fallback(block))

    data = await load_canvas(session, idea.id)
    blocks = block_map()
    others = [
        d
        for bid, value in data.items()
        if bid != block.id and bid in blocks and (d := describe_block(blocks[bid], value))
    ]
    parts = [await _idea_xml(session, idea)]
    if others:
        parts.append("<kanwa>\n" + "\n".join(f"- {_data(d)}" for d in others) + "\n</kanwa>")
    parts.append(_block_xml(block, data.get(block.id)))
    parts.append(
        prompts.BLOCK_TASK.format(
            max_questions=settings.M3_ASSIST_MAX_QUESTIONS,
            max_suggestions=settings.M3_ASSIST_MAX_SUGGESTIONS,
            type_hint=prompts.BLOCK_TYPE_HINTS.get(block.type, ""),
        )
    )

    try:
        out = await complete_json(
            prompts.SYSTEM,
            "\n\n".join(parts),
            BlockAssistOut,
            max_tokens=settings.M3_ASSIST_MAX_TOKENS,
        )
    except ProviderError as exc:
        log.warning(
            "m3 assist idea_id=%s target=canvas_block block_id=%s available=false code=%s",
            idea.id,
            block.id,
            exc.code,
        )
        return _unavailable(_block_fallback(block))

    existing = _existing_entries(block, data.get(block.id))
    suggestions: list[AssistSuggestion] = []
    seen: set[str] = set()
    for s in out.suggestions:
        value = s.value.strip()[: settings.CANVAS_ITEM_MAX_CHARS].strip()
        key = value.casefold()
        if not value or key in existing or key in seen:
            continue
        seen.add(key)
        suggestions.append(
            AssistSuggestion(field=block.id, value=value, rationale=s.rationale.strip())
        )
    suggestions = suggestions[: max(settings.M3_ASSIST_MAX_SUGGESTIONS, 0)]
    questions = _clean_list(out.questions, settings.M3_ASSIST_MAX_QUESTIONS)
    log.info(
        "m3 assist idea_id=%s target=canvas_block block_id=%s questions=%s suggestions=%s",
        idea.id,
        block.id,
        len(questions),
        len(suggestions),
    )
    return AssistResponse(available=True, questions=questions, suggestions=suggestions)
