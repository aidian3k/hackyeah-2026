# feature-2026-10-04-1 — plan

## Stan obecny

- `api/providers/llm.py` — `AnthropicLLMProvider` (`stream()` dla M1, `complete()` dla M4), model `LLM_MODEL`.
- `api/providers/__init__.py` — `get_llm_provider()` zawsze zwraca Anthropic.
- `api/providers/llm_assist.py` — M3: `assist_available()` (sprawdza `ANTHROPIC_API_KEY`) i
  `complete_json()` przez Anthropic `messages.parse`.
- `api/pipeline/innovation_tests.py` — zapisuje `settings.LLM_MODEL` w `ai_model`.
- SDK: `openai` 3.24.0 i `anthropic` 1.11.0 (lokalnie i w kontenerze api) — bez zmian w `pyproject.toml`.

## Wybór modelu

Model `gpt-6-luna` — według https://developers.openai.com/api/docs/models najtańszy model z bieżącej linii
(0,10 USD / 1M tokenów wejścia, 0,50 USD / 1M wyjścia), przeznaczony do „focused, high-volume work”;
strona modelu (https://developers.openai.com/api/docs/models/gpt-6-luna) wymienia `streaming` i
`structured_outputs`, Responses i Chat Completions. To model rozumujący: poziomy `none`…`max`, domyślnie
`medium`. Przewodnik https://developers.openai.com/api/docs/guides/reasoning: limit to `max_output_tokens`
i obejmuje też tokeny rozumowania — dlatego domyślnie `reasoning.effort = "none"` (zero tokenów rozumowania,
najszybszy pierwszy token, istniejące limity `LLM_MAX_TOKENS` / `M3_ASSIST_*` / `M4_AI_MAX_TOKENS` wystarczą).
Nie wysyłamy `temperature` (dokumentacja nie potwierdza wsparcia dla modeli rozumujących).
Sprawdzone kluczem projektu: `GET /v1/models/gpt-6-luna` → 200; `responses.parse` i `responses.stream`
z `effort=none` działają, polski tekst poprawny.

## Kroki

1. `api/config.py` — `LLM_PROVIDER`, `OPENAI_LLM_MODEL`, `OPENAI_LLM_REASONING_EFFORT`; właściwości
   `llm_model` (model aktywnego dostawcy) i `llm_api_key` (klucz aktywnego dostawcy).
2. `api/providers/llm_openai.py` (nowy) — `OpenAILLMProvider` z `stream()` (`responses.stream`, zdarzenia
   `response.output_text.delta`) i `complete()` (`responses.create`, `output_text`); oba z
   `instructions=system`, `input=user`, `max_output_tokens`, `reasoning.effort`; każdy wyjątek SDK →
   `ProviderError("openai", "LLM_UNAVAILABLE")`, odpowiedź `incomplete`/`failed` w `complete()` też.
3. `api/providers/__init__.py` — `get_llm_provider()` wybiera po `LLM_PROVIDER`; nieznana nazwa → `ValueError`.
4. `api/providers/llm.py` — tylko docstring (Anthropic jako alternatywa); kod bez zmian.
5. `api/providers/llm_assist.py` — gałąź OpenAI: `responses.parse(text_format=Model)`, klient z
   `timeout=M3_ASSIST_TIMEOUT_SECONDS`; sukces tylko przy `status == "completed"` i `output_parsed`;
   `assist_available()` sprawdza `settings.llm_api_key`; logi: dostawca, model, czas, tokeny, status.
   Gałąź Anthropic bez zmian w zachowaniu.
6. `api/pipeline/innovation_tests.py` — `ai_model = settings.llm_model`.
7. Dokumentacja: ADR-020 i wiersze sekcji 11 w specyfikacji M1, „Uwagi” M1/M3/M4, `AGENTS.md`,
   `.env.example`, `docs/modules/README.md`.

8. (odejście od planu) `api/pipeline/answer.py` — reguła 3 promptu streszczenia dopuszcza dopasowanie
   częściowe (spec, punkt 5); ta sama zmiana w 6.6 specyfikacji M1.

Prompty M3 i M4 bez zmian, więc wersje promptów (`M4_AI_PROMPT_VERSION`, `M4_AI_FIT_PROMPT_VERSION`) zostają.

## Weryfikacja ręczna

- `ruff check .`
- restart api, potem curl czatu z `AGENTS.md` (kolejność zdarzeń, tokeny, `[n]`),
- `POST /api/ideas/1/assist` `{"target":"idea"}` i `{"target":"canvas_block","block_id":"actors_support"}`,
- `POST /api/ideas/1/applications` `{"call_id":"iws2-demo"}` → `POST /api/applications/{id}/draft`,
- M4: regeneracja raportu przy `M4_AI_ENABLED=true` (endpoint albo wywołanie w procesie),
- logi api: brak treści promptów i odpowiedzi.

## Wynik (2026-10-04)

Bez zmian w `.env` (domyślne `LLM_PROVIDER=openai` wystarcza); api z `--reload` wczytało kod sam.

- `ruff check .` — czysto. `ruff format --check` czysty w zmienionych plikach poza `api/pipeline/innovation_tests.py`
  (różnice formatowania sprzed zmiany, odnotowane w TI08).
- **M1 czat** (przykład z `AGENTS.md`): przed poprawką promptu `status×3 → candidates → status → token×14 →
  answer_retracted → report_saved → done` (model: „Nie mam dopasowanego rozwiązania w bazie.”, także przy
  `effort=low`); po poprawce `status×3 → candidates → status → token×95 → report_saved → done`, odpowiedź
  z cytowaniami `[1]`, `[2]`, `[3]`. Drugie zapytanie (opiekunowie osób z niepełnosprawnością) — to samo,
  2,4 s całość. Zgłoszenia testowe: `report_id` 18–23.
- **M3**: `POST /api/ideas/1/assist` `{"target":"idea"}` → `available:true`, 3 pytania, 1–3 propozycje
  (4–5 s); `{"target":"canvas_block","block_id":"actors_support"}` → 3 pytania, 5 propozycji (3,3 s).
  `POST /api/ideas/1/applications {"call_id":"iws2-demo"}` → wniosek `id=1` (zostaje w bazie);
  `POST /api/applications/1/draft {"section_id":"diagnosis"}` → `available:true`, szkic 1476 znaków (6,3 s).
  Logi: dostawca, model, czas, tokeny, status — bez treści promptów i odpowiedzi.
- **M4**: `build_test_report(test 1, regenerate_ai=True)` w procesie z `M4_AI_ENABLED=true` → `ai_available:true`,
  raport JSON poprawny, `ai_model=gpt-6-luna` (zapisany w `innovation_tests` id 1). Endpointu
  `/report/regenerate` nie sprawdzano (w kontenerze `M4_AI_ENABLED=false`). `suggest_tester_fit` nie sprawdzany
  osobno — ta sama ścieżka `complete()`.
- **Ścieżki błędów**: bez `OPENAI_API_KEY` `stream()`/`complete()` → `ProviderError LLM_UNAVAILABLE`,
  `assist_available()=false`; `LLM_PROVIDER=anthropic` → `AnthropicLLMProvider`, `llm_model=claude-haiku-4-5-20251001`.
  Gałęzi Anthropic nie wywołano na żywo (brak kredytów).
- Obserwacja: pierwsze wywołanie asystenta trwało 87 s — chwilowe błędy sieci (w tym samym czasie embedding
  dał `EMBEDDING_UNAVAILABLE`), SDK OpenAI ponawia domyślnie 2 razy, więc najgorszy przypadek to
  ok. 3 × `M3_ASSIST_TIMEOUT_SECONDS`. Kolejne wywołania 3–6 s.
