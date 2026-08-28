import React from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  CheckCheck, 
  Activity 
} from 'lucide-react';
import { Severity, VerificationStatus } from '../types';

interface SummaryCardsProps {
  counts: {
    total: number;
    critical: number;
    high: number;
    low: number;
    verified: number;
    actioned: number;
  };
  activeSeverityFilter?: 'All' | Severity;
  activeStatusFilter?: 'All' | VerificationStatus;
  onSelectSeverity?: (severity: 'All' | Severity) => void;
  onSelectStatus?: (status: 'All' | VerificationStatus) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  counts,
  activeSeverityFilter = 'All',
  activeStatusFilter = 'All',
  onSelectSeverity,
  onSelectStatus,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total Incidents */}
      <button
        type="button"
        onClick={() => {
          if (onSelectSeverity) onSelectSeverity('All');
          if (onSelectStatus) onSelectStatus('All');
        }}
        className={`text-left p-3 rounded-lg border transition-all cursor-pointer bg-white shadow-xs ${
          activeSeverityFilter === 'All' && activeStatusFilter === 'All'
            ? 'border-slate-800 ring-2 ring-slate-800/10'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Incidents
          </span>
          <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600">
            <Activity className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {counts.total}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Recorded</span>
        </div>
      </button>

      {/* 2. Critical (Red) */}
      <button
        type="button"
        onClick={() => onSelectSeverity && onSelectSeverity(activeSeverityFilter === 'Critical' ? 'All' : 'Critical')}
        className={`text-left p-3 rounded-lg border transition-all cursor-pointer bg-white shadow-xs ${
          activeSeverityFilter === 'Critical'
            ? 'border-red-600 ring-2 ring-red-500/20 bg-red-50/40'
            : 'border-slate-200 hover:border-red-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-red-700">
            Critical
          </span>
          <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center text-red-600">
            <AlertOctagon className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-red-600 font-mono">
            {counts.critical}
          </span>
          <span className="text-[11px] text-red-600/80 font-medium">Immediate Ops</span>
        </div>
      </button>

      {/* 3. High Priority (Orange) */}
      <button
        type="button"
        onClick={() => onSelectSeverity && onSelectSeverity(activeSeverityFilter === 'High' ? 'All' : 'High')}
        className={`text-left p-3 rounded-lg border transition-all cursor-pointer bg-white shadow-xs ${
          activeSeverityFilter === 'High'
            ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/40'
            : 'border-slate-200 hover:border-orange-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-700">
            High Priority
          </span>
          <div className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center text-orange-600">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-orange-600 font-mono">
            {counts.high}
          </span>
          <span className="text-[11px] text-orange-600/80 font-medium">Elevated</span>
        </div>
      </button>

      {/* 4. Low Priority (Yellow) */}
      <button
        type="button"
        onClick={() => onSelectSeverity && onSelectSeverity(activeSeverityFilter === 'Low' ? 'All' : 'Low')}
        className={`text-left p-3 rounded-lg border transition-all cursor-pointer bg-white shadow-xs ${
          activeSeverityFilter === 'Low'
            ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40'
            : 'border-slate-200 hover:border-amber-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            Low Priority
          </span>
          <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-amber-600">
            <Info className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-amber-600 font-mono">
            {counts.low}
          </span>
          <span className="text-[11px] text-amber-700/80 font-medium">Monitoring</span>
        </div>
      </button>

      {/* 5. Verified */}
      <button
        type="button"
        onClick={() => onSelectStatus && onSelectStatus(activeStatusFilter === 'Verified' ? 'All' : 'Verified')}
        className={`text-left p-3 rounded-lg border transition-all cursor-pointer bg-white shadow-xs ${
          activeStatusFilter === 'Verified'
            ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/40'
            : 'border-slate-200 hover:border-emerald-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
            Verified
          </span>
          <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-emerald-700 font-mono">
            {counts.verified}
          </span>
          <span className="text-[11px] text-emerald-700/80 font-medium">Confirmed</span>
        </div>
      </button>

      {/* 6. Actioned */}
      <button
        type="button"
        onClick={() => onSelectStatus && onSelectStatus(activeStatusFilter === 'Actioned' ? 'All' : 'Actioned')}
        className={`text-left p-3 rounded-lg border transition-all cursor-pointer bg-white shadow-xs ${
          activeStatusFilter === 'Actioned'
            ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40'
            : 'border-slate-200 hover:border-blue-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-800">
            Actioned
          </span>
          <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-700">
            <CheckCheck className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-blue-700 font-mono">
            {counts.actioned}
          </span>
          <span className="text-[11px] text-blue-700/80 font-medium">Dispatched</span>
        </div>
      </button>
    </div>
  );
};
