import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Thermometer, Droplets, Wind, Activity, AlertTriangle, Skull,
  Cloud, Leaf, Flame, Gauge, Zap, MapPin, Wifi, WifiOff,
  TrendingUp, TrendingDown, Minus, Search, Filter,
} from 'lucide-react';
import { useSensorStore, SENSOR_CONFIG } from '../stores/useSensorStore';

const SENSOR_ICONS = {
  temperature: Thermometer, humidity: Droplets, gas: Wind, 'air-quality': Activity,
  no2: AlertTriangle, co: Skull, tvoc: Cloud, eco2: Leaf,
  'surface-temp': Flame, 'surface-temp-2': Flame, pressure: Gauge, current: Zap,
};

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } } },
  item: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } },
};

const FILTERS = [
  { id: 'all', label: 'All Sensors', color: 'primary' },
  { id: 'critical', label: 'Critical', color: 'danger' },
  { id: 'warning', label: 'Warning', color: 'warning' },
  { id: 'normal', label: 'Normal', color: 'success' },
];

/* ─── Mini Sparkline SVG ─── */
function Sparkline({ data, color = '#2D7A6F', width = 90, height = 32 }) {
  if (!data || data.length < 2) return <div style={{ width, height }} className="bg-surface rounded" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 3;
  const xStep = (width - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => `${pad + i * xStep},${height - pad - ((v - min) / range) * (height - pad * 2)}`).join(' ');
  const uid = `sp-${color.replace('#', '')}-${data.length}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${pad},${height - pad} ${pts} ${width - pad},${height - pad}`} fill={`url(#${uid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width - pad} cy={height - pad - ((data[data.length - 1] - min) / range) * (height - pad * 2)} r="2.5" fill={color} />
    </svg>
  );
}

/* ─── Sensor Card ─── */
function SensorCard({ sensorId, sensor, onLocate }) {
  const Icon = SENSOR_ICONS[sensorId] || Activity;
  const config = SENSOR_CONFIG[sensorId] || {};
  const statusColor = sensor.status === 'critical' ? '#DC2626' : sensor.status === 'warning' ? '#D97706' : '#16A34A';
  const chartColor = sensor.status === 'critical' ? '#DC2626' : sensor.status === 'warning' ? '#D97706' : config.color || '#2D7A6F';

  const TrendIcon = sensor.trend === 'rising' ? TrendingUp : sensor.trend === 'falling' ? TrendingDown : Minus;
  const trendColor = sensor.trend === 'rising' ? 'text-accent' : sensor.trend === 'falling' ? 'text-primary' : 'text-text-tertiary';

  return (
    <motion.div
      variants={stagger.item}
      className={`glass rounded-2xl p-4 relative overflow-hidden group transition-all duration-200 hover:shadow-lg ${
        sensor.status === 'critical' ? 'ring-1 ring-danger/20' : ''
      }`}
      layout
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: (config.color || '#2D7A6F') + '14', color: config.color || '#2D7A6F' }}
          >
            <Icon size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{sensor.label}</p>
            <p className="text-[10px] text-text-tertiary">Floor {sensor.position?.floor ?? 0}</p>
          </div>
        </div>
        {/* Connection dot */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${sensor.lastUpdate ? 'bg-success' : 'bg-danger'}`} />
          <span className="text-[10px] text-text-tertiary">{sensor.lastUpdate ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* Value + Sparkline */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-bold text-2xl text-text-primary tabular-nums">
              {sensor.value.toFixed(1)}
            </span>
            <span className="text-xs text-text-tertiary">{sensor.unit}</span>
            <TrendIcon size={14} className={trendColor} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: statusColor + '12', color: statusColor }}
            >
              {sensor.status}
            </span>
          </div>
        </div>
        <Sparkline data={sensor.history?.slice(-20)} color={chartColor} width={100} height={36} />
      </div>

      {/* Range bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[9px] text-text-tertiary mb-1 tabular-nums">
          <span>{config.min ?? 0}</span>
          <span>{config.max ?? 100}</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: chartColor }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, ((sensor.value - (config.min ?? 0)) / ((config.max ?? 100) - (config.min ?? 0))) * 100))}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Locate button */}
      <button
        className="w-full py-2 rounded-xl bg-surface text-xs font-semibold text-text-secondary hover:bg-primary hover:text-white transition-all duration-200 flex items-center justify-center gap-1.5"
        onClick={() => onLocate(sensorId)}
      >
        <MapPin size={12} /> Locate in 3D
      </button>
    </motion.div>
  );
}

/* ═══════════════════════ Sensors Page ═══════════════════════ */
export default function SensorsPage() {
  const sensors = useSensorStore((s) => s.deviceSensors[s.activeDeviceId] || {});
  const activeDevice = useSensorStore((s) => s.devices.find((d) => d.id === s.activeDeviceId));
  const setCameraTarget = useSensorStore((s) => s.setCameraTarget);
  const setActivePage = useSensorStore((s) => s.setActivePage);
  const selectSensor = useSensorStore((s) => s.selectSensor);

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSensors = useMemo(() => {
    return Object.entries(sensors).filter(([id, sensor]) => {
      if (activeFilter !== 'all' && sensor.status !== activeFilter) return false;
      if (searchQuery && !sensor.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [sensors, activeFilter, searchQuery]);

  const stats = useMemo(() => {
    const all = Object.values(sensors);
    return {
      total: all.length,
      critical: all.filter((s) => s.status === 'critical').length,
      warning: all.filter((s) => s.status === 'warning').length,
      normal: all.filter((s) => s.status === 'normal').length,
    };
  }, [sensors]);

  const handleLocate = (sensorId) => {
    setCameraTarget(sensorId);
    selectSensor(sensorId);
    setActivePage('dashboard');
  };

  return (
    <motion.div
      className="h-full overflow-auto bg-page-bg"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-[1400px] mx-auto p-6">
        {/* Header */}
        <motion.div className="mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-bold text-[28px] text-text-primary tracking-tight">
            Sensor Command Center
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            {activeDevice?.name} &middot; {activeDevice?.location} &middot; {stats.total} active sensors
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          className="grid grid-cols-4 gap-3 mb-6"
          initial="hidden" animate="visible" variants={stagger.container}
        >
          {[
            { label: 'Total', value: stats.total, color: '#2D7A6F', icon: Activity },
            { label: 'Critical', value: stats.critical, color: '#DC2626', icon: AlertTriangle },
            { label: 'Warning', value: stats.warning, color: '#D97706', icon: Flame },
            { label: 'Normal', value: stats.normal, color: '#16A34A', icon: Wifi },
          ].map((stat) => (
            <motion.div key={stat.label} variants={stagger.item} className="glass-strong rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: stat.color + '12', color: stat.color }}>
                <stat.icon size={18} />
              </div>
              <div>
                <p className="font-display font-bold text-xl text-text-primary">{stat.value}</p>
                <p className="text-[11px] text-text-tertiary">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filter bar */}
        <motion.div
          className="flex items-center gap-3 mb-6 flex-wrap"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        >
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-[320px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search sensors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-1.5">
            {FILTERS.map((f) => {
              const isActive = activeFilter === f.id;
              const count = f.id === 'all' ? stats.total : stats[f.id] ?? 0;
              return (
                <button
                  key={f.id}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? `bg-${f.color} text-white shadow-sm`
                      : 'bg-surface text-text-secondary hover:bg-surface-dark'
                  }`}
                  style={isActive ? { backgroundColor: `var(--${f.color})`, color: 'white' } : {}}
                  onClick={() => setActiveFilter(f.id)}
                >
                  {f.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20' : 'bg-border'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Sensor grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          initial="hidden" animate="visible" variants={stagger.container}
        >
          <AnimatePresence mode="popLayout">
            {filteredSensors.map(([id, sensor]) => (
              <SensorCard key={id} sensorId={id} sensor={sensor} onLocate={handleLocate} />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredSensors.length === 0 && (
          <motion.div
            className="text-center py-16 text-text-tertiary"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <Filter size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No sensors match the current filter</p>
            <button className="text-primary text-sm mt-2 underline" onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}>
              Clear filters
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
