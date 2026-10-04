# feature-2026-10-04-6 — plan

## Stan obecny

- `innovation_test_applications` (`db/init.sql`): `wojewodztwo`, `powiat`, `gmina`, `motivation` — `TEXT NOT NULL`.
- `InnovationTestApplicationCreate` (`api/schemas.py`): te pola wymagane, `min_length=2` / `10`.
- `ApplicationForm.tsx`: atrybuty `required` przy `noValidate`, jedna walidacja (zgoda); reszta to surowy
  komunikat 422 z backendu w alercie nad formularzem.
- Pola lokalizacji czytają: `api/routers/innovation_tests.py` (`_application_read`, filtr `location_q`),
  `api/pipeline/innovation_tests.py` (prompt `suggest_tester_fit`), `scripts/seed_innovation_tests.py`
  + `data/innovation-tests-seed.json`, panel `InnovationTestManagePage.tsx`, typy w `web/src/api/types.ts`.

## Kroki

1. **Schemat**
   - `db/init.sql`: zamiast trzech kolumn `address TEXT` (NULL), `motivation TEXT` (NULL).
   - Nowy `db/m4-tester.sql` (idempotentny, ładuje się też przy świeżej bazie po `init.sql`):
     `ADD COLUMN IF NOT EXISTS address`, przepisanie `gmina, powiat, wojewodztwo` do `address`, gdy istnieją
     (blok `DO` sprawdzający `information_schema`), `DROP COLUMN IF EXISTS` trzech kolumn,
     `ALTER COLUMN motivation DROP NOT NULL`.
   - `Makefile`: cel `db-m4` jak `db-m3`.
   - `api/models.py`: `address: Mapped[str | None]`, `motivation: Mapped[str | None]`.
2. **API**
   - `api/schemas.py`: `InnovationTestApplicationCreate` — `tester_type` domyślnie `RESIDENT`,
     `address: str | None` (max 300), `is_target_group_member` domyślnie `False`,
     `motivation: str | None` (max `M4_MOTIVATION_MAX_CHARS`); puste napisy → `None`.
     `InnovationTestApplicationRead`: `address`, `motivation` jako `str | None`.
   - `api/innovation_tests.py`: `create_application` zapisuje `address`.
   - `api/routers/innovation_tests.py`: `_application_read`, filtr `location_q` po `address`.
   - `api/pipeline/innovation_tests.py`: prompt bez lokalizacji testera, `motivation` może być `None`.
3. **Seed** — `data/innovation-tests-seed.json`: `address` zamiast trzech pól (część zgłoszeń bez adresu
   i bez uzasadnienia); `scripts/seed_innovation_tests.py` czyta nowe pola.
4. **Frontend**
   - `web/src/api/types.ts`: lustro schematów.
   - `web/src/lib/labels.ts`: przyjazne `TESTER_TYPE_LABELS`, `TESTER_TYPE_FORM_OPTIONS` (bez `TARGET_MEMBER`).
   - `ApplicationForm.tsx`: przepisany według wzorca `IdeaForm` (stan `errors`, `validate`, `errorsFromServer`,
     fokus na pierwszy błąd, `aria-live`, `ds-error`, `ds-hint`, liczniki znaków przy uzasadnieniu).
   - `InnovationTestManagePage.tsx`: adres zamiast „gmina, powiat”.
5. **Dokumentacja** — wiersz w indeksie `docs/changes/README.md`; wpis w „Uwagach między zadaniami”
   `module-4-tasks.md` (zmiana ustalenia o minimalnych danych testera i schemacie).

## Weryfikacja ręczna

- `make db-m4` dwukrotnie na obecnej bazie; `psql \d innovation_test_applications`.
- `curl` zgłoszenia z samym imieniem/e-mailem/zgodą → 201; z błędnym e-mailem → 422 `email: …`.
- `ruff check .`, `npm run lint`, `npm run build`.
- Przeglądarka: pusty formularz → błędy przy polach i fokus; poprawne wysłanie → komunikat sukcesu.

## Wynik

- Sprawdzone: `make db-m4` dwukrotnie na bazie demo (stare pola → `address`, drugi przebieg bez błędu);
  `curl` z samym imieniem/e-mailem/zgodą → 201; błędny e-mail → 422 `email: …` (formularz mapuje go na pole);
  filtr `location_q` po adresie; `ruff check api scripts`, `npm run lint`, `npm run build`.
- Niesprawdzone: formularz w przeglądarce (fokus, czytnik ekranu, wysoki kontrast), świeża baza po
  `make reset-db && make seed-m4`.
