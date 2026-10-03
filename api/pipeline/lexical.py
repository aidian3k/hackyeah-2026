"""Tor leksykalny (T11): pełnotekstowe wyszukiwanie po `solution_chunks.ts`.

Zapytanie budujemy w Pythonie jako OR słów treściowych (bez stemmingu AND dałby pustą
listę). Tekst użytkownika nigdy nie trafia surowo do `to_tsquery` — każdy leksem jest
czyszczony do liter, cyfr i `_` i ujęty w apostrofy. Ogonki zdejmuje `unaccent`
w konfiguracji `polish_simple`, więc w Pythonie nie transliterujemy.
"""

from __future__ import annotations

import re

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import settings
from api.pipeline.text import stopwords, tokenize
from api.pipeline.types import Candidate, ProcessedQuery

_NON_WORD_RE = re.compile(r"[^\w]")
# Numer uchwały itp. ("XII/123/2024"): parser Postgresa indeksuje go jako jeden token `file`.
_SLASH_IDENT_RE = re.compile(r"\w+(?:/\w+)+")

_LEXICAL_SQL = text(
    """
    WITH q AS (
        SELECT to_tsquery('polish_simple', :tsq_string) AS tsq
    ),
    hits AS (
        SELECT DISTINCT ON (c.solution_id)
               c.solution_id,
               c.id                        AS chunk_id,
               ts_rank_cd(c.ts, q.tsq, 32) AS score
        FROM solution_chunks c
        JOIN solutions s ON s.id = c.solution_id
        CROSS JOIN q
        WHERE s.status = 'PUBLISHED'
          AND s.kind = 'SOLUTION'
          AND c.ts @@ q.tsq
        ORDER BY c.solution_id, score DESC, c.id
    )
    SELECT solution_id, chunk_id, score,
           ROW_NUMBER() OVER (ORDER BY score DESC, solution_id) AS rnk
    FROM hits
    ORDER BY score DESC, solution_id
    LIMIT :candidates_per_track
    """
)


def lexeme(token: str) -> str | None:
    """Leksem tsquery w apostrofach; None, gdy po czyszczeniu nic nie zostaje."""
    cleaned = _NON_WORD_RE.sub("", token).lower()
    return f"'{cleaned}'" if cleaned else None


def _phrase(words: list[str]) -> str | None:
    """Fraza `('a' <-> 'b')`; pojedyncze słowo bez nawiasów."""
    lexemes = [lx for lx in (lexeme(w) for w in words) if lx]
    if not lexemes:
        return None
    if len(lexemes) == 1:
        return lexemes[0]
    return "(" + " <-> ".join(lexemes) + ")"


def build_tsquery(q: ProcessedQuery) -> str | None:
    stop = stopwords()
    terms = [t for t in tokenize(q.normalized) if t not in stop and len(t) >= 3]
    terms = terms[: settings.MAX_TSQUERY_TERMS]

    parts: list[str | None] = [lexeme(t) for t in terms]
    # Synonimy domenowe; formy wielowyrazowe ("usługi opiekuńcze") jako frazy.
    parts += [_phrase(tokenize(term)) for term in q.expanded_terms]
    # Nazwy własne / numery uchwał jako frazy; tokenize dzieli też po "/" i "-".
    parts += [_phrase(tokenize(ident)) for ident in q.identifiers]
    # ...oraz w całości (leksem 'xii/123/2024'); "/" w apostrofach jest bezpieczny.
    parts += [f"'{m.lower()}'" for ident in q.identifiers for m in _SLASH_IDENT_RE.findall(ident)]

    unique: list[str] = []
    for part in parts:
        if part and part not in unique:
            unique.append(part)
    return " | ".join(unique) or None


async def lexical_search(session: AsyncSession, q: ProcessedQuery) -> list[Candidate]:
    tsq = build_tsquery(q)
    if tsq is None:
        return []
    result = await session.execute(
        _LEXICAL_SQL,
        {"tsq_string": tsq, "candidates_per_track": settings.CANDIDATES_PER_TRACK},
    )
    return [
        Candidate(
            solution_id=row.solution_id,
            chunk_id=row.chunk_id,
            rank=int(row.rnk),
            score=float(row.score),
        )
        for row in result
    ]
