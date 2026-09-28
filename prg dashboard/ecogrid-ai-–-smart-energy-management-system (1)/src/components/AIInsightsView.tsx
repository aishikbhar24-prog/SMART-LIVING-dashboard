import React from 'react';
import {
  BrainCircuit,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Clock,
  BarChart2,
  Cpu,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PredictionSummary, Anomaly, Recommendation } from '../types';

interface AIInsightsViewProps {
  predictions: PredictionSummary | null;
  anomalies: Anomaly[];
  recommendations: Recommendation[];
  onApplyRecommendation: (id: string) => void;
  onIgnoreRecommendation: (id: string) => void;
}

export const AIInsightsView: React.FC<AIInsightsViewProps> = ({
  predictions,
  anomalies,
  recommendations,
  onApplyRecommendation,
  onIgnoreRecommendation,
}) => {
  const activeRecs = recommendations.filter((r) => !r.applied && !r.ignored);
  const activeAnomalies = anomalies.filter((a) => !a.resolved);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 border border-indigo-500/30">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
            <span>Energy Intelligence Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Machine Learning predictive models, Isolation Forest anomaly detection & explainable recommendations
          </p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>ML Models: Active (Accuracy 94.8%)</span>
        </div>
      </div>

      {/* Prediction Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Next Hour Forecast</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {predictions ? predictions.nextHourkWh : '12.4'}{' '}
            <span className="text-xs text-slate-400 font-normal">kWh</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Based on hourly occupancy model</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Today's Total Forecast</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {predictions ? predictions.todayTotalForecastkWh : '42.5'}{' '}
            <span className="text-xs text-slate-400 font-normal">kWh</span>
          </div>
          <p className="text-[10px] text-emerald-400 mt-1">On track for 18.7% savings</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Tomorrow's Expected Usage</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-2">
            {predictions ? predictions.tomorrowForecastkWh : '47.8'}{' '}
            <span className="text-xs text-slate-400 font-normal">kWh</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Predicted cost: ~₹406</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Next 7 Days Forecast</span>
            <BarChart2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400 font-mono mt-2">
            {predictions ? predictions.next7DaysTotalForecastkWh : '312.0'}{' '}
            <span className="text-xs text-slate-400 font-normal">kWh</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Weekly baseline estimation</p>
        </div>
      </div>

      {/* Actual vs Predicted Graph */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Machine Learning Model Performance: Actual vs Predicted</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison between real IoT energy readings and ML regression predictions
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={predictions?.actualVsPredictedHistory || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Line type="monotone" dataKey="actualkWh" name="Actual Energy (kW)" stroke="#10b981" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="predictedkWh" name="ML Predicted (kW)" stroke="#818cf8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Isolation Forest Anomaly Detection Section */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Isolation Forest Anomaly Detection Engine</span>
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {activeAnomalies.length} Active Anomalies
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {anomalies.map((anom) => (
            <div
              key={anom.id}
              className={`p-4 rounded-xl bg-slate-950 border transition-all ${
                anom.resolved ? 'border-slate-800 opacity-60' : 'border-rose-500/50 bg-rose-950/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{anom.roomName}</h4>
                  <span className="text-[10px] text-slate-400">Logged: {new Date(anom.timestamp).toLocaleTimeString()}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    anom.resolved
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : anom.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {anom.resolved ? 'Resolved' : anom.severity}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 my-2 py-2 px-3 bg-slate-900/80 rounded-lg text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">Current Power</span>
                  <span className="font-bold text-rose-400">{anom.currentPowerkW} kW</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Normal Baseline</span>
                  <span className="font-bold text-emerald-400">{anom.normalPowerkW} kW</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-2">
                <strong className="text-slate-100">Root Cause:</strong> {anom.possibleReason}
              </p>
              <p className="text-xs text-amber-300 mt-1">
                <strong className="text-amber-200">Recommended Action:</strong> {anom.recommendedAction}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Recommendations List */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Explainable AI Energy Saving Opportunities</span>
        </h3>

        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-4 rounded-xl bg-slate-950 border transition-all ${
                rec.applied
                  ? 'border-emerald-500/40 bg-emerald-950/10'
                  : rec.ignored
                  ? 'border-slate-800 opacity-50'
                  : 'border-slate-800 hover:border-indigo-500/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">{rec.title}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      {rec.roomName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{rec.reason}</p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-emerald-400">+₹{rec.estimatedCostSavingMonthly}/mo</div>
                    <div className="text-[10px] text-slate-400">-{rec.expectedEnergySavingkWhDay} kWh/day</div>
                  </div>

                  {!rec.applied && !rec.ignored && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onApplyRecommendation(rec.id)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Apply</span>
                      </button>
                      <button
                        onClick={() => onIgnoreRecommendation(rec.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        title="Ignore"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {rec.applied && (
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Applied ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
