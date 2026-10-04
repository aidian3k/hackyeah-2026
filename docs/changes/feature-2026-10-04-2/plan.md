# feature-2026-10-04-2 — plan

## Stan obecny

- `web/src/pages/CanvasPage.tsx`: zakładki arkuszy (`?arkusz=N`), pasek postępu + autozapis (sticky), `CanvasBoard` z całym arkuszem, „Następny arkusz”, sekcja „Co dalej?” z CTA.
- `web/src/components/canvas/CanvasBoard.tsx`: siatka planszy (`layout.ts`), edycja i tryb `readOnly` (panel `IdeaReviewPage`).
- Bloki: `CanvasBlockView` → `SingleChoiceBlock` / `MultiChoiceBlock` / `ListBlock` / `TextBlock` / `PartnersBlock`; `ImpactMatrix` dla obszaru wpływu.
- `web/src/hooks/useCanvas.ts`: stan lokalny + autozapis, niezależny od tego, co jest na ekranie.

## Kroki

1. `components/canvas/steps.ts` — model kroków: `buildSheetSteps(definition, sheetId)` → `wstep`, bloki w kolejności obszarów, `podsumowanie`; `stepHref(sheetNo, stepId)`, `parseStep`, `isBlockFilled(value)` (pusta lista / puste `multi` / pusty tekst = niewypełnione; zgodnie z tym, co liczy API, bo pusty blok jest usuwany).
2. `components/canvas/CanvasArt.tsx` — grafika SVG (aria-hidden, `fill-current`/`stroke-current`): `AreaIcon {area}`, `OptionArt {blockId, code}` (twarze, ludzie, ikony prostoty), `ImpactIcon`, `SheetIllustration {sheet}` (schemat planszy), `FilledMark {filled}`.
3. `components/canvas/SheetMap.tsx` — mapa arkusza: `details` (otwarte od 768 px), kolumny obszarów jak w PDF, kafelki-linki z `aria-current="step"`, stan słowem (`ds-sr-only`).
4. `components/canvas/CanvasStep.tsx` — krok bloku: obszar + `h2` (fokus), ilustracja, `CanvasBlockView` z ukrytym (tylko dla czytników) tytułem, „Podpowiedz” (`AssistPanel` z `headingLevel=3`) zwinięte; `SheetIntro` i `SheetSummary` (z `CanvasBoard readOnly headingLevel=3` + linki „Zmień”).
5. `CanvasBlockView` i bloki: nowy opcjonalny prop `titleHidden` (legend / tytuł jako `ds-sr-only`, bo tytuł jest już w `h2` kroku). `SingleChoiceBlock`/`OptionCard`: grafika opcji z `OptionArt` (także w trybie tylko do odczytu).
6. `CanvasPage.tsx` — przebudowa: zakładki arkuszy (kompaktowe, link do wstępu), pasek „Cała mapa” + autozapis, `SheetMap`, bieżący krok, nawigacja Wstecz/Dalej, postęp kroków, `aria-live`, fokus na `h2` przy zmianie kroku. „Co dalej?” tylko na podsumowaniu.
7. `useCanvas.ts` — bez zmian w semantyce autozapisu (ewentualnie tylko eksport pomocniczy).
8. `CanvasBoard` / `layout.ts` — API tylko do odczytu bez zmian (panel K11).

## Pliki

`web/src/pages/CanvasPage.tsx`, `web/src/components/canvas/{steps.ts,CanvasArt.tsx,SheetMap.tsx,CanvasStep.tsx}` (nowe), `CanvasBlockView.tsx`, `SingleChoiceBlock.tsx`, `MultiChoiceBlock.tsx`, `ListBlock.tsx`, `TextBlock.tsx`, `PartnersBlock.tsx`, `layout.ts` (`MAP_COLUMNS`).

## Weryfikacja ręczna

- `cd web && npm run lint && npm run build`.
- Własny headless Chrome (CDP, port 9444): kanwa pomysłu 4 przy 1280 i 320 px, `data-contrast="high"`, axe-core (wstęp, krok, partnerzy, podsumowanie), przejście klawiaturą przez kilka kroków, autozapis (zmiana → PATCH → mapa pokazuje „uzupełnione”), panel `/panel/pomysly/1`.
- Zrzuty „przed” i „po” w `screens/`.

## Odejścia od planu

- `ImpactMatrix.tsx` (tylko do odczytu): kontener tabeli ma `relative` i jest regionem z `tabIndex=0` — ukryte teksty `ds-sr-only` w komórkach rozpychały stronę przy 320 px (podsumowanie arkusza 3 i panel), a przewijana tabela wymaga fokusu (axe `scrollable-region-focusable`).
- `MultiChoiceBlock.tsx`: serca „Wartości emocjonalnej” w siatce 1/2/3 kolumny (jak na planszy) zamiast jednej kolumny.
- `CanvasBoard.tsx`: opcjonalny `editHref` (linki „Zmień” na podsumowaniu); bez niego zachowanie jak dotąd.
- `useCanvas.ts` bez zmian — autozapis jest na poziomie strony, więc działa między krokami.
- Pasek „Cała mapa” zastąpiony jedną linią tekstu (mniej elementów nad krokiem); zakładki arkuszy na telefonie w jednym wierszu (tytuł tylko dla czytników poniżej `md`).

## Zweryfikowano (2026-10-04)

- `npm run lint` i `npm run build` — bez błędów.
- Headless Chrome (CDP :9444) na dev-serwerze :5173, pomysł 4 „Kącik spokoju w szkole”:
  - axe-core (wcag2a/aa, wcag21a/aa, best-practice): 0 naruszeń — wstęp, krok `single` (1280, 320, wysoki kontrast), `list`, `text`, `multi`, partnerzy, podsumowanie arkusza 1 i 3 (1280 i 320), wstęp w wysokim kontraście; panel `/panel/pomysly/1` (tylko do odczytu) — 0 naruszeń, arkusze renderują się.
  - 320 px: `scrollWidth = 320` na krokach i podsumowaniach (przed poprawką `ImpactMatrix` — 349 na podsumowaniu arkusza 3).
  - Klawiatura: „Zacznij: …” (Enter) → fokus na `h2` kroku, `aria-live` ogłasza „Arkusz 1, krok 4 z 12: Skala problemu”, kafelek mapy ma `aria-current="step"`; Tab → grupa `radio`, strzałka wybiera opcję; „Dalej” i „wstecz” przeglądarki przenoszą fokus na `h2`.
  - Autozapis: wybór opcji → PATCH po ok. 800 ms (API: `problem_scale = NARROW`, postęp 3 → 4, „Zapisano o …”, kafelek „uzupełnione”); „Wyczyść wybór” usuwa blok. Niepełny partner (bez roli) nie jest wysyłany także po przejściu do innego kroku (brak 422), po powrocie wpis jest w stanie lokalnym; po zaznaczeniu roli zapisuje się, usunięcie czyści blok. Dane pomysłu 4 przywrócone do stanu wyjściowego (3 z 26).
- Zrzuty: `screens/before-*.png` (stary układ), `screens/after-*.png` (wstęp, kroki, partnerzy, podsumowanie, wysoki kontrast, 320 px).

## Nie sprawdzono

- „Podpowiedz” w kroku (rozwinięcie i odpowiedź modelu) — w testach zostało zwinięte; to ten sam `AssistPanel` co wcześniej, teraz z `headingLevel=3`.
- Czytnik ekranu na żywo (NVDA/VoiceOver) — tylko struktura DOM i axe.
- Build produkcyjny w przeglądarce (`make up` :8080) — sprawdzany dev-serwer :5173.
