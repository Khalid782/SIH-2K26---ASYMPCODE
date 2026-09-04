import React from 'react';
import { Radio, RefreshCw, ShieldCheck, MapPin, Pause, Play, Moon, Sun } from 'lucide-react';
import { BeaconLogo } from './BeaconLogo';

interface HeaderProps {
  lastUpdated: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
  liveClock?: string;
  liveSim?: boolean;
  onToggleLive?: () => void;
  onHome?: () => void;
  darkMode?: boolean;
  onToggleDark?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ lastUpdated, onRefresh, isRefreshing, liveClock, liveSim, onToggleLive, onHome, darkMode, onToggleDark }) => {
  return (
    <header className="shrink-0 bg-white/85 dark:bg-sky-950/85 backdrop-blur-md border-b border-sky-100 dark:border-sky-800 text-sky-950 dark:text-sky-100 sticky top-0 z-30 shadow-[0_1px_0_0_rgba(14,165,233,0.06),0_14px_34px_-24px_rgba(2,132,199,0.45)]">
      <div className="w-full px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Platform Title & Subtitle — CRISISBEACON home button */}
        <button
          type="button"
          onClick={onHome}
          title="CRISISBEACON Home"
          aria-label="Go to CRISISBEACON home page"
          className="group flex items-center gap-3.5 text-left rounded-xl -ml-1.5 px-1.5 py-1 transition cursor-pointer hover:bg-sky-50/80 dark:hover:bg-sky-800/60 active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 via-white to-sky-200 dark:from-sky-800 dark:via-sky-900 dark:to-sky-800 border border-sky-200 dark:border-sky-700 flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_10px_-4px_rgba(2,132,199,0.4)] group-hover:scale-105 group-hover:shadow-[0_6px_16px_-6px_rgba(2,132,199,0.55)] transition-all">
            <BeaconLogo className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-sky-950 dark:text-sky-100 leading-none font-sans group-hover:text-sky-700 dark:group-hover:text-white transition-colors">
                CRISISBEACON
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-800/80 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-700 tracking-wider">
                SIH Prototype
              </span>
            </div>
            <p className="text-xs text-sky-700/70 dark:text-sky-400 font-medium mt-1 flex items-center gap-1.5">
              Real-Time Disaster Intelligence Platform
              <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-semibold text-sky-500 dark:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                &middot; Back to Home
              </span>
            </p>
          </div>
        </button>

        {/* Middle: Active Event & Status */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2 bg-sky-50/80 dark:bg-sky-900/60 border border-sky-200/70 dark:border-sky-700 px-3 py-1.5 rounded-lg text-xs">
            <MapPin className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
            <span className="text-sky-600/80 dark:text-sky-400 font-medium">Active event:</span>
            <span className="text-sky-900 dark:text-sky-100 font-semibold tracking-wide">
              Hyderabad Flood Response
            </span>
          </div>

          <button
            onClick={onToggleLive}
            title={liveSim ? 'Pause the simulated live feed' : 'Resume the simulated live feed'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer active:scale-95 ${
              liveSim
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200/80 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                : 'bg-sky-50 dark:bg-sky-900/60 border-sky-200/80 dark:border-sky-700 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-800/60'
            }`}
          >
            {liveSim ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            ) : (
              <Pause className="w-3 h-3" />
            )}
            <span className="tracking-wider">{liveSim ? 'LIVE' : 'PAUSED'}</span>
            <Play className="w-2.5 h-2.5 opacity-60" />
          </button>
        </div>

        {/* Right: Dark Mode, Last Updated & Refresh */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-sky-700/70 dark:text-sky-400">
          {/* Dark-mode toggle */}
          <button
            onClick={onToggleDark}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50/80 dark:bg-sky-800/70 border border-sky-200/70 dark:border-sky-700 text-sky-600 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-700 transition cursor-pointer active:scale-90 shadow-sm"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-1.5">
            <span>Last updated:</span>
            <span className="font-medium text-sky-900 dark:text-sky-100">{liveClock || lastUpdated}</span>
          </div>
          <button
            onClick={onRefresh}
            title="Refresh feed and data"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white dark:bg-sky-900/70 hover:bg-sky-50 dark:hover:bg-sky-800/70 text-sky-700 dark:text-sky-300 hover:text-sky-900 dark:hover:text-white border border-sky-200 dark:border-sky-700 transition cursor-pointer active:scale-95 text-xs font-medium shadow-[0_1px_2px_rgba(2,132,199,0.08)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-500' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>
    </header>
  );
};
