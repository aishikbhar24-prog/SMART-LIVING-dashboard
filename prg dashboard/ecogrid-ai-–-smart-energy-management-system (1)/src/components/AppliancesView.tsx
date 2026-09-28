import React, { useState } from 'react';
import {
  ToggleLeft,
  Lightbulb,
  Fan,
  AirVent,
  Tv,
  Monitor,
  Search,
  Filter,
  Power,
  Sliders,
  Bot,
  Edit3,
  X,
  Check,
  Zap,
  ShieldCheck,
  Building2,
  Sparkles,
  Info,
} from 'lucide-react';
import { Appliance, Room } from '../types';

interface AppliancesViewProps {
  appliances: Appliance[];
  rooms?: Room[];
  onToggleAppliance: (id: string) => void;
  onSetFanSpeed: (id: string, speed: number) => void;
  onBulkSetAutoControl?: (type: 'light' | 'fan' | 'light_fan' | 'all', autoControlled: boolean) => void;
  onToggleAutoControl?: (id: string, autoControlled?: boolean) => void;
  onUpdateAppliance?: (id: string, updates: Partial<Appliance>) => void;
}

export const AppliancesView: React.FC<AppliancesViewProps> = ({
  appliances,
  rooms = [],
  onToggleAppliance,
  onSetFanSpeed,
  onBulkSetAutoControl,
  onToggleAutoControl,
  onUpdateAppliance,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [editingAppliance, setEditingAppliance] = useState<Appliance | null>(null);

  // Form states for editing modal
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<Appliance['type']>('light');
  const [editPowerW, setEditPowerW] = useState(800);
  const [editFanSpeed, setEditFanSpeed] = useState(100);
  const [editTemp, setEditTemp] = useState(24);
  const [editAutoControlled, setEditAutoControlled] = useState(true);
  const [editRoomId, setEditRoomId] = useState('');

  // Auto Control Metrics
  const lightsAndFans = appliances.filter((a) => a.type === 'light' || a.type === 'fan');
  const lightsAndFansAuto = lightsAndFans.filter((a) => a.autoControlled).length;
  const totalAutoControlled = appliances.filter((a) => a.autoControlled).length;

  const filteredApps = appliances.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.roomName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getIcon = (type: string, isOn: boolean) => {
    switch (type) {
      case 'light':
        return <Lightbulb className={`w-5 h-5 ${isOn ? 'text-amber-400 fill-amber-400/20' : 'text-slate-600'}`} />;
      case 'fan':
        return <Fan className={`w-5 h-5 ${isOn ? 'text-cyan-400 animate-spin' : 'text-slate-600'}`} />;
      case 'ac':
        return <AirVent className={`w-5 h-5 ${isOn ? 'text-emerald-400' : 'text-slate-600'}`} />;
      case 'projector':
        return <Tv className={`w-5 h-5 ${isOn ? 'text-indigo-400' : 'text-slate-600'}`} />;
      case 'computer':
        return <Monitor className={`w-5 h-5 ${isOn ? 'text-teal-400' : 'text-slate-600'}`} />;
      default:
        return <ToggleLeft className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleOpenEditModal = (appItem: Appliance) => {
    setEditingAppliance(appItem);
    setEditName(appItem.name);
    setEditType(appItem.type);
    setEditPowerW(appItem.powerRatingW);
    setEditFanSpeed(appItem.fanSpeed || 100);
    setEditTemp(appItem.temperatureSetPoint || 24);
    setEditAutoControlled(appItem.autoControlled);
    setEditRoomId(appItem.roomId);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppliance || !onUpdateAppliance) return;

    onUpdateAppliance(editingAppliance.id, {
      name: editName,
      type: editType,
      powerRatingW: Number(editPowerW),
      fanSpeed: editType === 'fan' ? Number(editFanSpeed) : undefined,
      temperatureSetPoint: editType === 'ac' ? Number(editTemp) : undefined,
      autoControlled: editAutoControlled,
      roomId: editRoomId || editingAppliance.roomId,
    });

    setEditingAppliance(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <ToggleLeft className="w-5 h-5 text-emerald-400" />
            <span>Appliance Management & Automatic AI Control Access</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Grant automatic AI control permissions, edit device specifications, and adjust fan speeds & light telemetry
          </p>
        </div>

        {/* Search & Type Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search appliances..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="light">Lights</option>
            <option value="fan">Fans</option>
            <option value="ac">Air Conditioners</option>
            <option value="projector">Projectors</option>
            <option value="computer">Computers</option>
          </select>
        </div>
      </div>

      {/* Automatic AI Control Access Management Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">
                  AUTOMATIC AI ACCESS & SMART ACTUATOR PERMISSIONS
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {lightsAndFansAuto}/{lightsAndFans.length} LIGHTS & FANS GRANTED ACCESS
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                When automatic access is granted, the AI optimization engine automatically dims lighting, adjusts ceiling fan speeds, and powers down idle equipment based on zero-occupancy sensors and schedule rules.
              </p>
            </div>
          </div>

          {/* Quick Bulk Action Buttons */}
          {onBulkSetAutoControl && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => onBulkSetAutoControl('light_fan', true)}
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>Grant Access (All Lights & Fans)</span>
              </button>

              <button
                onClick={() => onBulkSetAutoControl('all', true)}
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Grant Access (ALL Devices)</span>
              </button>

              <button
                onClick={() => onBulkSetAutoControl('all', false)}
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-all flex items-center gap-1.5"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Revoke Auto Access</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Appliance Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApps.map((appItem) => {
          const isOn = appItem.status === 'ON';
          const isAuto = appItem.autoControlled;

          return (
            <div
              key={appItem.id}
              className={`p-5 rounded-2xl bg-slate-900/80 border transition-all ${
                isOn ? 'border-slate-800 hover:border-emerald-500/40' : 'border-slate-800/60 opacity-80'
              }`}
            >
              {/* Header: Icon, Name, Edit Button */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-xl ${isOn ? 'bg-slate-950 border border-slate-800' : 'bg-slate-950/40'}`}>
                    {getIcon(appItem.type, isOn)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{appItem.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400">{appItem.roomName}</p>
                  </div>
                </div>

                {/* Edit Appliance Details Button */}
                <button
                  onClick={() => handleOpenEditModal(appItem)}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all"
                  title="Edit Appliance Details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Automatic Control Access Switch & Status Badge */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 my-3 text-xs">
                <div className="flex items-center gap-2">
                  <Bot className={`w-4 h-4 ${isAuto ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block leading-tight">
                      AI Auto Access
                    </span>
                    <span className={`font-mono font-bold text-[11px] ${isAuto ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isAuto ? '🤖 AUTO-CONTROLLED' : '👤 MANUAL ONLY'}
                    </span>
                  </div>
                </div>

                {/* Toggle Auto Control Switch */}
                {onToggleAutoControl && (
                  <button
                    onClick={() => onToggleAutoControl(appItem.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                      isAuto
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAuto ? 'ENABLED' : 'ENABLE ACCESS'}
                  </button>
                )}
              </div>

              {/* Power ON/OFF Toggle */}
              <div className="flex items-center justify-between pt-1 pb-3">
                <span className="text-xs text-slate-400 font-mono">Current Power Status:</span>
                <button
                  onClick={() => onToggleAppliance(appItem.id)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isOn
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isOn ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* Power Rating & Energy Specs */}
              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-950/70 rounded-xl my-2 text-center text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">Rating</span>
                  <span className="font-bold text-slate-200">{appItem.powerRatingW} W</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Active Load</span>
                  <span className="font-bold text-amber-400">{appItem.currentPowerkW} kW</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Today's Energy</span>
                  <span className="font-bold text-emerald-400">{appItem.energyConsumedkWh} kWh</span>
                </div>
              </div>

              {/* Special Fan Speed Control if fan */}
              {appItem.type === 'fan' && isOn && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Sliders className="w-3 h-3 text-cyan-400" />
                      <span>Fan Speed Regulator</span>
                    </span>
                    <span className="font-mono font-bold text-cyan-300">{appItem.fanSpeed || 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="10"
                    value={appItem.fanSpeed || 100}
                    onChange={(e) => onSetFanSpeed(appItem.id, Number(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Appliance Specification Modal */}
      {editingAppliance && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-extrabold text-white">Edit Appliance Settings</h3>
              </div>
              <button
                onClick={() => setEditingAppliance(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-mono">
              {/* Name */}
              <div>
                <label className="block text-slate-400 mb-1 font-bold">APPLIANCE / FIXTURE NAME</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              {/* Type & Power Rating */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">TYPE</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as Appliance['type'])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="light">Light Fixture</option>
                    <option value="fan">Ceiling Fan</option>
                    <option value="ac">Air Conditioner</option>
                    <option value="projector">Projector</option>
                    <option value="computer">Computer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">POWER RATING (WATTS)</label>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={editPowerW}
                    onChange={(e) => setEditPowerW(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Room Selector */}
              {rooms.length > 0 && (
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">ASSIGNED ROOM</label>
                  <select
                    value={editRoomId}
                    onChange={(e) => setEditRoomId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (Floor {r.floor})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Auto Control Checkbox Toggle */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span>Grant Automatic AI Control Access</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                    Allow AI algorithm to edit/turn off this device automatically
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editAutoControlled}
                  onChange={(e) => setEditAutoControlled(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold uppercase text-slate-950 bg-emerald-500 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Appliance Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAppliance(null)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
