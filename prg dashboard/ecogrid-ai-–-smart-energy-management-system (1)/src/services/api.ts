import {
  DashboardData,
  Room,
  Appliance,
  SensorTelemetry,
  PredictionSummary,
  Anomaly,
  Recommendation,
  Alert,
  SystemSettings,
  ScheduleOverride,
} from '../types';

export const fetchDashboardData = async (): Promise<DashboardData> => {
  const res = await fetch('/api/dashboard');
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  return res.json();
};

export const fetchRooms = async (): Promise<Room[]> => {
  const res = await fetch('/api/rooms');
  if (!res.ok) throw new Error('Failed to fetch rooms');
  return res.json();
};

export const optimizeRoom = async (
  roomId: string,
  mode?: string
): Promise<{ success: boolean; room: Room; savedkW?: number; message: string }> => {
  const res = await fetch(`/api/rooms/${roomId}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  if (!res.ok) throw new Error('Failed to optimize room');
  return res.json();
};

export const optimizeAllRooms = async (): Promise<{
  success: boolean;
  totalSavedkW: number;
  optimizedCount: number;
  message: string;
}> => {
  const res = await fetch('/api/rooms/optimize-all', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to optimize all rooms');
  return res.json();
};

export const fetchAppliances = async (): Promise<Appliance[]> => {
  const res = await fetch('/api/appliances');
  if (!res.ok) throw new Error('Failed to fetch appliances');
  return res.json();
};

export const bulkSetAutoControl = async (
  type: 'light' | 'fan' | 'light_fan' | 'all' = 'light_fan',
  autoControlled: boolean = true
): Promise<{ success: boolean; count: number; message: string; appliances: Appliance[] }> => {
  const res = await fetch('/api/appliances/auto-control/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, autoControlled }),
  });
  if (!res.ok) throw new Error('Failed to bulk update auto-control access');
  return res.json();
};

export const toggleAutoControl = async (
  applianceId: string,
  autoControlled?: boolean
): Promise<{ success: boolean; appliance: Appliance }> => {
  const res = await fetch(`/api/appliances/${applianceId}/auto-control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ autoControlled }),
  });
  if (!res.ok) throw new Error('Failed to update auto-control access');
  return res.json();
};

export const updateAppliance = async (
  applianceId: string,
  updates: Partial<Appliance>
): Promise<{ success: boolean; appliance: Appliance; message: string }> => {
  const res = await fetch(`/api/appliances/${applianceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update appliance details');
  return res.json();
};

export const toggleAppliance = async (applianceId: string): Promise<{ success: boolean; appliance: Appliance }> => {
  const res = await fetch(`/api/appliances/${applianceId}/toggle`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to toggle appliance');
  return res.json();
};

export const setFanSpeed = async (applianceId: string, speed: number): Promise<{ success: boolean; appliance: Appliance }> => {
  const res = await fetch(`/api/appliances/${applianceId}/speed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speed }),
  });
  if (!res.ok) throw new Error('Failed to update fan speed');
  return res.json();
};

export const fetchEnergyTelemetry = async (): Promise<SensorTelemetry> => {
  const res = await fetch('/api/energy');
  if (!res.ok) throw new Error('Failed to fetch telemetry');
  return res.json();
};

export const fetchEnergyHistory = async (): Promise<SensorTelemetry[]> => {
  const res = await fetch('/api/energy/history');
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
};

export const fetchPredictions = async (): Promise<PredictionSummary> => {
  const res = await fetch('/api/predictions');
  if (!res.ok) throw new Error('Failed to fetch predictions');
  return res.json();
};

export const fetchAnomalies = async (): Promise<Anomaly[]> => {
  const res = await fetch('/api/anomalies');
  if (!res.ok) throw new Error('Failed to fetch anomalies');
  return res.json();
};

export const fetchRecommendations = async (): Promise<Recommendation[]> => {
  const res = await fetch('/api/recommendations');
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  return res.json();
};

export const applyRecommendation = async (recId: string): Promise<{ success: boolean }> => {
  const res = await fetch(`/api/recommendations/${recId}/apply`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to apply recommendation');
  return res.json();
};

export const ignoreRecommendation = async (recId: string): Promise<{ success: boolean }> => {
  const res = await fetch(`/api/recommendations/${recId}/ignore`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to ignore recommendation');
  return res.json();
};

export const fetchSettings = async (): Promise<SystemSettings> => {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
};

export const updateSettings = async (settings: Partial<SystemSettings>): Promise<{ success: boolean; settings: SystemSettings }> => {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
};

export const fetchAlerts = async (): Promise<Alert[]> => {
  const res = await fetch('/api/alerts');
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
};

export const resolveAlert = async (alertId: string): Promise<{ success: boolean }> => {
  const res = await fetch(`/api/alerts/${alertId}/resolve`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to resolve alert');
  return res.json();
};

export const sendChatMessage = async (message: string, history?: any[]): Promise<string> => {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error('Failed to chat with AI');
  const data = await res.json();
  return data.reply;
};

export const triggerDemoStep = async (step: number): Promise<{ success: boolean }> => {
  const res = await fetch('/api/demo/step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step }),
  });
  if (!res.ok) throw new Error('Failed to trigger demo step');
  return res.json();
};

export const triggerQuickSimulator = async (action: string): Promise<{ success: boolean; message: string }> => {
  const res = await fetch('/api/demo/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error('Failed to simulate scenario');
  return res.json();
};

export const fetchSchedules = async (): Promise<ScheduleOverride[]> => {
  const res = await fetch('/api/schedules');
  if (!res.ok) throw new Error('Failed to fetch schedules');
  return res.json();
};

export const createSchedule = async (scheduleData: {
  roomId: string;
  title: string;
  action: string;
  actionLabel?: string;
  startTime: string;
  endTime: string;
  days: string[];
  notes?: string;
}): Promise<{ success: boolean; schedule: ScheduleOverride }> => {
  const res = await fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scheduleData),
  });
  if (!res.ok) throw new Error('Failed to create schedule override');
  return res.json();
};

export const toggleSchedule = async (id: string): Promise<{ success: boolean; schedule: ScheduleOverride }> => {
  const res = await fetch(`/api/schedules/${id}/toggle`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to toggle schedule override');
  return res.json();
};

export const deleteSchedule = async (id: string): Promise<{ success: boolean }> => {
  const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete schedule override');
  return res.json();
};
