# feature-2026-10-03-1 · plan — dostęp po rolach

Plan wdrożenia na podstawie aktualnego kodu, `docs/base.md` i [`spec.md`](spec.md).

## Iteracja 1 — zrobione (commit `4f08b61`, `bcc049a`)

- `web/src/lib/auth.tsx` — `AuthProvider`, `useAuth`, typ `Role`, sesja w `localStorage`.
- `web/src/pages/LoginPage.tsx` — trasa `/login`.
- `web/src/App.tsx` — `RequireRole` dla `/mam-pomysl`, `/moje-zgloszenia`, `/panel/**`.
- `web/src/components/layout/Banner.tsx` — przycisk logowania/wylogowania i znacznik konta.

## Problemy w iteracji 1

1. **Dane logowania na ekranie.** `LoginPage` wypisuje wszystkie konta z hasłami
   i podpowiada login w polu. To ma zniknąć z UI.
2. **Trzy konta zamiast dwóch.** `AUTH_ACCOUNTS` zawiera dodatkowe konto `ops`.
3. **Ciche przekierowania.** `RequireRole` wyrzuca niezalogowanego na `/login`, a złą rolę
   na stronę domową roli — bez wyjaśnienia. Po logowaniu `LoginPage` zawsze idzie na `roleHome`,
   więc użytkownik traci ekran, na który chciał wejść.
4. **Login poza ramą serwisu.** `/login` nie jest w `AppShell`: brak banera, nawigacji,
   linku „Przejdź do treści” i stopki.
5. **Nadmiar w banerze.** Znacznik „{displayName} · {rola}” — ma zostać tylko „Wyloguj się”.
6. **Nawigacja nie zna ról.** `MainNav` pokazuje zakładki reportera administratorowi
   (prowadzą do przekierowania), `Footer` pokazuje link do panelu wszystkim.
7. **Wylogowanie zawsze na `/login`.** Powinno zostawić na ekranie publicznym.
8. **Zdublowana logika.** `LoginPage.handleSubmit` powtarza `findAccount` z `auth.tsx`
   tylko po to, żeby poznać rolę — `login()` powinien ją zwracać.
9. **Martwy link w panelu.** `ReportPage` → `/mam-pomysl` jest niedostępny dla administratora.
10. **Duplikat planu.** Plan leżał w dwóch miejscach w dawnym katalogu `spec/` — usunięty.

## Iteracja 2 — plan

1. **`lib/auth.tsx`**
   - `AUTH_ACCOUNTS`: tylko `reporter` i `admin`,
   - `login()` zwraca `AuthSession | null` zamiast `boolean`,
   - helper `safeNext(next: string | null): string | null` — przyjmuje tylko ścieżki
     zaczynające się od `/` i nie od `//`.

2. **`components/RequireRole.tsx`** (nowy; wyjęty z `App.tsx`)
   - brak sesji → komunikat `ds-alert` „Ta funkcja wymaga zalogowania” + przycisk
     `ds-btn ds-btn--primary` „Zaloguj się” → `/login?next=<pathname+search>`,
   - zła rola → komunikat „Ta funkcja jest dostępna dla roli {rola}” bez przycisku,
   - zgodna rola → `<Outlet />`,
   - komunikat ma `h1` (fokus z `useRouteFocus`) i `useDocumentTitle`.

3. **`App.tsx` — struktura tras**
   - `/login` wewnątrz `AppShell`,
   - `RequireRole` wewnątrz `AppShell` (dla tras reportera), więc komunikat ma ramę serwisu,
   - dla `/panel/**`: niezalogowany/zła rola → komunikat w `AppShell`;
     administrator → `PanelLayout`. Najprościej: `RequireRole` przyjmuje `layout`
     („shell” | „panel”) albo trasa panelu dostaje własny wrapper renderujący `AppShell`
     z komunikatem zamiast `PanelLayout`.

4. **`pages/LoginPage.tsx` — logika**
   - usunąć sekcję „Konta startowe”, puste pola startowe,
   - nie renderuje własnego `<main>` (daje go `AppShell`),
   - po sukcesie: `navigate(safeNext(next) ?? roleHome(session.role), { replace: true })`,
   - zalogowany wchodzący na `/login` → to samo przekierowanie.

5. **`pages/LoginPage.tsx` — wygląd jak pozostałe strony (klasy Tailwinda)**

   Wzorzec: `IdeaPage` (`styles/idea.css`) i `FindPage` (`styles/chat.css`). Obecny ekran nie ma
   ramy serwisu, a klasy `login-page` / `login-page__form` nie mają żadnych stylów — stąd
   rozjechana szerokość i nagłówek inny niż na pozostałych stronach.

   - **Kontener:** `<div className="ds-page login-page">`, wąska kolumna `max-width: 32rem`
     (formularz z dwoma polami; `IdeaPage` ma 48rem przy długim formularzu).
   - **Nagłówek jak w innych stronach:**
     ```
     <header className="login-page__intro">
       <h1 tabIndex={-1}>Zaloguj się</h1>
       <p className="login-page__lead">Logowanie jest potrzebne, żeby zgłosić pomysł,
          zobaczyć swoje zgłoszenia albo otworzyć Panel administratora.</p>
     </header>
     ```
     `__intro`: flex w kolumnie, `gap: var(--space-3)`, dzieci `margin: 0`;
     `h1`: `font: var(--text-h1); color: var(--navy)`;
     `__lead`: `font: var(--text-body-lg); color: var(--ink)` — 1:1 z `find-page__intro`.
     Bez `ModuleLabel` (logowanie nie jest modułem z `base.md`).
   - **Gdy przyszedł z `?next=`:** nad formularzem `Alert tone="info"`
     „Zaloguj się, aby przejść dalej.” — ten sam komponent co w innych komunikatach.
   - **Formularz:** `<form className="login-form" noValidate>`, flex w kolumnie,
     `gap: var(--space-6)` (jak pola w `idea-group`); pola `ds-field` / `ds-label` / `ds-input`
     bez zmian; bez karty `ds-card` — pozostałe formularze (Kreator, czat) leżą wprost na stronie.
   - **Błąd:** `ds-error` z `role="alert"` pod polem hasła, oba pola dostają
     `aria-invalid="true"` i `aria-describedby` na błąd; fokus wraca na pole loginu.
   - **Przycisk:** jeden `ds-btn ds-btn--primary` „Zaloguj się” (nie CTA — magenta zostaje
     dla głównej akcji serwisu), w kontenerze `login-form__submit` jak `idea-form__submit`.
   - **Pod formularzem:** link `ds-btn ds-btn--link` „Wróć do wyszukiwania” → `/`.
   - **Style:** klasy Tailwinda z presetu design systemu w `className` (bez pliku `.css`),
     np. `max-w-lg`, `flex flex-col gap-3`, `text-h1 text-navy`, `text-body-lg`, `empty:hidden`
     — zasady w `AGENTS.md`, „Stylowanie: Tailwind, bez własnego CSS”.
   - **Sprawdzić:** szerokość 400 px, powiększenie tekstu 200 %, `data-contrast="high"`,
     kolejność fokusu: skip link → baner → nawigacja → h1 → login → hasło → przycisk.

6. **`components/layout/Banner.tsx`**
   - usunąć znacznik z nazwą i rolą,
   - niezalogowany: `Link` „Zaloguj się” → `/login?next=<bieżąca ścieżka>` (pomijany na `/login`),
   - zalogowany: „Wyloguj się”; po kliknięciu: jeśli ścieżka to `/mam-pomysl`,
     `/moje-zgloszenia` albo `/panel/**` → `navigate("/")`, inaczej zostaje.

7. **`components/layout/MainNav.tsx` i `Footer.tsx`**
   - administrator: ukryć „Kreator” i „Moje zgłoszenia”, dodać „Panel administratora” → `/panel`,
   - `Footer`: link do panelu tylko dla administratora.

8. **`pages/panel/ReportPage.tsx`**
   - usunąć link „Dodaj rozwiązanie do biblioteki” (zostaje tekst o luce w bibliotece).

9. **`README.md`** — sekcja „Konta demo” z loginami i hasłami obu kont.

10. **Porządek** — usunąć duplikat planu (zrobione; `spec/` przeniesiony do `docs/changes/`).

## Poza zakresem

- Czat (`/`) pozostaje publiczny — zapis zgłoszenia jest anonimowy i bezwarunkowy (Moduł 1).
- Brak backendowego auth API; to nadal mechanizm demo po stronie frontendu
  (hasła w bundlu JS — akceptowane w PoC hackathonowym).

## Weryfikacja ręczna

- `/` bez logowania: w banerze tylko „Zaloguj się”, czat działa.
- `/mam-pomysl` bez logowania: komunikat z przyciskiem → login → powrót na `/mam-pomysl`.
- `/panel/trendy` jako reporter: komunikat o roli, brak przekierowania.
- `/login`: brak kont i haseł na ekranie, baner i nawigacja widoczne, nagłówek i odstępy
  takie jak na „Mam pomysł”.
- Administrator: w nawigacji „Panel administratora”, brak „Kreator”/„Moje zgłoszenia”.
- Wylogowanie na `/rozwiazania` zostawia na `/rozwiazania`; na `/panel` przenosi na `/`.
- Tryb wysokiego kontrastu i nawigacja klawiaturą na komunikacie i ekranie logowania.
