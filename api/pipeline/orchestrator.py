"""Orkiestrator wyszukiwania: embedding → tory równolegle → RRF → cosinus → rerank + bramka → karty.

Preprocessing robi wołający (czat / `/api/search`). Każde równoległe zapytanie do bazy ma
własną sesję (`SessionLocal()`), bo jedna `AsyncSession` nie obsługuje równoległych zapytań.
`ProviderError` (embedding, reranker) propaguje do wołającego.
"""

from __future__ import annotations

import asyncio
import time
from collections.abc import Awaitable, Callable
from dataclasses import replace

from sqlalchemy import bindparam, text
from sqlalchemy.dialects.postgresql import ARRAY, BIGINT

from api.cards import SolutionRow, load_solutions, to_card
from api.config import settings
from api.db import SessionLocal
from api.models import SolutionKind
from api.pipeline.fusion import rrf_fuse
from api.pipeline.lexical import lexical_search
from api.pipeline.rerank import rerank_and_gate, rerank_document
from api.pipeline.semantic import backfill_cosine, knowledge_search, semantic_search
from api.pipeline.types import (
    Candidate,
    FusedCandidate,
    ProcessedQuery,
    RetrievalResult,
    SearchResult,
)
from api.providers import get_embedding_provider, get_rerank_provider
from api.providers.rerank_noop import NoopRerankProvider
from api.schemas import Scores, SolutionCard

_CHUNK_CONTENT_SQL = text(
    "SELECT id, content FROM solution_chunks WHERE id = ANY(:ids)"
).bindparams(bindparam("ids", type_=ARRAY(BIGINT)))


def _ms(t0: float) -> int:
    return int(round((time.perf_counter() - t0) * 1000))


async def _timed[T](fn: Callable[[], Awaitable[T]]) -> tuple[T, int]:
    t0 = time.perf_counter()
    result = await fn()
    return result, _ms(t0)


async def _lexical(q: ProcessedQuery) -> list[Candidate]:
    async with SessionLocal() as s:
        return await lexical_search(s, q)


async def _semantic(vec: list[float]) -> list[Candidate]:
    async with SessionLocal() as s:
        return await semantic_search(s, vec, kind="SOLUTION")


async def _knowledge(vec: list[float]) -> list[Candidate]:
    async with SessionLocal() as s:
        return await knowledge_search(s, vec)


async def retrieve(q: ProcessedQuery) -> RetrievalResult:
    """Embedding zapytania, trzy tory równolegle, RRF i uzupełnienie cosinusa."""
    latency: dict[str, int] = {}

    t0 = time.perf_counter()
    vec = await get_embedding_provider().embed_query(q.normalized)
    latency["embed"] = _ms(t0)

    (
        (lex, latency["lexical"]),
        (sem, latency["semantic"]),
        (know, latency["knowledge"]),
    ) = await asyncio.gather(
        _timed(lambda: _lexical(q)),
        _timed(lambda: _semantic(vec)),
        _timed(lambda: _knowledge(vec)),
    )

    t0 = time.perf_counter()
    fused = rrf_fuse(
        {"lexical": lex, "semantic": sem}, k=settings.RRF_K, top_n=settings.RERANK_TOP_N
    )
    # Kandydaci tylko z toru leksykalnego nie mają cosinusa — bramka cosinusowa i filtr
    # per pozycja go potrzebują (inaczej odpadną), więc uzupełniamy przed rerankiem.
    missing = [c.chunk_id for c in fused if c.cosine_similarity is None]
    if missing:
        async with SessionLocal() as s:
            cos = await backfill_cosine(s, vec, missing)
        fused = [
            replace(c, cosine_similarity=cos.get(c.chunk_id)) if c.cosine_similarity is None else c
            for c in fused
        ]
    latency["fusion"] = _ms(t0)

    return RetrievalResult(
        query=q,
        query_vec=vec,
        lexical=lex,
        semantic=sem,
        knowledge=know,
        fused=fused,
        latency_ms=latency,
    )


def _scores(c: FusedCandidate) -> Scores:
    return Scores(
        rerank=c.rerank_score,
        rrf=c.rrf_score,
        lex_rank=c.ranks.get("lexical"),
        vec_rank=c.ranks.get("semantic"),
        cosine=c.cosine_similarity,
    )


def _is_solution(row: SolutionRow | None) -> bool:
    return row is not None and row.solution.kind == SolutionKind.SOLUTION


async def finalize(r: RetrievalResult, *, use_rerank: bool | None = None) -> SearchResult:
    """Reranking + bramka „nie wiem” + karty (solutions, also_see, context)."""
    if use_rerank is None:
        use_rerank = settings.RERANK_ENABLED
    provider = get_rerank_provider() if use_rerank else NoopRerankProvider()

    fused = r.fused
    knowledge = r.knowledge
    chunk_ids = [c.chunk_id for c in fused]
    async with SessionLocal() as s:
        rows = await load_solutions(
            s, [c.solution_id for c in fused] + [c.solution_id for c in knowledge]
        )
        contents: dict[int, str] = {}
        if chunk_ids:
            res = await s.execute(_CHUNK_CONTENT_SQL, {"ids": chunk_ids})
            contents = {int(row.id): row.content for row in res}

    # Tylko SOLUTION (tory filtrują `kind`, to zabezpieczenie przed KNOWLEDGE na kartach).
    fused = [c for c in fused if _is_solution(rows.get(c.solution_id))]
    docs = {
        c.solution_id: rerank_document(rows[c.solution_id], contents.get(c.chunk_id, ""))
        for c in fused
    }

    t0 = time.perf_counter()
    outcome = await rerank_and_gate(r.query.normalized, fused, docs, provider)
    rerank_ms = _ms(t0)

    solutions: list[SolutionCard] = [
        to_card(rows[c.solution_id], rank=i, scores=_scores(c))
        for i, c in enumerate(outcome.top, start=1)
    ]
    also_see: list[SolutionCard] = [
        to_card(rows[c.solution_id], rank=i, scores=_scores(c))
        for i, c in enumerate(outcome.also_see, start=len(solutions) + 1)
    ]
    context: list[SolutionCard] = []
    for c in knowledge[: max(settings.KNOWLEDGE_TOP_N, 0)]:
        row = rows.get(c.solution_id)
        if row is None or _is_solution(row):
            continue
        context.append(
            to_card(row, rank=len(context) + 1, scores=Scores(cosine=c.cosine_similarity))
        )

    best_chunks = {
        c.solution_id: contents.get(c.chunk_id, "") for c in outcome.top + outcome.also_see
    }
    latency = dict(r.latency_ms)
    latency["rerank"] = rerank_ms

    return SearchResult(
        retrieval=r,
        reranked=outcome.reranked,
        gate=outcome.gate,
        solutions=solutions,
        also_see=also_see,
        context=context,
        best_chunks=best_chunks,
        latency_ms=latency,
    )


async def run_search(q: ProcessedQuery, *, use_rerank: bool | None = None) -> SearchResult:
    return await finalize(await retrieve(q), use_rerank=use_rerank)
