# feature-2026-10-04-3 — Funkcje AI na OpenAI (jeden dostawca dla LLM i embeddingów)

**Status:** wdrożone · **Plan:** [`plan.md`](plan.md)

Zespół doładował kredyty tylko w OpenAI (klucz `OPENAI_API_KEY` już obsługuje embeddingi); klucz Anthropic
nie ma środków, więc wszystkie funkcje oparte o LLM mają korzystać z OpenAI, żeby utrzymywać jedną subskrypcję.

## Do zmiany

1. **Wybór dostawcy LLM w konfiguracji**
   - nowa zmienna `LLM_PROVIDER` (`openai` | `anthropic`), domyślnie `openai`,
   - model OpenAI w osobnej zmiennej `OPENAI_LLM_MODEL` (domyślnie `gpt-6-luna`) i poziom rozumowania
     `OPENAI_LLM_REASONING_EFFORT` (domyślnie `none` — krótkie zadania, najniższe opóźnienie),
   - `LLM_MODEL` zostaje modelem Anthropic (`claude-haiku-4-5-20251001`), używanym tylko przy
     `LLM_PROVIDER=anthropic`; kod Anthropic zostaje jako alternatywa.

2. **Moduł 1 — streszczenie w czacie (SSE)**
   - przy `LLM_PROVIDER=openai` tokeny streszczenia strumieniuje OpenAI (Responses API),
   - kontrakt strumienia bez zmian: `status* → candidates → token* [→ answer_retracted] → report_saved → done`,
     cytowania `[n]`, błąd dostawcy → `error` `LLM_UNAVAILABLE` + `done`.

3. **Moduł 4 — raport i sugestia dopasowania (`complete()`)**
   - jednorazowa odpowiedź tekstowa z OpenAI; w `innovation_tests.ai_model` zapisuje się faktycznie użyty model.

4. **Moduł 3 — asystent Kreatora i szkic wniosku (`complete_json`)**
   - structured outputs OpenAI (`responses.parse` z modelem Pydantic), te same modele wyjścia i prompty,
   - `assist_available()` sprawdza klucz aktywnego dostawcy (`OPENAI_API_KEY` przy `openai`),
   - porażka (brak klucza, timeout `M3_ASSIST_TIMEOUT_SECONDS`, odpowiedź niepełna, odmowa, brak sparsowanego
     wyniku) → `ProviderError(<dostawca>, "LLM_UNAVAILABLE")`, jak dotąd.

5. **Prompt streszczenia M1 — dopasowanie częściowe** (iteracja 2, po weryfikacji na żywo)
   - reguła 3 `SYSTEM` (`api/pipeline/answer.py`, specyfikacja 6.6): gdy rozwiązanie odpowiada na problem
     choćby częściowo, model opisuje, czego dotyczy, i czego brakuje (z cytowaniem); „Nie mam dopasowanego
     rozwiązania w bazie.” tylko gdy żadne nie dotyczy problemu,
   - powód: `gpt-6-luna` stosował starą regułę dosłownie i na przykładzie z `AGENTS.md` (karty pasujące
     częściowo) odpowiadał odmową bez cytowań → `answer_retracted`.

6. **Dokumentacja decyzji**
   - ADR-020 w specyfikacji Modułu 1, wpisy w „Uwagach między zadaniami” M1, M3 i M4,
     `AGENTS.md` (Stack), `.env.example`, tabela triażu w `docs/modules/README.md`.

Poza zakresem: zmiana promptów M3/M4, embeddingów i rerankera; usuwanie kodu Anthropic.

## Kryterium akceptacji

- Bez ustawiania nowych zmiennych (`LLM_PROVIDER` domyślne) i z samym `OPENAI_API_KEY`:
  - `POST /api/chat` z przykładem z `AGENTS.md` daje pełny strumień z tokenami i cytowaniami `[n]`,
  - `POST /api/ideas/{id}/assist` (fiszka i blok kanwy) zwraca `available: true` z propozycjami,
  - `POST /api/applications/{id}/draft` zwraca szkic sekcji,
  - raport AI Modułu 4 generuje się przy `M4_AI_ENABLED=true`.
- W logach nadal brak treści użytkownika i promptów; `contact_email` nie trafia do promptów.
- `LLM_PROVIDER=anthropic` przywraca poprzednie zachowanie (kod bez zmian).
- `ruff check .` czysty.
