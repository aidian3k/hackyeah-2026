"""Idempotentny ingest korpusu `data/solutions/*.json` → `solutions` + `solution_chunks`.

    python -m scripts.ingest data/solutions/                 # wszystkie *.json w katalogu
    python -m scripts.ingest data/solutions/rops.json --dry-run
    python -m scripts.ingest --reembed-all                    # po zmianie modelu lub prefiksów
    python -m scripts.ingest data/solutions/x.json --keep-contact

- upsert po `source_url`, przy jego braku po `content_hash`,
- hash niezmieniony ⇒ tylko metadane (bez chunkowania i embeddingu),
- hash zmieniony / nowy ⇒ `api.corpus.rebuild_chunks`,
- commit per rekord — błąd jednego nie cofa reszty.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from collections.abc import Iterable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator, model_validator
from sqlalchemy import func, select

from api.config import settings
from api.corpus import content_hash, rebuild_chunks
from api.db import SessionLocal, engine
from api.models import (
    KnowledgeType,
    Solution,
    SolutionChunk,
    SolutionKind,
    SolutionOrigin,
    SolutionStatus,
)
from api.providers import EmbeddingProvider, get_embedding_provider


class IngestRecord(BaseModel):
    """Format pośredni (T04 / scraper ROPS T26)."""

    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    kind: Literal["SOLUTION", "KNOWLEDGE"] = "SOLUTION"
    knowledge_type: Literal["REPORT", "MATERIAL"] | None = None
    title: str = Field(min_length=1)
    summary: str = Field(min_length=1)
    body: str = ""
    organization: str | None = None
    gmina: str | None = None
    powiat: str | None = None
    category: str | None = None
    tags: list[str] = Field(default_factory=list)
    target_group: str | None = None
    cost_range: str | None = None
    implementation_steps: list[Any] = Field(default_factory=list)
    contact: dict[str, Any] = Field(default_factory=dict)
    source_url: str | None = None
    source_name: str | None = None
    evidence_level: int = Field(default=1, ge=1, le=5)
    media: list[Any] = Field(default_factory=list)

    @field_validator("body", mode="before")
    @classmethod
    def _body_none(cls, v: Any) -> Any:
        return "" if v is None else v

    @field_validator(
        "organization",
        "gmina",
        "powiat",
        "category",
        "target_group",
        "cost_range",
        "source_url",
        "source_name",
    )
    @classmethod
    def _empty_to_none(cls, v: str | None) -> str | None:
        return v or None

    @model_validator(mode="after")
    def _knowledge_type_rules(self) -> IngestRecord:
        if self.kind == "KNOWLEDGE" and self.knowledge_type is None:
            raise ValueError("knowledge_type: wymagane dla kind=KNOWLEDGE (REPORT | MATERIAL)")
        if self.kind == "SOLUTION" and self.knowledge_type is not None:
            raise ValueError("knowledge_type: niedozwolone dla kind=SOLUTION")
        if self.knowledge_type == "REPORT" and self.category is None:
            raise ValueError("category: wymagana dla knowledge_type=REPORT")
        return self


@dataclass
class Stats:
    added: int = 0
    updated: int = 0
    skipped: int = 0  # bez zmian treści (tylko metadane)
    errors: int = 0
    api_calls: int = 0
    reembedded: int = 0
    error_lines: list[str] = field(default_factory=list)

    def error(self, where: str, reason: str) -> None:
        self.errors += 1
        line = f"BŁĄD {where}: {reason}"
        self.error_lines.append(line)
        print(line, file=sys.stderr)


def _data_dir() -> Path:
    return Path(settings.DATA_DIR)


def load_taxonomy_codes() -> set[str]:
    rows = json.loads((_data_dir() / "taxonomy.json").read_text(encoding="utf-8"))
    return {row["code"] for row in rows}


def load_gmina_powiat() -> dict[str, str]:
    rows = json.loads((_data_dir() / "gminy-malopolska.json").read_text(encoding="utf-8"))
    return {row["name"]: row["powiat"] for row in rows}


def iter_files(paths: Iterable[str]) -> list[Path]:
    files: list[Path] = []
    for raw in paths:
        p = Path(raw)
        if p.is_dir():
            files.extend(sorted(p.glob("*.json")))
        else:
            files.append(p)
    return files


def _apply_metadata(sol: Solution, rec: IngestRecord, contact: dict[str, Any]) -> None:
    sol.kind = SolutionKind(rec.kind)
    sol.knowledge_type = KnowledgeType(rec.knowledge_type) if rec.knowledge_type else None
    sol.organization = rec.organization
    sol.gmina = rec.gmina
    sol.powiat = rec.powiat
    sol.category = rec.category
    sol.tags = rec.tags
    sol.target_group = rec.target_group
    sol.cost_range = rec.cost_range
    sol.implementation_steps = rec.implementation_steps
    sol.contact = contact
    sol.source_url = rec.source_url
    sol.source_name = rec.source_name
    sol.media = rec.media
    sol.evidence_level = rec.evidence_level


async def _find_existing(session, rec: IngestRecord, chash: str) -> Solution | None:
    if rec.source_url:
        stmt = select(Solution).where(Solution.source_url == rec.source_url)
    else:
        stmt = select(Solution).where(Solution.content_hash == chash)
    return (await session.execute(stmt.order_by(Solution.id).limit(1))).scalar_one_or_none()


async def _chunks_ok(session, solution_id: int) -> bool:
    """Czy rozwiązanie ma chunki i wszystkie mają embedding (np. po przerwanym ingeście)."""
    total, missing = (
        await session.execute(
            select(
                func.count(SolutionChunk.id),
                func.count(SolutionChunk.id).filter(SolutionChunk.embedding.is_(None)),
            ).where(SolutionChunk.solution_id == solution_id)
        )
    ).one()
    return total > 0 and missing == 0


async def ingest_record(
    rec: IngestRecord,
    *,
    keep_contact: bool,
    dry_run: bool,
    provider_factory,
    stats: Stats,
    rebuilt_ids: set[int],
) -> None:
    chash = content_hash(rec.title, rec.summary, rec.body)
    contact = rec.contact if keep_contact else {}
    async with SessionLocal() as session:
        existing = await _find_existing(session, rec, chash)

        if existing is None:
            if dry_run:
                stats.added += 1
                return
            sol = Solution(
                title=rec.title,
                summary=rec.summary,
                body=rec.body,
                content_hash=chash,
                origin=SolutionOrigin.CURATED,
                status=SolutionStatus.PUBLISHED,
            )
            _apply_metadata(sol, rec, contact)
            session.add(sol)
            await session.flush()
            stats.api_calls += await rebuild_chunks(session, sol, provider_factory())
            rebuilt_ids.add(sol.id)
            await session.commit()
            stats.added += 1
            return

        content_changed = existing.content_hash != chash
        needs_rebuild = content_changed or not await _chunks_ok(session, existing.id)
        if dry_run:
            if needs_rebuild:
                stats.updated += 1
            else:
                stats.skipped += 1
            return

        existing.title = rec.title
        existing.summary = rec.summary
        existing.body = rec.body
        existing.content_hash = chash
        _apply_metadata(existing, rec, contact)
        existing.updated_at = func.now()
        await session.flush()
        if needs_rebuild:
            stats.api_calls += await rebuild_chunks(session, existing, provider_factory())
            rebuilt_ids.add(existing.id)
        await session.commit()
        if needs_rebuild:
            stats.updated += 1
        else:
            stats.skipped += 1


async def reembed_all(provider_factory, stats: Stats, skip_ids: set[int]) -> None:
    async with SessionLocal() as session:
        ids = (await session.execute(select(Solution.id).order_by(Solution.id))).scalars().all()
    for sid in ids:
        if sid in skip_ids:
            continue
        try:
            async with SessionLocal() as session:
                sol = await session.get(Solution, sid)
                if sol is None:
                    continue
                stats.api_calls += await rebuild_chunks(session, sol, provider_factory())
                await session.commit()
                stats.reembedded += 1
        except Exception as exc:  # błąd jednego rekordu nie przerywa partii
            stats.error(f"solution id={sid}", f"{type(exc).__name__}: {exc}")


async def run(args: argparse.Namespace) -> Stats:
    stats = Stats()
    codes = load_taxonomy_codes()
    gmina_powiat = load_gmina_powiat()
    provider: EmbeddingProvider | None = None

    def provider_factory() -> EmbeddingProvider:
        nonlocal provider
        if provider is None:
            provider = get_embedding_provider()
        return provider

    rebuilt_ids: set[int] = set()
    try:
        for path in iter_files(args.paths):
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as exc:
                stats.error(str(path), f"nie można wczytać pliku: {exc}")
                continue
            if not isinstance(data, list):
                stats.error(str(path), "plik musi zawierać listę obiektów")
                continue
            print(f"{path}: {len(data)} rekordów")
            for idx, raw in enumerate(data):
                where = f"{path}[{idx}]"
                try:
                    rec = IngestRecord.model_validate(raw)
                except ValidationError as exc:
                    reasons = "; ".join(
                        f"{'.'.join(str(p) for p in e['loc']) or '-'}: {e['msg']}"
                        for e in exc.errors()
                    )
                    stats.error(where, reasons)
                    continue
                if rec.category is not None and rec.category not in codes:
                    stats.error(where, f"category {rec.category!r} spoza taksonomii")
                    continue
                if rec.gmina and not rec.powiat and rec.gmina in gmina_powiat:
                    rec.powiat = gmina_powiat[rec.gmina]
                try:
                    await ingest_record(
                        rec,
                        keep_contact=args.keep_contact,
                        dry_run=args.dry_run,
                        provider_factory=provider_factory,
                        stats=stats,
                        rebuilt_ids=rebuilt_ids,
                    )
                except Exception as exc:  # commit per rekord, partia leci dalej
                    stats.error(where, f"{type(exc).__name__}: {exc}")

        if args.reembed_all:
            if args.dry_run:
                print("--reembed-all pominięte w trybie --dry-run")
            else:
                await reembed_all(provider_factory, stats, rebuilt_ids)
    finally:
        await engine.dispose()
    return stats


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Ingest korpusu rozwiązań (format pośredni).")
    parser.add_argument("paths", nargs="*", help="pliki .json lub katalogi z plikami .json")
    parser.add_argument(
        "--dry-run", action="store_true", help="walidacja i raport, bez zapisu i bez API"
    )
    parser.add_argument(
        "--reembed-all",
        action="store_true",
        help="przelicz chunki i embeddingi wszystkich rozwiązań w bazie",
    )
    parser.add_argument(
        "--keep-contact",
        action="store_true",
        help="nie zeruj pola contact (tylko dla danych potwierdzonych jako publiczne)",
    )
    args = parser.parse_args(argv)
    if not args.paths and not args.reembed_all:
        parser.error("podaj pliki/katalogi albo --reembed-all")

    stats = asyncio.run(run(args))
    prefix = "[dry-run] " if args.dry_run else ""
    print(
        f"{prefix}dodane: {stats.added} / zaktualizowane: {stats.updated} / "
        f"pominięte: {stats.skipped} / błędne: {stats.errors}"
        + (f" / przeliczone (--reembed-all): {stats.reembedded}" if args.reembed_all else "")
        + f" | wywołania API embeddingów: {stats.api_calls}"
    )
    return 0  # błędne rekordy są raportowane, ale nie przerywają `make ingest`


if __name__ == "__main__":
    sys.exit(main())
