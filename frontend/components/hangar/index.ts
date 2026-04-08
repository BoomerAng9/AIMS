/**
 * Hangar Component Barrel — Re-exports for clean imports
 *
 * Usage:
 *   import { HangarRoot } from '@/components/hangar';
 *
 * NOTE: HangarRoot uses dynamic import internally for Three.js/R3F
 * and disables SSR. Consumers do NOT need to wrap it in dynamic().
 */

export { default as HangarRoot } from './HangarRoot';
export { default as HangarScene } from './HangarScene';
export { default as HangarEnvironment } from './HangarEnvironment';
export { default as HangarLighting } from './HangarLighting';
export { default as ActorManager } from './ActorManager';
export { default as ActorCardPanel } from './ActorCardPanel';
export { default as EventBridge } from './EventBridge';
export { default as TelemetryPanel } from './TelemetryPanel';
export { default as TokenMeter } from './TokenMeter';
export { default as OverlayGlassUI } from './OverlayGlassUI';
