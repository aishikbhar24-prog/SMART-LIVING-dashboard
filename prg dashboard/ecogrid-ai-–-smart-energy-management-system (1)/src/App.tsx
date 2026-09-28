import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Zap, X } from 'lucide-react';
import {
  fetchDashboardData,
  fetchRooms,
  optimizeRoom,
  optimizeAllRooms,
  fetchAppliances,
  bulkSetAutoControl,
  toggleAutoControl,
  updateAppliance,
  toggleAppliance,
  setFanSpeed,
  fetchEnergyTelemetry,
  fetchEnergyHistory,
  fetchPredictions,
  fetchAnomalies,
  fetchRecommendations,
  applyRecommendation,
  ignoreRecommendation,
  fetchSettings,
  updateSettings,
  fetchAlerts,
  resolveAlert,
  triggerQuickSimulator,
} from './services/api';

import {
  DashboardData,
  Room,
  Appliance,
  SensorTelemetry,
  PredictionSummary,
  Anomaly,
  Recommendation,
  Alert as AlertType,
  SystemSettings,
  OperatingMode,
  OptimizationProgressMap,
  RoomOptimizationProgress,
} from './types';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HackathonDemoBar } from './components/HackathonDemoBar';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { LiveMonitoringView } from './components/LiveMonitoringView';
import { RoomsView } from './components/RoomsView';
import { AppliancesView } from './components/AppliancesView';
import { AIInsightsView } from './components/AIInsightsView';
import { AnalyticsView } from './components/AnalyticsView';
import { CostCalculatorView } from './components/CostCalculatorView';
import { AlertsView } from './components/AlertsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { MLPredictorStudio } from './components/MLPredictorStudio';
import { EcoAIAssistant } from './components/EcoAIAssistant';

export default function App() {
  const [activeView, setActiveView] = useState<string>('landing');
  const [showDemoBar, setShowDemoBar] = useState<boolean>(false);
  const [assistantOpen, setAssistantOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [lastSyncedTimestamp, setLastSyncedTimestamp] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Application Data States
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardData | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [currentTelemetry, setCurrentTelemetry] = useState<SensorTelemetry | null>(null);
  const [history, setHistory] = useState<SensorTelemetry[]>([]);
  const [predictions, setPredictions] = useState<PredictionSummary | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    autoMode: true,
    emptyRoomTimeoutMins: 5,
    tempHighThresholdC: 28,
    acAutoOnAllowed: true,
    tariffRateINR: 8.5,
    mode: 'SIMULATION',
    anomalySensitivityPct: 50,
  });

  // Optimization & Toast Feedback state
  const [optimizingRoomId, setOptimizingRoomId] = useState<string | null>(null);
  const [optimizationProgressMap, setOptimizationProgressMap] = useState<OptimizationProgressMap>({});
  const [toastNotification, setToastNotification] = useState<{ message: string; savedkW?: number } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Helper to construct granular optimization transition steps for a room
  const generateRoomSteps = (room: Room, mode?: string): Omit<RoomOptimizationProgress, 'roomId'>[] => {
    const isShutdown = room.occupancy === 0 || mode === 'FULL_SHUTDOWN';

    if (isShutdown) {
      return [
        {
          stepIndex: 1,
          totalSteps: 5,
          stepText: '🔍 Scanning room occupancy (0 occupants detected)...',
          activeApplianceType: 'general',
          percent: 20,
        },
        {
          stepIndex: 2,
          totalSteps: 5,
          stepText: room.lightsOn > 0 ? `💡 Turning off ${room.lightsOn} active light fixture${room.lightsOn > 1 ? 's' : ''}...` : '💡 Confirming lighting is powered off...',
          activeApplianceType: 'light',
          percent: 40,
        },
        {
          stepIndex: 3,
          totalSteps: 5,
          stepText: room.acsOn > 0 ? '❄️ Powering down AC HVAC compressor...' : '❄️ Verifying AC unit is OFF...',
          activeApplianceType: 'ac',
          percent: 65,
        },
        {
          stepIndex: 4,
          totalSteps: 5,
          stepText: room.fansOn > 0 ? '💨 Stopping ceiling fan motor rotors...' : '💨 Fan state verified OFF...',
          activeApplianceType: 'fan',
          percent: 85,
        },
        {
          stepIndex: 5,
          totalSteps: 5,
          stepText: '⚡ Applying standby low-power profile (0.05 kW)...',
          activeApplianceType: 'general',
          percent: 98,
        },
      ];
    }

    return [
      {
        stepIndex: 1,
        totalSteps: 5,
        stepText: `🔍 Analyzing room telemetry (${room.occupancy} occupants present)...`,
        activeApplianceType: 'general',
        percent: 20,
      },
      {
        stepIndex: 2,
        totalSteps: 5,
        stepText: `💡 Optimizing lighting (dimming to ${Math.ceil(room.lightsCount / 2)} eco lights)...`,
        activeApplianceType: 'light',
        percent: 40,
      },
      {
        stepIndex: 3,
        totalSteps: 5,
        stepText: room.temperature > 27 ? '❄️ Adjusting AC thermostat to 24°C eco setpoint...' : '❄️ AC load optimal (no cooling needed)...',
        activeApplianceType: 'ac',
        percent: 65,
      },
      {
        stepIndex: 4,
        totalSteps: 5,
        stepText: '💨 Regulating ceiling fan speed to 50% efficiency...',
        activeApplianceType: 'fan',
        percent: 85,
      },
      {
        stepIndex: 5,
        totalSteps: 5,
        stepText: '⚡ Re-balancing grid load & energy distribution...',
        activeApplianceType: 'general',
        percent: 98,
      },
    ];
  };

  // Main Data Refresh Function
  const loadAllData = async () => {
    try {
      const [
        dashData,
        roomsData,
        appsData,
        telemData,
        histData,
        predData,
        anomData,
        recData,
        alertsData,
        settingsData,
      ] = await Promise.all([
        fetchDashboardData(),
        fetchRooms(),
        fetchAppliances(),
        fetchEnergyTelemetry(),
        fetchEnergyHistory(),
        fetchPredictions(),
        fetchAnomalies(),
        fetchRecommendations(),
        fetchAlerts(),
        fetchSettings(),
      ]);

      setDashboardMetrics(dashData);
      setRooms(roomsData);
      setAppliances(appsData);
      setCurrentTelemetry(telemData);
      setHistory(histData);
      setPredictions(predData);
      setAnomalies(anomData);
      setRecommendations(recData);
      setAlerts(alertsData);
      setSettings(settingsData);
      setLastSyncedTimestamp(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );

      if (isOfflineMode) {
        setIsOfflineMode(false);
        setToastNotification({
          message: 'Network connectivity restored! Live API & WebSocket sync active.',
        });
      }
    } catch (e) {
      console.error('Data poll error:', e);
      if (!isOfflineMode) {
        setIsOfflineMode(true);
        setToastNotification({
          message: '⚠️ Connection lost! Switched to Cached/Local Mode until connectivity is restored.',
        });
      }
    }
  };

  // Poll data every 3 seconds for real-time live simulation feedback
  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Action Handlers with Granular Progress Transitions
  const handleOptimizeRoom = async (roomId: string, mode?: string) => {
    try {
      setOptimizingRoomId(roomId);
      const targetRoom = rooms.find((r) => r.id === roomId);

      if (targetRoom) {
        const steps = generateRoomSteps(targetRoom, mode);
        for (const step of steps) {
          setOptimizationProgressMap((prev) => ({
            ...prev,
            [roomId]: { ...step, roomId },
          }));
          await new Promise((r) => setTimeout(r, 450));
        }
      }

      const res = await optimizeRoom(roomId, mode);

      setOptimizationProgressMap((prev) => ({
        ...prev,
        [roomId]: {
          roomId,
          stepIndex: 5,
          totalSteps: 5,
          stepText: `✅ Optimized! Reduced load by ~${res.savedkW ?? 0.5} kW`,
          activeApplianceType: 'general',
          percent: 100,
          isComplete: true,
        },
      }));

      setToastNotification({
        message: res.message,
        savedkW: res.savedkW,
      });

      await loadAllData();

      setTimeout(() => {
        setOptimizationProgressMap((prev) => {
          const next = { ...prev };
          delete next[roomId];
          return next;
        });
      }, 2000);
    } catch (err) {
      console.error('Optimize room error:', err);
    } finally {
      setOptimizingRoomId(null);
    }
  };

  const handleOptimizeAllRooms = async () => {
    try {
      setOptimizingRoomId('ALL');

      const roomStepsMap = rooms.map((r) => ({
        room: r,
        steps: generateRoomSteps(r),
      }));

      // Animate progress across all room cards step by step
      for (let stepIdx = 0; stepIdx < 5; stepIdx++) {
        const stepProgressBatch: OptimizationProgressMap = {};
        roomStepsMap.forEach(({ room, steps }) => {
          stepProgressBatch[room.id] = { ...steps[stepIdx], roomId: room.id };
        });
        setOptimizationProgressMap((prev) => ({ ...prev, ...stepProgressBatch }));
        await new Promise((r) => setTimeout(r, 450));
      }

      const res = await optimizeAllRooms();

      const finalProgressBatch: OptimizationProgressMap = {};
      rooms.forEach((r) => {
        finalProgressBatch[r.id] = {
          roomId: r.id,
          stepIndex: 5,
          totalSteps: 5,
          stepText: '✅ Bulk Optimized!',
          activeApplianceType: 'general',
          percent: 100,
          isComplete: true,
        };
      });
      setOptimizationProgressMap(finalProgressBatch);

      setToastNotification({
        message: res.message,
        savedkW: res.totalSavedkW,
      });

      await loadAllData();

      setTimeout(() => {
        setOptimizationProgressMap({});
      }, 2500);
    } catch (err) {
      console.error('Optimize all rooms error:', err);
    } finally {
      setOptimizingRoomId(null);
    }
  };

  const handleToggleAppliance = async (appId: string) => {
    await toggleAppliance(appId);
    loadAllData();
  };

  const handleSetFanSpeed = async (appId: string, speed: number) => {
    await setFanSpeed(appId, speed);
    loadAllData();
  };

  const handleBulkSetAutoControl = async (
    type: 'light' | 'fan' | 'light_fan' | 'all',
    autoControlled: boolean
  ) => {
    const res = await bulkSetAutoControl(type, autoControlled);
    setToastNotification({
      message: res.message,
    });
    loadAllData();
  };

  const handleToggleAutoControl = async (appId: string, autoControlled?: boolean) => {
    await toggleAutoControl(appId, autoControlled);
    loadAllData();
  };

  const handleUpdateAppliance = async (appId: string, updates: Partial<Appliance>) => {
    const res = await updateAppliance(appId, updates);
    setToastNotification({
      message: res.message || 'Appliance updated successfully!',
    });
    loadAllData();
  };

  const handleApplyRecommendation = async (recId: string) => {
    await applyRecommendation(recId);
    loadAllData();
  };

  const handleIgnoreRecommendation = async (recId: string) => {
    await ignoreRecommendation(recId);
    loadAllData();
  };

  const handleResolveAlert = async (alertId: string) => {
    await resolveAlert(alertId);
    loadAllData();
  };

  const handleUpdateSettings = async (newSet: Partial<SystemSettings>) => {
    await updateSettings(newSet);
    loadAllData();
  };

  const handleModeToggle = async (mode: OperatingMode) => {
    await updateSettings({ mode });
    loadAllData();
  };

  const handleAutoModeToggle = async (autoMode: boolean) => {
    await updateSettings({ autoMode });
    loadAllData();
  };

  const handleQuickSimulate = async (action: string) => {
    await triggerQuickSimulator(action);
    loadAllData();
  };

  // If on landing page
  if (activeView === 'landing') {
    return (
      <LandingPage
        onEnterApp={() => setActiveView('dashboard')}
        onOpenDemo={() => {
          setShowDemoBar(true);
          setActiveView('dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header Navigation */}
      <Header
        metrics={dashboardMetrics}
        currentMode={settings.mode}
        onModeToggle={handleModeToggle}
        autoMode={settings.autoMode}
        onAutoModeToggle={handleAutoModeToggle}
        onToggleAssistant={() => setAssistantOpen(!assistantOpen)}
        assistantOpen={assistantOpen}
        onOpenDemo={() => setShowDemoBar(true)}
        onOpenQuickSim={handleQuickSimulate}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
      />

      {/* Hackathon Interactive Demo Presentation Bar */}
      {showDemoBar && (
        <HackathonDemoBar
          onClose={() => setShowDemoBar(false)}
          onRefresh={loadAllData}
        />
      )}

      {/* Cached/Local Mode Persistent Banner */}
      {isOfflineMode && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs font-mono text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0"></span>
            <span className="font-extrabold text-amber-300">CACHED / LOCAL MODE ACTIVE:</span>
            <span>WebSocket connection & API polling failed. System has switched to cached local state until connectivity is restored.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsOfflineMode(false)}
              className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 hover:text-white border border-slate-700 text-[11px]"
            >
              Dismiss
            </button>
            <button
              onClick={loadAllData}
              className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all flex items-center gap-1 shadow-md shadow-amber-500/20 text-[11px]"
            >
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      )}

      {/* Main App Layout (Sidebar + Content) */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeView={activeView}
          onNavigate={(view) => setActiveView(view)}
          anomaliesCount={anomalies.filter((a) => !a.resolved).length}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-[calc(100vh-57px)]">
          {activeView === 'dashboard' && (
            <DashboardView
              metrics={dashboardMetrics}
              rooms={rooms}
              recommendations={recommendations}
              anomalies={anomalies}
              history={history}
              onOptimizeRoom={handleOptimizeRoom}
              onOptimizeAllRooms={handleOptimizeAllRooms}
              optimizingRoomId={optimizingRoomId}
              optimizationProgressMap={optimizationProgressMap}
              onApplyRecommendation={handleApplyRecommendation}
              onNavigate={(v) => setActiveView(v)}
            />
          )}

          {activeView === 'monitoring' && (
            <LiveMonitoringView
              currentTelemetry={currentTelemetry}
              history={history}
            />
          )}

          {activeView === 'rooms' && (
            <RoomsView
              rooms={rooms}
              onOptimizeRoom={handleOptimizeRoom}
              onOptimizeAllRooms={handleOptimizeAllRooms}
              optimizingRoomId={optimizingRoomId}
              optimizationProgressMap={optimizationProgressMap}
            />
          )}

          {activeView === 'appliances' && (
            <AppliancesView
              appliances={appliances}
              rooms={rooms}
              onToggleAppliance={handleToggleAppliance}
              onSetFanSpeed={handleSetFanSpeed}
              onBulkSetAutoControl={handleBulkSetAutoControl}
              onToggleAutoControl={handleToggleAutoControl}
              onUpdateAppliance={handleUpdateAppliance}
            />
          )}

          {activeView === 'insights' && (
            <AIInsightsView
              predictions={predictions}
              anomalies={anomalies}
              recommendations={recommendations}
              onApplyRecommendation={handleApplyRecommendation}
              onIgnoreRecommendation={handleIgnoreRecommendation}
            />
          )}

          {activeView === 'mlstudio' && (
            <MLPredictorStudio
              rooms={rooms}
              predictions={predictions}
            />
          )}

          {activeView === 'analytics' && (
            <AnalyticsView
              rooms={rooms}
              appliances={appliances}
            />
          )}

          {activeView === 'calculator' && (
            <CostCalculatorView
              rooms={rooms}
              currentTariff={settings.tariffRateINR}
              onUpdateTariff={(t) => handleUpdateSettings({ tariffRateINR: t })}
            />
          )}

          {activeView === 'alerts' && (
            <AlertsView
              alerts={alerts}
              onResolveAlert={handleResolveAlert}
            />
          )}

          {activeView === 'reports' && (
            <ReportsView
              metrics={dashboardMetrics}
              rooms={rooms}
              anomalies={anomalies}
              recommendations={recommendations}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}
        </main>
      </div>

      {/* Persistent System Status Footer Indicator */}
      <footer className="bg-slate-950 border-t border-slate-900 py-3 px-6 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold">
              <span className={`w-2 h-2 rounded-full ${isOfflineMode ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`}></span>
              <span className={isOfflineMode ? 'text-amber-400' : 'text-emerald-400'}>
                {isOfflineMode ? 'SYSTEM STATUS: CACHED / LOCAL MODE' : 'SYSTEM STATUS: LIVE SYNC ACTIVE'}
              </span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              Last Synced: <strong className="text-slate-200">{lastSyncedTimestamp}</strong>
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            EcoCampus Intelligent Building OS • 2D Vector Twin & Auto Actuator Engine
          </div>
        </div>
      </footer>

      {/* Toast Notification Banner for Instant Optimization Feedback */}
      {toastNotification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/60 shadow-2xl shadow-emerald-950/50 flex items-center justify-between gap-3 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>AI Optimization Executed</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed font-sans">
                  {toastNotification.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setToastNotification(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating EcoAI Assistant Drawer */}
      <EcoAIAssistant
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onOptimizeRoom={handleOptimizeRoom}
      />
    </div>
  );
}
