import React from 'react';
import {
  Zap,
  Battery,
  IndianRupee,
  Leaf,
  TrendingDown,
  AlertTriangle,
  BrainCircuit,
  ArrowUpRight,
  ShieldAlert,
  Building2,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardData, Room, Recommendation, Anomaly, SensorTelemetry, OptimizationProgressMap } from '../types';
import { RoomProgressIndicator } from './RoomProgressIndicator';

interface DashboardViewProps {
  metrics: DashboardData | null;
  rooms: Room[];
  recommendations: Recommendation[];
  anomalies: Anomaly[];
  history: SensorTelemetry[];
  onOptimizeRoom: (roomId: string, mode?: string) => void;
  onOptimizeAllRooms?: () => void;
  optimizingRoomId?: string | null;
  optimizationProgressMap?: OptimizationProgressMap;
  onApplyRecommendation: (recId: string) => void;
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  rooms,
  recommendations,
  anomalies,
  history,
  onOptimizeRoom,
  onOptimizeAllRooms,
  optimizingRoomId,
  optimizationProgressMap = {},
  onApplyRecommendation,
  onNavigate,
}) => {
  const activeAnomalies = anomalies.filter((a) => !a.resolved);
  const activeRecs = recommendations.filter((r) => !r.applied && !r.ignored);

  return (
    <div className="space-y-6">
      {/* Active Anomaly Banner if waste is detected */}
      {activeAnomalies.length > 0 && (
        <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/30 ring-1 ring-rose-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-500 text-slate-950 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300">
                  🔴 Energy Waste Anomaly Detected
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  CRITICAL
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {activeAnomalies[0].roomName} is consuming <span className="font-mono font-bold text-rose-400">{activeAnomalies[0].currentPowerkW} kW</span> despite zero occupancy. {activeAnomalies[0].possibleReason}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOptimizeRoom(activeAnomalies[0].roomId)}
            disabled={optimizingRoomId === activeAnomalies[0].roomId}
            className="px-4 py-2 rounded-md text-xs font-mono font-bold bg-rose-500 hover:bg-rose-400 text-slate-950 shrink-0 transition-all uppercase flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
          >
            {optimizingRoomId === activeAnomalies[0].roomId ? (
              <span>Optimizing...</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                <span>Optimize {activeAnomalies[0].roomName}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Top Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Current Power */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Current Power</span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl lg:text-3xl font-mono font-bold text-white">
              {metrics ? metrics.currentPowerkW : '12.84'}
            </span>
            <span className="text-xs font-mono text-slate-500">kW</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <span>● Real-time IoT load</span>
          </div>
        </div>

        {/* Today's Energy */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Today's Energy</span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
              <Battery className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl lg:text-3xl font-mono font-bold text-white">
              {metrics ? metrics.todayEnergykWh : '38.6'}
            </span>
            <span className="text-xs font-mono text-slate-500">kWh</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-400">
            Cumulative today
          </div>
        </div>

        {/* Today's Cost */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Today's Cost</span>
            <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl lg:text-3xl font-mono font-bold text-white">
              ₹{metrics ? metrics.todayCostINR : '347'}
            </span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-400">
            Tariff: ₹{metrics?.tariffRateINR || 8.5}/kWh
          </div>
        </div>

        {/* CO2 Reduced */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">CO₂ Offset</span>
            <div className="p-1.5 rounded-md bg-teal-500/10 text-teal-400">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl lg:text-3xl font-mono font-bold text-white">
              {metrics ? metrics.co2SavedKg : '14.2'}
            </span>
            <span className="text-xs font-mono text-slate-500">kg</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-teal-400">
            🌱 Carbon avoided
          </div>
        </div>

        {/* Energy Saved % */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 relative overflow-hidden col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">AI Optimization</span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl lg:text-3xl font-mono font-bold text-emerald-400">
              +{metrics ? metrics.energySavedPct : '18.7'}%
            </span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-emerald-400">
            Score: {metrics?.sustainabilityScore || 87}/100
          </div>
        </div>
      </div>

      {/* Main Graph & AI Recommendations Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-Time Power Consumption Graph */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold mb-1">
                TELEMETRY FEED
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Power Consumption Curve</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  LIVE 1s
                </span>
              </h3>
            </div>
            <button
              onClick={() => onNavigate('monitoring')}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>Waveforms</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={10} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#34d399', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}
                  formatter={(val: number) => [`${val} kW`, 'Power Load']}
                />
                <Area type="monotone" dataKey="totalPowerkW" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#powerGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Recommendations Panel */}
        <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold mb-2">
              AI DECISION ENGINE
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-emerald-400" />
                <span>Smart Recommendations</span>
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {activeRecs.length} QUEUED
              </span>
            </div>

            <div className="space-y-3">
              {activeRecs.slice(0, 3).map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-white">{rec.title}</h4>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0">
                      +₹{rec.estimatedCostSavingMonthly}/mo
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{rec.reason}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-slate-400">{rec.roomName}</span>
                    <button
                      onClick={() => onApplyRecommendation(rec.id)}
                      className="px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors"
                    >
                      EXECUTE
                    </button>
                  </div>
                </div>
              ))}

              {activeRecs.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800 font-mono">
                  <Sparkles className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  All AI optimizations active. Maximum grid efficiency achieved.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('insights')}
            className="w-full mt-4 py-2 rounded-lg text-xs font-mono font-bold uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
          >
            Open Intelligence Center →
          </button>
        </div>
      </div>

      {/* Room Status Twin Highlights */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold mb-1">
              DIGITAL TWIN MATRIX
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Building Rooms Status</span>
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {onOptimizeAllRooms && (
              <button
                onClick={onOptimizeAllRooms}
                disabled={optimizingRoomId === 'ALL'}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Optimize All Rooms</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('rooms')}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Floor Map →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const isWaste = room.status === 'WASTE_DETECTED';
            const isEfficient = room.status === 'EFFICIENT' || room.status === 'EMPTY';
            const progress = optimizationProgressMap[room.id];
            const isOptimizing = optimizingRoomId === room.id || optimizingRoomId === 'ALL' || Boolean(progress);

            return (
              <div
                key={room.id}
                className={`p-4 rounded-xl transition-all ${
                  progress
                    ? 'p-4 bg-emerald-950/30 rounded-xl border border-emerald-500/50 ring-1 ring-emerald-500/30'
                    : isWaste
                    ? 'p-4 bg-rose-500/5 rounded-xl border border-rose-500/30 ring-1 ring-rose-500/20'
                    : 'p-4 bg-slate-800/40 rounded-xl border border-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-white">{room.name}</h4>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      progress
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                        : isWaste
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : isEfficient
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {progress ? '⚡ OPTIMIZING...' : isWaste ? '🔴 WASTE' : isEfficient ? 'EFFICIENT' : 'MODERATE'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 text-center text-xs bg-slate-900/80 rounded-md my-2 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Occ</span>
                    <span className="font-bold text-slate-200">{room.occupancy}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Temp</span>
                    <span className="font-bold text-slate-200">{room.temperature}°C</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Load</span>
                    <span className="font-bold text-amber-400">{room.currentPower} kW</span>
                  </div>
                </div>

                {progress && <RoomProgressIndicator progress={progress} compact />}

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                  <span className="font-mono text-[10px]">
                    L:{room.lightsOn}/{room.lightsCount} • F:{room.fansOn}/{room.fansCount} • AC:{room.acsOn}/{room.acsCount}
                  </span>
                  <button
                    onClick={() => onOptimizeRoom(room.id)}
                    disabled={isOptimizing}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors flex items-center gap-1 ${
                      isWaste
                        ? 'bg-rose-500 text-slate-950 hover:bg-rose-400'
                        : isEfficient
                        ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                        : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    }`}
                  >
                    {isOptimizing ? '...' : isEfficient ? '✓ Efficient' : 'Optimize'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
