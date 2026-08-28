import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  Radio, 
  Users, 
  FileText, 
  AlertTriangle, 
  Shield, 
  BarChart3,
  PhoneCall,
  Sparkles
} from 'lucide-react';

interface SidebarNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  criticalCount: number;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onSelectTab,
  criticalCount,
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
    <aside className="hidden md:flex flex-col w-56 bg-slate-900 border-r border-slate-800 text-slate-300 shrink-0 select-none">
      {/* Agency branding */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-red-400">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-white tracking-tight leading-tight">
            GHMC & SDRF
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            Disaster Command HQ
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
          Operational Views
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold border-l-2 border-red-500 pl-2.5'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.id === 'dashboard' && criticalCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white">
                  {criticalCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">GHMC Toll-Free:</span>
          <span className="font-mono text-slate-200 font-semibold">040-21111111</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Police / SDRF:</span>
          <span className="font-mono text-slate-200 font-semibold">112 / 100</span>
        </div>
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <span>AI Engine</span>
          <span className="text-emerald-400 font-medium">Online (99.8%)</span>
        </div>
      </div>
    </aside>
  );
};
