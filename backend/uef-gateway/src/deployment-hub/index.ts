/**
 * Deployment Hub — Public API
 *
 * ACHEEVY's agent factory for spawning, managing, and decommissioning
 * Boomer_Angs and Lil_Hawks.
 *
 * Usage:
 *   import { DeploymentHub } from './deployment-hub';
 *   const result = await DeploymentHub.spawn({ ... });
 *   const roster = DeploymentHub.getRoster();
 */

export { spawnAgent, decommissionAgent, getRoster, getSpawn, getAvailableRoster, getAuditTrail, getFullAuditLog } from './spawn-engine';
export { getCard, listCards, listBoomerAngs, listLilHawks, reloadCards } from './card-loader';
export type {
  SpawnType,
  SpawnStatus,
  EnvironmentTarget,
  VisualIdentity,
  RoleCard,
  SpawnRequest,
  SpawnRecord,
  SpawnResponse,
  SpawnAuditEntry,
  RosterEntry,
} from './types';
