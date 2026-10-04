# feature-2026-10-04-8 — plan

## Stan obecny

`web/src/lib/auth.tsx`: konta demo w tablicy `AUTH_ACCOUNTS`, `login()` szuka w niej i zapisuje sesję w `localStorage`.
`web/src/pages/LoginPage.tsx`: formularz login + hasło na Tailwindzie i klasach `ds-*`.

## Kroki

1. `web/src/lib/auth.tsx` — konta założone w przeglądarce (`splot_accounts`, odczyt/zapis w try/catch);
   `findAccount` szuka w kontach demo i założonych; nowa metoda kontekstu
   `register({ email, username, password })` → sesja albo kod błędu (`username_taken`, `email_taken`), zawsze rola `reporter`;
   eksport `registerHref(path)` analogicznie do `loginHref`.
2. `web/src/pages/RegisterPage.tsx` — nowy ekran w układzie `LoginPage`, walidacja pól po stronie przeglądarki.
3. `web/src/App.tsx` — trasa `rejestracja`.
4. `web/src/pages/LoginPage.tsx` — link „Nie masz konta? Załóż konto”.
5. `docs/changes/README.md` — wiersz w indeksie.

## Weryfikacja ręczna

`tsc`, lint, build; zrzut `/rejestracja` z błędami walidacji; rejestracja → wylogowanie → logowanie nowym kontem.

Sprawdzone 2026-10-04 (headless Chrome, build produkcyjny): puste pola i błędne wartości → komunikaty przy polach
i fokus na „E-mail”; login bez reguł znaków, hasło min. 8 znaków; zajęty login (`reporter`) i zajęty e-mail (inna wielkość liter) odrzucone; udana rejestracja
→ sesja `reporter` i powrót na `/`; logowanie nowym kontem (`Jan.Kowalski`, bez rozróżniania wielkości liter);
zrzuty `/rejestracja` i `/login` w motywie jasnym i `data-contrast="high"`. Niesprawdzone: czytnik ekranu, 390 px.
