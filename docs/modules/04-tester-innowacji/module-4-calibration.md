# Moduł 4 — kalibracja i ścieżka demonstracyjna

## Uruchomienie

```bash
cp .env.example .env   # jeśli jeszcze nie
make up                # db + api :8000 + web :8080
# albo praca z HMR:
make up-dev            # api :8000, Vite :5173
```

Domyślnie `M4_AI_ENABLED=false` — Hub działa bez Anthropic (statystyki + komentarze).

Z AI:

```bash
# w .env
M4_AI_ENABLED=true
ANTHROPIC_API_KEY=...
```

Po zmianie env przebuduj API: `docker compose up -d --build api`.

## Seed demo

```bash
make reset-db          # świeży schemat (Moduł 1 + 4)
make ingest            # opcjonalnie korpus rozwiązań
docker compose exec api python -m scripts.seed_innovation_tests
# podmiana:
docker compose exec api python -m scripts.seed_innovation_tests --purge
```

Seed tworzy:

- rozwiązanie `PUBLISHED` (`content_hash = m4-seed-solution-v1`),
- nabór `OPEN` z dwoma materiałami,
- zgłoszenia: `SUBMITTED`, `ACCEPTED`, `REJECTED`, `COMPLETED`, `CANCELED`.

Skrypt wypisze `test_id` oraz jednorazowe linki `/testy/dostep/{token}` dla ACCEPTED i COMPLETED.

## Ścieżka demo (ręczna)

1. Publicznie: http://localhost:5173/testy (lub `:8080`) — lista OPEN.
2. Wejdź w nabór, wyślij zgłoszenie z zgodą.
3. Panel (rola administrator): `/panel/testy` → nabór → **Akceptuj**.
4. Skopiuj link testera i otwórz `/testy/dostep/...`.
5. Wypełnij cztery oceny 1–5 → status `COMPLETED`.
6. W panelu: **Pokaż raport**, moderuj komentarz, zamknij nabór.

## Weryfikacja API (skrót)

```bash
curl -s 'localhost:8000/api/innovation-tests' | python -m json.tool | head
curl -s -X POST "localhost:8000/api/innovation-tests/{id}/applications" \
  -H 'Content-Type: application/json' \
  -d '{"display_name":"Ala","email":"ala@example.com","tester_type":"RESIDENT","wojewodztwo":"małopolskie","powiat":"krakowski","gmina":"Zabierzów","is_target_group_member":true,"motivation":"Chcę pomóc lokalnie w teście.","consent":true}'
```

## Checklist jakości

- `ruff check .`
- `cd web && npm run lint && npm run build`
- publiczny endpoint nie zwraca e-maila testera ani plaintext tokenu (token tylko po akceptacji w panelu)
- drugi `POST` ankiety → 409
- nieistniejący token → 404
