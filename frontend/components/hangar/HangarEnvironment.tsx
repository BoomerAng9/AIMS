'use client';

/**
 * HangarEnvironment — Static hangar geometry
 *
 * Floor, walls, LED ceiling strips, ACHIEVEMOR logo, fog.
 * All geometry is simple mesh primitives — no GLTF loading.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Edges } from '@react-three/drei';
import { useHangarStore } from '@/lib/hangar/store';
import * as THREE from 'three';

const HANGAR_WIDTH = 24;
const HANGAR_DEPTH = 28;
const HANGAR_HEIGHT = 14;
const WALL_OPACITY = 0.08;

/** Metallic hangar floor with reflective grid */
function HangarFloor() {
  const config = useHangarStore((s) => s.performanceConfig);

  return (
    <group>
      {/* Main floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[HANGAR_WIDTH, HANGAR_DEPTH]} />
        <meshStandardMaterial
          color="#0a0e14"
          metalness={0.9}
          roughness={0.2}
          envMapIntensity={config.enableReflections ? 0.5 : 0}
        />
      </mesh>

      {/* Floor grid lines */}
      <gridHelper
        args={[HANGAR_WIDTH, 24, '#1a2a3a', '#0d1520']}
        position={[0, 0.01, 0]}
      />

      {/* Runway center line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 2]}>
        <planeGeometry args={[0.15, 16]} />
        <meshStandardMaterial
          color="#C6A74E"
          emissive="#C6A74E"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Runway side markers */}
      {[-2, 2].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 2]}>
          <planeGeometry args={[0.05, 12]} />
          <meshStandardMaterial
            color="#2BD4FF"
            emissive="#2BD4FF"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

/** LED ceiling strips */
function CeilingLEDs() {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        const phase = clock.elapsedTime * 0.5 + i * 0.3;
        child.material.emissiveIntensity = 0.3 + Math.sin(phase) * 0.15;
      }
    });
  });

  const strips = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let z = -HANGAR_DEPTH / 2 + 2; z < HANGAR_DEPTH / 2; z += 4) {
      positions.push([-HANGAR_WIDTH / 4, HANGAR_HEIGHT - 0.1, z]);
      positions.push([HANGAR_WIDTH / 4, HANGAR_HEIGHT - 0.1, z]);
    }
    return positions;
  }, []);

  return (
    <group ref={ref}>
      {strips.map((pos, i) => (
        <mesh key={i} position={pos} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3, 0.15]} />
          <meshStandardMaterial
            color="#2BD4FF"
            emissive="#2BD4FF"
            emissiveIntensity={0.4}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Hangar walls with subtle wireframe edges */
function HangarWalls() {
  const wallColor = '#0a0e14';

  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, HANGAR_HEIGHT / 2, -HANGAR_DEPTH / 2]}>
        <planeGeometry args={[HANGAR_WIDTH, HANGAR_HEIGHT]} />
        <meshStandardMaterial
          color={wallColor}
          transparent
          opacity={WALL_OPACITY}
          metalness={0.8}
          roughness={0.3}
        />
        <Edges color="#1a2a3a" threshold={15} />
      </mesh>

      {/* Left wall */}
      <mesh
        position={[-HANGAR_WIDTH / 2, HANGAR_HEIGHT / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[HANGAR_DEPTH, HANGAR_HEIGHT]} />
        <meshStandardMaterial
          color={wallColor}
          transparent
          opacity={WALL_OPACITY}
          metalness={0.8}
          roughness={0.3}
        />
        <Edges color="#1a2a3a" threshold={15} />
      </mesh>

      {/* Right wall */}
      <mesh
        position={[HANGAR_WIDTH / 2, HANGAR_HEIGHT / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[HANGAR_DEPTH, HANGAR_HEIGHT]} />
        <meshStandardMaterial
          color={wallColor}
          transparent
          opacity={WALL_OPACITY}
          metalness={0.8}
          roughness={0.3}
        />
        <Edges color="#1a2a3a" threshold={15} />
      </mesh>

      {/* Ceiling */}
      <mesh
        position={[0, HANGAR_HEIGHT, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[HANGAR_WIDTH, HANGAR_DEPTH]} />
        <meshStandardMaterial
          color="#050810"
          transparent
          opacity={0.3}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

/** ACHIEVEMOR logo on back wall */
function AchievemorLogo() {
  return (
    <group position={[0, HANGAR_HEIGHT * 0.7, -HANGAR_DEPTH / 2 + 0.1]}>
      <Text
        fontSize={1.8}
        color="#C6A74E"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.15}
        font="/fonts/inter-bold.woff"
      >
        ACHIEVEMOR
        <meshStandardMaterial
          color="#C6A74E"
          emissive="#C6A74E"
          emissiveIntensity={0.6}
          transparent
          opacity={0.7}
        />
      </Text>
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.5}
        color="#2BD4FF"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.3}
      >
        H A N G A R
        <meshStandardMaterial
          color="#2BD4FF"
          emissive="#2BD4FF"
          emissiveIntensity={0.4}
          transparent
          opacity={0.5}
        />
      </Text>
    </group>
  );
}

/** Build station markers on the floor */
function BuildStations() {
  const stations: [number, number, number][] = [
    [-5, 0.01, 6],
    [0, 0.01, 7],
    [5, 0.01, 6],
  ];

  return (
    <group>
      {stations.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Station pad */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.2, 32]} />
            <meshStandardMaterial
              color="#0d1520"
              emissive="#FF6A2A"
              emissiveIntensity={0.15}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          {/* Station ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <ringGeometry args={[1.1, 1.2, 32]} />
            <meshStandardMaterial
              color="#FF6A2A"
              emissive="#FF6A2A"
              emissiveIntensity={0.5}
              transparent
              opacity={0.6}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** ACHEEVY command platform */
function CommandPlatform() {
  return (
    <group position={[0, 0, -8]}>
      {/* Elevated hexagonal-ish platform */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[2.5, 3, 3, 6]} />
        <meshStandardMaterial
          color="#0a0e14"
          metalness={0.9}
          roughness={0.15}
          emissive="#C6A74E"
          emissiveIntensity={0.08}
        />
        <Edges color="#C6A74E" threshold={15} />
      </mesh>
      {/* Platform ring */}
      <mesh position={[0, 3.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.3, 2.5, 32]} />
        <meshStandardMaterial
          color="#C6A74E"
          emissive="#C6A74E"
          emissiveIntensity={0.6}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

export default function HangarEnvironment() {
  const config = useHangarStore((s) => s.performanceConfig);

  return (
    <group>
      {config.enableFog && <fog attach="fog" args={['#0B0F14', 15, 45]} />}
      <HangarFloor />
      <HangarWalls />
      <CeilingLEDs />
      <AchievemorLogo />
      <BuildStations />
      <CommandPlatform />
    </group>
  );
}
