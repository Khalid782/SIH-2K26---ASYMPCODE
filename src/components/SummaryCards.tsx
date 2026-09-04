import React, { useEffect, useRef, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  CheckCheck,
  Activity
} from 'lucide-react';
import { Severity, VerificationStatus } from '../types';

/* Smoothly counts from the previous value to the next (eases on every change) */
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  const currentRef = useRef(0);

  useEffect(() => {
    const from = currentRef.current;
    const to = value;
    if (from === to) return;
    const DURATION = 750;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      currentRef.current = current;
      setDisplay(current);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className={`tabular-nums ${className ?? ''}`}>{display}</span>;
}

const numBase = 'text-2xl font-bold tracking-tight font-mono bg-gradient-to-b bg-clip-text text-transparent';
const NUM_STYLES = {
  total: `${numBase} from-sky-950 via-sky-700 to-cyan-500 drop-shadow-[0_2px_10px_rgba(2,132,199,0.35)]`,
  critical: `${numBase} from-rose-700 via-rose-500 to-rose-400 drop-shadow-[0_2px_10px_rgba(244,63,94,0.4)]`,
  high: `${numBase} from-orange-700 via-orange-500 to-amber-400 drop-shadow-[0_2px_10px_rgba(249,115,22,0.4)]`,
  low: `${numBase} from-amber-700 via-amber-500 to-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.35)]`,
  verified: `${numBase} from-emerald-700 via-emerald-500 to-emerald-400 drop-shadow-[0_2px_10px_rgba(16,185,129,0.4)]`,
  actioned: `${numBase} from-sky-700 via-sky-500 to-cyan-400 drop-shadow-[0_2px_10px_rgba(14,165,233,0.4)]`,
};

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

const cardBase =
  'text-left p-3.5 rounded-xl border transition-all cursor-pointer bg-white/95 dark:bg-sky-900/90 dark:border-sky-800 shadow-[0_1px_2px_rgba(8,47,73,0.05),0_10px_22px_-16px_rgba(2,132,199,0.3)] hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(8,47,73,0.06),0_14px_28px_-14px_rgba(2,132,199,0.4)]';

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
        className={`${cardBase} ${
          activeSeverityFilter === 'All' && activeStatusFilter === 'All'
            ? 'border-sky-500 ring-2 ring-sky-500/15 bg-sky-50/60'
            : 'border-sky-100 hover:border-sky-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-700/70">
            Total Incidents
          </span>
          <div className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600">
            <Activity className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <AnimatedNumber value={counts.total} className={NUM_STYLES.total} />
          <span className="text-[11px] text-sky-600/70 font-medium">Recorded</span>
        </div>
      </button>

      {/* 2. Critical (Red) */}
      <button
        type="button"
        onClick={() => onSelectSeverity && onSelectSeverity(activeSeverityFilter === 'Critical' ? 'All' : 'Critical')}
        className={`${cardBase} ${
          activeSeverityFilter === 'Critical'
            ? 'border-rose-500 ring-2 ring-rose-500/15 bg-rose-50/50'
            : 'border-sky-100 hover:border-rose-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
            Critical
          </span>
          <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
            <AlertOctagon className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <AnimatedNumber value={counts.critical} className={NUM_STYLES.critical} />
          <span className="text-[11px] text-rose-600/80 font-medium">Immediate Ops</span>
        </div>
      </button>

      {/* 3. High Priority (Orange) */}
      <button
        type="button"
        onClick={() => onSelectSeverity && onSelectSeverity(activeSeverityFilter === 'High' ? 'All' : 'High')}
        className={`${cardBase} ${
          activeSeverityFilter === 'High'
            ? 'border-orange-500 ring-2 ring-orange-500/15 bg-orange-50/50'
            : 'border-sky-100 hover:border-orange-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">
            High Priority
          </span>
          <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <AnimatedNumber value={counts.high} className={NUM_STYLES.high} />
          <span className="text-[11px] text-orange-600/80 font-medium">Elevated</span>
        </div>
      </button>

      {/* 4. Low Priority (Yellow) */}
      <button
        type="button"
        onClick={() => onSelectSeverity && onSelectSeverity(activeSeverityFilter === 'Low' ? 'All' : 'Low')}
        className={`${cardBase} ${
          activeSeverityFilter === 'Low'
            ? 'border-amber-500 ring-2 ring-amber-500/15 bg-amber-50/50'
            : 'border-sky-100 hover:border-amber-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            Low Priority
          </span>
          <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
            <Info className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <AnimatedNumber value={counts.low} className={NUM_STYLES.low} />
          <span className="text-[11px] text-amber-700/80 font-medium">Monitoring</span>
        </div>
      </button>

      {/* 5. Verified */}
      <button
        type="button"
        onClick={() => onSelectStatus && onSelectStatus(activeStatusFilter === 'Verified' ? 'All' : 'Verified')}
        className={`${cardBase} ${
          activeStatusFilter === 'Verified'
            ? 'border-emerald-500 ring-2 ring-emerald-500/15 bg-emerald-50/50'
            : 'border-sky-100 hover:border-emerald-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            Verified
          </span>
          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <AnimatedNumber value={counts.verified} className={NUM_STYLES.verified} />
          <span className="text-[11px] text-emerald-700/80 font-medium">Confirmed</span>
        </div>
      </button>

      {/* 6. Actioned */}
      <button
        type="button"
        onClick={() => onSelectStatus && onSelectStatus(activeStatusFilter === 'Actioned' ? 'All' : 'Actioned')}
        className={`${cardBase} ${
          activeStatusFilter === 'Actioned'
            ? 'border-sky-500 ring-2 ring-sky-500/15 bg-sky-50/60'
            : 'border-sky-100 hover:border-sky-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-700">
            Actioned
          </span>
          <div className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
            <CheckCheck className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <AnimatedNumber value={counts.actioned} className={NUM_STYLES.actioned} />
          <span className="text-[11px] text-sky-700/80 font-medium">Dispatched</span>
        </div>
      </button>
    </div>
  );
};
