# bugs-2026-10-03-1 — plan (pkt 2 i 7: formularz „Opisz problem”)

## Stan obecny

`ChatForm.tsx` ma cztery bloki o równej wadze: opis, szary baner prywatności, cztery chipy przykładów,
`GminaSelect`, `ReporterTypeField` (4 radia, ostatnie w osobnym wierszu) i dopiero na końcu CTA.
Kolumna 48rem przy lewej krawędzi, prawa połowa ekranu pusta. Style w `web/src/styles/chat.css` (dziedzictwo).

## Kroki

1. `web/src/components/chat/ChatForm.tsx` — usuń `GminaSelect`, `ReporterTypeField`, stan `gmina`/`reporterType`
   i obsługę 422 dla gminy; `onSubmit({ message })`. Opis + licznik + CTA w jednej karcie
   (`rounded-lg border bg-surface shadow-card`), prywatność jako podpowiedź z ikoną pod polem
   (dalej w `aria-describedby`), chipy pod kartą. Tailwind zamiast klas `chat-form__*`.
2. `web/src/pages/FindPage.tsx` — nagłówek na Tailwindzie, sekcja „Jak to działa” (3 kroki) tylko przy `phase === "idle"`.
3. Usuń `web/src/styles/chat.css` (nikt inny go nie importuje).
4. `ReporterTypeField.tsx` i `GminaSelect.tsx` zostają — używa ich `NewThreadPage`, `IdeaForm`, `ReportFilters`.

## Weryfikacja ręczna

`npm run build` w `web/`, zrzuty ekranu `/` (1440 px i 390 px, także `data-contrast="high"`),
wysłanie opisu i sprawdzenie, że strumień wyników działa jak wcześniej.
