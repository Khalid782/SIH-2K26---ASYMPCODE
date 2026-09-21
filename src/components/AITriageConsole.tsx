import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  MapPin,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Radio,
  FileText,
  Zap,
} from 'lucide-react';
import { Incident, Severity } from '../types';
import {
  analyzeDisasterReport,
  translateHinglish,
  TriageAnalysisResult,
} from '../utils/triageEngine';

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
  engineUsed: 'Gemini AI' | 'Rule-Based Fallback';
  cleanedReport?: string;
  fallbackClean?: string;
  extractedEntities: {
    peopleTrapped: string;
    waterLevel: string;
  };
}

interface AITriageConsoleProps {
  onCreateIncident: (incident: Incident) => void;
  onNavigateToSituationRoom: () => void;
}

function mapGeminiResult(data: any): AnalysisResult {
  const coords =
    data.coordinates && typeof data.coordinates.lat === 'number'
      ? { lat: data.coordinates.lat, lng: data.coordinates.lng }
      : { lat: 17.4065, lng: 78.4482 };

  return {
    isRelevant: !!data.isRelevant,
    disasterType: data.disasterType || 'Unclassified',
    severity: (data.severity as Severity) || 'Low',
    primaryLocation: data.primaryLocation || 'Unknown location',
    location: data.primaryLocation || 'Unknown location',
    secondaryLocations: data.secondaryLocations || [],
    coordinates: coords,
    aiConfidence: data.confidence ?? 0,
    confidence: data.confidence ?? 0,
    locationConfidence: data.locationConfidence ?? 0,
    detectedSignals: data.detectedSignals || [],
    hazards: data.hazards || [],
    responseNeeded: data.responseNeeded || [],
    recommendedPriority: data.recommendedPriority || 'Monitor',
    engineUsed: 'Gemini AI',
    cleanedReport: data.cleanedReport || undefined,
    extractedEntities: {
      peopleTrapped: data.peopleAffected ? String(data.peopleAffected) : '',
      waterLevel: data.waterLevel || '',
    },
  };
}

function mapRuleBasedResult(text: string): AnalysisResult {
  const r: TriageAnalysisResult = analyzeDisasterReport(text);
  // English rendering of a code-mixed report, produced by the deterministic
  // engine so the console reads the same whether or not Gemini answered.
  const fallbackClean = translateHinglish(text);

  return {
    isRelevant: r.isRelevant,
    disasterType: r.disasterType,
    severity: r.severity,
    primaryLocation: r.primaryLocation,
    location: r.primaryLocation,
    secondaryLocations: r.secondaryLocations || [],
    coordinates: { lat: r.coordinates[0], lng: r.coordinates[1] },
    aiConfidence: r.aiConfidence,
    confidence: r.confidence ?? r.aiConfidence,
    locationConfidence: r.locationConfidence,
    detectedSignals: r.detectedSignals || [],
    hazards: r.hazards || [],
    responseNeeded: r.responseNeeded || [],
    recommendedPriority: r.recommendedPriority,
    engineUsed: 'Rule-Based Fallback',
    cleanedReport: r.cleanedReport || undefined,
    fallbackClean,
    extractedEntities: {
      peopleTrapped: r.extractedEntities.peopleTrapped
        ? String(r.extractedEntities.peopleTrapped)
        : '',
      waterLevel: r.extractedEntities.waterLevel || '',
    },
  };
}

export default function AITriageConsole({
  onCreateIncident,
  onNavigateToSituationRoom,
}: AITriageConsoleProps) {
  const [reportText, setReportText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [createdIncidentId, setCreatedIncidentId] = useState<string | null>(null);
  // Whether the server actually holds a Gemini key. Reported by /api/health so the console
  // states which engine is live instead of assuming Gemini.
  const [geminiStatus, setGeminiStatus] = useState<{ configured: boolean; models: string[] } | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.gemini) return;
        setGeminiStatus({
          configured: !!data.gemini.configured,
          models: Array.isArray(data.gemini.models) ? data.gemini.models : [],
        });
      })
      .catch(() => {
        if (!cancelled) setGeminiStatus({ configured: false, models: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const buildIncident = (result: AnalysisResult, rawText: string): Incident => {
    const newId = `INC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} IST`;

    const urgencyLevel =
      result.recommendedPriority === 'Immediate Response'
        ? 'Immediate'
        : result.recommendedPriority === 'High Priority'
          ? 'Elevated'
          : 'Monitoring';

    const peopleTrapped = parseInt(result.extractedEntities.peopleTrapped, 10);
    // Only report a depth the report actually stated — an invented water level is
    // worse than an empty field for everyone reading this row.
    const waterLevel = result.extractedEntities.waterLevel || undefined;

    return {
      id: newId,
      created_at: now.toISOString(),
      location: result.primaryLocation || result.location,
      extractedLocation: result.primaryLocation || result.location,
      primaryLocation: result.primaryLocation || result.location,
      secondaryLocations: result.secondaryLocations || [],
      landmark: `${(result.primaryLocation || result.location).split(',')[0]} Emergency Sector`,
      coordinates: [result.coordinates.lat, result.coordinates.lng],
      disasterType: result.disasterType as Incident['disasterType'],
      severity: result.severity,
      aiConfidence: result.aiConfidence,
      confidence: result.confidence || result.aiConfidence,
      locationConfidence: result.locationConfidence,
      detectedSignals: [...result.detectedSignals],
      hazards: result.hazards ? [...result.hazards] : [],
      responseNeeded: result.responseNeeded ? [...result.responseNeeded] : [],
      recommendedPriority: result.recommendedPriority,
      engineUsed: result.engineUsed === 'Rule-Based Fallback' ? 'Rule-Based Fallback' : 'Gemini AI',
      source: 'Citizen WhatsApp',
      timeAgo: 'Just now',
      timestamp: ts,
      originalReport: rawText.trim(),
      cleanedReport: result.cleanedReport,
      status: 'Pending',
      verificationStatus: 'Pending',
      entitiesExtracted: {
        urgency: urgencyLevel,
        peopleTrapped: peopleTrapped || undefined,
        waterLevel,
        affectedArea: result.primaryLocation || result.location,
      },
    };
  };

  const handleAnalyze = async () => {
    if (!reportText.trim()) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setCreatedIncidentId(null);

    try {
      let result: AnalysisResult;

      // 1) Call the server-side Gemini triage endpoint.
      //    Client-side 5s timeout — if AI is slow, the rule-based engine
      //    takes over immediately so the presentation never stalls.
      const clientController = new AbortController();
      const clientTimeout = setTimeout(() => clientController.abort(), 5_000);

      let res: Response;
      try {
        res = await fetch('/api/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: reportText.trim() }),
          signal: clientController.signal,
        });
      } catch {
        // Unreachable endpoint or our own 5s timeout: hand the report to the
        // deterministic engine instead of leaving the console with nothing.
        // This is a normal path, not an error state — the operator sees a
        // completed triage, never a "service unavailable" banner.
        res = new Response(JSON.stringify({ fallback: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } finally {
        clearTimeout(clientTimeout);
      }

      const payload = await res.json().catch(() => null);

      if (payload && payload.success && payload.data) {
        result = mapGeminiResult(payload.data);
      } else if ((payload && payload.fallback) || !payload || res.status >= 500) {
        // Gemini unconfigured, overloaded, unreachable or answering with a non-JSON
        // page: the deterministic engine takes over so the report is still triaged
        // and the incident still reaches the intelligence feed.
        result = mapRuleBasedResult(reportText.trim());
      } else {
        throw new Error(payload?.error || 'Triage service returned an unexpected response.');
      }

      // 2) Show the analysis result.
      setAnalysisResult(result);

      // 3) If relevant, auto-create the incident on the map + intelligence feed.
      //    Persistence is handled once, by the parent, through mapIncidentToRow().
      if (result.isRelevant) {
        const newIncident = buildIncident(result, reportText);
        onCreateIncident(newIncident);
        setCreatedIncidentId(newIncident.id);
      }
    } catch (err: any) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'Something went wrong while triaging this report. Please try again.';
      setAnalysisError(msg);
    } finally {
      setIsAnalyzing(false);
    }
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
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-signal/80"></span>
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink dark:text-paper">
          Triage Console
        </h2>
        <span className="text-[11px] text-ink dark:text-paper font-mono ml-auto">
          {geminiStatus === null ? (
            'Severity Engine • checking Gemini…'
          ) : geminiStatus.configured ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <Zap className="w-3 h-3" />
              Gemini live {geminiStatus.models[0] ? `• ${geminiStatus.models[0]}` : ''}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-mute dark:text-paper/60">
              <ShieldCheck className="w-3 h-3" />
              Rule-based engine
            </span>
          )}
        </span>
      </div>

      <div className="bg-paper/95 dark:bg-ink/90 border border-paper-2/90 dark:border-paper/25 rounded-xl p-4 space-y-3 shadow-[0_1px_2px_rgba(17,17,16,0.04),0_10px_24px_-18px_rgba(17,17,16,0.3)]">
        <label className="text-[11px] font-bold uppercase tracking-wider text-ink dark:text-paper">
          Raw Citizen Report
        </label>
        <textarea
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          placeholder='e.g. "pani ghar mein aa gaya, 2 log trapped hai near Gandhi Nagar bridge, please help urgent"'
          rows={4}
          disabled={isAnalyzing}
          className="w-full text-sm text-ink dark:text-paper border border-paper-2 dark:border-mute rounded-lg p-3 bg-paper-2/40 dark:bg-ink/50 placeholder:text-mute/70 dark:placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-mute/30 focus:border-mute resize-none disabled:bg-paper-2 dark:disabled:bg-paper"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleAnalyze}
            disabled={!reportText.trim() || isAnalyzing}
            className="inline-flex items-center gap-2 bg-mute text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-mute shadow-[0_4px_12px_-6px_rgba(17,17,16,0.6)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Run Triage'}
          </button>
          {(reportText || analysisResult) && !isAnalyzing && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink dark:text-paper hover:text-ink dark:hover:text-white px-2 py-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
        {analysisError && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl p-3">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{analysisError}</span>
          </div>
        )}
      </div>

      {analysisResult && (
        <div className="bg-paper/95 dark:bg-ink/90 border border-paper-2/90 dark:border-paper/25 rounded-xl p-4 space-y-4 shadow-[0_1px_2px_rgba(17,17,16,0.04),0_10px_24px_-18px_rgba(17,17,16,0.3)]">
          {!analysisResult.isRelevant ? (
            <div className="flex items-start gap-2 bg-paper-2/70 border border-paper-2 text-ink dark:text-paper text-sm rounded-lg p-3">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-ink dark:text-paper">
                  Not classified as a distress report
                </p>
                <p className="text-xs text-ink dark:text-paper mt-0.5">
                  The engine flagged this as noise, spam, or unrelated chatter. No incident will be
                  created.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${severityStyles[analysisResult.severity]}`}
                >
                  {analysisResult.severity}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-paper-2 text-ink dark:text-paper border border-paper-2">
                  {analysisResult.disasterType}
                </span>
                {analysisResult.engineUsed === 'Gemini AI' ? (
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Gemini AI
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 text-ink dark:text-paper border border-slate-200">
                    Rule-Based Fallback
                  </span>
                )}
                <span className="text-[11px] text-ink dark:text-paper ml-auto">
                  Engine confidence: <strong>{analysisResult.aiConfidence}%</strong>
                </span>
              </div>

              {(analysisResult.cleanedReport || analysisResult.fallbackClean) && (
                <div className="bg-gradient-to-br from-paper-2/80 to-white dark:from-paper-2/40 dark:to-paper/60 border border-paper-2 dark:border-mute rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-ink dark:text-paper" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-ink dark:text-paper">
                      {analysisResult.engineUsed === 'Gemini AI'
                        ? 'Cleaned by Gemini — readable version'
                        : 'Rule-based rewrite — readable dispatcher summary'}
                    </p>
                  </div>
                  <p className="text-sm text-ink dark:text-paper leading-relaxed">
                    {analysisResult.cleanedReport || analysisResult.fallbackClean || reportText.trim()}
                  </p>
                  {analysisResult.fallbackClean &&
                    analysisResult.fallbackClean.toLowerCase() !==
                      reportText.trim().toLowerCase() && (
                      <p className="text-xs text-ink dark:text-paper mt-1.5">
                        Citizen wording translated: &ldquo;{analysisResult.fallbackClean}&rdquo;
                      </p>
                    )}
                  <p className="text-[11px] text-ink dark:text-paper italic mt-1.5">
                    Original: &ldquo;{reportText.trim()}&rdquo;
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-ink dark:text-paper shrink-0 mt-0.5" />
                  <div>
                    <p className="text-ink dark:text-paper font-medium">
                      {analysisResult.primaryLocation}
                    </p>
                    <p className="text-[11px] text-ink dark:text-paper">
                      Location confidence: {analysisResult.locationConfidence}%
                      {analysisResult.coordinates &&
                        ` · ${analysisResult.coordinates.lat.toFixed(4)}, ${analysisResult.coordinates.lng.toFixed(4)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Radio className="w-4 h-4 text-ink dark:text-paper shrink-0 mt-0.5" />
                  <div>
                    <p className="text-ink dark:text-paper font-medium">
                      {analysisResult.recommendedPriority}
                    </p>
                    <p className="text-[11px] text-ink dark:text-paper">
                      Recommended response priority
                    </p>
                  </div>
                </div>
              </div>

              {analysisResult.detectedSignals.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink dark:text-paper mb-1.5">
                    Detected Signals
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.detectedSignals.map((signal, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-paper-2/80 text-paper-2 dark:bg-paper-2 dark:text-paper px-2 py-1 rounded-lg"
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.responseNeeded.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink dark:text-paper mb-1.5">
                    Response Resources Needed
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.responseNeeded.map((resource, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-paper-2 text-paper-2 dark:bg-paper-2 dark:text-paper px-2 py-1 rounded-lg border border-paper-2 dark:border-mute"
                      >
                        {resource}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {createdIncidentId && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700 rounded-md p-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>
                      {createdIncidentId} created &mdash; marked on the map (severity-colored) &amp;
                      added to the intelligence feed
                    </span>
                  </div>
                  <button
                    onClick={onNavigateToSituationRoom}
                    className="sm:ml-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 px-3 py-1.5 rounded-md border border-emerald-300 dark:border-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-colors"
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