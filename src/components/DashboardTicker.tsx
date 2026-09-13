import React from 'react';
import { Radio } from 'lucide-react';
import type { Incident, Severity } from '../types';

interface DashboardTickerProps {
  incidents: Incident[];
}

const SEV_DOT: Record<Severity, string> = {
  Critical: 'bg-rose-500',
  High: 'bg-orange-400',
  Low: 'bg-mute',
};

/**
 * Continuously scrolling strip of the most recent live reports —
 * pauses on hover, shows LIVE/PAUSED state with the feed toggle.
 */
export const DashboardTicker: React.FC<DashboardTickerProps> = ({ incidents }) => {
  const items = incidents.slice(0, 14);

  return (
    <div className="rounded-xl bg-paper dark:bg-ink/80 backdrop-blur border border-paper-2 dark:border-paper/25 overflow-hidden shadow-[0_8px_24px_-16px_rgba(17,17,16,0.4)] flex items-stretch">
      {/* Feed chip */}
      <div className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-widest bg-paper-2/70 text-mute">
        Feed
      </div>

      {/* Scrolling reports */}
      <div className="relative flex-1 overflow-hidden">
        {items.length === 0 ? (
          <div className="py-2.5 px-4 text-[11px] font-medium text-mute/70 dark:text-mute flex items-center h-full">
            Awaiting incoming reports…
          </div>
        ) : (
          <div className="animate-marquee flex whitespace-nowrap py-2.5 text-[11px] font-medium text-paper-2/90">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0 items-center">
                {items.map((i) => (
                  <span key={`${dup}-${i.id}`} className="flex items-center gap-1.5 px-4">
                    <span className={`w-1.5 h-1.5 rounded-full ${SEV_DOT[i.severity]}`} />
                    <span className="font-bold text-ink dark:text-paper">{i.location.split(',')[0]}</span>
                    <span className="text-mute/80 dark:text-mute">{i.disasterType}</span>
                    <span className="font-mono text-[10px] text-mute uppercase">
                      {i.severity} &middot; {i.aiConfidence}%
                    </span>
                    <Radio className="w-2.5 h-2.5 text-paper-2/70 mx-2" />
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
