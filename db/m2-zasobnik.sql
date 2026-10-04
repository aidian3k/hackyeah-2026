-- HubMI, Moduł 2 (Zasobnik wiedzy). Idempotentny; na działającej bazie: make db-m2.
-- Ładowany po init.sql (kolejność alfabetyczna w docker-entrypoint-initdb.d).
CREATE TABLE IF NOT EXISTS challenge_profiles (
    category   TEXT PRIMARY KEY REFERENCES challenge_taxonomy(code),
    lead_pl    TEXT        NOT NULL,
    key_facts  JSONB       NOT NULL DEFAULT '[]',
    is_demo    BOOLEAN     NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS indicators (
    code            TEXT PRIMARY KEY,
    category        TEXT        NOT NULL REFERENCES challenge_taxonomy(code),
    label_pl        TEXT        NOT NULL,
    unit            TEXT        NOT NULL,
    year            SMALLINT    NOT NULL,
    higher_is_worse BOOLEAN     NOT NULL DEFAULT TRUE,
    region_value    NUMERIC,
    source_name     TEXT        NOT NULL,
    source_url      TEXT,
    is_demo         BOOLEAN     NOT NULL DEFAULT TRUE,
    sort_order      INT         NOT NULL DEFAULT 100,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS indicators_category_idx ON indicators (category, sort_order);

CREATE TABLE IF NOT EXISTS indicator_values (
    indicator_code TEXT    NOT NULL REFERENCES indicators(code) ON DELETE CASCADE,
    powiat         TEXT    NOT NULL,
    value          NUMERIC NOT NULL,
    PRIMARY KEY (indicator_code, powiat)
);
