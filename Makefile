PY ?= $(if $(wildcard .venv/bin/python),.venv/bin/python,python)
RUFF ?= $(if $(wildcard .venv/bin/ruff),.venv/bin/ruff,ruff)
Q ?= starsi ludzie są samotni

.PHONY: up up-dev logs-dev down db dev ingest seed-m4 fmt lint psql reset-db chat

up:
	docker compose up -d --build

# tryb deweloperski z hot reloadem: api (uvicorn --reload) na :8000, Vite z HMR na :5173
DEV_COMPOSE = docker compose -f docker-compose.yml -f docker-compose.dev.yml

up-dev:
	docker compose stop web 2>/dev/null || true
	$(DEV_COMPOSE) up -d --build db api web-dev

logs-dev:
	$(DEV_COMPOSE) logs -f api web-dev

down:
	$(DEV_COMPOSE) down

db:
	docker compose up -d --wait db

dev:
	$(PY) -m uvicorn api.main:app --reload

ingest:
	$(PY) -m scripts.ingest data/solutions/

seed-m4:
	$(PY) -m scripts.seed_innovation_tests

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

# ---------- Moduł 5: Platforma komunikacji ----------
.PHONY: db-m5 seed-comm

# schemat M5 na działającej bazie (idempotentny, bez utraty danych)
db-m5:
	docker compose exec -T db psql -U splot -d splot -v ON_ERROR_STOP=1 < db/m5-komunikacja.sql
