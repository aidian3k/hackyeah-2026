# feature-2026-10-04-6 — Tester: krótszy formularz zgłoszenia i czytelna walidacja

**Status:** wdrożone, do weryfikacji ręcznej

Uwagi z przeklikania Modułu 4: formularz zgłoszenia do testu wymaga za dużo danych (województwo, powiat, gmina,
uzasadnienie), pole „Typ testera” jest niezrozumiałe, a błędy pokazują się jednym ogólnym alertem
z technicznym komunikatem backendu (np. `powiat: String should have at least 2 characters`).

## Do zmiany

1. **Mniej danych (zmienia ustalenie z planu M4: „minimalne dane: … województwo/powiat/gmina, … uzasadnienie”)**
   - Obowiązkowe są tylko: imię lub nazwa organizacji, e-mail, zgoda.
   - Pola „Województwo”, „Powiat”, „Gmina” zastępuje jedno pole **„Adres (opcjonalnie)”** (wolny tekst,
     do 300 znaków), z podpowiedzią, że wystarczy miejscowość.
   - „Dlaczego chcesz przetestować rozwiązanie?” jest opcjonalne, bez minimalnej długości.
   - „Należę do grupy docelowej” zostaje (checkbox, domyślnie odznaczony).
2. **Typ testera po ludzku**
   - Etykieta pola: „Zgłaszam się jako”; opcje opisowe (np. „Mieszkaniec lub mieszkanka”,
     „Organizacja pozarządowa”, „Urząd gminy lub inny samorząd”).
   - Formularz nie oferuje opcji „Osoba z grupy docelowej” — dubluje checkbox. Wartość `TARGET_MEMBER` zostaje
     w API i bazie (stare zgłoszenia, panel).
3. **Walidacja przyjazna użytkownikowi** (wzór: `IdeaForm` z Modułu 3)
   - Błąd pod konkretnym polem, po polsku, z przykładem (np. „Sprawdź adres e-mail, np. jan@example.pl.”);
     pole ma `aria-invalid` i `aria-describedby` na komunikat.
   - Po próbie wysłania fokus przechodzi na pierwsze błędne pole, a czytnik ekranu słyszy „Popraw N pola”.
   - Błąd 422 z backendu trafia pod właściwe pole, nie do ogólnego alertu; ogólny alert tylko dla błędów
     bez pola (409 limit zgłoszeń, sieć, 5xx).
   - Obowiązkowe pola bez gwiazdek, opcjonalne z dopiskiem „(opcjonalnie)”, jak w Kreatorze.
4. **Dane i AI**
   - Adres jest daną kontaktową: widzi go tylko panel Hubu i **nie trafia do promptu AI** (jak e-mail i imię,
     TI08). Sugestia dopasowania korzysta z typu testera, przynależności do grupy docelowej i uzasadnienia.
   - Panel Hubu pokazuje adres (lub „—”) zamiast „gmina, powiat”; filtr lokalizacji przeszukuje adres.
   - Istniejące bazy migruje idempotentny `db/m4-tester.sql` (`make db-m4`) bez utraty zgłoszeń.

## Kryterium akceptacji

- Zgłoszenie z samym imieniem, e-mailem i zgodą przechodzi (`curl` → 201) i pojawia się w panelu.
- Wysłanie pustego formularza pokazuje błędy pod trzema polami, fokus jest na „Imię lub nazwa organizacji”;
  żaden komunikat nie zawiera nazwy pola z API ani tekstu po angielsku.
- Prompt sugestii AI nie zawiera adresu, e-maila ani imienia.
- `make db-m4` na bazie z danymi demo przenosi gminę/powiat/województwo do `address` i daje się uruchomić
  ponownie bez błędu; świeża baza (`make reset-db`) startuje bez błędu.
