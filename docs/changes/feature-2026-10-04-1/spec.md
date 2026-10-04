# feature-2026-10-04-1 — Rozmowy M5 jak komunikator

**Status:** wdrożone

Uwaga po pierwszym pokazie Modułu 5: widok rozmowy wygląda jak formularz, a ma wyglądać i działać jak czat (Messenger, WhatsApp) — nowocześnie i responsywnie.

## Do zmiany

1. **Wiadomości jako dymki**
   - własne wiadomości po prawej, cudze po lewej (autor: swoje po prawej; panel: wiadomości Hubu po prawej; ekspert: swoje po prawej),
   - nad dymkiem krótko kto pisze, pod nim godzina; przy dymkach rozmówców okrągły awatar (inicjał / „AI” / „H”),
   - informacje systemowe wyśrodkowane, małym tekstem,
   - odpowiedź asystenta w dymku z podpisem „Odpowiedź automatyczna (AI)”, karty rozwiązań pod dymkiem.

2. **Pole wiadomości jak w komunikatorze**
   - przyklejone do dołu ekranu, jedno rosnące pole + okrągły przycisk „Wyślij” z ikoną,
   - Enter wysyła, Shift+Enter nowa linia; licznik znaków dopiero blisko limitu,
   - po wysłaniu wiadomość od razu w rozmowie, widok przewija się na dół.

3. **Zachowanie czatu**
   - po wejściu i przy nowej wiadomości widok na dole rozmowy,
   - gdy asystent szuka odpowiedzi — dymek „pisze…” z animowanymi kropkami (bez animacji przy `prefers-reduced-motion`),
   - po odpowiedzi AI szybkie odpowiedzi jako „chipy”: „To mi pomogło”, „Chcę porozmawiać z zespołem Hubu”.

4. **Nowa rozmowa** (`/rozmowy/nowa`) zaczyna się jak pusty czat: powitanie od Hubu w dymku, pole wiadomości na dole; „Kim jesteś?” i podpis schowane w „Więcej opcji”.

5. **Panel i ekspert** — ten sam widok czatu; w panelu na szerokim ekranie po prawej kolumna z ekspertem, podpisem i statusem, na wąskim pod czatem.

6. **Lista „Moje rozmowy”** jak lista konwersacji: ikona rodzaju, temat pogrubiony przy nowej odpowiedzi, czas po prawej.

## Kryterium akceptacji

- rozmowa na telefonie (360 px) i komputerze wygląda jak komunikator: dymki po dwóch stronach, pole wiadomości na dole, bez poziomego przewijania,
- Enter wysyła wiadomość, Shift+Enter dodaje linię,
- widok sam przewija się do nowej wiadomości; asystent „pisze…” jest widoczny i ogłaszany czytnikowi,
- WCAG 2.1 AA: rola nadawcy słownie (nie tylko strona i kolor), pole ma etykietę, przycisk ma nazwę, kontrast w trybie wysokiego kontrastu,
- tylko Tailwind z presetu i klasy `ds-*`, bez nowych arkuszy CSS; API bez zmian.
