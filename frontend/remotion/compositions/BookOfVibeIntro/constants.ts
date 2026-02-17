/** Scene durations in seconds — multiplied by fps at usage site */
export const SCENE_TIMING = {
  theVoid: 4,
  frequency: 3.5,
  elder: 3.5,
  acheevy: 4,
  title: 4,
  transitionOverlap: 0.5,
} as const;

export const TOTAL_DURATION_SECONDS =
  SCENE_TIMING.theVoid +
  SCENE_TIMING.frequency +
  SCENE_TIMING.elder +
  SCENE_TIMING.acheevy +
  SCENE_TIMING.title -
  4 * SCENE_TIMING.transitionOverlap; // 4 transitions
