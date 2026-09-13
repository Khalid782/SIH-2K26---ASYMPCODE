-- ============================================================
-- FRESH INCIDENTS TABLE — Supabase SQL
-- Headers: only letters, numbers, hyphens (-) and underscores (_)
-- Datetime format: YYYY-MM-DD HH:mm:ss  (e.g. 2026-09-03 14:30:00)
-- ============================================================
-- Paste this entire file into Supabase Dashboard → SQL Editor → Run
-- It safely drops the old table and recreates a clean one.
-- Seed set: exactly 30 curated incidents (INC-2026-081 → INC-2026-110)

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
-- Seed: exactly 30 incidents (mirrors src/data/mockData.ts)
-- ------------------------------------------------------------
INSERT INTO incidents (
  id, created_at, incident_timestamp,
  location, landmark, latitude, longitude,
  disaster_type, severity, source,
  ai_confidence, status,
  original_report, urgency, people_trapped, water_level, affected_area, assigned_team
) VALUES
('INC-2026-081', '2026-09-03 08:58:12', '2026-09-03 08:58:12', 'Mehdipatnam Hyderabad', 'Near Pillar 42 PVNR Expressway', 17.3916, 78.4411, 'Flood', 'Critical', 'Social Media', 94, 'Pending', 'Water entering houses near Mehdipatnam Ground floor completely submerged family of 5 trapped', 'Immediate', 5, '5.5 ft', 'Mehdipatnam Residential Block C', 'SDRF Alpha Unit'),
('INC-2026-082', '2026-09-03 08:54:30', '2026-09-03 08:54:30', 'Tolichowki Hyderabad', 'Tolichowki Flyover Underpass', 17.3986, 78.4069, 'Rescue Required', 'Critical', 'Citizen WhatsApp', 92, 'Pending', 'Underpass completely flooded 3 cars submerged 6 people on vehicle roofs', 'Immediate', 6, '4.2 ft', 'Tolichowki Flyover Underpass', 'GHMC Disaster Response Force DRF-3'),
('INC-2026-083', '2026-09-03 08:48:15', '2026-09-03 08:48:15', 'Charminar Hyderabad', 'Near Gulzar Houz', 17.3616, 78.4747, 'Infrastructure Damage', 'High', 'Emergency Line (112)', 89, 'Verified', 'Heritage compound wall collapsed drainage backflow inundating shops', 'Immediate', NULL, '3.5 ft', 'Gulzar Houz Market Lane', 'Fire and Emergency Rescue Squad'),
('INC-2026-084', '2026-09-03 08:45:00', '2026-09-03 08:45:00', 'Gachibowli Hyderabad', 'DLF Cybercity Junction', 17.4401, 78.3489, 'Infrastructure Damage', 'High', 'Traffic Police Feed', 88, 'Actioned', 'Heavy waterlogging near Gachibowli DLF junction IT corridor gridlock 11KV feeder tripped', 'Elevated', NULL, '2.8 ft', 'DLF Main Spine Road', 'TSSPDCL Electrical & GHMC Dewatering'),
('INC-2026-085', '2026-09-03 08:41:20', '2026-09-03 08:41:20', 'Banjara Hills Hyderabad', 'Road No. 12 near Pension Office', 17.4156, 78.4350, 'Medical Emergency', 'Critical', 'GHMC Control Room', 95, 'Pending', 'Dialysis patient stranded Road No. 12 oxygen cylinder running low boat evacuation requested', 'Immediate', 1, '3.2 ft', 'Road No. 12 Banjara Hills', 'Disaster Rapid Action Force #4 & EMRI 108'),
('INC-2026-086', '2026-09-03 08:36:10', '2026-09-03 08:36:10', 'Secunderabad Hyderabad', 'Railway Station Subway #2', 17.4399, 78.4983, 'Rescue Required', 'High', 'Field Volunteer', 86, 'Verified', 'Secunderabad station subway 2.5 feet water 14 commuters stranded on platforms', 'Elevated', 14, '2.5 ft', 'Station Subway Complex', 'Railway Protection & GHMC Pump Unit'),
('INC-2026-087', '2026-09-03 08:32:00', '2026-09-03 08:32:00', 'Moosarambagh Hyderabad', 'Musi River Causeway bridge', 17.3755, 78.5144, 'Flood', 'Critical', 'GHMC Control Room', 96, 'Actioned', 'Musi river overflowed danger mark Moosarambagh causeway slum inundated', 'Immediate', 35, '7.0 ft', 'Moosarambagh River Bank', 'NDRF 10th Battalion & SDRF Team 2'),
('INC-2026-088', '2026-09-03 08:28:45', '2026-09-03 08:28:45', 'Malakpet Hyderabad', 'Near Malakpet Railway Bridge', 17.3748, 78.4912, 'Flood', 'Critical', 'Social Media', 92, 'Verified', 'Flash flood Malakpet RUB 2 vans submerged basement filling rapidly', 'Immediate', NULL, '4.8 ft', 'Malakpet RUB & Surrounds', 'SDRF Water Rescue Team 1'),
('INC-2026-089', '2026-09-03 08:25:00', '2026-09-03 08:25:00', 'Banjara Hills Hyderabad', 'Road No. 1 Nagarjuna Circle', 17.4244, 78.4485, 'Infrastructure Damage', 'Low', 'Traffic Police Feed', 87, 'Actioned', '8 inches water at Nagarjuna Circle storm drains cleared', 'Monitoring', NULL, '0.7 ft', 'Nagarjuna Circle', NULL),
('INC-2026-090', '2026-09-03 08:19:15', '2026-09-03 08:19:15', 'Mehdipatnam Hyderabad', 'Rythu Bazar & Military Gate', 17.3888, 78.4355, 'Flood', 'High', 'Citizen WhatsApp', 84, 'Verified', 'Market vendors evacuated nala overflowed 2.2 feet water', 'Elevated', NULL, '2.2 ft', 'Mehdipatnam Rythu Bazar', NULL),
('INC-2026-091', '2026-09-03 08:15:00', '2026-09-03 08:15:00', 'Tolichowki Hyderabad', 'Paramount Hills & Brindavan Colony', 17.4045, 78.4112, 'Rescue Required', 'Critical', 'Emergency Line (112)', 93, 'Verified', 'Backflow Shah Hatim lake 12 elderly 4 infants need evacuation', 'Immediate', 16, '4.5 ft', 'Paramount Hills Low Zone', 'NDRF Evacuation Squad C'),
('INC-2026-092', '2026-09-03 08:10:00', '2026-09-03 08:10:00', 'Gachibowli Hyderabad', 'Near Wipro Circle', 17.4320, 78.3410, 'Flood', 'Low', 'Social Media', 81, 'Verified', 'Moderate waterlogging side lanes to ISB road', 'Monitoring', NULL, '0.9 ft', 'Wipro Circle Slip Road', NULL),
('INC-2026-093', '2026-09-03 08:06:30', '2026-09-03 08:06:30', 'Charminar Hyderabad', 'Near Laad Bazar', 17.3555, 78.4720, 'Medical Emergency', 'High', 'Field Volunteer', 90, 'Actioned', 'Pregnant woman in labor alley flooded stretcher transit needed', 'Immediate', 1, '2.5 ft', 'Shahalibanda Main Cross', NULL),
('INC-2026-094', '2026-09-03 08:02:10', '2026-09-03 08:02:10', 'Secunderabad Hyderabad', 'Paradise Circle & PG Road', 17.4445, 78.4870, 'Infrastructure Damage', 'High', 'GHMC Control Room', 89, 'Actioned', 'Signal control box short-circuited smoking cordon established', 'Elevated', NULL, '1.2 ft', 'Paradise Circle Signal Post', NULL),
('INC-2026-095', '2026-09-03 07:59:00', '2026-09-03 07:59:00', 'Amberpet Hyderabad', 'Near Ali Cafe nala', 17.3870, 78.5190, 'Flood', 'Critical', 'Emergency Line (112)', 95, 'Verified', 'Nala wall breached 4 houses chest height', 'Immediate', NULL, '4.6 ft', 'Amberpet Nala Belt', 'Disaster Quick Response Team 1'),
('INC-2026-096', '2026-09-03 07:54:10', '2026-09-03 07:54:10', 'Kukatpally Hyderabad', 'Y Junction & JNTU Road', 17.4938, 78.3995, 'Rescue Required', 'High', 'Traffic Police Feed', 83, 'Verified', 'Y Junction 2 RTC buses stalled 40 passengers on board', 'Elevated', 40, '2.6 ft', 'Kukatpally Y Junction', NULL),
('INC-2026-097', '2026-09-03 07:42:00', '2026-09-03 07:42:00', 'Secunderabad Hyderabad', 'Trimulgherry Lal Bazar', 17.4720, 78.5020, 'Flood', 'Low', 'Social Media', 79, 'Pending', 'Water at cantonment park gate passable with caution', 'Monitoring', NULL, '0.6 ft', 'Lal Bazar Road', NULL),
('INC-2026-098', '2026-09-03 07:30:00', '2026-09-03 07:30:00', 'Banjara Hills Hyderabad', 'Road No. 3 Sagar Society', 17.4200, 78.4380, 'Infrastructure Damage', 'High', 'Citizen WhatsApp', 87, 'Verified', 'Retaining wall cracked soil erosion mudslide', 'Elevated', NULL, NULL, 'Sagar Society Slopes', NULL),
('INC-2026-099', '2026-09-03 07:12:00', '2026-09-03 07:12:00', 'Gachibowli Hyderabad', 'Bio Diversity Junction ramp', 17.4380, 78.3650, 'Flood', 'Low', 'Traffic Police Feed', 85, 'Actioned', 'Minor ponding entry ramp dewatering pump clearing', 'Monitoring', NULL, '0.8 ft', 'Bio Diversity Flyover', NULL),
('INC-2026-100', '2026-09-03 07:00:00', '2026-09-03 07:00:00', 'Mehdipatnam Hyderabad', 'Rethi Bowli junction', 17.3820, 78.4380, 'Rescue Required', 'High', 'Field Volunteer', 91, 'Verified', 'Two-wheelers washed into storm grate riders rescued', 'Elevated', NULL, '2.0 ft', 'Rethi Bowli Junction', NULL),
('INC-2026-101', '2026-09-03 06:48:00', '2026-09-03 06:48:00', 'Tolichowki Hyderabad', 'Seven Tombs Road Nala', 17.3950, 78.3960, 'Flood', 'Low', 'Social Media', 82, 'Actioned', 'Water logging near tomb entrance silt traps cleared', 'Monitoring', NULL, '0.5 ft', 'Seven Tombs Approach', NULL),
('INC-2026-102', '2026-09-03 06:30:00', '2026-09-03 06:30:00', 'Charminar Hyderabad', 'Madina Building', 17.3680, 78.4730, 'Flood', 'Low', 'Citizen WhatsApp', 80, 'Verified', 'Water in front of shops Madina building sandbags placed', 'Monitoring', NULL, '1.0 ft', 'Madina Circle', NULL),
('INC-2026-103', '2026-09-03 06:12:00', '2026-09-03 06:12:00', 'Banjara Hills Hyderabad', 'Road No. 10 Star Hospital lane', 17.4180, 78.4410, 'Medical Emergency', 'Low', 'GHMC Control Room', 88, 'Actioned', 'Parking lot minor accumulation sump pumps operating', 'Monitoring', NULL, '0.4 ft', 'Road No. 10 Healthcare Corridor', NULL),
('INC-2026-104', '2026-09-03 06:00:00', '2026-09-03 06:00:00', 'Secunderabad Hyderabad', 'Marredpally Teachers Colony', 17.4520, 78.5100, 'Flood', 'Low', 'Social Media', 84, 'Pending', 'Internal street ankle water rainwater pits draining', 'Monitoring', NULL, '0.4 ft', 'Teachers Colony Main Lane', NULL),
('INC-2026-105', '2026-09-03 05:36:00', '2026-09-03 05:36:00', 'Gachibowli Hyderabad', 'Telecom Nagar nala culvert', 17.4450, 78.3580, 'Infrastructure Damage', 'High', 'Citizen WhatsApp', 86, 'Verified', 'Culvert clogged overflow into 8 parking cellars', 'Elevated', NULL, '2.1 ft', 'Telecom Nagar Sector 2', NULL),
('INC-2026-106', '2026-09-03 05:12:00', '2026-09-03 05:12:00', 'Mehdipatnam Hyderabad', 'Sarojini Devi Eye Hospital', 17.3960, 78.4460, 'Flood', 'Low', 'Emergency Line (112)', 85, 'Actioned', 'Gateway puddle cleared casualty entrance accessible', 'Monitoring', NULL, '0.3 ft', 'Hospital Outer Gate', NULL),
('INC-2026-107', '2026-09-03 05:00:00', '2026-09-03 05:00:00', 'Tolichowki Hyderabad', 'Samata Nagar lowlands', 17.4080, 78.4010, 'Flood', 'High', 'Field Volunteer', 90, 'Verified', 'Water rising ground floor food packets requested', 'Elevated', 12, '3.2 ft', 'Samata Nagar Lowlands', NULL),
('INC-2026-108', '2026-09-03 04:30:00', '2026-09-03 04:30:00', 'Charminar Hyderabad', 'Mir Alam Tank sluice gate', 17.3450, 78.4520, 'Flood', 'High', 'GHMC Control Room', 92, 'Actioned', 'Mir Alam tank FRL surplus discharge buffer canal', 'Elevated', NULL, '3.0 ft', 'Mir Alam Buffer Canal', NULL),
('INC-2026-109', '2026-09-03 04:10:00', '2026-09-03 04:10:00', 'HITEC City Hyderabad', 'Cyber Towers Junction', 17.4435, 78.3772, 'Infrastructure Damage', 'High', 'Traffic Police Feed', 88, 'Verified', 'Underpass pump failure 1.5 feet water traffic diverted', 'Elevated', NULL, '1.5 ft', 'Cyber Towers Service Road', NULL),
('INC-2026-110', '2026-09-03 03:55:00', '2026-09-03 03:55:00', 'Jubilee Hills Hyderabad', 'Road No. 36 Peddamma Temple', 17.4325, 78.4075, 'Flood', 'Low', 'Citizen WhatsApp', 83, 'Pending', '10 inches water Peddamma temple road no vehicle stall', 'Monitoring', NULL, '0.8 ft', 'Road No. 36 Temple Stretch', NULL);
