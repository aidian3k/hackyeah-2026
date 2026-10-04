# Moduły platformy Splot

Siedem funkcjonalności z `docs/base.md` §2. Każdy moduł ma specyfikację HTML (sekcje ze statusami `stable` / `draft` / `todo`) i plik zadań z protokołem pracy agentów — wzór: Moduł 1.

| # | Moduł (`base.md`) | Specyfikacja | Zadania | Stan |
|---|---|---|---|---|
| 1 | I. Matchmaking społeczny (obligatoryjny) | `01-matchmaking/module-1-matchmaking.html` | `01-matchmaking/module-1-tasks.md`, frontend: `01-matchmaking/frontend-tasks.md` (+ `module-1-calibration.md`, `frontend-a11y.md`) | gotowy (T00–T26, F00–F21) |
| 2 | II. Zasobnik wiedzy | `02-zasobnik-wiedzy/module-2-zasobnik-wiedzy.html` | `02-zasobnik-wiedzy/module-2-tasks.md` | draft v0.4 (zakres, model, API, ekrany, odświeżenie Biblioteki, ADR-M2-001–008, źródła: `02-zasobnik-wiedzy/rops-zasoby-kontekst.md`); zadania Z00–Z14 rozpisane |
| 3 | III. Kreator pomysłów | `03-kreator-pomyslow/module-3-kreator-pomyslow.html` | `03-kreator-pomyslow/module-3-tasks.md` (materiały: `docs/resources/rops/`) | draft v0.3 (zakres pod hackathon); zadania K00–K13 do wzięcia |
| 4 | IV. Tester innowacji | `04-tester-innowacji/module-4-tester-innowacji.html` | `04-tester-innowacji/module-4-tasks.md` (+ `module-4-calibration.md`) | gotowy (TI00–TI07); TI08 — porządki po triażu |
| 5 | V. Platforma aktywnej komunikacji | `05-platforma-komunikacji/module-5-platforma-komunikacji.html` | `05-platforma-komunikacji/module-5-tasks.md` | draft v0.4 (uproszczony); zadania PK00–PK05 (backend), PK20–PK26 (frontend) do wzięcia; zalążek: odpowiedzi do autora |
| 6 | VI. Panel administratora | `06-panel-administratora/module-6-panel-administratora.html` | `06-panel-administratora/module-6-tasks.md` | szkielet; w dużej części pokryty przez M1 |
| 7 | VII. Middleman Innowacji | `07-middleman-innowacji/module-7-middleman-innowacji.html` | `07-middleman-innowacji/module-7-tasks.md` | szkielet; brak |

Mocki strumieni SSE zostają w `docs/mocks/` — korzystają z nich `Makefile` (`make web-mock`) i skrypty w `web/scripts/`.

## Konwencje dla modułów 2–7

- Prefiksy zadań: `Z` (2), `K` (3), `TI` (4), `PK` (5), `PA` (6), `MI` (7) — bez kolizji z `T` (Moduł 1) i `F` (frontend).
- ADR numerowane per moduł: `ADR-M2-001`, … — ADR-001 – 019 należą do Modułu 1.
- Twarde reguły z `AGENTS.md` obowiązują wszystkie moduły. Moduł 1 jest kontraktem zewnętrznym: zmiana jego tabel lub endpointów = ADR + wpis w „Uwagach między zadaniami” `docs/modules/01-matchmaking/module-1-tasks.md`.
- Specyfikacja przechodzi z `szkielet` do `draft` po sesji planowania; zadania rozpisujemy dopiero wtedy.
- Schemat bazy: nowe tabele modułu w osobnym, idempotentnym pliku `db/mN-<nazwa>.sql` z celem `make db-mN` (ładuje się alfabetycznie po `init.sql`). Zmiana tabel Modułu 1 — w `db/init.sql`. Wyjątek historyczny: M4 ma tabele w `init.sql`.
- Ustawienia modułu w `api/config.py` z prefiksem modułu, gdy nazwa może się powtórzyć w innym module (`M3_ASSIST_*`, `M4_AI_*`, `M5_ASSISTANT_*`).

## Podział między modułami (triaż 2026-10-04)

Moduły 2–5 są budowane równolegle przez różne osoby. Przegląd planów M2 (v0.4), M3 (v0.3), M5 (v0.4) i kodu M4 nie wykazał kolizji tabel, endpointów ani tras — każdy moduł ma własne. Ustalenia poniżej rozstrzygają wspólne miejsca; szczegóły są w „Uwagach między zadaniami” każdego modułu (wpis `[triaż → …]`).

**Właściciele wspólnych elementów**

| Element | Właściciel | Pozostali |
|---|---|---|
| `web/src/components/SolutionCard.tsx`, Biblioteka `/rozwiazania`, `/api/solutions` (filtry), `/api/stats` | M2 (Z13, Z04, Z05, Z12) | tylko używają; nowe propsy wyłącznie opcjonalne |
| Materiały ROPS (Social Canvas, przewodniki, podcast) | M2 (Z02, `/wiedza/materialy`) | M3 linkuje, nie powiela |
| `web/src/lib/auth.tsx` (rola `mentor`), przebudowa `MainNav.tsx` pod role | M5 (PK20) | M3 dopisuje swoją pozycję po PK20 |
| Słowo „nabór” (konkurs grantowy, `/nabory`) | M3 | M4 mówi „rekrutacja testerów” (TI08) |
| `api/providers/llm.py` (Anthropic), `llm_openai.py` (OpenAI, domyślny) | M1 (`stream()`) + `complete()` z M4; dostawca z `LLM_PROVIDER` (ADR-020, `feature-2026-10-04-1`) | M3 ma osobny `llm_assist.py` (obsługuje obu dostawców) |
| Nazwy `application_status`, `material_type`, `test_mode`, `tester_type`, `ApplicationStatus`, `APPLICATION_STATUS_LABELS`, `FeedbackModerate` | M4 | M3 używa `GrantApplication*` |

**Rozstrzygnięcia**

1. **Schemat bazy** — osobne pliki: `db/m2-zasobnik.sql`, `db/m3-kreator.sql`, `db/m5-komunikacja.sql`. Tylko M2 zmienia tabelę M1 (`solutions.knowledge_type` w `init.sql`, Z00). Po scaleniu Z00 wszyscy: `make reset-db && make ingest && make seed-m4` + seedy pozostałych modułów.
2. **Ustawienia asystentów** — `M3_ASSIST_*` (M3) i `M5_ASSISTANT_*` (M5) zamiast prawie identycznych `ASSIST_*` / `ASSISTANT_*`.
3. **Kanały odpowiedzi do autora** zostają rozdzielone: `report_replies` (M1), `idea_replies` (M3), wątki M5. Scalanie (PK11) — backlog M5; nieaktualna notatka w M3 poprawiona.
4. **Skrzynka panelu** (`web/src/pages/panel/InboxPage.tsx`, plik M1) pokazuje wszystko, co czeka na Hub: sekcja M1 bez zmian, „Nowe pomysły” (M3, K11), „Rozmowy czekające na Hub” (M5, PK24). `PanelLayout.tsx`: „Testerzy” (M4), „Pomysły” (M3), „Rozmowy” (M5), każdy z własnym licznikiem.
5. **Rola `mentor`** (M5) widzi Matchmaking, Zasobnik i „Moje konsultacje” — bez Kreatora i Testera.
6. **Długi M4** (już na masterze) zebrane w TI08: `innovation-tests.css` → Tailwind, bez e-maila i imienia testera w zapytaniu do AI, limity z ustawień, słownictwo „rekrutacja testerów”.
7. **Drobne:** M3 COULD „problemy czekające na pomysł” korzysta z `GET /api/stats/coverage` (M2, Z05). Formularz `/mam-pomysl` po K08 przestaje tworzyć `solutions` `PENDING_REVIEW` — kolejka `/panel/rozwiazania` nie dostaje już pomysłów (ADR-M3-001). URL „Mapy Wyzwań Społecznych” w K12 do sprawdzenia — research M2 jej nie znalazł.

**Pliki edytowane przez kilka modułów — zasady**

| Plik | Moduły |
|---|---|
| `api/config.py`, `api/main.py`, `Makefile` | M2, M3, M5 (M4 już jest) |
| `.env.example` | M2, M3, M4 (TI08) |
| `web/src/App.tsx` | M2, M3, M5 |
| `web/src/api/types.ts`, `web/src/api/client.ts` | M2, M3 (M5 ma osobny `api/comm.ts`) |
| `web/src/components/layout/MainNav.tsx`, `PanelLayout.tsx` | M3, M5 |
| `web/src/lib/labels.ts` | M3, M4 (TI08) |
| `web/src/pages/panel/InboxPage.tsx` | M3 (K11), M5 (PK24) |
| `web/src/components/chat/*` | M3 (K08: `NoMatchNotice`, `ChatResults`); M2 zmienia kartę, którą czat wyświetla |

- Dopisuj na końcu sekcji blokiem z komentarzem `Moduł N`; nie przestawiaj ani nie formatuj cudzych linii.
- Zadania szkieletowe trafiają na master najwcześniej, małymi PR-ami: M2 Z00 + Z06, M3 K01 + K07, M5 PK00 + PK01 + PK20. Przed PR: `git pull --rebase` z mastera.
- Kolejność dla `MainNav.tsx`: najpierw M5 PK20 (przebudowa pod role), potem M3 K07.
