import { motion } from 'framer-motion';
import { useSensorStore } from '../../stores/useSensorStore';

/**
 * CleanGauge - Minimal vertical bar gauge
 */
export function TachometerGauge({ sensorId, title, size = 160, className = '' }) {
  const sensor = useSensorStore((state) => state.deviceSensors[state.activeDeviceId]?.[sensorId]);
  if (!sensor) return null;

  const { value, min, max, unit, status, label } = sensor;
  const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1);

  const barColor =
    status === 'critical' ? '#DC2626'
    : status === 'warning' ? '#D97706'
    : '#2D7A6F';

  const bgColor =
    status === 'critical' ? '#FEF2F2'
    : status === 'warning' ? '#FFFBEB'
    : '#E8F5F2';

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Value */}
      <div className="text-center mb-3">
        <motion.p
          className="font-display font-bold text-3xl text-text-primary"
          key={value}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          {value.toFixed(1)}
        </motion.p>
        <p className="text-xs text-text-tertiary mt-0.5">{unit}</p>
      </div>

      {/* Circular progress */}
      <div className="relative" style={{ width: size * 0.5, height: size * 0.5 }}>
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle
            cx="40" cy="40" r="34"
            fill="none"
            stroke={bgColor}
            strokeWidth="6"
          />
          <motion.circle
            cx="40" cy="40" r="34"
            fill="none"
            stroke={barColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 213.6} 213.6`}
            initial={{ strokeDasharray: '0 213.6' }}
            animate={{ strokeDasharray: `${percentage * 213.6} 213.6` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold" style={{ color: barColor }}>
            {(percentage * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Label */}
      <p className="text-xs font-medium text-text-secondary mt-2 text-center">
        {title || label}
      </p>

      {/* Status dot */}
      {status === 'critical' && (
        <motion.div
          className="w-2 h-2 rounded-full bg-danger mt-1.5"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      )}
    </div>
  );
}

/**
 * SystemHealthGauge - Overall system health
 */
export function SystemHealthGauge({ size = 160, className = '' }) {
  const panelHealth = useSensorStore((state) => state.panelHealth);
  const systemStatus = useSensorStore((state) => state.systemStatus);

  const percentage = panelHealth / 100;

  const barColor =
    systemStatus === 'critical' ? '#DC2626'
    : systemStatus === 'warning' ? '#D97706'
    : '#16A34A';

  const bgColor =
    systemStatus === 'critical' ? '#FEF2F2'
    : systemStatus === 'warning' ? '#FFFBEB'
    : '#F0FDF4';

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="text-center mb-3">
        <p className="font-display font-bold text-3xl" style={{ color: barColor }}>
          {panelHealth.toFixed(0)}%
        </p>
        <p className="text-xs text-text-tertiary mt-0.5">System Health</p>
      </div>

      <div className="relative" style={{ width: size * 0.5, height: size * 0.5 }}>
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r="34" fill="none" stroke={bgColor} strokeWidth="6" />
          <motion.circle
            cx="40" cy="40" r="34"
            fill="none"
            stroke={barColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 213.6} 213.6`}
            initial={{ strokeDasharray: '0 213.6' }}
            animate={{ strokeDasharray: `${percentage * 213.6} 213.6` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
      </div>

      <p className="text-xs font-medium text-text-secondary mt-2">Overall Status</p>
    </div>
  );
}

export default TachometerGauge;
