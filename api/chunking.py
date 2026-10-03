"""Chunkowanie rozwiązań (czyste funkcje, bez I/O).

- chunk 0: `title + "\\n" + summary` — trafia w większość zapytań,
- chunki >= 1: `body` pocięte po akapitach do ~CHUNK_TARGET_CHARS, z zakładką
  ~CHUNK_OVERLAP_CHARS na granicach zdań; linia nagłówka markdown ustawia `heading`
  dla kolejnych chunków (sam nagłówek nie wchodzi do `content`),
- krótkie `body` (< CHUNK_MIN_BODY_CHARS) ⇒ dokładnie jeden chunk z całością.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from api.config import settings

_HEADING_RE = re.compile(r"^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$")
# Koniec zdania: . ! ? … (opcjonalnie cudzysłów/nawias), potem spacja i wielka litera
# albo cudzysłów otwierający. Cyfra po kropce nie kończy zdania („ok. 60 osób”).
_SENTENCE_SPLIT_RE = re.compile(r"(?:(?<=[.!?…])|(?<=[.!?…][\"”»)]))\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ„\"«(–-])")
_SENTENCE_SPLIT_LOOSE_RE = re.compile(r"(?<=[.!?…])\s+")


@dataclass
class ChunkDraft:
    chunk_index: int
    heading: str | None
    content: str


def _sentences(text: str) -> list[str]:
    parts = _SENTENCE_SPLIT_RE.split(text.strip())
    out: list[str] = []
    for part in parts:
        part = part.strip()
        if part:
            out.append(part)
    return out


def _hard_split(text: str, limit: int) -> list[str]:
    """Zdanie dłuższe niż limit: tnij na granicy zdań (luźniej), a w ostateczności po spacji."""
    pieces: list[str] = []
    for sentence in _SENTENCE_SPLIT_LOOSE_RE.split(text):
        sentence = sentence.strip()
        while len(sentence) > limit:
            cut = sentence.rfind(" ", 0, limit)
            if cut <= 0:
                cut = limit
            pieces.append(sentence[:cut].strip())
            sentence = sentence[cut:].strip()
        if sentence:
            pieces.append(sentence)
    return pieces


def _overlap_tail(text: str, overlap: int) -> str:
    """Końcowe zdania poprzedniego chunku o łącznej długości ~overlap (granica zdania)."""
    if overlap <= 0:
        return ""
    sentences = _sentences(text)
    tail: list[str] = []
    total = 0
    for sentence in reversed(sentences):
        if total + len(sentence) > overlap:
            break
        tail.insert(0, sentence)
        total += len(sentence) + 1
    if not tail and sentences and len(sentences) > 1 and len(sentences[-1]) <= 2 * overlap:
        tail = [sentences[-1]]
    return " ".join(tail)


def _sections(body: str) -> list[tuple[str | None, list[str]]]:
    """Podział body na sekcje (nagłówek, akapity)."""
    sections: list[tuple[str | None, list[str]]] = []
    heading: str | None = None
    paragraphs: list[str] = []
    current: list[str] = []

    def end_paragraph() -> None:
        if current:
            paragraphs.append(" ".join(line.strip() for line in current).strip())
            current.clear()

    for line in body.splitlines():
        match = _HEADING_RE.match(line)
        if match:
            end_paragraph()
            if paragraphs:
                sections.append((heading, paragraphs))
            heading = match.group(1).strip() or None
            paragraphs = []
        elif not line.strip():
            end_paragraph()
        else:
            current.append(line)
    end_paragraph()
    if paragraphs:
        sections.append((heading, paragraphs))
    return sections


def _pack_section(paragraphs: list[str], target: int, overlap: int) -> list[str]:
    """Pakuje akapity (a za długie akapity — zdania) w chunki ≤ ~target + overlap."""
    units: list[tuple[str, bool]] = []  # (tekst, czy zaczyna nowy akapit)
    for paragraph in paragraphs:
        if len(paragraph) <= target:
            units.append((paragraph, True))
            continue
        first = True
        for sentence in _sentences(paragraph):
            for piece in _hard_split(sentence, target) if len(sentence) > target else [sentence]:
                units.append((piece, first))
                first = False

    chunks: list[str] = []
    buf = ""
    has_new = False  # czy bufor ma coś poza zakładką
    for text, new_paragraph in units:
        sep = "\n\n" if new_paragraph else " "
        candidate = f"{buf}{sep}{text}" if buf else text
        if buf and has_new and len(candidate) > target:
            chunks.append(buf)
            tail = _overlap_tail(buf, overlap)
            buf = f"{tail}{sep}{text}" if tail else text
        else:
            buf = candidate
        has_new = True
    if buf and has_new:
        chunks.append(buf)
    return chunks


def chunk_solution(title: str, summary: str, body: str) -> list[ChunkDraft]:
    title = (title or "").strip()
    summary = (summary or "").strip()
    body = (body or "").strip()
    head = f"{title}\n{summary}"

    if len(body) < settings.CHUNK_MIN_BODY_CHARS:
        content = f"{head}\n{body}" if body else head
        return [ChunkDraft(chunk_index=0, heading=None, content=content)]

    drafts = [ChunkDraft(chunk_index=0, heading=None, content=head)]
    for heading, paragraphs in _sections(body):
        for content in _pack_section(
            paragraphs, settings.CHUNK_TARGET_CHARS, settings.CHUNK_OVERLAP_CHARS
        ):
            drafts.append(ChunkDraft(chunk_index=len(drafts), heading=heading, content=content))
    return drafts


def passage_text(title: str, chunk: ChunkDraft) -> str:
    """Tekst do embeddingu (bez prefiksu `passage:` — dokleja go provider)."""
    if chunk.chunk_index == 0:
        return chunk.content
    return f"{title}\n{chunk.heading or ''}\n{chunk.content}".strip()
