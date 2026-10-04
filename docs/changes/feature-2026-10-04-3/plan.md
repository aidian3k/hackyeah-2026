# feature-2026-10-04-3 — plan

## Stan obecny

- `web/src/pages/ApplicationPage.tsx` — edytor i (w tym samym pliku) wersja do druku `hidden print:block`:
  tytuł naboru, sekcje `i+1. title` z pytaniem kursywą i odpowiedzią, jedna tabela „Działanie / Termin /
  Koszt” z sumą, stopka „dokument roboczy”.
- `data/calls/iws2-demo.json` — 11 sekcji (bez pkt 9–10 wzoru jako sekcji; budżet poza listą sekcji),
  `statements` — 6 skróconych oświadczeń.
- `BudgetRow {action, when, cost}` bez etapu, więc nie da się odtworzyć dwóch tabel pkt 9 wzoru.

## Wzór (16 stron A4, Calibri 11 pt)

Str. 1–2: logotypy, blok tytułowy, pkt 1–2 (dane pomysłodawcy: trzy warianty, same etykiety);
str. 2–5: pkt 3–8 (nagłówek pogrubiony + instrukcja w nawiasie), pkt 9 z dwiema tabelami 3-kolumnowymi
(przygotowanie: nagłówek + 3 puste wiersze; testowanie: nagłówek, „Faza I testu” + 2 puste, „Faza II
testu” + 2 puste), pkt 10–11; str. 5–9: pkt 12 oświadczenia A i B (punktory „o”); str. 9–12: klauzula
ROPS; str. 13–16: klauzula IZ (od nowej strony) z przypisami. Brak numerów stron, pól podpisu i pieczęci.

## Kroki

1. **Backend (addytywnie)** — `api/kreator/schemas.py`:
   - `CallSectionKindLiteral` += `budget`, `total`; `CallSection` += `number: str | None`,
     `form_prompt: str | None` (instrukcja wzoru, gdy inna niż `prompt`; `""` = brak), `form_inline: bool`
     (instrukcja w tej samej linii co nazwa, jak pkt 1–2), `budget_phases: list[BudgetPhase]`;
   - `BudgetPhaseLiteral = prep | test_1 | test_2`; `BudgetRow.phase` domyślnie `prep`;
   - `CallForm` (annex_label, title, intro, applicant_variants, statement_sets, clauses) i
     `CallFile.form` / `CallDetail.form: CallForm | None`.
   - `api/kreator/calls.py`: walidacja — sekcja `budget` musi mieć `budget_phases`, inne nie;
     `call_detail` przekazuje `form`.
   - `api/kreator/prefill.py`: `costs_fixed` → `prep`, `costs_variable` → `test_1`.
   - `api/routers/applications.py`: bez zmian (kontrole liczą tylko `text`; `_text_section_or_422` odrzuca
     nowe rodzaje sekcji jak `info`).
2. **`data/calls/iws2-demo.json`** — sekcje w kolejności wzoru z `number`, instrukcje dosłownie ze wzoru
   (`prompt` tam, gdzie wzór pyta o to samo, co edytor; `form_prompt` dla `applicant` i `statements`),
   obiekt `form` z tekstami wzoru (z `pdftotext`).
3. **TS** — `web/src/api/types.ts`: lustro typów (`CallSectionKind`, `CallSection`, `BudgetPhase`,
   `BudgetRow.phase`, `CallForm`…).
4. **Druk** — nowy `web/src/components/application/ApplicationPrint.tsx` (sam Tailwind, `hidden print:block`):
   - logotypy w `thead`/`tfoot` tabeli-ramy (Chrome powtarza je na każdej stronie); grafiki
     `web/src/assets/iws2/naglowek.jpg`, `stopka.png` wyjęte z wzoru (`pdfimages`);
   - tekst `text-small` (14 px ≈ Calibri 11 pt), `leading-loose` jak interlinia wzoru;
   - tabele pkt 9 z kolumnami wzoru, puste wiersze do minimum wzoru; `break-before-page` przed klauzulą IZ.
   - Ograniczenie: Tailwind nie generuje reguły `@page` (to at-rule bez selektora), a `AGENTS.md`
     zabrania własnego CSS — rozmiar A4 i marginesy ustawia okno drukowania (domyślnie A4 w polskich
     ustawieniach, marginesy „domyślne” ≈ 1 cm); poziome wcięcie wzoru (~2,5 cm) daje `print:px-*`.
     Wzór nie ma numerów stron, więc brak `@page` nic nie odbiera.
5. **Edytor** — `ApplicationPage.tsx`: numeracja z `number`, sekcje `budget` renderują `BudgetRows` dla
   swoich etapów (filtr + scalanie), sekcja `total` — suma i limit; spis sekcji bez osobnej pozycji budżetu.
   `BudgetRows.tsx`: props `phases`, `title`, `intro`, wybór fazy I/II w tabeli testowania. `SectionEditor`:
   numer z `number`.
6. **Dokumentacja** — kontrakty K05/K12 w „Uwagach między zadaniami” M3 (`[feature-2026-10-04-3 → K05, K12, K13]`).

## Weryfikacja ręczna

- `ruff check .`, `cd web && npm run lint && npm run build`;
- restart api, `GET /api/calls/iws2-demo` (nowe pola), `GET /api/applications/1` (stare wiersze → `prep`);
- PATCH wniosku 1 realistyczną treścią, PDF z własnego headless Chrome (`Page.printToPDF`, A4) z buildu,
  `pdftoppm` i porównanie stron ze wzorem; PDF i PNG w tym katalogu.

## Wykonanie i weryfikacja (2026-10-04)

Zgodnie z planem, z dwoma doprecyzowaniami: `CallForm` ma też `logos` (zestaw logotypów, `"iws2"` →
`web/src/assets/iws2/`) i `budget_headers` (dosłowne nagłówki kolumn obu tabel pkt 9, per id sekcji `budget`).
Logotypy powtarzane na każdej stronie przez `position: fixed` (`print:` — Chrome rysuje je na każdej stronie),
a niewidoczne kopie w `thead`/`tfoot` tabeli-ramy rezerwują miejsce, żeby treść na nie nie wchodziła.

Sprawdzone:
- `ruff check .` i `ruff format --check api/kreator` — czysto; `npm run lint`, `npm run build` — czysto;
- po restarcie api: `GET /api/calls/iws2-demo` zwraca 16 sekcji z `number`/`kind` i `form`;
  `GET /api/applications/1` — stare wiersze budżetu bez `phase` wczytane jako `prep`;
- PATCH wniosku 1 (odpowiedzi `innovation`, `preparation`, `testing`, 8 wierszy budżetu w 3 etapach,
  suma 65 000 zł) → `checks: []`;
- PDF z własnego headless Chrome 136 (`Page.printToPDF`, A4, marginesy 0,4″, `preferCSSPageSize`) z buildu
  (`vite preview`) — [`wydruk-wniosek-1.pdf`](wydruk-wniosek-1.pdf), 17 stron (wzór: 16); porównania
  stron wzoru (po lewej) i wydruku (po prawej): `porownanie-s1-blok-tytulowy.png`,
  `porownanie-pkt9-plan-dzialania.png`, `porownanie-pkt12-oswiadczenia.png`, `porownanie-klauzula-iz.png`;
- edytor: pkt 9 z dwiema tabelami (wybór „Faza I/II testu” w tabeli testowania), pkt 10 z sumą i limitem,
  spis sekcji z numeracją wzoru (zrzut ekranu, bez axe).

Różnice wobec wzoru, które zostają:
- krój: Atkinson Hyperlegible z design systemu zamiast Calibri (zakaz wartości dowolnych dla tokenów);
  `text-small` 14 px ≈ Calibri 11 pt, interlinia `leading-loose` jak we wzorze; stąd 17 zamiast 16 stron;
- przypisy klauzuli IZ stoją pod klauzulą, nie u dołu strony 13 (CSS druku w Chrome nie ma przypisów);
- brak `@page`: rozmiar i marginesy z okna drukowania (Chrome w polskich ustawieniach: A4, marginesy
  domyślne); wzór nie ma numerów stron ani pól podpisu/pieczęci, więc wydruk też ich nie ma;
- puste linie (kropkowane) przy polach danych pomysłodawcy i pustych punktach — we wzorze są same etykiety,
  linie ułatwiają wypełnienie odręczne; tabele pkt 9 dopełniane pustymi wierszami do minimum wzoru;
- na końcu jedna linia „Wydruk z Kreatora pomysłów (Splot) — dokument roboczy…” ze stanem na datę zapisu
  (zamiast stopki K12); nagłówek kolumn tabel nie powtarza się na kolejnej stronie (jak we wzorze),
  a może oderwać się od pierwszego wiersza na granicy stron.
