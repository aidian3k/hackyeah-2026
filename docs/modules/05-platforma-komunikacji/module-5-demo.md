# Moduł 5 — scenariusz demo i przegląd (PK26)

Przetestowane 2026-10-04 w Chrome na danych z `make seed-comm`, z `EMBEDDING_PROVIDER=hash`, `LLM_ENABLED=false`, `RERANK_ENABLED=false` (bez kluczy API). Asystent odpowiada wtedy samymi kartami („Te rozwiązania z Biblioteki Innowacji mogą pomóc:”). Z kluczem Anthropic pojawi się streszczenie z cytowaniami `[n]` — ta ścieżka nie była sprawdzona.

## Przygotowanie

```bash
make db-m5        # schemat M5 (idempotentny)
make seed-comm    # 6 ekspertów, 8 ogłoszeń, 4 rozmowy (dane fikcyjne)
```

Konta demo (`web/src/lib/auth.tsx`): `reporter` / `reporter123`, `admin` / `admin123`, `ekspert` / `ekspert123` (ekspert nr 1 z seeda).

## Scenariusz A — pytanie → AI → zespół → ekspert (ok. 2 min)

1. `reporter`: zakładka **Platforma komunikacji** → **Zadaj pytanie**. Treść: „Starsi ludzie w naszej gminie są samotni i nie mają z kim porozmawiać. Co możemy zrobić?”, „Zgłaszam jako: Organizacja społeczna”, podpis „Stowarzyszenie Test (przykład)” → **Wyślij pytanie**.
2. Po ok. 1 s w rozmowie: **Odpowiedź automatyczna (AI)** z trzema kartami rozwiązań (m.in. „Mobilne centrum pomocy dla osób starszych”), status „Jest odpowiedź”. ✅
3. **Chcę porozmawiać z zespołem Hubu** → status „Czeka na zespół Hubu”. ✅
4. `admin`: w nawigacji panelu **Rozmowy** z licznikiem; Skrzynka ma sekcję „Rozmowy czekające na Hub”. W rozmowie: odpowiedź z podpisem „Zespół Hubu” → **Wyślij odpowiedź**; w sekcji **Ekspert** lista z dopiskiem „ten sam obszar” przy ekspertce od samotności → **Przydziel** (dopisuje się „Do rozmowy dołączył(a) ekspert: …”). ✅
5. `ekspert`: nawigacja Matchmaking, Zasobnik, **Moje konsultacje** → rozmowa → odpowiedź eksperta, widoczna jako „Ekspert: dr Anna Przykładowa”. ✅
6. `reporter`: **Platforma komunikacji** → „Moje rozmowy” → plakietka **Nowa odpowiedź**. ✅

## Scenariusz C — partnerstwo (ok. 1 min)

1. **Tablica partnerstw** → filtr „Rodzaj ogłoszenia: Szukamy” (w URL `?intencja=SEEK`). ✅
2. Ogłoszenie „Szukamy gminy do pilotażu teleopieki”: **Pasujące ogłoszenia** — oferta gminy z plakietką **Inny sektor** na górze, potem oferta NGO; **Powiązane rozwiązania z Biblioteki Innowacji**. ✅
3. `reporter`: **Zaproponuj współpracę** → rozmowa z Hubem (rodzaj „Propozycja partnerstwa”, link do ogłoszenia). Sprawdzone przez API (PK04); w przeglądarce nie klikane.

## Przegląd dostępności (częściowy)

| Punkt | Wynik |
|---|---|
| Rola wiadomości słownie przed treścią („Ty”, „Zespół Hubu”, „Ekspert: …”, „Odpowiedź automatyczna (AI)”) | ✅ |
| Status rozmowy słownie, nie tylko kolorem | ✅ |
| Nowe wiadomości ogłaszane w `aria-live`; licznik znaków ogłaszany przy limicie | ✅ w kodzie, nie sprawdzone czytnikiem ekranu |
| Ochrona tras (`RequireRole`): niezalogowany na `/rozmowy/nowa` → komunikat i powrót po zalogowaniu | ✅ |
| `/rozmowy/nowa` nie trafia do widoku rozmowy `/rozmowy/:id` | ✅ |
| Tryb wysokiego kontrastu (`data-contrast="high"`) | ✅ kolory z tokenów |
| Jeden `ds-btn--cta` na ekranie („Zadaj pytanie”) | ✅ |
| Nawigacja tylko klawiaturą, szerokość 360 px | ⚠ nie sprawdzone |

## Usterki znalezione i poprawione w trakcie

- Ramki kart rozmów i ogłoszeń były niewidoczne: przy wyłączonym preflight Tailwinda klasa `border` ustawia samą szerokość — dodane `border-solid`.
- Podpis „Zespół Hubu” powtarzał się obok roli „Zespół Hubu” — podpis równy nazwie roli nie jest już pokazywany.

## Uwagi do środowiska

Na maszynie testowej port 5432 hosta zajmuje lokalny Postgres (nie ten z Dockera), więc API i seed uruchamiano w kontenerze compose z zamontowanym kodem (`docker compose run … api uvicorn … --reload`), a frontend przez Vite z `VITE_API_TARGET` wskazującym na ten kontener.
