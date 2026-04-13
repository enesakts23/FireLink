import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { useSensorStore } from '../../../stores/useSensorStore';

// FBXLoader emits a harmless "unknown material type" warning for custom FBX
// material slots — materials are fully replaced via traverse anyway.
// Suppress specifically at module level so no React lifecycle timing issues.
const _origWarn = console.warn.bind(console);
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('unknown material type')) return;
  _origWarn(...args);
};

/* ═══════════════════════════════════════════════════════════
   FireCardModel – Loads FBX fire detection panel with fallback

   Loads from /models/fire-card.fbx (public dir)
   If FBX not available, renders premium procedural fire card

   State-driven animations:
   - normal:   subtle breathing (scale 1.0 <-> 1.01)
   - warning:  slow pulse + emissive glow
   - critical: controlled pulse + alarm state
   ═══════════════════════════════════════════════════════════ */

const FBX_PATH = '/models/fire-card.fbx';

/* ─── Material Presets ─── */
const MATERIAL_PRESETS = {
  panel: {
    metalness: 0.25,
    roughness: 0.45,
    envMapIntensity: 0.8,
  },
  accent: {
    metalness: 0.35,
    roughness: 0.35,
    envMapIntensity: 1.0,
  },
};

/* ─── Status-based visual config ─── */
const STATUS_VISUALS = {
  normal: {
    light: { emissive: '#2D7A6F', emissiveIntensity: 0.05, pulseSpeed: 0.8, pulseRange: 0.01 },
    dark:  { emissive: '#00F0FF', emissiveIntensity: 0.15, pulseSpeed: 1.0, pulseRange: 0.01 },
  },
  warning: {
    light: { emissive: '#D97706', emissiveIntensity: 0.15, pulseSpeed: 2.0, pulseRange: 0.02 },
    dark:  { emissive: '#FFB800', emissiveIntensity: 0.3, pulseSpeed: 2.5, pulseRange: 0.02 },
  },
  critical: {
    light: { emissive: '#DC2626', emissiveIntensity: 0.25, pulseSpeed: 4.0, pulseRange: 0.03 },
    dark:  { emissive: '#FF4757', emissiveIntensity: 0.5, pulseSpeed: 5.0, pulseRange: 0.03 },
  },
  offline: {
    light: { emissive: '#9CA3AF', emissiveIntensity: 0.0, pulseSpeed: 0, pulseRange: 0 },
    dark:  { emissive: '#64748B', emissiveIntensity: 0.02, pulseSpeed: 0, pulseRange: 0 },
  },
};

/* ─── FBX Model Loader ─── */
function FBXModel({ url, isDark, systemStatus, onLoaded }) {
  const groupRef = useRef();
  const [fbx, setFbx] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const loader = new FBXLoader();
    loader.load(
      url,
      (object) => {
        // Normalize model
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 8 / maxDim; // Normalize to ~8 units

        object.scale.setScalar(scale);
        object.position.set(-center.x * scale, -center.y * scale + 4, -center.z * scale);

        // FBX often uses Z-up; rotate to Y-up if needed
        // object.rotation.x = -Math.PI / 2; // Uncomment if model is Z-up

        // Traverse and upgrade materials
        object.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = true;

            // Upgrade to PBR material
            const oldMat = child.material;
            const newMat = new THREE.MeshStandardMaterial({
              color: oldMat.color || new THREE.Color(isDark ? '#1a1a2e' : '#e0ded8'),
              metalness: MATERIAL_PRESETS.panel.metalness,
              roughness: MATERIAL_PRESETS.panel.roughness,
              envMapIntensity: MATERIAL_PRESETS.panel.envMapIntensity,
              map: oldMat.map || null,
              normalMap: oldMat.normalMap || null,
            });
            child.material = newMat;

            // Recompute normals if geometry seems off
            if (child.geometry && !child.geometry.attributes.normal) {
              child.geometry.computeVertexNormals();
            }
          }
        });

        setFbx(object);
        onLoaded?.();
      },
      undefined,
      () => {
        setLoadError(true);
      }
    );
  }, [url]);

  // Update materials when theme changes
  useEffect(() => {
    if (!fbx) return;
    const vis = STATUS_VISUALS[systemStatus]?.[isDark ? 'dark' : 'light'] || STATUS_VISUALS.normal.light;
    fbx.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.emissive = new THREE.Color(vis.emissive);
        child.material.emissiveIntensity = vis.emissiveIntensity;
        child.material.needsUpdate = true;
      }
    });
  }, [fbx, isDark, systemStatus]);

  // Breathing animation
  useFrame((state) => {
    if (!groupRef.current) return;
    const vis = STATUS_VISUALS[systemStatus]?.[isDark ? 'dark' : 'light'] || STATUS_VISUALS.normal.light;
    if (vis.pulseSpeed > 0) {
      const t = state.clock.elapsedTime;
      const breathe = 1 + Math.sin(t * vis.pulseSpeed) * vis.pulseRange;
      groupRef.current.scale.setScalar(breathe);
    }
  });

  if (loadError) return null; // Fallback will render
  if (!fbx) return null;

  return (
    <group ref={groupRef}>
      <primitive object={fbx} />
    </group>
  );
}

/* ─── Procedural Fire Detection Panel (Fallback) ─── */
function ProceduralFireCard({ isDark, systemStatus }) {
  const groupRef = useRef();
  const ledRef = useRef();
  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const vis = useMemo(() => {
    const mode = isDark ? 'dark' : 'light';
    return STATUS_VISUALS[systemStatus]?.[mode] || STATUS_VISUALS.normal[mode];
  }, [isDark, systemStatus]);

  const panelColor = isDark ? '#12121e' : '#e2e0d8';
  const bodyColor = isDark ? '#0e0e1a' : '#d8d6ce';
  const accentColor = isDark ? '#00F0FF' : '#2D7A6F';

  // Breathing + LED pulse
  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;

    if (groupRef.current && vis.pulseSpeed > 0) {
      const breathe = 1 + Math.sin(t * vis.pulseSpeed) * vis.pulseRange;
      groupRef.current.scale.setScalar(breathe);
    }

    if (ledRef.current) {
      const pulse = vis.pulseSpeed > 0
        ? vis.emissiveIntensity + Math.sin(t * vis.pulseSpeed * 1.5) * 0.3
        : vis.emissiveIntensity;
      ledRef.current.material.emissiveIntensity = Math.max(0, pulse);
    }
  });

  return (
    <group ref={groupRef} position={[0, 4, 0]}>
      {/* Main PCB Board */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[6, 0.15, 4]} />
        <meshStandardMaterial
          color={isDark ? '#0a3a2a' : '#1a6b4a'}
          metalness={0.1}
          roughness={0.7}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Top housing / enclosure */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.6, 0.65, 3.6]} />
        <meshStandardMaterial
          color={panelColor}
          metalness={MATERIAL_PRESETS.panel.metalness}
          roughness={MATERIAL_PRESETS.panel.roughness}
          envMapIntensity={MATERIAL_PRESETS.panel.envMapIntensity}
        />
      </mesh>

      {/* Front panel faceplate */}
      <mesh position={[0, 0.73, 0]} castShadow>
        <boxGeometry args={[5.2, 0.05, 3.2]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.35}
          roughness={0.4}
          envMapIntensity={0.9}
        />
      </mesh>

      {/* Ventilation slots */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`vent-${i}`} position={[-1.8 + i * 0.9, 0.76, 0]} castShadow>
          <boxGeometry args={[0.6, 0.02, 0.08]} />
          <meshStandardMaterial color={isDark ? '#050508' : '#b0aea6'} metalness={0.5} roughness={0.3} />
        </mesh>
      ))}

      {/* Status LED indicator */}
      <mesh ref={ledRef} position={[2.2, 0.78, -1.2]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={vis.emissive}
          emissive={vis.emissive}
          emissiveIntensity={vis.emissiveIntensity}
          metalness={0.1}
          roughness={0.2}
        />
      </mesh>

      {/* LED point light */}
      <pointLight
        position={[2.2, 0.9, -1.2]}
        color={vis.emissive}
        intensity={isDark ? vis.emissiveIntensity * 2 : vis.emissiveIntensity * 0.5}
        distance={3}
        decay={2}
      />

      {/* Sensor modules (4 sensor blocks on the board) */}
      {[
        { pos: [-1.5, 0.9, -0.8], label: 'TEMP' },
        { pos: [0.5, 0.9, -0.8], label: 'GAS' },
        { pos: [-1.5, 0.9, 0.8], label: 'CO' },
        { pos: [0.5, 0.9, 0.8], label: 'AQ' },
      ].map((mod, i) => (
        <group key={`mod-${i}`} position={mod.pos}>
          {/* Module housing */}
          <mesh castShadow>
            <boxGeometry args={[1.2, 0.35, 1.0]} />
            <meshStandardMaterial
              color={isDark ? '#1a1a2e' : '#c8c6be'}
              metalness={0.4}
              roughness={0.5}
            />
          </mesh>
          {/* Module sensor cap */}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.08, 16]} />
            <meshStandardMaterial
              color={accentColor}
              metalness={MATERIAL_PRESETS.accent.metalness}
              roughness={MATERIAL_PRESETS.accent.roughness}
              emissive={accentColor}
              emissiveIntensity={isDark ? 0.2 : 0.05}
            />
          </mesh>
        </group>
      ))}

      {/* Connector block (right side) */}
      <mesh position={[2.5, 0.5, 0]} castShadow>
        <boxGeometry args={[0.4, 0.5, 2.0]} />
        <meshStandardMaterial
          color={isDark ? '#1a1a2e' : '#b8b5ac'}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Mounting holes (corners) */}
      {[[-2.7, 0.08, -1.7], [2.7, 0.08, -1.7], [-2.7, 0.08, 1.7], [2.7, 0.08, 1.7]].map((pos, i) => (
        <mesh key={`hole-${i}`} position={pos}>
          <cylinderGeometry args={[0.1, 0.1, 0.16, 12]} />
          <meshStandardMaterial
            color={isDark ? '#333' : '#999'}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* Edge accent trim */}
      <mesh position={[0, 0.08, -2.02]} castShadow>
        <boxGeometry args={[6, 0.12, 0.04]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={isDark ? 0.3 : 0.05}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, 0.08, 2.02]} castShadow>
        <boxGeometry args={[6, 0.12, 0.04]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={isDark ? 0.3 : 0.05}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Export: FireCardModel
   ═══════════════════════════════════════════════════════════ */
export default function FireCardModel({ isDark = false, position = [0, 0, 0], onClick }) {
  const [fbxAvailable, setFbxAvailable] = useState(null); // null = loading, true/false
  const systemStatus = useSensorStore((s) => s.systemStatus);
  const setModelLoaded = useSensorStore((s) => s.setModelLoaded);

  // Probe FBX availability
  useEffect(() => {
    fetch(FBX_PATH, { method: 'HEAD' })
      .then((res) => {
        setFbxAvailable(res.ok);
        if (!res.ok) setModelLoaded(true); // fallback is instant
      })
      .catch(() => {
        setFbxAvailable(false);
        setModelLoaded(true);
      });
  }, [setModelLoaded]);

  const handleFBXLoaded = useCallback(() => {
    setModelLoaded(true);
  }, [setModelLoaded]);

  return (
    <group position={position} onClick={onClick}>
      {fbxAvailable === true && (
        <FBXModel
          url={FBX_PATH}
          isDark={isDark}
          systemStatus={systemStatus}
          onLoaded={handleFBXLoaded}
        />
      )}
      {fbxAvailable !== true && (
        <ProceduralFireCard isDark={isDark} systemStatus={systemStatus} />
      )}
    </group>
  );
}
