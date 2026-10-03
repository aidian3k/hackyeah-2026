"""Preprocessing zapytania (T10): normalizacja i metadane, bez LLM, < 5 ms.

Preprocessing dodaje metadane, nie odbiera treści: `normalized` to pełny tekst
(tor semantyczny potrzebuje zdań), a nie lista słów kluczowych.
"""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

from api.config import settings
from api.pipeline.text import stopwords, strip_accents, tokenize
from api.pipeline.types import ProcessedQuery

_REPO_ROOT = Path(__file__).resolve().parents[2]


def _data_path(name: str) -> Path:
    data_dir = Path(settings.DATA_DIR)
    if not data_dir.is_absolute():
        data_dir = _REPO_ROOT / data_dir  # względem katalogu repozytorium, nie cwd
    return data_dir / name


def _load_json(name: str):
    return json.loads(_data_path(name).read_text(encoding="utf-8"))


class UnknownGminaError(ValueError):
    """Gmina spoza listy `data/gminy-malopolska.json` (router zamienia na 422)."""

    def __init__(self, gmina: str) -> None:
        super().__init__(f"Nieznana gmina: {gmina!r}")
        self.gmina = gmina


# --- Słowniki (ładowane raz przy imporcie) ---

GMINY: dict[str, str] = {g["name"]: g["powiat"] for g in _load_json("gminy-malopolska.json")}

_TAXONOMY_ORDER: dict[str, int] = {
    t["code"]: t.get("sort_order", 0) for t in _load_json("taxonomy.json")
}


def _keyword_regex(keyword: str) -> str:
    """Słowo = prefiks; fraza = kolejne prefiksy słów (po lower + strip_accents)."""
    return r"\w*\W+".join(re.escape(w) for w in strip_accents(keyword.lower()).split())


def _compile_groups(groups: list[tuple[str, list[str]]]) -> tuple[re.Pattern[str], list[str]]:
    """Jeden wzorzec dla wszystkich grup (grupa nazwana `g<i>`) — jedno przejście po tekście."""
    alternatives = []
    for i, (_, keywords) in enumerate(groups):
        alts = sorted((_keyword_regex(k) for k in keywords if k.strip()), key=len, reverse=True)
        if alts:
            alternatives.append(f"(?P<g{i}>" + "|".join(alts) + ")")
    return re.compile(r"(?<!\w)(?:" + "|".join(alternatives) + ")"), [g[0] for g in groups]


# Kategorie posortowane po sort_order => przy remisie wygrywa pierwsza.
_CATEGORY_RE, _CATEGORY_CODES = _compile_groups(
    sorted(
        _load_json("category-keywords.json").items(),
        key=lambda item: _TAXONOMY_ORDER.get(item[0], 10**6),
    )
)

# Heurystyka grupy docelowej (prefiksy po lower + strip_accents). Kolejność = priorytet remisu.
_TARGET_RE, _TARGET_LABELS = _compile_groups(
    [
        (
            "osoby starsze",
            [
                "senior",
                "starsz",
                "starsi",
                "emeryt",
                "rencist",
                "65+",
                "60+",
                "podeszly wiek",
                "podeszlym wieku",
                "dziadk",
                "babci",
            ],
        ),
        (
            "dzieci i młodzież",
            [
                "dzieci",
                "dziecko",
                "dzieck",
                "mlodziez",
                "nastolat",
                "uczni",
                "uczen",
                "uczennic",
                "mlodych",
                "mlodzi",
            ],
        ),
        ("rodziny", ["rodzin", "rodzic", "wielodzietn"]),
        ("osoby z niepełnosprawnościami", ["niepelnospraw", "na wozku", "autyz"]),
    ]
)


def _load_synonym_groups() -> list[tuple[list[str], set[str]]]:
    """Grupa = klucz + wartości. Zwraca (formy oryginalne, formy złożone bez ogonków)."""
    groups: list[tuple[list[str], set[str]]] = []
    for key, values in _load_json("synonyms.json").items():
        forms: list[str] = []
        for form in [key, *values]:
            form = " ".join(form.lower().split())
            if form and form not in forms:
                forms.append(form)
        groups.append((forms, {strip_accents(f) for f in forms}))
    return groups


_SYNONYM_GROUPS = _load_synonym_groups()

# --- Wyrażenia ---

_WS_RE = re.compile(r"\s+")
_GREETING_RE = re.compile(
    r"^(cześć|dzień dobry|witam|hej|dobry wieczór|szanowni państwo)(?!\w)[,!.\s]*",
    re.IGNORECASE,
)
_QUOTE_RES = (
    re.compile(r'"([^"]+)"'),
    re.compile(r"„([^„”\"“]+)[”\"“]"),
    re.compile(r"»([^»«]+)«"),
    re.compile(r"«([^«»]+)»"),
)
_WORD_SPAN_RE = re.compile(r"[^\W\d_]+")  # same litery
_EDGE_PUNCT = ".,;:!?()[]{}\"'„”“«»<>"
_SENTENCE_END = ".!?\n"


def _normalize(message: str) -> str:
    text = unicodedata.normalize("NFC", message)
    text = _WS_RE.sub(" ", text).strip()
    return text[: settings.MAX_QUERY_CHARS].strip()


def _strip_greetings(text: str) -> str:
    while True:
        stripped = _GREETING_RE.sub("", text, count=1)
        if stripped == text:
            break
        text = stripped
    return text


def _extract_identifiers(text: str) -> list[str]:
    found: list[tuple[int, str]] = []  # (pozycja, identyfikator) — sortujemy po wystąpieniu

    # Wyrazy CAPS (3+ liter) oraz ciągi alfanumeryczne z cyfrą (XII/123/2024).
    for m in re.finditer(r"\S+", text):
        word = m.group().strip(_EDGE_PUNCT)
        if not word:
            continue
        has_digit = any(ch.isdigit() for ch in word)
        has_alpha_or_sep = any(ch.isalpha() or ch == "/" for ch in word)
        if has_digit and has_alpha_or_sep and re.fullmatch(r"[\w/.\-]+", word):
            found.append((m.start(), word))
        elif len(word) >= 3 and word.isalpha() and word.isupper():
            found.append((m.start(), word))

    # Frazy w cudzysłowie.
    for pattern in _QUOTE_RES:
        for m in pattern.finditer(text):
            phrase = m.group(1).strip()
            if phrase:
                found.append((m.start(), phrase))

    # 2+ kolejne wyrazy z wielkiej litery, nie na początku zdania.
    run: list[re.Match[str]] = []

    def flush() -> None:
        if len(run) >= 2:
            found.append((run[0].start(), " ".join(w.group() for w in run)))
        run.clear()

    prev_end = 0
    for m in _WORD_SPAN_RE.finditer(text):
        gap = text[prev_end : m.start()]
        first_word = prev_end == 0
        prev_end = m.end()
        tail = gap.rstrip(" \"'„“«»(")
        sentence_start = (first_word and not tail) or (bool(tail) and tail[-1] in _SENTENCE_END)
        capitalized = m.group()[0].isupper() and not sentence_start
        if run and (gap.strip() or not capitalized):
            flush()
        if capitalized:
            run.append(m)
    flush()

    result: list[str] = []
    seen: set[str] = set()
    for _, ident in sorted(found, key=lambda item: item[0]):
        key = ident.lower()
        if key not in seen:
            seen.add(key)
            result.append(ident)
    return result


def _best_group(folded: str, pattern: re.Pattern[str], names: list[str]) -> str | None:
    hits = [0] * len(names)
    for m in pattern.finditer(folded):
        hits[int(m.lastgroup[1:])] += 1
    best = max(range(len(names)), key=lambda i: (hits[i], -i))  # remis => niższy indeks
    return names[best] if hits[best] else None


def _classify_category(folded: str) -> str:
    # TODO(backlog): klasyfikator LLM — nie w PoC.
    return _best_group(folded, _CATEGORY_RE, _CATEGORY_CODES) or "OTHER"


def _target_group(folded: str) -> str | None:
    return _best_group(folded, _TARGET_RE, _TARGET_LABELS)


def _expand_synonyms(tokens: list[str]) -> list[str]:
    folded_tokens = [strip_accents(t) for t in tokens]
    present = set(folded_tokens)
    folded_text = " " + " ".join(folded_tokens) + " "
    expanded: list[str] = []
    seen: set[str] = set(present)
    for forms, folded_forms in _SYNONYM_GROUPS:
        hit = any(
            (f in present) if " " not in f else (f" {f} " in folded_text) for f in folded_forms
        )
        if not hit:
            continue
        for form in forms:
            key = strip_accents(form)
            if key not in seen:
                seen.add(key)
                expanded.append(form)
    return expanded


def _is_too_vague(tokens: list[str]) -> bool:
    stop = stopwords()
    content = [t for t in tokens if len(t) >= 3 and t not in stop]
    return len(content) < settings.VAGUE_MIN_WORDS


def preprocess(message: str, gmina: str | None) -> ProcessedQuery:
    normalized = _normalize(message)
    without_greeting = _strip_greetings(normalized)
    if without_greeting:  # sam wstęp grzecznościowy — zostawiamy tekst, żeby nie był pusty
        normalized = without_greeting

    gmina = gmina.strip() if gmina else None
    powiat: str | None = None
    if gmina:
        if gmina not in GMINY:
            raise UnknownGminaError(gmina)
        powiat = GMINY[gmina]

    tokens = tokenize(normalized)
    folded = strip_accents(normalized.lower())

    return ProcessedQuery(
        raw=message,
        normalized=normalized,
        gmina=gmina,
        powiat=powiat,
        category=_classify_category(folded),
        target_group=_target_group(folded),
        identifiers=_extract_identifiers(normalized),
        expanded_terms=_expand_synonyms(tokens),
        too_vague=_is_too_vague(tokens),
    )
