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
  /** Dispatcher-ready English rewrite produced by the deterministic engine. */
  cleanedReport: string;
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
        if (lower.includes(alias)) {
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

/* ------------------------------------------------------------------ *
 * Report rewriting — the deterministic engine does the readable-English
 * work on its own, so a missing Gemini key or a Gemini outage never leaves
 * the console without cleaned, dispatcher-ready output.
 * ------------------------------------------------------------------ */

/** Code-mixed (Hinglish) wording → plain English, longest phrase first. */
const HINGLISH_PHRASES: [RegExp, string][] = [
  [/pani\s+(?:ghar|gharon)\s+(?:mein|me)\s+aa\s+gay[ai]/gi, 'water has entered the house'],
  [/(?:ghar|gharon)\s+(?:mein|me)\s+pani/gi, 'water inside the house'],
  [/(?:log|people)\s+trapped\s+hai?n?\b/gi, 'people are trapped'],
  [/(?:log|people)\s+phans[ae]\s+hue\s*(?:hain|hai)?/gi, 'people are trapped'],
  [/\btrapped\s+hai?n?\b/gi, 'are trapped'],
  [/\bphans[ae]\s*(?:hue|gay[ae])?\s*(?:hain|hai)?/gi, 'are trapped'],
  [/\bphas\b\s*(?:gay[ae])?\s*(?:hain|hai)?/gi, 'are trapped'],
  [/\batk[ae]\s*hue\s*(?:hain|hai)?/gi, 'are stuck'],
  [/\bbachao\b|\bbachaao\b|\bmadad\b|\bmadat\b/gi, 'help'],
  [/\blog\b/gi, 'people'],
  [/\bpani\b|\bpaani\b/gi, 'water'],
  [/\bgharon\b|\bghar\b/gi, 'house'],
  [/\bchhat\b/gi, 'roof'],
  [/\bkamre\b|\bkamra\b/gi, 'room'],
  [/\bsadak\b|\braasta\b|\brasta\b/gi, 'road'],
  [/\bnala\b/gi, 'stormwater drain'],
  [/\bbijli\b/gi, 'electricity'],
  [/\btarein\b|\btareen\b/gi, 'wires'],
  [/gir\s+gay[ai]|toot\s+gay[ai]/gi, 'collapsed'],
  [/\bandar\b/gi, 'inside'],
  [/\bjaldi\b/gi, 'quickly'],
  [/\bbahut\b/gi, 'very'],
  [/\bhumein\b|\bhamen\b|\bhumko\b/gi, 'we'],
  [/\bkijiye\b|\bkaro\b|\bkarna\b/gi, 'please'],
  [/\bmein\b/gi, 'in'],
  [/\bhai\b|\bhain\b/gi, 'is'],
  [/\bkoi\b/gi, 'someone'],
  [/\bplease\s+help\s+urgent\b/gi, 'urgent help requested'],
];

/**
 * Best-effort English rendering of a code-mixed citizen report. Used as the
 * normalized "citizen wording" line whenever Gemini is not available.
 */
export function translateHinglish(raw: string): string {
  let out = raw || '';
  for (const [pattern, replacement] of HINGLISH_PHRASES) out = out.replace(pattern, replacement);
  return out
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,;:!?])(?=\S)/g, '$1 ')
    .trim()
    .replace(/^([a-z])/, (c) => c.toUpperCase());
}

/**
 * Builds the dispatcher summary from the facts the engine actually extracted.
 * Nothing is stated here that was not present in the report.
 */
function buildCleanedReport(facts: {
  severity: Severity;
  disasterType: DisasterType;
  location: string;
  peopleTrapped?: number;
  waterLevel?: string;
  rising: boolean;
  secondaryLocations: string[];
  responseNeeded: string[];
}): string {
  const typeLabel: Record<DisasterType, string> = {
    Flood: 'flooding',
    'Medical Emergency': 'medical emergency',
    'Infrastructure Damage': 'infrastructure damage',
    'Rescue Required': 'rescue emergency',
  };
  const lead =
    facts.severity === 'Critical' ? 'Critical ' : facts.severity === 'High' ? 'Serious ' : '';
  const sentences = [`${lead}${typeLabel[facts.disasterType]} reported at ${facts.location}.`];

  const impact: string[] = [];
  if (facts.peopleTrapped) {
    impact.push(
      `${facts.peopleTrapped} ${facts.peopleTrapped === 1 ? 'person' : 'people'} reported trapped`
    );
  }
  // "Rising (depth not reported)" is a placeholder, not a measurement, so it is
  // described rather than quoted back as a depth.
  const depthUnreported = !!facts.waterLevel && /^rising/i.test(facts.waterLevel);
  if (facts.waterLevel && !depthUnreported) {
    impact.push(`water depth reported at ${facts.waterLevel}`);
  }
  if (facts.rising || depthUnreported) {
    impact.push(`water is reported to be rising${depthUnreported ? ' (depth not reported)' : ''}`);
  }
  if (impact.length) {
    const detail = impact.join(', ');
    sentences.push(`${detail.charAt(0).toUpperCase()}${detail.slice(1)}.`);
  }

  if (facts.secondaryLocations.length) {
    sentences.push(`Access via ${facts.secondaryLocations.join(' and ')} was also mentioned.`);
  }

  const resources = facts.responseNeeded.filter((r) => !/^monitoring$/i.test(r)).slice(0, 3);
  if (resources.length) sentences.push(`Requested response: ${resources.join(', ')}.`);

  if (sentences.length === 1) sentences.push('No further detail was provided in the report.');
  const summary = sentences.join(' ');
  return `${summary.charAt(0).toUpperCase()}${summary.slice(1)}`;
}

interface LocationMention {
  loc: LocationMatch;
  index: number;
  isRoute: boolean;
}

/**
 * Finds every locality named in the report, keeping one entry per locality and
 * remembering whether it was introduced as an access route ("road from X",
 * "coming from X") rather than as the incident site.
 */
/**
 * Signal detection runs on a copy of the report with negated claims removed, so
 * "no trapped people reported" cannot raise a rescue signal. Only the negation
 * and its keyword are removed, so "no water here, 3 people trapped above" still
 * keeps its trap signal.
 */
function stripNegatedClaims(lower: string): string {
  return lower.replace(
    /\b(?:no|not|without)\s+(?:any\s+)?(?:trapped|persons?|people|casualt\w*|injur\w*|flooding|flood|waterlogging|submerged|water)\b/g,
    ' '
  );
}

/**
 * Stated water depth normalised to feet. Returns null when the report never
 * stated a depth, so callers never escalate on an invented number.
 */
function parseDepthFeet(lower: string): number | null {
  const match = lower.match(/(\d+(?:\.\d+)?)\s*(feet|foot|ft|meters|meter|metres|metre|m|inches|inch)\b/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (!Number.isFinite(value)) return null;
  if (/^(?:feet|foot|ft)$/.test(match[2])) return value;
  if (/^in/.test(match[2])) return value / 12;
  return value * 3.28084;
}

function findLocationMentions(lower: string): LocationMention[] {
  const mentions = new Map<string, LocationMention>();

  for (const loc of KNOWN_LOCATIONS) {
    for (const name of [loc.name, ...(loc.aliases || [])]) {
      const index = lower.indexOf(name);
      if (index === -1) continue;
      const before = lower.slice(Math.max(0, index - 24), index);
      const isRoute = /(?:road|route|coming|traveling|travelling|via|from|towards|toward|side)\s+$/.test(before);
      const existing = mentions.get(loc.name);
      if (!existing || (existing.isRoute && !isRoute) || index < existing.index) {
        mentions.set(loc.name, { loc, index, isRoute });
      }
    }
  }

  return [...mentions.values()].sort(
    (a, b) => Number(a.isRoute) - Number(b.isRoute) || a.index - b.index
  );
}

/**
 * Deterministic Rule-Based Disaster Extraction Engine (Offline Fallback)
 */
export function analyzeDisasterReport(text: string): TriageAnalysisResult {
  const lower = text.toLowerCase();

  // 1. Detect Primary & Secondary Locations
  const mentions = findLocationMentions(lower);
  const primaryMention = mentions.find((m) => !m.isRoute);
  const matchedLocation = primaryMention?.loc;
  const isKnownLocation = !!matchedLocation;
  const location = matchedLocation ? matchedLocation.fullName : 'Hyderabad Central, Hyderabad';
  const coordinates = (matchedLocation ? matchedLocation.coordinates : [17.3850, 78.4867]) as [number, number];

  // Every other named locality (access routes, neighbouring areas) is secondary.
  const secondaryLocations = mentions
    .filter((m) => m !== primaryMention)
    .map((m) => m.loc.fullName.split(',')[0]);

  // 2. Detect Signals & Hazards
  const detectedSignals: string[] = [];
  const hazards: string[] = [];
  const responseNeeded: string[] = [];
  const signals = stripNegatedClaims(lower);

  // Trapped / Rescue Signals
  // "cars stuck" or "vehicles stranded" is a vehicle problem, not trapped
  // people, so those phrasings must not raise a rescue signal on their own.
  const hasTrapped = /trapped|marooned|phans\b|phas\b|atk[ae]\b|on (?:the )?roof|roof ?top|first floor|upper floor|(?:house|building|ground floor) (?:is )?submerged|need (?:a )?boat|(?<!vehicles?\s)(?<!cars?\s)(?<!buses?\s)(?<!autos?\s)stranded|(?:people|persons?|residents?|commuters?|kids?|children|family|uncle|aunty|elderly|infants?|members?|passengers?|occupants?|students?|workers?)\s+(?:are\s+|is\s+)?stuck/.test(signals);
  if (hasTrapped) {
    detectedSignals.push('trapped people');
    hazards.push('reported trapped occupants');
    responseNeeded.push('Rescue');
  }

  // Rising water signals
  const hasRisingWater = /rising (?:quickly|rapidly|fast|up)|rapid (?:rise|rising)|\bwater (?:is |level is |levels are )?rising|water (?:is )?entering|paani badh|pani badh|badh rah[ai]|chest height|waist height|chest deep|neck deep|ground floor (?:completely )?(?:underwater|submerged)/.test(signals);
  if (hasRisingWater) {
    detectedSignals.push('rising water');
    hazards.push('rapidly rising flood water');
  }

  // Flooding signals
  const hasFlooding = /flood(?:ed|ing|s)?|overflow(?:ed|ing)?|inundat|waterlog|submerged|under ?water|deluge|pani|paani|\bwater\b(?!\s*(?:supply|tanker|bottle|can|drinking|melon|proof))|(?:heavy|torrential|continuous|record) (?:rain|rains|showers)|cloudburst|downpour|nala (?:overflow|breach)|stormwater drain (?:overflow|breach)/.test(signals);
  if (hasFlooding) {
    detectedSignals.push('flooding');
    hazards.push('severe waterlogging / flooding');
  }

  // Electrical Hazard
  const hasElectricalFire = /live wire|wires? (?:are )?(?:in|touching|lying in) (?:the )?water|short ?circuit|electric(?:al)? (?:wire|shock|hazard|current)|electricity (?:is )?(?:still )?on|transformer (?:blast|fire|sparking)|sparking|electrocut|bijli|tarein|\bfire\b|blaze|smoke (?:coming|billowing|seen)|burning|caught fire/.test(signals);
  if (hasElectricalFire) {
    detectedSignals.push('electrical hazard');
    hazards.push('reported electrical or fire hazard');
    responseNeeded.push('Power Grid Disconnect');
  }

  // Blocked road hazard
  const hasBlockedRoad = /blocked|jammed|inaccessible|road (?:closed|washed away)|tree (?:fell|fallen|uprooted)|waterlogged road|route (?:closed|diverted)|traffic (?:diverted|halted)/.test(signals);
  if (hasBlockedRoad) {
    detectedSignals.push('blocked access road');
    hazards.push('blocked access route');
    responseNeeded.push('Route Clearance');
  }

  // Urgent rescue signals
  const hasUrgentRescue = /urgent help|urgent rescue|immediate rescue|save us|send boat|sos|immediate response|emergency rescue|rescue team pls come asap|madad|bachao/.test(signals);
  if (hasUrgentRescue) {
    detectedSignals.push('urgent rescue');
    if (!responseNeeded.includes('Rescue')) {
      responseNeeded.push('Rescue');
    }
  }

  // Medical signals
  const hasMedical = /injured|unconscious|ambulance|medical (?:emergency|help|attention|assistance)|dialysis|oxygen (?:cylinder|level|support|running low)|cannot breathe|not breathing|breathing (?:difficulty|problem)|bleeding|pregnant|labour|casualt|heart attack|stroke|patient (?:stranded|critical|trapped)/.test(signals);
  if (hasMedical) {
    detectedSignals.push('medical emergency');
    hazards.push('vulnerable patient / medical risk');
    responseNeeded.push('Medical Evacuation');
  }

  // Infrastructure collapse signals
  const hasInfrastructure = /collaps|(?:bridge|flyover|compound wall|wall|building|culvert) (?:caved|crash|gave way|washed away|damaged|breach(?:ed)?)|road (?:caved|damaged|washed away|broken)|tree (?:fell|fallen|uprooted)|transformer|crater|mudslide|landslide|soil erosion|crack(?:ed|ing) (?:wall|structure|building)|toot gaya|gir gaya/.test(signals);
  if (hasInfrastructure) {
    detectedSignals.push('infrastructure collapse');
    hazards.push('structural collapse / road damage');
    responseNeeded.push('Structural Assessment');
  }

  // Submerged vehicles
  const hasVehicles = /(?:car|bus|auto|vehicle|rickshaw|two-wheeler|bike)s? (?:stalled|submerged|washed|floating|trapped)|submerged (?:car|bus|vehicle|auto|rickshaw)s?/.test(signals);
  if (hasVehicles) {
    detectedSignals.push('submerged vehicles');
    hazards.push('submerged or stranded vehicles');
  }

  // 3. Check Relevance
  // An explicit denial or a promo must never become a mapped incident, while a
  // genuine SOS that names a locality still gets through even without keywords.
  const isExplicitNegation = /\bno (?:flood|flooding|water|waterlogging|emergency|pani)\b|not (?:flooding|a flood|an emergency)|false alarm|mock drill|just kidding|prank|for sale|buy now|discount|offer valid/.test(lower);
  const isRelevant =
    !isExplicitNegation && (detectedSignals.length > 0 || (hasUrgentRescue && isKnownLocation));

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
      cleanedReport: translateHinglish(text),
      recommendedPriority: 'Monitor',
      extractedEntities: {
        urgency: 'Informational',
      },
    };
  }

  // 4. Determine Disaster Type
  // The root event wins over its consequences: a collapse that injures people is
  // infrastructure damage needing medical support, not a standalone medical case,
  // and a flood that traps people is still a flood.
  let disasterType: DisasterType = 'Flood';
  if (hasTrapped && !hasFlooding && !hasInfrastructure && !hasMedical) {
    disasterType = 'Rescue Required';
  } else if (hasInfrastructure && !hasFlooding) {
    disasterType = 'Infrastructure Damage';
  } else if (hasMedical && !hasFlooding) {
    disasterType = 'Medical Emergency';
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

  const depthFeet = parseDepthFeet(lower);
  const isHigh =
    hasRisingWater ||
    hasInfrastructure ||
    hasMedical ||
    hasElectricalFire ||
    hasVehicles ||
    hasTrapped ||
    (depthFeet !== null && depthFeet >= 2) ||
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
  // Headcounts and depths are only reported when the citizen actually stated
  // them — the engine never invents a number a dispatcher could act on.
  let peopleTrapped: number | undefined;
  const countMatch = lower.match(
    /(\d+|one|two|three|four|five|six|seven|eight|nine|ten|dozen)\s*(?:log|people|persons?|residents?|commuters?|infants?|members?|kids?|children|passengers?|occupants?|families|senior citizens?|elderly)/
  );
  if (countMatch) {
    const wordNumbers: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10, dozen: 12,
    };
    const parsed = wordNumbers[countMatch[1]] ?? parseInt(countMatch[1], 10);
    if (Number.isFinite(parsed) && parsed > 0 && parsed <= 500) peopleTrapped = parsed;
  }
  const familyOf = lower.match(/family of (\d+)/);
  if (familyOf) {
    const parsed = parseInt(familyOf[1], 10);
    if (Number.isFinite(parsed) && parsed > 0) peopleTrapped = parsed;
  }

  let waterLevel: string | undefined;
  const levelMatch = lower.match(/(\d+(?:\.\d+)?)\s*(feet|foot|ft|meters|meter|metres|metre|m|inches|inch)\b/);
  if (levelMatch) {
    const unit = /^(?:feet|foot|ft)$/.test(levelMatch[2])
      ? 'ft'
      : /^(?:m|meters|meter|metres|metre)$/.test(levelMatch[2])
        ? 'm'
        : 'in';
    waterLevel = `${levelMatch[1]} ${unit}`;
  } else if (/chest (?:height|deep)|neck deep/.test(lower)) {
    waterLevel = 'Chest height (as reported)';
  } else if (hasRisingWater) {
    waterLevel = 'Rising (depth not reported)';
  }

  return {
    engineUsed: 'Rule-Based Fallback',
    isRelevant: true,
    location,
    primaryLocation: location,
    secondaryLocations,
    isKnownLocation,
    locationConfidence: isKnownLocation ? 90 : 45,
    coordinates,
    disasterType,
    responseNeeded,
    severity,
    aiConfidence,
    confidence: aiConfidence,
    detectedSignals,
    hazards,
    cleanedReport: buildCleanedReport({
      severity,
      disasterType,
      location,
      peopleTrapped,
      waterLevel,
      rising: hasRisingWater,
      secondaryLocations,
      responseNeeded,
    }),
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
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout — rule-based fallback kicks in fast

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
      // If the model skipped the rewrite, fall back to a deterministic English
      // rendering rather than leaving the console with nothing to display.
      cleanedReport:
        typeof geminiData.cleanedReport === 'string' && geminiData.cleanedReport.trim()
          ? geminiData.cleanedReport.trim()
          : translateHinglish(trimmed),
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
