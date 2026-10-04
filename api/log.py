"""Logowanie: `request_id` w każdym wpisie, maskowanie pól z danymi wrażliwymi.

Nigdy nie logujemy treści zgłoszeń ani body żądań — tylko `report_id` i długości.
"""

from __future__ import annotations

import logging
from contextvars import ContextVar
from typing import Any

from api.config import settings

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")

REDACTED_KEYS = frozenset(
    {
        "raw_text",
        "normalized_text",
        "message",
        "contact_email",
        # Moduł 5: treść rozmów i ogłoszeń partnerstw
        "body",
        "subject",
        "title",
        "description",
        "author_label",
    }
)
REDACTED = "***"

# Atrybuty standardowego LogRecord — wszystko poza nimi pochodzi z `extra`.
_STD_ATTRS = frozenset(logging.LogRecord("", 0, "", 0, "", None, None).__dict__) | {
    "message",
    "asctime",
    "request_id",
}


def _redact(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: (REDACTED if k in REDACTED_KEYS else _redact(v)) for k, v in value.items()}
    if isinstance(value, list | tuple):
        return type(value)(_redact(v) for v in value)
    return value


class RequestIdFilter(logging.Filter):
    """Dokleja `record.request_id` z kontekstu żądania."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get()
        return True


class RedactFilter(logging.Filter):
    """Maskuje klucze `raw_text`, `normalized_text`, `message`, `contact_email`
    w polach `extra` oraz w słownikach przekazanych jako argumenty logu."""

    def filter(self, record: logging.LogRecord) -> bool:
        for key in list(record.__dict__):
            if key in _STD_ATTRS:
                continue
            if key in REDACTED_KEYS:
                setattr(record, key, REDACTED)
            else:
                setattr(record, key, _redact(record.__dict__[key]))
        if isinstance(record.args, dict):
            record.args = _redact(record.args)
        elif isinstance(record.args, tuple):
            record.args = tuple(_redact(a) for a in record.args)
        return True


LOG_FORMAT = "%(asctime)s %(levelname)s [%(request_id)s] %(name)s: %(message)s"


def setup_logging() -> None:
    """Konfiguruje root logger (idempotentnie) i loggery uvicorna."""
    root = logging.getLogger()
    root.setLevel(settings.LOG_LEVEL.upper())
    handler = next((h for h in root.handlers if getattr(h, "_splot", False)), None)
    if handler is None:
        handler = logging.StreamHandler()
        handler._splot = True  # type: ignore[attr-defined]
        handler.setFormatter(logging.Formatter(LOG_FORMAT))
        handler.addFilter(RequestIdFilter())
        handler.addFilter(RedactFilter())
        root.addHandler(handler)
    # uvicorn.error / uvicorn.access idą przez root (jeden format z request_id)
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        lg = logging.getLogger(name)
        lg.handlers.clear()
        lg.propagate = True
