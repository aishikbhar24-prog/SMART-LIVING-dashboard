import React from 'react';
import { FileText, Printer, Download, Zap, Leaf, IndianRupee, ShieldCheck } from 'lucide-react';
import { Room, DashboardData, Anomaly, Recommendation } from '../types';

interface ReportsViewProps {
  metrics: DashboardData | null;
  rooms: Room[];
  anomalies: Anomaly[];
  recommendations: Recommendation[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  metrics,
  rooms,
  anomalies,
  recommendations,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const topConsumer = [...rooms].sort((a, b) => b.todayEnergy - a.todayEnergy)[0];

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 print:hidden">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Energy Audit & Sustainability Report</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Formal commercial audit summary with carbon footprint metrics & AI energy recommendations
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Download PDF Report</span>
        </button>
      </div>

      {/* Report Formatted Document */}
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-6 shadow-2xl print:bg-white print:text-black print:p-0 print:border-none">
        {/* Document Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6 print:border-black">
          <div>
            <div className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-emerald-400 print:text-black" />
              <span className="font-extrabold text-2xl tracking-tight">EcoGrid AI</span>
            </div>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-1">Smart Energy Audit & Audit Log Statement</p>
          </div>
          <div className="text-right text-xs text-slate-400 print:text-gray-600 font-mono">
            <div>Date: {new Date().toLocaleDateString()}</div>
            <div>Facility: Central Campus / Building 1</div>
            <div>Report Ref: EG-AUD-2026-881</div>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 print:text-black mb-3">
            1. Executive Energy Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-center">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:border-gray-300 print:bg-gray-50">
              <span className="text-[10px] text-slate-400 print:text-gray-500 block">Total Today Energy</span>
              <span className="text-xl font-bold text-white print:text-black">{metrics?.todayEnergykWh || '38.6'} kWh</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:border-gray-300 print:bg-gray-50">
              <span className="text-[10px] text-slate-400 print:text-gray-500 block">Total Financial Cost</span>
              <span className="text-xl font-bold text-indigo-400 print:text-black">₹{metrics?.todayCostINR || '347'}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:border-gray-300 print:bg-gray-50">
              <span className="text-[10px] text-slate-400 print:text-gray-500 block">CO₂ Reduced</span>
              <span className="text-xl font-bold text-teal-400 print:text-black">{metrics?.co2SavedKg || '14.2'} kg</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:border-gray-300 print:bg-gray-50">
              <span className="text-[10px] text-slate-400 print:text-gray-500 block">Energy Saved %</span>
              <span className="text-xl font-bold text-emerald-400 print:text-black">{metrics?.energySavedPct || '18.7'}%</span>
            </div>
          </div>
        </div>

        {/* Room Energy Consumption Breakdown */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 print:text-black mb-3">
            2. Room-Wise Consumption Audit
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 print:border-gray-300 text-slate-400 print:text-gray-600 font-mono">
                  <th className="py-2">Room Name</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Occupancy</th>
                  <th className="py-2">Energy (kWh)</th>
                  <th className="py-2">Cost (₹)</th>
                  <th className="py-2">Efficiency Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-gray-200 font-mono">
                {rooms.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 font-bold text-white print:text-black">{r.name}</td>
                    <td className="py-2.5 capitalize">{r.type}</td>
                    <td className="py-2.5">{r.occupancy}</td>
                    <td className="py-2.5">{r.todayEnergy} kWh</td>
                    <td className="py-2.5">₹{Math.round(r.todayEnergy * 8.5)}</td>
                    <td className="py-2.5 font-bold text-emerald-400 print:text-black">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Highest Consumer Highlight */}
        {topConsumer && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:border-gray-300 text-xs">
            <h4 className="font-bold text-slate-200 print:text-black mb-1">
              Top Energy Consuming Zone: {topConsumer.name}
            </h4>
            <p className="text-slate-400 print:text-gray-600">
              Accounted for {topConsumer.todayEnergy} kWh today (~₹{Math.round(topConsumer.todayEnergy * 8.5)}). AI recommendations suggest optimizing AC setpoint to reduce cooling peak load.
            </p>
          </div>
        )}

        {/* AI Recommendations Log */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 print:text-black mb-3">
            3. AI Recommendations & Corrective Actions
          </h3>
          <div className="space-y-2 text-xs">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 print:border-gray-300">
                <div className="flex justify-between font-bold text-slate-200 print:text-black">
                  <span>{rec.title}</span>
                  <span className="text-emerald-400 print:text-black">Saving: +₹{rec.estimatedCostSavingMonthly}/mo</span>
                </div>
                <p className="text-slate-400 print:text-gray-600 mt-1">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 print:border-gray-300 text-[11px] text-slate-500 print:text-gray-500 text-center">
          EcoGrid AI Energy Management Platform • Automated Report Generation Engine
        </div>
      </div>
    </div>
  );
};
