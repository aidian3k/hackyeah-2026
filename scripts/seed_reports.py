"""Seed zgłoszeń demo (T24): każde zgłoszenie z `data/reports-seed.json` → `POST /api/chat`.

Dzięki temu `matched`, embedding, licznik podobnych i `search_events` są prawdziwe.

    python -m scripts.seed_reports                 # dosyła zgłoszenia (API na :8000)
    python -m scripts.seed_reports --purge         # najpierw usuwa poprzedni seed
    python -m scripts.seed_reports --purge-only    # tylko usuwa seed
    python -m scripts.seed_reports --api-url http://localhost:8001 --file data/reports-seed.json

Zgłoszenia seedu mają `session_id` z prefiksem `seed-demo-` (usunięcie:
`DELETE FROM reports WHERE session_id LIKE 'seed-demo-%'`; odpowiedzi znikają kaskadowo,
`--purge` usuwa też powiązane `search_events`). Zgłoszenia wysyłane są po kolei — licznik
podobnych rośnie z każdym wpisem.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import httpx
from sqlalchemy import text

from api.db import SessionLocal, engine

SEED_PREFIX = "seed-demo-"
DEFAULT_FILE = "data/reports-seed.json"
DEFAULT_API_URL = "http://localhost:8000"
REQUEST_TIMEOUT_S = 120.0
_ALLOWED_KEYS = {"message", "session_id", "gmina", "reporter_type", "severity_self"}


@dataclass
class Outcome:
    session_id: str
    gmina: str | None
    events: list[str] = field(default_factory=list)
    report_id: int | None = None
    matched: bool | None = None
    top_title: str | None = None
    best_score: float | None = None
    similar_count: int | None = None
    gmina_count: int | None = None
    error: str | None = None


def load_seed(path: Path) -> list[dict[str, Any]]:
    entries = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(entries, list):
        raise SystemExit(f"{path}: oczekiwano listy obiektów")
    for i, e in enumerate(entries):
        sid = e.get("session_id", "")
        if not str(sid).startswith(SEED_PREFIX):
            raise SystemExit(f"{path}[{i}]: session_id musi zaczynać się od {SEED_PREFIX!r}")
        extra = set(e) - _ALLOWED_KEYS
        if extra:
            raise SystemExit(f"{path}[{i}]: nieznane pola {sorted(extra)}")
    return entries


async def purge() -> tuple[int, int]:
    """Usuwa zgłoszenia seedu i ich `search_events` (FK ma `ON DELETE SET NULL`)."""
    params = {"p": SEED_PREFIX + "%"}
    async with SessionLocal() as s:
        res_ev = await s.execute(
            text(
                "DELETE FROM search_events WHERE report_id IN "
                "(SELECT id FROM reports WHERE session_id LIKE :p)"
            ),
            params,
        )
        res = await s.execute(text("DELETE FROM reports WHERE session_id LIKE :p"), params)
        await s.commit()
    return res.rowcount or 0, res_ev.rowcount or 0


async def send(client: httpx.AsyncClient, api_url: str, entry: dict[str, Any]) -> Outcome:
    out = Outcome(session_id=entry["session_id"], gmina=entry.get("gmina"))
    event: str | None = None
    try:
        async with client.stream("POST", f"{api_url}/api/chat", json=entry) as resp:
            if resp.status_code != 200:
                body = (await resp.aread()).decode("utf-8", "replace")
                out.error = f"HTTP {resp.status_code}: {body[:200]}"
                return out
            async for line in resp.aiter_lines():
                if line.startswith("event:"):
                    event = line[len("event:") :].strip()
                    out.events.append(event)
                elif line.startswith("data:") and event is not None:
                    _apply(out, event, json.loads(line[len("data:") :]))
                    if event == "done":
                        break
    except httpx.HTTPError as exc:
        out.error = f"{type(exc).__name__}: {exc}"
    return out


def _apply(out: Outcome, event: str, data: dict[str, Any]) -> None:
    if event == "candidates":
        sols = data.get("solutions") or []
        out.matched = bool(sols)
        if sols:
            out.top_title = sols[0].get("title")
            out.best_score = (sols[0].get("scores") or {}).get("cosine")
    elif event == "no_match":
        out.matched = False
        out.best_score = data.get("best_score")
    elif event == "report_saved":
        out.report_id = data.get("report_id")
        out.similar_count = data.get("similar_count")
        out.gmina_count = data.get("gmina_count")
    elif event == "error":
        out.error = f"{data.get('code')}: {data.get('message_pl')}"


def _fmt(v: Any) -> str:
    if v is None:
        return "-"
    if isinstance(v, bool):
        return "tak" if v else "nie"
    if isinstance(v, float):
        return f"{v:.3f}"
    return str(v)


def print_summary(outcomes: list[Outcome]) -> None:
    headers = ("session_id", "gmina", "report_id", "matched", "score", "similar", "gminy", "top 1")
    rows = [
        (
            o.session_id,
            o.gmina or "-",
            _fmt(o.report_id),
            _fmt(o.matched),
            _fmt(o.best_score),
            _fmt(o.similar_count),
            _fmt(o.gmina_count),
            (o.error or o.top_title or "(no_match)")[:48],
        )
        for o in outcomes
    ]
    widths = [max(len(h), *(len(r[i]) for r in rows)) for i, h in enumerate(headers)]
    print()
    print("  ".join(h.ljust(w) for h, w in zip(headers, widths, strict=True)))
    print("  ".join("-" * w for w in widths))
    for r in rows:
        print("  ".join(c.ljust(w) for c, w in zip(r, widths, strict=True)))
    ok = sum(1 for o in outcomes if o.report_id is not None)
    matched = sum(1 for o in outcomes if o.matched)
    print(f"\nzapisane: {ok}/{len(outcomes)}, z dopasowaniem: {matched}, bez: {ok - matched}")


async def run(args: argparse.Namespace) -> int:
    try:
        if args.purge or args.purge_only:
            n_rep, n_ev = await purge()
            print(f"--purge: usunięto {n_rep} zgłoszeń seedu i {n_ev} search_events")
        if args.purge_only:
            return 0
    finally:
        await engine.dispose()

    entries = load_seed(Path(args.file))
    outcomes: list[Outcome] = []
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_S) as client:
        for entry in entries:
            o = await send(client, args.api_url.rstrip("/"), entry)
            outcomes.append(o)
            print(
                f"{o.session_id}: report_id={_fmt(o.report_id)} matched={_fmt(o.matched)} "
                f"similar_count={_fmt(o.similar_count)} gmina_count={_fmt(o.gmina_count)}"
                + (f" BŁĄD {o.error}" if o.error else ""),
                flush=True,
            )
    print_summary(outcomes)
    return 1 if any(o.report_id is None for o in outcomes) else 0


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Seed zgłoszeń demo przez POST /api/chat")
    p.add_argument("--api-url", default=DEFAULT_API_URL)
    p.add_argument("--file", default=DEFAULT_FILE)
    p.add_argument("--purge", action="store_true", help="usuń poprzedni seed przed wysłaniem")
    p.add_argument("--purge-only", action="store_true", help="tylko usuń seed")
    return asyncio.run(run(p.parse_args(argv)))


if __name__ == "__main__":
    sys.exit(main())
