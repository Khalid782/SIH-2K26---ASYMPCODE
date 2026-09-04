import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  MapPin,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Radio,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Incident, Severity } from '../types';

// ---------------------------------------------------------------------------
// NOTE ON TYPES: this file assumes your `types.ts` exports `Incident` and
// `Severity` shaped like the fields used below (id, location, severity,
// disasterType, status, verificationStatus, entitiesExtracted, etc. — as
// referenced in App.tsx / handleCreateIncident). If any field name here
// doesn't match your real `types.ts`, adjust the `AnalysisResult` mapping
// in `handleCreateIncident` to line up — the AI call and UI don't need to
// change.
// ---------------------------------------------------------------------------

interface AnalysisResult {
  isRelevant: boolean;
  disasterType: string;
  severity: Severity;
  primaryLocation: string;
  location: string;
  secondaryLocations: string[];
  coordinates: { lat: number; lng: number };
  aiConfidence: number;
  confidence: number;
  locationConfidence: number;
  detectedSignals: string[];
  hazards: string[];
  responseNeeded: string[];
  recommendedPriority: 'Immediate Response' | 'High Priority' | 'Monitor';
  engineUsed: string;
  extractedEntities: {
    peopleTrapped: string;
    waterLevel: string;
  };
}

interface AITriageConsoleProps {
  onCreateIncident: (incident: Incident) => void;
  onNavigateToSituationRoom: () => void;
}

// Gemini structured-output schema — forces the model to return exactly the
// shape AnalysisResult expects, so parsing never has to guess.
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isRelevant: { type: Type.BOOLEAN },
    disasterType: { type: Type.STRING },
    severity: { type: Type.STRING, enum: ['Critical', 'High', 'Low'] },
    primaryLocation: { type: Type.STRING },
    secondaryLocations: { type: Type.ARRAY, items: { type: Type.STRING } },
    coordinates: {
      type: Type.OBJECT,
      properties: {
        lat: { type: Type.NUMBER },
        lng: { type: Type.NUMBER },
      },
      required: ['lat', 'lng'],
    },
    aiConfidence: { type: Type.NUMBER },
    locationConfidence: { type: Type.NUMBER },
    detectedSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
    hazards: { type: Type.ARRAY, items: { type: Type.STRING } },
    responseNeeded: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendedPriority: {
      type: Type.STRING,
      enum: ['Immediate Response', 'High Priority', 'Monitor'],
    },
    peopleTrapped: { type: Type.STRING },
    waterLevel: { type: Type.STRING },
  },
  required: [
    'isRelevant',
    'disasterType',
    'severity',
    'primaryLocation',
    'coordinates',
    'aiConfidence',
    'locationConfidence',
    'detectedSignals',
    'recommendedPriority',
  ],
};

const SYSTEM_INSTRUCTION = `You are the Severity Engine + NER Parser for a disaster-response triage system.
Given a raw citizen report (social media post, SMS, or WhatsApp message — often informal, code-mixed
Hindi/English "Hinglish", or containing local vernacular), you must:

1. Decide if the report is a genuine, actionable disaster/distress report ("isRelevant": true) or
   noise — spam, jokes, unrelated chatter, ads ("isRelevant": false).
2. Classify the disaster type (e.g. "Flood", "Fire", "Building Collapse", "Medical Emergency",
   "Earthquake", "Cyclone", "Landslide", "Other").
3. Assign a severity tier: "Critical" (immediate life-threat / trapped victims), "High" (urgent
   resource/medical need without immediate mortality risk), or "Low" (general update / structural
   inquiry).
4. Extract the primary location mentioned (landmark, street, or area name) and any secondary
   locations. If the report is ambiguous (e.g. a landmark name that exists in multiple cities),
   assume it falls within Hyderabad, Telangana, India unless another city is explicitly named, and
   lower "locationConfidence" accordingly.
5. Provide approximate lat/lng coordinates for the primary location (best estimate for the
   Hyderabad region if no more specific data is available).
6. List detected signals (short phrases from the text that drove your classification), hazards
   present, and response resources needed (e.g. "Boat", "Ambulance", "Fire Tender").
7. Recommend a priority: "Immediate Response", "High Priority", or "Monitor".
8. Extract, if mentioned or reasonably inferable: number/description of people trapped, and water
   level (only relevant for flood-type reports — omit or leave empty otherwise).
9. Give an overall "aiConfidence" (0-100) for the classification and a separate
   "locationConfidence" (0-100) for the geocoding.

If the report is not a genuine disaster report, set "isRelevant" to false and still fill the other
fields with your best-effort guess (they will be ignored downstream).

Respond ONLY with JSON matching the provided schema — no prose, no markdown fences.`;

export default function AITriageConsole({
  onCreateIncident,
  onNavigateToSituationRoom,
}: AITriageConsoleProps) {
  const [reportText, setReportText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [createdIncidentId, setCreatedIncidentId] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!reportText.trim()) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setCreatedIncidentId(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error(
          'Missing VITE_GEMINI_API_KEY. Add it to your .env file and to your Vercel project environment variables.'
        );
      }

      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: reportText.trim(),
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      });

      const raw = response.text;
      if (!raw) throw new Error('Empty response from analysis engine.');

      const parsed = JSON.parse(raw);

      const result: AnalysisResult = {
        isRelevant: !!parsed.isRelevant,
        disasterType: parsed.disasterType || 'Unclassified',
        severity: (parsed.severity as Severity) || 'Low',
        primaryLocation: parsed.primaryLocation || 'Unknown location',
        location: parsed.primaryLocation || 'Unknown location',
        secondaryLocations: parsed.secondaryLocations || [],
        coordinates: parsed.coordinates || { lat: 17.385, lng: 78.4867 },
        aiConfidence: parsed.aiConfidence ?? 0,
        confidence: parsed.aiConfidence ?? 0,
        locationConfidence: parsed.locationConfidence ?? 0,
        detectedSignals: parsed.detectedSignals || [],
        hazards: parsed.hazards || [],
        responseNeeded: parsed.responseNeeded || [],
        recommendedPriority: parsed.recommendedPriority || 'Monitor',
        engineUsed: 'gemini-2.5-flash',
        extractedEntities: {
          peopleTrapped: parsed.peopleTrapped || '',
          waterLevel: parsed.waterLevel || '',
        },
      };

      setAnalysisResult(result);
    } catch (err) {
      console.error('Error analyzing report:', err);
      setAnalysisError(
        err instanceof Error
          ? err.message
          : 'Analysis failed. Check your connection and API key, then try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateIncident = async () => {
    if (!analysisResult || !analysisResult.isRelevant) return;

    const newId = `INC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const formattedTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} IST`;

    const urgencyLevel =
      analysisResult.recommendedPriority === 'Immediate Response'
        ? 'Immediate'
        : analysisResult.recommendedPriority === 'High Priority'
          ? 'Elevated'
          : 'Monitoring';

    const newIncident: Incident = {
      id: newId,
      location: analysisResult.primaryLocation || analysisResult.location,
      extractedLocation: analysisResult.primaryLocation || analysisResult.location,
      primaryLocation: analysisResult.primaryLocation || analysisResult.location,
      secondaryLocations: analysisResult.secondaryLocations || [],
      landmark: `${(analysisResult.primaryLocation || analysisResult.location).split(',')[0]} Emergency Sector`,
      coordinates: [analysisResult.coordinates.lat, analysisResult.coordinates.lng],
      disasterType: analysisResult.disasterType as Incident['disasterType'],
      severity: analysisResult.severity,
      aiConfidence: analysisResult.aiConfidence,
      confidence: analysisResult.confidence || analysisResult.aiConfidence,
      locationConfidence: analysisResult.locationConfidence,
      detectedSignals: [...analysisResult.detectedSignals],
      hazards: analysisResult.hazards ? [...analysisResult.hazards] : [],
      responseNeeded: analysisResult.responseNeeded ? [...analysisResult.responseNeeded] : [],
      recommendedPriority: analysisResult.recommendedPriority,
      engineUsed:
        analysisResult.engineUsed === 'Rule-Based Fallback' ? 'Rule-Based Fallback' : 'Gemini AI',
      source: 'Citizen WhatsApp',
      timeAgo: 'Just now',
      timestamp: formattedTimestamp,
      originalReport: reportText.trim(),
      status: 'Pending',
      verificationStatus: 'Pending',
      entitiesExtracted: {
        urgency: urgencyLevel,
        peopleTrapped:
          parseInt(analysisResult.extractedEntities.peopleTrapped, 10) || undefined,
        waterLevel:
          analysisResult.extractedEntities.waterLevel ||
          (analysisResult.severity === 'Critical' ? '3.5 ft (Rapidly Rising)' : '2.0 ft'),
        affectedArea: analysisResult.primaryLocation || analysisResult.location,
      },
    };

    // Save newly created incident into Supabase (when configured)
    if (supabase) {
      const { error } = await supabase.from('incidents').insert([newIncident]);

      if (error) {
        console.error('Error inserting incident into Supabase:', error);
      }
    }

    onCreateIncident(newIncident);
    setCreatedIncidentId(newId);
  };

  const handleReset = () => {
    setReportText('');
    setAnalysisResult(null);
    setAnalysisError(null);
    setCreatedIncidentId(null);
  };

  const severityStyles: Record<Severity, string> = {
    Critical: 'bg-red-50 text-red-700 border-red-200',
    High: 'bg-orange-50 text-orange-700 border-orange-200',
    Low: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-sm bg-sky-500"></span>
        <h2 className="text-xs font-bold uppercase tracking-wider text-sky-950 dark:text-sky-100">
          AI Triage Console
        </h2>
        <span className="text-[11px] text-sky-600/80 font-mono ml-auto">
          Severity Engine &bull; NER Parser &bull; Gemini 2.5 Flash
        </span>
      </div>

      {/* Input Card */}
      <div className="bg-white/95 dark:bg-sky-900/90 border border-sky-100/90 dark:border-sky-800 rounded-xl p-4 space-y-3 shadow-[0_1px_2px_rgba(8,47,73,0.04),0_10px_24px_-18px_rgba(2,132,199,0.3)]">
        <label className="text-[11px] font-bold uppercase tracking-wider text-sky-600/80">
          Raw Citizen Report
        </label>
        <textarea
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          placeholder='e.g. "pani ghar mein aa gaya, 2 log trapped hai near Gandhi Nagar bridge, please help urgent"'
          rows={4}
          disabled={isAnalyzing}
          className="w-full text-sm text-sky-950 dark:text-sky-100 border border-sky-200 dark:border-sky-700 rounded-lg p-3 bg-sky-50/40 dark:bg-sky-800/50 placeholder:text-sky-400/70 dark:placeholder:text-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 resize-none disabled:bg-sky-50 dark:disabled:bg-sky-900"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleAnalyze}
            disabled={!reportText.trim() || isAnalyzing}
            className="inline-flex items-center gap-2 bg-sky-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 shadow-[0_4px_12px_-6px_rgba(2,132,199,0.6)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Run AI Triage'}
          </button>
          {(reportText || analysisResult) && !isAnalyzing && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-900 px-2 py-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
        {analysisError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md p-3">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{analysisError}</span>
          </div>
        )}
      </div>

      {/* Analysis Result */}
      {analysisResult && (
        <div className="bg-white/95 border border-sky-100/90 rounded-xl p-4 space-y-4 shadow-[0_1px_2px_rgba(8,47,73,0.04),0_10px_24px_-18px_rgba(2,132,199,0.3)]">
          {!analysisResult.isRelevant ? (
            <div className="flex items-start gap-2 bg-sky-50/70 border border-sky-100 text-sky-700 text-sm rounded-lg p-3">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sky-950 dark:text-sky-100">Not classified as a distress report</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  The engine flagged this as noise, spam, or unrelated chatter. No incident will be
                  created.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${severityStyles[analysisResult.severity]}`}
                >
                  {analysisResult.severity}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg bg-sky-100 text-sky-800 border border-sky-200">
                  {analysisResult.disasterType}
                </span>
                <span className="text-[11px] text-sky-600/80 ml-auto">
                  AI Confidence: <strong>{analysisResult.aiConfidence}%</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sky-950 dark:text-sky-100 font-medium">{analysisResult.primaryLocation}</p>
                    <p className="text-[11px] text-slate-500">
                      Location confidence: {analysisResult.locationConfidence}%
                      {analysisResult.coordinates &&
                        ` · ${analysisResult.coordinates.lat.toFixed(4)}, ${analysisResult.coordinates.lng.toFixed(4)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Radio className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sky-950 dark:text-sky-100 font-medium">
                      {analysisResult.recommendedPriority}
                    </p>
                    <p className="text-[11px] text-slate-500">Recommended response priority</p>
                  </div>
                </div>
              </div>

              {analysisResult.detectedSignals.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600/80 mb-1.5">
                    Detected Signals
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.detectedSignals.map((signal, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-sky-100/80 text-sky-800 px-2 py-1 rounded-lg"
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.responseNeeded.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600/80 mb-1.5">
                    Response Resources Needed
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.responseNeeded.map((resource, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-sky-50 text-sky-800 px-2 py-1 rounded-lg border border-sky-200"
                      >
                        {resource}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!createdIncidentId ? (
                <button
                  onClick={handleCreateIncident}
                  className="w-full inline-flex items-center justify-center gap-2 bg-sky-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-sky-700 shadow-[0_6px_16px_-8px_rgba(2,132,199,0.6)] transition-colors"
                >
                  Create Incident in Situation Room
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-md p-3">
                  <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    Incident {createdIncidentId} created
                  </div>
                  <button
                    onClick={onNavigateToSituationRoom}
                    className="sm:ml-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 px-3 py-1.5 rounded-md border border-emerald-300 hover:bg-emerald-100 transition-colors"
                  >
                    View in Situation Room
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
