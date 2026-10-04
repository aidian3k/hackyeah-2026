"""Panel administratora: skrzynka „Nowe” (zamiast webhooka, ADR-018) i statystyki zgłoszeń.

`contact_email` nigdy nie jest wybierany z bazy.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from api.cards import load_solutions, to_card
from api.config import settings
from api.db import get_session
from api.errors import ApiError
from api.schemas import (
    CoverageRow,
    Inbox,
    ReportListItem,
    Stats,
    StatsByCategory,
    StatsByGmina,
    StatsByPowiat,
    StatsByReporterType,
    StatsByWeek,
)

router = APIRouter(prefix="/api", tags=["staff"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]

INBOX_LATEST_N = 10  # rozmiar list w skrzynce (kontrakt API, nie próg pipeline'u)
STATS_DEFAULT_DAYS = 90

_REPORT_LIST_SQL = """
SELECT r.id, r.raw_text, r.category, t.label_pl AS category_label_pl, r.gmina, r.powiat,
       r.reporter_type::text AS reporter_type, r.severity_self, r.matched,
       r.status::text AS status, r.top_solution_id, r.top_rerank_score, r.session_id,
       r.created_at,
       (SELECT count(*) FROM report_replies rr WHERE rr.report_id = r.id) AS reply_count
FROM reports r
LEFT JOIN challenge_taxonomy t ON t.code = r.category
WHERE r.status = 'NEW'
ORDER BY r.created_at DESC, r.id DESC
LIMIT :limit
"""


@router.get("/inbox", response_model=Inbox)
async def get_inbox(session: SessionDep) -> Inbox:
    counts = (
        await session.execute(
            text(
                """
                SELECT
                  (SELECT count(*) FROM reports WHERE status = 'NEW') AS new_reports,
                  (SELECT count(*) FROM reports WHERE status = 'NEW' AND NOT matched)
                    AS new_unmatched,
                  (SELECT count(*) FROM solutions WHERE status = 'PENDING_REVIEW')
                    AS pending_solutions
                """
            )
        )
    ).one()

    report_rows = (
        await session.execute(text(_REPORT_LIST_SQL), {"limit": INBOX_LATEST_N})
    ).mappings()
    latest_reports = [ReportListItem(**dict(r)) for r in report_rows]

    pending_ids = (
        (
            await session.execute(
                text(
                    """
                SELECT id FROM solutions WHERE status = 'PENDING_REVIEW'
                ORDER BY created_at DESC, id DESC LIMIT :limit
                """
                ),
                {"limit": INBOX_LATEST_N},
            )
        )
        .scalars()
        .all()
    )
    rows = await load_solutions(session, pending_ids)
    latest_pending = [
        to_card(rows[sid], rank=i) for i, sid in enumerate(pending_ids, start=1) if sid in rows
    ]

    return Inbox(
        new_reports=counts.new_reports,
        new_unmatched=counts.new_unmatched,
        pending_solutions=counts.pending_solutions,
        latest_reports=latest_reports,
        latest_pending=latest_pending,
    )


_AGG = (
    "count(*) AS total, count(*) FILTER (WHERE r.matched) AS matched, "
    "count(*) FILTER (WHERE NOT r.matched) AS unmatched"
)


def _date_range(from_: date | None, to: date | None) -> tuple[date, date, dict[str, Any]]:
    """Zakres dat jak w `/stats` (`to` włącznie); parametry SQL `from_d`, `to_next`."""
    to_d = to or date.today()
    from_d = from_ or (to_d - timedelta(days=STATS_DEFAULT_DAYS))
    if from_d > to_d:
        raise ApiError(422, "VALIDATION_ERROR", "Parametr `from` nie może być późniejszy niż `to`.")
    return from_d, to_d, {"from_d": from_d, "to_next": to_d + timedelta(days=1)}


@router.get("/stats", response_model=Stats, response_model_by_alias=True)
async def get_stats(
    session: SessionDep,
    from_: Annotated[date | None, Query(alias="from")] = None,
    to: Annotated[date | None, Query()] = None,
    category: Annotated[str | None, Query()] = None,
    gmina: Annotated[str | None, Query()] = None,
    powiat: Annotated[str | None, Query()] = None,
) -> Stats:
    from_d, to_d, params = _date_range(from_, to)

    where = ["r.created_at >= :from_d", "r.created_at < :to_next"]
    if category:
        where.append("r.category = :category")
        params["category"] = category
    if gmina:
        where.append("r.gmina = :gmina")
        params["gmina"] = gmina
    if powiat:
        where.append("r.powiat = :powiat")
        params["powiat"] = powiat
    where_sql = " AND ".join(where)

    async def q(sql: str) -> list[dict[str, Any]]:
        return [dict(m) for m in (await session.execute(text(sql), params)).mappings()]

    total = (await q(f"SELECT {_AGG} FROM reports r WHERE {where_sql}"))[0]
    by_category = await q(
        f"""
        SELECT r.category, t.label_pl, {_AGG}
        FROM reports r LEFT JOIN challenge_taxonomy t ON t.code = r.category
        WHERE {where_sql}
        GROUP BY r.category, t.label_pl, t.sort_order
        ORDER BY total DESC, t.sort_order NULLS LAST, r.category NULLS LAST
        """
    )
    by_gmina = await q(
        f"""
        SELECT r.gmina, r.powiat, {_AGG}
        FROM reports r WHERE {where_sql}
        GROUP BY r.gmina, r.powiat
        ORDER BY total DESC, r.gmina NULLS LAST
        """
    )
    by_powiat = await q(
        f"""
        SELECT r.powiat, {_AGG}
        FROM reports r WHERE {where_sql}
        GROUP BY r.powiat
        ORDER BY total DESC, r.powiat ASC NULLS LAST
        """
    )
    by_week = await q(
        f"""
        SELECT date_trunc('week', r.created_at)::date AS week, {_AGG}
        FROM reports r WHERE {where_sql}
        GROUP BY 1 ORDER BY 1
        """
    )
    by_reporter_type = await q(
        f"""
        SELECT r.reporter_type::text AS reporter_type, {_AGG}
        FROM reports r WHERE {where_sql}
        GROUP BY r.reporter_type ORDER BY total DESC, reporter_type
        """
    )

    return Stats(
        from_=from_d,
        to=to_d,
        total=total["total"],
        matched=total["matched"],
        unmatched=total["unmatched"],
        by_category=[StatsByCategory(**r) for r in by_category],
        by_gmina=[StatsByGmina(**r) for r in by_gmina],
        by_powiat=[StatsByPowiat(**r) for r in by_powiat],
        by_week=[StatsByWeek(**r) for r in by_week],
        by_reporter_type=[StatsByReporterType(**r) for r in by_reporter_type],
    )


@router.get("/stats/coverage", response_model=list[CoverageRow])
async def get_coverage(
    session: SessionDep,
    from_: Annotated[date | None, Query(alias="from")] = None,
    to: Annotated[date | None, Query()] = None,
) -> list[CoverageRow]:
    """Zgłoszenia (w zakresie dat) a biblioteka i wiedza (stan `PUBLISHED`) per wyzwanie.

    Luka: dużo niedopasowanych zgłoszeń i mało rozwiązań (progi `COVERAGE_GAP_*`, ADR-M2-005).
    """
    _, _, params = _date_range(from_, to)
    params["min_unmatched"] = settings.COVERAGE_GAP_MIN_UNMATCHED
    params["max_solutions"] = settings.COVERAGE_GAP_MAX_SOLUTIONS
    rows = (
        (
            await session.execute(
                text(
                    """
                    WITH rep AS (
                        SELECT r.category, count(*) AS total,
                               count(*) FILTER (WHERE NOT r.matched) AS unmatched
                        FROM reports r
                        WHERE r.created_at >= :from_d AND r.created_at < :to_next
                        GROUP BY r.category
                    ), sol AS (
                        SELECT s.category,
                               count(*) FILTER (WHERE s.kind = 'SOLUTION') AS solutions,
                               count(*) FILTER (WHERE s.kind = 'KNOWLEDGE') AS knowledge
                        FROM solutions s
                        WHERE s.status = 'PUBLISHED'
                        GROUP BY s.category
                    )
                    SELECT t.code AS category, t.label_pl,
                           coalesce(rep.total, 0) AS reports_total,
                           coalesce(rep.unmatched, 0) AS reports_unmatched,
                           coalesce(sol.solutions, 0) AS solutions_published,
                           coalesce(sol.knowledge, 0) AS knowledge_published,
                           (coalesce(rep.unmatched, 0) >= :min_unmatched
                            AND coalesce(sol.solutions, 0) < :max_solutions) AS is_gap
                    FROM challenge_taxonomy t
                    LEFT JOIN rep ON rep.category = t.code
                    LEFT JOIN sol ON sol.category = t.code
                    WHERE t.code <> 'OTHER'
                    ORDER BY is_gap DESC, reports_unmatched DESC, t.code ASC
                    """
                ),
                params,
            )
        )
        .mappings()
        .all()
    )
    return [CoverageRow(**dict(r)) for r in rows]
