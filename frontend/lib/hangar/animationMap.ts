/**
 * Hangar Animation Map — Event type → animation sequence key
 *
 * Each event type maps to a named animation that the 3D scene will play.
 * These are deterministic sequences — no random animation.
 */

import type { HangarEventType } from './eventSchema';

export type AnimationSequenceId =
  | 'promptArrival'
  | 'routeBeamToBoomer'
  | 'pulseBoomerPod'
  | 'splitRunwayPackets'
  | 'launchLilHawk'
  | 'illuminateBuildNode'
  | 'returnProofCapsule'
  | 'goldenCompletionBurst';

export const animationMap: Record<HangarEventType, AnimationSequenceId> = {
  PROMPT_RECEIVED: 'promptArrival',
  ROUTED_TO_PMO: 'routeBeamToBoomer',
  BOOMER_ANG_ASSIGNED: 'pulseBoomerPod',
  CHICKEN_HAWK_DISPATCH: 'splitRunwayPackets',
  LIL_HAWK_EXECUTE: 'launchLilHawk',
  BUILD_PROGRESS: 'illuminateBuildNode',
  PROOF_ATTACHED: 'returnProofCapsule',
  DEPLOY_COMPLETE: 'goldenCompletionBurst',
};

/** Duration in ms for each animation sequence */
export const animationDurations: Record<AnimationSequenceId, number> = {
  promptArrival: 1200,
  routeBeamToBoomer: 1800,
  pulseBoomerPod: 1000,
  splitRunwayPackets: 1500,
  launchLilHawk: 2500,
  illuminateBuildNode: 2000,
  returnProofCapsule: 2200,
  goldenCompletionBurst: 1600,
};

/** Get the animation key for a given event type */
export function getAnimationForEvent(eventType: HangarEventType): AnimationSequenceId {
  return animationMap[eventType];
}

/** Get total duration for a full orchestration sequence */
export function getFullSequenceDuration(): number {
  return Object.values(animationDurations).reduce((sum, d) => sum + d, 0);
}
