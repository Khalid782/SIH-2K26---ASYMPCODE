import React from 'react';
import { Incident, Severity } from '../types';
import { 
  Radio, 
  Clock, 
  MapPin, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  CheckCheck,
  AlertOctagon,
  AlertTriangle,
  Info
} from 'lucide-react';

interface IncomingReportsProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
}

export const IncomingReports: React.FC<IncomingReportsProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
}) => {
  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
            <AlertOctagon className="w-2.5 h-2.5" />
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
            <AlertTriangle className="w-2.5 h-2.5" />
            High
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            <Info className="w-2.5 h-2.5" />
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status: Incident['status']) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Verified
          </span>
        );
      case 'Actioned':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
            <CheckCheck className="w-2.5 h-2.5" />
            Actioned
          </span>
        );
      case 'False Alarm':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 line-through">
            False Alarm
          </span>
        );
      case 'Duplicate':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
            Duplicate
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col h-full max-h-[600px] overflow-hidden">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
            Incoming Reports
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 font-mono bg-slate-200/70 px-2 py-0.5 rounded">
          {incidents.length} LIVE FEEDS
        </span>
      </div>

      {/* Scrollable Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
        {incidents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No incident reports matching the selected filters.
          </div>
        ) : (
          incidents.map((incident) => {
            const isSelected = selectedIncident?.id === incident.id;
            return (
              <div
                key={incident.id}
                onClick={() => onSelectIncident(incident)}
                className={`p-3 rounded-md transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-slate-100 ring-2 ring-slate-800/15'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Header row: Location & Badges */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <span className="font-bold text-xs text-slate-900 tracking-tight">
                      {incident.location}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      &bull; {incident.disasterType}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {getSeverityBadge(incident.severity)}
                  </div>
                </div>

                {/* Report Content */}
                <p className="text-xs text-slate-700 leading-relaxed line-clamp-2 mb-2 font-normal">
                  "{incident.originalReport}"
                </p>

                {/* Footer metadata row */}
                <div className="flex flex-wrap items-center justify-between gap-y-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-100/80">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      AI: <strong className="text-slate-800">{incident.aiConfidence}%</strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="truncate max-w-[110px] text-slate-600" title={incident.source}>
                      {incident.source.split('(')[0]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                      <Clock className="w-3 h-3" />
                      {incident.timeAgo}
                    </span>
                    {getStatusBadge(incident.status)}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
