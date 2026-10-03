"""Zapis zgłoszenia, licznik podobnych zgłoszeń (ADR-016) i `search_events` (T18).

Zapis jest bezwarunkowy i odpięty od żądania — T19 uruchamia go przez `api.tasks.spawn`,
dlatego funkcje otwierają własną sesję (`SessionLocal()`). W logach tylko `report_id`,
długość tekstu i `matched` — nigdy treść ani e-mail.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import settings
from api.db import SessionLocal, to_pgvector
from api.models import Report, ReporterType, SearchEvent
from api.pipeline.types import ProcessedQuery, SaveResult, SearchResult
from api.schemas import ChatRequest

log = logging.getLogger(__name__)

_FALLBACK_CATEGORY = "OTHER"

# Osoby, nie wiadomości: sesja (albo samo zgłoszenie, gdy brak sesji) liczy się raz.
# Własne wiadomości (ta sama sesja) się nie liczą; gdy bieżące zgłoszenie nie ma sesji,
# wykluczamy tylko samo zgłoszenie (inaczej `IS DISTINCT FROM NULL` odrzuciłby wszystkie
# zgłoszenia bez sesji).
_SIMILAR_COUNT_SQL = text(
    """
    SELECT count(DISTINCT coalesce(r.session_id, r.id::text)) AS similar_count,
           count(DISTINCT r.gmina)                            AS gmina_count
    FROM reports r
    WHERE r.id <> :report_id
      AND r.embedding IS NOT NULL
      AND (CAST(:session_id AS text) IS NULL
           OR r.session_id IS DISTINCT FROM CAST(:session_id AS text))
      AND 1.0 - (r.embedding <=> CAST(:vec AS vector(1024))) >= :threshold
    """
)

_FIND_SIMILAR_SQL = text(
    """
    SELECT r.id, r.raw_text, r.gmina, r.created_at, r.matched,
           1.0 - (r.embedding <=> me.embedding) AS similarity
    FROM reports me
    JOIN reports r ON r.id <> me.id AND r.embedding IS NOT NULL
    WHERE me.id = :report_id
      AND me.embedding IS NOT NULL
      AND 1.0 - (r.embedding <=> me.embedding) >= :threshold
    ORDER BY similarity DESC, r.id ASC
    LIMIT :limit
    """
)

_UPDATE_EVENT_SQL = text(
    """
    UPDATE search_events
    SET flags = flags || CAST(:flags AS jsonb),
        latency_ms = latency_ms || CAST(:latency_ms AS jsonb)
    WHERE id = :id
    """
)


def _extracted(query: ProcessedQuery) -> dict[str, Any]:
    return {
        "category": query.category or _FALLBACK_CATEGORY,
        "identifiers": list(query.identifiers),
        "expanded_terms": list(query.expanded_terms),
        "too_vague": query.too_vague,
        "target_group": query.target_group,
    }


def _event_results(search: SearchResult) -> list[dict[str, Any]]:
    return [
        {
            "solution_id": c.solution_id,
            "lex_rank": c.ranks.get("lexical"),
            "vec_rank": c.ranks.get("semantic"),
            "rrf": c.rrf_score,
            "rerank": c.rerank_score,
            "cosine": c.cosine_similarity,
        }
        for c in search.reranked
    ]


async def save_report_and_event(
    *,
    query: ProcessedQuery,
    query_vec: list[float] | None,
    request: ChatRequest,
    search: SearchResult | None,
) -> SaveResult:
    """Zapisuje zgłoszenie + wiersz `search_events` i liczy podobne zgłoszenia innych osób."""
    matched = search.matched if search is not None else False
    top = search.solutions[0] if search is not None and search.solutions else None

    async with SessionLocal() as session:
        report = Report(
            raw_text=query.raw,
            normalized_text=query.normalized,
            embedding=query_vec,
            category=query.category or _FALLBACK_CATEGORY,
            gmina=query.gmina,
            powiat=query.powiat,
            target_group=query.target_group,
            extracted=_extracted(query),
            severity_self=request.severity_self,
            contact_email=request.contact_email,
            reporter_type=ReporterType(request.reporter_type),
            matched=matched,
            top_solution_id=top.id if top is not None else None,
            top_rerank_score=top.scores.rerank if top is not None and top.scores else None,
            session_id=request.session_id,
        )
        session.add(report)
        await session.flush()
        report_id = report.id

        if search is not None:
            flags: dict[str, Any] = {"gate": search.gate.source}
            if query.too_vague:
                flags["too_vague"] = True
            event = SearchEvent(
                report_id=report_id,
                query=query.raw,
                normalized_query=query.normalized,
                results=_event_results(search),
                lexical_count=len(search.retrieval.lexical),
                vector_count=len(search.retrieval.semantic),
                latency_ms=dict(search.latency_ms),
                flags=flags,
            )
        else:
            event = SearchEvent(
                report_id=report_id,
                query=query.raw,
                normalized_query=query.normalized,
                results=[],
                flags={"error": True},
            )
        session.add(event)
        await session.flush()
        search_event_id = event.id

        similar_count = gmina_count = 0
        if query_vec is not None:
            row = (
                await session.execute(
                    _SIMILAR_COUNT_SQL,
                    {
                        "report_id": report_id,
                        "session_id": request.session_id,
                        "vec": to_pgvector(query_vec),
                        "threshold": settings.SIMILAR_REPORT_THRESHOLD,
                    },
                )
            ).one()
            similar_count, gmina_count = int(row.similar_count), int(row.gmina_count)

        await session.commit()

    log.info(
        "report saved report_id=%s len=%d matched=%s similar=%d gminy=%d",
        report_id,
        len(query.raw),
        matched,
        similar_count,
        gmina_count,
    )
    return SaveResult(
        report_id=report_id,
        similar_count=similar_count,
        gmina_count=gmina_count,
        search_event_id=search_event_id,
    )


async def update_search_event(
    search_event_id: int,
    *,
    flags: dict | None = None,
    latency_ms: dict | None = None,
) -> None:
    """Dokleja (JSONB `||`) flagi i czasy do istniejącego wiersza `search_events`."""
    if not flags and not latency_ms:
        return
    async with SessionLocal() as session:
        await session.execute(
            _UPDATE_EVENT_SQL,
            {
                "id": search_event_id,
                "flags": json.dumps(flags or {}),
                "latency_ms": json.dumps(latency_ms or {}),
            },
        )
        await session.commit()


async def find_similar_reports(
    session: AsyncSession, report_id: int, limit: int | None = None
) -> list[dict[str, Any]]:
    """Do `SIMILAR_REPORTS_LIMIT` innych zgłoszeń z cosinusem ≥ `SIMILAR_REPORT_THRESHOLD`."""
    rows = await session.execute(
        _FIND_SIMILAR_SQL,
        {
            "report_id": report_id,
            "threshold": settings.SIMILAR_REPORT_THRESHOLD,
            "limit": limit if limit is not None else settings.SIMILAR_REPORTS_LIMIT,
        },
    )
    return [
        {
            "id": r.id,
            "raw_text": r.raw_text,
            "gmina": r.gmina,
            "created_at": r.created_at,
            "matched": r.matched,
            "similarity": float(r.similarity),
        }
        for r in rows
    ]
