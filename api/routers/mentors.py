"""Moduł 5 — router `mentors` (wypełnia go zadanie z module-5-tasks.md)."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["mentors"])
