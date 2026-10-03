# bugs-2026-10-03-1 — frontend po pierwszym sprincie

**Status:** otwarte (brak planu)

Lista zmian do wdrożenia po pierwszej iteracji frontendu.

## Do zmiany

1. **Branding nagłówka**
   - na `https://rops.krakow.pl` ma być ten sam logotyp co w referencji,
   - nie pokazujemy naszej nazwy,
   - widoczny ma być wyłącznie napis **ROPS**.

2. **Usunięcie wyboru gminy**
   - usuwamy selektor gminy z formularza,
   - UI nie powinno już wymagać ani proponować wyboru gminy.

3. **Usunięcie gminy z filtrów**
   - gmina ma zniknąć także z filtrów list i katalogów,
   - żaden ekran filtrów nie powinien już pokazywać pola `gmina`.

4. **Branding nagłówka — iteracja 2**
   - baner jak nagłówek `rops.krakow.pl`: oficjalny logotyp ROPS (`web/public/rops-logo.png`, w wysokim kontraście `rops-logo-i.png`, pobrane z `rops.krakow.pl/themes/page/images/`) linkujący do `/`,
   - obok logotypu podpis **Dział Innowacji Społecznych** (nazwa działu z podstrony Kontakt ROPS) zamiast „Splot / Hub Innowacji Społecznych”,
   - bez kolorowych pasków; narzędzia (logowanie, kontrast) po prawej, jak pasek narzędzi ROPS,
   - tytuł karty przeglądarki: „… · ROPS Kraków”.

## Kryterium akceptacji

- nagłówek i logo są zgodne z referencją ROPS,
- w interfejsie nie ma już wyboru gminy,
- w filtrach nie występuje już gmina.
