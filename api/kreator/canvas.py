"""Social Canvas: definicja, walidacja wartości bloków, scalanie, postęp i opisy.

Kształty wartości w `idea_canvases.data[block_id]` (module-3-tasks.md, „Wartości w
`idea_canvases.data`”):
- `single`   → `"KOD"`
- `multi`    → `{"selected": ["kod"], "other": ["własny wpis"]}`
- `list`     → `["wpis"]`
- `text`     → `"tekst"`
- `partners` → `[{"name", "how", "roles": ["KOD"], "status": "KOD"}]`

Wartość pusta po normalizacji = brak bloku (`None`). Limity wyłącznie z `settings`.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import settings
from api.kreator.models import IdeaCanvas
from api.kreator.schemas import CanvasBlock, CanvasDefinition, CanvasProgress, SheetProgress

DEFINITION_FILE = "social-canvas.json"


# --- definicja --------------------------------------------------------------------


@lru_cache(maxsize=1)
def load_definition() -> CanvasDefinition:
    path = Path(settings.DATA_DIR) / DEFINITION_FILE
    return CanvasDefinition.model_validate(json.loads(path.read_text(encoding="utf-8")))


@lru_cache(maxsize=1)
def block_map() -> dict[str, CanvasBlock]:
    return {b.id: b for b in load_definition().blocks}


# --- normalizacja i walidacja -----------------------------------------------------


def _err(block: CanvasBlock, message: str) -> ValueError:
    return ValueError(f"{block.id}: {message}")


def _clean_items(block: CanvasBlock, raw: Any, what: str) -> list[str]:
    """Lista wpisów tekstowych: strip, pominięcie pustych, usunięcie duplikatów, limity."""
    if raw is None:
        return []
    if not isinstance(raw, list):
        raise _err(block, f"{what} musi być listą tekstów.")
    out: list[str] = []
    seen: set[str] = set()
    for item in raw:
        if not isinstance(item, str):
            raise _err(block, f"{what}: każdy wpis musi być tekstem.")
        item = item.strip()
        if not item:
            continue
        if len(item) > settings.CANVAS_ITEM_MAX_CHARS:
            raise _err(
                block, f"{what}: wpis może mieć najwyżej {settings.CANVAS_ITEM_MAX_CHARS} znaków."
            )
        key = item.casefold()
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    if len(out) > settings.CANVAS_LIST_MAX_ITEMS:
        raise _err(block, f"{what}: najwyżej {settings.CANVAS_LIST_MAX_ITEMS} wpisów.")
    return out


def _clean_codes(block: CanvasBlock, raw: Any, allowed: list[str], what: str) -> list[str]:
    if raw is None:
        return []
    if not isinstance(raw, list):
        raise _err(block, f"{what} musi być listą kodów.")
    out: list[str] = []
    for code in raw:
        if not isinstance(code, str) or code not in allowed:
            raise _err(block, f"{what}: nieznany kod {code!r}.")
        if code not in out:
            out.append(code)
    return out


def _validate_single(block: CanvasBlock, value: Any) -> str | None:
    if not isinstance(value, str):
        raise _err(block, "wartość musi być kodem opcji.")
    code = value.strip()
    if not code:
        return None
    if code not in {o.code for o in block.options}:
        raise _err(block, f"nieznany kod {code!r}.")
    return code


def _validate_multi(block: CanvasBlock, value: Any) -> dict[str, list[str]] | None:
    if not isinstance(value, dict):
        raise _err(block, 'wartość musi mieć postać {"selected": [...], "other": [...]}.')
    unknown = set(value) - {"selected", "other"}
    if unknown:
        raise _err(block, f"nieznane pola: {', '.join(sorted(unknown))}.")
    selected = _clean_codes(
        block, value.get("selected"), [o.code for o in block.options], "selected"
    )
    other = _clean_items(block, value.get("other"), "other")
    if block.max is not None and len(selected) + len(other) > block.max:
        raise _err(block, f"można wybrać najwyżej {block.max} pozycje.")
    if not selected and not other:
        return None
    return {"selected": selected, "other": other}


def _validate_list(block: CanvasBlock, value: Any) -> list[str] | None:
    items = _clean_items(block, value, "lista")
    return items or None


def _validate_text(block: CanvasBlock, value: Any) -> str | None:
    if not isinstance(value, str):
        raise _err(block, "wartość musi być tekstem.")
    text = value.strip()
    if len(text) > settings.CANVAS_TEXT_MAX_CHARS:
        raise _err(block, f"tekst może mieć najwyżej {settings.CANVAS_TEXT_MAX_CHARS} znaków.")
    return text or None


def _validate_partners(block: CanvasBlock, value: Any) -> list[dict[str, Any]] | None:
    if not isinstance(value, list):
        raise _err(block, "wartość musi być listą partnerów.")
    if len(value) > settings.CANVAS_PARTNERS_MAX:
        raise _err(block, f"najwyżej {settings.CANVAS_PARTNERS_MAX} partnerów.")
    role_codes = [r.code for r in block.roles]
    status_codes = {s.code for s in block.statuses}
    out: list[dict[str, Any]] = []
    for i, raw in enumerate(value, start=1):
        if not isinstance(raw, dict):
            raise _err(block, f"partner {i}: nieprawidłowy format.")
        name = raw.get("name")
        how = raw.get("how") or ""
        if not isinstance(name, str) or not name.strip():
            raise _err(block, f"partner {i}: podaj nazwę partnera.")
        if not isinstance(how, str):
            raise _err(block, f"partner {i}: opis pomocy musi być tekstem.")
        name, how = name.strip(), how.strip()
        if len(name) > settings.CANVAS_ITEM_MAX_CHARS or len(how) > settings.CANVAS_ITEM_MAX_CHARS:
            raise _err(
                block,
                f"partner {i}: nazwa i opis mogą mieć najwyżej "
                f"{settings.CANVAS_ITEM_MAX_CHARS} znaków.",
            )
        roles = _clean_codes(block, raw.get("roles"), role_codes, f"partner {i}: roles")
        if not roles:
            raise _err(block, f"partner {i}: wybierz co najmniej jedną rolę.")
        status = raw.get("status")
        if status not in status_codes:
            raise _err(block, f"partner {i}: nieznany status {status!r}.")
        out.append({"name": name, "how": how, "roles": roles, "status": status})
    return out or None


_VALIDATORS = {
    "single": _validate_single,
    "multi": _validate_multi,
    "list": _validate_list,
    "text": _validate_text,
    "partners": _validate_partners,
}


def validate_block(block: CanvasBlock, value: Any) -> Any:
    """Znormalizowana wartość bloku albo `None` (pusta). Błąd → `ValueError("<block_id>: …")`."""
    if value is None:
        return None
    return _VALIDATORS[block.type](block, value)


def merge_blocks(data: dict[str, Any], patch: dict[str, Any]) -> dict[str, Any]:
    """Nowy słownik `data` po nałożeniu `patch`; `None` lub wartość pusta usuwa klucz."""
    blocks = block_map()
    merged = dict(data)
    for block_id, value in patch.items():
        block = blocks.get(block_id)
        if block is None:
            raise ValueError(f"{block_id}: nieznany blok kanwy.")
        clean = validate_block(block, value)
        if clean is None:
            merged.pop(block_id, None)
        else:
            merged[block_id] = clean
    return merged


# --- postęp -----------------------------------------------------------------------


def _is_filled(value: Any) -> bool:
    if isinstance(value, dict):
        return bool(value.get("selected") or value.get("other"))
    if isinstance(value, str):
        return bool(value.strip())
    return bool(value)


def progress(data: dict[str, Any]) -> CanvasProgress:
    by_sheet: dict[str, SheetProgress] = {
        s.id: SheetProgress(filled=0, total=0) for s in load_definition().sheets
    }
    filled = 0
    for block in load_definition().blocks:
        sheet = by_sheet.setdefault(block.sheet, SheetProgress(filled=0, total=0))
        sheet.total += 1
        if _is_filled(data.get(block.id)):
            sheet.filled += 1
            filled += 1
    total = len(load_definition().blocks)
    percent = round(filled * 100 / total) if total else 0
    return CanvasProgress(filled=filled, total=total, percent=percent, by_sheet=by_sheet)


# --- opisy ------------------------------------------------------------------------


def _labels(items: list[Any], codes: list[str] | Any) -> list[str]:
    by_code = {i.code: i.label for i in items}
    if not isinstance(codes, list):
        return []
    return [by_code.get(c, str(c)) for c in codes]


def describe_block(block: CanvasBlock, value: Any) -> str:
    """Polski opis wartości bloku, np. „Intensywność: Mocno przeszkadza”. Pusta → `""`."""
    if not _is_filled(value):
        return ""
    if block.type == "single":
        text = _labels(block.options, [value])[0]
    elif block.type == "multi" and isinstance(value, dict):
        parts = _labels(block.options, value.get("selected") or [])
        other = [str(o) for o in value.get("other") or []]
        if other:
            parts.append("inne: " + ", ".join(other))
        text = ", ".join(parts)
    elif block.type == "list" and isinstance(value, list):
        text = ", ".join(str(v) for v in value)
    elif block.type == "partners" and isinstance(value, list):
        partners = []
        for p in value:
            if not isinstance(p, dict):
                continue
            tags = _labels(block.roles, p.get("roles") or [])
            tags += _labels(block.statuses, [p.get("status")] if p.get("status") else [])
            entry = str(p.get("name", ""))
            if tags:
                entry += f" ({', '.join(tags)})"
            if p.get("how"):
                entry += f" — {p['how']}"
            partners.append(entry)
        text = "; ".join(partners)
    else:
        text = str(value)
    return f"{block.title}: {text}"


# --- baza -------------------------------------------------------------------------


async def load_canvas(session: AsyncSession, idea_id: int) -> dict[str, Any]:
    """`idea_canvases.data` pomysłu albo `{}`, gdy kanwy jeszcze nie ma."""
    data = await session.scalar(select(IdeaCanvas.data).where(IdeaCanvas.idea_id == idea_id))
    return dict(data) if data else {}
