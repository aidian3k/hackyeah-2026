# Prezentacja dla jury — plan slajdów

Plan prezentacji Splotu na HackYeah 2026 (wyzwanie ROPS Kraków). Stan aplikacji: 2026-10-04, master `a3aa01e`. Teksty w cudzysłowach to napisy z interfejsu — sprawdzone w kodzie.

## Ograniczenia z regulaminu (`docs/base.md` §4, §8)

- Oddajemy **PDF do 10 slajdów albo film do 3 minut** (jedno z dwóch). Plan zakłada PDF jako główny materiał (pptx → PDF); kolejność kliknięć niżej służy do pokazu na żywo albo filmu. Czas wystąpienia na żywo sprawdzić u organizatorów.
- Obowiązkowo w materiałach: nazwa i opis, link do demo **i makiet UX/UI**, **koszt utrzymania i potrzebne zasoby**.
- Punktacja: spełnienie wyzwania 40% (Matchmaking 10%, każdy kolejny moduł +5%), potencjał wdrożeniowy 20%, dostępność i intuicyjność 20%, interfejs 10%, jakość materiałów 10%.
- Bez prawdziwych danych osobowych (§9) — wszystkie zrzuty na danych z seedów.

**Wniosek:** każdy slajd pokrywa konkretne kryterium oceny, a numer modułu z `base.md` (I–VII) jest na nim widoczny, bo jury liczy moduły.

## Co mamy (podstawa do slajdów)

| Moduł z `base.md` | Stan | Co da się pokazać |
|---|---|---|
| I. Matchmaking społeczny | ✅ gotowy | Czat na `/`: hybrydowe wyszukiwanie (słowa + znaczenie), rerank, streszczenie AI z cytowaniami `[n]`, pytanie doprecyzowujące, odpowiedź „nie wiem”, „Skala problemu: Podobny problem zgłosiło już …”, numer zgłoszenia i „Moje zgłoszenia” z odpowiedzią Hubu |
| II. Zasobnik wiedzy | ✅ wdrożony (bez pełnej próby w przeglądarce) | `/wiedza`: 8 wyzwań z faktami i źródłem, mapa 22 powiatów (IOSS), raporty, materiały i podcasty ROPS; `/rozwiazania`: Biblioteka 115 innowacji, 9 grup ROPS, filtr „Tylko z filmem” (26), strona innowacji z filmem i „Podobne innowacje”; `/panel/trendy` tylko dla administratora |
| III. Kreator pomysłów | ⚠️ tylko zalążek | `/mam-pomysl` (po zalogowaniu): fiszka pomysłu trafia do „Pomysły czekające na przejrzenie” w panelu. Kanwa, asystent i nabory grantowe (K00–K13) nie są zrobione |
| IV. Tester innowacji | ✅ gotowy | „Nabory testerów”: zgłoszenie ze zgodą, „Sugestia AI” dopasowania w panelu, akceptacja, link testera, ankieta (4 oceny 1–5), raport AI, moderacja komentarzy |
| V. Platforma aktywnej komunikacji | ✅ gotowy | Pytanie → „Odpowiedź automatyczna (AI)” z kartami → „Zespół Hubu” → przydział eksperta → „Moje konsultacje”; tablica partnerstw z dopasowaniem „Inny sektor” |
| VI. Panel administratora | ✅ w większości (PA03–PA05 bez próby w przeglądarce) | Zakładka „Nowe” z licznikiem, zgłoszenia z podobnymi, kolejka rozwiązań, edycja Bazy wiedzy („Zmiana tego pola odświeży wyszukiwanie.”), trendy, nabory testerów, rozmowy |
| VII. Middleman Innowacji | ❌ brak | Tylko jako plan rozwoju |

**Dostępność:** wygląd w stylu rops.krakow.pl, pasek „Ułatwienia dostępu” (A / A+ / A++, „Wysoki kontrast”), link „Przejdź do treści”, deklaracja dostępności `/dostepnosc`, statusy opisane słowem, a nie samym kolorem, komunikaty `aria-live` w czacie i rozmowach. Cel to WCAG 2.1 AA.

**Prawdziwe dane:** 115 innowacji z Biblioteki ROPS (26 z filmem), 11 wskaźników IOSS × 22 powiaty (2024), 17 faktów z OZPS 2024 z numerem strony, 19 raportów, materiałów i podcastów ROPS. Fikcyjne (seedy): zgłoszenia, 6 ekspertów, 8 ogłoszeń partnerstw, rozmowy, testerzy.

## Narracja (jedno zdanie na całość)

> Mieszkaniec, gmina albo NGO opisuje problem własnymi słowami, a Splot w kilka sekund pokazuje sprawdzone innowacje z Biblioteki ROPS. Gdy ich nie ma, mówi wprost „nie znalazłem” i przekazuje zgłoszenie zespołowi Hubu. Każde zgłoszenie zasila trendy, które widzi ROPS.

Pętla, która spina moduły (rysujemy ją na slajdzie 2 i wracamy do niej): **potrzeba → dopasowanie → wiedza → test → rozmowa i partnerstwo → trendy dla ROPS**.

## Slajdy

Przy każdym slajdzie: co na nim jest, jaki zrzut, co mówimy i które kryterium pokrywa.

### 1. Splot — cyfrowe serce Małopolskiego Hubu Innowacji Społecznych

- **Na slajdzie:** nazwa, jedno zdanie opisu, znak Matchmakingu, nazwa zespołu, linki do demo i makiet (QR).
- **Wizual:** zrzut strony głównej `/` z polem czatu.
- **Mówimy:** „Splot łączy potrzeby mieszkańców z innowacjami, które ROPS już przetestował. Opis problemu po polsku, bez zakładania konta.”
- **Kryterium:** wymagania formalne (nazwa, opis, link).

### 2. Problem i nasza odpowiedź

- **Na slajdzie:** po lewej problem słowami z `base.md`: oddolne mikro-rozwiązania nie mają narzędzi do rozwoju i skalowania; brakuje miejsca, które łączy diagnozę, rozwój pomysłów, testowanie, upowszechnianie i partnerstwa. Po prawej pętla Splotu (diagram 6 kroków) z numerami modułów I–VI.
- **Wizual:** diagram pętli w kolorach design systemu.
- **Mówimy:** „Zamiast osobnych narzędzi mamy jedną pętlę. Każdy moduł oddaje dane następnemu.”
- **Kryterium:** pomysłowość („nowa jakość”, nie zlepek funkcji — §6).

### 3. Moduł I — Matchmaking społeczny (obowiązkowy)

- **Na slajdzie:** 3 zrzuty: (a) wpisany problem „U nas w gminie starsi ludzie siedzą sami w domach i nie mają z kim pogadać”, (b) streszczenie AI z cytowaniami `[1]`, `[2]` i karty rozwiązań, (c) ramka „Skala problemu: Podobny problem zgłosiło już …” z numerem zgłoszenia.
- **Podpis pod zrzutami:** „Rozumie opis własnymi słowami — synonimy, parafrazy, pisownia bez polskich znaków · każde twierdzenie z odnośnikiem do karty · gdy opis jest zbyt ogólny, dopytuje · zgłoszenie zapisuje się zawsze”.
- **Mówimy:** „Nie trzeba znać słów kluczowych. Wyszukiwanie łączy słowa i znaczenie, a AI pisze streszczenie wyłącznie z tego, co jest w Bibliotece.”
- **Kryterium:** trafność dopasowania i łatwość zgłoszenia problemu.

### 4. „Nie wiem” to funkcja + ścieżka odpowiedzi do autora

- **Na slajdzie:** zrzut odpowiedzi „Nie znalazłem w bazie rozwiązania, które pasuje do tego opisu. Zgłoszenie zostało zapisane — zespół Hubu je zobaczy.” z polem „Dopisz więcej szczegółów…”. Obok przepływ ze zrzutami: numer zgłoszenia i link „Moje zgłoszenia” → zakładka „Nowe” z licznikiem w panelu → odpowiedź zespołu w zgłoszeniu (z listą podobnych zgłoszeń) → odpowiedź widoczna w „Moje zgłoszenia”.
- **Mówimy:** „Jeśli nie mamy rozwiązania, nie zmyślamy. Problem trafia do zespołu Hubu, a autor czyta odpowiedź w aplikacji.”
- **Kryterium:** szybkość komunikacji — §6 pyta wprost, jak system powiadamia administratora i jak wygląda ścieżka odpowiedzi do autora.

### 5. Moduł II — Zasobnik wiedzy: kondycja Małopolski na danych ROPS

- **Na slajdzie:** zrzut `/wiedza/wyzwania/AGING`: kluczowe fakty (np. 841 541 osób 60+, czyli 24,5%) z linkiem do strony raportu OZPS i mapa kafelkowa 22 powiatów (odsetek 65+; m. Tarnów i olkuski w najwyższym przedziale). Małe zrzuty obok: Biblioteka `/rozwiazania` z grupą „Dla seniorów” i filtrem „Tylko z filmem” oraz strona innowacji z filmem i sekcją „Podobne innowacje”.
- **Liczby na slajdzie:** 8 wyzwań · 22 powiaty · 11 wskaźników IOSS · 115 innowacji (26 z filmem) · 19 raportów i materiałów.
- **Mówimy:** „Każda liczba ma źródło i rok. Mapa Wyzwań ROPS opisuje obszary na danych ogólnopolskich, a my pokazujemy Małopolskę powiat po powiecie z obserwatora ROPS i Oceny zasobów. Wskaźniki pobiera skrypt, więc aktualizacja to jedno polecenie.”
- **Kryterium:** moduł +5%; „sprawna i szybka aktualizacja danych” i „ciekawa, dostępna forma” z opisu modułu.

### 6. Moduł IV — Tester innowacji

- **Na slajdzie:** cykl w 5 krokach ze zrzutami: lista „Nabory testerów” `/testy` → zgłoszenie ze zgodą → panel z kolumną „Sugestia AI” i akceptacją → ankieta testera (4 oceny 1–5) → raport AI (podsumowanie, bariery, usprawnienia, zastrzeżenie przy małej próbie).
- **Mówimy:** „AI tylko podpowiada dopasowanie testera i streszcza opinie, decyzję podejmuje zespół Hubu. Autor innowacji widzi anonimowe wyniki i moderowane komentarze.”
- **Kryterium:** moduł +5%; bezpieczeństwo danych (kontakt testera widzi tylko Hub, link testera zapisany w bazie jako skrót SHA-256).

### 7. Moduł V — Platforma aktywnej komunikacji i partnerstwa

- **Na slajdzie:** zrzut rozmowy z czterema rolami opisanymi słowem: „Ty” → „Odpowiedź automatyczna (AI)” z kartami → „Zespół Hubu” → „Ekspert: dr Anna Przykładowa”. Obok tablica partnerstw: ogłoszenie „Szukamy gminy do pilotażu teleopieki” i pasujące ogłoszenia z plakietką „Inny sektor”.
- **Mówimy:** „Pierwszą odpowiedź daje AI od razu, a człowiek dołącza, gdy jest potrzebny. Partnerów dobieramy ponad sektorami: samorząd, instytucje publiczne, NGO, biznes, nauka, mieszkańcy.”
- **Kryterium:** moduł +5%; jakość komunikacji między użytkownikami; rola ekspertów z `base.md`.

### 8. Moduł VI — Panel administratora i trendy potrzeb

- **Na slajdzie:** zrzut zakładki „Nowe” (`/panel`): liczniki, „Najnowsze zgłoszenia”, „Pomysły czekające na przejrzenie”, rozmowy czekające na Hub. Zrzut `/panel/trendy`: „Zgłoszenia w czasie”, „Wyzwania”, „Powiaty z największą liczbą zgłoszeń”, „Zgłoszenia a biblioteka” (gdzie brakuje innowacji). Mały zrzut edycji wpisu w Bazie wiedzy.
- **Mówimy:** „ROPS widzi w jednym miejscu, co jest nowe, gdzie narasta problem i gdzie brakuje innowacji. Poprawiona treść od razu trafia do wyszukiwania.”
- **Kryterium:** moduł +5% (oraz trendy z modułu II); potrzeby pracowników ROPS z `base.md`.

### 9. Dostępność i gotowość do wdrożenia

- **Lewa połowa — dostępność:** zrzut strony w trybie wysokiego kontrastu i z A++; lista: projektowane pod WCAG 2.1 AA, obsługa klawiaturą, „Przejdź do treści”, statusy słowem, komunikaty dla czytnika ekranu, deklaracja dostępności, prosty język.
- **Prawa połowa — technologia i bezpieczeństwo:** jedna baza PostgreSQL (z pgvector), FastAPI, React; usługi startują jednym poleceniem (Docker Compose), dane ładują powtarzalne skrypty; zgłoszenia anonimowe z ostrzeżeniem „Nie wpisuj imion, adresów ani danych o zdrowiu konkretnych osób.”; treści zgłoszeń maskowane w logach; API z dokumentacją `/docs`, gotowe do integracji (np. z bazą grantową).
- **Mówimy:** „Seniorzy i osoby z niepełnosprawnościami są wśród głównych odbiorców, więc dostępność jest w design systemie od pierwszego dnia.”
- **Kryterium:** dostępność 20%, potencjał wdrożeniowy 20%.

### 10. Koszt utrzymania, zasoby i dalszy rozwój

- **Tabela kosztów (specyfikacja M1 §16; stawki sprawdzić przed oddaniem):** ok. 0,0045 USD za rozmowę w Matchmakingu; ok. 45 USD przy 10 tys. rozmów miesięcznie, ok. 450 USD przy 100 tys. Pytanie w Platformie komunikacji korzysta z tego samego mechanizmu, więc kosztuje podobnie; AI Testera (sugestia, raport) to pojedyncze wywołania na nabór — pomijalne. Hosting: API 2 vCPU / 4 GB, baza 2 vCPU / 4–8 GB, region UE. Ludzie: kurator treści 0,1–0,2 etatu, opiekun techniczny kilka godzin w miesiącu. Dźwignia: wyłączenie rerankera obniża koszt zmienny o ok. 44%.
- **Plan rozwoju:** Kreator pomysłów (kanwa Social Canvas, asystent AI, generator wniosków na nabory), Middleman Innowacji, powiadomienia e-mail, konta użytkowników, modele lokalne (koszt zmienny bliski zeru).
- **Mówimy:** „Przy 10 tysiącach rozmów miesięcznie koszt AI to kilkadziesiąt dolarów. Następny krok to Kreator i Middleman.”
- **Kryterium:** wymaganie formalne (koszt i zasoby), potencjał wdrożeniowy.

## Pokaz na żywo / film 3 min — kolejność kliknięć

Jedna osoba prowadzi, nagrywamy na `:8080` (`make up`) w trybie pełnym z kluczami API. Zaczynamy zalogowani jako `reporter` / `reporter123` — bez tego „Moje zgłoszenia”, „Mam pomysł” i „Zadaj pytanie” pokazują ekran logowania.

1. `/` — problem o samotnych seniorach → streszczenie z `[n]`, karty, „Skala problemu” (30 s).
2. Problem spoza Biblioteki → „Nie znalazłem…” → „Dopisz więcej szczegółów” (15 s).
3. `/wiedza` → „Starzenie się społeczeństwa” → fakty i mapa powiatów → raport OZPS w nowej karcie (30 s).
4. `/rozwiazania` → „Dla seniorów” → innowacja z filmem → „Podobne innowacje” (20 s).
5. Platforma komunikacji → „Zadaj pytanie” → odpowiedź AI → „Chcę porozmawiać z zespołem Hubu” (25 s).
6. Wyloguj, zaloguj `admin` / `admin123` → „Nowe” → rozmowa → odpowiedź i przydział eksperta → `/panel/trendy` (30 s).
7. Panel → „Nabory testerów” → nabór → „Sugestia AI” i raport (20 s).
8. A++ i „Wysoki kontrast” na dowolnym ekranie (10 s).

Szczegóły: M5 — `docs/modules/05-platforma-komunikacji/module-5-demo.md`, M4 — `docs/modules/04-tester-innowacji/module-4-calibration.md`.

## Lista przed zrobieniem zrzutów (stan bazy 2026-10-04)

W bazie są tylko korpus i wiedza (115 + 19 rekordów, 8 profili, 11 wskaźników). **Brakuje danych demo:** 1 zgłoszenie, 0 naborów testerów, 0 rozmów.

- [ ] `.env` w trybie pełnym (OpenAI, Cohere, Anthropic) — bez tego nie ma streszczenia z `[n]`, a `seed_reports` nie zadziała (wysyła zgłoszenia przez czat).
- [ ] `docker compose exec api python -m scripts.seed_reports` — 15 zgłoszeń: trendy, „Skala problemu”, zakładka „Nowe”.
- [ ] `make seed-m4` — nabór `OPEN` i zgłoszenia we wszystkich statusach; dla „Sugestii AI” i raportu `M4_AI_ENABLED=true`.
- [ ] `make db-m5 && make seed-comm` — 6 ekspertów, 8 ogłoszeń, 4 rozmowy; konto `ekspert` / `ekspert123`.
- [ ] Przejść raz w przeglądarce ekrany bez próby: scenariusze S1–S4 Zasobnika (Z11), `/panel/trendy`, edycję w `/panel/wiedza` (PA03–PA05).
- [ ] **Makiety UX/UI** (wymagane w zgłoszeniu): nie mamy osobnych makiet — ustalić, co linkujemy (np. strona przykładów `design-system/examples` albo zestaw zrzutów ekranów).
- [ ] Zrzuty w szerokości 1280 px oraz jeden w „Wysokim kontraście”; bez danych osobowych na ekranie.
- [ ] Sprawdzić aktualne stawki OpenAI, Cohere i Anthropic do slajdu 10.
- [ ] Eksport pptx → PDF i kontrola: najwyżej 10 slajdów.

## Czego nie mówimy

- Że Kreator pomysłów jest gotowy — pokazujemy tylko fiszkę jako zalążek modułu III. Moduł VII to wyłącznie plan.
- Że aplikacja przeszła audyt WCAG — mówimy „projektowane pod WCAG 2.1 AA”.
- Że zgłoszenia, eksperci, ogłoszenia i testerzy są prawdziwi — to dane przykładowe. Prawdziwe są Biblioteka, wskaźniki, fakty i raporty ROPS.
- Że logowanie jest zabezpieczone — konta demo działają tylko w przeglądarce (PoC).
- Że wyszukiwanie poprawia literówki — tego nie sprawdzaliśmy; tor słów nie ma dopasowania przybliżonego.
- Że Zasobnik korzysta z „Mapy Wyzwań Społecznych” — mamy ją w `docs/resources/rops/iws2/`, ale w aplikacji jej nie ma. Na pytanie jury: Mapa ma dane ogólnopolskie i 8 obszarów z personami; my pokazujemy dane regionalne per powiat. Wpięcie person z Mapy do stron wyzwań — plan rozwoju.
