"""Typy pipeline'u wyszukiwania — kontrakt wspólny (T08, „Wspólne kontrakty”)."""

from __future__ import annotations

from dataclasses import dataclass, field

from api.schemas import SolutionCard


@dataclass
class ProcessedQuery:
    raw: str  # dosłownie, idzie do reports.raw_text
    normalized: str  # do embeddingu i tsquery
    gmina: str | None  # z żądania (lista wyboru), nie z tekstu
    powiat: str | None  # wyliczony z gminy (data/gminy-malopolska.json)
    category: str | None  # kod z challenge_taxonomy
    target_group: str | None
    identifiers: list[str] = field(default_factory=list)  # nazwy własne, akronimy, numery uchwał
    expanded_terms: list[str] = field(default_factory=list)  # synonimy domenowe (tylko leksykalny)
    too_vague: bool = False


@dataclass
class Candidate:
    solution_id: int
    chunk_id: int
    rank: int  # 1-indeksowana pozycja w torze
    score: float | None = None  # ts_rank_cd (leksykalny) albo None
    cosine_similarity: float | None = None  # tylko tor semantyczny / wiedza


@dataclass
class FusedCandidate:
    solution_id: int
    chunk_id: int
    rrf_score: float
    ranks: dict[str, int]  # {"lexical": 1, "semantic": 4}
    cosine_similarity: float | None = None
    rerank_score: float | None = None  # uzupełnia T14


@dataclass
class GateDecision:
    source: str  # "rerank" | "cosine"
    score: float | None
    threshold: float
    passed: bool


@dataclass
class RetrievalResult:
    query: ProcessedQuery
    query_vec: list[float]
    lexical: list[Candidate]
    semantic: list[Candidate]
    knowledge: list[Candidate]
    fused: list[FusedCandidate]  # po uzupełnieniu cosinusa
    latency_ms: dict[str, int]  # embed, lexical, semantic, knowledge, fusion


@dataclass
class SearchResult:
    retrieval: RetrievalResult
    reranked: list[FusedCandidate]  # po reranku, przed bramką per pozycja
    gate: GateDecision
    solutions: list[SolutionCard]  # karty główne (≤ ANSWER_TOP_N), rank 1..n
    also_see: list[SolutionCard]  # rank kontynuuje listę główną
    context: list[SolutionCard]  # kind = KNOWLEDGE
    best_chunks: dict[int, str]  # solution_id -> treść najlepszego chunku (do promptu)
    latency_ms: dict[str, int]  # retrieval + "rerank"

    @property
    def matched(self) -> bool:
        return self.gate.passed and bool(self.solutions)


@dataclass
class SaveResult:
    report_id: int
    similar_count: int
    gmina_count: int
    search_event_id: int | None
