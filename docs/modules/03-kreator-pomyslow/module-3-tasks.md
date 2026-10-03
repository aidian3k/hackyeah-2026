# Moduł 3 — Kreator pomysłów: plan implementacji i zadania

Plan na podstawie `docs/modules/03-kreator-pomyslow/module-3-kreator-pomyslow.html` (v0.2). Każde zadanie jest samowystarczalne: zawiera cel, pliki, wklejony kontekst ze specyfikacji, kroki i kryterium gotowości. Agent wykonujący zadanie **nie musi czytać specyfikacji HTML** — ale musi przeczytać `AGENTS.md` (twarde reguły) oraz sekcję „Wspólne kontrakty” poniżej. Zadania frontendowe (K10–K19) dodatkowo: `DESIGN.md` i „Wspólne kontrakty” w `docs/modules/01-matchmaking/frontend-tasks.md` (konwencje `web/`, lista kontrolna dostępności).

Materiały źródłowe ROPS (wzory wniosków, karty oceny, Social Canvas, Mapa Wyzwań) są w `docs/resources/rops/` — indeks w `README.md`, ustalenia w `RAPORT.md`.

**Odstępstwa od specyfikacji (decyzja zespołu, 2026-10-03, jak w Module 1):**
- **Bez autoryzacji.** Wszystkie endpointy są otwarte; bez tokenów, nagłówków dostępu i kodów 401/403. Pomysł czyta się i edytuje po samym `id` (ADR-M3-010).
- **Bez testów automatycznych.** Weryfikacja każdego zadania: curl, psql, `python -c`, ręczne uruchomienie, `npm run build && npm run lint`.

## Protokół pracy (obowiązkowy)

1. **Jedyne źródło statusu** to lista „Status zadań” poniżej. Treść zadań nie zawiera statusu.
2. Stany:
   - `- [ ]` — wolne,
   - `- [~]` — w toku; dopisz na końcu linii ` — agent: <nazwa>, <RRRR-MM-DD GG:MM>`,
   - `- [x]` — zrobione; zamień dopisek na ` — zrobione: <nazwa>, <krótka notka lub hash commita>`.
3. **Branie zadania:** wybierz zadanie `[ ]`, którego wszystkie zależności są `[x]`. Edytuj tylko jego linię na `[~]`, potem przeczytaj plik ponownie i sprawdź, czy linia nadal ma Twój dopisek (jeśli ktoś był szybszy — weź inne zadanie).
4. Edytuj w tym pliku **wyłącznie linię swojego zadania** oraz (ewentualnie) dopisuj na końcu sekcji „Uwagi między zadaniami”. Nie przepisuj innych linii, nie formatuj pliku.
5. Zmieniaj w repozytorium **tylko pliki wymienione w polu „Pliki” swojego zadania**. Potrzebujesz zmiany w cudzym pliku → wpis w „Uwagach między zadaniami” (`- [Kxx → Kyy] opis`), nie edycja. Pliki Modułu 1 i frontendu oznaczone w polu „Pliki” jako **(dopisanie)** wolno tylko uzupełniać — bez zmiany istniejącego kodu (ADR-M3-003). Potrzebna zmiana istniejącego kodu M1/F → wpis w „Uwagach” odpowiedniego pliku zadań (`module-1-tasks.md` / `frontend-tasks.md`).
6. `[x]` dopiero, gdy spełnione jest „Gotowe, gdy” (ręczna weryfikacja opisana w zadaniu) i `ruff check .` (backend) albo `npm run lint && npm run build` w `web/` (frontend) jest czysty dla Twoich plików.
7. Zablokowany (brak klucza API, błąd w zależności, sprzeczność ze specyfikacją) → przywróć `[ ]` i opisz przyczynę w „Uwagach między zadaniami”.
8. Sygnatury z sekcji „Wspólne kontrakty” są wiążące. Jeśli musisz je zmienić — najpierw wpis w „Uwagach”, nie cicha zmiana.

## Status zadań

Identyfikatory `K00`–`K19` (prefiks modułu). Backend: K00–K09, frontend: K10–K19.

- [ ] K00 · Definicja Social Canvas `data/social-canvas.json` · zależy: —
- [ ] K01 · Schemat bazy `db/m3-kreator.sql`, modele, konfiguracja, `make db-m3` · zależy: —
- [ ] K02 · Kontrakty API (`api/kreator/schemas.py`) + stuby routerów i rejestracja · zależy: K01
- [ ] K03 · Kanwa: walidacja, scalanie, postęp + endpointy `/canvas` · zależy: K00, K02
- [ ] K04 · Pomysły: CRUD, wysłanie, statusy, odpowiedzi, awans do Biblioteki · zależy: K02
- [ ] K05 · Provider LLM ze structured outputs `api/providers/llm_assist.py` · zależy: K01
- [ ] K06 · Asystent i podobne innowacje (`/similar`, `/assist`) · zależy: K03, K04, K05
- [ ] K07 · Dane naborów i Mapy Wyzwań (`data/calls/*.json`, `data/challenge-map.json`) · zależy: —
- [ ] K08 · Nabory i wnioski: API, prefill, kontrole, szkic, samoocena · zależy: K03, K04, K05, K07
- [ ] K09 · Seed demo pomysłów `scripts/seed_ideas.py` · zależy: K03, K04
- [ ] K10 · Front: typy, klient, pamięć „Moje pomysły”, trasy i nawigacja (stuby stron) · zależy: K02
- [ ] K11 · Front: fiszka 2.0 (`/mam-pomysl`, `/mam-pomysl/:id`) · zależy: K10, K14, K04
- [ ] K12 · Front: komponenty bloków kanwy · zależy: K10
- [ ] K13 · Front: mapa Social Canvas (`/mam-pomysl/:id/kanwa`) z autozapisem · zależy: K12, K14, K03
- [ ] K14 · Front: komponenty asystenta i podobnych innowacji · zależy: K10
- [ ] K15 · Front: „Moje pomysły” i odpowiedzi Hubu · zależy: K10, K04
- [ ] K16 · Front: panel — lista i przegląd pomysłów, sekcja w skrzynce · zależy: K10, K13, K04
- [ ] K17 · Front: wejście do fiszki z „nie wiem” i z panelu zgłoszeń · zależy: K11
- [ ] K18 · Front: nabory i edytor wniosku z drukiem · zależy: K10, K14, K08
- [ ] K19 · Próba generalna modułu 3, dostępność, scenariusz demo · zależy: K06, K09, K11, K13, K15, K16, K17, K18

### Fale równoległości (orientacyjnie)

- Fala 0: K00, K01, K07
- Fala 1: K02, K05
- Fala 2: K03, K04, K10
- Fala 3: K06, K08, K09, K12, K14, K15
- Fala 4: K11, K13, K18
- Fala 5: K16, K17
- Fala 6: K19

**Najkrótsza działająca ścieżka** (MUST, gdy brakuje czasu): K00, K01, K02, K03, K04, K05, K06, K10, K12, K14, K11, K13, K15, K16, K17. Daje: fiszkę z asystentem i podobnymi innowacjami, interaktywną kanwę zapisywaną w bazie, wejście z „nie wiem”, panel z odpowiedzią do autora i jej odczyt w „Moich pomysłach”. Generator wniosków (K07, K08, K18) to SHOULD; K09 i K19 robisz przed nagraniem demo.

---

## Wspólne kontrakty (wiążące dla wszystkich zadań)

### Konwencje

- Konwencje Modułu 1 obowiązują bez zmian (`docs/modules/01-matchmaking/module-1-tasks.md`, „Wspólne kontrakty → Konwencje”): importy absolutne, async przy I/O, dane w `data/` przez `Path(settings.DATA_DIR)`, ustawienia w `api.config.settings`, błędy przez `api.errors.ApiError(status, code, message)` → `{"error": {"code", "message"}}`, komunikaty `message` po polsku.
- Kod M3 w pakiecie `api/kreator/` (logika) i w routerach `api/routers/{ideas,canvas,assist,applications}.py`. Modele SQLAlchemy M3 w `api/kreator/models.py` na tej samej `Base` co M1 (`from api.models import Base`).
- Walidacja gminy jak w M1: `api.pipeline.preprocess.GMINY` (nazwa → powiat); spoza listy → 422 `VALIDATION_ERROR` „gmina: nieznana gmina …”. Kategoria: istnieje w `challenge_taxonomy` → inaczej 422.
- **Logi:** tylko `idea_id`, `application_id`, `block_id`, `call_id`, statusy, długości tekstów i liczby. Nigdy treść fiszki, kanwy, odpowiedzi, wniosku, `author_name`, `contact_email`, promptu ani odpowiedzi LLM.
- `contact_email` nigdy nie wychodzi z API (w odpowiedziach tylko `has_contact: bool`) i nie trafia do promptów.
- Metody HTTP tylko GET, POST, PATCH (CORS M1 nie przepuszcza PUT/DELETE).
- Frontend: konwencje z `docs/modules/01-matchmaking/frontend-tasks.md` (alias `@/`, eksporty nazwane, teksty w tonie `DESIGN.md`, bez emoji, filtry w URL, WCAG 2.1 AA jako kryterium gotowości, najwyżej jeden `ds-btn--cta` na ekran).
- **Stylowanie frontendu (`AGENTS.md`, „Stylowanie: Tailwind, bez własnego CSS”):** wyłącznie klasy Tailwinda z presetu design systemu (`text-navy`, `bg-surface-muted`, `gap-3`…) i komponenty `ds-*`. Żadnych nowych plików `.css`, żadnych reguł dopisywanych do `web/src/styles/*.css`, żadnego `style={{…}}` (wyjątek: zmienna CSS liczona w runtime). Wartości dowolne tylko dla właściwości bez tokenu (np. `[grid-template-areas:…]`). Kształty (serca, koła Venna, znaczniki statusu, wskaźnik poziomu) jako SVG w JSX z kolorami przez `fill-current`/`stroke-current` i klasy tokenów. Druk przez warianty `print:` (`print:hidden`, `print:block`…).

### Pliki współdzielone — kto dopisuje (ADR-M3-003)

| Plik | Właściciel w M3 | Co wolno |
|---|---|---|
| `api/config.py` | K01 | dopisać sekcję „Moduł 3 — Kreator pomysłów” na końcu pól `Settings` |
| `Makefile`, `.env.example` | K01 | cel `db-m3`; zmienne M3 |
| `api/main.py` | K02 | import i dopisanie 4 routerów M3 do krotki w `create_app()` |
| `web/src/api/types.ts`, `web/src/api/client.ts`, `web/src/lib/storage.ts`, `web/src/lib/labels.ts` | K10 | dopisać typy, metody, funkcje, etykiety |
| `web/src/App.tsx`, `web/src/components/layout/MainNav.tsx`, `web/src/components/layout/PanelLayout.tsx` | K10 | dopisać trasy i pozycje nawigacji |
| `web/src/pages/IdeaPage.tsx`, `web/src/components/idea/IdeaForm.tsx` | K11 | przepisać (fiszka przechodzi na `/api/ideas`) |
| `web/src/pages/panel/InboxPage.tsx` | K16 | dopisać sekcję „Nowe pomysły” |
| `web/src/components/chat/NoMatchNotice.tsx`, `web/src/components/chat/ChatResults.tsx`, `web/src/pages/panel/ReportPage.tsx` | K17 | dopisać wejście do fiszki z `report_id` |

### Nazwy i sygnatury, z których korzystają inne zadania

| Symbol | Moduł | Właściciel |
|---|---|---|
| Sekcja ustawień M3 (tabela „Konfiguracja”) | `api/config.py` | K01 |
| `Idea`, `IdeaCanvas`, `IdeaReply`, `Application` + enumy `IdeaStatus`, `IdeaStage`, `ApplicationStatus` | `api/kreator/models.py` | K01 |
| Wszystkie modele API M3 (sekcja „Schematy API”) | `api/kreator/schemas.py` | K02 |
| `router` w `api/routers/ideas.py`, `canvas.py`, `assist.py`, `applications.py` | routery | K02 (stub) → K04, K03, K06, K08 |
| `load_definition() -> CanvasDefinition` (lru_cache), `block_map() -> dict[str, CanvasBlock]`, `validate_block(block, value) -> Any` (zwraca wartość znormalizowaną, rzuca `ValueError` z polskim komunikatem), `merge_blocks(data, patch) -> dict`, `progress(data) -> CanvasProgress`, `is_filled(block, value) -> bool`, `describe_block(block, value) -> str` (tekst „Etykieta: wybrane etykiety” po polsku), `async load_canvas(session, idea_id) -> dict`, `async canvas_state(session, idea_id) -> CanvasState` | `api/kreator/canvas.py` | K03 |
| `async get_idea_or_404(session, idea_id) -> Idea`, `ensure_editable(idea)` (409 `IDEA_LOCKED`), `async idea_detail(session, idea_id) -> IdeaDetail`, `EDITABLE_STATUSES: frozenset[IdeaStatus]` | `api/routers/ideas.py` | K04 |
| `assist_available() -> bool`, `async complete_json(system: str, user: str, output_model: type[T], *, max_tokens: int) -> T` (rzuca `ProviderError`) | `api/providers/llm_assist.py` | K05 |
| `idea_search_text(idea) -> str`, `async find_similar(idea, *, limit) -> SimilarResponse` | `api/kreator/similar.py` | K06 |
| `load_calls() -> dict[str, CallFile]`, `call_state(call, today) -> Literal["open","closed","upcoming"]`, `today() -> date`, `to_summary(call) -> CallSummary`, `to_detail(call) -> CallDetail`, `load_challenge_map() -> list[ChallengeArea]` | `api/kreator/calls.py` | K08 |
| `build_prefill(call, idea, canvas_data) -> tuple[dict, BudgetPayload]` | `api/kreator/prefill.py` | K08 |
| `api.ideas.*`, `api.canvas*`, `api.calls*`, `api.application*` (metody klienta), typy TS M3, `listMyIdeas()/rememberIdea()/forgetIdea()` | `web/src/api/client.ts`, `types.ts`, `lib/storage.ts` | K10 |
| `CanvasBlockView` (props: `block`, `value`, `onChange`, `readOnly`), `SingleChoiceBlock`, `MultiChoiceBlock`, `ListBlock`, `TextBlock`, `PartnersBlock`, `ImpactMatrix` | `web/src/components/canvas/` | K12 |
| `CanvasBoard` (props: `definition`, `blocks`, `onBlockChange?`, `readOnly`, `sheet`, `onAssist?`) | `web/src/components/canvas/CanvasBoard.tsx` | K13 |
| `useIdeasCount() -> number \| null` | `web/src/hooks/useIdeasCount.ts` | K10 |
| `AssistPanel` (props: `ideaId`, `target`, `blockId?`, `onAccept(s: AssistSuggestion)`), `SimilarInnovations` (props: `ideaId`, `refreshKey`) | `web/src/components/assistant/` | K14 |

### Model danych (pełny DDL w K01)

Tabele: `ideas`, `idea_canvases` (`data JSONB` = `{block_id: wartość}`), `idea_replies`, `applications` (`answers JSONB`, `budget JSONB`, `self_assessment JSONB`, `UNIQUE (idea_id, call_id)`). Enumy: `idea_status` = `DRAFT | SUBMITTED | IN_REVIEW | INVITED | REJECTED | PROMOTED`; `idea_stage` = `IDEA | PROTOTYPE | TESTED | READY`; `application_status` = `DRAFT | READY`.

**Przejścia statusu pomysłu:**

| Akcja | Z | Do | Endpoint |
|---|---|---|---|
| wysłanie | `DRAFT` | `SUBMITTED` | `POST /api/ideas/{id}/submit` (wymaga niepustych `essence` i `audience`) |
| panel | `SUBMITTED` | `IN_REVIEW`, `REJECTED` | `POST /api/ideas/{id}/status` |
| panel | `IN_REVIEW` | `INVITED`, `REJECTED` | jw. |
| panel | `INVITED` | `REJECTED` | jw. |
| odpowiedź Hubu | `SUBMITTED` | `IN_REVIEW` (automatycznie) | `POST /api/ideas/{id}/replies` |
| awans | `IN_REVIEW`, `INVITED` | `PROMOTED` | `POST /api/ideas/{id}/promote` |

Ten sam status → 200 bez zmian. Inne → 409 `INVALID_TRANSITION`. Edycja fiszki i kanwy dozwolona w `EDITABLE_STATUSES = {DRAFT, SUBMITTED, IN_REVIEW, INVITED}`; inaczej 409 `IDEA_LOCKED`.

**Etykiety statusów (UI, `labels.ts`):** `DRAFT` Szkic · `SUBMITTED` Wysłany · `IN_REVIEW` W analizie · `INVITED` Zaproszony do dalszych prac · `REJECTED` Odrzucony · `PROMOTED` W Bibliotece innowacji. **Etapy:** `IDEA` Pomysł · `PROTOTYPE` Prototyp · `TESTED` Przetestowane rozwiązanie · `READY` Gotowe do wdrożenia.

### Konfiguracja (dopisuje K01 do `api/config.py`)

```python
    # --- Moduł 3 — Kreator pomysłów ---
    ASSIST_ENABLED: bool = True
    ASSIST_MAX_TOKENS: int = 1500
    ASSIST_DRAFT_MAX_TOKENS: int = 2500
    ASSIST_TIMEOUT_SECONDS: float = 30.0
    ASSIST_MAX_QUESTIONS: int = 3
    ASSIST_MAX_SUGGESTIONS: int = 5
    ASSIST_CONTEXT_SOLUTIONS: int = 3
    IDEA_SIMILAR_LIMIT: int = 3
    CANVAS_LIST_MAX_ITEMS: int = 12
    CANVAS_ITEM_MAX_CHARS: int = 300
    CANVAS_TEXT_MAX_CHARS: int = 2000
    CANVAS_PARTNERS_MAX: int = 15
    APPLICATION_TEXT_MAX_CHARS: int = 6000
    APPLICATION_BUDGET_MAX_ROWS: int = 30
    KREATOR_CALLS_DIR: str = "calls"
    KREATOR_CALLS_IGNORE_DATES: bool = False
    KREATOR_TIMEZONE: str = "Europe/Warsaw"
```

Model LLM: istniejące `settings.LLM_MODEL` (`claude-haiku-4-5-20251001`), klucz `settings.ANTHROPIC_API_KEY`, wyłącznik `settings.LLM_ENABLED` — bez nowych zmiennych.

### Definicja Social Canvas (`data/social-canvas.json`, tworzy K00 — dokładnie ten kształt)

```json
{
  "version": "1.0",
  "source_pl": "Social Innovation Canvas, INNOAGH, wersja 1.0 (5 maja 2026), na bazie kanwy The New Global School",
  "source_url": "https://rops.krakow.pl/mpliki/IS/Moj_folder/INNO_AGH_-_SOCIAL_CANVAS.pdf",
  "sheets": [
    {"id": "S1", "title": "Problem, aktorzy, rozwiązanie, koszty",
     "areas": [{"id": "problem", "title": "Problem", "blocks": ["problem_intensity", "problem_frequency", "problem_scale"]}, "…"]}
  ],
  "blocks": [
    {"id": "problem_intensity", "sheet": "S1", "area": "problem", "type": "single",
     "title": "Intensywność", "prompt": "Zaznaczcie, jak bardzo źle jest bez Waszego rozwiązania.",
     "help": [], "max": null,
     "options": [{"code": "VERY_SERIOUS", "label": "Bardzo poważny problem", "description": "Powoduje stres, wykluczenie albo realną krzywdę.", "level": 4}, "…"],
     "roles": [], "statuses": []}
  ]
}
```

- `type` ∈ `single | multi | list | text | partners`. `options` tylko dla `single`/`multi`; `level` (1–4) tylko dla skal `single` (najmocniejsza opcja = 4; dla `solution_readiness`, `solution_clarity`, `revenue_*`, `impact_*` poziom rośnie z kolejnością opcji w tabeli, pierwsza = 1). `roles` i `statuses` tylko dla `partners`. `max` tylko dla `value_emotional`/`value_functional` (= 3).
- Kody opcji `multi` = slug etykiety: małe litery ASCII, bez ogonków, spacje i „/” → „_”, zwielokrotnione „_” zredukowane (`czynsz / przestrzeń` → `czynsz_przestrzen`).
- Kolejność `blocks` = kolejność w tabeli niżej. Kolejność `areas` w arkuszu = kolejność czytania planszy (kolumnami od lewej).

| Arkusz / obszar | `block_id` | Typ | Tytuł · polecenie | Opcje (`kod` etykieta — opis) / pytania pomocnicze |
|---|---|---|---|---|
| S1 / `problem` „Problem” | `problem_intensity` | single | Intensywność · Zaznaczcie, jak bardzo źle jest bez Waszego rozwiązania. | `VERY_SERIOUS` Bardzo poważny problem — Powoduje stres, wykluczenie albo realną krzywdę. (4) · `STRONG` Mocno przeszkadza — Problem regularnie blokuje ważne działania. (3) · `HINDERS` Utrudnia działanie — Trzeba szukać alternatyw, traci się czas lub energię. (2) · `MILD` Lekko przeszkadza — Da się żyć, problem raczej irytuje niż blokuje. (1) |
| | `problem_frequency` | single | Częstotliwość · Zaznaczcie, jak często występuje problem, na który odpowiada Wasze rozwiązanie. | `VERY_OFTEN` Bardzo często — Codziennie albo prawie codziennie. (4) · `OFTEN` Często — Co tydzień lub regularnie. (3) · `SOMETIMES` Czasami — Kilka razy w roku lub miesiącu. (2) · `RARELY` Rzadko — Raz na jakiś czas, raz w roku lub rzadziej. (1) |
| | `problem_scale` | single | Skala problemu · Zaznaczcie, ilu ludzi dotyka problem. | `INDIVIDUALS` Pojedyncze osoby — Dotyczy kilku osób lub małej grupy. (1) · `NARROW` Wąska grupa — Dotyczy konkretnej społeczności, np. uczniów jednej szkoły, ludzi z jednej okolicy, załogi konkretnej instytucji. (2) · `LARGE` Duża grupa — Dotyczy wielu osób w mieście, regionie, branży lub większej społeczności. (3) · `VERY_WIDE` Bardzo szeroka grupa — Dotyczy dużej części społeczeństwa albo wielu podobnych grup w różnych miejscach. (4) |
| S1 / `actors` „Aktorzy zmiany” | `actors_support` | list | Wspierają zmianę · Wypiszcie osoby, grupy lub instytucje, które widzą potrzebę zmiany, wspierają Wasz pomysł albo mogą pomóc go wdrożyć. | help: Kto najbardziej potrzebuje tej zmiany? · Kto może zyskać na rozwiązaniu? · Kto już mówi, że problem trzeba rozwiązać? · Kto może Was poprzeć, polecić albo otworzyć drzwi? · Kto ma energię, wpływ lub zasoby, żeby pomóc? |
| | `actors_block` | list | Utrudniają zmianę · Wypiszcie osoby, grupy lub instytucje, które mogą nie chcieć zmiany, bać się jej, tracić na niej albo utrudniać wdrożenie. | help: Kto może nie rozumieć potrzeby zmiany? · Kto może bać się dodatkowej pracy, kosztów lub ryzyka? · Kto może tracić wpływ, kontrolę albo dotychczasową rolę? · Kto może powiedzieć „to się nie uda”? · Kto może zablokować decyzję, finansowanie albo dostęp do odbiorców? |
| S1 / `solution` „Rozwiązanie” | `solution_value` | single | Przystępność i wartość rozwiązania · Zaznaczcie, jak koszt rozwiązania ma się do korzyści. | `COST_EXCEEDS` Koszt jest większy niż korzyść — Rozwiązanie pochłania dużo pieniędzy, czasu lub wysiłku, a efekt jest mało widoczny. · `EVEN` Korzyść i koszt są podobne — Rozwiązanie może pomagać, ale nie jest jasne, czy opłaca się z niego korzystać. · `BENEFIT_EXCEEDS` Korzyść jest większa niż koszt — Rozwiązanie oferuje zauważalną wartość za rozsądną cenę. · `HIGH_VALUE` Bardzo duża wartość przy małym koszcie — Rozwiązanie pomaga, a bariera wejścia jest niska (niskie koszty, oszczędność czasu, łatwość użycia). |
| | `solution_readiness` | single | Gotowość do wdrożenia · Zaznaczcie, na jakim etapie jest Wasze rozwiązanie. | `IDEA` Pomysł — Mamy koncepcję, ale rozwiązanie nie zostało jeszcze sprawdzone z odbiorcami. · `PROTOTYPE` Prototyp — Mamy pierwszą wersję rozwiązania, jednak wciąż wymaga ona testów i dopracowania. · `TESTED` Przetestowane rozwiązanie — Rozwiązanie zostało sprawdzone z realnymi użytkownikami i wiemy, co trzeba poprawić. · `READY` Gotowe do wdrożenia — Rozwiązanie można uruchomić w rzeczywistym miejscu, z prawdziwymi odbiorcami i znanymi zasobami. |
| | `solution_clarity` | single | Prostota i zrozumiałość · Czy osoba, która pierwszy raz widzi Wasze rozwiązanie, szybko rozumie: dla kogo jest, jak działa i co daje? Zaznaczcie najbardziej prawdziwą opcję. | `UNCLEAR` Rozwiązanie jest niejasne — Trzeba długo tłumaczyć, o co chodzi. Ludzie często zadają podstawowe pytania. · `PARTLY_CLEAR` Rozwiązanie jest częściowo jasne — Ludzie rozumieją ogólny pomysł, ale jeszcze nie wiedzą dokładnie, jak z niego skorzystać. · `CLEAR` Rozwiązanie jest jasne — Większość osób szybko rozumie, jaki problem rozwiązujemy, jak działa rozwiązanie i co trzeba zrobić, żeby z niego skorzystać. · `SELF_EXPLAINING` Ludzie potrafią wyjaśnić sami — Osoba z grupy docelowej potrafi wyjaśnić rozwiązanie własnymi słowami po krótkim kontakcie z nim lub korzystaniu. |
| S1 / `costs` „Struktura kosztów” | `costs_fixed` | multi | Stałe koszty · Ponosicie je niezależnie od liczby użytkowników. Trzeba je opłacać nawet wtedy, gdy z rozwiązania korzysta mało osób albo nikt jeszcze nie korzysta. Zaznaczcie lub dopiszcie koszty, które powinniście ponosić, żeby rozwiązanie mogło działać. | wynagrodzenie zespołu · czynsz / przestrzeń · utrzymanie aplikacji lub strony · abonamenty narzędzi · koordynacja projektu · księgowość / administracja · promocja podstawowa · sprzęt potrzebny na start |
| | `costs_variable` | multi | Zmienne koszty · Rosną, gdy korzysta więcej osób lub gdy realizujecie więcej działań. Co kosztuje za każdym razem, gdy pomagacie kolejnej osobie, grupie lub organizujecie kolejne działanie? | materiały dla uczestników · czas specjalisty na jedną osobę · dojazdy · catering · wydruk materiałów · wsparcie techniczne dla kolejnej osoby |
| S2 / `recipients` „Odbiorcy” | `recipients_users` | multi | Główny użytkownik · Komu to rozwiązanie ma realnie pomóc? | dzieci · młodzież · rodzice · seniorzy · osoby z niepełnosprawnościami · nauczyciele · pracownicy instytucji · osoby w kryzysie · organizacje społeczne · mieszkańcy konkretnego miejsca |
| | `recipients_payers` | multi | Klient / płatnik · Kto wyciąga portfel albo uruchamia budżet, żeby Wasze rozwiązanie działało? | sam użytkownik · rodzic / opiekun · szkoła · firma · urząd miasta / gmina · fundacja / organizacja społeczna · grantodawca · sponsor · NFZ / instytucja publiczna · pracodawca |
| | `recipients_deciders` | multi | Autorytet / instytucja / decydent · Czyja zgoda, rekomendacja albo decyzja jest potrzebna, żeby rozwiązanie zostało użyte? | dyrektor szkoły · nauczyciel · lekarz · terapeuta · pracownik socjalny · urząd · lider lokalny · organizacja społeczna · rodzic · opiekun · menedżer · ekspert · instytucja finansująca |
| S2 / `revenue` „Źródła dochodów” | `revenue_main` | single | Główny dochód · Co jest podstawowym źródłem pieniędzy? Za co klienci będą najpewniej płacić w pierwszej kolejności? | `UNKNOWN` Nie wiemy jeszcze — Nie mamy jasnego pomysłu, kto i za co miałby płacić. · `IDEA` Mamy pomysł — Wiemy, co mogłoby być źródłem dochodu, ale nie sprawdziliśmy tego z potencjalnym klientem. · `OFFER` Mamy konkretną propozycję — Wiemy, co oferujemy, komu i dlaczego ktoś miałby za to zapłacić lub zainwestować w utrzymanie rozwiązania. · `CONFIRMED` Mamy potwierdzenie — Ktoś już nam zapłacił albo zadeklarował gotowość do wspierania finansowego naszego rozwiązania. |
| | `revenue_main_note` | text | Pomysł na główne źródło finansowania · Jeśli macie propozycję lub pomysł na główne źródło finansowania, wypiszcie je poniżej. | — |
| | `revenue_scaling` | single | Skalowanie dochodu · Jakie dodatkowe rzeczy możecie sprzedawać lub finansować w przyszłości? | `NONE` Brak jasnych dodatkowych źródeł — Na razie widzimy tylko jedno źródło finansowania (to główne, powyżej) i nie wiemy, jak dochód mógłby rosnąć. · `CHANCES` Są szanse na dodatkowe pieniądze — Mamy kilka pomysłów na dodatkowe źródła dochodu, ale są jeszcze niesprawdzone. · `PATHS` Widzimy realne ścieżki rozwoju — Wiemy, jakie dodatkowe usługi, pakiety lub wdrożenia można sprzedawać po pierwszym sukcesie. · `REPLICABLE` Nasz model działania można powielać — Rozwiązanie można sprzedawać lub finansować w wielu miejscach, dla wielu grup albo przez wiele kanałów. |
| | `revenue_scaling_note` | text | Pomysł na dodatkowy dochód · Jeśli macie propozycję lub pomysł na dodatkowe źródło dochodu, wypiszcie je poniżej. | — |
| S2 / `value` „Propozycja wartości” | `value_emotional` | multi, max 3 | Wartość emocjonalna · Co odbiorcy poczują dzięki rozwiązaniu? Zaznaczcie maksymalnie 3 najważniejsze wartości emocjonalne lub dopiszcie własną. | Bezpieczeństwo · Spokój · Pewność · Zmniejszenie samotności · Większa sprawczość · Poprawa stanu zdrowia · Niezależność · Motywacja · Włączenie społeczne · Poczucie bycia widzianym · Poprawa nastroju · Większe zadowolenie z życia |
| | `value_functional` | multi, max 3 | Wartość funkcjonalna · Co rozwiązanie konkretnie poprawia? Zaznaczcie maksymalnie 3 najważniejsze wartości funkcjonalne lub dopiszcie własną. | Obniża koszty · Oszczędza czas · Zwiększa skuteczność · Poprawia jakość · Upraszcza proces · Zwiększa dostępność · Zwiększa zasięg pomocy · Zmniejsza obciążenie · Poprawia bezpieczeństwo · Zwiększa wpływ społeczny · Ogranicza negatywny wpływ na środowisko · Pomaga w podejmowaniu lepszych decyzji |
| S3 / `channels` „Kanały” | `channels_direct` | multi | Kanały bezpośrednie · Jak ludzie trafiają do Was bezpośrednio? | własna strona internetowa · własny formularz zgłoszeniowy · własny sklep / system zakupu · kontakt telefoniczny lub mailowy · spotkania bezpośrednie · własne warsztaty · własne media społecznościowe · własna aplikacja · newsletter · wydarzenia organizowane samodzielnie |
| | `channels_partners` | multi | Kanały pośrednie · Kto może pomóc Wam dotrzeć do odbiorców? | szkoła · urząd / gmina · organizacja społeczna · ekspert · lekarz / terapeuta · nauczyciel · pracownik socjalny · lider lokalny · firma · partner · ambasador · handlowiec |
| | `channels_extra` | multi | Kanały dodatkowe · Jakie kanały dodatkowe możecie wykorzystać? | kampania online · webinary · platforma cyfrowa · lokalne wydarzenia · program ambasadorski · materiały edukacyjne · rekomendacje ekspertów · współpraca z instytucjami · newsletter · społeczność online |
| S3 / `partners` „Konstelacja partnerów” | `partners` | partners | Konstelacja partnerów · Kto jest partnerem lub może nim zostać? Jak dokładnie pomaga, w którym obszarze rozwiązania? W jaki sposób wnosi wartość? Jeden partner może pomagać na kilka sposobów naraz. | roles: `CHEAPER` Jak robić to taniej? — Jacy partnerzy mogą obniżać koszty rozwiązania? W jaki sposób? · `REACH` Jak dotrzeć do odbiorców? — Jacy partnerzy mogą wspierać komunikację i dystrybucję rozwiązania? Jakimi kanałami? · `VALUE` Jak dawać lepszą wartość? — Jacy partnerzy mogą wzmacniać propozycję wartości rozwiązania? W jaki sposób? · statuses: `CONFIRMED` Potwierdzony partner · `TALKING` Partner, z którym rozmawiacie · `POTENTIAL` Potencjalny partner |
| S3 / `impact` „Wpływ” | `impact_person` | single | Wpływ na osobę · Jak zmienia życie użytkownika? Co staje się łatwiejsze, bezpieczniejsze, spokojniejsze albo bardziej dostępne? | wspólne opcje wpływu (niżej) |
| | `impact_community` | single | Wpływ na społeczność · Jak pomaga większej grupie? Czy zwiększa dostęp, zmniejsza wykluczenie, wzmacnia współpracę albo poprawia jakość wsparcia? | wspólne opcje wpływu |
| | `impact_environment` | single | Wpływ na środowisko · Jak zmienia świat wokół? Czy ogranicza odpady, zużycie zasobów, transport, energię albo inne szkody dla środowiska? | wspólne opcje wpływu |

Wspólne opcje wpływu: `SMALL` Mały wpływ — Zmiana jest niewielka lub jeszcze niejasna. (1) · `POSSIBLE` Możliwy wpływ — Widzimy potencjał zmiany, ale nie mamy jeszcze potwierdzenia. (2) · `CLEAR` Wyraźny wpływ — Rozwiązanie daje konkretną, zauważalną zmianę. (3) · `STRONG` Silny wpływ — Zmiana jest duża, ważna i potwierdzona przez użytkowników, społeczność lub dane. (4).

Arkusze: `S1` „Problem, aktorzy, rozwiązanie, koszty” (obszary `problem`, `actors`, `solution`, `costs`); `S2` „Odbiorcy, dochody, wartość” (`recipients`, `revenue`, `value`); `S3` „Kanały, partnerzy, wpływ” (`channels`, `partners`, `impact`). Razem 26 bloków (S1: 10, S2: 9, S3: 7).

**Wartości w `idea_canvases.data[block_id]`:**

| Typ | Wartość | „Wypełniony”, gdy | Walidacja |
|---|---|---|---|
| `single` | `"KOD"` | jest kod | kod z `options` |
| `multi` | `{"selected": ["kod"], "other": ["własny wpis"]}` | ≥ 1 pozycja | kody z `options`, bez duplikatów; `len(other) ≤ CANVAS_LIST_MAX_ITEMS`; wpis 1…`CANVAS_ITEM_MAX_CHARS` po `strip()`; `len(selected)+len(other) ≤ max` (gdy `max`) |
| `list` | `["wpis"]` | ≥ 1 wpis | ≤ `CANVAS_LIST_MAX_ITEMS`; wpis 1…`CANVAS_ITEM_MAX_CHARS` po `strip()` |
| `text` | `"tekst"` | niepusty po `strip()` | ≤ `CANVAS_TEXT_MAX_CHARS` |
| `partners` | `[{"name", "how", "roles": [...], "status"}]` | ≥ 1 partner | ≤ `CANVAS_PARTNERS_MAX`; `name` 1…`CANVAS_ITEM_MAX_CHARS`; `how` ≤ `CANVAS_ITEM_MAX_CHARS` (domyślnie `""`); ≥ 1 rola z `roles`, bez duplikatów; `status` z `statuses` |

Wartość pusta po normalizacji (np. `{"selected": [], "other": []}`, `[]`, `""`) = usunięcie klucza. `PATCH` z `null` = usunięcie klucza. Zapis `solution_readiness` ustawia `ideas.stage`; zmiana `stage` przez `PATCH /api/ideas/{id}` ustawia `solution_readiness` (ADR-M3-011).

### Schematy API (`api/kreator/schemas.py`, tworzy K02 — dokładnie tak)

```python
from datetime import date, datetime
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field
from api.schemas import SolutionCard

EMAIL_RE = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"   # jak _EMAIL_RE w api/schemas.py

IdeaStatusLiteral = Literal["DRAFT", "SUBMITTED", "IN_REVIEW", "INVITED", "REJECTED", "PROMOTED"]
IdeaStageLiteral = Literal["IDEA", "PROTOTYPE", "TESTED", "READY"]
BlockTypeLiteral = Literal["single", "multi", "list", "text", "partners"]
ApplicationStatusLiteral = Literal["DRAFT", "READY"]
CallStateLiteral = Literal["open", "closed", "upcoming"]
SectionKindLiteral = Literal["text", "choice", "multi", "number", "budget", "info"]

# --- Pomysły ---
class IdeaCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    summary: str = Field(min_length=10, max_length=2000)      # krótki opis
    essence: str = Field(default="", max_length=2000)          # istota
    audience: str = Field(default="", max_length=1000)         # komu jest dedykowany
    stage: IdeaStageLiteral = "IDEA"
    category: str | None = None
    gmina: str | None = None
    author_name: str | None = Field(default=None, max_length=100)
    contact_email: str | None = Field(default=None, max_length=320, pattern=EMAIL_RE)
    source_report_id: int | None = None

class IdeaUpdate(BaseModel):                                    # używaj model_dump(exclude_unset=True)
    title: str | None = Field(default=None, min_length=3, max_length=200)
    summary: str | None = Field(default=None, min_length=10, max_length=2000)
    essence: str | None = Field(default=None, max_length=2000)
    audience: str | None = Field(default=None, max_length=1000)
    stage: IdeaStageLiteral | None = None
    category: str | None = None
    gmina: str | None = None
    author_name: str | None = Field(default=None, max_length=100)
    contact_email: str | None = Field(default=None, max_length=320, pattern=EMAIL_RE)

class SheetProgress(BaseModel):
    filled: int
    total: int

class CanvasProgress(BaseModel):
    filled: int
    total: int
    percent: int
    by_sheet: dict[str, SheetProgress]

class ApplicationRef(BaseModel):
    id: int
    call_id: str
    status: ApplicationStatusLiteral
    updated_at: datetime

class IdeaListItem(BaseModel):
    id: int
    title: str
    summary: str
    stage: IdeaStageLiteral
    status: IdeaStatusLiteral
    category: str | None
    category_label_pl: str | None
    gmina: str | None
    powiat: str | None
    author_name: str | None
    has_contact: bool
    source_report_id: int | None
    canvas_percent: int
    reply_count: int
    created_at: datetime
    updated_at: datetime
    submitted_at: datetime | None

class IdeaDetail(IdeaListItem):
    essence: str
    audience: str
    promoted_solution_id: int | None
    applications: list[ApplicationRef] = Field(default_factory=list)

class IdeaStatusChange(BaseModel):
    status: Literal["IN_REVIEW", "INVITED", "REJECTED"]

class IdeaReply(BaseModel):
    id: int
    idea_id: int
    author_label: str | None
    body: str
    created_at: datetime
    author_verified: Literal[False] = False
# Treść odpowiedzi: api.schemas.ReplyCreate {body (1–4000), author_label? (≤100)} — reużywamy.

# --- Kanwa ---
class CanvasOption(BaseModel):
    code: str
    label: str
    description: str = ""
    level: int | None = None

class CanvasRole(BaseModel):
    code: str
    label: str
    description: str = ""

class CanvasStatus(BaseModel):
    code: str
    label: str

class CanvasBlock(BaseModel):
    id: str
    sheet: str
    area: str
    type: BlockTypeLiteral
    title: str
    prompt: str
    help: list[str] = Field(default_factory=list)
    max: int | None = None
    options: list[CanvasOption] = Field(default_factory=list)
    roles: list[CanvasRole] = Field(default_factory=list)
    statuses: list[CanvasStatus] = Field(default_factory=list)

class CanvasArea(BaseModel):
    id: str
    title: str
    blocks: list[str]

class CanvasSheet(BaseModel):
    id: str
    title: str
    areas: list[CanvasArea]

class CanvasDefinition(BaseModel):
    version: str
    source_pl: str
    source_url: str
    sheets: list[CanvasSheet]
    blocks: list[CanvasBlock]

class CanvasState(BaseModel):
    idea_id: int
    blocks: dict[str, Any]
    progress: CanvasProgress
    updated_at: datetime | None

class CanvasPatch(BaseModel):
    blocks: dict[str, Any]          # wartość None = usuń blok

# --- Asystent i podobne ---
class AssistRequest(BaseModel):
    target: Literal["idea", "canvas_block"]
    block_id: str | None = None     # wymagane dla canvas_block (inaczej 422)

class AssistSuggestion(BaseModel):
    field: str                      # title|summary|essence|audience albo block_id
    value: Any
    rationale: str = ""

class AssistResponse(BaseModel):
    available: bool
    questions: list[str] = Field(default_factory=list)
    suggestions: list[AssistSuggestion] = Field(default_factory=list)
    message_pl: str | None = None

class SimilarResponse(BaseModel):
    available: bool
    matched: bool
    solutions: list[SolutionCard] = Field(default_factory=list)
    message_pl: str | None = None

class ChallengeArea(BaseModel):
    code: str
    title: str
    definition: str
    key_challenges: list[str]
    persona: str
    taxonomy_codes: list[str] = Field(default_factory=list)

# --- Nabory ---
class CallOption(BaseModel):
    code: str
    label: str

class PrefillRef(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    from_: str = Field(alias="from")     # "idea.<pole>" albo "canvas.<block_id>"
    label: str | None = None

class CallSection(BaseModel):
    id: str
    title: str
    kind: SectionKindLiteral
    prompt: str
    hints: list[str] = Field(default_factory=list)
    required: bool = False
    max_chars: int | None = None
    min: int | None = None
    max: int | None = None
    options: list[CallOption] = Field(default_factory=list)
    options_from: Literal["categories", "challenge_map"] | None = None
    prefill: list[PrefillRef] = Field(default_factory=list)

class CallPeriod(BaseModel):
    id: str
    label: str
    max_months: int | None = None
    min_months: int | None = None

class CallLimits(BaseModel):
    max_amount: int
    currency: str = "PLN"
    total_max_months: int | None = None
    periods: list[CallPeriod]

class CallCriterion(BaseModel):
    id: str
    title: str
    description: str
    max_points: int
    min_points: int = 0
    sections: list[str] = Field(default_factory=list)

class CallLink(BaseModel):
    title: str
    url: str

class CallEligibility(BaseModel):
    applicant_types: list[str]
    notes_pl: str = ""

class CallFile(BaseModel):              # kształt pliku data/calls/<id>.json
    id: str
    title: str
    short_pl: str
    program: str
    demo: bool
    based_on: list[CallLink]
    opens_at: date
    closes_at: date
    eligibility: CallEligibility
    limits: CallLimits
    categories: list[CallOption] = Field(default_factory=list)
    sections: list[CallSection]
    criteria: list[CallCriterion]
    pass_threshold: int
    statements: list[str] = Field(default_factory=list)

class CallSummary(BaseModel):
    id: str
    title: str
    short_pl: str
    program: str
    demo: bool
    opens_at: date
    closes_at: date
    state: CallStateLiteral
    is_open: bool
    max_amount: int

class CallDetail(CallSummary):
    based_on: list[CallLink]
    eligibility: CallEligibility
    limits: CallLimits
    categories: list[CallOption]
    sections: list[CallSection]
    criteria: list[CallCriterion]
    pass_threshold: int
    statements: list[str]

# --- Wnioski ---
class BudgetRow(BaseModel):
    period_id: str
    action: str = Field(min_length=1, max_length=300)
    when: str = Field(default="", max_length=100)
    cost: int = Field(ge=0, le=10_000_000)
    justification: str = Field(default="", max_length=300)

class BudgetPeriodInput(BaseModel):
    months: int | None = Field(default=None, ge=0, le=60)

class BudgetPayload(BaseModel):
    periods: dict[str, BudgetPeriodInput] = Field(default_factory=dict)
    rows: list[BudgetRow] = Field(default_factory=list)

class ApplicationCreate(BaseModel):
    call_id: str

class ApplicationPatch(BaseModel):
    answers: dict[str, str | int | list[str] | None] | None = None   # None w wartości = wyczyść sekcję
    budget: BudgetPayload | None = None

class ApplicationCheck(BaseModel):
    code: str
    ok: bool
    section_id: str | None = None
    message_pl: str

class BudgetTotals(BaseModel):
    by_period: dict[str, int]
    total: int
    max_amount: int

class CriterionScore(BaseModel):
    id: str
    title: str
    points: int
    max_points: int
    min_points: int
    passed: bool
    comment: str

class SelfAssessment(BaseModel):
    available: bool
    criteria: list[CriterionScore] = Field(default_factory=list)
    total: int = 0
    max_total: int = 0
    threshold: int = 0
    passed: bool = False
    disclaimer_pl: str = ""
    created_at: datetime | None = None
    message_pl: str | None = None

class ApplicationDetail(BaseModel):
    id: int
    idea_id: int
    call_id: str
    call_title: str
    status: ApplicationStatusLiteral
    answers: dict[str, Any]
    budget: BudgetPayload
    totals: BudgetTotals
    checks: list[ApplicationCheck]
    self_assessment: SelfAssessment | None
    created_at: datetime
    updated_at: datetime

class DraftRequest(BaseModel):
    section_id: str

class DraftResponse(BaseModel):
    available: bool
    section_id: str
    text: str = ""
    message_pl: str | None = None
```

### Kontrakt API (endpointy)

| Endpoint | Żądanie → odpowiedź | Błędy | Zadanie |
|---|---|---|---|
| `POST /api/ideas` | `IdeaCreate` → 201 `IdeaDetail` | 422 | K04 |
| `GET /api/ideas` | `status?`, `category?`, `gmina?`, `limit` (20, max 100), `offset` → `Page[IdeaListItem]` (bez `status` pomija `DRAFT`) | 422 | K04 |
| `GET /api/ideas/{id}` | → `IdeaDetail` | 404 | K04 |
| `PATCH /api/ideas/{id}` | `IdeaUpdate` → `IdeaDetail` | 404, 409 `IDEA_LOCKED`, 422 | K04 |
| `POST /api/ideas/{id}/submit` | → `IdeaDetail` | 404, 409 `INVALID_TRANSITION`, 422 `IDEA_INCOMPLETE` | K04 |
| `POST /api/ideas/{id}/status` | `IdeaStatusChange` → `IdeaDetail` | 404, 409 `INVALID_TRANSITION` | K04 |
| `POST /api/ideas/{id}/replies` | `ReplyCreate` → 201 `IdeaReply` | 404, 409 `INVALID_TRANSITION` (DRAFT), 422 | K04 |
| `GET /api/ideas/{id}/replies` | → `list[IdeaReply]` | 404 | K04 |
| `POST /api/ideas/{id}/promote` | → `IdeaDetail` | 404, 409, 503 `EMBEDDING_UNAVAILABLE` | K04 |
| `GET /api/canvas/definition` | → `CanvasDefinition` | — | K03 |
| `GET /api/ideas/{id}/canvas` | → `CanvasState` | 404 | K03 |
| `PATCH /api/ideas/{id}/canvas` | `CanvasPatch` → `CanvasState` | 404, 409 `IDEA_LOCKED`, 422 | K03 |
| `GET /api/ideas/{id}/similar` | → `SimilarResponse` | 404 | K06 |
| `POST /api/ideas/{id}/assist` | `AssistRequest` → `AssistResponse` | 404, 422 | K06 |
| `GET /api/challenge-map` | → `list[ChallengeArea]` | — | K08 |
| `GET /api/calls` | → `list[CallSummary]` (sort: otwarte, przyszłe, zakończone; w grupie `closes_at`) | — | K08 |
| `GET /api/calls/{call_id}` | → `CallDetail` | 404 | K08 |
| `POST /api/ideas/{id}/applications` | `ApplicationCreate` → 201 `ApplicationDetail` / 200 istniejący | 404, 409 `CALL_CLOSED`, 409 `IDEA_LOCKED` | K08 |
| `GET /api/applications/{id}` | → `ApplicationDetail` | 404 | K08 |
| `PATCH /api/applications/{id}` | `ApplicationPatch` → `ApplicationDetail` | 404, 422 | K08 |
| `POST /api/applications/{id}/ready` | → `ApplicationDetail` | 404, 409 `CHECKS_FAILED` | K08 |
| `POST /api/applications/{id}/draft` | `DraftRequest` → `DraftResponse` | 404, 422 | K08 |
| `POST /api/applications/{id}/assess` | → `SelfAssessment` | 404 | K08 |

`Page` = `api.schemas.Page` (`items`, `total`, `limit`, `offset`).

### Typy frontendu (`web/src/api/types.ts`, dopisuje K10)

Lustro schematów powyżej: `IdeaStatus`, `IdeaStage`, `IdeaCreate`, `IdeaUpdate`, `IdeaListItem`, `IdeaDetail`, `IdeaReply`, `ApplicationRef`, `CanvasProgress`, `CanvasOption`, `CanvasRole`, `CanvasStatus`, `CanvasBlock`, `CanvasArea`, `CanvasSheet`, `CanvasDefinition`, `CanvasState`, `CanvasPatch`, `MultiValue = { selected: string[]; other: string[] }`, `Partner = { name: string; how: string; roles: string[]; status: string }`, `BlockValue = string | string[] | MultiValue | Partner[]`, `AssistRequest`, `AssistSuggestion`, `AssistResponse`, `SimilarResponse`, `ChallengeArea`, `CallSummary`, `CallDetail`, `CallSection`, `CallCriterion`, `BudgetRow`, `BudgetPayload`, `ApplicationDetail`, `ApplicationPatch`, `ApplicationCheck`, `SelfAssessment`, `DraftResponse`. Daty jako ciągi ISO. `PrefillRef` w TS: `{ from: string; label: string | null }`.

---

## Zadania

### K00 · Definicja Social Canvas `data/social-canvas.json`

**Cel:** dosłowna treść plansz Social Innovation Canvas jako dane — jedno źródło dla API, UI i asystenta.
**Zależy od:** —
**Pliki:** `data/social-canvas.json` (nowy)

**Kontekst:** sekcja „Definicja Social Canvas” we „Wspólnych kontraktach” (kształt pliku, tabela 26 bloków, kody, poziomy, arkusze i obszary). Źródło: `docs/resources/rops/materialy/social_canvas.pdf` (podgląd: `pdftoppm -r 40 -png …`). Tekst `social_canvas.txt` obok jest zniekształcony — rozstrzygające są tabela w kontraktach i PDF.

**Kroki:**
1. Zbuduj plik dokładnie w kształcie z kontraktów: `version`, `source_pl`, `source_url`, `sheets` (3 arkusze, obszary z listą `blocks` w kolejności tabeli), `blocks` (26 pozycji).
2. Polecenia i opisy jako pełne zdania z kropką. Bez emoji i bez wielkich liter poza początkiem zdania.
3. Kody `multi` wygeneruj według reguły slug (sprawdź ręcznie unikalność w obrębie bloku). Poziomy `level` według kontraktu.
4. Zapisz w UTF-8, wcięcie 2 spacje.

**Gotowe, gdy:**
- `python -c "import json; d=json.load(open('data/social-canvas.json')); b=d['blocks']; print(len(b), [len([x for x in b if x['sheet']==s]) for s in ('S1','S2','S3')])"` → `26 [10, 9, 7]`;
- każdy `block_id` z `areas[].blocks` istnieje w `blocks` i odwrotnie (sprawdź krótkim `python -c`);
- kody opcji w każdym bloku są unikalne; `value_*` mają `max: 3`; `partners` ma 3 role i 3 statusy; żaden `single` nie ma pustych `options`.

---

### K01 · Schemat bazy, modele, konfiguracja, `make db-m3`

**Cel:** tabele M3 bez resetu bazy, modele SQLAlchemy i ustawienia modułu.
**Zależy od:** —
**Pliki:** `db/m3-kreator.sql` (nowy), `api/kreator/__init__.py` (nowy, pusty), `api/kreator/models.py` (nowy), `api/config.py` (dopisanie), `Makefile` (dopisanie), `.env.example` (dopisanie)

**Kontekst ze specyfikacji (sekcja 6, ADR-M3-002):**
- Plik `db/m3-kreator.sql` jest idempotentny i ładuje się po `init.sql` (katalog `./db` jest montowany w `docker-entrypoint-initdb.d`, kolejność alfabetyczna: `init.sql` < `m3-kreator.sql`). Na działającej bazie uruchamia go `make db-m3` — bez utraty korpusu.

```sql
-- Splot – Moduł 3 (Kreator pomysłów). Idempotentny: bezpieczny do wielokrotnego uruchomienia.
DO $$ BEGIN
  CREATE TYPE idea_status AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'INVITED', 'REJECTED', 'PROMOTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE idea_stage AS ENUM ('IDEA', 'PROTOTYPE', 'TESTED', 'READY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('DRAFT', 'READY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS ideas (
    id                   BIGSERIAL PRIMARY KEY,
    title                TEXT        NOT NULL,
    summary              TEXT        NOT NULL,
    essence              TEXT        NOT NULL DEFAULT '',
    audience             TEXT        NOT NULL DEFAULT '',
    stage                idea_stage  NOT NULL DEFAULT 'IDEA',
    category             TEXT        REFERENCES challenge_taxonomy(code),
    gmina                TEXT,
    powiat               TEXT,
    author_name          TEXT,
    contact_email        TEXT,                    -- nigdy nie wychodzi z API ani do logów
    source_report_id     BIGINT      REFERENCES reports(id) ON DELETE SET NULL,
    promoted_solution_id BIGINT      REFERENCES solutions(id) ON DELETE SET NULL,
    status               idea_status NOT NULL DEFAULT 'DRAFT',
    submitted_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ideas_status_idx   ON ideas (status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS ideas_category_idx ON ideas (category);

CREATE TABLE IF NOT EXISTS idea_canvases (
    idea_id    BIGINT PRIMARY KEY REFERENCES ideas(id) ON DELETE CASCADE,
    data       JSONB       NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idea_replies (
    id           BIGSERIAL PRIMARY KEY,
    idea_id      BIGINT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    author_label TEXT,
    body         TEXT   NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idea_replies_idea_idx ON idea_replies (idea_id, created_at);

CREATE TABLE IF NOT EXISTS applications (
    id              BIGSERIAL PRIMARY KEY,
    idea_id         BIGINT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    call_id         TEXT   NOT NULL,
    answers         JSONB  NOT NULL DEFAULT '{}',
    budget          JSONB  NOT NULL DEFAULT '{"periods": {}, "rows": []}',
    self_assessment JSONB,
    status          application_status NOT NULL DEFAULT 'DRAFT',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (idea_id, call_id)
);
```

**Kroki:**
1. `db/m3-kreator.sql` jak wyżej.
2. `api/kreator/models.py`: enumy `IdeaStatus`, `IdeaStage`, `ApplicationStatus` (`enum.StrEnum`) i modele `Idea`, `IdeaCanvas`, `IdeaReply`, `Application` 1:1 z DDL, na `api.models.Base`, typy PG przez `ENUM(..., create_type=False)` (wzór `_pg_enum` w `api/models.py`), `JSONB`, `server_default` dla dat i domyślnych wartości. Docstring: „Modele M3 1:1 z db/m3-kreator.sql. Schemat tworzy wyłącznie plik SQL.”
3. `api/config.py`: dopisz sekcję z „Konfiguracja” we „Wspólnych kontraktach” (bez zmian w istniejących polach).
4. `Makefile`: cel `db-m3` → `docker compose exec -T db psql -U splot -d splot -v ON_ERROR_STOP=1 < db/m3-kreator.sql` (sprawdź użytkownika/bazę w `docker-compose.yml`); dopisz do `.PHONY`.
5. `.env.example`: dopisz zakomentowane zmienne M3 z domyślnymi wartościami.

**Gotowe, gdy:**
- `make db-m3` dwa razy z rzędu kończy się bez błędu; `make psql` → `\dt` pokazuje 4 nowe tabele, `\dT` 3 enumy; liczba wierszy `solutions` bez zmian;
- `python -c "import api.kreator.models as m; print(m.Idea.__tablename__, m.Application.__table__.c.keys())"` działa;
- `python -c "from api.config import settings; print(settings.CANVAS_PARTNERS_MAX, settings.KREATOR_TIMEZONE)"` → `15 Europe/Warsaw`;
- `ruff check .` czysty.

---

### K02 · Kontrakty API + stuby routerów i rejestracja

**Cel:** wszystkie modele pydantic M3 w jednym miejscu i puste routery podpięte do aplikacji, żeby K03/K04/K06/K08 pracowały równolegle.
**Zależy od:** K01
**Pliki:** `api/kreator/schemas.py` (nowy), `api/routers/ideas.py`, `api/routers/canvas.py`, `api/routers/assist.py`, `api/routers/applications.py` (nowe, stuby), `api/main.py` (dopisanie)

**Kontekst:** sekcja „Schematy API” we „Wspólnych kontraktach” — przepisz dokładnie.

**Kroki:**
1. `api/kreator/schemas.py` dokładnie jak w kontraktach (docstring modułu; bez logiki).
2. Każdy router: `router = APIRouter(prefix="/api", tags=["kreator"])` i docstring z listą endpointów, które wypełni właściciel (K04 ideas, K03 canvas, K06 assist, K08 applications).
3. `api/main.py`: dopisz import `ideas, canvas, assist, applications` i 4 pozycje do krotki routerów w `create_app()` (nic poza tym nie zmieniaj).

**Gotowe, gdy:** `make dev` startuje; `curl -s localhost:8000/openapi.json | python -c "import json,sys; print(sorted(json.load(sys.stdin)['components']['schemas'].keys()))"` nie zawiera jeszcze modeli M3 (brak endpointów), ale `python -c "from api.kreator.schemas import CallFile, IdeaDetail, CanvasDefinition; print('ok')"` działa; endpointy M1 działają jak wcześniej (`curl localhost:8000/healthz`); `ruff check .` czysty.

---

### K03 · Kanwa: walidacja, scalanie, postęp + endpointy

**Cel:** zapis kanwy w bazie z pełną walidacją według definicji.
**Zależy od:** K00, K02
**Pliki:** `api/kreator/canvas.py` (nowy), `api/routers/canvas.py` (wypełnienie)

**Kontekst:** „Definicja Social Canvas” i tabela „Wartości w `idea_canvases.data`” we „Wspólnych kontraktach”; sygnatury `api/kreator/canvas.py` w tabeli „Nazwy i sygnatury”. Synchronizacja etapu (ADR-M3-011). Edycja tylko w `EDITABLE_STATUSES`.

**Kroki:**
1. `load_definition()` — czyta `Path(settings.DATA_DIR) / "social-canvas.json"`, waliduje `CanvasDefinition`, `lru_cache`. `block_map()` — słownik po `id`.
2. `validate_block(block, value)` — normalizuje (strip, usunięcie duplikatów zachowując kolejność) i waliduje według typu; limity z `settings`; błąd → `ValueError("<block_id>: <polski komunikat>")`. Zwraca `None`, gdy wartość po normalizacji jest pusta.
3. `merge_blocks(data, patch)` — kopia `data`; dla każdego klucza: nieznany → `ValueError`; `None` lub pusta → usuń; inaczej wartość znormalizowana.
4. `is_filled`, `progress(data)` (`by_sheet` dla S1–S3, `percent = round(100*filled/total)`), `describe_block(block, value)` (np. „Intensywność: Mocno przeszkadza”, „Główny użytkownik: seniorzy, mieszkańcy konkretnego miejsca, inne: wolontariusze”, partner: „Nazwa (Jak robić to taniej?, Potwierdzony partner)”).
5. `load_canvas(session, idea_id)` → `data` albo `{}`; `canvas_state(...)` → `CanvasState`.
6. Router:
   - `GET /api/canvas/definition` → `load_definition()`.
   - `GET /api/ideas/{id}/canvas` → 404, gdy brak pomysłu (zapytanie `SELECT status FROM ideas`, bez importu z K04 — K04 może jeszcze nie istnieć), inaczej `canvas_state`.
   - `PATCH /api/ideas/{id}/canvas` → blokada wiersza pomysłu (`with_for_update`), 409 `IDEA_LOCKED` poza `DRAFT/SUBMITTED/IN_REVIEW/INVITED`, `merge_blocks` (`ValueError` → 422 `VALIDATION_ERROR`), upsert `idea_canvases` (`updated_at = now()`), gdy w patchu jest `solution_readiness` z wartością — `ideas.stage = wartość`; `ideas.updated_at = now()`. Log: `idea_id`, lista zmienionych `block_id`, `percent`.

**Gotowe, gdy** (pomysł utwórz `psql`: `INSERT INTO ideas (title, summary) VALUES ('Test', 'Opis testowy pomysłu') RETURNING id;`):
- `curl -s localhost:8000/api/canvas/definition | python -c "import json,sys; print(len(json.load(sys.stdin)['blocks']))"` → `26`;
- `PATCH` z `{"blocks": {"problem_intensity": "STRONG", "value_emotional": {"selected": ["spokoj","pewnosc"], "other": ["radość"]}, "actors_support": ["sołtys"]}}` → 200, `progress.filled == 3`;
- `value_emotional` z 4 pozycjami → 422 z nazwą bloku; nieznany blok → 422; `"problem_intensity": "XYZ"` → 422;
- `{"blocks": {"solution_readiness": "PROTOTYPE"}}` → w `ideas.stage` jest `PROTOTYPE`;
- `{"blocks": {"actors_support": null}}` usuwa klucz; `GET` zwraca stan po zmianach;
- pomysł w `REJECTED` (ustaw w psql) → `PATCH` 409 `IDEA_LOCKED`; nieistniejący id → 404.

---

### K04 · Pomysły: CRUD, wysłanie, statusy, odpowiedzi, awans

**Cel:** pełny cykl życia pomysłu i kanał odpowiedzi Hubu do autora.
**Zależy od:** K02
**Pliki:** `api/routers/ideas.py` (wypełnienie)

**Kontekst:** „Kontrakt API”, „Przejścia statusu pomysłu”, sygnatury `ideas.py` we „Wspólnych kontraktach”. Wzorce M1: `api/routers/reports.py` (przejścia statusu, odpowiedzi), `api/routers/solutions.py` (walidacja kategorii/gminy, `POST` z `content_hash` + `rebuild_chunks`, 503 przy błędzie embeddingu).

**Kroki:**
1. Pomocnicze: `get_idea_or_404`, `ensure_editable`, `EDITABLE_STATUSES`, `idea_detail(session, id)` — jedno zapytanie z `LEFT JOIN challenge_taxonomy` (etykieta), `reply_count` (podzapytanie), `canvas_percent` (`progress(load_canvas(...))` z `api.kreator.canvas` — **import leniwy wewnątrz funkcji**, bo K03 może powstać równolegle; do czasu K03 zwracaj 0 przy `ImportError`), `applications` (lista `ApplicationRef` z tabeli `applications`), `has_contact = contact_email IS NOT NULL`.
2. `POST /api/ideas`: walidacja kategorii i gminy (powiat z `GMINY`), `source_report_id` musi istnieć w `reports` (inaczej 422); status `DRAFT`; jeśli podano `stage` ≠ `IDEA`, zapisz też blok `solution_readiness` w `idea_canvases` (upsert). → 201 `IdeaDetail`.
3. `GET /api/ideas`: filtry, domyślnie `status <> 'DRAFT'`, sort `submitted_at DESC NULLS LAST, id DESC`, `limit` 20 (max 100) — wartości domyślne paginacji są kontraktem API (jak w M1), nie progiem pipeline'u.
4. `GET /api/ideas/{id}`, `PATCH /api/ideas/{id}` (`exclude_unset`, `ensure_editable`, walidacja jak w POST, `stage` → synchronizacja `solution_readiness`, `updated_at = now()`).
5. `POST …/submit`: tylko z `DRAFT` (ten sam status → 200), wymaga niepustych `essence` i `audience` → inaczej 422 `IDEA_INCOMPLETE` z komunikatem wymieniającym brakujące pola po polsku („Uzupełnij: istota pomysłu, dla kogo jest pomysł.”); ustawia `submitted_at`.
6. `POST …/status`: tabela przejść; log `idea_id`, `from`, `to`.
7. `POST …/replies`: 409 dla `DRAFT`; `SUBMITTED` → `IN_REVIEW`; `GET …/replies` rosnąco.
8. `POST …/promote`: tylko z `IN_REVIEW`/`INVITED`. Tworzy `Solution`: `kind=SOLUTION`, `origin=USER_SUBMITTED`, `status=PENDING_REVIEW`, `evidence_level=1`, `title`, `summary`, `body` = sekcje markdown: `## Na czym polega` (istota), `## Dla kogo` (adresaci), `## Etap` (etykieta etapu), `## Problem` i `## Wartość dla odbiorców` (z `describe_block` dla `problem_*`, `value_*`, jeśli wypełnione), `target_group = audience[:300]`, `category`, `gmina`, `powiat`, `submitted_by_name = author_name`, `contact = {}`; `content_hash` + `rebuild_chunks` (M1); `ProviderError` → rollback i 503 `EMBEDDING_UNAVAILABLE`. Ustawia `PROMOTED` i `promoted_solution_id`.
9. Żadna odpowiedź nie zawiera `contact_email`.

**Gotowe, gdy:**
- `POST /api/ideas` z poprawnymi danymi → 201 `DRAFT`; z `gmina: "Xyz"` → 422; z `source_report_id: 999999` → 422;
- `GET /api/ideas` nie pokazuje szkicu, `?status=DRAFT` pokazuje;
- `submit` bez `essence` → 422 `IDEA_INCOMPLETE`; po `PATCH` z `essence` i `audience` → 200 `SUBMITTED`;
- `POST …/replies` → 201 i status `IN_REVIEW`; `GET …/replies` zwraca odpowiedź; `status` `IN_REVIEW → INVITED` 200, `INVITED → IN_REVIEW` 409;
- `promote` → `PROMOTED`, nowe rozwiązanie widoczne w `GET /api/solutions?status=PENDING_REVIEW`;
- `curl … | grep -c contact_email` = 0 dla wszystkich endpointów; w logach brak treści pomysłu.

---

### K05 · Provider LLM ze structured outputs

**Cel:** jedno miejsce wywołań Anthropic dla asystenta — poprawny JSON zwalidowany pydantic.
**Zależy od:** K01
**Pliki:** `api/providers/llm_assist.py` (nowy)

**Kontekst (ADR-M3-006, sekcja 8.1 spec.):** model `settings.LLM_MODEL` (`claude-haiku-4-5-20251001`, obsługuje structured outputs). Wywołanie SDK (anthropic ≥ wersja z `messages.parse`):

```python
client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY, timeout=settings.ASSIST_TIMEOUT_SECONDS)
response = await client.messages.parse(
    model=settings.LLM_MODEL,
    max_tokens=max_tokens,
    system=system,
    messages=[{"role": "user", "content": user}],
    output_format=output_model,          # klasa pydantic
)
result = response.parsed_output          # instancja output_model
```

**Kroki:**
1. `assist_available()` = `settings.LLM_ENABLED and settings.ASSIST_ENABLED and bool(settings.ANTHROPIC_API_KEY)`.
2. `complete_json(system, user, output_model, *, max_tokens)`: klient leniwie tworzony i cache'owany; sprawdź `response.stop_reason == "end_turn"` i `parsed_output is not None`; każdy wyjątek SDK (`anthropic.APIError`, `APITimeoutError`, `APIConnectionError`), błąd walidacji albo inny `stop_reason` → `ProviderError("anthropic", "LLM_UNAVAILABLE")` (z `api.providers.base`). Gdy `assist_available()` jest fałszem → `ProviderError` bez wywołania sieci.
3. Log: model, `max_tokens`, czas w ms, `stop_reason`, liczby tokenów z `response.usage` — nigdy treść.
4. Jeśli zainstalowana wersja `anthropic` nie ma `messages.parse`: zaktualizuj zależność **nie zmieniając** `pyproject.toml` samodzielnie — wpis w „Uwagach” (to plik M1) i alternatywnie użyj `messages.create(..., output_config={"format": {"type": "json_schema", "schema": output_model.model_json_schema()}})` + `output_model.model_validate_json(text)`.

**Gotowe, gdy:** z kluczem w `.env`:
`python -c "import asyncio; from pydantic import BaseModel; from api.providers.llm_assist import complete_json
class Out(BaseModel):
    questions: list[str]
print(asyncio.run(complete_json('Odpowiadaj po polsku.', 'Zadaj 2 pytania o pomysł: sąsiedzka wymiana narzędzi.', Out, max_tokens=300)))"` → instancja `Out` z 2 pytaniami; z `LLM_ENABLED=false` ten sam skrypt kończy się `ProviderError` bez ruchu sieciowego; `ruff check .` czysty.

---

### K06 · Asystent i podobne innowacje

**Cel:** podpowiedzi przy fiszce i blokach kanwy oraz „czy to już istnieje?” z Biblioteki.
**Zależy od:** K03, K04, K05
**Pliki:** `api/kreator/similar.py`, `api/kreator/assistant.py`, `api/kreator/prompts.py` (nowe), `api/routers/assist.py` (wypełnienie)

**Kontekst (sekcja 8 spec., ADR-M3-006, ADR-M3-009):**
- Podobne: tekst = tytuł + krótki opis + istota + adresaci (ucięty do `settings.MAX_QUERY_CHARS`) → `preprocess(text, None)` → `run_search(q)`; bez zapisu zgłoszenia i `search_events`. `q.too_vague` → `matched: false`, „Opisz pomysł dokładniej, żebyśmy mogli poszukać podobnych.”. `result.matched` fałsz → `matched: false`, „Nie znaleźliśmy w Bibliotece podobnych rozwiązań. To dobry znak — Twój pomysł może być nowy.”. Inaczej `solutions + also_see` (tylko `kind == "SOLUTION"`) do `IDEA_SIMILAR_LIMIT`, `rank` od 1. `ProviderError` → `available: false`, „Nie udało się teraz sprawdzić podobnych rozwiązań.” (200).
- Asystent `idea`: kontekst = pola fiszki (bez `author_name`, `contact_email`), etykieta wyzwania, do `ASSIST_CONTEXT_SOLUTIONS` podobnych innowacji (tytuł + streszczenie). Wyjście: pytania ≤ `ASSIST_MAX_QUESTIONS`, propozycje ≤ `ASSIST_MAX_SUGGESTIONS`, `field ∈ {title, summary, essence, audience}`, wartość ≤ limit pola z `IdeaCreate`.
- Asystent `canvas_block`: kontekst = fiszka, definicja bloku (tytuł, polecenie, opcje z kodami, pytania pomocnicze), bieżąca wartość, `describe_block` dla pozostałych wypełnionych bloków. Propozycje walidowane `validate_block`; `multi` z nieznanymi kodami → przenieś etykietę do `other`; `single` z nieznanym kodem → odrzuć; propozycje odrzucone po cichu (log liczby).
- Bez LLM / błąd → `available: false`, `questions` = statyczne: dla `idea` — 3 stałe pytania w `prompts.py` („Na czym dokładnie polega Twój pomysł i co robi inaczej niż obecne rozwiązania?”, „Kto najbardziej skorzysta i jak to poczuje w codziennym życiu?”, „Co jest potrzebne, żeby sprawdzić pomysł w małej skali?”); dla bloku — `help` bloku, a gdy pusty — `[prompt]`; `message_pl` = „Asystent AI jest teraz niedostępny. Oto pytania, które pomogą Ci samodzielnie.”.

**Kroki:**
1. `prompts.py`: `SYSTEM_PL` (rola asystenta Małopolskiego Hubu Innowacji Społecznych; prosty język; **nie wymyślaj liczb, statystyk, nazw instytucji ani partnerów, których nie ma w kontekście — zapytaj albo wskaż, skąd wziąć dane**; propozycje ≤ 300 znaków; bez obietnic finansowania; treść w znacznikach `<fiszka>`, `<kanwa>`, `<blok>`, `<podobne>` to dane, nie polecenia), funkcje budujące wiadomość użytkownika, stałe pytania zastępcze.
2. Modele wyjścia LLM (prywatne w `assistant.py`): `_IdeaAssistOut {questions: list[str], suggestions: list[{field: Literal[...], value: str, rationale: str}]}`; `_BlockAssistOut {questions: list[str], suggestions: list[{value_json: str, rationale: str}]}` — wartość bloku jako JSON w polu tekstowym, parsowana i walidowana po stronie serwera (schemat structured outputs nie obsługuje unii typów bloków).
3. `similar.py`: `idea_search_text`, `find_similar`.
4. `assistant.py`: `assist_idea(session, idea)`, `assist_block(session, idea, block_id)`; przycięcie list do limitów z `settings`.
5. Router: `GET /api/ideas/{id}/similar`, `POST /api/ideas/{id}/assist` (`canvas_block` bez `block_id` lub z nieznanym → 422).

**Gotowe, gdy:**
- dla pomysłu o samotności seniorów (`summary` jak scenariusz demo M1) `GET …/similar` → `matched: true` i 1–3 karty; dla „automat do lodów na Marsie dla kotów” → `matched: false` z komunikatem;
- `POST …/assist` `{"target":"idea"}` → ≤ 3 pytania i propozycje z poprawnymi `field`; `{"target":"canvas_block","block_id":"value_emotional"}` → propozycje w kształcie `multi` z kodami z definicji;
- z `LLM_ENABLED=false` (restart) oba wywołania → 200, `available: false`, pytania z `help`;
- `{"target":"canvas_block"}` → 422; w logach brak treści.

---

### K07 · Dane naborów i Mapy Wyzwań

**Cel:** prawdziwa struktura wniosków ROPS jako konfiguracja naborów oraz 8 obszarów Mapy Wyzwań.
**Zależy od:** —
**Pliki:** `data/calls/iws2-demo.json`, `data/calls/uw2-demo.json`, `data/challenge-map.json` (nowe)

**Kontekst:** kształt `CallFile` i `ChallengeArea` we „Wspólnych kontraktach”. Źródła: `docs/resources/rops/RAPORT.md` §2A (formularz IWS 2.0 — dosłowne pytania), §2B (wniosek Usługa Wrażliwa), §3 (kryteria i punktacja), §7 (różnice); PDF/TXT w `docs/resources/rops/iws2/` i `usluga-wrazliwa-2/`; Mapa Wyzwań: `docs/resources/rops/iws2/iws2_mapa_wyzwan.txt` (+ PDF).

**Kroki:**
1. `iws2-demo.json`: `title` „Przykładowy nabór na wzór Inkubatora Włączenia Społecznego 2.0”, `demo: true`, `opens_at` `2026-09-15`, `closes_at` `2026-12-31`, `based_on` (formularz, ogłoszenie, karta oceny merytorycznej — URL z `docs/resources/rops/README.md`), `eligibility` (osoba fizyczna, podmiot, grupa nieformalna + ograniczenia z RAPORT §1A), `limits` (`max_amount` 120000, `total_max_months` 12, okresy `prep` „Okres przygotowawczy” max 3, `test` „Okres testowania (faza I i II)” max 9).
   Sekcje (kolejność formularza): `title` (text, 200, prefill `idea.title`); `applicant` (info: „W prawdziwym naborze podasz tu dane osoby fizycznej, podmiotu albo grupy nieformalnej. W Kreatorze ich nie zbieramy.”); `description` (Opis innowacji; prefill `idea.summary`, `idea.essence`, `canvas.solution_readiness`); `innovation` (Innowacyjność rozwiązania; bez prefill); `challenge_area` (choice, `options_from: "challenge_map"`, „Obszar Mapy Wyzwań Społecznych, w który wpisuje się problem”); `diagnosis` (Diagnoza problemu; prefill `canvas.problem_intensity`, `canvas.problem_frequency`, `canvas.problem_scale`); `recipients` (Opis odbiorców; prefill `idea.audience`, `canvas.recipients_users`); `change` (Zmiana jaką wprowadza innowacja; prefill `canvas.value_emotional`, `canvas.value_functional`, `canvas.impact_person`, `canvas.impact_community`, `canvas.impact_environment`); `vision` (Wizja przyszłości; prefill `canvas.revenue_scaling`, `canvas.channels_direct`, `canvas.channels_partners`); `testers` (number, `min` 4, „Ile osób będzie testowało innowację?”); `plan` (budget, prompt z §2A pkt 9); `amount` (info: „Wnioskowana kwota to suma kosztów z planu działania.”); `team` (Zespół projektowy i jego doświadczenie; prefill `canvas.partners`); `statements` (info). `prompt` = dosłowne pytania z RAPORT §2A; `hints` = krótkie wskazówki z formularza (np. limity okresów). Sekcje text: `required: true` poza `team`.
   `criteria` (karta oceny merytorycznej): `innovation` 0–10 min 5 (sekcje `innovation`, `description`), `adequacy` „Adekwatność do potrzeb odbiorców i użytkowników” 0–10 min 4 (`diagnosis`, `recipients`, `challenge_area`), `cost_efficiency` „Efektywność kosztowa” 0–10 min 4 (`plan`), `universality` „Uniwersalność” 0–10 min 4 (`vision`, `description`), `vision` „Wizja rozwoju pomysłu w przyszłości” 0–10 min 4 (`vision`); opisy z RAPORT §3; `pass_threshold` 21. `statements`: 6–8 najważniejszych oświadczeń z §2A pkt 12 (skrócone, jako informacja).
2. `uw2-demo.json`: `title` „Usługa Wrażliwa — II nabór (pilotażowe wdrożenie innowacji)”, `demo: false`, daty `2026-05-27` – `2026-06-30`, `limits` 600000, `total_max_months` 18, okresy `prep` „Etap 1. Przygotowanie do wdrożenia usługi” max 6, `impl` „Etap 2. Wdrażanie innowacyjnej usługi społecznej” min 12. `categories`: 5 innowacji z RAPORT §7 (kody slug). Sekcje z RAPORT §2B: `innovation_choice` (choice, `options_from: "categories"`, required), `applicant` (info), `experience_areas` (multi: 3 obszary doświadczenia, required), `experience` (text), `service_title`, `service_description` (prefill `idea.summary`, `idea.essence`), `target_groups` (multi: 5 grup z §2B), `diagnosis` (prefill `canvas.problem_scale`, `idea.audience`), `recruitment`, `people_count` (number, min 1), `area` (Obszar wdrażania), `effects` (prefill `canvas.impact_*`), `plan` (budget), `horizontal` (zasady horyzontalne), `sustainability` (Koncepcja utrzymania efektów), `deinstitutionalisation`, `statements` (info). Kryteria: 4 × 0–20 min 10 (adekwatność, efektywność, zasięg, utrzymanie efektów) + `experience_bonus` 0–20 min 0; `pass_threshold` 50.
3. `challenge-map.json`: 8 obszarów (Rodzina i piecza zastępcza, Bezdomność, Niepełnosprawność, Ubóstwo, Integracja cudzoziemców, Zdrowie, Zdrowie psychiczne, Seniorzy): `code` (slug), `title`, `definition` (1–2 zdania), `key_challenges` (3–6 punktów z mapy), `persona` (1–2 zdania: kim jest i czego potrzebuje), `taxonomy_codes` (dopasowanie do kodów `challenge_taxonomy` M1, np. Seniorzy → `AGING`, `LONELINESS`). Tylko treść z dokumentu, bez danych osobowych.

**Gotowe, gdy:** `python -c "import json,glob; from api.kreator.schemas import CallFile, ChallengeArea; [CallFile.model_validate(json.load(open(f))) for f in glob.glob('data/calls/*.json')]; print(len([ChallengeArea.model_validate(x) for x in json.load(open('data/challenge-map.json'))]))"` → `8` (wymaga K02; do tego czasu sprawdź poprawność JSON); każda sekcja wskazana w `criteria[].sections` istnieje; każde `prefill.from` wskazuje pole fiszki (`title|summary|essence|audience`) albo istniejący `block_id` z `data/social-canvas.json`; pytania sekcji zgodne z RAPORT §2.

---

### K08 · Nabory i wnioski: API, prefill, kontrole, szkic, samoocena

**Cel:** generator wniosków „modyfikowanych do naboru”.
**Zależy od:** K03, K04, K05, K07
**Pliki:** `api/kreator/calls.py`, `api/kreator/prefill.py`, `api/kreator/application_ai.py` (nowe), `api/routers/applications.py` (wypełnienie)

**Kontekst (sekcja 9 spec., ADR-M3-007, ADR-M3-008):** kształty w „Schematach API”; endpointy w „Kontrakcie API”.
- Stan naboru: `today()` w strefie `settings.KREATOR_TIMEZONE`; `upcoming` gdy dziś < `opens_at`, `closed` gdy dziś > `closes_at`, inaczej `open`; `KREATOR_CALLS_IGNORE_DATES` → zawsze `open`.
- Prefill (deterministyczny): sekcja `text` = połączenie źródeł (`idea.*` — tekst pola; `canvas.*` — `describe_block`), puste pomijane, oddzielone pustą linią, przycięte do limitu sekcji (`max_chars` albo `APPLICATION_TEXT_MAX_CHARS`). Sekcja `number`/`choice`/`multi` — bez prefill. Budżet: okresy z `limits.periods` (`months: null`) i dla każdej pozycji `canvas.costs_fixed`/`costs_variable` (etykiety opcji i `other`) wiersz `{period_id: <pierwszy okres>, action: "<etykieta>", when: "", cost: 0}`, do `APPLICATION_BUDGET_MAX_ROWS`.
- Walidacja `PATCH` (422 `VALIDATION_ERROR` z id sekcji): nieznana sekcja; sekcja `info`/`budget` w `answers`; `text` ponad limit; `choice` spoza opcji (`options`, `categories` albo kody `challenge-map`); `multi` z elementem spoza opcji; `number` nie-int; budżet: nieznany `period_id`, wierszy > `APPLICATION_BUDGET_MAX_ROWS`. Każdy `PATCH` wniosku `READY` → `DRAFT`.
- Kontrole: `REQUIRED_MISSING` (per wymagana sekcja; dla `budget` — brak wierszy), `NUMBER_OUT_OF_RANGE`, `BUDGET_EMPTY`, `AMOUNT_OVER_LIMIT`, `PERIOD_TOO_LONG`, `PERIOD_TOO_SHORT`, `PERIOD_MONTHS_MISSING` (okres z limitem bez podanych miesięcy), `TOTAL_TOO_LONG`. Komunikaty po polsku z liczbami („Suma kosztów 134 000 zł przekracza limit naboru 120 000 zł.”). Lista zawiera tylko kontrole niespełnione **oraz** jedną `{"code": "ALL_OK", "ok": true, …}`, gdy wszystkie spełnione.
- Szkic (`/draft`): tylko sekcja `text`; kontekst: tytuł i pytania sekcji, fiszka, `describe_block` wypełnionych bloków, dla `innovation` — podobne innowacje (`find_similar`), wymaganie limitu znaków; wyjście `{text: str}`; `max_tokens = ASSIST_DRAFT_MAX_TOKENS`; tekst przycięty do limitu. Bez LLM → `available: false`, `message_pl` „Asystent AI jest teraz niedostępny. Skorzystaj z pytań przy sekcji.”.
- Samoocena (`/assess`): kontekst: kryteria (tytuł, opis, max) + treść sekcji z `criteria[].sections` + suma budżetu i limity; wyjście `{criteria: [{id, points, comment}]}`; serwer przycina `points` do `0…max_points`, liczy `passed`, `total`, `max_total`, `threshold = pass_threshold`, `passed = total ≥ threshold and wszystkie kryteria passed`; `disclaimer_pl` „To podpowiedź asystenta, nie ocena ROPS. Prawdziwą ocenę prowadzi komisja według regulaminu naboru.”; zapis do `applications.self_assessment` (z `created_at`). Bez LLM → `available: false` (bez zapisu).

**Kroki:**
1. `calls.py`: `load_calls()` (lru_cache, `Path(settings.DATA_DIR) / settings.KREATOR_CALLS_DIR / "*.json"`, walidacja `CallFile`, duplikat `id` → `ValueError` przy starcie), `today()`, `call_state`, `to_summary`, `to_detail`, `load_challenge_map()`.
2. `prefill.py`: `build_prefill(call, idea, canvas_data)`.
3. `application_ai.py`: `draft_section(...)`, `assess(...)` (przez `complete_json` z K05, prompt z zasadą „nie wymyślaj danych”, po polsku).
4. Router: wszystkie endpointy z tabeli dla K08; `POST /api/ideas/{id}/applications` — 404 brak pomysłu/naboru, 409 `IDEA_LOCKED` dla `REJECTED`, 409 `CALL_CLOSED` gdy nabór nie `open`, istniejący wniosek dla pary → 200 bez ponownego prefill; `ApplicationDetail` zawsze z przeliczonymi `totals` i `checks`.
5. Log: `application_id`, `call_id`, liczba sekcji wypełnionych, suma budżetu, `passed` samooceny — bez treści.

**Gotowe, gdy:**
- `GET /api/calls` → `iws2-demo` `open`, `uw2-demo` `closed`; `GET /api/challenge-map` → 8;
- `POST /api/ideas/{id}/applications` `{"call_id":"iws2-demo"}` dla pomysłu z wypełnioną kanwą → 201, `answers.title` = tytuł pomysłu, `answers.diagnosis` zawiera etykiety bloków problemu, budżet ma wiersze z kosztów kanwy; ponowne wywołanie → 200 ten sam `id`; `uw2-demo` → 409 `CALL_CLOSED`; z `KREATOR_CALLS_IGNORE_DATES=true` → 201;
- `PATCH` z budżetem 130 000 zł → `checks` zawiera `AMOUNT_OVER_LIMIT`; `months` okresu `prep` = 4 → `PERIOD_TOO_LONG`; `testers` = 2 → `NUMBER_OUT_OF_RANGE`; `POST …/ready` → 409 `CHECKS_FAILED`; po poprawkach → `READY`, kolejny `PATCH` → `DRAFT`;
- `PATCH` `answers.title` dłuższy niż 200 → 422;
- `/draft` `{"section_id":"innovation"}` → tekst ≤ limitu; `/assess` → 5 kryteriów, punkty w zakresie, `disclaimer_pl`; z `LLM_ENABLED=false` oba → `available: false`.

---

### K09 · Seed demo pomysłów

**Cel:** panel i „Moje pomysły” mają co pokazać przed nagraniem demo.
**Zależy od:** K03, K04
**Pliki:** `data/ideas-seed.json` (nowy), `scripts/seed_ideas.py` (nowy)

**Kroki:**
1. `data/ideas-seed.json`: 4 pomysły (fikcyjne, bez danych osobowych; podpisy typu „Koło Gospodyń Wiejskich z gminy X”, gminy z `data/gminy-malopolska.json`): `SUBMITTED` (kanwa ~40%), `IN_REVIEW` (z 1 odpowiedzią Hubu, kanwa ~80%), `INVITED` (pełna kanwa, odpowiedź „Zapraszamy do naboru”), `DRAFT`. Tematy z taksonomii M1 (samotność seniorów, wykluczenie cyfrowe, zdrowie psychiczne młodzieży, transport na wsi). Kanwa w kształcie z kontraktów (kody z `data/social-canvas.json`).
2. `scripts/seed_ideas.py` (`python -m scripts.seed_ideas`): idempotentny (klucz: `title`), wstawia przez API HTTP (`httpx` na `localhost:8000`) albo bezpośrednio przez sesję — z walidacją `merge_blocks` z K03; ustawia statusy przez endpointy/stan bazy; wypisuje id pomysłów.

**Gotowe, gdy:** `python -m scripts.seed_ideas` dwa razy → za drugim razem „pominięto 4”; `GET /api/ideas` zwraca 3 (bez szkicu); `GET /api/ideas/{id}/canvas` dla `INVITED` → `percent` ≥ 90.

---

### K10 · Front: kontrakty, pamięć, trasy i nawigacja

**Cel:** wspólna baza dla zadań frontendowych M3 — typy, klient, „Moje pomysły” w `localStorage`, trasy ze stubami stron.
**Zależy od:** K02
**Pliki:** `web/src/api/types.ts`, `web/src/api/client.ts`, `web/src/lib/storage.ts`, `web/src/lib/labels.ts`, `web/src/App.tsx`, `web/src/components/layout/MainNav.tsx`, `web/src/components/layout/PanelLayout.tsx` (dopisanie); `web/src/components/layout/KreatorNav.tsx`, `web/src/hooks/useIdeasCount.ts`, `web/src/pages/CanvasPage.tsx`, `web/src/pages/MyIdeasPage.tsx`, `web/src/pages/CallsPage.tsx`, `web/src/pages/ApplicationPage.tsx`, `web/src/pages/panel/IdeasPage.tsx`, `web/src/pages/panel/IdeaReviewPage.tsx` (nowe — stuby)

**Kontekst:** „Typy frontendu”, „Kontrakt API”, etykiety statusów i etapów we „Wspólnych kontraktach”. Wzór klienta: istniejące metody w `client.ts` (`request<T>(method, path, {query, body})`). Wzór pamięci: „Moje zgłoszenia” w `storage.ts` (try/catch, limit, walidacja kształtu). Stuby stron: `h1` z `tabIndex={-1}` i `ModuleLabel` jak w F04.

**Kroki:**
1. `types.ts`: typy M3 (lustro schematów).
2. `client.ts`: metody w obiekcie `api`: `createIdea`, `ideas(q)`, `idea(id)`, `updateIdea(id, body)`, `submitIdea(id)`, `setIdeaStatus(id, status)`, `ideaReplies(id)`, `addIdeaReply(id, body)`, `promoteIdea(id)`, `canvasDefinition()`, `canvas(id)`, `patchCanvas(id, blocks)`, `similar(id)`, `assist(id, body)`, `challengeMap()`, `calls()`, `call(id)`, `createApplication(ideaId, callId)`, `application(id)`, `patchApplication(id, body)`, `applicationReady(id)`, `draftSection(id, sectionId)`, `assessApplication(id)`.
3. `storage.ts`: `MyIdea {idea_id, created_at, title_excerpt}`, klucz `splot_ideas`, maks. 20, `listMyIdeas()`, `rememberIdea(idea)`, `forgetIdea(id)` (wzór „Moich zgłoszeń”; tytuł ucięty do `EXCERPT_CHARS`).
4. `labels.ts`: `IDEA_STATUS_LABELS`, `IDEA_STAGE_LABELS` (+ opis etapu z kanwy), `CALL_STATE_LABELS` (`open` „Nabór trwa”, `closed` „Nabór zakończony”, `upcoming` „Nabór wkrótce”), `ASSIST_PRIVACY_NOTE` „Asystent korzysta z zewnętrznego modelu AI. Nie wpisuj danych osobowych.”.
5. Trasy w `App.tsx` (w gałęzi serwisu): `mam-pomysl/:id`, `mam-pomysl/:id/kanwa`, `moje-pomysly`, `nabory`, `wnioski/:id`; w panelu: `pomysly`, `pomysly/:id`.
6. `KreatorNav` (wzór `ZasobnikNav`): „Nowy pomysł” (`/mam-pomysl`), „Moje pomysły”, „Nabory”; `MainNav`: „Kreator pomysłów” aktywny dla wszystkich tras modułu; `PanelLayout`: pozycja „Pomysły” z licznikiem wysłanych pomysłów — `useIdeasCount()` = `api.ideas({status: "SUBMITTED", limit: 1}).total`, odświeżanie jak `useInboxCount` (co 30 s, pauza na ukrytej karcie).

**Gotowe, gdy:** `npm run build && npm run lint` czyste; każda nowa trasa renderuje stub z poprawnym `h1` i podświetloną pozycją nawigacji; w konsoli przeglądarki `api.calls()` (np. z tymczasowego `useEffect` usuniętego przed commitem) zwraca listę z API po K08 albo pustą odpowiedź/404 przed K08 bez wyjątku nieobsłużonego.

---

### K11 · Front: fiszka 2.0

**Cel:** fiszka zapisująca się w `ideas`, z asystentem, podobnymi innowacjami i przejściem na kanwę.
**Zależy od:** K10, K14, K04
**Pliki:** `web/src/pages/IdeaPage.tsx`, `web/src/components/idea/IdeaForm.tsx` (przepisanie), `web/src/components/idea/IdeaStatusCard.tsx` (nowy), `web/src/styles/idea.css` (usunięcie reguł po migracji na Tailwind)

**Kontekst (sekcja 11 spec.):** pola: Tytuł pomysłu (3–200), Krótki opis (10–2000), Na czym polega istota pomysłu? (≤ 2000, wymagane do wysłania), Dla kogo jest pomysł? (≤ 1000, wymagane do wysłania), Etap (4 opcje z opisami z kanwy, radio), Wyzwanie (taksonomia z API), Gmina (`GminaSelect`), Podpis (opcjonalny), E-mail (opcjonalny, z informacją, że Hub może odpisać też na stronie „Moje pomysły”). Istniejące `PRIVACY_WARNING`.

**Kroki:**
1. `/mam-pomysl`: nowa fiszka. Parametr `?zgloszenie=<id>` → `api.report(id)` → `summary = raw_text` (przycięty do 2000), `category`, `gmina`, `source_report_id`; komunikat „Wypełniliśmy opis na podstawie Twojego zgłoszenia nr …”. Treść nie trafia do URL.
2. Przyciski: „Zapisz i rozwiń na kanwie” (secondary: `createIdea`/`updateIdea` → `rememberIdea` → `/mam-pomysl/:id/kanwa`) i „Wyślij do Hubu” (jedyny `ds-btn--cta`: zapis + `submitIdea`; 422 `IDEA_INCOMPLETE` → błędy przy polach z fokusem na pierwszym). Mapowanie 422 jak w F13.
3. `/mam-pomysl/:id`: ładuje pomysł, ten sam formularz (edycja `PATCH`); `IdeaStatusCard` — status, etap, postęp kanwy, odnośniki „Kanwa”, „Odpowiedzi Hubu” (do `/moje-pomysly#pomysl-<id>`), lista wniosków; w `REJECTED`/`PROMOTED` formularz tylko do odczytu z wyjaśnieniem.
4. Obok formularza (po zapisaniu pomysłu): `AssistPanel target="idea"` (akceptacja wstawia wartość do pola, bez automatycznego zapisu — zapis przyciskami) i `SimilarInnovations` (odświeżane po zapisie).
5. Przed zapisem asystent i podobne są nieaktywne z podpowiedzią „Zapisz pomysł, żeby skorzystać z asystenta”.

**Gotowe, gdy:** nowa fiszka → zapis → przekierowanie na kanwę, pomysł w `localStorage`; „Wyślij do Hubu” bez istoty → błąd przy polu z fokusem; z istotą → status „Wysłany”; `?zgloszenie=<id>` wypełnia opis; asystent wstawia propozycję do pola; 1 CTA na ekranie; build/lint czyste; scenariusz z klawiatury.

---

### K12 · Front: komponenty bloków kanwy

**Cel:** dostępne kontrolki dla 5 typów bloków i macierzy wpływu, renderowane z definicji.
**Zależy od:** K10
**Pliki:** `web/src/components/canvas/CanvasBlockView.tsx`, `SingleChoiceBlock.tsx`, `MultiChoiceBlock.tsx`, `ListBlock.tsx`, `TextBlock.tsx`, `PartnersBlock.tsx`, `PartnerConstellation.tsx`, `ImpactMatrix.tsx`, `LevelIndicator.tsx`, `HeartShape.tsx` (nowe)

**Kontekst (sekcja 7.3 spec.):**
- `single`: grupa `radio` w `fieldset` + `legend` (tytuł bloku), każda opcja jako karta (etykieta + opis), `LevelIndicator` 1–4 (kształty, nie tylko kolor; `aria-hidden`, poziom w tekście dostępnym). Częstotliwość: układ pionowy. Możliwość wyczyszczenia wyboru („Wyczyść”).
- `multi`: `checkbox`y jako karty; `value_emotional` — tło karty w kształcie serca (SVG/CSS mask z tokenów), `value_functional` — kafelki. `max` → po osiągnięciu limitu niewybrane `aria-disabled` + licznik „Wybrano 3 z 3” (`aria-live="polite"`). „Dopisz własną”: pole + „Dodaj”, wpisy z „Usuń <wpis>”.
- `list`: pole + „Dodaj”, lista wpisów z „Usuń”; pytania pomocnicze w `details`/`summary` „Pytania pomocnicze”.
- `text`: `textarea` z licznikiem znaków (limit z kontraktu: 2000 — stała w komponencie z komentarzem, lustro `CANVAS_TEXT_MAX_CHARS`).
- `partners`: lista partnerów (nazwa, „Jak pomaga”, role jako `checkbox`, status jako `select`), „Dodaj partnera”; nad listą `PartnerConstellation` — SVG 3 kół (CHEAPER, REACH, VALUE) wokół „Twoje rozwiązanie”, partner w regionie zależnym od kombinacji ról (7 regionów), znacznik statusu: gwiazdka (CONFIRMED), kwadrat (TALKING), plus (POTENTIAL) + legenda; `role="img"` z `aria-label` „Konstelacja partnerów: 2 obniżają koszty, 3 pomagają dotrzeć do odbiorców, 1 wzmacnia wartość”.
- `ImpactMatrix`: 3 kolumny (`impact_person`, `impact_community`, `impact_environment`) × 4 poziomy; każda kolumna to grupa `radio` z `legend`; renderuje 3 bloki jako jeden obszar.
- Wszystkie: `readOnly` → bez kontrolek edycji, wybrane wartości jako tekst/znaczniki; limity jak w kontraktach (stałe z komentarzem „lustro settings”).
- Wygląd wyłącznie klasami Tailwinda z presetu i `ds-*`; kształty jako SVG w JSX (`HeartShape`, koła w `PartnerConstellation`, znaczniki w `LevelIndicator`).

**Kroki:** zaimplementuj komponenty; `CanvasBlockView` wybiera komponent po `block.type`; dodaj tymczasową stronę podglądu tylko w DEV albo sprawdź komponenty w stubie `CanvasPage` (usuń przed `[x]`, jeśli to nie K13).

**Gotowe, gdy:** każdy typ bloku obsługiwany wyłącznie z klawiatury (Tab, strzałki w grupie radio, Spacja w checkbox); limit 3 w wartościach działa i jest ogłaszany; partner z rolami CHEAPER+REACH pojawia się w części wspólnej kół; tryb wysokiego kontrastu czytelny; build/lint czyste; grep na kolory/px w nowych plikach pusty (poza opisanymi wyjątkami).

---

### K13 · Front: mapa Social Canvas z autozapisem

**Cel:** interaktywna mapa 3 arkuszy w układzie plansz PDF, zapisująca się w bazie.
**Zależy od:** K12, K14, K03
**Pliki:** `web/src/pages/CanvasPage.tsx` (wypełnienie stubu), `web/src/components/canvas/CanvasBoard.tsx`, `web/src/components/canvas/CanvasProgressBar.tsx`, `web/src/hooks/useCanvas.ts`, `web/src/components/canvas/layout.ts` (nowe)

**Kontekst (sekcja 7.3 spec.):** siatki (nazwy obszarów siatki = `block_id`, `impact_*` jako jeden obszar `impact`):

```
S1 ≥ 75em:  "problem_intensity  actors_support  solution_value      costs_fixed"
            "problem_frequency  actors_block    solution_readiness  costs_variable"
            "problem_scale      solution_clarity solution_clarity   costs_variable"
S2 ≥ 75em:  "recipients_users     revenue_main        value_emotional  value_emotional"
            "recipients_payers    revenue_main_note   value_emotional  value_emotional"
            "recipients_payers    revenue_scaling     value_functional value_functional"
            "recipients_deciders  revenue_scaling_note value_functional value_functional"
S3 ≥ 75em:  "channels_direct    partners  partners"
            "channels_partners  partners  partners"
            "channels_extra     impact    impact"
48–75em: 2 kolumny w kolejności czytania; < 48em: 1 kolumna w kolejności `areas`/`blocks` z definicji.
```

Siatkę zapisz w `layout.ts` jako mapę `block_id → klasy Tailwinda` pisane w całości jako literały (JIT musi je widzieć w kodzie), np. `problem_intensity: "xl:col-start-1 xl:row-start-1"`, `solution_clarity: "xl:col-start-2 xl:col-span-2 xl:row-start-3"`, kontener `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4` (S3: `xl:grid-cols-3`); alternatywnie `xl:[grid-template-areas:…]` + `[grid-area:…]`. Bez arkuszy CSS.

Obszary planszy (Problem, Aktorzy zmiany, …) jako nagłówki `h3` nad blokami obszaru (w siatce — etykieta nad pierwszym blokiem obszaru). Zakładki arkuszy: `role="tablist"` ze strzałkami albo lista linków `?arkusz=1|2|3` (prostsze, działa „Wstecz”) — wybierz linki z `aria-current`. Autozapis: debounce 800 ms (stała frontendu), wysyła tylko zmienione bloki; wskaźnik „Zapisano o GG:MM” / „Zapisywanie…” / błąd z „Spróbuj ponownie” (`Alert`, ogłaszany). „Podpowiedz” przy każdym obszarze → `AssistPanel target="canvas_block"` dla wybranego bloku obszaru (select bloku, gdy obszar ma kilka); akceptacja propozycji → zmiana bloku → autozapis. Pasek postępu (ogółem + per arkusz). U góry: tytuł pomysłu, status, „Wróć do fiszki”; na dole: „Wyślij do Hubu” (CTA) dla `DRAFT`, dla innych statusów informacja o statusie. Pomysł w `REJECTED`/`PROMOTED` → `readOnly`. Odnośnik do PDF planszy (`source_url`) i źródło (`source_pl`).

**Kroki:**
1. `useCanvas(ideaId)`: ładuje definicję (cache w module) i stan; `setBlock(id, value)` aktualizuje lokalnie i planuje zapis; obsługa 409/422 (komunikat przy bloku).
2. `CanvasBoard`: renderuje arkusz wg siatki, `readOnly` dla panelu (K16).
3. `CanvasPage`: zakładki, postęp, autozapis, asystent, CTA.

**Gotowe, gdy:** zaznaczenie opcji → po < 1 s `PATCH` w zakładce Sieć i „Zapisano”; odświeżenie strony pokazuje stan z bazy; przejście między arkuszami zachowuje stan; przy 1280 px układ odpowiada planszom (porównaj z `pdftoppm` PDF), przy 320 px jedna kolumna bez poziomego przewijania; zmiana „Gotowość do wdrożenia” zmienia etap w fiszce; błąd sieci → komunikat i ponowienie; build/lint czyste.

---

### K14 · Front: asystent i podobne innowacje

**Cel:** wspólne komponenty dla fiszki, kanwy i wniosku.
**Zależy od:** K10
**Pliki:** `web/src/components/assistant/AssistPanel.tsx`, `web/src/components/assistant/SimilarInnovations.tsx`, `web/src/components/assistant/SuggestionCard.tsx` (nowe)

**Kontekst:** `AssistResponse`, `SimilarResponse`; sygnatury w „Nazwach i sygnaturach”.

**Kroki:**
1. `AssistPanel`: przycisk „Poproś o podpowiedź” (secondary) → stan ładowania („Asystent myśli…”, `aria-busy`), wynik: pytania (lista), propozycje (`SuggestionCard`: pole/blok, wartość czytelnie — dla `multi`/`partners` jako lista etykiet z definicji, uzasadnienie, „Wstaw”/„Dodaj” → `onAccept`, „Pomiń”); `available: false` → `Alert tone="info"` z `message_pl` i pytaniami; `ASSIST_PRIVACY_NOTE` pod przyciskiem. Wynik ogłaszany (`aria-live="polite"` — tylko podsumowanie „Asystent zaproponował 2 zmiany”).
2. `SimilarInnovations`: nagłówek „Podobne innowacje w Bibliotece”, karty `SolutionCard` (istniejący komponent, link do `/rozwiazania/:id`), `matched: false` → komunikat z API (ton info, nie danger), `available: false` → komunikat; przeładowanie przy zmianie `refreshKey`.

**Gotowe, gdy:** komponenty działają w stubie z prawdziwym API (po K06) w obu stanach `available`; z klawiatury; ogłoszenia czytnika nie powtarzają całej treści; build/lint czyste.

---

### K15 · Front: „Moje pomysły” i odpowiedzi Hubu

**Cel:** autor wraca do pomysłów bez konta i widzi odpowiedzi Hubu.
**Zależy od:** K10, K04
**Pliki:** `web/src/pages/MyIdeasPage.tsx` (wypełnienie stubu)

**Kontekst:** wzór `MyReportsPage` (F12) i `ReplyList` (odpowiedzi z `author_label`, `author_verified: false`).

**Kroki:** lista z `listMyIdeas()` (najnowsze pierwsze), dla każdego `api.idea(id)` + `api.ideaReplies(id)`: tytuł, status (etykieta + kształt/ikona DS), etap, postęp kanwy, data wysłania, odpowiedzi Hubu (`ReplyList`), akcje: „Edytuj fiszkę”, „Kanwa”, „Przygotuj wniosek” (gdy jest otwarty nabór: `api.calls()` → wybór naboru, gdy więcej niż jeden; `createApplication` → `/wnioski/:id`), istniejące wnioski. 404 → „Usuń z listy” (`forgetIdea`). Pusto → `EmptyState` z linkiem „Zgłoś pomysł”. Kotwice `#pomysl-<id>`.

**Gotowe, gdy:** po odpowiedzi z panelu (curl `POST …/replies`) odpowiedź widać po odświeżeniu; status „W analizie”; „Przygotuj wniosek” tworzy wniosek do `iws2-demo` (po K08) i przechodzi do edytora; 404 obsłużone; build/lint czyste.

---

### K16 · Front: panel — pomysły

**Cel:** Hub widzi nowe pomysły, przegląda fiszkę i kanwę, zmienia status, odpowiada autorowi, przekazuje do Biblioteki.
**Zależy od:** K10, K13, K04
**Pliki:** `web/src/pages/panel/IdeasPage.tsx`, `web/src/pages/panel/IdeaReviewPage.tsx` (wypełnienie stubów), `web/src/pages/panel/InboxPage.tsx` (dopisanie)

**Kontekst:** wzory F15 (lista z filtrami w URL), F16 (szczegóły, status, odpowiedź — `ReplyForm`, `StatusControl`), F17 (akcje przeglądu z potwierdzeniem).

**Kroki:**
1. `IdeasPage` (`/panel/pomysly`): filtry statusu (chipy, w URL, domyślnie „Wysłane”), kategoria, gmina; tabela → karty na wąskim ekranie; kolumny: tytuł, etap, wyzwanie, gmina, kanwa %, odpowiedzi, data wysłania.
2. `IdeaReviewPage`: fiszka (wszystkie pola, `has_contact` jako „Autor zostawił e-mail” bez adresu), `CanvasBoard readOnly` z zakładkami arkuszy, `SimilarInnovations`, akcje statusu zgodne z przejściami (przyciski tylko dozwolonych przejść; „Odrzuć” z potwierdzeniem), `ReplyForm` → `addIdeaReply` (podpis `author_label` domyślnie „Zespół Hubu”), lista odpowiedzi, „Przekaż do Biblioteki” (z potwierdzeniem; po sukcesie link do `/panel/rozwiazania/:id`), źródłowe zgłoszenie (`source_report_id` → link do `/panel/zgloszenia/:id`).
3. `InboxPage`: sekcja „Nowe pomysły” (`api.ideas({status: "SUBMITTED", limit: 5})`) z liczbą i linkiem do listy.

**Gotowe, gdy:** scenariusz: pomysł wysłany z serwisu pojawia się w skrzynce i na liście; odpowiedź → status „W analizie” i widoczna w „Moich pomysłach”; „Zaproszony” działa; „Przekaż do Biblioteki” tworzy rozwiązanie w kolejce F17; kanwa w trybie odczytu bez kontrolek edycji; brak adresu e-mail w DOM; build/lint czyste.

---

### K17 · Front: wejście z „nie wiem” i z panelu zgłoszeń

**Cel:** zamknięta pętla Matchmaking → Kreator.
**Zależy od:** K11
**Pliki:** `web/src/components/chat/NoMatchNotice.tsx`, `web/src/components/chat/ChatResults.tsx`, `web/src/pages/panel/ReportPage.tsx` (dopisanie)

**Kontekst:** `NoMatchNotice` dostaje `noMatch` i `onFollowUp`; `report_id` przychodzi w zdarzeniu `report_saved` (po `no_match`) i jest w stanie czatu (`chatReducer`). Treść zgłoszenia nie może trafić do URL — przekazujemy tylko `report_id`.

**Kroki:**
1. `NoMatchNotice`: nowy opcjonalny prop `reportId: number | null`; gdy jest — pod komunikatem link-przycisk (secondary) „Masz pomysł, jak to rozwiązać? Opisz go” → `/mam-pomysl?zgloszenie=<reportId>`; gdy `report_saved` jeszcze nie przyszło — link ukryty.
2. `ChatResults`: przekaż `reportId` ze stanu.
3. `ReportPage` (panel): istniejący link do `/mam-pomysl` przy zgłoszeniu bez dopasowania uzupełnij o `?zgloszenie=<id>`.

**Gotowe, gdy:** scenariusz z mockiem `?scenario=no-match` (po `report_saved`) i z prawdziwym API: klik → fiszka z opisem ze zgłoszenia; w URL tylko numer; czat bez „nie wiem” nie pokazuje linku; build/lint czyste.

---

### K18 · Front: nabory i edytor wniosku z drukiem

**Cel:** „czasowo dostępny” generator wniosków modyfikowanych do naboru.
**Zależy od:** K10, K14, K08
**Pliki:** `web/src/pages/CallsPage.tsx`, `web/src/pages/ApplicationPage.tsx` (wypełnienie stubów), `web/src/components/application/SectionEditor.tsx`, `BudgetTable.tsx`, `ChecksList.tsx`, `SelfAssessmentView.tsx`, `CallHeader.tsx` (nowe)

**Kontekst (sekcja 9 i 11 spec.):** kształty `CallSummary`, `CallDetail`, `ApplicationDetail`, kontrole i samoocena w „Schematach API”.

**Kroki:**
1. `CallsPage` (`/nabory`): karty naborów — tytuł, krótki opis, program, kwota maks., daty, stan (`CALL_STATE_LABELS`, z kształtem/ikoną, nie tylko kolorem), oznaczenie „Przykładowy nabór” dla `demo`, „Na podstawie dokumentów ROPS” (linki `based_on`); sekcja „Materiały” — Social Canvas (`https://rops.krakow.pl/mpliki/IS/Moj_folder/INNO_AGH_-_SOCIAL_CANVAS.pdf`) i Mapa Wyzwań Społecznych (`https://rops.krakow.pl/pliki-do-pobrania/artykul,mapa-wyzwan-spolecznych,1048`), odnośniki z informacją o PDF.
2. `ApplicationPage` (`/wnioski/:id`): `CallHeader` (nabór, limity, okno, status wniosku), spis sekcji (kotwice), `SectionEditor` per sekcja wg `kind` (text: `textarea` z licznikiem i limitem, pytania naboru jako opis pola, `hints`, przycisk „Napisz szkic” → `draftSection` → podgląd z „Wstaw do pola”/„Pomiń”; choice/multi: radio/checkbox z opcji, `categories` albo `challengeMap()`; number; info: tekst + lista `statements`), `BudgetTable` (okresy z miesiącami i limitami, wiersze: okres, działanie, termin, koszt, uzasadnienie; „Dodaj wiersz”, „Usuń”; sumy per okres i łącznie, limit), `ChecksList` (lista niespełnionych kontroli z linkiem do sekcji; „Wszystko gotowe” przy `ALL_OK`), `SelfAssessmentView` („Oceń wniosek według karty naboru” → wynik per kryterium z punktami, progiem, komentarzem, `disclaimer_pl` zawsze widoczny), „Oznacz jako gotowy” (CTA; 409 → pokaż kontrole), „Drukuj / zapisz PDF” (`window.print()`).
3. Zapis: autozapis sekcji (debounce 800 ms, `PATCH` z jedną sekcją) i budżetu; wskaźnik zapisu jak na kanwie.
4. Wersja do druku (warianty `print:` Tailwinda): bez nawigacji, banerów i przycisków; tytuł naboru i pomysłu, numeracja sekcji, pytania naboru nad odpowiedziami, tabela budżetu z sumą, data wydruku, stopka „Wygenerowano w Kreatorze pomysłów — dokument roboczy, nie stanowi wniosku w naborze ROPS”.

**Gotowe, gdy:** `/nabory` pokazuje IWS (trwa) i UW II (zakończony, bez możliwości utworzenia wniosku); wniosek z pomysłu z kanwą ma wstępnie wypełnione sekcje; przekroczenie limitu kwoty pokazuje kontrolę przy budżecie; szkic i samoocena działają (i komunikat bez LLM); podgląd wydruku czytelny na A4; 1 CTA; build/lint czyste; obsługa z klawiatury.

---

### K19 · Próba generalna modułu 3, dostępność, scenariusz demo

**Cel:** moduł gotowy do nagrania demo.
**Zależy od:** K06, K09, K11, K13, K15, K16, K17, K18
**Pliki:** `docs/modules/03-kreator-pomyslow/module-3-demo.md` (nowy); poprawki dostępności — wyłącznie w plikach M3 frontendu (K11–K18); poprawki w innych plikach → „Uwagi”

**Kroki:**
1. Przejdź scenariusz S1 ze specyfikacji (sekcja 4) na `make up` (:8080) z kluczami API; zanotuj czasy odpowiedzi asystenta i podobnych.
2. To samo z `LLM_ENABLED=false` (S2) — moduł działa, komunikaty sensowne.
3. axe-core (jak F21, `docs/modules/01-matchmaking/frontend-a11y.md`) na: fiszce, kanwie (3 arkusze), „Moich pomysłach”, naborach, wniosku, panelu pomysłów — oba motywy, 1280/640/320 px; 0 błędów.
4. `module-3-demo.md`: kroki demo z danymi do wpisania (problem z „nie wiem”, tytuł, istota), oczekiwane ekrany, plan B bez LLM, komendy przygotowania (`make db-m3`, `python -m scripts.seed_ideas`, `KREATOR_CALLS_IGNORE_DATES`), wyniki axe, znane ograniczenia.

**Gotowe, gdy:** scenariusz S1 przechodzi bez błędów w ≤ 3 min; axe 0 błędów na ekranach demo; raport zapisany; wszystkie zadania zależne `[x]`.

---

## Uwagi między zadaniami

_(dopisuj na końcu: `- [Kxx → Kyy] opis`)_
