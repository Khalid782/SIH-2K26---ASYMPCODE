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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            <AlertOctagon className="w-2.5 h-2.5" />
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
            <AlertTriangle className="w-2.5 h-2.5" />
            High
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
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
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Verified
          </span>
        );
      case 'Actioned':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-mute bg-paper-2 px-1.5 py-0.5 rounded-full border border-paper-2">
            <CheckCheck className="w-2.5 h-2.5" />
            Actioned
          </span>
        );
      case 'False Alarm':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-ink dark:text-paper bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200 line-through">
            False Alarm
          </span>
        );
      case 'Duplicate':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-ink dark:text-paper bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200">
            Duplicate
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-mute bg-paper-2 px-1.5 py-0.5 rounded-full border border-paper-2">
            Pending
          </span>
        );
    }
  };

  return (
    // h-full: the panel tracks the tactical map's row height instead of stopping at a
    // fixed cap, so the two columns stay level now that the map runs full-height.
    <div className="bg-paper/95 dark:bg-ink/90 rounded-xl border border-paper-2/90 dark:border-paper/25 shadow-[0_1px_2px_rgba(17,17,16,0.04),0_10px_24px_-18px_rgba(17,17,16,0.3)] flex flex-col h-full min-h-[420px] overflow-hidden">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-paper-2 dark:border-paper/25 bg-gradient-to-r from-paper-2/90 dark:from-paper-2/50 to-white dark:to-paper/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <h2 className="text-sm font-bold tracking-tight text-ink dark:text-paper uppercase">
            Incoming Reports
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-ink dark:text-paper font-mono bg-paper-2/80 dark:bg-paper-2 px-2 py-0.5 rounded-full">
          {incidents.length} LIVE FEEDS
        </span>
      </div>

      {/* Scrollable Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-paper-2/80 p-1.5">
        {incidents.length === 0 ? (
          <div className="p-8 text-center text-ink dark:text-paper text-xs">
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
                    ? 'bg-paper-2/70 dark:bg-ink/60 ring-2 ring-paper-2/70/60 dark:ring-mute shadow-[0_2px_8px_-3px_rgba(17,17,16,0.25)]'
                    : isNew
                      ? 'bg-paper-2/90 dark:bg-ink/50 ring-2 ring-mute/70 shadow-[0_4px_14px_-4px_rgba(17,17,16,0.4)] animate-new-incident'
                      : 'hover:bg-paper-2/70 dark:hover:bg-ink/80/40'
                }`}
              >
                {/* Header row: Location & Badges */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-ink dark:text-paper shrink-0" />
                    <span className="font-bold text-xs text-ink dark:text-paper tracking-tight">
                      {incident.location}
                    </span>
                    <span className="text-[11px] text-ink dark:text-paper font-semibold">
                      &bull; {incident.disasterType}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isNew && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-mute text-white animate-pulse">
                        New
                      </span>
                    )}
                    {getSeverityBadge(incident.severity)}
                  </div>
                </div>

                {/* Report Content */}
                <p className="text-xs text-ink dark:text-paper leading-relaxed line-clamp-2 mb-2 font-medium">
                  "{incident.originalReport}"
                </p>

                {/* Footer metadata row */}
                <div className="flex flex-wrap items-center justify-between gap-y-1.5 text-[11px] text-ink dark:text-paper pt-1 border-t border-paper-2/80 dark:border-paper/25">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-ink dark:text-paper font-medium">
                      <Sparkles className="w-3 h-3 text-ink dark:text-paper" />
                      AI: <strong className="text-ink dark:text-paper">{incident.aiConfidence}%</strong>
                    </span>
                    <span className="text-ink/20 dark:text-paper/20">|</span>
                    <span className="truncate max-w-[110px] text-ink dark:text-paper" title={incident.source}>
                      {incident.source.split('(')[0]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-ink dark:text-paper font-mono text-[10px]">
                      <Clock className="w-3 h-3" />
                      {incident.timeAgo}
                    </span>
                    {getStatusBadge(incident.status)}
                    <ChevronRight className="w-3.5 h-3.5 text-ink dark:text-paper" />
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
