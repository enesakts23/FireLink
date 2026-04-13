import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { DigitalTwin } from './components/3d/DigitalTwin';
import { Sidebar, MiniStatusBar } from './components/hud/Sidebar';
import { Vignette, AlertBanner } from './components/hud/Vignette';
import GlassPanel from './components/ui/GlassPanel';

import { useMQTTSimulator } from './hooks/useMQTT';
import { useSensorStore, SENSOR_CONFIG } from './stores/useSensorStore';

import SensorsPage from './pages/SensorsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';

import {
  Activity, Shield, Flame, Zap, Thermometer, Wind, MapPin,
  ChevronRight, ChevronDown, ArrowUpRight, Droplets, Clock,
  Building2, Skull, AlertTriangle, Gauge, Leaf, Cloud,
  TrendingUp, X,
} from 'lucide-react';

import './index.css';

/* ═══════════════════════ Animations ═══════════════════════ */
const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } } },
  item: { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } } },
  slideLeft: { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } } },
  slideRight: { hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } } },
};

const ICON_MAP = {
  temperature: Thermometer, humidity: Droplets, gas: Wind, 'air-quality': Activity,
  no2: AlertTriangle, co: Skull, tvoc: Cloud, eco2: Leaf, 'surface-temp': Flame,
  'surface-temp-2': Flame, pressure: Gauge, current: Zap,
};

/* ═══════════════════════ Boot Sequence ═══════════════════════ */
function BootSequence({ onComplete }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => { if (p >= 100) { clearInterval(interval); setTimeout(onComplete, 300); return 100; } return p + 5; });
    }, 30);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div className="fixed inset-0 z-boot bg-page-bg flex items-center justify-center" exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      <div className="text-center max-w-xs">
        <motion.div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-primary flex items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12, delay: 0.1 }}>
          <Flame className="text-white" size={24} />
        </motion.div>
        <motion.h1 className="font-display font-bold text-2xl text-text-primary tracking-tight mb-0.5"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          FIRELINK
        </motion.h1>
        <motion.p className="text-text-tertiary text-xs mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          Detection System v2.0
        </motion.p>
        <div className="relative h-[3px] bg-border rounded-full overflow-hidden mx-8">
          <motion.div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════ Alarm Indicator (Top Bar) ═══════════════════════ */
function AlarmIndicator({ count }) {
  if (count === 0) return null;
  return (
    <motion.div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-danger/30 bg-danger-light"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
      </span>
      <span className="text-[10px] font-bold text-danger uppercase tracking-wide">
        {count} Alert{count > 1 ? 's' : ''}
      </span>
    </motion.div>
  );
}

/* ═══════════════════════ Floating Top Bar ═══════════════════════ */
function FloatingTopBar() {
  const devices = useSensorStore((s) => s.devices);
  const activeDeviceId = useSensorStore((s) => s.activeDeviceId);
  const setActiveDevice = useSensorStore((s) => s.setActiveDevice);
  const sensors = useSensorStore((s) => s.deviceSensors[s.activeDeviceId] || {});
  const criticalCount = Object.values(sensors).filter((s) => s.status === 'critical').length;
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);

  return (
    <motion.div
      className="absolute top-4 left-1/2 -translate-x-1/2 z-nav glass-strong rounded-2xl px-1 py-1 flex items-center gap-1"
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
    >
      <div className="flex items-center gap-2 px-3 py-1.5">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <Flame className="text-white" size={14} />
        </div>
        <span className="font-display font-bold text-sm text-text-primary tracking-tight">FIRELINK</span>
      </div>

      <div className="flex items-center gap-0.5 px-1">
        {devices.map((device) => {
          const isActive = device.id === activeDeviceId;
          const hasCritical = device.status === 'critical';
          return (
            <button
              key={device.id}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-page-bg text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
              onClick={() => setActiveDevice(device.id)}
            >
              {hasCritical && <AlertTriangle size={11} className="text-danger" />}
              {device.name}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 px-3 border-l border-border ml-1">
        <AlarmIndicator count={criticalCount} />
        <MiniStatusBar />
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface text-xs text-text-secondary font-mono tabular-nums">
          <Clock size={11} />
          {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════ Sparkline ═══════════════════════ */
function Sparkline({ data, color = '#2D7A6F', width = 80, height = 28, filled = true }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1;
  const pad = 2; const xStep = (width - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => `${pad + i * xStep},${height - pad - ((v - min) / range) * (height - pad * 2)}`).join(' ');
  const uid = `sp-${color.replace('#', '')}-${data.length}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {filled && (
        <>
          <defs><linearGradient id={uid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.15" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
          <polygon points={`${pad},${height - pad} ${pts} ${width - pad},${height - pad}`} fill={`url(#${uid})`} />
        </>
      )}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width - pad} cy={height - pad - ((data[data.length - 1] - min) / range) * (height - pad * 2)} r="2" fill={color} />
    </svg>
  );
}

/* ═══════════════════════ Gauge Bar ═══════════════════════ */
function GaugeBar({ value, min, max, color = '#2D7A6F', label, unit }) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const segments = 8;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-text-secondary font-medium">{label}</span>
        <span className="text-sm font-display font-bold text-text-primary tabular-nums">{value.toFixed(1)} <span className="text-[10px] text-text-tertiary font-normal">{unit}</span></span>
      </div>
      <div className="flex gap-[3px]">
        {Array.from({ length: segments }).map((_, i) => {
          const isFilled = i < Math.round(pct / 100 * segments);
          return (
            <motion.div
              key={i}
              className="flex-1 h-[6px] rounded-sm"
              style={{ backgroundColor: isFilled ? color : 'var(--border-color)' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════ Status Toggle Row ═══════════════════════ */
function StatusRow({ label, active, color = '#16A34A' }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={`text-xs font-medium ${active ? 'text-text-primary' : 'text-text-tertiary'}`}>{label}</span>
      <div className={`w-8 h-4.5 rounded-full relative transition-colors ${active ? '' : 'bg-border'}`}
        style={active ? { backgroundColor: color } : {}}>
        <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all ${active ? 'left-[15px]' : 'left-0.5'}`} />
      </div>
    </div>
  );
}

/* ═══════════════════════ Accordion Section ═══════════════════════ */
function AccordionItem({ label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-border">
      <button className="w-full flex items-center justify-between py-1.5 px-1 text-left" onClick={() => setOpen(!open)}>
        <span className="text-xs font-bold text-text-primary tracking-wide uppercase">{label}</span>
        <ChevronDown size={14} className={`text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden pb-3">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════ Sensor Detail Overlay ═══════════════════════ */
function SensorDetailOverlay() {
  const selectedSensor = useSensorStore((s) => s.selectedSensor);
  const sensor = useSensorStore((s) => s.deviceSensors[s.activeDeviceId]?.[s.selectedSensor]);
  const selectSensor = useSensorStore((s) => s.selectSensor);
  const setCameraTarget = useSensorStore((s) => s.setCameraTarget);
  const activePage = useSensorStore((s) => s.activePage);

  // Only show on dashboard
  if (activePage !== 'dashboard') return null;

  const handleClose = () => {
    selectSensor(null);
    setCameraTarget(null);
  };

  if (!selectedSensor || !sensor) return null;

  const Icon = ICON_MAP[selectedSensor] || Activity;
  const config = SENSOR_CONFIG[selectedSensor] || {};
  const statusColor = sensor.status === 'critical' ? '#DC2626' : sensor.status === 'warning' ? '#D97706' : '#2D7A6F';

  return (
    <AnimatePresence>
      <motion.div
        key="sensor-overlay"
        className="absolute top-20 left-1/2 -translate-x-1/2 z-[35] w-[380px]"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <div className="glass-strong rounded-2xl p-5 shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: statusColor + '14', color: statusColor }}>
                <Icon size={18} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-text-primary">{sensor.label}</h3>
                <p className="text-[10px] text-text-tertiary">Floor {sensor.position?.floor ?? 0} &middot; Last update {sensor.lastUpdate ? new Date(sensor.lastUpdate).toLocaleTimeString() : 'N/A'}</p>
              </div>
            </div>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface transition-colors" onClick={handleClose}>
              <X size={16} />
            </button>
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-display font-bold text-4xl text-text-primary tabular-nums">{sensor.value.toFixed(1)}</span>
            <span className="text-sm text-text-tertiary">{sensor.unit}</span>
            <span className="ml-auto text-xs font-bold uppercase px-2.5 py-1 rounded-full"
              style={{ backgroundColor: statusColor + '12', color: statusColor }}>
              {sensor.status}
            </span>
          </div>

          {/* Sparkline */}
          <div className="mb-4 p-3 rounded-xl bg-surface">
            <Sparkline data={sensor.history?.slice(-30)} color={statusColor} width={320} height={60} />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 rounded-xl bg-surface">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-0.5">Min</p>
              <p className="text-sm font-bold text-text-primary tabular-nums">{config.min ?? '—'}</p>
            </div>
            <div className="p-2 rounded-xl bg-surface">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-0.5">Current</p>
              <p className="text-sm font-bold tabular-nums" style={{ color: statusColor }}>{sensor.value.toFixed(1)}</p>
            </div>
            <div className="p-2 rounded-xl bg-surface">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-0.5">Max</p>
              <p className="text-sm font-bold text-text-primary tabular-nums">{config.max ?? '—'}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ═══════════════════════ Dashboard HUD ═══════════════════════ */
function DashboardPage() {
  const sensors = useSensorStore((s) => s.deviceSensors[s.activeDeviceId] || {});
  const devices = useSensorStore((s) => s.devices);
  const activeDeviceId = useSensorStore((s) => s.activeDeviceId);
  const panelHealth = useSensorStore((s) => s.panelHealth);
  const focusSensor = useSensorStore((s) => s.focusSensor);
  const activeDevice = devices.find((d) => d.id === activeDeviceId);

  const tempSensor = sensors.temperature;
  const pressureSensor = sensors.pressure;
  const humiditySensor = sensors.humidity;
  const coSensor = sensors.co;
  const aqSensor = sensors['air-quality'];
  const eco2Sensor = sensors.eco2;
  const gasSensor = sensors.gas;
  const currentSensor = sensors.current;

  const criticalCount = Object.values(sensors).filter((s) => s.status === 'critical').length;
  const sensorCount = Object.keys(sensors).length;

  const handleSensorClick = useCallback((sensorId) => {
    focusSensor(sensorId);
  }, [focusSensor]);

  return (
    <div className="absolute inset-0">
      {/* FULL SCREEN 3D BACKGROUND */}
      <div className="absolute inset-0 z-3d">
        <DigitalTwin onSensorClick={handleSensorClick} />
      </div>

      {/* FLOATING TOP BAR */}
      <FloatingTopBar />

      {/* SENSOR DETAIL OVERLAY */}
      <SensorDetailOverlay />

      {/* HIGH TEMP ALERT */}
      {criticalCount > 0 && (
        <motion.div className="absolute top-20 left-1/2 -translate-x-1/2 z-hud"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="glass-strong rounded-xl px-4 py-2 flex items-center gap-2 border border-danger/20">
            <AlertTriangle size={13} className="text-danger" />
            <span className="text-xs font-semibold text-danger">High temperature</span>
            <Thermometer size={12} className="text-danger/60" />
          </div>
        </motion.div>
      )}

      {/* LEFT PANEL COLUMN */}
      <motion.div
        className="absolute left-5 top-20 bottom-[260px] w-[260px] z-hud flex flex-col gap-3 overflow-hidden"
        initial="hidden" animate="visible" variants={stagger.container}
      >
        <motion.div className="glass rounded-2xl p-4" variants={stagger.slideLeft}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-text-primary tracking-wide uppercase">Building Data</span>
            <ChevronDown size={14} className="text-text-tertiary" />
          </div>
          <div className="space-y-0">
            {[
              { label: 'Building:', value: activeDevice?.name || 'Main' },
              { label: 'Area:', value: `${activeDevice?.floors || 1} floors` },
              { label: 'Class:', value: criticalCount > 0 ? 'B' : 'A+' },
              { label: 'Sensors:', value: `${sensorCount}` },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-[11px] text-text-secondary">{row.label}</span>
                <span className="text-[11px] font-semibold text-text-primary bg-surface px-2.5 py-1 rounded-lg">{row.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="glass rounded-2xl p-2.5 flex-1 overflow-auto" variants={stagger.slideLeft}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-text-primary tracking-wide uppercase">Status</span>
          </div>
          <div className="space-y-0">
            <StatusRow label="Fire Detection" active={true} color="#16A34A" />
            <StatusRow label="Gas Monitor" active={gasSensor?.status !== 'critical'} color={gasSensor?.status === 'critical' ? '#DC2626' : '#16A34A'} />
            <StatusRow label="Power Supply" active={true} color="#16A34A" />
            <StatusRow label="HVAC System" active={humiditySensor?.status !== 'critical'} color="#16A34A" />
            <StatusRow label="Air Filtration" active={aqSensor?.status !== 'critical'} color={aqSensor?.status === 'critical' ? '#DC2626' : '#16A34A'} />
          </div>
        </motion.div>
      </motion.div>

      {/* RIGHT PANEL COLUMN */}
      <motion.div
        className="absolute right-5 top-20 bottom-[260px] w-[260px] z-hud flex flex-col gap-3 overflow-hidden"
        initial="hidden" animate="visible" variants={stagger.container}
      >
        <motion.div className="flex items-center gap-2" variants={stagger.slideRight}>
          <button className="flex-1 glass rounded-xl px-3 py-2 text-xs font-semibold text-text-primary text-center hover:bg-card-hover transition-colors">A-PRESET</button>
          <button className="flex-1 glass-subtle rounded-xl px-3 py-2 text-xs font-medium text-text-secondary text-center hover:bg-card-hover transition-colors">B-PRESET</button>
          <button className="w-9 h-9 glass-subtle rounded-xl flex items-center justify-center text-text-tertiary hover:text-primary transition-colors">+</button>
        </motion.div>

        <motion.div className="glass rounded-2xl p-4" variants={stagger.slideRight}>
          <AccordionItem label="Temp & Pressure" defaultOpen={true}>
            <div className="space-y-4">
              {tempSensor && <GaugeBar value={tempSensor.value} min={0} max={80} color="#2D7A6F" label="Temperature (°C)" unit="°C" />}
              {pressureSensor && <GaugeBar value={pressureSensor.value} min={900} max={1100} color="#6366F1" label="Pressure (Pa)" unit="Pa" />}
              <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-text-secondary">Supply Voltage</span>
                  <span className="text-sm font-bold text-accent flex items-center gap-1">
                    5.0 V <Zap size={12} />
                  </span>
                </div>
            </div>
          </AccordionItem>
        </motion.div>

        <motion.div className="glass rounded-2xl px-4 py-1 flex-1 overflow-auto" variants={stagger.slideRight}>
          <AccordionItem label="Air Quality">
            <div className="space-y-3">
              {aqSensor && <GaugeBar value={aqSensor.value} min={0} max={500} color="#8B5CF6" label="IAQ Index" unit="" />}
              {eco2Sensor && <GaugeBar value={eco2Sensor.value} min={400} max={5000} color="#16A34A" label="eCO₂" unit="ppm" />}
            </div>
          </AccordionItem>
          <AccordionItem label="Gas Levels">
            <div className="space-y-3">
              {coSensor && <GaugeBar value={coSensor.value} min={0} max={100} color="#DC2626" label="CO" unit="ppm" />}
              {gasSensor && <GaugeBar value={gasSensor.value} min={0} max={1000} color="#D97706" label="Gas" unit="ppm" />}
            </div>
          </AccordionItem>
          <AccordionItem label="Humidity">
            {humiditySensor && (
              <div className="space-y-3">
                <GaugeBar value={humiditySensor.value} min={0} max={100} color="#0891B2" label="Relative (%)" unit="%" />
              </div>
            )}
          </AccordionItem>
        </motion.div>
      </motion.div>

      {/* BOTTOM ROW: 3 DATA CARDS */}
      <motion.div
        className="absolute left-5 right-5 bottom-4 z-hud grid grid-cols-3 gap-3"
        initial="hidden" animate="visible" variants={stagger.container}
      >
        {/* Card 1: System Health */}
        <motion.div className="glass-strong rounded-2xl p-5 relative overflow-hidden" variants={stagger.item}>
          <p className="text-[10px] font-bold text-primary tracking-wider uppercase mb-4">System Health</p>
          <div className="flex items-center justify-center mb-3">
            <div className="relative">
              <svg width="120" height="120" viewBox="0 0 120 120">
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
                  const r = 48;
                  const filled = i < Math.round(panelHealth / 100 * 24);
                  return (
                    <circle key={i}
                      cx={60 + Math.cos(angle) * r} cy={60 + Math.sin(angle) * r}
                      r={filled ? 4.5 : 3.5}
                      fill={filled ? '#2D7A6F' : 'var(--border-color)'}
                      opacity={filled ? 1 : 0.5}
                    />
                  );
                })}
                <text x="60" y="55" textAnchor="middle" className="font-display" fontSize="28" fontWeight="700" fill="var(--text-primary)">
                  {panelHealth.toFixed(0)}
                </text>
                <text x="60" y="72" textAnchor="middle" fontSize="10" fontWeight="500" fill="var(--text-tertiary)">
                  HEALTH %
                </text>
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-text-tertiary">
            <span>Alerts: <span className="font-semibold text-text-primary">{criticalCount}</span></span>
            <span>Uptime: <span className="font-semibold text-text-primary">99.2%</span></span>
          </div>
        </motion.div>

        {/* Card 2: Temperature Monitor */}
        <motion.div className="glass-strong rounded-2xl p-5 relative overflow-hidden" variants={stagger.item}>
          <p className="text-[10px] font-bold text-text-primary tracking-wider uppercase text-center mb-3">Temperature Monitor</p>
          {tempSensor && (
            <>
              <div className="flex justify-center mb-3">
                <div className={`px-3 py-1 rounded-lg text-[10px] font-bold text-white ${
                  tempSensor.status === 'critical' ? 'bg-danger' : tempSensor.status === 'warning' ? 'bg-warning' : 'bg-primary'
                }`}>
                  {tempSensor.status === 'critical' ? 'CRITICAL' : tempSensor.status === 'warning' ? 'WARNING' : 'NORMAL'}: {tempSensor.value.toFixed(1)}°C
                </div>
              </div>
              <div className="flex justify-center mb-4">
                <Sparkline data={tempSensor.history?.slice(-20)} color={tempSensor.status === 'critical' ? '#DC2626' : '#2D7A6F'} width={200} height={50} />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-[10px] text-text-tertiary mb-0.5">Pressure</p>
                  <p className="text-xs font-bold text-text-primary flex items-center justify-center gap-1">
                    <Shield size={10} className="text-primary" /> {pressureSensor?.value?.toFixed(0) || '—'} Pa
                  </p>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="text-center flex-1">
                  <p className="text-[10px] text-text-tertiary mb-0.5">TVOC</p>
                  <p className="text-xs font-bold flex items-center justify-center gap-1" style={{ color: tempSensor.status === 'critical' ? '#DC2626' : '#8B5CF6' }}>
                    <AlertTriangle size={10} /> {sensors.tvoc?.value?.toFixed(0) ?? '—'} ppb
                  </p>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Card 3: Air Quality */}
        <motion.div className="glass-strong rounded-2xl p-5 relative overflow-hidden" variants={stagger.item}>
          <p className="text-[10px] font-bold text-text-primary tracking-wider uppercase mb-2">CO₂ & Air Quality</p>
          {eco2Sensor && aqSensor && (
            <>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-display font-bold text-[36px] text-text-primary tracking-tight leading-none">
                  {((1 - aqSensor.value / 500) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[11px] text-text-tertiary mb-4">Air Quality Score</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {Array.from({ length: 18 }).map((_, i) => {
                  const quality = i < Math.round(((500 - aqSensor.value) / 500) * 18);
                  return (
                    <div key={i} className="w-4 h-4 rounded-sm" style={{
                      backgroundColor: quality ? '#2D7A6F' : 'var(--border-color)',
                      opacity: quality ? 0.3 + (i / 18) * 0.7 : 0.3,
                    }} />
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-mono bg-primary-lighter text-primary px-2 py-0.5 rounded font-semibold">
                  eCO₂: {eco2Sensor.value.toFixed(0)} ppm
                </span>
                <span className="text-[10px] font-mono bg-accent-light text-accent px-2 py-0.5 rounded font-semibold">
                  IAQ: {aqSensor.value.toFixed(0)}
                </span>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════ App ═══════════════════════ */
export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const activePage = useSensorStore((s) => s.activePage);
  const theme = useSensorStore((s) => s.theme);
  const sidebarCollapsed = useSensorStore((s) => s.sidebarCollapsed);
  useMQTTSimulator();

  // Ensure theme class is synced on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const sidebarWidth = sidebarCollapsed ? 72 : 240;
  const isDashboard = activePage === 'dashboard';

  return (
    <div className="h-screen w-screen overflow-hidden bg-page-bg flex transition-colors duration-500">
      <AnimatePresence>{isBooting && <BootSequence onComplete={() => setIsBooting(false)} />}</AnimatePresence>
      {!isBooting && (
        <>
          <Sidebar />
          <Vignette />
          <AlertBanner />

          {/* Main Content */}
          <div className="flex-1 h-full transition-all duration-300 relative" style={{ marginLeft: sidebarWidth }}>
            <AnimatePresence mode="wait">
              {isDashboard && <DashboardPage key="dashboard" />}
              {activePage === 'sensors' && <SensorsPage key="sensors" />}
              {activePage === 'analytics' && <AnalyticsPage key="analytics" />}
              {activePage === 'alerts' && <AlertsPage key="alerts" />}
              {activePage === 'settings' && <SettingsPage key="settings" />}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
