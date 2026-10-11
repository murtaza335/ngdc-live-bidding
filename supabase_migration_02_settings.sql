-- ============================================================
-- NGDC HOUSE DRAFT 2026 — MIGRATION 02: Settings + Phase state
-- NON-DESTRUCTIVE. Safe to run on an existing database.
-- Does NOT drop or recreate any tables.
-- ============================================================

-- ============================================
-- 1. Ensure optional candidate columns exist
--    (needed for identity reveal + avatars)
-- ============================================
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS anonymous_id TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS contact TEXT;

-- ============================================
-- 2. Create the settings table (persisted UI state)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ============================================
-- 3. Enable Realtime for settings (guarded — skips if already added)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE settings;
  END IF;
END $$;

-- ============================================
-- 4. Row Level Security + public policies
-- ============================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on settings" ON settings;
CREATE POLICY "Allow public read access on settings"
  ON settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public upsert on settings" ON settings;
CREATE POLICY "Allow public upsert on settings"
  ON settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 5. Seed default phase (idempotent)
-- ============================================
INSERT INTO settings (key, value) VALUES ('phase', 'phase1')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 6. Backfill anonymous_id for existing candidates (if empty)
-- ============================================
UPDATE candidates
SET anonymous_id = 'CANDIDATE #' || LPAD(SUBSTRING(id FROM '[0-9]+$'), 2, '0')
WHERE anonymous_id IS NULL
  AND id ~ '[0-9]+$';

-- ============================================
-- 7. Verify
-- ============================================
-- SELECT * FROM settings;
-- SELECT id, anonymous_id, real_name, avatar_url, contact FROM candidates;
