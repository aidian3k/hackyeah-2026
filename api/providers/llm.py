"""LLM do streszczenia: Anthropic `claude-haiku-4-5-20251001` (strumieniowo)."""

from __future__ import annotations

from collections.abc import AsyncIterator

import anthropic

from api.config import settings
from api.providers.base import ProviderError

CODE = "LLM_UNAVAILABLE"


class AnthropicLLMProvider:
    name = "anthropic"

    def __init__(self) -> None:
        self._client: anthropic.AsyncAnthropic | None = None

    def _get_client(self) -> anthropic.AsyncAnthropic:
        if self._client is None:
            if not settings.ANTHROPIC_API_KEY:
                raise ProviderError(self.name, CODE)
            self._client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        return self._client

    async def stream(self, system: str, user: str) -> AsyncIterator[str]:
        client = self._get_client()
        try:
            async with client.messages.stream(
                model=settings.LLM_MODEL,
                max_tokens=settings.LLM_MAX_TOKENS,
                system=system,
                messages=[{"role": "user", "content": user}],
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except ProviderError:
            raise
        except Exception as exc:
            raise ProviderError(self.name, CODE) from exc

    async def complete(self, system: str, user: str, *, max_tokens: int | None = None) -> str:
        """Jednorazowa odpowiedź tekstowa (Moduł 4: JSON raportu / sugestii)."""
        client = self._get_client()
        try:
            message = await client.messages.create(
                model=settings.LLM_MODEL,
                max_tokens=max_tokens or settings.LLM_MAX_TOKENS,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
        except ProviderError:
            raise
        except Exception as exc:
            raise ProviderError(self.name, CODE) from exc
        parts: list[str] = []
        for block in message.content:
            text = getattr(block, "text", None)
            if text:
                parts.append(text)
        return "".join(parts)
