import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Thermometer, Droplets, Wind, Activity, AlertTriangle, Skull,
  Cloud, Leaf, Flame, Gauge, Zap, ChevronDown,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { useSensorStore } from '../../stores/useSensorStore';

const SENSOR_ICONS = {
  temperature: Thermometer,
  humidity: Droplets,
  gas: Wind,
  'air-quality': Activity,
  no2: AlertTriangle,
  co: Skull,
  tvoc: Cloud,
  eco2: Leaf,
  'surface-temp': Flame,
  'surface-temp-2': Flame,
  pressure: Gauge,
  current: Zap,
};

export function SensorChip({ sensorId, onClick }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sensor = useSensorStore((state) => state.deviceSensors[state.activeDeviceId]?.[sensorId]);
  const selectSensor = useSensorStore((state) => state.selectSensor);
  const setCameraTarget = useSensorStore((state) => state.setCameraTarget);

  if (!sensor) return null;

  const Icon = SENSOR_ICONS[sensorId] || Activity;

  const statusStyles = {
    normal: {
      icon: 'bg-primary-lighter text-primary',
      value: 'text-text-primary',
      badge: 'bg-success-light text-success',
    },
    warning: {
      icon: 'bg-warning-light text-warning',
      value: 'text-warning',
      badge: 'bg-warning-light text-warning',
    },
    critical: {
      icon: 'bg-danger-light text-danger',
      value: 'text-danger',
      badge: 'bg-danger-light text-danger',
    },
    offline: {
      icon: 'bg-surface text-text-tertiary',
      value: 'text-text-tertiary',
      badge: 'bg-surface text-text-tertiary',
    },
  };

  const styles = statusStyles[sensor.status] || statusStyles.normal;

  const TrendIcon =
    sensor.trend === 'rising' ? TrendingUp
    : sensor.trend === 'falling' ? TrendingDown
    : Minus;

  const handleClick = () => {
    setIsExpanded(!isExpanded);
    selectSensor(isExpanded ? null : sensorId);
    setCameraTarget(isExpanded ? null : sensorId);
    onClick?.(sensorId);
  };

  return (
    <motion.div
      layout
      className={`
        bg-card-bg border border-border rounded-2xl overflow-hidden
        transition-all duration-200 cursor-pointer
        hover:shadow-sm hover:border-border
        ${sensor.status === 'critical' ? 'border-danger/30' : ''}
      `}
      onClick={handleClick}
    >
      {/* Main row */}
      <motion.div className="p-3.5 flex items-center gap-3" layout>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styles.icon}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary truncate">
              {sensor.label}
            </span>
            {sensor.status === 'critical' && (
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-lg font-display font-bold ${styles.value}`}>
              {sensor.value.toFixed(1)}
            </span>
            <span className="text-xs text-text-tertiary">{sensor.unit}</span>
            <TrendIcon
              size={12}
              className={
                sensor.trend === 'rising' ? 'text-accent'
                : sensor.trend === 'falling' ? 'text-primary'
                : 'text-text-tertiary'
              }
            />
          </div>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-text-tertiary">
          <ChevronDown size={16} />
        </motion.div>
      </motion.div>

      {/* Expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border"
          >
            <div className="p-3.5 space-y-3">
              <MiniSparkline data={sensor.history} status={sensor.status} />
              <div className="grid grid-cols-3 gap-2 text-center">
                <StatItem label="MIN" value={sensor.min} unit={sensor.unit} />
                <StatItem label="CURRENT" value={sensor.value.toFixed(1)} unit={sensor.unit} highlight />
                <StatItem label="MAX" value={sensor.max} unit={sensor.unit} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-tertiary">Floor {sensor.position?.floor ?? 0}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${styles.badge}`}>
                  {sensor.status}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MiniSparkline({ data, status }) {
  if (!data || data.length < 2) {
    return (
      <div className="h-12 flex items-center justify-center text-text-tertiary text-xs">
        Collecting data...
      </div>
    );
  }

  const width = 180;
  const height = 48;
  const padding = 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const xStep = (width - padding * 2) / (data.length - 1);

  const points = data
    .map((value, i) => {
      const x = padding + i * xStep;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const strokeColor =
    status === 'critical' ? '#DC2626'
    : status === 'warning' ? '#D97706'
    : '#2D7A6F';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${status}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.1" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((y) => (
        <line key={y} x1={padding} y1={height * y} x2={width - padding} y2={height * y}
          stroke="#E5E5E3" strokeWidth="0.5" strokeDasharray="2,2"
        />
      ))}
      <polygon
        points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
        fill={`url(#grad-${status})`}
      />
      <polyline points={points} fill="none" stroke={strokeColor}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      {data.length > 0 && (
        <circle
          cx={width - padding}
          cy={height - padding - ((data[data.length - 1] - min) / range) * (height - padding * 2)}
          r="3" fill={strokeColor}
        />
      )}
    </svg>
  );
}

function StatItem({ label, value, unit, highlight = false }) {
  return (
    <div className="text-center">
      <div className="text-text-tertiary text-[10px] uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-medium ${highlight ? 'text-primary font-semibold' : 'text-text-secondary'}`}>
        {value}
        <span className="text-[10px] text-text-tertiary ml-0.5">{unit}</span>
      </div>
    </div>
  );
}

export function SensorChipGrid({ className = '' }) {
  const sensors = useSensorStore((state) => state.deviceSensors[state.activeDeviceId] || {});
  return (
    <div className={`grid grid-cols-1 gap-2 ${className}`}>
      {Object.keys(sensors).map((id) => (
        <SensorChip key={id} sensorId={id} />
      ))}
    </div>
  );
}

export default SensorChip;
