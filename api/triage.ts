// ---------------------------------------------------------------------------
// CRISISBEACON Vercel serverless function: POST /api/triage
// Self-contained, Node-18 safe, no cross-directory imports.
// Uses a simple prompt-based JSON output (no responseSchema) for speed and
// reliability — the schema may cause the API to hang in some environments.
// ---------------------------------------------------------------------------

const SYSTEM_INSTRUCTION = `You are the CRISISBEACON AI Disaster Triage Engine for the Hyderabad Emergency Operations Center.

Analyze the given citizen disaster report and return a single JSON object (no markdown, no commentary) with exactly these keys:

- isRelevant (boolean): true if this describes a real flood, medical emergency, rescue, fire, structural collapse, or disaster in Hyderabad. false for spam, jokes, or unrelated chatter.
- primaryLocation (string): The specific area/landmark in Hyderabad where the emergency is happening.
- secondaryLocations (string[]): Any other locations mentioned (access routes, origin points).
- disasterType (string): One of "Flood", "Medical Emergency", "Infrastructure Damage", "Rescue Required".
- responseNeeded (string[]): What resources are needed (e.g. "Rescue", "Medical", "Power Cut", "Route Clearance").
- severity (string): "Critical" (life threat/trapped), "High" (deep water/blocked route), or "Low" (minor).
- confidence (integer 0-100): How confident you are in the overall classification.
- locationConfidence (integer 0-100): How confident you are in the location extraction.
- detectedSignals (string[]): Key crisis phrases from the text.
- hazards (string[]): Immediate physical hazards mentioned.
- recommendedPriority (string): "Immediate Response", "High Priority", or "Monitor".
- peopleAffected (integer or null): Number of people trapped/affected.
- waterLevel (string or null): Flood depth if mentioned.
- cleanedReport (string): Rewrite the message in calm, clear English (2-4 sentences for dispatchers).
- coordinates: { lat: number, lng: number } — approximate location in Hyderabad.

If isRelevant is false, still fill in best-guess values for other fields.

HYDERABAD REFERENCE COORDINATES: Tolichowki [17.3986, 78.4069], Mehdipatnam [17.3916, 78.4411], Gachibowli [17.4401, 78.3489], Madhapur [17.4483, 78.3915], Charminar [17.3616, 78.4747], Secunderabad [17.4399, 78.4983], Banjara Hills [17.4156, 78.4350], Kukatpally [17.4938, 78.3995], LB Nagar [17.3457, 78.5522], City Center [17.4065, 78.4482].`;

const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro'];

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function callGemini(model: string, apiKey: string, reportText: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ parts: [{ text: reportText }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini ${model} HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty content.');
  return text;
}

export default async function handler(req: Request): Promise<Response> {
  const startTime = Date.now();

  try {
    if (req.method !== 'POST') {
      return json({ success: false, error: 'Method not allowed' }, 405);
    }

    let body: any;
    try { body = await req.json(); } catch {
      return json({ success: false, error: 'Invalid JSON body' }, 400);
    }

    const text = body?.text;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return json({ success: false, error: 'Report text is required' }, 400);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[triage] GEMINI_API_KEY missing');
      return json({ success: false, error: 'Gemini API not configured (GEMINI_API_KEY missing)', fallback: true }, 200);
    }

    console.log(`[triage] Starting triage, report length=${text.length}`);

    let lastError: any = null;
    let parsedData: any = null;
    let usedModel = CANDIDATE_MODELS[0];

    for (const model of CANDIDATE_MODELS) {
      try {
        const t0 = Date.now();
        console.log(`[triage] Calling ${model}...`);
        const rawText = await callGemini(model, apiKey, text.trim());
        console.log(`[triage] ${model} responded in ${Date.now() - t0}ms, text length=${rawText.length}`);

        // Strip markdown fences if present
        const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        parsedData = JSON.parse(cleaned);
        usedModel = model;
        console.log(`[triage] ${model} parsed OK, isRelevant=${parsedData.isRelevant}`);
        break;
      } catch (err: any) {
        lastError = err;
        console.error(`[triage] ${model} failed: ${err?.name} — ${err?.message}`);
      }
    }

    if (!parsedData) {
      console.error('[triage] All models failed:', lastError?.message);
      return json({ success: false, error: lastError?.message || 'All Gemini models failed', fallback: true, durationMs: Date.now() - startTime }, 200);
    }

    console.log(`[triage] Done in ${Date.now() - startTime}ms using ${usedModel}`);
    return json({ success: true, engine: 'Gemini AI', model: usedModel, data: parsedData }, 200);
  } catch (err: any) {
    console.error('[triage] Uncaught:', err?.message || err);
    return json({ success: false, error: `Server error: ${err?.message || 'unknown'}`, fallback: true, durationMs: Date.now() - startTime }, 200);
  }
}