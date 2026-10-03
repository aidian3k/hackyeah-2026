# Zasoby rops.krakow.pl dla Modułu 2 — Zasobnik wiedzy

Raport kontekstowy z researchu serwisu ROPS Kraków (subagent, 2026-10-04). Zakres zawężony do zasobów przydatnych dla Modułu 2: wyzwania i wskaźniki (A), Biblioteka Innowacji (B), materiały edukacyjne (C), trendy potrzeb (D), automatyczna aktualizacja i licencje. Specyfikacja: [`module-2-zasobnik-wiedzy.html`](module-2-zasobnik-wiedzy.html) (sekcja 6 „Źródła danych”, ADR-M2-007).

**Dostęp:** WebFetch dostaje 403 na rops.krakow.pl; `curl` z nagłówkiem User-Agent przeglądarki działa — strony renderowane po stronie serwera, bez JS. Wszystkie URL-e sprawdzone curl-em (HTTP 200, dla PDF 200/206 `application/pdf`).

## Najważniejsze wnioski

- **„Mapa Wyzwań Społecznych” nie istnieje** w serwisie ROPS (wyszukiwarka serwisu, menu, WebSearch). Jej rolę w praktyce pełni **IOSS** — Internetowy Obserwator Statystyk Społecznych.
- **IOSS ma ok. 180 wskaźników z lat 2007–2024 dla 22 powiatów** (źródło: GUS BDL i sprawozdania OPS) — gotowe dane do mapy kafelkowej; tabela w HTML pod stałym URL.
- **Raporty ROPS 2024–2026 są na licencji CC BY 4.0** — fakty do profili wyzwań można cytować z podaniem źródła.
- **Biblioteka Innowacji ma 115 unikalnych pozycji** — tyle samo, ile mamy w `data/solutions/rops-biblioteka.json`; liczby rzędu 200 nie potwierdzono.
- **Braki:** samotność, wykluczenie cyfrowe, koordynacja międzysektorowa — brak danych per powiat; potrzebne wskaźniki zastępcze i treści opisowe.

## A. Wyzwania Małopolski: Mapa Wyzwań, raporty, wskaźniki

| Zasób | URL | Format | Granulacja / zakres | Wyzwania | Przydatność |
|---|---|---|---|---|---|
| **Internetowy Obserwator Statystyk Społecznych (IOSS)** | https://obserwator.rops.krakow.pl/ (opis: https://rops.krakow.pl/badania-analizy-raporty/internetowy-obserwator-statystyk-spolecznych) | Serwis interaktywny (mapa, wykres, tabela). Wskaźnik: `/differenceanalysis/{id}` (np. 285 = odsetek 65+), tabela w HTML bez JS; `/differenceanalysis/sourcedata` — licznik, mianownik, wartość; formularz eksportu CSV (POST) | Ok. 180 wskaźników, 2007–2024; województwo, **22 powiaty**, gminy (dla 65+ w 2024 na poziomie gmin „Brak danych”). „Portret gminy i powiatu” (`/portrait`). Źródła: GUS BDL, sprawozdania OPS | Starzenie (65+, 60+, indeks starości, podwójne starzenie, potencjał pielęgnacyjny); depopulacja i suburbanizacja (ludność, przyrost naturalny, saldo migracji, gęstość, urbanizacja); usługi społeczne (mieszkańcy na 1 pracownika socjalnego, DDP, DPS, ŚDS, oczekujący na DPS, usługi opiekuńcze); zdrowie psychiczne (osoby z zaburzeniami, specjalistyczne usługi opiekuńcze) | **wysoka** — liczby per powiat do mapy kafelkowej, do zeskrobania z HTML |
| **Ocena zasobów pomocy społecznej (OZPS) za 2025 i 2024** | https://rops.krakow.pl/badania-analizy-raporty/ocena-zasobow-pomocy-spolecznej-w-woj-malopolskim/biezaca-ocena ; PDF 2024: https://rops.krakow.pl/mpliki/PS/BA/Raport_OZPS_za_rok_2024.pdf | PDF 206 s. (2024); 2025: PDF 9,95 MB + infografika PNG z alternatywą tekstową w PDF | Województwo, miejscami powiaty. Rozdziały: „Trendy i wnioski” (s. 9–30), „Rekomendacje” (s. 31–42), seniorzy, OzN, ubóstwo, bezrobocie, kadra, infrastruktura | Starzenie, usługi społeczne, zdrowie psychiczne, koordynacja; wykluczenie cyfrowe wzmiankowo | **wysoka** — kluczowe fakty do profili i gotowe trendy |
| OZPS za lata ubiegłe (2011–2023) | https://rops.krakow.pl/badania-analizy-raporty/ocena-zasobow-pomocy-spolecznej-w-woj-malopolskim/ocena-za-lata-ubiegle | PDF | jw. | jw. | średnia — szereg czasowy do trendów |
| Usługi społeczne w Małopolsce: deficyty, potrzeby, potencjał rozwojowy. Zaktualizowane wnioski z diagnozy (2025) | https://rops.krakow.pl/pliki-do-pobrania/wpis,2025-uslugi-spoleczne-w-malopolsce-deficyty-potrzeby-potencjal-rozwojowy-zaktualizowane-wnioski-z-diagnozy,1348 | PDF 38 s., CC BY 4.0 | Województwo, syntetyczne wnioski | Dostęp do usług, zdrowie psychiczne, starzenie | **wysoka** — krótka synteza do profili |
| Ta sama diagnoza, wersja 2023 (załącznik do RPDI) | https://rops.krakow.pl/pliki-do-pobrania/wpis,2023-uslugi-spoleczne-w-malopolsce-deficyty-potrzeby-potencjal-rozwojowy-zalacznik-do-regionalnego-planu-rozwoju-uslug-spolecznych-na-lata-2023-2025-z-perspektywa-do-2030,855 | PDF 6,9 MB | Województwo, wątki powiatowe | Usługi, starzenie, zdrowie psychiczne | średnia |
| Wyzwania i potrzeby sektora opiekuńczego w Małopolsce (2026) | https://rops.krakow.pl/pliki-do-pobrania/wpis,2026-i-wyzwania-i-potrzeby-sektora-opiekunczego-w-malopolsce-perspektywa-opiekunow-oraz-podmiotow-realizujacych-opieke,1479 | PDF 15 MB, CC BY 4.0 | Województwo (badanie ankietowe) | Starzenie, usługi społeczne | średnia |
| DPS wobec wyzwań deinstytucjonalizacji (2025); Mieszkania wspomagane i treningowe (2025) | lista: https://rops.krakow.pl/badania-analizy-raporty/raporty-z-badan | PDF, CC BY 4.0 | Województwo | Starzenie, usługi | średnia |
| Monitoring współpracy małopolskich JST z PES (cykl 2012–2022) | https://rops.krakow.pl/pliki-do-pobrania/wpis,2022-monitoring-wspolpracy-malopolskich-jst-z-pes,911 | PDF | Województwo | Koordynacja i współpraca międzysektorowa | średnia — jedyne źródło ROPS dla tego wyzwania |
| GUS Kraków: „Sytuacja demograficzna województwa małopolskiego” (2024, 2025) | https://krakow.stat.gov.pl/en/publications/population/demographic-situation-of-malopolskie-voivodship-in-2024,2,19.html ; https://publikacje.new.stat.gov.pl/en/publications-portal/demographic-situation-malopolskie-voivodship-2025 | Strona publikacji z PDF | Powiat / gmina (wg opisu w wyszukiwarce; PDF nieotwierany) | Depopulacja, suburbanizacja, starzenie | **wysoka** — ROPS nie ma nic o depopulacji i suburbanizacji |

## B. Biblioteka Innowacji Społecznych (kontrola)

| Zasób | URL | Stan | Przydatność |
|---|---|---|---|
| **Biblioteka — 9 kategorii** | https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/kategorie | Seniorzy 20, dzieci/młodzież/rodzina 21, ograniczona mobilność 18, niepełnosprawność sensoryczna 20, intelektualna 14, zdrowie 9, cudzoziemcy 6, rynek pracy 5, bezdomność 2. **Razem 115 unikalnych pozycji — tyle samo co w `rops-biblioteka.json`.** Brak paginacji, baner „w przebudowie”. Liczby rzędu 200 nie potwierdzono | wysoka (już mamy) |
| Innowacje w małopolskich modelach | https://rops.krakow.pl/innowacje-spoleczne/innowacje-w-malopolskich-modelach | 9 innowacji senioralnych wdrożonych do modeli usług (Senior Cuder, BaWita, Centrum antydepresyjne…) — kandydat na tag „wdrożone” | średnia |
| IWS 2.0 — lista akcelerowanych innowacji | https://rops.krakow.pl/realizowane-projekty-i-zadania/inkubator-wlaczenia-spolecznego-20,lista-akcelerowanych-innowacji (szczegóły: https://www.innoagh.pl/inkubator-wlaczenia-spolecznego-2-0/lista-akcelerowanych-innowacji-projekt-iws-2-0/) | 6 innowacji: Edki, Strażnik, Merkury (symulator kiosków dla seniorów — wykluczenie cyfrowe), Łazienki modularne, Puzzle 3D, koMIX. Nie sprawdzono, czy są w bibliotece | średnia |

Innych źródeł filmów nie znaleziono. Kanał YouTube ROPS: https://www.youtube.com/channel/UC4KEW7FaoODgDKLxbUwhnVw; `/multimedia/kategoria-filmy` zawiera tylko materiały promocyjne i z wydarzeń.

## C. Materiały edukacyjne (do podlinkowania jako `MATERIAL`)

| Zasób | URL | Format | Wyzwania | Przydatność |
|---|---|---|---|---|
| **SOCIAL CANVAS (INNO AGH)** | https://rops.krakow.pl/pliki-do-pobrania/wpis,social-canvas,1547 | PDF 7,7 MB | Ogólnie — jak projektować innowację | **wysoka** — szukany „Canvas innowacji” |
| **Przewodnik po innowacjach społecznych (MIIS, 2019)** | https://rops.krakow.pl/mpliki/IS/ikony_PUBLIKACJE/InnMalopolska_przewodnik_po_innowacjach.pdf | PDF | Ogólnie, koordynacja (JST inkubuje innowacje) | **wysoka** |
| **„Połącz kropki, czyli o sile innowacji społecznych w obszarze włączenia społecznego” (2023)** | https://rops.krakow.pl/mpliki/IS/PUBLIKACJE_INKUBATOROW/Pocz_kropki_Publikacja_IWS.pdf | PDF | Wiele wyzwań | **wysoka** |
| „Innowacje społeczne dla dostępności” (2022) | https://rops.krakow.pl/mpliki/IS/ikony_PUBLIKACJE/Innowacje_spoleczne_dla_dostepnosci.pdf | PDF | Dostęp do usług, wykluczenie | średnia |
| **Publikacje ze świata innowacji** (strona zbiorcza, także EN „Guide to social innovations”) | https://rops.krakow.pl/innowacje-spoleczne/publikacje-ze-swiata-innowacji | HTML | — | **wysoka** — punkt wejścia |
| **Ramowe Plany Wdrożenia Innowacji** (Usługa Wrażliwa, II nabór 2026): Terapeuta przestrzeni, Organizator kompleksowej opieki, Przenośne łazienki, koMIX, Szlakiem ludzi bezdomnych | https://rops.krakow.pl/nabory-szkolenia-granty-dotacje-wizyty-studyjne-studia-specjalizacje-superwizje/granty-na-innowacje-spoleczne,ii-nabor-wnioskow-na-pilotazowe-wdrozenie-uslug-spolecznych-bazujacych-na-innowacyjnych-rozwiazaniach-w-ramach-projektu-usluga-wrazliwa-upowszechnianie-innowacji-spolecznych-w-srodowiskach-lokalnych (PDF np. https://rops.krakow.pl/pliki-do-pobrania/artykul,ramowy-plan-wdrozenia-terapeuta-przestrzeni,1456) | PDF ok. 800 kB | Starzenie, samotność, dostęp do usług | **wysoka** — praktyczne „jak wdrożyć”, powiązane z biblioteką |
| **Podcast „Społeczny wymiar usług”** (3 odcinki: osoby starsze, chorujący psychicznie, OzN; YouTube z audiodeskrypcją, Spotify) | https://rops.krakow.pl/ekonomia-spoleczna/cykl-podcastow-spoleczny-wymiar-uslug | YouTube / Spotify | Starzenie, zdrowie psychiczne, dostęp do usług | **wysoka** — gotowe filmy edukacyjne |
| „Skąd czerpać dane przy tworzeniu lokalnej diagnozy społecznej? Informator” (2014) | https://rops.krakow.pl/pliki-do-pobrania/wpis,2014-skad-czerpac-dane-przy-tworzeniu-lokalnej-daignozy-spolecznej-informator,953 | PDF | Koordynacja, diagnoza | średnia |
| „Opiekunowie rodzinni osób starszych: problemy, potrzeby, wyzwania” (2015) | https://rops.krakow.pl/pliki-do-pobrania/wpis,2015-opiekunowie-rodzinni-osob-starszych-problemy-potrzeby-wyzwania-dla-polityki-spolecznej,842 | PDF | Starzenie, samotność | średnia |
| Poradniki dla kadr (np. „Mapa pomocy osobom starszym” 2012, „Zdrowie psychiczne w różnorodności form oparcia środowiskowego” 2005, „Model współpracy interdyscyplinarnej” 2011) | https://rops.krakow.pl/dla-kadr-pomocy-spolecznej/poradniki | PDF (starsze) | Starzenie, zdrowie psychiczne, koordynacja | średnia — stare, ale tematycznie pasują |

## D. Agregaty, potrzeby i trendy (administrator)

| Zasób | URL | Format | Przydatność |
|---|---|---|---|
| **OZPS — rozdziały „III Trendy i wnioski” i „IV Rekomendacje”** | https://rops.krakow.pl/mpliki/PS/BA/Raport_OZPS_za_rok_2024.pdf | PDF | **wysoka** — ROPS publikuje roczne trendy; źródło treści do trendów |
| IOSS — tryb „Analiza trendów” | https://obserwator.rops.krakow.pl/trendanalysis | HTML | średnia — szeregi 2007–2024 per powiat |

ROPS nie publikuje osobnego systemu monitoringu potrzeb zgłaszanych przez mieszkańców ani gminy — zagregowane trendy potrzeb dla administratora generujemy z naszej tabeli `reports`.

## Automatyczna aktualizacja

| Zasób | Stan | Przydatność |
|---|---|---|
| **IOSS** | Brak API. Tabela HTML pod stałym URL `/differenceanalysis/{id}`; rok i obszar wybierane formularzem POST (`differenceanalysis[year]`, `differenceanalysis[regions]`). Eksport CSV też POST — próba curl-em bez tokenu zwróciła HTML zamiast CSV, ale tabela HTML wystarcza do scrapera | **wysoka** |
| **GUS BDL API** (`https://bdl.stat.gov.pl/api/v1/...`) | Endpoint działa; trafiono limit „1000 żądań na 12 godz.” (HTTP 429). To samo źródło, z którego korzysta IOSS — oficjalne, z jednostkami per powiat i gmina | **wysoka** — najczystsza droga do aktualizacji wskaźników |
| rops.krakow.pl | **Brak RSS** (`/rss`, `/aktualnosci/rss`: 404), **brak `sitemap.xml` i `robots.txt`** (404). Wyszukiwarka serwisu zwraca JSON: `GET /ajax/get-search?q=…&p=…` | średnia — listy raportów i biblioteki można monitorować scraperem |

## Licencje

| Zasób | Stan |
|---|---|
| Raporty ROPS 2024–2026 | Wprost: **„Publikacja jest udostępniona na podstawie licencji CC BY 4.0”** — sprawdzone m.in. przy: sektor opiekuńczy 2026, Usługi społeczne 2025, Mieszkania wspomagane, DPS, Piecza zastępcza 2024 |
| IOSS | Licencji nie podano; źródło danych: „GUS (Bank Danych Lokalnych)” — dane publiczne |
| Biblioteka, publikacje o innowacjach, Canvas | Licencji nie znaleziono — bezpiecznie linkować, nie kopiować |

## Rekomendacja dla danych Modułu 2

### 1. Mapa kafelkowa 22 powiatów — wskaźniki z IOSS (dane 2024)

Jednorazowo pobrane do `data/knowledge/indicators.json` (skrypt `scripts/fetch_ioss.py`), ze źródłem. Proponowane przyporządkowanie (id wskaźnika IOSS):

| Wyzwanie | Wskaźniki IOSS |
|---|---|
| Starzenie się społeczeństwa | 65+ (285), indeks starości (284), podwójne starzenie (273) |
| Depopulacja | przyrost naturalny (91), saldo migracji stałych (98), ludność ogółem (186) — zmiana r/r |
| Wzrost gmin okołokrakowskich | saldo migracji i dynamika ludności (98, 186) dla krakowskiego i wielickiego wobec reszty, gęstość (7) |
| Dostęp do usług społecznych | mieszkańcy na 1 pracownika socjalnego (27), oczekujący na DPS (172), usługi opiekuńcze (227) |
| Zdrowie psychiczne | id 136 i 228 |

Przykładowe zweryfikowane wartości (65+, 2024): m. Tarnów 24,83%, olkuski 23,56%, miechowski 23,51%, chrzanowski 23,09%, Kraków 19,89%, limanowski 15,07%, nowosądecki 15,12%, wielicki 15,58%.

### 2. Profile wyzwań (kluczowe fakty)

OZPS 2024/2025 („Trendy i wnioski”, np. „841 541 osób 60+ = 24,5%”), diagnoza „Usługi społeczne… 2025” (38 s.) i raport GUS o demografii. Każdy fakt z linkiem do PDF (CC BY 4.0 pozwala cytować).

### 3. Materiały edukacyjne

Social Canvas, Przewodnik po innowacjach, „Połącz kropki”, Ramowe Plany Wdrożenia (5 szt.) i 3 odcinki podcastu na YouTube — wystarczą na sekcję materiałów w demo.

### 4. Do opracowania samodzielnie

- **Samotność:** brak danych regionalnych i per powiat — wskaźnik zastępczy (np. jednoosobowe gospodarstwa 65+, „wsparcie osób najstarszych” id 274) i opis.
- **Wykluczenie cyfrowe:** brak danych per powiat, tylko wzmianki w OZPS.
- **Koordynacja międzysektorowa:** tylko „Monitoring współpracy JST z PES”, bez liczb per powiat do mapy.
- **Suburbanizacja:** do policzenia z danych o ludności i migracji (IOSS lub BDL).
- **Sekcja D:** trendy potrzeb dla administratora generujemy z naszych `reports`; treść oparta na „Trendach i wnioskach” OZPS.

## Niezweryfikowane

- **„Mapa Wyzwań Społecznych”:** nie znaleziono ani w serwisie ROPS, ani w sieci. Może to być planowany produkt Hubu albo nazwa robocza z briefu — warto zapytać ROPS (https://rops.krakow.pl/kontakt/dzial-innowacji-spolecznych).
- **Eksport CSV z IOSS:** formularz istnieje, ale pliku nie udało się pobrać curl-em; tabela HTML działa.
- **Wskaźniki gminne w IOSS:** nie wiadomo, dla których lat i wskaźników są dostępne (65+ w 2024: „Brak danych”).
- **Archiwum `2023.rops.krakow.pl`** (m.in. raport GRS) nie odpowiadało.
- **Raporty GUS Kraków o demografii:** tabele per powiat znane tylko z opisu w wyszukiwarce; PDF-ów nie otwierano.
- **IWS 2.0:** nie sprawdzono, czy 6 akcelerowanych innowacji (Merkury, Strażnik, Edki, Puzzle 3D…) jest już w bibliotece.
- **Małopolskie Obserwatorium Rozwoju Regionalnego** (https://obserwatorium.malopolska.pl/publikacje) — nieprzejrzane pod kątem demografii i suburbanizacji (zawężony zakres).
