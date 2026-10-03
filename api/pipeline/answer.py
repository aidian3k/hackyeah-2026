"""Generacja RAG (streszczenie z cytowaniami [n]) i strumieniowy filtr cytowań.

Kontekst dla modelu to wyłącznie karty główne (`SearchResult.solutions`) — nigdy
„zobacz też” ani wiedza (ADR-011). Tekst zgłoszenia i rozwiązań wchodzi tylko jako
blok danych w wiadomości użytkownika; instrukcje są wyłącznie w SYSTEM.
`generate` zwraca surowe fragmenty z LLM — filtr (`CitationFilter`) stosuje wołający.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from api.config import settings
from api.providers.base import LLMProvider
from api.schemas import SolutionCard

SYSTEM = """Jesteś asystentem Małopolskiego Hubu Innowacji Społecznych.
Odpowiadasz WYŁĄCZNIE na podstawie rozwiązań podanych w kontekście.

Zasady bezwzględne:
1. Każde twierdzenie opatrz cytowaniem [n] wskazującym numer rozwiązania z kontekstu.
2. Nigdy nie dodawaj informacji, faktu, nazwy ani liczby, której nie ma w kontekście.
3. Jeśli kontekst nie odpowiada na problem, napisz dokładnie: "Nie mam dopasowanego
   rozwiązania w bazie." i nic więcej.
4. Maksymalnie 4 zdania. Bez listy wypunktowanej - karty rozwiązań są pokazywane
   użytkownikowi osobno, nie powtarzaj ich treści.
5. Polski, prosty język urzędowo-ludzki. Bez zwrotów grzecznościowych na początku.
"""

USER = """Problem zgłoszony przez użytkownika:
{query}

Rozwiązania z bazy:
{context}

{vague_hint}"""

VAGUE_HINT = "Zapytanie jest ogólne. Dopisz na końcu jedno krótkie pytanie doprecyzowujące."

# Gramatyka cytowania: "[" + 1–2 cyfry + "]" — najwyżej 4 znaki.
_MAX_CITATION_LEN = 4
_MAX_CITATION_DIGITS = _MAX_CITATION_LEN - 2


def _truncate(text: str, limit: int) -> str:
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    cut = text[:limit]
    space = cut.rfind(" ")
    if space > limit // 2:
        cut = cut[:space]
    return cut.rstrip(" ,;:") + "…"


def build_context(cards: list[SolutionCard], best_chunks: dict[int, str]) -> str:
    """Numerowane bloki `[n]` w kolejności kart; brakujące pola pomijane."""
    blocks: list[str] = []
    for n, card in enumerate(cards, start=1):
        lines = [f"[{n}] {card.title}"]
        meta = [
            f"{label}: {value}"
            for label, value in (
                ("Organizacja", card.organization),
                ("Gmina", card.gmina),
                ("Kategoria", card.category),
            )
            if value
        ]
        if meta:
            lines.append(" | ".join(meta))
        if card.summary:
            lines.append(f"Opis: {' '.join(card.summary.split())}")
        chunk = best_chunks.get(card.id)
        if chunk and chunk.strip():
            lines.append(f"Fragment: {_truncate(chunk, settings.ANSWER_FRAGMENT_CHARS)}")
        blocks.append("\n".join(lines))
    return "\n\n".join(blocks)


def build_user_prompt(
    query: str,
    cards: list[SolutionCard],
    best_chunks: dict[int, str],
    too_vague: bool,
) -> str:
    return USER.format(
        query=query.strip(),
        context=build_context(cards, best_chunks),
        vague_hint=VAGUE_HINT if too_vague else "",
    ).rstrip()


async def generate(
    query: str,
    cards: list[SolutionCard],
    best_chunks: dict[int, str],
    too_vague: bool,
    llm: LLMProvider,
) -> AsyncIterator[str]:
    """Surowe fragmenty z LLM. `ProviderError` propaguje do wołającego (T19 → `error`)."""
    user = build_user_prompt(query, cards, best_chunks, too_vague)
    async for text in llm.stream(SYSTEM, user):
        if text:
            yield text


class CitationFilter:
    """Strumieniowy filtr cytowań `[n]`.

    Wstrzymuje fragment od `[` do `]` (najwyżej 4 znaki). Domknięte cyfrowe `[n]`
    z zakresu 1..n_cards przechodzi (`valid_citations += 1`), spoza zakresu jest
    wycinane (`hallucinated = True`). Wszystko inne wychodzi jako zwykły tekst.
    Granice fragmentów wejściowych są dowolne.
    """

    def __init__(self, n_cards: int):
        self.n_cards = n_cards
        self.hallucinated = False
        self.valid_citations = 0
        self.emitted_any = False
        self._buf = ""  # wstrzymany fragment zaczynający się od "["

    @property
    def should_retract(self) -> bool:
        return self.n_cards > 0 and self.emitted_any and self.valid_citations == 0

    def _emit(self, out: list[str], text: str) -> None:
        if text:
            out.append(text)
            if not self.emitted_any and text.strip():
                self.emitted_any = True

    def feed(self, text: str) -> str:
        out: list[str] = []
        plain_start = 0  # początek bieżącego odcinka zwykłego tekstu (poza buforem)
        i = 0
        while i < len(text):
            ch = text[i]
            if not self._buf:
                if ch == "[":
                    self._emit(out, text[plain_start:i])
                    self._buf = "["
                i += 1
                if self._buf:
                    plain_start = i
                continue

            # jesteśmy wewnątrz wstrzymanego fragmentu
            if ch == "]":
                inner = self._buf[1:]
                self._buf = ""
                if inner.isdigit():
                    n = int(inner)
                    if 1 <= n <= self.n_cards:
                        self.valid_citations += 1
                        self._emit(out, f"[{n}]")  # normalizacja, np. "[01]" -> "[1]"
                    else:
                        self.hallucinated = True
                else:  # "[]"
                    self._emit(out, f"[{inner}]")
                i += 1
                plain_start = i
            elif ch.isdigit() and len(self._buf) - 1 < _MAX_CITATION_DIGITS:
                self._buf += ch
                i += 1
                plain_start = i
            else:
                # to nie jest cytowanie: oddaj bufor jako tekst, znak przetwórz od nowa
                self._emit(out, self._buf)
                self._buf = ""
                plain_start = i
        if not self._buf:
            self._emit(out, text[plain_start:])
        return "".join(out)

    def flush(self) -> str:
        out: list[str] = []
        self._emit(out, self._buf)
        self._buf = ""
        return "".join(out)
