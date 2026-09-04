import React from 'react';
import { Radio, Pause } from 'lucide-react';
import type { Incident, Severity } from '../types';

interface DashboardTickerProps {
  incidents: Incident[];
  live?: boolean;
}

const SEV_DOT: Record<Severity, string> = {
  Critical: 'bg-rose-500',
  High: 'bg-orange-400',
  Low: 'bg-sky-400',
};

/**
 * Continuously scrolling strip of the most recent live reports —
 * pauses on hover, shows LIVE/PAUSED state with the feed toggle.
 */
export const DashboardTicker: React.FC<DashboardTickerProps> = ({ incidents, live = true }) => {
  const items = incidents.slice(0, 14);

  return (
    <div className="rounded-xl bg-white/80 dark:bg-sky-900/80 backdrop-blur border border-sky-100 dark:border-sky-800 overflow-hidden shadow-[0_8px_24px_-16px_rgba(2,132,199,0.4)] flex items-stretch">
      {/* LIVE chip */}
      <div
        className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-widest ${
          live ? 'bg-gradient-to-b from-sky-500 to-sky-600 text-white' : 'bg-sky-200/70 text-sky-700'
        }`}
      >
        {live ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-70"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
        ) : (
          <Pause className="w-3 h-3" />
        )}
        {live ? 'Live' : 'Paused'}
      </div>

      {/* Scrolling reports */}
      <div className="relative flex-1 overflow-hidden">
        {items.length === 0 ? (
          <div className="py-2.5 px-4 text-[11px] font-medium text-sky-600/70 dark:text-sky-400 flex items-center h-full">
            Awaiting incoming reports…
          </div>
        ) : (
          <div className="animate-marquee flex whitespace-nowrap py-2.5 text-[11px] font-medium text-sky-800/90">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0 items-center">
                {items.map((i) => (
                  <span key={`${dup}-${i.id}`} className="flex items-center gap-1.5 px-4">
                    <span className={`w-1.5 h-1.5 rounded-full ${SEV_DOT[i.severity]}`} />
                    <span className="font-bold text-sky-950 dark:text-sky-100">{i.location.split(',')[0]}</span>
                    <span className="text-sky-600/80 dark:text-sky-400">{i.disasterType}</span>
                    <span className="font-mono text-[10px] text-sky-400 uppercase">
                      {i.severity} &middot; {i.aiConfidence}%
                    </span>
                    <Radio className="w-2.5 h-2.5 text-sky-300 mx-2" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
