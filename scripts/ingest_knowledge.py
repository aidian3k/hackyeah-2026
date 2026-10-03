"""Ingest profili wyzwań i wskaźników Modułu 2 (idempotentny).

    python -m scripts.ingest_knowledge data/knowledge/

Ładuje `challenges.json` (upsert po `category`) i `indicators.json` (upsert po `code`, wartości
per powiat podmieniane w całości w jednej transakcji na wskaźnik). Raporty i materiały (rekordy
`KNOWLEDGE`) ładuje `scripts/ingest.py` — patrz `make ingest-knowledge`. Błędny wpis nie przerywa
reszty; podsumowanie jak w `scripts/ingest.py`, kod wyjścia 1 przy błędach.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from dataclasses import dataclass, field
from decimal import Decimal
from pathlib import Path
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator
from sqlalchemy import delete, func, select

from api.config import settings
from api.db import SessionLocal, engine
from api.models import ChallengeProfile, Indicator, IndicatorValueRow, Taxonomy
from api.schemas import KeyFact

OTHER_CATEGORY = "OTHER"


class ChallengeRecord(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    category: str
    lead_pl: str = Field(min_length=1)
    key_facts: list[KeyFact] = Field(default_factory=list)
    is_demo: bool = True


class IndicatorRecord(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    code: str = Field(min_length=1)
    category: str
    label_pl: str = Field(min_length=1)
    unit: str
    year: int
    higher_is_worse: bool = True
    region_value: float | None = None
    source_name: str = Field(min_length=1)
    source_url: str | None = None
    is_demo: bool = True
    sort_order: int = 100
    values: dict[str, float]

    @field_validator("source_url")
    @classmethod
    def _empty_to_none(cls, v: str | None) -> str | None:
        return v or None


@dataclass
class Stats:
    added: int = 0
    updated: int = 0
    skipped: int = 0
    errors: int = 0
    error_lines: list[str] = field(default_factory=list)

    def error(self, where: str, reason: str) -> None:
        self.errors += 1
        print(f"BŁĄD {where}: {reason}", file=sys.stderr)


def _data_dir() -> Path:
    return Path(settings.DATA_DIR)


def load_powiaty() -> set[str]:
    gminy = json.loads((_data_dir() / "gminy-malopolska.json").read_text(encoding="utf-8"))
    return {g["powiat"] for g in gminy}


def _read_list(path: Path, stats: Stats) -> list[Any]:
    if not path.exists():
        stats.error(str(path), "brak pliku")
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        stats.error(str(path), f"nie można wczytać pliku: {exc}")
        return []
    if not isinstance(data, list):
        stats.error(str(path), "plik musi zawierać listę obiektów")
        return []
    return data


def _reasons(exc: ValidationError) -> str:
    return "; ".join(
        f"{'.'.join(str(p) for p in e['loc']) or '-'}: {e['msg']}" for e in exc.errors()
    )


async def load_challenges(path: Path, codes: set[str], stats: Stats) -> None:
    for idx, raw in enumerate(_read_list(path, stats)):
        where = f"{path}[{idx}]"
        try:
            rec = ChallengeRecord.model_validate(raw)
        except ValidationError as exc:
            stats.error(where, _reasons(exc))
            continue
        if rec.category not in codes:
            stats.error(where, f"category {rec.category!r} spoza taksonomii (bez {OTHER_CATEGORY})")
            continue
        facts = [f.model_dump() for f in rec.key_facts]
        try:
            async with SessionLocal() as session:
                row = await session.get(ChallengeProfile, rec.category)
                if row is None:
                    session.add(
                        ChallengeProfile(
                            category=rec.category,
                            lead_pl=rec.lead_pl,
                            key_facts=facts,
                            is_demo=rec.is_demo,
                        )
                    )
                    stats.added += 1
                elif (row.lead_pl, row.key_facts, row.is_demo) != (
                    rec.lead_pl,
                    facts,
                    rec.is_demo,
                ):
                    row.lead_pl, row.key_facts, row.is_demo = rec.lead_pl, facts, rec.is_demo
                    row.updated_at = func.now()
                    stats.updated += 1
                else:
                    stats.skipped += 1
                await session.commit()
        except Exception as exc:  # błąd jednego wpisu nie przerywa partii
            stats.error(where, f"{type(exc).__name__}: {exc}")


async def load_indicators(path: Path, codes: set[str], powiaty: set[str], stats: Stats) -> None:
    for idx, raw in enumerate(_read_list(path, stats)):
        where = f"{path}[{idx}]"
        try:
            rec = IndicatorRecord.model_validate(raw)
        except ValidationError as exc:
            stats.error(where, _reasons(exc))
            continue
        if rec.category not in codes:
            stats.error(where, f"category {rec.category!r} spoza taksonomii (bez {OTHER_CATEGORY})")
            continue
        if set(rec.values) != powiaty:
            missing = sorted(powiaty - set(rec.values))
            extra = sorted(set(rec.values) - powiaty)
            stats.error(where, f"values: brakuje {missing}, nadmiarowe {extra}")
            continue
        try:
            async with SessionLocal() as session:
                row = await session.get(Indicator, rec.code)
                current = {
                    r.powiat: float(r.value)
                    for r in (
                        await session.execute(
                            select(IndicatorValueRow).where(
                                IndicatorValueRow.indicator_code == rec.code
                            )
                        )
                    )
                    .scalars()
                    .all()
                }
                meta = {
                    "category": rec.category,
                    "label_pl": rec.label_pl,
                    "unit": rec.unit,
                    "year": rec.year,
                    "higher_is_worse": rec.higher_is_worse,
                    "region_value": rec.region_value,
                    "source_name": rec.source_name,
                    "source_url": rec.source_url,
                    "is_demo": rec.is_demo,
                    "sort_order": rec.sort_order,
                }
                if row is None:
                    session.add(Indicator(code=rec.code, **meta))
                    stats.added += 1
                else:
                    changed = any(
                        (
                            float(getattr(row, k))
                            if isinstance(getattr(row, k), Decimal)
                            else getattr(row, k)
                        )
                        != v
                        for k, v in meta.items()
                    )
                    if changed or current != rec.values:
                        for k, v in meta.items():
                            setattr(row, k, v)
                        row.updated_at = func.now()
                        stats.updated += 1
                    else:
                        stats.skipped += 1
                if row is None or current != rec.values:
                    await session.flush()
                    await session.execute(
                        delete(IndicatorValueRow).where(
                            IndicatorValueRow.indicator_code == rec.code
                        )
                    )
                    session.add_all(
                        IndicatorValueRow(indicator_code=rec.code, powiat=p, value=v)
                        for p, v in rec.values.items()
                    )
                await session.commit()
        except Exception as exc:
            stats.error(where, f"{type(exc).__name__}: {exc}")


async def run(directory: Path) -> Stats:
    stats = Stats()
    try:
        powiaty = load_powiaty()
        async with SessionLocal() as session:
            codes = set((await session.execute(select(Taxonomy.code))).scalars().all())
        codes.discard(OTHER_CATEGORY)
        await load_challenges(directory / "challenges.json", codes, stats)
        await load_indicators(directory / "indicators.json", codes, powiaty, stats)
    finally:
        await engine.dispose()
    return stats


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Ingest profili wyzwań i wskaźników (Moduł 2).")
    parser.add_argument("directory", help="katalog z challenges.json i indicators.json")
    args = parser.parse_args(argv)
    stats = asyncio.run(run(Path(args.directory)))
    print(
        f"dodane: {stats.added} / zaktualizowane: {stats.updated} / "
        f"bez zmian: {stats.skipped} / błędy: {stats.errors}"
    )
    return 1 if stats.errors else 0


if __name__ == "__main__":
    sys.exit(main())
