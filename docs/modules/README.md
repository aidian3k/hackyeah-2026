# Moduły platformy Splot

Siedem funkcjonalności z `docs/base.md` §2. Każdy moduł ma specyfikację HTML (sekcje ze statusami `stable` / `draft` / `todo`) i plik zadań z protokołem pracy agentów — wzór: Moduł 1.

| # | Moduł (`base.md`) | Specyfikacja | Zadania | Stan |
|---|---|---|---|---|
| 1 | I. Matchmaking społeczny (obligatoryjny) | `01-matchmaking/module-1-matchmaking.html` | `01-matchmaking/module-1-tasks.md`, frontend: `01-matchmaking/frontend-tasks.md` (+ `module-1-calibration.md`, `frontend-a11y.md`) | gotowy (T00–T26, F00–F21) |
| 2 | II. Zasobnik wiedzy | `02-zasobnik-wiedzy/module-2-zasobnik-wiedzy.html` | `02-zasobnik-wiedzy/module-2-tasks.md` | draft v0.4 (zakres, model, API, ekrany, odświeżenie Biblioteki, ADR-M2-001–008, źródła: `02-zasobnik-wiedzy/rops-zasoby-kontekst.md`); zadania Z00–Z14 rozpisane |
| 3 | III. Kreator pomysłów | `03-kreator-pomyslow/module-3-kreator-pomyslow.html` | `03-kreator-pomyslow/module-3-tasks.md` (materiały: `docs/resources/rops/`) | draft v0.3 (zakres pod hackathon); zadania K00–K13 do wzięcia |
| 4 | IV. Tester innowacji | `04-tester-innowacji/module-4-tester-innowacji.html` | `04-tester-innowacji/module-4-tasks.md` | szkielet; brak |
| 5 | V. Platforma aktywnej komunikacji | `05-platforma-komunikacji/module-5-platforma-komunikacji.html` | `05-platforma-komunikacji/module-5-tasks.md` | draft v0.4 (uproszczony); zadania PK00–PK05 (backend), PK20–PK26 (frontend) do wzięcia; zalążek: odpowiedzi do autora |
| 6 | VI. Panel administratora | `06-panel-administratora/module-6-panel-administratora.html` | `06-panel-administratora/module-6-tasks.md` | szkielet; w dużej części pokryty przez M1 |
| 7 | VII. Middleman Innowacji | `07-middleman-innowacji/module-7-middleman-innowacji.html` | `07-middleman-innowacji/module-7-tasks.md` | szkielet; brak |

Mocki strumieni SSE zostają w `docs/mocks/` — korzystają z nich `Makefile` (`make web-mock`) i skrypty w `web/scripts/`.

## Konwencje dla modułów 2–7

- Prefiksy zadań: `Z` (2), `K` (3), `TI` (4), `PK` (5), `PA` (6), `MI` (7) — bez kolizji z `T` (Moduł 1) i `F` (frontend).
- ADR numerowane per moduł: `ADR-M2-001`, … — ADR-001 – 019 należą do Modułu 1.
- Twarde reguły z `AGENTS.md` obowiązują wszystkie moduły. Moduł 1 jest kontraktem zewnętrznym: zmiana jego tabel lub endpointów = ADR + wpis w „Uwagach między zadaniami” `docs/modules/01-matchmaking/module-1-tasks.md`.
- Specyfikacja przechodzi z `szkielet` do `draft` po sesji planowania; zadania rozpisujemy dopiero wtedy.
