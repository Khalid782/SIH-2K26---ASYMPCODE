-- ============================================================
-- 003 — Persist merged duplicate counts
-- ============================================================
-- Tasks 1–3 introduced reportCount so a second report on the same
-- (type, location, distance, window) merges instead of creating a new
-- row. That count was incremented only in React state and never
-- written to Supabase, so a page reload reset every incident to its
-- seeded value.
-- Run this in Supabase Dashboard → SQL Editor → Run.
-- ============================================================

ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 1
  CHECK (report_count >= 1);

-- Make existing rows explicit (some Postgres defaults only apply to
-- INSERT when the column is omitted, not to pre-existing NULLs).
UPDATE incidents SET report_count = 1 WHERE report_count IS NULL;

CREATE INDEX IF NOT EXISTS idx_incidents_report_count
  ON incidents (report_count DESC);
