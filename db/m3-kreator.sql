-- Splot – Moduł 3 (Kreator pomysłów). Idempotentny.
-- Ładuje się po init.sql (kolejność alfabetyczna w docker-entrypoint-initdb.d);
-- na działającej bazie: `make db-m3` (ADR-M3-002).
DO $$ BEGIN CREATE TYPE idea_status AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'INVITED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE idea_stage AS ENUM ('IDEA', 'PROTOTYPE', 'TESTED', 'READY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS ideas (
    id               BIGSERIAL PRIMARY KEY,
    title            TEXT        NOT NULL,
    summary          TEXT        NOT NULL,
    essence          TEXT        NOT NULL DEFAULT '',
    audience         TEXT        NOT NULL DEFAULT '',
    stage            idea_stage  NOT NULL DEFAULT 'IDEA',
    category         TEXT        REFERENCES challenge_taxonomy(code),
    gmina            TEXT,
    powiat           TEXT,
    author_name      TEXT,
    contact_email    TEXT,                      -- nigdy nie wychodzi z API ani do logów
    source_report_id BIGINT      REFERENCES reports(id) ON DELETE SET NULL,
    status           idea_status NOT NULL DEFAULT 'DRAFT',
    submitted_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ideas_status_idx ON ideas (status, submitted_at DESC);

CREATE TABLE IF NOT EXISTS idea_canvases (
    idea_id    BIGINT PRIMARY KEY REFERENCES ideas(id) ON DELETE CASCADE,
    data       JSONB       NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idea_replies (
    id           BIGSERIAL PRIMARY KEY,
    idea_id      BIGINT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    author_label TEXT,
    body         TEXT   NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idea_replies_idea_idx ON idea_replies (idea_id, created_at);

-- Wnioski grantowe (model `GrantApplication`); nie mylić z `innovation_test_applications` (M4).
CREATE TABLE IF NOT EXISTS applications (
    id         BIGSERIAL PRIMARY KEY,
    idea_id    BIGINT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    call_id    TEXT   NOT NULL,
    answers    JSONB  NOT NULL DEFAULT '{}',
    budget     JSONB  NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (idea_id, call_id)
);
