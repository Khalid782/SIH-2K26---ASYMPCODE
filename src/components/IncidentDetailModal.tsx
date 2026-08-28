import React from 'react';
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
  Info
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-slate-800 border border-slate-700 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-slate-400">
                  {incident.id}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${sevStyle.badge}`}>
                  {incident.severity}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {incident.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                Incident Operations Details
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
          
          {/* Section 1: Original Ingested Report */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 font-semibold mb-1.5">
              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-800 font-bold">
                <FileText className="w-3.5 h-3.5 text-slate-700" />
                Original Report
              </span>
              <span className="font-mono text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {incident.timeAgo}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-900 bg-white p-3 rounded border border-slate-200 shadow-xs">
              "{incident.originalReport}"
            </p>
          </div>

          {/* Section 2: Structured Incident Intelligence Grid */}
          <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Incident Intelligence & AI Extraction
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Extracted Location */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  Extracted Location
                </div>
                <div className="font-bold text-slate-900 text-xs mt-1">
                  {incident.location}
                </div>
                {incident.landmark && (
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {incident.landmark}
                  </div>
                )}
              </div>

              {/* Disaster Type */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-slate-400" />
                  Disaster Type
                </div>
                <div className="font-bold text-slate-900 text-xs mt-1">
                  {incident.disasterType}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Emergency Category
                </div>
              </div>

              {/* Severity */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-slate-400" />
                  Severity
                </div>
                <div className={`font-bold text-xs mt-1 ${sevStyle.text}`}>
                  {incident.severity}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Urgency: {incident.entitiesExtracted.urgency}
                </div>
              </div>

              {/* AI Confidence */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  AI Confidence
                </div>
                <div className="font-bold text-indigo-700 text-xs mt-1 flex items-center gap-1.5">
                  <span>{incident.aiConfidence}%</span>
                  <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full" 
                      style={{ width: `${incident.aiConfidence}%` }} 
                    />
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Automated Extraction Score
                </div>
              </div>

              {/* Source */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-slate-400" />
                  Source
                </div>
                <div className="font-bold text-slate-900 text-xs mt-1">
                  {incident.source}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Ingestion Channel
                </div>
              </div>

              {/* Reported Time */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Reported Time
                </div>
                <div className="font-bold text-slate-900 text-xs mt-1">
                  {incident.timeAgo}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {incident.timestamp}
                </div>
              </div>

              {/* Verification Status */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-slate-400" />
                  Verification Status
                </div>
                <div className="font-bold text-slate-900 text-xs mt-1">
                  {incident.status}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Operator Workflow State
                </div>
              </div>

              {/* Latitude / Longitude */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-slate-400" />
                  Latitude / Longitude
                </div>
                <div className="font-mono font-bold text-slate-900 text-xs mt-1">
                  {incident.coordinates[0].toFixed(4)}, {incident.coordinates[1].toFixed(4)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  WGS84 Coordinates
                </div>
              </div>
            </div>

              {/* Extra Extracted Context (if available) */}
            {(incident.entitiesExtracted.peopleTrapped || incident.entitiesExtracted.waterLevel || incident.assignedTeam || incident.detectedSignals || incident.recommendedPriority || incident.hazards || incident.responseNeeded || incident.secondaryLocations || incident.engineUsed) && (
              <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {incident.engineUsed && (
                  <div className="sm:col-span-2 flex items-center justify-between bg-slate-100 p-2 rounded border border-slate-200">
                    <span className="text-slate-600 font-medium">Triage Engine:</span>
                    <span className="font-bold text-indigo-700">{incident.engineUsed}</span>
                  </div>
                )}
                {incident.secondaryLocations && incident.secondaryLocations.length > 0 && (
                  <div className="sm:col-span-2 bg-slate-100/80 p-2 rounded border border-slate-200 text-slate-700">
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
                  <div className="sm:col-span-2 bg-indigo-50/70 p-2 rounded border border-indigo-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block mb-1">
                      Response Units Needed:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {incident.responseNeeded.map((resp, idx) => (
                        <span key={idx} className="bg-white text-indigo-800 px-2 py-0.5 rounded text-[11px] font-semibold border border-indigo-200">
                          {resp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {incident.detectedSignals && incident.detectedSignals.length > 0 && (
                  <div className="sm:col-span-2 bg-slate-100/70 p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                      Detected Crisis Signals:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {incident.detectedSignals.map((sig, idx) => (
                        <span key={idx} className="bg-white text-slate-800 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-300">
                          {sig}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {incident.recommendedPriority && (
                  <div className="flex items-center gap-1.5 text-indigo-900 font-semibold bg-indigo-50 p-2 rounded border border-indigo-200">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
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
                  <div className="flex items-center gap-1.5 text-blue-800 font-semibold bg-blue-50 p-2 rounded border border-blue-200">
                    <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Estimated Water Level: {incident.entitiesExtracted.waterLevel}</span>
                  </div>
                )}
                {incident.assignedTeam && (
                  <div className="sm:col-span-2 flex items-center justify-between text-slate-800 bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-500 font-medium">Assigned Unit:</span>
                    <strong className="text-slate-900">{incident.assignedTeam}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer: Operator Action Buttons */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-700 font-semibold w-full sm:w-auto">
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
                  ? 'bg-blue-800 text-white ring-2 ring-blue-500 shadow-sm'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
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
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-xs'
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
                  ? 'bg-purple-800 text-white ring-2 ring-purple-400 shadow-sm'
                  : 'bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 shadow-xs'
              }`}
            >
              <Copy className="w-3.5 h-3.5 text-purple-600" />
              Duplicate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

