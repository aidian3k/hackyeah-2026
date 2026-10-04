# feature-2026-10-04-2 — ułatwienia dostępu jak na rops.krakow.pl

**Status:** wdrożone, do weryfikacji ręcznej

Porównanie z paskiem narzędzi `rops.krakow.pl` (2026-10-04): duży przycisk „Wysoki kontrast” zastępujemy
rzędem małych przycisków-ikon, dokładamy brakujące ułatwienia, które da się dodać bez backendu.

## Porównanie

| Ułatwienie | rops.krakow.pl | HubMI przed zmianą | Po zmianie |
|---|---|---|---|
| Link „Przejdź do treści” | tak | tak (`ds-skip-link`) | bez zmian |
| Link do informacji o dostępności (ikona wózka) w nagłówku | tak → `/udogodnienia-dla-niepelnosprawnych` | brak | **poza zakresem** (decyzja 2026-10-04) — deklaracja tylko ze stopki |
| Rozmiar tekstu | 3 przyciski A−, A, A+ | brak (tylko zoom przeglądarki) | 3 przyciski A, A+, A++ (bez pomniejszania poniżej 16 px) |
| Wersja kontrastowa | mała ikona | duży przycisk z tekstem „Wysoki kontrast” | mała ikona z `aria-pressed` |
| Deklaracja dostępności w stopce | tak | brak | link „Deklaracja dostępności” → `/dostepnosc` |
| Logotypy w wersji kontrastowej (`-i.png`) | tak | tak | bez zmian |
| „Otwiera się w nowym oknie” dla linków zewnętrznych | tak (w `alt`) | tak | bez zmian |
| Wersja angielska (EN) | tak | brak | **poza zakresem** (brak tłumaczeń treści) |
| Wyszukiwarka w nagłówku | tak | brak (szukanie w Bibliotece) | **poza zakresem** |

## Do zmiany

1. **Pasek ułatwień w banerze**
   - zamiast przycisku z napisem „Wysoki kontrast” rząd małych przycisków (36 × 36 px, ≥ 24 px wymagane przez WCAG 2.5.8) w grupie „Ułatwienia dostępu”: A / A+ / A++, kontrast (ikona),
   - każdy przycisk ma nazwę dla czytnika ekranu (np. „Większy tekst”) i podpowiedź `title`; wybrany rozmiar i kontrast mają `aria-pressed="true"`,
   - „Zaloguj się / Wyloguj się” zostaje przyciskiem z tekstem obok paska.
2. **Rozmiar tekstu**
   - trzy poziomy: podstawowy (100%), większy (115%), największy (130%) — skalowanie całego interfejsu (`zoom` na `<html>`), więc rosną też odstępy i kontrolki,
   - wybór zapamiętany w przeglądarce (`splot_text_size`) i ustawiany przed renderem w `index.html`, bez mignięcia,
   - przy 130% i szerokości 390 px brak przewijania w poziomie (WCAG 1.4.10).
3. **Strona „Deklaracja dostępności” (`/dostepnosc`)** — tylko z linku w stopce (bez ikony w nagłówku, decyzja 2026-10-04)
   - krótka deklaracja dostępności prototypu: cel WCAG 2.1 AA, lista ułatwień, obsługa klawiaturą, kontakt do ROPS i link do udogodnień na `rops.krakow.pl`,
   - nie twierdzimy, że serwis przeszedł audyt (i nie piszemy o jego braku — decyzja 2026-10-04).
4. **Stopka** — link „Deklaracja dostępności” do `/dostepnosc` obok polityki prywatności.

## Kryterium akceptacji

- w banerze nie ma już szerokiego przycisku „Wysoki kontrast”; jest rząd małych ikon, obsługiwany klawiaturą (Tab, Enter/Spacja), z widocznym fokusem,
- A+ / A++ powiększają interfejs, wybór przetrwa odświeżenie strony, A wraca do 100%,
- kontrast działa jak wcześniej (ten sam klucz `splot_contrast`),
- `/dostepnosc` otwiera się z linku w stopce, także w `data-contrast="high"`.
