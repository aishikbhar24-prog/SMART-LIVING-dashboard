import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  Gauge,
  Thermometer,
  Droplets,
  Users,
  Radio,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SensorTelemetry } from '../types';

interface LiveMonitoringViewProps {
  currentTelemetry: SensorTelemetry | null;
  history: SensorTelemetry[];
}

export const LiveMonitoringView: React.FC<LiveMonitoringViewProps> = ({
  currentTelemetry,
  history,
}) => {
  const [liveStream, setLiveStream] = useState<SensorTelemetry[]>([]);

  useEffect(() => {
    if (history.length > 0) {
      setLiveStream(history.slice(-15));
    }
  }, [history]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span>Real-Time IoT Telemetry Stream</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous sub-second voltage, current, power factor & environmental sensor monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-slate-300">Live IoT Mode Active</span>
        </div>
      </div>

      {/* Sensor Gauge Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Voltage */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 font-mono">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Grid Voltage</span>
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {currentTelemetry ? currentTelemetry.voltageV : 221}
            <span className="text-xs text-slate-400 font-normal ml-1">V</span>
          </div>
          <p className="text-[10px] text-emerald-400 mt-1">Normal Range (220V±5%)</p>
        </div>

        {/* Current */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 font-mono">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Grid Current</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {currentTelemetry ? currentTelemetry.currentA : 58.2}
            <span className="text-xs text-slate-400 font-normal ml-1">A</span>
          </div>
          <p className="text-[10px] text-amber-400 mt-1">Phase Balanced</p>
        </div>

        {/* Power Factor */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 font-mono">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Power Factor</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {currentTelemetry ? currentTelemetry.powerFactor : 0.95}
          </div>
          <p className="text-[10px] text-emerald-400 mt-1">High Efficiency</p>
        </div>

        {/* Temperature */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 font-mono">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Avg Temperature</span>
            <Thermometer className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {currentTelemetry ? currentTelemetry.avgTemperatureC : 26.2}
            <span className="text-xs text-slate-400 font-normal ml-1">°C</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Comfort Zone</p>
        </div>

        {/* Humidity */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 font-mono">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Avg Humidity</span>
            <Droplets className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {currentTelemetry ? currentTelemetry.avgHumidityPct : 56}
            <span className="text-xs text-slate-400 font-normal ml-1">%</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Optimal Climate</p>
        </div>

        {/* Occupancy */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 font-mono">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Occupancy</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400">
            {currentTelemetry ? currentTelemetry.totalOccupancy : 57}
          </div>
          <p className="text-[10px] text-indigo-400 mt-1">Active People</p>
        </div>
      </div>

      {/* Waveform Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Power & Voltage Waveform */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-1">Power Load vs Grid Voltage</h3>
          <p className="text-xs text-slate-400 mb-4">Real-time load fluctuations (kW) against voltage stability (V)</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={liveStream}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="power" stroke="#10b981" fontSize={11} />
                <YAxis yAxisId="voltage" orientation="right" stroke="#06b6d4" fontSize={11} domain={[210, 230]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Line yAxisId="power" type="monotone" dataKey="totalPowerkW" name="Power (kW)" stroke="#10b981" strokeWidth={2.5} dot={false} />
                <Line yAxisId="voltage" type="monotone" dataKey="voltageV" name="Voltage (V)" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature & Occupancy Sync Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-1">Temperature vs Room Occupancy</h3>
          <p className="text-xs text-slate-400 mb-4">Correlation between thermal load (°C) and occupant headcount</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={liveStream}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="temp" stroke="#f43f5e" fontSize={11} domain={[20, 35]} />
                <YAxis yAxisId="occ" orientation="right" stroke="#818cf8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Line yAxisId="temp" type="monotone" dataKey="avgTemperatureC" name="Temp (°C)" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
                <Line yAxisId="occ" type="monotone" dataKey="totalOccupancy" name="Occupants" stroke="#818cf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
