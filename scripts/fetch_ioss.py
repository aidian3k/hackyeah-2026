"""Pobranie wskaźników z IOSS (Internetowy Obserwator Statystyk Społecznych ROPS) → indicators.json.

    python -m scripts.fetch_ioss [--only 285,91] [--out data/knowledge/indicators.json]

Struktura IOSS (sprawdzona 2026-10-04): `GET https://obserwator.rops.krakow.pl/differenceanalysis/{id}`
zwraca stronę renderowaną po stronie serwera dla najnowszego roku i układu „powiaty” (22 wiersze).
Tabela `#myChart0sorttable`: `<td>powiat bocheński</td><td class="text-right"> 17.66% </td>`.
Nazwy powiatów: „powiat bocheński”, „powiat m. Kraków”, „powiat m. Tarnów” — mapowane jawnie na
nazwy z `data/gminy-malopolska.json` (np. „olkuski”, „Tarnów”). Rok czytamy z nagłówka strony
(„… > województwo małopolskie - 2024”); etykieta i jednostka pochodzą z pliku konfiguracyjnego
`data/knowledge/ioss-indicators.json`, bo IOSS podaje jednostkę tylko jako przyrostek wartości.
Wartości dla województwa IOSS w tej tabeli nie podaje — `region_value = null`
(nie liczymy średniej).
WebFetch dostaje 403, dlatego zwykły HTTP z nagłówkiem User-Agent przeglądarki i przerwą ≥ 1 s.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import time
from pathlib import Path

import httpx

from api.config import settings

IOSS_URL = "https://obserwator.rops.krakow.pl/differenceanalysis/{id}"
USER_AGENT = "Mozilla/5.0 (compatible; HubMIHackYeah/1.0)"
SOURCE_NAME = "IOSS ROPS Kraków (GUS BDL)"
REQUEST_PAUSE_S = 1.0

_TABLE_RE = re.compile(r'id="myChart0sorttable".*?</table>', re.S)
_ROW_RE = re.compile(r"<tr[^>]*>\s*<td>(.*?)</td>\s*<td[^>]*>(.*?)</td>", re.S)
_YEAR_RE = re.compile(r'<p class="small"><strong>.*?</strong>.*?-\s*(\d{4})\s*</p>', re.S)
_NUMBER_RE = re.compile(r"-?\d+(?:[.,]\d+)?")


def _data_dir() -> Path:
    return Path(settings.DATA_DIR)


def load_powiaty() -> set[str]:
    gminy = json.loads((_data_dir() / "gminy-malopolska.json").read_text(encoding="utf-8"))
    return {g["powiat"] for g in gminy}


def map_powiat(ioss_name: str, powiaty: set[str]) -> str:
    """„powiat olkuski” → „olkuski”, „powiat m. Tarnów” → „Tarnów”; nieznana nazwa = błąd."""
    name = html.unescape(ioss_name).strip()
    name = re.sub(r"^powiat\s+", "", name)
    name = re.sub(r"^m\.\s*", "", name)
    if name not in powiaty:
        raise ValueError(f"nieznany powiat IOSS: {ioss_name!r}")
    return name


def parse_page(page: str, powiaty: set[str]) -> tuple[int, dict[str, float]]:
    """Zwraca (rok, {powiat: wartość}); ValueError, gdy brak tabeli lub roku."""
    table = _TABLE_RE.search(page)
    year = _YEAR_RE.search(page)
    if not table or not year:
        raise ValueError("brak tabeli powiatów lub roku na stronie")
    values: dict[str, float] = {}
    for name, raw in _ROW_RE.findall(table.group(0)):
        cell = html.unescape(re.sub(r"<[^>]+>", "", raw)).strip()
        number = _NUMBER_RE.search(cell)
        if not number:
            continue  # brak danych dla powiatu — wskaźnik odpadnie przy kontroli kompletu
        values[map_powiat(name, powiaty)] = float(number.group(0).replace(",", "."))
    return int(year.group(1)), values


def fetch_indicator(client: httpx.Client, spec: dict, powiaty: set[str]) -> dict:
    response = client.get(IOSS_URL.format(id=spec["id"]))
    response.raise_for_status()
    year, values = parse_page(response.text, powiaty)
    if set(values) != powiaty:
        raise ValueError(f"komplet {len(values)}/{len(powiaty)} powiatów")
    return {
        "code": f"IOSS_{spec['id']}",
        "category": spec["category"],
        "label_pl": spec["label_pl"],
        "unit": spec["unit"],
        "year": year,
        "higher_is_worse": spec["higher_is_worse"],
        "region_value": None,
        "source_name": SOURCE_NAME,
        "source_url": IOSS_URL.format(id=spec["id"]),
        "is_demo": False,
        "sort_order": spec["sort_order"],
        "values": dict(sorted(values.items())),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Pobranie wskaźników IOSS → indicators.json.")
    parser.add_argument(
        "--only", help="lista id IOSS po przecinku (domyślnie wszystkie z konfiguracji)"
    )
    parser.add_argument("--out", default=str(_data_dir() / "knowledge" / "indicators.json"))
    args = parser.parse_args(argv)

    specs = json.loads(
        (_data_dir() / "knowledge" / "ioss-indicators.json").read_text(encoding="utf-8")
    )
    if args.only:
        wanted = {int(x) for x in args.only.split(",")}
        specs = [s for s in specs if s["id"] in wanted]
    powiaty = load_powiaty()

    results: list[dict] = []
    with httpx.Client(
        headers={"User-Agent": USER_AGENT}, timeout=30, follow_redirects=True
    ) as client:
        for i, spec in enumerate(specs):
            if i:
                time.sleep(REQUEST_PAUSE_S)
            try:
                results.append(fetch_indicator(client, spec, powiaty))
                print(f"IOSS {spec['id']}: {results[-1]['label_pl']} ({results[-1]['year']}) OK")
            except (httpx.HTTPError, ValueError) as exc:
                print(f"POMINIĘTO IOSS {spec['id']}: {exc}", file=sys.stderr)

    if not results:
        return 1
    results.sort(key=lambda r: (r["category"], r["sort_order"]))
    Path(args.out).write_text(
        json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"zapisano {len(results)} wskaźników → {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
