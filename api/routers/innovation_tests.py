"""API Modułu 4 — Tester innowacji: nabory publiczne, token testera i panel Hubu."""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.db import get_session
from api.errors import ApiError
from api.innovation_tests import (
    M4_CONSENT_TEXT_PL,
    M4_CONSENT_VERSION,
    accept_application,
    cancel_application,
    create_application,
    reject_application,
    submit_feedback,
    verify_access_token,
)
from api.models import (
    ApplicationStatus,
    InnovationTest,
    InnovationTestApplication,
    InnovationTestFeedback,
    InnovationTestMaterial,
    InnovationTestStatus,
    MaterialType,
    Solution,
    SolutionStatus,
    TesterType,
    TestMode,
)
from api.pipeline.innovation_tests import build_test_report, suggest_tester_fit
from api.schemas import (
    FeedbackModerate,
    InnovationTestAccessLink,
    InnovationTestAccessStatus,
    InnovationTestApplicationCreate,
    InnovationTestApplicationPublic,
    InnovationTestApplicationRead,
    InnovationTestCancel,
    InnovationTestCreate,
    InnovationTestDecision,
    InnovationTestFeedbackCreate,
    InnovationTestFeedbackRead,
    InnovationTestMaterialRead,
    InnovationTestRead,
    InnovationTestReport,
    Page,
    TesterFitSuggestion,
)

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/innovation-tests", tags=["innovation-tests"])
SessionDep = Annotated[AsyncSession, Depends(get_session)]


def _material_read(row: InnovationTestMaterial) -> InnovationTestMaterialRead:
    return InnovationTestMaterialRead(
        id=row.id,
        title=row.title,
        type=row.type.value,  # type: ignore[arg-type]
        locator=row.locator,
        description=row.description,
        sort_order=row.sort_order,
    )


async def _seats_accepted(session: AsyncSession, test_id: int) -> int:
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


async def _to_test_read(
    session: AsyncSession,
    test: InnovationTest,
    *,
    solution: Solution | None = None,
) -> InnovationTestRead:
    sol = solution or test.solution
    return InnovationTestRead(
        id=test.id,
        solution_id=test.solution_id,
        solution_title=sol.title if sol else None,
        solution_status=sol.status.value if sol else None,
        title=test.title,
        goal_description=test.goal_description,
        instruction=test.instruction,
        target_group=test.target_group,
        tester_type=test.tester_type,
        location=test.location,
        seats_limit=test.seats_limit,
        seats_accepted=await _seats_accepted(session, test.id),
        mode=test.mode.value,  # type: ignore[arg-type]
        estimated_duration=test.estimated_duration,
        ends_at=test.ends_at,
        status=test.status.value,  # type: ignore[arg-type]
        created_at=test.created_at,
        closed_at=test.closed_at,
        materials=[_material_read(m) for m in test.materials],
    )


def _fit_from_json(raw: dict[str, Any] | None) -> TesterFitSuggestion | None:
    if not raw:
        return None
    try:
        return TesterFitSuggestion.model_validate(raw)
    except Exception:
        return None


def _application_read(app: InnovationTestApplication) -> InnovationTestApplicationRead:
    return InnovationTestApplicationRead(
        id=app.id,
        test_id=app.test_id,
        display_name=app.display_name,
        email=app.email,
        tester_type=app.tester_type.value,  # type: ignore[arg-type]
        wojewodztwo=app.wojewodztwo,
        powiat=app.powiat,
        gmina=app.gmina,
        is_target_group_member=app.is_target_group_member,
        motivation=app.motivation,
        status=app.status.value,  # type: ignore[arg-type]
        consent=app.consent,
        consent_version=app.consent_version,
        consented_at=app.consented_at,
        rejection_reason=app.rejection_reason,
        cancel_reason=app.cancel_reason,
        has_access_token=bool(app.access_token_hash),
        ai_fit_suggestion=_fit_from_json(app.ai_fit_suggestion),
        created_at=app.created_at,
        updated_at=app.updated_at,
        feedback_id=app.feedback.id if app.feedback else None,
    )


def _feedback_read(row: InnovationTestFeedback) -> InnovationTestFeedbackRead:
    return InnovationTestFeedbackRead(
        id=row.id,
        application_id=row.application_id,
        usefulness=row.usefulness,
        ease_of_use=row.ease_of_use,
        accessibility=row.accessibility,
        fit_to_needs=row.fit_to_needs,
        comment=row.comment,
        improvement=row.improvement,
        comment_visible_to_author=row.comment_visible_to_author,
        submitted_at=row.submitted_at,
    )


def _access_link(
    application_id: int, status: ApplicationStatus, token: str
) -> InnovationTestAccessLink:
    return InnovationTestAccessLink(
        application_id=application_id,
        status=status.value,  # type: ignore[arg-type]
        access_token=token,
        access_path=f"/api/innovation-tests/access/{token}",
    )


async def _load_test(
    session: AsyncSession,
    test_id: int,
    *,
    with_applications: bool = False,
) -> InnovationTest:
    options = [
        selectinload(InnovationTest.materials),
        selectinload(InnovationTest.solution),
    ]
    if with_applications:
        options.append(
            selectinload(InnovationTest.applications).selectinload(
                InnovationTestApplication.feedback
            )
        )
    result = await session.execute(
        select(InnovationTest).options(*options).where(InnovationTest.id == test_id)
    )
    test = result.scalar_one_or_none()
    if test is None:
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono naboru.")
    return test


async def _load_application(
    session: AsyncSession, test_id: int, application_id: int
) -> InnovationTestApplication:
    result = await session.execute(
        select(InnovationTestApplication)
        .options(selectinload(InnovationTestApplication.feedback))
        .where(
            InnovationTestApplication.id == application_id,
            InnovationTestApplication.test_id == test_id,
        )
    )
    app = result.scalar_one_or_none()
    if app is None:
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono zgłoszenia.")
    return app


@router.get("/meta/consent")
async def consent_meta() -> dict[str, str]:
    return {"version": M4_CONSENT_VERSION, "text_pl": M4_CONSENT_TEXT_PL}


@router.get("", response_model=Page[InnovationTestRead])
async def list_innovation_tests(
    session: SessionDep,
    status: Literal["OPEN", "CLOSED"] | None = "OPEN",
    hub: bool = False,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[InnovationTestRead]:
    conds: list[Any] = []
    if hub:
        if status is not None:
            conds.append(InnovationTest.status == InnovationTestStatus(status))
    else:
        conds.append(InnovationTest.status == InnovationTestStatus.OPEN)
        conds.append(Solution.status == SolutionStatus.PUBLISHED)

    base = (
        select(InnovationTest)
        .join(Solution, Solution.id == InnovationTest.solution_id)
        .options(
            selectinload(InnovationTest.materials),
            selectinload(InnovationTest.solution),
        )
        .where(*conds)
        .order_by(InnovationTest.created_at.desc())
    )
    total = int(
        await session.scalar(
            select(func.count())
            .select_from(InnovationTest)
            .join(Solution, Solution.id == InnovationTest.solution_id)
            .where(*conds)
        )
        or 0
    )
    rows = (
        await session.execute(base.limit(limit).offset(offset))
    ).scalars().all()
    items = [await _to_test_read(session, row) for row in rows]
    return Page(items=items, total=total, limit=limit, offset=offset)


@router.post("", response_model=InnovationTestRead, status_code=201)
async def create_innovation_test(
    session: SessionDep, payload: InnovationTestCreate
) -> InnovationTestRead:
    solution = await session.get(Solution, payload.solution_id)
    if solution is None:
        raise ApiError(422, "VALIDATION_ERROR", "solution_id: nie znaleziono rozwiązania.")
    if solution.status not in {SolutionStatus.PUBLISHED, SolutionStatus.PENDING_REVIEW}:
        raise ApiError(
            422,
            "VALIDATION_ERROR",
            "solution_id: nabór wymaga rozwiązania PUBLISHED albo PENDING_REVIEW.",
        )
    if payload.ends_at <= datetime.now(UTC):
        raise ApiError(422, "VALIDATION_ERROR", "ends_at: termin musi być w przyszłości.")

    test = InnovationTest(
        solution_id=payload.solution_id,
        title=payload.title,
        goal_description=payload.goal_description,
        instruction=payload.instruction,
        target_group=payload.target_group,
        tester_type=payload.tester_type,
        location=payload.location,
        seats_limit=payload.seats_limit,
        mode=TestMode(payload.mode),
        estimated_duration=payload.estimated_duration,
        ends_at=payload.ends_at,
        status=InnovationTestStatus.OPEN,
    )
    test.materials = [
        InnovationTestMaterial(
            title=item.title,
            type=MaterialType(item.type),
            locator=item.locator,
            description=item.description,
            sort_order=item.sort_order,
        )
        for item in payload.materials
    ]
    session.add(test)
    await session.commit()
    test = await _load_test(session, test.id)
    log.info(
        "innovation_test created test_id=%s solution_id=%s materials=%s",
        test.id,
        test.solution_id,
        len(test.materials),
    )
    return await _to_test_read(session, test)


@router.get("/access/{token}", response_model=InnovationTestAccessStatus)
async def get_access_status(session: SessionDep, token: str) -> InnovationTestAccessStatus:
    application = await verify_access_token(session, token)
    test = application.test
    can_submit = (
        application.status == ApplicationStatus.ACCEPTED
        and test.status == InnovationTestStatus.OPEN
        and application.feedback is None
    )
    return InnovationTestAccessStatus(
        application_id=application.id,
        test_id=test.id,
        test_title=test.title,
        test_status=test.status.value,  # type: ignore[arg-type]
        status=application.status.value,  # type: ignore[arg-type]
        rejection_reason=application.rejection_reason,
        cancel_reason=application.cancel_reason,
        can_submit_feedback=can_submit,
        feedback=_feedback_read(application.feedback) if application.feedback else None,
    )


@router.post("/access/{token}", response_model=InnovationTestFeedbackRead, status_code=201)
async def post_access_feedback(
    session: SessionDep, token: str, payload: InnovationTestFeedbackCreate
) -> InnovationTestFeedbackRead:
    application = await verify_access_token(session, token)
    feedback = await submit_feedback(session, application, payload)
    await session.commit()
    return _feedback_read(feedback)


@router.get("/{test_id}", response_model=InnovationTestRead)
async def get_innovation_test(
    session: SessionDep,
    test_id: int,
    hub: bool = False,
) -> InnovationTestRead:
    test = await _load_test(session, test_id)
    if not hub:
        if test.status != InnovationTestStatus.OPEN:
            raise ApiError(404, "NOT_FOUND", "Nie znaleziono naboru.")
        if test.solution.status != SolutionStatus.PUBLISHED:
            raise ApiError(404, "NOT_FOUND", "Nie znaleziono naboru.")
    return await _to_test_read(session, test)


@router.post("/{test_id}/close", response_model=InnovationTestRead)
async def close_innovation_test(session: SessionDep, test_id: int) -> InnovationTestRead:
    test = await _load_test(session, test_id)
    if test.status == InnovationTestStatus.CLOSED:
        raise ApiError(409, "CONFLICT", "Nabór jest już zamknięty.")
    test.status = InnovationTestStatus.CLOSED
    test.closed_at = datetime.now(UTC)
    await session.commit()
    test = await _load_test(session, test_id)
    log.info("innovation_test closed test_id=%s", test_id)
    return await _to_test_read(session, test)


@router.post(
    "/{test_id}/applications",
    response_model=InnovationTestApplicationPublic,
    status_code=201,
)
async def apply_to_innovation_test(
    session: SessionDep,
    test_id: int,
    payload: InnovationTestApplicationCreate,
) -> InnovationTestApplicationPublic:
    test = await _load_test(session, test_id)
    if test.solution.status != SolutionStatus.PUBLISHED:
        # publiczne zgłoszenie tylko do naborów powiązanych z PUBLISHED
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono naboru.")
    application, _token = await create_application(session, test, payload)
    try:
        suggestion = await suggest_tester_fit(application, test)
        application.ai_fit_suggestion = suggestion.model_dump()
    except Exception:
        log.warning("ai fit suggestion skipped application_id=%s", application.id)
    await session.commit()
    return InnovationTestApplicationPublic(
        id=application.id,
        test_id=test.id,
        status=application.status.value,  # type: ignore[arg-type]
        consent_version=application.consent_version,
    )


@router.get(
    "/{test_id}/applications",
    response_model=Page[InnovationTestApplicationRead],
)
async def list_applications(
    session: SessionDep,
    test_id: int,
    status: ApplicationStatus | None = None,
    tester_type: TesterType | None = None,
    target_group_member: bool | None = None,
    location_q: Annotated[str | None, Query(max_length=200)] = None,
    q: Annotated[str | None, Query(max_length=200)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[InnovationTestApplicationRead]:
    await _load_test(session, test_id)
    conds: list[Any] = [InnovationTestApplication.test_id == test_id]
    if status is not None:
        conds.append(InnovationTestApplication.status == status)
    if tester_type is not None:
        conds.append(InnovationTestApplication.tester_type == tester_type)
    if target_group_member is not None:
        conds.append(InnovationTestApplication.is_target_group_member == target_group_member)
    if location_q:
        like = f"%{location_q.strip()}%"
        conds.append(
            or_(
                InnovationTestApplication.wojewodztwo.ilike(like),
                InnovationTestApplication.powiat.ilike(like),
                InnovationTestApplication.gmina.ilike(like),
            )
        )
    if q:
        like = f"%{q.strip()}%"
        conds.append(
            or_(
                InnovationTestApplication.display_name.ilike(like),
                InnovationTestApplication.email.ilike(like),
                InnovationTestApplication.email_normalized.ilike(like),
            )
        )

    total = int(
        await session.scalar(
            select(func.count()).select_from(InnovationTestApplication).where(*conds)
        )
        or 0
    )
    rows = (
        await session.execute(
            select(InnovationTestApplication)
            .options(selectinload(InnovationTestApplication.feedback))
            .where(*conds)
            .order_by(InnovationTestApplication.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
    ).scalars().all()
    return Page(
        items=[_application_read(row) for row in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/{test_id}/applications/{application_id}/accept",
    response_model=InnovationTestAccessLink,
)
async def accept_application_endpoint(
    session: SessionDep, test_id: int, application_id: int
) -> InnovationTestAccessLink:
    test = await _load_test(session, test_id)
    application = await _load_application(session, test_id, application_id)
    application, token = await accept_application(session, test, application)
    await session.commit()
    return _access_link(application.id, application.status, token)


@router.post(
    "/{test_id}/applications/{application_id}/reject",
    response_model=InnovationTestApplicationRead,
)
async def reject_application_endpoint(
    session: SessionDep,
    test_id: int,
    application_id: int,
    payload: InnovationTestDecision,
) -> InnovationTestApplicationRead:
    test = await _load_test(session, test_id)
    application = await _load_application(session, test_id, application_id)
    application = await reject_application(session, test, application, payload.reason)
    await session.commit()
    application = await _load_application(session, test_id, application_id)
    return _application_read(application)


@router.post(
    "/{test_id}/applications/{application_id}/cancel",
    response_model=InnovationTestApplicationRead,
)
async def cancel_application_endpoint(
    session: SessionDep,
    test_id: int,
    application_id: int,
    payload: InnovationTestCancel,
    by_tester: bool = False,
) -> InnovationTestApplicationRead:
    test = await _load_test(session, test_id)
    application = await _load_application(session, test_id, application_id)
    application = await cancel_application(
        session, test, application, payload.reason, by_tester=by_tester
    )
    await session.commit()
    application = await _load_application(session, test_id, application_id)
    return _application_read(application)


@router.get("/{test_id}/report", response_model=InnovationTestReport)
async def get_report(session: SessionDep, test_id: int) -> InnovationTestReport:
    report = await build_test_report(session, test_id, regenerate_ai=False)
    await session.commit()
    return report


@router.post("/{test_id}/report/regenerate", response_model=InnovationTestReport)
async def regenerate_report(session: SessionDep, test_id: int) -> InnovationTestReport:
    report = await build_test_report(session, test_id, regenerate_ai=True)
    await session.commit()
    return report


@router.post(
    "/{test_id}/feedback/{feedback_id}/moderate",
    response_model=InnovationTestFeedbackRead,
)
async def moderate_feedback(
    session: SessionDep,
    test_id: int,
    feedback_id: int,
    payload: FeedbackModerate,
) -> InnovationTestFeedbackRead:
    result = await session.execute(
        select(InnovationTestFeedback)
        .join(InnovationTestApplication)
        .where(
            InnovationTestFeedback.id == feedback_id,
            InnovationTestApplication.test_id == test_id,
        )
    )
    feedback = result.scalar_one_or_none()
    if feedback is None:
        raise ApiError(404, "NOT_FOUND", "Nie znaleziono feedbacku.")
    feedback.comment_visible_to_author = payload.comment_visible_to_author
    feedback.updated_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(feedback)
    return _feedback_read(feedback)
