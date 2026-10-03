"""Jednolity format błędów: `{"error": {"code": "...", "message": "..."}}`."""

from __future__ import annotations

import logging
from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from api.log import request_id_var

log = logging.getLogger(__name__)

REQUEST_ID_HEADER = "X-Request-Id"


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message


def error_response(
    status: int, code: str, message: str, request: Request | None = None
) -> JSONResponse:
    headers: dict[str, str] = {}
    # 500 przechodzi przez ServerErrorMiddleware, poza middleware X-Request-Id
    rid = request.scope.get("request_id") if request is not None else None
    if rid:
        headers[REQUEST_ID_HEADER] = rid
    return JSONResponse(
        status_code=status,
        content={"error": {"code": code, "message": message}},
        headers=headers,
    )


_HTTP_CODES = {
    400: "BAD_REQUEST",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    413: "PAYLOAD_TOO_LARGE",
    422: "VALIDATION_ERROR",
    429: "TOO_MANY_REQUESTS",
    503: "SERVICE_UNAVAILABLE",
}

_HTTP_MESSAGES_PL = {
    404: "Nie znaleziono.",
    405: "Metoda niedozwolona.",
}


def _validation_message(exc: RequestValidationError) -> str:
    errors = exc.errors()
    if not errors:
        return "Nieprawidłowe dane wejściowe."
    first = errors[0]
    # Bez echa `input` — może zawierać dane wrażliwe.
    loc = ".".join(str(p) for p in first.get("loc", ()) if p != "body")
    msg = first.get("msg", "invalid")
    return f"{loc}: {msg}" if loc else str(msg)


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def _api_error(request: Request, exc: ApiError) -> JSONResponse:
        return error_response(exc.status, exc.code, exc.message, request)

    @app.exception_handler(RequestValidationError)
    async def _validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        return error_response(422, "VALIDATION_ERROR", _validation_message(exc), request)

    @app.exception_handler(StarletteHTTPException)
    async def _http(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = _HTTP_CODES.get(exc.status_code)
        if code is None:
            try:
                code = HTTPStatus(exc.status_code).name
            except ValueError:
                code = "HTTP_ERROR"
        detail = exc.detail if isinstance(exc.detail, str) else None
        if exc.status_code in _HTTP_MESSAGES_PL and detail in (
            None,
            HTTPStatus(exc.status_code).phrase,
        ):
            detail = _HTTP_MESSAGES_PL[exc.status_code]
        resp = error_response(exc.status_code, code, detail or code, request)
        if exc.headers:
            resp.headers.update(exc.headers)
        return resp

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
        # handler działa w ServerErrorMiddleware, już po wyjściu z middleware X-Request-Id
        token = request_id_var.set(request.scope.get("request_id", "-"))
        try:
            log.error("unhandled error: %s %s", request.method, request.url.path, exc_info=exc)
        finally:
            request_id_var.reset(token)
        return error_response(500, "INTERNAL", "Wewnętrzny błąd serwera.", request)
