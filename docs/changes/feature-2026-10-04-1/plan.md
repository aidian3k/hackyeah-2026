# plan — Rozmowy M5 jak komunikator

## Stan obecny

- `components/comm/Timeline.tsx` — lista kart w pionie, wszystkie wiadomości wyrównane do lewej.
- `components/comm/MessageForm.tsx` — klasyczny formularz (etykieta, duże pole, licznik, przycisk pod spodem).
- Strony: `pages/comm/ThreadPage.tsx`, `pages/comm/NewThreadPage.tsx`, `pages/panel/CommThreadPage.tsx`, `pages/expert/ExpertThreadPage.tsx`; lista `components/comm/ThreadList.tsx`.

## Kroki

1. `Timeline.tsx` → dymki: wyrównanie wg „własne/cudze” dla `viewer`, awatar (`Avatar` w tym samym pliku), wiadomości SYSTEM wyśrodkowane, karty pod dymkiem AI; przewinięcie na dół po wczytaniu i przy nowej wiadomości (`scrollIntoView`, `behavior: "auto"`). Element `<ol aria-label="Wiadomości">` zostaje (dostępność).
2. Nowy `components/comm/ChatComposer.tsx` — pasek `sticky bottom-0`: `textarea` z etykietą `ds-sr-only`, wysokość rośnie z treścią (do 6 linii), Enter = wyślij, Shift+Enter = nowa linia, okrągły przycisk z ikoną SVG i `aria-label`, licznik od 3800 znaków, błąd w `Alert`.
3. Nowy `components/comm/TypingBubble.tsx` — dymek z trzema kropkami (`motion-safe:animate-bounce`), `role="status"`.
4. Nowy `components/comm/QuickReplies.tsx` — chipy `ds-chip` nad polem wiadomości.
5. Nowy `components/comm/ChatShell.tsx` — układ: nagłówek rozmowy, przewijana oś czasu, slot `aside` (panel: `lg:grid-cols-3`), pole wiadomości na dole.
6. Strony przepisane na `ChatShell` + `ChatComposer`; `NewThreadPage` jako pusty czat z powitaniem i `<details>` „Więcej opcji”.
7. `ThreadList.tsx` jak lista konwersacji.
8. `MessageForm.tsx` zostaje dla formularza „Zaproponuj współpracę” na stronie ogłoszenia.

## Pliki

`web/src/components/comm/{Timeline,ChatComposer,TypingBubble,QuickReplies,ChatShell,ThreadList}.tsx`, `web/src/pages/comm/{ThreadPage,NewThreadPage}.tsx`, `web/src/pages/panel/CommThreadPage.tsx`, `web/src/pages/expert/ExpertThreadPage.tsx`. Backend bez zmian.

## Weryfikacja ręczna

Chrome: rozmowa nr z seeda jako autor, panel i ekspert; szerokość 360 px i 1440 px; Enter/Shift+Enter; nowa wiadomość z drugiego konta przewija widok; `data-contrast="high"`; `npm run lint && npm run build`.

## Wynik (2026-10-04)

Sprawdzone ręcznie w Chrome: dymki autor/panel/ekspert, Enter wysyła i Shift+Enter dodaje linię, przewijanie na dół po wysłaniu, szybkie odpowiedzi, dymek „pisze…” (status `AI_PENDING` ustawiony na chwilę w bazie), lista konwersacji, panel z kolumną boczną na 1920 px, widok 390 px (w `iframe` — okno było zmaksymalizowane) bez poziomego przewijania, `npm run lint && npm run build`.

Poprawka przy okazji: `ds-sr-only` licznika „Rozmowy” w `PanelLayout` rozszerzał stronę na wąskim ekranie (element absolutny poza przewijaną nawigacją) — link dostał `relative`. Ten sam wzorzec ma licznik „Nowe” (M1) — do sprawdzenia przy kolejnej zmianie panelu.

Niesprawdzone: czytnik ekranu (NVDA), tryb wysokiego kontrastu dla nowych dymków (kolory z tokenów `navy`/`soft-*`), prawdziwe urządzenie mobilne (klawiatura ekranowa a przyklejone pole).
