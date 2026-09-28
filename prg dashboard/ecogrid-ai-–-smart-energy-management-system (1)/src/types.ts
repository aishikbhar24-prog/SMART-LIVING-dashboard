export type OperatingMode = 'LIVE' | 'SIMULATION';

export interface Room {
  id: string;
  name: string;
  type: 'classroom' | 'laboratory' | 'office' | 'auditorium' | 'home';
  floor: number;
  occupancy: number;
  maxCapacity: number;
  temperature: number; // in Celsius
  humidity: number; // in %
  currentPower: number; // in kW
  todayEnergy: number; // in kWh
  status: 'EFFICIENT' | 'MODERATE' | 'WASTE_DETECTED' | 'EMPTY';
  lightsCount: number;
  lightsOn: number;
  fansCount: number;
  fansOn: number;
  acsCount: number;
  acsOn: number;
  projectorOn: boolean;
  computersOn: number;
  lastUpdated: string;
  aiRecommendation?: string;
}

export interface Appliance {
  id: string;
  name: string;
  type: 'light' | 'fan' | 'ac' | 'projector' | 'computer' | 'other';
  roomId: string;
  roomName: string;
  status: 'ON' | 'OFF';
  powerRatingW: number; // in Watts
  currentPowerkW: number; // in kW
  fanSpeed?: number; // 0-100% if fan
  temperatureSetPoint?: number; // if AC
  runtimeMinutesToday: number;
  energyConsumedkWh: number;
  autoControlled: boolean;
}

export interface SensorTelemetry {
  timestamp: string;
  totalPowerkW: number;
  todayEnergykWh: number;
  voltageV: number;
  currentA: number;
  powerFactor: number;
  avgTemperatureC: number;
  avgHumidityPct: number;
  totalOccupancy: number;
  mode: OperatingMode;
}

export interface EnergyPrediction {
  period: string;
  actualkWh?: number;
  predictedkWh: number;
  confidence: number;
  timestamp: string;
}

export interface PredictionSummary {
  nextHourkWh: number;
  todayTotalForecastkWh: number;
  tomorrowForecastkWh: number;
  next7DaysTotalForecastkWh: number;
  actualVsPredictedHistory: EnergyPrediction[];
}

export interface Anomaly {
  id: string;
  roomId: string;
  roomName: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  currentPowerkW: number;
  normalPowerkW: number;
  percentageDeviation: number;
  possibleReason: string;
  recommendedAction: string;
  timestamp: string;
  resolved: boolean;
}

export interface Recommendation {
  id: string;
  roomId: string;
  roomName: string;
  title: string;
  reason: string;
  expectedEnergySavingkWhDay: number;
  estimatedCostSavingMonthly: number; // in INR ₹
  actionType: 'TURN_OFF_LIGHTS' | 'REDUCE_FAN_SPEED' | 'ADJUST_AC' | 'OPTIMIZE_ROOM' | 'SCHEDULE_OFF';
  applied: boolean;
  ignored: boolean;
  timestamp: string;
}

export interface Alert {
  id: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO' | 'OPTIMIZATION';
  title: string;
  message: string;
  roomId?: string;
  roomName?: string;
  timestamp: string;
  resolved: boolean;
}

export interface RoomOptimizationProgress {
  roomId: string;
  stepIndex: number;
  totalSteps: number;
  stepText: string;
  activeApplianceType?: 'light' | 'ac' | 'fan' | 'projector' | 'general';
  percent: number;
  isComplete?: boolean;
}

export type OptimizationProgressMap = Record<string, RoomOptimizationProgress>;

export interface ScheduleOverride {
  id: string;
  roomId: string;
  roomName: string;
  title: string;
  action: 'KEEP_AC_ON' | 'FORCE_SHUTDOWN' | 'PRE_COOL' | 'KEEP_LIGHTS_ON' | 'CUSTOM';
  actionLabel: string;
  startTime: string;
  endTime: string;
  days: string[];
  active: boolean;
  notes?: string;
  createdAt: string;
}

export interface DashboardData {
  currentPowerkW: number;
  todayEnergykWh: number;
  todayCostINR: number;
  co2SavedKg: number;
  energySavedPct: number;
  sustainabilityScore: number; // 0-100
  activeAnomaliesCount: number;
  activeRecommendationsCount: number;
  autoModeEnabled: boolean;
  mode: OperatingMode;
  tariffRateINR: number; // ₹ per kWh
  demoStep?: number;
  demoActive?: boolean;
}

export interface SystemSettings {
  autoMode: boolean;
  emptyRoomTimeoutMins: number;
  tempHighThresholdC: number;
  acAutoOnAllowed: boolean;
  tariffRateINR: number;
  mode: OperatingMode;
  anomalySensitivityPct: number; // e.g. 50% above baseline
  emailAlertsEnabled: boolean;
  alertRecipientEmail: string;
  consumptionWarningThresholdkW: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  quickActions?: { label: string; action: string }[];
}

export interface EnergyHistoryItem {
  timeLabel: string;
  actualkW: number;
  predictedkW: number;
  costINR: number;
  co2Kg: number;
}
