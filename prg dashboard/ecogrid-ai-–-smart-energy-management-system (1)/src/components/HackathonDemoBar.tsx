import React, { useState } from 'react';
import { Play, CheckCircle2, ChevronRight, X, Sparkles, ShieldCheck } from 'lucide-react';
import { triggerDemoStep } from '../services/api';

interface HackathonDemoBarProps {
  onClose: () => void;
  onRefresh: () => void;
}

export const HackathonDemoBar: React.FC<HackathonDemoBarProps> = ({ onClose, onRefresh }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const steps = [
    { step: 1, title: '1. Class Occupied', desc: 'Classroom 204 populated with 35 students (1.1 kW)' },
    { step: 2, title: '2. Heat Surge', desc: 'Temp rises to 30.2°C → AC turns ON (2.6 kW load)' },
    { step: 3, title: '3. Students Leave', desc: 'Class empties → Occupancy 0 but 2.6 kW load left ON!' },
    { step: 4, title: '4. AI Auto-Shutoff', desc: 'AI detects empty room & shuts down appliances automatically' },
    { step: 5, title: '5. Savings Verified', desc: 'Dashboard calculates 2.55 kW power saved (~₹216/day)' },
  ];

  const handleRunStep = async (stepNum: number) => {
    setLoading(true);
    try {
      await triggerDemoStep(stepNum);
      setCurrentStep(stepNum);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-emerald-950/90 border-b border-amber-500/40 px-4 py-3 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-amber-300">🎯 Hackathon Interactive Demo Mode</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Judge Workflow
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Click through the 5-step scenario to demonstrate real-time AI sensing, anomaly detection & automated energy savings.
            </p>
          </div>
        </div>

        {/* Steps Controller */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {steps.map((s) => {
            const isCurrent = currentStep === s.step;
            return (
              <button
                key={s.step}
                onClick={() => handleRunStep(s.step)}
                disabled={loading}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isCurrent
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-md shadow-amber-500/20 scale-105'
                    : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-amber-500/50'
                }`}
                title={s.desc}
              >
                <span>{s.title}</span>
                {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
              </button>
            );
          })}

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-auto"
            title="Close Demo Bar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
