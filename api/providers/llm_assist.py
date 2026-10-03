"""LLM asystenta Modułu 3: jednorazowa odpowiedź JSON przez structured outputs (ADR-M3-005).

Osobny plik, bo `api/providers/llm.py` (M1, streszczenie strumieniowe) jest zamrożony.
Model, klucz i wyłącznik: istniejące `LLM_MODEL`, `ANTHROPIC_API_KEY`, `LLM_ENABLED`
plus `M3_ASSIST_ENABLED`. Logujemy model, czas i liczbę tokenów — nigdy promptu ani odpowiedzi.
"""

from __future__ import annotations

import logging
import time

import anthropic
from pydantic import BaseModel

from api.config import settings
from api.providers.base import ProviderError

log = logging.getLogger(__name__)

NAME = "anthropic"
CODE = "LLM_UNAVAILABLE"

_client: anthropic.AsyncAnthropic | None = None


def assist_available() -> bool:
    return bool(settings.LLM_ENABLED and settings.M3_ASSIST_ENABLED and settings.ANTHROPIC_API_KEY)


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(
            api_key=settings.ANTHROPIC_API_KEY, timeout=settings.M3_ASSIST_TIMEOUT_SECONDS
        )
    return _client


async def complete_json[T: BaseModel](
    system: str, user: str, output_model: type[T], *, max_tokens: int
) -> T:
    """Odpowiedź modelu sparsowana do `output_model`.

    Każda porażka (wyłączony asystent, błąd SDK, przekroczenie czasu, `stop_reason` inny niż
    `end_turn`, brak `parsed_output`) → `ProviderError("anthropic", "LLM_UNAVAILABLE")`.
    """
    if not assist_available():
        raise ProviderError(NAME, CODE)
    t0 = time.perf_counter()
    try:
        response = await _get_client().messages.parse(
            model=settings.LLM_MODEL,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
            output_format=output_model,
        )
    except Exception as exc:
        log.warning(
            "m3 assist llm error model=%s error=%s ms=%s",
            settings.LLM_MODEL,
            type(exc).__name__,
            int((time.perf_counter() - t0) * 1000),
        )
        raise ProviderError(NAME, CODE) from exc

    ms = int((time.perf_counter() - t0) * 1000)
    usage = response.usage
    log.info(
        "m3 assist llm model=%s output=%s ms=%s input_tokens=%s output_tokens=%s stop_reason=%s",
        settings.LLM_MODEL,
        output_model.__name__,
        ms,
        usage.input_tokens,
        usage.output_tokens,
        response.stop_reason,
    )
    parsed = response.parsed_output
    if response.stop_reason != "end_turn" or parsed is None:
        raise ProviderError(NAME, CODE)
    return parsed
