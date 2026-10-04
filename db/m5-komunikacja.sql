-- Splot – Moduł 5 (Platforma aktywnej komunikacji). Idempotentny; na działającej bazie: make db-m5.
DO $$ BEGIN
  CREATE TYPE thread_kind AS ENUM ('QUESTION', 'MENTORING', 'PARTNERSHIP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE thread_status AS ENUM ('AI_PENDING', 'WAITING_STAFF', 'WAITING_USER', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE message_role AS ENUM ('USER', 'STAFF', 'MENTOR', 'ASSISTANT', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE org_sector AS ENUM ('NGO', 'JST', 'PUBLIC', 'BUSINESS', 'SCIENCE', 'RESIDENTS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE partnership_intent AS ENUM ('OFFER', 'SEEK');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE offer_status AS ENUM ('PUBLISHED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Eksperci (dane fikcyjne z data/mentors.json).
CREATE TABLE IF NOT EXISTS mentors (
    id           BIGSERIAL PRIMARY KEY,
    seed_key     TEXT UNIQUE,
    display_name TEXT    NOT NULL,
    organization TEXT,
    expertise    TEXT    NOT NULL,
    categories   TEXT[]  NOT NULL DEFAULT '{}'      -- kody challenge_taxonomy
);

-- Tablica partnerstw „oferujemy / szukamy”.
CREATE TABLE IF NOT EXISTS partnership_offers (
    id           BIGSERIAL PRIMARY KEY,
    seed_key     TEXT UNIQUE,
    intent       partnership_intent NOT NULL,
    organization TEXT         NOT NULL,
    sector       org_sector   NOT NULL,
    title        TEXT         NOT NULL,
    description  TEXT         NOT NULL,
    category     TEXT         REFERENCES challenge_taxonomy(code),
    session_id   TEXT,
    status       offer_status NOT NULL DEFAULT 'PUBLISHED',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partnership_offers_status_idx ON partnership_offers (status, created_at DESC);

-- Wątki rozmów.
CREATE TABLE IF NOT EXISTS threads (
    id                 BIGSERIAL PRIMARY KEY,
    seed_key           TEXT UNIQUE,
    kind               thread_kind   NOT NULL,
    status             thread_status NOT NULL,
    subject            TEXT          NOT NULL,
    category           TEXT          REFERENCES challenge_taxonomy(code),
    reporter_type      reporter_type NOT NULL DEFAULT 'OTHER',
    author_label       TEXT,                      -- podpis autora, niezweryfikowany
    session_id         TEXT,
    partnership_id     BIGINT REFERENCES partnership_offers(id) ON DELETE SET NULL,
    assigned_mentor_id BIGINT REFERENCES mentors(id) ON DELETE SET NULL,
    last_message_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    user_last_read_at  TIMESTAMPTZ,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS threads_status_idx ON threads (status, last_message_at DESC);
CREATE INDEX IF NOT EXISTS threads_mentor_idx ON threads (assigned_mentor_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS thread_messages (
    id           BIGSERIAL PRIMARY KEY,
    thread_id    BIGINT       NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    role         message_role NOT NULL,
    author_label TEXT,
    mentor_id    BIGINT       REFERENCES mentors(id) ON DELETE SET NULL,
    body         TEXT         NOT NULL,
    solution_ids BIGINT[]     NOT NULL DEFAULT '{}', -- karty asystenta; [n] = pozycja n
    meta         JSONB        NOT NULL DEFAULT '{}', -- np. {"fallback": "no_llm"}
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS thread_messages_thread_idx ON thread_messages (thread_id, created_at);
