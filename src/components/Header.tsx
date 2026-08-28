import React from 'react';
import { Radio, RefreshCw, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';

interface HeaderProps {
  lastUpdated: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ lastUpdated, onRefresh, isRefreshing }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="w-full px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Platform Title & Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0 shadow-inner">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white leading-none font-sans">
                PRISM
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 tracking-wider">
                SIH Prototype
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Real-Time Disaster Intelligence Platform
            </p>
          </div>
        </div>

        {/* Middle: Active Event & Status */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400 font-medium">Active event:</span>
            <span className="text-white font-semibold tracking-wide">
              Hyderabad Flood Response
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-800/80 text-red-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="tracking-wider">LIVE</span>
          </div>
        </div>

        {/* Right: Last Updated & Refresh */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Last updated:</span>
            <span className="font-medium text-slate-200">{lastUpdated}</span>
          </div>
          <button
            onClick={onRefresh}
            title="Refresh feed and data"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition cursor-pointer active:scale-95 text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>
    </header>
  );
};
