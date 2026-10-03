# Moduł 2 — Zasobnik wiedzy: plan implementacji i zadania

Plan na podstawie `docs/modules/02-zasobnik-wiedzy/module-2-zasobnik-wiedzy.html` (v0.4) i researchu źródeł `docs/modules/02-zasobnik-wiedzy/rops-zasoby-kontekst.md`. Kolejność prac, stan i ryzyka: `docs/modules/02-zasobnik-wiedzy/implementation-plan.md`. Każde zadanie jest samowystarczalne: zawiera cel, pliki, wklejony kontekst ze specyfikacji, kroki i kryterium gotowości. Agent wykonujący zadanie **nie musi czytać specyfikacji HTML** — ale musi przeczytać `AGENTS.md` (twarde reguły) oraz sekcję „Wspólne kontrakty” poniżej.

**Odstępstwa od specyfikacji (decyzja zespołu, 2026-10-03, jak w Module 1):**
- **Bez autoryzacji.** Wszystkie endpointy są otwarte; bez tokenów, nagłówków dostępu i kodów 401/403. Panel trendów jest ukryty w UI za rolą administratora (frontendowe logowanie demo, `docs/changes/feature-2026-10-03-1`).
- **Bez testów automatycznych.** Weryfikacja każdego zadania: curl, psql, `python -c`, ręczne uruchomienie w przeglądarce (frontend).

## Protokół pracy (obowiązkowy)

1. **Jedyne źródło statusu** to lista „Status zadań” poniżej. Treść zadań nie zawiera statusu.
2. Stany:
   - `- [ ]` — wolne,
   - `- [~]` — w toku; dopisz na końcu linii ` — agent: <nazwa>, <RRRR-MM-DD GG:MM>`,
   - `- [x]` — zrobione; zamień dopisek na ` — zrobione: <nazwa>, <krótka notka lub hash commita>`.
3. **Branie zadania:** wybierz zadanie `[ ]`, którego wszystkie zależności są `[x]`. Edytuj tylko jego linię na `[~]`, potem przeczytaj plik ponownie i sprawdź, czy linia nadal ma Twój dopisek (jeśli ktoś był szybszy — weź inne zadanie).
4. Edytuj w tym pliku **wyłącznie linię swojego zadania** oraz (ewentualnie) dopisuj na końcu sekcji „Uwagi między zadaniami”. Nie przepisuj innych linii, nie formatuj pliku.
5. Zmieniaj w repozytorium **tylko pliki wymienione w polu „Pliki” swojego zadania**. Potrzebujesz zmiany w cudzym pliku → wpis w „Uwagach między zadaniami” (`- [Zxx → Zyy] opis`), nie edycja. Zmiana w plikach Modułu 1 poza listą „Pliki” → wpis w „Uwagach” `docs/modules/01-matchmaking/module-1-tasks.md`.
6. `[x]` dopiero, gdy spełnione jest „Gotowe, gdy” (ręczna weryfikacja opisana w zadaniu) i `ruff check .` (backend) albo `npm run lint && npm run build` w `web/` (frontend) jest czysty dla Twoich plików.
7. Zablokowany (brak klucza API, IOSS niedostępny, błąd w zależności, sprzeczność ze specyfikacją) → przywróć `[ ]` i opisz przyczynę w „Uwagach między zadaniami”.
8. Sygnatury z sekcji „Wspólne kontrakty” są wiążące. Jeśli musisz je zmienić — najpierw wpis w „Uwagach”, nie cicha zmiana.

## Status zadań

Identyfikatory: `Z00`, `Z01`, … (prefiks modułu, żeby nie kolidować z `T` Modułu 1 i `F` frontendu).

<!-- Format linii: - [ ] Z00 · Opis · zależy: — / Zxx, T.., F.. -->

- [ ] Z00 · Schemat i kontrakty: `init.sql`, modele ORM, modele pydantic, `SolutionCard.knowledge_type`, ustawienia · zależy: —
- [ ] Z01 · Skrypt `scripts/fetch_ioss.py` → `data/knowledge/indicators.json` (wskaźniki IOSS dla 22 powiatów) · zależy: —
- [ ] Z02 · Treści: `data/knowledge/challenges.json` (8 profili) i `data/knowledge/records/wiedza.json` (raporty, materiały) · zależy: —
- [ ] Z03 · Ingest wiedzy: `knowledge_type` w `scripts/ingest.py`, `scripts/ingest_knowledge.py`, `make ingest-knowledge` · zależy: Z00
- [ ] Z04 · API wiedzy: `api/routers/knowledge.py` + filtr `knowledge_type` w `/api/solutions` · zależy: Z00
- [ ] Z05 · API statystyk: `by_powiat`, filtr `powiat`, `GET /api/stats/coverage` · zależy: Z00
- [ ] Z06 · Frontend: typy, klient, trasy i strony-zaślepki · zależy: Z04, Z05, Z12
- [ ] Z07 · Strona wyzwania `/wiedza/wyzwania/:code` (bez mapy) · zależy: Z06
- [ ] Z08 · Przegląd `/wiedza` i lista `/wiedza/materialy` · zależy: Z06, Z13
- [ ] Z09 · Panel trendów: zgłoszenia w czasie, powiaty, „Zgłoszenia a biblioteka” · zależy: Z06
- [ ] Z10 · `PowiatTileMap` (mapa kafelkowa) na `/wiedza` i stronie wyzwania, wspólny nagłówek na stronie wyzwania · zależy: Z07, Z08, Z13
- [ ] Z12 · API Biblioteki: filtr `has_video`, `GET /api/solutions/facets` · zależy: Z00, Z04
- [ ] Z13 · Biblioteka `/rozwiazania`, nowa karta `SolutionCard`, podnawigacja i `ZasobnikHeader` · zależy: Z06, Z12
- [ ] Z14 · Strona innowacji `/rozwiazania/:id` · zależy: Z13
- [ ] Z11 · Dane w bazie, scenariusze S1–S4, dostępność, README · zależy: Z01, Z02, Z03, Z07, Z08, Z09, Z10, Z13, Z14

### Fale równoległości (orientacyjnie)

1. **Fala 1:** Z00, Z01, Z02 (niezależne — schemat, scraper, treści).
2. **Fala 2:** Z03, Z04, Z05 (po Z00; różne pliki), potem Z12 (po Z04 — ten sam `solutions.py`).
3. **Fala 3:** Z06.
4. **Fala 4:** Z07, Z09, Z13 (różne strony).
5. **Fala 5:** Z08, Z14 (po Z13).
6. **Fala 6:** Z10, potem Z11.

**Najkrótsza działająca ścieżka** (gdy brakuje czasu): Z00 → Z02 + Z03 → Z04 → Z12 → Z06 → Z07 → (Z11 w okrojonym zakresie: scenariusz S1 bez mapy). Strona wyzwania z faktami, raportami, filmami innowacji i materiałami jest pokazywalna sama w sobie.

---

## Wspólne kontrakty (wiążące dla wszystkich zadań)

### Konwencje

- Konwencje Modułu 1 obowiązują bez zmian (`docs/modules/01-matchmaking/module-1-tasks.md`, „Wspólne kontrakty → Konwencje”): pakiety `api.*`, importy absolutne, async przy I/O, dane w `data/`, ustawienia w `api.config.settings` (zero literałów progów i limitów w kodzie).
- Frontend: konwencje z `docs/modules/01-matchmaking/frontend-tasks.md` (klient `web/src/api/client.ts`, `useApi`, `LoadState`, `Alert`, `SolutionCard`, `VideoEmbed`, `BarList`). **Stylowanie wyłącznie Tailwindem** z presetu design systemu + klasy `ds-*` — bez nowych plików CSS i bez `style={{…}}` (`AGENTS.md`, „Stylowanie: Tailwind, bez własnego CSS”). Wzorzec: `web/src/pages/LoginPage.tsx`.
- Teksty dla użytkownika po polsku; `message_pl` błędów API po polsku.
- Reguła ADR-011 bez zmian: `kind = KNOWLEDGE` nigdy nie trafia do kart rozwiązań czatu, streszczenia, cytowań ani `reports.matched`. Na stronach Zasobnika karty `KNOWLEDGE` są dozwolone (tak działa już `/wiedza`).

### Zależności od Modułu 1 i frontendu

| Reużywamy bez zmian | Zmieniamy (addytywnie, ADR) |
|---|---|
| Tabela `challenge_taxonomy` (8 wyzwań + `OTHER`, kolumny `code`, `label_pl`, `description`, `sort_order`) | `solutions.knowledge_type` + CHECK (ADR-M2-001) — Z00 |
| `scripts/ingest.py` (chunking, embeddingi, idempotencja po `source_url`, obsługuje już `kind: "KNOWLEDGE"`) | `IngestRecord.knowledge_type` — Z03 |
| `api/cards.py` (`to_card`, `to_detail`) — jeden kształt `SolutionCard` | `SolutionCard.knowledge_type` (pole w `api/schemas.py`, wypełniane w `_card_fields`) — Z00 |
| `GET /api/solutions`, `GET /api/solutions/{id}`, `GET /api/reports?category=&matched=` | `GET /api/solutions?knowledge_type=` — Z04 |
| `data/gminy-malopolska.json` (22 powiaty), `reports.powiat` (wypełniany przy zapisie zgłoszenia) | `GET /api/stats`: `by_powiat` + filtr `powiat`; nowy `GET /api/stats/coverage` (ADR-M2-005) — Z05 |
| `GET /api/solutions?tag=` (grupy ROPS „dla kogo” to tagi `ROPS: …` — każda z 115 innowacji ma dokładnie jedną) | `GET /api/solutions?has_video=`, `GET /api/solutions/facets` (ADR-M2-008) — Z12 |
| Frontend: `VideoEmbed`, `BarList`, `LoadState`, `Alert`, `ModuleLabel`, `Pagination`, `EmptyState`, `useApi`, `useTaxonomy` | `SolutionCard.tsx` (nowy wygląd, wspólny z czatem i panelem — Z13), `LibraryPage.tsx`, `SolutionPage.tsx`, `KnowledgePage.tsx`, `ZasobnikNav.tsx`, `TrendsPage.tsx`, `App.tsx` (trasy) |

### Lista 22 powiatów (nazwy wiążące, jak w `data/gminy-malopolska.json`)

`Kraków`, `Nowy Sącz`, `Tarnów`, `bocheński`, `brzeski`, `chrzanowski`, `dąbrowski`, `gorlicki`, `krakowski`, `limanowski`, `miechowski`, `myślenicki`, `nowosądecki`, `nowotarski`, `olkuski`, `oświęcimski`, `proszowicki`, `suski`, `tarnowski`, `tatrzański`, `wadowicki`, `wielicki`.

Lista w kodzie zawsze z `data/gminy-malopolska.json` (`sorted({g["powiat"] for g in ...})`), nie przepisywana literałem.

### Formaty plików `data/knowledge/`

**`data/knowledge/indicators.json`** (generuje Z01, ładuje Z03):
```json
[
  {
    "code": "IOSS_285",
    "category": "AGING",
    "label_pl": "Odsetek osób w wieku 65 lat i więcej",
    "unit": "%",
    "year": 2024,
    "higher_is_worse": true,
    "region_value": 20.4,
    "source_name": "IOSS ROPS Kraków (GUS BDL)",
    "source_url": "https://obserwator.rops.krakow.pl/differenceanalysis/285",
    "is_demo": false,
    "sort_order": 10,
    "values": { "Kraków": 19.89, "Tarnów": 24.83, "olkuski": 23.56, "...": 0 }
  }
]
```
`values` — dokładnie 22 klucze z listy powiatów. `region_value` — wartość dla województwa podana w IOSS albo `null` (nie liczymy średniej).

**`data/knowledge/challenges.json`** (pisze Z02, ładuje Z03):
```json
[
  {
    "category": "AGING",
    "lead_pl": "Małopolska starzeje się szybciej niż …",
    "key_facts": [
      { "label_pl": "osób w wieku 60+ w województwie", "value": "841 541", "unit": null, "year": 2024,
        "source_name": "ROPS Kraków, Ocena zasobów pomocy społecznej za 2024 r.",
        "source_url": "https://rops.krakow.pl/mpliki/PS/BA/Raport_OZPS_za_rok_2024.pdf" }
    ],
    "is_demo": false
  }
]
```
Dokładnie 8 wpisów (wszystkie kody taksonomii poza `OTHER`). `value` to tekst do wyświetlenia (z formatowaniem tysięcy), nie liczba.

**`data/knowledge/records/wiedza.json`** (pisze Z02, ładuje `scripts/ingest.py`): lista rekordów w formacie `IngestRecord` Modułu 1 z polami: `kind: "KNOWLEDGE"`, `knowledge_type: "REPORT" | "MATERIAL"`, `title`, `summary` (2–3 zdania, nasze), `body` (nasze streszczenie, 1–3 akapity — źródło dla embeddingów i czatu), `category` (wymagana dla `REPORT`; `null` = materiał ogólny), `source_url` (wymagany — klucz idempotencji), `source_name`, `organization`, `media` (`[{ "type": "youtube", "url": "…", "title": "…" }]` dla podcastu), `evidence_level: 1`, `tags`.

### SQL (Z00 dopisuje do `db/init.sql`)

```sql
CREATE TYPE knowledge_type AS ENUM ('REPORT', 'MATERIAL');
-- w CREATE TABLE solutions, po kolumnie kind:
--   knowledge_type knowledge_type,
-- i ograniczenie tabeli:
--   CONSTRAINT solutions_knowledge_type_ck CHECK ((kind = 'KNOWLEDGE') = (knowledge_type IS NOT NULL))

CREATE TABLE challenge_profiles (
    category   TEXT PRIMARY KEY REFERENCES challenge_taxonomy(code),
    lead_pl    TEXT        NOT NULL,
    key_facts  JSONB       NOT NULL DEFAULT '[]',
    is_demo    BOOLEAN     NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE indicators (
    code            TEXT PRIMARY KEY,
    category        TEXT        NOT NULL REFERENCES challenge_taxonomy(code),
    label_pl        TEXT        NOT NULL,
    unit            TEXT        NOT NULL,
    year            SMALLINT    NOT NULL,
    higher_is_worse BOOLEAN     NOT NULL DEFAULT TRUE,
    region_value    NUMERIC,
    source_name     TEXT        NOT NULL,
    source_url      TEXT,
    is_demo         BOOLEAN     NOT NULL DEFAULT TRUE,
    sort_order      INT         NOT NULL DEFAULT 100,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX indicators_category_idx ON indicators (category, sort_order);

CREATE TABLE indicator_values (
    indicator_code TEXT    NOT NULL REFERENCES indicators(code) ON DELETE CASCADE,
    powiat         TEXT    NOT NULL,
    value          NUMERIC NOT NULL,
    PRIMARY KEY (indicator_code, powiat)
);
```

### Ustawienia (`api/config.py`, `.env.example`) — Z00

| Zmienna | Domyślnie | Używa |
|---|---|---|
| `CHALLENGE_TOP_SOLUTIONS` | 6 | Z04 — rozwiązania w „Co już działa” |
| `CHALLENGE_TOP_KNOWLEDGE` | 6 | Z04 — limit raportów i osobno materiałów na stronie wyzwania |
| `COVERAGE_GAP_MIN_UNMATCHED` | 3 | Z05 — minimum niedopasowanych zgłoszeń dla luki |
| `COVERAGE_GAP_MAX_SOLUTIONS` | 5 | Z05 — poniżej tylu opublikowanych rozwiązań wyzwanie może być luką |
| `ROPS_GROUP_TAG_PREFIX` | `"ROPS: "` | Z12 — prefiks tagu grupy ROPS „dla kogo” |

Frontend: `KNOWLEDGE_PREVIEW_LIMIT = 4` (Z08), `MAP_SCALE_STEPS = 4` (Z10), `PAGE_SIZE = 24` i `FILM_STRIP_LIMIT = 6` (Z13), `SIMILAR_LIMIT = 3` (Z14) jako stałe w module strony/komponentu.

### Modele pydantic (`api/schemas.py`) — Z00, wiążące dla Z04, Z05, Z06

```python
KnowledgeTypeLiteral = Literal["REPORT", "MATERIAL"]

# SolutionCard — nowe pole (addytywnie, domyślnie None):
#   knowledge_type: KnowledgeTypeLiteral | None = None

class KeyFact(BaseModel):
    label_pl: str
    value: str
    unit: str | None = None
    year: int | None = None
    source_name: str
    source_url: str | None = None

class ChallengeSummary(BaseModel):
    code: str
    label_pl: str
    lead_pl: str | None            # None, gdy brak profilu
    key_fact: KeyFact | None       # pierwszy z key_facts
    solutions_count: int           # PUBLISHED SOLUTION w kategorii
    knowledge_count: int           # PUBLISHED KNOWLEDGE w kategorii
    is_demo: bool                  # False, gdy brak profilu
    updated_at: datetime | None

class IndicatorMeta(BaseModel):
    code: str
    category: str
    label_pl: str
    unit: str
    year: int
    higher_is_worse: bool
    region_value: float | None
    source_name: str
    source_url: str | None
    is_demo: bool

class IndicatorValue(BaseModel):
    powiat: str
    value: float

class IndicatorDetail(IndicatorMeta):
    values: list[IndicatorValue]   # 22 pozycje, alfabetycznie po powiat

class ChallengeDetail(ChallengeSummary):
    key_facts: list[KeyFact]
    indicators: list[IndicatorMeta]  # kategorii, wg sort_order, code
    reports: list[SolutionCard]      # KNOWLEDGE/REPORT
    materials: list[SolutionCard]    # KNOWLEDGE/MATERIAL tej kategorii
    solutions: list[SolutionCard]    # SOLUTION; evidence_level DESC, z filmem pierwsze, id ASC

class StatsByPowiat(BaseModel):
    powiat: str | None
    total: int
    matched: int
    unmatched: int

# Stats — nowe pole (addytywnie): by_powiat: list[StatsByPowiat]

class CoverageRow(BaseModel):
    category: str
    label_pl: str
    reports_total: int
    reports_unmatched: int
    solutions_published: int
    knowledge_published: int
    is_gap: bool

class FacetGroup(BaseModel):
    tag: str            # pełny tag, np. "ROPS: Dla seniorów"
    label_pl: str       # tag bez prefiksu, np. "Dla seniorów"
    count: int

class FacetCategory(BaseModel):
    code: str
    label_pl: str
    count: int

class SolutionFacets(BaseModel):
    total: int
    with_video: int
    groups: list[FacetGroup]          # count DESC, tag ASC
    categories: list[FacetCategory]   # tylko count > 0, wg challenge_taxonomy.sort_order
```

### Endpointy (wiążące)

| Metoda i ścieżka | Odpowiedź | Zadanie |
|---|---|---|
| `GET /api/challenges` | `list[ChallengeSummary]` — 8 wyzwań wg `challenge_taxonomy.sort_order`, bez `OTHER` | Z04 |
| `GET /api/challenges/{code}` | `ChallengeDetail`; 404 `NOT_FOUND` dla nieznanego kodu i dla `OTHER` | Z04 |
| `GET /api/indicators?category=` | `list[IndicatorMeta]` wg `sort_order, code` | Z04 |
| `GET /api/indicators/{code}` | `IndicatorDetail`; 404 `NOT_FOUND` | Z04 |
| `GET /api/solutions?knowledge_type=` | jak dziś; filtr tylko z `kind=KNOWLEDGE`, inaczej 422 `VALIDATION_ERROR` | Z04 |
| `GET /api/solutions?has_video=true` | jak dziś; tylko pozycje, których `media` zawiera element `type = "video"` | Z12 |
| `GET /api/solutions/facets?kind=SOLUTION` | `SolutionFacets` (tylko `PUBLISHED`) | Z12 |
| `GET /api/stats?powiat=` | `Stats` z `by_powiat` (sortowanie: `total DESC, powiat ASC`) | Z05 |
| `GET /api/stats/coverage?from=&to=` | `list[CoverageRow]`, sortowanie `is_gap DESC, reports_unmatched DESC, category ASC`; zakres dat jak w `/api/stats` | Z05 |

Wszystkie odpowiedzi tylko `PUBLISHED` (rozwiązania i wiedza). Błędy przez `ApiError` z `message_pl`.

### Typy i klient frontendu — Z06, wiążące dla Z07–Z10

```ts
// web/src/api/types.ts
export type KnowledgeType = "REPORT" | "MATERIAL";
// SolutionCard: + knowledge_type: KnowledgeType | null;
export interface KeyFact { label_pl: string; value: string; unit: string | null; year: number | null; source_name: string; source_url: string | null; }
export interface ChallengeSummary { code: string; label_pl: string; lead_pl: string | null; key_fact: KeyFact | null; solutions_count: number; knowledge_count: number; is_demo: boolean; updated_at: string | null; }
export interface IndicatorMeta { code: string; category: string; label_pl: string; unit: string; year: number; higher_is_worse: boolean; region_value: number | null; source_name: string; source_url: string | null; is_demo: boolean; }
export interface IndicatorDetail extends IndicatorMeta { values: { powiat: string; value: number }[]; }
export interface ChallengeDetail extends ChallengeSummary { key_facts: KeyFact[]; indicators: IndicatorMeta[]; reports: SolutionCard[]; materials: SolutionCard[]; solutions: SolutionCard[]; }
export interface CoverageRow { category: string; label_pl: string; reports_total: number; reports_unmatched: number; solutions_published: number; knowledge_published: number; is_gap: boolean; }
// Stats: + by_powiat: (Counts & { powiat: string | null })[];
export interface SolutionFacets { total: number; with_video: number; groups: { tag: string; label_pl: string; count: number }[]; categories: { code: string; label_pl: string; count: number }[]; }

// web/src/api/client.ts — w obiekcie api:
challenges: () => request<ChallengeSummary[]>("GET", "/api/challenges"),
challenge: (code: string) => request<ChallengeDetail>("GET", `/api/challenges/${encodeURIComponent(code)}`),
indicators: (q?: Query) => request<IndicatorMeta[]>("GET", "/api/indicators", { query: q }),
indicator: (code: string) => request<IndicatorDetail>("GET", `/api/indicators/${encodeURIComponent(code)}`),
coverage: (q?: Query) => request<CoverageRow[]>("GET", "/api/stats/coverage", { query: q }),
solutionFacets: (q?: Query) => request<SolutionFacets>("GET", "/api/solutions/facets", { query: q }),
```

### Trasy i komponenty frontendu

| Trasa | Komponent | Właściciel |
|---|---|---|
| `/wiedza` | `pages/KnowledgePage.tsx` (przebudowa) | Z08 |
| `/wiedza/wyzwania/:code` | `pages/ChallengePage.tsx` (nowy) | Z06 zaślepka → Z07 |
| `/wiedza/materialy` | `pages/MaterialsPage.tsx` (nowy) | Z06 zaślepka → Z08 |
| `/panel/trendy` | `pages/panel/TrendsPage.tsx` | Z09 |
| — | `components/knowledge/KeyFacts.tsx` (fakty ze źródłami, znacznik „Dane przykładowe”) | Z07 (używa też Z08) |
| — | `components/knowledge/PowiatTileMap.tsx`, `lib/powiatTiles.ts` | Z10 |
| — | `components/layout/ZasobnikHeader.tsx` (etykieta modułu, `h1`, lead, opcjonalny pasek liczb, podnawigacja) | Z13 (używają Z08, Z10, Z14) |
| — | `lib/ropsGroups.ts`: `ropsGroup(tags): RopsGroup \| null`, `RopsGroup = { tag, label, softClass, icon }` — 9 grup, kolor tła `bg-soft-*`, ikona konturowa | Z13 (używa Z14) |

**Znacznik danych przykładowych** (wspólny dla Z07, Z08, Z10): gdy `is_demo === true`, obok faktu/mapy tekst „Dane przykładowe” w `ds-tag` — nigdy sam kolor.

---

## Zadania

### Z00 · Schemat i kontrakty

**Cel:** baza, ORM, pydantic i ustawienia gotowe dla wszystkich pozostałych zadań backendu.
**Zależy od:** —
**Pliki:** `db/init.sql`, `api/models.py`, `api/schemas.py`, `api/cards.py`, `api/config.py`, `.env.example`, `docs/modules/01-matchmaking/module-1-tasks.md` (tylko dopisek w „Uwagach między zadaniami”)

**Kontekst ze specyfikacji:**
- ADR-M2-001: wiedza to `solutions` z `kind = KNOWLEDGE` i nową kolumną `knowledge_type` (`REPORT` / `MATERIAL`); `NULL` dla `SOLUTION`. Zmiana addytywna — stare klienty działają.
- `db/init.sql` to jedyny plik schematu (bez migracji). Istniejąca baza wymaga resetu albo ręcznego `ALTER`.

**Kroki:**
1. `db/init.sql`: typ `knowledge_type`, kolumna i CHECK w `solutions`, tabele `challenge_profiles`, `indicators`, `indicator_values`, indeks — dokładnie wg „Wspólne kontrakty → SQL”. Tabele po `challenge_taxonomy` (klucze obce).
2. `api/models.py`: enum `KnowledgeType`, pole `Solution.knowledge_type` (nullable, `_pg_enum(KnowledgeType, "knowledge_type")`), modele `ChallengeProfile`, `Indicator`, `IndicatorValueRow` (nazwa klasy bez kolizji z pydantic `IndicatorValue`).
3. `api/schemas.py`: wszystkie modele z „Wspólne kontrakty → Modele pydantic” (także `SolutionFacets`), pole `SolutionCard.knowledge_type`, pole `Stats.by_powiat` (z domyślną pustą listą, żeby `staff.py` działał przed Z05).
4. `api/cards.py`: `_card_fields` wypełnia `knowledge_type` (wartość enuma albo `None`).
5. `api/config.py` i `.env.example`: pięć zmiennych z tabeli ustawień, z komentarzem `# --- Moduł 2: Zasobnik wiedzy ---`.
6. Dopisek w „Uwagach między zadaniami” Modułu 1: `- [Z00 → M1] solutions.knowledge_type, SolutionCard.knowledge_type, Stats.by_powiat — addytywnie, ADR-M2-001 / ADR-M2-005 (docs/modules/02-zasobnik-wiedzy).`
7. Instrukcja dla istniejącej bazy (do „Uwag” tego pliku): `make reset-db` albo odpowiednie `ALTER TABLE … ADD COLUMN` + `CREATE TABLE`.

**Gotowe, gdy:**
- Na świeżej bazie (`make reset-db && make ingest`): `psql -c "\d solutions"` pokazuje `knowledge_type` i ograniczenie `solutions_knowledge_type_ck`; `\dt` pokazuje 3 nowe tabele.
- `psql -c "INSERT INTO solutions (kind, title, summary, content_hash) VALUES ('KNOWLEDGE','t','s','x')"` kończy się błędem CHECK.
- `curl -s localhost:8000/api/solutions?limit=1 | python -c "import json,sys; print(json.load(sys.stdin)['items'][0]['knowledge_type'])"` → `None`.
- `curl -s localhost:8000/api/stats | python -c "import json,sys; print(json.load(sys.stdin)['by_powiat'])"` → `[]` (wypełni Z05).
- `ruff check .` czysty.

### Z01 · Skrypt `scripts/fetch_ioss.py` → `indicators.json`

**Cel:** powtarzalne pobranie wskaźników z IOSS dla 22 powiatów do pliku w repo (ADR-M2-007).
**Zależy od:** —
**Pliki:** `scripts/fetch_ioss.py` (nowy), `data/knowledge/ioss-indicators.yaml` albo `.json` (nowy — lista wskaźników do pobrania), `data/knowledge/indicators.json` (nowy, wynik)

**Kontekst ze specyfikacji i researchu (`rops-zasoby-kontekst.md`):**
- IOSS: `https://obserwator.rops.krakow.pl/differenceanalysis/{id}` — tabela w HTML (renderowanie po stronie serwera, bez JS). Rok i obszar wybiera formularz POST (`differenceanalysis[year]`, `differenceanalysis[regions]`). Eksport CSV przez curl nie zadziałał — czytamy tabelę HTML.
- **WebFetch dostaje 403; działa HTTP z nagłówkiem `User-Agent` przeglądarki.** Użyj `httpx` (jest w zależnościach) z takim nagłówkiem i przerwą między żądaniami (≥ 1 s).
- Wskaźniki do pobrania (id IOSS → kategoria, domyślny na mapie oznaczony *):

  | Kategoria | id |
  |---|---|
  | `AGING` | 285* (odsetek 65+), 284 (indeks starości), 273 (podwójne starzenie) |
  | `DEPOPULATION` | 91* (przyrost naturalny), 186 (ludność ogółem) |
  | `SUBURBAN_GROWTH` | 98* (saldo migracji stałych), 7 (gęstość zaludnienia) |
  | `SERVICE_ACCESS` | 27* (mieszkańcy na 1 pracownika socjalnego), 172 (oczekujący na DPS), 227 (usługi opiekuńcze) |
  | `MENTAL_HEALTH` | 136*, 228 — etykiety odczytać z IOSS |
  | `LONELINESS` | 274* („wsparcie osób najstarszych”) — wskaźnik zastępczy; w `label_pl` dopisek „(wskaźnik pośredni)” |
- Kontrolne wartości (65+, 2024): m. Tarnów 24,83; olkuski 23,56; miechowski 23,51; chrzanowski 23,09; Kraków 19,89; limanowski 15,07; nowosądecki 15,12; wielicki 15,58.
- `DIGITAL_EXCLUSION` i `COORDINATION` nie mają danych per powiat — brak wskaźnika, brak mapy.

**Kroki:**
1. Najpierw ręcznie: `curl -s -A 'Mozilla/5.0' https://obserwator.rops.krakow.pl/differenceanalysis/285` — ustal strukturę tabeli, sposób wyboru poziomu „powiaty” i roku (GET z parametrami vs POST formularza z tokenem CSRF ze strony). Wynik opisz w docstringu skryptu.
2. Plik konfiguracyjny listy wskaźników (id, kategoria, `higher_is_worse`, `sort_order`, opcjonalny dopisek etykiety) — dane, nie literały w kodzie.
3. `scripts/fetch_ioss.py`: dla każdego wskaźnika pobierz najnowszy rok, w którym jest komplet 22 powiatów; wyciągnij etykietę, jednostkę, wartość dla województwa (jeśli jest) i 22 wartości. Mapuj nazwy powiatów IOSS na nazwy z `data/gminy-malopolska.json` (np. „Powiat olkuski” → `olkuski`, „m. Tarnów” → `Tarnów`) — mapowanie jawne, z błędem dla nieznanej nazwy.
4. Zapis `data/knowledge/indicators.json` w formacie z „Wspólnych kontraktów” (`code = "IOSS_<id>"`, `is_demo: false`, `source_url` = adres wskaźnika), posortowany po `category, sort_order`. Wskaźnik bez kompletu 22 wartości pomijamy z komunikatem na stderr.
5. CLI: `python -m scripts.fetch_ioss [--only 285,91] [--out data/knowledge/indicators.json]`; kod wyjścia 1, gdy żaden wskaźnik się nie udał.
6. **Fallback:** jeśli IOSS okaże się nie do zeskrobania — przywróć `[ ]`, opisz w „Uwagach”, a `indicators.json` uzupełnij ręcznie z IOSS dla co najmniej 285, 91, 98, 27 (wtedy Z01 = plik danych + notatka, bez skryptu).

**Gotowe, gdy:**
- `python -m scripts.fetch_ioss` kończy się kodem 0 i zapisuje `indicators.json`.
- `python -c "import json; d=json.load(open('data/knowledge/indicators.json')); print(len(d), {x['code']: len(x['values']) for x in d})"` → co najmniej 6 wskaźników, każdy z 22 wartościami.
- Wartości kontrolne 65+ zgadzają się z listą powyżej (dla roku 2024).
- `ruff check .` czysty.

### Z02 · Treści wiedzy

**Cel:** profile 8 wyzwań oraz raporty i materiały jako dane do ingestu — bez nich moduł jest pusty.
**Zależy od:** —
**Pliki:** `data/knowledge/challenges.json` (nowy), `data/knowledge/records/wiedza.json` (nowy)

**Kontekst ze specyfikacji i researchu (`rops-zasoby-kontekst.md`):**
- Raporty ROPS 2024–2026 są na **CC BY 4.0** — fakty cytujemy z podaniem źródła i linku. Materiałów (Canvas, przewodniki) nie kopiujemy — tylko nasz opis i link.
- Źródła faktów: OZPS za 2024 (`https://rops.krakow.pl/mpliki/PS/BA/Raport_OZPS_za_rok_2024.pdf`, rozdz. „Trendy i wnioski” s. 9–30, np. „841 541 osób 60+ = 24,5%”), OZPS za 2025, „Usługi społeczne w Małopolsce… zaktualizowane wnioski z diagnozy” (2025), GUS „Sytuacja demograficzna województwa małopolskiego”, wskaźniki IOSS.
- Bez danych per powiat: `LONELINESS`, `DIGITAL_EXCLUSION`, `COORDINATION` — lead i fakty opisowe z OZPS i „Monitoringu współpracy JST z PES”; jeśli fakt nie ma źródła, cały profil ma `is_demo: true`. **Nie wymyślamy liczb.**
- Raporty do `records/wiedza.json` (`knowledge_type: "REPORT"`, `category` wymagana): OZPS 2024, OZPS 2025, Usługi społeczne 2025, Sektor opiekuńczy 2026, DPS wobec deinstytucjonalizacji 2025, Monitoring współpracy JST z PES 2022, GUS — demografia 2024. Co najmniej 1 raport na każde z 8 wyzwań (jeden PDF może mieć kilka rekordów z różną `category` tylko przez różny `source_url` — np. z kotwicą `#s=` strony; inaczej jedna kategoria na rekord).
- Materiały (`knowledge_type: "MATERIAL"`): SOCIAL CANVAS, Przewodnik po innowacjach społecznych (2019), „Połącz kropki” (2023), Innowacje społeczne dla dostępności (2022), 5 Ramowych Planów Wdrożenia (Usługa Wrażliwa 2026), 3 odcinki podcastu „Społeczny wymiar usług” (`media` z linkiem YouTube). URL-e w `rops-zasoby-kontekst.md`, sekcja C.

**Kroki:**
1. Dla każdego źródła otwórz stronę/PDF (curl z `User-Agent` przeglądarki) i potwierdź URL. Liczby przepisuj tylko z dokumentu, z numerem strony w notatce roboczej.
2. `challenges.json`: 8 profili; `lead_pl` 2–3 zdania prostym językiem (odbiorca: mieszkaniec i urzędnik), 3–5 `key_facts` tam, gdzie są dane.
3. `records/wiedza.json`: rekordy wg formatu z „Wspólnych kontraktów”; `summary` i `body` własnymi słowami.
4. Walidacja JSON: `python -c "import json; json.load(open(...))"` dla obu plików.

**Gotowe, gdy:**
- `challenges.json` ma 8 wpisów (kody taksonomii bez `OTHER`), każdy z niepustym `lead_pl`; profile z liczbami mają `source_url` przy każdym fakcie.
- `records/wiedza.json` ma ≥ 8 `REPORT` (każda kategoria ≥ 1) i ≥ 5 `MATERIAL`; wszystkie z `source_url` i `source_name`.
- Każdy `source_url` odpowiada HTTP 200 (`curl -s -o /dev/null -w '%{http_code}' -A 'Mozilla/5.0' <url>`).

### Z03 · Ingest wiedzy

**Cel:** jedno polecenie ładuje całą wiedzę idempotentnie (scenariusz S2).
**Zależy od:** Z00
**Pliki:** `scripts/ingest.py`, `scripts/ingest_knowledge.py` (nowy), `Makefile`

**Kontekst:**
- `scripts/ingest.py` ma `IngestRecord` (pydantic, `extra="ignore"`) i `_apply_metadata(sol, rec, contact)`; idempotencja po `source_url`, zmiana treści → przebudowa chunków.
- Format `challenges.json` i `indicators.json` — „Wspólne kontrakty”.

**Kroki:**
1. `scripts/ingest.py`: `IngestRecord.knowledge_type: Literal["REPORT", "MATERIAL"] | None = None`; walidator: `KNOWLEDGE` wymaga `knowledge_type`, `SOLUTION` go zabrania, `REPORT` wymaga `category`. `_apply_metadata` ustawia `sol.knowledge_type`. Zmiana samego `knowledge_type` = aktualizacja metadanych bez przebudowy chunków.
2. `scripts/ingest_knowledge.py`: `python -m scripts.ingest_knowledge data/knowledge/` — ładuje `challenges.json` (upsert po `category`, `updated_at = now()` tylko przy zmianie) i `indicators.json` (upsert po `code`, wartości podmieniane w całości w jednej transakcji na wskaźnik). Walidacja: kategoria z taksonomii bez `OTHER`, 22 powiaty z `data/gminy-malopolska.json`, `source_name` niepusty. Błędny wpis nie przerywa reszty; na końcu podsumowanie jak w `scripts/ingest.py` (`dodano / zaktualizowano / bez zmian / błędy`), kod 1 przy błędach.
3. `Makefile`: cel `ingest-knowledge` = `$(PY) -m scripts.ingest data/knowledge/records/ && $(PY) -m scripts.ingest_knowledge data/knowledge/`; dopisz do `.PHONY`.

**Gotowe, gdy:**
- `make ingest-knowledge` (po Z01 i Z02; wcześniej na 1–2 ręcznie napisanych wpisach testowych, usuniętych przed `[x]`) kończy się kodem 0.
- Drugie uruchomienie: 0 dodanych, 0 zaktualizowanych.
- `psql -c "SELECT knowledge_type, count(*) FROM solutions WHERE kind='KNOWLEDGE' GROUP BY 1"` zgadza się z plikiem; `SELECT count(*) FROM indicator_values` = 22 × liczba wskaźników.
- Rekord z `kind: "KNOWLEDGE"` bez `knowledge_type` daje czytelny błąd i nie zatrzymuje reszty.
- `ruff check .` czysty.

### Z04 · API wiedzy

**Cel:** endpointy `/api/challenges` i `/api/indicators` oraz filtr `knowledge_type`.
**Zależy od:** Z00
**Pliki:** `api/routers/knowledge.py` (nowy), `api/main.py` (rejestracja routera), `api/routers/solutions.py`

**Kontekst:**
- Kształty i sortowania — „Wspólne kontrakty → Modele pydantic / Endpointy”. Karty przez `api.cards.to_card(row, rank=i)` (rank od 1 w obrębie listy), `scores = None`.
- „Co już działa”: `kind = SOLUTION`, `status = PUBLISHED`, `category = :code`; sortowanie `evidence_level DESC`, potem rozwiązania z niepustym `media` typu YouTube, potem `id ASC`; limit `settings.CHALLENGE_TOP_SOLUTIONS`.
- Raporty i materiały: `kind = KNOWLEDGE`, `status = PUBLISHED`, `category = :code`, `knowledge_type` odpowiednio; sortowanie `updated_at DESC, id ASC`; limit `settings.CHALLENGE_TOP_KNOWLEDGE`.
- Liczniki w `ChallengeSummary` jednym zapytaniem z `GROUP BY category` (bez N+1).

**Kroki:**
1. `api/routers/knowledge.py` z czterema endpointami; 404 przez `ApiError(404, "NOT_FOUND", "Nie znaleziono wyzwania.")` / „Nie znaleziono wskaźnika.”.
2. `api/main.py`: import i rejestracja routera tak jak pozostałe (prefiks `/api`).
3. `api/routers/solutions.py`: parametr `knowledge_type: Literal["REPORT", "MATERIAL"] | None = None`; z `kind=SOLUTION` → 422 `VALIDATION_ERROR` „Filtr knowledge_type działa tylko dla kind=KNOWLEDGE.”.

**Gotowe, gdy (po Z03 z danymi):**
- `curl -s localhost:8000/api/challenges | python -m json.tool` → 8 pozycji, bez `OTHER`, liczniki > 0 dla wyzwań z danymi.
- `curl -s localhost:8000/api/challenges/AGING` → `key_facts`, `indicators` (≥ 1), `reports` (≥ 1), `solutions` (≤ 6, malejąco po `evidence_level`), `materials`.
- `curl -s -o /dev/null -w '%{http_code}' localhost:8000/api/challenges/OTHER` → 404; to samo dla `/api/indicators/NIE_MA`.
- `curl -s localhost:8000/api/indicators/IOSS_285 | python -c "import json,sys; print(len(json.load(sys.stdin)['values']))"` → 22.
- `curl -s 'localhost:8000/api/solutions?kind=KNOWLEDGE&knowledge_type=MATERIAL'` → tylko materiały; `?kind=SOLUTION&knowledge_type=REPORT` → 422.
- `ruff check .` czysty.

### Z05 · API statystyk

**Cel:** agregacja zgłoszeń po powiatach i zestawienie „zgłoszenia a biblioteka” (ADR-M2-005).
**Zależy od:** Z00
**Pliki:** `api/routers/staff.py`

**Kontekst:**
- `get_stats` buduje `where` i `params`; agregaty przez `_AGG` (`total`, `matched`, `unmatched`); `STATS_DEFAULT_DAYS` dla domyślnego zakresu.
- `by_gmina` i filtr `gmina` **zostają** (kontrakt Modułu 1).
- Luka: `reports_unmatched >= settings.COVERAGE_GAP_MIN_UNMATCHED` **i** `solutions_published < settings.COVERAGE_GAP_MAX_SOLUTIONS`. Zgłoszenia liczone w zakresie dat; rozwiązania i wiedza — aktualny stan `PUBLISHED` (bez zakresu dat).
- Wiersz dla każdego wyzwania z taksonomii poza `OTHER` — także z zerami.

**Kroki:**
1. `get_stats`: filtr `powiat`, grupa `by_powiat` (`GROUP BY r.powiat`, sortowanie `total DESC, powiat ASC NULLS LAST`).
2. `GET /api/stats/coverage` — jedno zapytanie z `LEFT JOIN` agregatów zgłoszeń i rozwiązań do `challenge_taxonomy`; walidacja zakresu dat jak w `get_stats` (wspólna funkcja pomocnicza).

**Gotowe, gdy (po `python -m scripts.seed_reports`):**
- `curl -s localhost:8000/api/stats | python -c "import json,sys; d=json.load(sys.stdin); print(sum(x['total'] for x in d['by_powiat']) == d['total'])"` → `True`.
- `curl -s 'localhost:8000/api/stats?powiat=krakowski'` zwraca tylko zgłoszenia z tego powiatu.
- `curl -s localhost:8000/api/stats/coverage | python -m json.tool` → 8 wierszy; ręczne sprawdzenie jednego wiersza `psql`-em zgadza się; `is_gap` zgodne z progami.
- `curl -s -o /dev/null -w '%{http_code}' 'localhost:8000/api/stats/coverage?from=2026-02-01&to=2026-01-01'` → 422.
- `ruff check .` czysty.

### Z06 · Frontend: typy, klient, trasy

**Cel:** wspólna baza dla Z07–Z10, żeby nie edytowały tych samych plików.
**Zależy od:** Z04, Z05
**Pliki:** `web/src/api/types.ts`, `web/src/api/client.ts`, `web/src/App.tsx`, `web/src/pages/ChallengePage.tsx` (nowy, zaślepka), `web/src/pages/MaterialsPage.tsx` (nowy, zaślepka)

**Kroki:**
1. Typy i metody klienta dokładnie wg „Wspólne kontrakty → Typy i klient frontendu” (także `SolutionFacets` i `solutionFacets`).
2. `App.tsx`: trasy `wiedza/wyzwania/:code` → `ChallengePage`, `wiedza/materialy` → `MaterialsPage` w grupie `AppShell` (publiczne).
3. Zaślepki: `h1` z `tabIndex={-1}`, `useDocumentTitle`, `ModuleLabel module="zasobnik"`, `ZasobnikNav`, akapit „Strona w przygotowaniu.” — klasy Tailwinda jak w `LoginPage.tsx`.

**Gotowe, gdy:**
- `npm run lint && npm run build` w `web/` czyste.
- `/wiedza/wyzwania/AGING` i `/wiedza/materialy` renderują zaślepki w ramie serwisu; `/wiedza` działa jak przed zmianą.

### Z07 · Strona wyzwania

**Cel:** `/wiedza/wyzwania/:code` — rdzeń demo (scenariusz S1 bez mapy).
**Zależy od:** Z06
**Pliki:** `web/src/pages/ChallengePage.tsx`, `web/src/components/knowledge/KeyFacts.tsx` (nowy)

**Kontekst ze specyfikacji (sekcja 9):** kolejno `h1` = nazwa wyzwania, lead, **fakty** (lista definicji: wartość, etykieta, rok, źródło jako link), [miejsce na mapę — Z10], **Raporty i diagnozy** (karty), **Co już działa** (karty; pierwszy film osadzony przez `VideoEmbed`), **Materiały**, na końcu jedyny na ekranie `ds-btn--cta` „Opisz problem w swojej okolicy” → `/`. Nieznany kod (404 z API) → widok jak `NotFoundPage` z linkiem do `/wiedza`.

**Kroki:**
1. `useApi(() => api.challenge(code), [code])` + `LoadState`; tytuł dokumentu = nazwa wyzwania.
2. `KeyFacts`: `<dl>` z wartością (duża, `text-h2 text-navy`), etykietą, rokiem i linkiem do źródła (`source_name`, nowa karta z informacją dla czytników ekranu); znacznik „Dane przykładowe” przy `is_demo`.
3. Sekcje z `h2` i `aria-labelledby`; puste sekcje ukryte (poza „Co już działa” — tam komunikat „Biblioteka nie ma jeszcze rozwiązań dla tego wyzwania” + link „Zgłoś pomysł” → `/mam-pomysl`).
4. Film: pierwsze rozwiązanie z `media` typu YouTube — `VideoEmbed` nad listą kart.

**Gotowe, gdy:**
- S1 kroki 2, 4, 5 przechodzą dla `AGING`; `/wiedza/wyzwania/NIE_MA` pokazuje widok 404.
- Na ekranie dokładnie jeden `ds-btn--cta`; nawigacja klawiaturą przez wszystkie linki w logicznej kolejności; `data-contrast="high"` czytelny; 360 px bez poziomego przewijania.
- Brak nowych plików CSS i `style={{…}}`; `npm run lint && npm run build` czyste.

### Z08 · Przegląd wiedzy i materiały

**Cel:** `/wiedza` jako wejście do wyzwań i materiałów; `/wiedza/materialy` jako lista.
**Zależy od:** Z06
**Pliki:** `web/src/pages/KnowledgePage.tsx`, `web/src/pages/MaterialsPage.tsx`, `web/src/components/knowledge/ChallengeTile.tsx` (nowy), `web/src/styles/catalog.css` (tylko usunięcie reguł `knowledge-*`)

**Kontekst ze specyfikacji (sekcje 9 i 17):** obie strony używają `ZasobnikHeader` z Z13 (podnawigacja jest w nim). `/wiedza` — kafelki 8 wyzwań (nazwa, kluczowy fakt, liczba rozwiązań, link do strony wyzwania), [miejsce na mapę — Z10], sekcja materiałów (do `KNOWLEDGE_PREVIEW_LIMIT = 4` kart + link „Wszystkie materiały”). `/wiedza/materialy` — karty `MATERIAL` z filtrem wyzwania (`ds-select`, opcja „Materiały ogólne” = bez kategorii) i paginacją jak w bibliotece (`Pagination`).

**Kroki:**
1. `KnowledgePage`: `ZasobnikHeader` + zamiana dotychczasowego grupowania kart `KNOWLEDGE` na `api.challenges()` + `ChallengeTile`; materiały z `api.solutions({ kind: "KNOWLEDGE", knowledge_type: "MATERIAL", limit: KNOWLEDGE_PREVIEW_LIMIT })`. Usuń z `catalog.css` reguły `knowledge-*` (dziedziczny CSS — `AGENTS.md`).
2. `ChallengeTile`: cały kafelek jako jeden link (nazwa wyzwania w `h3`), fakt i licznik w treści linku; znacznik „Dane przykładowe”.
3. `MaterialsPage`: filtr w URL (`?category=`), „Materiały ogólne” = `category=none` → zapytanie bez kategorii filtrowane po stronie klienta albo dodatkowy parametr — jeśli API tego nie wspiera, wpis w „Uwagach” do Z04 i tymczasowo tylko filtr po kategorii.

**Gotowe, gdy:**
- `/wiedza` pokazuje 8 kafelków z danymi z API i do 4 materiałów; kafelek prowadzi na stronę wyzwania.
- `/wiedza/materialy` filtruje i stronicuje; stan pusty z `EmptyState`.
- Dostępność jak w Z07; `npm run lint && npm run build` czyste.

### Z09 · Panel trendów

**Cel:** trendy potrzeb dla administratora: w czasie, po powiatach, luki biblioteki (scenariusz S3).
**Zależy od:** Z06
**Pliki:** `web/src/pages/panel/TrendsPage.tsx`

**Kontekst:**
- `TrendsPage` ma wybór zakresu (`RANGES`, `rangeDates`) i rysuje `by_category` oraz `by_gmina` przez `BarList`; komentarz F18: „Grupy by_week i by_reporter_type w PoC pomijamy”.
- Gmina znika z UI (`docs/changes/bugs-2026-10-03-1`) — lista gmin zastąpiona listą powiatów.
- Lista zgłoszeń w panelu czyta `?category=` i `?matched=false` (`readReportParams`).

**Kroki:**
1. Sekcja **Zgłoszenia w czasie**: `by_week` przez `BarList` (etykieta = „tydzień od DD.MM”), podział dopasowane/niedopasowane jak w kategoriach.
2. Sekcja **Powiaty**: `by_powiat` zamiast `by_gmina` (ta sama logika „pokazujemy N z M”).
3. Sekcja **Zgłoszenia a biblioteka**: `api.coverage({ from, to })` → tabela (wyzwanie, zgłoszenia, bez dopasowania, rozwiązania w bibliotece, wiedza, stan). Luka: tekst „Luka” + ikona w `ds-tag`, nie sam kolor; link „Zobacz zgłoszenia” → `/panel/zgloszenia?category=<code>&matched=false`.
4. Zaktualizuj komentarz F18.

**Gotowe, gdy:**
- Po seedzie zgłoszeń wszystkie trzy sekcje mają dane; zmiana zakresu przeładowuje także coverage.
- Link z luki otwiera przefiltrowaną listę zgłoszeń.
- Tabela ma `<caption>` i nagłówki `scope="col"`; `npm run lint && npm run build` czyste.

### Z10 · Mapa kafelkowa powiatów

**Cel:** „Mapa Wyzwań” w dostępnej formie (ADR-M2-004, ADR-M2-007).
**Zależy od:** Z07, Z08
**Pliki:** `web/src/components/knowledge/PowiatTileMap.tsx` (nowy), `web/src/lib/powiatTiles.ts` (nowy), `web/src/pages/ChallengePage.tsx`, `web/src/pages/KnowledgePage.tsx`

**Kontekst ze specyfikacji (sekcja 9):**
- Siatka Tailwind `grid`, 22 kafelki ułożone w przybliżeniu jak powiaty; układ `{ powiat: { col, row } }` w `powiatTiles.ts` (nazwy z listy 22 powiatów).
- Kafelek: nazwa powiatu i wartość **tekstem** (z jednostką, format `pl-PL`); kolor tylko dodatkowo. Skala `MAP_SCALE_STEPS = 4` stopni kwantylowych liczonych z `values`, kierunek wg `higher_is_worse`: `bg-surface-sunken` → `bg-soft-blue` → `bg-stripe-blue text-navy-on` → `bg-navy text-navy-on`. Sprawdź kontrast każdego stopnia (≥ 4,5:1) także w `data-contrast="high"`.
- Legenda z przedziałami, wartość dla województwa, rok, źródło (link) i znacznik „Dane przykładowe” przy `is_demo`.
- Tabela alternatywna (powiat, wartość) w `<details>` „Pokaż jako tabelę”, sortowalna po wartości.
- Lista kafelków to `<ul>` w kolejności alfabetycznej dla czytników ekranu; poniżej `sm` siatka zamienia się w listę posortowaną po wartości.
- Wybór wskaźnika (`ds-select`) gdy wyzwanie ma ich kilka; na `/wiedza` — wybór spośród domyślnych wskaźników wszystkich wyzwań.

**Kroki:**
1. `powiatTiles.ts`: układ siatki (np. 6 × 6) + funkcja progów kwantylowych.
2. `PowiatTileMap` (`indicatorCode` → `api.indicator`), stany ładowania/błędu przez `LoadState`.
3. Wstaw na stronie wyzwania (po faktach, tylko gdy `indicators.length > 0`) i na `/wiedza` (po kafelkach wyzwań).
4. Strona wyzwania: zamień jej nagłówek na `ZasobnikHeader` z Z13 (spójność M10).

**Gotowe, gdy:**
- S1 krok 3: na stronie `AGING` mapa 22 powiatów z wartościami 65+; m. Tarnów i olkuski w najwyższym stopniu.
- Tabela alternatywna zawiera te same 22 wartości; czytnik ekranu (VoiceOver) czyta „olkuski, 23,56 %”.
- Wyzwania bez wskaźników (`DIGITAL_EXCLUSION`, `COORDINATION`) nie pokazują mapy ani pustego kontenera.
- 360 px: lista zamiast siatki, bez poziomego przewijania; `npm run lint && npm run build` czyste.

### Z12 · API Biblioteki: `has_video` i fasety

**Cel:** dane dla nowego nagłówka i filtrów Biblioteki (ADR-M2-008).
**Zależy od:** Z00, Z04 (ten sam plik `solutions.py`)
**Pliki:** `api/routers/solutions.py`

**Kontekst:**
- Audyt danych (spec. sekcja 17): 9 grup ROPS jako tagi `ROPS: …`, każda innowacja w dokładnie jednej; film ma 26 ze 115 (`media` z elementem `type = "video"`).
- `list_solutions` buduje listę `conds`; filtr `tag` już istnieje (`Solution.tags.any(tag)`).
- Kształt `SolutionFacets` i ustawienie `ROPS_GROUP_TAG_PREFIX` — „Wspólne kontrakty” (dodaje Z00).

**Kroki:**
1. `list_solutions`: parametr `has_video: bool | None = None`; `true` → warunek `jsonb_path_exists(media, '$[*] ? (@.type == "video")')` (przez `func`/`text` z parametrem, bez sklejania tekstu użytkownika).
2. `GET /api/solutions/facets` z parametrem `kind` (domyślnie `SOLUTION`), tylko `PUBLISHED`: `total`, `with_video`, grupy (`unnest(tags)` z filtrem prefiksu, `label_pl` = tag bez prefiksu), kategorie z `challenge_taxonomy` (`count > 0`). Trasa zarejestrowana **przed** `/solutions/{solution_id}`, żeby `facets` nie trafiło do walidacji id.

**Gotowe, gdy (po `make ingest`):**
- `curl -s localhost:8000/api/solutions/facets | python -m json.tool` → `total: 115`, `with_video: 26`, 9 grup o sumie 115, „Dla dzieci, młodzieży i rodziny” = 21 na początku.
- `curl -s 'localhost:8000/api/solutions?has_video=true&limit=100' | python -c "import json,sys; print(json.load(sys.stdin)['total'])"` → 26.
- `curl -s 'localhost:8000/api/solutions?tag=ROPS:%20Dla%20senior%C3%B3w'` → 20 pozycji łącznie.
- `ruff check .` czysty.

### Z13 · Biblioteka, karta innowacji, nagłówek i podnawigacja Zasobnika

**Cel:** Biblioteka jako ciekawy, dostępny katalog z filmami (M8) i wspólny wygląd Zasobnika (M10).
**Zależy od:** Z06, Z12
**Pliki:** `web/src/pages/LibraryPage.tsx`, `web/src/components/catalog/CatalogFilters.tsx`, `web/src/components/catalog/CatalogResults.tsx`, `web/src/components/SolutionCard.tsx`, `web/src/components/layout/ZasobnikNav.tsx`, `web/src/components/layout/ZasobnikHeader.tsx` (nowy), `web/src/lib/ropsGroups.ts` (nowy), `web/src/components/catalog/FilmStrip.tsx` (nowy), `web/src/styles/catalog.css`, `web/src/styles/components.css` (tylko usuwanie reguł karty)

**Kontekst ze specyfikacji (sekcja 17, M8 i M10):**
- Nagłówek: „115 innowacji · 26 z filmem · 9 grup odbiorców” z `api.solutionFacets()`, lead, wyszukiwarka na pierwszym planie.
- „Dla kogo”: rząd `ds-chip` z `aria-pressed`, 9 grup z licznikami + „Wszystkie”; jedna grupa naraz; URL `?tag=`.
- „Obejrzyj, jak to działa”: bez aktywnych filtrów — do `FILM_STRIP_LIMIT = 6` innowacji z filmem (`has_video: true`), duże miniatury, tytuł, grupa; link „Wszystkie z filmem” ustawia `?has_video=true`.
- Filtry dodatkowe w `<details>` (rozwinięte od szerokości jak dziś): wyzwanie (`ds-select`, tylko kategorie z `count > 0`), „Tylko z filmem” (checkbox). **Usuń** gminę (`GminaSelect`), poziom sprawdzenia i sortowanie z UI; stare parametry URL (`gmina`, `evidence_min`, `sort`) ignorowane przy odczycie.
- Karta (`SolutionCard`, wspólna z czatem i panelem):
  - z filmem — miniatura 16:9 + etykieta „Film”;
  - bez filmu — pasek nagłówka `bg-soft-*` grupy z ikoną z `ropsGroups.ts` (`aria-hidden`);
  - `ds-tag` z grupą ROPS (zamiast wyzwania; wyzwanie zostaje dla `KNOWLEDGE` i gdy brak grupy), tytuł, streszczenie `line-clamp-3`, organizacja;
  - bez „Koszt” i „Poziom sprawdzenia”; tytuł jako link z rozciągniętym obszarem kliknięcia (`after:absolute after:inset-0` na linku, `relative` na karcie) — jeden przystanek Tab;
  - czat: `showRank` i numer `[n]` bez zmian; tekst „Na stronie rozwiązania jest film.” dla czytników zostaje.
- Siatka `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, `PAGE_SIZE = 24`.
- `ZasobnikHeader`: `ModuleLabel`, `h1` (`tabIndex={-1}`), lead, opcjonalne `stats` (lista `<dl>` liczb), `ZasobnikNav` pod spodem.
- `ZasobnikNav`: zakładki Wiedza o wyzwaniach (`/wiedza`, aktywna także na `/wiedza/wyzwania/*`) · Biblioteka innowacji (`/rozwiazania`, aktywna także na `/rozwiazania/*`) · Materiały (`/wiedza/materialy`); podkreślenie aktywnej jak `ds-nav__item`, `aria-current="page"`.
- Tylko Tailwind + `ds-*`; style przeniesione z `catalog.css` i `components.css` usuń, jeśli nikt ich już nie używa (sprawdź `grep -rn` przed usunięciem). Zamyka punkt 3 zmiany `docs/changes/bugs-2026-10-03-1` dla Biblioteki — dopisz to w „Uwagach”.

**Kroki:**
1. `ropsGroups.ts` (9 grup: tag, krótka etykieta, klasa `bg-soft-*`, ikona SVG konturowa 24 px).
2. `ZasobnikHeader` i nowy `ZasobnikNav`; podmień nagłówek w `LibraryPage`.
3. `CatalogFilters` (nowy zestaw filtrów, `readCatalogParams`/`writeCatalogParams` z `tag` i `hasVideo`), chipy grup, `FilmStrip`.
4. Nowy `SolutionCard`; sprawdź czat (`make web-mock`, scenariusz z kartami) i listy w panelu.
5. Porządek w CSS.

**Gotowe, gdy:**
- `/rozwiazania`: nagłówek z liczbami z API, 9 chipów z licznikami, pasek filmów bez filtrów; klik „Dla seniorów” → 20 wyników i `?tag=` w URL; „Tylko z filmem” → 26.
- Karty: z filmem — miniatura; bez filmu — kolorowy pasek z ikoną grupy; żadnych pustych pól.
- Czat na mocku pokazuje karty z numerami `[n]`, cytowania nadal przewijają do kart.
- Klawiatura: chipy, filtry i karty w logicznej kolejności, jeden przystanek na kartę; `data-contrast="high"`, 200 %, 360 px bez poziomego przewijania; jeden `ds-btn--cta` na ekran.
- Brak `GminaSelect` w Bibliotece; `npm run lint && npm run build` czyste.

### Z14 · Strona innowacji

**Cel:** strona innowacji z filmem na pierwszym planie, kartą najważniejszych informacji i podobnymi innowacjami (M9).
**Zależy od:** Z13
**Pliki:** `web/src/pages/SolutionPage.tsx`, `web/src/components/solution/KeyInfo.tsx` (nowy), `web/src/components/solution/MediaList.tsx`, `web/src/components/solution/SimilarSolutions.tsx` (nowy), `web/src/styles/solution.css`

**Kontekst ze specyfikacji (sekcja 17, M9):**
- Nagłówek: okruszki, grupa ROPS i wyzwanie jako tagi, `h1`, organizacja; film (jeśli jest) od razu pod nagłówkiem.
- Od `lg` dwie kolumny (`lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]`): lewa — „W skrócie”, „Opis” (śródtytuły jak dziś w `parseBody`); prawa — `KeyInfo` (dla kogo, grupa, wyzwanie, poziom sprawdzenia z opisem z `EvidenceBadge`, projekt z tagu `Projekt: …`, organizacja, źródło) i „Do pobrania” (`MediaList`: ikona i typ pliku — materiały, dokument, licencja — oraz informacja o nowej karcie). Na telefonie `KeyInfo` zaraz po „W skrócie”.
- `SimilarSolutions`: do `SIMILAR_LIMIT = 3` kart z tej samej grupy (`api.solutions({ kind: "SOLUTION", tag, limit: 4 })`, bez bieżącej) + link „Więcej dla: <grupa>” → `/rozwiazania?tag=…`. Bez grupy — z tej samej kategorii.
- Zakończenie: `ds-btn--cta` „Masz podobny problem? Opisz go” → `/` i „Wróć do wyników” (logika historii jak dziś).
- `KNOWLEDGE`: etykieta „Raport” / „Materiał” (z `knowledge_type`), okruszki do `/wiedza` lub `/wiedza/materialy`, bez „Podobnych innowacji”.
- Style przenieś z `solution.css` do Tailwinda; usuń plik, jeśli nic go już nie importuje (`breadcrumbs` i `impl-steps` używane też gdzie indziej? — sprawdź `grep`).

**Gotowe, gdy:**
- Innowacja z filmem: film pod nagłówkiem, `KeyInfo` w prawej kolumnie na desktopie i po leadzie na telefonie, 3 podobne innowacje z tej samej grupy.
- Innowacja bez filmu i wpis `KNOWLEDGE` wyglądają poprawnie (bez pustych sekcji).
- Dokładnie jeden `ds-btn--cta`; kolejność czytania logiczna (treść przed kartą boczną dla czytnika); `data-contrast="high"`, 200 %, 360 px.
- `npm run lint && npm run build` czyste.

### Z11 · Dane w bazie, scenariusze, dokumentacja

**Cel:** moduł gotowy do demo na świeżym środowisku.
**Zależy od:** Z01, Z02, Z03, Z07, Z08, Z09, Z10
**Pliki:** `README.md` (sekcja ładowania danych), `docs/modules/02-zasobnik-wiedzy/module-2-tasks.md` (tylko „Uwagi”), `docs/modules/README.md` (stan modułu)

**Kroki:**
1. Od zera: `make reset-db && make ingest && make ingest-knowledge && python -m scripts.seed_reports`; zapisz w README (także wariant `docker compose exec api …`).
2. Przejdź S1–S4 ze specyfikacji (sekcja 4) w przeglądarce; S3 jako administrator (konta demo w README). Dodatkowo Biblioteka: grupa „Dla seniorów” → innowacja z filmem → „Podobne innowacje”.
3. Lista kontrolna dostępności: klawiatura, `data-contrast="high"`, powiększenie 200 %, 360 px, jeden `ds-btn--cta` na ekran, „Dane przykładowe” tekstem.
4. Skalibruj `COVERAGE_GAP_*` na seedzie (żeby co najmniej jedno wyzwanie było luką, ale nie wszystkie) — zmiana wartości w `.env.example` przez wpis w „Uwagach” do Z00, jeśli trzeba.
5. Wynik (co przeszło, co nie) w „Uwagach”; stan modułu w `docs/modules/README.md`.

**Gotowe, gdy:**
- Świeże środowisko + polecenia z README → wszystkie 4 scenariusze przechodzą bez ręcznych poprawek w bazie.
- `docs/modules/README.md` pokazuje stan „gotowy (Z00–Z11)” albo listę braków.

---

## Uwagi między zadaniami

_(dopisuj na końcu: `- [Zxx → Zyy] opis`)_
- [Z13, Z14 → plan] 2026-10-04: Biblioteka (Z13) zaczęta wcześniej na obecnym API — `ropsGroups.tsx`, `useLibraryOverview.ts`, `ZasobnikHeader`, `ZasobnikNav`, nowy `SolutionCard`, `CatalogFilters`, `FilmStrip`, `CatalogResults`, `LibraryPage` (build i lint czyste, niecommitowane). Tymczasowe: liczniki i „Tylko z filmem” liczone w kliencie, zakładki bez „Materiały” — przepięcie na `/api/solutions/facets` i `has_video` po Z06 i Z12 (implementation-plan.md, etap C1). Biblioteka bez filtra gminy — zamyka punkt 3 `docs/changes/bugs-2026-10-03-1` dla Biblioteki.
