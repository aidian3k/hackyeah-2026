# Moduł 5 — Platforma aktywnej komunikacji: plan implementacji i zadania

Plan na podstawie `docs/modules/05-platforma-komunikacji/module-5-platforma-komunikacji.html` (v0.2). Każde zadanie jest samowystarczalne: zawiera cel, pliki, wklejony kontekst ze specyfikacji, kroki i kryterium gotowości. Agent wykonujący zadanie **nie musi czytać specyfikacji HTML** — ale musi przeczytać `AGENTS.md` (twarde reguły) oraz sekcję „Wspólne kontrakty” poniżej.

**Odstępstwa od specyfikacji (decyzja zespołu, 2026-10-03, jak w Module 1):**
- **Bez autoryzacji.** Wszystkie endpointy są otwarte; bez tokenów, nagłówków dostępu i kodów 401/403. Role (`reporter`, `administrator`, `mentor`) istnieją tylko we frontendzie (`web/src/lib/auth.tsx`).
- **Bez testów automatycznych.** Weryfikacja każdego zadania: curl, psql, `python -c`, ręczne uruchomienie.

## Protokół pracy (obowiązkowy)

1. **Jedyne źródło statusu** to lista „Status zadań” poniżej. Treść zadań nie zawiera statusu.
2. Stany:
   - `- [ ]` — wolne,
   - `- [~]` — w toku; dopisz na końcu linii ` — agent: <nazwa>, <RRRR-MM-DD GG:MM>`,
   - `- [x]` — zrobione; zamień dopisek na ` — zrobione: <nazwa>, <krótka notka lub hash commita>`.
3. **Branie zadania:** wybierz zadanie `[ ]`, którego wszystkie zależności są `[x]`. Edytuj tylko jego linię na `[~]`, potem przeczytaj plik ponownie i sprawdź, czy linia nadal ma Twój dopisek (jeśli ktoś był szybszy — weź inne zadanie).
4. Edytuj w tym pliku **wyłącznie linię swojego zadania** oraz (ewentualnie) dopisuj na końcu sekcji „Uwagi między zadaniami”. Nie przepisuj innych linii, nie formatuj pliku.
5. Zmieniaj w repozytorium **tylko pliki wymienione w polu „Pliki” swojego zadania**. Potrzebujesz zmiany w cudzym pliku → wpis w „Uwagach między zadaniami” (`- [PKxx → PKyy] opis`), nie edycja. Zadania, które dopisują coś do plików Modułu 1 lub frontendu (wyliczone w ADR-M5-010), dodają też jednolinijkowy wpis w „Uwagach” odpowiedniego pliku zadań (`module-1-tasks.md` / `frontend-tasks.md`).
6. `[x]` dopiero, gdy spełnione jest „Gotowe, gdy” (ręczna weryfikacja opisana w zadaniu) i `ruff check .` (backend) albo `npm run lint && npm run build` w `web/` (frontend) jest czysty dla Twoich plików.
7. Zablokowany (brak klucza API, błąd w zależności, sprzeczność ze specyfikacją) → przywróć `[ ]` i opisz przyczynę w „Uwagach między zadaniami”.
8. Sygnatury z sekcji „Wspólne kontrakty” są wiążące. Jeśli musisz je zmienić — najpierw wpis w „Uwagach”, nie cicha zmiana.

## Status zadań

Identyfikatory: `PK00`–`PK10` backend, `PK20`–`PK29` frontend (prefiks modułu — bez kolizji z `T` i `F`).

- [ ] PK00 · Schemat M5 w `db/init.sql` + modele `api/comm/models.py` · zależy: —
- [ ] PK01 · Ustawienia M5, rejestracja routerów, maskowanie logów, stuby routerów · zależy: PK00
- [ ] PK02 · Kontrakty API: `api/comm/schemas.py` · zależy: PK00
- [ ] PK03 · Dane demo: `data/mentors.json`, `data/partnerships-seed.json`, `data/threads-seed.json` · zależy: —
- [ ] PK04 · Serwis wątków `api/comm/threads.py` (tworzenie, wiadomości, automat stanów, oś czasu, notify) · zależy: PK01, PK02
- [ ] PK05 · Asystent `api/comm/assistant.py` (odpowiedź AI, szkic odpowiedzi) · zależy: PK04
- [ ] PK06 · Dopasowania `api/comm/matching.py` (eksperci, partnerzy, teksty embeddingów) · zależy: PK01, PK02
- [ ] PK07 · Router `api/routers/threads.py` (+ `/api/comm/inbox`) · zależy: PK04, PK05, PK06
- [ ] PK08 · Routery `api/routers/mentors.py`, `api/routers/partnerships.py` · zależy: PK06
- [ ] PK09 · `scripts/seed_comm.py` + `make seed-comm` · zależy: PK03, PK04, PK06
- [ ] PK10 · Kalibracja progów M5 i próba generalna backendu · zależy: PK07, PK08, PK09
- [ ] PK20 · Frontend: kontrakty (`web/src/api/comm.ts`), stałe, pamięć „Moich rozmów”, rola `mentor` · zależy: PK02
- [ ] PK21 · Frontend: trasy i nawigacja M5 (publiczna, panel, ekspert) · zależy: PK20
- [ ] PK22 · Frontend: komponenty rozmowy (oś czasu, formularz, status) + hooki `useThread`, `useCommInbox` · zależy: PK20
- [ ] PK23 · Frontend: „Platforma komunikacji” — Moje rozmowy, nowe pytanie, widok wątku · zależy: PK21, PK22, PK07
- [ ] PK24 · Frontend: „Odpisz zespołowi” w „Moich zgłoszeniach” + link w panelu zgłoszenia · zależy: PK23
- [ ] PK25 · Frontend: Tablica partnerstw (lista, dodawanie, ogłoszenie z dopasowaniami) · zależy: PK21, PK22, PK08
- [ ] PK26 · Frontend: Panel — Rozmowy (lista, wątek, szkic AI, ekspert, licznik) · zależy: PK21, PK22, PK07, PK08
- [ ] PK27 · Frontend: Panel — moderacja partnerstw · zależy: PK21, PK08
- [ ] PK28 · Frontend: widok eksperta „Moje konsultacje” · zależy: PK21, PK22, PK07
- [ ] PK29 · Przegląd dostępności i próba generalna ścieżki demo M5 · zależy: PK10, PK23, PK24, PK25, PK26, PK27, PK28

### Fale równoległości (orientacyjnie)

- Fala 0: PK00, PK03
- Fala 1: PK01, PK02
- Fala 2: PK04, PK06, PK20
- Fala 3: PK05, PK08, PK09, PK21, PK22
- Fala 4: PK07, PK27
- Fala 5: PK10, PK23, PK25, PK26, PK28
- Fala 6: PK24 → PK29

**Najkrótsza działająca ścieżka** (gdy brakuje czasu): PK00–PK05, PK07 (bez endpointu `mentor-suggestions` — zwraca `[]`), PK09 tylko z wątkami, PK20–PK23, PK26 — scenariusz A z asystentem AI i odpowiedzią zespołu. Eksperci (PK06, PK08, PK28), partnerstwa (PK25, PK27) i odpis do zgłoszenia (PK24) dochodzą na wierzch.

---

## Wspólne kontrakty (wiążące dla wszystkich zadań)

### Konwencje

- Konwencje Modułu 1 obowiązują bez zmian (`docs/modules/01-matchmaking/module-1-tasks.md`, „Wspólne kontrakty → Konwencje”): importy absolutne, async przy I/O, dane w `data/` przez `Path(settings.DATA_DIR)`, progi w `api.config.settings`.
- Kod M5 w pakiecie `api/comm/` (`__init__.py` tworzy PK00). Routery w `api/routers/`.
- Modele M5 dziedziczą po `api.models.Base`. Enumy Postgres istnieją w `init.sql` — `ENUM(..., create_type=False)` jak w M1 (`_pg_enum`).
- Zapytania wybierają **jawną listę kolumn** — `contact_email`, `embedding`, `session_id` nigdy nie trafiają do modeli odpowiedzi.
- Logi: `log.info("…", extra={"thread_id": …, "kind": …, "role": …, "body_len": …})`. Nigdy `body`, `subject`, `description`, `author_label`, `contact_email`.
- Zadania w tle przez `api.tasks.spawn(...)` z **własną** sesją `async with SessionLocal() as session:`.
- Frontend: konwencje z `docs/modules/01-matchmaking/frontend-tasks.md` (design system, `request` z `web/src/api/client.ts`, komponenty wspólne z F05, lista kontrolna dostępności). Typy M5 w osobnym pliku `web/src/api/comm.ts` — `web/src/api/types.ts` się nie zmienia.

### Zależności od Modułu 1 i frontendu (reużycie bez zmian)

| Symbol | Skąd | Użycie w M5 |
|---|---|---|
| `preprocess(message, gmina) -> ProcessedQuery` | `api/pipeline/preprocess.py` | kategoria wątku, zapytanie asystenta (`gmina=None`) |
| `run_search(q) -> SearchResult` | `api/pipeline/orchestrator.py` | asystent, szkic odpowiedzi |
| `generate(query, cards, best_chunks, too_vague, llm)`, `CitationFilter(n_cards)` (`feed`, `flush`, `should_retract`) | `api/pipeline/answer.py` | odpowiedź asystenta |
| `semantic_search(session, vec, kind, limit) -> list[Candidate]` | `api/pipeline/semantic.py` | rozwiązania przy ogłoszeniu |
| `load_solutions(session, ids)`, `to_card(row, *, rank)` | `api/cards.py` | karty pod wiadomościami (`scores = None`) |
| `get_embedding_provider()`, `get_llm_provider()`, `ProviderError` | `api/providers` | embeddingi, LLM |
| `SessionLocal`, `get_session`, `to_pgvector` | `api/db.py` | sesje, wektory |
| `ApiError(status, code, message)` | `api/errors.py` | błędy 404/409/422/503 |
| `spawn(coro)` | `api/tasks.py` | prace w tle |
| `Base`, `Report`, `ReportReply`, `Solution`, `Taxonomy`, `ReporterType` | `api/models.py` | FK, oś czasu `REPORT` |
| `Page[T]`, `SolutionCard`, `ReporterTypeLiteral` | `api/schemas.py` | odpowiedzi |
| `request<T>(method, path, opts)`, `ApiError` | `web/src/api/client.ts` | klient M5 |
| `SolutionCard`, `Alert`, `EmptyState`, `LoadState`, `usePolling`, `useDocumentTitle`, `useTaxonomy`, `formatDateTime`, `plural` | `web/src/…` | UI M5 |

### Zmiany w plikach Modułu 1 i frontendu (ADR-M5-010 — tylko dopisanie)

| Plik | Zmiana | Zadanie |
|---|---|---|
| `db/init.sql` | sekcja „Moduł 5” na końcu pliku | PK00 |
| `api/config.py` | blok `# --- Moduł 5 ---` | PK01 |
| `api/main.py` | `threads.router`, `mentors.router`, `partnerships.router` w pętli `include_router` | PK01 |
| `api/log.py` | `REDACTED_KEYS` += `body`, `subject`, `description`, `author_label` | PK01 |
| `Makefile` | cel `seed-comm` | PK09 |
| `web/src/lib/auth.tsx` | rola `mentor`, konto `ekspert`/`ekspert123` z `mentorId` | PK20 |
| `web/src/lib/modules.ts` | `komunikacja: "Platforma komunikacji"` | PK20 |
| `web/src/App.tsx`, `web/src/components/layout/MainNav.tsx`, `web/src/components/layout/PanelLayout.tsx` | trasy i pozycje nawigacji | PK21 |
| `web/src/pages/MyReportsPage.tsx`, `web/src/pages/panel/ReportPage.tsx` | „Odpisz zespołowi”, link „Rozmowa z autorem” | PK24 |

### Nazwy i sygnatury, z których korzystają inne zadania

| Symbol | Moduł | Właściciel |
|---|---|---|
| Modele `Mentor`, `PartnershipOffer`, `Thread`, `ThreadMessage` + enumy `ThreadKind`, `ThreadStatus`, `MessageRole`, `OrgSector`, `PartnershipIntent`, `OfferStatus` | `api/comm/models.py` | PK00 |
| Ustawienia M5 (lista w PK01) | `api/config.py` | PK01 |
| Modele API (lista w „Kontraktach API” niżej) | `api/comm/schemas.py` | PK02 |
| `async create_thread(session, payload: ThreadCreate) -> tuple[int, bool]` (id, created) | `api/comm/threads.py` | PK04 |
| `async add_message(session, thread_id, payload: MessageCreate) -> TimelineMessage` | `api/comm/threads.py` | PK04 |
| `async add_system_message(session, thread_id, body, *, meta=None) -> None` | `api/comm/threads.py` | PK04 |
| `async patch_thread(session, thread_id, patch: ThreadPatch) -> None` | `api/comm/threads.py` | PK04 |
| `async set_status(session, thread_id, status: ThreadStatus) -> None` (utrzymuje `waiting_since`) | `api/comm/threads.py` | PK04 |
| `async load_thread_detail(session, thread_id) -> ThreadDetail` | `api/comm/threads.py` | PK04 |
| `async list_threads(session, *, status, kind, mentor_id, session_id, ids, limit, offset) -> Page[ThreadListItem]` | `api/comm/threads.py` | PK04 |
| `async mark_read(session, thread_id, side) -> None` | `api/comm/threads.py` | PK04 |
| `async load_comm_inbox(session) -> CommInbox` | `api/comm/threads.py` | PK04 |
| `async after_create(thread_id: int) -> None` (zadanie w tle: embedding, asystent, notify) | `api/comm/threads.py` | PK04 |
| `notify(event: str, thread_id: int, **fields) -> None` | `api/comm/threads.py` | PK04 |
| `async run_assistant(thread_id: int) -> None` | `api/comm/assistant.py` | PK05 |
| `async draft_reply(session, thread_id) -> DraftReply` | `api/comm/assistant.py` | PK05 |
| `thread_embedding_text(subject, body) -> str`, `mentor_embedding_text(m, labels) -> str`, `offer_embedding_text(title, description) -> str` | `api/comm/matching.py` | PK06 |
| `async embed_thread(session, thread_id) -> bool`, `async embed_offer(session, offer_id) -> bool`, `async embed_mentor(session, mentor_id) -> bool` | `api/comm/matching.py` | PK06 |
| `async suggest_mentors(session, thread_id) -> list[MentorSuggestion]` | `api/comm/matching.py` | PK06 |
| `async match_partners(session, offer_id) -> PartnerMatches` | `api/comm/matching.py` | PK06 |
| `async load_cards(session, solution_ids) -> list[SolutionCard]` (tylko `PUBLISHED` + `SOLUTION`, kolejność wejścia, `rank` 1..n) | `api/comm/threads.py` | PK04 |

**Uwaga o cyklu importów:** `threads.after_create` importuje `assistant` i `matching` leniwie (wewnątrz funkcji), bo `assistant` importuje `threads`.

### Automat stanów wątku (PK04 implementuje, wszyscy respektują)

| Zdarzenie | Z | Na |
|---|---|---|
| utworzenie `QUESTION`, `settings.ASSISTANT_ENABLED` | — | `ASSISTANT_PENDING` |
| utworzenie innego rodzaju albo asystent wyłączony | — | `WAITING_STAFF` |
| asystent: bramka przeszła i są karty | `ASSISTANT_PENDING` | `ANSWERED_BY_AI` |
| asystent: „nie wiem” / brak kart / wyjątek | `ASSISTANT_PENDING` | `WAITING_STAFF` + wiadomość `SYSTEM` |
| wiadomość `USER` | dowolny | `WAITING_STAFF` |
| wiadomość `STAFF` / `MENTOR` | dowolny poza `CLOSED` | `WAITING_USER` (`CLOSED` → 409 `THREAD_CLOSED`) |
| `PATCH {status: WAITING_STAFF}` | `ANSWERED_BY_AI`, `WAITING_USER`, `CLOSED` | `WAITING_STAFF` |
| `PATCH {status: CLOSED}` | dowolny poza `ASSISTANT_PENDING` | `CLOSED` |
| ten sam status w `PATCH` | — | 200 bez zmian |
| inne przejście | — | 409 `INVALID_TRANSITION` |

`waiting_since = now()` przy wejściu w `WAITING_STAFF`, `NULL` przy wyjściu. Każda wiadomość ustawia `threads.last_message_at` i `updated_at`.

### Kontrakty API (`api/comm/schemas.py`, PK02 — dokładnie tak)

```python
from __future__ import annotations
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator
from api.schemas import ReporterTypeLiteral, SolutionCard

ThreadKindLiteral = Literal["QUESTION", "REPORT", "MENTORING", "PARTNERSHIP"]
ThreadStatusLiteral = Literal["ASSISTANT_PENDING", "ANSWERED_BY_AI", "WAITING_STAFF", "WAITING_USER", "CLOSED"]
MessageRoleLiteral = Literal["USER", "STAFF", "MENTOR", "ASSISTANT", "SYSTEM"]
WritableRoleLiteral = Literal["USER", "STAFF", "MENTOR"]
OrgSectorLiteral = Literal["NGO", "JST", "PUBLIC", "BUSINESS", "SCIENCE", "RESIDENTS"]
IntentLiteral = Literal["OFFER", "SEEK"]
OfferStatusLiteral = Literal["PENDING_REVIEW", "PUBLISHED", "REJECTED", "CLOSED"]
ReadSideLiteral = Literal["user", "staff", "mentor"]

# walidator „nie same spacje” na body/subject/title/description jak ReplyCreate w M1

class ThreadCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: ThreadKindLiteral
    body: str = Field(min_length=1, max_length=4000)
    subject: str | None = Field(default=None, max_length=200)   # None → pierwsze 80 znaków body
    category: str | None = None
    reporter_type: ReporterTypeLiteral = "OTHER"
    author_label: str | None = Field(default=None, max_length=100)
    contact_email: str | None = Field(default=None, max_length=254)
    session_id: str | None = Field(default=None, max_length=100)
    report_id: int | None = None            # wymagany dla REPORT
    solution_id: int | None = None          # opcjonalny kontekst MENTORING / QUESTION
    partnership_id: int | None = None       # wymagany dla PARTNERSHIP (ogłoszenie PUBLISHED)
    from_partnership_id: int | None = None  # własne ogłoszenie proponującego (opcjonalne)

class MessageCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role: WritableRoleLiteral
    body: str = Field(min_length=1, max_length=4000)
    author_label: str | None = Field(default=None, max_length=100)
    mentor_id: int | None = None            # wymagany dla MENTOR
    solution_ids: list[int] = Field(default_factory=list)  # tylko STAFF/MENTOR; ≤ THREAD_MESSAGE_CARDS_MAX (walidacja w serwisie)

class ThreadPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: Literal["WAITING_STAFF", "CLOSED"] | None = None
    assigned_mentor_id: int | None = None   # odróżnij „brak pola” od null: model_fields_set

class ReadMark(BaseModel):
    side: ReadSideLiteral

class MentorRef(BaseModel):
    id: int
    display_name: str

class Mentor(BaseModel):
    id: int
    display_name: str
    organization: str | None
    sector: OrgSectorLiteral | None
    expertise: str
    bio: str
    categories: list[str]
    active: bool

class MentorSuggestion(BaseModel):
    mentor: Mentor
    category_match: bool
    similarity: float | None

class TimelineMessage(BaseModel):
    id: str                                  # "m-<thread_messages.id>" | "r-<report_replies.id>"
    source: Literal["thread", "report_reply"]
    role: MessageRoleLiteral
    author_label: str | None
    mentor: MentorRef | None
    body: str
    cards: list[SolutionCard] = Field(default_factory=list)
    ai: bool                                 # role == ASSISTANT
    author_verified: Literal[False] = False
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
    report_id: int | None
    partnership_id: int | None
    assigned_mentor: MentorRef | None
    message_count: int                       # thread_messages (+ report_replies dla REPORT)
    last_message_at: datetime
    last_message_role: MessageRoleLiteral | None
    waiting_since: datetime | None
    waiting_hours: float | None              # now() - waiting_since, w godzinach, 1 miejsce po przecinku
    over_sla: bool                           # waiting_hours >= THREAD_SLA_HOURS
    unread_user: bool                        # wiadomość nie-USER nowsza niż user_last_read_at (NULL = wszystko nowe)
    unread_staff: bool                       # wiadomość USER nowsza niż staff_last_read_at
    unread_mentor: bool                      # wiadomość USER/STAFF nowsza niż mentor_last_read_at (tylko gdy jest ekspert)
    created_at: datetime

class ThreadDetail(ThreadListItem):
    solution_id: int | None
    from_partnership_id: int | None
    messages: list[TimelineMessage]

class DraftReply(BaseModel):
    body: str
    solution_ids: list[int]
    cards: list[SolutionCard]

class CommInbox(BaseModel):
    waiting_staff: int
    over_sla: int
    unassigned_mentoring: int                # kind=MENTORING, status != CLOSED, brak eksperta
    pending_offers: int                      # partnership_offers PENDING_REVIEW
    oldest_waiting_hours: float | None
    latest_waiting: list[ThreadListItem]     # ≤ 10, WAITING_STAFF, najdłużej czekające pierwsze

class PartnershipCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    intent: IntentLiteral
    organization: str = Field(min_length=2, max_length=300)
    sector: OrgSectorLiteral
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=4000)
    category: str | None = None
    contact_email: str | None = Field(default=None, max_length=254)
    session_id: str | None = Field(default=None, max_length=100)

class PartnershipCreated(BaseModel):
    id: int
    status: Literal["PENDING_REVIEW"] = "PENDING_REVIEW"

class PartnershipPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: Literal["PUBLISHED", "REJECTED", "CLOSED"]

class PartnershipOffer(BaseModel):
    id: int
    intent: IntentLiteral
    organization: str
    sector: OrgSectorLiteral
    title: str
    description: str
    category: str | None
    category_label_pl: str | None
    status: OfferStatusLiteral
    created_at: datetime

class PartnerMatch(BaseModel):
    offer: PartnershipOffer
    similarity: float
    cross_sector: bool

class DemandGmina(BaseModel):
    gmina: str
    count: int

class Demand(BaseModel):
    similar_reports: int
    gminy: list[DemandGmina]

class PartnerMatches(BaseModel):
    offers: list[PartnerMatch]
    solutions: list[SolutionCard]
    demand: Demand
```

### Endpointy (PK07, PK08)

| Endpoint | Odpowiedź / błędy |
|---|---|
| `POST /api/threads` | 201 `ThreadDetail`; 200 gdy `REPORT` i wątek zgłoszenia istniał (dopisana wiadomość); 404 brak `report_id`/`partnership_id`/`solution_id`; 422 `REPORT` bez `report_id`, `PARTNERSHIP` bez `partnership_id` albo ogłoszenie nie `PUBLISHED`, nieznana kategoria |
| `GET /api/threads` | `Page[ThreadListItem]`; filtry `status`, `kind`, `mentor_id`, `session_id`, `ids` (CSV ≤ 50), `limit` (50, ≤200), `offset` |
| `GET /api/threads/{id}` | `ThreadDetail`; 404 |
| `POST /api/threads/{id}/messages` | 201 `TimelineMessage`; 404; 409 `THREAD_CLOSED`, `MENTOR_NOT_ASSIGNED`; 422 karty spoza `PUBLISHED`/`SOLUTION`, za dużo kart, `MENTOR` bez `mentor_id`, `solution_ids` od `USER` |
| `PATCH /api/threads/{id}` | `ThreadDetail`; 409 `INVALID_TRANSITION`; 422 nieaktywny/nieistniejący ekspert |
| `POST /api/threads/{id}/read` | 204 |
| `POST /api/threads/{id}/draft-reply` | `DraftReply`; 503 `LLM_UNAVAILABLE` |
| `GET /api/threads/{id}/mentor-suggestions` | `list[MentorSuggestion]` |
| `GET /api/comm/inbox` | `CommInbox` |
| `GET /api/mentors`, `GET /api/mentors/{id}` | `list[Mentor]` (filtr `category`, `active`=true), `Mentor`/404 |
| `GET /api/partnerships` | `Page[PartnershipOffer]`; filtry `intent`, `sector`, `category`, `status` (domyślnie `PUBLISHED`), `limit`, `offset`; sort `created_at DESC, id DESC` |
| `POST /api/partnerships` | 201 `PartnershipCreated` |
| `GET /api/partnerships/{id}` | `PartnershipOffer`; 404 |
| `PATCH /api/partnerships/{id}` | `PartnershipOffer` |
| `GET /api/partnerships/{id}/matches` | `PartnerMatches` (ogłoszenie bez embeddingu → puste listy, `similar_reports = 0`) |

### Typy frontendu (`web/src/api/comm.ts`, PK20)

Lustro `api/comm/schemas.py` 1:1 (te same nazwy pól, `snake_case`), np.:

```ts
export type ThreadKind = "QUESTION" | "REPORT" | "MENTORING" | "PARTNERSHIP";
export type ThreadStatus = "ASSISTANT_PENDING" | "ANSWERED_BY_AI" | "WAITING_STAFF" | "WAITING_USER" | "CLOSED";
export type MessageRole = "USER" | "STAFF" | "MENTOR" | "ASSISTANT" | "SYSTEM";
export type OrgSector = "NGO" | "JST" | "PUBLIC" | "BUSINESS" | "SCIENCE" | "RESIDENTS";
export type Intent = "OFFER" | "SEEK";
export type OfferStatus = "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "CLOSED";
// interfejsy: ThreadCreate, MessageCreate, ThreadPatch, MentorRef, Mentor, MentorSuggestion, TimelineMessage,
// ThreadListItem, ThreadDetail, DraftReply, CommInbox, PartnershipCreate, PartnershipCreated, PartnershipOffer,
// PartnerMatch, Demand, PartnerMatches

export const commApi = {
  createThread: (b: ThreadCreate) => request<ThreadDetail>("POST", "/api/threads", { body: b }),
  listThreads: (q: Query) => request<Page<ThreadListItem>>("GET", "/api/threads", { query: q }),
  getThread: (id: number) => request<ThreadDetail>("GET", `/api/threads/${id}`),
  addMessage: (id: number, b: MessageCreate) => request<TimelineMessage>("POST", `/api/threads/${id}/messages`, { body: b }),
  patchThread: (id: number, b: ThreadPatch) => request<ThreadDetail>("PATCH", `/api/threads/${id}`, { body: b }),
  markRead: (id: number, side: "user" | "staff" | "mentor") => request<void>("POST", `/api/threads/${id}/read`, { body: { side } }),
  draftReply: (id: number) => request<DraftReply>("POST", `/api/threads/${id}/draft-reply`),
  mentorSuggestions: (id: number) => request<MentorSuggestion[]>("GET", `/api/threads/${id}/mentor-suggestions`),
  inbox: () => request<CommInbox>("GET", "/api/comm/inbox"),
  mentors: (q?: Query) => request<Mentor[]>("GET", "/api/mentors", { query: q }),
  listOffers: (q: Query) => request<Page<PartnershipOffer>>("GET", "/api/partnerships", { query: q }),
  createOffer: (b: PartnershipCreate) => request<PartnershipCreated>("POST", "/api/partnerships", { body: b }),
  getOffer: (id: number) => request<PartnershipOffer>("GET", `/api/partnerships/${id}`),
  patchOffer: (id: number, status: "PUBLISHED" | "REJECTED" | "CLOSED") => request<PartnershipOffer>("PATCH", `/api/partnerships/${id}`, { body: { status } }),
  offerMatches: (id: number) => request<PartnerMatches>("GET", `/api/partnerships/${id}/matches`),
};
```

(`request` zwraca `undefined` dla 204 — `markRead` działa bez zmian w `client.ts`.)

### Stałe i etykiety frontendu (`web/src/lib/comm.ts`, PK20)

- `THREAD_POLL_MS = 5_000`, `ASSISTANT_POLL_MS = 2_000`, `COMM_INBOX_POLL_MS = 30_000`, `MESSAGE_MAX_CHARS = 4000`.
- `THREAD_KIND_LABELS`: QUESTION „Pytanie”, REPORT „Rozmowa o zgłoszeniu”, MENTORING „Konsultacja z ekspertem”, PARTNERSHIP „Propozycja partnerstwa”.
- `THREAD_STATUS_LABELS` (dla autora / dla Hubu): ASSISTANT_PENDING „Asystent szuka odpowiedzi”, ANSWERED_BY_AI „Odpowiedź automatyczna”, WAITING_STAFF „Czeka na zespół Hubu”, WAITING_USER „Hub odpowiedział” / „Czeka na autora”, CLOSED „Zamknięta”.
- `ROLE_LABELS`: USER „Ty” (autor) / „Autor” (panel, ekspert), STAFF „Zespół Hubu”, MENTOR „Ekspert: {display_name}”, ASSISTANT „Odpowiedź automatyczna (AI)”, SYSTEM „Informacja systemowa”.
- `SECTOR_LABELS`: NGO „Organizacja pozarządowa”, JST „Samorząd”, PUBLIC „Instytucja publiczna”, BUSINESS „Firma”, SCIENCE „Uczelnia / nauka”, RESIDENTS „Grupa mieszkańców”. `INTENT_LABELS`: OFFER „Oferujemy”, SEEK „Szukamy”.

### Pamięć przeglądarki (`web/src/lib/commStorage.ts`, PK20)

Wzór: `web/src/lib/storage.ts`. Klucz `splot_threads`, maks. 20 wpisów `{thread_id, kind, created_at, excerpt (≤80 znaków)}`; `listMyThreads()`, `addMyThread()`, `removeMyThread()`. Każdy dostęp w `try/catch`. Treść pełna nigdy nie trafia do pamięci.

---

## Zadania

## PK00 — Schemat M5 i modele

**Zależy od:** —
**Pliki:** `db/init.sql` (dopisanie na końcu), `api/comm/__init__.py` (nowy, pusty), `api/comm/models.py` (nowy)

**Cel:** tabele `mentors`, `partnership_offers`, `threads`, `thread_messages` i ich modele SQLAlchemy.

**Kontekst ze specyfikacji (DDL — dopisz dokładnie):**

```sql
-- ===== Moduł 5 — Platforma aktywnej komunikacji (docs/modules/05-platforma-komunikacji) =====
CREATE TYPE thread_kind        AS ENUM ('QUESTION', 'REPORT', 'MENTORING', 'PARTNERSHIP');
CREATE TYPE thread_status      AS ENUM ('ASSISTANT_PENDING', 'ANSWERED_BY_AI', 'WAITING_STAFF', 'WAITING_USER', 'CLOSED');
CREATE TYPE message_role       AS ENUM ('USER', 'STAFF', 'MENTOR', 'ASSISTANT', 'SYSTEM');
CREATE TYPE org_sector         AS ENUM ('NGO', 'JST', 'PUBLIC', 'BUSINESS', 'SCIENCE', 'RESIDENTS');
CREATE TYPE partnership_intent AS ENUM ('OFFER', 'SEEK');
CREATE TYPE offer_status       AS ENUM ('PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'CLOSED');

CREATE TABLE mentors (
    id           BIGSERIAL PRIMARY KEY,
    seed_key     TEXT UNIQUE,
    display_name TEXT        NOT NULL,
    organization TEXT,
    sector       org_sector,
    expertise    TEXT        NOT NULL,
    bio          TEXT        NOT NULL DEFAULT '',
    categories   TEXT[]      NOT NULL DEFAULT '{}',
    active       BOOLEAN     NOT NULL DEFAULT true,
    embedding    vector(1024),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE partnership_offers (
    id            BIGSERIAL PRIMARY KEY,
    seed_key      TEXT UNIQUE,
    intent        partnership_intent NOT NULL,
    organization  TEXT         NOT NULL,
    sector        org_sector   NOT NULL,
    title         TEXT         NOT NULL,
    description   TEXT         NOT NULL,
    category      TEXT         REFERENCES challenge_taxonomy(code),
    contact_email TEXT,                    -- nigdy nie wychodzi z API ani do logów
    session_id    TEXT,
    status        offer_status NOT NULL DEFAULT 'PENDING_REVIEW',
    embedding     vector(1024),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX partnership_offers_status_idx ON partnership_offers (status, created_at DESC);

CREATE TABLE threads (
    id                  BIGSERIAL PRIMARY KEY,
    seed_key            TEXT UNIQUE,
    kind                thread_kind   NOT NULL,
    status              thread_status NOT NULL,
    subject             TEXT          NOT NULL,
    category            TEXT          REFERENCES challenge_taxonomy(code),
    reporter_type       reporter_type NOT NULL DEFAULT 'OTHER',
    author_label        TEXT,
    contact_email       TEXT,              -- nigdy nie wychodzi z API ani do logów
    session_id          TEXT,
    report_id           BIGINT REFERENCES reports(id) ON DELETE SET NULL,
    solution_id         BIGINT REFERENCES solutions(id) ON DELETE SET NULL,
    partnership_id      BIGINT REFERENCES partnership_offers(id) ON DELETE SET NULL,
    from_partnership_id BIGINT REFERENCES partnership_offers(id) ON DELETE SET NULL,
    assigned_mentor_id  BIGINT REFERENCES mentors(id) ON DELETE SET NULL,
    embedding           vector(1024),
    last_message_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    waiting_since       TIMESTAMPTZ,
    user_last_read_at   TIMESTAMPTZ,
    staff_last_read_at  TIMESTAMPTZ,
    mentor_last_read_at TIMESTAMPTZ,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX threads_report_uq ON threads (report_id) WHERE report_id IS NOT NULL AND kind = 'REPORT';
CREATE INDEX threads_status_idx ON threads (status, last_message_at DESC);
CREATE INDEX threads_mentor_idx ON threads (assigned_mentor_id, last_message_at DESC);

CREATE TABLE thread_messages (
    id           BIGSERIAL PRIMARY KEY,
    thread_id    BIGINT       NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    role         message_role NOT NULL,
    author_label TEXT,
    mentor_id    BIGINT       REFERENCES mentors(id) ON DELETE SET NULL,
    body         TEXT         NOT NULL,
    solution_ids BIGINT[]     NOT NULL DEFAULT '{}',
    meta         JSONB        NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX thread_messages_thread_idx ON thread_messages (thread_id, created_at);
```

**Kroki:**
1. Dopisz DDL na końcu `db/init.sql` (po seedzie taksonomii — FK wymaga istniejących tabel M1).
2. `api/comm/models.py`: enumy `StrEnum` (`ThreadKind`, `ThreadStatus`, `MessageRole`, `OrgSector`, `PartnershipIntent`, `OfferStatus`), modele `Mentor`, `PartnershipOffer`, `Thread`, `ThreadMessage` na `api.models.Base`; `Vector(EMBEDDING_DIM)` i `ENUM(..., create_type=False)` jak w `api/models.py`; `ARRAY(BigInteger)` dla `solution_ids`, `ARRAY(Text)` dla `categories`. Relacja `Thread.messages` (`order_by=created_at`, `cascade="all, delete-orphan"`, `passive_deletes=True`).
3. Wpis w „Uwagach między zadaniami” `module-1-tasks.md`: „[PK00] dopisano sekcję Modułu 5 na końcu `db/init.sql` (ADR-M5-010)”.

**Gotowe, gdy:** `make reset-db` przechodzi; `make psql` → `\dt` pokazuje 4 nowe tabele; `\d threads` pokazuje częściowy indeks unikalny; `python -c "from api.comm.models import Thread, ThreadMessage, Mentor, PartnershipOffer; print('ok')"`; `make ingest` i czat M1 działają jak wcześniej.

---

## PK01 — Ustawienia, rejestracja routerów, maskowanie logów

**Zależy od:** PK00
**Pliki:** `api/config.py` (dopisanie bloku), `api/main.py` (dopisanie routerów), `api/log.py` (dopisanie kluczy), `api/routers/threads.py` (nowy, stub), `api/routers/mentors.py` (nowy, stub), `api/routers/partnerships.py` (nowy, stub)

**Cel:** M5 jest wpięty w aplikację; kolejne zadania wypełniają tylko swoje pliki.

**Kontekst:** blok ustawień (dokładnie te nazwy i wartości domyślne):

```python
    # --- Moduł 5: Platforma komunikacji ---
    ASSISTANT_ENABLED: bool = True
    ASSISTANT_TIMEOUT_SECONDS: float = 30.0
    DRAFT_REPLY_ENABLED: bool = True
    MENTOR_SUGGEST_N: int = 3
    MENTOR_MIN_COSINE: float = 0.30
    PARTNER_MATCH_N: int = 5
    PARTNER_MIN_COSINE: float = 0.45
    PARTNER_SOLUTIONS_N: int = 3
    PARTNER_GMINY_N: int = 5
    THREAD_SLA_HOURS: int = 48
    THREAD_MESSAGE_CARDS_MAX: int = 5
    COMM_INBOX_LATEST_N: int = 10
```

**Kroki:**
1. Blok przed sekcją `# --- HTTP ---` w `api/config.py`; dopisz zmienne do `.env.example`? — **nie** (plik M1; wartości domyślne wystarczą; wpis w „Uwagach” M1, jeśli zespół chce).
2. Stuby routerów: `router = APIRouter(prefix="/api", tags=["threads"|"mentors"|"partnerships"])` bez endpointów.
3. `api/main.py`: import i dodanie trzech routerów do krotki `include_router` (przed `meta.router`).
4. `api/log.py`: `REDACTED_KEYS` += `"body", "subject", "description", "author_label"`.
5. Wpis w „Uwagach” `module-1-tasks.md` (ADR-M5-010).

**Gotowe, gdy:** `make dev` startuje; `curl localhost:8000/openapi.json | grep -c threads` ≥ 1 (tag); `python -c "from api.config import settings; print(settings.THREAD_SLA_HOURS)"` → 48; `python -c "import logging; from api.log import setup_logging; setup_logging(); logging.getLogger('x').info('t', extra={'body': 'tajne'})"` wypisuje `***`, nie `tajne`.

---

## PK02 — Kontrakty API

**Zależy od:** PK00
**Pliki:** `api/comm/schemas.py` (nowy)

**Cel:** modele pydantic M5 dokładnie jak w „Wspólnych kontraktach → Kontrakty API”.

**Kroki:**
1. Przepisz kontrakty; walidator „nie same białe znaki” dla `body`, `subject`, `title`, `description`, `organization` (komunikaty po polsku, jak `ReplyCreate`).
2. `subject` w `ThreadCreate` przycinany `strip()`; puste po przycięciu → `None`.
3. Żaden model odpowiedzi nie ma pól `contact_email`, `embedding`, `session_id`.

**Gotowe, gdy:** `python -c "from api.comm.schemas import *; ThreadCreate(kind='QUESTION', body='x'); print('ok')"`; `ThreadCreate(kind='QUESTION', body='   ')` → `ValidationError`; `python -c "from api.comm.schemas import ThreadDetail; print('contact_email' in ThreadDetail.model_fields)"` → `False`.

---

## PK03 — Dane demo

**Zależy od:** —
**Pliki:** `data/mentors.json`, `data/partnerships-seed.json`, `data/threads-seed.json` (nowe)

**Cel:** fikcyjne dane do scenariuszy A–C. **Żadnych prawdziwych osób ani danych kontaktowych** (`base.md` §9) — imiona i nazwiska wymyślone, organizacje z dopiskiem typu „(przykład)” albo jednoznacznie fikcyjne.

**Kontekst (formaty):**

```jsonc
// data/mentors.json — 8 ekspertów, każdy kod taksonomii (poza OTHER) pokryty co najmniej raz
[{"seed_key": "mentor-gerontologia", "display_name": "dr Anna Przykładowa", "organization": "Uczelnia (przykład)",
  "sector": "SCIENCE", "expertise": "Usługi dla seniorów, teleopieka, aktywizacja osób starszych.",
  "bio": "…2–3 zdania…", "categories": ["AGING", "LONELINESS"], "active": true}]

// data/partnerships-seed.json — 10 ogłoszeń: ≥4 OFFER, ≥4 SEEK, wszystkie sektory, status PUBLISHED (2 PENDING_REVIEW do moderacji)
[{"seed_key": "offer-teleopieka-ngo", "intent": "SEEK", "organization": "Fundacja Pomocna Dłoń (przykład)",
  "sector": "NGO", "title": "Szukamy gminy do pilotażu teleopieki", "description": "…",
  "category": "AGING", "status": "PUBLISHED"}]

// data/threads-seed.json — 5 wątków z wiadomościami (bez wywołań AI w seedzie)
[{"seed_key": "thread-dowoz-seniorow", "kind": "QUESTION", "status": "WAITING_STAFF",
  "subject": "Dowóz seniorów do lekarza", "reporter_type": "JST", "author_label": "GOPS (przykład)",
  "hours_ago": 52,                          // created_at/waiting_since = now() - 52 h (pokazuje SLA)
  "assigned_mentor_seed_key": null, "partnership_seed_key": null, "link_report": false,
  "messages": [{"role": "USER", "body": "…", "minutes_after": 0},
               {"role": "ASSISTANT", "body": "… [1]", "solution_titles": ["…"], "minutes_after": 1}]}]
```

**Wymagane wątki:** (1) `QUESTION` w `WAITING_STAFF` ponad SLA; (2) `QUESTION` w `ANSWERED_BY_AI`; (3) `MENTORING` z przydzielonym ekspertem i wiadomością `MENTOR`, status `WAITING_USER`; (4) `PARTNERSHIP` do jednego z ogłoszeń; (5) `REPORT` z `link_report: true` (seed wiąże z najstarszym zgłoszeniem w bazie). `solution_titles` muszą istnieć w `data/solutions/rops-biblioteka.json` (sprawdź `jq`).

**Gotowe, gdy:** `python -c "import json; [json.load(open(f'data/{f}', encoding='utf-8')) for f in ['mentors.json','partnerships-seed.json','threads-seed.json']]; print('ok')"`; każdy `categories`/`category` jest kodem z `data/taxonomy.json`; każdy `solution_titles` istnieje w korpusie.

---

## PK04 — Serwis wątków

**Zależy od:** PK01, PK02
**Pliki:** `api/comm/threads.py` (nowy)

**Cel:** cała logika wątków poza AI i dopasowaniami: tworzenie, wiadomości, automat stanów, oś czasu, nieprzeczytane, skrzynka, `notify`, zadanie `after_create`.

**Kontekst:** sygnatury z „Wspólnych kontraktów”; automat stanów z tabeli; oś czasu `REPORT` = `report_replies` (jako `role="STAFF"`, `source="report_reply"`, `id="r-<id>"`, `author_label` z odpowiedzi) + `thread_messages` (`id="m-<id>"`), rosnąco `created_at`, remis po `id`.

**Kroki:**
1. `create_thread`:
   - walidacja rodzaju: `REPORT` → `report_id` wymagany i istniejący (422/404); istniejący wątek `REPORT` dla zgłoszenia → `add_message(role=USER)` i zwróć `(id, False)`. `PARTNERSHIP` → ogłoszenie istnieje (404) i `PUBLISHED` (422 `OFFER_NOT_PUBLISHED`). `solution_id` → istnieje (404). `category` → istnieje w `challenge_taxonomy` (422).
   - `category` = podana albo `preprocess(body, None).category`; `subject` = podany albo `body.strip()[:80]`.
   - status początkowy wg automatu; wiadomość `USER` z `author_label`; `waiting_since` gdy `WAITING_STAFF`.
   - commit, potem `spawn(after_create(thread_id))`; log `thread created` (`thread_id`, `kind`, `body_len`).
2. `add_message`: zasady z endpointu (`MENTOR` tylko przydzielony ekspert, `solution_ids` tylko `STAFF`/`MENTOR`, ≤ `THREAD_MESSAGE_CARDS_MAX`, każde id `PUBLISHED` + `SOLUTION`), zmiana statusu, `last_message_at`; `SELECT … FOR UPDATE` na wątku (jak `create_reply` w M1). Zwraca `TimelineMessage` z kartami. `notify("message_created", …, role=…)`.
3. `add_system_message`, `set_status` (z utrzymaniem `waiting_since`), `patch_thread` (przejścia z tabeli, przydział eksperta → wiadomość `SYSTEM` „Do rozmowy dołączył(a) ekspert: {display_name}.”, `notify("mentor_assigned")`).
4. `load_cards(session, ids)`: `load_solutions` + filtr `status == PUBLISHED and kind == SOLUTION`, kolejność wejścia, `to_card(row, rank=i)`.
5. `load_thread_detail`, `list_threads`: jawne kolumny, `category_label_pl` z `challenge_taxonomy`, `assigned_mentor` jako `MentorRef`, `message_count`, `last_message_role`, `waiting_hours`, `over_sla`, flagi `unread_*` (podzapytania `EXISTS`). Filtr `ids` (CSV → `list[int]`, ≤ 50, inaczej 422).
6. `mark_read`, `load_comm_inbox` (liczniki + `latest_waiting` sort `waiting_since ASC`).
7. `notify(event, thread_id, **fields)`: `log.info("comm event", extra={"event": event, "thread_id": thread_id, **fields})` — tylko identyfikatory i liczby.
8. `after_create(thread_id)`: własna sesja; `matching.embed_thread` (błąd → log warning, dalej); gdy status `ASSISTANT_PENDING` → `assistant.run_assistant(thread_id)`; `notify("thread_created")`. Importy `assistant`/`matching` leniwe.

**Gotowe, gdy:** (przez `python -c` z `asyncio.run` albo po PK07 przez curl) utworzenie `MENTORING` → status `WAITING_STAFF`, `waiting_since` ustawione; wiadomość `STAFF` → `WAITING_USER`, `waiting_since` NULL; wiadomość `USER` w `CLOSED` → `WAITING_STAFF`; oś czasu wątku `REPORT` zawiera wcześniejszą odpowiedź z `report_replies`; `grep -n "body\b" ` w wywołaniach `log.` w pliku → tylko `body_len`.

---

## PK05 — Asystent pierwszego kontaktu i szkic odpowiedzi

**Zależy od:** PK04
**Pliki:** `api/comm/assistant.py` (nowy)

**Cel:** automatyczna odpowiedź AI na `QUESTION` oraz szkic odpowiedzi dla pracownika; oba działają bez LLM i bez rerankera.

**Kontekst ze specyfikacji:**
- `run_assistant(thread_id)`: `q = preprocess(first_user_body, None)` → `result = await run_search(q)`. Bramka nie przeszła (`result.gate.passed is False`) albo `result.solutions == []` → wiadomość `SYSTEM` „Nie mam gotowej odpowiedzi w Bibliotece Innowacji. Pytanie trafiło do zespołu Hubu — odpowiemy w tym wątku.” i `WAITING_STAFF`.
- W przeciwnym razie karty = `result.solutions` (tylko `SOLUTION`, ≤ `ANSWER_TOP_N`, **nigdy** `result.context`). Gdy `settings.LLM_ENABLED`: zbierz `generate(q.normalized, cards, result.best_chunks, q.too_vague, llm)` przez `CitationFilter(len(cards))` (`feed` dla każdego fragmentu, na końcu `flush()`) z `asyncio.timeout(settings.ASSISTANT_TIMEOUT_SECONDS)`. `filter.should_retract` → odrzuć tekst.
- Brak LLM / `ProviderError` / timeout / odrzucenie → treść „Te rozwiązania z Biblioteki Innowacji mogą pomóc:”, `meta.fallback` = `"no_llm" | "error" | "retracted"`.
- Wiadomość `ASSISTANT`, `solution_ids` w kolejności kart (`[n]` = pozycja n), `meta.gate = {"source", "score", "threshold"}`; status `ANSWERED_BY_AI`.
- Każdy wyjątek → `WAITING_STAFF` + `SYSTEM`; w `finally` upewnij się, że wątek nie został w `ASSISTANT_PENDING`.
- `draft_reply(session, thread_id)`: `LLM_ENABLED and DRAFT_REPLY_ENABLED` albo 503 `LLM_UNAVAILABLE`. Zapytanie = ostatnia wiadomość `USER` (fallback `subject`). `run_search` → karty (mogą być puste) → LLM z `DRAFT_SYSTEM`; wynik przez `CitationFilter`; `ProviderError` → 503. Nic nie zapisuje.
- `DRAFT_SYSTEM` (dokładnie):

```text
Piszesz szkic odpowiedzi pracownika Małopolskiego Hubu Innowacji Społecznych do mieszkańca,
organizacji lub gminy. Szkic przeczyta i poprawi człowiek przed wysłaniem.

Zasady:
1. Opieraj się wyłącznie na rozwiązaniach z kontekstu; każde twierdzenie o nich opatrz [n].
2. Nie dodawaj faktów, nazw, liczb ani terminów spoza kontekstu.
3. Nie obiecuj finansowania, terminów ani decyzji urzędu.
4. Maksymalnie 6 zdań, prosty, uprzejmy język, zwracaj się per „Pan/Pani” albo bezosobowo.
5. Jeśli kontekst nie pasuje do pytania, napisz krótko, że Hub poszuka odpowiedzi,
   i zadaj jedno pytanie doprecyzowujące.
```

- Użytkownik w prompcie: blok danych „Rozmowa (ostatnie wiadomości):” (≤ 6 ostatnich wiadomości USER/STAFF/MENTOR, każda przycięta do `ANSWER_FRAGMENT_CHARS`) + „Rozwiązania z bazy:” (`build_context(cards, best_chunks)` z M1).

**Gotowe, gdy:** z `LLM_ENABLED=false`: nowe pytanie „starsi ludzie są samotni i nie mają z kim porozmawiać” → po kilku sekundach `ANSWERED_BY_AI`, wiadomość `ASSISTANT` z kartami i `meta.fallback="no_llm"`; pytanie „asdf qwer” → `WAITING_STAFF` + `SYSTEM`; z kluczem Anthropic: tekst z `[1]`; `draft-reply` przy `LLM_ENABLED=false` → 503; żadna wiadomość nie zawiera karty `KNOWLEDGE` (`psql`: `SELECT … FROM thread_messages m JOIN solutions s ON s.id = ANY(m.solution_ids) WHERE s.kind='KNOWLEDGE'` → 0 wierszy).

---

## PK06 — Dopasowania: eksperci i partnerzy

**Zależy od:** PK01, PK02
**Pliki:** `api/comm/matching.py` (nowy)

**Cel:** embeddingi encji M5, podpowiedź ekspertów, dopasowanie ogłoszeń partnerstw.

**Kontekst ze specyfikacji:**
- Teksty: `thread_embedding_text = subject + "\n" + body`; `mentor_embedding_text = expertise + "\n" + bio + "\nObszary: " + ", ".join(labels)`; `offer_embedding_text = title + "\n" + description`.
- Wątek → `embed_query`; ekspert i ogłoszenie → `embed_passages([text])[0]`. Zapis przez `to_pgvector`. `ProviderError` → `False`, embedding zostaje `NULL`.
- `suggest_mentors`: aktywni eksperci; `category_match = thread.category = ANY(categories)`; `similarity = 1 - (m.embedding <=> t.embedding)` gdy oba niepuste, inaczej `NULL`; filtr `category_match OR similarity >= MENTOR_MIN_COSINE`; sort `category_match DESC, similarity DESC NULLS LAST, id ASC`; limit `MENTOR_SUGGEST_N`. **Nie sumuj** kategorii z cosinusem.
- `match_partners`: ogłoszenie nie istnieje → `ApiError(404)`. Bez embeddingu → puste `PartnerMatches`. Ogłoszenia: `PUBLISHED`, inne `id`, przeciwny `intent`, `similarity >= PARTNER_MIN_COSINE`, sort `similarity DESC, id ASC`, limit `PARTNER_MATCH_N`, `cross_sector = sector != offer.sector`. Rozwiązania: `semantic_search(session, vec, kind="SOLUTION", limit=PARTNER_SOLUTIONS_N)`, filtr `cosine_similarity >= MIN_COSINE_SCORE`, karty przez `threads.load_cards`. Zapotrzebowanie: `SELECT count(*)` i `GROUP BY gmina` z `reports` gdzie `embedding IS NOT NULL AND 1 - (embedding <=> :vec) >= SIMILAR_REPORT_THRESHOLD`; `gminy` tylko niepuste, sort `count DESC, gmina`, limit `PARTNER_GMINY_N`. Bez treści zgłoszeń.
- Wektor w SQL: `CAST(:vec AS vector)` z `to_pgvector(...)`, jak w `api/pipeline/semantic.py`.

**Gotowe, gdy:** po PK09: `python -c "…suggest_mentors(s, <id wątku o seniorach>)"` zwraca eksperta od `AGING` jako pierwszego; `match_partners` dla ogłoszenia SEEK teleopieki zwraca ≥ 1 OFFER z `cross_sector=True`, ≥ 1 kartę rozwiązania i `similar_reports ≥ 0`; z `EMBEDDING_PROVIDER=hash` brak wyjątków.

---

## PK07 — Router wątków

**Zależy od:** PK04, PK05, PK06
**Pliki:** `api/routers/threads.py`

**Cel:** endpointy `/api/threads…` i `/api/comm/inbox` z tabeli „Endpointy”.

**Kroki:**
1. Cienkie handlery nad serwisem (`threads.py`, `assistant.draft_reply`, `matching.suggest_mentors`); `SessionDep` jak w `api/routers/reports.py`.
2. `POST /api/threads` → 201 albo 200 (gdy `created=False`) — ustaw `response.status_code`.
3. `POST …/read` → `Response(status_code=204)`.
4. Kody błędów i `code` dokładnie jak w tabeli; komunikaty po polsku.

**Gotowe, gdy:**
```bash
curl -s -XPOST localhost:8000/api/threads -H 'Content-Type: application/json' \
  -d '{"kind":"QUESTION","body":"Jak zorganizować dowóz seniorów do lekarza w gminie wiejskiej?"}'   # 201, status ASSISTANT_PENDING
sleep 5; curl -s localhost:8000/api/threads/<id>          # ANSWERED_BY_AI albo WAITING_STAFF, wiadomość ASSISTANT/SYSTEM
curl -s -XPATCH localhost:8000/api/threads/<id> -H 'Content-Type: application/json' -d '{"status":"WAITING_STAFF"}'  # eskalacja
curl -s -XPOST localhost:8000/api/threads/<id>/messages -H 'Content-Type: application/json' -d '{"role":"STAFF","body":"Dzień dobry…","solution_ids":[<id>]}'  # 201, karta w odpowiedzi
curl -s localhost:8000/api/comm/inbox                      # liczniki
curl -s -XPOST …/messages -d '{"role":"MENTOR","body":"x","mentor_id":1}'   # 409 MENTOR_NOT_ASSIGNED
```
`curl … | grep -c contact_email` = 0 na każdym endpoincie; w logach `make logs-dev` brak treści pytania.

---

## PK08 — Routery ekspertów i partnerstw

**Zależy od:** PK06
**Pliki:** `api/routers/mentors.py`, `api/routers/partnerships.py`

**Cel:** `/api/mentors…` i `/api/partnerships…` z tabeli „Endpointy”.

**Kroki:**
1. `GET /api/mentors` (filtr `category` = `ANY(categories)`, `active` domyślnie `true`), `GET /api/mentors/{id}`.
2. `POST /api/partnerships`: zapis `PENDING_REVIEW`, commit, `spawn` z własną sesją → `matching.embed_offer`; log `offer created` (`offer_id`, `intent`, `sector`, `description_len`).
3. `GET` lista/szczegół, `PATCH` (dowolne przejście między `PUBLISHED`/`REJECTED`/`CLOSED`, ustawia `updated_at`), `GET …/matches` → `matching.match_partners`.
4. Kategoria nieznana → 422; jawne kolumny bez `contact_email`.

**Gotowe, gdy:** `POST` → 201 `PENDING_REVIEW`; `GET /api/partnerships` go nie pokazuje; `PATCH {status: PUBLISHED}` → pokazuje; po kilku sekundach `GET …/matches` zwraca dopasowania; `grep -c contact_email` = 0.

---

## PK09 — Seed M5

**Zależy od:** PK03, PK04, PK06
**Pliki:** `scripts/seed_comm.py` (nowy), `Makefile` (cel `seed-comm`)

**Cel:** idempotentny seed ekspertów, ogłoszeń i wątków demo (`python -m scripts.seed_comm`).

**Kroki:**
1. Upsert po `seed_key` (`INSERT … ON CONFLICT (seed_key) DO UPDATE`) dla ekspertów i ogłoszeń; embeddingi przez `matching.embed_mentor` / `embed_offer`.
2. Wątki: gdy `seed_key` istnieje — pomiń (nie duplikuj wiadomości). `created_at`, `waiting_since`, `last_message_at` i czasy wiadomości z `hours_ago`/`minutes_after`. `solution_titles` → `solution_id` po tytule (brak → błąd z nazwą). `link_report: true` → najstarszy `reports.id` (brak zgłoszeń → pomiń wątek z ostrzeżeniem). Embedding wątku przez `matching.embed_thread`. **Bez wywołań LLM.**
3. `Makefile`: `seed-comm:` → `python -m scripts.seed_comm` (wzór `ingest`); wpis w „Uwagach” M1.
4. Na końcu wypisz podsumowanie: liczby rekordów (bez treści).

**Gotowe, gdy:** `make seed-comm` dwa razy z rzędu daje te same liczby (`SELECT count(*)` w 4 tabelach się nie zmienia); `GET /api/comm/inbox` → `over_sla ≥ 1`, `pending_offers = 2`.

---

## PK10 — Kalibracja progów i próba generalna backendu

**Zależy od:** PK07, PK08, PK09
**Pliki:** `docs/modules/05-platforma-komunikacji/module-5-calibration.md` (nowy)

**Cel:** wartości `MENTOR_MIN_COSINE` i `PARTNER_MIN_COSINE` sensowne dla `hash` i `openai`; scenariusze A–C przechodzą curl-em.

**Kroki:**
1. Dla 6 pytań testowych (po jednym na kategorię) zapisz top-3 ekspertów i `similarity`; dla każdego ogłoszenia — liczbę dopasowań i rozkład `similarity`. Wzór tabel: `docs/modules/01-matchmaking/module-1-calibration.md`.
2. Zaproponuj progi (zmiana wartości domyślnych w `api/config.py` → wpis w „Uwagach” do właściciela PK01, nie edycja).
3. Przejdź curl-em scenariusze A, B, C ze specyfikacji (sekcja 4) i zapisz polecenia w pliku kalibracji jako „ścieżka demo backendu”.

**Gotowe, gdy:** plik kalibracji zawiera tabele dla co najmniej trybu `hash` (dla `openai`, jeśli jest klucz), propozycję progów i 3 przeprowadzone scenariusze z wynikami.

---

## PK20 — Frontend: kontrakty, stałe, pamięć, rola `mentor`

**Zależy od:** PK02
**Pliki:** `web/src/api/comm.ts` (nowy), `web/src/lib/comm.ts` (nowy), `web/src/lib/commStorage.ts` (nowy), `web/src/lib/auth.tsx` (zmiana), `web/src/lib/modules.ts` (zmiana)

**Cel:** wszystko, czego potrzebują ekrany M5, bez UI.

**Kroki:**
1. `comm.ts` (api): typy i `commApi` jak w „Typy frontendu”.
2. `lib/comm.ts`: stałe i etykiety jak w „Stałe i etykiety frontendu”; helper `roleLabel(msg, viewer: "author" | "staff" | "mentor")`.
3. `commStorage.ts` jak w „Pamięć przeglądarki”.
4. `auth.tsx`: `Role = "administrator" | "reporter" | "mentor"`; `AuthSession.mentorId?: number`; konto `{ username: "ekspert", password: "ekspert123", role: "mentor", displayName: "Ekspert demo", mentorId: 1 }`; `ROLE_LABELS.mentor = "Ekspert"`; `roleHome("mentor") = "/ekspert"`; `isRole`/`readSession` akceptują `mentor` i `mentorId`.
5. `modules.ts`: `komunikacja: "Platforma komunikacji"`.
6. Wpis w „Uwagach” `frontend-tasks.md` (ADR-M5-010).

**Gotowe, gdy:** `npm run lint && npm run build` czyste; logowanie `ekspert`/`ekspert123` przekierowuje na `/ekspert` (pusta strona 404 do PK21 jest OK); dotychczasowe konta działają.

---

## PK21 — Frontend: trasy i nawigacja

**Zależy od:** PK20
**Pliki:** `web/src/App.tsx`, `web/src/components/layout/MainNav.tsx`, `web/src/components/layout/PanelLayout.tsx` (zmiany), `web/src/pages/comm/*.tsx`, `web/src/pages/panel/CommThreadsPage.tsx`, `web/src/pages/panel/CommThreadPage.tsx`, `web/src/pages/panel/PartnershipsReviewPage.tsx`, `web/src/pages/expert/*.tsx` (nowe — **zaślepki** z `h1` i `ModuleLabel`)

**Cel:** szkielet tras M5, żeby PK23–PK28 pracowały równolegle w swoich plikach. Po `[x]` PK21 pliki zaślepek przechodzą na własność zadań PK23–PK28 (każde zastępuje swoje).

**Kontekst (mapa tras):**

| Trasa | Komponent (plik) | Dostęp |
|---|---|---|
| `/rozmowy` | `CommHomePage` (`pages/comm/CommHomePage.tsx`) | publiczny |
| `/rozmowy/nowa` | `NewThreadPage` (`pages/comm/NewThreadPage.tsx`) | `reporter` |
| `/rozmowy/:id` | `ThreadPage` (`pages/comm/ThreadPage.tsx`) | publiczny |
| `/partnerzy` | `PartnersPage` (`pages/comm/PartnersPage.tsx`) | publiczny |
| `/partnerzy/nowe` | `NewOfferPage` (`pages/comm/NewOfferPage.tsx`) | `reporter` |
| `/partnerzy/:id` | `OfferPage` (`pages/comm/OfferPage.tsx`) | publiczny |
| `/panel/rozmowy`, `/panel/rozmowy/:id` | `CommThreadsPage`, `CommThreadPage` | `administrator` |
| `/panel/partnerstwa` | `PartnershipsReviewPage` | `administrator` |
| `/ekspert`, `/ekspert/rozmowy/:id` | `ExpertHomePage`, `ExpertThreadPage` (`pages/expert/`) w `AppShell` | `mentor` |

**Kroki:**
1. Trasy w `App.tsx` (`RequireRole` dla chronionych; `mentor` jako nowa gałąź).
2. `MainNav`: pozycja `MODULE_NAMES.komunikacja` → `/rozmowy`, aktywna także na `/partnerzy…` (wzór `inZasobnik`). Dla roli `mentor` dodatkowo „Moje konsultacje” → `/ekspert`.
3. `PanelLayout`: „Rozmowy” (licznik dopina PK26) i „Partnerstwa” przed „Trendy”.
4. Wpis w „Uwagach” `frontend-tasks.md`.

**Gotowe, gdy:** każda trasa renderuje zaślepkę z właściwym `h1`; ochrona ról działa (niezalogowany na `/rozmowy/nowa` → `/login`); nawigacja ma `aria-current` na aktywnej pozycji; build czysty.

---

## PK22 — Frontend: komponenty rozmowy i hooki

**Zależy od:** PK20
**Pliki:** `web/src/components/comm/Timeline.tsx`, `web/src/components/comm/MessageComposer.tsx`, `web/src/components/comm/ThreadStatusBadge.tsx`, `web/src/components/comm/ThreadList.tsx`, `web/src/hooks/useThread.ts`, `web/src/hooks/useCommInbox.ts`, `web/src/styles/comm.css` (nowe)

**Cel:** wspólne klocki widoku wątku dla autora, panelu i eksperta.

**Kroki:**
1. `Timeline({messages, viewer})`: `<ol aria-label="Wiadomości">`; każda wiadomość = `<li>` z nagłówkiem (rola słownie z `roleLabel`, `author_label` jako dopisek „podpis niezweryfikowany” dla `USER`, data `formatDateTime`), treść z zachowaniem akapitów (bez HTML z danych), karty `SolutionCard` pod wiadomością. Wiadomość AI: ramka z etykietą „Odpowiedź automatyczna (AI)” i zdaniem „Może zawierać błędy — sprawdź w karcie rozwiązania.” `[n]` w treści → link do karty n na stronie (`#karta-{id}`). `SYSTEM` — styl informacji (`ds-alert` info, bez koloru jako jedynego nośnika).
2. `MessageComposer({label, onSend, maxChars, extra?})`: `ds-textarea` z etykietą, licznik znaków (ogłaszany przy przekroczeniu), `ds-btn--primary` „Wyślij”, stan wysyłania, błąd w `Alert`. Puste/za długie blokuje wysyłkę z komunikatem.
3. `ThreadStatusBadge({status, viewer})`: słowo + ikona, nie sam kolor.
4. `ThreadList({items, hrefFor, viewer})`: lista kart wątków (temat, rodzaj, status, „czeka {n} h” z wyróżnieniem SLA słownie, „Nowa odpowiedź” gdy `unread_*`).
5. `useThread(id, side)`: ładowanie, odpytywanie (`ASSISTANT_POLL_MS` gdy `ASSISTANT_PENDING`, inaczej `THREAD_POLL_MS`), `markRead(side)` po wczytaniu nowych wiadomości, `newMessageAnnouncement` dla `aria-live`, `refresh()`.
6. `useCommInbox()`: wzór `useInboxCount` (współdzielony stan, `COMM_INBOX_POLL_MS`).

**Gotowe, gdy:** komponenty użyte w zaślepce (tymczasowo) renderują dane z prawdziwego API (wątek z seedu); czytnik ekranu (NVDA/VoiceOver lub inspekcja drzewa dostępności) czyta rolę przed treścią; build czysty.

---

## PK23 — Frontend: Platforma komunikacji (autor)

**Zależy od:** PK21, PK22, PK07
**Pliki:** `web/src/pages/comm/CommHomePage.tsx`, `web/src/pages/comm/NewThreadPage.tsx`, `web/src/pages/comm/ThreadPage.tsx`

**Cel:** scenariusz A po stronie autora.

**Kroki:**
1. `CommHomePage`: `h1` „Platforma komunikacji”, krótki opis; kafelki: „Zadaj pytanie” (`ds-btn--cta`, jedyny na ekranie), „Poproś o eksperta” (`/rozmowy/nowa?rodzaj=ekspert`), „Tablica partnerstw”. Sekcja „Moje rozmowy”: `listMyThreads()` → `commApi.listThreads({ids})` → `ThreadList`; pusto → `EmptyState`.
2. `NewThreadPage`: pole „Twoje pytanie” (`ds-textarea`, 4000), „Kim jesteś?” (`reporter_type`, radio jak w czacie M1), „Podpis (opcjonalnie)”, „E-mail do kontaktu (opcjonalnie)” z informacją, że nie będzie publiczny; dla `rodzaj=ekspert` `kind=MENTORING` i nagłówek „Poproś o eksperta”. Po sukcesie `addMyThread` i przejście do `/rozmowy/:id`.
3. `ThreadPage`: `h1` = temat; status; `Timeline` (viewer `author`); gdy `ASSISTANT_PENDING` — `ds-spinner` + „Asystent szuka odpowiedzi w Bibliotece Innowacji…” (`role="status"`); gdy `ANSWERED_BY_AI` — dwa przyciski: „To mi pomogło” (`PATCH CLOSED`) i „Chcę porozmawiać z zespołem Hubu” (`PATCH WAITING_STAFF`); `MessageComposer` „Odpowiedz” dla roli `reporter` (niezalogowany: link do logowania). `aria-live` z `useThread`.

**Gotowe, gdy:** na prawdziwym API z `LLM_ENABLED=false`: pytanie o samotność seniorów → po kilku sekundach odpowiedź automatyczna z kartami bez przeładowania strony, komunikat ogłoszony; eskalacja zmienia status; odpowiedź zespołu wysłana curl-em pojawia się w ≤ 5 s i w „Moich rozmowach” oznaczenie „Nowa odpowiedź”; lista kontrolna dostępności OK.

---

## PK24 — Frontend: odpis do zgłoszenia

**Zależy od:** PK23
**Pliki:** `web/src/pages/MyReportsPage.tsx`, `web/src/pages/panel/ReportPage.tsx` (zmiany)

**Cel:** scenariusz B — autor zgłoszenia z M1 odpisuje Hubowi; pracownik widzi rozmowę.

**Kroki:**
1. `MyReportsPage`: przy zgłoszeniu z co najmniej jedną odpowiedzią — `ds-btn` „Odpisz zespołowi” → rozwijany `MessageComposer`; wysłanie `commApi.createThread({kind: "REPORT", report_id, body})` → `addMyThread` → link „Przejdź do rozmowy” (`/rozmowy/:id`).
2. `ReportPage` (panel): gdy istnieje wątek `REPORT` (`listThreads({kind: "REPORT"})` przefiltrowane po `report_id`, albo nowy parametr — **nie** zmieniaj backendu, filtruj po stronie klienta) — link „Rozmowa z autorem ({n} wiadomości)” do `/panel/rozmowy/:id`.
3. Wpis w „Uwagach” `frontend-tasks.md`.

**Gotowe, gdy:** odpowiedź z panelu (F16) → autor klika „Odpisz” → wątek z osią czasu zawierającą wcześniejszą odpowiedź Hubu i wiadomość autora; drugi odpis trafia do tego samego wątku; w panelu zgłoszenia widać link.

---

## PK25 — Frontend: Tablica partnerstw

**Zależy od:** PK21, PK22, PK08
**Pliki:** `web/src/pages/comm/PartnersPage.tsx`, `web/src/pages/comm/NewOfferPage.tsx`, `web/src/pages/comm/OfferPage.tsx`, `web/src/components/comm/OfferCard.tsx`

**Cel:** scenariusz C.

**Kroki:**
1. `PartnersPage`: `h1` „Tablica partnerstw”, filtry (`ds-select`: „Oferujemy / Szukamy”, sektor, wyzwanie) z wynikiem w `aria-live` („Znaleziono {n} ogłoszeń”), lista `OfferCard` (intencja słownie, organizacja, sektor, wyzwanie, skrót opisu), `Pagination`; „Dodaj ogłoszenie” dla `reporter`.
2. `NewOfferPage`: formularz `PartnershipCreate`; po wysłaniu komunikat „Ogłoszenie trafiło do moderacji Hubu. Pojawi się na tablicy po zatwierdzeniu.”
3. `OfferPage`: szczegóły; `h2` „Pasujące ogłoszenia” (`OfferCard` + „podobieństwo {procent}%” + odznaka „międzysektorowe” słownie), `h2` „Powiązane rozwiązania z Biblioteki” (`SolutionCard`), `h2` „Zapotrzebowanie” („{n} podobnych zgłoszeń problemów” + gminy, gdy są); przycisk „Zaproponuj współpracę” (`reporter`) → `MessageComposer` → `createThread({kind: "PARTNERSHIP", partnership_id, body})` → przejście do wątku. Informacja: „Hub skontaktuje obie strony — dane kontaktowe nie są publiczne.”

**Gotowe, gdy:** na danych z seedu: filtr SEEK zawęża listę; ogłoszenie teleopieki pokazuje ≥ 1 dopasowanie międzysektorowe i rozwiązania; propozycja tworzy wątek widoczny w „Moich rozmowach” i w panelu; lista kontrolna dostępności OK.

---

## PK26 — Frontend: Panel — Rozmowy

**Zależy od:** PK21, PK22, PK07, PK08
**Pliki:** `web/src/pages/panel/CommThreadsPage.tsx`, `web/src/pages/panel/CommThreadPage.tsx`, `web/src/components/panel/MentorAssign.tsx`, `web/src/components/panel/DraftReplyButton.tsx`, `web/src/components/layout/PanelLayout.tsx` (licznik — tylko linia pozycji „Rozmowy”)

**Cel:** scenariusz A po stronie pracownika ROPS.

**Kroki:**
1. Licznik przy „Rozmowy” = `useCommInbox().waiting_staff` (wzór licznika „Nowe”, z `aria-label` „Rozmowy, {n} czeka na odpowiedź”).
2. `CommThreadsPage`: podsumowanie z `CommInbox` (czeka, po terminie SLA, konsultacje bez eksperta, ogłoszenia do moderacji z linkiem); filtry statusu i rodzaju (domyślnie `WAITING_STAFF`); `ThreadList` (viewer `staff`).
3. `CommThreadPage`: okruszki, `h1` temat, metadane (rodzaj, kategoria, typ zgłaszającego, czas oczekiwania, link do zgłoszenia/ogłoszenia/rozwiązania); `Timeline` (viewer `staff`); `MessageComposer` „Odpowiedź Hubu” z polem „Podpis” i wyborem kart („Dołącz rozwiązanie” — wyszukiwarka `GET /api/solutions?q=` z M1, ≤ 5); `DraftReplyButton` „Podpowiedz odpowiedź (AI)” wstawia szkic do pola (nie wysyła), z informacją „Szkic AI — przeczytaj i popraw przed wysłaniem”; 503 → przycisk znika z komunikatem; `StatusControl`-podobne przyciski „Zamknij rozmowę” / „Otwórz ponownie”.
4. `MentorAssign`: lista podpowiedzi (`mentor-suggestions`) z uzasadnieniem słownie („ten sam obszar wyzwania”, „podobieństwo {procent}%”), `ds-select` wszystkich ekspertów, „Przydziel” / „Usuń przydział”.

**Gotowe, gdy:** wątek z seedu ponad SLA jest na górze listy z oznaczeniem; szkic AI (z kluczem) wypełnia pole, bez klucza przycisk znika z komunikatem; wysłana odpowiedź z kartą pojawia się u autora; przydział eksperta dodaje wiadomość systemową; lista kontrolna dostępności OK.

---

## PK27 — Frontend: Panel — moderacja partnerstw

**Zależy od:** PK21, PK08
**Pliki:** `web/src/pages/panel/PartnershipsReviewPage.tsx`

**Cel:** pracownik zatwierdza, odrzuca i zamyka ogłoszenia.

**Kroki:** zakładki/filtr statusu (domyślnie `PENDING_REVIEW`), lista z pełnym opisem, przyciski „Opublikuj”, „Odrzuć”, „Zamknij” (dla `PUBLISHED`), wynik w `aria-live`, fokus po zniknięciu pozycji wraca na nagłówek listy (wzór F17).

**Gotowe, gdy:** 2 ogłoszenia z seedu w moderacji; „Opublikuj” → pojawia się na `/partnerzy`; licznik `pending_offers` w panelu maleje.

---

## PK28 — Frontend: widok eksperta

**Zależy od:** PK21, PK22, PK07
**Pliki:** `web/src/pages/expert/ExpertHomePage.tsx`, `web/src/pages/expert/ExpertThreadPage.tsx`

**Cel:** ekspert widzi przydzielone rozmowy i odpowiada.

**Kroki:**
1. `ExpertHomePage`: `h1` „Moje konsultacje”, profil eksperta (`GET /api/mentors/{mentorId}`), `ThreadList` z `listThreads({mentor_id})` (viewer `mentor`), pusto → `EmptyState` „Nie masz przydzielonych rozmów.”
2. `ExpertThreadPage`: `Timeline` (viewer `mentor`), `MessageComposer` → `addMessage({role: "MENTOR", mentor_id, body})`; `markRead("mentor")`.

**Gotowe, gdy:** konto `ekspert` widzi wątek `MENTORING` z seedu; odpowiedź pojawia się u autora jako „Ekspert: {imię}”; wątek nieprzydzielony otwarty po URL nie pozwala odpisać (komunikat zamiast formularza).

---

## PK29 — Przegląd dostępności i próba generalna demo M5

**Zależy od:** PK10, PK23, PK24, PK25, PK26, PK27, PK28
**Pliki:** `docs/modules/05-platforma-komunikacji/module-5-demo.md` (nowy); poprawki tylko jako wpisy w „Uwagach” do właścicieli plików

**Cel:** scenariusze A–C działają end-to-end w `make up`, ekrany M5 spełniają listę kontrolną dostępności (`frontend-tasks.md`).

**Kroki:**
1. `make reset-db && make ingest && python -m scripts.seed_reports && make seed-comm`.
2. Przejdź scenariusze A, B, C (spec, sekcja 4) na trzech kontach (`reporter`, `admin`, `ekspert`), w tym tryb wysokiego kontrastu i nawigację tylko klawiaturą; zapisz scenariusz demo (≤ 3 min) krok po kroku z hasłami kont w `module-5-demo.md`.
3. Lista kontrolna dostępności dla każdej nowej trasy; usterki → „Uwagi”.

**Gotowe, gdy:** `module-5-demo.md` zawiera przetestowany scenariusz i wypełnioną listę kontrolną; brak otwartych usterek blokujących demo.

---

## Uwagi między zadaniami

_(dopisuj na końcu: `- [PKxx → PKyy] opis`)_
