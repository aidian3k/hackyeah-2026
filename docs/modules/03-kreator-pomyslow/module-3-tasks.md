# Moduł 3 — Kreator pomysłów: plan implementacji i zadania

> **Szkielet.** Zadania powstaną po sesji planowania i wypełnieniu specyfikacji `docs/modules/03-kreator-pomyslow/module-3-kreator-pomyslow.html`. Do tego czasu nie bierz zadań z tego pliku.

Plan na podstawie `docs/modules/03-kreator-pomyslow/module-3-kreator-pomyslow.html` (v0.1). Każde zadanie jest samowystarczalne: zawiera cel, pliki, wklejony kontekst ze specyfikacji, kroki i kryterium gotowości. Agent wykonujący zadanie **nie musi czytać specyfikacji HTML** — ale musi przeczytać `CLAUDE.md` (twarde reguły) oraz sekcję „Wspólne kontrakty” poniżej.

**Odstępstwa od specyfikacji (decyzja zespołu, 2026-10-03, jak w Module 1):**
- **Bez autoryzacji.** Wszystkie endpointy są otwarte; bez tokenów, nagłówków dostępu i kodów 401/403.
- **Bez testów automatycznych.** Weryfikacja każdego zadania: curl, psql, `python -c`, ręczne uruchomienie.

## Protokół pracy (obowiązkowy)

1. **Jedyne źródło statusu** to lista „Status zadań” poniżej. Treść zadań nie zawiera statusu.
2. Stany:
   - `- [ ]` — wolne,
   - `- [~]` — w toku; dopisz na końcu linii ` — agent: <nazwa>, <RRRR-MM-DD GG:MM>`,
   - `- [x]` — zrobione; zamień dopisek na ` — zrobione: <nazwa>, <krótka notka lub hash commita>`.
3. **Branie zadania:** wybierz zadanie `[ ]`, którego wszystkie zależności są `[x]`. Edytuj tylko jego linię na `[~]`, potem przeczytaj plik ponownie i sprawdź, czy linia nadal ma Twój dopisek (jeśli ktoś był szybszy — weź inne zadanie).
4. Edytuj w tym pliku **wyłącznie linię swojego zadania** oraz (ewentualnie) dopisuj na końcu sekcji „Uwagi między zadaniami”. Nie przepisuj innych linii, nie formatuj pliku.
5. Zmieniaj w repozytorium **tylko pliki wymienione w polu „Pliki” swojego zadania**. Potrzebujesz zmiany w cudzym pliku → wpis w „Uwagach między zadaniami” (`- [Kxx → Kyy] opis`), nie edycja. Zmiana w plikach Modułu 1 (`api/`, `db/init.sql`) lub frontendu → wpis w „Uwagach” odpowiedniego pliku zadań.
6. `[x]` dopiero, gdy spełnione jest „Gotowe, gdy” (ręczna weryfikacja opisana w zadaniu) i `ruff check .` (backend) albo `npm run lint && npm run build` (frontend) jest czysty dla Twoich plików.
7. Zablokowany (brak klucza API, błąd w zależności, sprzeczność ze specyfikacją) → przywróć `[ ]` i opisz przyczynę w „Uwagach między zadaniami”.
8. Sygnatury z sekcji „Wspólne kontrakty” są wiążące. Jeśli musisz je zmienić — najpierw wpis w „Uwagach”, nie cicha zmiana.

## Status zadań

Identyfikatory: `K00`, `K01`, … (prefiks modułu, żeby nie kolidować z `T` Modułu 1 i `F` frontendu).

<!-- Format linii: - [ ] K00 · Opis · zależy: — / Kxx, T.., F.. -->

_(brak zadań — do rozpisania po sesji planowania)_

### Fale równoległości (orientacyjnie)

_(do ustalenia)_

**Najkrótsza działająca ścieżka** (gdy brakuje czasu): _(do ustalenia — minimalny zestaw zadań pokazywalny w demo)_

---

## Wspólne kontrakty (wiążące dla wszystkich zadań)

### Konwencje

- Konwencje Modułu 1 obowiązują bez zmian (`docs/modules/01-matchmaking/module-1-tasks.md`, „Wspólne kontrakty → Konwencje”): pakiety `api.*`, importy absolutne, async przy I/O, dane w `data/`, ustawienia w `api.config.settings`.
- Frontend: konwencje z `docs/modules/01-matchmaking/frontend-tasks.md` (klient `web/src/api/client.ts`, komponenty wspólne z F05, design system).

### Zależności od Modułu 1 i frontendu

_(do ustalenia: które tabele, endpointy, typy i komponenty reużywamy; które zmieniamy — każda zmiana z ADR)_

### Nazwy i sygnatury, z których korzystają inne zadania

_(do ustalenia)_

---

## Zadania

_(do rozpisania — szablon jednego zadania poniżej)_

<!--
### K00 · Tytuł

**Cel:** jedno zdanie.
**Zależy od:** —
**Pliki:** `ścieżka/plik.py` (nowy), `ścieżka/inny.py` (zmiana)

**Kontekst ze specyfikacji:**
- wklejone fragmenty sekcji spec potrzebne do zadania

**Kroki:**
1. …

**Gotowe, gdy:**
- konkretne polecenie curl / psql / python -c i oczekiwany wynik
-->

---

## Uwagi między zadaniami

_(dopisuj na końcu: `- [Kxx → Kyy] opis`)_
