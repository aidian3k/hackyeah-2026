"""Kontekst asystenta M7: jedna opublikowana innowacja (ADR-M7-006) i typ gminy."""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from api.cards import load_solutions
from api.config import settings
from api.models import SolutionKind, SolutionStatus

_REPO_ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class SolutionContext:
    id: int
    title: str
    summary: str
    body: str
    category_label_pl: str | None
    target_group: str | None


async def load_solution_context(session: AsyncSession, solution_id: int) -> SolutionContext | None:
    """Innowacja do promptu; None, gdy brak, status != PUBLISHED albo kind != SOLUTION."""
    row = (await load_solutions(session, [solution_id])).get(solution_id)
    if row is None:
        return None
    sol = row.solution
    if sol.status != SolutionStatus.PUBLISHED or sol.kind != SolutionKind.SOLUTION:
        return None
    return SolutionContext(
        id=sol.id,
        title=sol.title,
        summary=sol.summary,
        body=sol.body or "",
        category_label_pl=row.category_label_pl,
        target_group=sol.target_group or None,
    )


def _data_path(name: str) -> Path:
    data_dir = Path(settings.DATA_DIR)
    if not data_dir.is_absolute():
        data_dir = _REPO_ROOT / data_dir  # względem katalogu repozytorium, nie cwd
    return data_dir / name


@lru_cache(maxsize=1)
def _gmina_types() -> dict[str, str]:
    data = json.loads(_data_path("gminy-malopolska.json").read_text(encoding="utf-8"))
    return {g["name"]: g["type"] for g in data}


def gmina_type(name: str) -> str | None:
    """Typ gminy: miejska, wiejska albo miejsko-wiejska; None dla nieznanej gminy."""
    return _gmina_types().get(name)
