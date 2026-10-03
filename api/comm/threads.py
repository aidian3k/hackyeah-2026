"""Wątki rozmów Modułu 5: tworzenie, wiadomości, statusy, przydział eksperta, odczyt.

Statusy (tabela „Statusy wątku” w module-5-tasks.md):
- nowe pytanie przy `M5_ASSISTANT_ENABLED` → `AI_PENDING` (asystent w tle), inne → `WAITING_STAFF`;
- wiadomość autora → `WAITING_STAFF`, zespołu/eksperta → `WAITING_USER`;
- `PATCH`: `WAITING_STAFF` z `WAITING_USER`/`CLOSED`, `CLOSED` z każdego poza `AI_PENDING`.

W logach tylko identyfikatory, rodzaj, rola i długość treści — nigdy treść ani podpis.
"""

from __future__ import annotations

import logging
from collections.abc import Iterable, Sequence
from datetime import datetime
from typing import Any

from sqlalchemy import BIGINT, bindparam, func, select, text, update
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.asyncio import AsyncSession

from api.cards import load_solutions, to_card
from api.comm.models import (
    Mentor,
    MessageRole,
    OfferStatus,
    PartnershipOffer,
    Thread,
    ThreadKind,
    ThreadMessage,
    ThreadStatus,
)
from api.comm.schemas import (
    MentorRef,
    ThreadCreate,
    ThreadDetail,
    ThreadListItem,
    ThreadMessageOut,
    ThreadPatch,
)
from api.config import settings
from api.errors import ApiError
from api.models import ReporterType, SolutionKind, SolutionStatus, Taxonomy
from api.pipeline.preprocess import preprocess
from api.schemas import Page, SolutionCard
from api.tasks import spawn

log = logging.getLogger(__name__)

SUBJECT_FROM_BODY_CHARS = 80  # temat z początku pierwszej wiadomości (kontrakt API)
MAX_IDS_FILTER = 50  # limit parametru `ids` (kontrakt API)

_REPLY_ROLES = frozenset({MessageRole.STAFF, MessageRole.MENTOR, MessageRole.ASSISTANT})

# Dozwolone przejścia przez PATCH (docelowy → skąd). Ten sam status = bez zmian.
_PATCH_FROM: dict[ThreadStatus, frozenset[ThreadStatus]] = {
    ThreadStatus.WAITING_STAFF: frozenset({ThreadStatus.WAITING_USER, ThreadStatus.CLOSED}),
    ThreadStatus.CLOSED: frozenset(
        {ThreadStatus.WAITING_STAFF, ThreadStatus.WAITING_USER, ThreadStatus.CLOSED}
    ),
}

MENTOR_JOINED_PL = "Do rozmowy dołączył(a) ekspert: {name}."
MENTOR_LEFT_PL = "Ekspert nie prowadzi już tej rozmowy."


def _not_found(thread_id: int) -> ApiError:
    return ApiError(404, "NOT_FOUND", f"Nie znaleziono rozmowy o id {thread_id}.")


async def _ensure_category(session: AsyncSession, category: str) -> None:
    found = await session.scalar(select(Taxonomy.code).where(Taxonomy.code == category))
    if found is None:
        raise ApiError(422, "VALIDATION_ERROR", f"category: nieznana kategoria „{category}”.")


async def _lock_thread(session: AsyncSession, thread_id: int) -> Thread:
    thread = await session.scalar(select(Thread).where(Thread.id == thread_id).with_for_update())
    if thread is None:
        raise _not_found(thread_id)
    return thread


def _insert_message(
    session: AsyncSession,
    thread: Thread,
    *,
    role: MessageRole,
    body: str,
    author_label: str | None = None,
    mentor_id: int | None = None,
    solution_ids: Sequence[int] = (),
    meta: dict[str, Any] | None = None,
) -> ThreadMessage:
    msg = ThreadMessage(
        thread_id=thread.id,
        role=role,
        body=body,
        author_label=author_label,
        mentor_id=mentor_id,
        solution_ids=list(solution_ids),
        meta=meta or {},
    )
    session.add(msg)
    thread.last_message_at = func.now()
    return msg


# --- karty pod wiadomością asystenta ------------------------------------------------


async def load_cards(session: AsyncSession, solution_ids: Iterable[int]) -> list[SolutionCard]:
    """Karty w kolejności wejścia; tylko opublikowane rozwiązania (nigdy KNOWLEDGE)."""
    ids = list(dict.fromkeys(solution_ids))
    rows = await load_solutions(session, ids)
    cards: list[SolutionCard] = []
    for sid in ids:
        row = rows.get(sid)
        if row is None:
            continue
        sol = row.solution
        if sol.status != SolutionStatus.PUBLISHED or sol.kind != SolutionKind.SOLUTION:
            continue
        cards.append(to_card(row, rank=len(cards) + 1))
    return cards


# --- tworzenie ------------------------------------------------------------------------


async def create_thread(session: AsyncSession, payload: ThreadCreate) -> int:
    kind = ThreadKind(payload.kind)
    partnership_id: int | None = None
    if kind == ThreadKind.PARTNERSHIP:
        if payload.partnership_id is None:
            raise ApiError(
                422, "VALIDATION_ERROR", "partnership_id: wymagane dla propozycji partnerstwa."
            )
        offer = await session.get(PartnershipOffer, payload.partnership_id)
        if offer is None:
            raise ApiError(
                404, "NOT_FOUND", f"Nie znaleziono ogłoszenia o id {payload.partnership_id}."
            )
        if offer.status != OfferStatus.PUBLISHED:
            raise ApiError(422, "OFFER_CLOSED", "To ogłoszenie jest już zamknięte.")
        partnership_id = offer.id

    if payload.category is not None:
        await _ensure_category(session, payload.category)
        category = payload.category
    else:
        category = preprocess(payload.body, None).category

    ai = kind == ThreadKind.QUESTION and settings.M5_ASSISTANT_ENABLED
    thread = Thread(
        kind=kind,
        status=ThreadStatus.AI_PENDING if ai else ThreadStatus.WAITING_STAFF,
        subject=payload.subject or payload.body.strip()[:SUBJECT_FROM_BODY_CHARS],
        category=category,
        reporter_type=ReporterType(payload.reporter_type),
        author_label=payload.author_label,
        session_id=payload.session_id,
        partnership_id=partnership_id,
    )
    session.add(thread)
    await session.flush()
    _insert_message(
        session, thread, role=MessageRole.USER, body=payload.body, author_label=payload.author_label
    )
    await session.commit()
    thread_id = thread.id
    log.info(
        "thread created",
        extra={"thread_id": thread_id, "kind": kind.value, "body_len": len(payload.body)},
    )

    if ai:
        from api.comm.assistant import run_assistant  # leniwie: assistant importuje ten moduł

        spawn(run_assistant(thread_id))
    return thread_id


# --- wiadomości i statusy ----------------------------------------------------------------


async def add_message(
    session: AsyncSession,
    thread_id: int,
    *,
    role: MessageRole,
    body: str,
    author_label: str | None = None,
    mentor_id: int | None = None,
    solution_ids: Sequence[int] = (),
    meta: dict[str, Any] | None = None,
) -> ThreadMessageOut:
    """Dopisuje wiadomość i zmienia status wg roli (USER/STAFF/MENTOR). ASSISTANT i SYSTEM
    statusu nie zmieniają — robi to wołający przez `set_status`."""
    thread = await _lock_thread(session, thread_id)
    if role in (MessageRole.STAFF, MessageRole.MENTOR) and thread.status == ThreadStatus.CLOSED:
        raise ApiError(409, "THREAD_CLOSED", "Rozmowa jest zamknięta. Najpierw otwórz ją ponownie.")
    if role == MessageRole.MENTOR:
        if mentor_id is None:
            raise ApiError(422, "VALIDATION_ERROR", "mentor_id: wymagane dla wiadomości eksperta.")
        if thread.assigned_mentor_id != mentor_id:
            raise ApiError(
                409, "MENTOR_NOT_ASSIGNED", "Ten ekspert nie jest przydzielony do rozmowy."
            )

    msg = _insert_message(
        session,
        thread,
        role=role,
        body=body,
        author_label=author_label,
        mentor_id=mentor_id if role == MessageRole.MENTOR else None,
        solution_ids=solution_ids,
        meta=meta,
    )
    if role == MessageRole.USER:
        thread.status = ThreadStatus.WAITING_STAFF
    elif role in (MessageRole.STAFF, MessageRole.MENTOR):
        thread.status = ThreadStatus.WAITING_USER
    await session.flush()
    await session.refresh(msg)

    mentor = None
    if msg.mentor_id is not None:
        m = await session.get(Mentor, msg.mentor_id)
        mentor = MentorRef(id=m.id, display_name=m.display_name) if m else None
    out = ThreadMessageOut(
        id=msg.id,
        role=msg.role.value,
        author_label=msg.author_label,
        mentor=mentor,
        body=msg.body,
        cards=await load_cards(session, msg.solution_ids) if role == MessageRole.ASSISTANT else [],
        created_at=msg.created_at,
    )
    await session.commit()
    log.info(
        "thread message created",
        extra={
            "thread_id": thread_id,
            "message_id": out.id,
            "role": role.value,
            "body_len": len(body),
        },
    )
    return out


async def set_status(
    session: AsyncSession,
    thread_id: int,
    status: ThreadStatus,
    *,
    only_from: ThreadStatus | None = None,
) -> bool:
    """Ustawia status (opcjonalnie tylko z `only_from`). Zwraca, czy coś się zmieniło."""
    stmt = update(Thread).where(Thread.id == thread_id).values(status=status)
    if only_from is not None:
        stmt = stmt.where(Thread.status == only_from)
    result = await session.execute(stmt)
    await session.commit()
    return bool(result.rowcount)


async def patch_thread(session: AsyncSession, thread_id: int, patch: ThreadPatch) -> None:
    thread = await _lock_thread(session, thread_id)

    if "assigned_mentor_id" in patch.model_fields_set:
        new_id = patch.assigned_mentor_id
        if new_id != thread.assigned_mentor_id:
            if new_id is None:
                thread.assigned_mentor_id = None
                _insert_message(session, thread, role=MessageRole.SYSTEM, body=MENTOR_LEFT_PL)
            else:
                mentor = await session.get(Mentor, new_id)
                if mentor is None:
                    raise ApiError(
                        422, "VALIDATION_ERROR", f"assigned_mentor_id: nie ma eksperta {new_id}."
                    )
                thread.assigned_mentor_id = new_id
                _insert_message(
                    session,
                    thread,
                    role=MessageRole.SYSTEM,
                    body=MENTOR_JOINED_PL.format(name=mentor.display_name),
                )
            log.info("thread mentor changed", extra={"thread_id": thread_id, "mentor_id": new_id})

    if patch.status is not None:
        target = ThreadStatus(patch.status)
        if target != thread.status:
            if thread.status not in _PATCH_FROM[target]:
                raise ApiError(
                    409,
                    "INVALID_TRANSITION",
                    f"Niedozwolona zmiana statusu rozmowy: {thread.status.value} → {target.value}.",
                )
            log.info(
                "thread status changed",
                extra={"thread_id": thread_id, "from": thread.status.value, "to": target.value},
            )
            thread.status = target

    await session.commit()


async def mark_read(session: AsyncSession, thread_id: int) -> None:
    result = await session.execute(
        update(Thread).where(Thread.id == thread_id).values(user_last_read_at=func.now())
    )
    if not result.rowcount:
        await session.rollback()
        raise _not_found(thread_id)
    await session.commit()


# --- odczyt -------------------------------------------------------------------------------

_LIST_SELECT = """
SELECT t.id, t.kind::text AS kind, t.status::text AS status, t.subject, t.category,
       tx.label_pl AS category_label_pl, t.reporter_type::text AS reporter_type, t.author_label,
       t.partnership_id, t.assigned_mentor_id, m.display_name AS mentor_name,
       lm.role::text AS last_message_role, t.last_message_at, t.user_last_read_at, t.created_at
FROM threads t
LEFT JOIN challenge_taxonomy tx ON tx.code = t.category
LEFT JOIN mentors m ON m.id = t.assigned_mentor_id
LEFT JOIN LATERAL (
    SELECT role FROM thread_messages
    WHERE thread_id = t.id ORDER BY created_at DESC, id DESC LIMIT 1
) lm ON true
"""


def _has_reply(role: str | None, last_at: datetime, read_at: datetime | None) -> bool:
    if role is None or MessageRole(role) not in _REPLY_ROLES:
        return False
    return read_at is None or last_at > read_at


def _list_item(r: Any) -> ThreadListItem:
    return ThreadListItem(
        id=r.id,
        kind=r.kind,
        status=r.status,
        subject=r.subject,
        category=r.category,
        category_label_pl=r.category_label_pl,
        reporter_type=r.reporter_type,
        author_label=r.author_label,
        partnership_id=r.partnership_id,
        assigned_mentor=(
            MentorRef(id=r.assigned_mentor_id, display_name=r.mentor_name)
            if r.assigned_mentor_id is not None
            else None
        ),
        last_message_role=r.last_message_role,
        last_message_at=r.last_message_at,
        has_reply=_has_reply(r.last_message_role, r.last_message_at, r.user_last_read_at),
        created_at=r.created_at,
    )


def parse_ids(raw: str | None) -> list[int] | None:
    """Parametr `ids` (CSV) → lista; błędny albo za długi → 422."""
    if raw is None or not raw.strip():
        return None
    try:
        ids = [int(x) for x in raw.split(",") if x.strip()]
    except ValueError as exc:
        raise ApiError(
            422, "VALIDATION_ERROR", "ids: oczekiwano liczb oddzielonych przecinkami."
        ) from exc
    if len(ids) > MAX_IDS_FILTER:
        raise ApiError(422, "VALIDATION_ERROR", f"ids: najwyżej {MAX_IDS_FILTER} identyfikatorów.")
    return ids


async def list_threads(
    session: AsyncSession,
    *,
    status: str | None,
    kind: str | None,
    mentor_id: int | None,
    ids: list[int] | None,
    limit: int,
    offset: int,
) -> Page[ThreadListItem]:
    where: list[str] = []
    params: dict[str, Any] = {"limit": limit, "offset": offset}
    binds = []
    if status is not None:
        where.append("t.status = CAST(:status AS thread_status)")
        params["status"] = status
    if kind is not None:
        where.append("t.kind = CAST(:kind AS thread_kind)")
        params["kind"] = kind
    if mentor_id is not None:
        where.append("t.assigned_mentor_id = :mentor_id")
        params["mentor_id"] = mentor_id
    if ids is not None:
        where.append("t.id = ANY(:ids)")
        params["ids"] = ids
        binds.append(bindparam("ids", type_=ARRAY(BIGINT)))
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""

    count_sql = text(f"SELECT count(*) FROM threads t {where_sql}")
    list_sql = text(
        f"{_LIST_SELECT} {where_sql} ORDER BY t.last_message_at DESC, t.id DESC "
        "LIMIT :limit OFFSET :offset"
    )
    if binds:
        count_sql = count_sql.bindparams(*binds)
        list_sql = list_sql.bindparams(*binds)

    count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
    total = await session.scalar(count_sql, count_params) or 0
    rows = (await session.execute(list_sql, params)).all()
    return Page[ThreadListItem](
        items=[_list_item(r) for r in rows], total=total, limit=limit, offset=offset
    )


async def load_thread(session: AsyncSession, thread_id: int) -> ThreadDetail:
    row = (
        await session.execute(text(f"{_LIST_SELECT} WHERE t.id = :id"), {"id": thread_id})
    ).one_or_none()
    if row is None:
        raise _not_found(thread_id)

    msg_rows = (
        await session.execute(
            select(ThreadMessage, Mentor.display_name)
            .outerjoin(Mentor, Mentor.id == ThreadMessage.mentor_id)
            .where(ThreadMessage.thread_id == thread_id)
            .order_by(ThreadMessage.created_at, ThreadMessage.id)
        )
    ).all()

    messages: list[ThreadMessageOut] = []
    for msg, mentor_name in msg_rows:
        cards = (
            await load_cards(session, msg.solution_ids)
            if msg.role == MessageRole.ASSISTANT and msg.solution_ids
            else []
        )
        messages.append(
            ThreadMessageOut(
                id=msg.id,
                role=msg.role.value,
                author_label=msg.author_label,
                mentor=(
                    MentorRef(id=msg.mentor_id, display_name=mentor_name)
                    if msg.mentor_id is not None and mentor_name is not None
                    else None
                ),
                body=msg.body,
                cards=cards,
                created_at=msg.created_at,
            )
        )
    return ThreadDetail(**_list_item(row).model_dump(), messages=messages)
