import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSensorStore } from '../../stores/useSensorStore';

const LIGHT_COLORS = {
  normal: { core: new THREE.Color('#2D7A6F'), glow: new THREE.Color('#3A9E8F'), intensity: 1 },
  warning: { core: new THREE.Color('#D97706'), glow: new THREE.Color('#F59E0B'), intensity: 1.5 },
  critical: { core: new THREE.Color('#DC2626'), glow: new THREE.Color('#EF4444'), intensity: 2.5 },
  offline: { core: new THREE.Color('#9CA3AF'), glow: new THREE.Color('#D1D5DB'), intensity: 0.3 },
};

const DARK_COLORS = {
  normal: { core: new THREE.Color('#00F0FF'), glow: new THREE.Color('#33F5FF'), intensity: 2.0 },
  warning: { core: new THREE.Color('#FFB800'), glow: new THREE.Color('#FFD000'), intensity: 2.5 },
  critical: { core: new THREE.Color('#FF4757'), glow: new THREE.Color('#FF6B7A'), intensity: 4.0 },
  offline: { core: new THREE.Color('#64748B'), glow: new THREE.Color('#94A3B8'), intensity: 0.5 },
};

export function SensorNode({ sensorId, position, onClick, isDark = false }) {
  const groupRef = useRef();
  const coreRef = useRef();
  const glowRef = useRef();

  const sensor = useSensorStore((state) => state.deviceSensors[state.activeDeviceId]?.[sensorId]);
  const selectedSensor = useSensorStore((state) => state.selectedSensor);
  const selectSensor = useSensorStore((state) => state.selectSensor);

  const isSelected = selectedSensor === sensorId;
  const status = sensor?.status || 'normal';
  const colorMap = isDark ? DARK_COLORS : LIGHT_COLORS;
  const colors = colorMap[status] || colorMap.normal;

  const materials = useMemo(() => ({
    core: new THREE.MeshStandardMaterial({
      color: colors.core,
      emissive: colors.core,
      emissiveIntensity: colors.intensity,
      metalness: isDark ? 0.5 : 0.3,
      roughness: isDark ? 0.2 : 0.4,
    }),
    glow: new THREE.MeshBasicMaterial({
      color: colors.glow,
      transparent: true,
      opacity: isDark ? 0.6 : 0.4,
    }),
    line: new THREE.LineBasicMaterial({
      color: colors.core,
      transparent: true,
      opacity: isDark ? 0.4 : 0.2,
    }),
  }), [colors, isDark]);

  const lineGeometry = useMemo(() => {
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -position.y + 0.5, 0)];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [position.y]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const isCritical = status === 'critical';

    if (coreRef.current) {
      const speed = isCritical ? 6 : isDark ? 2 : 1.5;
      const range = isCritical ? 1.5 : isDark ? 0.5 : 0.2;
      coreRef.current.material.emissiveIntensity = colors.intensity + Math.sin(time * speed) * range;
      const breathe = 1 + Math.sin(time * speed * 0.5) * (isDark ? 0.05 : 0.03);
      coreRef.current.scale.setScalar(breathe);
    }

    if (glowRef.current) {
      glowRef.current.rotation.y = time * 0.3;
      glowRef.current.material.opacity = (isDark ? 0.5 : 0.3) + Math.sin(time * 2) * 0.1;
    }

    if (groupRef.current) {
      const targetScale = isSelected ? 1.3 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  if (!sensor) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    selectSensor(sensorId);
    onClick?.(sensorId);
  };

  const lightColor = isDark
    ? (status === 'critical' ? '#FF4757' : '#00F0FF')
    : (status === 'critical' ? '#DC2626' : '#2D7A6F');

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]} onClick={handleClick}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <primitive object={materials.core} attach="material" />
      </mesh>
      <mesh ref={glowRef}>
        <torusGeometry args={[0.45, 0.02, 16, 32]} />
        <primitive object={materials.glow} attach="material" />
      </mesh>
      <line geometry={lineGeometry}>
        <primitive object={materials.line} attach="material" />
      </line>
      <pointLight
        color={lightColor}
        intensity={isDark ? (status === 'critical' ? 3 : 1.5) : (status === 'critical' ? 2 : 0.8)}
        distance={isDark ? 8 : 5}
        decay={2}
      />
      {isSelected && (
        <Html position={[0, 0.8, 0]} center distanceFactor={15} style={{ pointerEvents: 'none' }}>
          <div className="glass-tooltip">
            <div className="tooltip-header">
              <span className="tooltip-label">{sensor.label}</span>
              <span className="tooltip-status" style={{
                color: status === 'critical'
                  ? (isDark ? '#FF4757' : '#DC2626')
                  : status === 'warning'
                    ? (isDark ? '#FFB800' : '#D97706')
                    : (isDark ? '#00F0FF' : '#2D7A6F')
              }}>
                {status.toUpperCase()}
              </span>
            </div>
            <div className="tooltip-value">
              <span className="value">{sensor.value.toFixed(1)}</span>
              <span className="unit">{sensor.unit}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export function SensorNodes({ onSensorClick, isDark = false }) {
  const sensors = useSensorStore((state) => state.deviceSensors[state.activeDeviceId] || {});
  return (
    <group>
      {Object.values(sensors).map((sensor) => (
        <SensorNode key={sensor.id} sensorId={sensor.id} position={sensor.position} onClick={onSensorClick} isDark={isDark} />
      ))}
    </group>
  );
}

export default SensorNode;
