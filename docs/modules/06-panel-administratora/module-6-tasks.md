# Moduł 6 — Panel administratora: plan implementacji i zadania

Plan na podstawie `docs/modules/06-panel-administratora/module-6-panel-administratora.html` (v0.2). Każde zadanie jest samowystarczalne: zawiera cel, pliki, wklejony kontekst ze specyfikacji, kroki i kryterium gotowości. Agent wykonujący zadanie **nie musi czytać specyfikacji HTML** — ale musi przeczytać `AGENTS.md` (twarde reguły) oraz sekcję „Wspólne kontrakty” poniżej.

Zakres modułu: **edycja treści wpisów w `solutions` z synchronicznym ponownym embeddingiem, dodawanie wpisów (`KNOWLEDGE`, rozwiązania kuratorskie) z panelu, historia zmian, ekran „Baza wiedzy” i wspólna powłoka panelu**. Pomysły (M3), testy (M4), rozmowy (M5) i trendy (M2) mają ekrany w swoich modułach — Moduł 6 ustala tylko kolejność nawigacji i konwencje.

**Odstępstwa od specyfikacji (decyzja zespołu, 2026-10-03, jak w Module 1):**
- **Bez autoryzacji.** Wszystkie endpointy są otwarte; bez tokenów, nagłówków dostępu i kodów 401/403. Panel ukrywa się w UI za rolą `administrator` (`RequireRole`).
- **Bez testów automatycznych.** Weryfikacja każdego zadania: curl, psql, `python -c`, ręczne uruchomienie (frontend — przeglądarka).

## Protokół pracy (obowiązkowy)

1. **Jedyne źródło statusu** to lista „Status zadań” poniżej. Treść zadań nie zawiera statusu.
2. Stany:
   - `- [ ]` — wolne,
   - `- [~]` — w toku; dopisz na końcu linii ` — agent: <nazwa>, <RRRR-MM-DD GG:MM>`,
   - `- [x]` — zrobione; zamień dopisek na ` — zrobione: <nazwa>, <krótka notka lub hash commita>`.
3. **Branie zadania:** wybierz zadanie `[ ]`, którego wszystkie zależności są `[x]`. Edytuj tylko jego linię na `[~]`, potem przeczytaj plik ponownie i sprawdź, czy linia nadal ma Twój dopisek (jeśli ktoś był szybszy — weź inne zadanie).
4. Edytuj w tym pliku **wyłącznie linię swojego zadania** oraz (ewentualnie) dopisuj na końcu sekcji „Uwagi między zadaniami”. Nie przepisuj innych linii, nie formatuj pliku.
5. Zmieniaj w repozytorium **tylko pliki wymienione w polu „Pliki” swojego zadania**. Potrzebujesz zmiany w cudzym pliku → wpis w „Uwagach między zadaniami” (`- [PAxx → PAyy] opis`), nie edycja. Zadanie, które zmienia plik Modułu 1 (wymieniony w polu „Pliki”), dopisuje też jedną linię w „Uwagach między zadaniami” odpowiedniego pliku zadań M1 (`module-1-tasks.md` albo `frontend-tasks.md`): co zmieniono i który ADR to uzasadnia.
6. `[x]` dopiero, gdy spełnione jest „Gotowe, gdy” (ręczna weryfikacja opisana w zadaniu) i `ruff check .` (backend) albo `cd web && npm run lint && npm run build` (frontend) jest czysty dla Twoich plików.
7. Zablokowany (brak klucza API, błąd w zależności, sprzeczność ze specyfikacją) → przywróć `[ ]` i opisz przyczynę w „Uwagach między zadaniami”.
8. Sygnatury z sekcji „Wspólne kontrakty” są wiążące. Jeśli musisz je zmienić — najpierw wpis w „Uwagach”, nie cicha zmiana.

## Status zadań

Identyfikatory: `PA00`, `PA01`, … (prefiks modułu, żeby nie kolidować z `T` Modułu 1 i `F` frontendu).

<!-- Format linii: - [ ] PA00 · Opis · zależy: — / PAxx, T.., F.. -->

- [ ] PA00 · Schemat i kontrakty: `solutions.edited_at`, `solution_revisions`, modele ORM, schematy pydantic admina, ustawienia `ADMIN_*` · zależy: —
- [ ] PA01 · Logika zapisu `api/admin_content.py` (walidacja, diff, rewizja, decyzja o przebudowie chunków) + wspólna walidacja w `solutions.py` · zależy: PA00
- [ ] PA02 · Router `/api/admin/solutions`: `GET /{id}`, `PATCH /{id}/content`, rejestracja w `main.py` · zależy: PA01
- [ ] PA03 · Router: `GET /api/admin/solutions` (lista), `GET /{id}/revisions`, `POST` (tworzenie) · zależy: PA02
- [ ] PA04 · Ingest chroni edycje z panelu: pomijanie `edited_at`, flaga `--overwrite-edited` · zależy: PA01
- [ ] PA05 · Frontend: typy, klient API, etykiety pól i statusów · zależy: PA00
- [ ] PA06 · Komponent `SolutionForm` (pola treści, listy kroków i mediów, liczniki, błędy) · zależy: PA05
- [ ] PA07 · Ekran edycji `/panel/wiedza/:id` + link „Edytuj treść” z przeglądu rozwiązania · zależy: PA02, PA06
- [ ] PA08 · `RevisionList` — „Historia zmian” na ekranie edycji · zależy: PA03, PA07
- [ ] PA09 · „Baza wiedzy” `/panel/wiedza`, „Dodaj wpis” `/panel/wiedza/nowy`, pozycja i kolejność nawigacji panelu · zależy: PA03, PA07
- [ ] PA10 · `knowledge_type` w API admina, formularzu i filtrach · zależy: PA03, PA09, Z00
- [ ] PA11 · Konwencje powłoki dla M3/M5, scenariusze S1–S4, dostępność, README · zależy: PA04, PA08, PA09

### Fale równoległości (orientacyjnie)

1. **Fala 1:** PA00.
2. **Fala 2:** PA01, PA05 (backend i frontend równolegle — frontend pracuje na kontrakcie z PA00).
3. **Fala 3:** PA02, PA04, PA06.
4. **Fala 4:** PA03, PA07.
5. **Fala 5:** PA08, PA09.
6. **Fala 6:** PA11; PA10 — gdy tylko Moduł 2 domknie Z00 (może wejść po PA11).

**Najkrótsza działająca ścieżka** (gdy brakuje czasu): PA00 → PA01 → PA02 → PA05 → PA06 → PA07. Daje scenariusz demo S1: edycja streszczenia w panelu → „Zapisano. Wyszukiwanie zaktualizowane” → to samo pytanie w czacie zwraca nową treść. Wejście do edycji przez link „Edytuj treść” z istniejącej kolejki `/panel/rozwiazania/:id` albo wprost po adresie.

---

## Wspólne kontrakty (wiążące dla wszystkich zadań)

### Konwencje

- Konwencje Modułu 1 obowiązują bez zmian (`docs/modules/01-matchmaking/module-1-tasks.md`, „Wspólne kontrakty → Konwencje”): pakiety `api.*`, importy absolutne, async przy I/O, dane w `data/`, ustawienia w `api.config.settings` (zero literałów limitów w kodzie routera i logiki).
- Frontend: konwencje z `docs/modules/01-matchmaking/frontend-tasks.md` (klient `web/src/api/client.ts`, `useApi`, `LoadState`, `Alert`, `Pagination`, `useTaxonomy`, `useGminy`, `useInboxCount` / `refreshInbox`, `ModuleLabel`, `useDocumentTitle`). **Stylowanie wyłącznie Tailwindem** z presetu design systemu + klasy `ds-*` — bez nowych plików CSS i bez `style={{…}}` (`AGENTS.md`, „Stylowanie: Tailwind, bez własnego CSS”). Wzorzec: `web/src/pages/LoginPage.tsx`.
- Teksty dla użytkownika po polsku; komunikaty błędów API (`message`) po polsku.
- Jedna `AsyncSession` na żądanie; zapis treści + przebudowa chunków + rewizja w **jednej transakcji**.
- `kind` wpisu nie jest edytowalny. Reguła ADR-011 bez zmian: `KNOWLEDGE` nigdy nie trafia na karty rozwiązań czatu — edycja w panelu niczego tu nie zmienia, bo filtr działa przez `JOIN solutions`.

### Zależności od Modułu 1 i frontendu

| Reużywamy bez zmian | Zmieniamy (addytywnie, ADR) |
|---|---|
| `content_hash(title, summary, body)`, `rebuild_chunks(session, solution, provider)` (`api/corpus.py`) — embeduje przed podmianą chunków, `flush` bez `commit`; błąd providera zostawia stare chunki | `solutions.edited_at` + tabela `solution_revisions` (ADR-M6-003, ADR-M6-004) — PA00 |
| `get_embedding_provider()`, `ProviderError` (`api/providers/`) | Wspólna walidacja gminy/kategorii wydzielona do `api/admin_content.py`, `create_solution` z niej korzysta (bez zmiany zachowania) — PA01 |
| `load_solutions`, `to_card` (`api/cards.py`) — jedyny sposób budowy pól karty | Nowy router `api/routers/admin_solutions.py` + rejestracja w `api/main.py` (ADR-M6-001) — PA02 |
| `GMINY: dict[str, str]` (`api/pipeline/preprocess.py`), tabela `challenge_taxonomy` | `scripts/ingest.py`: pomijanie wpisów z `edited_at`, flaga `--overwrite-edited` (ADR-M6-004) — PA04 |
| `ApiError(status, code, message)` → `{"error": {"code", "message"}}` (`api/errors.py`), `Page[T]` (`api/schemas.py`) | `SolutionReviewPage.tsx`: link „Edytuj treść” — PA07 |
| `PATCH /api/solutions/{id}` (status, kategoria, poziom sprawdzenia) — bez zmian, bez rewizji | `App.tsx`: trasy `/panel/wiedza*` — PA07, PA09; `PanelLayout.tsx`: pozycja „Baza wiedzy” i kolejność — PA09 |
| CORS (`GET`, `POST`, `PATCH`, `OPTIONS`) — wystarcza | — |

**Zależność od Modułu 2:** kolumnę `solutions.knowledge_type` (`REPORT` / `MATERIAL`, CHECK `(kind = 'KNOWLEDGE') = (knowledge_type IS NOT NULL)`) i pole `SolutionCard.knowledge_type` wprowadza Z00 (ADR-M2-001). Do czasu Z00 zadania PA00–PA09 **nie znają** `knowledge_type`; dokłada je PA10. Jeśli Z00 jest `[x]` przed startem PA00 — PA00 i tak go nie dubluje, a PA10 można wziąć od razu po PA09.

### Nazwy i sygnatury, z których korzystają inne zadania

| Symbol | Moduł | Właściciel |
|---|---|---|
| `Solution.edited_at`, model `SolutionRevision` | `api/models.py` | PA00 |
| `SolutionAdminItem`, `SolutionAdminDetail`, `SolutionContentFields`, `SolutionContentPatch`, `SolutionAdminCreate`, `SolutionRevisionOut` | `api/schemas.py` | PA00 |
| `ADMIN_LIST_DEFAULT_LIMIT`, `ADMIN_LIST_MAX_LIMIT`, `ADMIN_REVISIONS_LIMIT`, `ADMIN_NOTE_MAX_CHARS` | `api/config.py` | PA00 |
| `CONTENT_FIELDS: tuple[str, ...]` | `api/admin_content.py` | PA01 |
| `async validate_category(session, code: str \| None) -> None`, `resolve_gmina(gmina: str \| None) -> tuple[str \| None, str \| None]` | `api/admin_content.py` | PA01 |
| `@dataclass EditOutcome(solution: Solution, changed_fields: list[str], reembedded: bool, chunk_count: int)` | `api/admin_content.py` | PA01 |
| `async apply_edit(session, solution_id: int, patch: SolutionContentPatch) -> EditOutcome` | `api/admin_content.py` | PA01 |
| `async create_entry(session, payload: SolutionAdminCreate) -> EditOutcome` | `api/admin_content.py` | PA01 |
| `async record_revision(session, *, solution_id, action, author_label, note, changed_fields, snapshot, reembedded) -> None` | `api/admin_content.py` | PA01 |
| `async to_admin_detail(session, solution_id: int, *, reembedded: bool \| None = None) -> SolutionAdminDetail` | `api/admin_content.py` | PA01 |
| `router` (prefiks `/api/admin/solutions`) | `api/routers/admin_solutions.py` | PA02 |
| `api.adminSolutions`, `api.adminSolution`, `api.createAdminSolution`, `api.patchSolutionContent`, `api.solutionRevisions` | `web/src/api/client.ts` | PA05 |
| `SOLUTION_STATUS_LABELS`, `KIND_LABELS`, `CONTENT_FIELD_LABELS` | `web/src/lib/labels.ts` | PA05 |
| `SolutionForm`, `SolutionFormValues`, `toFormValues(detail)`, `diffValues(initial, current)` | `web/src/components/panel/SolutionForm.tsx` | PA06 |
| `RevisionList` | `web/src/components/panel/RevisionList.tsx` | PA08 |

### Model danych (dokładnie tak — PA00)

```sql
-- solutions: nowa kolumna dopisana w CREATE TABLE solutions, po updated_at
    edited_at            TIMESTAMPTZ,                       -- ostatnia edycja w panelu; NULL = treść z ingestu/formularza

-- historia zmian (po tabeli report_replies)
CREATE TABLE solution_revisions (
    id              BIGSERIAL   PRIMARY KEY,
    solution_id     BIGINT      NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
    action          TEXT        NOT NULL CHECK (action IN ('CREATE', 'EDIT')),
    author_label    TEXT        NOT NULL,               -- login z sesji frontendu ('admin') albo 'ingest'
    note            TEXT,                               -- powód zmiany
    changed_fields  TEXT[]      NOT NULL DEFAULT '{}',  -- nazwy pól API, np. {summary,body}
    snapshot        JSONB       NOT NULL DEFAULT '{}',  -- wartości zmienionych pól PRZED zmianą
    reembedded      BOOLEAN     NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX solution_revisions_solution_idx ON solution_revisions (solution_id, created_at DESC);
```

- Snapshot zawiera **tylko zmienione pola**, z wartościami sprzed zmiany, w kształcie JSON jak w API (`tags` i `implementation_steps` jako listy, `media` jako lista obiektów `{type, url, title}`). `contact` nigdy.
- `action = 'CREATE'`: `changed_fields = '{}'`, `snapshot = '{}'`.
- Działająca baza bez `make reset-db` (dane z ingestu zostają):
  ```sql
  ALTER TABLE solutions ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
  -- + CREATE TABLE solution_revisions … i indeks jak wyżej
  ```

### Konfiguracja (`api/config.py`, PA00)

| Zmienna | Domyślnie | Znaczenie |
|---|---|---|
| `ADMIN_LIST_DEFAULT_LIMIT` | 25 | Rozmiar strony `GET /api/admin/solutions` |
| `ADMIN_LIST_MAX_LIMIT` | 100 | Górny limit `limit` |
| `ADMIN_REVISIONS_LIMIT` | 50 | Domyślny `limit` w `GET …/revisions` |
| `ADMIN_NOTE_MAX_CHARS` | 500 | Limit `note` |

Limity długości pól treści są te same co w `SolutionSubmit` (stałe w schemacie): `title` 3–200, `summary` 10–2000, `body` ≤ 20 000, `tags` ≤ 20, `implementation_steps` ≤ 30, `media` ≤ 10, `author_label` 1–100.

### Schematy API (`api/schemas.py`, PA00 — dokładnie tak)

```python
SolutionStatusLiteral = Literal["PUBLISHED", "PENDING_REVIEW", "REJECTED", "ARCHIVED"]

class SolutionAdminItem(SolutionCard):
    status: SolutionStatusLiteral
    created_at: datetime
    updated_at: datetime
    edited_at: datetime | None
    submitted_by_name: str | None
    revision_count: int
    # scores = None; rank = offset + i + 1

class SolutionAdminDetail(SolutionAdminItem):
    body: str
    chunk_count: int
    reembedded: bool | None = None       # tylko w odpowiedzi na POST i PATCH …/content

class SolutionContentFields(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str | None = Field(None, min_length=3, max_length=200)
    summary: str | None = Field(None, min_length=10, max_length=2000)
    body: str | None = Field(None, max_length=20_000)
    organization: str | None = None
    gmina: str | None = None             # nieznana → 422; powiat liczony z gminy
    category: str | None = None          # kod z challenge_taxonomy; nieznany → 422
    tags: list[str] | None = Field(None, max_length=20)
    target_group: str | None = None
    cost_range: str | None = None
    implementation_steps: list[str] | None = Field(None, max_length=30)
    source_url: str | None = None
    source_name: str | None = None
    media: list[MediaItem] | None = Field(None, max_length=10)

class SolutionContentPatch(SolutionContentFields):
    expected_updated_at: datetime
    author_label: str = Field(min_length=1, max_length=100)
    note: str | None = None              # długość ≤ settings.ADMIN_NOTE_MAX_CHARS (walidator)

class SolutionAdminCreate(SolutionContentFields):
    kind: SolutionKindLiteral
    title: str = Field(min_length=3, max_length=200)
    summary: str = Field(min_length=10, max_length=2000)
    status: Literal["PUBLISHED", "PENDING_REVIEW"] = "PUBLISHED"
    evidence_level: int = Field(1, ge=1, le=5)
    author_label: str = Field(min_length=1, max_length=100)
    note: str | None = None

class SolutionRevisionOut(BaseModel):
    id: int
    action: Literal["CREATE", "EDIT"]
    author_label: str
    note: str | None
    changed_fields: list[str]
    previous: dict[str, Any]             # = snapshot
    reembedded: bool
    created_at: datetime
```

Semantyka `SolutionContentPatch`: pole **pominięte** = bez zmian; pole z `null` = wyczyść (tylko pola opcjonalne). Rozróżnienie przez `patch.model_fields_set`. `title: null`, `summary: null` → 422 (nie można czyścić).

### Endpointy (PA02, PA03)

| Metoda i ścieżka | Wejście | Wyjście | Błędy |
|---|---|---|---|
| `GET /api/admin/solutions` | `kind`, `status`, `category`, `q`, `edited` (bool), `sort=updated\|title`, `limit`, `offset` | `Page[SolutionAdminItem]`; bez `status` — wszystkie statusy; bez `kind` — oba | 422 |
| `GET /api/admin/solutions/{id}` | — | `SolutionAdminDetail` | 404 `NOT_FOUND` |
| `POST /api/admin/solutions` | `SolutionAdminCreate` | 201 `SolutionAdminDetail` (`reembedded = true`) | 409 `SOURCE_URL_TAKEN`, 422, 503 `EMBEDDING_UNAVAILABLE` |
| `PATCH /api/admin/solutions/{id}/content` | `SolutionContentPatch` | `SolutionAdminDetail` z `reembedded` | 404, 409 `EDIT_CONFLICT` / `SOURCE_URL_TAKEN`, 422, 503 |
| `GET /api/admin/solutions/{id}/revisions` | `limit` (domyślnie `ADMIN_REVISIONS_LIMIT`) | `list[SolutionRevisionOut]` od najnowszej | 404 |

Komunikaty błędów (`message`, po polsku):
- `NOT_FOUND` — „Nie znaleziono wpisu.”
- `EDIT_CONFLICT` — „Wpis został zmieniony w międzyczasie. Wczytaj aktualną wersję.”
- `SOURCE_URL_TAKEN` — „Inny wpis ma już ten adres źródła.”
- `EMBEDDING_UNAVAILABLE` — „Nie udało się odświeżyć wyszukiwania. Zmiany nie zostały zapisane.”

### Typy frontendu (`web/src/api/types.ts`, PA05 — lustro schematów)

```ts
export type SolutionStatus = "PUBLISHED" | "PENDING_REVIEW" | "REJECTED" | "ARCHIVED";

export interface SolutionAdminItem extends SolutionCard {
  status: SolutionStatus;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  submitted_by_name: string | null;
  revision_count: number;
}
export interface SolutionAdminDetail extends SolutionAdminItem {
  body: string;
  chunk_count: number;
  reembedded: boolean | null;
}
export interface SolutionContentFields {
  title?: string; summary?: string; body?: string;
  organization?: string | null; gmina?: string | null; category?: string | null;
  tags?: string[]; target_group?: string | null; cost_range?: string | null;
  implementation_steps?: string[]; source_url?: string | null; source_name?: string | null;
  media?: MediaItem[];
}
export interface SolutionContentPatch extends SolutionContentFields {
  expected_updated_at: string; author_label: string; note?: string | null;
}
export interface SolutionAdminCreate extends SolutionContentFields {
  kind: SolutionKind; title: string; summary: string;
  status?: "PUBLISHED" | "PENDING_REVIEW"; evidence_level?: number;
  author_label: string; note?: string | null;
}
export interface SolutionRevision {
  id: number; action: "CREATE" | "EDIT"; author_label: string; note: string | null;
  changed_fields: string[]; previous: Record<string, unknown>; reembedded: boolean; created_at: string;
}
export interface AdminSolutionsQuery {
  kind?: SolutionKind; status?: SolutionStatus; category?: string; q?: string;
  edited?: boolean; sort?: "updated" | "title"; limit?: number; offset?: number;
}
```

### Powłoka panelu (ADR-M6-006 — obowiązuje też M2, M3, M5)

Kolejność `PanelLayout`:

| # | Pozycja | Trasa | Właściciel |
|---|---|---|---|
| 1 | Nowe (badge = suma skrzynki) | `/panel` | M1 (F14); sekcje dokładają M3, M5 |
| 2 | Zgłoszenia | `/panel/zgloszenia` | M1 |
| 3 | Do zatwierdzenia | `/panel/rozwiazania` | M1 |
| 4 | **Baza wiedzy** | `/panel/wiedza` | **M6** |
| 5 | Pomysły | `/panel/pomysly` | M3 (K07, K11) |
| 6 | Testerzy | `/panel/testy` | M4 |
| 7 | Rozmowy | `/panel/rozmowy` | M5 (PK20, PK24) |
| 8 | Trendy | `/panel/trendy` | M1 (F18), M2 (Z09) |
| — | Wróć do serwisu | `/` | M1 |

Reguły ekranów panelu: trasa `/panel/<sekcja>[/:id]` pod `<RequireRole requiredRole="administrator" layout="panel">`; `ModuleLabel` właściciela nad `h1`; liczniki przez `useInboxCount` / `refreshInbox()` (bez osobnych pętli odpytywania); filtry list w URL; trzy stany (ładowanie z `aria-busy`, pusto z podpowiedzią, błąd `Alert` + „Spróbuj ponownie”); najwyżej jeden `ds-btn--cta` na ekran; WCAG 2.1 AA także w `data-contrast="high"`.

---

## Zadania

## PA00 — Schemat i kontrakty

**Zależy od:** —
**Pliki:** `db/init.sql`, `api/models.py`, `api/schemas.py`, `api/config.py` (wszystkie zmiana; pliki M1 → linia w „Uwagach” `module-1-tasks.md`)

**Cel:** baza, modele i schematy, na których stoją wszystkie pozostałe zadania — backend i frontend mogą ruszyć równolegle.

**Kontekst ze specyfikacji:**
- ADR-M6-003: historia jako `solution_revisions` ze snapshotem „przed” zmienionych pól (umożliwia późniejsze cofanie bez zmiany schematu).
- ADR-M6-004: `solutions.edited_at` oznacza wpis poprawiony w panelu; ingest go nie nadpisuje.
- `SolutionCard` pozostaje jedynym kształtem karty — schematy admina go **rozszerzają** (dziedziczenie), nie kopiują pól.
- Wszystkie kolumny to treść publiczna lub metadane pracy zespołu; brak danych osobowych mieszkańców.

**Kroki:**
1. `db/init.sql`: kolumna `edited_at` w `CREATE TABLE solutions` (po `updated_at`), tabela `solution_revisions` i indeks — dokładnie jak w „Model danych” wyżej. Komentarz `-- Moduł 6 (ADR-M6-003, ADR-M6-004)`.
2. `api/models.py`: `Solution.edited_at: Mapped[datetime | None]`; model `SolutionRevision` (kolumny jak w DDL; `changed_fields` jako `ARRAY(Text)`, `snapshot` jako `JSONB`). Bez relacji lazy — async nie ładuje leniwie.
3. `api/config.py`: cztery zmienne `ADMIN_*` z „Konfiguracji”.
4. `api/schemas.py`: `SolutionStatusLiteral` (jeśli nie istnieje) i sześć schematów z „Schematów API”. Walidator `note` czyta `settings.ADMIN_NOTE_MAX_CHARS`. `SolutionContentFields` z `extra="forbid"`.
5. Na działającej bazie wykonaj `ALTER TABLE … ADD COLUMN IF NOT EXISTS` i `CREATE TABLE` ręcznie (psql) albo `make reset-db && make ingest`.

**Gotowe, gdy:**
- `make reset-db && make ingest` przechodzi; `psql -c '\d solution_revisions'` pokazuje tabelę, `\d solutions` — kolumnę `edited_at`.
- `python -c "from api.schemas import SolutionContentPatch as P; p=P(summary='x'*20, expected_updated_at='2026-10-04T10:00:00Z', author_label='admin'); print(p.model_fields_set)"` → `{'summary', 'expected_updated_at', 'author_label'}`.
- `python -c "from api.schemas import SolutionContentPatch as P; P(foo=1, expected_updated_at='2026-10-04T10:00:00Z', author_label='a')"` → `ValidationError` (extra forbidden).
- `python -c "from api.config import settings; print(settings.ADMIN_REVISIONS_LIMIT)"` → `50`.
- Istniejące endpointy działają bez zmian (`curl localhost:8000/api/solutions | head -c 200`).

---

## PA01 — Logika zapisu `api/admin_content.py`

**Zależy od:** PA00
**Pliki:** `api/admin_content.py` (nowy), `api/routers/solutions.py` (zmiana: tylko podmiana walidacji gminy/kategorii w `create_solution` na funkcje z `admin_content`; plik M1 → linia w „Uwagach” `module-1-tasks.md`)

**Cel:** jedno miejsce, które wie, jak bezpiecznie zmienić treść wpisu: walidacja, diff, rewizja, przebudowa chunków tylko wtedy, gdy trzeba.

**Kontekst ze specyfikacji:**
- ADR-M6-002: ponowny embedding **synchronicznie**, w tej samej transakcji co zapis. `ProviderError` → rollback całości, 503 `EMBEDDING_UNAVAILABLE`; treść, chunki i historia bez zmian. Wzorzec: `create_solution` w `api/routers/solutions.py`.
- `rebuild_chunks` embeduje przed usunięciem starych chunków i robi `flush`, nie `commit`.
- **Przebudowa chunków gdy zmienił się `content_hash` lub `title`** (każdy chunk przechowuje kopię tytułu; `content_hash` obejmuje `title, summary, body`, więc w praktyce warunek sprowadza się do zmiany hasha — sprawdzaj oba jawnie). Zmiana samych metadanych (tagi, kroki, media, gmina…) — bez wywołania providera.
- ADR-M6-005: optymistyczna blokada — `expected_updated_at` musi być równe `solutions.updated_at` (porównanie dokładne, z mikrosekundami); inaczej 409 `EDIT_CONFLICT`.
- Pusty diff → zwróć stan bieżący, `reembedded = False`, **bez** rewizji i bez zmiany `updated_at`.
- `edited_at = updated_at = now()` przy każdej niepustej edycji i przy tworzeniu.
- Logi: `solution_id`, `action`, `changed_fields`, długości pól tekstowych, `reembedded`, czas embeddingu w ms. **Nigdy** wartości pól ani `note`.

**Kroki:**
1. `CONTENT_FIELDS` = nazwy pól `SolutionContentFields` (z `SolutionContentFields.model_fields`).
2. `resolve_gmina(gmina)` — `strip()`, pusty → `(None, None)`, nieznana w `GMINY` → `ApiError(422, "VALIDATION_ERROR", "gmina: nieznana gmina '…'.")`, inaczej `(gmina, powiat)`. `validate_category(session, code)` — `None` przepuszcza, nieznany kod → 422 `VALIDATION_ERROR`. Komunikaty identyczne z obecnymi w `create_solution`; podmień tam walidację na te funkcje (zachowanie bez zmian).
3. Normalizacja wartości: napisy `strip()`, pusty napis w polu opcjonalnym → `None`; `tags` bez pustych i duplikatów (zachowaj kolejność); `implementation_steps` bez pustych; `media` → lista dictów `model_dump()`.
4. `apply_edit(session, solution_id, patch)`:
   1. `select(Solution).where(Solution.id == solution_id).with_for_update()`; brak → 404 `NOT_FOUND` „Nie znaleziono wpisu.”
   2. `patch.expected_updated_at != sol.updated_at` → 409 `EDIT_CONFLICT`.
   3. Dla pól z `patch.model_fields_set ∩ CONTENT_FIELDS`: `title`/`summary` = `None` → 422; normalizuj; `gmina` → także `powiat`; `category` → walidacja.
   4. `source_url` zmieniony i zajęty przez inny wpis → 409 `SOURCE_URL_TAKEN` (sprawdź `SELECT` przed `flush`, żeby nie łapać `IntegrityError`).
   5. Diff ze stanem bieżącym (porównanie wartości po normalizacji, JSON-owo dla list). Pusty → `EditOutcome(sol, [], False, chunk_count)`.
   6. `snapshot = {pole: stara_wartość}` dla zmienionych pól; przypisz nowe wartości; nowy `content_hash`.
   7. Hash albo tytuł inny → `chunk_count = await rebuild_chunks(session, sol, get_embedding_provider())`, `reembedded = True`. `ProviderError` → `await session.rollback()` i `ApiError(503, "EMBEDDING_UNAVAILABLE", …)`.
   8. `sol.edited_at = sol.updated_at = func.now()`; `record_revision(action="EDIT", …)`; `await session.commit()`; `await session.refresh(sol)`.
5. `create_entry(session, payload)`: walidacja jak wyżej (`source_url` zajęty → 409); `Solution(kind=…, origin=CURATED, status=payload.status, evidence_level=…, contact={}, content_hash=…, edited_at=now())`; `flush`; `rebuild_chunks`; `record_revision(action="CREATE", changed_fields=[], snapshot={}, reembedded=True)`; `commit`.
6. `record_revision(...)` — tylko `session.add(SolutionRevision(...))`, bez commita.
7. `to_admin_detail(session, solution_id, *, reembedded=None)`: `load_solutions` + `to_card(row, rank=1)` → `SolutionAdminDetail(**card.model_dump(), status=…, created_at=…, updated_at=…, edited_at=…, submitted_by_name=…, revision_count=…, body=…, chunk_count=…, reembedded=reembedded)`. `revision_count` i `chunk_count` — `SELECT count(*)`. Bez `contact`.

**Gotowe, gdy** (sprawdzane `python -c` z `asyncio.run` i `SessionLocal()`; id z `psql -c "select id, updated_at from solutions where kind='SOLUTION' limit 1"`):
- Zmiana `summary` → `EditOutcome.reembedded == True`, `changed_fields == ['summary']`; w psql `content_hash` inny, `solution_chunks` dla wpisu mają nowe `id`, `solution_revisions` ma 1 wiersz z `snapshot->>'summary'` = stara wartość.
- Zmiana tylko `tags` → `reembedded == False`, chunki nietknięte (te same `id`), rewizja jest.
- Powtórzenie tego samego żądania (z nowym `expected_updated_at`) → `changed_fields == []`, brak nowej rewizji, `updated_at` bez zmian.
- Stare `expected_updated_at` → `ApiError` 409 `EDIT_CONFLICT`.
- Z `EMBEDDING_PROVIDER=openai` i pustym `OPENAI_API_KEY` zmiana `summary` → 503; w psql treść, `content_hash`, chunki i liczba rewizji bez zmian.
- `curl -X POST localhost:8000/api/solutions …` z nieznaną gminą nadal → 422 z tym samym komunikatem co przed zmianą.

---

## PA02 — Router: szczegóły i edycja treści

**Zależy od:** PA01
**Pliki:** `api/routers/admin_solutions.py` (nowy), `api/main.py` (zmiana: rejestracja routera; plik M1 → linia w „Uwagach” `module-1-tasks.md`)

**Cel:** ścieżka krytyczna demo — edycja treści przez HTTP.

**Kontekst ze specyfikacji:**
- ADR-M6-001: osobny prefiks `/api/admin/solutions`; publiczne `POST /api/solutions` i `PATCH /api/solutions/{id}` bez zmian. Jeden prefiks do zabezpieczenia, gdy kiedyś dojdzie autoryzacja.
- Router tylko waliduje wejście (pydantic) i woła `admin_content` — bez logiki diffu w routerze.
- `contact` nie wychodzi z żadnego endpointu.

**Kroki:**
1. `router = APIRouter(prefix="/api/admin/solutions", tags=["admin"])`.
2. `GET /{solution_id}` → `to_admin_detail(session, solution_id)`; brak → 404 `NOT_FOUND`.
3. `PATCH /{solution_id}/content` (`SolutionContentPatch`) → `outcome = await apply_edit(...)` → `to_admin_detail(session, solution_id, reembedded=outcome.reembedded)`.
4. Rejestracja w `api/main.py` obok pozostałych routerów.

**Gotowe, gdy:**
```bash
ID=$(psql "$DATABASE_URL" -Atc "select id from solutions where status='PUBLISHED' and kind='SOLUTION' limit 1")
U=$(curl -s localhost:8000/api/admin/solutions/$ID | jq -r .updated_at)
curl -s -X PATCH localhost:8000/api/admin/solutions/$ID/content -H 'Content-Type: application/json' \
  -d "{\"summary\":\"Sąsiedzkie spotkania seniorów przy kawie w świetlicy wiejskiej, prowadzone przez wolontariuszy.\",\"expected_updated_at\":\"$U\",\"author_label\":\"admin\",\"note\":\"test PA02\"}" | jq '{reembedded, chunk_count, edited_at}'
```
- → `reembedded: true`, `edited_at` ustawione; ten sam PATCH z tym samym `$U` → 409 `EDIT_CONFLICT`.
- `curl -N -X POST localhost:8000/api/chat … -d '{"message":"spotkania seniorów przy kawie w świetlicy"}'` → w `candidates` wpis `$ID` z nowym `summary`.
- Odpowiedź `GET /{id}` nie zawiera klucza `contact`; nieistniejące id → 404 w kształcie `{"error": {"code": "NOT_FOUND", …}}`.
- Body z nieznanym polem (`{"foo":1,…}`) → 422.

---

## PA03 — Router: lista, historia, tworzenie

**Zależy od:** PA02
**Pliki:** `api/routers/admin_solutions.py` (zmiana)

**Cel:** przegląd całej bazy wiedzy (wszystkie statusy) i dodawanie wpisów z panelu.

**Kontekst ze specyfikacji:**
- Lista bez filtra `status` zwraca wszystkie statusy, bez `kind` — oba rodzaje. `q` — trigram po tytule, jak w `GET /api/solutions` (T21): `title % :q OR title ILIKE '%'||:q||'%'`, przy `q` sortowanie po `similarity(title, :q)`. `edited=true` → `edited_at IS NOT NULL`, `false` → `IS NULL`. `sort=updated` (domyślnie): `updated_at DESC, id DESC`; `sort=title`: `title ASC, id ASC`.
- `limit` domyślnie `ADMIN_LIST_DEFAULT_LIMIT`, maks. `ADMIN_LIST_MAX_LIMIT`; `rank = offset + i + 1`; `scores = None`.
- `revision_count` na liście — jedno zapytanie `GROUP BY solution_id` dla całej strony, nie N zapytań.
- Tworzenie: `origin = CURATED`, status z żądania (`PUBLISHED` albo `PENDING_REVIEW`), rewizja `CREATE`. Nowy `PENDING_REVIEW` pojawi się w skrzynce „Nowe” (`/api/inbox` liczy go sam).

**Kroki:**
1. `GET ""` → `Page[SolutionAdminItem]` (karty przez `load_solutions` + `to_card`, potem rozszerzenie polami admina — jak w `to_admin_detail`, bez `body`).
2. `GET /{solution_id}/revisions?limit=` → `list[SolutionRevisionOut]` (`created_at DESC, id DESC`, `previous = snapshot`); brak wpisu → 404.
3. `POST ""` (`SolutionAdminCreate`) → `create_entry` → 201 `to_admin_detail(..., reembedded=True)`.

**Gotowe, gdy:**
- `curl 'localhost:8000/api/admin/solutions?status=PENDING_REVIEW'` zgadza się co do `total` z `select count(*) from solutions where status='PENDING_REVIEW'`; bez parametrów `total` = `select count(*) from solutions`.
- `?edited=true` zwraca wpis z PA02; jego `revision_count ≥ 1`.
- `curl localhost:8000/api/admin/solutions/$ID/revisions | jq '.[0] | {action, changed_fields, previous}'` → `EDIT`, `["summary"]`, poprzednie streszczenie.
- `POST` z `{"kind":"KNOWLEDGE","title":"Diagnoza samotności seniorów 2026","summary":"Raport ROPS o skali samotności…","body":"…","category":"LONELINESS","author_label":"admin"}` → 201, `reembedded: true`, w psql chunki istnieją; wpis jest w `candidates.context` czatu dla pytania o samotność seniorów, a **nie** w kartach rozwiązań.
- `POST` z `source_url` istniejącego wpisu → 409 `SOURCE_URL_TAKEN`; `?limit=1000` → 422.

---

## PA04 — Ingest chroni edycje z panelu

**Zależy od:** PA01
**Pliki:** `scripts/ingest.py` (zmiana; plik M1 → linia w „Uwagach” `module-1-tasks.md`)

**Cel:** `make ingest` nie kasuje po cichu pracy kuratorów (ADR-M6-004).

**Kontekst ze specyfikacji:**
- `ingest_record` znajduje istniejący wpis po `source_url` (`_find_existing`) i nadpisuje treść i metadane.
- Nowa reguła: istniejący wpis z `edited_at IS NOT NULL` jest **pomijany**, chyba że podano `--overwrite-edited`. Pominięcie liczone osobno jako `skipped_edited` i wypisane w podsumowaniu; log tylko z `solution_id`.
- Z `--overwrite-edited`: ingest nadpisuje jak dotąd, zeruje `edited_at` i zapisuje rewizję `EDIT` z `author_label = 'ingest'`, `note = 'nadpisane przez ingest'`, `snapshot` ze starymi wartościami zmienionych pól — używaj `record_revision` z `api/admin_content.py`.
- `--dry-run` liczy `skipped_edited` tak samo, nic nie zapisuje. `--reembed` (pełne przeliczenie) nie zmienia treści, więc nie dotyczy tej reguły.

**Kroki:**
1. Pole `skipped_edited: int = 0` w `Stats`, flaga `--overwrite-edited` w `argparse`, przekazanie do `ingest_record`.
2. W `ingest_record` po znalezieniu `existing`: `if existing.edited_at is not None and not overwrite_edited:` → `stats.skipped_edited += 1; return`.
3. Gałąź z flagą: przed nadpisaniem zbierz snapshot zmienionych pól (te same nazwy pól co `CONTENT_FIELDS`), po nadpisaniu `existing.edited_at = None`, `record_revision(...)`.
4. Podsumowanie na końcu `run`: dopisz `pominięte (edytowane w panelu): N`.

**Gotowe, gdy:**
- Po edycji z PA02: `make ingest` → podsumowanie `pominięte (edytowane w panelu): 1`; w psql `summary` wpisu nadal z edycji.
- `python -m scripts.ingest data/solutions/ --overwrite-edited` → `summary` wraca do wersji z pliku, `edited_at IS NULL`, nowa rewizja z `author_label = 'ingest'`.
- Ponowny `make ingest` bez flagi → `pominięte (edytowane w panelu): 0`.

---

## PA05 — Frontend: typy, klient, etykiety

**Zależy od:** PA00
**Pliki:** `web/src/api/types.ts`, `web/src/api/client.ts`, `web/src/lib/labels.ts` (wszystkie zmiana; pliki frontendu M1 → linia w „Uwagach” `frontend-tasks.md`)

**Cel:** kontrakt TS dla ekranów M6, gotowy zanim backend skończy.

**Kontekst ze specyfikacji:** endpointy i typy z „Wspólnych kontraktów” (sekcje „Endpointy” i „Typy frontendu”). Błędy w kształcie `{"error": {"code", "message"}}` — klient już mapuje je na `ApiError` (F01); ekrany rozróżniają `status === 409` i `code`.

**Kroki:**
1. `types.ts`: typy z „Typów frontendu” (dokładnie tak; `SolutionStatus` dodaj tylko, jeśli nie istnieje).
2. `client.ts` (obiekt `api`): `adminSolutions(q: AdminSolutionsQuery) → Page<SolutionAdminItem>`, `adminSolution(id) → SolutionAdminDetail`, `createAdminSolution(body) → SolutionAdminDetail`, `patchSolutionContent(id, body) → SolutionAdminDetail` (metoda `PATCH`), `solutionRevisions(id, limit?) → SolutionRevision[]`. Parametry `undefined` pomijane w query (jak w `api.reports`).
3. `labels.ts`:
   - `SOLUTION_STATUS_LABELS`: Opublikowany, Czeka na zatwierdzenie, Odrzucony, Zarchiwizowany.
   - `KIND_LABELS`: `SOLUTION` „Rozwiązanie”, `KNOWLEDGE` „Wiedza”.
   - `CONTENT_FIELD_LABELS`: `title` „Tytuł”, `summary` „Streszczenie”, `body` „Treść”, `organization` „Organizacja”, `gmina` „Gmina”, `category` „Wyzwanie”, `tags` „Tagi”, `target_group` „Grupa docelowa”, `cost_range` „Koszt”, `implementation_steps` „Kroki wdrożenia”, `source_url` „Adres źródła”, `source_name` „Nazwa źródła”, `media` „Materiały i filmy”.

**Gotowe, gdy:** `cd web && npm run lint && npm run build` czysty; przy działającym backendzie (PA02) w konsoli przeglądarki na `/panel` (`await import('/src/api/client.ts')` w trybie dev) `api.adminSolution(ID)` zwraca obiekt z `status` i `chunk_count`.

---

## PA06 — Komponent `SolutionForm`

**Zależy od:** PA05
**Pliki:** `web/src/components/panel/SolutionForm.tsx` (nowy)

**Cel:** jeden formularz treści wpisu dla tworzenia i edycji.

**Kontekst ze specyfikacji:**
- Kolejność pól: tytuł, streszczenie, treść (`textarea`), kroki wdrożenia (lista: „Dodaj krok”, „Usuń”, „W górę”/„W dół”), wyzwanie (`select` z `useTaxonomy`, opcja „— brak —”), gmina (`select` z `useGminy`, opcjonalna), organizacja, grupa docelowa, koszt, tagi (pole tekstowe, przecinki → lista), źródło (nazwa + URL), media (lista wierszy: typ `video`/`document`/`link`, tytuł, URL; „Dodaj materiał”, „Usuń”).
- Limity jak w backendzie (title 3–200, summary 10–2000, body ≤ 20 000, tags ≤ 20, kroki ≤ 30, media ≤ 10) — licznik znaków przy polach tekstowych z limitem (`aria-live="polite"` tylko przy przekroczeniu).
- Przy tytule, streszczeniu i treści podpowiedź (`ds-hint`): „Zmiana tego pola odświeży wyszukiwanie.”
- Błędy: podsumowanie nad formularzem (`Alert` z listą linków do pól, fokus na podsumowaniu po nieudanym zapisie), przy polu `aria-invalid` + `aria-describedby`.
- Wzorce: `web/src/components/idea/IdeaForm.tsx` (formularz „Mam pomysł”, F13) — reużyj podejścia do list kroków/mediów, nie importuj komponentu strony.
- Stylowanie: Tailwind + `ds-field`, `ds-input`, `ds-select`, `ds-btn`; bez CTA w środku komponentu (przycisk zapisu dostarcza strona przez `children`/props).

**Kroki:**
1. `SolutionFormValues` — wszystkie pola jako stan formularza (napisy, listy). `toFormValues(detail: SolutionAdminDetail | null)` i `diffValues(initial, current): SolutionContentFields` — zwraca tylko zmienione pola, puste napisy w polach opcjonalnych jako `null`, tagi rozbite po przecinku i przycięte.
2. `SolutionForm` props: `values`, `onChange`, `errors: Record<string, string>`, `disabled`, `children` (stopka z przyciskami).
3. Mapowanie błędu 422 z backendu (`message` zaczyna się od `"<pole>: "`) na `errors[pole]` — eksportuj `fieldErrorFromApi(err)`.

**Gotowe, gdy:** `npm run lint && npm run build` czysty; komponent wyrenderowany tymczasowo na stronie deweloperskiej (albo od razu w PA07) — klawiatura: Tab przechodzi wszystkie pola i przyciski list w logicznej kolejności, „Dodaj krok” przenosi fokus do nowego pola; `diffValues` dla niezmienionego formularza zwraca `{}`; czytnik ekranu (VoiceOver) czyta etykietę i podpowiedź pola treści.

---

## PA07 — Ekran edycji `/panel/wiedza/:id`

**Zależy od:** PA02, PA06
**Pliki:** `web/src/pages/panel/KnowledgeEditPage.tsx` (nowy), `web/src/App.tsx` (trasa), `web/src/pages/panel/SolutionReviewPage.tsx` (link) (pliki frontendu M1 → linia w „Uwagach” `frontend-tasks.md`)

**Cel:** scenariusz demo S1 — poprawka treści widoczna w czacie.

**Kontekst ze specyfikacji:**
- Nagłówek: `ModuleLabel` „Panel administratora”, `h1` = tytuł wpisu, pod nim etykiety: rodzaj (`KIND_LABELS`), status (`SOLUTION_STATUS_LABELS`), „Ostatnia zmiana: …” (`edited_at` albo `updated_at`, format z `lib/format.ts`). Linki: „Zobacz publicznie” → `/rozwiazania/:id` (tylko `PUBLISHED`), „Decyzja o publikacji” → `/panel/rozwiazania/:id`.
- Formularz `SolutionForm` z danymi z `api.adminSolution(id)`, pole „Notatka do zmiany” (opcjonalne, ≤ 500), CTA `ds-btn--cta` „Zapisz zmiany” — zablokowany, gdy `diffValues` puste.
- Zapis: `api.patchSolutionContent(id, {...diff, expected_updated_at: detail.updated_at, author_label: session.username, note})`. `session` z `useAuth()` (`web/src/lib/auth.tsx`).
- Komunikaty (`Alert`, fokus na komunikacie):
  - 200 + `reembedded` → „Zapisano. Wyszukiwanie zaktualizowane ({chunk_count} fragmentów).”
  - 200 bez `reembedded` → „Zapisano zmiany w opisie wpisu.”
  - 422 → `fieldErrorFromApi` + podsumowanie błędów.
  - 409 `EDIT_CONFLICT` → „Ktoś zmienił ten wpis w międzyczasie.” + przycisk „Wczytaj aktualną wersję” (pobiera ponownie; dotychczasowe wartości formularza pokazane pod spodem w `details` „Twoje niezapisane zmiany” do skopiowania).
  - 503 → „Nie udało się odświeżyć wyszukiwania, zmiany nie zostały zapisane. Spróbuj za chwilę.” — formularz zachowany.
- Po udanym zapisie: stan formularza = odpowiedź (nowe `updated_at`), `refreshInbox()` nie jest potrzebny (edycja nie zmienia liczników).
- Ostrzeżenie przy opuszczaniu strony z niezapisanymi zmianami (`beforeunload`; aplikacja używa `BrowserRouter`, więc `useBlocker` nie jest dostępny — nawigacji wewnątrz SPA nie blokujemy).
- `SolutionReviewPage`: link `ds-btn` „Edytuj treść” → `/panel/wiedza/:id` obok `ReviewActions` (nie CTA).
- Stany: ładowanie, 404 („Nie znaleziono wpisu.” + link do `/panel/wiedza`), błąd.

**Kroki:**
1. Trasa `wiedza/:id` w `App.tsx` w bloku `RequireRole requiredRole="administrator" layout="panel"`.
2. Strona jak wyżej; `useDocumentTitle("Edycja: " + title)`.
3. Link w `SolutionReviewPage`.

**Gotowe, gdy:** S1 w przeglądarce: czat → zapytanie → zapamiętaj kartę → `/panel/rozwiazania/:id` → „Edytuj treść” → zmiana streszczenia → „Zapisz zmiany” → komunikat z liczbą fragmentów → to samo zapytanie w czacie pokazuje nowe streszczenie. Druga karta przeglądarki z tym samym wpisem → zapis → 409 z „Wczytaj aktualną wersję”. Zmiana tylko tagów → „Zapisano zmiany w opisie wpisu.” Lista kontrolna dostępności z `frontend-tasks.md` OK, także w `data-contrast="high"`.

---

## PA08 — „Historia zmian”

**Zależy od:** PA03, PA07
**Pliki:** `web/src/components/panel/RevisionList.tsx` (nowy), `web/src/pages/panel/KnowledgeEditPage.tsx` (zmiana)

**Cel:** scenariusz S4 — kto, kiedy i co zmienił.

**Kontekst ze specyfikacji:**
- Sekcja `h2` „Historia zmian” pod formularzem. Lista od najnowszej: data i godzina, autor (`author_label`), etykiety zmienionych pól (`CONTENT_FIELD_LABELS`), notatka, znacznik „odświeżono wyszukiwanie” (gdy `reembedded`). `CREATE` → „Utworzono wpis w panelu”.
- Każda pozycja rozwijana (`details`/`summary`) — poprzednie wartości pól: tekst (przycięty do ~300 znaków z przyciskiem „Pokaż całość”), listy jako `ul`, media jako tytuł + URL.
- Pusto: „Ten wpis nie był jeszcze edytowany w panelu.” Błąd ładowania historii nie blokuje formularza (osobny `Alert`).
- Po udanym zapisie w `KnowledgeEditPage` lista odświeża się (nowa pozycja na górze).

**Kroki:** `RevisionList({ solutionId, refreshKey })` z `useApi(() => api.solutionRevisions(id), [id, refreshKey])`; podpięcie w `KnowledgeEditPage` z `refreshKey` zwiększanym po zapisie.

**Gotowe, gdy:** po dwóch edycjach z PA07 lista ma dwie pozycje w dobrej kolejności, rozwinięcie pokazuje poprzednie streszczenie; wpis z ingestu bez edycji pokazuje komunikat „pusto”; `details` obsługiwane klawiaturą (Enter/Spacja); lista kontrolna dostępności OK.

---

## PA09 — „Baza wiedzy”, „Dodaj wpis”, nawigacja panelu

**Zależy od:** PA03, PA07
**Pliki:** `web/src/pages/panel/KnowledgeBasePage.tsx` (nowy), `web/src/pages/panel/KnowledgeCreatePage.tsx` (nowy), `web/src/App.tsx` (trasy), `web/src/components/layout/PanelLayout.tsx` (pozycja i kolejność) (pliki frontendu M1 → linia w „Uwagach” `frontend-tasks.md`)

**Cel:** przegląd całej bazy (wszystkie statusy) i dodawanie wpisów — scenariusze S2 i S3; wdrożenie kolejności nawigacji z „Powłoki panelu”.

**Kontekst ze specyfikacji:**
- `/panel/wiedza` — `KnowledgeBasePage`: `ModuleLabel`, `h1` „Baza wiedzy”. Filtry (w URL): rodzaj (Wszystkie / Rozwiązania / Wiedza), status (Wszystkie + 4), wyzwanie (`useTaxonomy`), fraza (`q`, pole wyszukiwania z przyciskiem), „Tylko edytowane w panelu” (checkbox → `edited=true`), sortowanie (Ostatnio zmienione / Alfabetycznie). Tabela (`ds-table` albo lista kart z F15 jako wzór): tytuł (link do `/panel/wiedza/:id`), rodzaj, status, wyzwanie, ostatnia zmiana, liczba zmian. `Pagination`. CTA `ds-btn--cta` „Dodaj wpis” → `/panel/wiedza/nowy`.
- `/panel/wiedza/nowy` — `KnowledgeCreatePage`: `h1` „Dodaj wpis”; `fieldset` z radio rodzaju (Rozwiązanie / Wiedza — raport lub materiał); `SolutionForm`; status startowy (radio: „Opublikuj od razu” / „Zapisz do zatwierdzenia”), poziom sprawdzenia (`ds-select`, etykiety z `EVIDENCE_LABELS`), notatka; CTA „Dodaj”. Sukces → `navigate('/panel/wiedza/' + id)` z komunikatem „Dodano wpis. Wyszukiwanie zaktualizowane.” (stan nawigacji); dla `PENDING_REVIEW` także `refreshInbox()`. 409 `SOURCE_URL_TAKEN` → błąd przy polu „Adres źródła”. 503 → jak w PA07.
- `PanelLayout`: dodaj „Baza wiedzy” → `/panel/wiedza` i ustaw kolejność z tabeli „Powłoka panelu” (pozycje M3/M5 dopiszą ich zadania we wskazanych miejscach — zostaw komentarz `{/* M3: Pomysły (K07) */}`, `{/* M5: Rozmowy (PK20) */}` w odpowiednich miejscach).
- `KnowledgeEditPage` (PA07) czyta komunikat ze stanu nawigacji, jeśli jest.

**Kroki:** trasy `wiedza` i `wiedza/nowy` (przed `wiedza/:id`) w `App.tsx`; dwie strony; zmiana `PanelLayout`.

**Gotowe, gdy:** S2: dodanie wpisu „Wiedza” → przekierowanie na edycję z komunikatem → wpis widoczny w `candidates.context` czatu, niewidoczny w kartach rozwiązań. S3: wpis z „Mam pomysł” (`PENDING_REVIEW`) widoczny na liście z filtrem statusu, edycja literówek, potem publikacja w `/panel/rozwiazania/:id`. Filtry przeżywają odświeżenie strony (URL). Nawigacja panelu w kolejności z tabeli; jeden CTA na ekran; lista kontrolna dostępności OK.

---

## PA10 — `knowledge_type` w panelu

**Zależy od:** PA03, PA09, Z00 (Moduł 2)
**Pliki:** `api/schemas.py`, `api/admin_content.py`, `api/routers/admin_solutions.py`, `web/src/api/types.ts`, `web/src/components/panel/SolutionForm.tsx`, `web/src/pages/panel/KnowledgeBasePage.tsx`, `web/src/pages/panel/KnowledgeCreatePage.tsx`, `web/src/lib/labels.ts`

**Cel:** raporty i materiały (ADR-M2-001) rozróżnialne w panelu — formularz, lista, filtr.

**Kontekst ze specyfikacji:**
- Z00 dodaje `solutions.knowledge_type` (`REPORT` / `MATERIAL`) z CHECK `(kind = 'KNOWLEDGE') = (knowledge_type IS NOT NULL)` i pole `SolutionCard.knowledge_type` — `SolutionAdminItem` dziedziczy je automatycznie.
- `SolutionContentFields.knowledge_type: Literal["REPORT", "MATERIAL"] | None`. Walidacja w `admin_content`: `KNOWLEDGE` wymaga typu, `SOLUTION` musi mieć `None` → inaczej 422 `VALIDATION_ERROR` „knowledge_type: …”. Pole objęte diffem i rewizją jak inne.
- Lista: filtr `knowledge_type` (z `kind=SOLUTION` → 422, jak w `GET /api/solutions` po Z04).
- Frontend: w `KnowledgeCreatePage` rodzaj jako trzy opcje (Rozwiązanie / Raport lub diagnoza / Materiał); w `SolutionForm` `select` typu wiedzy tylko dla `KNOWLEDGE`; w `KnowledgeBasePage` filtr rodzaju rozszerzony o Raporty / Materiały; `KNOWLEDGE_TYPE_LABELS` w `labels.ts` (jeśli Z06 ich jeszcze nie dodał — inaczej reużyj); `CONTENT_FIELD_LABELS.knowledge_type` „Rodzaj wiedzy”.

**Gotowe, gdy:** `POST` `KNOWLEDGE` bez `knowledge_type` → 422; z `REPORT` → 201; `PATCH` zmiany `REPORT` → `MATERIAL` → `reembedded: false`, rewizja z `knowledge_type`; `?knowledge_type=MATERIAL` filtruje; w UI tworzenie raportu i zmiana typu działają, filtr listy w URL.

---

## PA11 — Konwencje powłoki, scenariusze, dostępność, README

**Zależy od:** PA04, PA08, PA09
**Pliki:** `docs/modules/03-kreator-pomyslow/module-3-tasks.md`, `docs/modules/05-platforma-komunikacji/module-5-tasks.md` (tylko dopisek w „Uwagach między zadaniami”), `docs/modules/06-panel-administratora/module-6-tasks.md` (tylko „Uwagi”), `README.md` (sekcja o panelu, jeśli istnieje — inaczej wpis w „Uwagach”)

**Cel:** spójny panel z perspektywy pozostałych modułów i próba generalna demo.

**Kroki:**
1. Dopisz w „Uwagach” M3 i M5: `[PA11 → K07/K11]` / `[PA11 → PK20/PK24]` — kolejność nawigacji z „Powłoki panelu” (Pomysły po „Baza wiedzy”, Rozmowy po „Testerzy”), komentarze-miejsca w `PanelLayout.tsx`, reguły ekranów (ModuleLabel, liczniki przez `useInboxCount`/`refreshInbox`, filtry w URL, trzy stany, jeden CTA).
2. Przejdź S1–S4 na świeżej bazie (`make reset-db && make ingest`) z `EMBEDDING_PROVIDER` takim, jak na demo; zapisz czasy zapisu z re-embeddingiem (oczekiwane < 3 s).
3. `make ingest` po edycjach → wpisy edytowane pominięte (PA04).
4. Przegląd dostępności ekranów `/panel/wiedza*` (lista kontrolna z `frontend-tasks.md`, VoiceOver, sama klawiatura, `data-contrast="high"`, szerokość 320 px).
5. Wpis w „Uwagach” z wynikami (czasy, znalezione problemy → nowe wpisy dla właścicieli).

**Gotowe, gdy:** S1–S4 przechodzą bez błędów w konsoli; wpisy w „Uwagach” M3 i M5 dodane; brak otwartych problemów dostępności oznaczonych jako blokujące.

---

## Uwagi między zadaniami

Format: `- [PAxx → PAyy] <opis> — <agent>, <data>`. Dopisuj tylko na końcu, nie edytuj cudzych wpisów.

- [ORCH] Pliki współdzielone z innymi modułami: `web/src/App.tsx` i `web/src/components/layout/PanelLayout.tsx` zmieniają też M3 (K07) i M5 (PK20); `api/routers/solutions.py` — M2 (Z04, Z12); `scripts/ingest.py` — M2 (Z03); `db/init.sql`, `api/models.py`, `api/schemas.py`, `api/config.py` — M2 (Z00). Zmiany M6 są addytywne; przy konflikcie scalaj, nie nadpisuj cudzych linii. — plan, 2026-10-04
- [ORCH] Otwarte pytania ze specyfikacji (sekcja 16), przyjęte domyślnie w zadaniach: `source_url` edytowalny (z kontrolą unikalności, PA01) — ryzyko duplikatu przy następnym ingeście zgłosić w „Uwagach”, jeśli wystąpi; edycja nie zmienia `origin`; edycja opublikowanego wpisu nie cofa go do `PENDING_REVIEW`. — plan, 2026-10-04
