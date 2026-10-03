# Moduł 5 — Platforma aktywnej komunikacji: plan implementacji i zadania

Plan na podstawie `docs/modules/05-platforma-komunikacji/module-5-platforma-komunikacji.html` (v0.4). Każde zadanie jest samowystarczalne: zawiera cel, pliki, wklejony kontekst ze specyfikacji, kroki i kryterium gotowości. Agent wykonujący zadanie **nie musi czytać specyfikacji HTML** — ale musi przeczytać `AGENTS.md` (twarde reguły) oraz sekcję „Wspólne kontrakty” poniżej.

**Odstępstwa od specyfikacji (decyzja zespołu, 2026-10-03, jak w Module 1):**
- **Bez autoryzacji.** Wszystkie endpointy są otwarte; bez tokenów, nagłówków dostępu i kodów 401/403. Role (`reporter`, `administrator`, `mentor`) istnieją tylko we frontendzie (`web/src/lib/auth.tsx`).
- **Bez testów automatycznych.** Weryfikacja każdego zadania: curl, psql, `python -c`, ręczne uruchomienie.

**v0.4 — zakres uproszczony (2026-10-04).** 13 zadań zamiast 22. Bez embeddingów w M5, bez szkicu odpowiedzi AI, bez SLA, bez moderacji ogłoszeń, bez rozmów przy zgłoszeniach i pomysłach — wszystko to jest w backlogu (spec, sekcja 14). Jedyne AI w module to asystent pierwszego kontaktu, zbudowany z gotowego pipeline'u Modułu 1.

## Protokół pracy (obowiązkowy)

1. **Jedyne źródło statusu** to lista „Status zadań” poniżej. Treść zadań nie zawiera statusu.
2. Stany:
   - `- [ ]` — wolne,
   - `- [~]` — w toku; dopisz na końcu linii ` — agent: <nazwa>, <RRRR-MM-DD GG:MM>`,
   - `- [x]` — zrobione; zamień dopisek na ` — zrobione: <nazwa>, <krótka notka lub hash commita>`.
3. **Branie zadania:** wybierz zadanie `[ ]`, którego wszystkie zależności są `[x]`. Edytuj tylko jego linię na `[~]`, potem przeczytaj plik ponownie i sprawdź, czy linia nadal ma Twój dopisek (jeśli ktoś był szybszy — weź inne zadanie).
4. Edytuj w tym pliku **wyłącznie linię swojego zadania** oraz (ewentualnie) dopisuj na końcu sekcji „Uwagi między zadaniami”. Nie przepisuj innych linii, nie formatuj pliku.
5. Zmieniaj w repozytorium **tylko pliki wymienione w polu „Pliki” swojego zadania**. Potrzebujesz zmiany w cudzym pliku → wpis w „Uwagach między zadaniami” (`- [PKxx → PKyy] opis`), nie edycja. Zadania dopisujące do plików współdzielonych (tabela niżej) dodają też jednolinijkowy wpis w „Uwagach” `module-1-tasks.md` (backend) albo `frontend-tasks.md` (frontend).
6. `[x]` dopiero, gdy spełnione jest „Gotowe, gdy” (ręczna weryfikacja opisana w zadaniu) i `ruff check .` (backend) albo `npm run lint && npm run build` w `web/` (frontend) jest czysty dla Twoich plików.
7. Zablokowany (brak klucza API, błąd w zależności, sprzeczność ze specyfikacją) → przywróć `[ ]` i opisz przyczynę w „Uwagach między zadaniami”.
8. Sygnatury z sekcji „Wspólne kontrakty” są wiążące. Jeśli musisz je zmienić — najpierw wpis w „Uwagach”, nie cicha zmiana.

## Status zadań

Identyfikatory: `PK00`–`PK05` backend, `PK20`–`PK26` frontend.

- [x] PK00 · Schemat `db/m5-komunikacja.sql` + `make db-m5` + modele `api/comm/models.py` · zależy: — — zrobione: claude-m5, make db-m5 idempotentny, modele OK
- [x] PK01 · Wpięcie M5: ustawienia, schematy API, stuby routerów, maskowanie logów · zależy: PK00 — zrobione: claude-m5, ruff czysty, maskowanie logów sprawdzone
- [x] PK02 · Wątki: serwis `api/comm/threads.py` + router `api/routers/threads.py` (+ stub asystenta) · zależy: PK01 — zrobione: claude-m5, statusy, 409/422/404 i logi sprawdzone
- [x] PK03 · Asystent pierwszego kontaktu `api/comm/assistant.py` · zależy: PK02 — zrobione: claude-m5, tryb bez LLM sprawdzony; ścieżka z LLM niezweryfikowana (brak klucza w .env)
- [x] PK04 · Eksperci i partnerstwa: `api/routers/mentors.py`, `api/routers/partnerships.py` · zależy: PK01 — zrobione: claude-m5, lista/matches/PATCH/422/404 sprawdzone
- [x] PK05 · Dane demo + `scripts/seed_comm.py` + `make seed-comm` · zależy: PK02, PK04 — zrobione: claude-m5, seed idempotentny (6 ekspertów, 8 ogłoszeń, 4 rozmowy)
- [x] PK20 · Frontend: fundament (klient `comm.ts`, etykiety, pamięć, rola `mentor`, trasy, nawigacja, zaślepki) · zależy: PK01 — zrobione: claude-m5, lint+build czyste; licznik panelu w hooks/useCommCount.ts
- [~] PK21 · Frontend: komponenty rozmowy (`Timeline`, `MessageForm`, `ThreadStatus`, `ThreadList`) + hook `useThread` · zależy: PK20 — agent: claude-m5, 2026-10-04 03:15
- [ ] PK22 · Frontend: Platforma komunikacji — moje rozmowy, nowe pytanie, widok wątku · zależy: PK21, PK03
- [ ] PK23 · Frontend: Tablica partnerstw (lista, dodawanie, ogłoszenie z dopasowaniami) · zależy: PK21, PK04
- [ ] PK24 · Frontend: Panel — Rozmowy (lista, wątek, odpowiedź, ekspert, zamknięcie) · zależy: PK21, PK02, PK04
- [ ] PK25 · Frontend: widok eksperta „Moje konsultacje” · zależy: PK21, PK02, PK04
- [ ] PK26 · Próba generalna demo M5 + przegląd dostępności · zależy: PK05, PK22, PK23, PK24, PK25

### Fale równoległości (orientacyjnie)

- Fala 0: PK00
- Fala 1: PK01
- Fala 2: PK02, PK04, PK20
- Fala 3: PK03, PK05, PK21
- Fala 4: PK22, PK23, PK24, PK25
- Fala 5: PK26

**Najkrótsza działająca ścieżka** (gdy brakuje czasu): PK00–PK03, PK20–PK22, PK24 — scenariusz A: pytanie → odpowiedź AI z kartami → „Chcę porozmawiać z zespołem” → odpowiedź z panelu. Eksperci (PK25) i partnerstwa (PK23) dochodzą na wierzch.

---

## Wspólne kontrakty (wiążące dla wszystkich zadań)

### Konwencje

- Konwencje Modułu 1 obowiązują bez zmian (`docs/modules/01-matchmaking/module-1-tasks.md`, „Wspólne kontrakty → Konwencje”): importy absolutne, async przy I/O, dane w `data/` przez `Path(settings.DATA_DIR)`, progi w `api.config.settings`, błędy przez `ApiError(status, code, message)`, komunikaty po polsku.
- Kod M5 w pakiecie `api/comm/`, routery w `api/routers/`. Modele na `api.models.Base`, enumy przez `ENUM(..., create_type=False)` (wzór `_pg_enum` w `api/models.py`).
- Schemat M5 tylko w `db/m5-komunikacja.sql` (idempotentny; ładuje się po `init.sql` przy pierwszym starcie bazy, na działającej bazie `make db-m5`). `db/init.sql` się nie zmienia.
- **Bez danych kontaktowych.** M5 nie zbiera e-maili ani telefonów (jak czat M1, minimalizacja danych). Kontakt odbywa się w wątku.
- Zapytania wybierają **jawną listę kolumn**; `session_id` nie wychodzi w odpowiedziach.
- Logi: tylko identyfikatory, `kind`, `status`, `role` i długości (`body_len`). Nigdy `body`, `subject`, `title`, `description`, `author_label`.
- Zadania w tle przez `api.tasks.spawn(...)` z **własną** sesją `async with SessionLocal() as session:`.
- Metody HTTP tylko GET, POST, PATCH (CORS M1).
- Frontend: konwencje z `docs/modules/01-matchmaking/frontend-tasks.md` (alias `@/`, eksporty nazwane, ton `DESIGN.md`, filtry w URL, lista kontrolna dostępności). Klient M5 w osobnym `web/src/api/comm.ts` (używa `request` z `client.ts`) — `types.ts` i `client.ts` się nie zmieniają.
- **Stylowanie (`AGENTS.md`, „Stylowanie: Tailwind, bez własnego CSS”):** tylko klasy Tailwinda z presetu (`text-navy`, `text-h1`, `bg-surface-muted`, `gap-3`, `rounded-md`…) i komponenty `ds-*`. Żadnych nowych plików `.css`, reguł w `web/src/styles/*.css`, `style={{…}}`, domyślnej palety Tailwinda ani wartości dowolnych z kolorem/rozmiarem. Wzorzec: `LoginPage.tsx`, `RequireRole.tsx`.
- **Dostęp:** ekrany chronione owijasz `RequireRole` (`web/src/components/RequireRole.tsx`). Na ekranach publicznych akcja wymagająca roli pokazuje link `loginHref(pathname + search)` zamiast formularza.

### Reużycie Modułu 1 (bez zmian)

| Symbol | Skąd | Użycie w M5 |
|---|---|---|
| `preprocess(message, None) -> ProcessedQuery` | `api/pipeline/preprocess.py` | kategoria wątku, zapytanie asystenta |
| `run_search(q) -> SearchResult` (`.gate.passed`, `.solutions`, `.best_chunks`) | `api/pipeline/orchestrator.py` | asystent |
| `generate(query, cards, best_chunks, too_vague, llm)`, `CitationFilter(n)` (`feed`, `flush`, `should_retract`) | `api/pipeline/answer.py` | tekst asystenta z cytowaniami |
| `load_solutions(session, ids)`, `to_card(row, *, rank)` | `api/cards.py` | karty pod wiadomością asystenta |
| `get_llm_provider()`, `ProviderError` | `api/providers` | LLM |
| `SessionLocal`, `get_session` | `api/db.py` | sesje |
| `ApiError`, `spawn` | `api/errors.py`, `api/tasks.py` | błędy, praca w tle |
| `Page[T]`, `SolutionCard`, `ReporterTypeLiteral` | `api/schemas.py` | odpowiedzi |
| `request`, `SolutionCard`, `Alert`, `EmptyState`, `LoadState`, `Pagination`, `usePolling`, `useDocumentTitle`, `useTaxonomy`, `formatDateTime`, `ModuleLabel` | `web/src/…` | UI |
| `GET /api/solutions?category=…&limit=3` | M1 | „Powiązane rozwiązania” przy ogłoszeniu (bez nowego backendu) |

### Pliki współdzielone — kto dopisuje (tylko własny blok)

| Plik | Zadanie | Co |
|---|---|---|
| `Makefile` | PK00 (`db-m5`), PK05 (`seed-comm`) | cele M5 |
| `api/config.py` | PK01 | sekcja „Moduł 5” na końcu pól `Settings` |
| `api/main.py` | PK01 | import i 3 routery M5 w krotce `create_app()` |
| `api/log.py` | PK01 | `REDACTED_KEYS` += `body`, `subject`, `title`, `description`, `author_label` |
| `web/src/lib/auth.tsx`, `web/src/lib/modules.ts` | PK20 | rola `mentor`, konto `ekspert`; nazwa modułu |
| `web/src/App.tsx`, `web/src/components/layout/MainNav.tsx`, `web/src/components/layout/PanelLayout.tsx` | PK20 | trasy i pozycje nawigacji |
| `web/src/pages/panel/InboxPage.tsx` | PK24 | sekcja „Rozmowy czekające na Hub” (dopisanie; M3 K11 dopisuje „Nowe pomysły”) |

Te same pliki dopisują inne moduły (np. M2, M3) — nie przestawiaj ani nie formatuj cudzych linii; przy konflikcie git zachowaj obie wersje.

### Nazwy i sygnatury

| Symbol | Moduł | Właściciel |
|---|---|---|
| `Mentor`, `PartnershipOffer`, `Thread`, `ThreadMessage` + enumy `ThreadKind`, `ThreadStatus`, `MessageRole`, `OrgSector`, `PartnershipIntent`, `OfferStatus` | `api/comm/models.py` | PK00 |
| Modele API (niżej) | `api/comm/schemas.py` | PK01 |
| `async create_thread(session, payload: ThreadCreate) -> int` | `api/comm/threads.py` | PK02 |
| `async add_message(session, thread_id, *, role, body, author_label=None, mentor_id=None, solution_ids=(), meta=None) -> ThreadMessageOut` | `api/comm/threads.py` | PK02 |
| `async set_status(session, thread_id, status: ThreadStatus) -> None` | `api/comm/threads.py` | PK02 |
| `async load_thread(session, thread_id) -> ThreadDetail` | `api/comm/threads.py` | PK02 |
| `async run_assistant(thread_id: int) -> None` (zadanie w tle; stub w PK02, implementacja w PK03) | `api/comm/assistant.py` | PK02 → PK03 |

### Statusy wątku (PK02 implementuje)

| Zdarzenie | Z | Na |
|---|---|---|
| utworzenie `QUESTION` przy `M5_ASSISTANT_ENABLED` | — | `AI_PENDING` |
| utworzenie innego rodzaju albo asystent wyłączony | — | `WAITING_STAFF` |
| asystent: bramka przeszła, są karty → wiadomość `ASSISTANT` | `AI_PENDING` | `WAITING_USER` |
| asystent: „nie wiem” / brak kart / wyjątek → wiadomość `SYSTEM` | `AI_PENDING` | `WAITING_STAFF` |
| wiadomość `USER` | dowolny (także `CLOSED`) | `WAITING_STAFF` |
| wiadomość `STAFF` / `MENTOR` | dowolny poza `CLOSED` (inaczej 409 `THREAD_CLOSED`) | `WAITING_USER` |
| `PATCH {status: WAITING_STAFF}` („Chcę porozmawiać z zespołem”) | `WAITING_USER`, `CLOSED` | `WAITING_STAFF` |
| `PATCH {status: CLOSED}` | dowolny poza `AI_PENDING` | `CLOSED` |
| ten sam status / inne przejście | — | 200 bez zmian / 409 `INVALID_TRANSITION` |

„Nowa odpowiedź” dla autora: `has_reply = last_message_role ∈ {STAFF, MENTOR, ASSISTANT} AND (user_last_read_at IS NULL OR last_message_at > user_last_read_at)`. Licznik w panelu = `GET /api/threads?status=WAITING_STAFF&limit=1` → `total`.

### Kontrakty API (`api/comm/schemas.py`, PK01 — dokładnie tak)

```python
from __future__ import annotations
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator
from api.schemas import ReporterTypeLiteral, SolutionCard

ThreadKindLiteral = Literal["QUESTION", "MENTORING", "PARTNERSHIP"]
ThreadStatusLiteral = Literal["AI_PENDING", "WAITING_STAFF", "WAITING_USER", "CLOSED"]
MessageRoleLiteral = Literal["USER", "STAFF", "MENTOR", "ASSISTANT", "SYSTEM"]
OrgSectorLiteral = Literal["NGO", "JST", "PUBLIC", "BUSINESS", "SCIENCE", "RESIDENTS"]
IntentLiteral = Literal["OFFER", "SEEK"]
# walidator „nie same białe znaki” na body/subject/title/description/organization (jak ReplyCreate w M1)

class ThreadCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: ThreadKindLiteral
    body: str = Field(min_length=1, max_length=4000)
    subject: str | None = Field(default=None, max_length=200)   # None → pierwsze 80 znaków body
    category: str | None = None                                 # None → preprocess(body).category
    reporter_type: ReporterTypeLiteral = "OTHER"
    author_label: str | None = Field(default=None, max_length=100)
    session_id: str | None = Field(default=None, max_length=100)
    partnership_id: int | None = None                           # wymagany dla PARTNERSHIP

class MessageCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role: Literal["USER", "STAFF", "MENTOR"]
    body: str = Field(min_length=1, max_length=4000)
    author_label: str | None = Field(default=None, max_length=100)
    mentor_id: int | None = None                                # wymagany dla MENTOR

class ThreadPatch(BaseModel):
    """`assigned_mentor_id` podane jako null = usunięcie przydziału (sprawdź `model_fields_set`)."""
    model_config = ConfigDict(extra="forbid")
    status: Literal["WAITING_STAFF", "CLOSED"] | None = None
    assigned_mentor_id: int | None = None

class MentorRef(BaseModel):
    id: int
    display_name: str

class Mentor(MentorRef):
    organization: str | None
    expertise: str
    categories: list[str]

class ThreadMessageOut(BaseModel):
    id: int
    role: MessageRoleLiteral
    author_label: str | None
    mentor: MentorRef | None
    body: str
    cards: list[SolutionCard] = Field(default_factory=list)   # tylko ASSISTANT; [n] = pozycja n
    created_at: datetime

class ThreadListItem(BaseModel):
    id: int
    kind: ThreadKindLiteral
    status: ThreadStatusLiteral
    subject: str
    category: str | None
    category_label_pl: str | None
    reporter_type: ReporterTypeLiteral
    author_label: str | None
    partnership_id: int | None
    assigned_mentor: MentorRef | None
    last_message_role: MessageRoleLiteral | None
    last_message_at: datetime
    has_reply: bool
    created_at: datetime

class ThreadDetail(ThreadListItem):
    messages: list[ThreadMessageOut]

class PartnershipCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    intent: IntentLiteral
    organization: str = Field(min_length=2, max_length=300)
    sector: OrgSectorLiteral
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=4000)
    category: str | None = None
    session_id: str | None = Field(default=None, max_length=100)

class PartnershipOffer(BaseModel):
    id: int
    intent: IntentLiteral
    organization: str
    sector: OrgSectorLiteral
    title: str
    description: str
    category: str | None
    category_label_pl: str | None
    status: Literal["PUBLISHED", "CLOSED"]
    created_at: datetime
```

### Endpointy

| Endpoint | Zadanie | Odpowiedź / błędy |
|---|---|---|
| `POST /api/threads` | PK02 | 201 `ThreadDetail`; 404 brak ogłoszenia; 422 `PARTNERSHIP` bez `partnership_id`, ogłoszenie zamknięte, nieznana kategoria |
| `GET /api/threads` | PK02 | `Page[ThreadListItem]`; filtry `status`, `kind`, `mentor_id`, `ids` (CSV ≤ 50), `limit` (50, ≤ 200), `offset`; sort `last_message_at DESC, id DESC` |
| `GET /api/threads/{id}` | PK02 | `ThreadDetail` (wiadomości rosnąco); 404 |
| `POST /api/threads/{id}/messages` | PK02 | 201 `ThreadMessageOut`; 409 `THREAD_CLOSED`, `MENTOR_NOT_ASSIGNED`; 422 `MENTOR` bez `mentor_id` |
| `PATCH /api/threads/{id}` | PK02 | `ThreadDetail`; 409 `INVALID_TRANSITION`; 422 nieznany ekspert. Przydział dopisuje wiadomość `SYSTEM` „Do rozmowy dołączył(a) ekspert: {display_name}.” |
| `POST /api/threads/{id}/read` | PK02 | 204; `user_last_read_at = now()` |
| `GET /api/mentors?category=` | PK04 | `list[Mentor]`; z `category` — najpierw eksperci z tą kategorią, potem reszta; remis po `id` |
| `GET /api/partnerships` | PK04 | `Page[PartnershipOffer]`; filtry `intent`, `sector`, `category`, `status` (domyślnie `PUBLISHED`), `limit`, `offset`; sort `created_at DESC, id DESC` |
| `POST /api/partnerships` | PK04 | 201 `PartnershipOffer` (od razu `PUBLISHED`) |
| `GET /api/partnerships/{id}` | PK04 | `PartnershipOffer`; 404 |
| `PATCH /api/partnerships/{id}` | PK04 | `{status: "CLOSED" \| "PUBLISHED"}` → `PartnershipOffer` |
| `GET /api/partnerships/{id}/matches` | PK04 | `list[PartnershipOffer]`: `PUBLISHED`, inne `id`, przeciwny `intent`, ta sama `category`; sort: najpierw inny `sector` (międzysektorowe), potem `created_at DESC`; limit `PARTNER_MATCH_N` |

### Frontend: klient, etykiety, pamięć (PK20)

- `web/src/api/comm.ts`: typy 1:1 z `api/comm/schemas.py` (`snake_case`) i obiekt `commApi` (`createThread`, `listThreads`, `getThread`, `addMessage`, `patchThread`, `markRead`, `mentors`, `listOffers`, `createOffer`, `getOffer`, `patchOffer`, `offerMatches`) na `request<T>()` z `client.ts` (204 → `undefined`).
- `web/src/lib/comm.ts`: stałe `THREAD_POLL_MS = 5_000`, `AI_POLL_MS = 2_000`, `COMM_COUNT_POLL_MS = 30_000`, `MESSAGE_MAX_CHARS = 4000`; etykiety:
  - rodzaje: QUESTION „Pytanie do Hubu”, MENTORING „Konsultacja z ekspertem”, PARTNERSHIP „Propozycja partnerstwa”;
  - statusy: AI_PENDING „Asystent szuka odpowiedzi”, WAITING_STAFF „Czeka na zespół Hubu”, WAITING_USER „Jest odpowiedź” (autor) / „Czeka na autora” (panel), CLOSED „Zamknięta”;
  - role: USER „Ty” (autor) / „Autor” (panel, ekspert), STAFF „Zespół Hubu”, MENTOR „Ekspert: {display_name}”, ASSISTANT „Odpowiedź automatyczna (AI)”, SYSTEM „Informacja”;
  - sektory: NGO „Organizacja pozarządowa”, JST „Samorząd”, PUBLIC „Instytucja publiczna”, BUSINESS „Firma”, SCIENCE „Uczelnia / nauka”, RESIDENTS „Grupa mieszkańców”; intencje: OFFER „Oferujemy”, SEEK „Szukamy”;
  - pamięć „Moich rozmów” (wzór `web/src/lib/storage.ts`): klucz `splot_threads`, maks. 20 wpisów `{thread_id, created_at, excerpt ≤ 80 znaków}`, `listMyThreads()`, `rememberThread()`, `forgetThread()`, każdy dostęp w `try/catch`.

---

## Zadania

## PK00 — Schemat, `make db-m5`, modele

**Zależy od:** —
**Pliki:** `db/m5-komunikacja.sql` (nowy), `api/comm/__init__.py` (nowy, pusty), `api/comm/models.py` (nowy), `Makefile` (cel `db-m5`)

**Cel:** 4 tabele M5 bez resetu bazy i ich modele.

**Kontekst:** katalog `./db` jest montowany w `docker-entrypoint-initdb.d`; pliki ładują się alfabetycznie (`init.sql` < `m5-komunikacja.sql`). Plik musi być idempotentny.

```sql
-- Splot – Moduł 5 (Platforma aktywnej komunikacji). Idempotentny; na działającej bazie: make db-m5.
DO $$ BEGIN
  CREATE TYPE thread_kind AS ENUM ('QUESTION', 'MENTORING', 'PARTNERSHIP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE thread_status AS ENUM ('AI_PENDING', 'WAITING_STAFF', 'WAITING_USER', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE message_role AS ENUM ('USER', 'STAFF', 'MENTOR', 'ASSISTANT', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE org_sector AS ENUM ('NGO', 'JST', 'PUBLIC', 'BUSINESS', 'SCIENCE', 'RESIDENTS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE partnership_intent AS ENUM ('OFFER', 'SEEK');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE offer_status AS ENUM ('PUBLISHED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Eksperci (dane fikcyjne z data/mentors.json).
CREATE TABLE IF NOT EXISTS mentors (
    id           BIGSERIAL PRIMARY KEY,
    seed_key     TEXT UNIQUE,
    display_name TEXT    NOT NULL,
    organization TEXT,
    expertise    TEXT    NOT NULL,
    categories   TEXT[]  NOT NULL DEFAULT '{}'      -- kody challenge_taxonomy
);

-- Tablica partnerstw „oferujemy / szukamy”.
CREATE TABLE IF NOT EXISTS partnership_offers (
    id           BIGSERIAL PRIMARY KEY,
    seed_key     TEXT UNIQUE,
    intent       partnership_intent NOT NULL,
    organization TEXT         NOT NULL,
    sector       org_sector   NOT NULL,
    title        TEXT         NOT NULL,
    description  TEXT         NOT NULL,
    category     TEXT         REFERENCES challenge_taxonomy(code),
    session_id   TEXT,
    status       offer_status NOT NULL DEFAULT 'PUBLISHED',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partnership_offers_status_idx ON partnership_offers (status, created_at DESC);

-- Wątki rozmów.
CREATE TABLE IF NOT EXISTS threads (
    id                 BIGSERIAL PRIMARY KEY,
    seed_key           TEXT UNIQUE,
    kind               thread_kind   NOT NULL,
    status             thread_status NOT NULL,
    subject            TEXT          NOT NULL,
    category           TEXT          REFERENCES challenge_taxonomy(code),
    reporter_type      reporter_type NOT NULL DEFAULT 'OTHER',
    author_label       TEXT,                      -- podpis autora, niezweryfikowany
    session_id         TEXT,
    partnership_id     BIGINT REFERENCES partnership_offers(id) ON DELETE SET NULL,
    assigned_mentor_id BIGINT REFERENCES mentors(id) ON DELETE SET NULL,
    last_message_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    user_last_read_at  TIMESTAMPTZ,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS threads_status_idx ON threads (status, last_message_at DESC);
CREATE INDEX IF NOT EXISTS threads_mentor_idx ON threads (assigned_mentor_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS thread_messages (
    id           BIGSERIAL PRIMARY KEY,
    thread_id    BIGINT       NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    role         message_role NOT NULL,
    author_label TEXT,
    mentor_id    BIGINT       REFERENCES mentors(id) ON DELETE SET NULL,
    body         TEXT         NOT NULL,
    solution_ids BIGINT[]     NOT NULL DEFAULT '{}', -- karty asystenta; [n] = pozycja n
    meta         JSONB        NOT NULL DEFAULT '{}', -- np. {"fallback": "no_llm"}
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS thread_messages_thread_idx ON thread_messages (thread_id, created_at);
```

**Kroki:**
1. Plik SQL jak wyżej.
2. `Makefile`: `db-m5` → `docker compose exec -T db psql -U splot -d splot -v ON_ERROR_STOP=1 < db/m5-komunikacja.sql`; dopisz do `.PHONY`.
3. `api/comm/models.py`: enumy `StrEnum` i 4 modele 1:1 z DDL (`ARRAY(Text)`, `ARRAY(BigInteger)`, `JSONB`, `server_default`), relacja `Thread.messages` (`order_by=created_at`). Docstring: „Modele M5 1:1 z db/m5-komunikacja.sql. Schemat tworzy wyłącznie plik SQL.”

**Gotowe, gdy:** `make db-m5` dwa razy bez błędu; `\dt` pokazuje 4 nowe tabele; liczba wierszy `solutions` bez zmian; `python -c "from api.comm.models import Thread, ThreadMessage, Mentor, PartnershipOffer"` działa.

---

## PK01 — Wpięcie M5: ustawienia, schematy, stuby, logi

**Zależy od:** PK00
**Pliki:** `api/config.py`, `api/main.py`, `api/log.py` (dopisanie), `api/comm/schemas.py` (nowy), `api/routers/threads.py`, `api/routers/mentors.py`, `api/routers/partnerships.py` (nowe — stuby)

**Cel:** M5 wpięty w aplikację; PK02 i PK04 wypełniają tylko swoje pliki.

**Kroki:**
1. `api/config.py` — sekcja na końcu pól `Settings`:
   ```python
   # --- Moduł 5: Platforma komunikacji ---
   M5_ASSISTANT_ENABLED: bool = True          # automatyczna odpowiedź na pytanie
   M5_ASSISTANT_TIMEOUT_SECONDS: float = 30.0
   PARTNER_MATCH_N: int = 5
   ```
2. `api/comm/schemas.py` — dokładnie jak „Kontrakty API”.
3. Stuby: `router = APIRouter(prefix="/api", tags=["threads" | "mentors" | "partnerships"])`; `api/main.py`: import i 3 routery w krotce.
4. `api/log.py`: `REDACTED_KEYS` += `body`, `subject`, `title`, `description`, `author_label`.

**Gotowe, gdy:** API startuje; `/openapi.json` ma tagi M5; `ThreadCreate(kind="QUESTION", body="  ")` → `ValidationError`; log z `extra={"body": "x"}` wypisuje `***`.

---

## PK02 — Wątki: serwis i router

**Zależy od:** PK01
**Pliki:** `api/comm/threads.py` (nowy), `api/comm/assistant.py` (nowy — **stub**), `api/routers/threads.py`

**Cel:** pełna obsługa wątków: tworzenie, wiadomości, statusy (tabela „Statusy wątku”), przydział eksperta, lista, szczegóły, odczyt.

**Kroki:**
1. `create_thread`: `PARTNERSHIP` → ogłoszenie istnieje (404) i `PUBLISHED` (422 `OFFER_CLOSED`); `category` podana (istnieje w `challenge_taxonomy`, inaczej 422) albo `preprocess(body, None).category`; `subject` = podany albo `body.strip()[:80]`; status początkowy wg tabeli; wiadomość `USER`; commit; gdy `AI_PENDING` → `spawn(assistant.run_assistant(id))`. Log `thread created` (`thread_id`, `kind`, `body_len`).
2. `add_message`: `SELECT … FOR UPDATE` na wątku; `MENTOR` tylko przydzielony ekspert (409 `MENTOR_NOT_ASSIGNED`); zmiana statusu wg tabeli; `last_message_at = now()`.
3. `load_thread` / lista: jawne kolumny, `category_label_pl` z `challenge_taxonomy`, `assigned_mentor`, `last_message_role` (podzapytanie), `has_reply` (reguła z kontraktów); karty wiadomości `ASSISTANT` przez `load_solutions` + `to_card(rank=i)` w kolejności `solution_ids` (tylko `PUBLISHED` i `SOLUTION`).
4. `PATCH`: przejścia z tabeli; `assigned_mentor_id` obecne w żądaniu → przydział / `null` usuwa; nowy przydział dopisuje wiadomość `SYSTEM`.
5. `assistant.py` (stub): `run_assistant(thread_id)` w własnej sesji dopisuje `SYSTEM` „Pytanie trafiło do zespołu Hubu — odpowiemy w tym wątku.” i ustawia `WAITING_STAFF`. PK03 podmienia implementację, sygnatura zostaje.

**Gotowe, gdy:**
```bash
curl -s -XPOST localhost:8000/api/threads -H 'Content-Type: application/json' -d '{"kind":"MENTORING","body":"Szukamy kogoś, kto zna teleopiekę"}'   # 201, WAITING_STAFF
curl -s -XPOST localhost:8000/api/threads/<id>/messages -H 'Content-Type: application/json' -d '{"role":"STAFF","body":"Dzień dobry"}'  # 201 → WAITING_USER
curl -s -XPATCH localhost:8000/api/threads/<id> -H 'Content-Type: application/json' -d '{"status":"CLOSED"}'                           # CLOSED
curl -s -XPOST localhost:8000/api/threads/<id>/messages -H 'Content-Type: application/json' -d '{"role":"STAFF","body":"x"}'            # 409 THREAD_CLOSED
curl -s "localhost:8000/api/threads?status=WAITING_STAFF&limit=1"                                                                       # total
```
`QUESTION` → `AI_PENDING`, po chwili `WAITING_STAFF` z wiadomością `SYSTEM` (stub). W logach brak treści.

---

## PK03 — Asystent pierwszego kontaktu

**Zależy od:** PK02
**Pliki:** `api/comm/assistant.py`

**Cel:** na nowe pytanie (`QUESTION`) w kilka sekund pojawia się odpowiedź z Biblioteki Innowacji — z AI albo bez niego.

**Kroki (`run_assistant(thread_id)`, własna sesja):**
1. `q = preprocess(pierwsza_wiadomość_USER, None)`; `result = await run_search(q)`.
2. `not result.gate.passed or not result.solutions` → `SYSTEM` „Nie mam gotowej odpowiedzi w Bibliotece Innowacji. Pytanie trafiło do zespołu Hubu — odpowiemy w tym wątku.”, `WAITING_STAFF`.
3. Karty = `result.solutions` (nigdy `result.context`). Gdy `settings.LLM_ENABLED`: tekst = `generate(q.normalized, cards, result.best_chunks, q.too_vague, get_llm_provider())` przepuszczony przez `CitationFilter(len(cards))` (`feed` dla każdego fragmentu, na końcu `flush()`), w `asyncio.timeout(settings.M5_ASSISTANT_TIMEOUT_SECONDS)`; `should_retract` → tekst odrzucony.
4. Brak LLM / `ProviderError` / timeout / odrzucenie → treść „Te rozwiązania z Biblioteki Innowacji mogą pomóc:”, `meta.fallback` = `"no_llm" | "error" | "retracted"`.
5. Wiadomość `ASSISTANT` z `solution_ids` w kolejności kart; status `WAITING_USER`.
6. Każdy wyjątek → `SYSTEM` + `WAITING_STAFF`; wątek nie może zostać w `AI_PENDING`.

**Gotowe, gdy:** z `LLM_ENABLED=false`: pytanie „starsi ludzie w gminie są samotni i nie mają z kim porozmawiać” → po kilku sekundach `WAITING_USER`, wiadomość `ASSISTANT` z kartami i `fallback: no_llm`; pytanie „asdf qwer” → `WAITING_STAFF` + `SYSTEM`; z kluczem Anthropic tekst ma `[1]`; żadna karta nie jest `KNOWLEDGE`.

---

## PK04 — Eksperci i partnerstwa

**Zależy od:** PK01
**Pliki:** `api/routers/mentors.py`, `api/routers/partnerships.py`

**Cel:** endpointy `/api/mentors` i `/api/partnerships…` z tabeli „Endpointy”.

**Kroki:**
1. `GET /api/mentors`: z `category` sortuj `(:category = ANY(categories)) DESC, id`.
2. Partnerstwa: lista z filtrami, `POST` (od razu `PUBLISHED`, nieznana kategoria → 422), szczegół, `PATCH` statusu, `matches` (SQL z tabeli). Log `offer created` (`offer_id`, `intent`, `sector`, `description_len`).

**Gotowe, gdy:** `POST` ogłoszenia SEEK w kategorii `AGING` → widoczne na liście; `matches` zwraca ogłoszenia OFFER z `AGING`, najpierw z innego sektora; `PATCH {status: CLOSED}` → znika z listy domyślnej; `GET /api/mentors?category=AGING` → eksperci od `AGING` pierwsi.

---

## PK05 — Dane demo i seed

**Zależy od:** PK02, PK04
**Pliki:** `data/mentors.json`, `data/partnerships-seed.json`, `data/threads-seed.json`, `scripts/seed_comm.py` (nowe), `Makefile` (cel `seed-comm`)

**Cel:** fikcyjne dane do demo. **Żadnych prawdziwych osób ani kontaktów** (`base.md` §9) — imiona wymyślone, organizacje z dopiskiem „(przykład)”.

**Zawartość:**
- `mentors.json`: 6 ekspertów `{seed_key, display_name, organization, expertise, categories}`; każda kategoria taksonomii poza `OTHER` pokryta co najmniej raz; pierwszy (id 1 na świeżej bazie) od `AGING` — konto demo `ekspert` ma `mentorId: 1`.
- `partnerships-seed.json`: 8 ogłoszeń, ≥ 3 OFFER i ≥ 3 SEEK, różne sektory, co najmniej jedna para OFFER/SEEK w tej samej kategorii i z różnych sektorów (do pokazania dopasowania).
- `threads-seed.json`: 4 wątki z wiadomościami (bez wywołań AI): `QUESTION` w `WAITING_STAFF`, `QUESTION` w `WAITING_USER` z odpowiedzią `ASSISTANT` (pole `solution_titles` → `solution_ids` po tytule z bazy), `MENTORING` z przydzielonym ekspertem (`assigned_mentor_seed_key`) i odpowiedzią `MENTOR`, `PARTNERSHIP` do ogłoszenia (`partnership_seed_key`). Czasy względne: `hours_ago`, `minutes_after`.

**Kroki:** `scripts/seed_comm.py` (`python -m scripts.seed_comm`): upsert ekspertów i ogłoszeń po `seed_key`; wątki — pomiń, gdy `seed_key` istnieje; nieznany tytuł rozwiązania → błąd z nazwą. Na końcu liczby rekordów (bez treści). `Makefile`: `seed-comm`.

**Gotowe, gdy:** `make seed-comm` dwa razy daje te same liczby wierszy; `GET /api/threads?status=WAITING_STAFF` niepuste; `GET /api/partnerships/<seed SEEK>/matches` niepuste.

---

## PK20 — Frontend: fundament

**Zależy od:** PK01
**Pliki:** `web/src/api/comm.ts`, `web/src/lib/comm.ts` (nowe); `web/src/lib/auth.tsx`, `web/src/lib/modules.ts`, `web/src/App.tsx`, `web/src/components/layout/MainNav.tsx`, `web/src/components/layout/PanelLayout.tsx` (zmiany); zaślepki stron z tabeli tras (nowe)

**Cel:** klient, etykiety, rola `mentor`, trasy i nawigacja — żeby PK22–PK25 pracowały równolegle w swoich stronach. Po `[x]` pliki zaślepek należą do zadań PK22–PK25.

**Trasy:**

| Trasa | Strona (plik) | Gałąź w `App.tsx` | Właściciel |
|---|---|---|---|
| `/rozmowy`, `/rozmowy/:id` | `CommHomePage`, `ThreadPage` (`pages/comm/`) | `AppShell`, publiczne | PK22 |
| `/rozmowy/nowa` | `NewThreadPage` (`pages/comm/`) | `AppShell` → `RequireRole requiredRole="reporter"` | PK22 |
| `/partnerzy`, `/partnerzy/:id` | `PartnersPage`, `OfferPage` (`pages/comm/`) | `AppShell`, publiczne | PK23 |
| `/partnerzy/nowe` | `NewOfferPage` (`pages/comm/`) | `AppShell` → `RequireRole requiredRole="reporter"` | PK23 |
| `/panel/rozmowy`, `/panel/rozmowy/:id` | `CommThreadsPage`, `CommThreadPage` (`pages/panel/`) | dzieci trasy `panel` | PK24 |
| `/ekspert`, `/ekspert/rozmowy/:id` | `ExpertHomePage`, `ExpertThreadPage` (`pages/expert/`) | `AppShell` → `RequireRole requiredRole="mentor"` | PK25 |

**Kroki:**
1. `comm.ts` i `lib/comm.ts` jak w „Frontend: klient, etykiety, pamięć”.
2. `auth.tsx`: `Role` += `"mentor"`; `AuthAccount` i `AuthSession` z opcjonalnym `mentorId?: number` (kopiowanym w `login()`); konto `{ username: "ekspert", password: "ekspert123", role: "mentor", displayName: "Ekspert demo", mentorId: 1 }`; `ROLE_LABELS.mentor = "Ekspert"`; `isRole`/`readSession` przyjmują `mentor` i `mentorId`; `roleHome("mentor") = "/ekspert"`; `isProtectedPath` += `rozmowy/nowa`, `partnerzy/nowe`, `ekspert`.
3. `modules.ts`: `komunikacja: "Platforma komunikacji"`.
4. `MainNav`: gość i `reporter` — zakładka „Platforma komunikacji” → `/rozmowy` (aktywna też na `/partnerzy…`); `administrator` — bez zmian; `mentor` — Matchmaking, Zasobnik i „Moje konsultacje” → `/ekspert`.
5. `PanelLayout`: „Rozmowy” przed „Trendy” z licznikiem (`total` z `listThreads({status: "WAITING_STAFF", limit: 1})`, co `COMM_COUNT_POLL_MS`, wzór licznika „Nowe” z `ds-sr-only`).
6. Zaślepki: `ds-page` + `ModuleLabel` + `h1 tabIndex={-1}`, klasy Tailwinda.

**Gotowe, gdy:** każda trasa pokazuje swoją zaślepkę; `/rozmowy/nowa` nie trafia do `ThreadPage`; niezalogowany na `/rozmowy/nowa` widzi komunikat z „Zaloguj się” i wraca po zalogowaniu; `ekspert`/`ekspert123` ląduje na `/ekspert`; stara sesja bez `mentorId` wczytuje się; build i lint czyste.

---

## PK21 — Frontend: komponenty rozmowy

**Zależy od:** PK20
**Pliki:** `web/src/components/comm/Timeline.tsx`, `web/src/components/comm/MessageForm.tsx`, `web/src/components/comm/ThreadStatus.tsx`, `web/src/components/comm/ThreadList.tsx`, `web/src/hooks/useThread.ts` (nowe)

**Cel:** wspólne klocki dla autora, panelu i eksperta.

**Kroki:**
1. `Timeline({messages, viewer: "author" | "staff" | "mentor"})`: `<ol aria-label="Wiadomości">`; w każdej `<li>` najpierw rola słownie i data, potem treść (zwykły tekst, akapity zachowane), pod wiadomością asystenta karty `SolutionCard` z `id="karta-{n}"`, a `[n]` w treści jako link do karty. Wiadomość AI z widocznym podpisem „Odpowiedź automatyczna (AI) — sprawdź szczegóły w kartach rozwiązań.” Rozróżnienie ról słowem, nie tylko kolorem.
2. `MessageForm({label, submitLabel, onSend})`: `ds-field` + `ds-textarea` z licznikiem do `MESSAGE_MAX_CHARS`, `ds-btn--primary`, stan wysyłania, błąd w `Alert`.
3. `ThreadStatus({status, viewer})`: `ds-tag` ze słowem.
4. `ThreadList({items, hrefFor, viewer})`: temat, rodzaj, status, data ostatniej wiadomości, „Nowa odpowiedź” gdy `has_reply` (widok autora).
5. `useThread(id, {markRead})`: ładowanie + odpytywanie (`AI_POLL_MS` przy `AI_PENDING`, inaczej `THREAD_POLL_MS`), `refresh()`, komunikat do `aria-live` przy nowej wiadomości, `markRead` po wczytaniu (tylko autor).

**Gotowe, gdy:** komponenty renderują wątek z seedu w zaślepce; czytnik ekranu czyta rolę przed treścią; build i lint czyste.

---

## PK22 — Frontend: Platforma komunikacji (autor)

**Zależy od:** PK21, PK03
**Pliki:** `web/src/pages/comm/CommHomePage.tsx`, `web/src/pages/comm/NewThreadPage.tsx`, `web/src/pages/comm/ThreadPage.tsx`

**Kroki:**
1. `CommHomePage`: `h1` „Platforma komunikacji”, krótki opis; „Zadaj pytanie” (`ds-btn--cta`, jedyny na ekranie), „Poproś o eksperta” (`/rozmowy/nowa?rodzaj=ekspert`), „Tablica partnerstw” (`/partnerzy`); sekcja „Moje rozmowy”: `listMyThreads()` → `listThreads({ids})` → `ThreadList`, pusto → `EmptyState`.
2. `NewThreadPage`: pole pytania, „Kim jesteś?” (`reporter_type`, radio jak w czacie M1), „Podpis (opcjonalnie)” z podpowiedzią „Nie podawaj nazwiska, jeśli nie chcesz”; `rodzaj=ekspert` → `kind: MENTORING` i nagłówek „Poproś o eksperta”. Po wysłaniu `rememberThread` i przejście do `/rozmowy/:id`.
3. `ThreadPage`: `h1` temat, status, `Timeline`; przy `AI_PENDING` spinner i „Asystent szuka odpowiedzi w Bibliotece Innowacji…” (`role="status"`); przy `WAITING_USER` z ostatnią wiadomością `ASSISTANT` przyciski „To mi pomogło” (`CLOSED`) i „Chcę porozmawiać z zespołem Hubu” (`WAITING_STAFF`); `MessageForm` „Odpowiedz” dla `reporter`, dla gościa link do logowania.

**Gotowe, gdy:** z `LLM_ENABLED=false` pytanie o samotność seniorów daje odpowiedź automatyczną z kartami bez przeładowania; eskalacja zmienia status; odpowiedź zespołu wysłana curl-em pojawia się w ≤ 5 s i w „Moich rozmowach” jest „Nowa odpowiedź”; lista kontrolna dostępności OK.

---

## PK23 — Frontend: Tablica partnerstw

**Zależy od:** PK21, PK04
**Pliki:** `web/src/pages/comm/PartnersPage.tsx`, `web/src/pages/comm/NewOfferPage.tsx`, `web/src/pages/comm/OfferPage.tsx`, `web/src/components/comm/OfferCard.tsx`

**Kroki:**
1. `PartnersPage`: `h1` „Tablica partnerstw”, filtry w URL (`ds-select`: „Oferujemy / Szukamy”, sektor, wyzwanie) z wynikiem w `aria-live`, lista `OfferCard`, „Dodaj ogłoszenie” dla `reporter`.
2. `NewOfferPage`: formularz `PartnershipCreate`; po wysłaniu przejście do ogłoszenia.
3. `OfferPage`: szczegóły; „Pasujące ogłoszenia” (`matches`, z oznaczeniem słownym „Inny sektor” dla różnych sektorów); „Powiązane rozwiązania” (`GET /api/solutions?category=…&limit=3`, `SolutionCard`); „Zaproponuj współpracę” (`reporter`) → `MessageForm` → `createThread({kind: "PARTNERSHIP", partnership_id, body})` → `rememberThread` → wątek. Tekst: „Hub skontaktuje obie strony w tej rozmowie.” Dla `administrator` przycisk „Zamknij ogłoszenie”.

**Gotowe, gdy:** na danych z seedu filtr SEEK zawęża listę; ogłoszenie z seedu pokazuje dopasowanie z innego sektora i rozwiązania; propozycja tworzy wątek widoczny w „Moich rozmowach” i w panelu; lista kontrolna dostępności OK.

---

## PK24 — Frontend: Panel — Rozmowy

**Zależy od:** PK21, PK02, PK04
**Pliki:** `web/src/pages/panel/CommThreadsPage.tsx`, `web/src/pages/panel/CommThreadPage.tsx`, `web/src/pages/panel/InboxPage.tsx` (tylko dopisanie sekcji)

**Kroki:**
1. `CommThreadsPage`: filtry statusu (domyślnie „Czeka na zespół Hubu”) i rodzaju w URL, `ThreadList` (viewer `staff`), `Pagination`.
2. `CommThreadPage`: okruszki, `h1` temat, rodzaj, wyzwanie, typ zgłaszającego, link do ogłoszenia (`PARTNERSHIP`); `Timeline` (viewer `staff`); `MessageForm` „Odpowiedź Hubu” z polem „Podpis” (domyślnie „Zespół Hubu”); „Zamknij rozmowę” / „Otwórz ponownie”; „Ekspert”: `ds-select` z `GET /api/mentors?category=…` (pierwsi pasujący, dopisek „ten sam obszar”), „Przydziel” / „Usuń przydział”.

3. `InboxPage` (Skrzynka, plik M1): dopisz na końcu osobną sekcję „Rozmowy czekające na Hub” — do 5 wątków z `listThreads({status: "WAITING_STAFF", limit: 5})`, link „Wszystkie rozmowy” → `/panel/rozmowy`; pusto → krótki `EmptyState`. Nie zmieniaj sekcji M1 ani sekcji „Nowe pomysły” (M3, K11). Tylko Tailwind i `ds-*`, bez reguł w `styles/panel.css`.

**Gotowe, gdy:** licznik „Rozmowy” w nawigacji panelu pokazuje wątki z seedu; odpowiedź z panelu pojawia się u autora; przydział eksperta dodaje wiadomość systemową, a wątek pojawia się u eksperta; lista kontrolna dostępności OK.

---

## PK25 — Frontend: widok eksperta

**Zależy od:** PK21, PK02, PK04
**Pliki:** `web/src/pages/expert/ExpertHomePage.tsx`, `web/src/pages/expert/ExpertThreadPage.tsx`

**Kroki:**
1. `ExpertHomePage`: `h1` „Moje konsultacje”, `ThreadList` z `listThreads({mentor_id: session.mentorId})`; pusto → `EmptyState` „Nie masz przydzielonych rozmów.”
2. `ExpertThreadPage`: `Timeline` (viewer `mentor`), `MessageForm` → `addMessage({role: "MENTOR", mentor_id, body})`; wątek nieprzydzielony → komunikat zamiast formularza.

**Gotowe, gdy:** konto `ekspert` widzi wątek `MENTORING` z seedu; odpowiedź pojawia się u autora jako „Ekspert: {imię}”.

---

## PK26 — Próba generalna demo M5

**Zależy od:** PK05, PK22, PK23, PK24, PK25
**Pliki:** `docs/modules/05-platforma-komunikacji/module-5-demo.md` (nowy); poprawki tylko jako wpisy w „Uwagach”

**Kroki:** `make db-m5 && make seed-comm`; przejdź scenariusze A (pytanie → AI → zespół → ekspert) i C (partnerstwo) ze specyfikacji na kontach `reporter`, `admin`, `ekspert`, z klawiatury i w `data-contrast="high"`; zapisz scenariusz demo (≤ 3 min) i wynik listy kontrolnej dostępności.

**Gotowe, gdy:** `module-5-demo.md` zawiera przetestowany scenariusz; brak usterek blokujących demo.

---

## Uwagi między zadaniami

_(dopisuj na końcu: `- [PKxx → PKyy] opis`)_
- [M3 → PK11] Plan M3 jest teraz w v0.3 i ma przenumerowane zadania (K00–K13). Backend pomysłów (`ideas`, `idea_replies`, endpointy) to **K03** (było K04), a „Moje pomysły” to **K11** (było K15). Status pomysłu nie ma już `PROMOTED`, a statusy `SUBMITTED|IN_REVIEW|INVITED|REJECTED` Hub ustawia bez macierzy przejść. Kontrakt `idea_replies` jest bez zmian. Zależność PK11 czytaj jako „K03 (M3)”.
- [PK → M3] W v0.4 planu M5 zadanie PK11 (rozmowa o pomyśle, wątek `IDEA`) przeszło do backlogu (spec M5, sekcja 14) — M5 nie zależy teraz od M3. Przy powrocie do tematu zależność to K03 (backend pomysłów), a przycisk w „Moich pomysłach” — K11.
- [triaż → PK01, PK03, PK20, PK24] 2026-10-04, podział między modułami (`docs/modules/README.md` → „Podział między modułami”). Treść zadań już poprawiona:
  - Ustawienia asystenta mają prefiks `M5_`: `M5_ASSISTANT_ENABLED`, `M5_ASSISTANT_TIMEOUT_SECONDS` (M3 ma podobne `M3_ASSIST_*`). `PARTNER_MATCH_N` bez zmian.
  - PK24 dopisuje do `InboxPage.tsx` sekcję „Rozmowy czekające na Hub” — Skrzynka panelu pokazuje wszystko, co czeka na Hub: zgłoszenia (M1), pomysły (M3, K11), rozmowy (M5).
  - PK20: **M5 jest właścicielem `web/src/lib/auth.tsx`** (rola `mentor`) i przebudowy `MainNav.tsx` pod role. Zrób PK20 jako jeden z pierwszych PR-ów; M3 (K07) dopisze „Kreator” i plakietkę na Twojej wersji. Rola `mentor` widzi zgodnie z planem: Matchmaking, Zasobnik, „Moje konsultacje” (bez Kreatora i Testera). Zachowaj istniejące pozycje M4 (`/testy`, `/panel/testy` „Testerzy”).
  - Trzy kanały odpowiedzi do autora zostają rozdzielone: `report_replies` (M1), `idea_replies` (M3), wątki M5. Scalanie (PK11, oś czasu przy zgłoszeniu) — backlog.
  - `SolutionCard.tsx` należy do M2 (Z13) — w `Timeline` i `OfferPage` tylko go używaj.
  - Schemat w osobnym `db/m5-komunikacja.sql` jest teraz konwencją wszystkich modułów (M2: `db/m2-zasobnik.sql`, M3: `db/m3-kreator.sql`); M4 zostaje w `db/init.sql` (już na masterze).
  - Wspólne pliki (`api/config.py`, `api/main.py`, `Makefile`, `App.tsx`, `PanelLayout.tsx`) — dopisuj blokiem z komentarzem `Moduł 5`, bez przestawiania cudzych linii.
- [PK20 → PK21–PK25] Licznik „Rozmowy” w panelu jest w osobnym hooku `web/src/hooks/useCommCount.ts` (poza listą plików PK20 — dopisany, żeby nie rozbudowywać `PanelLayout`). Limit znaków wiadomości to `COMM_MESSAGE_MAX_CHARS` w `lib/comm.ts` (nazwa `MESSAGE_MAX_CHARS` jest już zajęta w `labels.ts` przez czat M1 = 2000). Pamięć „Moich rozmów” jest w `lib/comm.ts` (`listMyThreads`, `rememberThread`, `forgetThread`).
- [PK05 → wszyscy] `make seed-comm` łączy się z bazą z `DATABASE_URL`. Jeśli na hoście działa lokalny Postgres na 5432 (tak jest na jednej z maszyn), uruchom seed w kontenerze: `docker compose exec api python -m scripts.seed_comm` (wymaga kodu M5 w obrazie albo zamontowanego `api/`, `scripts/`, `data/`). Konto demo `ekspert` ma `mentorId: 1` — na świeżej bazie to pierwszy ekspert z `data/mentors.json`.
