/**
 * Lil_Hawks — Barrel Export
 *
 * All squads, profiles, types, and the prep-squad runner.
 * Naming convention: Lil_<Role>_Hawk (ACHEEVY Brain §16.2)
 */

// Types
export type { LilHawkId, SquadId, LilHawkProfile } from './types';
export type {
  NormalizedIntent, TaskGraph, TaskNode,
  ContextBundle, PolicyManifest, CostEstimate, ExecutionPacket,
} from './types';
export type {
  WorkflowArtifacts, WorkflowManifest,
  TestPack, TestCase, FailureCase, VersionStamp,
} from './types';

// Squads
export { runPrepSquad, PREP_SQUAD_PROFILES } from './prep-squad-alpha';
export { WorkflowSmithSquad, SQUAD_PROFILES as WORKFLOW_SQUAD_PROFILES } from './workflow-smith-squad';
export { VisionScoutSquad, VISION_SQUAD_PROFILES } from './vision-scout-squad';
export { JSON_Expert_Squad, JSON_SQUAD_PROFILES } from './json-expert-squad';

// Film signal types (vision-scout)
export type { FilmObservation, FilmSignal, VisionAssessment } from './vision-scout-squad';
