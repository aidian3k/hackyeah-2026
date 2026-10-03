"""Seed demo Modułu 3 (K06): 4 fikcyjne pomysły z kanwą i odpowiedziami Hubu.

    python -m scripts.seed_ideas                  # dosyła brakujące pomysły (klucz: title)
    python -m scripts.seed_ideas --purge          # najpierw usuwa pomysły seedu (po title)
    python -m scripts.seed_ideas --purge-only     # tylko usuwa pomysły seedu
    python -m scripts.seed_ideas --file data/ideas-seed.json

Dane: `data/ideas-seed.json`. Zapis bezpośrednio przez sesję SQLAlchemy z tą samą walidacją
co API: pola fiszki przez `IdeaCreate`, odpowiedzi przez `ReplyCreate`, kanwa przez
`merge_blocks({}, blocks)` (K02), gmina z `GMINY`, kategoria z `challenge_taxonomy`.
Etap (`ideas.stage`) i blok `solution_readiness` są zgodne (ADR-M3-004).

`source_report_session` wskazuje zgłoszenie z `data/reports-seed.json` po `session_id`
(np. `seed-demo-01`); gdy w bazie go nie ma, pomysł powstaje bez `source_report_id`.
Seed wypisuje tylko identyfikatory, tytuły, statusy i postęp kanwy — bez danych kontaktowych.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from pydantic import ValidationError
from sqlalchemy import delete, func, select

from api.config import settings
from api.db import SessionLocal, engine
from api.kreator.canvas import merge_blocks, progress
from api.kreator.models import Idea, IdeaCanvas, IdeaReply, IdeaStage, IdeaStatus
from api.kreator.schemas import IdeaCreate
from api.models import Report, Taxonomy
from api.pipeline.preprocess import GMINY
from api.schemas import ReplyCreate

DEFAULT_FILE = Path(settings.DATA_DIR) / "ideas-seed.json"
STAGE_BLOCK = "solution_readiness"
_IDEA_FIELDS = ("title", "summary", "essence", "audience", "stage", "category", "gmina")
_IDEA_FIELDS_OPT = ("author_name", "contact_email")


def _fail(where: str, message: str) -> SystemExit:
    return SystemExit(f"{where}: {message}")


def _prepare(entry: dict[str, Any], where: str) -> dict[str, Any]:
    """Waliduje wpis seedu; zwraca znormalizowane pola, kanwę i odpowiedzi."""
    for key in (*_IDEA_FIELDS, "status", "canvas"):
        if key not in entry:
            raise _fail(where, f"brakuje pola {key!r}")
    fields = {k: entry[k] for k in _IDEA_FIELDS}
    fields.update({k: entry.get(k) for k in _IDEA_FIELDS_OPT})
    try:
        idea = IdeaCreate(**fields)
        replies = [ReplyCreate(**r) for r in entry.get("replies", [])]
    except ValidationError as exc:
        raise _fail(where, str(exc)) from exc

    if idea.gmina not in GMINY:
        raise _fail(where, f"nieznana gmina {idea.gmina!r}")
    status = IdeaStatus(entry["status"])
    if status == IdeaStatus.SUBMITTED and replies:
        # Odpowiedź Hubu przenosi SUBMITTED → IN_REVIEW (K03) — taki wpis byłby niespójny.
        raise _fail(where, "status SUBMITTED nie może mieć odpowiedzi Hubu")

    canvas_in = dict(entry["canvas"])
    readiness = canvas_in.get(STAGE_BLOCK)
    if readiness is not None and readiness != idea.stage:
        raise _fail(where, f"{STAGE_BLOCK}={readiness!r} różni się od stage={idea.stage!r}")
    if idea.stage != IdeaStage.IDEA.value:
        canvas_in[STAGE_BLOCK] = idea.stage
    try:
        canvas = merge_blocks({}, canvas_in)
    except ValueError as exc:
        raise _fail(where, f"kanwa: {exc}") from exc

    return {
        "idea": idea,
        "status": status,
        "canvas": canvas,
        "replies": list(zip(replies, entry.get("replies", []), strict=True)),
        "source_report_session": entry.get("source_report_session"),
        "created_days_ago": float(entry.get("created_days_ago") or 0),
        "submitted_days_ago": entry.get("submitted_days_ago"),
    }


def load_seed(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    entries = data.get("ideas") if isinstance(data, dict) else None
    if not isinstance(entries, list) or not entries:
        raise SystemExit(f"{path}: oczekiwano obiektu z niepustą listą 'ideas'")
    prepared = [_prepare(e, f"{path}[{i}]") for i, e in enumerate(entries)]
    titles = [p["idea"].title.strip() for p in prepared]
    if len(set(titles)) != len(titles):
        raise SystemExit(f"{path}: tytuły pomysłów muszą być unikalne (klucz idempotencji)")
    return prepared


async def _resolve_report(session: Any, session_id: str | None) -> int | None:
    if not session_id:
        return None
    return await session.scalar(select(func.min(Report.id)).where(Report.session_id == session_id))


async def purge(titles: list[str]) -> int:
    async with SessionLocal() as session:
        result = await session.execute(delete(Idea).where(Idea.title.in_(titles)))
        await session.commit()
    return result.rowcount or 0


async def seed(prepared: list[dict[str, Any]]) -> None:
    now = datetime.now(UTC)
    created: list[tuple[int, Idea, int]] = []
    skipped: list[tuple[int, str]] = []

    async with SessionLocal() as session:
        categories = set(await session.scalars(select(Taxonomy.code)))
        for p in prepared:
            idea_in: IdeaCreate = p["idea"]
            title = idea_in.title.strip()
            existing = await session.scalar(select(Idea.id).where(Idea.title == title))
            if existing is not None:
                skipped.append((existing, title))
                continue
            if idea_in.category not in categories:
                raise SystemExit(f"{title!r}: nieznana kategoria {idea_in.category!r}")

            created_at = now - timedelta(days=p["created_days_ago"])
            submitted_at = None
            if p["status"] != IdeaStatus.DRAFT:
                days = p["submitted_days_ago"]
                submitted_at = now - timedelta(days=float(days)) if days is not None else now

            replies = [
                (r, now - timedelta(days=float(raw.get("days_ago") or 0)))
                for r, raw in p["replies"]
            ]
            updated_at = max([created_at, submitted_at or created_at, *(t for _, t in replies)])

            report_id = await _resolve_report(session, p["source_report_session"])
            idea = Idea(
                title=title,
                summary=idea_in.summary.strip(),
                essence=idea_in.essence.strip(),
                audience=idea_in.audience.strip(),
                stage=IdeaStage(idea_in.stage),
                category=idea_in.category,
                gmina=idea_in.gmina,
                powiat=GMINY[idea_in.gmina],
                author_name=(idea_in.author_name or "").strip() or None,
                contact_email=(idea_in.contact_email or "").strip() or None,
                source_report_id=report_id,
                status=p["status"],
                submitted_at=submitted_at,
                created_at=created_at,
                updated_at=updated_at,
            )
            session.add(idea)
            await session.flush()
            session.add(IdeaCanvas(idea_id=idea.id, data=p["canvas"], updated_at=updated_at))
            for reply, at in replies:
                session.add(
                    IdeaReply(
                        idea_id=idea.id,
                        author_label=reply.author_label,
                        body=reply.body,
                        created_at=at,
                    )
                )
            created.append((idea.id, idea, progress(p["canvas"]).percent))
        await session.commit()

    for idea_id, idea, percent in created:
        print(
            f"utworzono id={idea_id} status={idea.status.value} stage={idea.stage.value} "
            f"kanwa={percent}% report_id={idea.source_report_id} — {idea.title}"
        )
    for idea_id, title in skipped:
        print(f"pominięto id={idea_id} (już istnieje) — {title}")
    print(f"utworzono {len(created)}, pominięto {len(skipped)}")


async def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Seed demo pomysłów Modułu 3")
    parser.add_argument("--file", default=str(DEFAULT_FILE))
    parser.add_argument("--purge", action="store_true", help="usuń pomysły seedu przed dosłaniem")
    parser.add_argument("--purge-only", action="store_true", help="tylko usuń pomysły seedu")
    args = parser.parse_args(argv)

    prepared = load_seed(Path(args.file))
    try:
        if args.purge or args.purge_only:
            removed = await purge([p["idea"].title.strip() for p in prepared])
            print(f"usunięto {removed} pomysłów seedu")
            if args.purge_only:
                return 0
        await seed(prepared)
    finally:
        await engine.dispose()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main(sys.argv[1:])))
