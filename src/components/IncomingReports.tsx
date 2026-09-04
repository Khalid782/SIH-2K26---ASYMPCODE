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
  highlightId?: string | null;
}

export const IncomingReports: React.FC<IncomingReportsProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  highlightId,
}) => {
  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            <AlertOctagon className="w-2.5 h-2.5" />
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
            <AlertTriangle className="w-2.5 h-2.5" />
            High
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
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
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
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
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            Duplicate
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="bg-white/95 dark:bg-sky-900/90 rounded-xl border border-sky-100/90 dark:border-sky-800 shadow-[0_1px_2px_rgba(8,47,73,0.04),0_10px_24px_-18px_rgba(2,132,199,0.3)] flex flex-col h-full max-h-[600px] overflow-hidden">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-sky-100 dark:border-sky-800 bg-gradient-to-r from-sky-50/90 dark:from-sky-800/50 to-white dark:to-sky-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <h2 className="text-sm font-bold tracking-tight text-sky-950 dark:text-sky-100 uppercase">
            Incoming Reports
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 font-mono bg-sky-100/80 dark:bg-sky-800 px-2 py-0.5 rounded">
          {incidents.length} LIVE FEEDS
        </span>
      </div>

      {/* Scrollable Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-sky-100/80 p-1.5">
        {incidents.length === 0 ? (
          <div className="p-8 text-center text-sky-500/80 text-xs">
            No incident reports matching the selected filters.
          </div>
        ) : (
          incidents.map((incident) => {
            const isSelected = selectedIncident?.id === incident.id;
            const isNew = highlightId === incident.id;
            return (
              <div
                key={incident.id}
                onClick={() => onSelectIncident(incident)}
                className={`p-3 rounded-lg transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-sky-100/70 dark:bg-sky-800/60 ring-2 ring-sky-300/60 dark:ring-sky-600 shadow-[0_2px_8px_-3px_rgba(2,132,199,0.25)]'
                    : isNew
                      ? 'bg-sky-50/90 dark:bg-sky-800/50 ring-2 ring-sky-400/70 shadow-[0_4px_14px_-4px_rgba(2,132,199,0.4)] animate-new-incident'
                      : 'hover:bg-sky-50/70 dark:hover:bg-sky-800/40'
                }`}
              >
                {/* Header row: Location & Badges */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span className="font-bold text-xs text-sky-950 dark:text-sky-100 tracking-tight">
                      {incident.location}
                    </span>
                    <span className="text-[11px] text-sky-600/70 dark:text-sky-400 font-medium">
                      &bull; {incident.disasterType}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isNew && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-sky-600 text-white animate-pulse">
                        New
                      </span>
                    )}
                    {getSeverityBadge(incident.severity)}
                  </div>
                </div>

                {/* Report Content */}
                <p className="text-xs text-sky-900/80 dark:text-sky-300 leading-relaxed line-clamp-2 mb-2 font-normal">
                  "{incident.originalReport}"
                </p>

                {/* Footer metadata row */}
                <div className="flex flex-wrap items-center justify-between gap-y-1.5 text-[11px] text-sky-600/70 dark:text-sky-400 pt-1 border-t border-sky-100/80 dark:border-sky-800">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-sky-700 font-medium">
                      <Sparkles className="w-3 h-3 text-sky-500 dark:text-sky-400" />
                      AI: <strong className="text-sky-950">{incident.aiConfidence}%</strong>
                    </span>
                    <span className="text-sky-200">|</span>
                    <span className="truncate max-w-[110px] text-sky-700/80" title={incident.source}>
                      {incident.source.split('(')[0]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-sky-500 font-mono text-[10px]">
                      <Clock className="w-3 h-3" />
                      {incident.timeAgo}
                    </span>
                    {getStatusBadge(incident.status)}
                    <ChevronRight className="w-3.5 h-3.5 text-sky-400" />
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
