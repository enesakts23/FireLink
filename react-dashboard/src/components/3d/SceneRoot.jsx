import { Suspense, useMemo } from 'react';
import {
  PerspectiveCamera, Environment,
} from '@react-three/drei';
import {
  EffectComposer, Bloom, Vignette as VignetteEffect,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

import { EmberParticles } from './Building';
import CameraController from './CameraController';
import FireCardModel from './models/FireCardModel';
import { useSensorStore } from '../../stores/useSensorStore';

/* ═══════════════════════════════════════════════════════════
   SceneRoot – Unified scene with lights, models, interaction

   Orchestrates:
   - Lighting (theme-aware)
   - Environment + fog
   - Building + FireCard model
   - Sensor nodes + ping effects
   - Post-processing (perf-tier aware)
   - Camera controller
   ═══════════════════════════════════════════════════════════ */

/* ─── Lighting ─── */
function LightModeLighting() {
  return (
    <>
      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight
        position={[18, 28, 15]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={60}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-12, 18, -10]} intensity={0.25} color="#E8F5F2" />
      <pointLight position={[-8, 14, 5]} intensity={0.4} color="#E8F5F2" distance={35} decay={2} />
      <hemisphereLight intensity={0.35} color="#E8F5F2" groundColor="#F2F1EC" />
    </>
  );
}

function DarkModeLighting() {
  return (
    <>
      <ambientLight intensity={0.06} color="#0a0a1a" />
      <directionalLight position={[12, 22, 12]} intensity={0.12} color="#1a1a3e" castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-far={50}
        shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} />
      <pointLight position={[-10, 14, 8]} intensity={1.4} color="#00F0FF" distance={40} decay={2} />
      <pointLight position={[14, 10, -12]} intensity={0.9} color="#FF2A6D" distance={35} decay={2} />
      <pointLight position={[0, -1, 0]} intensity={0.3} color="#00F0FF" distance={20} decay={2} />
      <hemisphereLight intensity={0.04} color="#00F0FF" groundColor="#FF2A6D" />
    </>
  );
}

/* ─── Post Processing (perf-tier aware) ─── */
function PostProcessing({ isDark, performanceTier }) {
  if (performanceTier === 'low') return null;

  const bloomIntensity = useMemo(() => {
    if (performanceTier === 'medium') return isDark ? 0.8 : 0.08;
    return isDark ? 1.5 : 0.12;
  }, [isDark, performanceTier]);

  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={isDark ? 0.2 : 0.75}
        luminanceSmoothing={isDark ? 0.8 : 0.9}
        mipmapBlur
        radius={isDark ? 0.8 : 0.4}
      />
      <VignetteEffect
        offset={isDark ? 0.4 : 0.2}
        darkness={isDark ? 0.6 : 0.15}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

/* ─── Loading Fallback ─── */
function LoadingFallback() {
  const theme = useSensorStore((s) => s.theme);
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial color={theme === 'dark' ? '#00F0FF' : '#2D7A6F'} wireframe />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════
   Scene Content
   ═══════════════════════════════════════════════════════════ */
export default function SceneRoot({ onSensorClick, isDark }) {
  const performanceTier = useSensorStore((s) => s.performanceTier);

  return (
    <>
      <PerspectiveCamera makeDefault position={[22, 16, 22]} fov={38} near={0.1} far={1000} />
      <CameraController />

      {/* Lighting */}
      {isDark ? <DarkModeLighting /> : <LightModeLighting />}

      {/* Environment map */}
      <Environment preset={isDark ? 'night' : 'city'} background={false} />

      <Suspense fallback={<LoadingFallback />}>
        {/* Fire Card 3D Model (FBX or procedural fallback) */}
        <FireCardModel isDark={isDark} position={[0, 0, 0]} />

        {/* Particles */}
        <EmberParticles count={performanceTier === 'low' ? 15 : 35} isDark={isDark} />
      </Suspense>

      {/* Fog */}
      <fog attach="fog" args={[isDark ? '#050508' : '#F2F1EC', isDark ? 50 : 40, isDark ? 110 : 100]} />

      {/* Post-processing */}
      <PostProcessing isDark={isDark} performanceTier={performanceTier} />
    </>
  );
}
