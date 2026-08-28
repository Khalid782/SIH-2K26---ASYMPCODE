import React, { useState } from 'react';
import { 
  Sparkles, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  PlusCircle, 
  ArrowRight,
  RefreshCw,
  Info,
  Compass,
  FileText,
  Activity,
  Zap,
  LifeBuoy,
  Navigation,
  Cpu
} from 'lucide-react';
import { analyzeDisasterReportHybrid, TriageAnalysisResult } from '../utils/triageEngine';
import { Incident } from '../types';

interface AITriageConsoleProps {
  onCreateIncident: (incident: Incident) => void;
  onNavigateToSituationRoom: () => void;
}

const EXAMPLE_REPORTS = [
  {
    label: 'Hinglish Multi-Hazard Test',
    text: 'Bhai pls help!! since last night nonstop rain, pani almost 5ft ho gaya near Tolichowki flyover, Hyderabad. My uncle and 2 kids are stuck on first floor, ground floor completely underwater. Electricity is still ON and wires are touching water near the house. Rescue team pls come ASAP. Road from Mehdipatnam side also looks blocked.',
  },
  {
    label: 'Flood Trapped Example',
    text: 'Urgent help! A family is trapped inside their house near Mehdipatnam. Flood water is rising quickly.',
  },
  {
    label: 'Medical Emergency',
    text: 'Dialysis patient stranded at residence near Banjara Hills due to 3 feet water surrounding ground floor. Need urgent medical ambulance evacuation.',
  },
  {
    label: 'Infrastructure Collapse',
    text: 'Old heritage compound wall collapsed into narrow lane near Charminar due to intense flood water pressure. Road damaged.',
  },
];

export const AITriageConsole: React.FC<AITriageConsoleProps> = ({
  onCreateIncident,
  onNavigateToSituationRoom,
}) => {
  const [reportText, setReportText] = useState<string>(EXAMPLE_REPORTS[0].text);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<TriageAnalysisResult | null>(null);
  const [createdIncidentId, setCreatedIncidentId] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!reportText.trim()) return;

    setIsAnalyzing(true);
    setCreatedIncidentId(null);

    try {
      const result = await analyzeDisasterReportHybrid(reportText);
      setAnalysisResult(result);
    } catch (err) {
      console.error('Triage analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateIncident = () => {
    if (!analysisResult || !analysisResult.isRelevant) return;

    const newId = `INC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const formattedTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} IST`;

    const urgencyLevel = analysisResult.recommendedPriority === 'Immediate Response' 
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
      coordinates: analysisResult.coordinates,
      disasterType: analysisResult.disasterType,
      severity: analysisResult.severity,
      aiConfidence: analysisResult.aiConfidence,
      confidence: analysisResult.confidence || analysisResult.aiConfidence,
      locationConfidence: analysisResult.locationConfidence,
      detectedSignals: [...analysisResult.detectedSignals],
      hazards: analysisResult.hazards ? [...analysisResult.hazards] : [],
      responseNeeded: analysisResult.responseNeeded ? [...analysisResult.responseNeeded] : [],
      recommendedPriority: analysisResult.recommendedPriority,
      engineUsed: analysisResult.engineUsed,
      source: 'Citizen WhatsApp',
      timeAgo: 'Just now',
      timestamp: formattedTimestamp,
      originalReport: reportText.trim(),
      status: 'Pending',
      verificationStatus: 'Pending',
      entitiesExtracted: {
        urgency: urgencyLevel,
        peopleTrapped: analysisResult.extractedEntities.peopleTrapped,
        waterLevel: analysisResult.extractedEntities.waterLevel || (analysisResult.severity === 'Critical' ? '3.5 ft (Rapidly Rising)' : '2.0 ft'),
        affectedArea: analysisResult.primaryLocation || analysisResult.location,
      },
    };

    onCreateIncident(newIncident);
    setCreatedIncidentId(newId);
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return {
          badge: 'bg-red-600 text-white border-red-700',
          border: 'border-red-300 bg-red-50/50',
          text: 'text-red-700',
          icon: 'text-red-600',
        };
      case 'High':
        return {
          badge: 'bg-amber-500 text-white border-amber-600',
          border: 'border-amber-300 bg-amber-50/50',
          text: 'text-amber-700',
          icon: 'text-amber-600',
        };
      case 'Low':
      default:
        return {
          badge: 'bg-yellow-400 text-yellow-950 border-yellow-500',
          border: 'border-yellow-300 bg-yellow-50/50',
          text: 'text-yellow-700',
          icon: 'text-yellow-600',
        };
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Console Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-linear-to-l from-indigo-950/40 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                AI Triage Console
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-900 text-indigo-200 border border-indigo-700 uppercase">
                Hybrid AI + Rule Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              Parses unstructured multilingual citizen WhatsApp dispatches & crisis reports with semantic reasoning & GIS localization.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToSituationRoom}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Back to Situation Room</span>
            </button>
          </div>
        </div>

        {/* Engine Status Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            Hybrid Pipeline: <strong>Gemini 3.7 Flash</strong> with Automatic Rule-Based Deterministic Fallback
          </span>
          <span className="font-mono text-indigo-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            PRISM-HYBRID-v3.0
          </span>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label 
            htmlFor="raw-report-input" 
            className="text-sm font-bold text-slate-900 flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-slate-700" />
            Raw Incoming Report
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">
              Load Example:
            </span>
            {EXAMPLE_REPORTS.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => {
                  setReportText(example.text);
                  setAnalysisResult(null);
                  setCreatedIncidentId(null);
                }}
                className="px-2.5 py-1 rounded text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition cursor-pointer"
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            id="raw-report-input"
            rows={4}
            value={reportText}
            onChange={(e) => {
              setReportText(e.target.value);
              setAnalysisResult(null);
              setCreatedIncidentId(null);
            }}
            placeholder="Paste or enter an incoming disaster report (English, Hinglish, informal social media text)..."
            className="w-full p-3.5 text-sm rounded-lg border border-slate-300 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-normal"
          />
        </div>

        {/* Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="text-xs text-slate-500">
            Extracts primary location, access routes, hazards, response needed, severity, and GIS coordinates.
          </div>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !reportText.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs sm:text-sm shadow-sm transition cursor-pointer disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing report with Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Output Section */}
      {isAnalyzing && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center space-y-3 animate-pulse">
          <div className="inline-flex p-3 rounded-full bg-indigo-50 text-indigo-600">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Analyzing report...
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Reasoning spatial relations, distinguishing incident location from access routes, detecting physical hazards, and mapping GIS coordinates...
          </p>
        </div>
      )}

      {analysisResult && !isAnalyzing && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden divide-y divide-slate-200 animate-in fade-in slide-in-from-bottom-3 duration-300">
          
          {/* Result Banner Header */}
          <div className="p-4 sm:p-5 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${analysisResult.isRelevant ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                {analysisResult.isRelevant ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Relevant Disaster Report
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    analysisResult.isRelevant 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-600 text-white'
                  }`}>
                    {analysisResult.isRelevant ? 'Yes' : 'No'}
                  </span>

                  {/* Engine Indicator Badge */}
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                    analysisResult.engineUsed === 'Gemini AI'
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {analysisResult.engineUsed === 'Gemini AI' ? (
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <Cpu className="w-3 h-3 text-amber-600" />
                    )}
                    Analysis Engine: {analysisResult.engineUsed}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                  {analysisResult.isRelevant 
                    ? 'Structured Intelligence Generated Successfully' 
                    : 'Report Classified as Non-Emergency / Irrelevant'}
                </h3>
              </div>
            </div>

            {/* Confidence Metrics */}
            <div className="flex items-center gap-4 flex-wrap self-start md:self-auto">
              <div className="bg-white px-3.5 py-2 rounded-lg border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">
                  Overall Confidence
                </div>
                <div className="text-base font-bold text-indigo-600 font-mono">
                  {analysisResult.confidence ?? analysisResult.aiConfidence}%
                </div>
              </div>
              <div className="bg-white px-3.5 py-2 rounded-lg border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">
                  Spatial Confidence
                </div>
                <div className="text-base font-bold text-emerald-600 font-mono">
                  {analysisResult.locationConfidence}%
                </div>
              </div>
            </div>
          </div>

          {/* Structured Intelligence Grid */}
          <div className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Primary Location */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    Primary Incident Location
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {analysisResult.primaryLocation || analysisResult.location}
                  </div>
                  {analysisResult.secondaryLocations && analysisResult.secondaryLocations.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-600">
                      <Navigation className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Secondary / Access: <strong>{analysisResult.secondaryLocations.join(', ')}</strong></span>
                    </div>
                  )}
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Compass className="w-3 h-3" />
                    GIS Coordinates:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {analysisResult.coordinates[0].toFixed(4)}, {analysisResult.coordinates[1].toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Disaster Type & Response Needed */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    Disaster Type & Response
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-2 flex-wrap">
                    <span>{analysisResult.disasterType}</span>
                    {analysisResult.responseNeeded && analysisResult.responseNeeded.map((resp, i) => (
                      <span key={i} className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-semibold border border-indigo-200">
                        {resp}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
                  <span>Location Type:</span>
                  <span className={`font-semibold ${analysisResult.isKnownLocation ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {analysisResult.isKnownLocation ? 'Verified Zone Match' : 'Approximate Area'}
                  </span>
                </div>
              </div>

              {/* Severity & Urgency */}
              {(() => {
                const sevStyle = getSeverityStyle(analysisResult.severity);
                return (
                  <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${sevStyle.border}`}>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <AlertTriangle className={`w-3.5 h-3.5 ${sevStyle.icon}`} />
                        Severity & Urgency
                      </span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${sevStyle.badge}`}>
                          {analysisResult.severity}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          Priority: {analysisResult.recommendedPriority}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600">
                      Action Level: <strong className={sevStyle.text}>{analysisResult.recommendedPriority}</strong>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Identified Hazards Section */}
            {analysisResult.hazards && analysisResult.hazards.length > 0 && (
              <div className="p-3.5 rounded-lg bg-red-50/70 border border-red-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-900 flex items-center gap-1.5 mb-2">
                  <Zap className="w-3.5 h-3.5 text-red-600" />
                  Extracted Crisis Hazards:
                </span>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.hazards.map((hazard, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-red-200 text-red-900 shadow-2xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {hazard}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Detected Signals Box */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-2">
                Detected Signals & Operational Context:
              </span>
              <div className="flex flex-wrap gap-2">
                {analysisResult.detectedSignals.map((signal, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-800 shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    {signal}
                  </span>
                ))}
              </div>
            </div>

            {/* Operational Recommendation & Incident Dispatch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-indigo-50/60 border border-indigo-100">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <LifeBuoy className="w-3.5 h-3.5 text-indigo-600" />
                  Operational Recommendation (Human-in-the-Loop)
                </div>
                <div className="text-sm font-semibold text-slate-800 mt-0.5">
                  Action Level: <span className="font-bold text-indigo-700">{analysisResult.recommendedPriority}</span>
                  {analysisResult.extractedEntities.peopleTrapped && (
                    <span className="text-red-600 font-semibold ml-2">
                      ({analysisResult.extractedEntities.peopleTrapped} persons reported at risk)
                    </span>
                  )}
                  {analysisResult.extractedEntities.waterLevel && (
                    <span className="text-slate-600 font-medium ml-2">
                      &bull; Water: {analysisResult.extractedEntities.waterLevel}
                    </span>
                  )}
                </div>
              </div>

              {/* Create Incident Button */}
              {analysisResult.isRelevant && (
                <div>
                  {createdIncidentId ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-2 rounded-lg border border-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Incident {createdIncidentId} Created (Pending Verification)
                      </span>
                      <button
                        type="button"
                        onClick={onNavigateToSituationRoom}
                        className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
                      >
                        View in Situation Room &rarr;
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreateIncident}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Create Incident</span>
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
