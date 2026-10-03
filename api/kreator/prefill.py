"""Wstępne wypełnienie wniosku grantowego z fiszki i Social Canvas (ADR-M3-006).

- sekcja `text`: połączenie źródeł z `section.prefill` — `idea.<pole>` to tekst pola fiszki,
  `canvas.<block_id>` to `describe_block`; puste pomijane, wynik przycięty do limitu sekcji;
- budżet: wiersz `{action: <etykieta>, when: "", cost: 0}` dla każdej pozycji kosztów stałych
  i zmiennych z kanwy (zaznaczone opcje i wpisy „inne”), do `APPLICATION_BUDGET_MAX_ROWS`.

Wypełnienie liczone tylko raz — przy tworzeniu wniosku.
"""

from __future__ import annotations

from typing import Any

from api.config import settings
from api.kreator.calls import IDEA_PREFILL_FIELDS, section_limit
from api.kreator.canvas import block_map, describe_block
from api.kreator.models import Idea
from api.kreator.schemas import CallFile, CallSection

COST_BLOCKS = ("costs_fixed", "costs_variable")
# = `BudgetRow.action` max_length (api/kreator/schemas.py)
BUDGET_ACTION_MAX_CHARS = 300


def _source_text(ref: str, idea: Idea, canvas: dict[str, Any]) -> str:
    source, _, name = ref.partition(".")
    if source == "idea" and name in IDEA_PREFILL_FIELDS:
        return (getattr(idea, name, "") or "").strip()
    if source == "canvas":
        block = block_map().get(name)
        if block is None:
            return ""
        value = canvas.get(name)
        if block.type == "partners" and isinstance(value, list):
            # Każdy partner w osobnym wierszu — czytelniej niż jedna linia z „; ”.
            prefix = f"{block.title}: "
            lines = [describe_block(block, [p]).removeprefix(prefix).strip() for p in value]
            lines = [f"- {line}" for line in lines if line]
            return f"{block.title}:\n" + "\n".join(lines) if lines else ""
        return describe_block(block, value).strip()
    return ""


def prefill_section(section: CallSection, idea: Idea, canvas: dict[str, Any]) -> str:
    parts = [t for ref in section.prefill if (t := _source_text(ref, idea, canvas))]
    return "\n\n".join(parts)[: section_limit(section)].strip()


def prefill_answers(call: CallFile, idea: Idea, canvas: dict[str, Any]) -> dict[str, str]:
    answers: dict[str, str] = {}
    for section in call.sections:
        if section.kind != "text":
            continue
        text = prefill_section(section, idea, canvas)
        if text:
            answers[section.id] = text
    return answers


def prefill_budget(canvas: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    blocks = block_map()
    for block_id in COST_BLOCKS:
        block = blocks.get(block_id)
        value = canvas.get(block_id)
        if block is None or not isinstance(value, dict):
            continue
        labels = {o.code: o.label for o in block.options}
        items = [labels.get(code, "") for code in value.get("selected") or []]
        items += [str(o) for o in value.get("other") or []]
        for item in items:
            action = item.strip()[:BUDGET_ACTION_MAX_CHARS]
            if action and action.casefold() not in seen:
                seen.add(action.casefold())
                rows.append({"action": action, "when": "", "cost": 0})
    return rows[: max(settings.APPLICATION_BUDGET_MAX_ROWS, 0)]
