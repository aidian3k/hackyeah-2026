"""LLM OpenAI (ADR-020): streszczenie M1 strumieniowo i jednorazowe odpowiedzi M4.

Responses API, model `OPENAI_LLM_MODEL`, poziom rozumowania `OPENAI_LLM_REASONING_EFFORT`.
Limit `max_output_tokens` obejmuje też tokeny rozumowania. Bez `temperature`.
Ten sam klucz co embeddingi (`OPENAI_API_KEY`).
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from openai import AsyncOpenAI

from api.config import settings
from api.providers.base import ProviderError

CODE = "LLM_UNAVAILABLE"


class OpenAILLMProvider:
    name = "openai"

    def __init__(self) -> None:
        self._client: AsyncOpenAI | None = None

    def _get_client(self) -> AsyncOpenAI:
        if self._client is None:
            if not settings.OPENAI_API_KEY:
                raise ProviderError(self.name, CODE)
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._client

    async def stream(self, system: str, user: str) -> AsyncIterator[str]:
        client = self._get_client()
        try:
            async with client.responses.stream(
                model=settings.OPENAI_LLM_MODEL,
                instructions=system,
                input=user,
                max_output_tokens=settings.LLM_MAX_TOKENS,
                reasoning={"effort": settings.OPENAI_LLM_REASONING_EFFORT},
            ) as stream:
                async for event in stream:
                    if event.type == "response.output_text.delta":
                        yield event.delta
                    elif event.type in ("response.failed", "error"):
                        raise ProviderError(self.name, CODE)
        except ProviderError:
            raise
        except Exception as exc:
            raise ProviderError(self.name, CODE) from exc

    async def complete(self, system: str, user: str, *, max_tokens: int | None = None) -> str:
        """Jednorazowa odpowiedź tekstowa (Moduł 4: JSON raportu / sugestii)."""
        client = self._get_client()
        try:
            response = await client.responses.create(
                model=settings.OPENAI_LLM_MODEL,
                instructions=system,
                input=user,
                max_output_tokens=max_tokens or settings.LLM_MAX_TOKENS,
                reasoning={"effort": settings.OPENAI_LLM_REASONING_EFFORT},
            )
        except Exception as exc:
            raise ProviderError(self.name, CODE) from exc
        if response.status != "completed":
            raise ProviderError(self.name, CODE)
        return response.output_text
