/**
 * Hangar Path Engine — Rail network for actor movement
 *
 * Predefined 3D splines with ease-in/ease-out interpolation.
 * All positions in Three.js world space.
 */

import * as THREE from 'three';

export type PathId =
  | 'ACHEEVY_TO_BOOMER'
  | 'BOOMER_TO_CHICKEN_HAWK'
  | 'CHICKEN_HAWK_TO_BUILD_0'
  | 'CHICKEN_HAWK_TO_BUILD_1'
  | 'CHICKEN_HAWK_TO_BUILD_2'
  | 'BUILD_0_TO_RETURN'
  | 'BUILD_1_TO_RETURN'
  | 'BUILD_2_TO_RETURN';

interface PathDef {
  points: THREE.Vector3[];
  tension: number;
}

const PATH_DEFS: Record<PathId, PathDef> = {
  ACHEEVY_TO_BOOMER: {
    points: [
      new THREE.Vector3(0, 3, -8),    // ACHEEVY platform
      new THREE.Vector3(0, 2.5, -5),
      new THREE.Vector3(-3, 1.5, -2), // Boomer_Ang pod area
    ],
    tension: 0.4,
  },
  BOOMER_TO_CHICKEN_HAWK: {
    points: [
      new THREE.Vector3(-3, 1.5, -2),
      new THREE.Vector3(-1, 1, 0),
      new THREE.Vector3(0, 0.5, 2),    // Chicken Hawk runway
    ],
    tension: 0.3,
  },
  CHICKEN_HAWK_TO_BUILD_0: {
    points: [
      new THREE.Vector3(0, 0.5, 2),
      new THREE.Vector3(-2, 0.3, 4),
      new THREE.Vector3(-5, 0.2, 6),   // Build node 0
    ],
    tension: 0.5,
  },
  CHICKEN_HAWK_TO_BUILD_1: {
    points: [
      new THREE.Vector3(0, 0.5, 2),
      new THREE.Vector3(0, 0.3, 5),
      new THREE.Vector3(0, 0.2, 7),    // Build node 1
    ],
    tension: 0.5,
  },
  CHICKEN_HAWK_TO_BUILD_2: {
    points: [
      new THREE.Vector3(0, 0.5, 2),
      new THREE.Vector3(2, 0.3, 4),
      new THREE.Vector3(5, 0.2, 6),    // Build node 2
    ],
    tension: 0.5,
  },
  BUILD_0_TO_RETURN: {
    points: [
      new THREE.Vector3(-5, 0.2, 6),
      new THREE.Vector3(-3, 1, 3),
      new THREE.Vector3(0, 2, -2),
      new THREE.Vector3(0, 3, -8),     // Back to ACHEEVY
    ],
    tension: 0.3,
  },
  BUILD_1_TO_RETURN: {
    points: [
      new THREE.Vector3(0, 0.2, 7),
      new THREE.Vector3(0, 1, 3),
      new THREE.Vector3(0, 2, -2),
      new THREE.Vector3(0, 3, -8),
    ],
    tension: 0.3,
  },
  BUILD_2_TO_RETURN: {
    points: [
      new THREE.Vector3(5, 0.2, 6),
      new THREE.Vector3(3, 1, 3),
      new THREE.Vector3(0, 2, -2),
      new THREE.Vector3(0, 3, -8),
    ],
    tension: 0.3,
  },
};

// Cache compiled curves
const curveCache = new Map<PathId, THREE.CatmullRomCurve3>();

function getCurve(pathId: PathId): THREE.CatmullRomCurve3 {
  let curve = curveCache.get(pathId);
  if (!curve) {
    const def = PATH_DEFS[pathId];
    curve = new THREE.CatmullRomCurve3(def.points, false, 'catmullrom', def.tension);
    curveCache.set(pathId, curve);
  }
  return curve;
}

/**
 * Ease-in-out interpolation (acceleration + deceleration)
 * Maps linear t (0–1) to eased t
 */
function easeInOut(t: number): number {
  return t < 0.5
    ? 2 * t * t                        // ease in
    : 1 - Math.pow(-2 * t + 2, 2) / 2; // ease out
}

/**
 * Get position along a predefined rail path
 * @param pathId Which path to traverse
 * @param progress 0–1 linear progress
 * @returns World-space position
 */
export function getPointOnPath(pathId: PathId, progress: number): THREE.Vector3 {
  const curve = getCurve(pathId);
  const eased = easeInOut(Math.max(0, Math.min(1, progress)));
  return curve.getPoint(eased);
}

/**
 * Get tangent direction along a path (for orientation)
 */
export function getTangentOnPath(pathId: PathId, progress: number): THREE.Vector3 {
  const curve = getCurve(pathId);
  const eased = easeInOut(Math.max(0, Math.min(1, progress)));
  return curve.getTangent(eased).normalize();
}

/**
 * Get total arc length of a path (for timing calculations)
 */
export function getPathLength(pathId: PathId): number {
  return getCurve(pathId).getLength();
}

/**
 * Get the full sequence of paths for a complete dispatch-and-return cycle
 */
export function getDispatchCyclePaths(buildNode: number): PathId[] {
  const node = Math.max(0, Math.min(2, buildNode)) as 0 | 1 | 2;
  const toBuild = `CHICKEN_HAWK_TO_BUILD_${node}` as PathId;
  const toReturn = `BUILD_${node}_TO_RETURN` as PathId;
  return ['ACHEEVY_TO_BOOMER', 'BOOMER_TO_CHICKEN_HAWK', toBuild, toReturn];
}
