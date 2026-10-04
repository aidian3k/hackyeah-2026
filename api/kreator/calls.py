"""Nabory (konkursy grantowe) z plików `data/calls/<id>.json` — ADR-M3-006.

Pliki walidowane schematem `CallFile` i wczytywane raz (`lru_cache`). Stan naboru
(`upcoming` / `open` / `closed`) liczony z `date.today()`; `KREATOR_CALLS_IGNORE_DATES`
traktuje każdy nabór jako otwarty (demo poza terminem).
"""

from __future__ import annotations

import json
from datetime import date
from functools import lru_cache
from pathlib import Path

from api.config import settings
from api.kreator.canvas import block_map
from api.kreator.schemas import (
    CallDetail,
    CallFile,
    CallSection,
    CallStateLiteral,
    CallSummary,
)

CALLS_DIR = "calls"
# Pola fiszki, do których mogą odwoływać się `prefill` sekcji (`idea.<pole>`).
IDEA_PREFILL_FIELDS = ("title", "summary", "essence", "audience")


def _check_prefill(call: CallFile) -> None:
    blocks = block_map()
    for section in call.sections:
        if section.kind != "text" and section.prefill:
            raise ValueError(f"{call.id}: sekcja {section.id!r} ({section.kind}) bez prefill")
        if (section.kind == "budget") != bool(section.budget_phases):
            raise ValueError(
                f"{call.id}: budget_phases tylko i obowiązkowo w sekcji budget ({section.id!r})"
            )
        for ref in section.prefill:
            source, _, name = ref.partition(".")
            ok = (source == "idea" and name in IDEA_PREFILL_FIELDS) or (
                source == "canvas" and name in blocks
            )
            if not ok:
                raise ValueError(f"{call.id}: nieznane odwołanie prefill {ref!r}")
    ids = [s.id for s in call.sections]
    if len(ids) != len(set(ids)):
        raise ValueError(f"{call.id}: powtórzone id sekcji")


@lru_cache(maxsize=1)
def load_calls() -> dict[str, CallFile]:
    """Wszystkie nabory `{id: CallFile}`; id musi być równe nazwie pliku."""
    calls: dict[str, CallFile] = {}
    for path in sorted((Path(settings.DATA_DIR) / CALLS_DIR).glob("*.json")):
        call = CallFile.model_validate(json.loads(path.read_text(encoding="utf-8")))
        if call.id != path.stem:
            raise ValueError(f"{path.name}: id {call.id!r} różni się od nazwy pliku")
        _check_prefill(call)
        calls[call.id] = call
    return calls


def get_call(call_id: str) -> CallFile | None:
    return load_calls().get(call_id)


def call_state(call: CallFile, today: date | None = None) -> CallStateLiteral:
    if settings.KREATOR_CALLS_IGNORE_DATES:
        return "open"
    today = today or date.today()
    if today < call.opens_at:
        return "upcoming"
    if today > call.closes_at:
        return "closed"
    return "open"


def section_limit(section: CallSection) -> int:
    """Limit znaków odpowiedzi w sekcji: własny `max_chars` albo `APPLICATION_TEXT_MAX_CHARS`."""
    return section.max_chars or settings.APPLICATION_TEXT_MAX_CHARS


def section_map(call: CallFile) -> dict[str, CallSection]:
    return {s.id: s for s in call.sections}


def call_summary(call: CallFile) -> CallSummary:
    state = call_state(call)
    return CallSummary(
        id=call.id,
        title=call.title,
        short_pl=call.short_pl,
        program=call.program,
        demo=call.demo,
        opens_at=call.opens_at,
        closes_at=call.closes_at,
        state=state,
        is_open=state == "open",
        max_amount=call.max_amount,
    )


def call_detail(call: CallFile) -> CallDetail:
    return CallDetail(
        **call_summary(call).model_dump(),
        based_on=call.based_on,
        applicant_types=call.applicant_types,
        sections=call.sections,
        statements=call.statements,
        form=call.form,
    )


def list_calls() -> list[CallSummary]:
    """Najpierw otwarte (najbliższy termin zamknięcia), potem nadchodzące, na końcu zakończone."""

    def key(s: CallSummary) -> tuple[int, int]:
        if s.state == "open":
            return (0, s.closes_at.toordinal())
        if s.state == "upcoming":
            return (1, s.opens_at.toordinal())
        return (2, -s.closes_at.toordinal())

    return sorted((call_summary(c) for c in load_calls().values()), key=key)
