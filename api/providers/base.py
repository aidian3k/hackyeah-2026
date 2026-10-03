"""Protokoły providerów (embeddingi, rerank, LLM) i wspólny wyjątek."""

from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Protocol


class EmbeddingProvider(Protocol):
    name: str
    dim: int  # MUSI być 1024 (ADR-004)
    query_prefix: str  # z konfiguracji; "" dla OpenAI
    passage_prefix: str  # z konfiguracji; "" dla OpenAI

    async def embed_query(self, text: str) -> list[float]: ...

    async def embed_passages(self, texts: list[str]) -> list[list[float]]: ...


@dataclass
class RerankResult:
    index: int  # indeks w liście documents
    score: float | None  # 0..1; None dla noop


class RerankProvider(Protocol):
    name: str

    async def rerank(self, query: str, documents: list[str], top_n: int) -> list[RerankResult]:
        """Wyniki posortowane malejąco po score."""
        ...


class LLMProvider(Protocol):
    name: str

    def stream(self, system: str, user: str) -> AsyncIterator[str]: ...


class ProviderError(Exception):
    """Błąd dostawcy. code: EMBEDDING_UNAVAILABLE | RERANK_UNAVAILABLE | LLM_UNAVAILABLE."""

    def __init__(self, provider: str, code: str):
        super().__init__(f"{provider}: {code}")
        self.provider = provider
        self.code = code
