'use client';

/**
 * ActorManager — Renders and animates all hangar actors
 *
 * Each actor type has a distinct mesh:
 *   ACHEEVY:       Gold pillar/obelisk on the command platform
 *   BOOMER_ANG:    Blue hexagonal pods
 *   CHICKEN_HAWK:  Yellow dispatch bar on the runway
 *   LIL_HAWK:      Orange capsules that ride the rails
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useHangarStore } from '@/lib/hangar/store';
import type { HangarActor } from '@/lib/hangar/actorRegistry';
import type { ActorStateType } from '@/lib/hangar/stateMachine';
import * as THREE from 'three';

// ─── State-based glow multipliers ────────────────────────────
const STATE_GLOW: Record<ActorStateType, number> = {
  IDLE: 1,
  LISTENING: 1.5,
  ASSIGNED: 2,
  EXECUTING: 2.5,
  RETURNING: 1.8,
  COMPLETE: 3,
};

// ─── ACHEEVY Obelisk ────────────────────────────────────────
function AcheevyMesh({ actor }: { actor: HangarActor }) {
  const ref = useRef<THREE.Mesh>(null);
  const glow = STATE_GLOW[actor.state.current];

  useFrame(({ clock }) => {
    if (!ref.current) return;
    // Slow hover bob
    ref.current.position.y = actor.position[1] + Math.sin(clock.elapsedTime * 0.8) * 0.1;
    // Gentle rotation
    ref.current.rotation.y = clock.elapsedTime * 0.15;
    // Pulse emissive
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    if (mat) {
      mat.emissiveIntensity = actor.emissiveIntensity * glow *
        (0.8 + Math.sin(clock.elapsedTime * 2) * 0.2);
    }
  });

  return (
    <mesh
      ref={ref}
      position={actor.position}
      castShadow
    >
      {/* Tapered obelisk — narrow top, wider base */}
      <cylinderGeometry args={[0.3, 0.6, 2.4, 6]} />
      <meshStandardMaterial
        color={actor.color}
        emissive={actor.emissiveColor}
        emissiveIntensity={actor.emissiveIntensity * glow}
        metalness={0.9}
        roughness={0.15}
      />
    </mesh>
  );
}

// ─── Boomer_Ang Pod ──────────────────────────────────────────
function BoomerAngMesh({ actor }: { actor: HangarActor }) {
  const ref = useRef<THREE.Mesh>(null);
  const glow = STATE_GLOW[actor.state.current];

  useFrame(({ clock }) => {
    if (!ref.current) return;
    // Pod breathe
    const breathe = 1 + Math.sin(clock.elapsedTime * 1.2) * 0.03;
    ref.current.scale.set(breathe, breathe, breathe);
    // Emissive pulse
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    if (mat) {
      mat.emissiveIntensity = actor.emissiveIntensity * glow *
        (0.7 + Math.sin(clock.elapsedTime * 1.5 + 0.5) * 0.3);
    }
  });

  return (
    <mesh
      ref={ref}
      position={actor.position}
      castShadow
    >
      <dodecahedronGeometry args={[0.8, 0]} />
      <meshStandardMaterial
        color={actor.color}
        emissive={actor.emissiveColor}
        emissiveIntensity={actor.emissiveIntensity * glow}
        metalness={0.7}
        roughness={0.25}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// ─── Chicken Hawk Dispatch Bar ───────────────────────────────
function ChickenHawkMesh({ actor }: { actor: HangarActor }) {
  const ref = useRef<THREE.Group>(null);
  const glow = STATE_GLOW[actor.state.current];

  useFrame(({ clock }) => {
    if (!ref.current) return;
    // Slow yaw sweep
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.15;
  });

  return (
    <group ref={ref} position={actor.position}>
      {/* Central body */}
      <mesh castShadow>
        <boxGeometry args={[3, 0.4, 0.6]} />
        <meshStandardMaterial
          color={actor.color}
          emissive={actor.emissiveColor}
          emissiveIntensity={actor.emissiveIntensity * glow}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      {/* Wing tips */}
      {[-1.8, 1.8].map((x) => (
        <mesh key={x} position={[x, 0.1, 0]} castShadow>
          <coneGeometry args={[0.2, 0.5, 4]} />
          <meshStandardMaterial
            color={actor.color}
            emissive={actor.emissiveColor}
            emissiveIntensity={actor.emissiveIntensity * glow * 1.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Lil_Hawk Capsule ────────────────────────────────────────
function LilHawkMesh({ actor }: { actor: HangarActor }) {
  const ref = useRef<THREE.Mesh>(null);
  const glow = STATE_GLOW[actor.state.current];
  const isExecuting = actor.state.current === 'EXECUTING';

  useFrame(({ clock }) => {
    if (!ref.current) return;
    // Quick spin when executing
    if (isExecuting) {
      ref.current.rotation.y = clock.elapsedTime * 3;
    } else {
      ref.current.rotation.y = clock.elapsedTime * 0.5;
    }
    // Hover
    ref.current.position.y = actor.position[1] + Math.sin(clock.elapsedTime * 2 + actor.position[0]) * 0.05;
    // Emissive
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    if (mat) {
      mat.emissiveIntensity = actor.emissiveIntensity * glow *
        (isExecuting ? 1.5 + Math.sin(clock.elapsedTime * 6) * 0.5 : 1);
    }
  });

  return (
    <mesh
      ref={ref}
      position={actor.position}
      castShadow
    >
      <capsuleGeometry args={[0.25, 0.5, 4, 8]} />
      <meshStandardMaterial
        color={actor.color}
        emissive={actor.emissiveColor}
        emissiveIntensity={actor.emissiveIntensity * glow}
        metalness={0.85}
        roughness={0.2}
      />
    </mesh>
  );
}

// ─── Actor selector ──────────────────────────────────────────
function ActorMesh({ actor }: { actor: HangarActor }) {
  const selectActor = useHangarStore((s) => s.selectActor);

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    selectActor(actor.id);
  };

  const inner = (() => {
    switch (actor.type) {
      case 'ACHEEVY':
        return <AcheevyMesh actor={actor} />;
      case 'BOOMER_ANG':
        return <BoomerAngMesh actor={actor} />;
      case 'CHICKEN_HAWK':
        return <ChickenHawkMesh actor={actor} />;
      case 'LIL_HAWK':
        return <LilHawkMesh actor={actor} />;
    }
  })();

  return (
    <group onClick={handleClick} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'default'; }}>
      {inner}
    </group>
  );
}

// ─── Manager ─────────────────────────────────────────────────
export default function ActorManager() {
  const actors = useHangarStore((s) => s.actors);
  const config = useHangarStore((s) => s.performanceConfig);

  const visibleActors = useMemo(
    () => actors.slice(0, config.maxActors),
    [actors, config.maxActors],
  );

  return (
    <group>
      {visibleActors.map((actor) => (
        <ActorMesh key={actor.id} actor={actor} />
      ))}
    </group>
  );
}
