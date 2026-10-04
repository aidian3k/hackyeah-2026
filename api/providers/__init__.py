"""Fabryki providerów. Instancje cache'owane; nieznana nazwa → ValueError."""

from __future__ import annotations

from functools import lru_cache

from api.config import settings
from api.providers.base import (
    EmbeddingProvider,
    LLMProvider,
    ProviderError,
    RerankProvider,
    RerankResult,
)

__all__ = [
    "EmbeddingProvider",
    "LLMProvider",
    "ProviderError",
    "RerankProvider",
    "RerankResult",
    "get_embedding_provider",
    "get_llm_provider",
    "get_rerank_provider",
]


@lru_cache(maxsize=1)
def get_embedding_provider() -> EmbeddingProvider:
    name = settings.EMBEDDING_PROVIDER
    if name == "openai":
        from api.providers.embeddings_openai import OpenAIEmbeddingProvider

        return OpenAIEmbeddingProvider()
    if name == "hash":
        from api.providers.embeddings_hash import HashEmbeddingProvider

        return HashEmbeddingProvider()
    raise ValueError(f"Nieznany EMBEDDING_PROVIDER: {name!r}")


@lru_cache(maxsize=1)
def get_rerank_provider() -> RerankProvider:
    from api.providers.rerank_noop import NoopRerankProvider

    if not settings.RERANK_ENABLED:
        return NoopRerankProvider()
    name = settings.RERANK_PROVIDER
    if name == "cohere":
        from api.providers.rerank_cohere import CohereRerankProvider

        return CohereRerankProvider()
    if name == "noop":
        return NoopRerankProvider()
    raise ValueError(f"Nieznany RERANK_PROVIDER: {name!r}")


@lru_cache(maxsize=1)
def get_llm_provider() -> LLMProvider:
    name = settings.LLM_PROVIDER
    if name == "openai":
        from api.providers.llm_openai import OpenAILLMProvider

        return OpenAILLMProvider()
    if name == "anthropic":
        from api.providers.llm import AnthropicLLMProvider

        return AnthropicLLMProvider()
    raise ValueError(f"Nieznany LLM_PROVIDER: {name!r}")
