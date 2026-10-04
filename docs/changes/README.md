# Zmiany po sprincie

Zgłoszenia zmian, które przychodzą po zamknięciu planu modułu (uwagi z demo, poprawki, nowe wymagania).
Duże, nowe funkcjonalności trafiają do `docs/modules/` (specyfikacja + plik zadań); tutaj — wszystko,
co zmienia już zbudowane ekrany lub zachowanie.

## Indeks

| ID | Tytuł | Status | Pliki |
|---|---|---|---|
| `feature-2026-10-03-1` | Dostęp po rolach, logowanie w tle | wdrożone, do weryfikacji ręcznej | [spec](feature-2026-10-03-1/spec.md), [plan](feature-2026-10-03-1/plan.md) |
| `feature-2026-10-04-1` | Rozmowy M5 jak komunikator | wdrożone | [spec](feature-2026-10-04-1/spec.md), [plan](feature-2026-10-04-1/plan.md) |
| `feature-2026-10-04-2` | Ułatwienia dostępu jak na rops.krakow.pl (rozmiar tekstu, kontrast jako małe ikony, deklaracja w stopce) | wdrożone, do weryfikacji ręcznej | [spec](feature-2026-10-04-2/spec.md), [plan](feature-2026-10-04-2/plan.md) |
| `bugs-2026-10-03-1` | Frontend po pierwszym sprincie (branding ROPS, usunięcie gminy, prostszy formularz) | w toku | [spec](bugs-2026-10-03-1/spec.md), [plan](bugs-2026-10-03-1/plan.md) |
| `feature-2026-10-04-3` | Funkcje AI na OpenAI (jeden dostawca dla LLM i embeddingów) | wdrożone | [spec](feature-2026-10-04-3/spec.md), [plan](feature-2026-10-04-3/plan.md) |
| `feature-2026-10-04-4` | Kreator: kanwa krok po kroku z grafiką jak w Social Canvas | wdrożone | [spec](feature-2026-10-04-4/spec.md), [plan](feature-2026-10-04-4/plan.md) |
| `feature-2026-10-04-5` | Kreator: wydruk wniosku 1:1 z wzorem formularza aplikacyjnego IWS | wdrożone | [spec](feature-2026-10-04-5/spec.md), [plan](feature-2026-10-04-5/plan.md) |
| `feature-2026-10-04-6` | Tester: krótszy formularz zgłoszenia (opcjonalny adres) i czytelna walidacja | wdrożone, do weryfikacji ręcznej | [spec](feature-2026-10-04-6/spec.md), [plan](feature-2026-10-04-6/plan.md) |
| `feature-2026-10-04-7` | Tester: ankieta po teście krok po kroku (kontekst, kafelki ocen, podsumowanie) | wdrożone, do weryfikacji ręcznej | [spec](feature-2026-10-04-7/spec.md), [plan](feature-2026-10-04-7/plan.md) |

Statusy: `otwarte` → `zaplanowane` (jest `plan.md`) → `w toku` → `wdrożone` → `zweryfikowane`.
Zmieniając status, popraw go w tej tabeli **i** w linii `**Status:**` pod tytułem `spec.md`.

## Struktura

```
docs/changes/
  <typ>-<RRRR-MM-DD>-<n>/     # typ: feature | bugs | chore; n — kolejny numer danego dnia
    spec.md                   # CO i DLACZEGO: lista zmian + kryterium akceptacji
    plan.md                   # JAK: stan obecny, kroki, pliki, weryfikacja ręczna (opcjonalny)
```

## Przebieg pracy

1. **Spec najpierw.** Nowa zmiana = nowy katalog i `spec.md` według szablonu poniżej, wiersz w indeksie.
   Uzupełnienie istniejącej zmiany = nowy punkt w jej `spec.md` (z dopiskiem „iteracja N”).
2. **Plan przed kodem**, gdy zmiana dotyka więcej niż jednego pliku: `plan.md` w tym samym katalogu.
3. **Implementacja** zgodnie z `AGENTS.md`. Odejście od planu → popraw `plan.md`, nie tylko kod.
4. **Zamknięcie:** status w obu miejscach, w `plan.md` krótko, co sprawdzono ręcznie, a czego nie.

Zmiana decyzji `stable` ze specyfikacji modułu nadal wymaga ADR i wpisu w „Uwagach między zadaniami”
pliku zadań modułu — `docs/changes/` tego nie zastępuje.

## Szablon `spec.md`

```markdown
# <id> — <krótki tytuł>

**Status:** otwarte

<Jedno zdanie kontekstu: skąd zmiana.>

## Do zmiany

1. **<Obszar>**
   - <konkretne, sprawdzalne wymaganie>

## Kryterium akceptacji

- <co musi być prawdą, żeby uznać zmianę za wdrożoną>
```
