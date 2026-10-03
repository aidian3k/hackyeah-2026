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

3. **Usunięcie gminy z filtrów** *(Biblioteka: zrobione w Z13, Trendy w panelu: zrobione w Z09; filtry listy zgłoszeń — nadal otwarte)*
   - gmina ma zniknąć także z filtrów list i katalogów,
   - żaden ekran filtrów nie powinien już pokazywać pola `gmina`.

4. **Branding nagłówka — iteracja 2**
   - baner jak nagłówek `rops.krakow.pl`: oficjalny logotyp ROPS (`web/public/rops-logo.png`, w wysokim kontraście `rops-logo-i.png`, pobrane z `rops.krakow.pl/themes/page/images/`) linkujący do `/`,
   - obok logotypu podpis **Dział Innowacji Społecznych** (nazwa działu z podstrony Kontakt ROPS) zamiast „Splot / Hub Innowacji Społecznych”,
   - bez kolorowych pasków; narzędzia (logowanie, kontrast) po prawej, jak pasek narzędzi ROPS,
   - tytuł karty przeglądarki: „… · ROPS Kraków”.

5. **Stopka jak na `rops.krakow.pl`**
   - układ stopki referencji: jasnoszare tło, treść wyśrodkowana, nagłówek **Regionalny Ośrodek Polityki Społecznej w Krakowie**,
   - znacznik i przycisk **Dojazd** (mapa Google, nowe okno), adres `30-070 Kraków, ul. Piastowska 32`, `tel./fax: (+48 12) 422 06 36`, e-mail `biuro@rops.krakow.pl`, linki Facebook i YouTube ROPS,
   - menu stopki z tymi samymi pozycjami i adresami co na `rops.krakow.pl` (O ROPS, Programy i modele, Realizowane projekty i zadania, Zakończone projekty i zadania, Praca w ROPS, Zamówienia publiczne, Kontakt); administrator widzi dodatkowo link do Panelu,
   - logotypy ROPS (link do `/`) i Małopolski (`web/public/malopolska-logo.png`, `rops-marker.png` i warianty `-i` dla wysokiego kontrastu — pobrane z `rops.krakow.pl/themes/page/images/`),
   - na dole link **Polityka prywatności i wykorzystywania plików cookies** (do `rops.krakow.pl`) i dopisek o prototypie,
   - stylowanie wyłącznie Tailwindem (bez klasy `ds-footer`), linki otwierane w nowym oknie mają informację dla czytnika ekranu.

6. **Logo w nagłówku prowadzi na stronę główną**
   - logotyp ROPS i podpis „Dział Innowacji Społecznych” to jeden link do `/`,
   - kliknięcie na stronie głównej z wynikami czatu zaczyna od nowa (czysty formularz, przerwany strumień), a nie zostawia poprzednich wyników.

## Kryterium akceptacji

- nagłówek i logo są zgodne z referencją ROPS,
- w interfejsie nie ma już wyboru gminy,
- w filtrach nie występuje już gmina,
- stopka odpowiada stopce `rops.krakow.pl` (treść, kolejność, logotypy), także w `data-contrast="high"`,
- klik w logo z dowolnego ekranu (także z `/` po wyszukiwaniu) pokazuje czystą stronę główną.
