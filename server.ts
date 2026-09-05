import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '5mb' }));

// Lazy Google GenAI Client
let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

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

const triageResponseSchema = {
  type: Type.OBJECT,
  properties: {
    isRelevant: {
      type: Type.BOOLEAN,
      description: 'True if this is a genuine disaster, emergency, crisis, or flood incident report.',
    },
    primaryLocation: {
      type: Type.STRING,
      description: 'The specific primary location/landmark where the disaster or trapped victims are located in Hyderabad.',
    },
    secondaryLocations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Access routes, referenced neighborhoods, or nearby origin points mentioned.',
    },
    disasterType: {
      type: Type.STRING,
      enum: ['Flood', 'Medical Emergency', 'Infrastructure Damage', 'Rescue Required'],
      description: 'The underlying root disaster category.',
    },
    responseNeeded: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Tactical emergency response capabilities required (e.g. Rescue, Evacuation, Medical, Power Cut, Road Clearing).',
    },
    severity: {
      type: Type.STRING,
      enum: ['Critical', 'High', 'Low'],
      description: 'Crisis severity level.',
    },
    confidence: {
      type: Type.INTEGER,
      description: 'Overall analysis confidence score from 0 to 100.',
    },
    locationConfidence: {
      type: Type.INTEGER,
      description: 'Spatial location extraction confidence from 0 to 100.',
    },
    detectedSignals: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Key crisis signals detected from the text narrative.',
    },
    hazards: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Specific immediate physical hazards present (e.g. electrical wires touching water, trapped children, blocked road).',
    },
    recommendedPriority: {
      type: Type.STRING,
      enum: ['Immediate Response', 'High Priority', 'Monitor'],
      description: 'Operational priority recommendation.',
    },
    peopleAffected: {
      type: Type.INTEGER,
      description: 'Estimated number of people trapped, injured, or directly affected if mentioned, otherwise 0 or null.',
    },
    waterLevel: {
      type: Type.STRING,
      description: 'Mentioned flood water depth (e.g. "5 ft", "chest height") or null if not mentioned.',
    },
    cleanedReport: {
      type: Type.STRING,
      description: 'The raw citizen report rewritten into calm, clear, professional English (typos fixed, Hinglish translated, facts preserved). 2-4 sentences.',
    },
    coordinates: {
      type: Type.OBJECT,
      properties: {
        lat: { type: Type.NUMBER, description: 'Approximate latitude of primaryLocation in Hyderabad.' },
        lng: { type: Type.NUMBER, description: 'Approximate longitude of primaryLocation in Hyderabad.' },
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

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'CRISISBEACON Hybrid Disaster Triage' });
});

// Gemini AI Triage Endpoint
app.post('/api/triage', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ success: false, error: 'Report text is required' });
      return;
    }

    const ai = getGenAI();
    if (!ai) {
      res.status(503).json({
        success: false,
        error: 'Gemini API is not configured on server (GEMINI_API_KEY missing)',
        fallback: true,
      });
      return;
    }

    const candidateModels = ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-2.5-pro'];
    let lastError: any = null;
    let parsedData: any = null;
    let usedModel: string = candidateModels[0];

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              text: `Analyze this raw incoming disaster report and extract structured operational intelligence:\n\n"""\n${text.trim()}\n"""`,
            },
          ],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: triageResponseSchema,
            temperature: 0.1,
          },
        });

        const outputText = response.text;
        if (outputText) {
          parsedData = JSON.parse(outputText);
          usedModel = modelName;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} encountered temporary error (${err?.message || err}). Attempting next candidate...`);
      }
    }

    if (!parsedData) {
      console.warn('All Gemini candidate models failed or unavailable. Signaling client fallback.', lastError?.message || lastError);
      res.status(200).json({
        success: false,
        error: lastError?.message || 'Gemini service temporarily unavailable',
        fallback: true,
      });
      return;
    }

    res.json({
      success: true,
      engine: 'Gemini AI',
      model: usedModel,
      data: parsedData,
    });
  } catch (error: any) {
    console.warn('Gemini Triage Endpoint caught unexpected error:', error?.message || error);
    res.status(200).json({
      success: false,
      error: error?.message || 'Failed to analyze disaster report with Gemini',
      fallback: true,
    });
  }
});

async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const isProduction = process.env.NODE_ENV === 'production' || (!process.env.NODE_ENV && fs.existsSync(path.join(distPath, 'index.html')));

  if (!isProduction) {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('Vite middleware could not be started, falling back to static files:', err);
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CRISISBEACON Emergency Operations Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
