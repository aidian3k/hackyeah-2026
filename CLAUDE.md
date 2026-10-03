# Splot – HackYeah 2026

Platforma Małopolskiego Hubu Innowacji Społecznych (wyzwanie ROPS Kraków).

Obecnie budujemy **Moduł 1 — Matchmaking społeczny**: backend PoC, który przyjmuje opis problemu po polsku (czat SSE), znajduje istniejące rozwiązania hybrydowym wyszukiwaniem, zapisuje każde zgłoszenie, liczy podobne zgłoszenia i wystawia API dla Panelu administratora.

**Poza zakresem (decyzja zespołu, nadpisuje specyfikację):** autoryzacja (token STAFF, `report_token`, nagłówki `X-Access-Token` / `X-Report-Token`, 401/403, `api/auth.py`) oraz testy automatyczne (pytest, `tests/`, fake providery). Nie dodawaj ich — to projekt hackathonowy, wszystkie endpointy są otwarte.

- Specyfikacja (źródło prawdy): `docs/module-1-matchmaking.html` (v0.5).
- Plan implementacji i status zadań: `docs/module-1-tasks.md` — **zanim zaczniesz pracę, przeczytaj protokół na górze tego pliku**.
- Kontekst biznesowy wyzwania: `docs/base.md`.

## Stack (ADR-001, ADR-002)

- Python 3.12, FastAPI, SQLAlchemy 2.0 async + asyncpg, pydantic-settings, ruff.
- PostgreSQL 16 z rozszerzeniami `vector` (pgvector), `unaccent`, `pg_trgm` — obraz `pgvector/pgvector:pg16`. Brak innych baz, kolejek i silników wyszukiwania.
- Embeddingi: OpenAI `text-embedding-3-large` z `dimensions=1024` (jedyna implementacja, ADR-015). Wymiar 1024 jest stały (ADR-004).
- Reranker: Cohere `rerank-v3.5` albo `noop`.
- LLM (streszczenie): Anthropic `claude-haiku-4-5-20251001`.
- Schemat bazy: jeden plik `db/init.sql` (bez Alembica w PoC).

## Struktura

```
docker-compose.yml  Makefile  .env.example  pyproject.toml
db/init.sql                    # rozszerzenia, polish_simple, 6 tabel, seed taksonomii
api/main.py config.py db.py errors.py log.py tasks.py models.py schemas.py cards.py corpus.py chunking.py
api/routers/   chat.py search.py reports.py solutions.py staff.py meta.py
api/pipeline/  types.py text.py preprocess.py lexical.py semantic.py fusion.py rerank.py answer.py reports.py orchestrator.py
api/providers/ __init__.py base.py embeddings_openai.py rerank_cohere.py rerank_noop.py llm.py
data/          taxonomy.json gminy-malopolska.json synonyms.json stopwords-pl.txt category-keywords.json rops-category-map.json reports-seed.json
data/solutions/ seed-demo.json rops-biblioteka.json   # format pośredni dla ingestu
data/raw/      rops-biblioteka.raw.json (surowy zrzut scrapera), html-cache/ (gitignore)
scripts/       ingest.py seed_reports.py scrape_rops.py
docs/mocks/    przykładowe strumienie SSE dla frontendu (+ replay.py)
```

## Komendy

```bash
make up        # docker compose up -d --build (db + api na :8000)
make ingest    # python -m scripts.ingest data/solutions/
make fmt       # ruff format + ruff check --fix
make dev       # uvicorn api.main:app --reload (lokalnie, baza z docker compose)
make chat Q='starsi ludzie są samotni'   # szybki podgląd strumienia SSE

# definicja gotowości Modułu 1 — pełny strumień zdarzeń w kolejności z sekcji 7.1
curl -N -X POST localhost:8000/api/chat -H 'Content-Type: application/json' \
  -d '{"message":"U nas w gminie starsi ludzie siedzą sami w domach i nie mają z kim pogadać"}'
```

## Twarde reguły (łamanie = błąd, nawet jeśli curl „działa”)

- Zero literałów progów i limitów w kodzie pipeline'u — wszystko z `api.config.settings` (sekcja 11 specyfikacji).
- Tekst wyszukiwania: zawsze `to_tsvector('polish_simple', …)` / `to_tsquery('polish_simple', …)` z konfiguracją podaną literałem. Nigdy `'polish'` (nie istnieje w obrazie) ani `'english'`.
- Nigdy nie przekazuj tekstu użytkownika do `to_tsquery`. Zapytanie leksykalne budujesz w Pythonie (`build_tsquery`) jako **OR** słów treściowych. Nie używaj `websearch_to_tsquery` ani `plainto_tsquery` (AND = pusty wynik).
- Wyszukiwanie widzi tylko `solutions.status = 'PUBLISHED'`; status i `kind` filtrowane przez `JOIN solutions`, nie kopiowane do chunków.
- `kind = 'KNOWLEDGE'` nigdy nie trafia na karty rozwiązań, do streszczenia, cytowań ani do `reports.matched` — tylko do `candidates.context` (ADR-011).
- Brak indeksów wektorowych (HNSW/IVFFlat) — pełny skan (ADR-019).
- RRF liczy wyłącznie z pozycji (k = `RRF_K`), remisy rozstrzyga `solution_id` rosnąco. Nie sumuj ani nie normalizuj surowych score'ów.
- Bramka „nie wiem” musi działać bez rerankera (cosinus, `MIN_COSINE_SCORE`). „Nie wiem” to funkcja, nie błąd.
- Jedna `AsyncSession` nie obsługuje równoległych zapytań — w `asyncio.gather` każdy tor dostaje własną sesję z `SessionLocal()`.
- Zapis zgłoszenia jest bezwarunkowy i odpięty od żądania (`api.tasks.spawn`, nie zakres żądania). Strumień czeka na niego tylko przed `report_saved` (maks. 2 s).
- Kolejność SSE: `status* → candidates → (token* [→ answer_retracted] | no_match) → report_saved? → done`. `candidates` zawsze, `done` zawsze (także po `error`).
- `contact_email` nie wychodzi z żadnego endpointu; pole `contact` rozwiązań też nie.
- W logach nigdy `raw_text`, `normalized_text`, `message` ani `contact_email`. Loguj `report_id` i długość tekstu.
- Jeden kształt `SolutionCard` w całym API (`api/schemas.py`, budowany przez `api/cards.py`). Poza wyszukiwaniem `scores = null`.
- Prefiksy embeddingów (`query:` / `passage:`) dokleja wyłącznie provider. Korpus i zapytania liczone tym samym modelem.
- Odpowiedzi z bazy rozwiązań: każde twierdzenie z cytowaniem `[n]`, `[n]` = pozycja karty. Zmyślone `[n]` wycina filtr strumieniowy.
- Moduł 1 nie zawiera kodu frontendowego (bez katalogu `web/`). Weryfikacja ręczna: curl, psql, `python -c` — bez testów automatycznych i bez przeglądarki.
- Teksty dla użytkownika (`label_pl`, `message_pl`) po polsku.

## Specyfikacja a zmiany decyzji

Sekcje specyfikacji mają statusy: `stable` (nie zmieniaj bez ADR), `draft` (kierunek ustalony, szczegóły w kodzie), `todo` (nie implementuj). Wszystko z sekcji 15 (backlog) jest poza zakresem: konta, lokalne modele, klastrowanie, HNSW, webhook/e-mail, retencja, rate limiting, ewaluacja automatyczna, ekstrakcja gminy z tekstu. Jeśli implementacja wymaga odejścia od decyzji `stable`, nie zmieniaj jej po cichu — opisz problem w sekcji „Uwagi między zadaniami” w `docs/module-1-tasks.md`.

## Praca wielu agentów

- Zadania i ich status są w `docs/module-1-tasks.md`. Każde zadanie zawiera cały potrzebny kontekst — nie musisz czytać HTML specyfikacji.
- Bierz tylko zadanie, którego wszystkie zależności są `[x]`. Oznacz je `[~]` przed rozpoczęciem pracy, `[x]` po spełnieniu kryteriów „Gotowe, gdy”.
- Zmieniaj wyłącznie pliki wymienione w swoim zadaniu. Potrzebna zmiana w cudzym pliku = wpis w „Uwagach między zadaniami”, nie edycja.
- Nazwy modułów, funkcji i typów z sekcji „Wspólne kontrakty” w pliku zadań są wiążące — nie zmieniaj sygnatur, z których korzystają inne zadania.

## Interfejs

Każdy element interfejsu buduj według `DESIGN.md` i plików w `design-system/`:
- importuj `design-system/tokens.css` i `design-system/components.css`, nie wpisuj kolorów na sztywno,
- tylko motyw jasny (białe tło) i tryb wysokiego kontrastu `<html data-contrast="high">`,
- najwyżej jeden przycisk `ds-btn--cta` (magenta) na ekran, paski tylko w banerze `ds-banner`,
- tekst i kontrolki muszą spełniać WCAG 2.1 AA.
