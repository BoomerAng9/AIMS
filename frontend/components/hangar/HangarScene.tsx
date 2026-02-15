'use client';

/**
 * HangarScene — Canvas wrapper composing the full 3D scene
 *
 * Sets up R3F Canvas, camera, controls, and composes
 * lighting + environment + actors.
 */

import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Preload, Stats } from '@react-three/drei';
import { useHangarStore } from '@/lib/hangar/store';
import { getPerformanceTier, getPerformanceConfig } from '@/lib/hangar/performanceGuard';
import HangarLighting from './HangarLighting';
import HangarEnvironment from './HangarEnvironment';
import ActorManager from './ActorManager';

function SceneContent() {
  return (
    <>
      <HangarLighting />
      <HangarEnvironment />
      <ActorManager />
    </>
  );
}

export default function HangarScene() {
  const config = useHangarStore((s) => s.performanceConfig);
  const setPerformanceConfig = useHangarStore((s) => s.setPerformanceConfig);

  // Detect GPU tier on mount and set adaptive config
  useEffect(() => {
    let cancelled = false;
    getPerformanceTier().then((tier) => {
      if (!cancelled) {
        setPerformanceConfig(getPerformanceConfig(tier));
      }
    });
    return () => { cancelled = true; };
  }, [setPerformanceConfig]);

  return (
    <Canvas
      shadows={config.enableShadows}
      dpr={config.pixelRatio}
      gl={{
        antialias: config.antialias,
        toneMapping: 3, // ACESFilmicToneMapping
        toneMappingExposure: 1.2,
        powerPreference: 'high-performance',
      }}
      camera={{
        position: [0, 8, 16],
        fov: 55,
        near: 0.1,
        far: 100,
      }}
      style={{ background: '#0B0F14' }}
    >
      <color attach="background" args={['#0B0F14']} />

      <Suspense fallback={null}>
        <SceneContent />
        <Preload all />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={8}
        maxDistance={30}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 2, 0]}
        autoRotate={false}
        dampingFactor={0.05}
        enableDamping
      />

      {process.env.NODE_ENV === 'development' && <Stats />}
    </Canvas>
  );
}
