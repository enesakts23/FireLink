import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════
   PingEffect – Expanding ring/halo around selected sensor

   Visual: concentric rings that expand outward and fade
   Behavior:
   - continuous loop while visible
   - color matches sensor status
   - respects reduced motion
   ═══════════════════════════════════════════════════════════ */

const RING_COUNT = 3;
const MAX_RADIUS = 2.5;
const CYCLE_DURATION = 2.0; // seconds per full cycle

export default function PingEffect({
  position = [0, 0, 0],
  color = '#00F0FF',
  status = 'normal',
  isDark = false,
  visible = true,
}) {
  const ringsRef = useRef([]);

  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const ringColor = useMemo(() => {
    const colors = {
      normal:   isDark ? '#00F0FF' : '#2D7A6F',
      warning:  isDark ? '#FFB800' : '#D97706',
      critical: isDark ? '#FF4757' : '#DC2626',
      offline:  isDark ? '#64748B' : '#9CA3AF',
    };
    return new THREE.Color(colors[status] || colors.normal);
  }, [status, isDark]);

  useFrame((state) => {
    if (!visible || reducedMotion) return;
    const t = state.clock.elapsedTime;

    ringsRef.current.forEach((ring, i) => {
      if (!ring) return;
      const offset = i / RING_COUNT;
      const phase = ((t / CYCLE_DURATION + offset) % 1);

      // Scale from 0.3 to MAX_RADIUS
      const scale = 0.3 + phase * (MAX_RADIUS - 0.3);
      ring.scale.set(scale, scale, scale);

      // Fade out as it expands
      if (ring.material) {
        ring.material.opacity = Math.max(0, (1 - phase) * 0.6);
      }
    });
  });

  if (!visible) return null;

  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      {Array.from({ length: RING_COUNT }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { ringsRef.current[i] = el; }}
        >
          <ringGeometry args={[0.9, 1.0, 32]} />
          <meshBasicMaterial
            color={ringColor}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
