# Mocki API Modułu 1 (dla frontendu)

Zamrożony kontrakt `POST /api/chat` (SSE) i kilku endpointów panelu — frontend może pracować
bez backendu i bez bazy. Kształty pochodzą z `api/schemas.py` (każda linia `data:` i każdy plik
JSON parsuje się przez odpowiedni model Pydantic).

| Plik | Co pokazuje |
|---|---|
| `chat-match.sse` | 3 karty, 2 „Zobacz też”, 1 wpis wiedzy, streszczenie z `[1]`–`[3]`, `report_saved` (`similar_count: 9`, `gmina_count: 4`) |
| `chat-no-match.sse` | puste `solutions`/`also_see`, niepusty `context`, `no_match` (bramka „nie wiem”) |
| `chat-retracted.sse` | tokeny bez cytowań, potem `answer_retracted` — frontend chowa streszczenie, zostają karty |
| `chat-error.sse` | `candidates`, potem `error LLM_UNAVAILABLE`, nadal `report_saved` i `done` |
| `solutions-list.json` | `GET /api/solutions` — `Page[SolutionCard]`, `scores: null` |
| `inbox.json` | `GET /api/inbox` — skrzynka „Nowe” |
| `stats.json` | `GET /api/stats` — statystyki zgłoszeń |

## Uruchomienie

```bash
python docs/mocks/replay.py                         # http://127.0.0.1:8001, scenariusz "match"
python docs/mocks/replay.py --scenario no-match     # match | no-match | retracted | error
python docs/mocks/replay.py --port 8001 --delay 0.2 # wolniejsze odtwarzanie

curl -N -X POST localhost:8001/api/chat -H 'Content-Type: application/json' \
  -d '{"message":"starsi ludzie są samotni","session_id":"s1"}'
curl -N -X POST 'localhost:8001/api/chat?scenario=error' -d '{}'   # scenariusz per żądanie
curl localhost:8001/api/inbox
```

Serwer używa tylko biblioteki standardowej, odtwarza plik ramka po ramce (domyślnie 50 ms przerwy)
i wysyła nagłówki CORS dla `http://localhost:5173`. Treść żądania jest ignorowana. Parametr
`?scenario=` istnieje tylko w mocku — prawdziwy backend go nie ma.

## Protokół strumienia

Kolejność gwarantowana:

```
status* → candidates → (token* [→ answer_retracted] | no_match) → report_saved? → done
```

`error` może przyjść w dowolnym miejscu; po nim ostatecznie przychodzi `done`. `candidates` i
`done` są **zawsze**. Brak `report_saved` = zapis zgłoszenia się nie udał (nie pokazuj licznika).

Ramka: `event: <nazwa>\ndata: <json w jednej linii>\n\n`.

| event | data |
|---|---|
| `status` | `{"stage":"preprocess\|search\|rerank\|answer","label_pl":"..."}` |
| `candidates` | `{"solutions":[SolutionCard…],"also_see":[…],"context":[…]}` |
| `token` | `{"text":"Fundacja "}` — doklejaj do streszczenia |
| `answer_retracted` | `{"reason":"no_citations"}` — usuń wyświetlone streszczenie |
| `no_match` | `{"reason":"below_threshold","best_score":0.21,"gate":"rerank\|cosine","message_pl":"..."}` |
| `report_saved` | `{"report_id":412,"similar_count":9,"gmina_count":4}` |
| `done` | `{"search_event_id":988,"latency_ms":{"total":1840}}` (`search_event_id` może być `null`) |
| `error` | `{"code":"EMBEDDING_UNAVAILABLE\|RERANK_UNAVAILABLE\|LLM_UNAVAILABLE\|INTERNAL","message_pl":"..."}` |

Zasady wyświetlania:
- `[n]` w tokenach = pozycja karty w `solutions` (od 1, równa `rank`). Zamień na link do karty.
- `also_see` kontynuuje numerację `rank` po `solutions`; `context` (`kind = "KNOWLEDGE"`) to wiedza
  o problemie, nie rozwiązanie — nigdy nie ma `[n]`, pokazuj osobno.
- Przy `no_match` `solutions` i `also_see` są puste, `context` może być niepusty. „Nie wiem” to
  normalna odpowiedź, nie błąd — pokaż `message_pl`.
- `scores` są wypełnione w wynikach wyszukiwania i `null` w katalogu/panelu; pojedyncze pola
  `scores` też mogą być `null`.

## Klient: `fetch` + `ReadableStream`

`EventSource` obsługuje tylko GET, a `/api/chat` jest wyłącznie POST (treść zgłoszenia nie może
trafiać do URL). Strumień czytamy `fetch`em i dzielimy po `\n\n`:

```js
// session_id: UUID generowany raz po stronie klienta (np. przy pierwszym wejściu na czat)
const sessionId = sessionStorage.getItem("splot_session") ?? crypto.randomUUID();
sessionStorage.setItem("splot_session", sessionId);

async function chat(message, gmina, onEvent) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ message, session_id: sessionId, gmina }),
  });
  if (!res.ok) throw await res.json();          // np. 422 {"error":{"code":"VALIDATION_ERROR",...}}
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const raw = buf.slice(0, i);
      buf = buf.slice(i + 2);
      let event = "message", data = "";
      for (const line of raw.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      onEvent(event, data ? JSON.parse(data) : null);
    }
  }
}
```

Nieznana gmina zwraca **422 przed otwarciem strumienia** (zwykły JSON błędu, nie SSE).
Przerwanie strumienia (`AbortController`) nie anuluje zapisu zgłoszenia.
