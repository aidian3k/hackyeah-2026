"""Walidacja domenowa i operacje udziału Modułu 4 (Tester innowacji)."""

from __future__ import annotations

import hashlib
import logging
import secrets
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.errors import ApiError
from api.models import (
    ApplicationStatus,
    InnovationTest,
    InnovationTestApplication,
    InnovationTestFeedback,
    InnovationTestStatus,
    TesterType,
)
from api.schemas import InnovationTestApplicationCreate, InnovationTestFeedbackCreate

log = logging.getLogger(__name__)

# Stały tekst i wersja zgody dla całego Modułu 4 (MVP — Hub nie edytuje per nabór).
M4_CONSENT_VERSION = "m4-consent-v1"
M4_CONSENT_TEXT_PL = (
    "Wyrażam zgodę na kontakt w sprawie udziału w tym naborze testowym oraz na "
    "przetwarzanie podanych danych w celu obsługi zgłoszenia przez Małopolski Hub "
    "Innowacji Społecznych. Dane kontaktowe są widoczne wyłącznie dla Hubu."
)

ACTIVE_APPLICATION_STATUSES = frozenset(
    {ApplicationStatus.SUBMITTED, ApplicationStatus.ACCEPTED}
)
MAX_ACTIVE_APPLICATIONS = 3
ACCESS_TOKEN_BYTES = 32


def normalize_tester_email(email: str) -> str:
    """Identyfikator testera w MVP: strip + casefold (bez logowania wartości)."""
    return email.strip().casefold()


def create_access_token() -> tuple[str, str]:
    """Zwraca (plaintext_token, token_hash). W bazie zapisujemy wyłącznie hash."""
    token = secrets.token_urlsafe(ACCESS_TOKEN_BYTES)
    return token, hash_access_token(token)


def hash_access_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def verify_access_token(
    session: AsyncSession, token: str
) -> InnovationTestApplication:
    if not token or not token.strip():
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono dostępu testera.")
    token_hash = hash_access_token(token.strip())
    result = await session.execute(
        select(InnovationTestApplication)
        .options(
            selectinload(InnovationTestApplication.feedback),
            selectinload(InnovationTestApplication.test),
        )
        .where(InnovationTestApplication.access_token_hash == token_hash)
    )
    application = result.scalar_one_or_none()
    if application is None:
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono dostępu testera.")
    return application


async def _count_active_applications(
    session: AsyncSession, email_normalized: str
) -> int:
    return int(
        await session.scalar(
            select(func.count())
            .select_from(InnovationTestApplication)
            .where(
                InnovationTestApplication.email_normalized == email_normalized,
                InnovationTestApplication.status.in_(tuple(ACTIVE_APPLICATION_STATUSES)),
            )
        )
        or 0
    )


async def _count_accepted(session: AsyncSession, test_id: int) -> int:
    return int(
        await session.scalar(
            select(func.count())
            .select_from(InnovationTestApplication)
            .where(
                InnovationTestApplication.test_id == test_id,
                InnovationTestApplication.status.in_(
                    (ApplicationStatus.ACCEPTED, ApplicationStatus.COMPLETED)
                ),
            )
        )
        or 0
    )


async def maybe_auto_close_test(session: AsyncSession, test: InnovationTest) -> None:
    """Po limicie zaakceptowanych miejsc nabór zamyka się automatycznie (nieodwracalnie)."""
    if test.status != InnovationTestStatus.OPEN:
        return
    accepted = await _count_accepted(session, test.id)
    if accepted >= test.seats_limit:
        test.status = InnovationTestStatus.CLOSED
        test.closed_at = datetime.now(UTC)
        log.info(
            "innovation_test auto-closed test_id=%s accepted=%s seats_limit=%s",
            test.id,
            accepted,
            test.seats_limit,
        )


async def create_application(
    session: AsyncSession,
    test: InnovationTest,
    payload: InnovationTestApplicationCreate,
) -> tuple[InnovationTestApplication, str]:
    if test.status != InnovationTestStatus.OPEN:
        raise ApiError(409, "CONFLICT", "Nabór jest zamknięty — nie można złożyć zgłoszenia.")

    email_normalized = normalize_tester_email(payload.email)
    active = await _count_active_applications(session, email_normalized)
    if active >= MAX_ACTIVE_APPLICATIONS:
        raise ApiError(
            409,
            "CONFLICT",
            "Masz już trzy aktywne zgłoszenia. Wycofaj jedno albo dokończ test, "
            "zanim złożysz kolejne.",
        )

    duplicate = await session.scalar(
        select(InnovationTestApplication.id).where(
            InnovationTestApplication.test_id == test.id,
            InnovationTestApplication.email_normalized == email_normalized,
            InnovationTestApplication.status.in_(tuple(ACTIVE_APPLICATION_STATUSES)),
        )
    )
    if duplicate is not None:
        raise ApiError(
            409,
            "CONFLICT",
            "Masz już aktywne zgłoszenie do tego naboru.",
        )

    token, token_hash = create_access_token()
    now = datetime.now(UTC)
    application = InnovationTestApplication(
        test_id=test.id,
        display_name=payload.display_name.strip(),
        email=payload.email.strip(),
        email_normalized=email_normalized,
        tester_type=TesterType(payload.tester_type),
        wojewodztwo=payload.wojewodztwo.strip(),
        powiat=payload.powiat.strip(),
        gmina=payload.gmina.strip(),
        is_target_group_member=payload.is_target_group_member,
        motivation=payload.motivation.strip(),
        status=ApplicationStatus.SUBMITTED,
        consent=True,
        consent_version=M4_CONSENT_VERSION,
        consented_at=now,
        access_token_hash=token_hash,
        access_token_created_at=now,
    )
    session.add(application)
    await session.flush()
    log.info(
        "innovation_test application created application_id=%s test_id=%s "
        "motivation_len=%s",
        application.id,
        test.id,
        len(payload.motivation),
    )
    return application, token


async def accept_application(
    session: AsyncSession,
    test: InnovationTest,
    application: InnovationTestApplication,
) -> tuple[InnovationTestApplication, str]:
    if test.status != InnovationTestStatus.OPEN:
        raise ApiError(409, "CONFLICT", "Nabór jest zamknięty — nie można akceptować zgłoszeń.")
    if application.test_id != test.id:
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono zgłoszenia w tym naborze.")
    if application.status != ApplicationStatus.SUBMITTED:
        raise ApiError(
            409,
            "CONFLICT",
            "Można zaakceptować tylko zgłoszenie ze statusem SUBMITTED.",
        )

    accepted = await _count_accepted(session, test.id)
    if accepted >= test.seats_limit:
        raise ApiError(409, "CONFLICT", "Osiągnięto limit miejsc w naborze.")

    token, token_hash = create_access_token()
    now = datetime.now(UTC)
    application.status = ApplicationStatus.ACCEPTED
    application.rejection_reason = None
    application.access_token_hash = token_hash
    application.access_token_created_at = now
    application.access_token_used_at = None
    application.updated_at = now
    await session.flush()
    await maybe_auto_close_test(session, test)
    log.info(
        "innovation_test application accepted application_id=%s test_id=%s",
        application.id,
        test.id,
    )
    return application, token


async def reject_application(
    session: AsyncSession,
    test: InnovationTest,
    application: InnovationTestApplication,
    reason: str,
) -> InnovationTestApplication:
    if application.test_id != test.id:
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono zgłoszenia w tym naborze.")
    if application.status != ApplicationStatus.SUBMITTED:
        raise ApiError(409, "CONFLICT", "Można odrzucić tylko zgłoszenie ze statusem SUBMITTED.")
    cleaned = reason.strip()
    if not cleaned:
        raise ApiError(422, "VALIDATION_ERROR", "Powód odrzucenia jest wymagany.")
    application.status = ApplicationStatus.REJECTED
    application.rejection_reason = cleaned
    application.updated_at = datetime.now(UTC)
    await session.flush()
    log.info(
        "innovation_test application rejected application_id=%s test_id=%s reason_len=%s",
        application.id,
        test.id,
        len(cleaned),
    )
    return application


async def cancel_application(
    session: AsyncSession,
    test: InnovationTest,
    application: InnovationTestApplication,
    reason: str,
    *,
    by_tester: bool = False,
) -> InnovationTestApplication:
    if application.test_id != test.id:
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono zgłoszenia w tym naborze.")
    cleaned = reason.strip()
    if not cleaned:
        raise ApiError(422, "VALIDATION_ERROR", "Powód anulowania jest wymagany.")

    if by_tester:
        if application.status != ApplicationStatus.SUBMITTED:
            raise ApiError(
                409,
                "CONFLICT",
                "Tester może wycofać zgłoszenie tylko przed decyzją Hubu.",
            )
    elif application.status not in {
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.ACCEPTED,
    }:
        raise ApiError(
            409,
            "CONFLICT",
            "Można anulować tylko zgłoszenie SUBMITTED albo ACCEPTED.",
        )

    application.status = ApplicationStatus.CANCELED
    application.cancel_reason = cleaned
    application.updated_at = datetime.now(UTC)
    await session.flush()
    log.info(
        "innovation_test application canceled application_id=%s test_id=%s reason_len=%s",
        application.id,
        test.id,
        len(cleaned),
    )
    return application


async def submit_feedback(
    session: AsyncSession,
    application: InnovationTestApplication,
    payload: InnovationTestFeedbackCreate,
) -> InnovationTestFeedback:
    test = application.test
    if test is None:
        test = await session.get(InnovationTest, application.test_id)
    if test is None:
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono naboru.")
    if test.status != InnovationTestStatus.OPEN:
        raise ApiError(409, "CONFLICT", "Nabór jest zamknięty — nie można wysłać ankiety.")
    if application.feedback is not None:
        raise ApiError(409, "CONFLICT", "Ankieta została już wysłana.")
    existing = await session.scalar(
        select(InnovationTestFeedback.id).where(
            InnovationTestFeedback.application_id == application.id
        )
    )
    if existing is not None:
        raise ApiError(409, "CONFLICT", "Ankieta została już wysłana.")
    if application.status != ApplicationStatus.ACCEPTED:
        raise ApiError(
            409,
            "CONFLICT",
            "Ankietę może wysłać tylko zaakceptowany tester przed ukończeniem.",
        )

    now = datetime.now(UTC)
    feedback = InnovationTestFeedback(
        application_id=application.id,
        usefulness=payload.usefulness,
        ease_of_use=payload.ease_of_use,
        accessibility=payload.accessibility,
        fit_to_needs=payload.fit_to_needs,
        comment=payload.comment,
        improvement=payload.improvement,
        comment_visible_to_author=False,
        submitted_at=now,
    )
    application.status = ApplicationStatus.COMPLETED
    application.access_token_used_at = now
    application.updated_at = now
    session.add(feedback)
    await session.flush()
    log.info(
        "innovation_test feedback submitted feedback_id=%s application_id=%s "
        "comment_len=%s improvement_len=%s",
        feedback.id,
        application.id,
        len(payload.comment or ""),
        len(payload.improvement or ""),
    )
    return feedback
