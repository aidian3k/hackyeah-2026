# implementation-plan — dostęp po rolach

Plan wdrożenia na podstawie aktualnego kodu i `docs/base.md`.

## Stan obecny

- W aplikacji nie ma żadnego systemu logowania ani przechowywania roli.
- `App.tsx` wystawia wszystkie trasy publicznie, także `/panel`.
- `AppShell` i `PanelLayout` pokazują nawigację bez sprawdzania uprawnień.
- Formularze tworzenia treści są otwarte:
  - `IdeaPage` / `IdeaForm` działa bez logowania,
  - `ChatForm` pozwala od razu wysłać zgłoszenie,
  - `MyReportsPage` jest dostępna każdemu.
- Po stronie backendu nie ma obecnie osobnego auth API, więc to powinien być prosty mechanizm PoC po stronie frontendu.

## Założenie implementacyjne

Login ma być prosty i demo-only: dwa przygotowane konta startowe, jedna rola na konto, a stan zalogowania trzymany lokalnie w przeglądarce.

## Plan wdrożenia

1. **Dodać model sesji i ról**
   - wprowadzić typy `Role` / `UserSession`,
   - zdefiniować dwa konta startowe: `administrator` i `reporter`,
   - dodać zapis/odczyt sesji z `sessionStorage` albo `localStorage`.

2. **Zbudować ekran logowania**
   - dodać nową trasę `/login`,
   - przygotować prosty formularz z wyborem konta lub loginem/hasłem demo,
   - po poprawnym logowaniu zapisać rolę i przekierować użytkownika do właściwej części aplikacji.

3. **Wprowadzić ochronę tras**
   - zablokować wejście na ekrany wymagające roli,
   - `administrator` ma mieć dostęp do `/panel`,
   - `reporter` ma mieć dostęp do ekranów dodawania treści,
   - niezalogowany użytkownik trafia na `/login`.

4. **Dopiąć warstwę UI do roli**
   - ukryć lub zablokować akcje niedostępne dla danej roli,
   - w nagłówkach i nawigacji pokazać stan zalogowania oraz wylogowanie,
   - odświeżyć wejścia do stron publicznych tak, żeby zachowywały się sensownie bez sesji.

5. **Zabezpieczyć tworzenie treści**
   - `IdeaPage` ma działać tylko dla `reporter`,
   - tworzenie nowych zgłoszeń z czatu ma być dostępne tylko po zalogowaniu jako `reporter`,
   - `administrator` nie powinien widzieć formularzy tworzenia jako zwykłego użytkownika.

6. **Ujednolicić zachowanie panelu**
   - panel powinien być widoczny tylko dla `administrator`,
   - próba wejścia bez roli ma przekierowywać do logowania,
   - po wylogowaniu aplikacja ma czyścić stan sesji i wracać do loginu.

## Pliki do zmiany

- `web/src/lib/` — stan sesji, typy ról, helpery logowania/wylogowania.
- `web/src/App.tsx` — ochrona tras i przekierowania.
- `web/src/components/layout/` — nawigacja, banner, stany zalogowania.
- `web/src/pages/` — nowy ekran logowania i blokady dla ekranów tworzenia treści.
- `web/src/components/` — formularze i przyciski zależne od roli.
- `web/src/styles/` — drobne style dla loginu i stanów autoryzacji.

## Kolejność prac

1. Typy sesji i storage.
2. Login i wylogowanie.
3. Guardy tras.
4. Warunkowe UI.
5. Ograniczenie formularzy tworzenia.
6. Sprawdzenie nawigacji i dostępów.
