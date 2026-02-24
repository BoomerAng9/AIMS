/**
 * Terminology Simplification Layer — A.I.M.S.
 *
 * Maps technical platform terms to customer-friendly language.
 * Use t(key, mode) in components for mode-aware labels.
 *
 * PRIVATE mode: Full technical vocabulary (developer/owner)
 * PUBLIC mode:  Plain language (customer-facing)
 */

import type { PlatformMode } from './platform-mode';

interface TermEntry {
  /** Technical label (shown in PRIVATE/developer mode) */
  technical: string;
  /** Simple label (shown in PUBLIC/customer mode) */
  simple: string;
}

export const TERMS: Record<string, TermEntry> = {
  // Navigation & Layout
  dashboard: { technical: 'Dashboard', simple: 'Home' },
  circuitBox: { technical: 'Circuit Box', simple: 'Settings & Services' },
  deployDock: { technical: 'Deploy Dock', simple: 'Launch Tools' },
  controlPlane: { technical: 'Control Plane', simple: 'Admin Panel' },
  warRoom: { technical: 'War Room', simple: 'Operations Center' },

  // Plug System
  plug: { technical: 'Plug', simple: 'Tool' },
  plugCatalog: { technical: 'Plug Catalog', simple: 'Tool Library' },
  spinUp: { technical: 'Spin Up', simple: 'Set Up' },
  deploy: { technical: 'Deploy', simple: 'Launch' },
  decommission: { technical: 'Decommission', simple: 'Remove' },
  plugExport: { technical: 'Plug Export', simple: 'Download Package' },

  // Infrastructure
  container: { technical: 'Container', simple: 'App Instance' },
  nginx: { technical: 'Reverse Proxy', simple: 'Web Address' },
  dockerCompose: { technical: 'Docker Compose', simple: 'Setup Package' },
  healthCheck: { technical: 'Health Check', simple: 'Status Check' },
  portAllocation: { technical: 'Port Allocation', simple: 'Connection Setup' },
  instance: { technical: 'Instance', simple: 'Running Tool' },

  // Agents & Chain of Command
  acheevy: { technical: 'ACHEEVY', simple: 'ACHEEVY' }, // Always visible
  boomerAng: { technical: 'Boomer_Ang', simple: 'AI Specialist' },
  lilHawk: { technical: 'Lil_Hawk', simple: 'Task Worker' },
  chickenHawk: { technical: 'Chicken Hawk', simple: 'Project Manager' },
  chainOfCommand: { technical: 'Chain of Command', simple: 'AI Team' },
  agentNetwork: { technical: 'Agent Network', simple: 'AI Team' },

  // Features
  makeItMine: { technical: 'Make It Mine (MIM)', simple: 'Build Something' },
  luc: { technical: 'LUC Credits', simple: 'Usage Credits' },
  oracle: { technical: 'ORACLE Gate', simple: 'Quality Check' },
  ntntn: { technical: 'NtNtN Engine', simple: 'Creative Library' },
  liveSim: { technical: 'LiveSim', simple: 'Live Workspace' },
  vertical: { technical: 'Vertical', simple: 'Marketplace' },

  // Actions
  provision: { technical: 'Provision', simple: 'Prepare' },
  orchestrate: { technical: 'Orchestrate', simple: 'Coordinate' },
  dispatch: { technical: 'Dispatch', simple: 'Assign' },
  buildManifest: { technical: 'Build Manifest', simple: 'Project Plan' },

  // Plans & Tiers
  yourSpace: { technical: 'Your Space', simple: 'My Workspace' },
  modelGarden: { technical: 'Model Garden', simple: 'AI Models' },
  workbench: { technical: 'Workbench', simple: 'Tools' },
  workstreams: { technical: 'Workstreams', simple: 'Projects' },
};

/**
 * Get a mode-aware label for a term.
 *
 * @param key - The term key from TERMS
 * @param mode - PRIVATE (technical) or PUBLIC (simple)
 * @returns The appropriate label, or the key itself if not found
 *
 * @example
 * const { mode } = usePlatformMode();
 * <h2>{t('circuitBox', mode)}</h2>
 * // PRIVATE → "Circuit Box"
 * // PUBLIC  → "Settings & Services"
 */
export function t(key: string, mode: PlatformMode): string {
  const entry = TERMS[key];
  if (!entry) return key;
  return mode === 'PRIVATE' ? entry.technical : entry.simple;
}

/**
 * Get all terms for a given mode (useful for bulk rendering).
 */
export function getAllTerms(mode: PlatformMode): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(TERMS)) {
    result[key] = mode === 'PRIVATE' ? entry.technical : entry.simple;
  }
  return result;
}
