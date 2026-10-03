"""Fuzja RRF: łączy listy z torów wyłącznie po pozycjach (bez surowych score'ów).

RRF(d) = Σ_m 1 / (k + rank_m(d)), k = RRF_K. Remis → solution_id rosnąco.
"""

from __future__ import annotations

from collections import defaultdict

from api.config import settings
from api.pipeline.types import Candidate, FusedCandidate


def rrf_fuse(
    tracks: dict[str, list[Candidate]],
    k: int | None = None,
    top_n: int | None = None,
) -> list[FusedCandidate]:
    """Tory: "lexical", "semantic". Pozycja w torze = indeks na liście (1-indeksowany)."""
    if k is None:
        k = settings.RRF_K
    if top_n is None:
        top_n = settings.RERANK_TOP_N

    scores: dict[int, float] = defaultdict(float)
    ranks: dict[int, dict[str, int]] = defaultdict(dict)
    chunks: dict[int, int] = {}
    cosines: dict[int, float] = {}

    for track_name, candidates in tracks.items():
        for rank, cand in enumerate(candidates, start=1):
            sid = cand.solution_id
            if track_name in ranks[sid]:
                continue  # duplikat w torze — liczy się najlepsza pozycja
            scores[sid] += 1.0 / (k + rank)
            ranks[sid][track_name] = rank
            if track_name == "semantic" and cand.cosine_similarity is not None:
                cosines[sid] = cand.cosine_similarity
            # chunk z toru wektorowego preferowany jako kontekst dla rerankera
            if sid not in chunks or track_name == "semantic":
                chunks[sid] = cand.chunk_id

    ordered = sorted(scores.items(), key=lambda kv: (-kv[1], kv[0]))
    return [
        FusedCandidate(
            solution_id=sid,
            chunk_id=chunks[sid],
            rrf_score=score,
            ranks=dict(ranks[sid]),
            cosine_similarity=cosines.get(sid),  # None, gdy tylko z toru leksykalnego
        )
        for sid, score in ordered[: max(top_n, 0)]
    ]
