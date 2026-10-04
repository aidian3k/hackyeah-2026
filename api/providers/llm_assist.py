"""LLM asystenta Modułu 3: odpowiedź JSON przez structured outputs (ADR-M3-005, ADR-020).

Osobny plik od `api/providers/llm.py` / `llm_openai.py` (streszczenie M1 i `complete()` M4).
Dostawca: `LLM_PROVIDER` — `openai` (domyślnie, `responses.parse` z `text_format`, model
`OPENAI_LLM_MODEL`) albo `anthropic` (`messages.parse`, model `LLM_MODEL`). Klucz aktywnego
dostawcy, wyłączniki `LLM_ENABLED` i `M3_ASSIST_ENABLED`. Logujemy dostawcę, model, czas
i liczbę tokenów — nigdy promptu ani odpowiedzi.
"""

from __future__ import annotations

import logging
import time

import anthropic
from openai import AsyncOpenAI
from pydantic import BaseModel

from api.config import settings
from api.providers.base import ProviderError

log = logging.getLogger(__name__)

CODE = "LLM_UNAVAILABLE"

_anthropic_client: anthropic.AsyncAnthropic | None = None
_openai_client: AsyncOpenAI | None = None


def assist_available() -> bool:
    return bool(settings.LLM_ENABLED and settings.M3_ASSIST_ENABLED and settings.llm_api_key)


def _get_anthropic_client() -> anthropic.AsyncAnthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.AsyncAnthropic(
            api_key=settings.ANTHROPIC_API_KEY, timeout=settings.M3_ASSIST_TIMEOUT_SECONDS
        )
    return _anthropic_client


def _get_openai_client() -> AsyncOpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY, timeout=settings.M3_ASSIST_TIMEOUT_SECONDS
        )
    return _openai_client


def _log_error(provider: str, exc: Exception, t0: float) -> None:
    log.warning(
        "m3 assist llm error provider=%s model=%s error=%s ms=%s",
        provider,
        settings.llm_model,
        type(exc).__name__,
        int((time.perf_counter() - t0) * 1000),
    )


def _log_ok(
    provider: str, output_model: type[BaseModel], t0: float, tokens_in, tokens_out, stop
) -> None:
    log.info(
        "m3 assist llm provider=%s model=%s output=%s ms=%s input_tokens=%s output_tokens=%s"
        " stop_reason=%s",
        provider,
        settings.llm_model,
        output_model.__name__,
        int((time.perf_counter() - t0) * 1000),
        tokens_in,
        tokens_out,
        stop,
    )


async def _openai_json[T: BaseModel](
    system: str, user: str, output_model: type[T], max_tokens: int
) -> T:
    name = "openai"
    t0 = time.perf_counter()
    try:
        response = await _get_openai_client().responses.parse(
            model=settings.OPENAI_LLM_MODEL,
            instructions=system,
            input=user,
            text_format=output_model,
            max_output_tokens=max_tokens,
            reasoning={"effort": settings.OPENAI_LLM_REASONING_EFFORT},
        )
    except Exception as exc:
        _log_error(name, exc, t0)
        raise ProviderError(name, CODE) from exc
    usage = response.usage
    _log_ok(
        name,
        output_model,
        t0,
        usage.input_tokens if usage else None,
        usage.output_tokens if usage else None,
        response.status,
    )
    parsed = response.output_parsed
    if response.status != "completed" or parsed is None:
        raise ProviderError(name, CODE)
    return parsed


async def _anthropic_json[T: BaseModel](
    system: str, user: str, output_model: type[T], max_tokens: int
) -> T:
    name = "anthropic"
    t0 = time.perf_counter()
    try:
        response = await _get_anthropic_client().messages.parse(
            model=settings.LLM_MODEL,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
            output_format=output_model,
        )
    except Exception as exc:
        _log_error(name, exc, t0)
        raise ProviderError(name, CODE) from exc
    usage = response.usage
    _log_ok(name, output_model, t0, usage.input_tokens, usage.output_tokens, response.stop_reason)
    parsed = response.parsed_output
    if response.stop_reason != "end_turn" or parsed is None:
        raise ProviderError(name, CODE)
    return parsed


async def complete_json[T: BaseModel](
    system: str, user: str, output_model: type[T], *, max_tokens: int
) -> T:
    """Odpowiedź modelu sparsowana do `output_model`.

    Każda porażka (wyłączony asystent, brak klucza, błąd SDK, przekroczenie czasu, odpowiedź
    niepełna lub odmowa, brak sparsowanego wyniku) → `ProviderError(<dostawca>, "LLM_UNAVAILABLE")`.
    """
    if not assist_available():
        raise ProviderError(settings.LLM_PROVIDER, CODE)
    if settings.LLM_PROVIDER == "openai":
        return await _openai_json(system, user, output_model, max_tokens)
    return await _anthropic_json(system, user, output_model, max_tokens)
