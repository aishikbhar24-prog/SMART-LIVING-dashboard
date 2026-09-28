import React, { useState } from 'react';
import {
  Settings,
  Cpu,
  ShieldCheck,
  Code,
  Save,
  CheckCircle2,
  Terminal,
  Copy,
  Check,
  BrainCircuit,
  Zap,
  Bell,
  Mail,
} from 'lucide-react';
import { SystemSettings } from '../types';

interface SettingsViewProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const [form, setForm] = useState<SystemSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const esp32CodeSnippet = `// ESP32 Smart Energy & Occupancy Sensor Node for EcoGrid AI
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "https://your-app-url.run.app/api/iot/telemetry";

#define PIR_PIN 13       // Occupancy sensor
#define DHT_PIN 14       // Temp/Humidity
#define CURRENT_PIN 34   // ACS712 current sensor
#define RELAY_PIN 27     // Light/Fan control relay

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
}

void loop() {
  int occupancy = digitalRead(PIR_PIN);
  float voltage = 220.0;
  float current = analogRead(CURRENT_PIN) * 0.01; // Scale factor
  float power = (voltage * current) / 1000.0; // kW

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["roomId"] = "room-204";
    doc["occupancy"] = occupancy;
    doc["voltage"] = voltage;
    doc["current"] = current;
    doc["power"] = power;
    doc["temperature"] = 28.5;

    String jsonString;
    serializeJson(doc, jsonString);
    int httpResponseCode = http.POST(jsonString);
    http.end();
  }
  delay(3000); // Send telemetry every 3s
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(esp32CodeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          <span>Automation Rules & Hardware Integration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure smart automation rules, view ESP32 IoT microcontroller C++ code, and review hackathon architecture
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Automation Rules Configuration */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Automation Engine Parameters</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="font-bold text-slate-200 block">System Auto-Mode</span>
                <span className="text-slate-400">Automatically control appliances upon zero occupancy</span>
              </div>
              <input
                type="checkbox"
                checked={form.autoMode}
                onChange={(e) => setForm({ ...form, autoMode: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Empty Room Auto-Shutoff Timeout (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={form.emptyRoomTimeoutMins}
                onChange={(e) => setForm({ ...form, emptyRoomTimeoutMins: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                High Temperature AC Trigger Threshold (°C)
              </label>
              <input
                type="number"
                min="20"
                max="40"
                value={form.tempHighThresholdC}
                onChange={(e) => setForm({ ...form, tempHighThresholdC: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Alert & Notification Preferences Section */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-extrabold text-amber-300 uppercase flex items-center gap-1.5">
                <Bell className="w-4 h-4" />
                <span>Alert & Notification Preferences</span>
              </h4>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-200 block">Email Notifications for Critical Anomalies</span>
                    <span className="text-slate-400">Instantly email facility managers upon severe energy waste detection</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.emailAlertsEnabled ?? true}
                  onChange={(e) => setForm({ ...form, emailAlertsEnabled: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
                />
              </div>

              {form.emailAlertsEnabled !== false && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Recipient Email Address for Critical Alerts
                  </label>
                  <input
                    type="email"
                    value={form.alertRecipientEmail || 'admin@ecocampus.ai'}
                    onChange={(e) => setForm({ ...form, alertRecipientEmail: e.target.value })}
                    placeholder="admin@ecocampus.ai"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Consumption Warning Threshold (kW Building Load)
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  step="0.5"
                  value={form.consumptionWarningThresholdkW ?? 15.0}
                  onChange={(e) => setForm({ ...form, consumptionWarningThresholdkW: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Trigger automated warning alerts when total building power consumption exceeds this threshold.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all mt-2"
            >
              <Save className="w-4 h-4" />
              <span>Save System & Alert Settings</span>
            </button>

            {saved && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold text-center flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Settings and alert preferences updated successfully!</span>
              </div>
            )}
          </form>
        </div>

        {/* ESP32 Hardware Integration Guide */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>ESP32 Hardware Connection Guide</span>
            </h3>
            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied C++' : 'Copy C++ Code'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Connect an ESP32 microcontroller with a PIR motion sensor, ACS712 current sensor, and 4-channel relay module. Flash the code below to send live IoT telemetry directly to our REST API.
          </p>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-56">
            <pre>{esp32CodeSnippet}</pre>
          </div>
        </div>
      </div>

      {/* Hackathon Judge System Architecture Explanation */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <BrainCircuit className="w-5 h-5 text-indigo-400" />
          <span>Hackathon System Architecture & Technical Explanation</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-emerald-400 flex items-center space-x-1">
              <Zap className="w-4 h-4" />
              <span>1. How the System Works & Communications</span>
            </h4>
            <p className="text-slate-300 leading-relaxed">
              IoT sensors (or our realistic physics simulation mode) stream voltage, current, power factor, and occupancy data to the Express backend every 3 seconds. The backend runs continuous Isolation Forest anomaly checks and calculates real-time room power loads.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-indigo-400 flex items-center space-x-1">
              <BrainCircuit className="w-4 h-4" />
              <span>2. AI/ML Integration & EcoAI Assistant</span>
            </h4>
            <p className="text-slate-300 leading-relaxed">
              We leverage Google's <code>@google/genai</code> SDK on the server-side with <code>gemini-3.6-flash</code> to power the <strong>EcoAI Assistant</strong>. The assistant is injected with live room telemetry, current power metrics, and anomalies to answer complex energy management queries in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
