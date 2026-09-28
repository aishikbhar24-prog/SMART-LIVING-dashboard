import React, { useState } from 'react';
import {
  Zap,
  Activity,
  BrainCircuit,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Building2,
  Cpu,
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onOpenDemo }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('admin@ecogrid.ai');
  const [password, setPassword] = useState('••••••••');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEnterApp();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">EcoGrid AI</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Enterprise IoT
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onEnterApp}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 max-w-7xl mx-auto text-center overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-xs font-semibold text-emerald-400 mb-8 shadow-inner">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>Next-Generation Building Energy Management System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight">
          Power Smarter. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Waste Less.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          An AI-powered energy management platform that monitors IoT sensor data, predicts future consumption,
          detects power anomalies, and automatically optimizes electricity usage across classrooms, labs, and homes.
        </p>

        {/* Call to Actions */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onEnterApp}
            className="flex items-center space-x-2.5 px-6 py-3.5 rounded-xl text-base font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
          >
            <span>Launch Live System</span>
            <Zap className="w-5 h-5 fill-slate-950" />
          </button>
          <button
            onClick={onOpenDemo}
            className="flex items-center space-x-2.5 px-6 py-3.5 rounded-xl text-base font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 shadow-xl transition-all transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>View Hackathon Demo</span>
          </button>
        </div>

        {/* Statistics Bar */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur">
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">18.7%</div>
            <div className="text-sm font-semibold text-slate-200 mt-1">Average Energy Saved</div>
            <p className="text-xs text-slate-400 mt-1">Through automated AI occupancy response</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur">
            <div className="text-3xl font-extrabold text-amber-400 font-mono">₹1,530 / mo</div>
            <div className="text-sm font-semibold text-slate-200 mt-1">Estimated Cost Reduction</div>
            <p className="text-xs text-slate-400 mt-1">Average per classroom / laboratory</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur">
            <div className="text-3xl font-extrabold text-cyan-400 font-mono">24/7 AI</div>
            <div className="text-sm font-semibold text-slate-200 mt-1">Continuous Monitoring</div>
            <p className="text-xs text-slate-400 mt-1">Isolation Forest anomaly detection</p>
          </div>
        </div>
      </section>

      {/* Visual Workflow Section */}
      <section className="px-6 py-16 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">How EcoGrid AI Works</h2>
            <p className="text-sm text-slate-400 mt-2">
              From IoT hardware sensors to automated appliance control, our full-stack system guarantees real-time energy efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 mb-3">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-200 text-sm">1. Sense</h3>
              <p className="text-xs text-slate-400 mt-1">ESP32 + PIR occupancy, temperature & power sensors</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center">
              <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 mb-3">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-200 text-sm">2. Analyze</h3>
              <p className="text-xs text-slate-400 mt-1">Real-time telemetry streaming & power factor analytics</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 mb-3">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-200 text-sm">3. Predict</h3>
              <p className="text-xs text-slate-400 mt-1">Machine Learning forecast & anomaly identification</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-200 text-sm">4. Automate</h3>
              <p className="text-xs text-slate-400 mt-1">Zero-occupancy auto-shutoff & smart AC regulation</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 mb-3">
                <TrendingDown className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-200 text-sm">5. Save</h3>
              <p className="text-xs text-slate-400 mt-1">Quantified electricity bill & CO₂ carbon footprint reduction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 text-center text-xs text-slate-500 border-t border-slate-900">
        EcoGrid AI – Smart Energy Management Platform • Built for Hackathons & Commercial Smart Buildings
      </footer>

      {/* Login Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Sign In to EcoGrid AI</h3>
                <p className="text-xs text-slate-400">Enter system credentials to access building controls</p>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
                >
                  Sign In & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
