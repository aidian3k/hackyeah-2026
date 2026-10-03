# Moduł 1 — plan implementacji i zadania

Plan na podstawie `docs/modules/01-matchmaking/module-1-matchmaking.html` (v0.5). Każde zadanie jest samowystarczalne: zawiera cel, pliki, wklejony kontekst ze specyfikacji, kroki i kryterium gotowości. Agent wykonujący zadanie **nie musi czytać specyfikacji HTML** — ale musi przeczytać `AGENTS.md` (twarde reguły) oraz sekcję „Wspólne kontrakty” poniżej.

**Odstępstwa od specyfikacji (decyzja zespołu, 2026-10-03):**
- **Bez autoryzacji.** Nie implementujemy tokenu STAFF, `report_token`, nagłówków `X-Access-Token` / `X-Report-Token`, kodów 401/403 ani `api/auth.py`. Wszystkie endpointy są otwarte. Kolumna `reports.report_token_hash` i pole `report_token` w zdarzeniu `report_saved` są usunięte.
- **Bez testów automatycznych.** Nie tworzymy `tests/`, pytest, fixture'ów ani fake providerów. Weryfikacja każdego zadania: curl, psql, `python -c`, ręczne uruchomienie.

Specyfikacja HTML nadal opisuje auth i testy — w tych dwóch punktach ten plik ma pierwszeństwo.

## Protokół pracy (obowiązkowy)

1. **Jedyne źródło statusu** to lista „Status zadań” poniżej. Treść zadań nie zawiera statusu.
2. Stany:
   - `- [ ]` — wolne,
   - `- [~]` — w toku; dopisz na końcu linii ` — agent: <nazwa>, <RRRR-MM-DD GG:MM>`,
   - `- [x]` — zrobione; zamień dopisek na ` — zrobione: <nazwa>, <krótka notka lub hash commita>`.
3. **Branie zadania:** wybierz zadanie `[ ]`, którego wszystkie zależności są `[x]`. Edytuj tylko jego linię na `[~]`, potem przeczytaj plik ponownie i sprawdź, czy linia nadal ma Twój dopisek (jeśli ktoś był szybszy — weź inne zadanie).
4. Edytuj w tym pliku **wyłącznie linię swojego zadania** oraz (ewentualnie) dopisuj na końcu sekcji „Uwagi między zadaniami”. Nie przepisuj innych linii, nie formatuj pliku.
5. Zmieniaj w repozytorium **tylko pliki wymienione w polu „Pliki” swojego zadania**. Potrzebujesz zmiany w cudzym pliku → wpis w „Uwagach między zadaniami” (`- [Txx → Tyy] opis`), nie edycja.
6. `[x]` dopiero, gdy spełnione jest „Gotowe, gdy” (ręczna weryfikacja opisana w zadaniu) i `ruff check .` jest czysty dla Twoich plików.
7. Zablokowany (brak klucza API, błąd w zależności, sprzeczność ze specyfikacją) → przywróć `[ ]` i opisz przyczynę w „Uwagach między zadaniami”.
8. Sygnatury z sekcji „Wspólne kontrakty” są wiążące. Jeśli musisz je zmienić — najpierw wpis w „Uwagach”, nie cicha zmiana.

## Status zadań

- [x] T00 · Szkielet projektu, docker-compose, Makefile, `api/config.py` · zależy: — — zrobione: orch-T00, baza healthy, venv 3.12
- [x] T01 · `db/init.sql` (rozszerzenia, polish_simple, tabele, seed taksonomii) · zależy: T00 — zrobione: orch-T01T02
- [x] T02 · `api/db.py` + `api/models.py` · zależy: T01 — zrobione: orch-T01T02
- [x] T03 · Słowniki w `data/` (taksonomia, gminy, synonimy, stopwords, słowa kluczowe kategorii) · zależy: — — zrobione: orch-T03, 183 gminy (Szczawa od 2025, patrz Uwagi)
- [x] T04 · `data/solutions/seed-demo.json` (rozwiązania + wiedza) · zależy: — — zrobione: orch-T04, 40 SOLUTION + 7 KNOWLEDGE
- [x] T05 · Providery: embeddingi, rerank, LLM · zależy: T00 — zrobione: orch-T05, + dev provider hash; klucze niezweryfikowane
- [x] T06 · `api/chunking.py` + `api/corpus.py` (chunkowanie, hash, zapis z embeddingami) · zależy: T02, T05 — zrobione: orch-T06T07, seed 47 rek. / 122 chunki
- [x] T07 · `scripts/ingest.py` (idempotentny ingest) · zależy: T04, T06 — zrobione: orch-T06T07, seed 47 rek. / 122 chunki
- [x] T08 · Kontrakty: `api/schemas.py`, `api/pipeline/types.py`, `api/pipeline/text.py`, `api/cards.py` · zależy: T02 — zrobione: orch-T08
- [x] T09 · Mocki strumieni SSE dla frontendu (`docs/mocks/`) · zależy: T08 — zrobione: orch-T09
- [x] T10 · `api/pipeline/preprocess.py` · zależy: T03, T08 — zrobione: orch-T10T11
- [x] T11 · `api/pipeline/lexical.py` (tor leksykalny) · zależy: T03, T08 — zrobione: orch-T10T11
- [x] T12 · `api/pipeline/semantic.py` (tor semantyczny, wiedza, uzupełnienie cosinusa) · zależy: T08 — zrobione: orch-T12T13T14
- [x] T13 · `api/pipeline/fusion.py` (RRF) · zależy: T08 — zrobione: orch-T12T13T14
- [x] T14 · `api/pipeline/rerank.py` (reranking + bramka) · zależy: T05, T13 — zrobione: orch-T12T13T14
- [x] T15 · `api/main.py`, `errors.py`, `log.py`, `tasks.py`, stuby routerów · zależy: T02, T08 — zrobione: orch-T15
- [x] T16 · `api/pipeline/orchestrator.py` + `GET /api/search` · zależy: T10, T11, T12, T14, T15 — zrobione: orch-T16T19
- [x] T17 · `api/pipeline/answer.py` (generacja RAG + filtr cytowań) · zależy: T05, T08 — zrobione: orch-T17
- [x] T18 · `api/pipeline/reports.py` (zapis zgłoszenia, licznik podobnych, search_events) · zależy: T08 — zrobione: orch-T18
- [x] T19 · `POST /api/chat` (SSE) · zależy: T16, T17, T18 — zrobione: orch-T16T19
- [x] T20 · Endpointy zgłoszeń i odpowiedzi (`/api/reports…`) · zależy: T15, T18 — zrobione: orch-T20
- [x] T21 · Endpointy rozwiązań (`/api/solutions…`) · zależy: T06, T15 — zrobione: orch-T21
- [x] T22 · `GET /api/inbox`, `GET /api/stats` · zależy: T15 — zrobione: orch-T22T23
- [x] T23 · `GET /api/taxonomy`, `GET /api/gminy`, `POST /api/feedback`, `GET /healthz` · zależy: T03, T15 — zrobione: orch-T22T23
- [x] T24 · Seed zgłoszeń demo + `scripts/seed_reports.py` · zależy: T07, T19 — zrobione: orch-T24T25, 15 zgłoszeń seed
- [x] T25 · Kalibracja progów i próba generalna ścieżki demo · zależy: T20, T21, T22, T23, T24, T26 — zrobione: orch-T24T25, kalibracja tylko tryb hash (OpenAI do powtórzenia)
- [x] T26 · Scraper Biblioteki Innowacji Społecznych ROPS → `data/solutions/rops-biblioteka.json` · zależy: T00, T03 — zrobione: orch-T26, 115 rekordów, cache deterministyczny

### Fale równoległości (orientacyjnie)

- Fala 0: T00, T03, T04
- Fala 1: T01, T05, T26
- Fala 2: T02
- Fala 3: T06, T08
- Fala 4: T07, T09, T10, T11, T12, T13, T15, T17, T18
- Fala 5: T14, T20, T21, T22, T23
- Fala 6: T16 → T19 → T24 → T25

**Najkrótsza działająca ścieżka** (gdy brakuje czasu): T00–T08, T10–T16, T18, T19 z `RERANK_ENABLED=false` i `LLM_ENABLED=false` — `/api/chat` zwraca wtedy karty, wiedzę i licznik podobnych. T17 (LLM) i endpointy panelu dochodzą na wierzch.

---

## Wspólne kontrakty (wiążące dla wszystkich zadań)

### Konwencje

- Pakiety: `api`, `api.routers`, `api.pipeline`, `api.providers`, `scripts` (każdy z `__init__.py`; T00 tworzy wszystkie puste `__init__.py` od razu).
- Importy absolutne: `from api.config import settings`.
- Kod async wszędzie, gdzie jest I/O.
- Dane domenowe w `data/`, ścieżka przez `Path(settings.DATA_DIR)` (domyślnie `data`, względem katalogu repozytorium).
- Ręczne sprawdzenia funkcji bez endpointu: `python -c "import asyncio; from api.pipeline.x import f; print(asyncio.run(f(...)))"`.

### Nazwy i sygnatury, z których korzystają inne zadania

| Symbol | Moduł | Właściciel |
|---|---|---|
| `settings` (instancja `Settings`) | `api/config.py` | T00 |
| `engine`, `SessionLocal` (async_sessionmaker), `get_session()` (zależność FastAPI, `AsyncIterator[AsyncSession]`), `to_pgvector(vec: list[float]) -> str` | `api/db.py` | T02 |
| Modele `Taxonomy`, `Solution`, `SolutionChunk`, `Report`, `SearchEvent`, `ReportReply` + enumy | `api/models.py` | T02 |
| `EmbeddingProvider`, `RerankProvider`, `LLMProvider`, `RerankResult`, `ProviderError` | `api/providers/base.py` | T05 |
| `get_embedding_provider()`, `get_rerank_provider()`, `get_llm_provider()` | `api/providers/__init__.py` | T05 |
| `chunk_solution(title, summary, body) -> list[ChunkDraft]`, `passage_text(title, chunk) -> str` | `api/chunking.py` | T06 |
| `content_hash(title, summary, body) -> str`, `async rebuild_chunks(session, solution, provider) -> int` | `api/corpus.py` | T06 |
| `ProcessedQuery`, `Candidate`, `FusedCandidate`, `GateDecision`, `RetrievalResult`, `SearchResult`, `SaveResult` | `api/pipeline/types.py` | T08 |
| `tokenize(text) -> list[str]`, `strip_accents(text) -> str`, `stopwords() -> frozenset[str]` | `api/pipeline/text.py` | T08 |
| `SolutionCard`, `Scores`, `SolutionDetail`, `ChatRequest`, `ErrorBody` i inne modele API | `api/schemas.py` | T08 |
| `async load_solutions(session, ids) -> dict[int, SolutionRow]`, `to_card(row, *, rank, scores=None) -> SolutionCard`, `to_detail(row)` | `api/cards.py` | T08 |
| `ApiError(status, code, message)` + handler | `api/errors.py` | T15 |
| `spawn(coro) -> asyncio.Task` | `api/tasks.py` | T15 |
| `preprocess(message, gmina) -> ProcessedQuery`, `GMINY: dict[str, str]`, `UnknownGminaError` | `api/pipeline/preprocess.py` | T10 |
| `build_tsquery(q) -> str \| None`, `async lexical_search(session, q) -> list[Candidate]` | `api/pipeline/lexical.py` | T11 |
| `async semantic_search(session, vec, kind="SOLUTION") -> list[Candidate]`, `async knowledge_search(session, vec) -> list[Candidate]`, `async backfill_cosine(session, vec, chunk_ids) -> dict[int, float]` | `api/pipeline/semantic.py` | T12 |
| `rrf_fuse(tracks, k, top_n) -> list[FusedCandidate]` | `api/pipeline/fusion.py` | T13 |
| `rerank_document(row, chunk_content) -> str`, `async rerank_and_gate(query, fused, docs, provider) -> RerankOutcome` | `api/pipeline/rerank.py` | T14 |
| `async retrieve(q) -> RetrievalResult`, `async finalize(r, *, use_rerank=None) -> SearchResult`, `async run_search(q, *, use_rerank=None) -> SearchResult` | `api/pipeline/orchestrator.py` | T16 |
| `CitationFilter`, `build_context(...)`, `async generate(...) -> AsyncIterator[str]` | `api/pipeline/answer.py` | T17 |
| `async save_report_and_event(...) -> SaveResult`, `async update_search_event(...)`, `async find_similar_reports(session, report_id, limit)` | `api/pipeline/reports.py` | T18 |

### Typy pipeline'u (`api/pipeline/types.py`, tworzy T08 — dokładnie tak)

```python
from __future__ import annotations
from dataclasses import dataclass, field
from api.schemas import SolutionCard

@dataclass
class ProcessedQuery:
    raw: str                      # dosłownie, idzie do reports.raw_text
    normalized: str               # do embeddingu i tsquery
    gmina: str | None             # z żądania (lista wyboru), nie z tekstu
    powiat: str | None            # wyliczony z gminy (data/gminy-malopolska.json)
    category: str | None          # kod z challenge_taxonomy
    target_group: str | None
    identifiers: list[str] = field(default_factory=list)     # nazwy własne, akronimy, numery uchwał
    expanded_terms: list[str] = field(default_factory=list)  # synonimy domenowe (tylko tor leksykalny)
    too_vague: bool = False

@dataclass
class Candidate:
    solution_id: int
    chunk_id: int
    rank: int                                  # 1-indeksowana pozycja w torze
    score: float | None = None                 # ts_rank_cd (leksykalny) albo None
    cosine_similarity: float | None = None     # tylko tor semantyczny / wiedza

@dataclass
class FusedCandidate:
    solution_id: int
    chunk_id: int
    rrf_score: float
    ranks: dict[str, int]                      # {"lexical": 1, "semantic": 4}
    cosine_similarity: float | None = None
    rerank_score: float | None = None          # uzupełnia T14

@dataclass
class GateDecision:
    source: str                                # "rerank" | "cosine"
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
    fused: list[FusedCandidate]                # po uzupełnieniu cosinusa
    latency_ms: dict[str, int]                 # embed, lexical, semantic, knowledge, fusion

@dataclass
class SearchResult:
    retrieval: RetrievalResult
    reranked: list[FusedCandidate]             # po reranku, przed bramką per pozycja
    gate: GateDecision
    solutions: list[SolutionCard]              # karty główne (≤ ANSWER_TOP_N), rank 1..n
    also_see: list[SolutionCard]               # rank kontynuuje listę główną
    context: list[SolutionCard]                # kind = KNOWLEDGE
    best_chunks: dict[int, str]                # solution_id -> treść najlepszego chunku (do promptu)
    latency_ms: dict[str, int]                 # retrieval + "rerank"

    @property
    def matched(self) -> bool:
        return self.gate.passed and bool(self.solutions)

@dataclass
class SaveResult:
    report_id: int
    similar_count: int
    gmina_count: int
    search_event_id: int | None
```

### Model danych (skrót — pełny DDL w T01)

6 tabel: `challenge_taxonomy`, `solutions`, `solution_chunks`, `reports`, `search_events`, `report_replies`. Enumy: `solution_kind (SOLUTION, KNOWLEDGE)`, `solution_origin (CURATED, USER_SUBMITTED, PROMOTED_FROM_REPORT)`, `solution_status (PUBLISHED, PENDING_REVIEW, REJECTED, ARCHIVED)`, `report_status (NEW, TRIAGED, MATCHED, IN_PROGRESS, CLOSED)`, `reporter_type (RESIDENT, NGO, JST, OTHER)`.

### Taksonomia (kody)

| Kod | Etykieta |
|---|---|
| AGING | Starzenie się społeczeństwa |
| MENTAL_HEALTH | Kryzys zdrowia psychicznego |
| LONELINESS | Samotność i izolacja społeczna |
| DIGITAL_EXCLUSION | Wykluczenie cyfrowe |
| SERVICE_ACCESS | Ograniczony dostęp do usług społecznych |
| COORDINATION | Brak koordynacji działań i współpracy międzysektorowej |
| DEPOPULATION | Depopulacja obszarów regionu |
| SUBURBAN_GROWTH | Gwałtowny wzrost ludności gmin okołokrakowskich |
| OTHER | Poza taksonomią — do przeglądu przez operatora |

### Konfiguracja (wszystkie zmienne, `api/config.py`)

| Zmienna | Domyślna | Znaczenie |
|---|---|---|
| DATABASE_URL | `postgresql+asyncpg://splot:splot@localhost:5432/splot` | Połączenie |
| OPENAI_API_KEY / COHERE_API_KEY / ANTHROPIC_API_KEY | (puste) | Klucze dostawców |
| EMBEDDING_PROVIDER | `openai` | Jedyna implementacja w PoC |
| EMBEDDING_MODEL | `text-embedding-3-large` | Wywoływany z `dimensions=1024` |
| EMBEDDING_DIM | `1024` | Nie zmieniaj (ADR-004) |
| EMBEDDING_BATCH_SIZE | `64` | Partia w ingeście |
| EMBEDDING_QUERY_PREFIX | `""` | `query: ` tylko dla E5 |
| EMBEDDING_PASSAGE_PREFIX | `""` | `passage: ` tylko dla E5 |
| RERANK_PROVIDER | `cohere` | `cohere` \| `noop` |
| RERANK_MODEL | `rerank-v3.5` | Model Cohere |
| RERANK_ENABLED | `true` | `false` ⇒ kolejność RRF ostateczna |
| RRF_K | `60` | Stała fuzji |
| CANDIDATES_PER_TRACK | `20` | Wielkość listy z każdego toru |
| VECTOR_OVERFETCH | `60` | Chunki przed kolapsem per rozwiązanie |
| RERANK_TOP_N | `10` | Kandydaci po fuzji do rerankera |
| ANSWER_TOP_N | `3` | Karty główne |
| ALSO_SEE_N | `5` | „Zobacz też”; `ANSWER_TOP_N + ALSO_SEE_N <= RERANK_TOP_N` (walidator) |
| MIN_RERANK_SCORE | `0.35` | Próg bramki z rerankerem |
| MIN_COSINE_SCORE | `0.50` | Próg bramki bez rerankera + próg wiedzy |
| KNOWLEDGE_TOP_N | `2` | Maks. wpisów w `context`; 0 wyłącza |
| SIMILAR_REPORT_THRESHOLD | `0.82` | Cosinus podobnych zgłoszeń |
| SIMILAR_REPORTS_LIMIT | `20` | Limit `GET /api/reports/{id}/similar` |
| SAVE_WAIT_SECONDS | `2.0` | Ile strumień czeka na zapis przed `report_saved` |
| LLM_ENABLED | `true` | `false` ⇒ same karty |
| LLM_MODEL | `claude-haiku-4-5-20251001` | Model streszczenia |
| LLM_MAX_TOKENS | `400` | Limit wyjścia |
| MAX_QUERY_CHARS | `2000` | Obcięcie zapytania |
| VAGUE_MIN_WORDS | `4` | Próg `too_vague` |
| MAX_TSQUERY_TERMS | `15` | Limit słów w tsquery |
| RERANK_DOC_CHARS | `2000` | Obcięcie dokumentu dla rerankera |
| CHUNK_TARGET_CHARS / CHUNK_OVERLAP_CHARS / CHUNK_MIN_BODY_CHARS | `1200` / `150` / `400` | Chunkowanie |
| CORS_ORIGINS | `http://localhost:5173` | Lista po przecinku |
| SEARCH_ENDPOINT_ENABLED | `true` | `false` wyłącza `/api/search` (treść zapytania w URL) |
| DATA_DIR | `data` | Katalog słowników |
| LOG_LEVEL | `INFO` | |

### Format błędów i nagłówki

- Błąd: HTTP status + `{"error": {"code": "SOME_CODE", "message": "..."}}`. Walidacja (422) też w tym formacie, `code = "VALIDATION_ERROR"`.
- Każda odpowiedź ma nagłówek `X-Request-Id` (z żądania, jeśli przyszedł, inaczej nowy UUID4).
- Brak nagłówków autoryzacyjnych — wszystkie endpointy otwarte.

### SolutionCard (jeden kształt w całym API)

```json
{
  "id": 142,
  "kind": "SOLUTION",
  "rank": 1,
  "title": "Telefon Życzliwości dla seniorów",
  "summary": "Codzienne rozmowy telefoniczne wolontariuszy z osobami 65+...",
  "organization": "Fundacja Wspólna Sprawa",
  "gmina": "Wieliczka",
  "powiat": "wielicki",
  "category": "LONELINESS",
  "category_label_pl": "Samotność i izolacja społeczna",
  "tags": ["seniorzy", "wolontariat", "telefon"],
  "target_group": "osoby 65+",
  "cost_range": "do 10 tys. zł",
  "implementation_steps": ["Rekrutacja wolontariuszy", "Szkolenie", "..."],
  "source_url": "https://...",
  "source_name": "Biblioteka Innowacji Społecznych",
  "evidence_level": 4,
  "media": [{ "type": "video", "url": "https://...", "title": "..." }],
  "origin": "CURATED",
  "scores": { "rerank": 0.91, "rrf": 0.0320, "lex_rank": 1, "vec_rank": 4, "cosine": 0.78 }
}
```
`scores` = `null` poza wynikami wyszukiwania; pola `scores` mogą być `null` pojedynczo. Pole `contact` **nigdy** nie jest zwracane. `GET /api/solutions/{id}` dokłada jedno pole `body`.

---

## T00 — Szkielet projektu

**Zależy od:** —
**Pliki:** `pyproject.toml`, `docker-compose.yml`, `Dockerfile`, `Makefile`, `.env.example`, `.gitignore`, `api/__init__.py`, `api/config.py`, puste `__init__.py` w `api/routers/`, `api/pipeline/`, `api/providers/`, `scripts/`

**Cel:** uruchamialny szkielet: baza w Dockerze, konfiguracja z env, narzędzia dev.

**Kontekst:**
- Trzy komponenty: `api` (Python 3.12 + FastAPI), `db` (PostgreSQL 16 + pgvector + unaccent + pg_trgm, obraz `pgvector/pgvector:pg16`), `scripts` (CLI w tym samym venv).
- Schemat ładuje `db/init.sql` zamontowany do `/docker-entrypoint-initdb.d/` (plik tworzy T01; montuj katalog `./db`).
- Wszystkie zmienne z tabeli „Konfiguracja” we „Wspólnych kontraktach” — `api/config.py` przez `pydantic-settings`, jedna instancja `settings`. Zero literałów progów w kodzie pipeline'u.

**Kroki:**
1. `pyproject.toml`: zależności `fastapi`, `uvicorn[standard]`, `sqlalchemy[asyncio]>=2.0`, `asyncpg`, `pgvector`, `pydantic>=2`, `pydantic-settings`, `openai`, `cohere`, `anthropic`, `httpx`; dev: `ruff`. Ruff: `line-length = 100`, `target-version = "py312"`.
2. `docker-compose.yml`: serwis `db` (`pgvector/pgvector:pg16`, `POSTGRES_USER/PASSWORD/DB = splot`, port 5432, wolumen danych, `./db:/docker-entrypoint-initdb.d:ro`, healthcheck `pg_isready`), serwis `api` (build z `Dockerfile`, `env_file: .env`, `DATABASE_URL` z hostem `db`, port 8000, `depends_on: db: condition: service_healthy`, komenda `uvicorn api.main:app --host 0.0.0.0 --port 8000`).
3. `Dockerfile`: `python:3.12-slim`, instalacja projektu, kopiowanie `api/`, `scripts/`, `data/`.
4. `Makefile`: `up` (`docker compose up -d --build`), `down`, `db` (tylko baza), `dev` (`uvicorn api.main:app --reload`), `ingest` (`python -m scripts.ingest data/solutions/`), `fmt` (`ruff format . && ruff check --fix .`), `psql` (`docker compose exec db psql -U splot splot`), `reset-db` (`docker compose down -v && docker compose up -d db`), `chat` (`curl -N -X POST localhost:8000/api/chat -H 'Content-Type: application/json' -d "{\"message\":\"$(Q)\"}"`).
5. `.env.example`: wszystkie zmienne z tabeli konfiguracji z wartościami domyślnymi i komentarzem.
6. `.gitignore`: `.env`, `.venv/`, `__pycache__/`, `.ruff_cache/`, `.DS_Store`.
7. `api/config.py`: `class Settings(BaseSettings)` z `model_config = SettingsConfigDict(env_file=".env", extra="ignore")`, wszystkie pola z tabeli, właściwość `cors_origins_list`, walidator `ANSWER_TOP_N + ALSO_SEE_N <= RERANK_TOP_N` i `EMBEDDING_DIM == 1024`. `settings = Settings()`.

**Nie rób:** nie twórz `db/init.sql` (T01) ani `api/main.py` (T15). Bez pytest i katalogu `tests/`.

**Gotowe, gdy:** `pip install -e '.[dev]'` działa; `make db` startuje bazę; `python -c "from api.config import settings; print(settings.RRF_K)"` → `60`; `ALSO_SEE_N=20 python -c "from api.config import settings"` → błąd walidacji; `ruff check .` czysto.

---

## T01 — `db/init.sql`

**Zależy od:** T00
**Pliki:** `db/init.sql`

**Cel:** kompletny schemat ładowany przy pierwszym starcie kontenera bazy.

**Kontekst — polska konfiguracja FTS (krytyczne):** PostgreSQL nie ma konfiguracji `polish` w obrazie `pgvector/pgvector:pg16` — `to_tsvector('polish', …)` wywala `text search configuration "polish" does not exist`. Nie używaj `'english'`. Rozwiązanie: `polish_simple` = `simple` (bez stemmingu) + `unaccent`. Kolumna generowana działa, bo dwuargumentowe `to_tsvector(regconfig, text)` jest IMMUTABLE — konfiguracja musi być literałem `'polish_simple'`.

**Kontekst — pełny DDL (wklej w tej kolejności; względem specyfikacji usunięta kolumna `reports.report_token_hash`):**

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TEXT SEARCH CONFIGURATION polish_simple ( COPY = simple );
ALTER TEXT SEARCH CONFIGURATION polish_simple
    ALTER MAPPING FOR word, hword, hword_part, asciiword, asciihword, hword_asciipart
    WITH unaccent, simple;

CREATE TYPE solution_kind   AS ENUM ('SOLUTION', 'KNOWLEDGE');
CREATE TYPE solution_origin AS ENUM ('CURATED', 'USER_SUBMITTED', 'PROMOTED_FROM_REPORT');
CREATE TYPE solution_status AS ENUM ('PUBLISHED', 'PENDING_REVIEW', 'REJECTED', 'ARCHIVED');
CREATE TYPE report_status   AS ENUM ('NEW', 'TRIAGED', 'MATCHED', 'IN_PROGRESS', 'CLOSED');
CREATE TYPE reporter_type   AS ENUM ('RESIDENT', 'NGO', 'JST', 'OTHER');

CREATE TABLE challenge_taxonomy (
    code        TEXT PRIMARY KEY,
    label_pl    TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    sort_order  INT  NOT NULL DEFAULT 100
);

CREATE TABLE solutions (
    id                   BIGSERIAL PRIMARY KEY,
    kind                 solution_kind NOT NULL DEFAULT 'SOLUTION',
    title                TEXT        NOT NULL,
    summary              TEXT        NOT NULL,
    body                 TEXT        NOT NULL DEFAULT '',
    organization         TEXT,
    gmina                TEXT,
    powiat               TEXT,
    category             TEXT        REFERENCES challenge_taxonomy(code),
    tags                 TEXT[]      NOT NULL DEFAULT '{}',
    target_group         TEXT,
    cost_range           TEXT,
    implementation_steps JSONB       NOT NULL DEFAULT '[]',
    contact              JSONB       NOT NULL DEFAULT '{}',
    source_url           TEXT,
    source_name          TEXT,
    media                JSONB       NOT NULL DEFAULT '[]',
    evidence_level       SMALLINT    NOT NULL DEFAULT 1 CHECK (evidence_level BETWEEN 1 AND 5),
    origin               solution_origin NOT NULL DEFAULT 'CURATED',
    status               solution_status NOT NULL DEFAULT 'PUBLISHED',
    content_hash         TEXT        NOT NULL,
    submitted_by_name    TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX solutions_source_url_uq ON solutions (source_url) WHERE source_url IS NOT NULL;
CREATE INDEX solutions_category_idx ON solutions (category);
CREATE INDEX solutions_gmina_idx    ON solutions (gmina);
CREATE INDEX solutions_status_idx   ON solutions (status, kind);
CREATE INDEX solutions_title_trgm   ON solutions USING gin (title gin_trgm_ops);

CREATE TABLE solution_chunks (
    id          BIGSERIAL PRIMARY KEY,
    solution_id BIGINT NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
    chunk_index INT    NOT NULL,
    title       TEXT   NOT NULL,              -- kopia solutions.title (kolumna generowana nie widzi joinów)
    heading     TEXT,
    content     TEXT   NOT NULL,
    embedding   vector(1024),
    ts          tsvector GENERATED ALWAYS AS (
                    setweight(to_tsvector('polish_simple', coalesce(title, '')),   'A') ||
                    setweight(to_tsvector('polish_simple', coalesce(heading, '')), 'B') ||
                    setweight(to_tsvector('polish_simple', content),               'C')
                ) STORED,
    UNIQUE (solution_id, chunk_index)
);
CREATE INDEX solution_chunks_ts_idx       ON solution_chunks USING gin (ts);
CREATE INDEX solution_chunks_solution_idx ON solution_chunks (solution_id);
-- Brak indeksu wektorowego w PoC (ADR-019).

CREATE TABLE reports (
    id                BIGSERIAL PRIMARY KEY,
    raw_text          TEXT        NOT NULL,
    normalized_text   TEXT        NOT NULL,
    embedding         vector(1024),
    category          TEXT        REFERENCES challenge_taxonomy(code),
    gmina             TEXT,
    powiat            TEXT,
    target_group      TEXT,
    extracted         JSONB       NOT NULL DEFAULT '{}',
    severity_self     SMALLINT    CHECK (severity_self BETWEEN 1 AND 5),
    contact_email     TEXT,
    reporter_type     reporter_type NOT NULL DEFAULT 'OTHER',
    matched           BOOLEAN     NOT NULL DEFAULT false,
    top_solution_id   BIGINT      REFERENCES solutions(id),
    top_rerank_score  REAL,
    session_id        TEXT,
    status            report_status NOT NULL DEFAULT 'NEW',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reports_created_idx   ON reports (created_at DESC);
CREATE INDEX reports_status_idx    ON reports (status, created_at DESC);
CREATE INDEX reports_category_idx  ON reports (category);
CREATE INDEX reports_gmina_idx     ON reports (gmina);
CREATE INDEX reports_unmatched_idx ON reports (created_at DESC) WHERE NOT matched;

CREATE TABLE search_events (
    id                  BIGSERIAL PRIMARY KEY,
    report_id           BIGINT REFERENCES reports(id) ON DELETE SET NULL,
    query               TEXT   NOT NULL,
    normalized_query    TEXT   NOT NULL,
    results             JSONB  NOT NULL,
    lexical_count       INT    NOT NULL DEFAULT 0,
    vector_count        INT    NOT NULL DEFAULT 0,
    latency_ms          JSONB  NOT NULL DEFAULT '{}',
    clicked_solution_id BIGINT REFERENCES solutions(id),
    helpful             BOOLEAN,
    flags               JSONB  NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE report_replies (
    id           BIGSERIAL PRIMARY KEY,
    report_id    BIGINT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    author_label TEXT,
    body         TEXT   NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX report_replies_report_idx ON report_replies (report_id, created_at);
```

**Kroki:**
1. Wklej DDL powyżej, z krótkimi komentarzami do kolumn.
2. Na końcu `INSERT INTO challenge_taxonomy (code, label_pl, description, sort_order)` — 9 kodów z tabeli taksonomii (sort_order 10, 20, …, OTHER = 999). Te same dane będą w `data/taxonomy.json` (T03) — muszą być zgodne.

**Nie rób:** indeksów HNSW/IVFFlat, dodatkowych tabel (klastry, użytkownicy, embedding_meta), kolumn tokenów.

**Gotowe, gdy:** `make reset-db` i potem:
```bash
docker compose exec db psql -U splot splot -c "SELECT to_tsvector('polish_simple','Starsi ludzie siedzą sami')"
# leksemy bez ogonków, np. 'ludzie':2 'sami':4 'siedza':3 'starsi':1
docker compose exec db psql -U splot splot -c "SELECT count(*) FROM challenge_taxonomy"   # 9
```

---

## T02 — Warstwa bazy: `api/db.py`, `api/models.py`

**Zależy od:** T01
**Pliki:** `api/db.py`, `api/models.py`

**Cel:** async silnik, sesje, modele SQLAlchemy 1:1 z DDL (T01).

**Kontekst:**
- SQLAlchemy 2.0 async + asyncpg. `DATABASE_URL` z `settings`.
- Kolumny wektorowe: `pgvector.sqlalchemy.Vector(1024)`. `ts` to kolumna generowana — w modelu `Computed(...)` lub `TSVECTOR` tylko do odczytu (nie wpisuj jej przy INSERT).
- Enumy PG już istnieją w bazie → `sqlalchemy.Enum(..., name="solution_kind", create_type=False)`; odpowiadające `enum.StrEnum` w Pythonie (`SolutionKind`, `SolutionOrigin`, `SolutionStatus`, `ReportStatus`, `ReporterType`).
- `tags` → `ARRAY(Text)`, pola JSONB → `JSONB`.
- W zapytaniach `text()` wektor przekazujemy jako string `'[0.1,0.2,...]'` z `CAST(:vec AS vector(1024))` — helper `to_pgvector`.
- Jedna `AsyncSession` nie obsługuje równoległych zapytań: kod z `asyncio.gather` otwiera osobne sesje przez `SessionLocal()`.

**Kroki:**
1. `api/db.py`: `engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)`, `SessionLocal = async_sessionmaker(engine, expire_on_commit=False)`, `async def get_session()` (yield sesji), `def to_pgvector(vec: list[float]) -> str` (`"[" + ",".join(f"{x:.7f}" for x in vec) + "]"`).
2. `api/models.py`: `Base(DeclarativeBase)`, modele `Taxonomy` (`challenge_taxonomy`), `Solution`, `SolutionChunk` (relacja `solution.chunks`, cascade delete-orphan), `Report`, `SearchEvent`, `ReportReply` — nazwy kolumn dokładnie jak w DDL.

**Nie rób:** Alembica, `create_all` (schemat robi `init.sql`).

**Gotowe, gdy:** jednorazowy skrypt w `python -c` (nie zapisuj go w repo): insert `Solution` + `SolutionChunk` z embeddingiem 1024 liczb, odczyt `ts` niepusty, `SELECT 1 - (embedding <=> CAST(:v AS vector(1024)))` z `to_pgvector` zwraca ≈ 1; potem `DELETE` wstawionego wiersza.

---

## T03 — Słowniki w `data/`

**Zależy od:** —
**Pliki:** `data/taxonomy.json`, `data/gminy-malopolska.json`, `data/synonyms.json`, `data/stopwords-pl.txt`, `data/category-keywords.json`

**Cel:** dane słownikowe dla preprocessingu, toru leksykalnego i list wyboru.

**Formaty:**
1. `taxonomy.json` — lista `{"code","label_pl","description","sort_order"}`, 9 kodów z tabeli taksonomii. Opis: 1 zdanie po polsku. `sort_order` 10, 20, … 80, OTHER = 999 (zgodnie z T01).
2. `gminy-malopolska.json` — lista **182** gmin województwa małopolskiego: `{"name": "Wieliczka", "powiat": "wielicki", "type": "miejsko-wiejska"}`, `type` ∈ `miejska | miejsko-wiejska | wiejska`. Miasta na prawach powiatu (Kraków, Nowy Sącz, Tarnów): `powiat` = nazwa miasta. `name` unikalne: gdy gmina miejska i wiejska mają tę samą nazwę (np. Bochnia, Gorlice, Limanowa, Nowy Targ, Oświęcim, Tarnów — zweryfikuj pełną listę), wiejska dostaje sufiks `" (gmina wiejska)"`. Dane wg TERYT; zweryfikuj liczbę 182.
3. `synonyms.json` — `{"senior": ["seniorzy","seniorów","starszy","starsze","starszych","65+"], ...}`: 30–60 haseł domenowych dla 8 kodów taksonomii (samotność, izolacja, depresja, kryzys psychiczny, internet, komputer, smartfon, e-usługi, opieka, dowóz, transport, wyludnianie, przedszkole, żłobek, nowe osiedla, współpraca, koordynacja, NGO, …). Małe litery. Formy odmienione są tu wartościowe, bo tor leksykalny nie ma stemmingu.
4. `stopwords-pl.txt` — jedno słowo na linię, małe litery, ~200–350 polskich słów funkcyjnych (spójniki, zaimki, przyimki, partykuły, formy „być/mieć”: `u`, `nas`, `w`, `i`, `nie`, `się`, `jest`…). Bez słów treściowych. Obie formy: z ogonkami i bez (`że`, `ze`).
5. `category-keywords.json` — `{"LONELINESS": ["samotn", "izolacj", "sam w domu", "sami w domach", "nie ma z kim"], "AGING": ["senior", "starsz", "65+", "emeryt"], ...}` dla 8 kodów (bez OTHER). Wpisy to **prefiksy** słów albo frazy wielowyrazowe (dopasowanie podciągu), porównywane po `lower()` i zdjęciu ogonków.

**Gotowe, gdy:** krótki `python -c` potwierdza: 182 gminy, unikalne `name`, każdy `powiat` niepusty; taksonomia 9 kodów zgodnych z listą; każdy kod poza OTHER ma wpis w `category-keywords.json`; stopwords bez duplikatów i pustych linii; wszystkie JSON-y poprawne.

---

## T04 — Seed demo korpusu `data/solutions/seed-demo.json`

**Zależy od:** —
**Pliki:** `data/solutions/seed-demo.json`

**Cel:** realistyczne dane do ręcznego sprawdzania API i demo, zanim przyjdzie paczka organizatora.

**Format pośredni (lista obiektów):**
```json
[
  {
    "kind": "SOLUTION",
    "title": "Telefon Życzliwości dla seniorów",
    "summary": "Codzienne rozmowy telefoniczne wolontariuszy z osobami 65+ ...",
    "body": "Pełny opis, może zawierać akapity i nagłówki markdown...",
    "organization": "Fundacja Wspólna Sprawa",
    "gmina": "Wieliczka",
    "powiat": "wielicki",
    "category": "LONELINESS",
    "tags": ["seniorzy", "wolontariat", "telefon"],
    "target_group": "osoby 65+",
    "cost_range": "do 10 tys. zł",
    "implementation_steps": ["Rekrutacja wolontariuszy", "Szkolenie", "Uruchomienie linii"],
    "contact": { "name": null, "email": null, "phone": null },
    "source_url": "https://example.org/seed-demo/telefon-zyczliwosci",
    "source_name": "SEED_DEMO",
    "evidence_level": 4,
    "media": []
  }
]
```

**Wymagania:**
- 30–50 wpisów `kind = "SOLUTION"`, po 3–6 na każdy z 8 merytorycznych kodów (AGING, MENTAL_HEALTH, LONELINESS, DIGITAL_EXCLUSION, SERVICE_ACCESS, COORDINATION, DEPOPULATION, SUBURBAN_GROWTH).
- 5–8 wpisów `kind = "KNOWLEDGE"` (w stylu „Mapy Wyzwań Małopolski” / raportu ROPS: skala problemu, diagnoza; `cost_range`, `implementation_steps` puste, `evidence_level` 1); część z dłuższym `body` (> 1500 znaków, akapity z nagłówkami `##`), żeby chunkowanie dało kilka chunków.
- Każdy wpis: `"source_name": "SEED_DEMO"`, unikalny `source_url` `https://example.org/seed-demo/<slug>`, `contact` z samymi `null`, gmina z listy małopolskich gmin, `evidence_level` 1–5 zróżnicowany.
- Różnorodne słownictwo: część tytułów z nazwami własnymi / akronimami („Program »Aktywny Senior+«”, „Uchwała nr XII/123/2024”, „CUS Wieliczka”) — dla toru leksykalnego; część opisów językiem urzędowym („przeciwdziałanie izolacji osób starszych”) — żeby było widać przewagę toru semantycznego nad potocznym zapytaniem.
- Dane fikcyjne, ale wiarygodne. Bez prawdziwych osób.

**Gotowe, gdy:** `python -m json.tool` przechodzi; `python -c` liczy wpisy per kod zgodnie z wymaganiami; brak niepustych pól `contact`.

---

## T05 — Providery: embeddingi, rerank, LLM

**Zależy od:** T00
**Pliki:** `api/providers/base.py`, `api/providers/__init__.py`, `api/providers/embeddings_openai.py`, `api/providers/rerank_cohere.py`, `api/providers/rerank_noop.py`, `api/providers/llm.py`

**Cel:** wymienne implementacje za protokołami; pipeline nie zna szczegółów dostawców.

**Protokoły (dokładnie):**
```python
from dataclasses import dataclass
from typing import AsyncIterator, Protocol

class EmbeddingProvider(Protocol):
    name: str
    dim: int                 # MUSI być 1024 (ADR-004)
    query_prefix: str        # z konfiguracji; "" dla OpenAI
    passage_prefix: str      # z konfiguracji; "" dla OpenAI
    async def embed_query(self, text: str) -> list[float]: ...
    async def embed_passages(self, texts: list[str]) -> list[list[float]]: ...

@dataclass
class RerankResult:
    index: int               # indeks w liście documents
    score: float | None      # 0..1; None dla noop

class RerankProvider(Protocol):
    name: str
    async def rerank(self, query: str, documents: list[str], top_n: int) -> list[RerankResult]: ...
    # posortowane malejąco po score

class LLMProvider(Protocol):
    name: str
    def stream(self, system: str, user: str) -> AsyncIterator[str]: ...

class ProviderError(Exception):
    def __init__(self, provider: str, code: str): ...
    # code: EMBEDDING_UNAVAILABLE | RERANK_UNAVAILABLE | LLM_UNAVAILABLE
```

**Zasady:**
- Prefiksy dokleja **wyłącznie** provider (`embed_query` → `query_prefix`, `embed_passages` → `passage_prefix`). Żaden kod pipeline'u nie zna słowa `"query: "`.
- OpenAI: `AsyncOpenAI().embeddings.create(model=settings.EMBEDDING_MODEL, input=[...], dimensions=settings.EMBEDDING_DIM)`; `embed_passages` dzieli na partie `EMBEDDING_BATCH_SIZE`, zachowuje kolejność.
- Cohere: `cohere.AsyncClientV2(api_key).rerank(model=settings.RERANK_MODEL, query=..., documents=[...], top_n=...)` → `RerankResult(index, relevance_score)`.
- Noop: `[RerankResult(i, None) for i in range(min(top_n, len(documents)))]` (kolejność wejścia = kolejność RRF).
- LLM: `anthropic.AsyncAnthropic().messages.stream(model=settings.LLM_MODEL, max_tokens=settings.LLM_MAX_TOKENS, system=system, messages=[{"role":"user","content":user}])` → yield z `text_stream`.
- Fabryki w `__init__.py`: `get_embedding_provider()`, `get_rerank_provider()` (gdy `RERANK_ENABLED=false` → noop niezależnie od `RERANK_PROVIDER`), `get_llm_provider()`; instancje cache'owane. Nieznana nazwa → `ValueError`.
- Każdy wyjątek SDK opakuj w `ProviderError` z właściwym kodem.

**Nie rób:** lokalnych modeli (bge-m3), tabeli `embedding_meta`, trybu offline, fake providerów.

**Gotowe, gdy:** z kluczami w `.env`: `python -c` → `embed_query("test")` zwraca 1024 liczby; `rerank("seniorzy", ["opieka nad seniorami", "naprawa dróg"], 2)` stawia pierwszy dokument wyżej; `stream` LLM zwraca tekst; z `RERANK_ENABLED=false` fabryka zwraca noop; zły klucz OpenAI → `ProviderError("openai", "EMBEDDING_UNAVAILABLE")`.

---

## T06 — Chunkowanie i zapis korpusu: `api/chunking.py`, `api/corpus.py`

**Zależy od:** T02, T05
**Pliki:** `api/chunking.py`, `api/corpus.py`

**Cel:** jedna ścieżka chunkowania i embeddingu, używana przez ingest (T07) i `POST /api/solutions` (T21).

**Strategia chunkowania:**
- `chunk_index = 0` — zawsze `title + "\n" + summary`. Ten chunk trafia w większość zapytań.
- `chunk_index >= 1` — `body` pocięte po akapitach do ~`CHUNK_TARGET_CHARS` (1200) znaków, z zakładką ~`CHUNK_OVERLAP_CHARS` (150), granice na końcach zdań. Linia nagłówka markdown (`#`, `##`, …) ustawia `heading` dla kolejnych chunków (sam nagłówek nie wchodzi do `content`).
- Krótkie rozwiązanie (`body` pusty lub krótszy niż `CHUNK_MIN_BODY_CHARS` = 400) ma **dokładnie jeden chunk**: `title + "\n" + summary` (+ `"\n" + body`, jeśli niepusty). Bez sztucznego cięcia.
- Każdy chunk ma `title` = kopia `solutions.title` (wymagane przez kolumnę generowaną `ts` z wagą A).
- `content_hash = sha256((title + summary + body).encode()).hexdigest()` — klucz idempotencji. `media` i `contact` nie wchodzą do hasha ani embeddingu.
- Tekst do embeddingu: `passage_text(title, chunk)` = dla chunku 0 sam `content`; dla pozostałych `f"{title}\n{heading or ''}\n{content}".strip()`. Prefiks `passage:` dokleja provider.

**Kroki:**
1. `api/chunking.py`: `@dataclass ChunkDraft(chunk_index: int, heading: str | None, content: str)`; `chunk_solution(title, summary, body) -> list[ChunkDraft]`; `passage_text(title, chunk) -> str`. Czyste funkcje.
2. `api/corpus.py`: `content_hash(title, summary, body) -> str`; `async def rebuild_chunks(session, solution: Solution, provider: EmbeddingProvider) -> int` — usuwa chunki rozwiązania, tworzy nowe z `chunk_solution`, liczy embeddingi jednym `embed_passages`, zapisuje; zwraca liczbę wywołań API (`ceil(n / EMBEDDING_BATCH_SIZE)`). Nie commituje.

**Gotowe, gdy:** `python -c`: krótki wpis → 1 chunk; body 3000 znaków z 3 akapitami i nagłówkiem `## Wdrożenie` → chunk 0 + ≥ 2 chunki, każdy ≤ ~1400 znaków, `heading` ustawiony, cięcie na końcu zdania; hash stabilny między wywołaniami i zmienia się po zmianie summary.

---

## T07 — Ingest korpusu `scripts/ingest.py`

**Zależy od:** T04, T06
**Pliki:** `scripts/ingest.py`

**Cel:** idempotentny import `data/solutions/*.json` do `solutions` + `solution_chunks`.

**Kontekst:**
```bash
python -m scripts.ingest data/solutions/                 # wszystkie *.json w katalogu
python -m scripts.ingest data/solutions/rops.json --dry-run
python -m scripts.ingest --reembed-all                    # po zmianie modelu lub prefiksów
python -m scripts.ingest data/solutions/x.json --keep-contact
```
- Format pośredni: T04 (`kind` opcjonalny, domyślnie `SOLUTION`). Ten sam format produkuje scraper ROPS (T26) do `data/solutions/rops-biblioteka.json` — `make ingest` ładuje oba pliki bez zmian w kodzie.
- Walidacja Pydantic (`IngestRecord`); błędny rekord: pomiń, wypisz plik + indeks + powód, nie przerywaj partii.
- **Dane osobowe:** `contact` zerowany przy imporcie domyślnie (`{}`). Wyłączyć tylko `--keep-contact` (dane potwierdzone jako publiczne).
- Ingest daje `origin = CURATED`, `status = PUBLISHED`.
- Upsert po `source_url`, przy jego braku po `content_hash`.
- Hash niezmieniony ⇒ pomiń chunkowanie i embedding (zaktualizuj tylko metadane: tags, media, evidence_level, category, gmina, …, `updated_at`). Ponowne uruchomienie na 500 wpisach po dopisaniu jednego nie może kosztować 500 wywołań API.
- Hash zmieniony / nowy ⇒ `corpus.rebuild_chunks` (T06).
- `--reembed-all` ⇒ `rebuild_chunks` dla wszystkich rozwiązań w bazie.
- `category` spoza taksonomii ⇒ błąd rekordu. Pusty `powiat` przy znanej gminie ⇒ uzupełnij z `data/gminy-malopolska.json`.
- `--dry-run`: walidacja + raport, bez zapisu i bez API.
- Podsumowanie: `dodane / zaktualizowane / pominięte / błędne` + liczba wywołań API.
- Commit per rekord — błąd jednego nie cofa reszty.

**Gotowe, gdy:** `make ingest` ładuje seed, a:
```sql
SELECT kind, count(*) FROM solutions GROUP BY kind;                  -- ~40 SOLUTION, kilka KNOWLEDGE
SELECT count(*) FROM solution_chunks WHERE embedding IS NULL;        -- 0
SELECT count(*) FROM solutions WHERE contact <> '{}'::jsonb;         -- 0
```
Drugie `make ingest` raportuje 0 wywołań API; `--dry-run` na pliku z błędną kategorią wypisuje błąd i nie przerywa.

---

## T08 — Kontrakty: `api/schemas.py`, `api/pipeline/types.py`, `api/pipeline/text.py`, `api/cards.py`

**Zależy od:** T02
**Pliki:** `api/schemas.py`, `api/pipeline/types.py`, `api/pipeline/text.py`, `api/cards.py`

**Cel:** jedno miejsce dla kształtów API i typów pipeline'u, z których korzystają T09–T23.

**Kontekst:** `types.py` — **dokładnie** kod z „Typów pipeline'u”. SolutionCard — JSON z „SolutionCard”.

**Kroki — `api/schemas.py` (Pydantic v2):**
1. `Scores(rerank: float|None, rrf: float|None, lex_rank: int|None, vec_rank: int|None, cosine: float|None)`.
2. `MediaItem(type: str, url: str, title: str|None)`.
3. `SolutionCard` — pola z JSON, `kind: Literal["SOLUTION","KNOWLEDGE"]`, `origin: str`, `scores: Scores | None = None`. `SolutionDetail(SolutionCard)` + `body: str`.
4. `ChatRequest`: `message: str` (min 1 znak po strip, max 10 000; obcięcie do `MAX_QUERY_CHARS` robi preprocessing), `session_id: str | None` (max 100), `gmina: str | None`, `severity_self: int | None` (1–5), `reporter_type: Literal["RESIDENT","NGO","JST","OTHER"] = "OTHER"`, `contact_email: str | None` (prosty regex e-mail).
5. Payloady SSE: `StatusEvent(stage: Literal["preprocess","search","rerank","answer"], label_pl)`, `CandidatesEvent(solutions, also_see, context: list[SolutionCard])`, `TokenEvent(text)`, `AnswerRetractedEvent(reason="no_citations")`, `NoMatchEvent(reason="below_threshold", best_score: float|None, gate: str, message_pl: str)`, `ReportSavedEvent(report_id, similar_count, gmina_count)`, `DoneEvent(search_event_id: int|None, latency_ms: dict[str,int])`, `ErrorEvent(code, message_pl)`.
6. Stałe: `STATUS_LABELS = {"preprocess": "Analizuję opis problemu...", "search": "Szukam w bazie rozwiązań...", "rerank": "Wybieram najlepiej pasujące...", "answer": "Przygotowuję podsumowanie..."}`, `NO_MATCH_MESSAGE_PL = "Nie znalazłem w bazie rozwiązania, które pasuje do tego opisu. Zgłoszenie zostało zapisane — zespół Hubu je zobaczy."`.
7. Zgłoszenia i panel: `ReportListItem(id, raw_text, category, category_label_pl, gmina, powiat, reporter_type, severity_self, matched, status, top_solution_id, top_rerank_score, session_id, created_at, reply_count)`, `ReportDetail(ReportListItem + normalized_text, target_group, extracted)`, `SimilarReport(id, raw_text, gmina, created_at, matched, similarity)`, `ReportPatch(status)`, `ReplyCreate(body: 1..4000 znaków, author_label: str|None max 100)`, `Reply(id, report_id, author_label, body, created_at, author_verified: Literal[False] = False)`, `Page[T](items, total, limit, offset)`. **Żaden model nie ma pola `contact_email`.**
8. Rozwiązania: `SolutionSubmit(title 3..200, summary 10..2000, body ≤ 20000 = "", organization, gmina, category, tags ≤ 20, target_group, cost_range, implementation_steps ≤ 30, source_url, media ≤ 10, submitted_by_name ≤ 200)` — bez `contact`, `kind`, `origin`, `status`; `SolutionPatch(status: Literal["PUBLISHED","REJECTED","ARCHIVED"] | None, evidence_level: 1..5 | None, category: str | None)`.
9. `FeedbackCreate(search_event_id: int, solution_id: int|None, helpful: bool)`, `TaxonomyItem`, `GminaItem(name, powiat)`, `ErrorBody(error: {code, message})`.

**Kroki — `api/pipeline/text.py`** (wspólne dla T10 i T11):
```python
def tokenize(text: str) -> list[str]          # re.findall(r"\w+", text.lower())
def strip_accents(text: str) -> str           # ą->a, ł->l itd. (NFKD + usunięcie znaków łączących; ł/Ł ręcznie)
@functools.cache
def stopwords() -> frozenset[str]             # leniwie z settings.DATA_DIR / "stopwords-pl.txt"
```

**Kroki — `api/cards.py`:**
```python
@dataclass
class SolutionRow:           # Solution + etykieta kategorii
    solution: Solution
    category_label_pl: str | None

async def load_solutions(session, ids: list[int]) -> dict[int, SolutionRow]: ...
    # SELECT solutions LEFT JOIN challenge_taxonomy, jedno zapytanie
def to_card(row: SolutionRow, *, rank: int, scores: Scores | None = None) -> SolutionCard: ...
def to_detail(row: SolutionRow) -> SolutionDetail: ...
```
`to_card` nigdy nie kopiuje `contact`.

**Gotowe, gdy:** `python -c`: import `api.pipeline.types` działa; `to_card` na ręcznie zbudowanym `SolutionRow` daje dokładnie klucze z JSON SolutionCard (bez `contact`), `scores` None; `ChatRequest(message="")` i `severity_self=6` rzucają błąd walidacji; `tokenize("Ąla ma kota!")` → `["ąla","ma","kota"]`, `strip_accents("żółć")` → `"zolc"`.

---

## T09 — Mocki strumieni SSE dla frontendu

**Zależy od:** T08
**Pliki:** `docs/mocks/README.md`, `docs/mocks/chat-match.sse`, `docs/mocks/chat-no-match.sse`, `docs/mocks/chat-retracted.sse`, `docs/mocks/chat-error.sse`, `docs/mocks/solutions-list.json`, `docs/mocks/inbox.json`, `docs/mocks/stats.json`, `docs/mocks/replay.py`

**Cel:** „godzina 0” — frontend pracuje na zamrożonym kontrakcie bez backendu.

**Kontekst — `POST /api/chat`, odpowiedź `text/event-stream`:**
Kolejność gwarantowana: `status* → candidates → (token* [→ answer_retracted] | no_match) → report_saved? → done`. `error` może pojawić się w dowolnym miejscu, a po nim ostatecznie przychodzi `done`.

| event | Kiedy | data |
|---|---|---|
| status | po każdym kroku | `{"stage":"preprocess\|search\|rerank\|answer","label_pl":"Szukam w bazie rozwiązań..."}` |
| candidates | raz, przed pierwszym tokenem, zawsze (także przed no_match) | `{"solutions":[SolutionCard...],"also_see":[...],"context":[...]}` |
| token | wielokrotnie | `{"text":"Fundacja "}` |
| answer_retracted | najwyżej raz, po ostatnim token | `{"reason":"no_citations"}` |
| no_match | zamiast token | `{"reason":"below_threshold","best_score":0.21,"gate":"rerank","message_pl":"..."}` |
| report_saved | po zapisie; brak = zapis nieudany | `{"report_id":412,"similar_count":9,"gmina_count":4}` |
| done | zawsze na końcu | `{"search_event_id":988,"latency_ms":{"total":1840}}` |
| error | awaria | `{"code":"RERANK_UNAVAILABLE","message_pl":"..."}` |

Ramka: `event: <nazwa>\ndata: <json w jednej linii>\n\n`. Przy `no_match` `solutions` i `also_see` puste, `context` może być niepusty. `[n]` w tokenach = pozycja karty w `solutions` (od 1). `also_see` kontynuuje `rank`; `context` (KNOWLEDGE) nigdy nie ma `[n]`. `scores` wypełnione w wynikach wyszukiwania, `null` w katalogu.

**Kroki:**
1. Cztery pliki `.sse` z realistycznymi danymi po polsku: match (3 karty, 2 also_see, 1 context, streszczenie z `[1]`, `[2]`, `report_saved` z `similar_count: 9, gmina_count: 4`), no_match (context niepusty), retracted (tokeny bez cytowań + `answer_retracted`), error (`status`, `candidates`, `error LLM_UNAVAILABLE`, `report_saved`, `done`).
2. `solutions-list.json` (`Page` z 3 kartami, `scores: null`), `inbox.json` i `stats.json` (kształty z T22).
3. `replay.py` — mały serwer (`http.server`, bez zależności) odtwarzający wybrany plik `.sse` pod `POST /api/chat` z opóźnieniem 50 ms na ramkę i nagłówkami CORS dla `http://localhost:5173`.
4. `README.md`: uruchomienie `replay.py`; `EventSource` obsługuje tylko GET, więc frontend używa `fetch` + `ReadableStream` i parsuje ramki rozdzielone `\n\n`; `session_id` = UUID generowany raz po stronie klienta.

**Gotowe, gdy:** każda linia `data:` parsuje się przez odpowiadający model z `api/schemas.py` (jednorazowy `python -c`); `curl -N -X POST localhost:<port>/api/chat` na `replay.py` pokazuje strumień z opóźnieniami.

---

## T10 — Preprocessing `api/pipeline/preprocess.py`

**Zależy od:** T03, T08
**Pliki:** `api/pipeline/preprocess.py`

**Cel:** `preprocess(message: str, gmina: str | None) -> ProcessedQuery`, < 5 ms, bez LLM.

**Kolejność operacji:**
1. **Normalizacja** — `unicodedata.normalize("NFC")`, zbicie białych znaków, `strip`, obcięcie do `settings.MAX_QUERY_CHARS`. `raw` = oryginał bez zmian.
2. **Zdjęcie wstępów grzecznościowych** — regex `^(cześć|dzień dobry|witam|hej|dobry wieczór|szanowni państwo)[,!.\s]*` (case-insensitive), w pętli aż nic nie zdejmie. Tylko z `normalized`.
3. **Gmina i powiat** — `gmina` z żądania (lista wyboru, `GET /api/gminy`). Nie wyciągaj gminy z tekstu. Nieznana ⇒ `raise UnknownGminaError(gmina)` (router → 422). Powiat z `data/gminy-malopolska.json` (`GMINY: dict[name, powiat]`, ładowany raz).
4. **Identyfikatory** — z `normalized`: wyrazy CAPS (3+ znaki: `CUS`, `MOPS`), ciągi alfanumeryczne z cyfrą (`XII/123/2024`), frazy w cudzysłowie (`"..."`, `„..."`, `»...«`), frazy z 2+ kolejnych wyrazów z wielkiej litery nie na początku zdania (`Telefon Życzliwości`). Bez duplikatów, w kolejności wystąpienia.
5. **Kategoria** — `data/category-keywords.json` (prefiksy słów i frazy, po `lower` + `strip_accents`); kod z największą liczbą trafień, remis → `sort_order`. Brak trafień ⇒ `"OTHER"`. Nie wymyślaj kategorii. (Klasyfikator LLM — **nie w PoC**, `# TODO(backlog)`.)
6. **target_group** — heurystyka słownikowa (seniorzy/osoby starsze → `"osoby starsze"`, dzieci/młodzież → `"dzieci i młodzież"`, rodziny → `"rodziny"`, niepełnosprawność → `"osoby z niepełnosprawnościami"`), inaczej `None`.
7. **Synonimy** — `data/synonyms.json`: dla słów z `normalized` będących kluczem lub wartością dodaj formy grupy (bez duplikatów i słów już obecnych). Tylko dla toru leksykalnego.
8. **too_vague** — `True`, gdy po usunięciu stopwords i słów < 3 znaków zostaje mniej niż `VAGUE_MIN_WORDS` wyrazów. Pipeline leci dalej.

**Pułapka:** nie przycinaj zapytania do słów kluczowych — tor semantyczny potrzebuje pełnych zdań. Preprocessing dodaje metadane, nie odbiera treści.

**Używaj:** `tokenize`, `strip_accents`, `stopwords()` z `api/pipeline/text.py`. **Eksportuj:** `GMINY`, `UnknownGminaError`.

**Gotowe, gdy:** `python -c`: „Dzień dobry, cześć! U nas…” → `normalized` od „U nas”, `raw` bez zmian; `gmina="Wieliczka"` → `powiat="wielicki"`; `gmina="Gotham"` → `UnknownGminaError`; „program CUS i uchwała XII/123/2024” → identyfikatory z `CUS` i `XII/123/2024`; „starsi ludzie siedzą sami w domach” → kategoria inna niż OTHER; „pomocy” → `too_vague=True`; 5000 znaków → `normalized` ≤ 2000; średni czas ze 100 wywołań < 5 ms.

---

## T11 — Tor leksykalny `api/pipeline/lexical.py`

**Zależy od:** T03, T08
**Pliki:** `api/pipeline/lexical.py`

**Cel:** `build_tsquery(q: ProcessedQuery) -> str | None` i `async lexical_search(session, q) -> list[Candidate]` (do `CANDIDATES_PER_TRACK`, `rank` 1..n, `score` = ts_rank_cd). < 30 ms.

**Dlaczego OR:** nie używaj `websearch_to_tsquery` ani `plainto_tsquery` — łączą słowa przez AND. Bez stemmingu dokument musiałby zawierać wszystkie słowa zgłoszenia w dokładnej formie → pusta lista dla niemal każdego zapytania (i nikt by nie zauważył, bo tor semantyczny pokrywa braki). Zapytanie budujemy w Pythonie jako OR słów treściowych; `ts_rank_cd` premiuje więcej trafień i bliskość. Stopwords obowiązkowe.

```python
def build_tsquery(q: ProcessedQuery) -> str | None:
    terms = [t for t in tokenize(q.normalized)
             if t not in STOPWORDS_PL and len(t) >= 3][:settings.MAX_TSQUERY_TERMS]
    parts  = [lexeme(t) for t in terms]                              # 'starsi' | 'ludzie' | ...
    parts += [lexeme(t) for t in q.expanded_terms]                   # synonimy domenowe
    parts += ["(" + " <-> ".join(lexeme(w) for w in ident.split()) + ")"
              for ident in q.identifiers]                            # nazwy własne jako frazy
    return " | ".join(parts) or None                                 # None => tor zwraca []

def lexeme(token: str) -> str:
    return "'" + re.sub(r"[^\w]", "", token) + "'"                   # tylko litery, cyfry, _
```
Uzupełnienia: pomijaj leksemy puste po czyszczeniu (`''` wywala zapytanie); identyfikatory dziel też po `/`; deduplikuj z zachowaniem kolejności; `tokenize` i `STOPWORDS_PL = stopwords()` z `api.pipeline.text`. Nigdy surowy tekst do `to_tsquery` (`&`, `!`, `:*` wywalają zapytanie). Ogonki zdejmuje `unaccent` w konfiguracji — w Pythonie nie transliteruj.

```sql
WITH q AS (
    SELECT to_tsquery('polish_simple', :tsq_string) AS tsq
),
hits AS (
    SELECT DISTINCT ON (c.solution_id)
           c.solution_id,
           c.id                        AS chunk_id,
           ts_rank_cd(c.ts, q.tsq, 32) AS score
    FROM solution_chunks c
    JOIN solutions s ON s.id = c.solution_id
    CROSS JOIN q
    WHERE s.status = 'PUBLISHED'
      AND s.kind = 'SOLUTION'
      AND c.ts @@ q.tsq
    ORDER BY c.solution_id, score DESC
)
SELECT solution_id, chunk_id, score,
       ROW_NUMBER() OVER (ORDER BY score DESC, solution_id) AS rnk
FROM hits
ORDER BY score DESC, solution_id
LIMIT :candidates_per_track;
```
`DISTINCT ON` wymaga `ORDER BY` od kolumny `DISTINCT ON` — dlatego kolaps per rozwiązanie i ranking globalny są na dwóch poziomach. Normalizacja 32 skaluje do 0–1. `build_tsquery is None` ⇒ `[]` bez zapytania do bazy.

**Gotowe, gdy:** `python -c`: wynik `build_tsquery` łączy przez `" | "`; stopwords i słowa < 3 znaków odfiltrowane; limit 15; `"a & b ! c:*"` nie daje operatorów w leksemach; identyfikator `"Telefon Życzliwości"` → `('telefon' <-> 'życzliwości')`; same stopwords → `None`. Po ingeście seedu: `lexical_search` dla „zyczliwosci seniorow” (bez ogonków) zwraca pasujące rozwiązanie; wynik nie zawiera KNOWLEDGE ani PENDING_REVIEW; każde `solution_id` występuje raz.

---

## T12 — Tor semantyczny `api/pipeline/semantic.py`

**Zależy od:** T08
**Pliki:** `api/pipeline/semantic.py`

**Cel:** wyszukiwanie wektorowe dla rozwiązań i wiedzy tym samym embeddingiem zapytania + uzupełnienie cosinusa dla kandydatów z toru leksykalnego. Funkcje przyjmują gotowy wektor (embedding liczy orkiestrator, T16).

**Zapytanie:**
```sql
WITH raw AS (
    SELECT c.id AS chunk_id, c.solution_id,
           c.embedding <=> CAST(:query_vec AS vector(1024)) AS dist
    FROM solution_chunks c
    JOIN solutions s ON s.id = c.solution_id
    WHERE s.status = 'PUBLISHED'
      AND s.kind = CAST(:kind AS solution_kind)  -- 'SOLUTION' albo 'KNOWLEDGE'
      AND c.embedding IS NOT NULL
    ORDER BY dist
    LIMIT :vector_overfetch                      -- 60 = 3 x candidates_per_track
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
LIMIT :limit;
```
- `<=>` to odległość cosinusowa (0 = identyczne), podobieństwo = `1 - dist`, sortowanie zawsze ASC po `dist`.
- Nadpobranie (`VECTOR_OVERFETCH`), bo wiele chunków należy do jednego rozwiązania.
- Wektor jako `to_pgvector(vec)` z `api.db`.
- Pełny skan, **bez HNSW** (indeks przybliżony z filtrem przez JOIN potrafi zwrócić mniej wyników niż LIMIT).

**Funkcje:**
```python
async def semantic_search(session, vec: list[float], kind: str = "SOLUTION",
                          limit: int | None = None) -> list[Candidate]
    # limit domyślnie CANDIDATES_PER_TRACK; cosine_similarity wypełnione, score=None
async def knowledge_search(session, vec: list[float]) -> list[Candidate]
    # kind='KNOWLEDGE', limit=KNOWLEDGE_TOP_N, tylko cosine >= MIN_COSINE_SCORE; KNOWLEDGE_TOP_N=0 => []
async def backfill_cosine(session, vec: list[float], chunk_ids: list[int]) -> dict[int, float]
    # SELECT id, 1.0 - (embedding <=> CAST(:vec AS vector(1024))) FROM solution_chunks WHERE id = ANY(:ids)
    # puste chunk_ids => {} bez zapytania; chunk bez embeddingu pominięty
```

**Gotowe, gdy:** po ingeście seedu, z wektorem `embed_query("starsi ludzie są samotni")`: `semantic_search` zwraca rozwiązania o tematyce samotności/seniorów na początku, każde `solution_id` raz, bez KNOWLEDGE; `knowledge_search` zwraca ≤ `KNOWLEDGE_TOP_N` wpisów KNOWLEDGE z cosinusem ≥ progu; `backfill_cosine` zwraca wartości dla podanych id.

---

## T13 — Fuzja RRF `api/pipeline/fusion.py`

**Zależy od:** T08
**Pliki:** `api/pipeline/fusion.py`

**Cel:** czysta funkcja łącząca listy z torów. < 5 ms.

**Kontekst:** oceny `ts_rank_cd` i cosinusa mają nieporównywalne skale — nie wolno ich sumować ani normalizować min-max. RRF punktuje wyłącznie pozycje: `RRF(d) = Σ_m 1 / (k + rank_m(d))`, `k = 60`.

```python
def rrf_fuse(
    tracks: dict[str, list[Candidate]],
    k: int | None = None,          # domyślnie settings.RRF_K
    top_n: int | None = None,      # domyślnie settings.RERANK_TOP_N
) -> list[FusedCandidate]:
    scores: dict[int, float] = defaultdict(float)
    ranks:  dict[int, dict[str, int]] = defaultdict(dict)
    chunks: dict[int, int] = {}
    cosines: dict[int, float] = {}

    for track_name, candidates in tracks.items():
        for rank, cand in enumerate(candidates, start=1):   # 1-indeksowane
            scores[cand.solution_id] += 1.0 / (k + rank)
            ranks[cand.solution_id][track_name] = rank
            if track_name == "semantic":
                cosines[cand.solution_id] = cand.cosine_similarity
            # chunk z toru wektorowego preferowany jako kontekst dla rerankera
            if cand.solution_id not in chunks or track_name == "semantic":
                chunks[cand.solution_id] = cand.chunk_id

    ordered = sorted(scores.items(), key=lambda kv: (-kv[1], kv[0]))
    return [
        FusedCandidate(
            solution_id=sid, chunk_id=chunks[sid],
            rrf_score=score, ranks=ranks[sid],
            cosine_similarity=cosines.get(sid),   # None, gdy tylko z toru leksykalnego
        )
        for sid, score in ordered[:top_n]
    ]
```
Przykład: pozycja 1 w leksykalnym i 4 w semantycznym: `1/61 + 1/64 = 0.03202`; tylko w jednym torze na pozycji 1: `0.01639`. **Determinizm:** remis → `solution_id` rosnąco. Nazwy torów: `"lexical"`, `"semantic"`. Nie zmieniaj `k`.

**Gotowe, gdy:** `python -c` na sztucznych listach: przykład daje 0.03202 ± 1e-5; kandydat z dwóch torów wyżej niż z jednego na pozycji 1; remis → mniejsze `solution_id` pierwsze; chunk z toru semantycznego preferowany; `cosine_similarity` None dla kandydata tylko leksykalnego; `top_n` obcina; dwa wywołania dają identyczny wynik.

---

## T14 — Reranking i bramka `api/pipeline/rerank.py`

**Zależy od:** T05, T13
**Pliki:** `api/pipeline/rerank.py`

**Cel:** z `RERANK_TOP_N` kandydatów po fuzji wybrać do `ANSWER_TOP_N + ALSO_SEE_N` rozwiązań, każde powyżej progu, i podjąć decyzję „nie wiem”. < 400 ms.

**Kontekst:**
- Cross-encoder czyta parę (zapytanie, dokument) razem — dokładniejszy niż embeddingi, ale drogi, więc działa tylko na 10 pozycjach.
- Tekst dokumentu: `f"{title}\n{summary}\n{best_chunk_content}"` obcięty do `RERANK_DOC_CHARS`. Nie podawaj całego body.
- Reranker dostaje `top_n = ANSWER_TOP_N + ALSO_SEE_N`. Noop: kolejność RRF, `score=None`.
- KNOWLEDGE nie przechodzi przez reranker.

**Bramka (musi działać bez rerankera):**
```python
def gate(fused, reranked) -> tuple[float | None, float, str]:
    if reranked and reranked[0].rerank_score is not None:         # reranker aktywny
        return reranked[0].rerank_score, settings.MIN_RERANK_SCORE, "rerank"
    # noop: score None — porównanie None < 0.35 rzuciłoby TypeError.
    sims = [c.cosine_similarity for c in fused if c.cosine_similarity is not None]
    return (max(sims) if sims else None), settings.MIN_COSINE_SCORE, "cosine"

score, threshold, source = gate(fused, reranked)
passed = score is not None and score >= threshold
```
- **Bramka per pozycja:** ten sam próg i źródło dla każdej pozycji osobno — `rerank`: `rerank_score >= MIN_RERANK_SCORE`; `cosine`: `cosine_similarity >= MIN_COSINE_SCORE`. Mniej niż 3 + 5 pozycji to poprawny wynik.
- Pierwsze `ANSWER_TOP_N` po filtrze = karty główne, kolejne do `ALSO_SEE_N` = also_see.
- `passed=False` ⇒ karty główne i also_see puste. Pusta lista kandydatów ⇒ `score=None`, `passed=False`.

**API:**
```python
@dataclass
class RerankOutcome:
    reranked: list[FusedCandidate]     # po reranku (rerank_score ustawione lub None), przed filtrem
    top: list[FusedCandidate]
    also_see: list[FusedCandidate]
    gate: GateDecision

def rerank_document(row: SolutionRow, chunk_content: str) -> str: ...
async def rerank_and_gate(query: str, fused: list[FusedCandidate], docs: dict[int, str],
                          provider: RerankProvider) -> RerankOutcome: ...
    # docs: solution_id -> tekst dokumentu; fused już obcięte do RERANK_TOP_N
```
`ProviderError` propaguj (chat zamienia na zdarzenie `error`).

**Gotowe, gdy:** `python -c` z ręcznie zbudowanymi `FusedCandidate` i noop / stubem rerankera (klasa zdefiniowana w poleceniu, nie w repo): top 0.2 przy aktywnym rerankerze → `passed=False, source="rerank"`; noop + cosinus 0.6 → `passed=True, source="cosine"` bez `TypeError`; słabe pozycje odfiltrowane; podział 3 + 5; pusta lista → `passed=False`; dokument obcięty do 2000 znaków.

---

## T15 — Aplikacja FastAPI: `main.py`, `errors.py`, `log.py`, `tasks.py`, stuby routerów

**Zależy od:** T02, T08
**Pliki:** `api/main.py`, `api/errors.py`, `api/log.py`, `api/tasks.py`, `api/routers/chat.py`, `api/routers/search.py`, `api/routers/reports.py`, `api/routers/solutions.py`, `api/routers/staff.py`, `api/routers/meta.py` (sześć routerów **tylko jako stuby**)

**Cel:** szkielet aplikacji, tak żeby T16 i T19–T23 wypełniały wyłącznie swoje pliki routerów bez dotykania `main.py`.

**Kontekst:** prefiks `/api`. Format błędów `{"error": {"code": "...", "message": "..."}}`. Każda odpowiedź ma `X-Request-Id`. CORS z `settings.cors_origins_list`, nagłówki `Content-Type`, `Accept` (także `text/event-stream`), `X-Request-Id`; metody GET, POST, PATCH, OPTIONS; `expose_headers=["X-Request-Id"]`. Brak autoryzacji.

**Kroki:**
1. `api/errors.py`: `class ApiError(Exception)` (`status`, `code`, `message`); `install_error_handlers(app)` — `ApiError`, `RequestValidationError` (422 `VALIDATION_ERROR`, message z pierwszego błędu **bez** echa wartości wejściowej — może zawierać dane wrażliwe), `HTTPException`, nieobsłużony `Exception` (500 `INTERNAL`, log ze stack trace bez body żądania).
2. `api/log.py`: `setup_logging()` — format z `request_id`; `RedactFilter(logging.Filter)` maskuje klucze `raw_text`, `normalized_text`, `message`, `contact_email` w `extra`/słownikach. Nie loguj body żądań.
3. `api/tasks.py`: `BACKGROUND_TASKS: set[asyncio.Task]`; `spawn(coro) -> asyncio.Task` — `create_task`, dodanie do zbioru, `add_done_callback(BACKGROUND_TASKS.discard)` + log wyjątku zadania. `async def drain(timeout=5)` — na shutdown czeka na zaległe zadania.
4. Stuby routerów — każdy plik zawiera **wyłącznie**:
   ```python
   from fastapi import APIRouter
   router = APIRouter(prefix="/api", tags=["<nazwa>"])
   ```
   a `meta.py` dodatkowo `health_router = APIRouter(tags=["health"])` (bez prefiksu, dla `/healthz`).
5. `api/main.py`: `create_app()` — `setup_logging`, CORS, middleware `X-Request-Id` (z nagłówka lub `uuid4`, w `contextvar`, w logach i odpowiedziach, także strumieniowych), `install_error_handlers`, `include_router` dla `chat`, `search`, `reports`, `solutions`, `staff`, `meta.router`, `meta.health_router`; lifespan: na shutdown `await tasks.drain()` i `engine.dispose()`. `app = create_app()`.

**Gotowe, gdy:** `make dev` startuje; `curl -i localhost:8000/healthz` → 404 w formacie `{"error":...}` z nagłówkiem `X-Request-Id`; `curl -i -H 'X-Request-Id: abc' …` odbija `abc`; `curl -i -X OPTIONS -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: POST' localhost:8000/api/chat` zwraca nagłówki CORS.

---

## T16 — Orkiestrator i `GET /api/search`

**Zależy od:** T10, T11, T12, T14, T15
**Pliki:** `api/pipeline/orchestrator.py`, `api/routers/search.py`

**Cel:** spiąć kroki 1–4 pipeline'u w funkcje dla `/api/chat` (T19) i `/api/search`, z pomiarem czasu.

**Przepływ:** preprocessing (robi wołający) → embedding zapytania → równolegle (`asyncio.gather`): tor leksykalny, tor semantyczny (SOLUTION), wiedza (KNOWLEDGE, ten sam wektor) → RRF → uzupełnienie cosinusa → reranking + bramka → karty. **Każde równoległe zapytanie ma własną sesję** (`async with SessionLocal() as s:`).

```python
async def retrieve(q: ProcessedQuery) -> RetrievalResult
    # embed_query(q.normalized) -> vec
    # gather(lexical_search, semantic_search(kind=SOLUTION), knowledge_search)
    # fused = rrf_fuse({"lexical": lex, "semantic": sem}, k=RRF_K, top_n=RERANK_TOP_N)
    # backfill_cosine dla fused z cosine None -> uzupełnij
    # latency_ms: embed, lexical, semantic, knowledge, fusion (int ms, time.perf_counter)

async def finalize(r: RetrievalResult, *, use_rerank: bool | None = None) -> SearchResult
    # use_rerank None -> settings.RERANK_ENABLED; False -> noop
    # load_solutions(fused ids + knowledge ids) jednym zapytaniem; treść best chunków (SELECT id, content)
    # docs = rerank_document(row, chunk_content); outcome = rerank_and_gate(...)
    # solutions: to_card(rank=1..n, scores=Scores(rerank, rrf, lex_rank, vec_rank, cosine))
    # also_see: rank kontynuuje (n+1...)
    # context: karty KNOWLEDGE (rank 1..k, scores.cosine), niezależnie od bramki
    # best_chunks: solution_id -> content (do promptu, T17)
    # latency_ms += rerank

async def run_search(q, *, use_rerank=None) -> SearchResult   # retrieve + finalize
```
Wszystkie limity z `settings`.

**`GET /api/search`** (`api/routers/search.py`): `SEARCH_ENDPOINT_ENABLED=false` ⇒ 404. Parametry `q` (wymagany), `rerank: bool = True`, `gmina: str | None` (nieznana → 422). Ten sam pipeline **bez LLM, bez zapisu zgłoszenia i bez `search_events`**:
```json
{
  "normalized_query": "starsi ludzie sami w domu",
  "extracted": { "category": "LONELINESS", "identifiers": [], "too_vague": false, "expanded_terms": [] },
  "tsquery": "'starsi' | 'ludzie' | ...",
  "lexical":  [ { "solution_id": 142, "title": "...", "rank": 1, "score": 0.44 } ],
  "semantic": [ { "solution_id": 207, "title": "...", "rank": 1, "cosine_similarity": 0.81 } ],
  "fused":    [ { "solution_id": 142, "rrf": 0.0320, "ranks": {"lexical":1,"semantic":4}, "cosine": 0.78 } ],
  "reranked": [ { "solution_id": 142, "score": 0.91 } ],
  "knowledge":[ { "solution_id": 501, "title": "...", "cosine_similarity": 0.66 } ],
  "gate":     { "source": "rerank", "score": 0.91, "threshold": 0.35, "passed": true },
  "latency_ms": { "embed": 180, "lexical": 12, "semantic": 23, "rerank": 310 }
}
```
Narzędzie do ręcznego ustawiania progów i pokazania jury hybrydy — nie źródło kart dla frontendu.

**Gotowe, gdy:** po ingeście seedu: `curl 'localhost:8000/api/search?q=starsi+ludzie+sami+w+domu'` — `lexical` i `semantic` niepuste, `gate.passed=true`, sensowne top 3; `&rerank=false` → `gate.source="cosine"`; zapytanie bez związku z korpusem (np. „naprawa dziury w dachu kościoła”) → `passed=false`; KNOWLEDGE tylko w `knowledge`; `SELECT count(*) FROM reports` nie rośnie.

---

## T17 — Generacja RAG i filtr cytowań `api/pipeline/answer.py`

**Zależy od:** T05, T08
**Pliki:** `api/pipeline/answer.py`

**Cel:** krótkie streszczenie po polsku z cytowaniami `[n]`, strumieniowane; zmyślone cytowania wycięte w locie. Pierwszy token < 1,5 s.

**Zadanie modelu:** 2–4 zdania, co w zwróconych rozwiązaniach odpowiada na problem, z `[n]` przy każdym twierdzeniu. Bez doradzania, wymyślania kroków, wiedzy ogólnej. Kontekst = tylko karty główne (`solutions`) — nigdy also_see ani context.

```python
SYSTEM = """Jesteś asystentem Małopolskiego Hubu Innowacji Społecznych.
Odpowiadasz WYŁĄCZNIE na podstawie rozwiązań podanych w kontekście.

Zasady bezwzględne:
1. Każde twierdzenie opatrz cytowaniem [n] wskazującym numer rozwiązania z kontekstu.
2. Nigdy nie dodawaj informacji, faktu, nazwy ani liczby, której nie ma w kontekście.
3. Jeśli kontekst nie odpowiada na problem, napisz dokładnie: "Nie mam dopasowanego
   rozwiązania w bazie." i nic więcej.
4. Maksymalnie 4 zdania. Bez listy wypunktowanej - karty rozwiązań są pokazywane
   użytkownikowi osobno, nie powtarzaj ich treści.
5. Polski, prosty język urzędowo-ludzki. Bez zwrotów grzecznościowych na początku.
"""

USER = """Problem zgłoszony przez użytkownika:
{query}

Rozwiązania z bazy:
{context}

{vague_hint}"""
```
`context` — numerowane bloki w kolejności kart:
```
[1] Telefon Życzliwości dla seniorów
Organizacja: Fundacja Wspólna Sprawa | Gmina: Wieliczka | Kategoria: LONELINESS
Opis: Codzienne rozmowy telefoniczne wolontariuszy z osobami 65+ ...
Fragment: <treść najlepszego chunku, obcięta do ~800 znaków>
```
Brakujące pola pomijaj. `vague_hint` tylko przy `too_vague`: `"Zapytanie jest ogólne. Dopisz na końcu jedno krótkie pytanie doprecyzowujące."`. Tekst zgłoszenia i rozwiązań wchodzi tylko jako blok danych (instrukcje wyłącznie w SYSTEM).

**Filtr strumieniowy cytowań (obowiązkowy):**
- Wstrzymuje fragment od `[` do `]`, najwyżej 4 znaki (`[` + do 2 cyfr + `]`); dłuższy fragment bez `]` wychodzi jako zwykły tekst.
- Domknięte `[n]`: cyfrowe i `1 <= n <= liczba kart` → przepuść, `valid_citations += 1`; cyfrowe spoza zakresu → wytnij, `hallucinated = True`; niecyfrowe → zwykły tekst.
- Granice fragmentów z LLM są dowolne (`[` w jednym kawałku, `2]` w następnym).
```python
class CitationFilter:
    def __init__(self, n_cards: int): ...
    def feed(self, text: str) -> str      # tekst gotowy do wysłania (może być "")
    def flush(self) -> str                # na końcu: oddaj wstrzymany bufor jako tekst
    hallucinated: bool
    valid_citations: int
    emitted_any: bool
    @property
    def should_retract(self) -> bool      # n_cards > 0 and emitted_any and valid_citations == 0
```
Brak poprawnego cytowania przy niepustym kontekście ⇒ wołający (T19) wysyła `answer_retracted`.

**Funkcje:**
```python
def build_context(cards: list[SolutionCard], best_chunks: dict[int, str]) -> str
def build_user_prompt(query: str, cards, best_chunks, too_vague: bool) -> str
async def generate(query: str, cards, best_chunks, too_vague: bool,
                   llm: LLMProvider) -> AsyncIterator[str]
    # surowe fragmenty z LLM (filtr stosuje wołający)
```

**Gotowe, gdy:** `python -c` na `CitationFilter`: `"A [1] B [2]"` przy 3 kartach bez zmian, `valid=2`; `"[7]"` wycięte, `hallucinated=True`; kawałki `"tekst [", "1", "] dalej"` → `[1]` przepuszczone; `"[abc]"` i `"[12345"` jako tekst; brak cytowań → `should_retract=True`; `n_cards=0` → nigdy. Z kluczem Anthropic: `generate` na 2 ręcznych kartach zwraca 2–4 zdania z `[1]`/`[2]`.

---

## T18 — Zapis zgłoszenia i licznik podobnych `api/pipeline/reports.py`

**Zależy od:** T08
**Pliki:** `api/pipeline/reports.py`

**Cel:** bezwarunkowy zapis zgłoszenia + `search_events`, licznik „N osób z M gmin”. < 50 ms, równolegle z generacją.

**Kontekst:**
- Zapis bezwarunkowy — także gdy nic nie znaleziono i gdy klient zamknie połączenie. T19 uruchamia go przez `api.tasks.spawn(...)`, więc funkcja **otwiera własną sesję** (`SessionLocal()`).
- `matched = search.matched`. `top_solution_id` / `top_rerank_score` z pierwszej karty.
- `reports.embedding` = wektor zapytania. `extracted` = `{"category","identifiers","expanded_terms","too_vague","target_group"}`. `category` z `ProcessedQuery` (OTHER, gdy brak).
- `matched = false` to najcenniejsze dane — luka w korpusie lub nieobsłużone wyzwanie regionu.

**Licznik podobnych (ADR-016) — po insercie, w tej samej sesji:**
```sql
SELECT count(DISTINCT coalesce(r.session_id, r.id::text)) AS similar_count,   -- osoby, nie wiadomości
       count(DISTINCT r.gmina)                            AS gmina_count
FROM reports r
WHERE r.id <> :report_id
  AND r.embedding IS NOT NULL
  AND r.session_id IS DISTINCT FROM :session_id                -- własne wiadomości się nie liczą
  AND 1.0 - (r.embedding <=> CAST(:vec AS vector(1024))) >= :similar_report_threshold;
```
Licz sesje, nie wiersze (pytanie doprecyzowujące = nowe zgłoszenie z tym samym `session_id`). Próg z `SIMILAR_REPORT_THRESHOLD`. Bez indeksu na `reports.embedding`.

**`search_events`:** jeden wiersz na przejście `/api/chat` (nie `/api/search`): `report_id`, `query` (= raw), `normalized_query`, `results` = `{solution_id, lex_rank, vec_rank, rrf, rerank, cosine}` dla `search.reranked`, `lexical_count`, `vector_count`, `latency_ms`, `flags = {"gate": source}`.

```python
async def save_report_and_event(*, query: ProcessedQuery, query_vec: list[float] | None,
                                request: ChatRequest, search: SearchResult | None) -> SaveResult
    # search None (awaria przed bramką) -> matched=False, search_event z results=[] i flags={"error": true}
    # query_vec None -> embedding NULL, similar_count=0, gmina_count=0
async def update_search_event(search_event_id: int, *, flags: dict | None = None,
                              latency_ms: dict | None = None) -> None
    # merge JSONB (flags || :flags), własna sesja
async def find_similar_reports(session, report_id: int, limit: int | None = None) -> list[dict]
    # do SIMILAR_REPORTS_LIMIT innych zgłoszeń >= progu:
    # {id, raw_text, gmina, created_at, matched, similarity}, malejąco po similarity
```
Logi: tylko `report_id`, `len(raw)`, `matched` — nigdy treść.

**Gotowe, gdy:** `python -c` z wektorami z OpenAI (albo ręcznymi): dwa podobne zgłoszenia z różnych sesji → drugie `similar_count=1`; ta sama sesja → 0; `search=None` zapisuje `matched=false`; `find_similar_reports` nie zwraca samego zgłoszenia; w `search_events` jest wiersz z `report_id`. Po sprawdzeniu usuń wstawione wiersze.

---

## T19 — `POST /api/chat` (SSE)

**Zależy od:** T16, T17, T18
**Pliki:** `api/routers/chat.py`

**Cel:** główny endpoint: strumień zdarzeń w gwarantowanej kolejności, zapis odpięty od żądania.

**Żądanie:**
```
POST /api/chat
Content-Type: application/json
Accept: text/event-stream

{"message": "U nas w gminie starsi ludzie siedzą sami w domach i nie mają z kim pogadać",
 "session_id": "b3f1...", "gmina": "Wieliczka", "severity_self": 3,
 "reporter_type": "RESIDENT", "contact_email": null}
```
Model `ChatRequest` (T08). Nieznana gmina → **422 przed otwarciem strumienia** (preprocessing przed `StreamingResponse`). Tylko POST — bez wariantu GET (treść w URL trafia do logów, historii, Referer).

**Zdarzenia** (pełna tabela w T09): `status* → candidates → (token* [→ answer_retracted] | no_match) → report_saved? → done`; `error` w dowolnym miejscu, po nim ostatecznie `done`. Ramka `event: <nazwa>\ndata: <json>\n\n` (json w jednej linii, `ensure_ascii=False`). Nagłówki: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no`, `X-Request-Id`.

**Algorytm generatora:**
```
t0 = perf_counter()
yield status(preprocess)                              # q policzone przed strumieniem
yield status(search)
try: r = await orchestrator.retrieve(q)
except ProviderError as e:
    spawn(save_report_and_event(query=q, query_vec=None, request=req, search=None))
    yield error(e.code, message_pl); yield done(search_event_id=None, total); return
yield status(rerank)
try: result = await orchestrator.finalize(r)
except ProviderError: (jak wyżej, z query_vec=r.query_vec)
save_task = spawn(save_report_and_event(query=q, query_vec=r.query_vec, request=req, search=result))
yield candidates(solutions, also_see, context)         # zawsze, także przed no_match
flags = {}
if not result.matched:
    yield no_match(reason="below_threshold", best_score=gate.score, gate=gate.source,
                   message_pl=NO_MATCH_MESSAGE_PL)
elif settings.LLM_ENABLED:
    yield status(answer)
    f = CitationFilter(len(result.solutions))
    try:
        async for chunk in generate(...): out = f.feed(chunk); if out: yield token(out)
        tail = f.flush(); if tail: yield token(tail)
        if f.should_retract: yield answer_retracted("no_citations"); flags["answer_retracted"] = True
    except ProviderError: yield error("LLM_UNAVAILABLE", ...)
    if f.hallucinated: flags["citation_hallucination"] = True
try:
    saved = await asyncio.wait_for(asyncio.shield(save_task), settings.SAVE_WAIT_SECONDS)
    yield report_saved(saved.report_id, saved.similar_count, saved.gmina_count)
except Exception: log (bez treści), saved = None      # brak report_saved = zapis nieudany
if saved and saved.search_event_id and flags: spawn(update_search_event(saved.search_event_id, flags=flags, latency_ms={"llm": ...}))
yield done(search_event_id=saved.search_event_id if saved else None, latency_ms={"total": ms})
```
- Rozłączenie klienta anuluje generator, ale **nie** zapis (`spawn` + `shield`).
- Nieoczekiwany wyjątek w generatorze: `error` (`INTERNAL`) + `done` — `done` zawsze.
- `LLM_ENABLED=false`: generacja pominięta, karty to pełna odpowiedź.
- Kody błędów: `EMBEDDING_UNAVAILABLE`, `RERANK_UNAVAILABLE`, `LLM_UNAVAILABLE`, `INTERNAL`; `message_pl` po polsku, np. „Wyszukiwanie jest chwilowo niedostępne. Spróbuj ponownie za chwilę.”

**Gotowe, gdy:** po ingeście seedu:
```bash
curl -N -X POST localhost:8000/api/chat -H 'Content-Type: application/json' \
  -d '{"message":"U nas w gminie starsi ludzie siedzą sami w domach i nie mają z kim pogadać","session_id":"s1"}'
```
pokazuje strumień w kolejności z tabeli; to samo z `"session_id":"s2"` → `similar_count = 1`; zapytanie bez związku z korpusem → `candidates` + `no_match` + `report_saved` + `done`, w bazie raport z `matched=false`; `LLM_ENABLED=false` → brak `token`; `RERANK_ENABLED=false` → działa (bramka cosinusowa); zły `OPENAI_API_KEY` → `error EMBEDDING_UNAVAILABLE` + `done`, raport zapisany; `"gmina":"Gotham"` → 422 JSON; przerwanie curl (Ctrl+C) w trakcie generacji nadal zostawia raport w bazie.

---

## T20 — Endpointy zgłoszeń i odpowiedzi

**Zależy od:** T15, T18
**Pliki:** `api/routers/reports.py`

**Cel:** kontrakt Panelu administratora dla zgłoszeń + odpowiedzi do autora. Endpointy otwarte (bez autoryzacji).

| Endpoint | Opis |
|---|---|
| `GET /api/reports` | `Page[ReportListItem]`. Parametry: `matched`, `status`, `category`, `gmina`, `reporter_type`, `limit` (50, max 200), `offset`; sortowanie `created_at DESC`. `matched=false` = lista „bez dopasowania” (indeks `reports_unmatched_idx`). `reply_count` = liczba odpowiedzi |
| `GET /api/reports/{id}` | `ReportDetail`; brak → 404 |
| `GET /api/reports/{id}/similar` | Do `SIMILAR_REPORTS_LIMIT` zgłoszeń ≥ `SIMILAR_REPORT_THRESHOLD` (`find_similar_reports`, T18) → `list[SimilarReport]` |
| `PATCH /api/reports/{id}` | `{status}`; dozwolone: `NEW→TRIAGED`, `TRIAGED→MATCHED`, `TRIAGED→IN_PROGRESS`, `MATCHED→IN_PROGRESS`, `MATCHED→CLOSED`, `IN_PROGRESS→CLOSED`. Inne → 409 `INVALID_TRANSITION`. Ten sam status → 200 bez zmian. Zwraca `ReportDetail` |
| `POST /api/reports/{id}/replies` | `ReplyCreate {body (1–4000), author_label?}` → 201 `Reply`. Zgłoszenie w `NEW`, `TRIAGED` albo `MATCHED` przechodzi na `IN_PROGRESS` |
| `GET /api/reports/{id}/replies` | `list[Reply]` rosnąco po `created_at` |

- **`contact_email` nigdy nie jest zwracany** — modele z T08 nie mają tego pola; serializuj jawnie wybrane kolumny.
- `author_label` to wolny tekst, niezweryfikowany — w odpowiedzi `author_verified: false`.
- Autor odczytuje odpowiedzi po `report_id` z `report_saved` (bez websocketów, odpytywanie przy wejściu na stronę).

**Gotowe, gdy:** po kilku zgłoszeniach z T19: `curl localhost:8000/api/reports?matched=false` zwraca tylko niedopasowane; `GET …/{id}/similar` dla zgłoszenia z sesji `s2` pokazuje to z `s1`; `POST …/replies` → 201 i status `IN_PROGRESS`; `GET …/replies` zwraca odpowiedź; `PATCH` `NEW→CLOSED` → 409; `body` 4001 znaków → 422; `grep -c contact_email` na odpowiedziach wszystkich endpointów = 0.

---

## T21 — Endpointy rozwiązań

**Zależy od:** T06, T15
**Pliki:** `api/routers/solutions.py`

**Cel:** katalog dla JST i mieszkańców, przyjmowanie nowych rozwiązań do kolejki i ich zatwierdzanie. Endpointy otwarte.

| Endpoint | Opis |
|---|---|
| `GET /api/solutions` | `Page[SolutionCard]`, `scores: null`, `rank` = `offset + i + 1`. Parametry: `kind` (domyślnie SOLUTION), `category`, `gmina`, `powiat`, `tag`, `evidence_min`, `q` (trigram po tytule: `title % :q OR title ILIKE '%'||:q||'%'`, sort po `similarity(title, :q)` gdy `q`), `status` (domyślnie PUBLISHED), `sort=recent\|evidence`, `limit` (20, max 100), `offset` |
| `GET /api/solutions/{id}` | `SolutionDetail` (karta + `body`), dowolny status; brak → 404. Bez `contact` |
| `POST /api/solutions` | `SolutionSubmit` → 201 `{"id": ..., "status": "PENDING_REVIEW"}`. Wymusza `kind=SOLUTION`, `origin=USER_SUBMITTED`, `status=PENDING_REVIEW`, `evidence_level=1`, `contact={}`. `content_hash` + `rebuild_chunks` (chunkowanie i embedding od razu), ale wyszukiwanie go nie widzi do zatwierdzenia (filtr statusu w torach). Kategoria spoza taksonomii → 422; gmina spoza listy → 422; powiat z gminy |
| `PATCH /api/solutions/{id}` | `SolutionPatch {status?, evidence_level?, category?}` → `SolutionDetail`. Działa od razu — chunki nie mają kopii statusu. `updated_at = now()` |

- `PENDING_REVIEW` chroni przed zatruciem wyników — `POST` nigdy nie publikuje od razu.
- Błąd embeddingu przy `POST` (`ProviderError`) → 503 `EMBEDDING_UNAVAILABLE` i wycofanie transakcji.
- Karty wyłącznie przez `api/cards.py`.

**Gotowe, gdy:** `POST` nowego rozwiązania → 201, w bazie PENDING_REVIEW z chunkami i embeddingami; `GET /api/solutions` go nie pokazuje, `?status=PENDING_REVIEW` pokazuje; `/api/search` z jego tytułem go nie zwraca; po `PATCH status=PUBLISHED` pojawia się w katalogu i w `/api/search`; filtry `category`, `evidence_min`, `q` działają; brak klucza `contact` w odpowiedziach.

---

## T22 — Skrzynka „Nowe” i statystyki

**Zależy od:** T15
**Pliki:** `api/routers/staff.py`

**Cel:** powiadomienia dla Hubu widoczne w Panelu administratora (zamiast webhooka, ADR-018) i trendy. Endpointy otwarte.

- `GET /api/inbox`:
  ```json
  {
    "new_reports": 12,               // reports.status = 'NEW'
    "new_unmatched": 5,              // status = 'NEW' AND NOT matched
    "pending_solutions": 3,          // solutions.status = 'PENDING_REVIEW'
    "latest_reports": [ReportListItem, ...],   // 10 najnowszych NEW, created_at DESC
    "latest_pending": [SolutionCard, ...]      // 10 najnowszych PENDING_REVIEW, scores null
  }
  ```
  Panel odpytuje co 30 s. Pozycja znika, gdy zmieni się status zgłoszenia albo rozwiązanie zostanie zatwierdzone/odrzucone (wynika z filtrów — bez stanu „przeczytane”).
- `GET /api/stats` — parametry `from`, `to` (ISO, domyślnie ostatnie 90 dni), `category`, `gmina`:
  ```json
  {
    "from": "2026-07-05", "to": "2026-10-03",
    "total": 120, "matched": 80, "unmatched": 40,
    "by_category": [{"category": "LONELINESS", "label_pl": "...", "total": 30, "matched": 20, "unmatched": 10}],
    "by_gmina":    [{"gmina": "Wieliczka", "powiat": "wielicki", "total": 9, "matched": 5, "unmatched": 4}],
    "by_week":     [{"week": "2026-09-28", "total": 14, "matched": 9, "unmatched": 5}],
    "by_reporter_type": [{"reporter_type": "JST", "total": 10, "matched": 6, "unmatched": 4}]
  }
  ```
  `GROUP BY category / gmina / date_trunc('week', created_at) / reporter_type`, `count(*) FILTER (WHERE matched)`. Brak gminy → `gmina: null`.
- `contact_email` nigdy w odpowiedzi.

**Gotowe, gdy:** po zgłoszeniach z T19 i jednym `POST /api/solutions`: liczniki `inbox` zgadzają się z `SELECT` w psql; `PATCH` statusu zgłoszenia zmniejsza `new_reports`; w `stats` `matched + unmatched = total` w każdej grupie; filtr `category` działa.

---

## T23 — Endpointy meta: taksonomia, gminy, feedback, healthz

**Zależy od:** T03, T15
**Pliki:** `api/routers/meta.py`

**Cel:** słowniki dla frontendu (UI nie hardkoduje nazw wyzwań i gmin), feedback, stan systemu.

| Endpoint | Opis |
|---|---|
| `GET /api/taxonomy` | `list[TaxonomyItem {code, label_pl, description, sort_order}]` z `challenge_taxonomy`, po `sort_order` |
| `GET /api/gminy` | `list[GminaItem {name, powiat}]` z `data/gminy-malopolska.json` (182), sort po `strip_accents(name)`. Wczytaj raz (własny loader albo `GMINY` z `api.pipeline.preprocess`, jeśli już istnieje) |
| `POST /api/feedback` | `FeedbackCreate {search_event_id, solution_id?, helpful}` → 204; ustawia `helpful` i `clicked_solution_id` w `search_events`. Nieznany `search_event_id` → 404; nieistniejący `solution_id` → 422 |
| `GET /healthz` | na `health_router` (bez `/api`): `{"db": "ok"\|"error", "embedding_provider": "openai", "rerank_provider": "cohere"\|"noop", "llm_enabled": true}`; `db` = `SELECT 1`; 200 gdy ok, 503 (ten sam JSON) gdy błąd bazy. Nie woła zewnętrznych API |

`GET /api/taxonomy` i `GET /api/gminy`: `Cache-Control: public, max-age=3600`.

**Gotowe, gdy:** `curl` → taxonomy 9 pozycji w kolejności; gminy 182 z powiatami; feedback na `search_event_id` z `done` → 204 i `helpful` w bazie, nieznany id → 404; `/healthz` → `db: "ok"`, `rerank_provider: "noop"` przy `RERANK_ENABLED=false`; po `docker compose stop db` → 503.

---

## T24 — Seed zgłoszeń demo i `scripts/seed_reports.py`

**Zależy od:** T07, T19
**Pliki:** `data/reports-seed.json`, `scripts/seed_reports.py`

**Cel:** dane, na których licznik „N osób z M gmin” pokazuje coś na demo, a próg `SIMILAR_REPORT_THRESHOLD` da się sprawdzić.

**Kontekst:**
- 10–15 zgłoszeń: kilka grup parafraz tego samego problemu z **różnych sesji i gmin** (np. 4–5 wariantów „starsi ludzie są samotni” z Wieliczki, Myślenic, Bochni, Nowego Targu), kilka różnych problemów, 2 problemy bez rozwiązania w korpusie (mają dać `no_match`).
- Format: `[{"message": "...", "session_id": "seed-demo-01", "gmina": "Wieliczka", "reporter_type": "RESIDENT", "severity_self": 3}]`. `session_id` z prefiksem `seed-demo-` (usunięcie: `DELETE FROM reports WHERE session_id LIKE 'seed-demo-%'`).
- Zgłoszenia idą **przez API** (`POST /api/chat`), żeby `matched`, embedding i `search_events` były prawdziwe. Bez danych osobowych.

**Kroki:** `scripts/seed_reports.py` — `httpx.AsyncClient`, dla każdego wpisu `POST {API_URL}/api/chat` (`--api-url`, domyślnie `http://localhost:8000`), czytanie strumienia do `done`, wypisanie `report_id`, `matched`, `similar_count`, `gmina_count`. `--purge` usuwa wcześniejsze zgłoszenia seedu (`SessionLocal`, `DELETE … LIKE 'seed-demo-%'`). Na końcu tabela podsumowania.

**Gotowe, gdy:** po `make up && make ingest && python -m scripts.seed_reports --purge` ostatnie parafrazy z grupy mają `similar_count ≥ 2` i `gmina_count ≥ 2`, a różne problemy `similar_count = 0`. Jeśli nie — obserwacje do „Uwag” dla T25 (progu nie zmieniaj w kodzie).

---

## T25 — Kalibracja progów i próba generalna ścieżki demo

**Zależy od:** T20, T21, T22, T23, T24, T26
**Pliki:** `docs/modules/01-matchmaking/module-1-calibration.md`, `.env.example` (tylko wartości progów)

**Cel:** ręczne ustawienie progów (ADR-014) i przejście pełnej ścieżki demo curlami.

**Kontekst:**
- Progi startowe zgadywane: `MIN_RERANK_SCORE=0.35`, `MIN_COSINE_SCORE=0.50`, `SIMILAR_REPORT_THRESHOLD=0.82`. Korekta wyłącznie przez zmienne środowiskowe.
- `GET /api/search` pokazuje oba tory osobno, fuzję, rerank i decyzję bramki.
- `SIMILAR_REPORT_THRESHOLD` za nisko → „9 osób” przy każdym zapytaniu; za wysoko → zawsze 0.
- `RRF_K=60` nie zmieniaj.

**Kroki:**
1. ~15 zapytań: parafrazy bez wspólnych słów z tytułami, nazwy własne / akronimy / numery uchwał, zapytania bez polskich znaków, 3–4 problemy bez rozwiązania (muszą dać `no_match`).
2. Każde przez `GET /api/search?q=...` z `rerank=true` i `rerank=false`; tabela: `lexical` niepuste?, top 3, `gate.score`, `passed`, ocena sensowności.
3. Dobierz `MIN_RERANK_SCORE` i `MIN_COSINE_SCORE` tak, by zapytania bez rozwiązania dawały `no_match`, a trafne przechodziły. Wpisz do `.env` i `.env.example`.
4. Na seedzie zgłoszeń (T24) sprawdź `SIMILAR_REPORT_THRESHOLD` przez `GET /api/reports/{id}/similar` (pole `similarity`); dobierz wartość.
5. Pełna ścieżka demo (≤ 3 min, do nagrania jako zapas):
   1. `POST /api/chat` → karty, streszczenie, „N osób z M gmin”, `report_id`,
   2. `GET /api/inbox` → nowe zgłoszenie widoczne,
   3. `GET /api/reports/{id}` i `GET /api/reports/{id}/similar`,
   4. `POST /api/reports/{id}/replies` (odpowiedź eksperta) → status `IN_PROGRESS`,
   5. `GET /api/reports/{id}/replies` (autor czyta odpowiedź),
   6. `POST /api/solutions` → widoczne w `inbox.latest_pending` → `PATCH status=PUBLISHED` → pojawia się w `/api/chat` dla pasującego zapytania,
   7. `GET /api/stats` → sumy się zgadzają.
   Zapisz komendy w `docs/modules/01-matchmaking/module-1-calibration.md`.
6. Plan awaryjny: hotspot; `RERANK_ENABLED=false` / `LLM_ENABLED=false`, gdy pada jeden dostawca; nagrany film.

**Gotowe, gdy:** `docs/modules/01-matchmaking/module-1-calibration.md` zawiera tabelę 15 zapytań z wynikami, wybrane progi z uzasadnieniem, komendy ścieżki demo (wszystkie kroki przechodzą) i plan awaryjny; zapytania bez rozwiązania dają `no_match`.

---

## T26 — Scraper Biblioteki Innowacji Społecznych ROPS

**Zależy od:** T00, T03
**Pliki:** `scripts/scrape_rops.py`, `data/solutions/rops-biblioteka.json`, `data/raw/rops-biblioteka.raw.json`, `data/rops-category-map.json`, `pyproject.toml` (tylko dopisanie zależności `beautifulsoup4`), `.gitignore` (tylko dopisanie `data/raw/html-cache/`)

**Cel:** pobrać realny korpus innowacji z Biblioteki Innowacji Społecznych ROPS Kraków i zapisać go w formacie pośrednim ingestu (T04/T07), żeby `make ingest` załadował go bez zmian w kodzie. Interesuje nas: podział na kategorie, nazwa innowacji, teksty ze strony szczegółów („Więcej”) oraz **linki** do materiałów. **Materiałów nie pobieramy** (żadnych PDF, ZIP, filmów, obrazków).

**Kontekst — struktura strony (sprawdzona 2026-10-03, statyczny HTML, bez JS i bez paginacji):**
- Lista kategorii: `https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/kategorie` — linki `href="/innowacje-spoleczne/biblioteka-innowacji-spolecznych/<slug-kategorii>"` (ten sam link występuje też z prefiksem `http(s)://rops.krakow.pl` — deduplikuj po ścieżce, pomiń sam `/kategorie`). Obecnie 9 kategorii:

  | slug | liczba innowacji |
  |---|---|
  | dla-cudzoziemcow | 6 |
  | dla-dzieci-mlodziezy-i-rodziny | 21 |
  | dla-osob-o-ograniczonej-mobilnosci | 18 |
  | dla-osob-w-kryzysie-bezdomnosci | 2 |
  | dla-osob-z-niepelnosprawnoscia-intelektualna | 14 |
  | dla-osob-z-niepelnosprawnoscia-sensoryczna | 20 |
  | dla-rynku-pracy | 5 |
  | dla-seniorow | 20 |
  | dla-zdrowia-i-medycyny | 9 |

  Razem 115 unikalnych innowacji (stan na dzień sprawdzenia; nie hardkoduj listy — czytaj ją ze strony).
- Strona kategorii: nazwa kategorii w `h2.page-title` (np. „Dla seniorów”). Innowacje to `div.news-list__item`; w środku:
  - `a.news-list__title` — nazwa innowacji, `href` = strona szczegółów (`/innowacje-spoleczne/biblioteka-innowacji-spolecznych/<slug-kategorii>,<slug-innowacji>`),
  - `p.news-list__desc` — krótki opis: pierwszy `<p>` to jednozdaniowy opis (np. „BaWita - tablica manipulacyjno terapeutyczna dla seniorów…”), dalej `<p><strong>INNOWACJA WYBRANA DO UPOWSZECHNIANIA W RAMACH PROJEKTU "…"</strong></p>` i tabela ikon z linkami,
  - `a.btn-read-more` („Więcej”) — ten sam link do strony szczegółów.
  - Na górze listy jest akapit „STRONA JEST W PRZEBUDOWIE…” — to nie innowacja, pomiń.
- Strona szczegółów: tytuł w `h2.page-title`, treść w pierwszym `div.text-content` wewnątrz `div.content__main` (nie bierz nic spoza tego kontenera — niżej są moduły „Publikacje”, menu, stopka). W treści:
  - `<p><strong>INNOWACJA WYBRANA DO UPOWSZECHNIANIA W RAMACH PROJEKTU "<nazwa projektu>"</strong></p>` → nazwa projektu,
  - tabela linków: pierwszy wiersz zawiera `<a href>` w komórkach, drugi wiersz w tych samych kolumnach etykiety: „dowiedz się więcej” (ikona `lupa.png`, zwykle PDF), „zobacz film” (`play_black.png`, YouTube), „pobierz materiały” (`read2.png`, ZIP), „sprawdź zasady wykorzystania” (licencja CC lub PDF z zasadami), „otwórz w telefonie” (sam obrazek QR, bez linku — pomiń). Etykiety bywają łamane `<br />` i różnie dzielone („dowiedz<br/>się więcej” / „dowiedz się<br/>więcej”) — normalizuj białe znaki. Bywa dodatkowy pusty wiersz.
  - sekcje `h4` numerowane, zwykle: „1. Na czym polega rozwiązanie?”, „2. Jakich problemów dotyczy innowacja?”, „3. Grupa docelowa”, „4. Kto może skorzystać z innowacji?”, „5. Czy to działa?”, „6. Autorzy” — treść sekcji to elementy między kolejnymi `h4` (`p`, `ul/li`). Nie zakładaj stałej liczby ani nazw sekcji; zbieraj wszystkie `h4` generycznie.
- Linki względne (`/mpliki/...`) zamieniaj na absolutne z bazą `https://rops.krakow.pl`. Jeden link (`/pliki/IS/bibloteka/*.zip`) bywa już absolutny. Niektóre linki mogą być martwe — **nie sprawdzaj ich** (nie wykonuj żądań do materiałów).
- `robots.txt` zwraca 404 (brak ograniczeń), ale scrapuj grzecznie: jedno żądanie naraz, `sleep 1 s` między żądaniami, nagłówek `User-Agent: SplotHackYeah2026/0.1 (+kontakt w repozytorium)`, timeout 20 s, 3 próby z backoffem. Łącznie ok. 125 żądań HTML.

**Kontekst — format docelowy (format pośredni ingestu, T04/T07):** lista obiektów z polami `kind, title, summary, body, organization, gmina, powiat, category, tags, target_group, cost_range, implementation_steps, contact, source_url, source_name, evidence_level, media`. `category` musi być kodem z taksonomii (AGING, MENTAL_HEALTH, LONELINESS, DIGITAL_EXCLUSION, SERVICE_ACCESS, COORDINATION, DEPOPULATION, SUBURBAN_GROWTH, OTHER) — inaczej ingest odrzuci rekord. `source_url` musi być unikalny (unikalny indeks w bazie).

**Mapowanie pól:**

| Pole formatu pośredniego | Źródło |
|---|---|
| `kind` | `"SOLUTION"` |
| `title` | `h2.page-title` strony szczegółów (fallback: `a.news-list__title`) |
| `summary` | pierwszy `<p>` z `p.news-list__desc` na liście kategorii; jeśli pusty — pierwsze zdanie sekcji „Na czym polega rozwiązanie?” |
| `body` | wszystkie sekcje `h4` **poza „Autorzy”**, jako markdown: `## <nagłówek bez numeru>\n\n<tekst akapitów, listy jako "- ">\n\n` (nagłówki `##` są potrzebne chunkowaniu, T06) |
| `target_group` | tekst sekcji „Grupa docelowa” (obcięty do 300 znaków), jeśli jest |
| `implementation_steps` | `[]` (strona ich nie podaje) |
| `cost_range` | `null` |
| `organization`, `gmina`, `powiat` | `null` (strona nie podaje) |
| `contact` | `{"name": null, "email": null, "phone": null}` |
| `category` | z `data/rops-category-map.json` po slugu kategorii ROPS (patrz niżej) |
| `tags` | `["ROPS: <nazwa kategorii ROPS>", "Projekt: <nazwa projektu>"]` (+ każda dodatkowa kategoria, gdy innowacja występuje w kilku) |
| `source_url` | absolutny URL strony szczegółów (bez parametrów zapytania) |
| `source_name` | `"Biblioteka Innowacji Społecznych ROPS Kraków"` |
| `evidence_level` | `3` (innowacje przetestowane w inkubatorach ROPS); `2`, gdy brak sekcji „Czy to działa?” |
| `media` | linki z tabeli: `{"type": "document" \| "video" \| "materials" \| "license" \| "link", "url": "<absolutny>", "title": "<etykieta z drugiego wiersza, np. „Dowiedz się więcej”>"}`; typ po etykiecie, a gdy jej brak — po rozszerzeniu (`.pdf` → document, `youtube.com`/`youtu.be` → video, `.zip` → materials, `creativecommons.org` → license). Bez obrazków i ikon. Deduplikuj po URL |

**Mapowanie kategorii ROPS → taksonomia** (`data/rops-category-map.json`, edytowalne bez zmiany kodu; scraper czyta ten plik i przerywa z błędem, jeśli trafi na slug bez wpisu):
```json
{
  "dla-seniorow": "AGING",
  "dla-zdrowia-i-medycyny": "MENTAL_HEALTH",
  "dla-dzieci-mlodziezy-i-rodziny": "SERVICE_ACCESS",
  "dla-osob-o-ograniczonej-mobilnosci": "SERVICE_ACCESS",
  "dla-osob-w-kryzysie-bezdomnosci": "SERVICE_ACCESS",
  "dla-osob-z-niepelnosprawnoscia-intelektualna": "SERVICE_ACCESS",
  "dla-osob-z-niepelnosprawnoscia-sensoryczna": "SERVICE_ACCESS",
  "dla-rynku-pracy": "COORDINATION",
  "dla-cudzoziemcow": "SERVICE_ACCESS"
}
```
Kategorie ROPS są wg grup odbiorców, a taksonomia Hubu wg wyzwań — mapowanie jest przybliżone. Oryginalna kategoria zawsze zostaje w `tags` i w surowym zrzucie.

**Dane osobowe:** sekcja „Autorzy” zawiera imiona i nazwiska — **nie** trafia do `body`, `summary` ani `tags` (zasada: zespół nie wnosi danych osobowych z materiałów ROPS do korpusu). Zostaje wyłącznie w surowym zrzucie `data/raw/…`.

**Kroki:**
1. Dopisz `beautifulsoup4` do zależności w `pyproject.toml` (tylko ta linia). Używaj `httpx` (synchronicznie wystarczy) + `BeautifulSoup(html, "html.parser")`.
2. `scripts/scrape_rops.py`, uruchamianie `python -m scripts.scrape_rops [--cache-dir data/raw/html-cache] [--no-cache] [--limit N] [--delay 1.0]`:
   1. pobierz listę kategorii, potem każdą stronę kategorii, potem każdą stronę szczegółów;
   2. cache HTML na dysku (`data/raw/html-cache/<sha1(url)>.html`) — ponowne uruchomienie nie odpytuje serwisu; `--no-cache` wymusza pobranie; dopisz `data/raw/html-cache/` do `.gitignore`;
   3. innowacja występująca w kilku kategoriach (ten sam slug innowacji) = jeden rekord; kategorie łączone, `category` z pierwszej kategorii w kolejności z tabeli mapowania, wszystkie kategorie w `tags`;
   4. błąd jednej strony szczegółów (404, timeout po 3 próbach, brak `h2.page-title`) — zaloguj URL i pomiń rekord, nie przerywaj;
   5. zapisz **surowy zrzut** `data/raw/rops-biblioteka.raw.json`: `{"scraped_at": "<ISO>", "source": "<URL kategorii>", "categories": [{"slug", "name", "url", "innovations": [<slug>, …]}], "innovations": [{"slug", "url", "title", "list_description", "project", "categories": [<slug>], "sections": [{"heading", "text"}], "links": [{"label", "url"}]}]}` — wszystkie sekcje, w tym „Autorzy”;
   6. zapisz **format pośredni** `data/solutions/rops-biblioteka.json` (lista rekordów wg tabeli mapowania), posortowany po `source_url`, `ensure_ascii=False`, `indent=2` — deterministyczny diff między uruchomieniami;
   7. na końcu podsumowanie: liczba kategorii, innowacji per kategoria, rekordów zapisanych, pominiętych (z URL-ami), linków per typ.
3. Tekst: zbij białe znaki, zamień `&nbsp;` na spację, usuń puste akapity, zachowaj polskie znaki (NFC). Nie wycinaj treści merytorycznej.

**Nie rób:** pobierania PDF/ZIP/filmów/obrazków ani sprawdzania, czy linki działają; uruchamiania przeglądarki (Playwright/Selenium — strona jest statyczna); zapisu do bazy (to robi `make ingest`, T07); wpisywania autorów do formatu pośredniego.

**Gotowe, gdy:**
- `python -m scripts.scrape_rops` kończy się podsumowaniem z 9 kategoriami i ~115 rekordami (różnica tylko o pominięte strony z logiem przyczyny);
- drugie uruchomienie (z cache) nie wykonuje żadnego żądania HTTP i daje identyczny plik (`git diff --stat` pusty);
- `python -c` na `data/solutions/rops-biblioteka.json`: każdy rekord ma niepusty `title`, `summary`, `body` z co najmniej jednym `## `, `category` z taksonomii, unikalny `source_url`; żaden `body` nie zawiera nagłówka „Autorzy”; `media` zawiera wyłącznie URL-e `http(s)://` i żaden nie wskazuje na `iKONY_na_www`;
- przykładowo rekord „BaWita” ma `category = "AGING"`, tag `ROPS: Dla seniorów`, w `media` link PDF („Dowiedz się więcej”), YouTube („Zobacz film”) i ZIP („Pobierz materiały”);
- jeśli T07 jest już `[x]`: `python -m scripts.ingest data/solutions/rops-biblioteka.json --dry-run` nie zgłasza błędnych rekordów.

---

## Uwagi między zadaniami

Format: `- [Txx → Tyy] <opis> — <agent>, <data>`. Dopisuj tylko na końcu, nie edytuj cudzych wpisów.

- [ORCH] Decyzja: w środowisku brak kluczy OPENAI/COHERE/ANTHROPIC (puste w `.env` i w env). Żeby nie blokować pracy, dodajemy **deweloperski** provider embeddingów `hash` (`api/providers/embeddings_hash.py`, `EMBEDDING_PROVIDER=hash`): deterministyczny wektor 1024 z haszowanych n-gramów znakowych, L2-normalizowany, bez zależności sieciowych. Domyślna wartość w `config.py` pozostaje `openai`; `hash` służy tylko do ręcznej weryfikacji bez kluczy. Odstępstwo od ADR-015 („jedyna implementacja”) — do weryfikacji przez zespół; usunięcie = skasowanie pliku + gałęzi w fabryce. Korpus i zapytania muszą być liczone tym samym providerem (zmiana providera ⇒ `make reset-db && make ingest`). — orkiestrator, 2026-10-03
- [ORCH] Decyzja: lokalny `.env` przepisany pod tryb bez kluczy (`EMBEDDING_PROVIDER=hash`, `RERANK_ENABLED=false`, `LLM_ENABLED=false`, `DATABASE_URL` na `localhost`); stara wersja w `.env.bak-orch` (zawierała nieaktualne zmienne: `local`/bge-m3, `HNSW_EF_SEARCH`, `RATE_LIMIT_CHAT`). — orkiestrator, 2026-10-03
- [ORCH] Decyzja: systemowy Python to 3.10, więc venv `.venv` z Pythonem 3.12 utworzony przez `uv` (`~/.local/bin/uv`). Komendy uruchamiamy przez `.venv/bin/python`, instalacja: `~/.local/bin/uv pip install --python .venv/bin/python -e '.[dev]'`. — orkiestrator, 2026-10-03
- [ORCH] Decyzja: statusy w liście „Status zadań” aktualizuje orkiestrator (zadania wykonują subagenci, część zadań zgrupowana w jednym agencie, np. T01+T02), żeby uniknąć wyścigów przy edycji tego pliku. Subagenci dopisują tu tylko uwagi. Puste katalogi-pozostałości (`api/migrations`, `tests/fixtures`, `scripts/scrapers`) zostawione bez zmian. — orkiestrator, 2026-10-03
- [T03 → T10, T23, T25] `data/gminy-malopolska.json` zawiera **183** gminy, nie 182: od 1.01.2025 istnieje gmina wiejska Szczawa (pow. limanowski, wydzielona z gm. Kamienica). Stan 2026: 14 miejskich, 50 miejsko-wiejskich, 119 wiejskich; 19 powiatów + 3 miasta na prawach powiatu (źródło: pl.wikipedia „Podział administracyjny województwa małopolskiego”, MUW Kraków; w 2026 r. brak nowych miast w Małopolsce). Kolizje nazw: gminy wiejskie o nazwie miasta mają sufiks ` (gmina wiejska)` (Bochnia, Gorlice, Grybów, Jordanów, Limanowa, Mszana Dolna, Nowy Targ, Oświęcim, Tarnów); dwie pary gmin wiejskich o tej samej nazwie mają sufiks powiatu: `Bolesław (powiat dąbrowski)` / `Bolesław (powiat olkuski)`, `Spytkowice (powiat nowotarski)` / `Spytkowice (powiat wadowicki)`. Nie zakładajcie liczby 182 w walidacji. — orch-T03, 2026-10-03
- [T00 → T05] `settings.EMBEDDING_PROVIDER` ma typ `Literal["openai", "hash"]` (inna wartość = błąd walidacji przy starcie), `RERANK_PROVIDER` to `Literal["cohere", "noop"]`. Fabryka w `api/providers/__init__.py` może na tym polegać. — orch-T00, 2026-10-03
- [T00 → wszyscy] Ruff: `line-length=100`, reguły `E,F,W,I,B,UP` (sortowanie importów, bugbear, pyupgrade). `make fmt` naprawia większość automatycznie; `make lint` = `ruff check .`. Makefile używa `.venv/bin/python` / `.venv/bin/ruff`, jeśli istnieją (`PY ?=`). `make db` / `make reset-db` czekają na healthcheck (`--wait`). `beautifulsoup4` jest już w zależnościach (dla T26). Katalog `db/` ma tylko `.gitkeep` — `init.sql` dodaje T01. — orch-T00, 2026-10-03
- [T05 → T12, T14, T25] Provider `hash` (`api/providers/embeddings_hash.py`) daje cosinusy w innej skali niż OpenAI: „starsi ludzie są samotni” vs „samotność osób starszych” ≈ 0.37, vs „naprawa dróg gminnych” ≈ 0.0; „seniorzy”/„klub dla seniorów” ≈ 0.28. Przy `MIN_COSINE_SCORE=0.50` bramka „nie wiem” w trybie `hash` będzie odrzucać prawie wszystko — do lokalnej weryfikacji ustawcie w `.env` niższy próg (np. `MIN_COSINE_SCORE=0.2`, `SIMILAR_REPORT_THRESHOLD` analogicznie), nie zmieniajcie domyślnych w kodzie. `ProviderError` ma atrybuty `.provider` i `.code`; brak klucza Cohere/Anthropic → `ProviderError` przy pierwszym wywołaniu (nie przy imporcie/fabryce). `get_llm_provider()` nie sprawdza `LLM_ENABLED` — to robi wywołujący (T17/T19). — orch-T05, 2026-10-03
- [ORCH] Decyzja: w lokalnym `.env` (tryb `hash`) ustawione `MIN_COSINE_SCORE=0.20` i `SIMILAR_REPORT_THRESHOLD=0.60` — wartości domyślne w `config.py` (0.50 / 0.82) bez zmian, bo dotyczą OpenAI. Ostateczna kalibracja w T25. — orkiestrator, 2026-10-03
- [T02 → T06, T18, T20, T21] `api/models.py`: relacje `Solution.chunks` i `Report.replies` (cascade delete-orphan, `passive_deletes`) — w async **brak lazy loadingu**: ładuj przez `selectinload(...)` albo zapytaniem; po `rollback()`/`commit()` z wygaszonymi atrybutami nie czytaj pól obiektu poza `await` (MissingGreenlet). `SolutionChunk.ts` to `Computed` (tylko odczyt). Enumy jako `enum.StrEnum` + `postgresql.ENUM(..., create_type=False)`. Wymiar wektora z `settings.EMBEDDING_DIM`. W venv jest SQLAlchemy 2.1.3. — orch-T01/T02, 2026-10-03
- [T08 → T09, T15–T23] `api/schemas.py` poza listą z T08 ma też: `Inbox`, `Stats` (+ `StatsByCategory/ByGmina/ByWeek/ByReporterType`; pole `from_` z aliasem `from` — serializuj `model_dump(by_alias=True)` / `response_model_by_alias` domyślne w FastAPI), `SolutionCreated {id, status}`, `Health`, `ErrorDetail`, stałe `STATUS_LABELS`, `NO_MATCH_MESSAGE_PL` (domyślna wartość `NoMatchEvent.message_pl`). `ChatRequest.message` jest walidowane (niepuste po strip), ale **nie** modyfikowane — `raw` idzie dosłownie. `SolutionSubmit` ma `extra="forbid"` (próba wysłania `contact`/`status` → 422). `load_solutions(session, ids)` przyjmuje dowolny iterable, deduplikuje, nie filtruje statusu ani `kind` (to robią tory); brakujące id po prostu nie występują w słowniku. `to_detail` ustawia `rank=1`, `scores=None`. Wpisy `media` bez `url` są pomijane na karcie. `text.stopwords()` liczy względny `DATA_DIR` od katalogu repozytorium (nie od cwd). — orch-T08, 2026-10-03
- [T26 → T07, T21, T25] Korpus ROPS: 9 kategorii, 115 rekordów (`data/solutions/rops-biblioteka.json`), 0 pominiętych; `--dry-run` ingestu: 115 dodanych, 0 błędnych. Wszystkie rekordy mają `organization/gmina/powiat = null` i zwykle 1–2 tagi (`ROPS: …`, `Projekt: …`) — tag projektu tylko w 27 rekordach, bo 88 stron nie ma akapitu „INNOWACJA WYBRANA…”; te same 88 nie mają linków „dowiedz się więcej”/„zobacz film” (media: materials=115, license=115, document=27, video=26). Linki ikon kategorii (pierwsza kolumna tabeli, prowadzą do strony kategorii) są pomijane w `media`. `evidence_level=2` w 4 rekordach (brak „Czy to działa?”). Błąd po stronie ROPS: „Urzędowy Ambaras” linkuje ZIP `pelnawokanda.zip` — zostawione bez zmian. `scraped_at` w surowym zrzucie = mtime najnowszego pliku cache, więc ponowne uruchomienie z cache daje identyczne oba pliki (0 żądań HTTP). Mapowanie kategorii jest przybliżone (7/9 kategorii → `SERVICE_ACCESS`) — do ewentualnej korekty w `data/rops-category-map.json` przy kalibracji (T25). — orch-T26, 2026-10-03
- [T06 → T07, T21] `api/chunking.py`: nagłówek markdown zamyka bieżący chunk (każdy chunk ma dokładnie jeden `heading`), więc krótkie sekcje seedu dają małe chunki (seed-demo: 47 rozwiązań → 122 chunki, maks. 744 znaki). Zakładka liczona z pełnych zdań (≤ `CHUNK_OVERLAP_CHARS`) tylko w obrębie sekcji. `rebuild_chunks` liczy embeddingi **przed** usunięciem starych chunków (błąd providera nie zostawia rozwiązania bez chunków), nie dotyka relacji `solution.chunks` (zapis przez `solution_id`), robi `flush`, nie commituje. — orch-T06, 2026-10-03
- [T07 → T21, T25] `scripts/ingest.py`: `origin=CURATED`, `status=PUBLISHED` ustawiane tylko przy wstawieniu — ponowny ingest nie przywraca statusu rozwiązania zarchiwizowanego/odrzuconego przez operatora. Hash niezmieniony, ale brak chunków lub chunk z `embedding IS NULL` ⇒ też przebudowa. Kod wyjścia 0 także przy błędnych rekordach (raport na stderr), żeby `make ingest` nie przerywał się na pojedynczym rekordzie. `--dry-run` czyta bazę (klasyfikacja dodane/zaktualizowane), ale nie pisze i nie woła API. W bazie zostaje zaingestowany tylko `seed-demo.json` (47); `rops-biblioteka.json` (115 rekordów w chwili testu) przechodzi `--dry-run` bez błędów. — orch-T07, 2026-10-03
- [ORCH] Do lokalnej bazy zaingestowano także `rops-biblioteka.json` (115 rekordów; razem 162 rozwiązania/wiedza). Embeddingi liczone providerem `hash` — po dodaniu klucza OpenAI potrzebne `make reset-db && make ingest`. — orkiestrator, 2026-10-03
- [T12/T13/T14 → T16, T19] `semantic_search(session, vec, kind="SOLUTION", limit=None)` zwraca `Candidate` z `cosine_similarity` i `rank` z SQL (ROW_NUMBER), `score=None`; `backfill_cosine` deduplikuje id i pomija chunki bez embeddingu (brak klucza w wyniku). `rrf_fuse` zwraca kopie słowników `ranks`; duplikat `solution_id` w jednym torze liczony raz (najlepsza pozycja) — tory i tak zwracają jedno rozwiązanie raz. `rerank_and_gate`: nie mutuje wejścia (`dataclasses.replace`), `reranked` ma ≤ `ANSWER_TOP_N + ALSO_SEE_N` pozycji (tyle zwraca provider), brak wpisu w `docs` → pusty dokument; bramka cosinusowa liczy max po **całym** `fused` (po backfillu — T16 musi uzupełnić cosinus przed wywołaniem, inaczej kandydaci tylko leksykalni odpadną w filtrze per pozycja). `ProviderError` z rerankera (np. fałszywy/pusty `COHERE_API_KEY` → `RERANK_UNAVAILABLE`) jest propagowany bez łapania — degradację (zdarzenie `error`) robi wywołujący. — orch-T12-T14, 2026-10-03
- [T17 → T19] `api/pipeline/answer.py`: `generate(query, cards, best_chunks, too_vague, llm)` zwraca surowe fragmenty; `ProviderError` (np. brak `ANTHROPIC_API_KEY` → `anthropic/LLM_UNAVAILABLE`) propaguje przy pierwszym `__anext__` — T19 łapie go i wysyła `error` (karty już poszły). `LLM_ENABLED` sprawdza wołający. Filtr: `f = CitationFilter(len(cards))`, każdy fragment przez `f.feed(t)` (wysyłaj `token` tylko gdy wynik niepusty), na końcu `f.flush()`, potem `f.should_retract` ⇒ `answer_retracted`. Poprawne `[n]` są normalizowane (`[01]` → `[1]`); wycięte zmyślone `[n]` zostawiają podwójną spację (akceptowane). `emitted_any` liczy tylko tekst niebiały. Obcięcie fragmentu chunku w promptcie (800 znaków) to stała modułu `FRAGMENT_CHARS` (format promptu, brak zmiennej w sekcji 11 / `config.py`) — jeśli zespół woli zmienną, T00 może dodać np. `ANSWER_FRAGMENT_CHARS`. — orch-T17, 2026-10-03
- [T18 → T19, T20] `api/pipeline/reports.py`: w liczniku podobnych warunek ze specyfikacji `r.session_id IS DISTINCT FROM :session_id` przy `session_id = NULL` odrzucałby wszystkie inne zgłoszenia bez sesji (`NULL IS DISTINCT FROM NULL` = false) — zastąpiony przez `(:session_id IS NULL OR r.session_id IS DISTINCT FROM :session_id)`; bez sesji wykluczane jest tylko samo zgłoszenie. `save_report_and_event` zapisuje `category='OTHER'` (kolumna i `extracted.category`), gdy preprocessing nie ustalił kategorii; `flags` dostaje też `too_vague: true`, gdy zapytanie zbyt ogólne. `update_search_event` scala JSONB `flags` i `latency_ms` (`||`), pusty argument = no-op. `find_similar_reports` zwraca `created_at` jako `datetime`, `similarity` jako `float`. — orch-T18, 2026-10-03
- [T09 → frontend, T19, T22] Mocki w `docs/mocks/` zbudowane z `data/solutions/seed-demo.json` (tytuły, gminy, tagi), `id` kart = pozycja w pliku seed (umowne, nie z bazy). Wszystkie linie `data:` i pliki JSON walidowane modelami z `api/schemas.py`; kolejność zdarzeń sprawdzona regexem. W `chat-error.sse` przed `error LLM_UNAVAILABLE` jest `status answer` (zgodnie z algorytmem T19). `replay.py` (domyślnie :8001) poza `POST /api/chat` serwuje też `GET /api/solutions|inbox|stats` z plików JSON i przyjmuje `?scenario=match|no-match|retracted|error` — to rozszerzenia tylko mocka, prawdziwe API ich nie ma. — orch-T09, 2026-10-03
- [ORCH] Decyzja: stała `FRAGMENT_CHARS` z T17 przeniesiona do `settings.ANSWER_FRAGMENT_CHARS` (domyślnie 800, dopisane w `config.py` i `.env.example`) — reguła „zero literałów limitów w pipeline”. — orkiestrator, 2026-10-03
- [T10 → T16, T19, T23] `preprocess()`: `UnknownGminaError(ValueError)` ma atrybut `.gmina`; `gmina` jest `strip()`-owana, pusty string = `None`; dopasowanie nazwy dokładne (wielkość liter i sufiksy typu ` (gmina wiejska)` jak w `GMINY`). Regex powitań ma `(?!\w)` (żeby „Hejt…” nie tracił „Hej”); wiadomość będąca samym powitaniem zostaje bez zmian (nie zwracamy pustego `normalized`). `expanded_terms` mogą zawierać frazy wielowyrazowe i formy typu `65+` (z `data/synonyms.json`) — T11 dzieli je `tokenize` i składa frazą `<->`. Dopasowanie synonimów i kategorii jest odporne na brak ogonków. Czas: ~0,7 ms dla typowego zgłoszenia, ~3,4 ms dla 2000 znaków. — orch-T10, 2026-10-03
- [T11 → T16] `build_tsquery`: identyfikator ze `/` (np. `XII/123/2024`) daje frazę `('xii' <-> '123' <-> '2024')` **oraz** cały leksem `'xii/123/2024'`, bo parser Postgresa indeksuje go jako jeden token `file` (fraza sama by nie trafiła). `lexeme()` zwraca `None` dla pustego po czyszczeniu tokenu. `lexical_search` wymaga własnej sesji w `asyncio.gather`. Rozbijanie remisów w `DISTINCT ON` dodatkowo po `c.id`. Czas na seedzie (155 rozwiązań): 6–15 ms. — orch-T11, 2026-10-03
- [T15 → T16, T19–T23] Routery: dopisujcie endpointy do `router` (prefiks `/api`) w swoim pliku; `/healthz` na `meta.health_router` (bez prefiksu). `main.py` nie wymaga zmian. Błędy: `raise ApiError(status, "CODE", "komunikat po polsku")` z `api.errors`; `HTTPException` też jest mapowane na `{"error":...}` (404 → `NOT_FOUND`). `X-Request-Id` dokleja czyste ASGI middleware (działa dla SSE); id jest w `api.log.request_id_var` i `request.scope["request_id"]`. Logi: `extra=` z kluczami `raw_text`/`normalized_text`/`message`/`contact_email` są maskowane (`***`), ale mimo to ich nie przekazujcie. `api.tasks.spawn(coro)` — wyjątek zadania jest logowany, nie propaguje; na shutdown `drain()` czeka 5 s, potem anuluje. — orch-T15, 2026-10-03
- [T20 → T22, T25, frontend] `api/routers/reports.py`: kolumny zgłoszeń wybierane jawnie (`_LIST_COLUMNS`/`_DETAIL_COLUMNS`, bez `contact_email` i `embedding`), `category_label_pl` przez LEFT JOIN `challenge_taxonomy`, `reply_count` podzapytaniem skorelowanym. Sortowanie listy `created_at DESC, id DESC`. Nieistniejące zgłoszenie → 404 `NOT_FOUND` także dla `/similar` i `/replies` (GET). `PATCH` i `POST …/replies` blokują wiersz (`FOR UPDATE`). Odpowiedź do zgłoszenia w `IN_PROGRESS`/`CLOSED` jest przyjmowana (201), status bez zmian — specyfikacja tego nie zabrania. Sesja przez `SessionDep = Annotated[AsyncSession, Depends(get_session)]` (ruff B008 nie zgłasza; `Depends(...)` w domyślnej wartości parametru łamie `ruff check` — dotyczy też `solutions.py`/`staff.py`). — orch-T20, 2026-10-03
- [T21 → T22, T25, frontend] `api/routers/solutions.py`: `GET /api/solutions` przy `q` sortuje najpierw po `similarity(title, q)`, potem wg `sort` (`evidence` = `evidence_level DESC`), na końcu `created_at DESC, id DESC`; `%`/`_` w `q` są escapowane w ILIKE. `tag` = dokładne dopasowanie elementu `tags`. Nieznana kategoria / gmina w `POST` i `PATCH` → 422 `VALIDATION_ERROR` (sprawdzenie w `challenge_taxonomy` i `GMINY`). `PATCH {"category": null}` jawnie czyści kategorię; pominięte pola nie są zmieniane; `status` w `SolutionPatch` tylko PUBLISHED/REJECTED/ARCHIVED (powrót do PENDING_REVIEW niemożliwy — kształt z T08). `POST` przy `ProviderError` → 503 `EMBEDDING_UNAVAILABLE`, rollback (sprawdzone z `EMBEDDING_PROVIDER=openai` bez klucza — brak wiersza w bazie). — orch-T21, 2026-10-03
- [T22/T23 → T25, frontend] `api/routers/staff.py`: `GET /api/stats` — `to` włącznie (`created_at < to + 1 dzień`, daty w strefie sesji DB), `from > to` → 422; grupy sortowane po `total DESC`; `by_week.week` = poniedziałek (`date_trunc('week')`). Rozmiar list skrzynki (10) i domyślne 90 dni to stałe routera (`INBOX_LATEST_N`, `STATS_DEFAULT_DAYS`), nie pipeline'u. `latest_pending` ma `rank` = pozycja na liście, `scores: null`. `api/routers/meta.py`: `/api/gminy` zwraca 183 gminy (z `GMINY` w preprocess), sort `strip_accents(name).casefold()`; `/healthz` → `rerank_provider = "noop"`, gdy `RERANK_ENABLED=false`, `embedding_provider` = wartość z ustawień (lokalnie `hash`); sprawdzenie bazy z limitem 2 s (`HEALTH_DB_TIMEOUT_S`), 503 zweryfikowane serwerem z błędnym `DATABASE_URL` (bez `docker compose stop db`, żeby nie przerywać pracy innych agentów). Feedback z `solution_id` ustawia też `clicked_solution_id`. — orch-T22-T23, 2026-10-03
- [T16 → T19, T25] `api/pipeline/orchestrator.py`: `retrieve` uzupełnia cosinus (`backfill_cosine`) przed `finalize`; `finalize` odfiltrowuje z `fused` wszystko, co nie jest `kind=SOLUTION` (zabezpieczenie), `context` budowany z `knowledge` niezależnie od bramki (`scores.cosine`), `best_chunks` dla `solutions + also_see`. `use_rerank=False` ⇒ `NoopRerankProvider`, `True` ⇒ fabryka (która przy `RERANK_ENABLED=false` też zwraca noop). `GET /api/search` zwraca dodatkowo `solutions`/`also_see` (listy id) i `extracted.target_group`; `ProviderError` → 503 z kodem providera; nieznana gmina → 422 `VALIDATION_ERROR`. W trybie `hash` + `MIN_COSINE_SCORE=0.20` top 3 bywa słabe (np. „Obu – obuwie po domu” dla „starsi ludzie sami w domu”, „Talerze zdrowia” dla pytania o klocki hamulcowe = brak `no_match`) — filtr per pozycja po cosinusie odrzuca mocne leksykalnie trafienia z cosinusem < 0.2; do kalibracji w T25 (z OpenAI). — orch-T16, 2026-10-03
- [T19 → T24, T25, frontend] `api/routers/chat.py`: wyszukiwanie **i** zapis działają w jednym zadaniu `spawn` (`_search_and_save`), strumień czyta wyniki etapów przez futures (`asyncio.shield`) — rozłączenie klienta nawet przed `candidates` nie gubi zgłoszenia (sprawdzone `curl -m 0.03`). Przy błędzie embeddingu/rerankera (`EMBEDDING_UNAVAILABLE`/`RERANK_UNAVAILABLE`) strumień zgodnie z algorytmem T19 to `status* → error → done` (bez `candidates` i bez `report_saved`; raport z `matched=false`, `search_events.flags={"error":true}` zapisany) — odstępstwo od skrótu „`candidates` zawsze” w AGENTS.md, świadome. Błąd LLM: `error LLM_UNAVAILABLE` → `report_saved` → `done`, w `search_events.flags` `llm_error: true` i `latency_ms.llm`. Nieoczekiwany wyjątek → `error INTERNAL` + `done`. Ścieżka z prawdziwym LLM (tokeny, `answer_retracted`) niezweryfikowana — brak klucza. — orch-T19, 2026-10-03
- [T24 → T25, ORCH] `scripts/seed_reports.py` + `data/reports-seed.json` (15 zgłoszeń, `session_id` `seed-demo-01..15`): grupy parafraz „samotni seniorzy” ×5 (Wieliczka, Myślenice, Bochnia, Nowy Targ, Limanowa), „wykluczenie cyfrowe seniorów” ×3, „brak transportu na wsi” ×2, 3 różne problemy, 2 spoza korpusu (bezpańskie psy, wysychające studnie → `no_match`). Zgłoszenia idą przez `POST /api/chat` po kolei; `--purge` usuwa najpierw `search_events` zgłoszeń seedu (FK `search_events.report_id` ma `ON DELETE SET NULL`, a tabela nie ma `session_id`), potem `reports` (odpowiedzi kaskadowo); `--purge-only` tylko sprząta. Wynik (tryb hash, próg 0.38): ostatnie parafrazy mają `similar_count/gmina_count` 4/4 i 2/2, różne problemy 0 — „Gotowe, gdy” spełnione. Wpis seed-demo-12 przeredagowany („…brakuje przedszkoli i żłobków…”), bo pierwsza wersja dawała top 1 „Rodzina adopcyjna dorasta”. — orch-T24, 2026-10-03
- [T25 → ORCH, zespół] Za zgodą orkiestratora przepisany `api/providers/embeddings_hash.py` (tylko dev): bez n-gramów znakowych (kolizje kubełków dawały szum 0.20–0.25 dla każdego zapytania), stopwords, stem = prefiks 5 znaków, pojęcia z `data/synonyms.json` + `_EXTRA_CONCEPTS` (×1.5), waga 0.5–1.0 wg IDF z `data/solutions/*.json`, `1+ln(n)`. Wektor zależy od plików `data/` — po zmianie korpusu/synonimów: `python -m scripts.ingest data/solutions/ --reembed-all` + `python -m scripts.seed_reports --purge`. Korpus przeliczony (162), seed przeliczony. — orch-T25, 2026-10-03
- [T25 → ORCH, zespół] Progi trybu hash (tylko lokalny `.env`): `MIN_COSINE_SCORE=0.28` (szum ≤ 0.253, trafne ≥ 0.316 na 18 zapytaniach), `SIMILAR_REPORT_THRESHOLD=0.38` (parafrazy ≥ 0.406, różne problemy ≤ 0.359). `.env.example`: domyślne OpenAI/Cohere bez zmian (0.50 / 0.82 / 0.35 — nieskalibrowane, brak kluczy) + zakomentowany blok „Tryb hash (dev)”. Kalibrację OpenAI/Cohere trzeba powtórzyć po dodaniu kluczy — gotowa procedura w `docs/modules/01-matchmaking/module-1-calibration.md`. Ścieżka demo (7 kroków) przeszła curlami; testowe zgłoszenia `demo-run-*` i rozwiązanie `[DEMO]…` usunięte — w bazie korpus 162 + seed 15 zgłoszeń. Niezweryfikowane: LLM (streszczenie, `answer_retracted`) i reranker Cohere. — orch-T25, 2026-10-03
- [T25 → T10] Obserwacja (nie błąd): ta sama treść o samotnych seniorach dostaje raz `AGING` (seed-demo-01..05), raz `LONELINESS` (zgłoszenie z demo z innym sformułowaniem) — heurystyka `data/category-keywords.json`; w `/api/stats` grupa „samotni seniorzy” liczy się jako `AGING`. Ewentualnie dociążyć słowa „samotn*/sami/izolac*” dla `LONELINESS`. Błędów w kodzie pipeline'u/routerów nie znaleziono. — orch-T25, 2026-10-03
- [ORCH] **Podsumowanie do weryfikacji przez zespół (2026-10-03, wszystkie T00–T26 = [x]):**
  1. **Provider `hash` (dev)** — `api/providers/embeddings_hash.py` — odstępstwo od ADR-015; w T25 przepisany (stemy 5-literowe, koncepty z `synonyms.json`, IDF z `data/solutions/*.json`). Decyzja: zostawić jako tryb offline czy usunąć?
  2. **Kalibracja tylko w trybie hash** — progi OpenAI/Cohere (0.50 / 0.35 / 0.82) nieskalibrowane; procedura w `docs/modules/01-matchmaking/module-1-calibration.md`. Po dodaniu kluczy: `.env` → `EMBEDDING_PROVIDER=openai`, `RERANK_ENABLED=true`, `LLM_ENABLED=true`, usunąć progi dev, `make reset-db && make ingest && python -m scripts.seed_reports --purge`, potem powtórzyć T25.
  3. **Niezweryfikowane bez kluczy:** prawdziwe embeddingi OpenAI, rerank Cohere, strumień LLM (tokeny, cytowania `[n]`, `answer_retracted`). Ścieżki błędów (`ProviderError` → `error` + `done`) sprawdzone.
  4. **Kolejność SSE przy błędzie embeddingu/rerankera** (T19): `status* → error → done` bez `candidates` i bez `report_saved` — zgodnie z algorytmem T19, ale w napięciu z regułą „`candidates` zawsze” w AGENTS.md. Raport i tak się zapisuje. Do decyzji.
  5. **183 gminy** (nie 182) — gmina Szczawa od 1.01.2025 (T03).
  6. **Odstępstwo SQL w liczniku podobnych** (T18): `(:session_id IS NULL OR r.session_id IS DISTINCT FROM :session_id)`.
  7. **`ANSWER_FRAGMENT_CHARS`** — nowa zmienna w `config.py` (800).
  8. **Lokalna baza** zawiera korpus seed-demo (47) + ROPS (115) + 15 zgłoszeń seed; `make up` uruchamia api+db (zweryfikowane curl z AGENTS.md w kontenerze: `status×3 → candidates → report_saved → done`, karta 1 = „Telefon Życzliwości dla seniorów”, `similar_count=5`, `gmina_count=4`).
  9. Nic nie zostało zacommitowane — zmiany są w drzewie roboczym.
— orkiestrator, 2026-10-03
- [triaż M2–M5 → M1] 2026-10-04 (`docs/modules/README.md` → „Podział między modułami”): pliki M1 zmieniane przez inne moduły, wyłącznie addytywnie — `db/init.sql` i `solutions.knowledge_type` (M2 Z00), `api/schemas.py` / `api/cards.py` (M2 Z00), `api/routers/solutions.py` i `staff.py` (M2 Z04, Z05, Z12), `api/log.py` `REDACTED_KEYS` (M5 PK01), `web/src/components/SolutionCard.tsx` (M2 Z13, właściciel), `web/src/pages/panel/InboxPage.tsx` (sekcje M3 K11 i M5 PK24), `NoMatchNotice.tsx` / `ChatResults.tsx` / `panel/ReportPage.tsx` (M3 K08). Kontrakty API M1 bez zmian znaczenia.

- [PK00, PK01 → M1] 2026-10-04: Moduł 5 dopisał (tylko własne bloki) — `Makefile` (cel `db-m5`), `api/config.py` (sekcja „Moduł 5”: `M5_ASSISTANT_ENABLED`, `M5_ASSISTANT_TIMEOUT_SECONDS`, `PARTNER_MATCH_N`), `api/main.py` (routery `threads`, `mentors`, `partnerships`; import routerów ruff rozbił na listę po jednej nazwie w linii), `api/log.py` (`REDACTED_KEYS` += `body`, `subject`, `title`, `description`, `author_label`). Schemat M5 w osobnym `db/m5-komunikacja.sql` — `db/init.sql` bez zmian.
