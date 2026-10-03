"""Aplikacja FastAPI Modułu 1. Routery wypełniają swoje pliki — ten plik się nie zmienia."""

from __future__ import annotations

import logging
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from api import tasks
from api.config import settings
from api.db import engine
from api.errors import REQUEST_ID_HEADER, install_error_handlers
from api.log import request_id_var, setup_logging
from api.routers import (
    chat,
    innovation_tests,
    knowledge,
    mentors,
    meta,
    partnerships,
    reports,
    search,
    solutions,
    staff,
    threads,
)

log = logging.getLogger(__name__)

MAX_REQUEST_ID_LEN = 128


class RequestIdMiddleware:
    """Czyste ASGI (działa też dla odpowiedzi strumieniowych SSE): bierze `X-Request-Id`
    z żądania albo generuje UUID4, wkłada do contextvar i `scope`, dokleja do odpowiedzi."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        incoming = None
        for name, value in scope.get("headers", []):
            if name == b"x-request-id":
                incoming = value.decode("latin-1").strip()
                break
        rid = incoming[:MAX_REQUEST_ID_LEN] if incoming else str(uuid.uuid4())
        scope["request_id"] = rid
        token = request_id_var.set(rid)

        async def send_with_id(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                headers[REQUEST_ID_HEADER] = rid
            await send(message)

        try:
            await self.app(scope, receive, send_with_id)
        finally:
            request_id_var.reset(token)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    log.info("api start")
    yield
    await tasks.drain()
    await engine.dispose()
    log.info("api stop")


def create_app() -> FastAPI:
    setup_logging()
    app = FastAPI(title="Splot — Moduł 1: Matchmaking społeczny", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
        allow_headers=["Content-Type", "Accept", REQUEST_ID_HEADER],
        expose_headers=[REQUEST_ID_HEADER],
    )
    # dodany jako ostatni = najbardziej zewnętrzny (obejmuje też preflight CORS)
    app.add_middleware(RequestIdMiddleware)

    install_error_handlers(app)

    for router in (
        chat.router,
        search.router,
        reports.router,
        solutions.router,
        knowledge.router,
        staff.router,
        innovation_tests.router,
        # Moduł 5: Platforma komunikacji
        threads.router,
        mentors.router,
        partnerships.router,
        meta.router,
        meta.health_router,
    ):
        app.include_router(router)
    return app


app = create_app()
