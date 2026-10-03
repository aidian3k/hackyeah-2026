"""Reranking Cohere `rerank-v3.5`."""

from __future__ import annotations

import cohere

from api.config import settings
from api.providers.base import ProviderError, RerankResult

CODE = "RERANK_UNAVAILABLE"


class CohereRerankProvider:
    name = "cohere"

    def __init__(self) -> None:
        self._client: cohere.AsyncClientV2 | None = None

    def _get_client(self) -> cohere.AsyncClientV2:
        if self._client is None:
            if not settings.COHERE_API_KEY:
                raise ProviderError(self.name, CODE)
            self._client = cohere.AsyncClientV2(api_key=settings.COHERE_API_KEY)
        return self._client

    async def rerank(self, query: str, documents: list[str], top_n: int) -> list[RerankResult]:
        if not documents:
            return []
        client = self._get_client()
        try:
            resp = await client.rerank(
                model=settings.RERANK_MODEL,
                query=query,
                documents=documents,
                top_n=min(top_n, len(documents)),
            )
        except Exception as exc:
            raise ProviderError(self.name, CODE) from exc
        results = [
            RerankResult(index=r.index, score=float(r.relevance_score)) for r in resp.results
        ]
        results.sort(key=lambda r: r.score or 0.0, reverse=True)
        return results
