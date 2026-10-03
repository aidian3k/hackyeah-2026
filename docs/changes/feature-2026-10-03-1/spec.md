# feature-2026-10-03-1 — dostęp po rolach

**Status:** wdrożone, czeka na weryfikację ręczną w przeglądarce · **Plan:** [`plan.md`](plan.md)

Lista zmian do wdrożenia po pierwszej iteracji frontendu.

## Do zmiany

1. **Dwa typy użytkowników**
   - aplikacja ma rozróżniać dokładnie dwie role: **administrator** i **reporter**,
   - zgodnie z `docs/base.md` administrator ma dostęp do panelu i widoku administracyjnego,
   - reporter korzysta z części użytkownika i może dodawać nowe zgłoszenia oraz pomysły.

2. **Prosty ekran logowania**
   - dodajemy prosty ekran logowania,
   - każda rola ma dokładnie jedno konto startowe (razem dwa konta),
   - po zalogowaniu użytkownik widzi tylko te akcje i ekrany, które wynikają z jego roli.

3. **Ograniczenie dodawania treści**
   - dodawanie nowych rzeczy ma być możliwe tylko po zalogowaniu jako reporter,
   - administrator nie powinien używać formularzy tworzenia zgłoszeń jako zwykły użytkownik.

4. **Dostęp publiczny**
   - użytkownik bez logowania nadal może wejść na stronę główną,
   - może też przeglądać i wyszukiwać rozwiązania oraz wiedzę,
   - blokujemy tylko akcje wymagające wysłania danych: zgłoszenia, pomysły i panel administratora.

5. **Logowanie w tle, nie na pierwszym planie** (iteracja 2)

   Logowanie ma być niewidoczne, dopóki nie jest potrzebne. Interfejs nie pokazuje danych kont,
   haseł, nazwy użytkownika ani roli.

   - **Jedyne stałe wejście:** mały przycisk „Zaloguj się” (`ds-btn ds-btn--small`, nie CTA)
     w narzędziach banera. Po zalogowaniu na jego miejscu jest wyłącznie „Wyloguj się”
     — bez znacznika z nazwą konta i rolą.
   - **Logowanie przy akcji:** wejście niezalogowanego użytkownika na ekran wymagający roli
     nie przekierowuje na `/login`. Ekran renderuje się w ramie serwisu (baner, nawigacja, stopka)
     i w miejscu treści pokazuje komunikat „Ta funkcja wymaga zalogowania” z jednym zdaniem
     wyjaśnienia i przyciskiem „Zaloguj się”. Dotyczy:
     - `/mam-pomysl` (Kreator) — reporter,
     - `/moje-zgloszenia` — reporter,
     - `/panel/**` — administrator.
   - **Powrót po zalogowaniu:** przycisk prowadzi do `/login?next=<ścieżka>`. Po udanym logowaniu
     użytkownik wraca pod `next` (tylko ścieżki wewnętrzne zaczynające się od `/`), a gdy go
     brak — na stronę domową swojej roli.
   - **Zła rola:** zalogowany użytkownik z inną rolą widzi komunikat „Ta funkcja jest dostępna
     dla roli …” bez przycisku logowania i bez cichego przekierowania.
   - **Ekran logowania:** w ramie serwisu (`AppShell`), pola login i hasło są puste,
     brak listy kont demo i haseł na ekranie. Dane kont startowych są wyłącznie
     w dokumentacji (README, sekcja „Konta demo”).
   - **Nawigacja wg roli:**
     - niezalogowany i reporter: zakładki publiczne + „Kreator” i „Moje zgłoszenia”
       (niezalogowany po kliknięciu dostaje komunikat z przyciskiem „Zaloguj się”),
     - administrator: zakładki publiczne + „Panel administratora”; bez zakładek reportera,
     - link do panelu w stopce widoczny tylko dla administratora.
   - **Wylogowanie:** czyści sesję; na ekranie publicznym użytkownik zostaje, na ekranie
     wymagającym roli wraca na `/`. Nie przenosi na `/login`.
   - **Wyszukiwanie (czat) zostaje publiczne.** Zapis zgłoszenia z czatu jest bezwarunkowy
     i anonimowy (reguła Modułu 1), więc czat nie wymaga logowania. Punkt 3 dotyczy formularzy
     tworzenia treści (Kreator), nie wyszukiwania.
   - **Linki wewnątrz panelu do ekranów reportera** (np. „Dodaj rozwiązanie do biblioteki”
     w `ReportPage` → `/mam-pomysl`) usuwamy — administrator nie ma tam dostępu.

## Kryterium akceptacji

- są dokładnie dwa konta startowe: administrator i reporter,
- istnieje prosty ekran logowania bez danych kont i haseł na ekranie,
- panel administracyjny jest dostępny dla administratora,
- formularze dodawania treści działają tylko dla roli reporter,
- użytkownik bez logowania może wejść na stronę główną oraz przeglądać i wyszukiwać treści,
- bez logowania jedynym elementem logowania w UI jest przycisk „Zaloguj się” w banerze
  oraz komunikat z przyciskiem na ekranach wymagających roli,
- po zalogowaniu z komunikatu użytkownik wraca na ekran, z którego przyszedł,
- w UI nie widać nazwy konta ani roli; widać tylko „Wyloguj się”.
