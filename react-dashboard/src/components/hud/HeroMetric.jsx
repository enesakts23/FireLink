import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useSensorStore } from '../../stores/useSensorStore';
import GlassPanel from '../ui/GlassPanel';

/**
 * HeroMetric - A large, cinematic display for the most critical metric
 *
 * Features:
 * - Animated number counter
 * - Trend indicator
 * - Sparkline mini-chart
 * - Status glow effect
 * - Responsive sizing
 */
export function HeroMetric({
  sensorId,
  title,
  className = '',
}) {
  const sensor = useSensorStore((state) => state.sensors[sensorId]);

  if (!sensor) return null;

  // Magma & Obsidian color scheme
  const statusConfig = {
    normal: {
      color: 'text-deep-amber',
      bgColor: 'bg-burnt-orange/10',
      borderColor: 'border-burnt-orange/30',
      icon: CheckCircle,
      label: 'NOMINAL',
    },
    warning: {
      color: 'text-warning-yellow',
      bgColor: 'bg-warning-yellow/10',
      borderColor: 'border-warning-yellow/30',
      icon: AlertTriangle,
      label: 'WARNING',
    },
    critical: {
      color: 'text-strobe-red',
      bgColor: 'bg-strobe-red/10',
      borderColor: 'border-strobe-red/30',
      icon: AlertTriangle,
      label: 'CRITICAL',
    },
    offline: {
      color: 'text-warm-grey',
      bgColor: 'bg-warm-grey/10',
      borderColor: 'border-warm-grey/30',
      icon: Minus,
      label: 'OFFLINE',
    },
  };

  const status = statusConfig[sensor.status] || statusConfig.normal;
  const StatusIcon = status.icon;

  const TrendIcon =
    sensor.trend === 'rising'
      ? TrendingUp
      : sensor.trend === 'falling'
        ? TrendingDown
        : Minus;

  return (
    <GlassPanel
      variant={sensor.status === 'critical' ? 'critical' : 'accent'}
      className={`relative overflow-hidden ${className}`}
      corners
      glow={sensor.status === 'critical'}
    >
      {/* Background glow */}
      <div
        className={`absolute -inset-4 ${status.bgColor} blur-3xl opacity-30`}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-rajdhani text-sm uppercase tracking-wider text-white/60">
              {title || sensor.label}
            </span>
          </div>

          {/* Status badge */}
          <motion.div
            className={`
              flex items-center gap-1.5 px-2.5 py-1
              rounded-full text-xs font-medium
              ${status.bgColor} ${status.color}
              border ${status.borderColor}
            `}
            animate={
              sensor.status === 'critical'
                ? { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }
                : {}
            }
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <StatusIcon size={12} />
            {status.label}
          </motion.div>
        </div>

        {/* Main value display */}
        <div className="flex items-end gap-3 mb-4">
          <AnimatedNumber
            value={sensor.value}
            className={`text-6xl font-rajdhani font-bold ${status.color}`}
            decimals={1}
          />
          <div className="flex flex-col items-start pb-2">
            <span className="text-white/40 text-lg font-light">
              {sensor.unit}
            </span>
            <div
              className={`flex items-center gap-1 text-sm ${
                sensor.trend === 'rising'
                  ? 'text-burnt-orange'
                  : sensor.trend === 'falling'
                    ? 'text-dim-grey'
                    : 'text-white/40'
              }`}
            >
              <TrendIcon size={14} />
              <span className="uppercase text-xs">{sensor.trend}</span>
            </div>
          </div>
        </div>

        {/* Sparkline */}
        <Sparkline data={sensor.history} status={sensor.status} />

        {/* Footer info */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/10">
          <span className="text-xs text-white/40 font-mono">
            MIN: {sensor.min} | MAX: {sensor.max}
          </span>
          <span className="text-xs text-white/40 font-mono">
            FLOOR {sensor.position?.floor ?? 0}
          </span>
        </div>
      </div>
    </GlassPanel>
  );
}

/**
 * AnimatedNumber - Smoothly animates between number values
 */
function AnimatedNumber({ value, className, decimals = 0 }) {
  return (
    <motion.span
      className={className}
      key={Math.floor(value)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {value.toFixed(decimals)}
    </motion.span>
  );
}

/**
 * Sparkline - Mini line chart showing historical data
 */
function Sparkline({ data, status }) {
  const points = useMemo(() => {
    if (!data || data.length < 2) return '';

    const width = 200;
    const height = 40;
    const padding = 2;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const xStep = (width - padding * 2) / (data.length - 1);

    return data
      .map((value, i) => {
        const x = padding + i * xStep;
        const y = height - padding - ((value - min) / range) * (height - padding * 2);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  }, [data]);

  // Ember theme sparkline colors
  const strokeColor =
    status === 'critical'
      ? '#FF0000'  // Strobe red
      : status === 'warning'
        ? '#FFBA08'  // Warning yellow
        : '#FF8C00'; // Deep amber

  return (
    <div className="relative h-10 w-full overflow-hidden rounded">
      <svg
        viewBox="0 0 200 40"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {/* Gradient fill under the line */}
        <defs>
          <linearGradient id={`sparkline-gradient-${status}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Fill area */}
        {points && (
          <path
            d={`${points} L200,40 L0,40 Z`}
            fill={`url(#sparkline-gradient-${status})`}
          />
        )}

        {/* Main line */}
        <path
          d={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: `drop-shadow(0 0 4px ${strokeColor})`,
          }}
        />
      </svg>

      {/* Scanline effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent"
        animate={{ y: ['-100%', '100%'] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
      />
    </div>
  );
}

/**
 * HeroMetricRow - Displays multiple hero metrics in a row
 */
export function HeroMetricRow({ sensorIds = [], className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {sensorIds.map((id) => (
        <HeroMetric key={id} sensorId={id} />
      ))}
    </div>
  );
}

export default HeroMetric;
