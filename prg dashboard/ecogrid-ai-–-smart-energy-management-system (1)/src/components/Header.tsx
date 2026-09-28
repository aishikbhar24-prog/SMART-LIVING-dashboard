import React from 'react';
import {
  Zap,
  Activity,
  Bot,
  Sliders,
  Sparkles,
  PlayCircle,
  Bell,
  Sun,
  Moon,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { DashboardData, OperatingMode } from '../types';

interface HeaderProps {
  metrics: DashboardData | null;
  currentMode: OperatingMode;
  onModeToggle: (mode: OperatingMode) => void;
  autoMode: boolean;
  onAutoModeToggle: (enabled: boolean) => void;
  onToggleAssistant: () => void;
  assistantOpen: boolean;
  onOpenDemo: () => void;
  onOpenQuickSim: (action: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  currentMode,
  onModeToggle,
  autoMode,
  onAutoModeToggle,
  onToggleAssistant,
  assistantOpen,
  onOpenDemo,
  onOpenQuickSim,
  theme,
  onToggleTheme,
  activeView,
  onNavigate,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/30 backdrop-blur-md px-6 py-2 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
        {/* Technical Metric Readouts & Brand */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Zap className="h-4 w-4 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                EcoGrid <span className="text-emerald-400">AI</span>
              </h1>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Key Metrics Header Bar */}
          <div className="hidden lg:flex items-center gap-6 text-xs">
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                Current Load
              </div>
              <div className="text-sm font-mono text-white font-bold">
                {metrics ? metrics.currentPowerkW : '12.84'} <span className="text-slate-500 text-xs font-normal">kW</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                Today Cost
              </div>
              <div className="text-sm font-mono text-white font-bold">
                ₹{metrics ? metrics.todayCostINR : '347.20'}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                AI Optimization
              </div>
              <div className="text-sm font-mono text-emerald-400 font-bold">
                +{metrics ? metrics.energySavedPct : '18.7'}%
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions & Mode Controls */}
        <div className="flex items-center gap-2.5">
          {/* Mode Switcher */}
          <div className="hidden sm:flex items-center bg-slate-950/80 p-1 rounded-full border border-slate-800 text-xs">
            <button
              onClick={() => onModeToggle('LIVE')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full font-mono text-[11px] font-semibold transition-all ${
                currentMode === 'LIVE'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>LIVE</span>
            </button>
            <button
              onClick={() => onModeToggle('SIMULATION')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full font-mono text-[11px] font-semibold transition-all ${
                currentMode === 'SIMULATION'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>SIM</span>
            </button>
          </div>

          {/* Hackathon Demo Pill Button */}
          <button
            onClick={onOpenDemo}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950/30 transition-all transform active:scale-95"
            title="Launch interactive presentation workflow for judges"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Hackathon Demo</span>
          </button>

          {/* Quick Simulation Actions */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800 text-[11px] text-slate-300">
            <span className="text-[10px] font-mono text-slate-500 uppercase px-1">Sim:</span>
            <button
              onClick={() => onOpenQuickSim('EMPTY_ROOM_204')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-mono"
            >
              Empty Waste
            </button>
            <button
              onClick={() => onOpenQuickSim('HIGH_ANOMALY')}
              className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors font-mono"
            >
              Spike
            </button>
          </div>

          {/* AUTO CONTROL Switch */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800 text-xs">
            <ShieldCheck className={`w-3.5 h-3.5 ${autoMode ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span className="font-mono text-[11px] font-bold text-slate-300 hidden md:inline">AUTO</span>
            <button
              onClick={() => onAutoModeToggle(!autoMode)}
              className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border border-slate-700 transition-colors duration-200 ease-in-out focus:outline-none ${
                autoMode ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                  autoMode ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* EcoAI Assistant Drawer Toggle */}
          <button
            onClick={onToggleAssistant}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              assistantOpen
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline text-xs font-medium">EcoAI Chat</span>
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
          </button>

          {/* Alerts Counter */}
          <button
            onClick={() => onNavigate('alerts')}
            className="relative p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Alerts Center"
          >
            <Bell className="w-4 h-4" />
            {metrics && metrics.activeAnomaliesCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-mono font-bold text-white ring-2 ring-slate-950">
                {metrics.activeAnomaliesCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
