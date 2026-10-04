"""Konfiguracja Modułu 1 (sekcja 11 specyfikacji). Jedyne źródło progów i limitów."""

from __future__ import annotations

from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Połączenie ---
    DATABASE_URL: str = "postgresql+asyncpg://splot:splot@localhost:5432/splot"

    # --- Klucze dostawców ---
    OPENAI_API_KEY: str = ""
    COHERE_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    # --- Embeddingi (ADR-004, ADR-015) ---
    # "openai" = jedyna implementacja produkcyjna; "hash" = tryb deweloperski bez kluczy.
    EMBEDDING_PROVIDER: Literal["openai", "hash"] = "openai"
    EMBEDDING_MODEL: str = "text-embedding-3-large"
    EMBEDDING_DIM: int = 1024
    EMBEDDING_BATCH_SIZE: int = 64
    EMBEDDING_QUERY_PREFIX: str = ""
    EMBEDDING_PASSAGE_PREFIX: str = ""

    # --- Reranking ---
    RERANK_PROVIDER: Literal["cohere", "noop"] = "cohere"
    RERANK_MODEL: str = "rerank-v3.5"
    RERANK_ENABLED: bool = True

    # --- Pipeline ---
    RRF_K: int = 60
    CANDIDATES_PER_TRACK: int = 20
    VECTOR_OVERFETCH: int = 60
    RERANK_TOP_N: int = 10
    ANSWER_TOP_N: int = 3
    ALSO_SEE_N: int = 5
    MIN_RERANK_SCORE: float = 0.35
    MIN_COSINE_SCORE: float = 0.50
    KNOWLEDGE_TOP_N: int = 2

    # --- Zgłoszenia ---
    SIMILAR_REPORT_THRESHOLD: float = 0.82
    SIMILAR_REPORTS_LIMIT: int = 20
    SAVE_WAIT_SECONDS: float = 2.0

    # --- Generacja (LLM, ADR-020) ---
    LLM_ENABLED: bool = True
    # "openai" (domyślnie, ten sam klucz co embeddingi) | "anthropic" (alternatywa).
    LLM_PROVIDER: Literal["openai", "anthropic"] = "openai"
    OPENAI_LLM_MODEL: str = "gpt-6-luna"
    # Tokeny rozumowania wliczają się do limitu wyjścia — "none" dla krótkich zadań.
    OPENAI_LLM_REASONING_EFFORT: Literal["none", "low", "medium", "high", "xhigh", "max"] = "none"
    # Model Anthropic — używany tylko przy LLM_PROVIDER=anthropic.
    LLM_MODEL: str = "claude-haiku-4-5-20251001"
    LLM_MAX_TOKENS: int = 400

    # --- Przetwarzanie zapytania ---
    MAX_QUERY_CHARS: int = 2000
    VAGUE_MIN_WORDS: int = 4
    MAX_TSQUERY_TERMS: int = 15
    RERANK_DOC_CHARS: int = 2000
    ANSWER_FRAGMENT_CHARS: int = 800

    # --- Chunkowanie ---
    CHUNK_TARGET_CHARS: int = 1200
    CHUNK_OVERLAP_CHARS: int = 150
    CHUNK_MIN_BODY_CHARS: int = 400

    # --- HTTP ---
    CORS_ORIGINS: str = "http://localhost:5173"
    SEARCH_ENDPOINT_ENABLED: bool = True

    # --- Moduł 2: Zasobnik wiedzy ---
    CHALLENGE_TOP_SOLUTIONS: int = 6
    CHALLENGE_TOP_KNOWLEDGE: int = 6
    COVERAGE_GAP_MIN_UNMATCHED: int = 3
    COVERAGE_GAP_MAX_SOLUTIONS: int = 5
    ROPS_GROUP_TAG_PREFIX: str = "ROPS: "

    # --- Różne ---
    DATA_DIR: str = "data"
    LOG_LEVEL: str = "INFO"

    # --- Moduł 4: Tester innowacji ---
    M4_AI_ENABLED: bool = False
    M4_AI_PROMPT_VERSION: str = "m4-report-v1"
    M4_AI_FIT_PROMPT_VERSION: str = "m4-fit-v3"
    M4_AI_MAX_TOKENS: int = 1200
    M4_SMALL_SAMPLE_THRESHOLD: int = 3
    M4_MAX_ACTIVE_APPLICATIONS: int = 3
    M4_MOTIVATION_MAX_CHARS: int = 4000
    M4_COMMENT_MAX_CHARS: int = 4000
    M4_REPORT_FEEDBACK_MAX: int = 100

    # --- Moduł 3 — Kreator pomysłów ---
    M3_ASSIST_ENABLED: bool = True
    M3_ASSIST_MAX_TOKENS: int = 1500
    M3_ASSIST_DRAFT_MAX_TOKENS: int = 2500
    M3_ASSIST_TIMEOUT_SECONDS: float = 30.0
    M3_ASSIST_MAX_QUESTIONS: int = 3
    M3_ASSIST_MAX_SUGGESTIONS: int = 5
    IDEA_SIMILAR_LIMIT: int = 3
    CANVAS_LIST_MAX_ITEMS: int = 12
    CANVAS_ITEM_MAX_CHARS: int = 300
    CANVAS_TEXT_MAX_CHARS: int = 2000
    CANVAS_PARTNERS_MAX: int = 15
    APPLICATION_TEXT_MAX_CHARS: int = 6000
    APPLICATION_BUDGET_MAX_ROWS: int = 30
    KREATOR_CALLS_IGNORE_DATES: bool = False

    # --- Moduł 5: Platforma komunikacji ---
    M5_ASSISTANT_ENABLED: bool = True  # automatyczna odpowiedź na pytanie (QUESTION)
    M5_ASSISTANT_TIMEOUT_SECONDS: float = 30.0
    PARTNER_MATCH_N: int = 5

    # --- Moduł 6: Panel administratora ---
    ADMIN_LIST_DEFAULT_LIMIT: int = 25
    ADMIN_LIST_MAX_LIMIT: int = 100

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def llm_model(self) -> str:
        """Model aktywnego dostawcy LLM."""
        return self.OPENAI_LLM_MODEL if self.LLM_PROVIDER == "openai" else self.LLM_MODEL

    @property
    def llm_api_key(self) -> str:
        """Klucz aktywnego dostawcy LLM (pusty = LLM niedostępny)."""
        return self.OPENAI_API_KEY if self.LLM_PROVIDER == "openai" else self.ANTHROPIC_API_KEY

    @model_validator(mode="after")
    def _check_invariants(self) -> Settings:
        if self.EMBEDDING_DIM != 1024:
            raise ValueError("EMBEDDING_DIM musi wynosić 1024 (ADR-004)")
        if self.ANSWER_TOP_N + self.ALSO_SEE_N > self.RERANK_TOP_N:
            raise ValueError("ANSWER_TOP_N + ALSO_SEE_N nie może przekraczać RERANK_TOP_N")
        return self


settings = Settings()
