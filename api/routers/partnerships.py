"""Moduł 5 — tablica partnerstw „oferujemy / szukamy” i proste dopasowanie ogłoszeń.

Ogłoszenia publikowane od razu (bez moderacji, ADR-M5-007); Hub może je zamknąć. Dopasowanie
regułowe (ADR-M5-003): przeciwna intencja + ta sama kategoria, najpierw inny sektor.
W logach tylko identyfikatory, intencja, sektor i długość opisu.
"""

from __future__ import annotations

import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.comm.models import OfferStatus, OrgSector, PartnershipIntent
from api.comm.models import PartnershipOffer as OfferRow
from api.comm.schemas import (
    IntentLiteral,
    OfferStatusLiteral,
    OrgSectorLiteral,
    PartnershipCreate,
    PartnershipOffer,
    PartnershipPatch,
)
from api.config import settings
from api.db import get_session
from api.errors import ApiError
from api.models import Taxonomy
from api.schemas import Page

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["partnerships"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]

# Jawna lista kolumn — bez `session_id`.
_COLUMNS = (
    OfferRow.id,
    OfferRow.intent,
    OfferRow.organization,
    OfferRow.sector,
    OfferRow.title,
    OfferRow.description,
    OfferRow.category,
    Taxonomy.label_pl.label("category_label_pl"),
    OfferRow.status,
    OfferRow.created_at,
)


def _select():
    return select(*_COLUMNS).outerjoin(Taxonomy, Taxonomy.code == OfferRow.category)


def _offer(r: Any) -> PartnershipOffer:
    return PartnershipOffer(
        id=r.id,
        intent=r.intent.value,
        organization=r.organization,
        sector=r.sector.value,
        title=r.title,
        description=r.description,
        category=r.category,
        category_label_pl=r.category_label_pl,
        status=r.status.value,
        created_at=r.created_at,
    )


def _not_found(offer_id: int) -> ApiError:
    return ApiError(404, "NOT_FOUND", f"Nie znaleziono ogłoszenia o id {offer_id}.")


async def _load(session: AsyncSession, offer_id: int) -> PartnershipOffer:
    row = (await session.execute(_select().where(OfferRow.id == offer_id))).one_or_none()
    if row is None:
        raise _not_found(offer_id)
    return _offer(row)


@router.get("/partnerships", response_model=Page[PartnershipOffer])
async def list_offers(
    session: SessionDep,
    intent: IntentLiteral | None = None,
    sector: OrgSectorLiteral | None = None,
    category: str | None = None,
    status: OfferStatusLiteral = "PUBLISHED",
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> Page[PartnershipOffer]:
    conditions = [OfferRow.status == OfferStatus(status)]
    if intent is not None:
        conditions.append(OfferRow.intent == PartnershipIntent(intent))
    if sector is not None:
        conditions.append(OfferRow.sector == OrgSector(sector))
    if category:
        conditions.append(OfferRow.category == category)

    total = await session.scalar(select(func.count(OfferRow.id)).where(*conditions)) or 0
    rows = await session.execute(
        _select()
        .where(*conditions)
        .order_by(OfferRow.created_at.desc(), OfferRow.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return Page[PartnershipOffer](
        items=[_offer(r) for r in rows], total=total, limit=limit, offset=offset
    )


@router.post("/partnerships", response_model=PartnershipOffer, status_code=201)
async def create_offer(payload: PartnershipCreate, session: SessionDep) -> PartnershipOffer:
    if payload.category is not None:
        known = await session.scalar(select(Taxonomy.code).where(Taxonomy.code == payload.category))
        if known is None:
            raise ApiError(
                422, "VALIDATION_ERROR", f"category: nieznana kategoria „{payload.category}”."
            )
    offer = OfferRow(
        intent=PartnershipIntent(payload.intent),
        organization=payload.organization.strip(),
        sector=OrgSector(payload.sector),
        title=payload.title.strip(),
        description=payload.description.strip(),
        category=payload.category,
        session_id=payload.session_id,
        status=OfferStatus.PUBLISHED,
    )
    session.add(offer)
    await session.commit()
    log.info(
        "offer created",
        extra={
            "offer_id": offer.id,
            "intent": payload.intent,
            "sector": payload.sector,
            "description_len": len(payload.description),
        },
    )
    return await _load(session, offer.id)


@router.get("/partnerships/{offer_id}", response_model=PartnershipOffer)
async def get_offer(offer_id: int, session: SessionDep) -> PartnershipOffer:
    return await _load(session, offer_id)


@router.patch("/partnerships/{offer_id}", response_model=PartnershipOffer)
async def patch_offer(
    offer_id: int, payload: PartnershipPatch, session: SessionDep
) -> PartnershipOffer:
    offer = await session.get(OfferRow, offer_id)
    if offer is None:
        raise _not_found(offer_id)
    if offer.status != OfferStatus(payload.status):
        offer.status = OfferStatus(payload.status)
        await session.commit()
        log.info("offer status changed", extra={"offer_id": offer_id, "to": payload.status})
    return await _load(session, offer_id)


@router.get("/partnerships/{offer_id}/matches", response_model=list[PartnershipOffer])
async def offer_matches(offer_id: int, session: SessionDep) -> list[PartnershipOffer]:
    """Pasujące ogłoszenia: opublikowane, przeciwna intencja, ta sama kategoria; najpierw inny
    sektor (współpraca międzysektorowa), potem najnowsze."""
    offer = await session.get(OfferRow, offer_id)
    if offer is None:
        raise _not_found(offer_id)
    if offer.category is None:
        return []
    other_intent = (
        PartnershipIntent.SEEK
        if offer.intent == PartnershipIntent.OFFER
        else PartnershipIntent.OFFER
    )
    rows = await session.execute(
        _select()
        .where(
            OfferRow.status == OfferStatus.PUBLISHED,
            OfferRow.id != offer.id,
            OfferRow.intent == other_intent,
            OfferRow.category == offer.category,
        )
        .order_by(
            case((OfferRow.sector != offer.sector, 0), else_=1),
            OfferRow.created_at.desc(),
            OfferRow.id.desc(),
        )
        .limit(settings.PARTNER_MATCH_N)
    )
    return [_offer(r) for r in rows]
