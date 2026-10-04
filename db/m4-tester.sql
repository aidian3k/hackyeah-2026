-- Moduł 4 — Tester innowacji: zmiany tabel po feature-2026-10-04-6 (idempotentne, bez utraty danych).
-- Tabele M4 tworzy init.sql; ten plik migruje starsze bazy: jedno opcjonalne pole adresu zamiast
-- województwa/powiatu/gminy i opcjonalne uzasadnienie. Na świeżej bazie nic nie zmienia.

ALTER TABLE innovation_test_applications ADD COLUMN IF NOT EXISTS address TEXT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'innovation_test_applications' AND column_name = 'gmina'
    ) THEN
        UPDATE innovation_test_applications
        SET address = concat_ws(', ', nullif(trim(gmina), ''), nullif(trim(powiat), ''),
                                nullif(trim(wojewodztwo), ''))
        WHERE address IS NULL;
    END IF;
END $$;

ALTER TABLE innovation_test_applications DROP COLUMN IF EXISTS wojewodztwo;
ALTER TABLE innovation_test_applications DROP COLUMN IF EXISTS powiat;
ALTER TABLE innovation_test_applications DROP COLUMN IF EXISTS gmina;
ALTER TABLE innovation_test_applications ALTER COLUMN motivation DROP NOT NULL;
