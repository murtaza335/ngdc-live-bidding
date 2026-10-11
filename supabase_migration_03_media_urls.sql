-- ============================================================
-- NGDC HOUSE DRAFT 2026 — MIGRATION 03: Multiple Media Files
-- NON-DESTRUCTIVE. Safe to run on an existing database.
-- Adds media_urls column to candidates table for storing
-- multiple media URLs (images, videos, pdfs).
-- ============================================================

-- Add media_urls column to candidates table (array of text URLs)
-- This allows each candidate to have multiple media files
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';

-- Update existing candidates: if media_url is set and media_urls is empty,
-- populate media_urls from the single media_url for backward compatibility
UPDATE candidates
SET media_urls = ARRAY[media_url]
WHERE media_urls IS NULL AND media_url IS NOT NULL AND media_url != '';

-- Verify the migration
-- SELECT id, media_type, media_url, media_urls FROM candidates LIMIT 5;