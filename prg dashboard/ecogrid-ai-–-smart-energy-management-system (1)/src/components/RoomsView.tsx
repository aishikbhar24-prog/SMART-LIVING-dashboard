import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Thermometer,
  Zap,
  Lightbulb,
  Fan,
  AirVent,
  Tv,
  Sparkles,
  Loader2,
  Check,
  ShieldCheck,
  Power,
  Clock,
  Calendar,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Sliders,
  CheckCircle2,
  Info,
  Map,
  LayoutGrid,
} from 'lucide-react';
import { Room, OptimizationProgressMap, ScheduleOverride } from '../types';
import { RoomProgressIndicator } from './RoomProgressIndicator';
import { BuildingFloorPlan } from './BuildingFloorPlan';
import { fetchSchedules, createSchedule, toggleSchedule, deleteSchedule } from '../services/api';

interface RoomsViewProps {
  rooms: Room[];
  onOptimizeRoom: (roomId: string, mode?: string) => void;
  onOptimizeAllRooms: () => void;
  optimizingRoomId?: string | null;
  optimizationProgressMap?: OptimizationProgressMap;
}

export const RoomsView: React.FC<RoomsViewProps> = ({
  rooms,
  onOptimizeRoom,
  onOptimizeAllRooms,
  optimizingRoomId,
  optimizationProgressMap = {},
}) => {
  const [activeTab, setActiveTab] = useState<'TWIN' | 'SCHEDULER'>('TWIN');
  const [twinViewMode, setTwinViewMode] = useState<'MAP' | 'GRID'>('MAP');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Automation Scheduler State
  const [schedules, setSchedules] = useState<ScheduleOverride[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState<string | null>(null);

  // Form State for New Schedule
  const [formRoomId, setFormRoomId] = useState<string>(rooms[0]?.id || '');
  const [formTitle, setFormTitle] = useState('');
  const [formAction, setFormAction] = useState<ScheduleOverride['action']>('KEEP_AC_ON');
  const [formStartTime, setFormStartTime] = useState('16:00');
  const [formEndTime, setFormEndTime] = useState('18:00');
  const [formDays, setFormDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const loadSchedules = async () => {
    try {
      setLoadingSchedules(true);
      const data = await fetchSchedules();
      setSchedules(data);
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoadingSchedules(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const wasteCount = rooms.filter((r) => r.status === 'WASTE_DETECTED').length;
  const efficientCount = rooms.filter((r) => r.status === 'EFFICIENT' || r.status === 'EMPTY').length;
  const activeSchedulesCount = schedules.filter((s) => s.active).length;

  const handleCreateScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRoomId) return;

    try {
      setSubmitting(true);
      const targetRoom = rooms.find((r) => r.id === formRoomId);

      let defaultLabel = 'Keep AC ON during scheduled time';
      if (formAction === 'FORCE_SHUTDOWN') defaultLabel = 'Force equipment shutdown after hours';
      if (formAction === 'PRE_COOL') defaultLabel = 'Pre-cool AC before room occupancy';
      if (formAction === 'KEEP_LIGHTS_ON') defaultLabel = 'Keep lights ON for study hours';

      const res = await createSchedule({
        roomId: formRoomId,
        title: formTitle || `${targetRoom?.name || 'Room'} Time Override`,
        action: formAction,
        actionLabel: defaultLabel,
        startTime: formStartTime,
        endTime: formEndTime,
        days: formDays,
        notes: formNotes || `Scheduled override for ${targetRoom?.name}`,
      });

      if (res.success) {
        setScheduleSuccessMsg(`Schedule override created for ${targetRoom?.name}!`);
        setIsCreateModalOpen(false);
        // Reset form
        setFormTitle('');
        setFormNotes('');
        await loadSchedules();
        setTimeout(() => setScheduleSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Create schedule error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSchedule = async (id: string) => {
    try {
      const res = await toggleSchedule(id);
      if (res.success) {
        setSchedules((prev) =>
          prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
        );
      }
    } catch (err) {
      console.error('Toggle schedule error:', err);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      const res = await deleteSchedule(id);
      if (res.success) {
        setSchedules((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error('Delete schedule error:', err);
    }
  };

  const handleQuickAddTemplate = async (template: {
    roomId: string;
    title: string;
    action: ScheduleOverride['action'];
    actionLabel: string;
    startTime: string;
    endTime: string;
    days: string[];
    notes: string;
  }) => {
    try {
      const res = await createSchedule(template);
      if (res.success) {
        setScheduleSuccessMsg(`Added template override: "${template.title}"`);
        await loadSchedules();
        setTimeout(() => setScheduleSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Quick add template error:', err);
    }
  };

  const toggleDaySelection = (day: string) => {
    setFormDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const formatTimeString = (time24: string) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${mStr} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Navigation Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>BUILDING CONTROL MATRIX</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Facility Digital Twin & Automation</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry digital twin and time-based occupancy automation rules.
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('TWIN')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'TWIN'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Floor Twin & Controls</span>
          </button>

          <button
            onClick={() => setActiveTab('SCHEDULER')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'SCHEDULER'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Automation Scheduler</span>
            {activeSchedulesCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'SCHEDULER' ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {activeSchedulesCount} Active
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {scheduleSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2.5 animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{scheduleSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: DIGITAL TWIN VIEW */}
      {activeTab === 'TWIN' && (
        <div className="space-y-6">
          {/* Bulk Optimization & View Switcher Control Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-4">
              <span className="text-slate-400">STATUS OVERVIEW:</span>
              <span className="text-emerald-400 font-bold">{efficientCount}/{rooms.length} Efficient</span>
              {wasteCount > 0 && <span className="text-rose-400 font-bold">🔴 {wasteCount} Waste Detected</span>}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              {/* Map vs Grid View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  onClick={() => setTwinViewMode('MAP')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    twinViewMode === 'MAP'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>2D SVG Blueprint Map</span>
                </button>
                <button
                  onClick={() => setTwinViewMode('GRID')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    twinViewMode === 'GRID'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid Cards View</span>
                </button>
              </div>

              {/* Bulk Optimize Button */}
              <button
                onClick={onOptimizeAllRooms}
                disabled={optimizingRoomId === 'ALL'}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {optimizingRoomId === 'ALL' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    <span>Optimizing All...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                    <span>⚡ Bulk Optimize All Rooms</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Render 2D SVG Blueprint Map View */}
          {twinViewMode === 'MAP' && (
            <BuildingFloorPlan
              rooms={rooms}
              onOptimizeRoom={onOptimizeRoom}
              optimizingRoomId={optimizingRoomId}
              optimizationProgressMap={optimizationProgressMap}
              onSelectRoomDetails={(room) => setSelectedRoom(room)}
              schedules={schedules}
            />
          )}

          {/* Room Cards Grid */}
          {twinViewMode === 'GRID' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rooms.map((room) => {
              const isWaste = room.status === 'WASTE_DETECTED';
              const isEfficient = room.status === 'EFFICIENT';
              const isEmpty = room.status === 'EMPTY';
              const progress = optimizationProgressMap[room.id];
              const isOptimizing = optimizingRoomId === room.id || optimizingRoomId === 'ALL' || Boolean(progress);

              // Check if room has an active schedule override
              const activeRoomSchedule = schedules.find((s) => s.roomId === room.id && s.active);

              return (
                <div
                  key={room.id}
                  className={`p-5 rounded-2xl bg-slate-900/90 border transition-all duration-300 hover:scale-[1.02] relative flex flex-col justify-between ${
                    progress
                      ? 'border-emerald-400 ring-2 ring-emerald-500/30 shadow-xl shadow-emerald-950/40'
                      : isWaste
                      ? 'border-rose-500/60 ring-1 ring-rose-500/30 shadow-xl shadow-rose-950/20'
                      : isEfficient
                      ? 'border-slate-800 hover:border-emerald-500/40'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Header Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-base font-bold text-white">{room.name}</h3>
                        <p className="text-xs text-slate-400">Floor {room.floor} • {room.type.toUpperCase()}</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase ${
                          progress
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-pulse'
                            : isWaste
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : isEfficient
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isEmpty
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {progress ? '⚡ OPTIMIZING...' : isWaste ? '🔴 WASTE DETECTED' : isEfficient ? '🟢 EFFICIENT' : isEmpty ? '⚪ EMPTY' : '🟡 MODERATE'}
                      </span>
                    </div>

                    {/* Active Schedule Override Alert Banner if present */}
                    {activeRoomSchedule && (
                      <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-xs font-mono mb-3 flex items-start gap-2">
                        <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <div className="font-bold text-cyan-300">⏰ Active Automation Override</div>
                          <p className="text-[11px] text-cyan-200/90 mt-0.5 leading-snug">
                            {activeRoomSchedule.actionLabel} ({formatTimeString(activeRoomSchedule.startTime)} - {formatTimeString(activeRoomSchedule.endTime)})
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Metrics Box */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/80 rounded-xl my-3 text-center font-mono">
                      <div>
                        <div className="flex items-center justify-center gap-1 text-slate-500 text-[10px] mb-0.5">
                          <Users className="w-3 h-3" />
                          <span>Occupants</span>
                        </div>
                        <span className="text-sm font-bold text-slate-100">{room.occupancy}/{room.maxCapacity}</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-slate-500 text-[10px] mb-0.5">
                          <Thermometer className="w-3 h-3" />
                          <span>Temp</span>
                        </div>
                        <span className="text-sm font-bold text-slate-100">{room.temperature}°C</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-slate-500 text-[10px] mb-0.5">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>Power</span>
                        </div>
                        <span className="text-sm font-bold text-amber-400">{room.currentPower} kW</span>
                      </div>
                    </div>

                    {/* Appliances Mini Status Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 my-3">
                      <div className={`flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border transition-all ${
                        progress?.activeApplianceType === 'light'
                          ? 'border-amber-400 ring-1 ring-amber-400/40 bg-amber-500/10'
                          : 'border-slate-800/60'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <Lightbulb className={`w-3.5 h-3.5 ${
                            progress?.activeApplianceType === 'light'
                              ? 'text-amber-400 animate-bounce'
                              : room.lightsOn > 0
                              ? 'text-amber-400'
                              : 'text-slate-600'
                          }`} />
                          <span>Lights</span>
                        </div>
                        <span className="font-mono font-bold text-slate-200">{room.lightsOn}/{room.lightsCount}</span>
                      </div>

                      <div className={`flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border transition-all ${
                        progress?.activeApplianceType === 'fan'
                          ? 'border-cyan-400 ring-1 ring-cyan-400/40 bg-cyan-500/10'
                          : 'border-slate-800/60'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <Fan className={`w-3.5 h-3.5 ${
                            progress?.activeApplianceType === 'fan'
                              ? 'text-cyan-400 animate-spin'
                              : room.fansOn > 0
                              ? 'text-cyan-400 animate-spin'
                              : 'text-slate-600'
                          }`} />
                          <span>Fans</span>
                        </div>
                        <span className="font-mono font-bold text-slate-200">{room.fansOn}/{room.fansCount}</span>
                      </div>

                      <div className={`flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border transition-all ${
                        progress?.activeApplianceType === 'ac'
                          ? 'border-emerald-400 ring-1 ring-emerald-400/40 bg-emerald-500/10'
                          : 'border-slate-800/60'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <AirVent className={`w-3.5 h-3.5 ${
                            progress?.activeApplianceType === 'ac'
                              ? 'text-emerald-400 animate-pulse'
                              : room.acsOn > 0
                              ? 'text-emerald-400'
                              : 'text-slate-600'
                          }`} />
                          <span>AC</span>
                        </div>
                        <span className="font-mono font-bold text-slate-200">{room.acsOn}/{room.acsCount}</span>
                      </div>

                      <div className={`flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border transition-all ${
                        progress?.activeApplianceType === 'projector'
                          ? 'border-indigo-400 ring-1 ring-indigo-400/40 bg-indigo-500/10'
                          : 'border-slate-800/60'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <Tv className={`w-3.5 h-3.5 ${
                            progress?.activeApplianceType === 'projector'
                              ? 'text-indigo-400 animate-pulse'
                              : room.projectorOn
                              ? 'text-indigo-400'
                              : 'text-slate-600'
                          }`} />
                          <span>Projector</span>
                        </div>
                        <span className="font-mono font-bold text-slate-200">{room.projectorOn ? 'ON' : 'OFF'}</span>
                      </div>
                    </div>

                    {/* Granular Progress Indicator when Optimizing */}
                    {progress && <RoomProgressIndicator progress={progress} />}

                    {/* AI Recommendation Message if Waste */}
                    {!progress && room.aiRecommendation && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 my-2">
                        <div className="flex items-center gap-1 font-bold mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>AI Energy Recommendation</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-amber-300">{room.aiRecommendation}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 mt-2">
                    <button
                      onClick={() => setSelectedRoom(room)}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      Room Details
                    </button>
                    <button
                      onClick={() => onOptimizeRoom(room.id)}
                      disabled={isOptimizing}
                      className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-all ${
                        isWaste
                          ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-lg shadow-rose-500/20'
                          : isEfficient
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      }`}
                    >
                      {isOptimizing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Optimizing...</span>
                        </>
                      ) : isEfficient ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Optimized</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>Optimize Room</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* TAB 2: AUTOMATION SCHEDULER VIEW */}
      {activeTab === 'SCHEDULER' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>TIME-BASED OCCUPANCY OVERRIDES</span>
              </div>
              <h3 className="text-lg font-extrabold text-white">Automation Schedule Manager</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Configure scheduled rules to override default auto-shutdown. Ensure ACs stay powered on during scheduled lectures or force equipment off after hours.
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Schedule Override</span>
            </button>
          </div>

          {/* Quick Add Preset Templates Section */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Quick Preset Rule Templates</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">1-Click Quick Deploy</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
              <button
                onClick={() =>
                  handleQuickAddTemplate({
                    roomId: 'room-101',
                    title: 'Classroom 101: Keep AC ON until 6 PM',
                    action: 'KEEP_AC_ON',
                    actionLabel: 'Keep AC ON until 6:00 PM even if empty',
                    startTime: '16:00',
                    endTime: '18:00',
                    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                    notes: 'Evening guest lecture hold rule to preserve room comfort.',
                  })
                }
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition-all hover:bg-slate-800/40 group"
              >
                <div className="flex items-center justify-between font-bold text-white mb-1 group-hover:text-emerald-400">
                  <span>Classroom 101 AC Hold</span>
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400">Keep AC ON until 6:00 PM even if empty</p>
                <span className="text-[10px] text-emerald-400 font-bold mt-2 block">16:00 - 18:00 (Mon-Fri)</span>
              </button>

              <button
                onClick={() =>
                  handleQuickAddTemplate({
                    roomId: 'lab-2',
                    title: 'Lab 2: Night Safety Lockout',
                    action: 'FORCE_SHUTDOWN',
                    actionLabel: 'Force equipment shutdown after 9:00 PM',
                    startTime: '21:00',
                    endTime: '06:00',
                    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    notes: 'Night safety rule: prevent unattended workstations running overnight.',
                  })
                }
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 text-left transition-all hover:bg-slate-800/40 group"
              >
                <div className="flex items-center justify-between font-bold text-white mb-1 group-hover:text-rose-400">
                  <span>Lab 2 Night Lockout</span>
                  <Plus className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <p className="text-[11px] text-slate-400">Force equipment shutdown after 9:00 PM</p>
                <span className="text-[10px] text-rose-400 font-bold mt-2 block">21:00 - 06:00 (Daily)</span>
              </button>

              <button
                onClick={() =>
                  handleQuickAddTemplate({
                    roomId: 'auditorium',
                    title: 'Auditorium: Pre-Cooling Event',
                    action: 'PRE_COOL',
                    actionLabel: 'Pre-cool AC to 22°C before afternoon events',
                    startTime: '14:00',
                    endTime: '16:00',
                    days: ['Wed', 'Fri'],
                    notes: 'Pre-chill large hall prior to 200 occupants entering.',
                  })
                }
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-left transition-all hover:bg-slate-800/40 group"
              >
                <div className="flex items-center justify-between font-bold text-white mb-1 group-hover:text-cyan-400">
                  <span>Auditorium Pre-Cooling</span>
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <p className="text-[11px] text-slate-400">Pre-cool AC to 22°C before events</p>
                <span className="text-[10px] text-cyan-400 font-bold mt-2 block">14:00 - 16:00 (Wed, Fri)</span>
              </button>
            </div>
          </div>

          {/* Configured Schedules List */}
          {loadingSchedules ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Loading schedule overrides...</span>
            </div>
          ) : schedules.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 font-mono space-y-3">
              <Info className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">No active schedule overrides configured</p>
              <p className="text-xs text-slate-400">
                Create a custom schedule override or use a quick template above to automate room appliance schedules.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schedules.map((item) => {
                const getActionColor = () => {
                  switch (item.action) {
                    case 'KEEP_AC_ON':
                      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                    case 'FORCE_SHUTDOWN':
                      return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                    case 'PRE_COOL':
                      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
                    case 'KEEP_LIGHTS_ON':
                      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                    default:
                      return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
                  }
                };

                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl bg-slate-900/90 border transition-all flex flex-col justify-between ${
                      item.active ? 'border-slate-800 shadow-md' : 'border-slate-800/50 opacity-60'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{item.title}</h4>
                          </div>
                          <p className="text-xs font-mono text-emerald-400 font-semibold mt-0.5">
                            📍 {item.roomName}
                          </p>
                        </div>

                        <button
                          onClick={() => handleToggleSchedule(item.id)}
                          className="flex items-center gap-1.5 text-xs font-mono font-bold shrink-0"
                          title={item.active ? 'Pause Schedule Override' : 'Activate Schedule Override'}
                        >
                          {item.active ? (
                            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                              <ToggleRight className="w-4 h-4 text-emerald-400" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-500 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                              <ToggleLeft className="w-4 h-4" />
                              <span>Paused</span>
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Action Pill Badge */}
                      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                        <span className={`px-2.5 py-1 rounded-lg border font-bold uppercase ${getActionColor()}`}>
                          {item.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                          {item.actionLabel}
                        </span>
                      </div>

                      {/* Schedule Time Window */}
                      <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Time Window:</span>
                          </span>
                          <span className="font-bold text-white">
                            {formatTimeString(item.startTime)} - {formatTimeString(item.endTime)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Days:</span>
                          </span>
                          <div className="flex items-center gap-1">
                            {daysList.map((d) => (
                              <span
                                key={d}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                  item.days.includes(d)
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'text-slate-600 bg-slate-900'
                                }`}
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {item.notes && (
                        <p className="text-xs text-slate-400 font-sans leading-relaxed italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50">
                          "{item.notes}"
                        </p>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono mt-4">
                      <span className="text-[10px] text-slate-500">
                        Rule ID: {item.id}
                      </span>
                      <button
                        onClick={() => handleDeleteSchedule(item.id)}
                        className="text-slate-400 hover:text-rose-400 p-1.5 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-[11px]">Delete Rule</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE SCHEDULE OVERRIDE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <span>New Time-Based Schedule Override</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set custom time windows to override auto-shutdown rules.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateScheduleSubmit} className="space-y-4 font-mono text-xs">
              {/* Select Target Room */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  1. Select Target Room
                </label>
                <select
                  value={formRoomId}
                  onChange={(e) => setFormRoomId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Floor {r.floor} • Current: {r.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  2. Rule Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Classroom 101 Evening Lecture Hold"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Override Action */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  3. Override Action Behavior
                </label>
                <select
                  value={formAction}
                  onChange={(e) => setFormAction(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="KEEP_AC_ON">Keep AC ON even if room is empty (e.g. Lectures/Exams)</option>
                  <option value="FORCE_SHUTDOWN">Force equipment shutdown after hours (e.g. Night Lockout)</option>
                  <option value="PRE_COOL">Pre-cool AC before room occupancy (e.g. Symposium)</option>
                  <option value="KEEP_LIGHTS_ON">Keep Lights ON during late study hours</option>
                  <option value="CUSTOM">Custom time override</option>
                </select>
              </div>

              {/* Time Window */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Active Days */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Recurring Active Days
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {daysList.map((d) => {
                    const isSelected = formDays.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => toggleDaySelection(d)}
                        className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Operational Reason / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Scheduled evening guest lectures; maintain comfort even when empty."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs font-sans"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-slate-950 bg-emerald-500 hover:bg-emerald-400 font-bold uppercase flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Override Rule</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROOM DETAIL MODAL */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  <span>{selectedRoom.name} Digital Twin</span>
                </h3>
                <p className="text-xs font-mono text-slate-400">Floor {selectedRoom.floor} • ID: {selectedRoom.id}</p>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Current Occupancy:</span>
                <span className="font-bold text-white">{selectedRoom.occupancy} / {selectedRoom.maxCapacity}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Room Temperature:</span>
                <span className="font-bold text-white">{selectedRoom.temperature} °C</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Relative Humidity:</span>
                <span className="font-bold text-white">{selectedRoom.humidity} %</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Active Power Load:</span>
                <span className="font-bold text-amber-400">{selectedRoom.currentPower} kW</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Today's Energy:</span>
                <span className="font-bold text-emerald-400">{selectedRoom.todayEnergy} kWh</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-white uppercase">{selectedRoom.status}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                Optimization Controls
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <button
                  onClick={() => {
                    onOptimizeRoom(selectedRoom.id, 'ECO_BALANCED');
                    setSelectedRoom(null);
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Eco-Balanced</span>
                </button>
                <button
                  onClick={() => {
                    onOptimizeRoom(selectedRoom.id, 'FULL_SHUTDOWN');
                    setSelectedRoom(null);
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-mono font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-1.5"
                >
                  <Power className="w-4 h-4" />
                  <span>Full Shutdown</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
