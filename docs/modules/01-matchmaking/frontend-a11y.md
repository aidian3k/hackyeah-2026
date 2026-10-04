# Frontend: przegląd dostępności i próba generalna (F21)

Data: 2026-10-03. Wykonał: wf-F21. Kod: `web/` na gałęzi `feature/module-1-impl` (stan po F00–F20).

## Jak sprawdzano

W środowisku agenta nie było okna przeglądarki ani rozszerzenia axe DevTools. Zamiast tego Chrome działał bez okna (`google-chrome --headless=new`) i był sterowany przez protokół DevTools (CDP). Na każdą stronę wstrzykiwano ten sam silnik `axe-core` (wersja z `web/node_modules`), którego używa rozszerzenie. Skrypty sprawdzające leżały poza repozytorium.

- **axe-core**: reguły `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` i `best-practice`. Każdy ekran sprawdzono w motywie jasnym i w wysokim kontraście (`<html data-contrast="high">`), przy szerokości 1280 px i 320 px. Ekrany ścieżki demo sprawdzono też przy 640 px, co odpowiada układowi 1280 px w powiększeniu 200%. Skuteczność silnika potwierdzono kontrolnie: na wstrzykniętym błędnym znaczniku zgłosił `image-alt`, `label` i `color-contrast`.
- **Szerokość 320 px**: `scrollWidth` dokumentu porównywany z `clientWidth`, czyli czy pojawia się poziome przewijanie. Elementy, które wystają poza ekran, namierzano po kolei.
- **Klawiatura**: prawdziwe naciśnięcia `Tab` wysyłane przez CDP. Dla każdego fokusu sprawdzano `:focus-visible` i obrys (`outline`). Oprócz tego sprawdzano, czy fokus wychodzi poza dokument, czyli czy nie ma pułapki.
- **Reguły DS**: liczba widocznych `h1` i `ds-btn--cta`, paski poza `.ds-banner` oraz tytuł karty, wszystko na żywym DOM-ie. Do tego `grep` z „Konwencji” na źródłach.
- **Czytnik ekranu**: NVDA ani Orca nie były dostępne. Dla `/` (czat) przebieg zastępczy wyglądał tak: obserwator mutacji regionów `aria-live`, `role=alert` i `role=status` zapisywał, co i w jakiej kolejności zostałoby ogłoszone, a drzewo dostępności (`Accessibility.getFullAXTree`) dało hierarchię nagłówków. **Do zrobienia przed demo:** krótkie przejście `/` z NVDA albo Orca na prawdziwym ekranie.
- **Czat**: na prawdziwym API (`embedding_provider=hash`, `llm_enabled=false`) oraz na 4 scenariuszach mocka (`docs/mocks/replay.py`, żądania `/api/chat` przekierowane do `:8001`).

## Wyniki: ekran → problem → poprawka

Każdy wiersz obejmuje oba motywy oraz szerokości 1280 i 320 px.

| Ekran | axe (błędy) | 320 px | Klawiatura | Uwagi / poprawka |
|---|---|---|---|---|
| `/` przed wysłaniem | 0 | OK | OK. Kolejność: skip link → kontrast → nawigacja → opis → przykłady → gmina → „Zgłaszam jako” → CTA | Radio nie ma własnego obrysu, ale obrys 3 px dostaje cała etykieta `ds-choice` przez `:has(:focus-visible)`. To jest poprawne zachowanie. |
| `/` wyniki: match, no-match, retracted, error, prawdziwe API | 0 | OK | Fokus po wysłaniu idzie na `#wyniki-naglowek`. Klik w `[2]` przenosi fokus na kartę `#rozwiazanie-2` | **Problem:** czytnik nie dowiadywał się, że przyszły karty, ani że wynik to „nie wiem”. Alert „nie wiem” nie był w regionie live. **Poprawka:** `ChatResults` ma teraz region `ds-sr-only aria-live="polite"` z komunikatem „Znaleźliśmy N rozwiązań. W sekcji »Zobacz też« jest jeszcze M.” albo z `no_match.message_pl`. |
| `/rozwiazania` | 0 | OK | OK. 39 przystanków, pułapki nie ma | — |
| `/rozwiazania/165` (film) | 0 | OK | OK. Fokus wchodzi do `iframe` YouTube i z niego wychodzi | `iframe` ma `title="Film: …"`, adres `youtube-nocookie.com/embed/…` i link „Otwórz film w YouTube” jako drogę zapasową. |
| `/mam-pomysl` | 0 | OK | OK. Po wysłaniu fokus trafia na komunikat „Wysłano” (`role=status`) | — |
| `/moje-zgloszenia` (z wpisami i odpowiedzią) | 0 | OK | OK | — |
| `/panel/zgloszenia/:id` (77, 87, 93) | 1 → 0 | OK | OK | **Problem (axe `landmark-unique`):** sekcja „Podobne zgłoszenia” i przewijany region tabeli miały tę samą nazwę (`aria-labelledby` wskazywało ten sam nagłówek). **Poprawka:** region tabeli ma teraz `aria-label="Tabela podobnych zgłoszeń"` (`SimilarReports.tsx`). |
| `/panel/zgloszenia` (poza ścieżką, link z demo) | 0 | **przewijanie 9 px → 0** | OK | **Problem:** w układzie kart przy 320 px „Bez dopasowania” miało `white-space: nowrap` i wystawało z wąskiej kolumny (WCAG 1.4.10). **Poprawka:** `panel-reports.css` w zapytaniu `max-width: 43.75em` pozwala zawijać `.match-status`. Dodatkowo `min-width: 0` dla komórki treści w układzie kart. |
| `/panel/zgloszenia` (kolumna Status) | — | — | — | **Problem (reguła DS „statusy: ikona + słowo”):** sam tekst „Nowe”. **Poprawka:** `ReportsTable` używa `StatusLabel` z F16 (ikona + słowo). |
| `/panel`, `/panel/rozwiazania`, `/panel/rozwiazania/165`, `/panel/trendy`, `/wiedza`, `/rozwiazania/45` (KNOWLEDGE), 404 | 0 | OK | nie sprawdzano (poza ścieżką) | `/panel` przy 320 px w wysokim kontraście raz wyszło bez `h1` i `main`. Pomiar trafił na przeładowanie strony i przy 4 powtórkach się nie powtórzył, więc to nie jest błąd. |
| Nawigacja panelu | — | — | — | **Problem (wpis F14):** czytnik czytał licznik „Nowe” jako „N nowych zgłoszeń”, a liczba obejmuje też pomysły do zatwierdzenia. **Poprawka:** `PanelLayout` czyta teraz „N nowych pozycji” (z odmianą). |

Czytnik ekranu na `/` (scenariusz `match`): obserwator zapisał ogłoszenia w tej kolejności:

1. „Analizuję opis problemu…”, potem „Szukam w bazie rozwiązań…” i „Wybieram najlepiej pasujące…”.
2. „Znaleźliśmy 3 rozwiązania. W sekcji »Zobacz też« jest jeszcze 2.”
3. „Przygotowuję podsumowanie…”.
4. Streszczenie. Region ma `aria-busy` do `done`, więc tekst zostaje przeczytany raz, w całości.
5. „Skala problemu: Podobny problem zgłosiło już N osób z M gmin. Twoje zgłoszenie ma numer …”.

Nagłówki układają się w hierarchię: `h1` „Opisz problem” → `h2` „Wyniki” → `h3` „Podsumowanie”, karty, „Zobacz też”, „Co wiemy o tym problemie” → `h4` wiedza.

### Przegląd reguł DS

- **Jeden `ds-btn--cta` na ekran.** W kodzie występuje tylko w `ChatForm` (`/`) i w `IdeaForm` (`/mam-pomysl`). Na żywo każdy ekran ma najwyżej 1 widoczny CTA, panel nie ma żadnego.
- **Paski tylko w banerze.** Poza `.ds-banner` nie ma żadnego elementu `stripe`.
- **Kolory i rozmiary na sztywno.** `grep` z „Konwencji” zwraca tylko wyjątki opisane komentarzem: grubość linii 1 px, technika `sr-only`, obrys ikon 2 px oraz obrys fokusu 3 px w `chat-results.css`, przy którym brakowało komentarza i został dopisany.
- **Jeden `h1` na ekran.** Spełnione na każdym ekranie i w każdym wariancie. Tytuł karty ma postać „… · HubMI”.
- **Statusy z ikoną i słowem.** Spełnione po poprawce w `ReportsTable`. Dopasowanie (`MatchStatus`, `MatchLabel`), statusy zgłoszenia (`StatusLabel`) i alerty (`ds-alert` z ikoną i słowem) były już zgodne.
- **`prefers-reduced-motion`.** Wyłącza animacje globalnie (`app.css`). Przewijanie do karty po kliknięciu `[n]` też go uwzględnia.

**Otwarte błędy krytyczne: brak.**

## Próba generalna ścieżki demo

Środowisko: `http://localhost:8080` (F20, obraz przebudowany po poprawkach: `docker compose up -d --build web`), prawdziwe API. Każdy krok wykonano przez interfejs: wpisanie tekstu, wybór z listy, kliknięcie.

| # | Scenariusz | Wynik |
|---|---|---|
| 1 | Mieszkanka z Myślenic (gmina „Myślenice”) opisuje samotność seniorów | OK. Karty (6) pojawiają się przed resztą, około 0,4 s po wysłaniu. Komunikat „Podobny problem zgłosiło już 14 osób z 5 gmin” i numer zgłoszenia. Przy `llm_enabled=false` prawdziwe API nie wysyła streszczenia, więc `[1]`–`[3]` i klik w `[2]` sprawdzono na mocku (`match`). Fokus przechodzi wtedy na kartę `#rozwiazanie-2`. |
| 2 | Zapytanie spoza korpusu („bezpańskie psy”) | OK. Alert „nie wiem” w tonie info, nie błędu, pole doprecyzowania i numer zgłoszenia. Na prawdziwym API z `hash` sekcja „Co wiemy o tym problemie” była pusta, bo backend nie zwrócił `context`. Na mocku `no-match` wiedza się pokazuje. |
| 3 | Biblioteka → wyszukanie „Paszport pacjenta” → rozwiązanie z filmem | OK. Fokus trafia na `h1`, a `iframe` wskazuje `youtube-nocookie.com/embed/7QedTbxzsPk`. Odtwarzania nie dało się sprawdzić bez ekranu: zrobić to w przeglądarce przed demo. |
| 4 | Panel: „Bez dopasowania” → zgłoszenie z kroku 2 → podobne → odpowiedź | OK. Wpis jest pierwszy na liście, widać „Podobne zgłoszenia (3)” i alert „Brak dopasowanego rozwiązania” z linkiem. Po wysłaniu pojawia się „Wysłano. Autor zobaczy odpowiedź…”, a status zmienia się na „W toku”. |
| 5 | Autor: „Moje zgłoszenia” | OK. Odpowiedź zespołu Hubu jest widoczna przy zgłoszeniu. |
| 6 | „Mam pomysł” → „Do zatwierdzenia” → „Przejrzyj” → „Opublikuj w bibliotece” | OK. Pomysł jest w Bibliotece (wyszukiwanie) i w wynikach czatu. Testowe rekordy 174 i 175 przeniesiono potem do archiwum (`PATCH status=ARCHIVED`). |
| 7 | Przełącznik „Wysoki kontrast” | OK. Ustawia `aria-pressed=true`, czarne tło i tekst `#FFF200`. Tryb zostaje po przejściu do panelu. Wyłączenie usuwa atrybut. |

**Czas ścieżki 1–5.** Automat potrzebował 14 s, czyli same opóźnienia interfejsu i API są pomijalne. Szacunek dla prowadzącego demo: wstawienie przykładu z chipa i wybór gminy około 20 s, przejrzenie wyników około 30 s, krok 2 około 25 s, krok 3 około 25 s, krok 4 około 40 s, krok 5 około 15 s. Razem **około 2,5 min**, poniżej celu 3 min. Ryzyko czasu opisuje „Uwagi” w `docs/modules/01-matchmaking/frontend-tasks.md`.

**Przed nagraniem:**

1. `python -m scripts.seed_reports --purge`, bo próba dodała zgłoszenia 89–99 i odpowiedzi.
2. Włączyć `llm_enabled` i prawdziwe embeddingi, żeby było streszczenie z `[n]`, a „nie wiem” miało wiedzę.
3. Sprawdzić odtwarzanie filmu i przejście z czytnikiem ekranu na prawdziwym ekranie.
