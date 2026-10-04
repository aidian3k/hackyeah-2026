"""Pipeline AI Modułu 4: sugestia dopasowania, agregacja i raport."""

from __future__ import annotations

import json
import logging
import re
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.config import settings
from api.errors import ApiError
from api.models import (
    ApplicationStatus,
    InnovationTest,
    InnovationTestApplication,
    InnovationTestFeedback,
)
from api.providers import ProviderError, get_llm_provider
from api.schemas import (
    AiTestReport,
    AnonymousFeedbackComment,
    InnovationTestReport,
    RatingDistribution,
    RatingStats,
    TesterFitSuggestion,
)

log = logging.getLogger(__name__)

_JSON_FENCE_RE = re.compile(r"```(?:json)?\s*([\s\S]*?)\s*```", re.IGNORECASE)

FIT_DISCLAIMER = "Sugestia AI, nie decyzja Hubu."
REPORT_DISCLAIMER = "Wynik pomocniczy; decyzję podejmuje Hub."


def _rating_stats(scores: list[int]) -> RatingStats:
    distribution = [RatingDistribution(score=s, count=0) for s in range(1, 6)]
    by_score = {s: 0 for s in range(1, 6)}
    for score in scores:
        if score in by_score:
            by_score[score] += 1
    for item in distribution:
        item.count = by_score[item.score]
    average = round(sum(scores) / len(scores), 2) if scores else None
    return RatingStats(average=average, distribution=distribution)


def _extract_json_object(raw: str) -> dict[str, Any]:
    text = raw.strip()
    fenced = _JSON_FENCE_RE.search(text)
    if fenced:
        text = fenced.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end < 0 or end <= start:
        raise ValueError("Brak obiektu JSON w odpowiedzi modelu.")
    data = json.loads(text[start : end + 1])
    if not isinstance(data, dict):
        raise ValueError("Odpowiedź modelu nie jest obiektem JSON.")
    return data


def _parse_ai_report(data: dict[str, Any], allowed_ids: set[int]) -> AiTestReport:
    evidence_raw = data.get("evidence_feedback_ids") or []
    if not isinstance(evidence_raw, list):
        raise ValueError("evidence_feedback_ids musi być listą.")
    evidence: list[int] = []
    for item in evidence_raw:
        if not isinstance(item, int):
            raise ValueError("evidence_feedback_ids musi zawierać liczby całkowite.")
        if item in allowed_ids:
            evidence.append(item)
    barriers = data.get("barriers_pl") or []
    improvements = data.get("improvements_pl") or []
    if not isinstance(barriers, list) or not isinstance(improvements, list):
        raise ValueError("barriers_pl i improvements_pl muszą być listami.")
    summary = data.get("summary_pl")
    if not isinstance(summary, str) or not summary.strip():
        raise ValueError("summary_pl jest wymagane.")
    disclaimer = data.get("disclaimer_pl")
    if not isinstance(disclaimer, str) or not disclaimer.strip():
        disclaimer = REPORT_DISCLAIMER
    return AiTestReport(
        summary_pl=summary.strip(),
        barriers_pl=[str(x).strip() for x in barriers if str(x).strip()],
        improvements_pl=[str(x).strip() for x in improvements if str(x).strip()],
        evidence_feedback_ids=evidence,
        disclaimer_pl=disclaimer.strip(),
    )


async def suggest_tester_fit(
    application: InnovationTestApplication,
    test: InnovationTest,
) -> TesterFitSuggestion:
    """Sugestia dopasowania — nie zmienia statusu zgłoszenia."""
    if not settings.M4_AI_ENABLED:
        return TesterFitSuggestion(
            label_pl="Brak sugestii AI",
            rationale_pl="Sugestia dopasowania jest wyłączona (M4_AI_ENABLED=false).",
            disclaimer_pl=FIT_DISCLAIMER,
        )
    system = (
        "Jesteś asystentem Hubu innowacji społecznych. Oceń dopasowanie testera do "
        "testu (rekrutacji testerów). Odpowiedz WYŁĄCZNIE poprawnym JSON-em: "
        '{"label_pl":"string","rationale_pl":"string","disclaimer_pl":"string"}. '
        "To tylko sugestia, nie decyzja. Nie wymyślaj faktów spoza formularza."
    )
    user = json.dumps(
        {
            "test": {
                "title": test.title,
                "target_group": test.target_group,
                "tester_type": test.tester_type,
                "location": test.location,
                "goal_description": test.goal_description,
            },
            "tester": {
                "tester_type": application.tester_type.value,
                # bez adresu, e-maila i imienia — dane kontaktowe nie trafiają do AI
                "is_target_group_member": application.is_target_group_member,
                "motivation": (application.motivation or "")[: settings.M4_MOTIVATION_MAX_CHARS],
            },
        },
        ensure_ascii=False,
    )
    try:
        llm = get_llm_provider()
        raw = await llm.complete(system, user, max_tokens=settings.M4_AI_MAX_TOKENS)
        data = _extract_json_object(raw)
        label = str(data.get("label_pl") or "").strip() or "Sugestia dopasowania"
        rationale = str(data.get("rationale_pl") or "").strip() or "Brak uzasadnienia."
        disclaimer = str(data.get("disclaimer_pl") or "").strip() or FIT_DISCLAIMER
        return TesterFitSuggestion(
            label_pl=label,
            rationale_pl=rationale,
            disclaimer_pl=disclaimer,
        )
    except (ProviderError, ValueError, json.JSONDecodeError) as exc:
        log.warning(
            "suggest_tester_fit failed application_id=%s error=%s",
            application.id,
            type(exc).__name__,
        )
        return TesterFitSuggestion(
            label_pl="Sugestia niedostępna",
            rationale_pl="Nie udało się wygenerować sugestii AI. Hub podejmuje decyzję ręcznie.",
            disclaimer_pl=FIT_DISCLAIMER,
        )


async def summarize_test_feedback(
    test: InnovationTest,
    feedback: list[InnovationTestFeedback],
) -> AiTestReport:
    allowed_ids = {item.id for item in feedback}
    payload = [
        {
            "feedback_id": item.id,
            "usefulness": item.usefulness,
            "ease_of_use": item.ease_of_use,
            "accessibility": item.accessibility,
            "fit_to_needs": item.fit_to_needs,
            "comment": (item.comment or "")[: settings.M4_COMMENT_MAX_CHARS],
            "improvement": (item.improvement or "")[: settings.M4_COMMENT_MAX_CHARS],
        }
        for item in feedback[: settings.M4_REPORT_FEEDBACK_MAX]
    ]
    system = (
        "Jesteś asystentem Hubu. Streszcz anonimowy feedback z testu innowacji. "
        "Odpowiedz WYŁĄCZNIE JSON-em: "
        '{"summary_pl":"string","barriers_pl":["string"],"improvements_pl":["string"],'
        '"evidence_feedback_ids":[1],"disclaimer_pl":"string"}. '
        "Nie podawaj danych kontaktowych. Nie wydawaj końcowej rekomendacji decyzji. "
        "evidence_feedback_ids muszą pochodzić z listy feedback_id."
    )
    user = json.dumps(
        {
            "test_title": test.title,
            "goal_description": test.goal_description,
            "feedback": payload,
        },
        ensure_ascii=False,
    )
    llm = get_llm_provider()
    raw = await llm.complete(system, user, max_tokens=settings.M4_AI_MAX_TOKENS)
    return _parse_ai_report(_extract_json_object(raw), allowed_ids)


def _status_counts(
    applications: list[InnovationTestApplication],
) -> dict[ApplicationStatus, int]:
    counts = {status: 0 for status in ApplicationStatus}
    for app in applications:
        counts[app.status] = counts.get(app.status, 0) + 1
    return counts


async def build_test_report(
    session: AsyncSession,
    test_id: int,
    *,
    regenerate_ai: bool = False,
) -> InnovationTestReport:
    result = await session.execute(
        select(InnovationTest)
        .options(
            selectinload(InnovationTest.applications).selectinload(
                InnovationTestApplication.feedback
            )
        )
        .where(InnovationTest.id == test_id)
    )
    test = result.scalar_one_or_none()
    if test is None:
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono testu.")

    applications = list(test.applications)
    counts = _status_counts(applications)
    feedback_items = [app.feedback for app in applications if app.feedback is not None]
    feedback_count = len(feedback_items)
    small_sample = feedback_count < settings.M4_SMALL_SAMPLE_THRESHOLD

    comments = [
        AnonymousFeedbackComment(
            feedback_id=item.id,
            comment=item.comment,
            improvement=item.improvement,
            comment_visible_to_author=item.comment_visible_to_author,
            usefulness=item.usefulness,
            ease_of_use=item.ease_of_use,
            accessibility=item.accessibility,
            fit_to_needs=item.fit_to_needs,
        )
        for item in feedback_items
    ]

    ai_report: AiTestReport | None = None
    ai_available = False
    ai_error_pl: str | None = None
    ai_model = test.ai_model
    ai_prompt_version = test.ai_prompt_version
    ai_generated_at = test.ai_generated_at

    if not regenerate_ai and isinstance(test.ai_report, dict) and test.ai_report:
        try:
            ai_report = AiTestReport.model_validate(test.ai_report)
            ai_available = True
        except Exception:
            ai_error_pl = "Zapisany raport AI ma niepoprawny kształt."

    if regenerate_ai or (ai_report is None and settings.M4_AI_ENABLED and not ai_error_pl):
        if not settings.M4_AI_ENABLED:
            ai_error_pl = "Raport AI jest wyłączony (M4_AI_ENABLED=false)."
            ai_available = False
            ai_report = None
        else:
            try:
                ai_report = await summarize_test_feedback(test, feedback_items)
                test.ai_report = ai_report.model_dump()
                test.ai_model = settings.llm_model
                test.ai_prompt_version = settings.M4_AI_PROMPT_VERSION
                test.ai_generated_at = datetime.now(UTC)
                ai_model = test.ai_model
                ai_prompt_version = test.ai_prompt_version
                ai_generated_at = test.ai_generated_at
                ai_available = True
                ai_error_pl = None
                await session.flush()
            except (ProviderError, ValueError, json.JSONDecodeError) as exc:
                log.warning(
                    "summarize_test_feedback failed test_id=%s error=%s",
                    test.id,
                    type(exc).__name__,
                )
                ai_available = False
                ai_report = None
                ai_error_pl = (
                    "Nie udało się wygenerować raportu AI. "
                    "Statystyki i anonimowe komentarze są dostępne."
                )

    if not settings.M4_AI_ENABLED and ai_report is None and ai_error_pl is None:
        ai_error_pl = "Raport AI jest wyłączony (M4_AI_ENABLED=false)."

    return InnovationTestReport(
        test_id=test.id,
        test_status=test.status.value,  # type: ignore[arg-type]
        applications_total=len(applications),
        applications_accepted=counts[ApplicationStatus.ACCEPTED],
        applications_completed=counts[ApplicationStatus.COMPLETED],
        applications_canceled=counts[ApplicationStatus.CANCELED],
        applications_rejected=counts[ApplicationStatus.REJECTED],
        applications_submitted=counts[ApplicationStatus.SUBMITTED],
        feedback_count=feedback_count,
        small_sample_warning=small_sample,
        usefulness=_rating_stats([f.usefulness for f in feedback_items]),
        ease_of_use=_rating_stats([f.ease_of_use for f in feedback_items]),
        accessibility=_rating_stats([f.accessibility for f in feedback_items]),
        fit_to_needs=_rating_stats([f.fit_to_needs for f in feedback_items]),
        anonymous_comments=comments,
        ai_report=ai_report,
        ai_available=ai_available,
        ai_error_pl=ai_error_pl,
        ai_model=ai_model,
        ai_prompt_version=ai_prompt_version,
        ai_generated_at=ai_generated_at,
    )
