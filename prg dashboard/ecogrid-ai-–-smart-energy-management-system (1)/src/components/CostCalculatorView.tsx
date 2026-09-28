import React, { useState } from 'react';
import { Calculator, IndianRupee, TrendingDown, Save, Sparkles, CheckCircle2 } from 'lucide-react';
import { Room } from '../types';

interface CostCalculatorViewProps {
  rooms: Room[];
  currentTariff: number;
  onUpdateTariff: (tariff: number) => void;
}

export const CostCalculatorView: React.FC<CostCalculatorViewProps> = ({
  rooms,
  currentTariff,
  onUpdateTariff,
}) => {
  const [tariffInput, setTariffInput] = useState(currentTariff.toString());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const totalTodayEnergy = rooms.reduce((acc, r) => acc + r.todayEnergy, 0);
  const tariffVal = Number(tariffInput) || 8.5;

  const currentDailyCost = Math.round(totalTodayEnergy * tariffVal);
  const currentMonthlyCost = currentDailyCost * 30;
  const potentialOptimizedMonthlyCost = Math.round(currentMonthlyCost * 0.813); // 18.7% savings
  const estimatedMonthlySavings = currentMonthlyCost - potentialOptimizedMonthlyCost;

  const handleSaveTariff = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTariff(tariffVal);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-indigo-400" />
          <span>Electricity Tariff & Financial Cost Engine</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure commercial tariffs (₹/kWh) to project daily/monthly expenses and AI savings ROI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tariff Configuration Form */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
            <IndianRupee className="w-4 h-4 text-emerald-400" />
            <span>Tariff Rate Configuration</span>
          </h3>

          <form onSubmit={handleSaveTariff} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Electricity Tariff Rate (₹ per kWh)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="50"
                  value={tariffInput}
                  onChange={(e) => setTariffInput(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Standard commercial tariff: ₹8.0 - ₹12.0 / kWh</p>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Update System Tariff</span>
            </button>

            {savedSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold text-center flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tariff updated successfully!</span>
              </div>
            )}
          </form>
        </div>

        {/* Cost Projections */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Monthly Expense & Savings Forecast</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-sans">Current Monthly Cost</span>
              <span className="text-2xl font-black text-white">₹{currentMonthlyCost.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block mt-1 font-sans">Based on {totalTodayEnergy.toFixed(1)} kWh/day</span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-sans">Potential Optimized Cost</span>
              <span className="text-2xl font-black text-emerald-400">₹{potentialOptimizedMonthlyCost.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-400 block mt-1 font-sans">With EcoGrid AI Auto-Mode</span>
            </div>

            <div className="p-4 bg-gradient-to-br from-emerald-950/60 to-slate-950 rounded-xl border border-emerald-500/40">
              <span className="text-xs text-emerald-300 block font-sans font-bold">Estimated Savings</span>
              <span className="text-2xl font-black text-amber-300">₹{estimatedMonthlySavings.toLocaleString()}</span>
              <span className="text-[10px] text-amber-300 block mt-1 font-sans">₹/month saved</span>
            </div>
          </div>

          {/* Room Cost Attribution List */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-300 mb-2">Room-Wise Daily Cost Attribution</h4>
            <div className="space-y-2">
              {rooms.map((r) => {
                const roomDailyCost = Math.round(r.todayEnergy * tariffVal);
                return (
                  <div key={r.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <span className="font-semibold text-slate-200">{r.name}</span>
                    <div className="flex items-center space-x-4 font-mono">
                      <span className="text-slate-400">{r.todayEnergy} kWh</span>
                      <span className="font-bold text-emerald-400">₹{roomDailyCost} / day</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
