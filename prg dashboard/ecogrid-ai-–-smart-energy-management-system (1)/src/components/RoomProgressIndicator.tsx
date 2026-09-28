import React from 'react';
import { Lightbulb, Fan, AirVent, Tv, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { RoomOptimizationProgress } from '../types';

interface RoomProgressIndicatorProps {
  progress: RoomOptimizationProgress;
  compact?: boolean;
}

export const RoomProgressIndicator: React.FC<RoomProgressIndicatorProps> = ({ progress, compact = false }) => {
  const renderApplianceIcon = () => {
    if (progress.isComplete) {
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
    switch (progress.activeApplianceType) {
      case 'light':
        return <Lightbulb className="w-3.5 h-3.5 text-amber-400 animate-bounce shrink-0" />;
      case 'ac':
        return <AirVent className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />;
      case 'fan':
        return <Fan className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />;
      case 'projector':
        return <Tv className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />;
      default:
        return <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />;
    }
  };

  if (compact) {
    return (
      <div className="p-2 rounded-lg bg-slate-950/90 border border-emerald-500/40 shadow-inner my-1 space-y-1.5 font-mono text-[10px]">
        <div className="flex items-center justify-between text-emerald-300">
          <div className="flex items-center gap-1.5 truncate">
            {renderApplianceIcon()}
            <span className="truncate font-semibold">{progress.stepText}</span>
          </div>
          <span className="font-bold shrink-0">{progress.percent}%</span>
        </div>
        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-xl bg-slate-950/90 border border-emerald-500/50 shadow-lg shadow-emerald-950/30 my-2 space-y-2 font-mono">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-emerald-300 font-medium truncate">
          {renderApplianceIcon()}
          <span className="truncate font-bold">{progress.stepText}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className="text-[10px] text-slate-400">Step {progress.stepIndex}/{progress.totalSteps}</span>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
            {progress.percent}%
          </span>
        </div>
      </div>

      {/* Animated Glowing Progress Bar */}
      <div className="w-full bg-slate-800/90 h-1.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
        <div
          className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
};
