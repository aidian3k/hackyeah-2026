# feature-2026-10-04-2 — plan

## Stan obecny

`Banner.tsx` → `ContrastToggle` (`ds-btn ds-btn--small` z tekstem). Rozmiar tekstu: brak; typografia w px
(`tokens.css`, preset Tailwinda), więc zmiana `font-size` na `<html>` nic by nie dała — skalujemy `zoom`.

## Kroki

1. `web/src/lib/storage.ts` — `getTextSize()` / `setTextSize()` (klucz `splot_text_size`, wartości `normal | large | xlarge`, try/catch).
2. `web/src/hooks/useTextSize.ts` — jak `useContrast`: atrybut `data-text-size` na `<html>` + zapis.
3. `design-system/components.css` — `:root[data-text-size="large"] { zoom: 1.15 }`, `xlarge` → 1.3 (jedyne nowe reguły CSS, w design systemie).
4. `web/index.html` — skrypt inline ustawia `data-text-size` przed renderem (obok kontrastu).
5. `web/src/components/layout/AccessibilityToolbar.tsx` — nowy pasek (A/A+/A++, kontrast) na Tailwindzie; `ContrastToggle.tsx` usunięty.
6. `Banner.tsx` — `AccessibilityToolbar` zamiast `ContrastToggle`; paski marki ukryte przy `data-text-size` (przy powiększeniu zachodziły na podpis „Dział Innowacji Społecznych”).
7. `web/src/pages/AccessibilityPage.tsx` + trasa `dostepnosc` w `App.tsx` (bez ikony w nagłówku).
8. `Footer.tsx` — link „Deklaracja dostępności”.
9. `docs/changes/README.md` — wiersz w indeksie.

## Weryfikacja ręczna

Sprawdzone 2026-10-04: build, zrzut banera (1440 px) w trybie podstawowym oraz w `data-contrast="high"` + A++.
Niesprawdzone: obsługa klawiaturą w realnej przeglądarce, czytnik ekranu, A++ przy 390 px.

Plan weryfikacji:

`npm run build`; zrzuty banera (1440 px), klik A++ i odświeżenie, `data-contrast="high"`.
