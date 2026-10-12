-- ============================================================
-- NGDC HOUSE DRAFT 2026 — MIGRATION 04: Platinum Members
-- NON-DESTRUCTIVE. Safe to run on an existing database.
-- Adds is_platinum column to candidates table to flag
-- the 5 submission members who skip the regular bidding.
-- ============================================================

-- Add is_platinum column to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS is_platinum BOOLEAN DEFAULT false;

-- Set is_platinum = true for the 5 submission candidates (cand-01 through cand-05)
-- This marks them as platinum members who will be bid on after non-platinum candidates
UPDATE candidates
SET is_platinum = true
WHERE id IN ('cand-01', 'cand-02', 'cand-03', 'cand-04', 'cand-05');

-- Verify the migration
-- SELECT id, is_platinum, status FROM candidates LIMIT 10;