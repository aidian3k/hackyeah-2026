"""Embeddingi OpenAI `text-embedding-3-large` z `dimensions=1024` (ADR-015)."""

from __future__ import annotations

from openai import AsyncOpenAI

from api.config import settings
from api.providers.base import ProviderError

CODE = "EMBEDDING_UNAVAILABLE"


class OpenAIEmbeddingProvider:
    name = "openai"

    def __init__(self) -> None:
        self.dim = settings.EMBEDDING_DIM
        self.query_prefix = settings.EMBEDDING_QUERY_PREFIX
        self.passage_prefix = settings.EMBEDDING_PASSAGE_PREFIX
        self._client: AsyncOpenAI | None = None

    def _get_client(self) -> AsyncOpenAI:
        # Leniwie: brak klucza ma dać ProviderError przy wywołaniu, nie przy imporcie.
        if self._client is None:
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY or None)
        return self._client

    async def _embed(self, inputs: list[str]) -> list[list[float]]:
        try:
            resp = await self._get_client().embeddings.create(
                model=settings.EMBEDDING_MODEL,
                input=inputs,
                dimensions=settings.EMBEDDING_DIM,
            )
        except Exception as exc:
            raise ProviderError(self.name, CODE) from exc
        data = sorted(resp.data, key=lambda d: d.index)
        vectors = [list(d.embedding) for d in data]
        if len(vectors) != len(inputs) or any(len(v) != self.dim for v in vectors):
            raise ProviderError(self.name, CODE)
        return vectors

    async def embed_query(self, text: str) -> list[float]:
        return (await self._embed([self.query_prefix + text]))[0]

    async def embed_passages(self, texts: list[str]) -> list[list[float]]:
        out: list[list[float]] = []
        batch = settings.EMBEDDING_BATCH_SIZE
        for start in range(0, len(texts), batch):
            chunk = [self.passage_prefix + t for t in texts[start : start + batch]]
            out.extend(await self._embed(chunk))
        return out
