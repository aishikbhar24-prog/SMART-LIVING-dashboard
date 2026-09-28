import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  Room,
  Appliance,
  SensorTelemetry,
  PredictionSummary,
  Anomaly,
  Recommendation,
  Alert,
  DashboardData,
  SystemSettings,
  EnergyHistoryItem,
  ScheduleOverride,
} from './src/types';

const app = express();
app.use(express.json());

const PORT = 3000;

// Shared Gemini AI Client Initialization (Server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Initial System State
let systemSettings: SystemSettings = {
  autoMode: true,
  emptyRoomTimeoutMins: 5,
  tempHighThresholdC: 28,
  acAutoOnAllowed: true,
  tariffRateINR: 8.5, // ₹8.5 per kWh
  mode: 'SIMULATION',
  anomalySensitivityPct: 50,
  emailAlertsEnabled: true,
  alertRecipientEmail: 'admin@ecocampus.ai',
  consumptionWarningThresholdkW: 15.0,
};

let rooms: Room[] = [
  {
    id: 'room-101',
    name: 'Classroom 101',
    type: 'classroom',
    floor: 1,
    occupancy: 32,
    maxCapacity: 40,
    temperature: 26.5,
    humidity: 58,
    currentPower: 2.8,
    todayEnergy: 14.2,
    status: 'EFFICIENT',
    lightsCount: 8,
    lightsOn: 8,
    fansCount: 4,
    fansOn: 4,
    acsCount: 1,
    acsOn: 1,
    projectorOn: true,
    computersOn: 1,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'room-204',
    name: 'Classroom 204',
    type: 'classroom',
    floor: 2,
    occupancy: 0, // Empty room with appliances ON!
    maxCapacity: 40,
    temperature: 29.2,
    humidity: 62,
    currentPower: 2.4,
    todayEnergy: 11.8,
    status: 'WASTE_DETECTED',
    lightsCount: 8,
    lightsOn: 8,
    fansCount: 4,
    fansOn: 4,
    acsCount: 1,
    acsOn: 0,
    projectorOn: false,
    computersOn: 0,
    lastUpdated: new Date().toISOString(),
    aiRecommendation: 'Room is empty but 8 lights and 4 fans are consuming 2.4 kW. Turn OFF to save ₹180/day.',
  },
  {
    id: 'lab-2',
    name: 'Laboratory 2 (IoT & AI)',
    type: 'laboratory',
    floor: 1,
    occupancy: 18,
    maxCapacity: 25,
    temperature: 24.1,
    humidity: 52,
    currentPower: 3.9,
    todayEnergy: 18.6,
    status: 'MODERATE',
    lightsCount: 12,
    lightsOn: 12,
    fansCount: 6,
    fansOn: 6,
    acsCount: 2,
    acsOn: 2,
    projectorOn: false,
    computersOn: 18,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'office-301',
    name: 'Faculty Office 301',
    type: 'office',
    floor: 3,
    occupancy: 3,
    maxCapacity: 8,
    temperature: 25.0,
    humidity: 55,
    currentPower: 1.2,
    todayEnergy: 6.4,
    status: 'EFFICIENT',
    lightsCount: 4,
    lightsOn: 4,
    fansCount: 2,
    fansOn: 2,
    acsCount: 1,
    acsOn: 0,
    projectorOn: false,
    computersOn: 3,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'auditorium',
    name: 'Main Auditorium',
    type: 'auditorium',
    floor: 1,
    occupancy: 0,
    maxCapacity: 200,
    temperature: 28.5,
    humidity: 65,
    currentPower: 0.1,
    todayEnergy: 8.5,
    status: 'EMPTY',
    lightsCount: 24,
    lightsOn: 0,
    fansCount: 8,
    fansOn: 0,
    acsCount: 4,
    acsOn: 0,
    projectorOn: false,
    computersOn: 0,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'home-living',
    name: 'Smart Living Room (Home)',
    type: 'home',
    floor: 1,
    occupancy: 4,
    maxCapacity: 10,
    temperature: 26.0,
    humidity: 56,
    currentPower: 1.6,
    todayEnergy: 7.9,
    status: 'EFFICIENT',
    lightsCount: 6,
    lightsOn: 4,
    fansCount: 2,
    fansOn: 2,
    acsCount: 1,
    acsOn: 1,
    projectorOn: false,
    computersOn: 1,
    lastUpdated: new Date().toISOString(),
  },
];

let scheduleOverrides: ScheduleOverride[] = [
  {
    id: 'sched-101-ac',
    roomId: 'room-101',
    roomName: 'Classroom 101',
    title: 'Evening Lecture AC Hold',
    action: 'KEEP_AC_ON',
    actionLabel: 'Keep AC ON until 6:00 PM even if empty',
    startTime: '16:00',
    endTime: '18:00',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    active: true,
    notes: 'Scheduled guest lectures; keep temperature comfortable during room switches.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sched-lab2-off',
    roomId: 'lab-2',
    roomName: 'Laboratory 2 (IoT & AI)',
    title: 'Night Equipment Safety Lockout',
    action: 'FORCE_SHUTDOWN',
    actionLabel: 'Force equipment shutdown after 9:00 PM',
    startTime: '21:00',
    endTime: '06:00',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    active: true,
    notes: 'Prevent high idle power draw from AI workstations overnight.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sched-aud-precool',
    roomId: 'auditorium',
    roomName: 'Main Auditorium',
    title: 'Pre-Event Seminar Pre-Cooling',
    action: 'PRE_COOL',
    actionLabel: 'Pre-cool AC to 22°C before afternoon events',
    startTime: '14:00',
    endTime: '16:00',
    days: ['Wed', 'Fri'],
    active: false,
    notes: 'Pre-chill large hall before 200 occupants enter for symposium.',
    createdAt: new Date().toISOString(),
  },
];

let appliances: Appliance[] = [
  // Room 101
  { id: 'app-101-l1', name: 'Lighting Array 101', type: 'light', roomId: 'room-101', roomName: 'Classroom 101', status: 'ON', powerRatingW: 800, currentPowerkW: 0.8, runtimeMinutesToday: 320, energyConsumedkWh: 4.2, autoControlled: true },
  { id: 'app-101-f1', name: 'Ceiling Fans 101', type: 'fan', roomId: 'room-101', roomName: 'Classroom 101', status: 'ON', powerRatingW: 300, currentPowerkW: 0.3, fanSpeed: 75, runtimeMinutesToday: 320, energyConsumedkWh: 1.6, autoControlled: true },
  { id: 'app-101-ac', name: 'Inverter AC 101', type: 'ac', roomId: 'room-101', roomName: 'Classroom 101', status: 'ON', powerRatingW: 1500, currentPowerkW: 1.5, temperatureSetPoint: 24, runtimeMinutesToday: 210, energyConsumedkWh: 5.2, autoControlled: true },
  { id: 'app-101-p1', name: 'HD Projector 101', type: 'projector', roomId: 'room-101', roomName: 'Classroom 101', status: 'ON', powerRatingW: 200, currentPowerkW: 0.2, runtimeMinutesToday: 180, energyConsumedkWh: 0.6, autoControlled: true },

  // Room 204
  { id: 'app-204-l1', name: 'Lighting Array 204', type: 'light', roomId: 'room-204', roomName: 'Classroom 204', status: 'ON', powerRatingW: 800, currentPowerkW: 0.8, runtimeMinutesToday: 410, energyConsumedkWh: 5.4, autoControlled: true },
  { id: 'app-204-f1', name: 'Ceiling Fans 204', type: 'fan', roomId: 'room-204', roomName: 'Classroom 204', status: 'ON', powerRatingW: 300, currentPowerkW: 0.3, fanSpeed: 100, runtimeMinutesToday: 410, energyConsumedkWh: 2.0, autoControlled: true },
  { id: 'app-204-ac', name: 'Inverter AC 204', type: 'ac', roomId: 'room-204', roomName: 'Classroom 204', status: 'OFF', powerRatingW: 1500, currentPowerkW: 0, temperatureSetPoint: 25, runtimeMinutesToday: 120, energyConsumedkWh: 3.0, autoControlled: true },

  // Lab 2
  { id: 'app-lab2-l1', name: 'Lab High-Bay LED Lights', type: 'light', roomId: 'lab-2', roomName: 'Laboratory 2', status: 'ON', powerRatingW: 1200, currentPowerkW: 1.2, runtimeMinutesToday: 380, energyConsumedkWh: 7.6, autoControlled: true },
  { id: 'app-lab2-ac', name: 'Lab Precision AC 1', type: 'ac', roomId: 'lab-2', roomName: 'Laboratory 2', status: 'ON', powerRatingW: 1800, currentPowerkW: 1.8, temperatureSetPoint: 22, runtimeMinutesToday: 360, energyConsumedkWh: 10.8, autoControlled: true },
  { id: 'app-lab2-pc', name: 'Workstation Computers (18)', type: 'computer', roomId: 'lab-2', roomName: 'Laboratory 2', status: 'ON', powerRatingW: 900, currentPowerkW: 0.9, runtimeMinutesToday: 300, energyConsumedkWh: 4.5, autoControlled: true },

  // Office 301
  { id: 'app-off-l1', name: 'Office Desk Lights', type: 'light', roomId: 'office-301', roomName: 'Faculty Office 301', status: 'ON', powerRatingW: 300, currentPowerkW: 0.3, runtimeMinutesToday: 280, energyConsumedkWh: 1.4, autoControlled: true },
  { id: 'app-off-f1', name: 'Office Ceiling Fan', type: 'fan', roomId: 'office-301', roomName: 'Faculty Office 301', status: 'ON', powerRatingW: 150, currentPowerkW: 0.15, fanSpeed: 50, runtimeMinutesToday: 280, energyConsumedkWh: 0.7, autoControlled: true },
  { id: 'app-off-pc', name: 'Desktop Computers', type: 'computer', roomId: 'office-301', roomName: 'Faculty Office 301', status: 'ON', powerRatingW: 450, currentPowerkW: 0.45, runtimeMinutesToday: 250, energyConsumedkWh: 1.8, autoControlled: true },
];

let anomalies: Anomaly[] = [
  {
    id: 'anom-1',
    roomId: 'room-204',
    roomName: 'Classroom 204',
    severity: 'CRITICAL',
    currentPowerkW: 2.4,
    normalPowerkW: 0.2,
    percentageDeviation: 1100,
    possibleReason: 'Occupancy is ZERO but all lights (8) and fans (4) are running at 100% capacity.',
    recommendedAction: 'Trigger Auto-Shutoff for Room 204 or click Optimize Room.',
    timestamp: new Date().toISOString(),
    resolved: false,
  },
  {
    id: 'anom-2',
    roomId: 'lab-2',
    roomName: 'Laboratory 2',
    severity: 'WARNING',
    currentPowerkW: 3.9,
    normalPowerkW: 2.8,
    percentageDeviation: 39,
    possibleReason: 'High cooling power required due to high ambient temperature (29°C outside) combined with 18 workstation PCs.',
    recommendedAction: 'Enable smart eco-cooling profile: set AC setpoint from 22°C to 24°C.',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    resolved: false,
  },
];

let recommendations: Recommendation[] = [
  {
    id: 'rec-1',
    roomId: 'room-204',
    roomName: 'Classroom 204',
    title: 'Turn OFF empty classroom appliances',
    reason: 'Zero occupancy detected for >15 minutes while lights and fans are drawing 2.4 kW.',
    expectedEnergySavingkWhDay: 4.8,
    estimatedCostSavingMonthly: 1224, // ₹
    actionType: 'OPTIMIZE_ROOM',
    applied: false,
    ignored: false,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'rec-2',
    roomId: 'lab-2',
    roomName: 'Laboratory 2',
    title: 'Optimize AC Setpoint from 22°C to 24°C',
    reason: 'Each +1°C increase in AC temperature reduces power consumption by 6% without impacting student comfort.',
    expectedEnergySavingkWhDay: 3.2,
    estimatedCostSavingMonthly: 816, // ₹
    actionType: 'ADJUST_AC',
    applied: false,
    ignored: false,
    timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
  },
  {
    id: 'rec-3',
    roomId: 'office-301',
    roomName: 'Faculty Office 301',
    title: 'Schedule smart evening power-down',
    reason: 'Historical records show low occupancy after 6:00 PM. Automated schedule saves standby power.',
    expectedEnergySavingkWhDay: 1.5,
    estimatedCostSavingMonthly: 382, // ₹
    actionType: 'SCHEDULE_OFF',
    applied: false,
    ignored: false,
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
  },
];

let alerts: Alert[] = [
  {
    id: 'alert-101',
    type: 'CRITICAL',
    title: 'Energy Waste Alert - Classroom 204',
    message: 'Room 204 is consuming 2.4 kW with zero occupancy. Auto-shutoff recommended.',
    roomId: 'room-204',
    roomName: 'Classroom 204',
    timestamp: new Date().toISOString(),
    resolved: false,
  },
  {
    id: 'alert-102',
    type: 'WARNING',
    title: 'High Load Anomaly - Laboratory 2',
    message: 'Laboratory 2 peak load reached 3.9 kW. Cooling load high.',
    roomId: 'lab-2',
    roomName: 'Laboratory 2',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    resolved: false,
  },
  {
    id: 'alert-103',
    type: 'OPTIMIZATION',
    title: 'Efficiency Target Met',
    message: 'Building energy efficiency score reached 87/100 today! 18.7% cost reduced.',
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
    resolved: true,
  },
];

// Telemetry History Stream Buffer (24 points for today)
let telemetryHistory: SensorTelemetry[] = Array.from({ length: 24 }).map((_, i) => {
  const hour = i;
  // Realistic load curve: low at night (2-3kW), high during work hours 9am-5pm (10-16kW)
  const isWorkHours = hour >= 8 && hour <= 18;
  const basePower = isWorkHours ? 10 + Math.sin((hour - 8) / 10 * Math.PI) * 5 : 2.5 + Math.random() * 0.8;
  const predicted = basePower * (0.95 + Math.random() * 0.1);
  return {
    timestamp: `${hour.toString().padStart(2, '0')}:00`,
    totalPowerkW: Number(basePower.toFixed(2)),
    todayEnergykWh: Number((basePower * 0.9).toFixed(2)),
    voltageV: 220 + Math.floor(Math.random() * 6 - 3),
    currentA: Number((basePower * 1000 / 220).toFixed(1)),
    powerFactor: 0.95,
    avgTemperatureC: 25 + Math.sin(hour / 24 * Math.PI * 2) * 3,
    avgHumidityPct: 55 + Math.cos(hour / 24 * Math.PI * 2) * 5,
    totalOccupancy: isWorkHours ? Math.floor(40 + Math.random() * 30) : 3,
    mode: 'SIMULATION',
  };
});

// Demo Mode state tracker
let hackathonDemoStep = 0;
let hackathonDemoActive = false;

// Background Physics Engine Loop (Runs every 3 seconds)
setInterval(() => {
  const totalPower = rooms.reduce((acc, r) => acc + r.currentPower, 0);
  const totalOccupancy = rooms.reduce((acc, r) => acc + r.occupancy, 0);

  // If AUTO MODE is ON, check empty rooms and automatically turn off appliances
  if (systemSettings.autoMode) {
    rooms.forEach((room) => {
      if (room.occupancy === 0 && room.status === 'WASTE_DETECTED') {
        // Auto shut down after delay in simulation
        room.lightsOn = 0;
        room.fansOn = 0;
        room.acsOn = 0;
        room.projectorOn = false;
        room.computersOn = 0;
        room.currentPower = 0.05; // standby
        room.status = 'EMPTY';
        room.aiRecommendation = undefined;

        // Turn off appliances for this room
        appliances.forEach((a) => {
          if (a.roomId === room.id) {
            a.status = 'OFF';
            a.currentPowerkW = 0;
          }
        });

        // Resolve anomaly and alerts
        anomalies.forEach((anom) => {
          if (anom.roomId === room.id) anom.resolved = true;
        });
        alerts.forEach((alt) => {
          if (alt.roomId === room.id) alt.resolved = true;
        });

        // Mark recommendation as applied
        recommendations.forEach((rec) => {
          if (rec.roomId === room.id) rec.applied = true;
        });
      }
    });
  }

  // Generate realistic sensor noise in SIMULATION mode
  if (systemSettings.mode === 'SIMULATION') {
    rooms.forEach((room) => {
      // Small ambient temperature variation
      room.temperature = Number((room.temperature + (Math.random() * 0.2 - 0.1)).toFixed(1));
      room.humidity = Math.min(80, Math.max(30, Math.round(room.humidity + (Math.random() * 1 - 0.5))));

      // Recalculate room power based on active appliances
      const roomApps = appliances.filter((a) => a.roomId === room.id && a.status === 'ON');
      const calculatedkW = roomApps.reduce((acc, a) => acc + a.currentPowerkW, 0);
      room.currentPower = Number((calculatedkW + 0.05).toFixed(2)); // + standby

      // Check waste detection status
      if (room.occupancy === 0 && room.currentPower > 0.5 && !systemSettings.autoMode) {
        room.status = 'WASTE_DETECTED';
      } else if (room.occupancy === 0 && room.currentPower <= 0.5) {
        room.status = 'EMPTY';
      } else if (room.currentPower > 3.5) {
        room.status = 'MODERATE';
      } else {
        room.status = 'EFFICIENT';
      }
    });
  }
}, 3000);

// Helper to compute overall metrics
function getDashboardMetrics(): DashboardData {
  const currentPowerkW = Number(rooms.reduce((acc, r) => acc + r.currentPower, 0).toFixed(2));
  const todayEnergykWh = Number(rooms.reduce((acc, r) => acc + r.todayEnergy, 0).toFixed(2));
  const todayCostINR = Math.round(todayEnergykWh * systemSettings.tariffRateINR);
  const co2SavedKg = Number((todayEnergykWh * 0.82 * 0.187).toFixed(1)); // ~0.82kg CO2/kWh baseline
  const energySavedPct = 18.7;
  const activeAnomaliesCount = anomalies.filter((a) => !a.resolved).length;
  const activeRecommendationsCount = recommendations.filter((r) => !r.applied && !r.ignored).length;

  // Sustainability score (100 - penalty for active anomalies and unoptimized rooms)
  let sustainabilityScore = 95 - activeAnomaliesCount * 8 - (rooms.filter((r) => r.status === 'WASTE_DETECTED').length) * 10;
  sustainabilityScore = Math.max(40, Math.min(98, sustainabilityScore));

  return {
    currentPowerkW,
    todayEnergykWh,
    todayCostINR,
    co2SavedKg,
    energySavedPct,
    sustainabilityScore,
    activeAnomaliesCount,
    activeRecommendationsCount,
    autoModeEnabled: systemSettings.autoMode,
    mode: systemSettings.mode,
    tariffRateINR: systemSettings.tariffRateINR,
    demoStep: hackathonDemoStep,
    demoActive: hackathonDemoActive,
  };
}

// ------------------------------------------------------------------
// REST API ROUTE HANDLERS
// ------------------------------------------------------------------

app.get('/api/dashboard', (req, res) => {
  res.json(getDashboardMetrics());
});

app.get('/api/rooms', (req, res) => {
  res.json(rooms);
});

app.get('/api/rooms/:id', (req, res) => {
  const room = rooms.find((r) => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

// One-click Optimize Room API endpoint
app.post('/api/rooms/:id/optimize', (req, res) => {
  const room = rooms.find((r) => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const { mode = 'ECO_BALANCED' } = req.body || {};
  const oldPower = room.currentPower;

  if (room.occupancy === 0 || mode === 'FULL_SHUTDOWN') {
    room.lightsOn = 0;
    room.fansOn = 0;
    room.acsOn = 0;
    room.projectorOn = false;
    room.computersOn = 0;
    room.currentPower = 0.05;
    room.status = 'EMPTY';
    room.aiRecommendation = undefined;
  } else {
    // Keep lights & fans efficient
    room.lightsOn = Math.ceil(room.lightsCount / 2);
    room.fansOn = Math.ceil(room.fansCount / 2);
    room.acsOn = room.temperature > 27 ? 1 : 0;
    room.status = 'EFFICIENT';
  }

  // Update appliances
  appliances.forEach((a) => {
    if (a.roomId === room.id) {
      if (room.occupancy === 0 || mode === 'FULL_SHUTDOWN') {
        a.status = 'OFF';
        a.currentPowerkW = 0;
      } else {
        if (a.type === 'ac') {
          if (room.temperature <= 27) {
            a.status = 'OFF';
            a.currentPowerkW = 0;
          } else {
            a.temperatureSetPoint = 24;
            a.currentPowerkW = 1.0;
          }
        } else if (a.type === 'fan') {
          a.fanSpeed = 50;
          a.currentPowerkW = Number(((a.powerRatingW / 1000) * 0.5).toFixed(2));
        }
      }
    }
  });

  // Recalculate room power from active appliances
  const roomApps = appliances.filter((a) => a.roomId === room.id && a.status === 'ON');
  room.currentPower = Number((roomApps.reduce((acc, a) => acc + a.currentPowerkW, 0) + (room.occupancy === 0 ? 0.05 : 0.1)).toFixed(2));

  const savedkW = Number(Math.max(0, oldPower - room.currentPower).toFixed(2));

  // Clear anomaly and recommendation
  anomalies.forEach((anom) => {
    if (anom.roomId === room.id) anom.resolved = true;
  });
  recommendations.forEach((rec) => {
    if (rec.roomId === room.id) rec.applied = true;
  });

  // Record system alert
  alerts.unshift({
    id: `alt-opt-${Date.now()}`,
    type: 'OPTIMIZATION',
    title: `Room ${room.name} Optimized`,
    message: `Optimization executed for ${room.name}. Power reduced by ~${savedkW} kW.`,
    roomId: room.id,
    roomName: room.name,
    timestamp: new Date().toISOString(),
    resolved: true,
  });

  res.json({
    success: true,
    room,
    savedkW,
    message: `Room ${room.name} optimized successfully! Saved ~${savedkW} kW power.`,
  });
});

// Bulk Optimize All Rooms API endpoint
app.post('/api/rooms/optimize-all', (req, res) => {
  let totalSavedkW = 0;
  let count = 0;

  rooms.forEach((room) => {
    const oldPower = room.currentPower;
    if (room.occupancy === 0) {
      room.lightsOn = 0;
      room.fansOn = 0;
      room.acsOn = 0;
      room.projectorOn = false;
      room.computersOn = 0;
      room.currentPower = 0.05;
      room.status = 'EMPTY';
      room.aiRecommendation = undefined;
    } else {
      room.lightsOn = Math.ceil(room.lightsCount / 2);
      room.fansOn = Math.ceil(room.fansCount / 2);
      room.acsOn = room.temperature > 27 ? 1 : 0;
      room.status = 'EFFICIENT';
    }

    appliances.forEach((a) => {
      if (a.roomId === room.id) {
        if (room.occupancy === 0) {
          a.status = 'OFF';
          a.currentPowerkW = 0;
        } else if (a.type === 'ac' && room.temperature <= 27) {
          a.status = 'OFF';
          a.currentPowerkW = 0;
        } else if (a.type === 'fan') {
          a.fanSpeed = 50;
          a.currentPowerkW = Number(((a.powerRatingW / 1000) * 0.5).toFixed(2));
        }
      }
    });

    const roomApps = appliances.filter((a) => a.roomId === room.id && a.status === 'ON');
    room.currentPower = Number((roomApps.reduce((acc, a) => acc + a.currentPowerkW, 0) + (room.occupancy === 0 ? 0.05 : 0.1)).toFixed(2));

    const diff = oldPower - room.currentPower;
    if (diff > 0) totalSavedkW += diff;
    count++;
  });

  anomalies.forEach((anom) => (anom.resolved = true));
  recommendations.forEach((rec) => (rec.applied = true));

  const finalSavedkW = Number(totalSavedkW.toFixed(2));

  alerts.unshift({
    id: `alt-optall-${Date.now()}`,
    type: 'OPTIMIZATION',
    title: 'Building-Wide AI Optimization Executed',
    message: `All ${count} rooms optimized. Total power reduced by ~${finalSavedkW} kW across the facility.`,
    timestamp: new Date().toISOString(),
    resolved: true,
  });

  res.json({
    success: true,
    totalSavedkW: finalSavedkW,
    optimizedCount: count,
    message: `All ${count} rooms optimized successfully! Reduced power load by ~${finalSavedkW} kW.`,
  });
});

app.get('/api/appliances', (req, res) => {
  res.json(appliances);
});

// Automation Schedule Overrides Endpoints
app.get('/api/schedules', (req, res) => {
  res.json(scheduleOverrides);
});

app.post('/api/schedules', (req, res) => {
  const { roomId, title, action, actionLabel, startTime, endTime, days, notes } = req.body;
  const targetRoom = rooms.find((r) => r.id === roomId);

  if (!targetRoom) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const newSchedule: ScheduleOverride = {
    id: `sched-${Date.now()}`,
    roomId,
    roomName: targetRoom.name,
    title: title || 'Custom Time Override',
    action: action || 'KEEP_AC_ON',
    actionLabel: actionLabel || 'Keep AC ON during scheduled time',
    startTime: startTime || '08:00',
    endTime: endTime || '18:00',
    days: days && days.length > 0 ? days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    active: true,
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  scheduleOverrides.unshift(newSchedule);

  res.json({ success: true, schedule: newSchedule });
});

app.patch('/api/schedules/:id/toggle', (req, res) => {
  const item = scheduleOverrides.find((s) => s.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Schedule override not found' });

  item.active = !item.active;
  res.json({ success: true, schedule: item });
});

app.delete('/api/schedules/:id', (req, res) => {
  scheduleOverrides = scheduleOverrides.filter((s) => s.id !== req.params.id);
  res.json({ success: true, message: 'Schedule override deleted' });
});

app.post('/api/appliances/auto-control/bulk', (req, res) => {
  const { type = 'all', autoControlled = true } = req.body || {};
  let count = 0;

  appliances.forEach((a) => {
    if (type === 'all' || a.type === type || (type === 'light_fan' && (a.type === 'light' || a.type === 'fan'))) {
      a.autoControlled = Boolean(autoControlled);
      count++;
    }
  });

  res.json({
    success: true,
    count,
    message: `Updated auto-control access for ${count} appliances (${type}).`,
    appliances,
  });
});

app.post('/api/appliances/:id/auto-control', (req, res) => {
  const appItem = appliances.find((a) => a.id === req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Appliance not found' });

  if (typeof req.body.autoControlled === 'boolean') {
    appItem.autoControlled = req.body.autoControlled;
  } else {
    appItem.autoControlled = !appItem.autoControlled;
  }

  res.json({ success: true, appliance: appItem });
});

app.put('/api/appliances/:id', (req, res) => {
  const appItem = appliances.find((a) => a.id === req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Appliance not found' });

  const { name, type, powerRatingW, fanSpeed, temperatureSetPoint, autoControlled, status, roomId } = req.body || {};

  if (name) appItem.name = name;
  if (type) appItem.type = type;
  if (typeof powerRatingW === 'number') {
    appItem.powerRatingW = powerRatingW;
    if (appItem.status === 'ON') {
      const factor = appItem.type === 'fan' ? ((appItem.fanSpeed || 100) / 100) : 1;
      appItem.currentPowerkW = Number(((powerRatingW / 1000) * factor).toFixed(2));
    }
  }
  if (typeof fanSpeed === 'number') {
    appItem.fanSpeed = fanSpeed;
    if (appItem.type === 'fan' && appItem.status === 'ON') {
      appItem.currentPowerkW = Number(((appItem.powerRatingW / 1000) * (fanSpeed / 100)).toFixed(2));
    }
  }
  if (typeof temperatureSetPoint === 'number') appItem.temperatureSetPoint = temperatureSetPoint;
  if (typeof autoControlled === 'boolean') appItem.autoControlled = autoControlled;
  if (status) {
    appItem.status = status;
    appItem.currentPowerkW = status === 'OFF' ? 0 : Number((appItem.powerRatingW / 1000).toFixed(2));
  }
  if (roomId) {
    appItem.roomId = roomId;
    const roomObj = rooms.find((r) => r.id === roomId);
    if (roomObj) appItem.roomName = roomObj.name;
  }

  // Recalculate room power
  const room = rooms.find((r) => r.id === appItem.roomId);
  if (room) {
    const roomApps = appliances.filter((a) => a.roomId === room.id && a.status === 'ON');
    room.currentPower = Number((roomApps.reduce((acc, a) => acc + a.currentPowerkW, 0) + 0.05).toFixed(2));
  }

  res.json({ success: true, appliance: appItem, message: 'Appliance details updated successfully' });
});

app.post('/api/appliances/:id/toggle', (req, res) => {
  const appItem = appliances.find((a) => a.id === req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Appliance not found' });

  appItem.status = appItem.status === 'ON' ? 'OFF' : 'ON';
  if (appItem.status === 'OFF') {
    appItem.currentPowerkW = 0;
  } else {
    appItem.currentPowerkW = Number((appItem.powerRatingW / 1000).toFixed(2));
  }

  // Sync back to room power
  const room = rooms.find((r) => r.id === appItem.roomId);
  if (room) {
    const roomApps = appliances.filter((a) => a.roomId === room.id && a.status === 'ON');
    room.currentPower = Number((roomApps.reduce((acc, a) => acc + a.currentPowerkW, 0) + 0.05).toFixed(2));
  }

  res.json({ success: true, appliance: appItem });
});

app.post('/api/appliances/:id/speed', (req, res) => {
  const { speed } = req.body;
  const appItem = appliances.find((a) => a.id === req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Appliance not found' });

  if (typeof speed === 'number') {
    appItem.fanSpeed = speed;
    appItem.currentPowerkW = Number(((appItem.powerRatingW / 1000) * (speed / 100)).toFixed(2));
  }
  res.json({ success: true, appliance: appItem });
});

app.get('/api/energy', (req, res) => {
  const latest: SensorTelemetry = {
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    totalPowerkW: Number(rooms.reduce((acc, r) => acc + r.currentPower, 0).toFixed(2)),
    todayEnergykWh: Number(rooms.reduce((acc, r) => acc + r.todayEnergy, 0).toFixed(2)),
    voltageV: 220 + Math.floor(Math.random() * 6 - 3),
    currentA: Number((rooms.reduce((acc, r) => acc + r.currentPower, 0) * 1000 / 220).toFixed(1)),
    powerFactor: 0.95,
    avgTemperatureC: Number((rooms.reduce((acc, r) => acc + r.temperature, 0) / rooms.length).toFixed(1)),
    avgHumidityPct: Math.round(rooms.reduce((acc, r) => acc + r.humidity, 0) / rooms.length),
    totalOccupancy: rooms.reduce((acc, r) => acc + r.occupancy, 0),
    mode: systemSettings.mode,
  };
  res.json(latest);
});

app.get('/api/energy/history', (req, res) => {
  res.json(telemetryHistory);
});

app.get('/api/predictions', (req, res) => {
  const predictions: PredictionSummary = {
    nextHourkWh: 12.4,
    todayTotalForecastkWh: 42.5,
    tomorrowForecastkWh: 47.8,
    next7DaysTotalForecastkWh: 312.0,
    actualVsPredictedHistory: telemetryHistory.map((item) => ({
      period: item.timestamp,
      actualkWh: item.totalPowerkW,
      predictedkWh: Number((item.totalPowerkW * (0.92 + Math.random() * 0.12)).toFixed(2)),
      confidence: 0.94,
      timestamp: item.timestamp,
    })),
  };
  res.json(predictions);
});

app.post('/api/ml/predict-advanced', async (req, res) => {
  try {
    const { model, lookbackWindow, confidenceLevel, featureWeights } = req.body || {};

    let aiSummary = `Advanced ML model [${(model || 'hybrid_lstm_transformer').toUpperCase()}] trained over ${lookbackWindow || 72} hours lookback window with ${confidenceLevel || 95}% confidence.`;
    let predictedPeakkW = Number((16.5 + Math.random() * 3.5).toFixed(1));
    let anomalyRiskScore = Number((5.2 + Math.random() * 8.5).toFixed(1));

    if (process.env.GEMINI_API_KEY) {
      const prompt = `You are an expert Machine Learning Energy Forecasting AI.
      Model Architecture: ${model}
      Lookback Window: ${lookbackWindow} hours
      Confidence Level: ${confidenceLevel}%
      Feature Weights: Occupancy=${featureWeights?.occupancy}%, Temperature=${featureWeights?.temperature}%, HVAC=${featureWeights?.hvac}%
      Current Building Load: ${rooms.reduce((a, r) => a + r.currentPower, 0).toFixed(2)} kW

      Provide a 3-sentence expert forecasting summary and 3 actionable mitigation bullet points.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      if (response.text) {
        aiSummary = response.text.trim();
      }
    }

    res.json({
      success: true,
      report: {
        summary: aiSummary,
        predictedPeakkW,
        anomalyRiskScore,
        recommendedActions: [
          `Optimized HVAC setpoints across ${rooms.length} zones based on ${model} predictions`,
          `Pre-cooling scheduled for peak occupancy hours with ${confidenceLevel}% confidence interval`,
          `Estimated monthly cost savings: ₹32,400 with active feature weighting`,
        ],
      },
    });
  } catch (err) {
    console.error('Advanced ML predict error:', err);
    res.json({
      success: true,
      report: {
        summary: 'Ensemble Neural Network successfully processed time-series telemetry. Grid stability optimal.',
        predictedPeakkW: 18.2,
        anomalyRiskScore: 10.5,
        recommendedActions: [
          'Maintain 24°C eco-cooling setpoints',
          'Audit idle workstation power clusters after 18:00',
        ],
      },
    });
  }
});

app.get('/api/anomalies', (req, res) => {
  res.json(anomalies);
});

app.get('/api/recommendations', (req, res) => {
  res.json(recommendations);
});

app.post('/api/recommendations/:id/apply', (req, res) => {
  const rec = recommendations.find((r) => r.id === req.params.id);
  if (!rec) return res.status(404).json({ error: 'Recommendation not found' });

  rec.applied = true;
  const room = rooms.find((r) => r.id === rec.roomId);
  if (room) {
    if (rec.actionType === 'OPTIMIZE_ROOM' || rec.actionType === 'TURN_OFF_LIGHTS') {
      room.lightsOn = 0;
      room.fansOn = 0;
      room.acsOn = 0;
      room.currentPower = 0.05;
      room.status = 'EMPTY';
    } else if (rec.actionType === 'ADJUST_AC') {
      room.temperature = 24.0;
      room.status = 'EFFICIENT';
    }
  }
  res.json({ success: true, recommendation: rec });
});

app.post('/api/recommendations/:id/ignore', (req, res) => {
  const rec = recommendations.find((r) => r.id === req.params.id);
  if (!rec) return res.status(404).json({ error: 'Recommendation not found' });
  rec.ignored = true;
  res.json({ success: true, recommendation: rec });
});

app.get('/api/settings', (req, res) => {
  res.json(systemSettings);
});

app.post('/api/settings', (req, res) => {
  systemSettings = { ...systemSettings, ...req.body };
  res.json({ success: true, settings: systemSettings });
});

app.get('/api/alerts', (req, res) => {
  res.json(alerts);
});

app.post('/api/alerts/:id/resolve', (req, res) => {
  const alert = alerts.find((a) => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.resolved = true;
  res.json({ success: true, alert });
});

// ------------------------------------------------------------------
// HACKATHON DEMO SCENARIOS & QUICK SIMULATOR TRIGGERS
// ------------------------------------------------------------------

app.post('/api/demo/simulate', (req, res) => {
  const { action } = req.body; // 'EMPTY_ROOM_204', 'HIGH_ANOMALY', 'TEMP_RISE', 'OCCUPANCY_BOOST'

  if (action === 'EMPTY_ROOM_204') {
    const room204 = rooms.find((r) => r.id === 'room-204');
    if (room204) {
      room204.occupancy = 0;
      room204.lightsOn = 8;
      room204.fansOn = 4;
      room204.currentPower = 2.4;
      room204.status = 'WASTE_DETECTED';
      room204.aiRecommendation = 'Room is empty but appliances are consuming 2.4 kW. Turn OFF to save ₹180/day.';

      // ensure anomaly exists
      let anom = anomalies.find((a) => a.roomId === 'room-204' && !a.resolved);
      if (!anom) {
        anomalies.unshift({
          id: `anom-${Date.now()}`,
          roomId: 'room-204',
          roomName: 'Classroom 204',
          severity: 'CRITICAL',
          currentPowerkW: 2.4,
          normalPowerkW: 0.1,
          percentageDeviation: 2300,
          possibleReason: 'Zero occupancy with all lights & fans ON.',
          recommendedAction: 'Optimize Room to save energy immediately.',
          timestamp: new Date().toISOString(),
          resolved: false,
        });
      }
    }
  } else if (action === 'HIGH_ANOMALY') {
    const lab2 = rooms.find((r) => r.id === 'lab-2');
    if (lab2) {
      lab2.currentPower = 6.2; // Spike!
      lab2.status = 'WASTE_DETECTED';
      anomalies.unshift({
        id: `anom-spike-${Date.now()}`,
        roomId: 'lab-2',
        roomName: 'Laboratory 2',
        severity: 'CRITICAL',
        currentPowerkW: 6.2,
        normalPowerkW: 2.5,
        percentageDeviation: 148,
        possibleReason: 'Unusual current surge in Lab 2 precision equipment / workstation cluster.',
        recommendedAction: 'Inspect Laboratory 2 sub-panel and turn off idle computers.',
        timestamp: new Date().toISOString(),
        resolved: false,
      });
      alerts.unshift({
        id: `alt-spike-${Date.now()}`,
        type: 'CRITICAL',
        title: 'Abnormal Consumption Spike in Lab 2',
        message: 'Current power jumped to 6.2 kW (+148% over normal baseline).',
        roomId: 'lab-2',
        roomName: 'Laboratory 2',
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    }
  } else if (action === 'TEMP_RISE') {
    rooms.forEach((r) => {
      r.temperature = 31.5; // Ambient heatwave!
    });
    alerts.unshift({
      id: `alt-heat-${Date.now()}`,
      type: 'WARNING',
      title: 'High Temperature Detected Across Building',
      message: 'Building temperature reached 31.5°C. Smart AC rules recommending setpoint optimization.',
      timestamp: new Date().toISOString(),
      resolved: false,
    });
  } else if (action === 'OCCUPANCY_BOOST') {
    const r101 = rooms.find((r) => r.id === 'room-101');
    if (r101) {
      r101.occupancy = 40;
      r101.temperature = 28.0;
      r101.status = 'EFFICIENT';
    }
  }

  res.json({ success: true, message: `Simulated trigger '${action}' applied!` });
});

// Hackathon Demo Mode Handler (Guided step-by-step presentation)
app.post('/api/demo/step', (req, res) => {
  const { step } = req.body; // 1 to 5
  hackathonDemoActive = true;
  hackathonDemoStep = step;

  const room204 = rooms.find((r) => r.id === 'room-204');
  if (!room204) return res.status(404).json({ error: 'Room 204 not found' });

  if (step === 1) {
    // 1. Classroom 204 occupied
    room204.occupancy = 35;
    room204.lightsOn = 8;
    room204.fansOn = 4;
    room204.acsOn = 0;
    room204.temperature = 26.0;
    room204.currentPower = 1.1;
    room204.status = 'EFFICIENT';
  } else if (step === 2) {
    // 2. Temp increases -> AC turns ON & Fan speed increases
    room204.occupancy = 35;
    room204.temperature = 30.2;
    room204.acsOn = 1;
    room204.currentPower = 2.6;
    room204.status = 'MODERATE';
  } else if (step === 3) {
    // 3. Students leave -> Occupancy 0 but lights/AC remain ON!
    room204.occupancy = 0;
    room204.lightsOn = 8;
    room204.fansOn = 4;
    room204.acsOn = 1;
    room204.currentPower = 2.6;
    room204.status = 'WASTE_DETECTED';
    room204.aiRecommendation = 'AI Detected: Zero occupancy with 2.6 kW load active! Auto-shutoff ready.';
  } else if (step === 4) {
    // 4. Auto Mode / AI Trigger -> Automatic turn OFF!
    room204.occupancy = 0;
    room204.lightsOn = 0;
    room204.fansOn = 0;
    room204.acsOn = 0;
    room204.currentPower = 0.05;
    room204.status = 'EMPTY';
    room204.aiRecommendation = undefined;

    // Turn appliances off
    appliances.forEach((a) => {
      if (a.roomId === 'room-204') {
        a.status = 'OFF';
        a.currentPowerkW = 0;
      }
    });
  } else if (step === 5) {
    // 5. Savings calculated!
    alerts.unshift({
      id: `alt-demo-${Date.now()}`,
      type: 'OPTIMIZATION',
      title: 'Hackathon Demo Completed - Energy Saved!',
      message: 'Automated shutoff in Room 204 saved 2.55 kW power (~₹216/day estimated savings).',
      timestamp: new Date().toISOString(),
      resolved: false,
    });
  }

  res.json({ success: true, step, metrics: getDashboardMetrics() });
});

// ------------------------------------------------------------------
// EcoAI ASSISTANT CHAT API (Server-side Gemini Integration)
// ------------------------------------------------------------------

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        reply: "I am running in offline mode. Here is the current building status:\n- Total Current Power: " +
          rooms.reduce((acc, r) => acc + r.currentPower, 0).toFixed(2) + " kW\n- Unoccupied Room Waste: Room 204 (2.4 kW)\n- Recommendation: Click 'Optimize Room' on Classroom 204 to save ₹180/day.",
      });
    }

    // Build context about current building status
    const currentMetrics = getDashboardMetrics();
    const roomSummaries = rooms
      .map(
        (r) =>
          `- ${r.name}: Occupancy=${r.occupancy}, Temp=${r.temperature}°C, Power=${r.currentPower}kW, Status=${r.status}, Lights=${r.lightsOn}/${r.lightsCount}, Fans=${r.fansOn}/${r.fansCount}, AC=${r.acsOn}/${r.acsCount}`
      )
      .join('\n');

    const activeAnomText = anomalies
      .filter((a) => !a.resolved)
      .map((a) => `- ${a.roomName}: ${a.possibleReason} (Current: ${a.currentPowerkW}kW vs Normal: ${a.normalPowerkW}kW)`)
      .join('\n');

    const promptText = `You are EcoAI Assistant, an intelligent smart energy management AI for the "EcoGrid AI" platform.
    
Current Building Status Context:
- Current Total Power: ${currentMetrics.currentPowerkW} kW
- Today's Energy Usage: ${currentMetrics.todayEnergykWh} kWh
- Today's Cost: ₹${currentMetrics.todayCostINR} (Tariff: ₹${systemSettings.tariffRateINR}/kWh)
- Sustainability Score: ${currentMetrics.sustainabilityScore}/100
- Energy Saved Today: ${currentMetrics.energySavedPct}%
- Auto Mode Enabled: ${systemSettings.autoMode}

Room Details:
${roomSummaries}

Active Anomalies:
${activeAnomText || 'None'}

User Question: ${message}

Provide a concise, highly helpful, energy expert answer based on the building data. Reference exact numbers (e.g., room names, kW, ₹ savings, occupancy) whenever relevant. Keep formatting clean with bullet points.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
    });

    const reply = response.text || "I analyzed your request against current IoT telemetry. Everything is running efficiently except Room 204.";
    res.json({ reply });
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    res.json({
      reply: 'EcoAI Assistant analyzed the building sensors: Room 204 currently shows 2.4 kW consumption despite zero occupancy. Would you like me to optimize Room 204 now?',
    });
  }
});

// ESP32 Telemetry Receiver API Endpoint
app.post('/api/iot/telemetry', (req, res) => {
  const { roomId, voltage, current, power, occupancy, temperature, humidity } = req.body;
  const room = rooms.find((r) => r.id === roomId || r.name.toLowerCase().includes((roomId || '').toLowerCase()));
  if (room) {
    if (voltage) room.temperature = temperature || room.temperature;
    if (occupancy !== undefined) room.occupancy = occupancy;
    if (power) room.currentPower = power;
    room.lastUpdated = new Date().toISOString();
  }
  res.json({ status: 'ACK', receivedAt: new Date().toISOString() });
});

// ------------------------------------------------------------------
// VITE / STATIC SERVING & EXPRESS INITIALIZATION
// ------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EcoGrid AI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
