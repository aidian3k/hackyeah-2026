"""Zadania w tle odpięte od żądania (np. zapis zgłoszenia).

`spawn` trzyma silną referencję do zadania, żeby GC go nie zebrał, i loguje wyjątek.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Coroutine
from typing import Any

log = logging.getLogger(__name__)

BACKGROUND_TASKS: set[asyncio.Task] = set()


def _on_done(task: asyncio.Task) -> None:
    BACKGROUND_TASKS.discard(task)
    if task.cancelled():
        log.warning("background task cancelled: %s", task.get_name())
        return
    exc = task.exception()
    if exc is not None:
        log.error("background task failed: %s", task.get_name(), exc_info=exc)


def spawn[T](coro: Coroutine[Any, Any, T]) -> asyncio.Task[T]:
    task = asyncio.create_task(coro)
    BACKGROUND_TASKS.add(task)
    task.add_done_callback(_on_done)
    return task


async def drain(timeout: float = 5) -> None:
    """Na shutdown: czeka (maks. `timeout` s) na zaległe zadania, resztę anuluje."""
    pending = set(BACKGROUND_TASKS)
    if not pending:
        return
    log.info("draining %d background task(s)", len(pending))
    _, not_done = await asyncio.wait(pending, timeout=timeout)
    for task in not_done:
        task.cancel()
    if not_done:
        log.warning("cancelled %d background task(s) on shutdown", len(not_done))
        await asyncio.gather(*not_done, return_exceptions=True)
