// ---------------------------------------------------------------------------
// DIAGNOSTIC: GET or POST /api/test-gemini
// Hit this from your browser: https://crisisbeacon.vercel.app/api/test-gemini
// It tells you exactly what's working and what's broken.
// ---------------------------------------------------------------------------

const SYSTEM_INSTRUCTION = `You are the CRISISBEACON AI Disaster Triage Engine for the Hyderabad Emergency Operations Center.
Your role is to analyze unstructured, informal, multilingual, code-mixed (Hinglish/English), social media, or citizen WhatsApp disaster reports and return structured operational disaster intelligence.

Guidelines:
1. RELEVANCE:
- Set isRelevant to true if the message describes an actual flood, waterlogging, medical crisis, structural collapse, rescue emergency, electrical hazard, or disaster in Hyderabad.
- Set to false if it is general chat, spam, unrelated question, generic advice, or non-emergency banter.

2. LOCATION REASONING (CRITICAL):
- Determine which location represents the ACTUAL INCIDENT LOCATION where victims or hazards are located (primaryLocation).
- Distinguish the incident location from reference, route, origin, or access locations (secondaryLocations).
- Pay close attention to contextual prepositions: "near", "at", "inside", "around" denote incident location; "from", "road from", "route via", "coming from" denote access routes or secondary locations.
- Example: "5ft water near Tolichowki flyover. Road from Mehdipatnam side blocked." -> primaryLocation: "Tolichowki Flyover, Hyderabad", secondaryLocations: ["Mehdipatnam"]. Do NOT make Mehdipatnam the primary location.
- Always include city context if identified (e.g., "Tolichowki Flyover, Hyderabad").

3. DISASTER TYPE vs RESPONSE NEEDED:
- disasterType must be one of: "Flood", "Medical Emergency", "Infrastructure Damage", "Rescue Required".
- If a flood is the underlying root disaster causing trapped people, disasterType is "Flood", and responseNeeded includes "Rescue".
- Only set disasterType to "Rescue Required" if there is no clear underlying disaster (like flood, earthquake, wall collapse) and rescue is the main event.
- If medical evacuation/ambulance/injury is the primary emergency, use "Medical Emergency".
- If collapsed walls/bridges/roads without primary flood is the crisis, use "Infrastructure Damage".

4. HAZARD EXTRACTION:
- Extract all explicit and strongly implied immediate physical hazards into the hazards array:
  e.g., "electrical wires touching water", "live wire in water", "trapped children", "trapped elderly", "ground floor submerged", "rapidly rising water", "blocked access road", "collapsed wall", "injured person", "submerged vehicles".
- Do NOT invent hazards not stated or directly implied.

5. CONFIDENCE SCORING:
- Reflect genuine uncertainty:
  - Clear location + clear specific emergency: 88-98%
  - Ambiguous location or slightly vague: 60-80%
  - Incomplete / sparse report: 40-70%
- locationConfidence should reflect how clear the primary location name and landmark are (e.g. 90-95 for specific flyover/area; 50-65 for vague references).

6. SEVERITY & PRIORITY:
- severity: "Critical" (direct life threat, trapped people with rising water/electricity, acute medical emergency), "High" (deep water, blocked major route, property damage), "Low" (minor waterlogging, monitoring).
- recommendedPriority: "Immediate Response" (critical life threat requiring instant dispatch), "High Priority" (urgent attention required), "Monitor" (routine/low risk).

7. HINGLISH & CODE-MIXED TRANSLATION:
- Understand words like "pani" (water), "atke hue / phanse hue" (stuck/trapped), "bachao / madad" (help/rescue), "bijli / current / tarein" (electricity/wires), "gir gaya / toot gaya" (collapsed/broken), "ghar" (house), "chhat" (roof), "rasta / sadak" (road), "pul" (bridge/flyover).

8. CLEANED REPORT (CRITICAL):
- Produce a "cleanedReport": rewrite the raw citizen message into calm, clear, professional English.
- Fix typos and grammar, translate Hinglish/code-mixed phrases, remove panic repetition and filler, and keep the exact facts (who, what, where, how many, how urgent).
- Write 2-4 complete sentences suitable for dispatchers and on-screen operators to read instantly.

9. COORDINATES:
- Provide approximate lat/lng coordinates for primaryLocation within Hyderabad, Telangana.
- Known reference points: Tolichowki [17.3986, 78.4069], Mehdipatnam [17.3916, 78.4411], Gachibowli [17.4401, 78.3489], Madhapur/Durgam Cheruvu [17.4483, 78.3915], Charminar [17.3616, 78.4747], Secunderabad [17.4399, 78.4983], Banjara Hills [17.4156, 78.4350], Kukatpally [17.4938, 78.3995], LB Nagar [17.3457, 78.5522], city center [17.4065, 78.4482].
- Use the closest known point for the named area; otherwise give your best estimate within Hyderabad (lat 17.30-17.55, lng 78.30-78.60).`;

const TriageSchema = {
  type: 'OBJECT',
  properties: {
    isRelevant: { type: 'BOOLEAN', description: 'True if genuine disaster report.' },
    primaryLocation: { type: 'STRING', description: 'Location in Hyderabad.' },
    secondaryLocations: { type: 'ARRAY', items: { type: 'STRING' } },
    disasterType: { type: 'STRING', enum: ['Flood', 'Medical Emergency', 'Infrastructure Damage', 'Rescue Required'] },
    responseNeeded: { type: 'ARRAY', items: { type: 'STRING' } },
    severity: { type: 'STRING', enum: ['Critical', 'High', 'Low'] },
    confidence: { type: 'INTEGER', description: '0-100' },
    locationConfidence: { type: 'INTEGER', description: '0-100' },
    detectedSignals: { type: 'ARRAY', items: { type: 'STRING' } },
    hazards: { type: 'ARRAY', items: { type: 'STRING' } },
    recommendedPriority: { type: 'STRING', enum: ['Immediate Response', 'High Priority', 'Monitor'] },
    peopleAffected: { type: 'INTEGER' },
    waterLevel: { type: 'STRING' },
    cleanedReport: { type: 'STRING', description: 'Clear English rewrite.' },
    coordinates: { type: 'OBJECT', properties: { lat: { type: 'NUMBER' }, lng: { type: 'NUMBER' } }, required: ['lat', 'lng'] },
  },
  required: ['isRelevant', 'primaryLocation', 'disasterType', 'severity', 'confidence', 'cleanedReport', 'coordinates'],
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), { status, headers: { 'Content-Type': 'application/json' } });
}

export default async function handler(req: Request): Promise<Response> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return json({ ok: false, stage: 'env', error: 'GEMINI_API_KEY is missing from the server environment.' });
    }

    // --- STEP 1: Quick ping (no schema, no system instruction) ---
    const pingStart = Date.now();
    let pingRes: any;
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'Say exactly: PING_OK' }] }] }),
          signal: AbortSignal.timeout(15000),
        }
      );
      const pingBody = await r.json();
      const pingText = pingBody?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      pingRes = { status: r.status, text: pingText.slice(0, 100), latencyMs: Date.now() - pingStart };

      if (pingText.includes('PING_OK')) {
        // Key + network OK
      } else {
        return json({ ok: false, stage: 'ping', message: 'Ping did not return expected text.', ping: pingRes, full: pingBody });
      }
    } catch (pingErr: any) {
      return json({ ok: false, stage: 'ping', error: pingErr?.name === 'TimeoutError' ? 'Ping timed out after 15s — network issue or unreachable from Vercel.' : pingErr?.message, latencyMs: Date.now() - pingStart });
    }

    // --- STEP 2: Full triage with schema ---
    const triageStart = Date.now();
    const reportText = (req.method === 'POST' ? await req.json().catch(() => ({})) : {})
      .text || 'pani ghar mein aa gaya 2 log trapped hai near gandhi nagar bridge please help urgent';

    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents: [{ parts: [{ text: `Analyze this report:\n\n"""\n${reportText}\n"""` }] }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json', responseSchema: TriageSchema },
          }),
          signal: AbortSignal.timeout(30000),
        }
      );
      const body = await r.json();
      const text = body?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const latencyMs = Date.now() - triageStart;
      let parsed: any = null;
      let parseError: string | null = null;
      try { parsed = JSON.parse(text); } catch (e: any) { parseError = e.message; }
      return json({
        ok: !!parsed,
        stage: 'triage',
        httpStatus: r.status,
        latencyMs,
        parsedData: parsed,
        parseError,
        rawText: text.slice(0, 500),
        models: body?.modelVersion,
      });
    } catch (triageErr: any) {
      return json({ ok: false, stage: 'triage', error: triageErr?.name === 'TimeoutError' ? 'Triage call timed out after 30s.' : triageErr?.message, latencyMs: Date.now() - triageStart });
    }
  } catch (err: any) {
    return json({ ok: false, stage: 'uncaught', error: err?.message || 'unknown' });
  }
}