import React from 'react';
import { createPortal } from 'react-dom';
import { Incident, VerificationStatus } from '../types';
import { 
  X, 
  MapPin, 
  Sparkles, 
  Clock, 
  Radio, 
  ShieldAlert, 
  CheckCircle2, 
  CheckCheck, 
  AlertOctagon, 
  Copy, 
  FileText,
  Users,
  Compass,
  Layers,
  Activity,
  AlertTriangle,
  Info,
  Zap
} from 'lucide-react';

interface IncidentDetailModalProps {
  incident: Incident | null;
  onClose: () => void;
  onUpdateStatus: (incidentId: string, newStatus: VerificationStatus) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onUpdateStatus,
}) => {
  if (!incident) return null;

  const getSeverityStyle = (severity: Incident['severity']) => {
    switch (severity) {
      case 'Critical':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-300',
          badge: 'bg-red-600 text-white',
        };
      case 'High':
        return {
          bg: 'bg-orange-50',
          text: 'text-orange-700',
          border: 'border-orange-300',
          badge: 'bg-orange-500 text-white',
        };
      case 'Low':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          border: 'border-amber-300',
          badge: 'bg-amber-500 text-white',
        };
    }
  };

  const sevStyle = getSeverityStyle(incident.severity);

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-sky-950/95 backdrop-blur-xl">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-[0_30px_80px_-30px_rgba(2,132,199,0.55)] border border-sky-200/80 overflow-hidden flex flex-col max-h-[90vh] animate-modal-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-50 via-white to-sky-100/80 text-sky-950 flex items-center justify-between border-b border-sky-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white border border-sky-200 text-sky-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_10px_-5px_rgba(2,132,199,0.35)]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-sky-500">
                  {incident.id}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${sevStyle.badge}`}>
                  {incident.severity}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-sky-100/80 text-sky-800 border border-sky-200">
                  {incident.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-sky-950 tracking-tight mt-0.5">
                Incident Operations Details
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-sky-500 hover:text-sky-900 hover:bg-sky-100 transition cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-sky-900/80 leading-relaxed">
          
          {/* Section 1: Original Ingested Report */}
          <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100">
            <div className="flex items-center justify-between text-slate-500 font-semibold mb-1.5">
              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-sky-950 font-bold">
                <FileText className="w-3.5 h-3.5 text-slate-700" />
                Original Report
              </span>
              <span className="font-mono text-[11px] text-sky-600/80 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {incident.timeAgo}
              </span>
            </div>
            <p className="text-sm font-medium text-sky-950 bg-white p-3 rounded-lg border border-sky-100 shadow-[0_1px_2px_rgba(2,132,199,0.08)]">
              "{incident.originalReport}"
            </p>
          </div>

          {/* Section 1b: Gemini-Cleaned Report (when available) */}
          {incident.cleanedReport && (
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50/80 to-sky-50/60 border border-emerald-100">
              <div className="flex items-center justify-between text-slate-500 font-semibold mb-1.5">
                <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-emerald-900 font-bold">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  Cleaned by Gemini
                </span>
                <span className="text-[11px] text-emerald-700/70">
                  Readable version for dispatchers
                </span>
              </div>
              <p className="text-sm font-medium text-emerald-950 bg-white p-3 rounded-lg border border-emerald-100 shadow-[0_1px_2px_rgba(16,185,129,0.1)]">
                {incident.cleanedReport}
              </p>
            </div>
          )}

          {/* Section 2: Structured Incident Intelligence Grid */}
          <div className="border border-sky-100 rounded-xl p-3.5 bg-sky-50/40">
            <div className="text-[11px] font-bold uppercase tracking-wider text-sky-800 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              Incident Intelligence & AI Extraction
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Extracted Location */}
              <div className="bg-white p-3 rounded-lg border border-sky-100/90 shadow-[0_1px_3px_rgba(2,132,199,0.08)]">
                <div className="text-[10px] uppercase font-bold text-sky-600/80 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-sky-400" />
                  Extracted Location
                </div>
                <div className="font-bold text-sky-950 text-xs mt-1">
                  {incident.location}
                </div>
                {incident.landmark && (
                  <div className="text-[11px] text-sky-600/70 mt-0.5">
                    {incident.landmark}
                  </div>
                )}
              </div>

              {/* Disaster Type */}
              <div className="bg-white p-3 rounded-lg border border-sky-100/90 shadow-[0_1px_3px_rgba(2,132,199,0.08)]">
                <div className="text-[10px] uppercase font-bold text-sky-600/80 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-sky-400" />
                  Disaster Type
                </div>
                <div className="font-bold text-sky-950 text-xs mt-1">
                  {incident.disasterType}
                </div>
                <div className="text-[11px] text-sky-600/70 mt-0.5">
                  Emergency Category
                </div>
              </div>

              {/* Severity */}
              <div className="bg-white p-3 rounded-lg border border-sky-100/90 shadow-[0_1px_3px_rgba(2,132,199,0.08)]">
                <div className="text-[10px] uppercase font-bold text-sky-600/80 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-sky-400" />
                  Severity
                </div>
                <div className={`font-bold text-xs mt-1 ${sevStyle.text}`}>
                  {incident.severity}
                </div>
                <div className="text-[11px] text-sky-600/70 mt-0.5">
                  Urgency: {incident.entitiesExtracted.urgency}
                </div>
              </div>

              {/* AI Confidence */}
              <div className="bg-white p-3 rounded-lg border border-sky-100/90 shadow-[0_1px_3px_rgba(2,132,199,0.08)]">
                <div className="text-[10px] uppercase font-bold text-sky-600/80 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-500" />
                  AI Confidence
                </div>
                <div className="font-bold text-sky-700 text-xs mt-1 flex items-center gap-1.5">
                  <span>{incident.aiConfidence}%</span>
                  <div className="w-16 bg-sky-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-sky-500 h-full rounded-full" 
                      style={{ width: `${incident.aiConfidence}%` }} 
                    />
                  </div>
                </div>
                <div className="text-[11px] text-sky-600/70 mt-0.5">
                  Automated Extraction Score
                </div>
              </div>

              {/* Source */}
              <div className="bg-white p-3 rounded-lg border border-sky-100/90 shadow-[0_1px_3px_rgba(2,132,199,0.08)]">
                <div className="text-[10px] uppercase font-bold text-sky-600/80 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-sky-400" />
                  Source
                </div>
                <div className="font-bold text-sky-950 text-xs mt-1">
                  {incident.source}
                </div>
                <div className="text-[11px] text-sky-600/70 mt-0.5">
                  Ingestion Channel
                </div>
              </div>

              {/* Reported Time */}
              <div className="bg-white p-3 rounded-lg border border-sky-100/90 shadow-[0_1px_3px_rgba(2,132,199,0.08)]">
                <div className="text-[10px] uppercase font-bold text-sky-600/80 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-400" />
                  Reported Time
                </div>
                <div className="font-bold text-sky-950 text-xs mt-1">
                  {incident.timeAgo}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {incident.timestamp}
                </div>
              </div>

              {/* Verification Status */}
              <div className="bg-white p-3 rounded-lg border border-sky-100/90 shadow-[0_1px_3px_rgba(2,132,199,0.08)]">
                <div className="text-[10px] uppercase font-bold text-sky-600/80 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-sky-400" />
                  Verification Status
                </div>
                <div className="font-bold text-sky-950 text-xs mt-1">
                  {incident.status}
                </div>
                <div className="text-[11px] text-sky-600/70 mt-0.5">
                  Operator Workflow State
                </div>
              </div>

              {/* Latitude / Longitude */}
              <div className="bg-white p-3 rounded-lg border border-sky-100/90 shadow-[0_1px_3px_rgba(2,132,199,0.08)]">
                <div className="text-[10px] uppercase font-bold text-sky-600/80 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-sky-400" />
                  Latitude / Longitude
                </div>
                <div className="font-mono font-bold text-sky-950 text-xs mt-1">
                  {incident.coordinates[0].toFixed(4)}, {incident.coordinates[1].toFixed(4)}
                </div>
                <div className="text-[11px] text-sky-600/70 mt-0.5">
                  WGS84 Coordinates
                </div>
              </div>
            </div>

              {/* Extra Extracted Context (if available) */}
            {(incident.entitiesExtracted.peopleTrapped || incident.entitiesExtracted.waterLevel || incident.assignedTeam || incident.detectedSignals || incident.recommendedPriority || incident.hazards || incident.responseNeeded || incident.secondaryLocations || incident.engineUsed) && (
              <div className="mt-3 pt-3 border-t border-sky-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {incident.engineUsed && (
                  <div className="sm:col-span-2 flex items-center justify-between bg-sky-50 p-2 rounded-lg border border-sky-100">
                    <span className="text-slate-600 font-medium">Triage Engine:</span>
                    <span className="font-bold text-sky-700">{incident.engineUsed}</span>
                  </div>
                )}
                {incident.secondaryLocations && incident.secondaryLocations.length > 0 && (
                  <div className="sm:col-span-2 bg-sky-50/70 p-2 rounded-lg border border-sky-100 text-sky-900/80">
                    <span className="font-bold text-slate-800">Secondary / Access Routes: </span>
                    <span>{incident.secondaryLocations.join(', ')}</span>
                  </div>
                )}
                {incident.hazards && incident.hazards.length > 0 && (
                  <div className="sm:col-span-2 bg-red-50 p-2.5 rounded border border-red-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 block mb-1.5">
                      Extracted Crisis Hazards:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {incident.hazards.map((haz, idx) => (
                        <span key={idx} className="bg-white text-red-900 px-2 py-0.5 rounded text-[11px] font-medium border border-red-200">
                          {haz}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {incident.responseNeeded && incident.responseNeeded.length > 0 && (
                  <div className="sm:col-span-2 bg-sky-50/80 p-2 rounded-lg border border-sky-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-900 block mb-1">
                      Response Units Needed:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {incident.responseNeeded.map((resp, idx) => (
                        <span key={idx} className="bg-white text-sky-800 px-2 py-0.5 rounded text-[11px] font-semibold border border-sky-200">
                          {resp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {incident.detectedSignals && incident.detectedSignals.length > 0 && (
                  <div className="sm:col-span-2 bg-sky-50/60 p-2.5 rounded-lg border border-sky-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                      Detected Crisis Signals:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {incident.detectedSignals.map((sig, idx) => (
                        <span key={idx} className="bg-white text-sky-900 px-2 py-0.5 rounded text-[11px] font-medium border border-sky-200">
                          {sig}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {incident.recommendedPriority && (
                  <div className="flex items-center gap-1.5 text-sky-900 font-semibold bg-sky-50 p-2 rounded-lg border border-sky-200">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>Recommended Priority: {incident.recommendedPriority}</span>
                  </div>
                )}
                {incident.entitiesExtracted.peopleTrapped && (
                  <div className="flex items-center gap-1.5 text-red-700 font-semibold bg-red-50 p-2 rounded border border-red-200">
                    <Users className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>People at Risk / Trapped: {incident.entitiesExtracted.peopleTrapped} persons</span>
                  </div>
                )}
                {incident.entitiesExtracted.waterLevel && (
                  <div className="flex items-center gap-1.5 text-sky-800 font-semibold bg-sky-50 p-2 rounded-lg border border-sky-200">
                    <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Estimated Water Level: {incident.entitiesExtracted.waterLevel}</span>
                  </div>
                )}
                {incident.assignedTeam && (
                  <div className="sm:col-span-2 flex items-center justify-between text-sky-950 bg-white p-2 rounded-lg border border-sky-100">
                    <span className="text-slate-500 font-medium">Assigned Unit:</span>
                    <strong className="text-slate-900">{incident.assignedTeam}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer: Operator Action Buttons */}
        <div className="p-4 bg-gradient-to-r from-white to-sky-50/80 border-t border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-sky-800 font-semibold w-full sm:w-auto">
            Operator Actions:
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            {/* Verify */}
            <button
              type="button"
              onClick={() => onUpdateStatus(incident.id, 'Verified')}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md font-semibold text-xs transition cursor-pointer ${
                incident.status === 'Verified'
                  ? 'bg-emerald-700 text-white ring-2 ring-emerald-500 shadow-sm'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verify
            </button>

            {/* Mark Actioned */}
            <button
              type="button"
              onClick={() => onUpdateStatus(incident.id, 'Actioned')}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md font-semibold text-xs transition cursor-pointer ${
                incident.status === 'Actioned'
                  ? 'bg-sky-700 text-white ring-2 ring-sky-400 shadow-sm'
                  : 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs'
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark Actioned
            </button>

            {/* False Alarm */}
            <button
              type="button"
              onClick={() => onUpdateStatus(incident.id, 'False Alarm')}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md font-semibold text-xs transition cursor-pointer ${
                incident.status === 'False Alarm'
                  ? 'bg-slate-700 text-white ring-2 ring-slate-400 shadow-sm'
                  : 'bg-white hover:bg-sky-50 text-sky-800 border border-sky-200 shadow-xs'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5 text-slate-500" />
              False Alarm
            </button>

            {/* Duplicate */}
            <button
              type="button"
              onClick={() => onUpdateStatus(incident.id, 'Duplicate')}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md font-semibold text-xs transition cursor-pointer ${
                incident.status === 'Duplicate'
                  ? 'bg-slate-600 text-white ring-2 ring-slate-300 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-xs'
              }`}
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              Duplicate
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

