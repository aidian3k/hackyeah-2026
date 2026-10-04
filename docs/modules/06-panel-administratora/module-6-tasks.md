# Moduł 6 — Panel administratora: plan implementacji i zadania

Plan na podstawie `docs/modules/06-panel-administratora/module-6-panel-administratora.html` (v0.2), **odchudzony pod hackathon (2026-10-04)** — patrz „Odstępstwa”. Każde zadanie jest samowystarczalne: zawiera cel, pliki, kontekst, kroki i kryterium gotowości. Agent wykonujący zadanie **nie musi czytać specyfikacji HTML** — ale musi przeczytać `AGENTS.md` (twarde reguły) oraz sekcję „Wspólne kontrakty” poniżej. Przy sprzeczności ze specyfikacją HTML wygrywa ten plik.

Zakres modułu: **edycja treści wpisów w `solutions` z synchronicznym ponownym embeddingiem, dodawanie wpisów (`KNOWLEDGE`, rozwiązania kuratorskie) z panelu, ekran „Baza wiedzy” i kolejność nawigacji panelu**. Wymaganie z `docs/base.md`: panel „pozwalający w szybki sposób modyfikować, weryfikować i udostępniać wiedzę”. Weryfikacja (zmiana statusu) już istnieje w Module 1 (`PATCH /api/solutions/{id}`, `/panel/rozwiazania/:id`). Pomysły (M3), testy (M4), rozmowy (M5) i trendy (M2) mają ekrany w swoich modułach.

**Odstępstwa od specyfikacji (decyzja zespołu):**
- **Bez autoryzacji** (2026-10-03, jak w Module 1). Wszystkie endpointy są otwarte; panel ukrywa się w UI za rolą `administrator` (`RequireRole`).
- **Bez testów automatycznych** (2026-10-03). Weryfikacja: curl, psql, `python -c`, przeglądarka (frontend).
- **Wycięte jako przerost formy na hackathon (2026-10-04)** — nie implementuj:
  - historia zmian: tabela `solution_revisions`, snapshoty, endpoint `/revisions`, `RevisionList` (ADR-M6-003),
  - `solutions.edited_at` i ochrona edycji przed ingestem, flaga `--overwrite-edited` (ADR-M6-004) — ingest odpalamy raz, przed demo,
  - optymistyczna blokada `expected_updated_at` / 409 `EDIT_CONFLICT` (ADR-M6-005) — jeden administrator na demo,
  - pola `author_label` i `note` (nie ma ich gdzie zapisać bez historii),
  - semantyka PATCH (pole pominięte vs `null`, `model_fields_set`) i diff na froncie — zamiast tego **PUT całego obiektu**,
  - filtry `category`, `edited`, sortowanie po tytule, wyszukiwanie trigramowe w liście,
  - zmiany w `scripts/ingest.py` i w `api/routers/solutions.py`,
  - `beforeunload`, przestawianie kroków „W górę/W dół”, liczniki znaków z `aria-live`, osobna strona tworzenia.

## Protokół pracy (obowiązkowy)

1. **Jedyne źródło statusu** to lista „Status zadań” poniżej. Treść zadań nie zawiera statusu.
2. Stany:
   - `- [ ]` — wolne,
   - `- [~]` — w toku; dopisz na końcu linii ` — agent: <nazwa>, <RRRR-MM-DD GG:MM>`,
   - `- [x]` — zrobione; zamień dopisek na ` — zrobione: <nazwa>, <krótka notka lub hash commita>`.
3. **Branie zadania:** wybierz zadanie `[ ]`, którego wszystkie zależności są `[x]`. Edytuj tylko jego linię na `[~]`, potem przeczytaj plik ponownie i sprawdź, czy linia nadal ma Twój dopisek (jeśli ktoś był szybszy — weź inne zadanie).
4. Edytuj w tym pliku **wyłącznie linię swojego zadania** oraz (ewentualnie) dopisuj na końcu sekcji „Uwagi między zadaniami”. Nie przepisuj innych linii, nie formatuj pliku.
5. Zmieniaj w repozytorium **tylko pliki wymienione w polu „Pliki” swojego zadania**. Potrzebujesz zmiany w cudzym pliku → wpis w „Uwagach między zadaniami” (`- [PAxx → PAyy] opis`), nie edycja.
6. `[x]` dopiero, gdy spełnione jest „Gotowe, gdy” i `ruff check .` (backend) albo `cd web && npm run lint && npm run build` (frontend) jest czysty dla Twoich plików.
7. Zablokowany (brak klucza API, błąd w zależności) → przywróć `[ ]` i opisz przyczynę w „Uwagach między zadaniami”.
8. Sygnatury z sekcji „Wspólne kontrakty” są wiążące. Jeśli musisz je zmienić — najpierw wpis w „Uwagach”, nie cicha zmiana.

## Status zadań

Identyfikatory: `PA00`, `PA01`, … (prefiks modułu, żeby nie kolidować z `T` Modułu 1 i `F` frontendu).

<!-- Format linii: - [ ] PA00 · Opis · zależy: — / PAxx, T.., F.. -->

- [x] PA00 · Backend: schematy admina, `api/admin_content.py`, router `/api/admin/solutions` (lista, szczegóły, `POST`, `PUT`) · zależy: — — zrobione: claude, curl+psql OK (PUT re-embed/bez, 409, 422, 404, KNOWLEDGE tylko w context, limit 422); test 503 pominięty
- [x] PA01 · Frontend: typy, klient API, etykiety · zależy: — — zrobione: claude, typy (+ knowledge_type), klient, SOLUTION_STATUS_LABELS, KIND_LABELS, KNOWLEDGE_TYPE_LABELS
- [x] PA02 · Komponent `SolutionForm` · zależy: PA01 — zrobione: claude, lint+build OK; klawiatura do sprawdzenia w przeglądarce (PA03)
- [~] PA03 · Ekran `/panel/wiedza/:id` i `/panel/wiedza/nowy` (edycja i dodawanie) + link „Edytuj treść” · zależy: PA00, PA02 — agent: claude, 2026-10-04 14:50 (kod gotowy, lint+build OK; czeka na S1/S2 w przeglądarce)
- [~] PA04 · „Baza wiedzy” `/panel/wiedza`, pozycja w nawigacji panelu, próba demo · zależy: PA03 — agent: claude, 2026-10-04 14:50 (kod gotowy, lint+build OK; czeka na S3 i próbę demo w przeglądarce)
- [~] PA05 · (opcjonalne) `knowledge_type` w API admina i formularzu · zależy: PA04, Z00 — agent: claude, 2026-10-04 14:50 (wdrożone razem z PA00–PA04; API: POST bez typu 422, REPORT→MATERIAL reembedded false; UI czeka na przeglądarkę)

**Równolegle:** PA00 i PA01 od razu (frontend pracuje na kontrakcie poniżej), potem PA02 → PA03 → PA04.

**Najkrótsza działająca ścieżka** (gdy brakuje czasu): PA00 → PA01 → PA02 → PA03. Daje scenariusz demo S1: edycja streszczenia w panelu → „Zapisano. Wyszukiwanie zaktualizowane” → to samo pytanie w czacie zwraca nową treść. Wejście przez link „Edytuj treść” z `/panel/rozwiazania/:id`.

---

## Wspólne kontrakty (wiążące dla wszystkich zadań)

### Konwencje

- Konwencje Modułu 1 obowiązują bez zmian (`docs/modules/01-matchmaking/module-1-tasks.md`, „Wspólne kontrakty → Konwencje”): pakiety `api.*`, importy absolutne, async przy I/O, ustawienia w `api.config.settings`.
- Frontend: konwencje z `docs/modules/01-matchmaking/frontend-tasks.md` (klient `web/src/api/client.ts`, `useApi`, `LoadState`, `Alert`, `Pagination`, `useTaxonomy`, `useGminy`, `refreshInbox`, `ModuleLabel`, `useDocumentTitle`). **Stylowanie wyłącznie Tailwindem** z presetu design systemu + klasy `ds-*` — bez nowych plików CSS i bez `style={{…}}`. Wzorzec: `web/src/pages/LoginPage.tsx`.
- Teksty dla użytkownika i komunikaty błędów API (`message`) po polsku.
- Zapis treści + przebudowa chunków w **jednej transakcji** (ADR-M6-002). Błąd providera → rollback, 503, nic się nie zmienia.
- `kind` wpisu nie jest edytowalny (ustawiany tylko przy tworzeniu). Reguła ADR-011 bez zmian: `KNOWLEDGE` nigdy nie trafia na karty rozwiązań czatu — filtr działa przez `JOIN solutions`.
- Edycja nie zmienia `origin` ani `status`. Status zmienia istniejący `PATCH /api/solutions/{id}` (M1).
- `contact` nie wychodzi z żadnego endpointu.

### Zależności od Modułu 1

| Reużywamy bez zmian | Zmieniamy (addytywnie) |
|---|---|
| `content_hash(title, summary, body)`, `rebuild_chunks(session, solution, provider)` (`api/corpus.py`) — embeduje przed podmianą chunków, `flush` bez `commit` | `api/schemas.py`: schematy admina — PA00 |
| `get_embedding_provider()`, `ProviderError` (`api/providers/`) | `api/config.py`: `ADMIN_LIST_DEFAULT_LIMIT`, `ADMIN_LIST_MAX_LIMIT` — PA00 |
| `load_solutions`, `to_card` (`api/cards.py`) — jedyny sposób budowy pól karty | `api/main.py`: rejestracja routera (ADR-M6-001) — PA00 |
| `GMINY: dict[str, str]` (`api/pipeline/preprocess.py`), tabela `challenge_taxonomy` | `web/src/api/types.ts`, `client.ts`, `lib/labels.ts` — PA01 |
| `ApiError(status, code, message)` (`api/errors.py`), `Page[T]`, `MediaItem`, `SolutionKindLiteral` (`api/schemas.py`) | `App.tsx` (trasy), `SolutionReviewPage.tsx` (link) — PA03; `PanelLayout.tsx` — PA04 |
| `PATCH /api/solutions/{id}` (status, kategoria, poziom sprawdzenia), CORS | — |
| Unikalny indeks `solutions_source_url_uq` (`db/init.sql`) — bez zmian schematu bazy | — |

Moduł 6 **nie zmienia** `db/init.sql`, `api/models.py`, `scripts/ingest.py` ani `api/routers/solutions.py`.

### Nazwy i sygnatury

| Symbol | Moduł | Właściciel |
|---|---|---|
| `SolutionStatusLiteral`, `SolutionAdminItem`, `SolutionAdminDetail`, `SolutionUpsert`, `SolutionAdminCreate` | `api/schemas.py` | PA00 |
| `ADMIN_LIST_DEFAULT_LIMIT`, `ADMIN_LIST_MAX_LIMIT` | `api/config.py` | PA00 |
| `async save_entry(session, payload: SolutionUpsert, *, solution_id: int \| None) -> tuple[int, bool]` — zwraca `(id, reembedded)` | `api/admin_content.py` | PA00 |
| `async to_admin_detail(session, solution_id: int, *, reembedded: bool \| None = None) -> SolutionAdminDetail` | `api/admin_content.py` | PA00 |
| `router` (prefiks `/api/admin/solutions`) | `api/routers/admin_solutions.py` | PA00 |
| `api.adminSolutions`, `api.adminSolution`, `api.createAdminSolution`, `api.updateAdminSolution` | `web/src/api/client.ts` | PA01 |
| `SOLUTION_STATUS_LABELS`, `KIND_LABELS` | `web/src/lib/labels.ts` | PA01 |
| `SolutionForm`, `SolutionFormValues`, `toFormValues(detail)`, `fromFormValues(values)`, `fieldErrorFromApi(err)` | `web/src/components/panel/SolutionForm.tsx` | PA02 |

### Konfiguracja (`api/config.py`, PA00)

| Zmienna | Domyślnie | Znaczenie |
|---|---|---|
| `ADMIN_LIST_DEFAULT_LIMIT` | 25 | Rozmiar strony `GET /api/admin/solutions` |
| `ADMIN_LIST_MAX_LIMIT` | 100 | Górny limit `limit` |

Limity długości pól — stałe w schemacie, jak w `SolutionSubmit`: `title` 3–200, `summary` 10–2000, `body` ≤ 20 000, `tags` ≤ 20, `implementation_steps` ≤ 30, `media` ≤ 10.

### Schematy API (`api/schemas.py`, PA00 — dokładnie tak)

```python
SolutionStatusLiteral = Literal["PUBLISHED", "PENDING_REVIEW", "REJECTED", "ARCHIVED"]

class SolutionAdminItem(SolutionCard):
    status: SolutionStatusLiteral
    updated_at: datetime
    # scores = None; rank = offset + i + 1

class SolutionAdminDetail(SolutionAdminItem):
    body: str
    chunk_count: int
    reembedded: bool | None = None       # tylko w odpowiedzi na POST i PUT

class SolutionUpsert(BaseModel):
    """Pełny stan treści wpisu. PUT nadpisuje wszystkie pola; null / [] = puste."""
    title: str = Field(min_length=3, max_length=200)
    summary: str = Field(min_length=10, max_length=2000)
    body: str = Field("", max_length=20_000)
    organization: str | None = None
    gmina: str | None = None             # nieznana → 422; powiat liczony z gminy
    category: str | None = None          # kod z challenge_taxonomy; nieznany → 422
    tags: list[str] = Field(default_factory=list, max_length=20)
    target_group: str | None = None
    cost_range: str | None = None
    implementation_steps: list[str] = Field(default_factory=list, max_length=30)
    source_url: str | None = None
    source_name: str | None = None
    media: list[MediaItem] = Field(default_factory=list, max_length=10)

class SolutionAdminCreate(SolutionUpsert):
    kind: SolutionKindLiteral
    status: Literal["PUBLISHED", "PENDING_REVIEW"] = "PUBLISHED"
    evidence_level: int = Field(1, ge=1, le=5)
```

### Endpointy (PA00)

| Metoda i ścieżka | Wejście | Wyjście | Błędy |
|---|---|---|---|
| `GET /api/admin/solutions` | `kind`, `status`, `q`, `limit`, `offset` | `Page[SolutionAdminItem]`, `updated_at DESC, id DESC`; bez `status` — wszystkie statusy, bez `kind` — oba | 422 |
| `GET /api/admin/solutions/{id}` | — | `SolutionAdminDetail` | 404 `NOT_FOUND` |
| `POST /api/admin/solutions` | `SolutionAdminCreate` | 201 `SolutionAdminDetail` (`reembedded = true`) | 409 `SOURCE_URL_TAKEN`, 422, 503 `EMBEDDING_UNAVAILABLE` |
| `PUT /api/admin/solutions/{id}` | `SolutionUpsert` | `SolutionAdminDetail` z `reembedded` | 404, 409 `SOURCE_URL_TAKEN`, 422, 503 |

`q` — `title ILIKE '%' || :q || '%'` (z escapowaniem `%`/`_`, jak `_escape_like` w `api/routers/solutions.py` — skopiuj, nie importuj prywatnej funkcji).

Komunikaty błędów (`message`):
- `NOT_FOUND` — „Nie znaleziono wpisu.”
- `SOURCE_URL_TAKEN` — „Inny wpis ma już ten adres źródła.”
- `EMBEDDING_UNAVAILABLE` — „Nie udało się odświeżyć wyszukiwania. Zmiany nie zostały zapisane.”
- `VALIDATION_ERROR` — `"<pole>: <opis>"` (np. „gmina: nieznana gmina 'X'.”), żeby frontend przypiął błąd do pola.

### Typy frontendu (`web/src/api/types.ts`, PA01 — lustro schematów)

```ts
export type SolutionStatus = "PUBLISHED" | "PENDING_REVIEW" | "REJECTED" | "ARCHIVED";

export interface SolutionAdminItem extends SolutionCard {
  status: SolutionStatus;
  updated_at: string;
}
export interface SolutionAdminDetail extends SolutionAdminItem {
  body: string;
  chunk_count: number;
  reembedded: boolean | null;
}
export interface SolutionUpsert {
  title: string; summary: string; body: string;
  organization: string | null; gmina: string | null; category: string | null;
  tags: string[]; target_group: string | null; cost_range: string | null;
  implementation_steps: string[]; source_url: string | null; source_name: string | null;
  media: MediaItem[];
}
export interface SolutionAdminCreate extends SolutionUpsert {
  kind: SolutionKind;
  status?: "PUBLISHED" | "PENDING_REVIEW";
  evidence_level?: number;
}
export interface AdminSolutionsQuery {
  kind?: SolutionKind; status?: SolutionStatus; q?: string; limit?: number; offset?: number;
}
```

### Nawigacja panelu (ADR-M6-006 — obowiązuje też M2, M3, M5)

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

Reguły ekranów panelu: trasa `/panel/<sekcja>[/:id]` pod `<RequireRole requiredRole="administrator" layout="panel">`; `ModuleLabel` nad `h1`; liczniki przez `useInboxCount` / `refreshInbox()`; filtry list w URL; trzy stany (ładowanie z `aria-busy`, pusto, błąd `Alert` + „Spróbuj ponownie”); najwyżej jeden `ds-btn--cta` na ekran; WCAG 2.1 AA także w `data-contrast="high"`.

---

## Zadania

## PA00 — Backend: schematy, logika zapisu, router

**Zależy od:** —
**Pliki:** `api/schemas.py`, `api/config.py`, `api/main.py` (zmiana, addytywnie), `api/admin_content.py` (nowy), `api/routers/admin_solutions.py` (nowy)

**Cel:** edycja i dodawanie wpisów przez HTTP z natychmiastowym odświeżeniem wyszukiwania — ścieżka krytyczna demo.

**Kontekst:**
- ADR-M6-002: ponowny embedding **synchronicznie**, w tej samej transakcji co zapis. Wzorzec: `create_solution` w `api/routers/solutions.py` (`flush` → `rebuild_chunks` → `commit`, `ProviderError` → `rollback` + 503).
- Przebudowa chunków **tylko gdy zmienił się `content_hash`** (obejmuje `title`, `summary`, `body`). Zmiana samych metadanych (tagi, kroki, media, gmina…) — bez wywołania providera, `reembedded = False`.
- `source_url` ma unikalny indeks częściowy. Kolizja → złap `IntegrityError` przy `flush`, `rollback`, 409 `SOURCE_URL_TAKEN`.
- Logi: `solution_id`, `reembedded`, `chunk_count`. Nigdy wartości pól.
- ADR-M6-001: osobny prefiks `/api/admin/solutions`; publiczne endpointy `/api/solutions` bez zmian.

**Kroki:**
1. `api/config.py`: `ADMIN_LIST_DEFAULT_LIMIT`, `ADMIN_LIST_MAX_LIMIT`.
2. `api/schemas.py`: `SolutionStatusLiteral` (jeśli nie istnieje) i cztery schematy z „Schematów API”.
3. `api/admin_content.py`:
   - Normalizacja: napisy `strip()`, pusty napis w polu opcjonalnym → `None`; `tags` bez pustych i duplikatów (kolejność zachowana); `implementation_steps` bez pustych; `media` → `model_dump()`.
   - Walidacja: gmina spoza `GMINY` → 422 `VALIDATION_ERROR` „gmina: nieznana gmina '…'.”, `powiat = GMINY[gmina]`; `category` spoza `challenge_taxonomy` → 422 (ta sama treść co w `create_solution`; logikę skopiuj, nie zmieniaj `solutions.py`).
   - `save_entry(session, payload, *, solution_id)`: `solution_id is None` → nowy `Solution(kind=payload.kind, origin=CURATED, status=payload.status, evidence_level=payload.evidence_level, contact={}, …)`, zawsze `reembedded = True`. Inaczej `session.get(Solution, id)` (brak → 404), przypisz wszystkie pola, `reembedded = nowy_hash != sol.content_hash`. Ustaw `content_hash`, `updated_at = func.now()`, `flush`, przy `reembedded` → `rebuild_chunks`, `commit`.
   - `to_admin_detail(session, id, *, reembedded=None)`: `load_solutions` + `to_card(row, rank=1)` → `SolutionAdminDetail(**card.model_dump(), status=…, updated_at=…, body=…, chunk_count=<SELECT count(*)>, reembedded=reembedded)`.
4. `api/routers/admin_solutions.py`: cztery endpointy z tabeli. Lista: karty przez `load_solutions` + `to_card` z `rank = offset + i + 1`, dołożone `status` i `updated_at`. Router tylko waliduje i woła `admin_content`.
5. `api/main.py`: rejestracja routera obok pozostałych.

**Gotowe, gdy:**
```bash
ID=$(psql "$DATABASE_URL" -Atc "select id from solutions where status='PUBLISHED' and kind='SOLUTION' limit 1")
curl -s localhost:8000/api/admin/solutions/$ID > /tmp/s.json
jq '.summary = "Sąsiedzkie spotkania seniorów przy kawie w świetlicy wiejskiej, prowadzone przez wolontariuszy."
    | {title, summary, body, organization, gmina, category, tags, target_group, cost_range,
       implementation_steps, source_url, source_name, media}' /tmp/s.json \
  | curl -s -X PUT localhost:8000/api/admin/solutions/$ID -H 'Content-Type: application/json' -d @- \
  | jq '{reembedded, chunk_count}'
```
- → `reembedded: true`; w psql `solution_chunks` wpisu mają nowe `id`. Ten sam PUT ze zmienionymi tylko `tags` → `reembedded: false`, chunki nietknięte.
- `curl -N -X POST localhost:8000/api/chat … -d '{"message":"spotkania seniorów przy kawie w świetlicy"}'` → w `candidates` wpis `$ID` z nowym `summary`.
- `POST` z `{"kind":"KNOWLEDGE","title":"Diagnoza samotności seniorów 2026","summary":"Raport ROPS o skali samotności…","body":"…","category":"LONELINESS"}` → 201, `reembedded: true`; wpis jest w `candidates.context` czatu dla pytania o samotność seniorów, a **nie** w kartach rozwiązań.
- `POST`/`PUT` z `source_url` innego wpisu → 409 `SOURCE_URL_TAKEN`; nieznana gmina → 422 `gmina: …`; nieistniejące id → 404 `{"error": {"code": "NOT_FOUND", …}}`; odpowiedzi nie zawierają klucza `contact`.
- Z `EMBEDDING_PROVIDER=openai` i pustym `OPENAI_API_KEY` zmiana `summary` → 503; w psql treść i chunki bez zmian.
- `curl 'localhost:8000/api/admin/solutions?status=PENDING_REVIEW'` → `total` zgodny z `select count(*) from solutions where status='PENDING_REVIEW'`; `?limit=1000` → 422.

---

## PA01 — Frontend: typy, klient, etykiety

**Zależy od:** —
**Pliki:** `web/src/api/types.ts`, `web/src/api/client.ts`, `web/src/lib/labels.ts` (zmiana, addytywnie)

**Cel:** kontrakt TS dla ekranów M6, gotowy zanim backend skończy.

**Kontekst:** endpointy i typy z „Wspólnych kontraktów”. Klient mapuje błędy `{"error": {"code", "message"}}` na `ApiError` (F01) — ekrany rozróżniają `status` i `code`.

**Kroki:**
1. `types.ts`: typy z „Typów frontendu” (`SolutionStatus` tylko, jeśli nie istnieje).
2. `client.ts` (obiekt `api`): `adminSolutions(q) → Page<SolutionAdminItem>`, `adminSolution(id) → SolutionAdminDetail`, `createAdminSolution(body) → SolutionAdminDetail`, `updateAdminSolution(id, body) → SolutionAdminDetail` (metoda `PUT`). Parametry `undefined` pomijane w query (jak w `api.reports`).
3. `labels.ts`: `SOLUTION_STATUS_LABELS` (Opublikowany, Czeka na zatwierdzenie, Odrzucony, Zarchiwizowany), `KIND_LABELS` (`SOLUTION` „Rozwiązanie”, `KNOWLEDGE` „Wiedza”).

**Gotowe, gdy:** `cd web && npm run lint && npm run build` czysty.

---

## PA02 — Komponent `SolutionForm`

**Zależy od:** PA01
**Pliki:** `web/src/components/panel/SolutionForm.tsx` (nowy)

**Cel:** jeden formularz treści wpisu dla tworzenia i edycji.

**Kontekst:**
- Pola po kolei: tytuł, streszczenie, treść (`textarea`), kroki wdrożenia (lista: „Dodaj krok”, „Usuń”), wyzwanie (`select` z `useTaxonomy`, opcja „— brak —”), gmina (`select` z `useGminy`, opcjonalna), organizacja, grupa docelowa, koszt, tagi (pole tekstowe, przecinki → lista), źródło (nazwa + URL), media (wiersze: typ `video`/`document`/`link`, tytuł, URL; „Dodaj materiał”, „Usuń”).
- Limity przez atrybuty `minLength`/`maxLength` (title 3–200, summary 10–2000, body ≤ 20 000); przyciski „Dodaj” nieaktywne po osiągnięciu limitu listy (kroki 30, media 10).
- Przy tytule, streszczeniu i treści podpowiedź (`ds-hint`): „Zmiana tego pola odświeży wyszukiwanie.”
- Błędy przy polu: `aria-invalid` + `aria-describedby` na komunikat. Ogólny komunikat błędu pokazuje strona (`Alert`).
- Wzorzec list kroków i mediów: `web/src/components/idea/IdeaForm.tsx` (podejście, nie import).
- Stylowanie: Tailwind + `ds-field`, `ds-input`, `ds-select`, `ds-btn`; bez CTA w środku (przycisk zapisu dostarcza strona przez `children`).

**Kroki:**
1. `SolutionFormValues` — stan formularza (napisy, listy; tagi jako jeden napis). `toFormValues(detail: SolutionAdminDetail | null)`, `fromFormValues(values): SolutionUpsert` — pełny obiekt, puste napisy w polach opcjonalnych jako `null`, tagi rozbite po przecinku i przycięte.
2. Props: `values`, `onChange`, `errors: Record<string, string>`, `disabled`, `children` (stopka z przyciskami).
3. `fieldErrorFromApi(err)` — 422 z `message` w formie `"<pole>: …"` → `{ [pole]: message }`; 409 `SOURCE_URL_TAKEN` → `{ source_url: message }`.

**Gotowe, gdy:** `npm run lint && npm run build` czysty; w PA03 klawiatura przechodzi wszystkie pola i przyciski list w logicznej kolejności, „Dodaj krok” przenosi fokus do nowego pola.

---

## PA03 — Ekran edycji i dodawania `/panel/wiedza/:id`, `/panel/wiedza/nowy`

**Zależy od:** PA00, PA02
**Pliki:** `web/src/pages/panel/KnowledgeEditPage.tsx` (nowy), `web/src/App.tsx` (trasy), `web/src/pages/panel/SolutionReviewPage.tsx` (link)

**Cel:** scenariusz demo S1 (poprawka treści widoczna w czacie) i S2 (dodanie wpisu „Wiedza”).

**Kontekst:**
- Jedna strona, dwa tryby: `id === "nowy"` → tworzenie, inaczej edycja.
- Edycja: `ModuleLabel` „Panel administratora”, `h1` = tytuł wpisu, pod nim rodzaj (`KIND_LABELS`), status (`SOLUTION_STATUS_LABELS`), „Ostatnia zmiana: …” (`updated_at`, format z `lib/format.ts`). Linki: „Zobacz publicznie” → `/rozwiazania/:id` (tylko `PUBLISHED`), „Decyzja o publikacji” → `/panel/rozwiazania/:id`. CTA `ds-btn--cta` „Zapisz zmiany” → `api.updateAdminSolution(id, fromFormValues(values))`.
- Tworzenie: `h1` „Dodaj wpis”; nad formularzem `fieldset` z radio rodzaju (Rozwiązanie / Wiedza — raport lub materiał) i radio statusu („Opublikuj od razu” / „Zapisz do zatwierdzenia”). CTA „Dodaj” → `api.createAdminSolution(...)` → `navigate('/panel/wiedza/' + id, { state: { message } })`; dla `PENDING_REVIEW` także `refreshInbox()`. Strona edycji pokazuje komunikat ze stanu nawigacji, jeśli jest.
- Komunikaty (`Alert`, fokus na komunikacie):
  - sukces z `reembedded` → „Zapisano. Wyszukiwanie zaktualizowane ({chunk_count} fragmentów).” (po dodaniu: „Dodano wpis. Wyszukiwanie zaktualizowane.”)
  - sukces bez `reembedded` → „Zapisano zmiany w opisie wpisu.”
  - 422 / 409 → `fieldErrorFromApi` + `Alert` „Popraw zaznaczone pola.”
  - 503 → „Nie udało się odświeżyć wyszukiwania, zmiany nie zostały zapisane. Spróbuj za chwilę.” — formularz zachowany.
- Po udanym zapisie stan formularza = odpowiedź.
- `SolutionReviewPage`: link `ds-btn` „Edytuj treść” → `/panel/wiedza/:id` obok `ReviewActions` (nie CTA).
- Stany: ładowanie, 404 („Nie znaleziono wpisu.” + link do `/panel/wiedza`), błąd.

**Kroki:**
1. Trasa `wiedza/:id` w `App.tsx` w bloku `RequireRole requiredRole="administrator" layout="panel"` (obsługuje też `nowy`).
2. Strona jak wyżej; `useDocumentTitle` „Edycja: {title}” albo „Dodaj wpis”.
3. Link w `SolutionReviewPage`.

**Gotowe, gdy:**
- S1 w przeglądarce: czat → zapytanie → zapamiętaj kartę → `/panel/rozwiazania/:id` → „Edytuj treść” → zmiana streszczenia → „Zapisz zmiany” → komunikat z liczbą fragmentów → to samo zapytanie w czacie pokazuje nowe streszczenie. Zmiana tylko tagów → „Zapisano zmiany w opisie wpisu.”
- S2: `/panel/wiedza/nowy` → wpis „Wiedza” → przekierowanie na edycję z komunikatem → wpis w `candidates.context` czatu, nie w kartach rozwiązań.
- Lista kontrolna dostępności z `frontend-tasks.md` OK, także w `data-contrast="high"`.

---

## PA04 — „Baza wiedzy” i nawigacja panelu

**Zależy od:** PA03
**Pliki:** `web/src/pages/panel/KnowledgeBasePage.tsx` (nowy), `web/src/App.tsx` (trasa), `web/src/components/layout/PanelLayout.tsx` (pozycja i kolejność)

**Cel:** przegląd całej bazy (wszystkie statusy) — scenariusz S3; kolejność nawigacji z „Nawigacji panelu”.

**Kontekst:**
- `/panel/wiedza`: `ModuleLabel`, `h1` „Baza wiedzy”. Filtry w URL: rodzaj (Wszystkie / Rozwiązania / Wiedza), status (Wszystkie + 4), fraza (`q`, pole z przyciskiem „Szukaj”). Tabela (`ds-table` albo lista kart z F15 jako wzór): tytuł (link do `/panel/wiedza/:id`), rodzaj, status, ostatnia zmiana. `Pagination`. CTA `ds-btn--cta` „Dodaj wpis” → `/panel/wiedza/nowy`.
- `PanelLayout`: dodaj „Baza wiedzy” → `/panel/wiedza` i ustaw kolejność z tabeli. Miejsca dla M3/M5 oznacz komentarzami `{/* M3: Pomysły (K07) */}`, `{/* M5: Rozmowy (PK20) */}`.

**Kroki:** trasa `wiedza` (przed `wiedza/:id`) w `App.tsx`; strona; zmiana `PanelLayout`.

**Gotowe, gdy:**
- S3: wpis z „Mam pomysł” (`PENDING_REVIEW`) widoczny na liście z filtrem statusu → edycja literówek → publikacja w `/panel/rozwiazania/:id`.
- Filtry przeżywają odświeżenie strony; nawigacja panelu w kolejności z tabeli; jeden CTA na ekran; lista kontrolna dostępności OK.
- Próba demo: S1–S3 na świeżej bazie (`make reset-db && make ingest`) z `EMBEDDING_PROVIDER` jak na demo, bez błędów w konsoli. Wynik (i czas zapisu z re-embeddingiem) — jedna linia w „Uwagach”.

---

## PA05 — (opcjonalne) `knowledge_type` w panelu

**Zależy od:** PA04, Z00 (Moduł 2)
**Pliki:** `api/schemas.py`, `api/admin_content.py`, `api/routers/admin_solutions.py`, `web/src/api/types.ts`, `web/src/components/panel/SolutionForm.tsx`, `web/src/pages/panel/KnowledgeEditPage.tsx`, `web/src/pages/panel/KnowledgeBasePage.tsx`, `web/src/lib/labels.ts`

Bierz tylko, jeśli Z00 jest `[x]` i zostaje czas. Bez tego panel działa — wpisy `KNOWLEDGE` po prostu nie rozróżniają raportu od materiału.

**Cel:** raporty i materiały (ADR-M2-001) rozróżnialne w panelu.

**Kontekst:**
- Z00 dodaje `solutions.knowledge_type` (`REPORT` / `MATERIAL`) z CHECK `(kind = 'KNOWLEDGE') = (knowledge_type IS NOT NULL)` i pole `SolutionCard.knowledge_type` — `SolutionAdminItem` dziedziczy je automatycznie.
- `SolutionUpsert.knowledge_type: Literal["REPORT", "MATERIAL"] | None = None`. Walidacja w `admin_content`: `KNOWLEDGE` wymaga typu, `SOLUTION` musi mieć `None` → inaczej 422 „knowledge_type: …”. Zmiana typu nie wymaga re-embeddingu.
- Frontend: w trybie tworzenia rodzaj jako trzy opcje (Rozwiązanie / Raport lub diagnoza / Materiał); w edycji `select` typu wiedzy tylko dla `KNOWLEDGE`; filtr listy rozszerzony o Raporty / Materiały (`knowledge_type` w query); `KNOWLEDGE_TYPE_LABELS` z `labels.ts` (reużyj, jeśli Z06 je dodał).

**Gotowe, gdy:** `POST` `KNOWLEDGE` bez `knowledge_type` → 422, z `REPORT` → 201; `PUT` `REPORT` → `MATERIAL` → `reembedded: false`; w UI tworzenie raportu i filtr listy działają.

---

## Uwagi między zadaniami

Format: `- [PAxx → PAyy] <opis> — <agent>, <data>`. Dopisuj tylko na końcu, nie edytuj cudzych wpisów.

- [ORCH] Pliki współdzielone z innymi modułami: `web/src/App.tsx` i `web/src/components/layout/PanelLayout.tsx` zmieniają też M3 (K07) i M5 (PK20); `api/schemas.py`, `api/config.py` — M2 (Z00). Zmiany M6 są addytywne; przy konflikcie scalaj, nie nadpisuj cudzych linii. — plan, 2026-10-04
- [ORCH] Plan odchudzony pod hackathon (zakres w „Odstępstwach”): bez historii zmian, `edited_at`, ochrony przed ingestem i optymistycznej blokady; PUT zamiast PATCH; 6 zadań zamiast 12. Specyfikacja HTML v0.2 nadal opisuje pełną wersję — przy sprzeczności wygrywa ten plik. `source_url` edytowalny (kolizja → 409 z `IntegrityError`); ponowny ingest nadpisze edycje z panelu — nie odpalać `make ingest` po przygotowaniu danych do demo. — plan, 2026-10-04
- [PA00 → PA05] Z00 jest `[x]`, a `db/init.sql` ma CHECK `solutions_knowledge_type_ck` — `POST` wpisu `KNOWLEDGE` bez `knowledge_type` łamie constraint. Dlatego `knowledge_type` (z PA05) wchodzi od razu do `SolutionUpsert`, `admin_content` (walidacja 422 „knowledge_type: …”, zmiana typu bez re-embeddingu), typów TS i formularza; PA05 domykamy razem z PA03/PA04. — claude, 2026-10-04
- [PA00] 2026-10-04: baza w dockerze była sprzed Z00 (brak `solutions.knowledge_type`, tabel M2/M4/M5) — po przebudowie obrazu api każde zapytanie o rozwiązania dawało 500. Zrobione `make reset-db` + ingest (solutions, knowledge) + `seed_reports --purge`, `seed_innovation_tests`, `seed_comm`. Uwaga: `seed_innovation_tests` przed ingestem tworzy wpis „Klub seniora w sąsiedztwie” (id 1) bez chunków — kolejność: najpierw ingest. `api/main.py`: dodany `PUT` do CORS `allow_methods`. Filtr listy `knowledge_type` działa też bez `kind`. — claude, 2026-10-04
