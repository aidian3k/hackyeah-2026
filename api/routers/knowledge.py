"""Zasobnik wiedzy (Moduł 2): profile wyzwań, wskaźniki per powiat.

Wszystko tylko `PUBLISHED`; karty przez `api.cards`, `scores = None`.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.cards import SolutionRow, to_card
from api.config import settings
from api.db import get_session
from api.errors import ApiError
from api.models import (
    ChallengeProfile,
    Indicator,
    IndicatorValueRow,
    KnowledgeType,
    Solution,
    SolutionKind,
    SolutionStatus,
    Taxonomy,
)
from api.routers.solutions import HAS_VIDEO
from api.schemas import (
    ChallengeDetail,
    ChallengeSummary,
    IndicatorDetail,
    IndicatorMeta,
    IndicatorValue,
    KeyFact,
    SolutionCard,
)

router = APIRouter(prefix="/api", tags=["knowledge"])

Session = Annotated[AsyncSession, Depends(get_session)]

OTHER_CATEGORY = "OTHER"  # kategoria zbiorcza taksonomii — nie jest wyzwaniem


def _facts(profile: ChallengeProfile | None) -> list[KeyFact]:
    return [KeyFact.model_validate(f) for f in (profile.key_facts if profile else [])]


def _summary(
    code: str,
    label_pl: str,
    profile: ChallengeProfile | None,
    facts: list[KeyFact],
    counts: dict[str, int],
) -> dict[str, Any]:
    return {
        "code": code,
        "label_pl": label_pl,
        "lead_pl": profile.lead_pl if profile else None,
        "key_fact": facts[0] if facts else None,
        "solutions_count": counts.get("SOLUTION", 0),
        "knowledge_count": counts.get("KNOWLEDGE", 0),
        "is_demo": profile.is_demo if profile else False,
        "updated_at": profile.updated_at if profile else None,
    }


def _indicator_meta(row: Indicator) -> IndicatorMeta:
    return IndicatorMeta(
        code=row.code,
        category=row.category,
        label_pl=row.label_pl,
        unit=row.unit,
        year=row.year,
        higher_is_worse=row.higher_is_worse,
        region_value=float(row.region_value) if row.region_value is not None else None,
        source_name=row.source_name,
        source_url=row.source_url,
        is_demo=row.is_demo,
    )


def _cards(rows: list[Solution], label_pl: str) -> list[SolutionCard]:
    return [
        to_card(SolutionRow(solution=sol, category_label_pl=label_pl), rank=i)
        for i, sol in enumerate(rows, start=1)
    ]


async def _counts(session: AsyncSession, code: str | None = None) -> dict[str, dict[str, int]]:
    """Liczba opublikowanych pozycji per kategoria i kind — jedno zapytanie, bez N+1."""
    stmt = (
        select(Solution.category, Solution.kind, func.count())
        .where(Solution.status == SolutionStatus.PUBLISHED, Solution.category.is_not(None))
        .group_by(Solution.category, Solution.kind)
    )
    if code:
        stmt = stmt.where(Solution.category == code)
    result: dict[str, dict[str, int]] = {}
    for category, kind, n in (await session.execute(stmt)).all():
        result.setdefault(category, {})[getattr(kind, "value", kind)] = n
    return result


@router.get("/challenges", response_model=list[ChallengeSummary])
async def list_challenges(session: Session) -> list[ChallengeSummary]:
    taxonomy = (
        await session.execute(
            select(Taxonomy.code, Taxonomy.label_pl)
            .where(Taxonomy.code != OTHER_CATEGORY)
            .order_by(Taxonomy.sort_order, Taxonomy.code)
        )
    ).all()
    profiles = {p.category: p for p in (await session.scalars(select(ChallengeProfile))).all()}
    counts = await _counts(session)
    return [
        ChallengeSummary(
            **_summary(
                code, label, profiles.get(code), _facts(profiles.get(code)), counts.get(code, {})
            )
        )
        for code, label in taxonomy
    ]


@router.get("/challenges/{code}", response_model=ChallengeDetail)
async def get_challenge(code: str, session: Session) -> ChallengeDetail:
    label = None
    if code != OTHER_CATEGORY:
        label = await session.scalar(select(Taxonomy.label_pl).where(Taxonomy.code == code))
    if label is None:
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono wyzwania.")

    profile = await session.get(ChallengeProfile, code)
    facts = _facts(profile)
    counts = (await _counts(session, code)).get(code, {})

    indicators = (
        await session.scalars(
            select(Indicator)
            .where(Indicator.category == code)
            .order_by(Indicator.sort_order, Indicator.code)
        )
    ).all()

    published = [Solution.status == SolutionStatus.PUBLISHED, Solution.category == code]

    async def knowledge(kind: KnowledgeType) -> list[Solution]:
        return list(
            (
                await session.scalars(
                    select(Solution)
                    .where(
                        *published,
                        Solution.kind == SolutionKind.KNOWLEDGE,
                        Solution.knowledge_type == kind,
                    )
                    .order_by(Solution.updated_at.desc(), Solution.id.asc())
                    .limit(settings.CHALLENGE_TOP_KNOWLEDGE)
                )
            ).all()
        )

    solutions = (
        await session.scalars(
            select(Solution)
            .where(*published, Solution.kind == SolutionKind.SOLUTION)
            .order_by(Solution.evidence_level.desc(), HAS_VIDEO.desc(), Solution.id.asc())
            .limit(settings.CHALLENGE_TOP_SOLUTIONS)
        )
    ).all()

    return ChallengeDetail(
        **_summary(code, label, profile, facts, counts),
        key_facts=facts,
        indicators=[_indicator_meta(i) for i in indicators],
        reports=_cards(await knowledge(KnowledgeType.REPORT), label),
        materials=_cards(await knowledge(KnowledgeType.MATERIAL), label),
        solutions=_cards(list(solutions), label),
    )


@router.get("/indicators", response_model=list[IndicatorMeta])
async def list_indicators(session: Session, category: str | None = None) -> list[IndicatorMeta]:
    stmt = select(Indicator).order_by(Indicator.sort_order, Indicator.code)
    if category:
        stmt = stmt.where(Indicator.category == category)
    return [_indicator_meta(i) for i in (await session.scalars(stmt)).all()]


@router.get("/indicators/{code}", response_model=IndicatorDetail)
async def get_indicator(code: str, session: Session) -> IndicatorDetail:
    row = await session.get(Indicator, code)
    if row is None:
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono wskaźnika.")
    values = (
        await session.scalars(
            select(IndicatorValueRow)
            .where(IndicatorValueRow.indicator_code == code)
            .order_by(IndicatorValueRow.powiat)
        )
    ).all()
    return IndicatorDetail(
        **_indicator_meta(row).model_dump(),
        values=[IndicatorValue(powiat=v.powiat, value=float(v.value)) for v in values],
    )
