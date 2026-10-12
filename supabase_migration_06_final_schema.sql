-- ============================================================
-- NGDC HOUSE DRAFT 2026 — MIGRATION 06: Final Schema Cleanup
-- NON-DESTRUCTIVE. Safe to run on existing database.
-- Removes unused 'score' column, ensures is_platinum, updates schema
-- ============================================================

-- 1. Ensure is_platinum column exists with default false
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS is_platinum BOOLEAN DEFAULT false;

-- 2. Remove unused 'score' column if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'score') THEN
    ALTER TABLE candidates DROP COLUMN score;
  END IF;
END $$;

-- 3. Ensure all candidates have proper is_platinum values
-- The 6 platinum members (cand-01 through cand-06) - these are the team leads
UPDATE candidates
SET is_platinum = true
WHERE id IN ('cand-01', 'cand-02', 'cand-03', 'cand-04', 'cand-05', 'cand-06');

-- 4. Ensure all other candidates are NOT platinum
UPDATE candidates
SET is_platinum = false
WHERE is_platinum IS NULL OR (is_platinum IS NOT NULL AND id NOT IN ('cand-01', 'cand-02', 'cand-03', 'cand-04', 'cand-05', 'cand-06'));

-- 5. Add any missing columns for completeness
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS media_urls TEXT[];
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS contact TEXT;

-- 6. Verify final state
-- SELECT id, real_name, track, is_platinum, status, media_type, media_url, media_urls, pitch, anonymous_id, avatar_url, contact FROM candidates ORDER BY id;
-- SELECT * FROM houses;