import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Building2,
  ToggleLeft,
  BrainCircuit,
  BarChart3,
  Calculator,
  Bell,
  FileText,
  Settings,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  anomaliesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, anomaliesCount }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Live Monitoring', icon: Activity },
    { id: 'rooms', label: 'Rooms & Floor Map', icon: Building2 },
    { id: 'appliances', label: 'Appliances', icon: ToggleLeft },
    { id: 'insights', label: 'AI Insights', icon: BrainCircuit },
    { id: 'mlstudio', label: 'ML Predictor Studio', icon: BrainCircuit, highlight: true },
    { id: 'analytics', label: 'Energy Analytics', icon: BarChart3 },
    { id: 'calculator', label: 'Cost Calculator', icon: Calculator },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: anomaliesCount },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings & Hardware', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col justify-between shrink-0 hidden md:flex min-h-[calc(100vh-57px)] p-4">
      <div className="space-y-4">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-2 py-1 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <Zap className="h-4 w-4 text-slate-950 fill-slate-950" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
              EcoGrid <span className="text-emerald-400">AI</span>
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              SMART ENERGY v2.4
            </p>
          </div>
        </div>

        <div className="h-px w-full bg-slate-800/80 my-2" />

        <div className="px-2 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
          SYSTEM NAVIGATION
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono text-emerald-500/60">
                    {isActive ? '■' : '□'}
                  </span>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Box */}
      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-2 mt-4">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          System Status
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono text-emerald-400 font-semibold">SIMULATION ACTIVE</span>
        </div>
        <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 w-[87%]" />
        </div>
        <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>EFFICIENCY score</span>
          <span className="text-emerald-400 font-bold">87/100</span>
        </div>
      </div>
    </aside>
  );
};
