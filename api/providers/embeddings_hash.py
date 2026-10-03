"""Deweloperski provider embeddingów `hash` (decyzja [ORCH], tryb bez kluczy API).

Deterministyczny wektor z haszowanych cech, L2-normalizowany. Nie jest modelem
semantycznym — łapie wspólne słownictwo, odmiany słów i synonimy domenowe:

- słowa po zdjęciu ogonków, bez stopwords (`data/stopwords-pl.txt`) i bez słów < 3 znaków,
- „stem” = prefiks słowa (`_STEM_LEN` znaków) — tani odpowiednik lematyzacji polskich odmian
  („samotni” / „samotność” → „samot”, „seniorzy” / „seniorów” → „senio”),
- pojęcia z `data/synonyms.json` (+ kilka potocznych słów w `_EXTRA_CONCEPTS`): każde słowo
  z grupy synonimów dokłada cechę pojęcia, więc „starsi ludzie” i „seniorzy” mają wspólną cechę,
- waga 0,5–1,0 wg IDF z korpusu `data/solutions/*.json` (słowa typu „osoby”, „pomoc” ważą
  mniej; słowa spoza korpusu — maksymalnie); cechy pojęć × 1,5,
- tłumienie powtórzeń (1 + ln(liczba)).

Bez n-gramów znakowych: przy 1024 kubełkach generowały kolizje, które dawały szum ~0,2
cosinusa dla zapytań spoza tematu. Wynik zależy od plików korpusu (IDF) — korpus i zapytania
muszą być liczone tym samym providerem w tym samym stanie `data/`; po zmianie tego pliku albo
korpusu: `python -m scripts.ingest data/solutions/ --reembed-all` i ponowny seed zgłoszeń.
"""

from __future__ import annotations

import functools
import hashlib
import json
import math
import re
from collections import Counter
from pathlib import Path

from api.config import settings
from api.pipeline.text import stopwords, strip_accents

_REPO_ROOT = Path(__file__).resolve().parents[2]
_WORD_RE = re.compile(r"\w+", re.UNICODE)
_MIN_WORD_LEN = 3
_STEM_LEN = 5
_CONCEPT_WEIGHT = 1.5
_IDF_FLOOR = 0.5  # waga = floor + (1 - floor) * idf; domenowe słowa korpusu nie znikają
_CORPUS_TEXT_FIELDS = ("title", "summary", "body", "target_group")

# Potoczne słowa zgłoszeń, których nie ma w `synonyms.json` (klucz = pojęcie z tego pliku).
_EXTRA_CONCEPTS: dict[str, tuple[str, ...]] = {
    "samotność": ("sami", "sama", "samemu", "samotnie", "pogadać", "porozmawiać"),
    "senior": ("babcia", "babci", "dziadek", "dziadka", "dziadkowie", "staruszek", "staruszki"),
    "młodzież": ("nastolatki", "nastolatków", "nastolatek", "młodzi", "młodych", "uczniowie"),
    "dzieci": ("dziecko", "dziecka", "dzieciaki", "maluchy"),
    "transport": ("dojechać", "dojazd", "dojazdu", "busa", "busów", "pks"),
    "szkolenie": ("kurs", "kursy", "warsztaty", "warsztatów", "nauczyć"),
}


def _data_dir() -> Path:
    data_dir = Path(settings.DATA_DIR)
    return data_dir if data_dir.is_absolute() else _REPO_ROOT / data_dir


def _norm(text: str) -> str:
    return strip_accents(text.lower())


def _stem(word: str) -> str:
    return word[:_STEM_LEN]


@functools.cache
def _stop() -> frozenset[str]:
    return frozenset(_norm(w) for w in stopwords())


@functools.cache
def _concepts() -> dict[str, tuple[str, ...]]:
    """stem → pojęcia (klucze grup synonimów), tylko jednowyrazowe warianty."""
    path = _data_dir() / "synonyms.json"
    groups: dict[str, list[str]] = (
        json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    )
    merged = {k: list(v) for k, v in groups.items()}
    for key, extra in _EXTRA_CONCEPTS.items():
        merged.setdefault(key, []).extend(extra)
    out: dict[str, set[str]] = {}
    for key, variants in merged.items():
        concept = _norm(key)
        for term in [key, *variants]:
            words = [w for w in _WORD_RE.findall(_norm(term)) if w not in _stop()]
            if len(words) != 1 or len(words[0]) < _MIN_WORD_LEN:
                continue
            out.setdefault(_stem(words[0]), set()).add(concept)
    return {k: tuple(sorted(v)) for k, v in out.items()}


def _raw_features(text: str) -> Counter[str]:
    counts: Counter[str] = Counter()
    stop = _stop()
    concepts = _concepts()
    for word in _WORD_RE.findall(_norm(text)):
        if len(word) < _MIN_WORD_LEN or word in stop:
            continue
        stem = _stem(word)
        counts["s:" + stem] += 1
        for c in concepts.get(stem, ()):
            counts["c:" + c] += 1
    return counts


@functools.cache
def _idf() -> tuple[dict[str, float], float]:
    """IDF cech po rekordach korpusu (`data/solutions/*.json`), znormalizowane do [0, 1]."""
    df: Counter[str] = Counter()
    n_docs = 0
    for path in sorted((_data_dir() / "solutions").glob("*.json")):
        try:
            records = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        for rec in records if isinstance(records, list) else []:
            if not isinstance(rec, dict):
                continue
            text = "\n".join(str(rec.get(f) or "") for f in _CORPUS_TEXT_FIELDS)
            df.update(_raw_features(text).keys())
            n_docs += 1
    max_idf = math.log(n_docs + 1) if n_docs else 1.0
    idf = {f: math.log((n_docs + 1) / (d + 1)) / max_idf for f, d in df.items()}
    return idf, 1.0


def _weight(feature: str) -> float:
    idf, default = _idf()
    w = _IDF_FLOOR + (1.0 - _IDF_FLOOR) * idf.get(feature, default)
    return w * _CONCEPT_WEIGHT if feature.startswith("c:") else w


def _bucket(feature: str, dim: int) -> tuple[int, float]:
    digest = hashlib.blake2b(feature.encode("utf-8"), digest_size=8).digest()
    value = int.from_bytes(digest, "big")
    return value % dim, (1.0 if (value >> 63) & 1 else -1.0)


def hash_embed(text: str, dim: int) -> list[float]:
    vec = [0.0] * dim
    for feature, count in _raw_features(text).items():
        idx, sign = _bucket(feature, dim)
        vec[idx] += sign * _weight(feature) * (1.0 + math.log(count))
    norm = math.sqrt(sum(x * x for x in vec))
    if norm == 0.0:
        return vec
    return [x / norm for x in vec]


class HashEmbeddingProvider:
    name = "hash"

    def __init__(self) -> None:
        self.dim = settings.EMBEDDING_DIM
        self.query_prefix = settings.EMBEDDING_QUERY_PREFIX
        self.passage_prefix = settings.EMBEDDING_PASSAGE_PREFIX

    async def embed_query(self, text: str) -> list[float]:
        return hash_embed(self.query_prefix + text, self.dim)

    async def embed_passages(self, texts: list[str]) -> list[list[float]]:
        return [hash_embed(self.passage_prefix + t, self.dim) for t in texts]
