export type Severity = 'Critical' | 'High' | 'Low';

export type DisasterType = 
  | 'Flood'
  | 'Medical Emergency'
  | 'Infrastructure Damage'
  | 'Rescue Required';

export type SourceType = 
  | 'Social Media'
  | 'Citizen WhatsApp'
  | 'Emergency Line (112)'
  | 'GHMC Control Room'
  | 'Field Volunteer'
  | 'Traffic Police Feed';

export type VerificationStatus = 
  | 'Pending'
  | 'Verified'
  | 'Actioned'
  | 'False Alarm'
  | 'Duplicate';

export interface Incident {
  id: string;
  location: string;
  extractedLocation?: string;
  primaryLocation?: string;
  secondaryLocations?: string[];
  landmark?: string;
  coordinates: [number, number]; // [lat, lng]
  disasterType: DisasterType;
  severity: Severity;
  aiConfidence: number; // 0-100%
  confidence?: number;
  locationConfidence?: number;
  detectedSignals?: string[];
  hazards?: string[];
  responseNeeded?: string[];
  recommendedPriority?: 'Immediate Response' | 'High Priority' | 'Monitor';
  engineUsed?: 'Gemini AI' | 'Rule-Based Fallback';
  source: SourceType;
  timeAgo: string;
  timestamp: string;
  originalReport: string;
  status: VerificationStatus;
  verificationStatus?: VerificationStatus;
  entitiesExtracted: {
    urgency: 'Immediate' | 'Elevated' | 'Monitoring';
    peopleTrapped?: number;
    waterLevel?: string;
    affectedArea?: string;
  };
  assignedTeam?: string;
  notes?: string[];
}

export interface FilterState {
  search: string;
  severity: 'All' | Severity;
  disasterType: 'All' | DisasterType;
  status: 'All' | VerificationStatus;
  timeWindow: '1h' | '6h' | '24h' | 'all';
}
