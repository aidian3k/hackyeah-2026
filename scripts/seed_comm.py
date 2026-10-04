"""Seed demo Modułu 5 — eksperci, ogłoszenia partnerstw i rozmowy (dane fikcyjne).

    python -m scripts.seed_comm          # albo: make seed-comm

Idempotentny: eksperci i ogłoszenia — upsert po `seed_key`; rozmowy — pomijane, gdy `seed_key`
już istnieje (wiadomości się nie dublują). Bez wywołań AI i bez embeddingów. Odpowiedź asystenta
w seedzie wskazuje rozwiązania po tytule (`solution_titles`) — brak tytułu w bazie = błąd.
Na końcu wypisuje tylko liczby rekordów, bez treści.
"""

from __future__ import annotations

import asyncio
import json
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert

from api.comm.models import (
    Mentor,
    MessageRole,
    OfferStatus,
    OrgSector,
    PartnershipIntent,
    PartnershipOffer,
    Thread,
    ThreadKind,
    ThreadMessage,
    ThreadStatus,
)
from api.config import settings
from api.db import SessionLocal, engine
from api.models import ReporterType, Solution

MENTORS_FILE = "mentors.json"
OFFERS_FILE = "partnerships-seed.json"
THREADS_FILE = "threads-seed.json"


def _load(name: str) -> list[dict[str, Any]]:
    path = Path(settings.DATA_DIR) / name
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise SystemExit(f"{path}: oczekiwano listy JSON")
    return data


async def _upsert(session, model, rows: list[dict[str, Any]], fields: list[str]) -> None:
    for row in rows:
        values = {"seed_key": row["seed_key"], **{f: row.get(f) for f in fields}}
        stmt = insert(model).values(**values)
        stmt = stmt.on_conflict_do_update(
            index_elements=[model.seed_key], set_={f: stmt.excluded[f] for f in fields}
        )
        await session.execute(stmt)


async def seed_mentors(session) -> None:
    rows = _load(MENTORS_FILE)
    for r in rows:
        r["categories"] = list(r.get("categories") or [])
    await _upsert(
        session, Mentor, rows, ["display_name", "organization", "expertise", "categories"]
    )


async def seed_offers(session) -> None:
    rows = _load(OFFERS_FILE)
    for r in rows:
        r["intent"] = PartnershipIntent(r["intent"])
        r["sector"] = OrgSector(r["sector"])
        r["status"] = OfferStatus(r.get("status", "PUBLISHED"))
    await _upsert(
        session,
        PartnershipOffer,
        rows,
        ["intent", "organization", "sector", "title", "description", "category", "status"],
    )


async def _id_by_seed_key(session, model, key: str | None) -> int | None:
    if key is None:
        return None
    found = await session.scalar(select(model.id).where(model.seed_key == key))
    if found is None:
        raise SystemExit(f"Nieznany seed_key {key!r} w {model.__tablename__}")
    return found


async def _solution_ids(session, titles: list[str]) -> list[int]:
    ids: list[int] = []
    for title in titles:
        sid = await session.scalar(select(Solution.id).where(Solution.title == title).limit(1))
        if sid is None:
            raise SystemExit(f"Brak rozwiązania o tytule {title!r} — uruchom najpierw make ingest")
        ids.append(sid)
    return ids


async def seed_threads(session) -> int:
    now = datetime.now(UTC)
    created = 0
    for t in _load(THREADS_FILE):
        exists = await session.scalar(select(Thread.id).where(Thread.seed_key == t["seed_key"]))
        if exists is not None:
            continue
        start = now - timedelta(hours=t.get("hours_ago", 1))
        msgs = t["messages"]
        last_at = start + timedelta(minutes=max(m.get("minutes_after", 0) for m in msgs))
        mentor_id = await _id_by_seed_key(session, Mentor, t.get("assigned_mentor_seed_key"))
        thread = Thread(
            seed_key=t["seed_key"],
            kind=ThreadKind(t["kind"]),
            status=ThreadStatus(t["status"]),
            subject=t["subject"],
            category=t.get("category"),
            reporter_type=ReporterType(t.get("reporter_type", "OTHER")),
            author_label=t.get("author_label"),
            partnership_id=await _id_by_seed_key(
                session, PartnershipOffer, t.get("partnership_seed_key")
            ),
            assigned_mentor_id=mentor_id,
            last_message_at=last_at,
            created_at=start,
        )
        session.add(thread)
        await session.flush()
        for m in msgs:
            role = MessageRole(m["role"])
            session.add(
                ThreadMessage(
                    thread_id=thread.id,
                    role=role,
                    author_label=m.get("author_label"),
                    mentor_id=mentor_id if role == MessageRole.MENTOR else None,
                    body=m["body"],
                    solution_ids=await _solution_ids(session, m.get("solution_titles", [])),
                    meta={"seed": True},
                    created_at=start + timedelta(minutes=m.get("minutes_after", 0)),
                )
            )
        created += 1
    return created


async def main() -> int:
    try:
        async with SessionLocal() as session:
            await seed_mentors(session)
            await seed_offers(session)
            created = await seed_threads(session)
            await session.commit()
            counts = {
                model.__tablename__: await session.scalar(select(func.count(model.id)))
                for model in (Mentor, PartnershipOffer, Thread, ThreadMessage)
            }
    finally:
        await engine.dispose()
    print(f"seed_comm: nowe rozmowy {created}; w bazie: {counts}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
