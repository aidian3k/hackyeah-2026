"""Reranking kandydatów po fuzji i bramka „nie wiem”.

Bramka działa także bez rerankera (noop → score None → źródło "cosine",
próg MIN_COSINE_SCORE). KNOWLEDGE nie przechodzi przez reranker.
`ProviderError` z rerankera jest propagowany (czat zamienia go na zdarzenie `error`).
"""

from __future__ import annotations

from dataclasses import dataclass, replace

from api.cards import SolutionRow
from api.config import settings
from api.pipeline.types import FusedCandidate, GateDecision
from api.providers.base import RerankProvider


@dataclass
class RerankOutcome:
    reranked: list[FusedCandidate]  # po reranku (rerank_score ustawione lub None), przed filtrem
    top: list[FusedCandidate]
    also_see: list[FusedCandidate]
    gate: GateDecision


def rerank_document(row: SolutionRow, chunk_content: str) -> str:
    """`title\\nsummary\\nnajlepszy chunk`, obcięte do RERANK_DOC_CHARS (bez całego body)."""
    s = row.solution
    parts = [s.title or "", s.summary or "", chunk_content or ""]
    return "\n".join(parts)[: settings.RERANK_DOC_CHARS]


def _gate(
    fused: list[FusedCandidate], reranked: list[FusedCandidate]
) -> tuple[float | None, float, str]:
    if reranked and reranked[0].rerank_score is not None:  # reranker aktywny
        return reranked[0].rerank_score, settings.MIN_RERANK_SCORE, "rerank"
    # noop: score None — porównanie None z progiem rzuciłoby TypeError.
    sims = [c.cosine_similarity for c in fused if c.cosine_similarity is not None]
    return (max(sims) if sims else None), settings.MIN_COSINE_SCORE, "cosine"


def _position_passes(c: FusedCandidate, source: str, threshold: float) -> bool:
    value = c.rerank_score if source == "rerank" else c.cosine_similarity
    return value is not None and value >= threshold


async def rerank_and_gate(
    query: str,
    fused: list[FusedCandidate],
    docs: dict[int, str],
    provider: RerankProvider,
) -> RerankOutcome:
    """`fused` już obcięte do RERANK_TOP_N; `docs`: solution_id -> tekst dokumentu."""
    keep_n = settings.ANSWER_TOP_N + settings.ALSO_SEE_N
    reranked: list[FusedCandidate] = []
    if fused:
        documents = [docs.get(c.solution_id, "") for c in fused]
        results = await provider.rerank(query, documents, top_n=keep_n)
        reranked = [replace(fused[r.index], rerank_score=r.score) for r in results]

    score, threshold, source = _gate(fused, reranked)
    passed = score is not None and score >= threshold
    gate = GateDecision(source=source, score=score, threshold=threshold, passed=passed)

    if not passed:
        return RerankOutcome(reranked=reranked, top=[], also_see=[], gate=gate)

    kept = [c for c in reranked if _position_passes(c, source, threshold)]
    top = kept[: settings.ANSWER_TOP_N]
    also_see = kept[settings.ANSWER_TOP_N : keep_n]
    return RerankOutcome(reranked=reranked, top=top, also_see=also_see, gate=gate)
