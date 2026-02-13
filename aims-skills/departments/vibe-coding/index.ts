/**
 * Managed Vibe Coding Department — Barrel Export
 *
 * "Conversate your way to a working aiPLUG."
 *
 * This department handles the entire lifecycle of building applications
 * through conversation. Users describe what they want, ACHEEVY collects
 * the requirements via the Vibe Session vertical, and the build pipeline
 * generates, tests, and deploys the aiPLUG.
 *
 * Chain: ACHEEVY → Vibe_Ang → Chicken Hawk → Lil_Hawks → Quality_Ang
 */

export { VIBE_CODING_VERTICAL, matchVibeIntent } from './vibe-session.vertical';
export { VIBE_ANG_CARD, VIBE_SQUAD_CARDS } from './agent-cards';
export { generateBuildManifest } from './build-manifest';
export type {
  AiPlugSpec,
  BuildManifest,
  VibeSessionData,
  TechStackRecommendation,
} from './types';
