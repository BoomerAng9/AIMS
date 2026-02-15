/**
 * Hangar Performance Guard — GPU detection and adaptive quality
 */

import { getGPUTier } from 'detect-gpu';

export type PerformanceTier = 'high' | 'medium' | 'low';

export interface PerformanceConfig {
  tier: PerformanceTier;
  enableFog: boolean;
  enableReflections: boolean;
  enableShadows: boolean;
  maxActors: number;
  particleCount: number;
  shadowMapSize: number;
  antialias: boolean;
  pixelRatio: number;
}

const CONFIGS: Record<PerformanceTier, PerformanceConfig> = {
  high: {
    tier: 'high',
    enableFog: true,
    enableReflections: true,
    enableShadows: true,
    maxActors: 8,
    particleCount: 200,
    shadowMapSize: 2048,
    antialias: true,
    pixelRatio: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2),
  },
  medium: {
    tier: 'medium',
    enableFog: true,
    enableReflections: false,
    enableShadows: true,
    maxActors: 6,
    particleCount: 80,
    shadowMapSize: 1024,
    antialias: true,
    pixelRatio: 1,
  },
  low: {
    tier: 'low',
    enableFog: false,
    enableReflections: false,
    enableShadows: false,
    maxActors: 3,
    particleCount: 0,
    shadowMapSize: 512,
    antialias: false,
    pixelRatio: 1,
  },
};

let cachedTier: PerformanceTier | null = null;

/** Detect GPU tier — cached after first call */
export async function getPerformanceTier(): Promise<PerformanceTier> {
  if (cachedTier) return cachedTier;

  try {
    const gpuTier = await getGPUTier();
    if (gpuTier.tier >= 3) cachedTier = 'high';
    else if (gpuTier.tier >= 2) cachedTier = 'medium';
    else cachedTier = 'low';
  } catch {
    cachedTier = 'medium'; // safe default
  }

  return cachedTier;
}

/** Get performance config for a given tier */
export function getPerformanceConfig(tier: PerformanceTier): PerformanceConfig {
  return { ...CONFIGS[tier] };
}

/** Quick sync check for SSR safety */
export function getDefaultPerformanceConfig(): PerformanceConfig {
  return { ...CONFIGS.medium };
}
