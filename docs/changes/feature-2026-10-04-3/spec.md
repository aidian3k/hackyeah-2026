# feature-2026-10-04-3 — Kreator: wydruk wniosku 1:1 z wzorem formularza aplikacyjnego IWS

**Status:** wdrożone · **Plan:** [`plan.md`](plan.md)

Uwaga użytkownika po demo K12: „generator pdf powinien się generować dosłownie według wzoru
z `docs/resources/rops/za._3._Formularz_aplikacyjny_wzor.pdf`, a teraz generuje się jakiś taki biedny”.
Dotychczasowy wydruk (`/wnioski/:id` → „Drukuj / zapisz PDF”) to lista pytań i odpowiedzi z jedną tabelą
kosztów — nie przypomina formularza ROPS (16 stron A4).

## Do zmiany

1. **Wydruk wniosku = układ wzoru „Załącznik nr 3 do Ogłoszenia — FORMULARZ APLIKACYJNY”**
   - na każdej stronie pasek logotypów u góry (FE dla Rozwoju Społecznego, RP, UE) i u dołu
     (Małopolska, INNO AGH, ROPS) — grafiki wyjęte z wzoru;
   - blok tytułowy: „Załącznik nr 3 do Ogłoszenia” (do prawej), „FORMULARZ APLIKACYJNY”, akapit
     „Nabór pomysłów na innowacje społeczne… 2021-2027”;
   - punkty 1–12 z numeracją, nazwami i instrukcjami w nawiasach dosłownie jak we wzorze;
   - pkt 2 „Dane pomysłodawcy”: trzy warianty (OSOBA FIZYCZNA a–g, PODMIOT a–k z podpunktami „o”,
     GRUPA NIEFORMALNA a–f) z pustymi liniami do wypełnienia odręcznego — platforma tych danych nie zbiera;
   - pkt 9 „Plan działania i koszty”: „Okres przygotowawczy” i „Okres testowania” z instrukcjami i dwiema
     tabelami o kolumnach wzoru („Działanie (Co zrobisz? Np. …)”, „Termin realizacji (Kiedy? Np. …)”,
     „Koszt działania (Ile to będzie kosztować?)”); w tabeli testowania wiersze „Faza I testu” i
     „Faza II testu”; puste wiersze jak we wzorze, gdy działań jest mniej;
   - pkt 10 „Wnioskowana kwota grantu”: suma kosztów z planu działania;
   - pkt 12 „Oświadczenia”: pełne listy A (osoba fizyczna) i B (reprezentant podmiotu) z punktorami „o”;
   - klauzule informacyjne ROPS i ministra (IZ) z pełną treścią; klauzula IZ od nowej strony, przypisy 1–5
     pod klauzulą;
   - odpowiedzi z wniosku pod instrukcjami punktów; pusty punkt = linie do wypełnienia ręcznie.

2. **Definicja naboru `iws2-demo` zgodna ze wzorem** (zmiany addytywne w API)
   - sekcje w kolejności wzoru z numerami (`number`), nowe sekcje: `plan` (pkt 9, info), `preparation`
     (Okres przygotowawczy, tekst), `budget_prep` / `budget_test` (tabele kosztów, `kind: "budget"`),
     `amount` (pkt 10, `kind: "total"`); `testing` dostaje instrukcję „Okres testowania” ze wzoru;
   - nowy obiekt `form` w `CallFile`/`CallDetail` z tekstami wzoru (nagłówek, warianty danych
     pomysłodawcy, oświadczenia A i B, klauzule);
   - wiersz budżetu ma etap `phase` (`prep` | `test_1` | `test_2`, domyślnie `prep` — stare wiersze
     i stare żądania działają bez zmian); prefill: koszty stałe kanwy → `prep`, zmienne → `test_1`.

3. **Edytor wniosku**
   - sekcje i nagłówki z numeracją wzoru; tabela kosztów rozbita na „Okres przygotowawczy” i „Okres
     testowania” (z wyborem fazy I/II), w miejscu pkt 9; pkt 10 pokazuje sumę i limit;
   - pkt 12 pokazuje skrót oświadczeń i informację, że pełna treść jest w wydruku.

## Kryterium akceptacji

- PDF z Chrome (A4) dla wniosku 1 ma strukturę wzoru: logotypy na każdej stronie, blok tytułowy, punkty
  1–12, tabele planu działania w układzie wzoru, oświadczenia A i B, obie klauzule;
- dane, których platforma nie zbiera (adres, NIP, KRS…), są pustymi liniami;
- stare wiersze budżetu (bez `phase`) wczytują się jako okres przygotowawczy; `ruff check .`,
  `npm run lint`, `npm run build` czyste;
- PDF i zrzuty porównawcze zapisane w tym katalogu.
