# Splot – HackYeah 2026

Platforma Małopolskiego Hubu Innowacji Społecznych (wyzwanie ROPS Kraków). Moduł 1 — matchmaking społeczny: mieszkaniec opisuje problem po polsku, a Splot znajduje istniejące rozwiązania, zapisuje zgłoszenie i pokazuje, ile osób zgłosiło podobny problem. Zespół Hubu obsługuje zgłoszenia i pomysły w panelu administratora.

## Uruchomienie przez Docker Compose

### Wymagania

- Docker z Docker Compose v2.17 lub nowszym (serwis `web` używa `additional_contexts`).
- Wolne porty: `5432` (PostgreSQL), `8000` (API), `8080` (frontend).

### 1. Konfiguracja

```bash
cp .env.example .env
```

Wybierz jeden z dwóch trybów i ustaw go w `.env`:

**Tryb pełny (zalecany do demo)** — wpisz klucze API:

```dotenv
OPENAI_API_KEY=sk-...        # embeddingi text-embedding-3-large (wymagany)
COHERE_API_KEY=...           # reranker rerank-v3.5 (albo RERANK_PROVIDER=noop i RERANK_ENABLED=false)
ANTHROPIC_API_KEY=...        # streszczenie z cytowaniami (albo LLM_ENABLED=false)
```

**Tryb bez kluczy (offline, deweloperski)** — zmień w `.env` istniejące linie na poniższe wartości (nie dopisuj ich drugi raz — przy powtórzonym kluczu wygrywa ostatnie wystąpienie, a `LLM_ENABLED=true` stoi niżej niż blok „Tryb hash”):

```dotenv
EMBEDDING_PROVIDER=hash
RERANK_ENABLED=false
LLM_ENABLED=false
MIN_COSINE_SCORE=0.28
SIMILAR_REPORT_THRESHOLD=0.38
```

W trybie `hash` wyszukiwanie działa na słowach i słowniku synonimów (`data/synonyms.json`), a nie na modelu semantycznym. Czat pokazuje karty rozwiązań bez streszczenia.

### 2. Start

```bash
docker compose up -d --build     # albo: make up
```

Startują trzy serwisy:

| Serwis | Adres | Co to jest |
|---|---|---|
| `db` | `localhost:5432` | PostgreSQL 16 + pgvector; schemat z `db/init.sql` tworzy się przy pierwszym starcie |
| `api` | http://localhost:8000 | FastAPI; dokumentacja: http://localhost:8000/docs |
| `web` | http://localhost:8080 | Frontend (nginx), proxy `/api` i `/healthz` do serwisu `api` |

**Praca nad kodem (hot reload):** `make up-dev` zamiast `make up`. API restartuje się samo po zmianie w `api/` (kod montowany z dysku, `uvicorn --reload`), a frontend działa na serwerze Vite z HMR pod http://localhost:5173 (serwis `web-dev`; nginx na `:8080` jest wtedy zatrzymany). Logi: `make logs-dev`. Tryb produkcyjny (`make up`, `:8080`) zostaje do demo — tam zmiany widać dopiero po przebudowie (`make web-up`).

### 3. Załadowanie danych

Baza startuje pusta (poza taksonomią). Załaduj korpus rozwiązań (115 innowacji z Biblioteki Innowacji Społecznych ROPS Kraków):

```bash
docker compose exec api python -m scripts.ingest data/solutions/
```

Dane Modułu 2 (Zasobnik wiedzy — raporty i materiały ROPS, profile 8 wyzwań, wskaźniki IOSS dla 22 powiatów):

```bash
docker compose exec api python -m scripts.ingest data/knowledge/records/
docker compose exec api python -m scripts.ingest_knowledge data/knowledge/
# z hosta: make ingest-knowledge   (wskaźniki IOSS odświeżysz: python -m scripts.fetch_ioss)
```

Na istniejącej bazie sprzed Modułu 2: `make reset-db` (nowa kolumna `solutions.knowledge_type`) albo ręcznie `ALTER TABLE` + `make db-m2`.

Opcjonalnie dodaj przykładowe zgłoszenia, żeby panel i liczniki „podobny problem zgłosiło już…” miały dane:

```bash
docker compose exec api python -m scripts.seed_reports
```

Dane demo Modułu 4 (Tester innowacji — nabór OPEN + zgłoszenia we wszystkich statusach):

```bash
docker compose exec api python -m scripts.seed_innovation_tests
# albo: make seed-m4
```

Ścieżka demo: [`docs/modules/04-tester-innowacji/module-4-calibration.md`](docs/modules/04-tester-innowacji/module-4-calibration.md).

Ingest jest idempotentny — można go uruchamiać ponownie.

### 4. Sprawdzenie

```bash
curl localhost:8000/healthz
# {"db":"ok","embedding_provider":"openai","rerank_provider":"cohere","llm_enabled":true}

curl -N -X POST localhost:8000/api/chat -H 'Content-Type: application/json' \
  -d '{"message":"U nas w gminie starsi ludzie siedzą sami w domach i nie mają z kim pogadać"}'
```

Potem otwórz http://localhost:8080:

- `/` — Znajdź rozwiązanie (czat),
- `/rozwiazania` — Biblioteka innowacji, `/wiedza` — Wiedza o wyzwaniach,
- `/testy` — otwarte nabory testerów innowacji, `/testy/dostep/:token` — status i ankieta testera,
- `/mam-pomysl` — zgłoszenie własnego pomysłu, `/moje-zgloszenia` — odpowiedzi zespołu Hubu (rola reporter),
- `/panel` — panel administratora (rola administrator), w tym `/panel/testy` — nabory testerów.

#### Konta demo

Logowanie jest wyłącznie po stronie frontendu (PoC, bez backendowego auth). Przycisk „Zaloguj się”
jest w banerze; ekrany wymagające roli pokazują go też w miejscu treści.

| Rola          | Login      | Hasło         |
|---------------|------------|---------------|
| reporter      | `reporter` | `reporter123` |
| administrator | `admin`    | `admin123`    |

### Zmiana providera embeddingów

Korpus i zapytania muszą być liczone tym samym providerem. Po zmianie `EMBEDDING_PROVIDER` w `.env`:

```bash
docker compose up -d --build api
docker compose exec api python -m scripts.ingest --reembed-all
docker compose exec api python -m scripts.seed_reports --purge
```

### Zatrzymanie i reset

```bash
docker compose down        # zatrzymuje serwisy, dane zostają (wolumen pgdata)
docker compose down -v     # usuwa też bazę — po ponownym starcie trzeba znów zrobić ingest
```

## Praca lokalna (bez kontenerów API i frontendu)

```bash
make db                         # sama baza w Dockerze
make dev                        # API z autoprzeładowaniem na :8000 (wymaga .venv z `pip install -e .[dev]`)
make ingest                     # ingest korpusu z hosta
make web-install && make web-dev   # frontend Vite na :5173 z proxy na :8000
make web-mock                   # frontend na mocku SSE (docs/mocks) — bez backendu
```

## Dokumentacja

Pełna mapa: [`docs/README.md`](docs/README.md). Najważniejsze:

- `docs/modules/01-matchmaking/module-1-matchmaking.html` — specyfikacja Modułu 1,
- `docs/modules/01-matchmaking/module-1-tasks.md` — plan i status backendu, `docs/modules/01-matchmaking/frontend-tasks.md` — plan i status frontendu,
- `docs/modules/01-matchmaking/frontend-a11y.md` — przegląd dostępności i scenariusz demo,
- `DESIGN.md`, `design-system/` — design system interfejsu,
- `docs/changes/` — zmiany i poprawki po sprincie (`spec.md` + `plan.md` per zmiana),
- `AGENTS.md` — reguły pracy dla ludzi i agentów,
- `docs/base.md` — kontekst biznesowy wyzwania.
