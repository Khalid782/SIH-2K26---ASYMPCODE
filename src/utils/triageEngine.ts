import { DisasterType, Severity } from '../types';

export interface LocationMatch {
  name: string;
  fullName: string;
  coordinates: [number, number];
  aliases?: string[];
}

export const KNOWN_LOCATIONS: LocationMatch[] = [
  { 
    name: 'tolichowki', 
    fullName: 'Tolichowki Flyover, Hyderabad', 
    coordinates: [17.3986, 78.4069],
    aliases: ['tolichowki flyover', 'toli chowki', 'tolichowki x roads', 'tolichowki cross roads', 'shaikpet nala']
  },
  { 
    name: 'mehdipatnam', 
    fullName: 'Mehdipatnam, Hyderabad', 
    coordinates: [17.3916, 78.4411],
    aliases: ['mehdipatnam bus stand', 'mehdipatnam circle', 'pvnr expressway pillar', 'sarojini devi eye hospital']
  },
  { 
    name: 'banjara hills', 
    fullName: 'Banjara Hills, Hyderabad', 
    coordinates: [17.4156, 78.4350],
    aliases: ['banjara hills road no', 'road number 1', 'road number 12 banjara hills', 'kbr park']
  },
  { 
    name: 'jubilee hills', 
    fullName: 'Jubilee Hills, Hyderabad', 
    coordinates: [17.4319, 78.4073],
    aliases: ['jubilee check post', 'road no 36 jubilee hills', 'road no 45']
  },
  { 
    name: 'gachibowli', 
    fullName: 'Gachibowli, Hyderabad', 
    coordinates: [17.4401, 78.3489],
    aliases: ['gachibowli flyover', 'gachibowli stadium', 'outer ring road gachibowli', 'dlf road']
  },
  { 
    name: 'charminar', 
    fullName: 'Charminar, Hyderabad', 
    coordinates: [17.3616, 78.4747],
    aliases: ['charminar old city', 'laad bazaar', 'makkah masjid', 'nayapul', 'madina building']
  },
  { 
    name: 'secunderabad', 
    fullName: 'Secunderabad, Hyderabad', 
    coordinates: [17.4399, 78.4983],
    aliases: ['secunderabad station', 'paradise circle', 'clock tower secunderabad', 'patny circle']
  },
  { 
    name: 'hitech city', 
    fullName: 'Hitech City, Hyderabad', 
    coordinates: [17.4474, 78.3762],
    aliases: ['cyber towers', 'hitex', 'mindspace', 'hitech city road', 'inorbit mall']
  },
  { 
    name: 'madhapur', 
    fullName: 'Madhapur, Hyderabad', 
    coordinates: [17.4483, 78.3915],
    aliases: ['madhapur 100 feet road', 'durgam cheruvu', 'kavuri hills']
  },
  { 
    name: 'kukatpally', 
    fullName: 'Kukatpally, Hyderabad', 
    coordinates: [17.4938, 78.3995],
    aliases: ['kphb', 'kphb colony', 'jntu kukatpally', 'kukatpally ' + 'y junction']
  },
  { 
    name: 'malakpet', 
    fullName: 'Malakpet, Hyderabad', 
    coordinates: [17.3748, 78.4912],
    aliases: ['malakpet railway station', 'chaderghat', 'chaderghat bridge', 'race course']
  },
  { 
    name: 'moosarambagh', 
    fullName: 'Moosarambagh, Hyderabad', 
    coordinates: [17.3755, 78.5144],
    aliases: ['moosarambagh bridge', 'musi causeway', 'musi river bridge']
  },
  { 
    name: 'amberpet', 
    fullName: 'Amberpet, Hyderabad', 
    coordinates: [17.3870, 78.5190],
    aliases: ['amberpet causeway', 'amberpet flyover', 'ali cafe']
  },
  { 
    name: 'begumpet', 
    fullName: 'Begumpet, Hyderabad', 
    coordinates: [17.4448, 78.4682],
    aliases: ['begumpet flyover', 'prakash nagar', 'rasoolpura nala', 'begumpet airport']
  },
  { 
    name: 'dilsukhnagar', 
    fullName: 'Dilsukhnagar, Hyderabad', 
    coordinates: [17.3688, 78.5247],
    aliases: ['dilsukhnagar bus stand', 'gadiannaram', 'chaitanyapuri']
  },
  { 
    name: 'punjagutta', 
    fullName: 'Punjagutta, Hyderabad', 
    coordinates: [17.4264, 78.4513],
    aliases: ['punjagutta flyover', 'punjagutta circle', 'somajiguda']
  },
  { 
    name: 'attapur', 
    fullName: 'Attapur, Hyderabad', 
    coordinates: [17.3725, 78.4310],
    aliases: ['attapur pillar', 'hyderguda attapur', 'pvnr expressway attapur']
  },
  { 
    name: 'lakdikapul', 
    fullName: 'Lakdikapul, Hyderabad', 
    coordinates: [17.4042, 78.4646],
    aliases: ['lakdikapul railway bridge', 'khairatabad', 'red hills']
  },
  { 
    name: 'uppal', 
    fullName: 'Uppal, Hyderabad', 
    coordinates: [17.3984, 78.5583],
    aliases: ['uppal stadium', 'uppal ring road', 'ramanathapur']
  },
  { 
    name: 'lb nagar', 
    fullName: 'LB Nagar, Hyderabad', 
    coordinates: [17.3457, 78.5522],
    aliases: ['lb nagar ring road', 'kamineni', 'sagaring road']
  },
];

export interface TriageAnalysisResult {
  engineUsed: 'Gemini AI' | 'Rule-Based Fallback';
  isRelevant: boolean;
  location: string;
  primaryLocation: string;
  secondaryLocations: string[];
  isKnownLocation: boolean;
  locationConfidence: number;
  coordinates: [number, number];
  disasterType: DisasterType;
  responseNeeded: string[];
  severity: Severity;
  aiConfidence: number;
  confidence?: number;
  detectedSignals: string[];
  hazards: string[];
  recommendedPriority: 'Immediate Response' | 'High Priority' | 'Monitor';
  extractedEntities: {
    urgency: string;
    peopleTrapped?: number;
    waterLevel?: string;
    affectedArea?: string;
  };
}

/**
 * Geocode / match extracted location against known Hyderabad spatial zones
 */
export function matchHyderabadLocation(rawLoc: string): {
  fullName: string;
  coordinates: [number, number];
  isKnownLocation: boolean;
  confidence: number;
} {
  const lower = (rawLoc || '').toLowerCase().trim();
  if (!lower) {
    return {
      fullName: 'Hyderabad Central, Hyderabad',
      coordinates: [17.3850, 78.4867],
      isKnownLocation: false,
      confidence: 50,
    };
  }

  // Exact or alias match
  for (const loc of KNOWN_LOCATIONS) {
    if (lower.includes(loc.name)) {
      return {
        fullName: loc.fullName,
        coordinates: loc.coordinates,
        isKnownLocation: true,
        confidence: 94,
      };
    }
    if (loc.aliases) {
      for (const alias of loc.aliases) {
        if (lower.includes(alias) || alias.includes(lower)) {
          return {
            fullName: loc.fullName,
            coordinates: loc.coordinates,
            isKnownLocation: true,
            confidence: 92,
          };
        }
      }
    }
  }

  // Fallback to central Hyderabad with approximate marker
  const formatted = rawLoc.includes('Hyderabad') ? rawLoc : `${rawLoc}, Hyderabad`;
  return {
    fullName: formatted,
    coordinates: [17.3850, 78.4867],
    isKnownLocation: false,
    confidence: 65,
  };
}

/**
 * Deterministic Rule-Based Disaster Extraction Engine (Offline Fallback)
 */
export function analyzeDisasterReport(text: string): TriageAnalysisResult {
  const lower = text.toLowerCase();

  // 1. Detect Primary & Secondary Locations
  let matchedLocation = KNOWN_LOCATIONS.find((loc) => lower.includes(loc.name));
  const isKnownLocation = !!matchedLocation;
  const location = matchedLocation ? matchedLocation.fullName : 'Hyderabad Central, Hyderabad';
  const coordinates = matchedLocation ? matchedLocation.coordinates : [17.3850, 78.4867] as [number, number];

  // Secondary location check (e.g. "road from mehdipatnam" while incident is at tolichowki)
  const secondaryLocations: string[] = [];
  for (const loc of KNOWN_LOCATIONS) {
    if (matchedLocation && loc.name === matchedLocation.name) continue;
    if (lower.includes(loc.name)) {
      const isRoute = new RegExp(`(road from|route via|from|from side of)\\s+${loc.name}`).test(lower);
      if (isRoute || lower.includes(`from ${loc.name}`)) {
        secondaryLocations.push(loc.fullName.split(',')[0]);
      }
    }
  }

  // 2. Detect Signals & Hazards
  const detectedSignals: string[] = [];
  const hazards: string[] = [];
  const responseNeeded: string[] = [];

  // Trapped / Rescue Signals
  const hasTrapped = /trapped|stuck|stranded|marooned|roof|first floor|family is trapped|people trapped|elderly trapped|submerged house|kids are stuck|uncle and 2 kids/.test(lower);
  if (hasTrapped) {
    detectedSignals.push('trapped people');
    hazards.push('trapped occupants (upper floors / roof)');
    responseNeeded.push('Rescue');
  }

  // Rising water signals
  const hasRisingWater = /rising quickly|rising rapidly|rapid rise|water rising|water entering|chest height|waist height|5ft|5 feet|high force|ground floor completely underwater/.test(lower);
  if (hasRisingWater) {
    detectedSignals.push('rising water');
    hazards.push('rapidly rising flood water');
  }

  // Flooding signals
  const hasFlooding = /flood|flooded|water|pani|rain|overflow|inundated|nala overflow|waterlogging|submerged/.test(lower);
  if (hasFlooding) {
    detectedSignals.push('flooding');
    hazards.push('severe waterlogging / flooding');
  }

  // Electrical Hazard
  const hasElectricalFire = /live wire|short circuit|electric|electricity is still on|wires are touching water|fire|smoke|burning|sparking|current/.test(lower);
  if (hasElectricalFire) {
    detectedSignals.push('electrical hazard');
    hazards.push('electrical wires touching water (electrocution risk)');
    responseNeeded.push('Power Grid Disconnect');
  }

  // Blocked road hazard
  const hasBlockedRoad = /blocked|road blocked|jammed|tree fell|waterlogged road|inaccessible/.test(lower);
  if (hasBlockedRoad) {
    detectedSignals.push('blocked access road');
    hazards.push('blocked access route');
    responseNeeded.push('Route Clearance');
  }

  // Urgent rescue signals
  const hasUrgentRescue = /urgent help|urgent rescue|immediate rescue|save us|send boat|sos|immediate response|emergency rescue|rescue team pls come asap|madad|bachao/.test(lower);
  if (hasUrgentRescue) {
    detectedSignals.push('urgent rescue');
    if (!responseNeeded.includes('Rescue')) {
      responseNeeded.push('Rescue');
    }
  }

  // Medical signals
  const hasMedical = /injured|unconscious|ambulance|medical|hospital|dialysis|oxygen|bleeding|pregnant|casualty|patient/.test(lower);
  if (hasMedical) {
    detectedSignals.push('medical emergency');
    hazards.push('vulnerable patient / medical risk');
    responseNeeded.push('Medical Evacuation');
  }

  // Infrastructure collapse signals
  const hasInfrastructure = /collapsed|collapse|bridge|wall|building|road damaged|damage|culvert|tree fell|transformer|crater|toot gaya|gir gaya/.test(lower);
  if (hasInfrastructure) {
    detectedSignals.push('infrastructure collapse');
    hazards.push('structural collapse / road damage');
    responseNeeded.push('Structural Assessment');
  }

  // Submerged vehicles
  const hasVehicles = /car submerged|cars submerged|bus stalled|vehicle submerged|rickshaw submerged/.test(lower);
  if (hasVehicles) {
    detectedSignals.push('submerged vehicles');
    hazards.push('submerged vehicles');
  }

  // 3. Check Relevance
  const isRelevant = detectedSignals.length > 0 || /help|danger|disaster|emergency|sos|alert|pani|bachao/.test(lower);

  if (!isRelevant) {
    return {
      engineUsed: 'Rule-Based Fallback',
      isRelevant: false,
      location: isKnownLocation ? location : 'Unspecified Location',
      primaryLocation: isKnownLocation ? location : 'Unspecified Location',
      secondaryLocations: [],
      isKnownLocation,
      locationConfidence: 30,
      coordinates,
      disasterType: 'Flood',
      responseNeeded: ['Monitoring'],
      severity: 'Low',
      aiConfidence: 25,
      confidence: 25,
      detectedSignals: ['No disaster indicators detected in report narrative'],
      hazards: [],
      recommendedPriority: 'Monitor',
      extractedEntities: {
        urgency: 'Informational',
      },
    };
  }

  // 4. Determine Disaster Type
  let disasterType: DisasterType = 'Flood';
  if (hasMedical) {
    disasterType = 'Medical Emergency';
  } else if (hasTrapped && !hasFlooding && !hasInfrastructure) {
    disasterType = 'Rescue Required';
  } else if (hasInfrastructure && !hasFlooding) {
    disasterType = 'Infrastructure Damage';
  } else if (hasFlooding) {
    disasterType = 'Flood';
    if (!responseNeeded.includes('Rescue') && hasTrapped) {
      responseNeeded.unshift('Rescue');
    }
  } else {
    disasterType = 'Flood';
  }

  if (responseNeeded.length === 0) {
    responseNeeded.push(disasterType === 'Flood' ? 'Flood Relief' : 'Inspection');
  }

  // 5. Determine Severity
  let severity: Severity = 'Low';
  const isCritical = 
    (hasTrapped && (hasRisingWater || hasUrgentRescue || hasFlooding || hasElectricalFire)) ||
    lower.includes('unconscious') ||
    lower.includes('immediate life threat') ||
    (hasMedical && hasUrgentRescue) ||
    (hasInfrastructure && hasTrapped) ||
    lower.includes('family is trapped') ||
    lower.includes('dialysis');

  const isHigh = 
    hasRisingWater || 
    hasInfrastructure || 
    hasMedical || 
    hasVehicles || 
    hasTrapped || 
    lower.includes('significant') ||
    lower.includes('overflow') ||
    lower.includes('chest height') ||
    lower.includes('submerged');

  if (isCritical) {
    severity = 'Critical';
  } else if (isHigh) {
    severity = 'High';
  } else {
    severity = 'Low';
  }

  // 6. Recommended Priority
  let recommendedPriority: 'Immediate Response' | 'High Priority' | 'Monitor' = 'Monitor';
  if (severity === 'Critical') {
    recommendedPriority = 'Immediate Response';
  } else if (severity === 'High') {
    recommendedPriority = 'High Priority';
  } else {
    recommendedPriority = 'Monitor';
  }

  // 7. Calculate Confidence
  let baseScore = 78;
  if (isKnownLocation) baseScore += 6;
  baseScore += Math.min(10, detectedSignals.length * 3);
  if (isCritical) baseScore += 2;
  const aiConfidence = Math.min(94, Math.max(72, baseScore));

  // 8. Extract Entities
  let peopleTrapped: number | undefined;
  if (lower.includes('family')) peopleTrapped = 4;
  if (lower.includes('uncle and 2 kids') || lower.includes('uncle and two kids')) peopleTrapped = 3;
  const trappedMatch = lower.match(/(\d+)\s*(people|persons|residents|commuters|infants|members|kids|children)/);
  if (trappedMatch) {
    peopleTrapped = parseInt(trappedMatch[1], 10);
    if (lower.includes('uncle') || lower.includes('parents')) {
      peopleTrapped += 1;
    }
  }

  let waterLevel: string | undefined;
  const levelMatch = lower.match(/(\d+(\.\d+)?)\s*(feet|ft|meters|m)/);
  if (levelMatch) {
    waterLevel = `${levelMatch[1]} ft`;
  } else if (hasRisingWater) {
    waterLevel = 'Rapidly Rising (>3 ft)';
  }

  return {
    engineUsed: 'Rule-Based Fallback',
    isRelevant: true,
    location,
    primaryLocation: location,
    secondaryLocations,
    isKnownLocation,
    locationConfidence: isKnownLocation ? 90 : 55,
    coordinates,
    disasterType,
    responseNeeded,
    severity,
    aiConfidence,
    confidence: aiConfidence,
    detectedSignals,
    hazards,
    recommendedPriority,
    extractedEntities: {
      urgency: recommendedPriority,
      peopleTrapped,
      waterLevel,
      affectedArea: location,
    },
  };
}

/**
 * Hybrid Triage Analyzer:
 * 1. Calls server-side Gemini API (/api/triage)
 * 2. Matches coordinates against Hyderabad GIS catalog
 * 3. Falls back gracefully to rule-based analysis on any timeout/error
 */
export async function analyzeDisasterReportHybrid(text: string): Promise<TriageAnalysisResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return analyzeDisasterReport(text);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

    const response = await fetch('/api/triage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: trimmed }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Gemini API returned status ${response.status}. Engaging rule-based fallback.`);
      return analyzeDisasterReport(trimmed);
    }

    const payload = await response.json();
    if (!payload.success || !payload.data) {
      console.warn('Gemini triage payload missing data. Engaging rule-based fallback.', payload?.error);
      return analyzeDisasterReport(trimmed);
    }

    const geminiData = payload.data;

    // Geocode primary location against known Hyderabad spatial zones
    const primaryLoc = geminiData.primaryLocation || 'Hyderabad Central, Hyderabad';
    const geoMatch = matchHyderabadLocation(primaryLoc);

    const isRelevant = typeof geminiData.isRelevant === 'boolean' ? geminiData.isRelevant : true;
    const severity: Severity = ['Critical', 'High', 'Low'].includes(geminiData.severity) 
      ? geminiData.severity 
      : 'High';

    const disasterType: DisasterType = ['Flood', 'Medical Emergency', 'Infrastructure Damage', 'Rescue Required'].includes(geminiData.disasterType)
      ? geminiData.disasterType
      : 'Flood';

    const recommendedPriority: 'Immediate Response' | 'High Priority' | 'Monitor' = 
      ['Immediate Response', 'High Priority', 'Monitor'].includes(geminiData.recommendedPriority)
        ? geminiData.recommendedPriority
        : (severity === 'Critical' ? 'Immediate Response' : severity === 'High' ? 'High Priority' : 'Monitor');

    const confidence = typeof geminiData.confidence === 'number' 
      ? Math.max(10, Math.min(100, Math.round(geminiData.confidence))) 
      : 88;

    const locationConfidence = typeof geminiData.locationConfidence === 'number'
      ? Math.max(10, Math.min(100, Math.round(geminiData.locationConfidence)))
      : geoMatch.confidence;

    const detectedSignals: string[] = Array.isArray(geminiData.detectedSignals) && geminiData.detectedSignals.length > 0
      ? geminiData.detectedSignals
      : ['Disaster indicators parsed by AI'];

    const hazards: string[] = Array.isArray(geminiData.hazards) ? geminiData.hazards : [];
    const responseNeeded: string[] = Array.isArray(geminiData.responseNeeded) && geminiData.responseNeeded.length > 0
      ? geminiData.responseNeeded
      : [disasterType === 'Flood' ? 'Rescue & Water Discharge' : 'Emergency Response'];

    const secondaryLocations: string[] = Array.isArray(geminiData.secondaryLocations) 
      ? geminiData.secondaryLocations 
      : [];

    let peopleTrapped: number | undefined = undefined;
    if (typeof geminiData.peopleAffected === 'number' && geminiData.peopleAffected > 0) {
      peopleTrapped = geminiData.peopleAffected;
    }

    const waterLevel: string | undefined = typeof geminiData.waterLevel === 'string' && geminiData.waterLevel.trim()
      ? geminiData.waterLevel.trim()
      : undefined;

    return {
      engineUsed: 'Gemini AI',
      isRelevant,
      location: primaryLoc,
      primaryLocation: primaryLoc,
      secondaryLocations,
      isKnownLocation: geoMatch.isKnownLocation,
      locationConfidence,
      coordinates: geoMatch.coordinates,
      disasterType,
      responseNeeded,
      severity,
      aiConfidence: confidence,
      confidence,
      detectedSignals,
      hazards,
      recommendedPriority,
      extractedEntities: {
        urgency: recommendedPriority,
        peopleTrapped,
        waterLevel,
        affectedArea: primaryLoc,
      },
    };
  } catch (error) {
    console.warn('Gemini Triage request failed or timed out. Gracefully switching to rule-based fallback.', error);
    return analyzeDisasterReport(trimmed);
  }
}
