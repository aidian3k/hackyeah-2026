"""Wspólne operacje na tekście dla preprocessingu (T10) i toru leksykalnego (T11)."""

from __future__ import annotations

import functools
import re
import unicodedata
from pathlib import Path

from api.config import settings

_REPO_ROOT = Path(__file__).resolve().parents[2]
_WORD_RE = re.compile(r"\w+")
# Litery, których NFKD nie rozkłada na bazę + znak łączący.
_MANUAL = str.maketrans({"ł": "l", "Ł": "L"})


def tokenize(text: str) -> list[str]:
    return _WORD_RE.findall(text.lower())


def strip_accents(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text.translate(_MANUAL))
    return "".join(ch for ch in decomposed if not unicodedata.combining(ch))


@functools.cache
def stopwords() -> frozenset[str]:
    data_dir = Path(settings.DATA_DIR)
    if not data_dir.is_absolute():
        data_dir = _REPO_ROOT / data_dir  # względem katalogu repozytorium, nie cwd
    path = data_dir / "stopwords-pl.txt"
    words: set[str] = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        w = line.strip().lower()
        if w and not w.startswith("#"):
            words.add(w)
    return frozenset(words)
