"""Odtwarzacz mocków SSE dla frontendu — bez zależności (tylko stdlib).

    python docs/mocks/replay.py                       # :8001, scenariusz "match"
    python docs/mocks/replay.py --port 8001 --scenario no-match --delay 0.05

POST /api/chat odtwarza `chat-<scenariusz>.sse` ramka po ramce (domyślnie 50 ms przerwy).
Scenariusz można nadpisać per żądanie: `POST /api/chat?scenario=error`.
GET /api/solutions, /api/inbox, /api/stats zwracają odpowiednie pliki JSON.
"""

from __future__ import annotations

import argparse
import json
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

HERE = Path(__file__).resolve().parent
SCENARIOS = ("match", "no-match", "retracted", "error")
JSON_ROUTES = {
    "/api/solutions": "solutions-list.json",
    "/api/inbox": "inbox.json",
    "/api/stats": "stats.json",
}
ALLOWED_ORIGIN = "http://localhost:5173"


def load_frames(scenario: str) -> list[bytes]:
    text = (HERE / f"chat-{scenario}.sse").read_text(encoding="utf-8")
    return [(f + "\n\n").encode("utf-8") for f in text.split("\n\n") if f.strip()]


class Handler(BaseHTTPRequestHandler):
    scenario = "match"
    delay = 0.05
    protocol_version = "HTTP/1.1"

    def _common_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept, X-Request-Id")
        self.send_header("Access-Control-Expose-Headers", "X-Request-Id")
        self.send_header("X-Request-Id", self.headers.get("X-Request-Id") or str(uuid.uuid4()))

    def _json(self, status: int, body: object) -> None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self._common_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _not_found(self) -> None:
        self._json(404, {"error": {"code": "NOT_FOUND", "message": "Nie ma takiego zasobu."}})

    def do_OPTIONS(self) -> None:  # noqa: N802 (preflight CORS)
        self.send_response(204)
        self._common_headers()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        name = JSON_ROUTES.get(urlparse(self.path).path)
        if not name:
            return self._not_found()
        self._json(200, json.loads((HERE / name).read_text(encoding="utf-8")))

    def do_POST(self) -> None:  # noqa: N802
        url = urlparse(self.path)
        if url.path != "/api/chat":
            return self._not_found()
        length = int(self.headers.get("Content-Length") or 0)
        if length:
            self.rfile.read(length)  # treść żądania ignorowana — mock jest statyczny
        scenario = parse_qs(url.query).get("scenario", [self.scenario])[0]
        if scenario not in SCENARIOS:
            msg = f"Nieznany scenariusz: {scenario}. Dostępne: {', '.join(SCENARIOS)}."
            return self._json(422, {"error": {"code": "VALIDATION_ERROR", "message": msg}})

        self.send_response(200)
        self._common_headers()
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Accel-Buffering", "no")
        self.send_header("Connection", "close")
        self.end_headers()
        self.close_connection = True
        try:
            for frame in load_frames(scenario):
                self.wfile.write(frame)
                self.wfile.flush()
                time.sleep(self.delay)
        except (BrokenPipeError, ConnectionResetError):
            pass  # klient przerwał strumień


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--port", type=int, default=8001)
    p.add_argument("--scenario", choices=SCENARIOS, default="match")
    p.add_argument("--delay", type=float, default=0.05, help="przerwa między ramkami [s]")
    args = p.parse_args()
    Handler.scenario = args.scenario
    Handler.delay = args.delay
    print(f"Mock SSE: http://{args.host}:{args.port}/api/chat (scenariusz: {args.scenario})")
    ThreadingHTTPServer((args.host, args.port), Handler).serve_forever()


if __name__ == "__main__":
    main()
