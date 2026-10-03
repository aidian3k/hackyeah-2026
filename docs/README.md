# Dokumentacja Splot

Mapa całej dokumentacji projektu. Reguły pracy (dla ludzi i agentów) są w [`AGENTS.md`](../AGENTS.md),
uruchomienie — w [`README.md`](../README.md).

```
docs/
  README.md        # ten plik — mapa dokumentacji
  base.md          # kontekst biznesowy wyzwania ROPS (źródło nazw modułów)
  modules/         # specyfikacje modułów 1–7 i plany zadań — CO budujemy
  changes/         # zmiany po sprincie: spec.md + plan.md per zmiana — CO poprawiamy
  mocks/           # mocki SSE/JSON dla frontendu (make web-mock, web/scripts/)
  resources/       # materiały źródłowe (dokumenty ROPS: wzory wniosków, karty oceny, Social Canvas)
DESIGN.md          # zasady interfejsu (w katalogu głównym)
design-system/     # tokeny, komponenty ds-*, preset Tailwinda, strona przykładów
```

## Gdzie co jest

| Potrzebuję… | Plik |
|---|---|
| zrozumieć wyzwanie i moduły | [`base.md`](base.md) |
| przeglądu modułów i ich stanu | [`modules/README.md`](modules/README.md) |
| specyfikacji Modułu 1 (źródło prawdy, ADR) | [`modules/01-matchmaking/module-1-matchmaking.html`](modules/01-matchmaking/module-1-matchmaking.html) |
| zadań backendu Modułu 1 (T00–T26) | [`modules/01-matchmaking/module-1-tasks.md`](modules/01-matchmaking/module-1-tasks.md) |
| zadań frontendu (F00–F21) | [`modules/01-matchmaking/frontend-tasks.md`](modules/01-matchmaking/frontend-tasks.md) |
| kalibracji progów wyszukiwania | [`modules/01-matchmaking/module-1-calibration.md`](modules/01-matchmaking/module-1-calibration.md) |
| przeglądu dostępności i scenariusza demo | [`modules/01-matchmaking/frontend-a11y.md`](modules/01-matchmaking/frontend-a11y.md) |
| specyfikacji i zadań Modułu 3 — Kreator pomysłów (K00–K19) | [`modules/03-kreator-pomyslow/module-3-kreator-pomyslow.html`](modules/03-kreator-pomyslow/module-3-kreator-pomyslow.html), [`modules/03-kreator-pomyslow/module-3-tasks.md`](modules/03-kreator-pomyslow/module-3-tasks.md) |
| materiałów ROPS (nabory grantowe, wzory wniosków, Social Canvas, Mapa Wyzwań) | [`resources/rops/README.md`](resources/rops/README.md), [`resources/rops/RAPORT.md`](resources/rops/RAPORT.md) |
| zgłoszonych zmian i poprawek po sprincie | [`changes/README.md`](changes/README.md) |
| zasad wyglądu i komponentów | [`../DESIGN.md`](../DESIGN.md), [`../design-system/README.md`](../design-system/README.md) |
| mocków do pracy bez backendu | [`mocks/README.md`](mocks/README.md) |

## Gdzie dopisać nowy dokument

- **Nowy moduł albo duża funkcjonalność** → `modules/NN-nazwa/` (specyfikacja HTML ze statusami
  sekcji + plik zadań z protokołem pracy) — konwencje w `modules/README.md`.
- **Zmiana lub poprawka zbudowanych rzeczy** → `changes/<typ>-<data>-<n>/spec.md` (+ `plan.md`).
- **Zasada obowiązująca cały projekt** → `AGENTS.md`.
- **Nowy komponent wizualny** → `design-system/` zgodnie z `DESIGN.md`.

Nie zakładaj nowych katalogów dokumentacji poza `docs/` (dawny `spec/` został tu przeniesiony).
