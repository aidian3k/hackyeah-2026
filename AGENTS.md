# Splot – HackYeah 2026

Platforma Małopolskiego Hubu Innowacji Społecznych (wyzwanie ROPS Kraków).

Obecnie budujemy **Moduł 1 — Matchmaking społeczny**: backend PoC, który przyjmuje opis problemu po polsku (czat SSE), znajduje istniejące rozwiązania hybrydowym wyszukiwaniem, zapisuje każde zgłoszenie, liczy podobne zgłoszenia i wystawia API dla Panelu administratora.

**Poza zakresem (decyzja zespołu, nadpisuje specyfikację):** autoryzacja (token STAFF, `report_token`, nagłówki `X-Access-Token` / `X-Report-Token`, 401/403, `api/auth.py`) oraz testy automatyczne (pytest, `tests/`, fake providery). Nie dodawaj ich — to projekt hackathonowy, wszystkie endpointy są otwarte.

- Specyfikacja (źródło prawdy): `docs/modules/01-matchmaking/module-1-matchmaking.html` (v0.5).
- Plan implementacji i status zadań: `docs/modules/01-matchmaking/module-1-tasks.md` — **zanim zaczniesz pracę, przeczytaj protokół na górze tego pliku**.
- Frontend (osobny moduł w `web/`): plan i status zadań w `docs/modules/01-matchmaking/frontend-tasks.md` — ten sam protokół pracy, zadania F00–F21.
- Kontekst biznesowy wyzwania: `docs/base.md`.
- Moduły 2–7: `docs/modules/README.md` — indeks, konwencje, stan i **podział między modułami** (właściciele wspólnych plików, triaż 2026-10-04). Implementuj tylko moduły z rozpisanymi zadaniami.
- Zmiany i poprawki po sprincie: `docs/changes/` — każda zmiana to katalog ze `spec.md` (co) i `plan.md` (jak). Prośba o zmianę zachowania = najpierw `spec.md`, potem `plan.md`, potem kod (przebieg w `docs/changes/README.md`).
- Mapa całej dokumentacji: `docs/README.md`. Nowe dokumenty tylko w `docs/` — bez osobnych katalogów typu `spec/`.

## Stack (ADR-001, ADR-002)

- Python 3.12, FastAPI, SQLAlchemy 2.0 async + asyncpg, pydantic-settings, ruff.
- PostgreSQL 16 z rozszerzeniami `vector` (pgvector), `unaccent`, `pg_trgm` — obraz `pgvector/pgvector:pg16`. Brak innych baz, kolejek i silników wyszukiwania.
- Embeddingi: OpenAI `text-embedding-3-large` z `dimensions=1024` (jedyna implementacja, ADR-015). Wymiar 1024 jest stały (ADR-004).
- Reranker: Cohere `rerank-v3.5` albo `noop`.
- LLM (streszczenie M1, raport M4, asystent M3): OpenAI `gpt-6-luna` (Responses API, ten sam `OPENAI_API_KEY` co embeddingi) — `LLM_PROVIDER=openai`, domyślnie; alternatywa `LLM_PROVIDER=anthropic` z `claude-haiku-4-5-20251001` (ADR-020).
- Schemat bazy bez Alembica w PoC: `db/init.sql` (Moduł 1, M4 i zmiany tabel M1) oraz osobne, idempotentne pliki modułów `db/mN-<nazwa>.sql` z celem `make db-mN` (ładują się alfabetycznie po `init.sql`).

## Struktura

```
docker-compose.yml  Makefile  .env.example  pyproject.toml
db/init.sql                    # rozszerzenia, polish_simple, tabele M1 (+ M4), seed taksonomii
db/mN-*.sql                    # schematy modułów 2, 3, 5 (m2-zasobnik, m3-kreator, m5-komunikacja)
api/main.py config.py db.py errors.py log.py tasks.py models.py schemas.py cards.py corpus.py chunking.py
api/routers/   chat.py search.py reports.py solutions.py staff.py meta.py
api/pipeline/  types.py text.py preprocess.py lexical.py semantic.py fusion.py rerank.py answer.py reports.py orchestrator.py
api/providers/ __init__.py base.py embeddings_openai.py rerank_cohere.py rerank_noop.py llm.py
data/          taxonomy.json gminy-malopolska.json synonyms.json stopwords-pl.txt category-keywords.json rops-category-map.json reports-seed.json
data/solutions/ rops-biblioteka.json   # format pośredni dla ingestu (wyłącznie dane z Biblioteki ROPS)
data/raw/      rops-biblioteka.raw.json (surowy zrzut scrapera), html-cache/ (gitignore)
scripts/       ingest.py seed_reports.py scrape_rops.py
docs/          README.md (mapa) base.md modules/ changes/ mocks/
docs/mocks/    przykładowe strumienie SSE dla frontendu (+ replay.py)
```

## Komendy

```bash
make up        # docker compose up -d --build (db + api na :8000, web/nginx na :8080 — bez hot reloadu)
make up-dev    # tryb deweloperski: api z --reload na :8000, Vite z HMR na :5173 (docker-compose.dev.yml)
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
- Moduł 1 (backend) nie zawiera kodu frontendowego — frontend żyje wyłącznie w `web/` i nie zmienia `api/`, `db/` ani `scripts/`. Weryfikacja backendu ręczna: curl, psql, `python -c` — bez testów automatycznych i bez przeglądarki.
- Teksty dla użytkownika (`label_pl`, `message_pl`) po polsku.

## Specyfikacja a zmiany decyzji

Sekcje specyfikacji mają statusy: `stable` (nie zmieniaj bez ADR), `draft` (kierunek ustalony, szczegóły w kodzie), `todo` (nie implementuj). Wszystko z sekcji 15 (backlog) jest poza zakresem: konta, lokalne modele, klastrowanie, HNSW, webhook/e-mail, retencja, rate limiting, ewaluacja automatyczna, ekstrakcja gminy z tekstu. Jeśli implementacja wymaga odejścia od decyzji `stable`, nie zmieniaj jej po cichu — opisz problem w sekcji „Uwagi między zadaniami” w `docs/modules/01-matchmaking/module-1-tasks.md`.

## Pliki agentów

Jedno źródło dla wszystkich narzędzi (Claude Code, Codex, Cursor…):

```
AGENTS.md          # instrukcje projektu (ten plik) — edytuj tylko tutaj
CLAUDE.md          # dla Claude Code: tylko import @AGENTS.md
.agents/skills/    # skille wspólne dla agentów (SKILL.md + zasoby)
.claude/skills  -> ../.agents/skills   (symlink)
.cursor/skills  -> ../.agents/skills   (symlink)
```

- Nowy skill dodajesz w `.agents/skills/<nazwa>/SKILL.md`, nigdy bezpośrednio w `.claude/` ani `.cursor/`.
- Nie twórz osobnych plików instrukcji per narzędzie (`.cursorrules`, `GEMINI.md`, kopie `CLAUDE.md`) — co najwyżej cienki plik odsyłający do `AGENTS.md`, jak `CLAUDE.md`.
- `.claude/settings.local.json` i katalogi IDE (`.idea/`, `*.iml`) są w `.gitignore`.

## Praca wielu agentów

- Zadania i ich status są w `docs/modules/01-matchmaking/module-1-tasks.md` (backend) i `docs/modules/01-matchmaking/frontend-tasks.md` (frontend). Każde zadanie zawiera cały potrzebny kontekst — nie musisz czytać HTML specyfikacji.
- Bierz tylko zadanie, którego wszystkie zależności są `[x]`. Oznacz je `[~]` przed rozpoczęciem pracy, `[x]` po spełnieniu kryteriów „Gotowe, gdy”.
- Zmieniaj wyłącznie pliki wymienione w swoim zadaniu. Potrzebna zmiana w cudzym pliku = wpis w „Uwagach między zadaniami”, nie edycja.
- Nazwy modułów, funkcji i typów z sekcji „Wspólne kontrakty” w pliku zadań są wiążące — nie zmieniaj sygnatur, z których korzystają inne zadania.

## Interfejs

Frontend: Vite + React + TypeScript w `web/` (`make web-dev`, `make web-mock`), zadania i wspólne kontrakty w `docs/modules/01-matchmaking/frontend-tasks.md`. Bez autoryzacji i bez testów automatycznych — to samo co w backendzie.

Każdy element interfejsu buduj według `DESIGN.md` i plików w `design-system/`:
- importuj `design-system/tokens.css` i `design-system/components.css`, nie wpisuj kolorów na sztywno,
- tylko motyw jasny (białe tło) i tryb wysokiego kontrastu `<html data-contrast="high">`,
- najwyżej jeden przycisk `ds-btn--cta` (magenta) na ekran, paski tylko w banerze `ds-banner`,
- tekst i kontrolki muszą spełniać WCAG 2.1 AA.

### Stylowanie: Tailwind, bez własnego CSS

- **Nowy i zmieniany kod stylujesz wyłącznie klasami Tailwinda** w `className`. Konfiguracja: `web/tailwind.config.cjs` (preset `design-system/tailwind.preset.js`, `preflight` wyłączony), wejście `web/src/styles/tailwind.css`.
- **Zakaz osadzonego CSS:** żadnych nowych plików `.css` w `web/src/`, żadnych reguł dopisywanych do istniejących arkuszy, żadnego `style={{…}}` ani `<style>`. Jedyny wyjątek: `style` przekazujący wyliczoną w runtime wartość do zmiennej CSS (np. `--ds-bar-share` w `BarList`).
- **Tylko tokeny z presetu:** `text-navy`, `bg-surface-muted`, `text-h1`, `text-body-lg`, `gap-3`, `rounded-md`, `shadow-card`… Kolory w presecie to `var(--…)`, więc wysoki kontrast działa sam. Bez domyślnej palety Tailwinda (`text-blue-600`, `bg-gray-100`) i bez wartości dowolnych z kolorem lub rozmiarem (`text-[#294375]`, `p-[13px]`). Wartość dowolna dopuszczalna tylko dla właściwości bez tokenu (np. `[overflow-wrap:anywhere]`).
- **Komponenty design systemu zostają klasami `ds-*`** (`ds-btn`, `ds-field`, `ds-input`, `ds-alert`, `ds-page`…). Tailwind służy do układu i drobnych korekt wokół nich (`flex flex-col gap-6`, `max-w-lg`, `px-0`). Nowy komponent wielokrotnego użytku = komponent React z klasami Tailwinda albo zmiana w `design-system/components.css` zgodnie z `DESIGN.md` — nie arkusz w `web/src/styles/`.
- **Istniejące arkusze w `web/src/styles/*.css` to dziedzictwo.** Nie rozbudowuj ich. Gdy zmieniasz ekran, który z nich korzysta, przenieś jego style na Tailwinda i usuń nieużywane reguły (wzorzec: `LoginPage.tsx`, `RequireRole.tsx`). Na jednym elemencie nie mieszaj klasy z arkusza strony z klasą Tailwinda ustawiającą tę samą właściwość — arkusze stron ładują się później i mogą wygrać.
- Wygląd po migracji ma być taki sam jak przed nią — porównaj ekran przed i po, także w `data-contrast="high"`.
