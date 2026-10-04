"""Scraper Biblioteki Innowacji Społecznych ROPS Kraków (T26).

Pobiera listę kategorii, strony kategorii i strony szczegółów innowacji, zapisuje:
- surowy zrzut ``data/raw/rops-biblioteka.raw.json`` (wszystkie sekcje, także „Autorzy”),
- format pośredni ingestu ``data/solutions/rops-biblioteka.json``.

Materiałów (PDF, ZIP, filmy, obrazki) nie pobiera — zapisuje tylko linki.

Uruchomienie::

    python -m scripts.scrape_rops [--cache-dir data/raw/html-cache] [--no-cache]
                                  [--limit N] [--delay 1.0]
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import re
import sys
import time
import unicodedata
from collections import Counter
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit

import httpx
from bs4 import BeautifulSoup, NavigableString, Tag

log = logging.getLogger("scrape_rops")

BASE_URL = "https://rops.krakow.pl"
LIBRARY_PATH = "/innowacje-spoleczne/biblioteka-innowacji-spolecznych"
CATEGORIES_URL = f"{BASE_URL}{LIBRARY_PATH}/kategorie"
SOURCE_NAME = "Biblioteka Innowacji Społecznych ROPS Kraków"
USER_AGENT = "HubMIHackYeah2026/0.1 (+kontakt w repozytorium)"
TIMEOUT_S = 20.0
ATTEMPTS = 3

REPO_ROOT = Path(__file__).resolve().parent.parent
CATEGORY_MAP_PATH = REPO_ROOT / "data" / "rops-category-map.json"
TAXONOMY_PATH = REPO_ROOT / "data" / "taxonomy.json"
RAW_OUT = REPO_ROOT / "data" / "raw" / "rops-biblioteka.raw.json"
SOLUTIONS_OUT = REPO_ROOT / "data" / "solutions" / "rops-biblioteka.json"
DEFAULT_CACHE_DIR = REPO_ROOT / "data" / "raw" / "html-cache"

TARGET_GROUP_MAX = 300
PROJECT_RE = re.compile(r"INNOWACJA WYBRANA DO UPOWSZECHNIANIA W RAMACH PROJEKTU\s*(.+)", re.I)
HEADING_NUM_RE = re.compile(r"^\s*\d+\s*[.)]\s*")
IMAGE_EXT = (".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".bmp")


# --------------------------------------------------------------------------- tekst


def clean(text: str | None) -> str:
    """NFC, &nbsp; -> spacja, zbite białe znaki."""
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text).replace("\xa0", " ")
    return re.sub(r"\s+", " ", text).strip()


def strip_heading_number(heading: str) -> str:
    return HEADING_NUM_RE.sub("", heading).strip()


def heading_key(heading: str) -> str:
    return strip_heading_number(heading).lower().rstrip("?:. ")


def is_authors(heading: str) -> bool:
    return heading_key(heading).startswith("autor")


def abs_url(href: str) -> str | None:
    href = (href or "").strip()
    if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
        return None
    url = urljoin(BASE_URL + "/", href)
    if not url.startswith(("http://", "https://")):
        return None
    return url


def is_library_page(url: str) -> bool:
    parts = urlsplit(url)
    return parts.netloc.endswith("rops.krakow.pl") and parts.path.startswith(LIBRARY_PATH)


def page_url(href: str) -> str:
    """Absolutny URL strony serwisu bez parametrów zapytania i fragmentu, zawsze https."""
    parts = urlsplit(urljoin(BASE_URL + "/", href.strip()))
    return urlunsplit(("https", parts.netloc, parts.path.rstrip("/"), "", ""))


# --------------------------------------------------------------------------- HTTP


@dataclass
class Fetcher:
    cache_dir: Path
    use_cache: bool
    delay: float
    requests: int = 0
    fetched_at: list[float] = field(default_factory=list)
    _client: httpx.Client | None = None
    _last: float = 0.0

    def _cache_path(self, url: str) -> Path:
        return self.cache_dir / f"{hashlib.sha1(url.encode()).hexdigest()}.html"

    def get(self, url: str) -> str:
        path = self._cache_path(url)
        if self.use_cache and path.exists():
            self.fetched_at.append(path.stat().st_mtime)
            return path.read_text(encoding="utf-8")
        html = self._fetch(url)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        path.write_text(html, encoding="utf-8")
        self.fetched_at.append(path.stat().st_mtime)
        return html

    def _fetch(self, url: str) -> str:
        if self._client is None:
            self._client = httpx.Client(
                headers={"User-Agent": USER_AGENT},
                timeout=TIMEOUT_S,
                follow_redirects=True,
            )
        last_exc: Exception | None = None
        for attempt in range(1, ATTEMPTS + 1):
            wait = self.delay - (time.monotonic() - self._last)
            if wait > 0:
                time.sleep(wait)
            self._last = time.monotonic()
            self.requests += 1
            try:
                resp = self._client.get(url)
                if resp.status_code == 404:
                    raise FetchError(f"HTTP 404: {url}")
                resp.raise_for_status()
                return resp.text
            except FetchError:
                raise
            except httpx.HTTPError as exc:
                last_exc = exc
                log.warning("próba %d/%d nieudana: %s (%s)", attempt, ATTEMPTS, url, exc)
                if attempt < ATTEMPTS:
                    time.sleep(self.delay * 2**attempt)
        raise FetchError(f"{url}: {last_exc}")

    def close(self) -> None:
        if self._client is not None:
            self._client.close()


class FetchError(Exception):
    pass


# --------------------------------------------------------------------------- parsowanie


def parse_category_links(html: str) -> list[str]:
    """Slugi kategorii w kolejności wystąpienia, deduplikowane po ścieżce."""
    soup = BeautifulSoup(html, "html.parser")
    prefix = LIBRARY_PATH + "/"
    slugs: list[str] = []
    for a in soup.find_all("a", href=True):
        path = urlsplit(urljoin(BASE_URL + "/", a["href"].strip())).path.rstrip("/")
        if not path.startswith(prefix):
            continue
        slug = path[len(prefix) :]
        if not slug or "/" in slug or "," in slug or slug == "kategorie":
            continue
        if slug not in slugs:
            slugs.append(slug)
    return slugs


@dataclass
class ListItem:
    slug: str
    url: str
    title: str
    description: str


def parse_category_page(html: str) -> tuple[str, list[ListItem]]:
    soup = BeautifulSoup(html, "html.parser")
    h2 = soup.select_one("h2.page-title")
    name = clean(h2.get_text(" ")) if h2 else ""
    items: list[ListItem] = []
    for div in soup.select("div.news-list__item"):
        a = div.select_one("a.news-list__title") or div.select_one("a.btn-read-more")
        if a is None or not a.get("href"):
            continue
        url = page_url(a["href"])
        last = urlsplit(url).path.rsplit("/", 1)[-1]
        if "," not in last:
            continue
        slug = last.split(",", 1)[1]
        desc = ""
        desc_el = div.select_one(".news-list__desc")
        if desc_el is not None:
            for p in desc_el.find_all("p"):
                if p.find_parent("table") is not None:
                    continue
                text = clean(p.get_text(" "))
                if text and not PROJECT_RE.match(text):
                    desc = text
                    break
        items.append(ListItem(slug=slug, url=url, title=clean(a.get_text(" ")), description=desc))
    return name, items


def _block_text(el: Tag) -> list[str]:
    """Akapity/punkty listy z elementu, listy jako ``- ``."""
    if el.name in ("ul", "ol"):
        out = []
        for li in el.find_all("li"):
            if li.find_parent(["ul", "ol"]) is not el:
                continue
            text = clean(li.get_text(" "))
            if text:
                out.append(f"- {text}")
        return out
    if el.name == "table":
        return []
    nested = [c for c in el.find_all(["p", "ul", "ol"], recursive=False)]
    if el.name not in ("p", "li") and nested:
        out = []
        for child in el.children:
            if isinstance(child, Tag):
                out.extend(_block_text(child))
            elif isinstance(child, NavigableString):
                text = clean(str(child))
                if text:
                    out.append(text)
        return out
    text = clean(el.get_text(" "))
    return [text] if text else []


def parse_sections(content: Tag) -> list[dict]:
    sections = []
    for h4 in content.find_all("h4"):
        heading = clean(h4.get_text(" "))
        parts: list[str] = []
        for sib in h4.next_siblings:
            if isinstance(sib, Tag):
                if sib.name == "h4" or sib.find("h4") is not None:
                    break
                parts.extend(_block_text(sib))
            elif isinstance(sib, NavigableString):
                text = clean(str(sib))
                if text:
                    parts.append(text)
        if heading:
            sections.append({"heading": heading, "text": "\n".join(parts)})
    return sections


def parse_links(content: Tag) -> list[dict]:
    """Linki z tabel ikon z etykietami z wiersza poniżej (ta sama kolumna)."""
    links: list[dict] = []
    seen: set[str] = set()
    for table in content.find_all("table"):
        rows = table.find_all("tr")
        grid: list[dict[int, Tag]] = [{} for _ in rows]
        for r, tr in enumerate(rows):
            col = 0
            for td in tr.find_all(["td", "th"], recursive=False):
                while col in grid[r]:
                    col += 1
                span_c = int(td.get("colspan", 1) or 1)
                span_r = int(td.get("rowspan", 1) or 1)
                for dr in range(span_r):
                    for dc in range(span_c):
                        if r + dr < len(rows):
                            grid[r + dr].setdefault(col + dc, td)
                col += span_c
        for r, row in enumerate(grid):
            for c, td in sorted(row.items()):
                for a in td.find_all("a", href=True):
                    url = abs_url(a["href"])
                    if url is None or url in seen:
                        continue
                    low = url.lower()
                    if "ikony_na_www" in low or urlsplit(low).path.endswith(IMAGE_EXT):
                        continue
                    if is_library_page(url):
                        continue  # ikona kategorii linkuje do strony kategorii — nie materiał
                    label = ""
                    for below in grid[r + 1 :]:
                        cell = below.get(c)
                        if cell is None or cell is td or cell.find("a") is not None:
                            continue
                        label = clean(cell.get_text(" "))
                        if label:
                            break
                    if not label:
                        label = clean(a.get_text(" "))
                    seen.add(url)
                    links.append({"label": label, "url": url})
    return links


def parse_detail(html: str) -> dict | None:
    soup = BeautifulSoup(html, "html.parser")
    h2 = soup.select_one("h2.page-title")
    if h2 is None:
        return None
    main = soup.select_one("div.content__main")
    content = main.select_one("div.text-content") if main is not None else None
    if content is None:
        return None
    project = None
    for p in content.find_all("p"):
        m = PROJECT_RE.match(clean(p.get_text(" ")))
        if m:
            project = m.group(1).strip().strip('"„”“').strip()
            break
    return {
        "title": clean(h2.get_text(" ")),
        "project": project,
        "sections": parse_sections(content),
        "links": parse_links(content),
    }


# --------------------------------------------------------------------------- mapowanie


def media_type(label: str, url: str) -> str:
    lab = label.lower()
    if "dowiedz" in lab:
        return "document"
    if "film" in lab:
        return "video"
    if "pobierz" in lab or "materia" in lab:
        return "materials"
    if "zasad" in lab or "licenc" in lab:
        return "license"
    low = url.lower()
    path = urlsplit(low).path
    if path.endswith(".pdf"):
        return "document"
    if "youtube.com" in low or "youtu.be" in low:
        return "video"
    if path.endswith(".zip"):
        return "materials"
    if "creativecommons.org" in low:
        return "license"
    return "link"


def first_sentence(text: str) -> str:
    text = clean(text.replace("\n", " "))
    m = re.match(r"(.+?[.!?])(\s|$)", text)
    return m.group(1) if m else text


def to_markdown(sections: list[dict]) -> str:
    parts = []
    for s in sections:
        if is_authors(s["heading"]) or not s["text"].strip():
            continue
        paras = "\n\n".join(line for line in s["text"].split("\n") if line.strip())
        parts.append(f"## {strip_heading_number(s['heading'])}\n\n{paras}\n\n")
    return "".join(parts).strip()


def find_section(sections: list[dict], *keys: str) -> dict | None:
    for s in sections:
        k = heading_key(s["heading"])
        if any(k.startswith(key) for key in keys):
            return s
    return None


def build_record(inn: dict, cat_names: dict[str, str], cat_map: dict[str, str]) -> dict:
    sections = inn["sections"]
    summary = inn["list_description"]
    if not summary:
        s = find_section(sections, "na czym polega")
        summary = first_sentence(s["text"]) if s else ""
    tg = find_section(sections, "grupa docelowa")
    target_group = None
    if tg and tg["text"].strip():
        target_group = clean(tg["text"].replace("\n", " ").replace("- ", " "))[:TARGET_GROUP_MAX]
        target_group = target_group.strip() or None
    tags = [f"ROPS: {cat_names[c]}" for c in inn["categories"]]
    if inn["project"]:
        tags.append(f"Projekt: {inn['project']}")
    media = [
        {
            "type": media_type(link["label"], link["url"]),
            "url": link["url"],
            "title": (link["label"][:1].upper() + link["label"][1:]) or None,
        }
        for link in inn["links"]
    ]
    return {
        "kind": "SOLUTION",
        "title": inn["title"],
        "summary": summary,
        "body": to_markdown(sections),
        "organization": None,
        "gmina": None,
        "powiat": None,
        "category": cat_map[inn["categories"][0]],
        "tags": tags,
        "target_group": target_group,
        "cost_range": None,
        "implementation_steps": [],
        "contact": {"name": None, "email": None, "phone": None},
        "source_url": inn["url"],
        "source_name": SOURCE_NAME,
        "evidence_level": 3 if find_section(sections, "czy to działa") else 2,
        "media": media,
    }


# --------------------------------------------------------------------------- main


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def run(args: argparse.Namespace) -> int:
    cat_map: dict[str, str] = json.loads(CATEGORY_MAP_PATH.read_text(encoding="utf-8"))
    taxonomy = {t["code"] for t in json.loads(TAXONOMY_PATH.read_text(encoding="utf-8"))}
    bad = {slug: code for slug, code in cat_map.items() if code not in taxonomy}
    if bad:
        log.error("rops-category-map.json: kody spoza taksonomii: %s", bad)
        return 2
    map_order = {slug: i for i, slug in enumerate(cat_map)}

    fetcher = Fetcher(Path(args.cache_dir), use_cache=not args.no_cache, delay=args.delay)
    try:
        cat_slugs = parse_category_links(fetcher.get(CATEGORIES_URL))
        unknown = [s for s in cat_slugs if s not in cat_map]
        if unknown:
            log.error(
                "kategorie ROPS bez wpisu w %s: %s — dopisz mapowanie",
                CATEGORY_MAP_PATH.relative_to(REPO_ROOT),
                ", ".join(unknown),
            )
            return 2

        categories: list[dict] = []
        cat_names: dict[str, str] = {}
        innovations: dict[str, dict] = {}
        for cslug in cat_slugs:
            curl = f"{BASE_URL}{LIBRARY_PATH}/{cslug}"
            name, items = parse_category_page(fetcher.get(curl))
            cat_names[cslug] = name or cslug
            categories.append(
                {
                    "slug": cslug,
                    "name": cat_names[cslug],
                    "url": curl,
                    "innovations": [it.slug for it in items],
                }
            )
            for it in items:
                inn = innovations.setdefault(
                    it.slug,
                    {"slug": it.slug, "list_items": [], "categories": []},
                )
                inn["list_items"].append((cslug, it))
                if cslug not in inn["categories"]:
                    inn["categories"].append(cslug)

        slugs = sorted(
            innovations, key=lambda s: min(map_order[c] for c in innovations[s]["categories"])
        )
        if args.limit:
            slugs = slugs[: args.limit]

        raw_innovations: list[dict] = []
        skipped: list[tuple[str, str]] = []
        for slug in slugs:
            inn = innovations[slug]
            inn["categories"].sort(key=lambda c: map_order[c])
            primary = inn["categories"][0]
            item = next(it for c, it in inn["list_items"] if c == primary)
            desc = next((it.description for _, it in inn["list_items"] if it.description), "")
            try:
                detail = parse_detail(fetcher.get(item.url))
            except FetchError as exc:
                log.warning("pomijam %s: %s", item.url, exc)
                skipped.append((item.url, str(exc)))
                continue
            if detail is None:
                log.warning("pomijam %s: brak h2.page-title lub div.text-content", item.url)
                skipped.append((item.url, "brak h2.page-title / div.text-content"))
                continue
            raw_innovations.append(
                {
                    "slug": slug,
                    "url": item.url,
                    "title": detail["title"] or item.title,
                    "list_description": desc,
                    "project": detail["project"],
                    "categories": inn["categories"],
                    "sections": detail["sections"],
                    "links": detail["links"],
                }
            )
    finally:
        fetcher.close()

    raw_innovations.sort(key=lambda i: i["slug"])
    # znacznik czasu = najpóźniejsze pobranie strony (z cache: mtime pliku) — deterministyczny
    scraped_at = datetime.fromtimestamp(max(fetcher.fetched_at), UTC).replace(microsecond=0)
    write_json(
        RAW_OUT,
        {
            "scraped_at": scraped_at.isoformat(),
            "source": CATEGORIES_URL,
            "categories": categories,
            "innovations": raw_innovations,
        },
    )

    records = [build_record(i, cat_names, cat_map) for i in raw_innovations]
    invalid = [r["source_url"] for r in records if not (r["title"] and r["summary"] and r["body"])]
    for url in invalid:
        log.warning("rekord bez title/summary/body — pomijam: %s", url)
        skipped.append((url, "pusty title/summary/body"))
    records = sorted(
        (r for r in records if r["source_url"] not in invalid), key=lambda r: r["source_url"]
    )
    write_json(SOLUTIONS_OUT, records)

    # podsumowanie
    print(f"Kategorie: {len(categories)}")
    for c in categories:
        print(f"  {c['slug']:<46} {len(c['innovations']):>3}  ({c['name']})")
    print(f"Unikalne innowacje: {len(innovations)}")
    print(f"Rekordy zapisane: {len(records)} -> {SOLUTIONS_OUT.relative_to(REPO_ROOT)}")
    print(f"Pominięte: {len(skipped)}")
    for url, reason in skipped:
        print(f"  {url}  ({reason})")
    types = Counter(m["type"] for r in records for m in r["media"])
    print("Linki per typ: " + ", ".join(f"{t}={n}" for t, n in sorted(types.items())))
    print(f"Żądania HTTP: {fetcher.requests}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--cache-dir", default=str(DEFAULT_CACHE_DIR))
    parser.add_argument("--no-cache", action="store_true", help="wymuś pobranie stron")
    parser.add_argument("--limit", type=int, default=0, help="maks. liczba innowacji")
    parser.add_argument("--delay", type=float, default=1.0, help="przerwa między żądaniami [s]")
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    return run(args)


if __name__ == "__main__":
    sys.exit(main())
