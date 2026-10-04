# feature-2026-10-04-7 — Tester: ankieta po teście krok po kroku

**Status:** wdrożone, do weryfikacji ręcznej

Uwagi z przeklikania Modułu 4: ankieta (`/testy/dostep/:token`) to cztery rzędy małych radiobuttonów z hasłami
(„Przydatność”) i dwa puste pola; nie widać, co się ocenia, a ankietę można wysłać tylko raz.

## Do zmiany

1. **Kontekst przed pytaniami**
   - Na górze: nazwa i krótki opis ocenianego rozwiązania, instrukcja testu, „ok. 3 minuty · 6 pytań”.
   - `GET /api/innovation-tests/access/{token}` zwraca dodatkowo `solution_title`, `solution_summary`,
     `instruction` (pola addytywne, bez danych kontaktowych).
2. **Jedno pytanie na ekran**
   - Sześć kroków: cztery oceny (przydatność, łatwość użycia, dostępność, dopasowanie do potrzeb) jako pytania
     z podpowiedzią, potem dwa pytania otwarte: „Co było najtrudniejsze albo niejasne?” (`comment`)
     i „Co warto zmienić, żeby działało lepiej?” (`improvement`), oba opcjonalne.
   - Pasek postępu i tekst „Pytanie N z 6”; przyciski „Wstecz” / „Dalej”.
   - Oceny jako duże kafelki 1–5 z podpisem skali (dostępna grupa radio, strzałki działają).
   - „Dalej” bez oceny: błąd pod pytaniem i fokus na kafelkach; zmiana kroku przenosi fokus na pytanie
     i ogłasza je czytnikowi.
3. **Podsumowanie przed wysłaniem**
   - Ekran „Sprawdź odpowiedzi”: lista odpowiedzi z przyciskiem „Zmień” przy każdej; jedyny przycisk CTA
     „Wyślij ankietę” jest tutaj. Informacja, że po wysłaniu nie da się poprawić odpowiedzi i że Hub może
     pokazać komentarze autorowi bez imienia.
4. **Bez zmian** w kontrakcie `POST /access/{token}`, skali 1–5 ani w bazie.

## Kryterium akceptacji

- Tester przechodzi 6 kroków klawiaturą i myszą, widzi podsumowanie, wysyła ankietę → status „ukończone”.
- Na każdym kroku widać, które to pytanie z ilu; nie da się przejść dalej bez oceny w krokach 1–4.
- Odpowiedź tokenowa zawiera nazwę rozwiązania i instrukcję, a nie zawiera e-maila, imienia ani adresu.
