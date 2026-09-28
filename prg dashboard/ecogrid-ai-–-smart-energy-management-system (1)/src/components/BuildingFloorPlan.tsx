import React, { useState } from 'react';
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
  Power,
  X,
  Compass,
  Layers,
  Info,
  Maximize2,
  SlidersHorizontal,
} from 'lucide-react';
import { Room, OptimizationProgressMap, ScheduleOverride } from '../types';

interface BuildingFloorPlanProps {
  rooms: Room[];
  onOptimizeRoom: (roomId: string, mode?: string) => void;
  optimizingRoomId?: string | null;
  optimizationProgressMap?: OptimizationProgressMap;
  onSelectRoomDetails?: (room: Room) => void;
  schedules?: ScheduleOverride[];
}

export const BuildingFloorPlan: React.FC<BuildingFloorPlanProps> = ({
  rooms,
  onOptimizeRoom,
  optimizingRoomId,
  optimizationProgressMap = {},
  onSelectRoomDetails,
  schedules = [],
}) => {
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [activePopoverRoomId, setActivePopoverRoomId] = useState<string | null>(null);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

  // Filter rooms on current floor
  const floorRooms = rooms.filter((r) => r.floor === selectedFloor);
  const popoverRoom = rooms.find((r) => r.id === activePopoverRoomId);

  // Room SVG Positions Map
  interface RoomLayoutCoords {
    x: number;
    y: number;
    width: number;
    height: number;
    doorPos?: { x: number; y: number; orientation: 'H' | 'V' };
  }

  const getRoomLayout = (roomId: string, floor: number): RoomLayoutCoords => {
    if (floor === 1) {
      switch (roomId) {
        case 'room-101':
          return { x: 50, y: 70, width: 270, height: 210, doorPos: { x: 180, y: 280, orientation: 'H' } };
        case 'lab-2':
          return { x: 350, y: 70, width: 280, height: 210, doorPos: { x: 490, y: 280, orientation: 'H' } };
        case 'home-living':
          return { x: 660, y: 70, width: 280, height: 210, doorPos: { x: 800, y: 280, orientation: 'H' } };
        case 'auditorium':
          return { x: 50, y: 340, width: 580, height: 250, doorPos: { x: 630, y: 465, orientation: 'V' } };
        default:
          return { x: 50, y: 70, width: 270, height: 210 };
      }
    } else if (floor === 2) {
      switch (roomId) {
        case 'room-204':
          return { x: 50, y: 70, width: 420, height: 230, doorPos: { x: 260, y: 300, orientation: 'H' } };
        default:
          return { x: 50, y: 70, width: 420, height: 230 };
      }
    } else if (floor === 3) {
      switch (roomId) {
        case 'office-301':
          return { x: 50, y: 70, width: 440, height: 230, doorPos: { x: 270, y: 300, orientation: 'H' } };
        default:
          return { x: 50, y: 70, width: 440, height: 230 };
      }
    }
    return { x: 50, y: 70, width: 270, height: 210 };
  };

  const getStatusFillColor = (room: Room, isHovered: boolean, isSelected: boolean) => {
    const progress = optimizationProgressMap[room.id];
    if (progress) return 'rgba(16, 185, 129, 0.25)'; // Emerald pulsating tint

    switch (room.status) {
      case 'WASTE_DETECTED':
        return isHovered || isSelected ? 'rgba(244, 63, 94, 0.35)' : 'rgba(244, 63, 94, 0.2)';
      case 'EFFICIENT':
        return isHovered || isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.12)';
      case 'EMPTY':
        return isHovered || isSelected ? 'rgba(51, 65, 85, 0.7)' : 'rgba(30, 41, 59, 0.6)';
      case 'MODERATE':
      default:
        return isHovered || isSelected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.12)';
    }
  };

  const getStatusStrokeColor = (room: Room, isHovered: boolean, isSelected: boolean) => {
    const progress = optimizationProgressMap[room.id];
    if (progress) return '#34d399'; // Emerald

    if (isSelected) return '#38bdf8'; // Sky blue border for selected room

    switch (room.status) {
      case 'WASTE_DETECTED':
        return '#f43f5e'; // Rose
      case 'EFFICIENT':
        return '#10b981'; // Emerald
      case 'EMPTY':
        return '#475569'; // Slate
      case 'MODERATE':
      default:
        return '#f59e0b'; // Amber
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Map Control Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>Interactive 2D Building Floor Plan</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                LIVE TELEMETRY SVG MAP
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any room tile on the architectural vector map to optimize power or view real-time appliance state.
            </p>
          </div>
        </div>

        {/* Floor Selection Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
          <span className="px-2.5 text-[11px] font-mono text-slate-500 font-bold flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>FLOOR:</span>
          </span>
          {[1, 2, 3].map((floorNum) => (
            <button
              key={floorNum}
              onClick={() => {
                setSelectedFloor(floorNum);
                setActivePopoverRoomId(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                selectedFloor === floorNum
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Floor {floorNum}
            </button>
          ))}
        </div>
      </div>

      {/* Main Floor Plan Canvas & Details Side Panel Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* SVG Floor Map Canvas Area */}
        <div className={`transition-all duration-300 ${activePopoverRoomId ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 overflow-hidden shadow-2xl">
            {/* Architectural Grid & Watermark Header */}
            <div className="flex items-center justify-between mb-3 text-[11px] font-mono text-slate-500 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-3">
                <span className="text-slate-300 font-bold uppercase tracking-wider">
                  🏢 CAMPUS TOWER • FLOOR {selectedFloor} VECTOR BLUEPRINT
                </span>
                <span className="text-emerald-400">Scale 1:100</span>
              </div>

              {/* Status Map Legend */}
              <div className="hidden md:flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="text-slate-300">Waste Detected</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-300">Efficient</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-300">Moderate</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                  <span className="text-slate-300">Empty</span>
                </span>
              </div>
            </div>

            {/* SVG Blueprint Canvas */}
            <div className="w-full h-auto aspect-[16/10] min-h-[420px] max-h-[620px] bg-slate-950/90 rounded-xl relative overflow-hidden flex items-center justify-center">
              <svg
                viewBox="0 0 1000 640"
                className="w-full h-full select-none"
                style={{ background: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)' }}
              >
                <defs>
                  {/* Subtle Grid Pattern */}
                  <pattern id="blueprintGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="1 3" />
                  </pattern>

                  {/* Red Waste Glow Filter */}
                  <filter id="glowWaste" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  {/* Emerald Glow Filter */}
                  <filter id="glowEmerald" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Grid Overlay */}
                <rect width="1000" height="640" fill="url(#blueprintGrid)" opacity="0.8" />

                {/* Outer Building Footprint Outer Perimeter */}
                <rect
                  x="30"
                  y="40"
                  width="940"
                  height="570"
                  rx="16"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="3"
                  strokeDasharray="8 4"
                />

                {/* Outer Wall Solid Frame */}
                <rect
                  x="40"
                  y="50"
                  width="920"
                  height="550"
                  rx="12"
                  fill="none"
                  stroke="#475569"
                  strokeWidth="4"
                />

                {/* Corridor / Central Walkway Paths */}
                {selectedFloor === 1 && (
                  <g opacity="0.4">
                    {/* Main Horizontal Corridor */}
                    <rect x="50" y="290" width="890" height="40" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    <text x="500" y="315" textAnchor="middle" fill="#64748b" fontSize="12" fontFamily="monospace" fontWeight="bold">
                      MAIN CENTRAL CORRIDOR & LOBBY HALLWAY
                    </text>
                  </g>
                )}

                {selectedFloor === 2 && (
                  <g opacity="0.4">
                    <rect x="50" y="310" width="890" height="30" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    <text x="500" y="330" textAnchor="middle" fill="#64748b" fontSize="12" fontFamily="monospace" fontWeight="bold">
                      FLOOR 2 ACADEMIC WING CORRIDOR
                    </text>
                  </g>
                )}

                {selectedFloor === 3 && (
                  <g opacity="0.4">
                    <rect x="50" y="310" width="890" height="30" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    <text x="500" y="330" textAnchor="middle" fill="#64748b" fontSize="12" fontFamily="monospace" fontWeight="bold">
                      EXECUTIVE FACULTY WING CORRIDOR
                    </text>
                  </g>
                )}

                {/* Render Floor Rooms */}
                {floorRooms.map((room) => {
                  const layout = getRoomLayout(room.id, room.floor);
                  const isHovered = hoveredRoomId === room.id;
                  const isSelected = activePopoverRoomId === room.id;
                  const progress = optimizationProgressMap[room.id];
                  const isWaste = room.status === 'WASTE_DETECTED';

                  // Has Active Schedule Override?
                  const activeSchedule = schedules.find((s) => s.roomId === room.id && s.active);

                  return (
                    <g
                      key={room.id}
                      className="cursor-pointer transition-all duration-200"
                      onClick={() => {
                        setActivePopoverRoomId(room.id);
                        if (onSelectRoomDetails) onSelectRoomDetails(room);
                      }}
                      onMouseEnter={() => setHoveredRoomId(room.id)}
                      onMouseLeave={() => setHoveredRoomId(null)}
                    >
                      {/* Red Pulse Glowing Outline Effect if Waste */}
                      {isWaste && (
                        <rect
                          x={layout.x - 4}
                          y={layout.y - 4}
                          width={layout.width + 8}
                          height={layout.height + 8}
                          rx="12"
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="2"
                          opacity="0.6"
                          className="animate-ping"
                        />
                      )}

                      {/* Room Tile Main Polygon / Rect */}
                      <rect
                        x={layout.x}
                        y={layout.y}
                        width={layout.width}
                        height={layout.height}
                        rx="10"
                        fill={getStatusFillColor(room, isHovered, isSelected)}
                        stroke={getStatusStrokeColor(room, isHovered, isSelected)}
                        strokeWidth={isHovered || isSelected ? 3 : 2}
                        strokeDasharray={progress ? '6 4' : 'none'}
                        className={progress ? 'animate-pulse' : ''}
                      />

                      {/* Interior Architectural Corner Accents */}
                      <path
                        d={`M ${layout.x + 12} ${layout.y + 6} L ${layout.x + 6} ${layout.y + 6} L ${layout.x + 6} ${layout.y + 12}`}
                        fill="none"
                        stroke={getStatusStrokeColor(room, isHovered, isSelected)}
                        strokeWidth="1.5"
                        opacity="0.6"
                      />
                      <path
                        d={`M ${layout.x + layout.width - 12} ${layout.y + 6} L ${layout.x + layout.width - 6} ${layout.y + 6} L ${layout.x + layout.width - 6} ${layout.y + 12}`}
                        fill="none"
                        stroke={getStatusStrokeColor(room, isHovered, isSelected)}
                        strokeWidth="1.5"
                        opacity="0.6"
                      />

                      {/* Room Title Header inside SVG */}
                      <text
                        x={layout.x + 16}
                        y={layout.y + 32}
                        fill="#ffffff"
                        fontSize="15"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {room.name}
                      </text>

                      {/* Room Status Badge inside SVG */}
                      <g transform={`translate(${layout.x + layout.width - 110}, ${layout.y + 16})`}>
                        <rect
                          width="95"
                          height="22"
                          rx="6"
                          fill={
                            progress
                              ? '#064e3b'
                              : isWaste
                              ? '#881337'
                              : room.status === 'EFFICIENT'
                              ? '#064e3b'
                              : room.status === 'EMPTY'
                              ? '#1e293b'
                              : '#78350f'
                          }
                          stroke={getStatusStrokeColor(room, false, false)}
                          strokeWidth="1"
                        />
                        <text
                          x="47"
                          y="15"
                          textAnchor="middle"
                          fill={
                            progress
                              ? '#6ee7b7'
                              : isWaste
                              ? '#fca5a5'
                              : room.status === 'EFFICIENT'
                              ? '#6ee7b7'
                              : room.status === 'EMPTY'
                              ? '#94a3b8'
                              : '#fde68a'
                          }
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {progress
                            ? '⚡ OPTIMIZING'
                            : isWaste
                            ? '🔴 WASTE'
                            : room.status === 'EFFICIENT'
                            ? '🟢 EFFICIENT'
                            : room.status === 'EMPTY'
                            ? '⚪ EMPTY'
                            : '🟡 MODERATE'}
                        </text>
                      </g>

                      {/* Telemetry Metrics Grid Inside SVG */}
                      <g transform={`translate(${layout.x + 16}, ${layout.y + 52})`}>
                        {/* Occupancy Indicator */}
                        <g transform="translate(0, 0)">
                          <text fill="#94a3b8" fontSize="10" fontFamily="monospace">
                            👥 OCCUPANTS
                          </text>
                          <text
                            x="0"
                            y="18"
                            fill={room.occupancy === 0 ? '#64748b' : '#f1f5f9'}
                            fontSize="13"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {room.occupancy} / {room.maxCapacity}
                          </text>
                        </g>

                        {/* Temperature Indicator */}
                        <g transform="translate(100, 0)">
                          <text fill="#94a3b8" fontSize="10" fontFamily="monospace">
                            🌡️ TEMP
                          </text>
                          <text x="0" y="18" fill="#f1f5f9" fontSize="13" fontFamily="monospace" fontWeight="bold">
                            {room.temperature}°C
                          </text>
                        </g>

                        {/* Active Power Indicator */}
                        <g transform="translate(180, 0)">
                          <text fill="#94a3b8" fontSize="10" fontFamily="monospace">
                            ⚡ POWER
                          </text>
                          <text x="0" y="18" fill="#fbbf24" fontSize="13" fontFamily="monospace" fontWeight="bold">
                            {room.currentPower} kW
                          </text>
                        </g>
                      </g>

                      {/* Appliances Active Status Pill Badges on Floor Map */}
                      <g transform={`translate(${layout.x + 16}, ${layout.y + 110})`}>
                        {/* Lights */}
                        <rect
                          width="55"
                          height="20"
                          rx="4"
                          fill={room.lightsOn > 0 ? '#1e293b' : '#0f172a'}
                          stroke={room.lightsOn > 0 ? '#fbbf24' : '#334155'}
                          strokeWidth="1"
                        />
                        <text
                          x="27"
                          y="13"
                          textAnchor="middle"
                          fill={room.lightsOn > 0 ? '#fbbf24' : '#64748b'}
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          💡 {room.lightsOn}/{room.lightsCount}
                        </text>

                        {/* Fans */}
                        <rect
                          x="62"
                          width="55"
                          height="20"
                          rx="4"
                          fill={room.fansOn > 0 ? '#1e293b' : '#0f172a'}
                          stroke={room.fansOn > 0 ? '#38bdf8' : '#334155'}
                          strokeWidth="1"
                        />
                        <text
                          x="89"
                          y="13"
                          textAnchor="middle"
                          fill={room.fansOn > 0 ? '#38bdf8' : '#64748b'}
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          🌀 {room.fansOn}/{room.fansCount}
                        </text>

                        {/* AC */}
                        <rect
                          x="124"
                          width="55"
                          height="20"
                          rx="4"
                          fill={room.acsOn > 0 ? '#1e293b' : '#0f172a'}
                          stroke={room.acsOn > 0 ? '#34d399' : '#334155'}
                          strokeWidth="1"
                        />
                        <text
                          x="151"
                          y="13"
                          textAnchor="middle"
                          fill={room.acsOn > 0 ? '#34d399' : '#64748b'}
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          ❄️ {room.acsOn}/{room.acsCount}
                        </text>

                        {/* Projector */}
                        {room.projectorOn && (
                          <g transform="translate(186, 0)">
                            <rect width="55" height="20" rx="4" fill="#1e293b" stroke="#818cf8" strokeWidth="1" />
                            <text
                              x="27"
                              y="13"
                              textAnchor="middle"
                              fill="#818cf8"
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              📺 PROJ
                            </text>
                          </g>
                        )}
                      </g>

                      {/* Active Schedule Rule Badge if attached */}
                      {activeSchedule && (
                        <g transform={`translate(${layout.x + 16}, ${layout.y + 142})`}>
                          <rect width={layout.width - 32} height="20" rx="4" fill="#083344" stroke="#06b6d4" strokeWidth="1" />
                          <text
                            x="10"
                            y="13"
                            fill="#67e8f9"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            ⏰ OVERRIDE: {activeSchedule.action.replace(/_/g, ' ')} ({activeSchedule.startTime}-{activeSchedule.endTime})
                          </text>
                        </g>
                      )}

                      {/* Clickable Hint Button inside SVG Tile */}
                      <g transform={`translate(${layout.x + 16}, ${layout.y + layout.height - 34})`}>
                        <rect
                          width={layout.width - 32}
                          height="24"
                          rx="6"
                          fill={isHovered ? '#10b981' : '#1e293b'}
                          stroke={isHovered ? '#34d399' : '#334155'}
                          strokeWidth="1"
                        />
                        <text
                          x={(layout.width - 32) / 2}
                          y="16"
                          textAnchor="middle"
                          fill={isHovered ? '#020617' : '#94a3b8'}
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {isHovered ? '⚡ CLICK TO OPTIMIZE / CONTROLS' : 'SELECT ROOM FOR ACTIONS'}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Additional Unmonitored Architectural Rooms (Background Fill) */}
                {selectedFloor === 1 && (
                  <g opacity="0.35">
                    {/* Restrooms */}
                    <rect x="660" y="350" width="280" height="110" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                    <text x="800" y="410" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="monospace">
                      RESTROOMS & UTILITY HUB
                    </text>

                    {/* Stairwell / Elevator Core */}
                    <rect x="660" y="480" width="280" height="110" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                    <text x="800" y="540" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="monospace">
                      ELEVATOR SHAFT & STAIRWELL
                    </text>
                  </g>
                )}

                {selectedFloor === 2 && (
                  <g opacity="0.35">
                    <rect x="500" y="70" width="440" height="230" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                    <text x="720" y="185" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="monospace">
                      OPEN STUDY LOUNGE (UNMONITORED)
                    </text>

                    <rect x="50" y="360" width="890" height="220" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                    <text x="495" y="470" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="monospace">
                      SERVER CONTROL CENTER & NETWORK HUB
                    </text>
                  </g>
                )}

                {selectedFloor === 3 && (
                  <g opacity="0.35">
                    <rect x="520" y="70" width="420" height="230" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                    <text x="730" y="185" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="monospace">
                      EXECUTIVE BOARDROOM & SUITE
                    </text>

                    <rect x="50" y="360" width="890" height="220" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                    <text x="495" y="470" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="monospace">
                      SOLAR ROOF DECK & HVAC COMPRESSOR ARRAY
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Selected Room Quick Controls Action Panel (Popover Side Panel) */}
        {popoverRoom && (
          <div className="lg:col-span-4 space-y-4 animate-in fade-in duration-200">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>FLOOR PLAN SELECTED ROOM</span>
                  </div>
                  <h4 className="text-base font-extrabold text-white mt-0.5">{popoverRoom.name}</h4>
                  <p className="text-xs text-slate-400 font-mono">Floor {popoverRoom.floor} • ID: {popoverRoom.id}</p>
                </div>

                <button
                  onClick={() => setActivePopoverRoomId(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Banner */}
              <div
                className={`p-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-between ${
                  popoverRoom.status === 'WASTE_DETECTED'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                    : popoverRoom.status === 'EFFICIENT'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                }`}
              >
                <span>STATUS: {popoverRoom.status}</span>
                <span className="text-[10px] font-normal">
                  {popoverRoom.status === 'WASTE_DETECTED' ? '🔴 Waste Alert' : '🟢 Optimal'}
                </span>
              </div>

              {/* Direct Quick Optimization Button */}
              <button
                onClick={() => onOptimizeRoom(popoverRoom.id)}
                disabled={optimizingRoomId === popoverRoom.id || Boolean(optimizationProgressMap[popoverRoom.id])}
                className="w-full py-3 rounded-xl text-xs font-mono font-bold uppercase bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {optimizationProgressMap[popoverRoom.id] ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Optimizing Room...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>⚡ Quick Optimize {popoverRoom.name}</span>
                  </>
                )}
              </button>

              {/* Quick Appliance Status List */}
              <div className="space-y-2 text-xs font-mono">
                <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                  Live Appliance Controls
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className={`w-4 h-4 ${popoverRoom.lightsOn > 0 ? 'text-amber-400' : 'text-slate-600'}`} />
                    <span className="text-slate-200">Light Fixtures</span>
                  </div>
                  <span className="text-white font-bold">{popoverRoom.lightsOn} / {popoverRoom.lightsCount} ON</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fan className={`w-4 h-4 ${popoverRoom.fansOn > 0 ? 'text-cyan-400 animate-spin' : 'text-slate-600'}`} />
                    <span className="text-slate-200">Ceiling Fans</span>
                  </div>
                  <span className="text-white font-bold">{popoverRoom.fansOn} / {popoverRoom.fansCount} ON</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AirVent className={`w-4 h-4 ${popoverRoom.acsOn > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`} />
                    <span className="text-slate-200">AC Units</span>
                  </div>
                  <span className="text-white font-bold">{popoverRoom.acsOn} / {popoverRoom.acsCount} ON</span>
                </div>

                {popoverRoom.projectorOn && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-indigo-500/30 flex items-center justify-between text-indigo-300">
                    <div className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-indigo-400" />
                      <span>Projector</span>
                    </div>
                    <span className="font-bold">ACTIVE</span>
                  </div>
                )}
              </div>

              {/* Recommendation Note if exists */}
              {popoverRoom.aiRecommendation && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-sans space-y-1">
                  <div className="font-bold font-mono text-[11px] flex items-center gap-1.5 text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Energy Recommendation</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-300">{popoverRoom.aiRecommendation}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
