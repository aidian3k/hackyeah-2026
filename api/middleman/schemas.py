"""Schematy Modułu 7 (Middleman innowacji). Limity długości treści — z ustawień, w routerze."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from api.schemas import ReporterTypeLiteral


class AdaptMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AdaptContext(BaseModel):
    reporter_type: ReporterTypeLiteral | None = None
    gmina: str | None = Field(default=None, max_length=100)


class AdaptChatRequest(BaseModel):
    messages: list[AdaptMessage]
    context: AdaptContext = Field(default_factory=AdaptContext)


class AdaptDoneEvent(BaseModel):
    latency_ms: dict[str, int]  # "total" zawsze, "first_token" gdy był token
