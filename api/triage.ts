// ---------------------------------------------------------------------------
// CRISISBEACON Vercel serverless function: POST /api/triage
//
// Self-contained on purpose: no imports from src/ and no Node-20-only APIs,
// so it runs on Vercel's default Node 18 runtime without bundling surprises.
// (Note: Response.json() static was added in Node 20 — avoid it here.)
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

// OpenAPI-style schema (uppercase type names as required by the Gemini REST API).
const triageResponseSchema = {
  type: 'OBJECT',
  properties: {
    isRelevant: {
      type: 'BOOLEAN',
      description: 'True if this is a genuine disaster, emergency, crisis, or flood incident report.',
    },
    primaryLocation: {
      type: 'STRING',
      description: 'The specific primary location/landmark where the disaster or trapped victims are located in Hyderabad.',
    },
    secondaryLocations: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Access routes, referenced neighborhoods, or nearby origin points mentioned.',
    },
    disasterType: {
      type: 'STRING',
      enum: ['Flood', 'Medical Emergency', 'Infrastructure Damage', 'Rescue Required'],
      description: 'The underlying root disaster category.',
    },
    responseNeeded: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Tactical emergency response capabilities required (e.g. Rescue, Evacuation, Medical, Power Cut, Road Clearing).',
    },
    severity: {
      type: 'STRING',
      enum: ['Critical', 'High', 'Low'],
      description: 'Crisis severity level.',
    },
    confidence: {
      type: 'INTEGER',
      description: 'Overall analysis confidence score from 0 to 100.',
    },
    locationConfidence: {
      type: 'INTEGER',
      description: 'Spatial location extraction confidence from 0 to 100.',
    },
    detectedSignals: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Key crisis signals detected from the text narrative.',
    },
    hazards: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Specific immediate physical hazards present (e.g. electrical wires touching water, trapped children, blocked road).',
    },
    recommendedPriority: {
      type: 'STRING',
      enum: ['Immediate Response', 'High Priority', 'Monitor'],
      description: 'Operational priority recommendation.',
    },
    peopleAffected: {
      type: 'INTEGER',
      description: 'Estimated number of people trapped, injured, or directly affected if mentioned, otherwise 0 or null.',
    },
    waterLevel: {
      type: 'STRING',
      description: 'Mentioned flood water depth (e.g. "5 ft", "chest height") or null if not mentioned.',
    },
    cleanedReport: {
      type: 'STRING',
      description: 'The raw citizen report rewritten into calm, clear, professional English (typos fixed, Hinglish translated, facts preserved). 2-4 sentences.',
    },
    coordinates: {
      type: 'OBJECT',
      properties: {
        lat: { type: 'NUMBER', description: 'Approximate latitude of primaryLocation in Hyderabad.' },
        lng: { type: 'NUMBER', description: 'Approximate longitude of primaryLocation in Hyderabad.' },
      },
      required: ['lat', 'lng'],
      description: 'Approximate lat/lng of the primary location within Hyderabad.',
    },
  },
  required: [
    'isRelevant',
    'primaryLocation',
    'secondaryLocations',
    'disasterType',
    'responseNeeded',
    'severity',
    'confidence',
    'locationConfidence',
    'detectedSignals',
    'hazards',
    'recommendedPriority',
    'cleanedReport',
    'coordinates',
  ],
};

const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-2.5-pro'];

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function callGeminiModel(model: string, apiKey: string, text: string): Promise<string | null> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
    `?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [
        {
          parts: [
            {
              text: `Analyze this raw incoming disaster report and extract structured operational intelligence:\n\n"""\n${text}\n"""`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: triageResponseSchema,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini ${model} returned HTTP ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const part = data?.candidates?.[0]?.content?.parts?.find(
    (p: any) => typeof p?.text === 'string'
  );
  return part?.text ?? null;
}

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
    }

    const text = body?.text;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return jsonResponse({ success: false, error: 'Report text is required' }, 400);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return jsonResponse(
        {
          success: false,
          error: 'Gemini API is not configured on server (GEMINI_API_KEY missing)',
          fallback: true,
        },
        200
      );
    }

    const trimmed = text.trim();
    let lastError: any = null;
    let parsedData: any = null;
    let usedModel: string = CANDIDATE_MODELS[0];

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const outputText = await callGeminiModel(modelName, apiKey, trimmed);
        if (!outputText) {
          lastError = new Error('Empty response from model');
          continue;
        }
        const cleaned = outputText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        parsedData = JSON.parse(cleaned);
        usedModel = modelName;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(
          `Model ${modelName} encountered error (${err?.message || err}). Attempting next candidate...`
        );
      }
    }

    if (!parsedData) {
      console.warn(
        'All Gemini candidate models failed or unavailable. Signaling client fallback.',
        lastError?.message || lastError
      );
      return jsonResponse(
        {
          success: false,
          error: lastError?.message || 'Gemini service temporarily unavailable',
          fallback: true,
        },
        200
      );
    }

    return jsonResponse(
      {
        success: true,
        engine: 'Gemini AI',
        model: usedModel,
        data: parsedData,
      },
      200
    );
  } catch (err: any) {
    console.error('api/triage uncaught error:', err?.message || err);
    return jsonResponse(
      {
        success: false,
        error: `Triage server error: ${err?.message || 'unknown error'}`,
        fallback: true,
      },
      200
    );
  }
}