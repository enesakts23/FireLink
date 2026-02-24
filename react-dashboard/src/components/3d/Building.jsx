import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════
   Procedural Modern Office Building – Architectural Digital Twin
   Glass curtain walls, concrete slabs, steel columns, interior partitions
   ═══════════════════════════════════════════════════════════ */

const BUILDING = {
  width: 14,
  depth: 10,
  floorHeight: 3.2,
  floors: 3,
  slabThickness: 0.25,
  columnRadius: 0.18,
  columnSegments: 8,
  partitionHeight: 2.4,
};

/* ─── Concrete Floor Slab ─── */
function FloorSlab({ y, width, depth, thickness, isDark }) {
  return (
    <mesh position={[0, y, 0]} receiveShadow castShadow>
      <boxGeometry args={[width + 0.4, thickness, depth + 0.4]} />
      <meshStandardMaterial
        color={isDark ? '#12121e' : '#e2e0d8'}
        roughness={isDark ? 0.6 : 0.85}
        metalness={isDark ? 0.3 : 0.05}
        envMapIntensity={0.4}
      />
    </mesh>
  );
}

/* ─── Roof Slab (slightly different material) ─── */
function RoofSlab({ y, width, depth, isDark }) {
  return (
    <group position={[0, y, 0]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[width + 0.6, 0.3, depth + 0.6]} />
        <meshStandardMaterial
          color={isDark ? '#0e0e1a' : '#d8d6ce'}
          roughness={isDark ? 0.5 : 0.75}
          metalness={isDark ? 0.4 : 0.1}
        />
      </mesh>
      {/* Roof edge trim */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[width + 0.8, 0.1, depth + 0.8]} />
        <meshStandardMaterial
          color={isDark ? '#00F0FF' : '#2D7A6F'}
          metalness={0.6}
          roughness={0.3}
          emissive={isDark ? '#00F0FF' : '#2D7A6F'}
          emissiveIntensity={isDark ? 0.3 : 0.05}
        />
      </mesh>
    </group>
  );
}

/* ─── Steel Column ─── */
function Column({ position, height, isDark }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[BUILDING.columnRadius, BUILDING.columnRadius, height, BUILDING.columnSegments]} />
      <meshStandardMaterial
        color={isDark ? '#1a1a2e' : '#b8b5ac'}
        metalness={isDark ? 0.7 : 0.4}
        roughness={isDark ? 0.3 : 0.5}
        envMapIntensity={0.8}
      />
    </mesh>
  );
}

/* ─── Steel Columns Grid ─── */
function ColumnsGrid({ width, depth, floorY, height, isDark }) {
  const cols = useMemo(() => {
    const positions = [];
    const hw = width / 2 - 0.5;
    const hd = depth / 2 - 0.5;
    // Corner columns
    positions.push([-hw, floorY + height / 2, -hd]);
    positions.push([hw, floorY + height / 2, -hd]);
    positions.push([-hw, floorY + height / 2, hd]);
    positions.push([hw, floorY + height / 2, hd]);
    // Mid columns on long sides
    positions.push([0, floorY + height / 2, -hd]);
    positions.push([0, floorY + height / 2, hd]);
    // Mid columns on short sides
    positions.push([-hw, floorY + height / 2, 0]);
    positions.push([hw, floorY + height / 2, 0]);
    return positions;
  }, [width, depth, floorY, height]);

  return (
    <group>
      {cols.map((pos, i) => (
        <Column key={i} position={pos} height={height} isDark={isDark} />
      ))}
    </group>
  );
}

/* ─── Glass Curtain Wall Panel ─── */
function GlassWall({ position, rotation, width, height, isDark }) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <planeGeometry args={[width, height]} />
      <MeshTransmissionMaterial
        transmission={1}
        roughness={0.1}
        thickness={0.5}
        chromaticAberration={0.04}
        anisotropy={0.3}
        distortion={0.1}
        distortionScale={0.2}
        temporalDistortion={0.1}
        color={isDark ? '#0a0a1a' : '#e8f5f2'}
        backside={false}
        samples={6}
        resolution={256}
      />
    </mesh>
  );
}

/* ─── Full Curtain Wall (one side of building) ─── */
function CurtainWall({ side, width, depth, floorY, floorHeight, slabThickness, isDark }) {
  const hw = width / 2;
  const hd = depth / 2;
  const wallHeight = floorHeight - slabThickness;
  const wallY = floorY + slabThickness / 2 + wallHeight / 2;

  // Mullion (vertical frame between glass panels)
  const mullionCount = Math.floor((side === 'front' || side === 'back' ? width : depth) / 2.5);
  const wallWidth = side === 'front' || side === 'back' ? width : depth;

  let position, rotation;
  switch (side) {
    case 'front': position = [0, wallY, -hd]; rotation = [0, 0, 0]; break;
    case 'back': position = [0, wallY, hd]; rotation = [0, Math.PI, 0]; break;
    case 'left': position = [-hw, wallY, 0]; rotation = [0, Math.PI / 2, 0]; break;
    case 'right': position = [hw, wallY, 0]; rotation = [0, -Math.PI / 2, 0]; break;
    default: position = [0, 0, 0]; rotation = [0, 0, 0];
  }

  return (
    <group position={position} rotation={rotation}>
      {/* Glass panel */}
      <GlassWall
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        width={wallWidth}
        height={wallHeight}
        isDark={isDark}
      />
      {/* Mullions (vertical aluminum frames) */}
      {Array.from({ length: mullionCount + 1 }).map((_, i) => {
        const x = -wallWidth / 2 + (wallWidth / mullionCount) * i;
        return (
          <mesh key={`v${i}`} position={[x, 0, 0.02]}>
            <boxGeometry args={[0.04, wallHeight, 0.04]} />
            <meshStandardMaterial
              color={isDark ? '#1a1a3e' : '#c4c2ba'}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        );
      })}
      {/* Horizontal transom at mid-height */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[wallWidth, 0.04, 0.04]} />
        <meshStandardMaterial
          color={isDark ? '#1a1a3e' : '#c4c2ba'}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

/* ─── Interior Partition Wall ─── */
function PartitionWall({ position, rotation = [0, 0, 0], width, height, isDark }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={[width, height, 0.1]} />
      <meshStandardMaterial
        color={isDark ? '#14142a' : '#ededea'}
        roughness={isDark ? 0.7 : 0.9}
        metalness={0.05}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

/* ─── Interior Details for One Floor ─── */
function FloorInterior({ floorY, width, depth, isDark }) {
  const hw = width / 2;
  const hd = depth / 2;
  const partH = BUILDING.partitionHeight;
  const y = floorY + BUILDING.slabThickness / 2 + partH / 2;

  return (
    <group>
      {/* Central corridor partition */}
      <PartitionWall position={[0, y, 0]} width={width * 0.6} height={partH} isDark={isDark} />
      {/* Office dividers */}
      <PartitionWall position={[-hw * 0.4, y, -hd * 0.4]} rotation={[0, Math.PI / 2, 0]} width={depth * 0.35} height={partH} isDark={isDark} />
      <PartitionWall position={[hw * 0.4, y, hd * 0.4]} rotation={[0, Math.PI / 2, 0]} width={depth * 0.35} height={partH} isDark={isDark} />
      {/* Desk-like boxes (simple furniture hints) */}
      <mesh position={[-hw * 0.3, floorY + BUILDING.slabThickness / 2 + 0.4, -hd * 0.3]} castShadow>
        <boxGeometry args={[1.6, 0.8, 0.7]} />
        <meshStandardMaterial color={isDark ? '#1a1a2e' : '#d4d2ca'} roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[hw * 0.3, floorY + BUILDING.slabThickness / 2 + 0.4, hd * 0.3]} castShadow>
        <boxGeometry args={[1.6, 0.8, 0.7]} />
        <meshStandardMaterial color={isDark ? '#1a1a2e' : '#d4d2ca'} roughness={0.8} metalness={0.1} />
      </mesh>
    </group>
  );
}

/* ─── Ground Plane with Grid ─── */
function GroundPlane({ isDark }) {
  return (
    <group position={[0, -0.01, 0]}>
      <gridHelper
        args={[50, 50, isDark ? 0x00F0FF : 0x2D7A6F, isDark ? 0x1a1a2e : 0xd8d6d0]}
        position={[0, 0.01, 0]}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial
          color={isDark ? '#080810' : '#e8e6de'}
          roughness={isDark ? 0.8 : 0.95}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
}

/* ─── Edge Highlight Lines ─── */
function BuildingEdgeLines({ width, depth, totalHeight, isDark }) {
  const geometry = useMemo(() => {
    const box = new THREE.BoxGeometry(width + 0.1, totalHeight, depth + 0.1);
    return new THREE.EdgesGeometry(box);
  }, [width, depth, totalHeight]);

  return (
    <lineSegments geometry={geometry} position={[0, totalHeight / 2, 0]}>
      <lineBasicMaterial
        color={isDark ? '#00F0FF' : '#2D7A6F'}
        transparent
        opacity={isDark ? 0.5 : 0.2}
      />
    </lineSegments>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Building Component
   ═══════════════════════════════════════════════════════════ */
export function Building({ isDark = false }) {
  const groupRef = useRef();
  const { width, depth, floorHeight, floors, slabThickness } = BUILDING;
  const totalHeight = floors * floorHeight;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.06) * 0.02;
    }
  });

  const floorSlabs = useMemo(() => {
    const slabs = [];
    for (let i = 0; i <= floors; i++) {
      const y = i * floorHeight;
      slabs.push({ y, isRoof: i === floors });
    }
    return slabs;
  }, [floors, floorHeight]);

  const sides = ['front', 'back', 'left', 'right'];

  return (
    <group ref={groupRef}>
      {/* Ground plane */}
      <GroundPlane isDark={isDark} />

      {/* Floor slabs */}
      {floorSlabs.map(({ y, isRoof }, i) =>
        isRoof ? (
          <RoofSlab key={`roof-${i}`} y={y} width={width} depth={depth} isDark={isDark} />
        ) : (
          <FloorSlab key={`slab-${i}`} y={y} width={width} depth={depth} thickness={slabThickness} isDark={isDark} />
        )
      )}

      {/* Columns per floor */}
      {Array.from({ length: floors }).map((_, i) => (
        <ColumnsGrid
          key={`cols-${i}`}
          width={width}
          depth={depth}
          floorY={i * floorHeight + slabThickness / 2}
          height={floorHeight - slabThickness}
          isDark={isDark}
        />
      ))}

      {/* Glass curtain walls per floor */}
      {Array.from({ length: floors }).map((_, floorIdx) =>
        sides.map((side) => (
          <CurtainWall
            key={`glass-${floorIdx}-${side}`}
            side={side}
            width={width}
            depth={depth}
            floorY={floorIdx * floorHeight}
            floorHeight={floorHeight}
            slabThickness={slabThickness}
            isDark={isDark}
          />
        ))
      )}

      {/* Interior partitions per floor */}
      {Array.from({ length: floors }).map((_, i) => (
        <FloorInterior
          key={`interior-${i}`}
          floorY={i * floorHeight}
          width={width}
          depth={depth}
          isDark={isDark}
        />
      ))}

      {/* Outline edges */}
      <BuildingEdgeLines width={width} depth={depth} totalHeight={totalHeight} isDark={isDark} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   Ambient Particles
   ═══════════════════════════════════════════════════════════ */
export function EmberParticles({ count = 40, isDark = false }) {
  const pointsRef = useRef();

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 1] = Math.random() * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 35;
      if (isDark) {
        const usePink = Math.random() > 0.7;
        colors[i * 3] = usePink ? 1.0 : 0.0;
        colors[i * 3 + 1] = usePink ? 0.16 : 0.94;
        colors[i * 3 + 2] = usePink ? 0.43 : 1.0;
      } else {
        colors[i * 3] = 0.18;
        colors[i * 3 + 1] = 0.48;
        colors[i * 3 + 2] = 0.44;
      }
    }
    return { positions, colors };
  }, [count, isDark]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.004;
      const positions = pointsRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += 0.003;
        if (positions[i * 3 + 1] > 18) positions[i * 3 + 1] = 0;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={particles.positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={particles.colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={isDark ? 0.07 : 0.04} transparent opacity={isDark ? 0.5 : 0.25} vertexColors sizeAttenuation />
    </points>
  );
}

export default Building;
