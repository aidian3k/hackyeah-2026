"""Zapis korpusu: hash treści i przebudowa chunków z embeddingami.

Jedna ścieżka używana przez ingest (scripts/ingest.py) i `POST /api/solutions`.
"""

from __future__ import annotations

import hashlib
import math

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from api.chunking import chunk_solution, passage_text
from api.config import settings
from api.models import Solution, SolutionChunk
from api.providers.base import EmbeddingProvider


def content_hash(title: str, summary: str, body: str) -> str:
    """Klucz idempotencji. `media` i `contact` nie wchodzą do hasha."""
    return hashlib.sha256(((title or "") + (summary or "") + (body or "")).encode()).hexdigest()


async def rebuild_chunks(
    session: AsyncSession, solution: Solution, provider: EmbeddingProvider
) -> int:
    """Usuwa chunki rozwiązania, tworzy nowe i liczy embeddingi jednym `embed_passages`.

    Nie commituje. Zwraca liczbę wywołań API (`ceil(n / EMBEDDING_BATCH_SIZE)`).
    Nie dotyka relacji `solution.chunks` (brak lazy loadingu w async) — chunki
    zapisywane są przez `solution_id`.
    """
    if solution.id is None:
        await session.flush()
    solution_id = solution.id
    title = solution.title

    drafts = chunk_solution(title, solution.summary, solution.body or "")
    texts = [passage_text(title, d) for d in drafts]
    vectors = await provider.embed_passages(texts)
    if len(vectors) != len(drafts):
        raise RuntimeError(
            f"embed_passages zwrócił {len(vectors)} wektorów dla {len(drafts)} chunków"
        )

    await session.execute(delete(SolutionChunk).where(SolutionChunk.solution_id == solution_id))
    session.add_all(
        SolutionChunk(
            solution_id=solution_id,
            chunk_index=d.chunk_index,
            title=title,
            heading=d.heading,
            content=d.content,
            embedding=vec,
        )
        for d, vec in zip(drafts, vectors, strict=True)
    )
    await session.flush()
    return math.ceil(len(drafts) / settings.EMBEDDING_BATCH_SIZE)
