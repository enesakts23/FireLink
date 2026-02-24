import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import SceneRoot from './SceneRoot';
import { useSensorStore } from '../../stores/useSensorStore';

/* ═══════════════════════════════════════════════════════════
   DigitalTwin – Canvas wrapper with performance management

   Responsibilities:
   - Canvas setup (dpr clamp, shadows, tone mapping)
   - Performance tier auto-detection
   - Delegates scene content to SceneRoot
   ═══════════════════════════════════════════════════════════ */

/* ─── FPS Monitor (auto-degrade performance tier) ─── */
function PerformanceMonitor() {
  const { gl } = useThree();
  const frameTimesRef = useRef([]);
  const lastCheckRef = useRef(0);
  const setPerformanceTier = useSensorStore((s) => s.setPerformanceTier);

  useEffect(() => {
    let frameId;
    let lastTime = performance.now();

    const measure = () => {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;

      frameTimesRef.current.push(delta);
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }

      // Check every 3 seconds
      if (now - lastCheckRef.current > 3000 && frameTimesRef.current.length >= 30) {
        lastCheckRef.current = now;
        const avg = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        const fps = 1000 / avg;

        if (fps < 25) {
          setPerformanceTier('low');
        } else if (fps < 45) {
          setPerformanceTier('medium');
        } else {
          setPerformanceTier('high');
        }
      }

      frameId = requestAnimationFrame(measure);
    };

    frameId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frameId);
  }, [gl, setPerformanceTier]);

  return null;
}

/* ═══════════════════════════════════════════════════════════ */
export function DigitalTwin({ onSensorClick, className = '' }) {
  const theme = useSensorStore((s) => s.theme);
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#050508' : '#F2F1EC';

  const dprRange = useMemo(() => {
    // Clamp DPR for performance
    const maxDpr = typeof window !== 'undefined' && window.devicePixelRatio > 2 ? 1.75 : 1.5;
    return [1, maxDpr];
  }, []);

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        shadows
        dpr={dprRange}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isDark ? 1.0 : 1.4,
        }}
        style={{ background: bgColor }}
      >
        <color attach="background" args={[bgColor]} />
        <PerformanceMonitor />
        <SceneRoot onSensorClick={onSensorClick} isDark={isDark} />
      </Canvas>
    </div>
  );
}

export default DigitalTwin;
