"""Budowanie kart rozwiązań — jedyne miejsce, które zamienia `Solution` na `SolutionCard`.

Pole `contact` nigdy nie jest kopiowane.
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from typing import Any

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.models import Solution, Taxonomy
from api.schemas import MediaItem, Scores, SolutionCard, SolutionDetail


@dataclass
class SolutionRow:  # Solution + etykieta kategorii
    solution: Solution
    category_label_pl: str | None


async def load_solutions(session: AsyncSession, ids: Iterable[int]) -> dict[int, SolutionRow]:
    """Jedno zapytanie: solutions LEFT JOIN challenge_taxonomy. Bez filtra statusu/kind."""
    id_list = list(dict.fromkeys(ids))
    if not id_list:
        return {}
    stmt = (
        select(Solution, Taxonomy.label_pl)
        .outerjoin(Taxonomy, Taxonomy.code == Solution.category)
        .where(Solution.id.in_(id_list))
    )
    rows = (await session.execute(stmt)).all()
    return {sol.id: SolutionRow(solution=sol, category_label_pl=label) for sol, label in rows}


def _enum_value(v: Any) -> str:
    return getattr(v, "value", v)


def _media(raw: Any) -> list[MediaItem]:
    items: list[MediaItem] = []
    for m in raw or []:
        if not isinstance(m, dict):
            continue
        try:
            items.append(
                MediaItem(type=str(m.get("type", "link")), url=m["url"], title=m.get("title"))
            )
        except (KeyError, ValidationError):
            continue  # niekompletny wpis w korpusie nie psuje karty
    return items


def _steps(raw: Any) -> list[str]:
    return [str(s) for s in (raw or []) if s is not None and str(s).strip()]


def _card_fields(row: SolutionRow) -> dict[str, Any]:
    s = row.solution
    return {
        "id": s.id,
        "kind": _enum_value(s.kind),
        "title": s.title,
        "summary": s.summary,
        "organization": s.organization,
        "gmina": s.gmina,
        "powiat": s.powiat,
        "category": s.category,
        "category_label_pl": row.category_label_pl,
        "tags": list(s.tags or []),
        "target_group": s.target_group,
        "cost_range": s.cost_range,
        "implementation_steps": _steps(s.implementation_steps),
        "source_url": s.source_url,
        "source_name": s.source_name,
        "evidence_level": s.evidence_level,
        "media": _media(s.media),
        "origin": _enum_value(s.origin),
    }


def to_card(row: SolutionRow, *, rank: int, scores: Scores | None = None) -> SolutionCard:
    return SolutionCard(**_card_fields(row), rank=rank, scores=scores)


def to_detail(row: SolutionRow) -> SolutionDetail:
    return SolutionDetail(**_card_fields(row), rank=1, scores=None, body=row.solution.body or "")
