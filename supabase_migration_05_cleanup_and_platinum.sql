-- ============================================================
-- NGDC HOUSE DRAFT 2026 — MIGRATION 05: Cleanup & Platinum Setup
-- NON-DESTRUCTIVE. Removes unused columns, ensures platinum flags.
-- ============================================================

-- 1. Ensure is_platinum column exists with default false
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS is_platinum BOOLEAN DEFAULT false;

-- 2. Set the 5 submission candidates as platinum (cand-01 through cand-05)
UPDATE candidates
SET is_platinum = true
WHERE id IN ('cand-01', 'cand-02', 'cand-03', 'cand-04', 'cand-05');

-- 3. Ensure all other candidates are NOT platinum
UPDATE candidates
SET is_platinum = false
WHERE is_platinum IS NULL AND id NOT IN ('cand-01', 'cand-02', 'cand-03', 'cand-04', 'cand-05');

-- 4. If score column still exists, remove it (keep only required cols)
-- Note: This is idempotent — runs only if score column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'score') THEN
    ALTER TABLE candidates DROP COLUMN score;
  END IF;
END $$;

-- 5. Verify final state
-- SELECT id, real_name, track, is_platinum, status, media_type, media_url FROM candidates ORDER BY id;