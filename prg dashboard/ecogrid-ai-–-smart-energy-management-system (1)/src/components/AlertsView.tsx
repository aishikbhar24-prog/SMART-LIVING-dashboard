import React, { useState } from 'react';
import { Bell, ShieldAlert, AlertTriangle, CheckCircle2, Info, Sparkles, Check } from 'lucide-react';
import { Alert } from '../types';

interface AlertsViewProps {
  alerts: Alert[];
  onResolveAlert: (id: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ alerts, onResolveAlert }) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredAlerts = alerts.filter((a) => {
    if (filterType === 'ALL') return true;
    return a.type === filterType;
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'CRITICAL':
        return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'OPTIMIZATION':
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
      default:
        return <Info className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <span>Alert & Anomaly Notification Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time critical waste alerts, system warnings, and AI optimization log
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {['ALL', 'CRITICAL', 'WARNING', 'OPTIMIZATION', 'INFO'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterType === t ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-2xl bg-slate-900/80 border transition-all ${
              alert.resolved
                ? 'border-slate-800/60 opacity-60'
                : alert.type === 'CRITICAL'
                ? 'border-rose-500/50 bg-rose-950/10'
                : alert.type === 'WARNING'
                ? 'border-amber-500/40 bg-amber-950/10'
                : 'border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                  {getAlertIcon(alert.type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white">{alert.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        alert.type === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : alert.type === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {alert.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alert.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {!alert.resolved && (
                <button
                  onClick={() => onResolveAlert(alert.id)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0 transition-colors"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mark Resolved</span>
                </button>
              )}

              {alert.resolved && (
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-950 text-slate-400 border border-slate-800 shrink-0">
                  Resolved ✓
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
