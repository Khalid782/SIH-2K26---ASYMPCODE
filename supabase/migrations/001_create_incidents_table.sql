-- ============================================================
-- Supabase SQL: Create the `incidents` table
-- Run this in your Supabase Dashboard → SQL Editor
-- ============================================================

-- Enum types for constrained columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'severity_level') THEN
    CREATE TYPE severity_level AS ENUM ('Critical', 'High', 'Low');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'disaster_type') THEN
    CREATE TYPE disaster_type AS ENUM (
      'Flood',
      'Medical Emergency',
      'Infrastructure Damage',
      'Rescue Required'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'source_type') THEN
    CREATE TYPE source_type AS ENUM (
      'Social Media',
      'Citizen WhatsApp',
      'Emergency Line (112)',
      'GHMC Control Room',
      'Field Volunteer',
      'Traffic Police Feed'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE verification_status AS ENUM (
      'Pending',
      'Verified',
      'Actioned',
      'False Alarm',
      'Duplicate'
    );
  END IF;
END $$;

-- Main incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id                TEXT PRIMARY KEY,
  created_at        TIMESTAMPTZ DEFAULT now(),

  -- Location fields
  location          TEXT NOT NULL,
  extracted_location TEXT,
  primary_location  TEXT,
  secondary_locations JSONB DEFAULT '[]'::jsonb,
  landmark          TEXT,
  coordinates       JSONB DEFAULT '[0, 0]'::jsonb,

  -- Incident classification
  disaster_type     disaster_type NOT NULL DEFAULT 'Flood',
  severity          severity_level NOT NULL DEFAULT 'Low',
  source            source_type NOT NULL DEFAULT 'Social Media',

  -- AI analysis
  ai_confidence     INTEGER DEFAULT 0 CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
  confidence        NUMERIC(5,2),
  location_confidence NUMERIC(5,2),
  detected_signals  JSONB DEFAULT '[]'::jsonb,
  engine_used       TEXT,

  -- Hazards & response
  hazards           JSONB DEFAULT '[]'::jsonb,
  response_needed   JSONB DEFAULT '[]'::jsonb,
  recommended_priority TEXT,

  -- Reporting
  time_ago          TEXT DEFAULT 'Just now',
  timestamp         TEXT,
  original_report   TEXT DEFAULT '',
  cleaned_report    TEXT,

  -- Status tracking
  status            verification_status NOT NULL DEFAULT 'Pending',
  verification_status verification_status,
  assigned_team     TEXT,

  -- Entities extracted by AI
  entities_extracted JSONB DEFAULT '{}'::jsonb,

  -- Notes
  notes             JSONB DEFAULT '[]'::jsonb
);

-- Enable real-time so the frontend receives INSERT/UPDATE broadcasts
ALTER PUBLICATION supabase_realtime ADD TABLE incidents;

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents (severity);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_disaster_type ON incidents (disaster_type);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Allow anon read access (dashboard viewing)
CREATE POLICY "Allow public read access"
  ON incidents FOR SELECT
  USING (true);

-- Allow anon insert (new incident reports from the frontend)
CREATE POLICY "Allow public insert"
  ON incidents FOR INSERT
  WITH CHECK (true);

-- Allow anon update (status changes by operators)
CREATE POLICY "Allow public update"
  ON incidents FOR UPDATE
  USING (true)
  WITH CHECK (true);
