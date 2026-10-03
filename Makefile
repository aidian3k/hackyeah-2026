PY ?= $(if $(wildcard .venv/bin/python),.venv/bin/python,python)
RUFF ?= $(if $(wildcard .venv/bin/ruff),.venv/bin/ruff,ruff)
Q ?= starsi ludzie są samotni

.PHONY: up down db dev ingest fmt lint psql reset-db chat

up:
	docker compose up -d --build

down:
	docker compose down

db:
	docker compose up -d --wait db

dev:
	$(PY) -m uvicorn api.main:app --reload

ingest:
	$(PY) -m scripts.ingest data/solutions/

fmt:
	$(RUFF) format . && $(RUFF) check --fix .

lint:
	$(RUFF) check .

psql:
	docker compose exec db psql -U splot splot

reset-db:
	docker compose down -v && docker compose up -d --wait db

chat:
	curl -N -X POST localhost:8000/api/chat -H 'Content-Type: application/json' -d "{\"message\":\"$(Q)\"}"

# ---------- Frontend (web/) ----------
.PHONY: web-install web-dev web-mock web-build web-lint

web-install:
	cd web && npm install

web-dev:
	cd web && npm run dev

# mock SSE (docs/mocks/replay.py) na :8001 w tle + Vite z proxy na mock; Ctrl+C zatrzymuje oba
web-mock:
	$(PY) docs/mocks/replay.py --port 8001 & MOCK_PID=$$!; \
	trap 'kill $$MOCK_PID 2>/dev/null' EXIT INT TERM; \
	cd web && VITE_API_TARGET=http://localhost:8001 npm run dev

web-build:
	cd web && npm run build

web-lint:
	cd web && npm run lint

.PHONY: web-up

# frontend produkcyjny (nginx) na :8080, proxy /api i /healthz → api
web-up:
	docker compose up -d --build web
