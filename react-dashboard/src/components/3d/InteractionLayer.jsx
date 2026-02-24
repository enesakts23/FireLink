import { useCallback } from 'react';
import { useSensorStore } from '../../stores/useSensorStore';
import { SensorNodes } from './SensorNode';
import PingEffect from './PingEffect';

/* ═══════════════════════════════════════════════════════════
   InteractionLayer – Manages all 3D interaction and selection

   Responsibilities:
   - Renders SensorNodes with click/hover handlers
   - Shows PingEffect on selected sensor
   - Bridges 3D events to Zustand store
   - Deselect on background click
   ═══════════════════════════════════════════════════════════ */

export default function InteractionLayer({ onSensorClick, isDark = false }) {
  const selectedSensor = useSensorStore((s) => s.selectedSensor);
  const sensors = useSensorStore((s) => s.deviceSensors[s.activeDeviceId] || {});
  const selectSensor = useSensorStore((s) => s.selectSensor);
  const setCameraTarget = useSensorStore((s) => s.setCameraTarget);

  const handleSensorClick = useCallback((sensorId) => {
    selectSensor(sensorId);
    setCameraTarget(sensorId);
    onSensorClick?.(sensorId);
  }, [selectSensor, setCameraTarget, onSensorClick]);

  // Background click deselects
  const handleBackgroundClick = useCallback((e) => {
    // Only trigger if the click didn't hit a sensor node
    if (e.object && !e.object.userData?.isSensor) {
      selectSensor(null);
      setCameraTarget(null);
    }
  }, [selectSensor, setCameraTarget]);

  const selectedSensorData = selectedSensor ? sensors[selectedSensor] : null;

  return (
    <group>
      {/* Sensor nodes with interaction */}
      <SensorNodes onSensorClick={handleSensorClick} isDark={isDark} />

      {/* Ping effect on selected sensor */}
      {selectedSensorData && selectedSensorData.position && (
        <PingEffect
          position={[
            selectedSensorData.position.x,
            selectedSensorData.position.y,
            selectedSensorData.position.z,
          ]}
          status={selectedSensorData.status}
          isDark={isDark}
          visible={true}
        />
      )}
    </group>
  );
}
