import { useRef, useEffect } from 'react';
import { CameraControls } from '@react-three/drei';
import { useSensorStore } from '../../stores/useSensorStore';

/* ═══════════════════════════════════════════════════════════
   CameraController – Enhanced smart camera with sensor focus

   Features:
   - Smooth damped camera transitions
   - Auto-focus on selected sensor
   - Default overview position
   - Global ref for external zoom triggers
   ═══════════════════════════════════════════════════════════ */

const DEFAULT_CAMERA = {
  position: [22, 16, 22],
  target: [0, 4, 0],
};

const FOCUS_OFFSET = { x: 6, y: 4, z: 6 };

export default function CameraController() {
  const controlsRef = useRef();
  const cameraTarget = useSensorStore((s) => s.cameraTarget);
  const sensors = useSensorStore((s) => s.deviceSensors[s.activeDeviceId] || {});

  // Expose controls globally for external zoom triggers (e.g., SensorsPage "Locate" button)
  useEffect(() => {
    if (controlsRef.current) {
      window.__cameraControls = controlsRef.current;
    }
    return () => { window.__cameraControls = null; };
  }, []);

  // Zoom to sensor when cameraTarget changes
  useEffect(() => {
    if (!controlsRef.current) return;

    if (cameraTarget && sensors[cameraTarget]) {
      const sensor = sensors[cameraTarget];
      const pos = sensor.position;
      controlsRef.current.setLookAt(
        pos.x + FOCUS_OFFSET.x,
        pos.y + FOCUS_OFFSET.y,
        pos.z + FOCUS_OFFSET.z,
        pos.x, pos.y, pos.z,
        true // animate
      );
    } else if (!cameraTarget) {
      // Reset to default overview
      controlsRef.current.setLookAt(
        ...DEFAULT_CAMERA.position,
        ...DEFAULT_CAMERA.target,
        true
      );
    }
  }, [cameraTarget, sensors]);

  return (
    <CameraControls
      ref={controlsRef}
      minDistance={5}
      maxDistance={55}
      minPolarAngle={Math.PI / 8}
      maxPolarAngle={Math.PI / 2.1}
      dollySpeed={0.5}
      truckSpeed={0.8}
      smoothTime={0.4}
      draggingSmoothTime={0.2}
    />
  );
}
