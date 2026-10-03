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
