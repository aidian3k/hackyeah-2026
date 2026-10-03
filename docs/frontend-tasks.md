# Moduł frontendowy — plan implementacji i zadania

Plan interfejsu Splot zbudowanego na API Modułu 1 (`docs/module-1-tasks.md`, T00–T26) i design systemie (`DESIGN.md`, `design-system/`). Każde zadanie jest samowystarczalne: zawiera cel, pliki, wklejony kontekst, kroki i kryterium gotowości. Agent wykonujący zadanie **nie musi czytać specyfikacji HTML ani kodu backendu**. Musi przeczytać `CLAUDE.md`, `DESIGN.md` oraz sekcję „Wspólne kontrakty” poniżej.

**Decyzje dla frontendu (2026-10-03):**
- **Osobny moduł w `web/`.** Frontend powstaje w `web/` i nie zmienia plików w `api/`, `db/` ani `scripts/` (zob. `CLAUDE.md`).
- **Stack:** Vite + React + TypeScript + React Router. Bez bibliotek komponentów UI, bez Tailwinda, bez bibliotek wykresów i bez menedżera stanu. Wygląd pochodzi wyłącznie z `design-system/tokens.css` i `design-system/components.css` oraz z cienkich arkuszy w `web/src/styles/`, które używają tylko tokenów.
- **Bez autoryzacji** (jak backend). Panel administratora `/panel` jest otwarty. Nie ma pola tokenu, logowania ani nagłówków `X-Access-Token` / `X-Report-Token`. Autor czyta odpowiedzi po samym `report_id`.
- **Bez testów automatycznych** (jak backend). Nie ma Vitest, Jest, Playwright ani katalogów `__tests__`. Zadanie weryfikujesz tak: `npm run build` i `npm run lint` są czyste, przechodzisz scenariusz ręcznie w przeglądarce (mock albo prawdziwe API), a dla czystej logiki uruchamiasz skrypt sprawdzający w `web/scripts/` (`npx tsx …`).
- **Nie zbieramy e-maila** w czacie. `ChatRequest.contact_email` istnieje, ale PoC niczego nie wysyła (ADR-018), więc pole tylko obiecywałoby kontakt, którego nie ma. To też minimalizacja danych.
- **Bez Testera innowacji, generatora wniosków, Asystenta kreatora, Middlemana i kont.** Moduły IV, V (poza odpowiedzią do autora) i VII z `base.md` są poza zakresem.

## Protokół pracy (obowiązkowy)

1. **Jedyne źródło statusu** to lista „Status zadań” poniżej. Treść zadań nie zawiera statusu.
2. Stany:
   - `- [ ]` — wolne,
   - `- [~]` — w toku; dopisz na końcu linii ` — agent: <nazwa>, <RRRR-MM-DD GG:MM>`,
   - `- [x]` — zrobione; zamień dopisek na ` — zrobione: <nazwa>, <krótka notka lub hash commita>`.
3. **Branie zadania:** wybierz zadanie `[ ]`, którego wszystkie zależności są `[x]`. Edytuj tylko jego linię na `[~]`, potem przeczytaj plik ponownie i sprawdź, czy linia nadal ma Twój dopisek. Jeśli ktoś był szybszy, weź inne zadanie.
4. Edytuj w tym pliku **wyłącznie linię swojego zadania** oraz (ewentualnie) dopisuj na końcu sekcji „Uwagi między zadaniami”. Nie przepisuj innych linii, nie formatuj pliku.
5. Zmieniaj w repozytorium **tylko pliki wymienione w polu „Pliki” swojego zadania**. Potrzebujesz zmiany w cudzym pliku → wpis w „Uwagach między zadaniami” (`- [Fxx → Fyy] opis`), nie edycja. Zmiana w backendzie → wpis `- [Fxx → backend Tyy] opis`.
6. `[x]` dopiero, gdy spełnione jest „Gotowe, gdy” oraz w `web/` przechodzą `npm run build` i `npm run lint` bez błędów i ostrzeżeń w Twoich plikach.
7. Zablokowany (backend zwraca coś innego niż kontrakt, brak danych, sprzeczność z `DESIGN.md`) → przywróć `[ ]` i opisz przyczynę w „Uwagach między zadaniami”.
8. Sygnatury z sekcji „Wspólne kontrakty” są wiążące. Jeśli musisz je zmienić, najpierw dodaj wpis w „Uwagach”. Nie zmieniaj ich po cichu.

## Status zadań

- [ ] F00 · Szkielet `web/` (Vite, React, TS, ESLint, proxy `/api`, cele w Makefile) · zależy: —
- [ ] F01 · Kontrakty: typy API, klient HTTP, klient SSE, `storage`, `format`, `labels` · zależy: F00
- [ ] F02 · Uzupełnienie mocka (`docs/mocks/`) o brakujące endpointy · zależy: —
- [ ] F03 · Rozszerzenia design systemu (`components.css` + strona przykładów) · zależy: —
- [ ] F04 · Szkielet aplikacji: baner, nawigacja, wysoki kontrast, routing, stuby stron · zależy: F00, F03
- [ ] F05 · Komponenty wspólne + hooki danych · zależy: F01, F03
- [ ] F06 · `GminaCombobox` (dostępne pole z podpowiedziami) · zależy: F01, F03
- [ ] F07 · Stan czatu: `chatReducer` + `useChat` · zależy: F01
- [ ] F08 · Ekran „Znajdź rozwiązanie”: formularz i spięcie strony · zależy: F04, F06, F07, F09
- [ ] F09 · Widok wyników czatu (karty, streszczenie z cytowaniami, licznik skali, „nie wiem”) · zależy: F05, F07
- [ ] F10 · Strona rozwiązania `/rozwiazania/:id` · zależy: F04, F05
- [ ] F11 · Biblioteka innowacji i Wiedza (katalog z filtrami) · zależy: F04, F05, F06
- [ ] F12 · „Moje zgłoszenia” i odpowiedzi zespołu Hubu · zależy: F04, F05
- [ ] F13 · „Mam pomysł”: formularz zgłoszenia rozwiązania · zależy: F04, F05, F06
- [ ] F14 · Panel: skrzynka „Nowe” + licznik w nawigacji · zależy: F04, F05
- [ ] F15 · Panel: lista zgłoszeń z filtrami · zależy: F04, F05, F06
- [ ] F16 · Panel: szczegóły zgłoszenia, status, podobne, odpowiedź do autora · zależy: F04, F05
- [ ] F17 · Panel: zatwierdzanie rozwiązań · zależy: F04, F05
- [ ] F18 · Panel: trendy (`/api/stats`) · zależy: F04, F05, F06
- [ ] F19 · Panel: podgląd wyszukiwania (`/api/search`, dla jury) · zależy: F04, F05
- [ ] F20 · Serwowanie produkcyjne: `web/Dockerfile`, nginx, serwis `web` w compose · zależy: F00
- [ ] F21 · Audyt dostępności i próba generalna ścieżki demo · zależy: F08, F10, F11, F12, F13, F14, F15, F16, F17, F18

### Fale równoległości (orientacyjnie)

- Fala 0: F00, F02, F03
- Fala 1: F01, F04, F20
- Fala 2: F05, F06, F07
- Fala 3: F09, F10, F11, F12, F13, F14, F15, F16, F17, F18, F19
- Fala 4: F08
- Fala 5: F21

**Najkrótsza działająca ścieżka demo** (gdy brakuje czasu): F00, F01, F03, F04, F05, F07, F09, F08, F12, F15, F16. Daje to czat z kartami, cytowaniami i licznikiem skali, numer zgłoszenia, panel z listą „bez dopasowania”, odpowiedź do autora i odczyt odpowiedzi przez autora. Jury ocenia dokładnie tę ścieżkę: łatwość zgłoszenia, trafność, komunikację z administratorem i odpowiedź do autora. Jeśli F06 nie jest gotowe, F08 używa tymczasowo natywnego `<select>` z listą z `/api/gminy` i zostawia wpis w „Uwagach”.

---

## Wspólne kontrakty (wiążące dla wszystkich zadań)

### Struktura `web/`

```
web/
  package.json  vite.config.ts  tsconfig.json  tsconfig.node.json  eslint.config.js  index.html
  scripts/                 # ręczne skrypty sprawdzające (npx tsx), nie testy
  src/
    main.tsx  App.tsx  vite-env.d.ts
    api/        types.ts client.ts sse.ts
    lib/        storage.ts format.ts labels.ts chatReducer.ts
    hooks/      useApi.ts useTaxonomy.ts useGminy.ts usePolling.ts useChat.ts
                useDocumentTitle.ts useContrast.ts useInboxCount.ts
    components/ layout/ (AppShell, Banner, MainNav, PanelLayout, ContrastToggle, Footer)
                CategoryTag.tsx SolutionCard.tsx EvidenceBadge.tsx Alert.tsx Pagination.tsx
                EmptyState.tsx LoadState.tsx ReplyList.tsx GminaCombobox.tsx
                chat/ solution/ catalog/ idea/ panel/
    pages/      FindPage.tsx SolutionPage.tsx LibraryPage.tsx KnowledgePage.tsx IdeaPage.tsx
                MyReportsPage.tsx NotFoundPage.tsx
                panel/ InboxPage.tsx ReportsPage.tsx ReportPage.tsx SolutionsQueuePage.tsx
                       SolutionReviewPage.tsx TrendsPage.tsx SearchDebugPage.tsx
    styles/     app.css (+ pliki per obszar; tylko var(--…))
```

### Konwencje

- TypeScript `strict`. Importy względne w obrębie `src/` przez alias `@/` (np. `import { api } from "@/api/client"`).
- Komponenty funkcyjne. Pliki `PascalCase.tsx` dla komponentów, `camelCase.ts` dla reszty. Eksporty nazwane, bez `default` (wyjątek: nic).
- Teksty dla użytkownika są po polsku i piszesz je w kodzie zgodnie z „Tonem i treścią” z `DESIGN.md`: druga osoba, wielka litera tylko na początku zdania, bez emoji, przyciski mówią, co się stanie. Teksty używane w więcej niż jednym miejscu żyją w `src/lib/labels.ts`.
- **Zero kolorów, odstępów i rozmiarów pisma wpisanych na sztywno.** W CSS i w `style={{…}}` tylko `var(--…)`. Sprawdzenie: `grep -rnE '#[0-9a-fA-F]{3,8}\b|rgba?\(|[0-9]+px' web/src --include=*.css --include=*.tsx` zwraca wyłącznie wyjątki opisane komentarzem (np. `min-height: 44px` jest już w klasach DS, więc nie powinno go być w `web/src`).
- Klasy komponentów pochodzą z design systemu (`ds-…`). Brakuje klasy → wpis do F03 w „Uwagach”, nie lokalna kopia stylu.
- Stan filtrów list (katalog, panel) trzymasz w parametrach URL (`useSearchParams`), żeby działał przycisk „Wstecz” i dało się wkleić link.
- Frontend **nie sortuje, nie filtruje i nie odcina** wyników czatu. Kolejność `candidates` jest ostateczna, `scores` nie wpływają na wyświetlanie (wyjątek: panel F19).
- Nazwy wyzwań i gmin zawsze z API (`/api/taxonomy`, `/api/gminy`), nigdy z kodu. Kod zna tylko mapę `kod kategorii → klasa CSS` (niżej).
- Treść zgłoszeń (`message`, `raw_text`) nie trafia do URL, `console.log` ani `sessionStorage`. Do `localStorage` trafia tylko skrót (patrz „Pamięć przeglądarki”).
- Dostępność (WCAG 2.1 AA) to kryterium gotowości każdego zadania, nie osobny etap. Lista kontrolna jest niżej.

### Uruchamianie

| Komenda | Co robi |
|---|---|
| `make web-install` | `cd web && npm install` |
| `make web-dev` | Vite na `:5173`, proxy `/api` i `/healthz` → `http://localhost:8000` (prawdziwy backend, `make up && make ingest`) |
| `make web-mock` | `python docs/mocks/replay.py` na `:8001` + Vite z `VITE_API_TARGET=http://localhost:8001` |
| `make web-build` | `cd web && npm run build` (`tsc -b && vite build`) |
| `make web-lint` | `cd web && npm run lint` |

Wszystkie wywołania idą przez proxy pod ten sam origin (`/api/...`), więc CORS nie gra roli w dev. W trybie mock scenariusz czatu wybierasz parametrem strony: `http://localhost:5173/?scenario=error`. Klient SSE przekazuje go do `/api/chat?scenario=…` **tylko gdy `import.meta.env.DEV`**.

### Typy API (`web/src/api/types.ts`, tworzy F01 — dokładnie tak)

Lustro `api/schemas.py`. Daty przychodzą jako ciągi ISO.

```ts
export type ReporterType = "RESIDENT" | "NGO" | "JST" | "OTHER";
export type ReportStatus = "NEW" | "TRIAGED" | "MATCHED" | "IN_PROGRESS" | "CLOSED";
export type SolutionKind = "SOLUTION" | "KNOWLEDGE";
export type SolutionStatus = "PUBLISHED" | "PENDING_REVIEW" | "REJECTED" | "ARCHIVED";
export type Stage = "preprocess" | "search" | "rerank" | "answer";

export interface Scores {
  rerank: number | null; rrf: number | null;
  lex_rank: number | null; vec_rank: number | null; cosine: number | null;
}
export interface MediaItem { type: string; url: string; title: string | null }

export interface SolutionCard {
  id: number; kind: SolutionKind; rank: number;
  title: string; summary: string;
  organization: string | null; gmina: string | null; powiat: string | null;
  category: string | null; category_label_pl: string | null;
  tags: string[]; target_group: string | null; cost_range: string | null;
  implementation_steps: string[];
  source_url: string | null; source_name: string | null;
  evidence_level: number;            // 1–5
  media: MediaItem[];
  origin: string;                    // CURATED | USER_SUBMITTED | PROMOTED_FROM_REPORT
  scores: Scores | null;             // null poza wynikami czatu/wyszukiwania
}
export interface SolutionDetail extends SolutionCard { body: string }

// --- czat (SSE) ---
export interface ChatRequest {
  message: string;                   // 1..10000 znaków, nie same spacje
  session_id?: string | null;
  gmina?: string | null;             // nazwa z /api/gminy; nieznana → 422 przed strumieniem
  severity_self?: number | null;     // 1–5
  reporter_type?: ReporterType;      // domyślnie OTHER
}
export interface StatusEvent { stage: Stage; label_pl: string }
export interface CandidatesEvent { solutions: SolutionCard[]; also_see: SolutionCard[]; context: SolutionCard[] }
export interface TokenEvent { text: string }
export interface AnswerRetractedEvent { reason: "no_citations" }
export interface NoMatchEvent { reason: "below_threshold"; best_score: number | null; gate: string; message_pl: string }
export interface ReportSavedEvent { report_id: number; similar_count: number; gmina_count: number }
export interface DoneEvent { search_event_id: number | null; latency_ms: Record<string, number> }
export interface ErrorEvent { code: string; message_pl: string }

export type ChatEvent =
  | { event: "status"; data: StatusEvent }
  | { event: "candidates"; data: CandidatesEvent }
  | { event: "token"; data: TokenEvent }
  | { event: "answer_retracted"; data: AnswerRetractedEvent }
  | { event: "no_match"; data: NoMatchEvent }
  | { event: "report_saved"; data: ReportSavedEvent }
  | { event: "done"; data: DoneEvent }
  | { event: "error"; data: ErrorEvent };

// --- zgłoszenia i panel ---
export interface Page<T> { items: T[]; total: number; limit: number; offset: number }
export interface ReportListItem {
  id: number; raw_text: string;
  category: string | null; category_label_pl: string | null;
  gmina: string | null; powiat: string | null;
  reporter_type: ReporterType; severity_self: number | null;
  matched: boolean; status: ReportStatus;
  top_solution_id: number | null; top_rerank_score: number | null;
  session_id: string | null; created_at: string; reply_count: number;
}
export interface ReportDetail extends ReportListItem {
  normalized_text: string; target_group: string | null; extracted: Record<string, unknown>;
}
export interface SimilarReport { id: number; raw_text: string; gmina: string | null; created_at: string; matched: boolean; similarity: number }
export interface ReplyCreate { body: string; author_label?: string | null }   // body 1..4000
export interface Reply { id: number; report_id: number; author_label: string | null; body: string; created_at: string; author_verified: false }

// --- rozwiązania ---
export interface SolutionSubmit {
  title: string;                     // 3..200
  summary: string;                   // 10..2000
  body?: string;                     // ..20000
  organization?: string | null; gmina?: string | null; category?: string | null;
  tags?: string[];                   // ≤ 20
  target_group?: string | null; cost_range?: string | null;
  implementation_steps?: string[];   // ≤ 30
  source_url?: string | null; media?: MediaItem[];
  submitted_by_name?: string | null;
}                                    // extra="forbid": nie wysyłaj innych pól
export interface SolutionCreated { id: number; status: "PENDING_REVIEW" }
export interface SolutionPatch { status?: "PUBLISHED" | "REJECTED" | "ARCHIVED"; evidence_level?: number; category?: string }

// --- skrzynka, statystyki, meta ---
export interface Inbox {
  new_reports: number; new_unmatched: number; pending_solutions: number;
  latest_reports: ReportListItem[]; latest_pending: SolutionCard[];
}
interface Counts { total: number; matched: number; unmatched: number }
export interface Stats extends Counts {
  from: string; to: string;
  by_category: (Counts & { category: string | null; label_pl: string | null })[];
  by_gmina: (Counts & { gmina: string | null; powiat: string | null })[];
  by_week: (Counts & { week: string })[];
  by_reporter_type: (Counts & { reporter_type: ReporterType })[];
}
export interface FeedbackCreate { search_event_id: number; solution_id?: number | null; helpful: boolean }
export interface TaxonomyItem { code: string; label_pl: string; description: string; sort_order: number }
export interface GminaItem { name: string; powiat: string }
export interface Health { db: "ok" | "error"; embedding_provider: string; rerank_provider: string; llm_enabled: boolean }
export interface ErrorBody { error: { code: string; message: string } }

// --- GET /api/search (tylko F19) ---
export interface SearchDebug {
  normalized_query: string;
  extracted: { category: string | null; target_group: string | null; identifiers: string[]; too_vague: boolean; expanded_terms: string[] };
  tsquery: string | null;
  lexical: { solution_id: number; title: string | null; rank: number; score: number | null }[];
  semantic: { solution_id: number; title: string | null; rank: number; cosine_similarity: number | null }[];
  fused: { solution_id: number; rrf: number; ranks: Record<string, number>; cosine: number | null }[];
  reranked: { solution_id: number; score: number | null }[];
  knowledge: { solution_id: number; title: string | null; cosine_similarity: number | null }[];
  gate: { source: string; score: number | null; threshold: number; passed: boolean };
  solutions: number[]; also_see: number[];
  latency_ms: Record<string, number>;
}
```

### Klient HTTP (`web/src/api/client.ts`, F01)

```ts
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message) }
}
// Błąd sieci → ApiError(0, "NETWORK", "Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.")
// Odpowiedź nie-2xx → parsuje ErrorBody; brak JSON → ApiError(status, "HTTP_<status>", komunikat ogólny PL)

type Query = Record<string, string | number | boolean | null | undefined>;   // null/undefined pomijane

export const api = {
  taxonomy(): Promise<TaxonomyItem[]>,
  gminy(): Promise<GminaItem[]>,
  solutions(q?: Query): Promise<Page<SolutionCard>>,        // kind, category, gmina, powiat, tag, evidence_min, q, status, sort, limit, offset
  solution(id: number): Promise<SolutionDetail>,
  submitSolution(body: SolutionSubmit): Promise<SolutionCreated>,
  patchSolution(id: number, body: SolutionPatch): Promise<SolutionDetail>,
  reports(q?: Query): Promise<Page<ReportListItem>>,        // matched, status, category, gmina, reporter_type, limit, offset
  report(id: number): Promise<ReportDetail>,
  similarReports(id: number): Promise<SimilarReport[]>,
  patchReport(id: number, status: ReportStatus): Promise<ReportDetail>,
  replies(id: number): Promise<Reply[]>,
  addReply(id: number, body: ReplyCreate): Promise<Reply>,
  inbox(): Promise<Inbox>,
  stats(q?: Query): Promise<Stats>,                          // from, to (RRRR-MM-DD), category, gmina
  feedback(body: FeedbackCreate): Promise<void>,             // 204
  searchDebug(q: string, opts?: { rerank?: boolean; gmina?: string }): Promise<SearchDebug>,
  health(): Promise<Health>,                                 // GET /healthz (bez /api); 503 też zwraca Health
};
```

### Klient SSE (`web/src/api/sse.ts`, F01)

```ts
export function streamChat(
  req: ChatRequest,
  onEvent: (e: ChatEvent) => void,
  signal?: AbortSignal,
): Promise<void>;
```
- `fetch("/api/chat", {method: "POST", headers: {"Content-Type": "application/json", Accept: "text/event-stream"}, body, signal})`. `EventSource` nie wchodzi w grę, bo obsługuje tylko GET.
- Nie-2xx (np. 422 za nieznaną gminę) → `throw ApiError` **zanim** przyjdzie jakiekolwiek zdarzenie.
- Ramki rozdzielone `\n\n`; w ramce `event: <nazwa>` i jedna lub więcej linii `data:` (sklejane). Nieznana nazwa zdarzenia → ignoruj, nie przerywaj.
- Koniec strumienia bez `done` (zerwane połączenie) → `onEvent({event: "error", data: {code: "STREAM_CLOSED", message_pl: "Połączenie zostało przerwane. Spróbuj ponownie."}})`, potem syntetyczne `done` z `search_event_id: null`. Dzięki temu konsument ma jedną ścieżkę zamknięcia.
- `AbortError` po `signal.abort()` → cicho kończy (bez syntetycznych zdarzeń).

**Kolejność zdarzeń gwarantowana przez backend:** `status* → candidates → (token* [→ answer_retracted] | no_match) → report_saved? → done`. `error` może przyjść w dowolnym miejscu, po nim zawsze `done`. `candidates` i `done` są zawsze (wyjątek: `error` przed `candidates`, gdy padło wyszukiwanie — wtedy `candidates` nie ma).

### Stan czatu (`web/src/lib/chatReducer.ts` + `web/src/hooks/useChat.ts`, F07)

```ts
export type ChatPhase = "idle" | "streaming" | "done";

export interface ChatState {
  phase: ChatPhase;
  request: ChatRequest | null;            // ostatnio wysłane (do pytania doprecyzowującego)
  stage: StatusEvent | null;              // ostatni status
  candidates: CandidatesEvent | null;
  answer: string;                         // sklejone tokeny
  answerRetracted: boolean;
  noMatch: NoMatchEvent | null;
  saved: ReportSavedEvent | null;         // brak = zapis nieudany → bez licznika i bez numeru
  error: ErrorEvent | null;               // błąd w strumieniu (karty mogą już być)
  requestError: ApiError | null;          // błąd przed strumieniem (422, sieć)
  searchEventId: number | null;
}

export type ChatAction =
  | { type: "submit"; request: ChatRequest }
  | { type: "event"; event: ChatEvent }
  | { type: "request_error"; error: ApiError }
  | { type: "reset" };

export const initialChatState: ChatState;
export function chatReducer(state: ChatState, action: ChatAction): ChatState;   // czysta funkcja

export function useChat(): {
  state: ChatState;
  send(input: Omit<ChatRequest, "session_id">): void;   // dokleja session_id, przerywa poprzedni strumień
  followUp(text: string): void;                         // nowe /api/chat: poprzednia wiadomość + "\n\n" + text, ten sam session_id i pola
  abort(): void;
  reset(): void;
};
```
Reguły reduktora: `submit` czyści wszystko poza `request` i ustawia `streaming`; `answer_retracted` ustawia `answerRetracted = true` i czyści `answer`; `done` ustawia `phase = "done"` i `searchEventId`; `report_saved` zapisuje też wpis w `storage.addMyReport` (efekt w `useChat`, nie w reduktorze).

### Pamięć przeglądarki (`web/src/lib/storage.ts`, F01)

Każdy odczyt i zapis jest w `try/catch`. Gdy pamięć nie działa (tryb prywatny, zablokowane dane), aplikacja działa dalej, tylko nie pamięta.

| Funkcja | Klucz | Gdzie | Treść |
|---|---|---|---|
| `getSessionId(): string` | `splot_session` | `sessionStorage` | `crypto.randomUUID()` tworzony przy pierwszym użyciu |
| `getContrast() / setContrast(on)` | `splot_contrast` | `localStorage` | `"high"` albo brak |
| `listMyReports() / addMyReport(r) / removeMyReport(id)` | `splot_reports` | `localStorage` | `[{report_id, created_at, excerpt, gmina}]`; `excerpt` = pierwsze 80 znaków wiadomości; maks. 20 wpisów, najnowsze pierwsze |

`index.html` (F00) ma krótki skrypt inline, który przed renderem ustawia `data-contrast="high"` na `<html>`, gdy `localStorage.splot_contrast === "high"` (bez mignięcia jasnego motywu).

### Formatowanie i etykiety (`web/src/lib/format.ts`, `web/src/lib/labels.ts`, F01)

```ts
// format.ts
export function plural(n: number, one: string, few: string, many: string): string;
//   plural(1,"osoba","osoby","osób") → "osoba"; 2–4 (poza 12–14) → few; reszta → many
export function formatDate(iso: string): string;        // "3 października 2026" (Intl, pl-PL)
export function formatDateTime(iso: string): string;    // "3 października 2026, 18:42"
export function formatRelative(iso: string): string;    // "przed chwilą", "15 min temu", "wczoraj", potem formatDate
export function scaleMessage(s: ReportSavedEvent): string;
//   similar_count = 0 → "Jesteś pierwszą osobą, która zgłasza ten problem."
//   gmina_count ≤ 1   → "Podobny problem zgłosiło już {N} {osoba|osoby|osób}."
//   inaczej           → "Podobny problem zgłosiło już {N} {osoba|osoby|osób} z {M} {gminy|gmin}."
```

```ts
// labels.ts
export const PRIVACY_WARNING = "Nie wpisuj imion, adresów ani danych o zdrowiu konkretnych osób.";
export const MESSAGE_MAX_CHARS = 2000;    // backend i tak przycina zapytanie do MAX_QUERY_CHARS = 2000
export const REPORTER_TYPE_LABELS: Record<ReporterType, string> = {
  RESIDENT: "Mieszkaniec lub mieszkanka", NGO: "Organizacja społeczna", JST: "Samorząd", OTHER: "Nie chcę podawać",
};
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  NEW: "Nowe", TRIAGED: "Przejrzane", MATCHED: "Dopasowane", IN_PROGRESS: "W toku", CLOSED: "Zamknięte",
};
export const REPORT_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {   // lustro reguł backendu (409 INVALID_TRANSITION)
  NEW: ["TRIAGED"], TRIAGED: ["MATCHED", "IN_PROGRESS"], MATCHED: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["CLOSED"], CLOSED: [],
};
export const EVIDENCE_LABELS: Record<number, string> = {
  1: "Pomysł", 2: "Przetestowane w małej skali", 3: "Wdrożone w jednej gminie",
  4: "Wdrożone w kilku miejscach", 5: "Wdrożone wielokrotnie, z oceną efektów",
};  // 1, 3, 5 ze specyfikacji; 2 i 4 uzupełnione przez frontend
export const CATEGORY_TAG_CLASS: Record<string, string> = {
  AGING: "ds-tag--starzenie", MENTAL_HEALTH: "ds-tag--psych", LONELINESS: "ds-tag--samotnosc",
  DIGITAL_EXCLUSION: "ds-tag--cyfrowe", SERVICE_ACCESS: "ds-tag--dostep",
  DEPOPULATION: "ds-tag--osadnictwo", SUBURBAN_GROWTH: "ds-tag--osadnictwo",
  COORDINATION: "ds-tag--koordynacja",
};  // OTHER i nieznane → sama klasa ds-tag
export const EXAMPLE_PROMPTS: string[];   // 3–4 krótkie przykłady do chipów pod polem czatu
```

### Hooki wspólne (F05, F04, F14)

```ts
export function useApi<T>(fn: () => Promise<T>, deps: unknown[]): { data: T | null; error: ApiError | null; loading: boolean; reload(): void };
export function useTaxonomy(): { items: TaxonomyItem[]; byCode: Map<string, TaxonomyItem>; error: ApiError | null };  // jedno żądanie na aplikację
export function useGminy(): { items: GminaItem[]; error: ApiError | null };                                           // jedno żądanie na aplikację
export function usePolling(fn: () => void, ms: number): void;     // pauza, gdy document.hidden
export function useDocumentTitle(title: string): void;            // "<title> · Splot"
export function useContrast(): [boolean, (on: boolean) => void];
export function useInboxCount(): number | null;                   // F04 stub zwraca null; F14 implementuje (polling 30 s)
```

### Komponenty wspólne (F05, F06)

| Komponent | Props | Uwagi |
|---|---|---|
| `CategoryTag` | `{ code: string \| null; label: string \| null }` | `ds-tag` + klasa z `CATEGORY_TAG_CLASS`; zawsze z nazwą słowną; `null` → nic |
| `EvidenceBadge` | `{ level: number }` | „Poziom sprawdzenia: 4 z 5 — Wdrożone w kilku miejscach” (tekst, nie same kropki) |
| `SolutionCard` | `{ card: SolutionCard; headingLevel?: 2 \| 3; showRank?: boolean; id?: string }` | `ds-card`; tytuł jako link do `/rozwiazania/:id`; `showRank` pokazuje numer `[n]` (cel cytowania); bez `scores` |
| `Alert` | `{ tone: "info" \| "success" \| "warning" \| "danger"; title?: string; children }` | zawsze ikona + słowo (np. „Uwaga:”), klasa `ds-alert` z F03 |
| `LoadState` | `{ loading: boolean; error: ApiError \| null; onRetry?: () => void; children }` | spinner z tekstem / `Alert danger` z przyciskiem „Spróbuj ponownie” |
| `EmptyState` | `{ title: string; children? }` | jedno zdanie pomocy |
| `Pagination` | `{ total: number; limit: number; offset: number; onChange(offset: number): void }` | `nav aria-label="Strony wyników"`, „Poprzednia / Następna” + „Strona 2 z 7” |
| `ReplyList` | `{ replies: Reply[] }` | „Zespół Hubu” jako autor; `author_label` jako dopisek w nawiasie, **nigdy** jako potwierdzona tożsamość |
| `GminaCombobox` | `{ id: string; value: string \| null; onChange(v: string \| null): void; label: string; hint?: string; error?: string }` | wzorzec ARIA 1.2 combobox + listbox; F06 |

### Mapa ekranów i tras

| Trasa | Strona | Zadanie | Endpointy |
|---|---|---|---|
| `/` | Znajdź rozwiązanie (czat) | F08 + F09 | `POST /api/chat`, `/api/gminy`, `POST /api/feedback` |
| `/rozwiazania` | Biblioteka innowacji | F11 | `GET /api/solutions`, `/api/taxonomy`, `/api/gminy` |
| `/rozwiazania/:id` | Rozwiązanie | F10 | `GET /api/solutions/{id}` |
| `/wiedza` | Wiedza o wyzwaniach | F11 | `GET /api/solutions?kind=KNOWLEDGE`, `/api/taxonomy` |
| `/mam-pomysl` | Mam pomysł | F13 | `POST /api/solutions`, `/api/taxonomy`, `/api/gminy` |
| `/moje-zgloszenia` | Moje zgłoszenia | F12 | `GET /api/reports/{id}/replies` |
| `/panel` | Panel: Nowe | F14 | `GET /api/inbox` |
| `/panel/zgloszenia` | Panel: Zgłoszenia | F15 | `GET /api/reports` |
| `/panel/zgloszenia/:id` | Panel: Zgłoszenie | F16 | `GET/PATCH /api/reports/{id}`, `/similar`, `GET/POST /replies`, `GET /api/solutions/{id}` |
| `/panel/rozwiazania` | Panel: Do zatwierdzenia | F17 | `GET /api/solutions?status=…` |
| `/panel/rozwiazania/:id` | Panel: Przegląd rozwiązania | F17 | `GET/PATCH /api/solutions/{id}` |
| `/panel/trendy` | Panel: Trendy | F18 | `GET /api/stats` |
| `/panel/wyszukiwanie` | Panel: Podgląd wyszukiwania | F19 | `GET /api/search` |
| `*` | Nie znaleziono | F04 | — |

Nawigacja publiczna (`MainNav`): „Znajdź rozwiązanie” (ikona domu w `accent`), „Biblioteka innowacji”, „Wiedza”, „Mam pomysł”, „Moje zgłoszenia”. Nawigacja panelu (`PanelLayout`): „Nowe” (z licznikiem), „Zgłoszenia”, „Do zatwierdzenia”, „Trendy”, „Podgląd wyszukiwania”, a na końcu link „Wróć do serwisu”. Link „Panel Hubu” jest w stopce serwisu publicznego.

### Zasady design systemu w skrócie (pełne w `DESIGN.md`)

- Tło `surface`, baner `surface-muted`, tekst `ink`/`ink-muted`, nagłówki i linki `navy`.
- **Jeden `ds-btn--cta` (magenta) na ekran**, i tylko tam, gdzie jest główne działanie mieszkańca („Znajdź rozwiązania”, „Wyślij pomysł do Hubu”). W panelu nie ma CTA; główne działanie to `ds-btn--primary`.
- Paski tylko w banerze (`Banner`), raz na ekranie. Nigdzie indziej, także nie w kartach ani stopce.
- Jeden `h1` na ekran. Karty: `ds-card`, bez kolorowych krawędzi. Cień tylko pod nagłówkiem i dialogami.
- Kategorie: `ds-tag` + słowo. Kolor nigdy nie jest jedyną informacją. Statusy: ikona + słowo.
- Tekst co najmniej 16 px (`body`), w formularzach dla mieszkańców `body-lg`. Mniejszy (14 px, `small`) tylko w metadanych.
- Tryb wysokiego kontrastu (`<html data-contrast="high">`) działa bez dodatkowych klas, jeśli używasz tokenów.

### Lista kontrolna dostępności (każde zadanie z UI)

1. Wszystko działa samą klawiaturą: kolejność Tab zgodna z wizualną, widoczny fokus (`:focus-visible` z DS), brak pułapek, `Esc` zamyka podpowiedzi.
2. Każde pole ma `<label>`; podpowiedź i błąd są powiązane przez `aria-describedby`; błąd pola ma `aria-invalid="true"`. Po nieudanym wysłaniu fokus przechodzi do pierwszego błędnego pola.
3. Zmiany bez przeładowania (wyniki, zapisano, błąd) ogłasza region `aria-live="polite"` (błędy krytyczne: `role="alert"`).
4. Po zmianie trasy fokus przechodzi na `h1` nowej strony (`tabIndex={-1}`), a tytuł karty przeglądarki się zmienia.
5. Strona działa przy szerokości 320 px i przy powiększeniu tekstu do 200% bez poziomego przewijania (WCAG 1.4.10, 1.4.4). Jednostki względne dla tekstu.
6. Kontrast spełniają tokeny. Nie wolno zestawiać `stripe-*` z tekstem.
7. Ikony dekoracyjne mają `aria-hidden="true"`, a przyciski z samą ikoną mają `aria-label`.
8. Animacje respektują `prefers-reduced-motion`.
9. Sprawdzenie: rozszerzenie axe DevTools albo Lighthouse (Dostępność ≥ 95) w obu motywach, plus przejście ekranu samą klawiaturą.

---

## F00 — Szkielet `web/`

**Zależy od:** —
**Pliki:** `web/package.json`, `web/vite.config.ts`, `web/tsconfig.json`, `web/tsconfig.node.json`, `web/eslint.config.js`, `web/index.html`, `web/src/main.tsx`, `web/src/vite-env.d.ts`, `web/src/styles/app.css`, `Makefile` (tylko dopisanie celów `web-*`), `.gitignore` (tylko dopisanie `web/node_modules/`, `web/dist/`)

**Cel:** uruchamialny projekt frontendu z design systemem i proxy do API.

**Kontekst:**
- Node 22 jest dostępny lokalnie. CORS backendu dopuszcza `http://localhost:5173` (domyślny port Vite), ale i tak używamy proxy, więc wszystkie żądania idą pod ten sam origin.
- Design system leży poza `web/` (`../design-system/`). Vite musi mieć do niego dostęp (`server.fs.allow: [".."]`).
- Font Atkinson Hyperlegible Next ładujesz linkiem z Google Fonts (`tokens.css` go nie importuje).

**Kroki:**
1. `package.json`: zależności `react`, `react-dom`, `react-router-dom` (v7); dev: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `tsx`. Skrypty: `dev`, `build` (`tsc -b && vite build`), `preview`, `lint` (`eslint . --max-warnings 0`).
2. `vite.config.ts`: plugin React, alias `@` → `src`, `server.port = 5173`, `server.fs.allow = [".."]`, proxy `/api` i `/healthz` → `process.env.VITE_API_TARGET ?? "http://localhost:8000"`. Dla `/api/chat` ustaw w proxy wyłączenie buforowania, żeby SSE płynęło na bieżąco (sprawdź, że tokeny przychodzą pojedynczo).
3. `tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `paths: {"@/*": ["src/*"]}`, `jsx: react-jsx`, target ES2022.
4. `eslint.config.js`: rekomendowane `@eslint/js` + `typescript-eslint` + `react-hooks` + `jsx-a11y` (recommended).
5. `index.html`: `<html lang="pl">`, `<meta name="viewport" …>`, link do fontu, `<title>Splot</title>`, skrypt inline ustawiający `data-contrast="high"` z `localStorage.splot_contrast` (w `try/catch`), `<div id="root">`.
6. `src/main.tsx`: import `../../design-system/tokens.css`, `../../design-system/components.css`, `./styles/app.css`; render `<StrictMode><BrowserRouter><h1>Splot</h1></BrowserRouter></StrictMode>` (F04 podmieni zawartość na `<App/>`).
7. `src/styles/app.css`: podstawowe klasy układu z tokenów (`.page` z `max-width` i marginesem `space-4`, odstępy sekcji `space-8`/`space-12`). Tylko `var(--…)`.
8. `Makefile`: cele `web-install`, `web-dev`, `web-mock` (mock w tle + Vite z `VITE_API_TARGET=http://localhost:8001`), `web-build`, `web-lint`.

**Nie rób:** żadnych bibliotek UI, Tailwinda, bibliotek testowych. Nie zmieniaj istniejących celów Makefile.

**Gotowe, gdy:** `make web-install && make web-dev` pokazuje na `:5173` nagłówek „Splot” w foncie Atkinson, w kolorze `navy`; przy działającym backendzie `curl localhost:5173/api/taxonomy` zwraca 9 pozycji (proxy); przy `make web-mock` `curl -N -X POST localhost:5173/api/chat -d '{}'` strumieniuje ramki z odstępami (nie jednym blokiem); `npm run build` i `npm run lint` czyste; `localStorage.splot_contrast = "high"` + odświeżenie daje czarne tło bez mignięcia białego.

---

## F01 — Kontrakty: typy, klient HTTP, klient SSE, pamięć, formatowanie

**Zależy od:** F00
**Pliki:** `web/src/api/types.ts`, `web/src/api/client.ts`, `web/src/api/sse.ts`, `web/src/lib/storage.ts`, `web/src/lib/format.ts`, `web/src/lib/labels.ts`, `web/scripts/check-sse.ts`

**Cel:** jedna warstwa dostępu do API i wspólne narzędzia, z których korzystają wszystkie ekrany.

**Kontekst:** wszystko w sekcji „Wspólne kontrakty”: typy, `api`, `streamChat`, `storage`, `format`, `labels`. Sygnatury są wiążące. Format błędu backendu: HTTP status + `{"error": {"code": "…", "message": "…"}}`; walidacja to 422 `VALIDATION_ERROR` z komunikatem w stylu `"gmina: nieznana gmina 'Gotham'."`. Odpowiedzi z `GET /api/taxonomy` i `/api/gminy` mają `Cache-Control: public, max-age=3600`.

**Kroki:**
1. `types.ts` — przepisz dokładnie z kontraktu.
2. `client.ts` — `request<T>(method, path, {query, body})` + obiekt `api`. Parametry `null`/`undefined`/`""` są pomijane. Odpowiedź 204 zwraca `undefined`. Każdy wyjątek to `ApiError`. `health()` czyta JSON także przy 503.
3. `sse.ts` — `streamChat` wg kontraktu. Parser ramek jako osobna eksportowana funkcja `parseFrames(buffer: string): { events: ChatEvent[]; rest: string }` (używa jej też skrypt z F07). W `DEV` dokleja `?scenario=` z `location.search`, jeśli jest.
4. `storage.ts`, `format.ts`, `labels.ts` — wg kontraktu. `EXAMPLE_PROMPTS` np. „Starsi sąsiedzi siedzą sami w domach i nie mają z kim porozmawiać”, „Młodzież czeka miesiącami na wizytę u psychologa”, „Seniorzy nie umieją załatwić spraw w urzędzie przez internet”.
5. `scripts/check-sse.ts` — dla każdego pliku `docs/mocks/chat-*.sse` czyta treść, przepuszcza przez `parseFrames` w kawałkach po 7 znaków (symulacja dzielenia pakietów) i wypisuje sekwencję nazw zdarzeń. Opcja `--live http://localhost:8001` robi to samo przez `fetch` na mocku.

**Gotowe, gdy:** `npx tsx web/scripts/check-sse.ts` wypisuje dla `chat-match`: `status status status candidates status token… report_saved done`, dla `chat-no-match`: `… candidates no_match report_saved done`, dla `chat-retracted`: `… token… answer_retracted report_saved done`, dla `chat-error`: `… candidates error report_saved done`; to samo z `--live`; `plural` daje „1 osoba, 2 osoby, 5 osób, 12 osób, 22 osoby”; `npm run build` czyste.

---

## F02 — Uzupełnienie mocka o brakujące endpointy

**Zależy od:** —
**Pliki:** `docs/mocks/replay.py`, `docs/mocks/README.md`, nowe pliki `docs/mocks/*.json` (wymienione niżej)

**Cel:** frontend da się w całości przeklikać bez bazy i bez kluczy API.

**Kontekst:**
- Mock z T09 (zrobiony) obsługuje tylko `POST /api/chat` (4 scenariusze) oraz `GET /api/solutions`, `/api/inbox`, `/api/stats`. Działa na bibliotece standardowej, port 8001, nagłówki CORS dla `:5173`. To zadanie przejmuje pliki T09 (T09 jest `[x]`, nikt ich nie zmienia).
- Kształty JSON muszą być zgodne z typami z „Wspólnych kontraktów” (to te same modele co `api/schemas.py`). `contact_email` i `contact` nigdy nie występują.

**Kroki:**
1. Trasy GET: `/api/taxonomy` (z `data/taxonomy.json`), `/api/gminy` (z `data/gminy-malopolska.json`, tylko `name`, `powiat`, sortowane), `/api/solutions/{id}` (karta z `solutions-list.json` + `body`; brak → 404 w formacie błędu), `/api/reports` (nowy `reports-list.json`, 8–10 pozycji, w tym kilka `matched: false`; filtr `matched` po parametrze), `/api/reports/{id}`, `/api/reports/{id}/similar` (`similar.json`), `/api/reports/{id}/replies`, `/api/search` (`search-debug.json`), `/healthz`.
2. Zapisy trzymane w pamięci procesu (giną po restarcie): `POST /api/reports/{id}/replies` → 201 + status `IN_PROGRESS`; `PATCH /api/reports/{id}` z tabelą przejść (`NEW→TRIAGED`, `TRIAGED→MATCHED|IN_PROGRESS`, `MATCHED→IN_PROGRESS|CLOSED`, `IN_PROGRESS→CLOSED`, inne → 409 `INVALID_TRANSITION`); `POST /api/solutions` → 201 `{"id": …, "status": "PENDING_REVIEW"}`; `PATCH /api/solutions/{id}`; `POST /api/feedback` → 204.
3. `?gmina=Gotham` w treści `POST /api/chat` (pole `gmina` spoza listy) → 422 JSON przed strumieniem, żeby frontend mógł sprawdzić ten przypadek.
4. Obsługa `PATCH` w preflight CORS (`Access-Control-Allow-Methods`).
5. Zaktualizuj tabelę w `docs/mocks/README.md`.

**Gotowe, gdy:** `python docs/mocks/replay.py` + curl na każdą trasę z tabeli zwraca JSON zgodny z typem; `POST …/replies` a potem `GET …/replies` pokazuje odpowiedź; `PATCH` `NEW→CLOSED` → 409; `ruff check docs/mocks` czysto.

---

## F03 — Rozszerzenia design systemu

**Zależy od:** —
**Pliki:** `design-system/components.css`, `design-system/examples/index.html`

**Cel:** brakujące komponenty interfejsu jako klasy `ds-*`, zbudowane wyłącznie z tokenów. Zgodnie z `DESIGN.md` każdy nowy komponent trafia do `components.css` i na stronę przykładów.

**Kontekst:** istniejące klasy to `ds-banner` (+ `__stripes`, `__brand`, `__name`, `__sub`, `__tools`), `ds-header`, `ds-nav`, `ds-nav__item` (`aria-current="page"` → podkreślenie `accent`), `ds-btn` (`--primary`, `--cta`, `--link`, `--small`), `ds-chip` (`aria-pressed`), `ds-tag` (+ 7 kategorii), `ds-card`, `ds-field`, `ds-label`, `ds-input`, `ds-select`, `ds-textarea`, `ds-error`. Tokeny w `tokens.css`. Wysoki kontrast przestawia tokeny. Nowe klasy muszą w nim wyglądać poprawnie (sprawdź ręcznie; tam, gdzie tło `soft-*` staje się czarne, dodaj obramowanie jak w `ds-tag`).

**Kroki — dodaj klasy:**
1. `ds-sr-only` (tekst tylko dla czytników) i `ds-skip-link` (widoczny po fokusie, „Przejdź do treści”).
2. `ds-page` (kontener: `max-width` ok. 72rem, margines boczny `space-4`, sekcje co `space-8` / `space-12` od 900 px), `ds-stack` (pionowy odstęp `space-4`), `ds-cluster` (flex-wrap z `space-2`), `ds-grid` (siatka kart: 1 kolumna na telefonie, `auto-fill` od ok. 18rem).
3. `ds-alert` + `--info`, `--success`, `--warning`, `--danger`: tło `surface-sunken`, lewe obramowanie 4 px w kolorze tonu (`info`, `success`, `warning`, `danger`), slot `ds-alert__icon` (SVG 20 px, kolor tonu) i `ds-alert__title` (pogrubione słowo, np. „Uwaga:”). Uwaga: to obramowanie alertu, nie pasek dekoracyjny — paski marki zostają tylko w banerze.
4. `ds-hint` (tekst pomocniczy pola, `small`, `ink-muted`) i `ds-counter` (licznik znaków).
5. `ds-choices` (grupa radio jako duże pola do kliknięcia, min. 44 px, `fieldset` + `legend` w stylu `ds-label`); zaznaczona opcja ma obramowanie `navy` 2 px i znacznik (nie tylko kolor).
6. `ds-combobox` (pole + lista `ds-combobox__list` z `role="listbox"`, opcja `ds-combobox__option`, aktywna `[aria-selected="true"]` w tle `surface-sunken` z obramowaniem `navy`), cień `shadow-card`.
7. `ds-progress` (kroki etapu wyszukiwania: lista 3–4 kroków, aktywny pogrubiony z ikoną, ukończone z ikoną „ptaszek” + tekst) i `ds-spinner` (obracający się okrąg, z `prefers-reduced-motion: reduce` statyczny).
8. `ds-cite` (odnośnik cytowania w tekście: `[2]` jako mały link w `navy`, min. 24 × 24 px pola trafienia) i `ds-rank` (numer karty widoczny w rogu karty, ten sam numer co cytowanie).
9. `ds-meta` (lista definicji na karcie: etykieta `label` + wartość `small`/`body`, w siatce dwukolumnowej od 600 px).
10. `ds-badge` (licznik przy pozycji nawigacji: tło `navy`, tekst `on-navy`, `radius-pill`; w kontraście automatycznie).
11. `ds-table` (tabela panelu: nagłówki `label`, wiersze z obramowaniem `line`, `overflow-x: auto` na wrapperze `ds-table-wrap`, na wąskim ekranie bez łamania strony).
12. `ds-pagination`, `ds-footer` (tło `surface-muted`, linki `navy`, bez pasków).
13. `ds-bar` (słupek wykresu: wypełnienie `stripe-*` przez modyfikator `--blue`, `--magenta` itd., podpis i wartość w `ink` obok słupka, nigdy na nim).
14. `ds-quote` (cytat zgłoszenia mieszkańca w panelu: tło `surface-muted`, `body-lg`).
15. `examples/index.html`: sekcja dla każdej nowej klasy z realistyczną polską treścią.

**Nie rób:** nie zmieniaj istniejących klas ani `tokens.css`. Brakuje tokenu → wpis w „Uwagach”.

**Gotowe, gdy:** strona przykładów pokazuje wszystkie nowe komponenty w obu motywach; axe DevTools na stronie przykładów nie zgłasza błędów kontrastu; `grep -nE '#[0-9a-fA-F]{3,8}\b' design-system/components.css` nic nie zwraca; przy 320 px strona przykładów nie przewija się poziomo.

---

## F04 — Szkielet aplikacji: baner, nawigacja, kontrast, routing

**Zależy od:** F00, F03
**Pliki:** `web/src/App.tsx`, `web/src/main.tsx` (podmiana na `<App/>`), `web/src/components/layout/AppShell.tsx`, `web/src/components/layout/Banner.tsx`, `web/src/components/layout/MainNav.tsx`, `web/src/components/layout/PanelLayout.tsx`, `web/src/components/layout/ContrastToggle.tsx`, `web/src/components/layout/Footer.tsx`, `web/src/hooks/useDocumentTitle.ts`, `web/src/hooks/useContrast.ts`, `web/src/hooks/useInboxCount.ts` (stub), `web/src/pages/NotFoundPage.tsx`, **stuby** wszystkich stron z tabeli tras (`web/src/pages/*.tsx`, `web/src/pages/panel/*.tsx`)

**Cel:** wspólna rama każdego ekranu i wszystkie trasy, na których pracują kolejne zadania.

**Kontekst:**
- Baner wg `DESIGN.md` i `design-system/examples/index.html`: nazwa „Splot” (`ds-banner__name`), podtytuł „Hub Innowacji Społecznych · ROPS Kraków”, SVG pasków (skopiuj wielokąty z przykładu, `aria-hidden="true"`), po prawej `ContrastToggle` (`ds-btn ds-btn--small`, `aria-pressed`, „Wysoki kontrast”). Paski raz na ekranie, także w panelu.
- Mapa tras i nazwy pozycji nawigacji są w sekcji „Mapa ekranów i tras”. Aktywna pozycja ma `aria-current="page"` (użyj `NavLink`).
- Stuby stron: każdy plik eksportuje nazwany komponent (`export function FindPage()`) z `h1` i jednym zdaniem „Ten ekran jest w przygotowaniu.” Właściciel strony (F08–F19) nadpisuje cały plik. To ten sam wzorzec co stuby routerów w backendzie (T15).

**Kroki:**
1. `AppShell`: `ds-skip-link` do `#main`, `<header class="ds-header">` z `Banner` i `MainNav`, `<main id="main" tabIndex={-1}>` z `<Outlet/>`, `Footer` (link „Panel Hubu” → `/panel`, jedno zdanie o projekcie, informacja „Prototyp HackYeah 2026, dane testowe”).
2. `PanelLayout`: ten sam baner + nawigacja panelu z `ds-badge` przy „Nowe”, gdy `useInboxCount()` zwraca liczbę > 0 (z tekstem dla czytników: „Nowe, 12 nowych zgłoszeń”).
3. Zarządzanie fokusem: po zmianie `location.pathname` (nie przy pierwszym renderze) fokus na `h1` strony. Strony ustawiają `tabIndex={-1}` na `h1` (zapisz to w stubie, żeby właściciele zachowali).
4. `useDocumentTitle`, `useContrast` (przełącza atrybut na `<html>` i zapisuje przez `storage`), `useInboxCount` jako stub `return null`.
5. `App.tsx`: `Routes` z `AppShell` dla tras publicznych i `PanelLayout` dla `/panel/*`; `*` → `NotFoundPage` (h1 „Nie znaleźliśmy tej strony”, link do `/`).
6. Na szerokości < 900 px nawigacja przewija się poziomo (już w `ds-nav`). Sprawdź, czy aktywna pozycja jest widoczna (`scrollIntoView({block: "nearest", inline: "nearest"})` po zmianie trasy).

**Gotowe, gdy:** wszystkie trasy z tabeli renderują stub z właściwym `h1` i tytułem karty; przełącznik kontrastu działa i przeżywa odświeżenie; Tab od początku strony: najpierw „Przejdź do treści”, potem przełącznik, potem nawigacja; po kliknięciu pozycji nawigacji czytnik ekranu czyta nowy `h1`; przy 320 px brak poziomego przewijania strony; axe bez błędów na `/` i `/panel`.

---

## F05 — Komponenty wspólne i hooki danych

**Zależy od:** F01, F03
**Pliki:** `web/src/components/CategoryTag.tsx`, `web/src/components/EvidenceBadge.tsx`, `web/src/components/SolutionCard.tsx`, `web/src/components/Alert.tsx`, `web/src/components/LoadState.tsx`, `web/src/components/EmptyState.tsx`, `web/src/components/Pagination.tsx`, `web/src/components/ReplyList.tsx`, `web/src/hooks/useApi.ts`, `web/src/hooks/useTaxonomy.ts`, `web/src/hooks/useGminy.ts`, `web/src/hooks/usePolling.ts`, `web/src/styles/components.css`

**Cel:** klocki, z których składają się wszystkie ekrany.

**Kontekst:** propsy i zachowanie są w tabeli „Komponenty wspólne” i w sekcji „Hooki wspólne”. `SolutionCard` to **jeden kształt w całym API**. Karta wygląda tak samo w czacie, katalogu i panelu. Różni ją tylko `showRank` (czat) i poziom nagłówka.

**Kroki:**
1. `SolutionCard`: `<article class="ds-card ds-stack" id={id}>`; od góry `CategoryTag`, tytuł (`h2`/`h3`, link do `/rozwiazania/:id`), `organization` · `gmina` (powiat), `summary`, `ds-meta` z „Dla kogo” (`target_group`), „Koszt” (`cost_range`), `EvidenceBadge`; jeśli `media` ma wideo, dopisek „Film o rozwiązaniu” (ikona + słowo); `origin === "USER_SUBMITTED"` → dopisek „Zgłoszone przez użytkownika”. Puste pola pomijasz (bez „brak danych”). `showRank` → `ds-rank` z numerem i `aria-label="Rozwiązanie numer {rank}"`. Nie pokazuj `scores`.
2. `CategoryTag`, `EvidenceBadge`, `Alert` (ikony SVG konturowe 2 px inline: info „i”, sukces „ptaszek”, ostrzeżenie „trójkąt”, błąd „x”), `LoadState`, `EmptyState`, `Pagination`, `ReplyList` wg tabeli kontraktu. `ReplyList`: każda odpowiedź jako `article` z nagłówkiem „Odpowiedź zespołu Hubu”, datą (`formatDateTime`) i dopiskiem `author_label` w formie „podpisano: Anna, ROPS”. Nie stosuj znaczka „zweryfikowano”.
3. `useApi` (anuluje nieaktualne odpowiedzi przy zmianie `deps`), `useTaxonomy` i `useGminy` (wspólna obietnica na poziomie modułu, jedno żądanie na całą aplikację), `usePolling` (`setInterval`, pauza przy `visibilitychange`).
4. `styles/components.css` — tylko układ specyficzny dla tych komponentów, z tokenów.
5. Tymczasowo pokaż komponenty na stubie `/rozwiazania` z danymi z `api.solutions()`. F11 nadpisze tę stronę, więc to tylko kontrola wizualna. Przed `[x]` przywróć stub.

**Gotowe, gdy:** karty z `solutions-list.json` (mock) i z prawdziwego API wyglądają zgodnie z `DESIGN.md`; każda kategoria ma właściwy kolor i nazwę; `OTHER` ma neutralny tag; w wysokim kontraście karty i tagi są czytelne; `useTaxonomy` w dwóch komponentach naraz robi jedno żądanie (zakładka Sieć); `npm run build`/`lint` czyste.

---

## F06 — `GminaCombobox`

**Zależy od:** F01, F03
**Pliki:** `web/src/components/GminaCombobox.tsx`, `web/scripts/check-gmina-filter.ts`

**Cel:** wybór gminy z 182 pozycji z podpowiedziami po wpisaniu liter. Działa z klawiaturą, czytnikiem ekranu i na telefonie.

**Kontekst:**
- Gmina jest **opcjonalna** i pochodzi wyłącznie z listy (`/api/gminy` → `{name, powiat}`). Backend nie wyciąga gminy z tekstu. Nazwa spoza listy daje 422 i nie otwiera strumienia czatu, więc komponent nie może wysłać wolnego tekstu.
- Wzorzec: ARIA 1.2 „combobox with listbox popup” (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-autocomplete="list"`).
- Gminy mają polskie znaki. Wpisanie „nowy sacz” musi znaleźć „Nowy Sącz”, a „mysle” — „Myślenice”.

**Kroki:**
1. Filtrowanie: normalizacja (małe litery, usunięcie diakrytyków przez `normalize("NFD")` + mapa `ł→l`), dopasowanie od początku słowa wyprzedza dopasowanie w środku; maks. 8 podpowiedzi; opcja pokazuje „Nazwa — powiat X”. Funkcję `filterGminy(items, query)` eksportuj osobno.
2. Klawiatura: ↓/↑ po opcjach, Enter wybiera, Esc zamyka (drugie Esc czyści), Tab wybiera aktywną opcję tylko wtedy, gdy lista jest otwarta i opcja aktywna. Mysz i dotyk: kliknięcie opcji.
3. Wartość: `onChange(name)` tylko dla pozycji z listy. Opuszczenie pola z tekstem, który nie pasuje → pole wraca do ostatniej poprawnej wartości, a `ds-hint` mówi „Wybierz gminę z listy”. Przycisk „Wyczyść” (`aria-label`) przy wybranej wartości.
4. Region `aria-live` z liczbą podpowiedzi („5 podpowiedzi”).
5. `scripts/check-gmina-filter.ts` — wczytuje `data/gminy-malopolska.json` i wypisuje wyniki `filterGminy` dla: „nowy sacz”, „mysle”, „krak”, „zabierz”, „łącko”, „xyz”.

**Gotowe, gdy:** skrypt pokazuje poprawne trafienia (dla „xyz” pusto); w przeglądarce wybór samą klawiaturą działa; NVDA lub Orca czyta „Wieliczka, powiat wielicki, 1 z 3”; na telefonie (DevTools 360 px) lista nie wychodzi poza ekran; komponent nie przepuszcza wolnego tekstu.

---

## F07 — Stan czatu: `chatReducer` + `useChat`

**Zależy od:** F01
**Pliki:** `web/src/lib/chatReducer.ts`, `web/src/hooks/useChat.ts`, `web/scripts/check-chat.ts`

**Cel:** cała logika czatu w jednej czystej funkcji, niezależnej od widoku.

**Kontekst:** typy i reguły są w sekcji „Stan czatu”. Kolejność zdarzeń i ich znaczenie:

| event | Co robi stan |
|---|---|
| `status` | `stage = data` |
| `candidates` | `candidates = data` (karty rysujemy od razu, przed tekstem) |
| `token` | `answer += data.text` |
| `answer_retracted` | `answer = ""`, `answerRetracted = true` (karty zostają) |
| `no_match` | `noMatch = data` (`solutions`/`also_see` puste, `context` może być pełny) |
| `report_saved` | `saved = data` |
| `error` | `error = data` (bez czyszczenia kart) |
| `done` | `phase = "done"`, `searchEventId = data.search_event_id` |

- `done` przychodzi zawsze, więc wskaźnik ładowania zamyka się tylko na `done`. Nie używaj timeoutów.
- Pytanie doprecyzowujące: backend nie ma historii rozmowy. `followUp(text)` wysyła nowe `/api/chat` z pełnym tekstem `poprzednia wiadomość + "\n\n" + text`, z tym samym `session_id`, `gmina`, `reporter_type`. Licznik podobnych liczy sesje, więc skala nie rośnie.
- Przerwanie (`abort`) nie anuluje zapisu zgłoszenia po stronie backendu. W UI stan wraca do `idle`.

**Kroki:**
1. `chatReducer` wg tabeli i kontraktu, bez efektów ubocznych.
2. `useChat`: `useReducer`, `AbortController` na żądanie (nowe `send` przerywa poprzednie), `streamChat` z `getSessionId()`; po zdarzeniu `report_saved` → `storage.addMyReport({report_id, created_at: new Date().toISOString(), excerpt, gmina})`; `ApiError` przed strumieniem → `request_error`.
3. `scripts/check-chat.ts`: dla każdego `docs/mocks/chat-*.sse` składa stan przez `parseFrames` + `chatReducer` i wypisuje podsumowanie (`phase`, liczba kart, długość `answer`, `answerRetracted`, `noMatch?`, `saved?`, `error?`).

**Gotowe, gdy:** skrypt pokazuje: `match` → 3 karty, `answer` niepusty, `saved.similar_count = 9`; `no-match` → 0 kart, `noMatch` ustawione, `context` niepusty; `retracted` → `answer = ""`, `answerRetracted = true`, karty są; `error` → karty są, `error.code = "LLM_UNAVAILABLE"`, `saved` ustawione, `phase = "done"`.

---

## F08 — Ekran „Znajdź rozwiązanie”: formularz i spięcie strony

**Zależy od:** F04, F06, F07, F09
**Pliki:** `web/src/pages/FindPage.tsx`, `web/src/components/chat/ChatForm.tsx`, `web/src/components/chat/ReporterTypeField.tsx`, `web/src/styles/chat.css`

**Cel:** najważniejszy ekran serwisu. Mieszkaniec opisuje problem po swojemu i dostaje propozycje.

**Kontekst:**
- Wymogi ze specyfikacji (sekcja 8 i 12): ostrzeżenie **„Nie wpisuj imion, adresów ani danych o zdrowiu konkretnych osób.”** jest stale widoczne przy polu (nie w regulaminie, nie w dymku); gmina z listy (opcjonalna); jeden prosty wybór „Zgłaszam jako”: mieszkaniec / organizacja / samorząd (opcjonalny, domyślnie `OTHER`); `session_id` z `storage`.
- Jeden `h1` („Opisz problem”), jedno główne działanie: `ds-btn--cta` „Znajdź rozwiązania”. To jedyny przycisk CTA na tym ekranie, także po pokazaniu wyników.
- Wyniki rysuje `ChatResults` z F09 (`<ChatResults state={state} onFollowUp={followUp} />`).

**Kroki:**
1. `FindPage`: `h1`, jedno zdanie pomocy („Napisz własnymi słowami, co się dzieje. Pokażemy sprawdzone rozwiązania z Małopolski.”), `ChatForm`, pod nim `ChatResults`. `useDocumentTitle("Znajdź rozwiązanie")`.
2. `ChatForm`:
   - `ds-textarea` (`body-lg`, 4 wiersze, `maxLength = MESSAGE_MAX_CHARS`), etykieta „Co się dzieje w Twojej okolicy?”, `ds-counter` („120 z 2000 znaków”, ogłaszany dopiero przy 90%), pod polem `Alert warning` z `PRIVACY_WARNING` powiązany `aria-describedby`.
   - Chipy `EXAMPLE_PROMPTS` (`ds-chip`): kliknięcie wstawia tekst do pola i przenosi na nie fokus, nie wysyła.
   - `GminaCombobox` („Gmina, której dotyczy problem (opcjonalnie)”), `ReporterTypeField` (`ds-choices`, legenda „Zgłaszam jako (opcjonalnie)”, 3 opcje + „Nie chcę podawać” zaznaczone domyślnie).
   - `<details>` „Jak pilna jest sprawa? (opcjonalnie)” z wyborem 1–5 opisanym słowami (1 „Może poczekać” … 5 „Bardzo pilne”) → `severity_self`.
   - Walidacja: pusty lub same spacje → błąd pola „Opisz problem w kilku słowach.” i fokus na polu. 422 z backendu → komunikat przy właściwym polu (prefiks `gmina:` → pod gminą, inaczej pod polem tekstu).
   - Podczas `streaming` przycisk zmienia etykietę na „Szukam…” i ma `aria-disabled`, a obok jest `ds-btn--link` „Przerwij” (`abort`). Wysłanie ponownie po wynikach zaczyna nowe wyszukiwanie.
   - `Ctrl+Enter` w polu wysyła. Enter dodaje nową linię.
3. Po `submit` fokus przechodzi na nagłówek sekcji wyników (z F09), żeby czytnik i lupa poszli za treścią.
4. W trybie DEV pod formularzem jest mały przełącznik scenariusza mocka (`match | no-match | retracted | error`), który ustawia `?scenario=`. W buildzie produkcyjnym go nie ma.

**Gotowe, gdy:** na mocku każdy z 4 scenariuszy daje poprawny widok (F09); na prawdziwym API zapytanie z `CLAUDE.md` („U nas w gminie starsi ludzie…”) pokazuje karty przed tekstem, streszczenie z klikalnymi `[n]` i licznik skali; gmina „Gotham” jest niemożliwa do wpisania (combobox), a sztucznie wysłana daje błąd przy polu gminy; ekran przechodzi listę kontrolną dostępności; na 360 px formularz i wyniki mieszczą się bez poziomego przewijania; na ekranie jest dokładnie jeden `ds-btn--cta`.

---

## F09 — Widok wyników czatu

**Zależy od:** F05, F07
**Pliki:** `web/src/components/chat/ChatResults.tsx`, `web/src/components/chat/StageProgress.tsx`, `web/src/components/chat/AnswerSummary.tsx`, `web/src/components/chat/ScaleNotice.tsx`, `web/src/components/chat/NoMatchNotice.tsx`, `web/src/components/chat/KnowledgeList.tsx`, `web/src/components/chat/FollowUp.tsx`, `web/src/components/chat/FeedbackPrompt.tsx`, `web/src/styles/chat-results.css`

**Cel:** pokazać wynik dopasowania tak, żeby był zrozumiały, wiarygodny i dostępny: najpierw karty, potem streszczenie z cytowaniami, skala problemu i numer zgłoszenia.

**Kontekst (gwarancje backendu, sekcja 8 specyfikacji):**
- `candidates` przychodzi przed pierwszym tokenem. Karty rysujesz od razu, bez czekania na tekst.
- `[n]` w streszczeniu = pozycja karty w `solutions` (`rank`, od 1). Backend wycina zmyślone `[n]`, więc frontend tylko zamienia je na odnośniki.
- `answer_retracted` → usuń streszczenie, zostaw karty i ogłoś krótko przez `aria-live` („Podsumowanie zostało wycofane. Poniżej zostają znalezione rozwiązania.”).
- `no_match` to normalna odpowiedź („nie wiem”), nie błąd. Pokaż `message_pl` i `context`, jeśli jest.
- `also_see` pokazujesz pod kartami głównymi jako „Zobacz też”, bez własnego sortowania; `rank` kontynuuje numerację.
- `context` (`kind = KNOWLEDGE`) to wiedza o problemie, **nie rozwiązanie**: osobna sekcja „Co wiemy o tym problemie”, bez numerów i bez cytowań.
- `report_saved` → `scaleMessage(saved)` + numer zgłoszenia. Brak `report_saved` przed `done` = zapis nieudany: nie pokazuj licznika ani numeru.
- `error` może przyjść po kartach (np. `LLM_UNAVAILABLE`): karty zostają, nad nimi `Alert danger` z `message_pl`.
- Bez `LLM_ENABLED` nie ma tokenów: karty są pełną odpowiedzią.

**Kroki:**
1. `ChatResults` (props `{ state: ChatState; onFollowUp(text: string): void }`): sekcja `aria-labelledby` z `h2` „Wyniki” (`tabIndex={-1}`, cel fokusu z F08); kolejność: `StageProgress` (tylko w `streaming`) → `Alert` błędu → `NoMatchNotice` albo `AnswerSummary` → karty główne (`SolutionCard showRank`, `id="rozwiazanie-{rank}"`, w `ds-grid`) → „Zobacz też” → `KnowledgeList` → `ScaleNotice` → `FollowUp` → `FeedbackPrompt`. Gdy `requestError` → tylko `Alert danger` (F08 pokazuje błąd przy polu, tu ogólny komunikat dla sieci).
2. `StageProgress`: `ds-progress` z 4 krokami (`label_pl` z kolejnych `status`), `ds-spinner` przy aktywnym. Ogłaszany przez region `aria-live="polite"`, ale tylko etykieta etapu, bez powtórzeń.
3. `AnswerSummary`: nagłówek „Podsumowanie”, dopisek „Przygotowane automatycznie na podstawie znalezionych rozwiązań.”; tekst w kontenerze `aria-live="polite"` z `aria-busy="true"` do `done` (czytnik przeczyta całość raz, a nie co token). Parsowanie: `/\[(\d+)\]/g` → `<a class="ds-cite" href="#rozwiazanie-n" aria-label="źródło {n}: {tytuł karty}">[n]</a>`; niedomknięte `[1` na końcu strumienia zostaje tekstem do następnego tokenu. Kliknięcie przewija do karty i przenosi na nią fokus. Akapity po `\n\n`. Bez `dangerouslySetInnerHTML`.
4. `ScaleNotice`: `Alert info` z ikoną osób: `scaleMessage(saved)`, w drugiej linii „Twoje zgłoszenie ma numer {report_id}. Odpowiedź zespołu Hubu znajdziesz w zakładce Moje zgłoszenia.” (link). To najmocniejszy element demo, więc musi być dobrze widoczny, ale bez `accent`.
5. `NoMatchNotice`: `Alert info` (nie `danger`) z `message_pl`, pod nim zachęta „Dopisz więcej szczegółów: kogo dotyczy problem, gdzie, od kiedy.” i `FollowUp`.
6. `FollowUp`: pokazuj, gdy (a) `phase = "done"`, streszczenie nie jest wycofane i po `trim()` kończy się „?”, albo (b) `noMatch`, albo (c) brak tokenów i < 2 kart. Pole „Twoja odpowiedź” + `ds-btn--primary` „Doprecyzuj”. Wywołuje `onFollowUp(text)`.
7. `FeedbackPrompt`: gdy `phase = "done"` i `searchEventId !== null`: „Czy te propozycje Ci pomogły?” Tak / Nie (`ds-btn`) → `api.feedback({search_event_id, helpful})` → „Dziękujemy za odpowiedź.” (`aria-live`). Błąd feedbacku pokazuj cicho („Nie udało się zapisać odpowiedzi.”), bez blokowania ekranu.

**Gotowe, gdy:** w czterech scenariuszach mocka widok jest zgodny z „Kontekstem” (sprawdź też, że karty pojawiają się, zanim popłynie tekst przy `--delay 0.3`); kliknięcie `[2]` przenosi fokus na kartę nr 2; w `retracted` tekst znika, karty zostają, a czytnik ogłasza wycofanie; w `error` karty i `report_saved` są widoczne; w `no-match` nie ma czerwonego komunikatu; `context` nie ma numerów; NVDA/Orca nie czyta tekstu token po tokenie.

---

## F10 — Strona rozwiązania

**Zależy od:** F04, F05
**Pliki:** `web/src/pages/SolutionPage.tsx`, `web/src/components/solution/ImplementationSteps.tsx`, `web/src/components/solution/MediaList.tsx`, `web/src/styles/solution.css`

**Cel:** pełny opis innowacji dla JST i mieszkańca: „czy to pasuje do nas i jak to wdrożyć”.

**Kontekst:** `GET /api/solutions/{id}` → `SolutionDetail` (karta + `body`), dowolny status; brak → 404 `{"error": {...}}`. Nie ma pola `contact` ani statusu. `media`: `[{type: "video"|"…", url, title}]`. `kind = "KNOWLEDGE"` też może tu trafić (z sekcji „Co wiemy” i z `/wiedza`). Wtedy nie ma kroków ani kosztu, a nagłówek kontekstowy brzmi „Wiedza o problemie”, nie „Rozwiązanie”.

**Kroki:**
1. Okruszki: „Biblioteka innowacji › {tytuł}” (albo „Wiedza › …”). `h1` = tytuł, pod nim `CategoryTag`, organizacja, gmina i powiat, `EvidenceBadge`.
2. Sekcje (`h2`, pomijane, gdy puste): „W skrócie” (`summary`, `body-lg`), „Opis” (`body`: akapity po `\n\n`, czysty tekst), „Dla kogo”, „Koszt”, „Jak to wdrożyć” (`ImplementationSteps`: lista numerowana `ol`), „Materiały” (`MediaList`: wideo z YouTube/Vimeo jako link z ikoną i tytułem, otwierany w tej samej karcie — bez osadzania iframe w PoC), „Źródło” (`source_name` + link `source_url` z `rel="noopener"` i dopiskiem „otwiera stronę zewnętrzną”).
3. Tagi (`tags`) jako zwykła lista tekstowa, nie chipy (chipy oznaczają filtr).
4. Na dole `ds-btn--link` „Wróć do wyników” (historia, gdy jest) i `ds-btn` „Szukaj podobnych rozwiązań” → `/rozwiazania?category={kod}`.
5. 404 → `EmptyState` „Nie znaleźliśmy tego rozwiązania” + link do Biblioteki. Błąd sieci → `LoadState`.

**Gotowe, gdy:** strona dla kilku rozwiązań z seedu (z krokami, z wideo, bez kosztu) i dla wpisu KNOWLEDGE wygląda poprawnie; nieistniejące id pokazuje komunikat, nie biały ekran; kolejność nagłówków `h1 → h2` bez przeskoków; lista kontrolna dostępności OK.

---

## F11 — Biblioteka innowacji i Wiedza

**Zależy od:** F04, F05, F06
**Pliki:** `web/src/pages/LibraryPage.tsx`, `web/src/pages/KnowledgePage.tsx`, `web/src/components/catalog/CatalogFilters.tsx`, `web/src/components/catalog/CatalogResults.tsx`, `web/src/styles/catalog.css`

**Cel:** katalog sprawdzonych rozwiązań, z którego JST „czerpią jak z katalogu” (`base.md`), oraz zasobnik wiedzy o wyzwaniach regionu.

**Kontekst:** `GET /api/solutions` → `Page<SolutionCard>` (`scores: null`, `rank = offset + i + 1`). Parametry: `kind` (domyślnie SOLUTION), `category`, `gmina`, `powiat`, `tag`, `evidence_min`, `q` (podobieństwo tytułu, trigram), `sort=recent|evidence`, `limit` (20, maks. 100), `offset`. Wiedza: ten sam endpoint z `kind=KNOWLEDGE`. Status domyślnie PUBLISHED. Strony publiczne nie wysyłają `status`.

**Kroki:**
1. `CatalogFilters`: pole „Szukaj w tytułach” (`ds-input`, `type="search"`, wysyłane po 300 ms bezczynności albo Enter), chipy kategorii z `useTaxonomy` (`ds-chip aria-pressed`, jeden naraz; „Wszystkie”), `GminaCombobox`, `ds-select` „Poziom sprawdzenia: dowolny / co najmniej wdrożone w jednej gminie (3) / …”, `ds-select` „Kolejność: najnowsze / najlepiej sprawdzone”. Wszystko w parametrach URL. Przycisk „Wyczyść filtry”.
2. `CatalogResults`: „Znaleziono {total} {rozwiązanie|rozwiązania|rozwiązań}” w `aria-live`, siatka `SolutionCard` (`h2`), `Pagination` (zmiana strony przewija na górę listy i przenosi fokus na licznik wyników). Pusto → `EmptyState` „Nic nie pasuje do wybranych filtrów.” + przycisk „Wyczyść filtry”.
3. `LibraryPage`: `h1` „Biblioteka innowacji społecznych”, jedno zdanie o źródle (Biblioteka Innowacji Społecznych ROPS Kraków), filtry + wyniki.
4. `KnowledgePage`: `h1` „Wiedza o wyzwaniach Małopolski”; u góry lista wyzwań z `useTaxonomy` (bez `OTHER`) jako karty z `label_pl` + `description` + link „Pokaż wiedzę” (ustawia filtr kategorii); pod spodem wyniki `kind=KNOWLEDGE` (bez filtrów gminy i poziomu sprawdzenia). Na końcu link do czatu: „Masz konkretny problem? Opisz go, a znajdziemy rozwiązania.”
5. Filtry na telefonie zwinięte w `<details>` „Filtry ({liczba aktywnych})”.

**Gotowe, gdy:** każdy filtr zmienia URL i wyniki (porównaj z `curl` na to samo zapytanie); „Wstecz” przywraca poprzedni stan filtrów; `q=telefon` znajduje „Telefon Życzliwości”; `/wiedza` pokazuje tylko wpisy KNOWLEDGE; paginacja działa na korpusie ze scrapera (115+ rekordów); lista kontrolna dostępności OK.

---

## F12 — „Moje zgłoszenia” i odpowiedzi zespołu Hubu

**Zależy od:** F04, F05
**Pliki:** `web/src/pages/MyReportsPage.tsx`, `web/src/styles/my-reports.css`

**Cel:** zamknąć ścieżkę „odpowiedź do autora” (kryterium jury). Autor wraca i widzi, co odpisał Hub.

**Kontekst:**
- Bez autoryzacji autor czyta odpowiedzi po samym `report_id` (`GET /api/reports/{id}/replies` → `Reply[]` rosnąco po dacie). Odpytujemy przy wejściu na stronę, bez websocketów.
- Lista zgłoszeń autora to `storage.listMyReports()`, uzupełniana przez `useChat` po `report_saved`. Zawiera tylko skrót (80 znaków) i gminę. Pełnej treści nie przechowujemy.
- Nie pokazujemy na tej stronie treści zgłoszenia z serwera (`GET /api/reports/{id}` jest dla panelu).

**Kroki:**
1. `h1` „Moje zgłoszenia”, zdanie: „Tu zobaczysz odpowiedzi zespołu Hubu na Twoje zgłoszenia z tego urządzenia.”
2. Dla każdego wpisu: karta z numerem, datą, skrótem („…”), gminą, a pod nią `ReplyList` (równoległe żądania, każde z własnym `LoadState`). Brak odpowiedzi → „Zespół Hubu jeszcze nie odpowiedział. Zajrzyj tu za kilka dni.” Liczba odpowiedzi w nagłówku karty („2 odpowiedzi”).
3. Formularz „Masz numer zgłoszenia z innego urządzenia?”: pole liczbowe + `ds-btn--primary` „Sprawdź odpowiedzi” → dodaje wpis bez skrótu (ze skrótem „Zgłoszenie nr {id}”). 404 → błąd pola.
4. „Usuń z listy” przy każdym wpisie (tylko z pamięci przeglądarki; komunikat to mówi) z potwierdzeniem w miejscu (bez `window.confirm`).
5. Pusta lista → `EmptyState` + link do `/`. Pamięć niedostępna → `Alert info` „Twoja przeglądarka nie pozwala zapamiętać zgłoszeń. Zapisz numer zgłoszenia.”

**Gotowe, gdy:** po zgłoszeniu w czacie (prawdziwe API) wpis pojawia się tutaj; po dodaniu odpowiedzi w panelu (F16 albo `curl -X POST …/replies`) i odświeżeniu odpowiedź jest widoczna z `author_label` jako dopiskiem; ręczne dodanie numeru działa; nieistniejący numer daje błąd pola; lista kontrolna dostępności OK.

---

## F13 — „Mam pomysł”: zgłoszenie rozwiązania

**Zależy od:** F04, F05, F06
**Pliki:** `web/src/pages/IdeaPage.tsx`, `web/src/components/idea/IdeaForm.tsx`, `web/src/components/idea/ListEditor.tsx`, `web/src/styles/idea.css`

**Cel:** fiszka pomysłu z Kreatora pomysłów (`base.md` III): mieszkaniec, NGO lub JST pokazuje dobrą praktykę. Trafia ona do kolejki Hubu, nie od razu do wyszukiwarki.

**Kontekst:** `POST /api/solutions` z `SolutionSubmit` → 201 `{"id", "status": "PENDING_REVIEW"}`. Backend wymusza `kind=SOLUTION`, `origin=USER_SUBMITTED`, `evidence_level=1`. Model ma `extra="forbid"`, więc **nie wysyłaj pól spoza typu**. Kategoria spoza taksonomii → 422, gmina spoza listy → 422. Błąd embeddingu → 503 `EMBEDDING_UNAVAILABLE` (nic nie zapisano). Limity: `title` 3–200, `summary` 10–2000, `body` ≤ 20000, `tags` ≤ 20, `implementation_steps` ≤ 30, `media` ≤ 10.

**Kroki:**
1. `h1` „Podziel się pomysłem”, jedno zdanie: „Opisz rozwiązanie, które działa albo które chcesz sprawdzić. Zespół Hubu je przejrzy, zanim pojawi się w bibliotece.”
2. `IdeaForm` w trzech grupach (`fieldset` + `legend`), jedna strona, bez kroków:
   - „Na czym polega pomysł”: nazwa (`title`), „Opisz w 2–3 zdaniach” (`summary`, licznik), „Więcej szczegółów (opcjonalnie)” (`body`).
   - „Dla kogo i gdzie”: wyzwanie (`ds-select` z `useTaxonomy`, bez `OTHER`, opcjonalne), „Dla kogo” (`target_group`), `GminaCombobox`, organizacja.
   - „Jak to zrobić (opcjonalnie)”: `ListEditor` kroków („Dodaj krok”, „Usuń krok {n}”, fokus na nowe pole), szacowany koszt (`cost_range`, wolny tekst z podpowiedzią „np. do 10 tys. zł”), link do strony lub filmu (`source_url`, `type="url"`), słowa kluczowe (`tags`, rozdzielane przecinkiem).
   - „Podpis (opcjonalnie)” (`submitted_by_name`) z `ds-hint`: „Imię lub nazwa organizacji.” Bez e-maila i telefonu.
   - `PRIVACY_WARNING` nad przyciskiem.
3. Jedno `ds-btn--cta` „Wyślij pomysł do Hubu”. Walidacja po stronie klienta zgodna z limitami (te same komunikaty po polsku), potem 422 z backendu mapowane na pola po prefiksie komunikatu.
4. Sukces: formularz zastępuje `Alert success` „Wysłano. Pomysł nr {id} czeka na przejrzenie przez zespół Hubu.” + link „Zgłoś kolejny pomysł” (czyści formularz) i fokus na komunikacie. 503 → `Alert danger` „Nie udało się teraz zapisać pomysłu. Spróbuj ponownie za chwilę.”, a dane w formularzu zostają.
5. Szkic zapisywany w `sessionStorage` (`splot_idea_draft`, w `try/catch`) i czyszczony po wysłaniu, żeby odświeżenie nie kasowało pracy.

**Gotowe, gdy:** wysłany pomysł jest w bazie jako `PENDING_REVIEW` (`curl '…/api/solutions?status=PENDING_REVIEW'`) i nie ma go w `/rozwiazania`; w żądaniu nie ma pól spoza `SolutionSubmit` (zakładka Sieć); błędy walidacji wskazują pole i przenoszą na nie fokus; po odświeżeniu w połowie wypełniania dane wracają; jeden `ds-btn--cta`; lista kontrolna dostępności OK.

---

## F14 — Panel: skrzynka „Nowe” i licznik w nawigacji

**Zależy od:** F04, F05
**Pliki:** `web/src/pages/panel/InboxPage.tsx`, `web/src/hooks/useInboxCount.ts` (zastąpienie stuba), `web/src/styles/panel.css`

**Cel:** pierwszy ekran pracownika Hubu: co nowego wpłynęło. Zamiast webhooka (ADR-018) powiadomienie widać w panelu.

**Kontekst:** `GET /api/inbox` → `Inbox` (`new_reports` = status NEW, `new_unmatched` = NEW i bez dopasowania, `pending_solutions`, `latest_reports` = 10 najnowszych NEW, `latest_pending` = 10 najnowszych PENDING_REVIEW). Panel odpytuje co 30 s. Pozycja znika, gdy zmieni się status zgłoszenia albo rozwiązanie zostanie zatwierdzone lub odrzucone. Nie ma stanu „przeczytane”. Zgłoszenia `matched = false` to „najcenniejsze dane w systemie” (luka w korpusie albo nieobsłużone wyzwanie), więc mają być na pierwszym planie.

**Kroki:**
1. `useInboxCount`: `usePolling(() => api.inbox(), 30_000)` z wynikiem współdzielonym przez moduł (strona i nawigacja nie odpytują podwójnie); zwraca `new_reports + pending_solutions` albo `null` przy błędzie. Stała 30 s w `labels.ts` nie istnieje, więc zdefiniuj `INBOX_POLL_MS` w tym pliku.
2. `InboxPage`: `h1` „Nowe”, trzy kafle liczb (`ds-card`, liczba w stylu `h2`, opis słowny) — „Nowe zgłoszenia”, „W tym bez dopasowania” (link do `/panel/zgloszenia?matched=false&status=NEW`), „Pomysły do zatwierdzenia” (link do `/panel/rozwiazania`). Kafel „bez dopasowania” ma `Alert warning`, gdy > 0.
3. „Najnowsze zgłoszenia”: lista `latest_reports`; każde jako `ds-quote` z treścią (skrót 200 znaków), kategorią (`CategoryTag`), gminą, typem zgłaszającego, czasem (`formatRelative`) oraz statusem dopasowania (ikona + „Bez dopasowania” / „Dopasowano”). Link „Otwórz zgłoszenie”.
4. „Pomysły czekające na przejrzenie”: `latest_pending` jako kompaktowe karty z linkiem do `/panel/rozwiazania/:id`.
5. Informacja „Odświeżono {formatRelative}” + `ds-btn--link` „Odśwież teraz”. Nowe pozycje po odświeżeniu ogłaszane w `aria-live` („2 nowe zgłoszenia”), bez przesuwania fokusu.

**Gotowe, gdy:** liczby zgadzają się z `curl /api/inbox`; po zgłoszeniu w czacie (inna karta) licznik w nawigacji rośnie najpóźniej po 30 s bez odświeżania; po `PATCH` statusu zgłoszenie znika ze skrzynki; ukryta karta przeglądarki nie odpytuje; lista kontrolna dostępności OK.

---

## F15 — Panel: lista zgłoszeń

**Zależy od:** F04, F05, F06
**Pliki:** `web/src/pages/panel/ReportsPage.tsx`, `web/src/components/panel/ReportFilters.tsx`, `web/src/components/panel/ReportsTable.tsx`

**Cel:** przegląd wszystkich zgłoszeń z naciskiem na te bez dopasowania.

**Kontekst:** `GET /api/reports` → `Page<ReportListItem>`, sortowanie `created_at DESC`. Filtry: `matched` (true/false), `status`, `category`, `gmina`, `reporter_type`, `limit` (50, maks. 200), `offset`. `contact_email` nigdy nie przychodzi. `reply_count` = liczba odpowiedzi.

**Kroki:**
1. `h1` „Zgłoszenia”. Zakładki-filtry jako chipy (`ds-chip aria-pressed`): „Bez dopasowania” (domyślnie, `matched=false`), „Wszystkie”, „Z dopasowaniem”. Do tego `ds-select` statusu (`REPORT_STATUS_LABELS`), kategorii (`useTaxonomy`), typu zgłaszającego (`REPORTER_TYPE_LABELS`) i `GminaCombobox`. Stan w URL.
2. `ReportsTable` (`ds-table` w `ds-table-wrap`, `<caption>` z opisem filtra): kolumny „Zgłoszenie” (skrót 140 znaków jako link do szczegółów), „Wyzwanie” (`CategoryTag`), „Gmina”, „Zgłaszający”, „Dopasowanie” (ikona + słowo), „Status”, „Odpowiedzi”, „Data”. Na < 700 px tabela przechodzi w listę kart (ten sam komponent, inny układ CSS), żeby nie przewijać w poziomie.
3. `Pagination`; licznik „{total} zgłoszeń” w `aria-live`.
4. Pusto przy „Bez dopasowania” → `EmptyState` „Wszystkie zgłoszenia mają dopasowane rozwiązania.”

**Gotowe, gdy:** domyślny widok pokazuje tylko `matched = false` (porównaj z `curl '/api/reports?matched=false'`); każdy filtr zmienia URL i wynik; link prowadzi do `/panel/zgloszenia/:id`; tabela jest czytelna na 360 px; lista kontrolna dostępności OK (nagłówki tabeli `th scope="col"`).

---

## F16 — Panel: szczegóły zgłoszenia, status, podobne, odpowiedź do autora

**Zależy od:** F04, F05
**Pliki:** `web/src/pages/panel/ReportPage.tsx`, `web/src/components/panel/StatusControl.tsx`, `web/src/components/panel/SimilarReports.tsx`, `web/src/components/panel/ReplyForm.tsx`

**Cel:** pracownik Hubu rozumie zgłoszenie i jego skalę, zmienia status i odpisuje autorowi.

**Kontekst:**
- `GET /api/reports/{id}` → `ReportDetail` (dodatkowo `normalized_text`, `target_group`, `extracted`). 404 → komunikat.
- `GET /api/reports/{id}/similar` → do 20 zgłoszeń powyżej progu podobieństwa (`similarity` 0–1). To zastępuje widok klastra i pokazuje skalę problemu.
- `PATCH /api/reports/{id}` `{status}`. Przejścia są w `REPORT_TRANSITIONS`; inne → 409 `INVALID_TRANSITION`; ten sam status → 200 bez zmian.
- `POST /api/reports/{id}/replies` `{body (1–4000), author_label?}` → 201; zgłoszenie w NEW, TRIAGED albo MATCHED przechodzi automatycznie na IN_PROGRESS. `GET …/replies` rosnąco.
- `author_label` jest niezweryfikowany. Interfejs nie może go przedstawiać jako potwierdzonej tożsamości.
- `top_solution_id` → najlepsze rozwiązanie z wyszukiwania (`GET /api/solutions/{id}`).

**Kroki:**
1. Okruszki „Zgłoszenia › Zgłoszenie nr {id}”, `h1` „Zgłoszenie nr {id}”. Treść w `ds-quote` (`raw_text`, pełna). Obok `ds-meta`: wyzwanie, gmina i powiat, zgłaszający, pilność (słownie), dla kogo, data, dopasowanie (ikona + słowo + „wynik {top_rerank_score}” dla pracownika).
2. „Najlepsze dopasowanie”: `SolutionCard` dla `top_solution_id` albo `Alert warning` „Brak dopasowanego rozwiązania. To może być luka w bibliotece.” z linkiem do `/panel/wyszukiwanie?q=…`. **Uwaga:** treść zgłoszenia w URL łamie regułę „bez treści w URL”. Zamiast tego przekaż ją przez `location.state`.
3. `StatusControl`: obecny status słownie + przyciski tylko dla dozwolonych przejść (`ds-btn`, etykiety „Oznacz jako przejrzane”, „Oznacz jako dopasowane”, „Rozpocznij działania”, „Zamknij zgłoszenie”). Po sukcesie komunikat w `aria-live`; 409 → `Alert danger` z komunikatem backendu i odświeżenie danych.
4. `SimilarReports`: `h2` „Podobne zgłoszenia ({n})”, lista: skrót, gmina, data, dopasowanie, „podobieństwo {procent}%”, link. Pusto → „Nie ma podobnych zgłoszeń”. Podsumowanie skali u góry: „{n} podobnych zgłoszeń z {m} gmin” (policz unikalne gminy).
5. `ReplyList` (z F05) + `ReplyForm`: `ds-textarea` „Odpowiedź do autora” (licznik do 4000), `ds-input` „Podpis (opcjonalnie)” z podpowiedzią „np. Anna, ROPS. Autor zobaczy go jako dopisek.”, `ds-btn--primary` „Wyślij odpowiedź”. Po sukcesie: odpowiedź dopisana do listy, status odświeżony (IN_PROGRESS), pole wyczyszczone, komunikat „Wysłano. Autor zobaczy odpowiedź w zakładce Moje zgłoszenia.”
6. Pod treścią `<details>` „Dane techniczne” z `normalized_text` i `extracted` (JSON w `<pre>`) dla zespołu.

**Gotowe, gdy:** na prawdziwym API: zgłoszenie z sesji `s2` pokazuje w podobnych zgłoszenie z `s1`; przejście NEW → TRIAGED działa, przycisk „Zamknij” nie jest dostępny z NEW; wysłanie odpowiedzi zmienia status na „W toku” i odpowiedź widać w F12 po stronie autora; 4001 znaków blokuje formularz z komunikatem; w kodzie strony nie ma `raw_text` w żadnym URL; lista kontrolna dostępności OK.

---

## F17 — Panel: zatwierdzanie rozwiązań

**Zależy od:** F04, F05
**Pliki:** `web/src/pages/panel/SolutionsQueuePage.tsx`, `web/src/pages/panel/SolutionReviewPage.tsx`, `web/src/components/panel/ReviewActions.tsx`

**Cel:** pomysły z „Mam pomysł” trafiają do biblioteki dopiero po przejrzeniu (ochrona przed zatruciem wyników).

**Kontekst:** `GET /api/solutions?status=PENDING_REVIEW` (kolejka; także `PUBLISHED`, `REJECTED`, `ARCHIVED`). `GET /api/solutions/{id}` → `SolutionDetail` (dowolny status). `PATCH /api/solutions/{id}` `{status?: PUBLISHED|REJECTED|ARCHIVED, evidence_level?: 1–5, category?: kod}` → `SolutionDetail`; działa od razu (po zatwierdzeniu rozwiązanie jest w wyszukiwaniu). `SolutionCard`/`SolutionDetail` nie mają pól `status` ani `submitted_by_name`, więc frontend ich nie pokazuje i nie odtwarza (status widać tylko jako aktywny filtr listy).

**Kroki:**
1. `SolutionsQueuePage`: `h1` „Do zatwierdzenia”, chipy statusu („Czekają” = PENDING_REVIEW domyślnie, „Opublikowane”, „Odrzucone”, „Zarchiwizowane”), lista `SolutionCard` z linkiem „Przejrzyj” do `/panel/rozwiazania/:id`. `Pagination`.
2. `SolutionReviewPage`: pełna treść jak w F10 (możesz zaimportować `ImplementationSteps` i `MediaList` z F10, jeśli istnieją; jeśli nie — prosty widok i wpis w „Uwagach”), a z boku `ReviewActions`:
   - `ds-select` kategorii (z `useTaxonomy`) i poziomu sprawdzenia (`EVIDENCE_LABELS`), przycisk „Zapisz zmiany” (`PATCH` z `category`, `evidence_level`).
   - Zawsze te same trzy działania (API nie zwraca obecnego statusu): `ds-btn--primary` „Opublikuj w bibliotece”, `ds-btn` „Odrzuć” (potwierdzenie w miejscu: „Na pewno odrzucić? Pomysł nie trafi do biblioteki.”) i `ds-btn` „Przenieś do archiwum”.
   - Po sukcesie `Alert success` („Opublikowano. Rozwiązanie jest już widoczne w wyszukiwaniu.”) i powrót do kolejki linkiem.

**Gotowe, gdy:** pomysł z F13 widać w kolejce; po „Opublikuj” znika z kolejki, jest w `/rozwiazania` i w wynikach czatu dla zapytania o jego temat; zmiana kategorii i poziomu sprawdzenia jest widoczna na karcie; skrzynka F14 zmniejsza `pending_solutions`; lista kontrolna dostępności OK.

---

## F18 — Panel: trendy

**Zależy od:** F04, F05, F06
**Pliki:** `web/src/pages/panel/TrendsPage.tsx`, `web/src/components/panel/BarList.tsx`, `web/src/components/panel/WeeklyChart.tsx`

**Cel:** agregaty potrzeb regionu widoczne tylko dla administratora (`base.md` II): co zgłaszają gminy i mieszkańcy, czego brakuje w bibliotece.

**Kontekst:** `GET /api/stats?from=&to=&category=&gmina=` (domyślnie ostatnie 90 dni) → `Stats`: sumy `total/matched/unmatched` i grupy `by_category`, `by_gmina`, `by_week` (poniedziałek tygodnia), `by_reporter_type`. W każdej grupie `matched + unmatched = total`. `gmina: null` = bez podanej gminy. Reguły wykresów z `DESIGN.md`: słupki wypełnione pełnymi `stripe-*` (klasa `ds-bar`), podpisy i wartości w `ink`, kolor nigdy nie jest jedyną informacją.

**Kroki:**
1. `h1` „Trendy”, filtry: zakres dat (dwa `type="date"` + chipy „30 dni”, „90 dni”, „Rok”), kategoria, `GminaCombobox`. Stan w URL.
2. Kafle: „Zgłoszenia” (`total`), „Z dopasowaniem” (`matched`, procent), „Bez dopasowania” (`unmatched`, procent; to luka w bibliotece).
3. `BarList` (poziome słupki CSS, bez biblioteki): „Wyzwania” (`by_category`, posortowane malejąco po `total`, każdy słupek dzielony na dopasowane / bez dopasowania z legendą słowną i wzorem lub obramowaniem, żeby nie polegać na kolorze), „Gminy” (top 10 + „Pokaż wszystkie”), „Kto zgłasza” (`by_reporter_type` z `REPORTER_TYPE_LABELS`). Kategoria → kolor `stripe-*` zgodnie z tabelą kategorii z `DESIGN.md` (modyfikatory `ds-bar--…` z F03).
4. `WeeklyChart`: słupki pionowe tygodni (SVG albo CSS grid), oś z datami (`formatDate` skrócone), wartości nad słupkami.
5. Każdy wykres ma obok `<details>` „Pokaż jako tabelę” z `ds-table` tych samych danych (dostępna alternatywa).
6. Kliknięcie kategorii lub gminy w wykresie prowadzi do `/panel/zgloszenia?category=…` / `?gmina=…`.

**Gotowe, gdy:** liczby zgadzają się z `curl /api/stats`; filtr kategorii zawęża wszystkie sekcje; w wysokim kontraście słupki i podpisy są czytelne; tabela alternatywna ma te same wartości; strona działa na 360 px; lista kontrolna dostępności OK.

---

## F19 — Panel: podgląd wyszukiwania

**Zależy od:** F04, F05
**Pliki:** `web/src/pages/panel/SearchDebugPage.tsx`, `web/src/components/panel/TrackTable.tsx`

**Cel:** pokazać jury i zespołowi, że hybryda realnie działa: dwa tory, fuzja, rerank i bramka „nie wiem”. Przydaje się też do kalibracji progów (T25).

**Kontekst:** `GET /api/search?q=…&rerank=true|false&gmina=…` → `SearchDebug` (bez zapisu zgłoszenia). Gdy `SEARCH_ENDPOINT_ENABLED=false` → 404. Treść zapytania idzie w URL, więc to narzędzie wyłącznie panelowe i **nie** zapisujemy `q` w adresie strony (stan w komponencie; wejście z F16 przez `location.state`). To jedyny ekran, który pokazuje `scores`.

**Kroki:**
1. `h1` „Podgląd wyszukiwania”, pole zapytania, `GminaCombobox`, przełącznik „Użyj rerankera” (checkbox), `ds-btn--primary` „Sprawdź”.
2. Sekcje: „Jak zrozumieliśmy zapytanie” (`normalized_query`, `tsquery`, kategoria, grupa, rozwinięte słowa, „zapytanie ogólnikowe: tak/nie”); „Tor słów kluczowych” i „Tor znaczeniowy” obok siebie (`TrackTable`: pozycja, tytuł, wynik); „Po połączeniu (RRF)” z pozycjami z obu torów; „Po rerankingu”; „Bramka »nie wiem«”: źródło, wynik vs próg, „przepuszczono / zatrzymano” (ikona + słowo); „Wiedza”; „Czasy” (`latency_ms`).
3. Rozwiązanie obecne w obu torach wyróżnij tekstem („w obu torach”), nie tylko kolorem.
4. 404 → `Alert info` „Podgląd wyszukiwania jest wyłączony w konfiguracji.”, 503 → komunikat backendu.

**Gotowe, gdy:** zapytanie z `CLAUDE.md` pokazuje oba tory i decyzję bramki zgodne z `curl '/api/search?q=…'`; przełącznik rerankera zmienia źródło bramki na `cosine`; adres strony nie zawiera treści zapytania; lista kontrolna dostępności OK.

---

## F20 — Serwowanie produkcyjne

**Zależy od:** F00
**Pliki:** `web/Dockerfile`, `web/nginx.conf`, `web/.dockerignore`, `docker-compose.yml` (tylko dopisanie serwisu `web`), `Makefile` (tylko cel `web-up`)

**Cel:** `make up` stawia całość (baza, API, frontend) do demo pod jednym adresem.

**Kontekst:** SSE przez proxy wymaga wyłączonego buforowania (backend wysyła `X-Accel-Buffering: no`, ale ustaw to też w nginx). Interfejs używa ścieżek `/api/...` i `/healthz` pod tym samym originem. Trasy SPA (`/panel/zgloszenia/12`) muszą zwracać `index.html`.

**Kroki:**
1. `web/Dockerfile`: etap `node:22-alpine` (`npm ci && npm run build`; kontekst budowania to katalog repozytorium, bo potrzebny jest `design-system/`), etap `nginx:alpine` z `dist/`.
2. `nginx.conf`: `location /api/ { proxy_pass http://api:8000; proxy_buffering off; proxy_cache off; proxy_read_timeout 300s; proxy_http_version 1.1; }`, to samo dla `/healthz`, `try_files $uri /index.html` dla reszty, `gzip` dla statycznych, długi cache dla `/assets/`.
3. `docker-compose.yml`: serwis `web` (build z `web/Dockerfile`, kontekst `.`, port `8080:80`, `depends_on: api`).
4. `Makefile`: `web-up` (`docker compose up -d --build web`).

**Gotowe, gdy:** `make up && make web-up` → `http://localhost:8080` działa, czat strumieniuje tokeny na bieżąco (nie wszystkie naraz na końcu), odświeżenie `/panel/zgloszenia` nie daje 404, `curl localhost:8080/healthz` zwraca stan API.

---

## F21 — Audyt dostępności i próba generalna ścieżki demo

**Zależy od:** F08, F10, F11, F12, F13, F14, F15, F16, F17, F18
**Pliki:** `docs/frontend-a11y.md`; poprawki w dowolnych plikach `web/src/` i `design-system/` (wszystkie zadania UI są już `[x]`, więc nie ma konfliktu właścicieli)

**Cel:** potwierdzić WCAG 2.1 AA (20% oceny: dostępność i intuicyjność) i przejść ścieżkę demo bez potknięć.

**Kroki:**
1. Dla każdej trasy z tabeli, w obu motywach: axe DevTools (0 błędów), Lighthouse Dostępność ≥ 95, przejście samą klawiaturą, powiększenie 200% i szerokość 320 px, NVDA (Windows) albo Orca (Linux) na `/` (cały czat), `/moje-zgloszenia`, `/panel/zgloszenia/:id`. Wyniki w tabeli w `docs/frontend-a11y.md` (trasa × kryterium × wynik × poprawka).
2. Przegląd reguł DS: jeden `ds-btn--cta` na ekran (`grep -c "ds-btn--cta"` per strona), paski tylko w banerze, brak kolorów na sztywno (`grep` z „Konwencji”), jeden `h1` na ekran, statusy z ikoną i słowem.
3. Przegląd prywatności: brak treści zgłoszeń w URL (zakładka Sieć + historia przeglądarki), w `console` i w `sessionStorage`; ostrzeżenie `PRIVACY_WARNING` widoczne przy polach czatu i pomysłu.
4. Próba generalna (prawdziwe API po `make up && make ingest && python -m scripts.seed_reports --purge`), zapisana jako scenariusz w `docs/frontend-a11y.md`:
   1. Mieszkanka z Myślenic opisuje samotność seniorów → karty przed tekstem → streszczenie z `[1]`–`[3]` → klik w `[2]` → „Podobny problem zgłosiło już N osób z M gmin” → numer zgłoszenia.
   2. Zapytanie spoza korpusu → „nie wiem” + wiedza o problemie + doprecyzowanie.
   3. Panel: licznik „Nowe” wzrósł → zgłoszenie bez dopasowania → podobne zgłoszenia → odpowiedź do autora.
   4. Autor: „Moje zgłoszenia” → widzi odpowiedź.
   5. „Mam pomysł” → panel „Do zatwierdzenia” → „Opublikuj” → pomysł w Bibliotece i w wynikach czatu.
   6. Trendy: luka w bibliotece (bez dopasowania) według wyzwań.
   7. Przełącznik wysokiego kontrastu na dowolnym ekranie.
5. Mierz czas ścieżki 1–4 (cel: poniżej 3 minut na film demo). Spowalniające kroki opisz w „Uwagach”.

**Gotowe, gdy:** `docs/frontend-a11y.md` zawiera tabelę bez otwartych błędów krytycznych i przechodzący scenariusz demo; `npm run build` i `npm run lint` czyste.

---

## Uwagi między zadaniami

Format: `- [Fxx → Fyy] opis` albo `- [Fxx → backend Tyy] opis`. Dopisuj na końcu.
