"""Tor semantyczny: wyszukiwanie wektorowe (rozwiązania, wiedza) i uzupełnienie cosinusa.

Funkcje przyjmują gotowy wektor zapytania (embedding liczy orkiestrator). Pełny skan,
bez indeksów wektorowych (ADR-019). Status i `kind` filtrowane przez JOIN solutions.
"""

from __future__ import annotations

from sqlalchemy import bindparam, text
from sqlalchemy.dialects.postgresql import ARRAY, BIGINT
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import settings
from api.db import to_pgvector
from api.pipeline.types import Candidate

_SEARCH_SQL = text(
    """
    WITH raw AS (
        SELECT c.id AS chunk_id, c.solution_id,
               c.embedding <=> CAST(:query_vec AS vector(1024)) AS dist
        FROM solution_chunks c
        JOIN solutions s ON s.id = c.solution_id
        WHERE s.status = 'PUBLISHED'
          AND s.kind = CAST(:kind AS solution_kind)
          AND c.embedding IS NOT NULL
        ORDER BY dist
        LIMIT :vector_overfetch
    ),
    best AS (
        SELECT DISTINCT ON (solution_id) solution_id, chunk_id, dist
        FROM raw
        ORDER BY solution_id, dist
    )
    SELECT solution_id, chunk_id, dist,
           1.0 - dist AS cosine_similarity,
           ROW_NUMBER() OVER (ORDER BY dist, solution_id) AS rnk
    FROM best
    ORDER BY dist, solution_id
    LIMIT :limit
    """
)

_BACKFILL_SQL = text(
    """
    SELECT id, 1.0 - (embedding <=> CAST(:query_vec AS vector(1024))) AS cosine_similarity
    FROM solution_chunks
    WHERE id = ANY(:ids) AND embedding IS NOT NULL
    """
).bindparams(bindparam("ids", type_=ARRAY(BIGINT)))


async def semantic_search(
    session: AsyncSession,
    vec: list[float],
    kind: str = "SOLUTION",
    limit: int | None = None,
) -> list[Candidate]:
    """Najbliższe rozwiązania danego `kind` (jedno `solution_id` raz, najlepszy chunk)."""
    if limit is None:
        limit = settings.CANDIDATES_PER_TRACK
    if limit <= 0:
        return []
    rows = (
        await session.execute(
            _SEARCH_SQL,
            {
                "query_vec": to_pgvector(vec),
                "kind": kind,
                "vector_overfetch": settings.VECTOR_OVERFETCH,
                "limit": limit,
            },
        )
    ).all()
    return [
        Candidate(
            solution_id=r.solution_id,
            chunk_id=r.chunk_id,
            rank=int(r.rnk),
            score=None,
            cosine_similarity=float(r.cosine_similarity),
        )
        for r in rows
    ]


async def knowledge_search(session: AsyncSession, vec: list[float]) -> list[Candidate]:
    """Wpisy KNOWLEDGE (≤ KNOWLEDGE_TOP_N) z cosinusem ≥ MIN_COSINE_SCORE."""
    if settings.KNOWLEDGE_TOP_N <= 0:
        return []
    found = await semantic_search(session, vec, kind="KNOWLEDGE", limit=settings.KNOWLEDGE_TOP_N)
    return [
        c
        for c in found
        if c.cosine_similarity is not None and c.cosine_similarity >= settings.MIN_COSINE_SCORE
    ]


async def backfill_cosine(
    session: AsyncSession, vec: list[float], chunk_ids: list[int]
) -> dict[int, float]:
    """Cosinus zapytania dla podanych chunków (np. kandydatów tylko z toru leksykalnego)."""
    ids = list(dict.fromkeys(chunk_ids))
    if not ids:
        return {}
    rows = (await session.execute(_BACKFILL_SQL, {"query_vec": to_pgvector(vec), "ids": ids})).all()
    return {int(r.id): float(r.cosine_similarity) for r in rows}
