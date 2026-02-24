import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Bell, CheckCircle, XCircle, Filter,
  Clock, Thermometer, Skull, Wind, Activity, Droplets,
  Flame, Gauge, Zap, Cloud, Leaf,
} from 'lucide-react';
import { useSensorStore } from '../stores/useSensorStore';

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } } },
  item: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } },
};

const SENSOR_ICONS = {
  temperature: Thermometer, humidity: Droplets, gas: Wind, 'air-quality': Activity,
  no2: AlertTriangle, co: Skull, tvoc: Cloud, eco2: Leaf,
  'surface-temp': Flame, 'surface-temp-2': Flame, pressure: Gauge, current: Zap,
};

const SEVERITY_STYLES = {
  critical: { bg: 'bg-danger-light', text: 'text-danger', border: 'border-danger/20', icon: XCircle },
  warning: { bg: 'bg-warning-light', text: 'text-warning', border: 'border-warning/20', icon: AlertTriangle },
  info: { bg: 'bg-primary-lighter', text: 'text-primary', border: 'border-primary/20', icon: Bell },
  resolved: { bg: 'bg-success-light', text: 'text-success', border: 'border-success/20', icon: CheckCircle },
};

function generateAlerts(sensors) {
  const alerts = [];
  const now = Date.now();
  let id = 1;

  Object.values(sensors).forEach((sensor) => {
    if (!sensor.lastUpdate) return;

    if (sensor.status === 'critical') {
      alerts.push({
        id: id++,
        time: new Date(sensor.lastUpdate).toLocaleTimeString('en-US', { hour12: false }),
        sensorId: sensor.id,
        sensorLabel: sensor.label,
        type: 'Threshold Exceeded',
        severity: 'critical',
        status: 'active',
        value: `${sensor.value.toFixed(1)} ${sensor.unit}`,
        message: `${sensor.label} exceeded safe threshold`,
      });
    }

    // Add some simulated historical alerts
    if (sensor.history.length > 10) {
      const maxVal = Math.max(...sensor.history.slice(-10));
      if (maxVal > (sensor.max * 0.7)) {
        alerts.push({
          id: id++,
          time: new Date(now - Math.random() * 3600000).toLocaleTimeString('en-US', { hour12: false }),
          sensorId: sensor.id,
          sensorLabel: sensor.label,
          type: 'High Reading',
          severity: 'warning',
          status: 'acknowledged',
          value: `${maxVal.toFixed(1)} ${sensor.unit}`,
          message: `${sensor.label} approaching threshold`,
        });
      }
    }

    if (sensor.history.length > 5 && sensor.status === 'normal') {
      alerts.push({
        id: id++,
        time: new Date(now - Math.random() * 7200000).toLocaleTimeString('en-US', { hour12: false }),
        sensorId: sensor.id,
        sensorLabel: sensor.label,
        type: 'Status Update',
        severity: 'resolved',
        status: 'resolved',
        value: `${sensor.value.toFixed(1)} ${sensor.unit}`,
        message: `${sensor.label} returned to normal`,
      });
    }
  });

  return alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2, resolved: 3 };
    return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
  });
}

export default function AlertsPage() {
  const sensors = useSensorStore((s) => s.deviceSensors[s.activeDeviceId] || {});
  const activeDevice = useSensorStore((s) => s.devices.find((d) => d.id === s.activeDeviceId));
  const theme = useSensorStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [activeFilter, setActiveFilter] = useState('all');

  const alerts = useMemo(() => generateAlerts(sensors), [sensors]);
  const filters = ['all', 'critical', 'warning', 'resolved'];

  const filteredAlerts = activeFilter === 'all' ? alerts : alerts.filter((a) => a.severity === activeFilter);

  const counts = useMemo(() => ({
    all: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    resolved: alerts.filter((a) => a.severity === 'resolved').length,
  }), [alerts]);

  return (
    <motion.div className="h-full p-6 overflow-auto" initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={stagger.container}>
      <div className="max-w-[1200px] mx-auto space-y-5">
        {/* Header */}
        <motion.div className="flex items-end justify-between" variants={stagger.item}>
          <div>
            <h1 className="font-display font-bold text-[32px] text-text-primary tracking-tight leading-none">Alerts</h1>
            <p className="text-[13px] text-text-secondary mt-2">{activeDevice?.name} · System Log</p>
          </div>
          <div className="flex items-center gap-2">
            {counts.critical > 0 && (
              <span className="px-3 py-1.5 rounded-full bg-danger-light text-danger text-xs font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                {counts.critical} Active
              </span>
            )}
          </div>
        </motion.div>

        {/* Filter Chips */}
        <motion.div className="flex items-center gap-2" variants={stagger.item}>
          <Filter size={14} className="text-text-tertiary mr-1" />
          {filters.map((filter) => (
            <button
              key={filter}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
                activeFilter === filter
                  ? isDark
                    ? 'bg-primary text-text-inverse border-primary glow-cyan'
                    : 'bg-text-primary text-white border-text-primary'
                  : 'bg-card-bg text-text-secondary border-border hover:border-primary/30'
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
              <span className="ml-1.5 opacity-60">{counts[filter]}</span>
            </button>
          ))}
        </motion.div>

        {/* Alert Table */}
        <motion.div className={`bg-card-bg border border-border rounded-[20px] overflow-hidden shadow-sm ${isDark ? 'glow-card' : ''}`} variants={stagger.item}>
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border bg-surface/50 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
            <div className="col-span-2">Time</div>
            <div className="col-span-2">Sensor</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-1">Severity</div>
            <div className="col-span-2">Value</div>
            <div className="col-span-2">Message</div>
            <div className="col-span-1">Status</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border">
            <AnimatePresence>
              {filteredAlerts.length === 0 ? (
                <motion.div className="px-5 py-12 text-center" variants={stagger.item}>
                  <CheckCircle size={32} className="text-success mx-auto mb-3" />
                  <p className="text-text-secondary font-medium">No alerts matching filter</p>
                  <p className="text-text-tertiary text-sm mt-1">All systems operating normally</p>
                </motion.div>
              ) : (
                filteredAlerts.map((alert) => {
                  const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
                  const SensorIcon = SENSOR_ICONS[alert.sensorId] || Activity;
                  const SeverityIcon = style.icon;

                  return (
                    <motion.div
                      key={alert.id}
                      className={`grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-surface/30 transition-colors ${
                        alert.severity === 'critical' ? (isDark ? 'bg-danger-light/50' : 'bg-danger-light/30') : ''
                      }`}
                      variants={stagger.item}
                      layout
                    >
                      {/* Time */}
                      <div className="col-span-2 flex items-center gap-2">
                        <Clock size={12} className="text-text-tertiary" />
                        <span className="text-sm text-text-primary font-mono tabular-nums">{alert.time}</span>
                      </div>

                      {/* Sensor */}
                      <div className="col-span-2 flex items-center gap-2">
                        <SensorIcon size={14} className="text-text-secondary" />
                        <span className="text-sm text-text-primary font-medium truncate">{alert.sensorLabel}</span>
                      </div>

                      {/* Type */}
                      <div className="col-span-2">
                        <span className="text-sm text-text-secondary">{alert.type}</span>
                      </div>

                      {/* Severity */}
                      <div className="col-span-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${style.bg} ${style.text}`}>
                          <SeverityIcon size={10} />
                          {alert.severity}
                        </span>
                      </div>

                      {/* Value */}
                      <div className="col-span-2">
                        <span className="text-sm font-mono font-semibold text-text-primary">{alert.value}</span>
                      </div>

                      {/* Message */}
                      <div className="col-span-2">
                        <span className="text-xs text-text-tertiary truncate block">{alert.message}</span>
                      </div>

                      {/* Status */}
                      <div className="col-span-1">
                        <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                          alert.status === 'active' ? 'text-danger' : alert.status === 'acknowledged' ? 'text-warning' : 'text-success'
                        }`}>
                          {alert.status}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
