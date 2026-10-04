# feature-2026-10-04-2 — Kreator: kanwa krok po kroku z grafiką jak w Social Canvas

**Status:** wdrożone

Uwaga z demo (właściciel produktu): „Nie do końca podoba mi się też UI kreatora jeśli chodzi o ten canvas, wydaje mi się to mało przyjazne i za dużo informacji pojawia się obok siebie. Dodałbym też więcej elementów graficznych analogicznie do tego co znajdowało się w tym pdfie z canvasem. Naraz powinno być pokazywane mniej informacji, może to mieć formę bardziej krokową.”

Dotyczy ekranu `/mam-pomysl/:id/kanwa` (K10). Dziś arkusz pokazuje naraz 7–10 bloków w siatce planszy, każdy z pełnymi opisami opcji — na 1280 px to ok. 4000 px przewijania, na telefonie jeszcze więcej. Wzór graficzny: `docs/resources/rops/materialy/social_canvas.pdf` (3 plansze INNOAGH).

## Do zmiany

1. **Jedno pytanie na ekran**
   - Każdy arkusz to sekwencja kroków: wstęp arkusza → jeden blok kanwy na krok (26 bloków razem) → podsumowanie arkusza.
   - Krok bloku pokazuje: obszar (ikona + nazwa), nagłówek `h2` z tytułem bloku, ilustrację obszaru, kontrolkę bloku z poleceniem, rozwijane „Pytania pomocnicze” (listy) i zwinięte „Podpowiedz” (asystent tylko dla tego bloku).
   - Nawigacja „Wstecz” / „Dalej: <następny krok>” pod kontrolką oraz postęp „Krok N z M” (w arkuszu) i „Pytanie n z 26”.
   - Ostatni krok arkusza prowadzi do wstępu następnego arkusza; podsumowanie ostatniego arkusza kończy przebieg.

2. **Mapa arkusza jak plansza z PDF**
   - Nad krokiem widać miniaturę bieżącego arkusza: obszary ułożone kolumnami jak na planszy (S1: Problem | Aktorzy | Rozwiązanie | Koszty; S2: Odbiorcy | Dochody | Wartość; S3: Kanały | Partnerzy nad Wpływem), w każdym obszarze kafelki bloków.
   - Kafelek ma ikonę, krótki tytuł i stan: uzupełnione (pełne kółko z „ptaszkiem”) / puste (przerywany kontur); bieżący krok jest wyróżniony (odwrócone kolory) i ma `aria-current="step"`. Stan zawsze też słowem dla czytników (nie tylko kolor/kształt).
   - Kafelek to link do kroku (skok bez przechodzenia po kolei).
   - Na telefonie (< 768 px) mapa jest w zwiniętym `details` „Mapa arkusza”, na szerszych ekranach rozwinięta.

3. **Więcej grafiki z planszy PDF** (inline SVG, kolory z tokenów, dekoracja `aria-hidden`)
   - Twarze przy opcjach „Intensywność” i „Częstotliwość” (od uśmiechu do „płomienia”), sylwetki ludzi przy „Skali problemu” (1 → wiele), ikony przy „Prostocie i zrozumiałości” (znak zapytania, puzzel, ptaszek, dymek).
   - Ikony obszarów (problem, aktorzy, rozwiązanie, koszty, odbiorcy, dochody, wartość, kanały, partnerzy, wpływ) w mapie i w nagłówku kroku; ikony osoby / społeczności / środowiska przy krokach wpływu.
   - Wstęp arkusza: ilustracja planszy (schemat obszarów) i krótka lista „co uzupełnisz”.
   - Serca (wartość emocjonalna), konstelacja partnerów i wskaźniki poziomów zostają.

4. **Podsumowanie arkusza**
   - Cały arkusz tylko do odczytu (`CanvasBoard readOnly`) z linkami „Zmień” do kroków, przejście do następnego arkusza, a na podsumowaniach sekcja „Co dalej?” z jedynym przyciskiem `ds-btn--cta` „Wyślij do Hubu” (gdy pomysł jest szkicem).

5. **Bez zmian zachowania**
   - Autozapis z `useCanvas` (800 ms, partnerzy zapisywani dopiero kompletni, błędy per blok i „Spróbuj ponownie”) — stan wspólny dla wszystkich kroków; zmiana kroku nie gubi niezapisanych zmian.
   - Tryb tylko do odczytu `CanvasBoard` (panel Hubu K11, `/panel/pomysly/:id`) działa jak dotąd.
   - Głębokie linki: `?arkusz=1|2|3&krok=<block_id>|wstep|podsumowanie`; brak lub nieznany `krok` = wstęp arkusza; stary link `?arkusz=N` nadal działa.

## Dostępność

- Po zmianie kroku fokus na nagłówek kroku (`h2`, `tabIndex=-1`), a region `aria-live="polite"` ogłasza „Krok N z M, arkusz K”.
- Jedno `h1`, kroki `h2`, wewnątrz `h3`; WCAG 2.1 AA, axe bez naruszeń; 320 px bez przewijania w poziomie; tryb `data-contrast="high"`.
- Najwyżej jeden `ds-btn--cta` na ekranie; stylowanie wyłącznie Tailwind + `ds-*`.

## Kryterium akceptacji

- Na ekranie kanwy widać naraz jeden blok (plus mapę arkusza), a przejście przez wszystkie 26 bloków jest możliwe samą klawiaturą przyciskiem „Dalej”.
- Mapa arkusza odzwierciedla wypełnienie po autozapisie i pozwala przeskoczyć do dowolnego kroku; link `?arkusz=2&krok=value_emotional` otwiera właściwy krok.
- Grafika z punktu 3 jest widoczna; w wysokim kontraście wszystkie ikony są widoczne (kolory z tokenów).
- `npm run lint` i `npm run build` bez błędów; axe 0 naruszeń na kanwie (wstęp, krok, podsumowanie) i na `/panel/pomysly/1`.
