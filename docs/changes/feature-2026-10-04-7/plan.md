# feature-2026-10-04-7 — plan

## Stan obecny

- `InnovationTestAccessPage.tsx` pokazuje tytuł testu i status; `FeedbackForm.tsx` renderuje wszystkie pytania
  naraz (radio + `RATING_SCALE_LABELS`), walidacja jednym alertem.
- `InnovationTestAccessStatus` (`api/schemas.py`) ma tylko `test_title`; `verify_access_token` ładuje `test`
  bez `solution`.

## Kroki

1. **API (addytywnie)**
   - `api/schemas.py`: `InnovationTestAccessStatus` += `solution_title: str | None`,
     `solution_summary: str | None`, `instruction: str`.
   - `api/innovation_tests.py`: `verify_access_token` doładowuje `test.solution` (`selectinload` łańcuchowo).
   - `api/routers/innovation_tests.py`: `get_access_status` wypełnia nowe pola.
2. **Frontend**
   - `web/src/api/types.ts`: lustro pól.
   - `web/src/components/innovation-tests/FeedbackForm.tsx`: przepisany na kroki (stan `step`, 6 pytań
     + podsumowanie), kafelki ocen (`sr-only` radio w `label`, `has-[:checked]` / `has-[:focus-visible]`),
     pasek `ds-bar`, fokus na nagłówku kroku, `aria-live`. Props bez zmian.
   - `web/src/pages/InnovationTestAccessPage.tsx`: sekcja „Co oceniasz” (rozwiązanie, instrukcja, czas).
3. **Dokumentacja** — indeks `docs/changes/README.md`, „Uwagi” w `module-4-tasks.md`.

## Weryfikacja ręczna

- `curl /api/innovation-tests/access/<token>` — nowe pola, bez kontaktu.
- `ruff check api`, `npm run lint`, `npm run build`.
- Przeglądarka: przejście 6 kroków, „Dalej” bez oceny, „Zmień” z podsumowania, wysłanie.

## Wynik

- Sprawdzone: `curl /access/{token}` zwraca `solution_title`, `solution_summary`, `instruction` i nadal nie zwraca
  danych kontaktowych; `ruff check api`, `npm run lint`, `npm run build`.
- Niesprawdzone: przejście ankiety w przeglądarce (klawiatura, czytnik ekranu, wysoki kontrast, 360 px).
