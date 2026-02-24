import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSensorStore } from '../../stores/useSensorStore';

/**
 * Vignette - Subtle status overlay (minimal for light theme)
 */
export function Vignette() {
  const systemStatus = useSensorStore((state) => state.systemStatus);

  return (
    <AnimatePresence>
      {systemStatus === 'critical' && (
        <motion.div
          key="critical-vignette"
          className="fixed inset-0 pointer-events-none z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="absolute inset-0 border-2 border-danger/20 rounded-none"
            animate={{ borderColor: ['rgba(220,38,38,0.2)', 'rgba(220,38,38,0.4)', 'rgba(220,38,38,0.2)'] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * AlertBanner - Top notification for critical alerts
 */
export function AlertBanner() {
  const systemStatus = useSensorStore((state) => state.systemStatus);
  const sensors = useSensorStore((state) => state.deviceSensors[state.activeDeviceId] || {});

  const criticalSensors = useMemo(
    () => Object.values(sensors).filter((s) => s.status === 'critical'),
    [sensors]
  );

  return (
    <AnimatePresence>
      {systemStatus === 'critical' && criticalSensors.length > 0 && (
        <motion.div
          className="fixed top-4 left-[72px] right-0 z-[90] flex justify-center pointer-events-none"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <div className="px-5 py-2.5 bg-danger text-white rounded-full flex items-center gap-3 shadow-lg pointer-events-auto">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <span className="text-sm font-medium">
              {criticalSensors.length} Critical Alert{criticalSensors.length > 1 ? 's' : ''}
            </span>
            <span className="text-white/70 text-sm">
              {criticalSensors.map((s) => s.label).slice(0, 3).join(', ')}
              {criticalSensors.length > 3 && ` +${criticalSensors.length - 3}`}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Vignette;
