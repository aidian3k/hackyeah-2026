# Moduł 1 — kalibracja progów i próba generalna demo (T25)

> **Uwaga: ta kalibracja dotyczy wyłącznie trybu deweloperskiego `hash`** (`EMBEDDING_PROVIDER=hash`,
> `RERANK_ENABLED=false`, `LLM_ENABLED=false`) — w środowisku nie było kluczy OpenAI / Cohere / Anthropic.
> Cosinusy providera `hash` mają inną skalę niż `text-embedding-3-large`, więc ustalone tu wartości
> **nie przenoszą się** na OpenAI/Cohere. Po dodaniu kluczy kalibrację trzeba powtórzyć — procedura
> w sekcji [Kalibracja OpenAI/Cohere](#kalibracja-openaicohere-do-powtórzenia-po-dodaniu-kluczy).

Stan: 2026-10-03, korpus 155 SOLUTION + 7 KNOWLEDGE (seed-demo 47 + Biblioteka ROPS 115), seed zgłoszeń 15 (`data/reports-seed.json`).

## Wybrane progi

| Zmienna | Tryb `hash` (lokalny `.env`) | OpenAI/Cohere (`.env.example`, domyślne w `config.py`) |
|---|---|---|
| `MIN_COSINE_SCORE` | **0.28** | 0.50 (startowe, nieskalibrowane) |
| `SIMILAR_REPORT_THRESHOLD` | **0.38** | 0.82 (startowe, nieskalibrowane) |
| `MIN_RERANK_SCORE` | nie dotyczy (bez rerankera) | 0.35 (startowe, nieskalibrowane) |
| `RRF_K` | 60 (bez zmian) | 60 |

Progi zmienione wyłącznie w `.env`; w `.env.example` jest zakomentowany blok „Tryb hash (dev)” z tymi wartościami.

**Uzasadnienie `MIN_COSINE_SCORE=0.28`:** w tabeli poniżej najwyższy wynik bramki dla zapytania bez rozwiązania to 0.253 („dziura w asfalcie…” — „powiatowej” trafia w pojęcie `samorząd` z `synonyms.json`), najniższy dla trafnego zapytania to 0.316 („babcia nie umie obsłużyć smartfona…”). 0.28 leży mniej więcej w środku tej luki. Margines jest mały (±0.03) — to ograniczenie providera `hash`, który nie rozumie znaczenia, tylko wspólne słowa i synonimy.

**Uzasadnienie `SIMILAR_REPORT_THRESHOLD=0.38`:** cosinusy między zgłoszeniami seedu (`reports.embedding`):

| Para | Zakres cosinusa |
|---|---|
| parafrazy „samotni seniorzy” (5 zgłoszeń, 10 par) | 0.540 – 0.783 |
| parafrazy „wykluczenie cyfrowe seniorów” (3 zgłoszenia) | 0.406 – 0.601 |
| parafrazy „brak transportu na wsi” (2 zgłoszenia) | 0.654 |
| różne problemy (najbliższe: „samotność seniorów” vs „seniorzy i internet”) | ≤ 0.359 |
| różne problemy, pozostałe | ≤ 0.31, zwykle 0.0 – 0.15 |

0.38 rozdziela grupy (najniższa para w grupie 0.406, najwyższa para spoza grupy 0.359). Przy 0.40 (pierwsza próba) wynik seedu był taki sam, ale z mniejszym zapasem. Zgłoszenie z demo („U nas w gminie starsi ludzie siedzą sami w domach…”, Wadowice) dostaje „4 osoby z 4 gmin” — 5. parafraza (Myślenice) ma 0.374 i nie łapie się na próg (słownictwo „nikt ich nie odwiedza” bez wspólnych słów).

## Zmiana providera `hash` (zgoda orkiestratora)

Poprzednia wersja (`api/providers/embeddings_hash.py`: słowa + n-gramy znakowe 3–4 z całego tekstu) dawała szum ~0.20–0.25 cosinusa dla **każdego** zapytania (kolizje kubełków przy 1024 wymiarach, max po ~1100 chunkach), więc zapytania bez rozwiązania nie dawały `no_match`, a „starsi ludzie sami w domu” → top 1 „Obu – obuwie po domu”. Nowa wersja (plik deweloperski, deterministyczna, bez nowych zależności):

- słowa po zdjęciu ogonków, **bez stopwords** (`api.pipeline.text.stopwords()`) i bez słów < 3 znaków,
- „stem” = **prefiks 5 znaków** (tani odpowiednik lematyzacji: „samotni”/„samotność” → `samot`),
- **pojęcia z `data/synonyms.json`** (jednowyrazowe warianty) + kilka potocznych słów w `_EXTRA_CONCEPTS` (np. „sami” → samotność, „babcia” → senior, „nastolatki” → młodzież); cecha pojęcia × 1.5,
- waga 0.5–1.0 wg **IDF** liczonego z `data/solutions/*.json` (słowa typu „osoby”, „pomoc” ważą mniej),
- tłumienie powtórzeń `1 + ln(n)`, **bez n-gramów** (główne źródło kolizji).

Konsekwencja: wektor zależy od plików `data/` (IDF, synonimy). Po zmianie korpusu lub providera:
`python -m scripts.ingest data/solutions/ --reembed-all` i `python -m scripts.seed_reports --purge`.

Wynik na zestawie testowym (offline, max cosinus per rozwiązanie): szum spadł z 0.20–0.25 do 0.14–0.25, trafne zapytania wzrosły z 0.24–0.49 do 0.32–0.73.

## Tabela zapytań (`GET /api/search`, tryb hash, `MIN_COSINE_SCORE=0.28`)

Typ: **P** — parafraza bez słów z tytułu, **I** — identyfikator / nazwa własna / numer uchwały, **A** — bez polskich znaków albo nietypowe, **N** — brak rozwiązania w korpusie (ma być `no_match`).
Kolumna „rerank” — wynik z `rerank=true` identyczny z `rerank=false` (przy `RERANK_ENABLED=false` fabryka zwraca `noop`, bramka `cosine`), więc pokazuję jedną kolumnę.

| # | Typ | Zapytanie | `lexical` niepuste | Top 3 (karty główne) | `gate.score` | `passed` | Ocena |
|---|---|---|---|---|---|---|---|
| 1 | P | U nas w gminie starsi ludzie siedzą sami w domach i nie mają z kim pogadać | tak (20) | Telefon Życzliwości dla seniorów; Teleopieka – opaski SOS; Gminny program przeciwdziałania izolacji | 0.405 | tak | dobra |
| 2 | P | starsi ludzie sami w domu | tak (20) | Telefon Życzliwości dla seniorów; Teleopieka – opaski SOS; Obu – obuwie po domu | 0.444 | tak | dobra (Obu spadło z 1. na 3.) |
| 3 | P | babcia nie umie obsłużyć smartfona ani założyć profilu zaufanego | tak (20) | Cyfrowi Wolontariusze – młodzież uczy seniorów | 0.316 | tak | dobra, tylko 1 karta (filtr per pozycja) |
| 4 | P | nastolatki mają depresję, w szkole brakuje psychologa | tak (20) | „Głowa do góry”; Punkt konsultacyjny zdrowia psychicznego; Bez presji z depresji | 0.725 | tak | dobra |
| 5 | P | ludzie ze wsi nie mają jak dojechać do lekarza, nie jeździ autobus | tak (20) | Gminny bus na żądanie | 0.659 | tak | dobra |
| 6 | I | uchwała XII/123/2024 | tak (2) | Uchwała nr XII/123/2024 … Polityki Senioralnej | 0.547 | tak | dobra |
| 7 | I | CUS Wieliczka | tak (20) | CUS Wieliczka – jedno okienko | 0.480 | tak | dobra |
| 8 | I | BaWita | tak (1) | BaWita | 0.470 | tak | dobra |
| 9 | A | mlodziez wyjezdza ze wsi i nie wraca, zostaja sami starsi | tak (20) | Cyfrowi Wolontariusze; Mobilne centrum pomocy dla osób starszych; TA ścieżka | 0.438 | tak | słaba („Wracam do siebie” poza top 3) |
| 10 | A | na nowych osiedlach pod Krakowem brakuje miejsc w przedszkolach | tak (20) | Klub Nowych Mieszkańców; Budżet obywatelski z pulą dla nowych osiedli; Brzuszkole | 0.328 | tak | średnia |
| 11 | P | opiekuję się mamą z alzheimerem i jestem wykończona, potrzebuję odpoczynku | tak (3) | Opieka wytchnieniowa; Organizator kompleksowej opieki; Centrum antydepresyjne | 0.418 | tak | dobra |
| 12 | P | osoby głuche nie mogą załatwić sprawy w urzędzie | tak (20) | Urzędowy ambaras; Dostępny wniosek dla g/Głuchych | 0.445 | tak | dobra |
| 13 | N | klocki hamulcowe w samochodzie piszczą przy hamowaniu | nie | — | 0.139 | nie | `no_match` ✔ |
| 14 | N | jak rozliczyć PIT za wynajem mieszkania | tak (2) | — | 0.165 | nie | `no_match` ✔ |
| 15 | N | dziura w asfalcie na drodze powiatowej | nie | — | 0.253 | nie | `no_match` ✔ (najbliżej progu) |
| 16 | N | przepis na pierogi ruskie z cebulką | nie | — | 0.136 | nie | `no_match` ✔ |
| 17 | N | Bezpańskie psy biegają stadami po wsi i straszą przechodniów… | tak (17) | — | 0.184 | nie | `no_match` ✔ (mimo trafień leksykalnych) |
| 18 | N | Latem wysychają studnie i rolnicy nie mają czym podlewać upraw… | tak (9) | — | 0.205 | nie | `no_match` ✔ |

Znana słabość trybu hash: „niewidomi chcieliby chodzić po górach” daje `no_match` (0.19) mimo rekordów „Turystyka górska/wspinaczka dostępna dla wszystkich” i „Zdobądź swoje szczyty” — brak wspólnych słów („górach” vs „górska”, „szczyty”). Z OpenAI powinno działać.

Skrypt tabeli: każde zapytanie przez
```bash
curl -s -G localhost:8000/api/search --data-urlencode 'q=starsi ludzie sami w domu' --data-urlencode rerank=false \
  | jq '{lex: (.lexical|length), gate, solutions, top: [.semantic[:3][].title]}'
```
(analogicznie z `rerank=true`).

## Seed zgłoszeń (T24)

```bash
python -m scripts.seed_reports --purge        # API musi działać na :8000 (albo --api-url)
```
Wynik (tryb hash, `SIMILAR_REPORT_THRESHOLD=0.38`): grupa „samotni seniorzy” (Wieliczka → Myślenice → Bochnia → Nowy Targ → Limanowa) ma `similar_count` 0, 1, 2, 3, **4** i `gmina_count` 0, 1, 2, 3, **4**; „wykluczenie cyfrowe” (Tarnów → Gorlice → Olkusz) 0, 1, **2** / 0, 1, **2**; „transport” 0, 1; różne problemy (psychika młodzieży, osiedla podmiejskie, opiekunka z demencją) — 0; dwa problemy spoza korpusu (bezpańskie psy, wysychające studnie) — `no_match`, `similar_count = 0`. 13/15 z dopasowaniem.

Sprawdzenie progu: `curl -s localhost:8000/api/reports/<id>/similar | jq '.[] | {id, gmina, similarity}'`.

## Pełna ścieżka demo (curl, wszystkie kroki przeszły 2026-10-03, tryb hash)

```bash
API=localhost:8000
# 1. Mieszkaniec opisuje problem → karty, (streszczenie — tylko z LLM), „N osób z M gmin”, report_id
curl -N -X POST $API/api/chat -H 'Content-Type: application/json' \
  -d '{"message":"U nas w gminie starsi ludzie siedzą sami w domach i nie mają z kim pogadać","gmina":"Wadowice","session_id":"demo-run-01","reporter_type":"JST","severity_self":4}'
#    → status×3, candidates (Telefon Życzliwości…), report_saved {"report_id": R, "similar_count": 4, "gmina_count": 4}, done
# 2. Panel: nowe zgłoszenie w skrzynce
curl -s $API/api/inbox | jq '{new_reports, new_unmatched, pending_solutions, latest: [.latest_reports[:3][].id]}'
# 3. Szczegóły i podobne zgłoszenia
curl -s $API/api/reports/R | jq '{id, category, gmina, matched, status}'
curl -s $API/api/reports/R/similar | jq '.[] | {id, gmina, similarity}'
# 4. Ekspert odpowiada → status IN_PROGRESS
curl -s -X POST $API/api/reports/R/replies -H 'Content-Type: application/json' \
  -d '{"body":"Dzień dobry, w Wieliczce działa Telefon Życzliwości — skontaktujemy Państwa z koordynatorką. Zespół Hubu.","author_label":"Ekspert Hubu (ROPS)"}'
curl -s $API/api/reports/R | jq '{status, reply_count}'          # → "IN_PROGRESS", 1
# 5. Autor czyta odpowiedź
curl -s $API/api/reports/R/replies | jq
# 6. Nowe rozwiązanie: zgłoszenie → skrzynka → publikacja → widoczne w czacie
Q='{"message":"Bezpańskie psy biegają stadami po wsi i straszą przechodniów, nikt nie chce ich wyłapać.","gmina":"Proszowice","session_id":"demo-run-02"}'
curl -sN -X POST $API/api/chat -H 'Content-Type: application/json' -d "$Q" | grep '^event'   # → no_match
curl -s -X POST $API/api/solutions -H 'Content-Type: application/json' -d '{
  "title":"[DEMO] Gminny program opieki nad bezdomnymi psami",
  "summary":"Gmina podpisuje umowę ze schroniskiem i lekarzem weterynarii, a sołtysi zgłaszają bezpańskie psy do wyłapania, czipowania i adopcji.",
  "body":"## Na czym polega\n\nBezpańskie psy na wsi są wyłapywane przez schronisko na zgłoszenie sołtysa, czipowane, sterylizowane i oddawane do adopcji. Mieszkańcy zgłaszają psy biegające stadami po wsi.",
  "organization":"Stowarzyszenie demo","gmina":"Proszowice","category":"OTHER","tags":["demo","zwierzęta","bezpańskie psy"],"target_group":"mieszkańcy wsi"}'
#    → {"id": S, "status": "PENDING_REVIEW"}
curl -s $API/api/inbox | jq '{pending_solutions, latest_pending: [.latest_pending[] | {id, title}]}'
curl -sN -X POST $API/api/chat -H 'Content-Type: application/json' -d "${Q/demo-run-02/demo-run-03}" | grep '^event'  # nadal no_match (PENDING_REVIEW niewidoczne)
curl -s -X PATCH $API/api/solutions/S -H 'Content-Type: application/json' -d '{"status":"PUBLISHED"}' | jq '{id, title}'
curl -sN -X POST $API/api/chat -H 'Content-Type: application/json' -d "${Q/demo-run-02/demo-run-04}" | grep -A1 '^event: candidates' | cut -c1-200
#    → candidates z kartą [DEMO] Gminny program opieki nad bezdomnymi psami (rank 1)
# 7. Statystyki: total = matched + unmatched, sumy grup = total
curl -s $API/api/stats | jq '{total, matched, unmatched, by_category: ([.by_category[].total]|add), by_gmina: ([.by_gmina[].total]|add), by_reporter_type: ([.by_reporter_type[].total]|add)}'
```

Wynik próby: krok 1 `similar_count=4, gmina_count=4`; krok 2 nowe zgłoszenie na 1. miejscu `latest_reports`; krok 4 status `IN_PROGRESS`, `reply_count=1`; krok 6 przed publikacją `no_match` (0.184), po `PATCH` karta `[DEMO]…` na 1. miejscu; krok 7 `total 19 = matched 15 + unmatched 4`, sumy `by_category/by_gmina/by_week/by_reporter_type` = 19.

Sprzątanie po próbie (wykonane — w bazie zostaje korpus + seed zgłoszeń):
```bash
docker compose exec -T db psql -U splot splot -c "BEGIN;
  DELETE FROM search_events WHERE report_id IN (SELECT id FROM reports WHERE session_id LIKE 'demo-run-%');
  DELETE FROM reports WHERE session_id LIKE 'demo-run-%';
  DELETE FROM solutions WHERE title LIKE '[DEMO]%';
COMMIT;"
```

Niezweryfikowane (brak kluczy): streszczenie LLM z cytowaniami `[n]` i `answer_retracted` w kroku 1, reranker Cohere (`gate.source = "rerank"`).

## Kalibracja OpenAI/Cohere (do powtórzenia po dodaniu kluczy)

1. W `.env`: wpisz `OPENAI_API_KEY`, `COHERE_API_KEY`, `ANTHROPIC_API_KEY`; ustaw `EMBEDDING_PROVIDER=openai`, `RERANK_ENABLED=true`, `LLM_ENABLED=true`; **usuń** linie `MIN_COSINE_SCORE=0.28` i `SIMILAR_REPORT_THRESHOLD=0.38` (wrócą domyślne 0.50 / 0.82).
2. Przelicz korpus i seed tym samym modelem:
   ```bash
   make reset-db && make ingest          # albo: python -m scripts.ingest data/solutions/ --reembed-all
   make dev                              # albo make up
   python -m scripts.seed_reports --purge
   ```
3. Tabela zapytań z obu trybów bramki (te same 18 zapytań co wyżej):
   ```bash
   for rr in true false; do
     while read -r q; do
       curl -s -G localhost:8000/api/search --data-urlencode "q=$q" --data-urlencode rerank=$rr \
         | jq -c --arg q "$q" '{q:$q, lex:(.lexical|length), gate, solutions}'
     done < queries.txt
   done
   ```
   `MIN_RERANK_SCORE` (z `rerank=true`, `gate.source = "rerank"`) i `MIN_COSINE_SCORE` (z `rerank=false`) ustaw pomiędzy najwyższym `gate.score` zapytań typu N a najniższym zapytań trafnych; `MIN_COSINE_SCORE` jest też progiem wpisów wiedzy (`context`).
4. `SIMILAR_REPORT_THRESHOLD`: macierz cosinusów seedu
   ```bash
   docker compose exec -T db psql -U splot splot -c "SELECT a.session_id, b.session_id,
     round((1-(a.embedding<=>b.embedding))::numeric,3) s FROM reports a JOIN reports b ON a.id<b.id
     WHERE a.session_id LIKE 'seed-demo-%' AND b.session_id LIKE 'seed-demo-%' ORDER BY s DESC;"
   ```
   Próg między najniższą parą w grupie parafraz (01–05, 06–08, 09–10) a najwyższą parą spoza grupy. Potem `python -m scripts.seed_reports --purge` — ostatnie parafrazy grup mają mieć `similar_count ≥ 2`, `gmina_count ≥ 2`, pozostałe 0.
5. Wpisz wartości do `.env` i (jako domyślne dla OpenAI/Cohere) do `.env.example`; zaktualizuj ten plik.

## Plan awaryjny

- **Sieć:** hotspot z telefonu; API i baza działają lokalnie (`make up`), sieć potrzebna tylko dostawcom.
- **Pada Cohere:** `RERANK_ENABLED=false` → kolejność RRF, bramka z cosinusa (`MIN_COSINE_SCORE`). Bez restartu korpusu.
- **Pada Anthropic:** `LLM_ENABLED=false` → same karty + licznik podobnych (bez streszczenia).
- **Pada OpenAI (embeddingi) albo brak kluczy:** tryb `hash` — `EMBEDDING_PROVIDER=hash`, `RERANK_ENABLED=false`, `LLM_ENABLED=false`, `MIN_COSINE_SCORE=0.28`, `SIMILAR_REPORT_THRESHOLD=0.38`, potem `python -m scripts.ingest data/solutions/ --reembed-all` i `python -m scripts.seed_reports --purge` (ok. 10 s). Korpus i zapytania muszą być liczone tym samym providerem.
- **Wszystko pada:** nagrany film ze ścieżki demo powyżej; mocki SSE w `docs/mocks/` (`python docs/mocks/replay.py`, :8001) dla frontendu.
