import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  PieChart as PieIcon,
  Filter,
  TrendingDown,
  Download,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Room, Appliance } from '../types';

interface AnalyticsViewProps {
  rooms: Room[];
  appliances: Appliance[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ rooms, appliances }) => {
  const [timeRange, setTimeRange] = useState('7d');

  // Appliance-wise consumption data
  const applianceWiseData = [
    { name: 'Air Conditioners', value: 19.8, color: '#10b981' },
    { name: 'Classroom Lighting', value: 11.2, color: '#f59e0b' },
    { name: 'Ceiling Fans', value: 5.4, color: '#06b6d4' },
    { name: 'Lab Computers', value: 6.3, color: '#8b5cf6' },
    { name: 'Projectors / Others', value: 1.8, color: '#ec4899' },
  ];

  // Room-wise consumption data
  const roomWiseData = rooms.map((r) => ({
    name: r.name,
    energy: r.todayEnergy,
    cost: Math.round(r.todayEnergy * 8.5),
  }));

  // Daily trend data (Last 7 days)
  const dailyTrendData = [
    { day: 'Mon', actual: 44.2, predicted: 45.0, cost: 375 },
    { day: 'Tue', actual: 41.8, predicted: 43.1, cost: 355 },
    { day: 'Wed', actual: 48.5, predicted: 46.2, cost: 412 },
    { day: 'Thu', actual: 39.0, predicted: 40.5, cost: 331 },
    { day: 'Fri', actual: 42.1, predicted: 42.0, cost: 357 },
    { day: 'Sat', actual: 22.4, predicted: 24.0, cost: 190 },
    { day: 'Sun (Today)', actual: 38.6, predicted: 42.5, cost: 328 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Energy Analytics & Consumption Intelligence</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-granularity appliance, room & cost breakdown charts
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {['today', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeRange === range
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {range === 'today' ? 'Today' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Energy Consumption Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-1">Daily Energy Consumption (kWh)</h3>
          <p className="text-xs text-slate-400 mb-4">Daily total building electricity usage trend</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="actual" name="Energy (kWh)" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room-Wise Consumption Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-1">Room-Wise Energy Consumption</h3>
          <p className="text-xs text-slate-400 mb-4">Total energy (kWh) consumed per room today</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomWiseData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={110} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="energy" name="Energy (kWh)" fill="#06b6d4" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Appliance Share Pie Chart & Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appliance Share Pie */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center space-x-2">
            <PieIcon className="w-4 h-4 text-amber-400" />
            <span>Appliance Category Breakdown</span>
          </h3>
          <p className="text-xs text-slate-400 mb-2">Distribution of total power load by appliance type</p>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={applianceWiseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {applianceWiseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 text-xs border-t border-slate-800 font-mono">
            {applianceWiseData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 font-sans">{item.name}</span>
                </div>
                <span className="font-bold text-slate-200">{item.value} kWh</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Analysis Card */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Electricity Cost & Savings Summary</h3>
            <p className="text-xs text-slate-400 mb-4">Financial impact of EcoGrid AI automated optimization</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-4 font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Current Daily Cost</span>
                <span className="text-xl font-bold text-white">₹328</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Unoptimized Daily Cost</span>
                <span className="text-xl font-bold text-rose-400">₹403</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block font-sans">Daily Net Savings</span>
                <span className="text-xl font-bold text-emerald-400">₹75 / day</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              💡 <strong>EcoGrid Optimization Insight:</strong> By automatically shutting down lights and fans in empty classrooms (such as Classroom 204), the building saves approximately <strong>₹2,250 every month</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
