-- Splot – Moduł 1 (Matchmaking społeczny): schemat bazy PoC.
-- Ładowany jednorazowo przy pierwszym starcie kontenera (docker-entrypoint-initdb.d).
-- Przeładowanie: make reset-db. Bez Alembica, bez indeksów wektorowych (ADR-019).

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Obraz pgvector/pgvector:pg16 nie ma konfiguracji 'polish'.
-- polish_simple = simple (bez stemmingu) + unaccent (leksemy bez ogonków).
-- W zapytaniach zawsze literał 'polish_simple' (to_tsvector(regconfig, text) jest IMMUTABLE).
CREATE TEXT SEARCH CONFIGURATION polish_simple ( COPY = simple );
ALTER TEXT SEARCH CONFIGURATION polish_simple
    ALTER MAPPING FOR word, hword, hword_part, asciiword, asciihword, hword_asciipart
    WITH unaccent, simple;

CREATE TYPE solution_kind   AS ENUM ('SOLUTION', 'KNOWLEDGE');
CREATE TYPE solution_origin AS ENUM ('CURATED', 'USER_SUBMITTED', 'PROMOTED_FROM_REPORT');
CREATE TYPE solution_status AS ENUM ('PUBLISHED', 'PENDING_REVIEW', 'REJECTED', 'ARCHIVED');
CREATE TYPE report_status   AS ENUM ('NEW', 'TRIAGED', 'MATCHED', 'IN_PROGRESS', 'CLOSED');
CREATE TYPE reporter_type   AS ENUM ('RESIDENT', 'NGO', 'JST', 'OTHER');

-- Taksonomia wyzwań (kody stałe, etykiety po polsku; zgodna z data/taxonomy.json).
CREATE TABLE challenge_taxonomy (
    code        TEXT PRIMARY KEY,
    label_pl    TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    sort_order  INT  NOT NULL DEFAULT 100
);

-- Rozwiązania (kind = SOLUTION) i wpisy wiedzy (kind = KNOWLEDGE, tylko do candidates.context).
CREATE TABLE solutions (
    id                   BIGSERIAL PRIMARY KEY,
    kind                 solution_kind NOT NULL DEFAULT 'SOLUTION',
    title                TEXT        NOT NULL,
    summary              TEXT        NOT NULL,              -- krótki opis na kartę
    body                 TEXT        NOT NULL DEFAULT '',   -- pełna treść (chunkowana)
    organization         TEXT,
    gmina                TEXT,
    powiat               TEXT,
    category             TEXT        REFERENCES challenge_taxonomy(code),
    tags                 TEXT[]      NOT NULL DEFAULT '{}',
    target_group         TEXT,
    cost_range           TEXT,
    implementation_steps JSONB       NOT NULL DEFAULT '[]', -- lista kroków (string[])
    contact              JSONB       NOT NULL DEFAULT '{}', -- nigdy nie wychodzi z API
    source_url           TEXT,                              -- klucz idempotencji ingestu
    source_name          TEXT,
    media                JSONB       NOT NULL DEFAULT '[]', -- [{type, url, title}]
    evidence_level       SMALLINT    NOT NULL DEFAULT 1 CHECK (evidence_level BETWEEN 1 AND 5),
    origin               solution_origin NOT NULL DEFAULT 'CURATED',
    status               solution_status NOT NULL DEFAULT 'PUBLISHED', -- wyszukiwanie widzi tylko PUBLISHED
    content_hash         TEXT        NOT NULL,              -- hash (title, summary, body); zmiana => przebudowa chunków
    submitted_by_name    TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX solutions_source_url_uq ON solutions (source_url) WHERE source_url IS NOT NULL;
CREATE INDEX solutions_category_idx ON solutions (category);
CREATE INDEX solutions_gmina_idx    ON solutions (gmina);
CREATE INDEX solutions_status_idx   ON solutions (status, kind);
CREATE INDEX solutions_title_trgm   ON solutions USING gin (title gin_trgm_ops);

-- Fragmenty treści rozwiązań z embeddingiem i tsvector. Status i kind tylko przez JOIN solutions.
CREATE TABLE solution_chunks (
    id          BIGSERIAL PRIMARY KEY,
    solution_id BIGINT NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
    chunk_index INT    NOT NULL,
    title       TEXT   NOT NULL,              -- kopia solutions.title (kolumna generowana nie widzi joinów)
    heading     TEXT,                         -- nagłówek sekcji body, jeśli jest
    content     TEXT   NOT NULL,
    embedding   vector(1024),                 -- wymiar stały (ADR-004)
    ts          tsvector GENERATED ALWAYS AS (
                    setweight(to_tsvector('polish_simple', coalesce(title, '')),   'A') ||
                    setweight(to_tsvector('polish_simple', coalesce(heading, '')), 'B') ||
                    setweight(to_tsvector('polish_simple', content),               'C')
                ) STORED,
    UNIQUE (solution_id, chunk_index)
);
CREATE INDEX solution_chunks_ts_idx       ON solution_chunks USING gin (ts);
CREATE INDEX solution_chunks_solution_idx ON solution_chunks (solution_id);
-- Brak indeksu wektorowego w PoC (ADR-019).

-- Zgłoszenia problemów (zapis bezwarunkowy z każdego czatu).
CREATE TABLE reports (
    id                BIGSERIAL PRIMARY KEY,
    raw_text          TEXT        NOT NULL,   -- dosłowna treść; nigdy w logach
    normalized_text   TEXT        NOT NULL,   -- po preprocessingu; nigdy w logach
    embedding         vector(1024),           -- do licznika podobnych zgłoszeń
    category          TEXT        REFERENCES challenge_taxonomy(code),
    gmina             TEXT,
    powiat            TEXT,
    target_group      TEXT,
    extracted         JSONB       NOT NULL DEFAULT '{}', -- identyfikatory, rozszerzenia itp.
    severity_self     SMALLINT    CHECK (severity_self BETWEEN 1 AND 5),
    contact_email     TEXT,                   -- nigdy nie wychodzi z API ani do logów
    reporter_type     reporter_type NOT NULL DEFAULT 'OTHER',
    matched           BOOLEAN     NOT NULL DEFAULT false,
    top_solution_id   BIGINT      REFERENCES solutions(id),
    top_rerank_score  REAL,
    session_id        TEXT,
    status            report_status NOT NULL DEFAULT 'NEW',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reports_created_idx   ON reports (created_at DESC);
CREATE INDEX reports_status_idx    ON reports (status, created_at DESC);
CREATE INDEX reports_category_idx  ON reports (category);
CREATE INDEX reports_gmina_idx     ON reports (gmina);
CREATE INDEX reports_unmatched_idx ON reports (created_at DESC) WHERE NOT matched;

-- Ślad wyszukiwania (wyniki, czasy, feedback) powiązany ze zgłoszeniem.
CREATE TABLE search_events (
    id                  BIGSERIAL PRIMARY KEY,
    report_id           BIGINT REFERENCES reports(id) ON DELETE SET NULL,
    query               TEXT   NOT NULL,
    normalized_query    TEXT   NOT NULL,
    results             JSONB  NOT NULL,             -- lista kandydatów z rangami i score'ami
    lexical_count       INT    NOT NULL DEFAULT 0,
    vector_count        INT    NOT NULL DEFAULT 0,
    latency_ms          JSONB  NOT NULL DEFAULT '{}',
    clicked_solution_id BIGINT REFERENCES solutions(id),
    helpful             BOOLEAN,
    flags               JSONB  NOT NULL DEFAULT '{}', -- np. too_vague, answer_retracted, error
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Odpowiedzi operatora / urzędu na zgłoszenie.
CREATE TABLE report_replies (
    id           BIGSERIAL PRIMARY KEY,
    report_id    BIGINT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    author_label TEXT,
    body         TEXT   NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX report_replies_report_idx ON report_replies (report_id, created_at);

-- Seed taksonomii (identyczny z data/taxonomy.json).
INSERT INTO challenge_taxonomy (code, label_pl, description, sort_order) VALUES
    ('AGING', 'Starzenie się społeczeństwa', 'Rosnący udział osób starszych i związane z tym potrzeby w zakresie opieki, aktywności i wsparcia seniorów.', 10),
    ('MENTAL_HEALTH', 'Kryzys zdrowia psychicznego', 'Pogarszająca się kondycja psychiczna mieszkańców, w tym dzieci i młodzieży, oraz niewystarczająca dostępność wsparcia psychologicznego i psychiatrycznego.', 20),
    ('LONELINESS', 'Samotność i izolacja społeczna', 'Osamotnienie i brak kontaktów społecznych, szczególnie wśród osób starszych, z niepełnosprawnościami i mieszkających samotnie.', 30),
    ('DIGITAL_EXCLUSION', 'Wykluczenie cyfrowe', 'Brak umiejętności, sprzętu lub dostępu do internetu utrudniający korzystanie z e-usług, komunikacji i informacji.', 40),
    ('SERVICE_ACCESS', 'Ograniczony dostęp do usług społecznych', 'Trudności w dotarciu do usług opiekuńczych, zdrowotnych, transportowych i socjalnych, zwłaszcza na terenach wiejskich.', 50),
    ('COORDINATION', 'Brak koordynacji działań i współpracy międzysektorowej', 'Rozproszone działania instytucji publicznych, organizacji pozarządowych i biznesu oraz brak wymiany informacji między nimi.', 60),
    ('DEPOPULATION', 'Depopulacja obszarów regionu', 'Wyludnianie się gmin wskutek odpływu młodych mieszkańców i spadku liczby urodzeń, prowadzące do zanikania usług lokalnych.', 70),
    ('SUBURBAN_GROWTH', 'Gwałtowny wzrost ludności gmin okołokrakowskich', 'Szybki napływ mieszkańców do gmin wokół Krakowa, za którym nie nadąża infrastruktura społeczna, edukacyjna i komunikacyjna.', 80),
    ('OTHER', 'Poza taksonomią — do przeglądu przez operatora', 'Zgłoszenia, które nie pasują do żadnej z kategorii i wymagają ręcznej klasyfikacji przez operatora Hubu.', 999);
