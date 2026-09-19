import { Incident, Severity, DisasterType, SourceType, VerificationStatus } from '../types';

/**
 * Format a Date or ISO string as YYYY-MM-DD HH:mm:ss
 * Required by the fresh incidents table datetime columns.
 */
export function toSupabaseTimestamp(value?: string | Date | null): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Maps a snake_case Supabase row (fresh table) to a camelCase Incident.
 * Supports both:
 *  - New schema: latitude/longitude columns, flattened urgency/people_trapped/water_level/affected_area
 *  - Legacy schema: coordinates JSONB, entities_extracted JSONB, timestamp TEXT (backwards compat)
 */
export function mapRowToIncident(row: Record<string, any>): Incident {
  // Coordinates — prefer separate lat/lng, fall back to JSONB shapes
  let coordinates: [number, number];
  if (typeof row.latitude === 'number' && typeof row.longitude === 'number') {
    coordinates = [row.latitude, row.longitude];
  } else if (Array.isArray(row.coordinates)) {
    coordinates = [row.coordinates[0], row.coordinates[1]];
  } else if (row.coordinates && typeof row.coordinates === 'object') {
    coordinates = [row.coordinates.lat ?? row.coordinates[0] ?? 0, row.coordinates.lng ?? row.coordinates[1] ?? 0];
  } else {
    coordinates = [0, 0];
  }

  // Entities — prefer flattened columns, fall back to entities_extracted JSONB
  const rawEntities = row.entities_extracted ?? row.entitiesExtracted ?? {};
  const entitiesExtracted = {
    urgency: (row.urgency ?? rawEntities.urgency ?? 'Monitoring') as 'Immediate' | 'Elevated' | 'Monitoring',
    peopleTrapped: row.people_trapped ?? rawEntities.peopleTrapped ?? undefined,
    waterLevel: row.water_level ?? rawEntities.waterLevel ?? undefined,
    affectedArea: row.affected_area ?? rawEntities.affectedArea ?? undefined,
  };

  // Timestamp — prefer incident_timestamp, fall back to legacy timestamp/timeAgo
  const timestamp =
    row.incident_timestamp ?? row.timestamp ?? row.timeAgo ?? 'Just now';

  return {
    id: row.id,
    created_at: row.created_at,
    location: row.location,
    extractedLocation: row.extracted_location ?? row.extractedLocation,
    primaryLocation: row.primary_location ?? row.primaryLocation,
    secondaryLocations: row.secondary_locations ?? row.secondaryLocations,
    landmark: row.landmark,
    coordinates,
    disasterType: (row.disaster_type ?? row.disasterType ?? 'Flood') as DisasterType,
    severity: (row.severity ?? 'Low') as Severity,
    aiConfidence: row.ai_confidence ?? row.aiConfidence ?? 0,
    confidence: row.confidence,
    locationConfidence: row.location_confidence ?? row.locationConfidence,
    detectedSignals: row.detected_signals ?? row.detectedSignals,
    hazards: row.hazards,
    responseNeeded: row.response_needed ?? row.responseNeeded,
    recommendedPriority: row.recommended_priority ?? row.recommendedPriority,
    engineUsed: row.engine_used ?? row.engineUsed,
    source: (row.source ?? 'Social Media') as SourceType,
    timeAgo: row.time_ago ?? row.timeAgo ?? 'Just now',
    timestamp,
    originalReport: row.original_report ?? row.originalReport ?? '',
    cleanedReport: row.cleaned_report ?? row.cleanedReport,
    status: (row.status ?? 'Pending') as VerificationStatus,
    verificationStatus: row.verification_status ?? row.verificationStatus,
    entitiesExtracted,
    assignedTeam: row.assigned_team ?? row.assignedTeam,
    notes: row.notes,
    reportCount: (row.report_count ?? row.reportCount ?? 1) as number,
  };
}

export function mapRowsToIncidents(rows: Record<string, any>[]): Incident[] {
  return rows.map(mapRowToIncident);
}

/**
 * Converts a camelCase Incident into a snake_case row for Supabase INSERT.
 * - Datetimes are formatted as YYYY-MM-DD HH:mm:ss
 * - Coordinates are split into latitude/longitude
 * - entitiesExtracted is flattened into urgency/people_trapped/water_level/affected_area
 * - Headers use only underscores (no special characters)
 */
export function mapIncidentToRow(incident: Incident): Record<string, any> {
  return {
    id: incident.id,
    created_at: toSupabaseTimestamp(incident.created_at) ?? toSupabaseTimestamp(new Date()),
    incident_timestamp: toSupabaseTimestamp(incident.timestamp) ?? toSupabaseTimestamp(incident.created_at) ?? toSupabaseTimestamp(new Date()),
    location: incident.location,
    extracted_location: incident.extractedLocation ?? null,
    primary_location: incident.primaryLocation ?? null,
    secondary_locations: incident.secondaryLocations ?? [],
    landmark: incident.landmark ?? null,
    latitude: incident.coordinates?.[0] ?? 0,
    longitude: incident.coordinates?.[1] ?? 0,
    disaster_type: incident.disasterType,
    severity: incident.severity,
    source: incident.source,
    ai_confidence: incident.aiConfidence ?? 0,
    confidence: incident.confidence ?? null,
    location_confidence: incident.locationConfidence ?? null,
    detected_signals: incident.detectedSignals ?? [],
    engine_used: incident.engineUsed ?? null,
    hazards: incident.hazards ?? [],
    response_needed: incident.responseNeeded ?? [],
    recommended_priority: incident.recommendedPriority ?? null,
    time_ago: incident.timeAgo ?? 'Just now',
    original_report: incident.originalReport ?? '',
    cleaned_report: incident.cleanedReport ?? null,
    status: incident.status,
    verification_status: incident.verificationStatus ?? null,
    assigned_team: incident.assignedTeam ?? null,
    urgency: incident.entitiesExtracted?.urgency ?? 'Monitoring',
    people_trapped: incident.entitiesExtracted?.peopleTrapped ?? null,
    water_level: incident.entitiesExtracted?.waterLevel ?? null,
    affected_area: incident.entitiesExtracted?.affectedArea ?? null,
    notes: incident.notes ?? [],
    report_count: incident.reportCount ?? 1,
  };
}
