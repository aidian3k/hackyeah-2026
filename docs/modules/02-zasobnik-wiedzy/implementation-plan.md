# Moduł 2 — Zasobnik wiedzy: plan implementacji

Plan wykonania całego modułu: kolejność prac, co jest już zrobione, co zostało i jak każdy etap sprawdzić.

| Dokument | Rola |
|---|---|
| [`module-2-zasobnik-wiedzy.html`](module-2-zasobnik-wiedzy.html) (v0.4) | Specyfikacja — **co** budujemy i dlaczego (zakres M1–M10, model, API, ekrany, ADR-M2-001–008) |
| [`module-2-tasks.md`](module-2-tasks.md) | Zadania Z00–Z14 — **wiążące kontrakty**, pliki, „Gotowe, gdy”, status |
| **ten plik** | **Jak i w jakiej kolejności** — etapy, stan prac, ryzyka |
| [`rops-zasoby-kontekst.md`](rops-zasoby-kontekst.md) | Research źródeł danych (IOSS, raporty ROPS, materiały) |

Data: 2026-10-04.

## 1. Stan na dziś

### Backend i dane

| Obszar | Stan |
|---|---|
| Biblioteka (`solutions`, `kind = SOLUTION`) | 115 innowacji ROPS; każda w 1 z 9 grup „dla kogo” (tag `ROPS: …`); 26 z filmem |
| Wiedza (`kind = KNOWLEDGE`) | **0 wpisów** — `/wiedza` jest pusta |
| Wskaźniki, profile wyzwań | brak tabel i danych |
| API | `GET /api/solutions` (filtry `kind`, `category`, `tag`, `q`…), `/api/solutions/{id}`, `/api/stats` (`by_week` już jest), `/api/taxonomy` |
| Przypisanie do wyzwań | nierówne: 81 × `SERVICE_ACCESS`, 20 × `AGING`, 9 × `MENTAL_HEALTH`, 5 × `COORDINATION`, 4 wyzwania bez innowacji |

### Frontend — prace rozpoczęte (2026-10-04, niecommitowane, `npm run build` i `lint` czyste)

Wcześniejsza część zadania **Z13** (Biblioteka) zrobiona **na obecnym API**, bez czekania na backend:

| Plik | Co zrobione | Stan |
|---|---|---|
| `web/src/lib/ropsGroups.tsx` (nowy) | 9 grup ROPS: etykieta, kolor `bg-soft-*`, ikona; `ropsGroup(tags)`, `projectName(tags)`, `GroupIcon` | gotowe |
| `web/src/hooks/useLibraryOverview.ts` (nowy) | Jednorazowe pobranie całej Biblioteki (2 żądania) → liczniki grup i wyzwań, lista filmów. **Tymczasowe** — zastąpi je `GET /api/solutions/facets` (Z12) | gotowe |
| `web/src/components/layout/ZasobnikHeader.tsx` (nowy) | Wspólny nagłówek: etykieta modułu, `h1`, lead, pasek liczb, zakładki | gotowe |
| `web/src/components/layout/ZasobnikNav.tsx` | Zakładki z podkreśleniem aktywnej; aktywna także na podstronach | gotowe (bez „Materiały” — dojdzie w Z08) |
| `web/src/components/SolutionCard.tsx` | Nowa karta: miniatura filmu albo (prop `visual`) pasek grupy z ikoną; tag grupy; streszczenie 3 linie; cała karta klikalna; bez „Koszt” i „Poziom sprawdzenia” | gotowe, **do sprawdzenia w czacie i panelu** |
| `web/src/components/catalog/CatalogFilters.tsx` | Wyszukiwarka na pierwszym planie, chipy „Dla kogo?” z licznikami, wyzwanie (tylko z innowacjami), „Tylko z filmem”. **Bez gminy, poziomu sprawdzenia i sortowania** | gotowe |
| `web/src/components/catalog/FilmStrip.tsx` (nowy) | „Obejrzyj, jak to działa” — 6 innowacji z filmem | gotowe |
| `web/src/components/catalog/CatalogResults.tsx` | Siatka 1/2/3 kolumny, licznik „innowacji”, Tailwind | gotowe |
| `web/src/pages/LibraryPage.tsx` | Składa całość; „Tylko z filmem” filtrowane po stronie klienta (do Z12); 24 na stronę | gotowe |

**Nie zrobione z tej części:** porządek w CSS (nieużywane reguły w `catalog.css`, `components.css`, `app.css`), sprawdzenie w przeglądarce, strona innowacji, `/wiedza`.

## 2. Strategia

Trzy tory, żeby jak najszybciej mieć coś pokazywalnego, a jednocześnie nie budować dwa razy:

1. **Tor A — frontend na obecnym API (od razu).** Biblioteka, strona innowacji i tymczasowa `/wiedza`. Daje widoczny efekt bez backendu. Elementy tymczasowe są nazwane i mają wskazane zadanie, które je zastąpi.
2. **Tor B — backend i dane (równolegle).** Schemat, API wiedzy i statystyk, fasety Biblioteki, skrypt IOSS, treści, ingest.
3. **Tor C — frontend wiedzy na nowym API.** Strona wyzwania, przegląd wiedzy, materiały, panel trendów, mapa; przepięcie elementów tymczasowych z toru A.

Zasady wspólne dla wszystkich etapów: `AGENTS.md` (Tailwind z presetu + `ds-*`, bez nowego CSS, jeden `ds-btn--cta` na ekran, WCAG 2.1 AA, teksty po polsku), kontrakty z `module-2-tasks.md` („Wspólne kontrakty”) są wiążące.

## 3. Etapy

### Etap A1 — Biblioteka: domknięcie (wcześniejsza część Z13)

**Cel:** Biblioteka gotowa do pokazania.

1. Sprawdzić w przeglądarce `/rozwiazania`: nagłówek z liczbami (115 / 26 / 9), chipy grup z licznikami, pasek filmów bez filtrów, „Tylko z filmem” → 26, „Dla seniorów” → 20, paginacja 24.
2. Sprawdzić **nową kartę poza Biblioteką** — czat (`make web-mock`: numery `[n]`, przewijanie z cytowań do kart, miniatury filmów) i panel (kolejka do zatwierdzenia, szczegół zgłoszenia, przegląd rozwiązania). Karta nie ma już „Poziomu sprawdzenia” — jeśli panel go potrzebuje, pokazać go na stronach panelu, nie na karcie.
3. Porządek w CSS: usunąć z `catalog.css` reguły `catalog-*` nieużywane po przebudowie, z `components.css` reguły `solution-card*`, z `app.css` reguły `zasobnik-nav` — każdą po `grep -rn` w `web/src`. `card-list` zostaje (używa panel).
4. Dostępność: klawiatura (chipy → filtry → karty, jeden przystanek na kartę), `data-contrast="high"`, powiększenie 200 %, 360 px.

**Weryfikacja:** `npm run lint && npm run build`; przejście kroków 1–4 ręcznie.

### Etap A2 — Strona innowacji (Z14 na obecnym API)

**Cel:** strona innowacji z filmem na pierwszym planie i podobnymi innowacjami (spec. sekcja 17, M9).

**Pliki:** `web/src/pages/SolutionPage.tsx`, `web/src/components/solution/KeyInfo.tsx` (nowy), `web/src/components/solution/SimilarSolutions.tsx` (nowy), `web/src/components/solution/MediaList.tsx`, `web/src/components/Breadcrumbs.tsx` (nowy, Tailwind), `web/src/styles/solution.css` (tylko usuwanie reguł strony; `breadcrumbs`, `media-list`, `impl-steps` zostają, dopóki używa ich panel).

1. Nagłówek: okruszki, tag grupy i wyzwania, `h1`, organizacja; film od razu pod nagłówkiem.
2. Od `lg` dwie kolumny: treść („W skrócie”, „Opis”) i `KeyInfo` (dla kogo, grupa, wyzwanie, poziom sprawdzenia, projekt z tagu `Projekt: …`, organizacja, źródło) + „Do pobrania”. Na telefonie `KeyInfo` po „W skrócie”.
3. `SimilarSolutions`: `api.solutions({ kind: "SOLUTION", tag, limit: 4 })` bez bieżącej → 3 karty `visual`; link „Więcej: <grupa>” → `/rozwiazania?tag=…`. Bez grupy — ta sama kategoria.
4. Zakończenie: `ds-btn--cta` „Masz podobny problem? Opisz go” → `/` i „Wróć do wyników”.
5. Wpisy `KNOWLEDGE`: ta sama strona z etykietą „Wiedza”, bez „Podobnych innowacji” (etykiety „Raport” / „Materiał” po Z06, gdy jest `knowledge_type`).

**Weryfikacja:** innowacja z filmem, bez filmu i (po Z03) wpis wiedzy; dokładnie jeden `ds-btn--cta`; dostępność jak w A1.

### Etap A3 — `/wiedza` tymczasowo (do Z08)

**Cel:** zamiast pustej strony — 8 wyzwań z opisem i liczbą innowacji.

**Pliki:** `web/src/pages/KnowledgePage.tsx`, `web/src/styles/catalog.css` (usunięcie reguł `knowledge-*`).

1. `ZasobnikHeader` z leadem o wyzwaniach Małopolski.
2. Siatka kafelków z `useTaxonomy()` (nazwa, `description`) i licznikiem z `useLibraryOverview()`; kafelek prowadzi do `/rozwiazania?category=<kod>`; wyzwania bez innowacji — tekst „Biblioteka nie ma jeszcze rozwiązań” + link do Kreatora pomysłów (`/mam-pomysl`).
3. Jeśli są wpisy `KNOWLEDGE` — lista kart pod kafelkami (jak dziś).
4. `ds-btn--cta` „Opisz swój problem” → `/`.

**Zastępuje to później:** Z08 (kafelki z `GET /api/challenges`, link do strony wyzwania, materiały).

### Etap B1 — Fundament backendu (Z00)

Schemat (`knowledge_type`, `challenge_profiles`, `indicators`, `indicator_values`), modele ORM i pydantic (z `SolutionFacets`), `SolutionCard.knowledge_type`, ustawienia. Wpis w „Uwagach” Modułu 1. **Blokuje cały tor B i C** — robić jako pierwsze.

### Etap B2 — Dane (Z01, Z02) — niezależne, od razu

- **Z01** `scripts/fetch_ioss.py` → `data/knowledge/indicators.json`: najpierw ręcznie ustalić strukturę HTML IOSS (`curl -A 'Mozilla/5.0'`), wskaźniki z tabeli w Z01, wartości kontrolne (65+ 2024: Tarnów 24,83, Kraków 19,89). Plan awaryjny: ręczny plik dla 4 wskaźników.
- **Z02** treści: 8 profili wyzwań (fakty z OZPS 2024/2025, diagnozy usług 2025, GUS — z linkami; bez wymyślonych liczb), ≥ 8 raportów, ≥ 5 materiałów (Social Canvas, przewodnik, „Połącz kropki”, ramowe plany wdrożenia, podcast). **Największy nakład pracy w module** — można dzielić między osoby po wyzwaniach.

### Etap B3 — API (Z03, Z04, Z05, Z12)

1. **Z03** ingest wiedzy (`knowledge_type`, `scripts/ingest_knowledge.py`, `make ingest-knowledge`).
2. **Z04** `api/routers/knowledge.py` (`/api/challenges`, `/api/indicators`) + filtr `knowledge_type`.
3. **Z05** `by_powiat`, filtr `powiat`, `/api/stats/coverage`.
4. **Z12** (po Z04 — ten sam plik) `has_video`, `/api/solutions/facets`.

Z03, Z04, Z05 równolegle po Z00.

### Etap C1 — Frontend: wspólna baza (Z06)

Typy i klient (także `SolutionFacets`), trasy `/wiedza/wyzwania/:code` i `/wiedza/materialy` z zaślepkami.

**Przepięcie elementów tymczasowych z toru A (w ramach Z13, po Z06 i Z12):**
- `useLibraryOverview` → `api.solutionFacets()` dla liczników; pasek filmów → `api.solutions({ has_video: true, limit: 6 })`; „Tylko z filmem” → parametr API zamiast filtrowania w kliencie (usuwa `filterVideos` z `LibraryPage`). Hook usunąć, gdy nikt go nie używa (A3 przechodzi na `/api/challenges` w Z08).

### Etap C2 — Ekrany wiedzy i panel (Z07, Z08, Z09)

- **Z07** strona wyzwania: fakty (`KeyFacts`), raporty, „Co już działa” z filmem, materiały, CTA. Najważniejszy ekran demo (scenariusz S1).
- **Z08** `/wiedza` na `GET /api/challenges` (zastępuje A3) + `/wiedza/materialy`; zakładka „Materiały” w `ZasobnikNav`.
- **Z09** panel trendów: zgłoszenia w czasie (`by_week`), powiaty, „Zgłoszenia a biblioteka” (luki).

### Etap C3 — Mapa kafelkowa (Z10)

`PowiatTileMap` na stronie wyzwania i `/wiedza`, tabela alternatywna, skala 4 stopni z tokenów; strona wyzwania przechodzi na `ZasobnikHeader`.

### Etap D — Demo (Z11)

Świeże środowisko → `make reset-db && make ingest && make ingest-knowledge && python -m scripts.seed_reports` → scenariusze S1–S4 + Biblioteka (grupa → film → podobne) → lista dostępności → README i stan modułu.

## 4. Kolejność i równoległość

```
Tor A (frontend teraz)   A1 ──► A2 ──► A3
                                                     ┌──────────────── przepięcie A → API (Z13)
Tor B (backend, dane)    Z00 ─┬─► Z03 ─┐             │
                              ├─► Z04 ─┼─► Z12 ──► Z06 ─┬─► Z07 ─┐
                              └─► Z05 ─┘             │  ├─► Z08 ─┼─► Z10 ──► Z11
                         Z01 ─────────────────────────────────────┤
                         Z02 ─────────────────────────────────────┘  └─► Z09
```

**Najkrótsza ścieżka do demo:** A1 + A2 (Biblioteka i strona innowacji — już teraz) → Z00 → Z02 + Z03 → Z04 → Z12 → Z06 → Z07 (strona wyzwania bez mapy).

## 5. Ryzyka i decyzje do potwierdzenia

| Ryzyko / decyzja | Wpływ | Postępowanie |
|---|---|---|
| 4 wyzwania bez innowacji (samotność, wykluczenie cyfrowe, depopulacja, suburbanizacja) | Strona wyzwania bez „Co już działa”; słabsze demo dla tych wyzwań | Do decyzji zespołu: przemapowanie kategorii (zmiana danych Modułu 1 + ADR). Do tego czasu komunikat i link do Kreatora; demo S1 na `AGING` (20 innowacji) |
| IOSS bez API, eksport CSV nie działa przez curl | Z01 może się nie udać automatycznie | Plan awaryjny w Z01: ręczny `indicators.json` dla 4 wskaźników |
| „Mapa Wyzwań Społecznych” nie istnieje publicznie | Wymaganie z `base.md` | ADR-M2-007: mapa kafelkowa z IOSS; zapytać mentorów ROPS |
| Nowa karta wspólna z czatem i panelem | Regresja w czacie (cytowania `[n]`) lub panelu | Etap A1 krok 2 — sprawdzenie przed commitem |
| Tymczasowe liczenie faset w kliencie | 2 dodatkowe żądania; nie skaluje się powyżej kilkuset innowacji | Przepięcie na `/api/solutions/facets` po Z12 (etap C1) |
| Z02 (treści) to dużo ręcznej pracy | Opóźnia strony wiedzy | Dzielić po wyzwaniach; zacząć od `AGING` (scenariusz demo) |

## 6. Odstępstwa od zadań — do wpisania w „Uwagach” `module-2-tasks.md`

- Z13 i Z14 zaczęte wcześniej, na obecnym API (tor A). Tymczasowe: `useLibraryOverview`, filtrowanie „Tylko z filmem” w kliencie, zakładki bez „Materiały”. Po Z06 i Z12 — przepięcie opisane w etapie C1.
- `/wiedza` w wersji tymczasowej (A3) do czasu Z08.
- Biblioteka nie ma już filtra gminy — zamyka punkt 3 zmiany `docs/changes/bugs-2026-10-03-1` dla Biblioteki (filtry panelu i formularze — osobno).
