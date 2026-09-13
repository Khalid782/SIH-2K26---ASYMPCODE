import React from 'react';
import { RefreshCw, MapPin, Moon, Sun } from 'lucide-react';
import { BeaconLogo } from './BeaconLogo';

interface HeaderProps {
  lastUpdated: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
  liveClock?: string;
  onHome?: () => void;
  darkMode?: boolean;
  onToggleDark?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ lastUpdated, onRefresh, isRefreshing, liveClock, onHome, darkMode, onToggleDark }) => {
  return (
    <header className="shrink-0 bg-paper/85 dark:bg-ink/85 backdrop-blur-md border-b border-paper-2 dark:border-paper/25 text-ink dark:text-paper sticky top-0 z-30 shadow-[0_1px_0_0_rgba(17,17,16,0.06),0_14px_34px_-24px_rgba(17,17,16,0.45)]">
      <div className="w-full px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Platform Title & Subtitle — CRISISBEACON home button */}
        <button
          type="button"
          onClick={onHome}
          title="CRISISBEACON Home"
          aria-label="Go to CRISISBEACON home page"
          className="group flex items-center gap-3.5 text-left rounded-xl -ml-1.5 px-1.5 py-1 transition cursor-pointer hover:bg-paper-2/80 dark:hover:bg-ink/60 active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-paper-2 via-paper to-paper-2 dark:from-paper-2 dark:via-paper dark:to-paper-2 border border-paper-2 dark:border-mute flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_10px_-4px_rgba(17,17,16,0.4)] group-hover:scale-105 group-hover:shadow-[0_6px_16px_-6px_rgba(17,17,16,0.55)] transition-all">
            <BeaconLogo className="w-5 h-5 text-mute dark:text-mute" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-ink dark:text-paper leading-none font-sans group-hover:text-mute dark:group-hover:text-white transition-colors">
                CRISISBEACON
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-paper-2 dark:bg-ink/80 text-mute dark:text-paper/70 border border-paper-2/80 dark:border-mute tracking-wider">
                SIH Prototype
              </span>
            </div>
            <p className="text-xs text-mute/70 dark:text-mute font-medium mt-1 flex items-center gap-1.5">
              Real-Time Disaster Intelligence Platform
              <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-semibold text-mute dark:text-mute opacity-0 group-hover:opacity-100 transition-opacity">
                &middot; Back to Home
              </span>
            </p>
          </div>
        </button>

        {/* Middle: Active Event & Status */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2 bg-paper-2/80 dark:bg-ink/60 border border-paper-2/70 dark:border-mute px-3 py-1.5 rounded-lg text-xs">
            <MapPin className="w-3.5 h-3.5 text-mute dark:text-mute shrink-0" />
            <span className="text-mute/80 dark:text-mute font-medium">Active event:</span>
            <span className="text-paper dark:text-paper font-semibold tracking-wide">
              Hyderabad Flood Response
            </span>
          </div>


        </div>

        {/* Right: Dark Mode, Last Updated & Refresh */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-mute/70 dark:text-mute">
          {/* Dark-mode toggle */}
          <button
            onClick={onToggleDark}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-paper-2/80 dark:bg-ink/70 border border-paper-2/70 dark:border-mute text-mute dark:text-paper/70 hover:bg-paper-2 dark:hover:bg-mute transition cursor-pointer active:scale-90 shadow-sm"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-1.5">
            <span>Last updated:</span>
            <span className="font-medium text-paper dark:text-paper">{liveClock || lastUpdated}</span>
          </div>
          <button
            onClick={onRefresh}
            title="Refresh feed and data"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-paper dark:bg-ink/70 hover:bg-paper-2 dark:hover:bg-ink/80/70 text-mute dark:text-paper/70 hover:text-paper dark:hover:text-white border border-paper-2 dark:border-mute transition cursor-pointer active:scale-95 text-xs font-medium shadow-[0_1px_2px_rgba(17,17,16,0.08)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-mute' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>
    </header>
  );
};
