/**
 * Boomer_Ang Persona & Skill Tier Types
 *
 * Aligned with the canonical BoomerAngDefinition from:
 *   - backend/house-of-ang/src/types.ts
 *   - infra/boomerangs/registry.json (source of truth)
 *
 * A Boomer_Ang IS a service: endpoint, capabilities, quotas, health_check.
 * Persona is ADDITIVE metadata — backstory, traits, communication style.
 * Skill tier reflects the complexity of the task assigned.
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import type { PmoId, DirectorId } from './types';

// ---------------------------------------------------------------------------
// BoomerAngDefinition — mirrors backend/house-of-ang/src/types.ts
// Kept in-sync structurally. The canonical registry lives at
// infra/boomerangs/registry.json.
// ---------------------------------------------------------------------------

export interface BoomerAngDefinition {
  id: string;
  name: string;
  source_repo: string;
  description: string;
  capabilities: string[];
  required_quotas: Record<string, number>;
  endpoint: string;
  health_check: string;
  status: 'registered' | 'active' | 'degraded' | 'offline';
}

export interface BoomerAngRegistry {
  boomerangs: BoomerAngDefinition[];
  capability_index: Record<string, string[]>;
  version: string;
  last_updated: string;
}

// ---------------------------------------------------------------------------
// Skill Tiers — assigned based on task complexity score
// ---------------------------------------------------------------------------

export type SkillTier = 'CADET' | 'VETERAN' | 'ELITE' | 'LEGENDARY';

export interface SkillTierConfig {
  tier: SkillTier;
  label: string;
  complexityRange: [number, number]; // min, max complexity score
  maxConcurrency: number;
  description: string;
}

export const SKILL_TIERS: SkillTierConfig[] = [
  {
    tier: 'CADET',
    label: 'Cadet Ang',
    complexityRange: [0, 25],
    maxConcurrency: 1,
    description: 'Fresh from the forge. Handles simple, single-step tasks.',
  },
  {
    tier: 'VETERAN',
    label: 'Veteran Ang',
    complexityRange: [26, 55],
    maxConcurrency: 2,
    description: 'Battle-tested. Handles multi-step tasks with confidence.',
  },
  {
    tier: 'ELITE',
    label: 'Elite Ang',
    complexityRange: [56, 80],
    maxConcurrency: 4,
    description: 'Top performer. Orchestrates complex pipelines.',
  },
  {
    tier: 'LEGENDARY',
    label: 'Legendary Ang',
    complexityRange: [81, 100],
    maxConcurrency: 6,
    description: 'The best of the best. Enterprise-grade operations.',
  },
];

// ---------------------------------------------------------------------------
// Persona — backstory, personality, communication style
// ---------------------------------------------------------------------------

export type PersonalityTrait =
  | 'analytical'
  | 'creative'
  | 'disciplined'
  | 'empathetic'
  | 'relentless'
  | 'meticulous'
  | 'bold'
  | 'strategic'
  | 'resourceful'
  | 'patient'
  | 'charismatic'
  | 'stoic';

export type CommunicationStyle =
  | 'direct'
  | 'narrative'
  | 'technical'
  | 'motivational'
  | 'diplomatic'
  | 'witty';

export interface AngBackstory {
  origin: string;
  motivation: string;
  quirk: string;
  catchphrase: string;
  mentoredBy: string;
}

export interface AngPersona {
  displayName: string;
  codename: string;
  traits: PersonalityTrait[];
  communicationStyle: CommunicationStyle;
  backstory: AngBackstory;
  avatar: string;
}

// ---------------------------------------------------------------------------
// ForgedAngProfile — BoomerAngDefinition + persona + tier (additive)
//
// This is the output of the AngForge. It wraps an existing (or newly created)
// BoomerAngDefinition with persona metadata and a complexity-derived tier.
// ---------------------------------------------------------------------------

export interface ForgedAngProfile {
  /** The canonical service definition from the registry. */
  definition: BoomerAngDefinition;

  /** Additive persona metadata. */
  persona: AngPersona;

  /** Skill tier based on task complexity. */
  skillTier: SkillTier;
  tierConfig: SkillTierConfig;

  /** PMO assignment for this forge. */
  assignedPmo: PmoId;
  director: DirectorId;

  /** Forge metadata. */
  forgedAt: string;
  forgedBy: string;
  forgeReason: string;
  complexityScore: number;

  /** Whether this resolved to an existing registry entry or created a new one. */
  resolvedFromRegistry: boolean;
}

// ---------------------------------------------------------------------------
// Persona Catalog Template
// ---------------------------------------------------------------------------

export interface PersonaTemplate {
  pmoOffice: PmoId;
  personas: AngPersona[];
}

/** Maps a registry Boomer_Ang ID to its assigned persona. */
export interface RegistryPersonaBinding {
  boomerAngId: string;
  persona: AngPersona;
}

// ---------------------------------------------------------------------------
// Forge Request / Result
// ---------------------------------------------------------------------------

export interface AngForgeRequest {
  message: string;
  pmoOffice: PmoId;
  director: DirectorId;
  complexityScore: number;
  requestedBy: string;
}

export interface AngForgeResult {
  profile: ForgedAngProfile;
  tierLabel: string;
  summary: string;
}
