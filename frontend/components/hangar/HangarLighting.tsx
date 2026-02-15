'use client';

/**
 * HangarLighting — Adaptive lighting rig for the Hangar World
 *
 * Quality-aware shadows and volumetric-style fog.
 * Responds to performanceConfig from the Zustand store.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useHangarStore } from '@/lib/hangar/store';
import * as THREE from 'three';

export default function HangarLighting() {
  const config = useHangarStore((s) => s.performanceConfig);
  const activeAnimation = useHangarStore((s) => s.activeAnimation);
  const spotRef = useRef<THREE.SpotLight>(null);

  // Subtle pulse on the main spot during animations
  useFrame(({ clock }) => {
    if (!spotRef.current) return;
    if (activeAnimation) {
      const pulse = 0.9 + Math.sin(clock.elapsedTime * 4) * 0.1;
      spotRef.current.intensity = 2.5 * pulse;
    } else {
      spotRef.current.intensity = 2.5;
    }
  });

  return (
    <>
      {/* Ambient fill — low to keep the hangar moody */}
      <ambientLight intensity={0.15} color="#1a1a2e" />

      {/* Main overhead spot — ACHEEVY command platform */}
      <spotLight
        ref={spotRef}
        position={[0, 12, -6]}
        angle={0.5}
        penumbra={0.6}
        intensity={2.5}
        color="#C6A74E"
        castShadow={config.enableShadows}
        shadow-mapSize-width={config.shadowMapSize}
        shadow-mapSize-height={config.shadowMapSize}
        shadow-bias={-0.001}
      />

      {/* Runway strip lights — cool blue/white */}
      <pointLight
        position={[-5, 4, 2]}
        intensity={0.8}
        color="#2BD4FF"
        distance={15}
        decay={2}
      />
      <pointLight
        position={[5, 4, 2]}
        intensity={0.8}
        color="#2BD4FF"
        distance={15}
        decay={2}
      />

      {/* Build station warm wash */}
      <pointLight
        position={[0, 3, 7]}
        intensity={0.6}
        color="#FF6A2A"
        distance={12}
        decay={2}
      />

      {/* Hemisphere light — subtle sky/ground */}
      <hemisphereLight
        color="#1a1a2e"
        groundColor="#0B0F14"
        intensity={0.3}
      />

      {/* Directional fill from camera direction */}
      <directionalLight
        position={[0, 8, 10]}
        intensity={0.4}
        color="#ffffff"
        castShadow={config.enableShadows}
        shadow-mapSize-width={config.shadowMapSize}
        shadow-mapSize-height={config.shadowMapSize}
      />
    </>
  );
}
