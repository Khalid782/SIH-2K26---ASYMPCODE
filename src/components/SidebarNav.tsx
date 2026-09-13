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
  House,
  HeartHandshake
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
    { id: 'ngos', label: 'NGOs & Communities', icon: HeartHandshake },
    { id: 'protocols', label: 'SOPs & Hotlines', icon: PhoneCall },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-0 bg-paper/70 dark:bg-ink/70 backdrop-blur-md border-r border-paper-2 dark:border-paper/25 text-paper-2 dark:text-paper/70 shrink-0 select-none">
      {/* Agency branding */}        <div className="p-4 border-b border-paper-2 dark:border-paper/25 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-paper-2 via-paper to-paper-2 dark:from-paper-2 dark:via-paper dark:to-paper-2 border border-paper-2 dark:border-mute flex items-center justify-center text-mute dark:text-mute shadow-[0_4px_10px_-5px_rgba(17,17,16,0.4)]">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-ink dark:text-paper tracking-tight leading-tight">
            GHMC & SDRF
          </div>
          <div className="text-[10px] text-mute/80 dark:text-mute font-medium">
            Disaster Command HQ
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {onBackHome && (
          <button
            onClick={onBackHome}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-mute/70 dark:text-mute hover:text-ink dark:hover:text-white hover:bg-paper-2/80 dark:hover:bg-ink/60 border border-paper-2 dark:border-mute bg-paper/70 dark:bg-ink/50 mb-2 transition cursor-pointer shadow-[0_2px_8px_-4px_rgba(17,17,16,0.25)]"
          >
            <House className="w-4 h-4 text-mute dark:text-mute" />
            <span>Back to Home</span>
          </button>
        )}
        <div className="text-[10px] font-bold uppercase tracking-wider text-mute/90 dark:text-mute px-3 py-1.5">
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
                  ? 'bg-paper-2/90 dark:bg-ink/70 text-ink dark:text-paper font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_-2px_rgba(17,17,16,0.25)] border-l-[3px] border-signal/80'
                  : 'text-mute/70 dark:text-mute hover:text-paper dark:hover:text-white hover:bg-paper-2/80 dark:hover:bg-ink/80/50 border-l-[3px] border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-mute dark:text-mute' : 'text-mute/70 dark:text-mute'}`} />
                <span>{item.label}</span>
              </div>
              {item.id === 'dashboard' && criticalCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white shadow-sm">
                  {criticalCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3.5 border-t border-paper-2 dark:border-paper/25 bg-paper-2/60 dark:bg-ink/40 text-[11px] text-mute/80 dark:text-mute space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-mute/70">GHMC Toll-Free:</span>
          <span className="font-mono text-paper dark:text-paper font-semibold">040-21111111</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-mute/70">Police / SDRF:</span>
          <span className="font-mono text-paper dark:text-paper font-semibold">112 / 100</span>
        </div>
        <div className="pt-2 border-t border-paper-2 dark:border-paper/25 flex items-center justify-between text-[10px] text-mute/70 dark:text-mute">
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
