"""`GET /api/search` — diagnostyka hybrydy (bez LLM, bez zapisu zgłoszenia i `search_events`).

Narzędzie do ręcznego ustawiania progów i pokazania jury, nie źródło kart dla frontendu.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query

from api.cards import load_solutions
from api.config import settings
from api.db import SessionLocal
from api.errors import ApiError
from api.pipeline.lexical import build_tsquery
from api.pipeline.orchestrator import finalize, retrieve
from api.pipeline.preprocess import UnknownGminaError, preprocess
from api.providers import ProviderError

router = APIRouter(prefix="/api", tags=["search"])

_UNAVAILABLE_PL = "Wyszukiwanie jest chwilowo niedostępne. Spróbuj ponownie za chwilę."


@router.get("/search")
async def search(
    q: str = Query(..., min_length=1, max_length=10_000),
    rerank: bool = True,
    gmina: str | None = None,
) -> dict[str, Any]:
    if not settings.SEARCH_ENDPOINT_ENABLED:
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono.")
    if not q.strip():
        raise ApiError(422, "VALIDATION_ERROR", "q: zapytanie nie może być puste.")
    try:
        pq = preprocess(q, gmina)
    except UnknownGminaError as exc:
        raise ApiError(422, "VALIDATION_ERROR", f"gmina: nieznana gmina {exc.gmina!r}.") from exc

    try:
        r = await retrieve(pq)
        result = await finalize(r, use_rerank=rerank)
    except ProviderError as exc:
        raise ApiError(503, exc.code, _UNAVAILABLE_PL) from exc

    ids = {c.solution_id for c in r.lexical + r.semantic + r.knowledge}
    async with SessionLocal() as s:
        rows = await load_solutions(s, ids)

    def title(sid: int) -> str | None:
        row = rows.get(sid)
        return row.solution.title if row is not None else None

    gate = result.gate
    return {
        "normalized_query": pq.normalized,
        "extracted": {
            "category": pq.category,
            "target_group": pq.target_group,
            "identifiers": pq.identifiers,
            "too_vague": pq.too_vague,
            "expanded_terms": pq.expanded_terms,
        },
        "tsquery": build_tsquery(pq),
        "lexical": [
            {
                "solution_id": c.solution_id,
                "title": title(c.solution_id),
                "rank": c.rank,
                "score": c.score,
            }
            for c in r.lexical
        ],
        "semantic": [
            {
                "solution_id": c.solution_id,
                "title": title(c.solution_id),
                "rank": c.rank,
                "cosine_similarity": c.cosine_similarity,
            }
            for c in r.semantic
        ],
        "fused": [
            {
                "solution_id": c.solution_id,
                "rrf": c.rrf_score,
                "ranks": c.ranks,
                "cosine": c.cosine_similarity,
            }
            for c in r.fused
        ],
        "reranked": [
            {"solution_id": c.solution_id, "score": c.rerank_score} for c in result.reranked
        ],
        "knowledge": [
            {
                "solution_id": c.solution_id,
                "title": title(c.solution_id),
                "cosine_similarity": c.cosine_similarity,
            }
            for c in r.knowledge
        ],
        "gate": {
            "source": gate.source,
            "score": gate.score,
            "threshold": gate.threshold,
            "passed": gate.passed,
        },
        "solutions": [c.id for c in result.solutions],
        "also_see": [c.id for c in result.also_see],
        "latency_ms": result.latency_ms,
    }
