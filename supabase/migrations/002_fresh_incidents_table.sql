-- ============================================================
-- FRESH INCIDENTS TABLE — Supabase SQL
-- Headers: only letters, numbers, hyphens (-) and underscores (_)
-- Datetime format: YYYY-MM-DD HH:mm:ss  (e.g. 2026-09-03 14:30:00)
-- ============================================================
-- Paste this entire file into Supabase Dashboard → SQL Editor → Run
-- It safely drops the old table and recreates a clean one.

-- Drop existing objects if they exist (fresh start)
DROP TABLE IF EXISTS incidents CASCADE;

DROP TYPE IF EXISTS severity_level CASCADE;
DROP TYPE IF EXISTS disaster_type CASCADE;
DROP TYPE IF EXISTS source_type CASCADE;
DROP TYPE IF EXISTS verification_status CASCADE;

-- Recreate enum types
CREATE TYPE severity_level AS ENUM ('Critical', 'High', 'Low');
CREATE TYPE disaster_type AS ENUM (
  'Flood',
  'Medical Emergency',
  'Infrastructure Damage',
  'Rescue Required'
);
CREATE TYPE source_type AS ENUM (
  'Social Media',
  'Citizen WhatsApp',
  'Emergency Line (112)',
  'GHMC Control Room',
  'Field Volunteer',
  'Traffic Police Feed'
);
CREATE TYPE verification_status AS ENUM (
  'Pending',
  'Verified',
  'Actioned',
  'False Alarm',
  'Duplicate'
);

-- ------------------------------------------------------------
-- Create fresh incidents table
-- All column names use only underscores (no special characters)
-- Datetime columns are TIMESTAMP and should be written as
--   YYYY-MM-DD HH:mm:ss  e.g. '2026-09-03 14:30:00'
-- ------------------------------------------------------------
CREATE TABLE incidents (
  -- Identity and time
  id                    TEXT PRIMARY KEY,
  created_at            TIMESTAMP NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP,
  updated_at            TIMESTAMP NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP,
  incident_timestamp    TIMESTAMP,

  -- Location
  location              TEXT NOT NULL,
  extracted_location    TEXT,
  primary_location      TEXT,
  secondary_locations   JSONB DEFAULT '[]'::JSONB,
  landmark              TEXT,
  latitude              DOUBLE PRECISION NOT NULL,
  longitude             DOUBLE PRECISION NOT NULL,

  -- Classification
  disaster_type         disaster_type NOT NULL DEFAULT 'Flood',
  severity              severity_level NOT NULL DEFAULT 'Low',
  source                source_type NOT NULL DEFAULT 'Social Media',

  -- AI analysis
  ai_confidence         INTEGER DEFAULT 0 CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
  confidence            NUMERIC(5,2),
  location_confidence   NUMERIC(5,2),
  detected_signals      JSONB DEFAULT '[]'::JSONB,
  engine_used           TEXT,

  -- Hazards and response
  hazards               JSONB DEFAULT '[]'::JSONB,
  response_needed       JSONB DEFAULT '[]'::JSONB,
  recommended_priority  TEXT,

  -- Reporting
  time_ago              TEXT DEFAULT 'Just now',
  original_report       TEXT DEFAULT '',
  cleaned_report        TEXT,

  -- Status workflow
  status                verification_status NOT NULL DEFAULT 'Pending',
  verification_status   verification_status,
  assigned_team         TEXT,

  -- Extracted entities (flattened for clean CSV import)
  urgency               TEXT DEFAULT 'Monitoring',
  people_trapped        INTEGER,
  water_level           TEXT,
  affected_area         TEXT,

  -- Notes
  notes                 JSONB DEFAULT '[]'::JSONB
);

-- Auto-update updated_at on every change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')::TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_incidents_updated_at ON incidents;
CREATE TRIGGER trg_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable realtime for live dashboard sync
ALTER PUBLICATION supabase_realtime ADD TABLE incidents;

-- Indexes
CREATE INDEX idx_incidents_created_at  ON incidents (created_at DESC);
CREATE INDEX idx_incidents_severity    ON incidents (severity);
CREATE INDEX idx_incidents_status      ON incidents (status);
CREATE INDEX idx_incidents_disaster_type ON incidents (disaster_type);
CREATE INDEX idx_incidents_location    ON incidents (location);

-- Row Level Security
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON incidents;
DROP POLICY IF EXISTS "Allow public insert" ON incidents;
DROP POLICY IF EXISTS "Allow public update" ON incidents;
DROP POLICY IF EXISTS "Allow public delete" ON incidents;

CREATE POLICY "Allow public read access"
  ON incidents FOR SELECT USING (true);

CREATE POLICY "Allow public insert"
  ON incidents FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update"
  ON incidents FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete"
  ON incidents FOR DELETE USING (true);

-- ------------------------------------------------------------
-- Sample seed rows (all datetimes in YYYY-MM-DD HH:mm:ss format)
-- ------------------------------------------------------------
INSERT INTO incidents (
  id, created_at, incident_timestamp,
  location, landmark, latitude, longitude,
  disaster_type, severity, source,
  ai_confidence, status,
  original_report, urgency, people_trapped, water_level, affected_area, assigned_team
) VALUES
(
  'INC-2026-081', '2026-09-03 08:58:12', '2026-09-03 08:58:12',
  'Mehdipatnam Hyderabad', 'Near Pillar 42 PVNR Expressway', 17.3916, 78.4411,
  'Flood', 'Critical', 'Social Media',
  94, 'Pending',
  'Water entering houses near Mehdipatnam Ground floor completely submerged family of 5 trapped',
  'Immediate', 5, '5.5 ft', 'Mehdipatnam Residential Block C', 'SDRF Alpha Unit'
),
(
  'INC-2026-082', '2026-09-03 08:54:30', '2026-09-03 08:54:30',
  'Tolichowki Hyderabad', 'Tolichowki Flyover Underpass', 17.3986, 78.4069,
  'Rescue Required', 'Critical', 'Citizen WhatsApp',
  92, 'Pending',
  'Underpass completely flooded 3 cars submerged 6 people on vehicle roofs',
  'Immediate', 6, '4.2 ft', 'Tolichowki Flyover Underpass', 'GHMC Disaster Response Force DRF-3'
),
(
  'INC-2026-083', '2026-09-03 08:48:15', '2026-09-03 08:48:15',
  'Charminar Hyderabad', 'Near Gulzar Houz', 17.3616, 78.4747,
  'Infrastructure Damage', 'High', 'Emergency Line (112)',
  89, 'Verified',
  'Heritage compound wall collapsed drainage backflow inundating shops',
  'Immediate', NULL, '3.5 ft', 'Gulzar Houz Market Lane', 'Fire and Emergency Rescue Squad'
);
