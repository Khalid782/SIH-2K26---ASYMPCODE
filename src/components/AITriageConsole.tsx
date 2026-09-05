import React, { useState } from 'react';
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
import { supabase } from '../supabaseClient';
import { Incident, Severity } from '../types';
import { analyzeDisasterReport, TriageAnalysisResult } from '../utils/triageEngine';

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
  /** Lightly-normalized raw text used when the Gemini rewrite is unavailable. */
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

/**
 * Maps the server's /api/triage response (Gemini) into the console's
 * AnalysisResult shape.
 */
function mapGeminiResult(data: any): AnalysisResult {
  const coords = data.coordinates && typeof data.coordinates.lat === 'number'
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

/**
 * Maps the offline rule-based engine result (used when Gemini is unavailable).
 */
function mapRuleBasedResult(text: string): AnalysisResult {
  const r: TriageAnalysisResult = analyzeDisasterReport(text);
  const fallbackClean = text
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[a-z]/, (c) => c.toUpperCase());

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
    cleanedReport: undefined,
    extractedEntities: {
      peopleTrapped: r.extractedEntities.peopleTrapped
        ? String(r.extractedEntities.peopleTrapped)
        : '',
      waterLevel: r.extractedEntities.waterLevel || '',
    },
    // Keep the lightly-normalized raw text so dispatchers still get readable copy
    // even when the Gemini rewrite is unavailable.
    ...(fallbackClean ? { fallbackClean } : {}),
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

  const buildIncident = (result: AnalysisResult, rawText: string): Incident => {
    const newId = `INC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const formattedTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} IST`;

    const urgencyLevel =
      result.recommendedPriority === 'Immediate Response'
        ? 'Immediate'
        : result.recommendedPriority === 'High Priority'
          ? 'Elevated'
          : 'Monitoring';

    const peopleTrapped = parseInt(result.extractedEntities.peopleTrapped, 10);
    const waterLevel =
      result.extractedEntities.waterLevel ||
      (result.severity === 'Critical' ? '3.5 ft (Rapidly Rising)' : '2.0 ft');

    const newIncident: Incident = {
      id: newId,
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
      timestamp: formattedTimestamp,
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

    return newIncident;
  };

  const handleAnalyze = async () => {
    if (!reportText.trim()) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setCreatedIncidentId(null);

    try {
      let result: AnalysisResult;
      let serverFallback = false;

      // 1) Ask the server to run Gemini (API key stays server-side, never exposed).
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reportText.trim() }),
      });

      const payload = await res.json().catch(() => null);

      if (payload && payload.success && payload.data) {
        result = mapGeminiResult(payload.data);
      } else if (payload && payload.fallback) {
        // 2) Gemini not configured / temporarily unavailable -> rule-based fallback.
        serverFallback = true;
        result = mapRuleBasedResult(reportText.trim());
      } else if (!payload) {
        // 3) The response wasn't JSON at all — the /api/triage route is likely
        //    not deployed on this host (e.g. static hosting without the
        //    serverless function).
        throw new Error(
          'Triage endpoint did not return a JSON response (HTTP ' +
            res.status +
            '). On Vercel, make sure the api/triage serverless function is included in the deployment and GEMINI_API_KEY is set in your project environment variables.'
        );
      } else {
        throw new Error(payload?.error || 'Triage service returned an unexpected response.');
      }

      setAnalysisResult(result);

      // 3) Automatically mark the incident on the map (severity-colored marker)
      //    and push it into the intelligence feed.
      if (result.isRelevant) {
        const newIncident = buildIncident(result, reportText);
        onCreateIncident(newIncident);
        setCreatedIncidentId(newIncident.id);

        // Persist to Supabase when configured.
        if (supabase) {
          const { error } = await supabase.from('incidents').insert([newIncident]);
          if (error) {
            console.error('Error inserting incident into Supabase:', error);
          }
        }
      }

      if (serverFallback) {
        setAnalysisError(
          'Gemini is not configured on the server (GEMINI_API_KEY missing). Showing rule-based fallback analysis — add the key to enable AI rewriting.'
        );
      }
    } catch (err) {
      console.error('Error analyzing report:', err);
      setAnalysisError(
        err instanceof Error
          ? err.message
          : 'Analysis failed. Check the server connection and try again.'
      );
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
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-md p-3">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{analysisError}</span>
          </div>
        )}
      </div>

      {/* Analysis Result */}
      {analysisResult && (
        <div className="bg-white/95 dark:bg-sky-900/90 border border-sky-100/90 dark:border-sky-800 rounded-xl p-4 space-y-4 shadow-[0_1px_2px_rgba(8,47,73,0.04),0_10px_24px_-18px_rgba(2,132,199,0.3)]">
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
                {analysisResult.engineUsed === 'Gemini AI' ? (
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Gemini AI
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                    Rule-Based Fallback
                  </span>
                )}
                <span className="text-[11px] text-sky-600/80 ml-auto">
                  AI Confidence: <strong>{analysisResult.aiConfidence}%</strong>
                </span>
              </div>

              {/* Gemini cleaned rewrite of the panicky raw text */}
              {(analysisResult.cleanedReport || analysisResult.engineUsed === 'Rule-Based Fallback') && (
                <div className="bg-gradient-to-br from-sky-50/80 to-white dark:from-sky-800/40 dark:to-sky-900/60 border border-sky-100 dark:border-sky-700 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-500" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                      {analysisResult.engineUsed === 'Gemini AI'
                        ? 'Cleaned by Gemini — readable version'
                        : 'Normalized report (Gemini rewrite unavailable)'}
                    </p>
                  </div>
                  <p className="text-sm text-sky-950 dark:text-sky-100 leading-relaxed">
                    {analysisResult.cleanedReport || analysisResult.fallbackClean || reportText.trim()}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-sky-500 italic mt-1.5">
                    Original: &ldquo;{reportText.trim()}&rdquo;
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sky-950 dark:text-sky-100 font-medium">{analysisResult.primaryLocation}</p>
                    <p className="text-[11px] text-slate-500 dark:text-sky-400">
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
                    <p className="text-[11px] text-slate-500 dark:text-sky-400">Recommended response priority</p>
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
                        className="text-[11px] bg-sky-100/80 text-sky-800 dark:bg-sky-800 dark:text-sky-200 px-2 py-1 rounded-lg"
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
                        className="text-[11px] bg-sky-50 text-sky-800 dark:bg-sky-800 dark:text-sky-200 px-2 py-1 rounded-lg border border-sky-200 dark:border-sky-700"
                      >
                        {resource}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {createdIncidentId ? (
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
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}