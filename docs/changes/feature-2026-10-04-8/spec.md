# feature-2026-10-04-8 — rejestracja konta reportera

**Status:** wdrożone, do weryfikacji ręcznej

Prośba z przeglądu 2026-10-04: obok logowania można samodzielnie założyć konto — tylko w roli reportera.

## Do zmiany

1. **Ekran „Załóż konto” (`/rejestracja`)**
   - pola: **E-mail**, **Login**, **Hasło**, **Powtórz hasło** — wszystkie wymagane,
   - wygląd jak ekran logowania (ten sam układ `ds-page max-w-lg`, nagłówek z opisem, pola `ds-field`, przycisk `ds-btn--primary`, link powrotu),
   - zakładane konto ma zawsze rolę `reporter`; formularz nie pozwala wybrać roli,
   - po udanej rejestracji użytkownik jest od razu zalogowany i wraca tam, skąd przyszedł (`?next=`), a bez `next` — na stronę główną.
2. **Walidacja (komunikat przy polu, fokus na pierwsze błędne pole)**
   - e-mail w poprawnym formacie,
   - login niepusty, bez reguł co do znaków (decyzja 2026-10-04); nie może być zajęty (konta demo i założone wcześniej, bez rozróżniania wielkości liter),
   - hasło co najmniej 8 znaków, bez innych wymagań (cyfry, znaki specjalne),
   - „Powtórz hasło” takie samo jak hasło,
   - ten sam e-mail nie może założyć drugiego konta.
3. **Powiązanie z logowaniem**
   - na `/login` link „Nie masz konta? Załóż konto” (z zachowaniem `?next=`), na `/rejestracja` link „Masz już konto? Zaloguj się”,
   - założonym kontem można się potem logować loginem i hasłem jak kontem demo.

## Ograniczenia (PoC, zgodnie z AGENTS.md — bez autoryzacji w backendzie)

- Konta zapisują się tylko w tej przeglądarce (`localStorage`, klucz `splot_accounts`), tak jak dziś działa sesja i konta demo; backend o nich nie wie.
- E-mail nie jest wysyłany do API ani weryfikowany (brak wiadomości potwierdzającej).

## Kryterium akceptacji

- z `/login` da się przejść do `/rejestracja`, założyć konto i trafić zalogowanym jako reporter (w banerze „Wyloguj się”, dostęp do „Moje zgłoszenia”),
- po wylogowaniu można zalogować się nowym loginem i hasłem,
- każdy błąd z pkt 2 pokazuje komunikat przy właściwym polu; ekran wygląda poprawnie także w `data-contrast="high"`.
