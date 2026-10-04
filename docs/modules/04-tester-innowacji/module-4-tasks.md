# Moduł 4 — Tester innowacji: plan implementacji i zadania

Plan na podstawie `docs/modules/04-tester-innowacji/module-4-tester-innowacji.html` (v0.2) oraz ustaleń sesji planowania. Zadania są samowystarczalne: zawierają cel, pliki, kontrakty, kroki i kryterium gotowości. Agent wykonujący zadanie musi przeczytać `CLAUDE.md`, ten plik oraz sekcję „Wspólne kontrakty”.

## Ustalenia z sesji planowania

- Moduł obsługuje pełny cykl testu: Hub publikuje nabór, tester zgłasza udział, Hub akceptuje lub odrzuca zgłoszenie, zaakceptowany tester otrzymuje materiały i instrukcję, wykonuje test, a następnie wypełnia ankietę.
- Przedmiotem testu jest uniwersalny artefakt: opis, instrukcja, zewnętrzny plik, link, aplikacja/demo, usługa albo metoda pracy testowana offline.
- Nabory tworzy i publikuje wyłącznie Hub. Autor innowacji może dostarczać dane i materiały, ale nie publikuje naboru.
- Testerem może być osoba indywidualna albo instytucja. Minimalne dane: imię lub nazwa organizacji, e-mail, typ testera, województwo/powiat/gmina, przynależność do grupy docelowej i uzasadnienie udziału.
- Dane kontaktowe widzi wyłącznie Hub. Autor otrzymuje anonimowe agregaty i moderowane komentarze.
- Nabór ma status `OPEN` albo `CLOSED`; zamknięcie jest nieodwracalne. Po osiągnięciu limitu miejsc nabór zamyka się automatycznie.
- Udział testera ma status `SUBMITTED`, `ACCEPTED`, `REJECTED`, `COMPLETED` albo `CANCELED`.
- Hub ręcznie akceptuje testerów. AI tylko sugeruje dopasowanie do grupy docelowej i nie podejmuje decyzji.
- Jeden tester może mieć najwyżej trzy aktywne zgłoszenia; identyfikatorem w MVP jest znormalizowany e-mail.
- Tester może wycofać zgłoszenie przed decyzją, ale nie może go edytować; zmiana danych wymaga nowego zgłoszenia.
- Ankieta wymaga czterech ocen 1–5: przydatność, łatwość użycia, dostępność i dopasowanie do potrzeb. Komentarz i propozycja usprawnienia są opcjonalne.
- Skala: `1 = bardzo słabo`, `2 = słabo`, `3 = średnio`, `4 = dobrze`, `5 = bardzo dobrze`.
- Po zapisaniu ankiety system ustawia `COMPLETED`; `POST` ankiety działa tylko raz. Tester albo Hub może ustawić `CANCELED`, ale powód jest wymagany.
- Hub przekazuje materiały ręcznie poza platformą. Brak uploadu i repozytorium plików w MVP.
- Tester otrzymuje jednorazowy link z losowym tokenem; w bazie jest tylko hash. Token działa do zamknięcia naboru, a `GET` pokazuje status także po ankiecie.
- W MVP nie ma automatycznych e-maili. Hub kopiuje status i link z panelu.
- Komentarze są widoczne dla autora dopiero po moderacji Hubu. Autor otrzymuje raport dopiero po zamknięciu naboru.
- AI używa Anthropic Claude jak w Module 1. Raport może powstać przy dowolnej liczbie odpowiedzi, ale przy mniej niż 3 ankietach pokazuje ostrzeżenie o małej próbie.
- Raport AI ma JSON: `summary_pl`, `barriers_pl[]`, `improvements_pl[]`, `evidence_feedback_ids[]`, `disclaimer_pl`; bez końcowej rekomendacji.
- AI otrzymuje formularz testera do sugestii dopasowania **bez danych kontaktowych** (bez `email` i `display_name` — triaż 2026-10-04, TI08). Brak osobnej zgody na ten transfer wymaga przeglądu RODO przed produkcją.
- Przy wyłączonym lub niedostępnym AI działają ręczne decyzje Hubu, statystyki i anonimowe komentarze.
- Zgłoszenie wymaga `consent=true`, wersji tekstu zgody i `consented_at`; obowiązuje jeden stały tekst zgody dla Modułu 4.
- Publiczny `OPEN` wymaga `solutions.status = PUBLISHED`. `PENDING_REVIEW` jest tylko dla Hubu lub zaproszonych testerów i nie jest listowany publicznie.
- Model danych używa tabel `innovation_tests`, `innovation_test_materials`, `innovation_test_applications` i `innovation_test_feedback`, z FK do `solutions` i kaskadowym usuwaniem zgłoszeń.
- Raport AI jest JSONB w `innovation_tests`, z wersją promptu/modelu i czasem generacji; Hub może go regenerować.
- Główny zasób API to `/api/innovation-tests`. Dostęp testera: `/api/innovation-tests/access/{token}`.
- API obejmuje publiczną listę/szczegóły `OPEN`, publiczne zgłoszenie, status i ankietę przez token oraz panel Hubu: CRUD naborów, zgłoszenia, decyzje, anulowanie, raport i moderację.

## Odstępstwa i zasady wspólne

- Bez autoryzacji: endpointy panelu są otwarte, zgodnie z decyzją zespołu dla całego PoC. Token dotyczy wyłącznie dostępu testera do jego udziału.
- Bez testów automatycznych. Weryfikacja: `curl`, `psql`, `python -c`, ręczne przejście w przeglądarce, `ruff check .`, `npm run lint`, `npm run build`.
- Zmiana `db/init.sql`, `api/models.py`, `api/schemas.py` lub istniejących routerów Modułu 1 wymaga wpisu w „Uwagach między zadaniami” tego pliku i nie może zmieniać kontraktów Modułu 1 po cichu.

## Protokół pracy

1. Jedyne źródło statusu to lista „Status zadań”.
2. `[ ]` oznacza zadanie wolne, `[~]` zadanie w toku, `[x]` zadanie ukończone.
3. Przed rozpoczęciem zmień wyłącznie linię swojego zadania na `[~]` i dopisz agenta oraz czas.
4. Zmieniaj tylko pliki wymienione w swoim zadaniu. Potrzebną zmianę w cudzym zadaniu wpisz w „Uwagach między zadaniami”.
5. `[x]` dopiero po spełnieniu „Gotowe, gdy” i przejściu właściwego lint/build.
6. Zablokowane zadanie wróć do `[ ]` i opisz przyczynę w „Uwagach”.

## Status zadań

- [x] TI00 · DDL i modele cyklu testowego · zależy: T01, T02 — zmiana `db/init.sql` wymaga wpisu w uwagach Modułu 1 · agent: Auto · 2026-10-04
- [x] TI01 · Kontrakty Pydantic, statusy i walidacja domenowa · zależy: TI00, T08 · agent: Auto · 2026-10-04
- [x] TI02 · Tokeny dostępu testera i operacje udziału · zależy: TI00, TI01, T15 · agent: Auto · 2026-10-04
- [x] TI03 · API publiczne i panelu Hubu · zależy: TI01, TI02, T15 · agent: Auto · 2026-10-04
- [x] TI04 · Pipeline AI: dopasowanie, agregacja i raport · zależy: TI01, T05, TI03 · agent: Auto · 2026-10-04
- [x] TI05 · Frontend publiczny: lista naborów, zgłoszenie i dostęp tokenowy · zależy: TI03, F04, F05 · agent: Auto · 2026-10-04
- [x] TI06 · Frontend panelu Hubu: nabory, zgłoszenia, moderacja i raport · zależy: TI03, TI04, F04, F05 · agent: Auto · 2026-10-04
- [x] TI07 · Dane demo, integracja i ścieżka demonstracyjna · zależy: TI02, TI03, TI04, TI05, TI06 · agent: Auto · 2026-10-04
- [x] TI08 · Porządki po triażu modułów: „rekrutacja testerów” zamiast „nabór” w UI, CSS → Tailwind, bez e-maila w AI, limity w ustawieniach · zależy: TI07 · zrobione: claude-TI08 · 2026-10-04

### Fale równoległości

- Fala 0: TI00
- Fala 1: TI01
- Fala 2: TI02, TI04
- Fala 3: TI03
- Fala 4: TI05, TI06
- Fala 5: TI07
- Fala 6: TI08 (porządki; nie blokuje demo)

**Najkrótsza działająca ścieżka demo:** TI00–TI03, TI05, TI06, TI07 z `M4_AI_ENABLED=false`. Pokazuje: Hub tworzy `OPEN`, użytkownik widzi nabór, składa zgłoszenie, Hub akceptuje, tester otwiera tokenowy status, wysyła ankietę, a Hub widzi statystyki i moderuje komentarz. TI04 dochodzi z sugestią AI i raportem.

## Wspólne kontrakty

### Konwencje

- Backend: pakiety `api`, `api.routers`, `api.pipeline`, `api.providers`; importy absolutne; async przy I/O; ustawienia przez `api.config.settings`.
- Frontend: konwencje z `docs/modules/01-matchmaking/frontend-tasks.md`, React/TypeScript strict, design system, WCAG 2.1 AA, teksty po polsku.
- Statusy Python/SQL używają wartości ASCII: `OPEN`, `CLOSED`, `SUBMITTED`, `ACCEPTED`, `REJECTED`, `COMPLETED`, `CANCELED`.
- E-mail normalizuj przez `strip().casefold()` i przechowuj do limitu oraz wyszukiwania; nie loguj jego wartości.
- W logach nie ma e-maila, imienia, nazwy organizacji, uzasadnienia, komentarza ani tokenu. Loguj identyfikator rekordu i długości tekstów.
- Token generuj kryptograficznie, przechowuj wyłącznie hash, porównuj stałoczasowo i nigdy nie zwracaj go w API panelu poza jednorazowym wygenerowaniem linku.

### Nazwy i sygnatury

| Symbol | Moduł | Właściciel |
|---|---|---|
| `InnovationTestStatus`, `ApplicationStatus`, `MaterialType` | `api/models.py` | TI00 |
| `InnovationTest`, `InnovationTestMaterial`, `InnovationTestApplication`, `InnovationTestFeedback` | `api/models.py` | TI00 |
| `InnovationTestCreate`, `InnovationTestRead`, `InnovationTestMaterialIn`, `InnovationTestApplicationCreate`, `InnovationTestApplicationRead`, `InnovationTestDecision`, `InnovationTestCancel`, `InnovationTestFeedbackCreate`, `InnovationTestReport` | `api/schemas.py` | TI01 |
| `normalize_tester_email(email) -> str` | `api/innovation_tests.py` | TI01 |
| `create_access_token() -> tuple[str, str]` | `api/innovation_tests.py` | TI02 |
| `hash_access_token(token: str) -> str` | `api/innovation_tests.py` | TI02 |
| `async verify_access_token(session, token: str) -> InnovationTestApplication` | `api/innovation_tests.py` | TI02 |
| `async create_application(...) -> tuple[InnovationTestApplication, str]` | `api/innovation_tests.py` | TI02 |
| `async submit_feedback(...) -> InnovationTestFeedback` | `api/innovation_tests.py` | TI02 |
| `async build_test_report(session, test_id: int) -> InnovationTestReport` | `api/pipeline/innovation_tests.py` | TI04 |
| `async suggest_tester_fit(application, test) -> TesterFitSuggestion` | `api/pipeline/innovation_tests.py` | TI04 |
| `async summarize_test_feedback(test, feedback) -> AiTestReport` | `api/pipeline/innovation_tests.py` | TI04 |
| `router` | `api/routers/innovation_tests.py` | TI03 |

### Model danych

- `innovation_tests`: `id`, `solution_id`, wymagane pola naboru, `status`, `created_at`, `closed_at`, `ai_report JSONB`, `ai_model`, `ai_prompt_version`, `ai_generated_at`.
- `innovation_test_materials`: `id`, `test_id`, `title`, `type`, `locator`, `description`, `sort_order`.
- `innovation_test_applications`: `id`, `test_id`, dane testera, `email_normalized`, `status`, `consent`, `consent_version`, `consented_at`, `rejection_reason`, `cancel_reason`, `access_token_hash`, `access_token_created_at`, `access_token_used_at`, timestamps, opcjonalna sugestia dopasowania AI.
- `innovation_test_feedback`: `id`, `application_id`, cztery oceny 1–5, `comment`, `improvement`, `comment_visible_to_author`, `submitted_at`, timestamps.
- Dane kontaktowe i pełny feedback są widoczne tylko w panelu Hubu; API publiczne tokenowe zwraca wyłącznie dane własnego udziału.
- Usunięcie zgłoszenia testera usuwa jego feedback i token. Statystyki raportu mogą pozostać jako dane anonimowe.

### Kontrakt raportu AI

```json
{
  "summary_pl": "string",
  "barriers_pl": ["string"],
  "improvements_pl": ["string"],
  "evidence_feedback_ids": [123],
  "disclaimer_pl": "Wynik pomocniczy; decyzję podejmuje Hub."
}
```

Prompt przyjmuje dane feedbacku bez danych kontaktowych testera. Sugestia dopasowania może przyjąć pełny formularz zgodnie z decyzją zespołu, ale musi mieć wynik opisowy, uzasadnienie i wyraźne oznaczenie „sugestia, nie decyzja”.

## Zadania

### TI00 · DDL i modele cyklu testowego

**Cel:** dodać schemat i modele SQLAlchemy dla naborów, materiałów, zgłoszeń i feedbacku bez naruszania istniejących tabel Modułu 1.

**Zależy od:** T01, T02

**Pliki:** `db/init.sql`, `api/models.py`

**Kontekst:**
- Każdy nabór wskazuje `solutions.id`; publiczny `OPEN` wymaga `solutions.status = PUBLISHED`.
- Nabór ma `OPEN`/`CLOSED`; udział ma `SUBMITTED`/`ACCEPTED`/`REJECTED`/`COMPLETED`/`CANCELED`.
- `CLOSED` jest nieodwracalne. FK do `solutions` i kaskady dotyczą dzieci naboru.
- Tokeny i dane kontaktowe nie mogą mieć indeksów ujawniających ich treść; indeksuj hash i e-mail znormalizowany.

**Kroki:**
1. Dopisz enumy i cztery tabele do `db/init.sql`, z ograniczeniami `CHECK` dla ocen 1–5 i wymaganych statusów.
2. Dodaj indeksy dla `status`, `solution_id`, `email_normalized`, `test_id` oraz `application_id`.
3. W `api/models.py` odwzoruj DDL 1:1, bez `create_all`.
4. Dodaj relacje z cascade delete-orphan i odczyt JSONB raportu.

**Nie rób:** uploadu plików, osobnych kont użytkowników, zmian istniejących tabel bez notatki, autoryzacji STAFF.

**Gotowe, gdy:** po resecie bazy `psql` pokazuje cztery tabele, ograniczenia ocen odrzucają `0` i `6`, insert naboru z `solution_id` działa, usunięcie naboru usuwa materiały/zgłoszenia/feedback, a `ruff check api/models.py` jest czysty.

### TI01 · Kontrakty Pydantic, statusy i walidacja domenowa

**Cel:** zdefiniować stabilne wejścia/wyjścia API i walidatory niezależne od routera.

**Zależy od:** TI00, T08

**Pliki:** `api/schemas.py`, `api/innovation_tests.py`

**Kroki:**
1. Dodaj schematy wskazane w tabeli kontraktów.
2. Waliduj komplet wymaganych pól naboru, co najmniej jeden materiał, dodatni limit miejsc i termin zakończenia.
3. Waliduj e-mail, typ testera, lokalizację, cztery oceny 1–5, zgodę i długości tekstów.
4. Zaimplementuj `normalize_tester_email`; nie zwracaj e-maila w schematach publicznych.
5. Zdefiniuj odpowiedzi dla statusu, odrzucenia, anulowania, raportu i jednorazowego linku.

**Gotowe, gdy:** `python -c` potwierdza odrzucenie niepełnego naboru, oceny poza 1–5, braku zgody i pustego uzasadnienia; poprawne dane przechodzą; schemat autora nie zawiera kontaktu testera.

### TI02 · Tokeny dostępu testera i operacje udziału

**Cel:** obsłużyć zgłoszenie, limit trzech aktywnych udziałów, decyzje statusowe, token i zapis ankiety.

**Zależy od:** TI00, TI01, T15

**Pliki:** `api/innovation_tests.py`

**Kroki:**
1. Generuj token przez bezpieczny generator, zapisuj tylko hash.
2. Zaimplementuj zgłoszenie tylko dla `OPEN`, limit po `email_normalized` i `SUBMITTED`/`ACCEPTED`.
3. Zaimplementuj akceptację, odrzucenie z wymaganym powodem, wycofanie przed decyzją oraz anulowanie z wymaganym powodem.
4. Przy akceptacji generuj nowy link; `GET` po tokenie zwraca status i dozwolone dane.
5. `POST` feedbacku sprawdza token, `ACCEPTED`, komplet ocen i brak wcześniejszego feedbacku, po czym ustawia `COMPLETED`.
6. Odrzucenie, anulowanie i usunięcie danych nie może ujawnić tokenu ani kontaktu w logach.

**Gotowe, gdy:** ręczny skrypt przechodzi ścieżkę submit → accept → token GET → feedback POST → COMPLETED; drugi POST zwraca błąd domenowy; limit czterech zgłoszeń odrzuca czwarte; token w bazie różni się od tokenu w linku.

### TI03 · API publiczne i panelu Hubu

**Cel:** wystawić endpointy Modułu 4 i podłączyć router do aplikacji.

**Zależy od:** TI01, TI02, T15

**Pliki:** `api/routers/innovation_tests.py`, `api/main.py`, `api/errors.py`, `api/schemas.py`

**Endpointy:**

- `GET /api/innovation-tests` — publiczne `OPEN`; panel może filtrować także `CLOSED`.
- `POST /api/innovation-tests` — utworzenie kompletnego naboru jako `OPEN`.
- `GET /api/innovation-tests/{test_id}` — szczegóły publiczne dla `OPEN`, pełne dla panelu.
- `POST /api/innovation-tests/{test_id}/close` — nieodwracalne zamknięcie.
- `GET /api/innovation-tests/{test_id}/applications` — panel, status/typ/grupa/lokalizacja/q.
- `POST /api/innovation-tests/{test_id}/applications/{application_id}/accept`.
- `POST /api/innovation-tests/{test_id}/applications/{application_id}/reject`.
- `POST /api/innovation-tests/{test_id}/applications/{application_id}/cancel`.
- `GET /api/innovation-tests/access/{token}` — status testera.
- `POST /api/innovation-tests/access/{token}` — jednorazowy feedback.
- `GET /api/innovation-tests/{test_id}/report` — panel Hubu, pełny raport.
- `POST /api/innovation-tests/{test_id}/report/regenerate` — panel, raport AI.
- `POST /api/innovation-tests/{test_id}/feedback/{feedback_id}/moderate` — widoczność komentarza dla autora.

**Gotowe, gdy:** `curl` potwierdza 200/201 dla ścieżki demo, 404 dla nieistniejącego tokenu, 409 dla zamkniętego naboru i drugiego feedbacku, 422 dla niepoprawnych ocen; publiczny endpoint nie zwraca e-maila, tokenu ani pełnych danych testera.

### TI04 · Pipeline AI: dopasowanie, agregacja i raport

**Cel:** dodać deterministyczny kontrakt AI z bezpiecznym fallbackiem.

**Zależy od:** TI01, T05, TI03

**Pliki:** `api/pipeline/innovation_tests.py`, `api/config.py`, `api/providers/llm.py`

**Kroki:**
1. Dodaj flagę `M4_AI_ENABLED` oraz limity tekstu przez `settings`.
2. Zaimplementuj sugestię dopasowania pełnego formularza do grupy docelowej; wynik nie może zmieniać statusu.
3. Zbuduj prompt raportu wyłącznie z feedbacku bez danych kontaktowych.
4. Wymuś JSON Schema i waliduj pola raportu, listy oraz `evidence_feedback_ids`.
5. Zapisuj model, wersję promptu i czas generacji.
6. Przy wyłączonym/błędnym AI zwracaj statystyki i anonimowe komentarze, bez sukcesu udającego wygenerowany raport.

**Gotowe, gdy:** z `M4_AI_ENABLED=false` raport ma statystyki bez raportu AI; z providerem działającym wynik przechodzi walidację; błędny JSON lub błąd providera jest jawnie oznaczony, a decyzja Hubu nadal działa.

### TI05 · Frontend publiczny: lista naborów, zgłoszenie i dostęp tokenowy

**Cel:** umożliwić użytkownikowi znalezienie naboru, wysłanie zgłoszenia i obsługę tokenowego statusu/ankiety.

**Zależy od:** TI03, F04, F05

**Pliki:** `web/src/api/types.ts`, `web/src/api/client.ts`, `web/src/pages/InnovationTestsPage.tsx`, `web/src/pages/InnovationTestPage.tsx`, `web/src/pages/InnovationTestAccessPage.tsx`, `web/src/components/innovation-tests/`, `web/src/styles/`

**Kroki:**
1. Dodaj listę publicznych naborów i szczegóły z rozwiązaniem, celem, kryteriami, materiałami oraz terminem.
2. Dodaj formularz testera z wymaganymi polami i zgodą.
3. Po zgłoszeniu pokaż status oraz instrukcję ręcznego kontaktu Hubu, bez pokazywania tokenu poza linkiem.
4. Dodaj stronę dostępu tokenowego: status, powód odrzucenia/anulowania i ankieta.
5. Po zapisaniu ankiety pokaż `COMPLETED`; obsłuż wygasły token, zamknięty nabór i błędy 404/409/422.
6. Spełnij WCAG i zasady design systemu; nie dodawaj drugiego CTA na ekranie.

**Gotowe, gdy:** ręczne przejście w przeglądarce pokrywa OPEN → zgłoszenie → status → akceptacja → token → cztery oceny → COMPLETED, a `npm run lint` i `npm run build` są czyste.

### TI06 · Frontend panelu Hubu: nabory, zgłoszenia, moderacja i raport

**Cel:** dać Hubowi pełną obsługę naborów, decyzji i wyników.

**Zależy od:** TI03, TI04, F04, F05

**Pliki:** `web/src/pages/panel/InnovationTestsPage.tsx`, `web/src/pages/panel/InnovationTestManagePage.tsx`, `web/src/components/innovation-tests/`, `web/src/api/`, `web/src/styles/`, `web/src/App.tsx`

**Kroki:**
1. Dodaj listę naborów z filtrami `OPEN`/`CLOSED`.
2. Dodaj formularz tworzenia kompletnego naboru powiązanego z `PUBLISHED` albo wewnętrznego `PENDING_REVIEW`.
3. Dodaj listę zgłoszeń z filtrami i danymi kontaktowymi wyłącznie w panelu.
4. Dodaj ręczną akceptację, odrzucenie z powodem, anulowanie z powodem oraz kopiowanie linku.
5. Dodaj statystyki, średnie, rozkłady, ostrzeżenie próby `< 3`, komentarze do moderacji i raport AI.
6. Nie pokazuj autorowi żadnego ekranu ani endpointu; raport Hub przekazuje poza platformą.

**Gotowe, gdy:** ręcznie utworzony nabór, decyzja testera, moderacja komentarza, zamknięcie i raport są widoczne w panelu; `npm run lint` i `npm run build` są czyste.

### TI07 · Dane demo, integracja i ścieżka demonstracyjna

**Cel:** przygotować deterministyczny scenariusz demo i dokumentację uruchomienia.

**Zależy od:** TI02, TI03, TI04, TI05, TI06

**Pliki:** `data/innovation-tests-seed.json`, `scripts/seed_innovation_tests.py`, `docs/modules/04-tester-innowacji/module-4-calibration.md`, `README.md`, `Makefile`

**Kroki:**
1. Dodaj co najmniej jeden opublikowany `solution` i nabór `OPEN` z materiałami oraz kryteriami.
2. Dodaj dane testowe pozwalające pokazać `SUBMITTED`, `ACCEPTED`, `REJECTED`, `COMPLETED` i `CANCELED`.
3. Udokumentuj komendy startu, resetu, seedowania i ręczną ścieżkę demo.
4. Sprawdź tryb `M4_AI_ENABLED=false` oraz tryb z Anthropic.

**Gotowe, gdy:** nowa osoba uruchamia Compose, seeduje dane, przechodzi pełny scenariusz bez ręcznej modyfikacji SQL, a `ruff check .`, `npm run lint` i `npm run build` są czyste.

### TI08 · Porządki po triażu modułów

**Cel:** usunąć z kodu M4 kolizje z innymi modułami i odstępstwa od `AGENTS.md` wykryte w triażu 2026-10-04 (`docs/modules/README.md` → „Podział między modułami”). Zachowanie API i schemat bazy się nie zmieniają.

**Zależy od:** TI07

**Pliki:** `api/routers/innovation_tests.py` (tylko komunikaty), `web/src/pages/InnovationTestsPage.tsx`, `web/src/pages/InnovationTestPage.tsx`, `web/src/pages/InnovationTestAccessPage.tsx`, `web/src/pages/panel/InnovationTestsPage.tsx`, `web/src/pages/panel/InnovationTestCreatePage.tsx`, `web/src/pages/panel/InnovationTestManagePage.tsx`, `web/src/components/innovation-tests/*.tsx`, `web/src/styles/innovation-tests.css` (usunięcie), `web/src/lib/labels.ts` (tylko etykiety M4), `api/innovation_tests.py`, `api/pipeline/innovation_tests.py`, `api/schemas.py` (tylko schematy M4), `api/config.py` i `.env.example` (blok Moduł 4)

**Kroki:**
1. **Słownictwo.** „Nabór” znaczy w platformie konkurs grantowy (Moduł 3, `/nabory`). W tekstach UI M4 zamień „nabór/naboru/naborów…” na „rekrutacja testerów” / „test” (np. „Otwarte rekrutacje testerów”, „Zamknij rekrutację”). Nazwy w API, bazie i typach (`InnovationTest*`) zostają.
2. **CSS.** Przenieś style z `web/src/styles/innovation-tests.css` na klasy Tailwinda z presetu i `ds-*` (zasady z `AGENTS.md` → „Stylowanie”), usuń importy i plik. Porównaj ekrany przed i po, także w `data-contrast="high"`.
3. **AI bez danych kontaktowych.** `suggest_tester_fit` w `api/pipeline/innovation_tests.py` nie wysyła `email` ani `display_name` — wystarczą typ testera, lokalizacja, przynależność do grupy docelowej i motywacja.
4. **Limity w ustawieniach.** `MAX_ACTIVE_APPLICATIONS` → `settings.M4_MAX_ACTIVE_APPLICATIONS` (3); `max_length` motywacji, komentarza i propozycji w schematach M4 brane z `M4_MOTIVATION_MAX_CHARS` / `M4_COMMENT_MAX_CHARS` (walidator albo stała z `settings`), bez zdublowanego literału 4000. Dopisz brakujące `M4_*` do `.env.example`.
5. Nie dodawaj nowych globalnych nazw ogólnych — `application_status`, `material_type`, `test_mode`, `tester_type`, `ApplicationStatus`, `APPLICATION_STATUS_LABELS`, `FeedbackModerate` są już zajęte przez M4 i inne moduły ich nie użyją; nie zmieniaj ich nazw (zmiana bazy = reset u wszystkich).

**Gotowe, gdy:** w `web/src/` nie ma `innovation-tests.css` ani słowa „nabór” w ekranach M4; ekrany wyglądają jak przed zmianą; `grep -n email api/pipeline/innovation_tests.py` nie pokazuje pola w ładunku dla AI; scenariusz z TI07 przechodzi; `ruff check .`, `npm run lint`, `npm run build` czyste.

## Uwagi między zadaniami

- [TI00 → Moduł 1 T01/T02] dopisanie tabel i enumów do `db/init.sql` oraz modeli do `api/models.py` wymaga zachowania istniejącego schematu.
- [TI01 → T08] nowe schematy dopisać do `api/schemas.py`; nie zmieniać kształtu istniejących odpowiedzi.
- [TI03 → F05] użyć istniejącego klienta API i komponentów design systemu; nie kopiować kart ani hooków.
- [TI04 → T05] użyć istniejącego `LLMProvider` Anthropic; nie tworzyć drugiego klienta HTTP.
- [TI04 → TI06] raport autora jest tylko widokiem Hubu i nie ma publicznego endpointu.
- [TI07 → wszystkie] brak automatycznych testów; weryfikacja pozostaje ręczna zgodnie z decyzją zespołu.
- [triaż → TI08] 2026-10-04, podział między modułami (`docs/modules/README.md` → „Podział między modułami”): porządki zebrane w TI08. Schemat M4 zostaje w `db/init.sql` (już na masterze); nowe moduły trzymają tabele w `db/mN-*.sql`. Po zmianie M2 w `solutions` (`knowledge_type`, Z00) potrzebny `make reset-db` + `make ingest` + `make seed-m4` — seed M4 tworzy `solutions` z `kind=SOLUTION`, więc przejdzie przez nowy CHECK. `api/providers/llm.py` po dodaniu `complete()` jest zamrożony.
- [TI08 → wszystkie] 2026-10-04: porządki zrobione. Słownictwo „rekrutacja testerów” / „test” w UI, komunikatach API i treści zgody (wersja zgody `m4-consent-v2`, prompt dopasowania `m4-fit-v2`); `innovation-tests.css` usunięty, ekrany na Tailwindzie (szerokość stron publicznych `max-w-3xl` zamiast 52rem — brak tokenu); AI dopasowania bez e-maila i imienia; `M4_MAX_ACTIVE_APPLICATIONS` i limity długości ze `settings`. Zostało: `maxLength={4000}` w `ApplicationForm`/`FeedbackForm` (brak wartości z API), `ruff format` w plikach M4 (różnice sprzed TI08). Scenariusz TI07 do sprawdzenia na bazie po `make reset-db && make seed-m4`.
- [feature-2026-10-04-1 → TI04, TI08] 2026-10-04: `get_llm_provider()` zwraca domyślnie `OpenAILLMProvider` (ADR-020 w specyfikacji M1) — `complete()` ma tę samą sygnaturę (Responses API, `OPENAI_LLM_MODEL=gpt-6-luna`); `innovation_tests.ai_model` zapisuje `settings.llm_model` (faktycznie użyty model). Prompty i wersje (`m4-report-v1`, `m4-fit-v2`) bez zmian. Raport AI sprawdzony na żywo (test 1, `M4_AI_ENABLED=true` w procesie). `api/providers/llm.py` nie jest już jedynym providerem LLM — zamrożenie dotyczy kontraktu, nie dostawcy.
