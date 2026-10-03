"""Reranker `noop`: zachowuje kolejność wejścia (kolejność RRF), bez score'ów."""

from __future__ import annotations

from api.providers.base import RerankResult


class NoopRerankProvider:
    name = "noop"

    async def rerank(self, query: str, documents: list[str], top_n: int) -> list[RerankResult]:
        return [RerankResult(index=i, score=None) for i in range(min(top_n, len(documents)))]
