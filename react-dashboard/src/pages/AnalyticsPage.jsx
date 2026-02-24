import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, Legend,
} from 'recharts';
import { BarChart3, TrendingUp, Activity, Flame } from 'lucide-react';
import { useSensorStore } from '../stores/useSensorStore';

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } } },
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card-bg border border-border rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm">
      <p className="text-xs text-text-tertiary mb-1.5 font-medium">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-sm text-text-primary font-semibold">{entry.value?.toFixed(1)}</span>
          <span className="text-xs text-text-tertiary">{entry.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const sensors = useSensorStore((s) => s.deviceSensors[s.activeDeviceId] || {});
  const activeDevice = useSensorStore((s) => s.devices.find((d) => d.id === s.activeDeviceId));
  const theme = useSensorStore((s) => s.theme);
  const isDark = theme === 'dark';

  const textColor = isDark ? '#94A3B8' : '#6B7280';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : '#E5E5E3';
  const primaryColor = isDark ? '#00F0FF' : '#2D7A6F';
  const accentColor = isDark ? '#FF2A6D' : '#E8731A';

  // Temperature vs CO2 correlation data from history
  const correlationData = useMemo(() => {
    const temp = sensors.temperature?.history || [];
    const co2 = sensors.eco2?.history || [];
    const len = Math.min(temp.length, co2.length, 20);
    if (len < 2) return [];
    return Array.from({ length: len }, (_, i) => ({
      time: `${i + 1}`,
      temperature: temp[temp.length - len + i],
      co2: (co2[co2.length - len + i] || 400) / 100,
    }));
  }, [sensors.temperature?.history, sensors.eco2?.history]);

  // Weekly alert frequency (simulated from history patterns)
  const alertData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const co = sensors.co?.history || [];
    return days.map((day, i) => ({
      day,
      alerts: Math.max(0, Math.round((co[i * 3] || 0) / 10)),
      warnings: Math.max(0, Math.round((co[i * 2] || 0) / 15)),
    }));
  }, [sensors.co?.history]);

  // Sensor performance data
  const performanceData = useMemo(() => {
    return Object.values(sensors).slice(0, 6).map((s) => ({
      name: s.label?.split(' ')[0] || s.id,
      uptime: 85 + Math.random() * 15,
      readings: s.history?.length || 0,
    }));
  }, [sensors]);

  return (
    <motion.div className="h-full p-6 overflow-auto" initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={stagger.container}>
      <div className="max-w-[1440px] mx-auto space-y-5">
        {/* Header */}
        <motion.div className="flex items-end justify-between" variants={stagger.item}>
          <div>
            <h1 className="font-display font-bold text-[32px] text-text-primary tracking-tight leading-none">Analytics</h1>
            <p className="text-[13px] text-text-secondary mt-2">{activeDevice?.name} · Data Command Center</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-primary-lighter text-primary text-xs font-semibold">Last 24h</span>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div className="grid grid-cols-4 gap-4" variants={stagger.item}>
          {[
            { label: 'Avg Temperature', value: sensors.temperature?.value?.toFixed(1) || '—', unit: '°C', icon: Flame, color: primaryColor },
            { label: 'Air Quality Index', value: sensors['air-quality']?.value?.toFixed(0) || '—', unit: 'IAQ', icon: Activity, color: '#8B5CF6' },
            { label: 'CO Level', value: sensors.co?.value?.toFixed(1) || '—', unit: 'ppm', icon: TrendingUp, color: accentColor },
            { label: 'Data Points', value: sensors.temperature?.history?.length || 0, unit: 'readings', icon: BarChart3, color: isDark ? '#00FF88' : '#16A34A' },
          ].map((stat, i) => (
            <div key={i} className={`bg-card-bg border border-border rounded-[18px] p-4 shadow-sm ${isDark ? 'glow-card' : ''}`}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: stat.color + '15', color: stat.color }}>
                  <stat.icon size={17} />
                </div>
                <span className="text-[11px] text-text-tertiary uppercase tracking-wide">{stat.label}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-bold text-[26px] text-text-primary tracking-tight">{stat.value}</span>
                <span className="text-xs text-text-tertiary">{stat.unit}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-12 gap-5">
          {/* Temperature vs CO2 Correlation */}
          <motion.div className="col-span-7" variants={stagger.item}>
            <div className={`bg-card-bg border border-border rounded-[20px] p-5 shadow-sm ${isDark ? 'glow-card' : ''}`}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-display font-bold text-lg text-text-primary">Temperature vs eCO₂</h3>
                  <p className="text-xs text-text-tertiary mt-0.5">Correlation analysis over time</p>
                </div>
              </div>
              <div className="h-[280px]">
                {correlationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={correlationData}>
                      <defs>
                        <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={primaryColor} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={accentColor} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="time" tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
                      <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, color: textColor }} />
                      <Area type="monotone" dataKey="temperature" name="Temp (°C)" stroke={primaryColor} fill="url(#tempGrad)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="co2" name="eCO₂ (x100)" stroke={accentColor} fill="url(#co2Grad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-text-tertiary text-sm">Collecting data...</div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Weekly Alert Frequency */}
          <motion.div className="col-span-5" variants={stagger.item}>
            <div className={`bg-card-bg border border-border rounded-[20px] p-5 shadow-sm ${isDark ? 'glow-card' : ''}`}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-display font-bold text-lg text-text-primary">Weekly Alert Frequency</h3>
                  <p className="text-xs text-text-tertiary mt-0.5">Alerts & warnings by day</p>
                </div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={alertData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="day" tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
                    <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: textColor }} />
                    <Bar dataKey="alerts" name="Alerts" fill={isDark ? '#FF4757' : '#DC2626'} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="warnings" name="Warnings" fill={isDark ? '#FFB800' : '#D97706'} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sensor Performance */}
        <motion.div variants={stagger.item}>
          <div className={`bg-card-bg border border-border rounded-[20px] p-5 shadow-sm ${isDark ? 'glow-card' : ''}`}>
            <h3 className="font-display font-bold text-lg text-text-primary mb-5">Sensor Performance</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="uptime" name="Uptime %" fill={primaryColor} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
