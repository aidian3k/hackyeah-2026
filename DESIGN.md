# Design system Splot

Splot jest zawsze w motywie jasnym (białe tło). Jedyny dodatkowy tryb to wysoki kontrast dla osób słabowidzących.

## Jak używać w kodzie

| Plik | Do czego |
| --- | --- |
| `design-system/tokens.css` | Wszystkie tokeny jako zmienne CSS (`var(--navy)`, `var(--space-4)`, `font: var(--text-body)`). Importuj raz, globalnie. |
| `design-system/components.css` | Gotowe klasy komponentów: `ds-banner`, `ds-nav`, `ds-btn`, `ds-chip`, `ds-tag`, `ds-card`, pola `ds-input`. |
| `design-system/tailwind.preset.js` | Preset, jeśli frontend używa Tailwinda (`bg-surface`, `text-navy`, `bg-accent`, `text-cat-blue`). |
| `design-system/tokens.json` | Źródłowe wartości tokenów z opisem użycia. |
| `design-system/stripe-band.svg` | Paski banera jako plik graficzny. |
| `design-system/examples/index.html` | Podgląd wszystkich komponentów; otwórz w przeglądarce. |

Font: Atkinson Hyperlegible Next z Google Fonts (link w nagłówku `tokens.css`).

- Nie wpisuj kolorów ani odstępów na sztywno. Zawsze używaj tokenów.
- Nowy komponent buduj z istniejących tokenów i dopisz go do `components.css` oraz do strony z przykładami.
- Klasy kategorii odpowiadają identyfikatorom wyzwań: `ds-tag--starzenie`, `--psych`, `--samotnosc`, `--cyfrowe`, `--dostep`, `--osadnictwo`, `--koordynacja`.

## Zasady

Splot to platforma Małopolskiego Hubu Innowacji Społecznych (ROPS Kraków). Wygląda jak serwis Samorządu Województwa Małopolskiego: spokojne, jasne tło, granatowa nawigacja, jeden akcent magenty i kolorowe paski tylko w banerze. Korzystają z niej seniorzy, osoby z niepełnosprawnościami i urzędnicy, więc czytelność jest ważniejsza od ozdób.

## Ton i treść

- Pisz prostym językiem, w drugiej osobie („Opisz problem”, „Zgłoś do Hubu”). Bez żargonu urzędowego i skrótów bez rozwinięcia.
- Przyciski mówią, co się stanie: „Wyślij do Hubu”, potem komunikat „Wysłano”.
- Wielka litera tylko na początku zdania i w nazwach własnych. Bez emoji.
- Jeden nagłówek i jedno główne działanie na ekran. Teksty pomocnicze maksymalnie jedno zdanie.

## Kolor i proporcje

Zasada 75 / 10 / 8 / 3 / 4: tak rozkładaj powierzchnię każdego ekranu.

| Rola | Tokeny | Udział | Gdzie |
| --- | --- | --- | --- |
| Neutralne tła | `surface`, `surface-muted`, `surface-sunken` | `share-neutral` 75% | Tło strony, banera, kart, pól |
| Tekst | `ink`, `ink-muted` | `share-text` 10% | Cała treść |
| Kolor wiodący | `navy` | `share-navy` 8% | Nawigacja, nagłówki, linki, przycisk główny |
| Akcent | `accent` | `share-accent` 3% (maks.) | Jedno wezwanie do działania na ekran, aktywna zakładka |
| Paski i kategorie | `stripe-*`, `cat-*`, `soft-*`, `violet` | `share-stripes` 4% (maks.) | Baner, etykiety kategorii, wykresy |

- Tło strony to `surface`, baner na górze `surface-muted`. Tekst zawsze `ink` lub `ink-muted`.
- Nagłówki i linki ustawiaj w `navy`. Przycisk główny ma wypełnienie `navy` i etykietę `on-navy`.
- `accent` pojawia się najwyżej raz na ekranie jako wypełnienie: najważniejszy przycisk (np. „Znajdź rozwiązania”). Poza tym tylko jako podkreślenie aktywnej zakładki (3px) i ikona strony głównej.
- Nigdy nie używaj `stripe-magenta`, `stripe-cyan`, `stripe-green` ani `stripe-yellow` jako koloru tekstu ani tła pod tekstem. Nie spełniają kontrastu. Do tekstu służą odpowiedniki `cat-*`.

## Paski

Kolorowe paski to powiększone kreski litery M z logotypu Małopolski. To najbardziej rozpoznawalny element marki, dlatego mają ścisłe reguły.

- Używaj komponentu `StripeBand`. Paski są tylko w banerze na górze strony, jeden raz na ekranie. Nie stawiaj ich za tekstem i nie powtarzaj w stopce ani w kartach.
- Kolejność od lewej jest stała: `stripe-magenta` „/”, `stripe-blue` „\”, `stripe-cyan` „/” (przecięcie z niebieskim w `stripe-overlap`), przerwa, `stripe-green` „\”, `stripe-yellow` „/” ucięty prawą krawędzią.
- Paski są nachylone o 11–15° od pionu, na przemian w lewo i w prawo, i zawsze biegną przez pełną wysokość banera.
- Szerokości względem paska magenty (100): niebieski 88, błękitny 77 (zwęża się ku dołowi), zielony 65, żółty 10–40 (ucięty).
- Paski zajmują ok. 27% powierzchni banera (`stripe-share-in-band`) i leżą mniej więcej między 30% a 67% jego szerokości. Lewa część zostaje dla nazwy, prawa dla narzędzi (dostępność, język, BIP).
- W motywie wysokiego kontrastu baner pokazuje paski bez zmian, bo są czystą dekoracją. Tekst obok nich ma kolory motywu.

## Kategorie wyzwań

Każde wyzwanie społeczne ma stały kolor z palety pasków. Etykieta to tekst `cat-*` na tle `soft-*`, zawsze z nazwą słowną. Kolor nigdy nie jest jedyną informacją.

| Wyzwanie | Tekst | Tło |
| --- | --- | --- |
| Starzenie się społeczeństwa | `cat-blue` | `soft-blue` |
| Zdrowie psychiczne | `cat-magenta` | `soft-magenta` |
| Samotność i słabe więzi | `violet` | `soft-violet` |
| Wykluczenie cyfrowe | `cat-cyan` | `soft-cyan` |
| Dostęp do usług | `cat-green` | `soft-green` |
| Struktura osadnicza | `cat-yellow` | `soft-yellow` |
| Koordynacja i współpraca | `navy` | `surface-sunken` |

Na wykresach używaj pełnych `stripe-*` jako wypełnień słupków, a podpisy i wartości pisz w `ink`.

## Typografia

- Jedna rodzina: `sans` (Atkinson Hyperlegible Next), zaprojektowana dla osób słabowidzących.
- Tekst podstawowy w stylu `body` (16px), nigdy mniejszy niż `small` (14px). Formularze i opisy dla mieszkańców w `body-lg` (18px).
- Nawigacja w stylu `nav` (18px, pogrubiony) w kolorze `navy`.
- Nagłówki: `h1` jeden na ekran, potem `h2`, `h3`. `display` tylko na stronie startowej.
- Interfejs pozwala powiększyć tekst do 130% bez łamania układu: używaj jednostek względnych.

## Odstępy, promienie, cienie

- Margines boczny strony to minimum `space-4`, odstęp między sekcjami `space-8` na telefonie i `space-12` na desktopie.
- Przyciski: promień `radius-md`, padding `space-3` × `space-6`, wysokość min. 44px.
- Karty: promień `radius-lg`, padding `space-4`, obramowanie `line`. Bez kolorowych pasków na krawędzi karty.
- Chipy filtrów i przykładów mają `radius-pill`, etykiety kategorii `radius-sm`.
- Cień tylko pod paskiem nawigacji (`shadow-header`) i pod oknami dialogowymi (`shadow-card`).

## Dostępność

- Każda para tekst/tło w `usage` tokenów ma kontrast co najmniej 4.5:1 w obu motywach: jasnym i wysokiego kontrastu. Obramowania kontrolek (`line-strong`) mają min. 3:1.
- Fokus: obrys 3px w kolorze `focus`, odsunięty o 2px, zawsze widoczny.
- Motyw „Wysoki kontrast” to żółty tekst `#FFF200` na czerni, jak w wersjach kontrastowych serwisów samorządowych. Udostępnij go przełącznikiem w nagłówku, który ustawia `<html data-contrast="high">`. Motywu ciemnego nie ma: tło jest zawsze białe.
- Statusy (`success`, `warning`, `danger`) zawsze mają ikonę i słowo.

## Ikony i logo

- Ikony konturowe, grubość 2px, w kolorze `navy`; ikony usług dostępności (język migowy, pętla indukcyjna, dostępność) w `violet` lub `navy`, jak w nagłówku malopolska.pl.
- Logotyp Małopolski i jego kolory są własnością Województwa Małopolskiego. Nie rysuj go odręcznie i nie przerabiaj. Przy współbrandingu użyj oficjalnych plików z Systemu Identyfikacji Wizualnej Województwa.
- Splot nie ma jeszcze znaku graficznego. Nazwę „Splot” składaj krojem `sans` w stylu `h2`, w kolorze `ink`.
