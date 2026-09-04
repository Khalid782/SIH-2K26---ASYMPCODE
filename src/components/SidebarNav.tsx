import React from 'react';import {
  LayoutDashboard,
  Map,
  Radio,
  Users,
  FileText,
  AlertTriangle,
  Shield,
  BarChart3,
  PhoneCall,
  Sparkles,
  House
} from 'lucide-react';

interface SidebarNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  criticalCount: number;
  onBackHome?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onSelectTab,
  criticalCount,
  onBackHome,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Situation Room', icon: LayoutDashboard },
    { id: 'triage', label: 'AI Triage Console', icon: Sparkles, highlight: true },
    { id: 'map', label: 'Hyderabad GIS Map', icon: Map },
    { id: 'reports', label: 'Feed & Ingestion', icon: Radio },
    { id: 'teams', label: 'SDRF / NDRF Units', icon: Users },
    { id: 'protocols', label: 'SOPs & Hotlines', icon: PhoneCall },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-0 bg-white/70 dark:bg-sky-950/70 backdrop-blur-md border-r border-sky-100 dark:border-sky-800 text-sky-800 dark:text-sky-300 shrink-0 select-none">
      {/* Agency branding */}        <div className="p-4 border-b border-sky-100 dark:border-sky-800 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-100 via-white to-sky-200 dark:from-sky-800 dark:via-sky-900 dark:to-sky-800 border border-sky-200 dark:border-sky-700 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-[0_4px_10px_-5px_rgba(2,132,199,0.4)]">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-sky-950 dark:text-sky-100 tracking-tight leading-tight">
            GHMC & SDRF
          </div>
          <div className="text-[10px] text-sky-600/80 dark:text-sky-400 font-medium">
            Disaster Command HQ
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {onBackHome && (
          <button
            onClick={onBackHome}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-sky-700/70 dark:text-sky-400 hover:text-sky-950 dark:hover:text-white hover:bg-sky-50/80 dark:hover:bg-sky-800/60 border border-sky-100 dark:border-sky-700 bg-white/70 dark:bg-sky-900/50 mb-2 transition cursor-pointer shadow-[0_2px_8px_-4px_rgba(2,132,199,0.25)]"
          >
            <House className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            <span>Back to Home</span>
          </button>
        )}
        <div className="text-[10px] font-bold uppercase tracking-wider text-sky-500/90 dark:text-sky-500 px-3 py-1.5">
          Operational Views
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-sky-100/90 dark:bg-sky-800/70 text-sky-950 dark:text-sky-100 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_-2px_rgba(2,132,199,0.25)] border-l-[3px] border-sky-500'
                  : 'text-sky-700/70 dark:text-sky-400 hover:text-sky-900 dark:hover:text-white hover:bg-sky-50/80 dark:hover:bg-sky-800/50 border-l-[3px] border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-sky-500/70 dark:text-sky-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.id === 'dashboard' && criticalCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500 text-white shadow-sm">
                  {criticalCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3.5 border-t border-sky-100 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-900/40 text-[11px] text-sky-700/80 dark:text-sky-400 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sky-600/70">GHMC Toll-Free:</span>
          <span className="font-mono text-sky-900 dark:text-sky-200 font-semibold">040-21111111</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sky-600/70">Police / SDRF:</span>
          <span className="font-mono text-sky-900 dark:text-sky-200 font-semibold">112 / 100</span>
        </div>
        <div className="pt-2 border-t border-sky-100 dark:border-sky-800 flex items-center justify-between text-[10px] text-sky-600/70 dark:text-sky-500">
          <span>AI Engine</span>
          <span className="text-emerald-600 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Online (99.8%)
          </span>
        </div>
      </div>
    </aside>
  );
};
