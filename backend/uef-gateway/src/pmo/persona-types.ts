/**
 * Boomer_Ang Persona & Skill Tier Types
 *
 * Every Boomer_Ang spawned in the House of Ang gets:
 *   1. A Persona — name, backstory, personality traits, communication style
 *   2. A Skill Tier — based on task complexity (Cadet → Veteran → Elite → Legendary)
 *   3. PMO Assignment — which C-Suite office they report to
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import { PmoId, DirectorId } from './types';

// ---------------------------------------------------------------------------
// Skill Tiers — based on task complexity
// ---------------------------------------------------------------------------

export type SkillTier = 'CADET' | 'VETERAN' | 'ELITE' | 'LEGENDARY';

export interface SkillTierConfig {
  tier: SkillTier;
  label: string;
  complexityRange: [number, number]; // min, max complexity score
  maxConcurrency: number;
  capabilityWeightFloor: number;     // minimum capability weight
  maxSpecialties: number;
  canMentor: boolean;
  canLeadSquad: boolean;
  description: string;
}

export const SKILL_TIERS: SkillTierConfig[] = [
  {
    tier: 'CADET',
    label: 'Cadet Ang',
    complexityRange: [0, 25],
    maxConcurrency: 1,
    capabilityWeightFloor: 0.4,
    maxSpecialties: 2,
    canMentor: false,
    canLeadSquad: false,
    description: 'Fresh from the forge. Handles simple, single-step tasks. Learning the ropes.',
  },
  {
    tier: 'VETERAN',
    label: 'Veteran Ang',
    complexityRange: [26, 55],
    maxConcurrency: 2,
    capabilityWeightFloor: 0.6,
    maxSpecialties: 4,
    canMentor: false,
    canLeadSquad: false,
    description: 'Battle-tested. Handles multi-step tasks and can juggle two workstreams.',
  },
  {
    tier: 'ELITE',
    label: 'Elite Ang',
    complexityRange: [56, 80],
    maxConcurrency: 4,
    capabilityWeightFloor: 0.8,
    maxSpecialties: 6,
    canMentor: true,
    canLeadSquad: true,
    description: 'Top performer. Orchestrates complex pipelines and mentors Cadets.',
  },
  {
    tier: 'LEGENDARY',
    label: 'Legendary Ang',
    complexityRange: [81, 100],
    maxConcurrency: 6,
    capabilityWeightFloor: 0.9,
    maxSpecialties: 10,
    canMentor: true,
    canLeadSquad: true,
    description: 'The best of the best. Handles enterprise-grade operations with full autonomy.',
  },
];

// ---------------------------------------------------------------------------
// Persona — personality, backstory, communication style
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
  | 'direct'       // short, punchy, no fluff
  | 'narrative'    // tells stories, provides context
  | 'technical'    // data-driven, precise language
  | 'motivational' // uplifting, team-focused
  | 'diplomatic'   // careful, balanced phrasing
  | 'witty';       // clever, uses humor

export interface AngBackstory {
  origin: string;        // where they "came from" in the AIMS lore
  motivation: string;    // what drives them
  quirk: string;         // a memorable personality quirk
  catchphrase: string;   // their signature line
  mentoredBy: string;    // who trained them in the House of Ang
}

export interface AngPersona {
  displayName: string;
  codename: string;                     // short internal handle
  traits: PersonalityTrait[];
  communicationStyle: CommunicationStyle;
  backstory: AngBackstory;
  avatar: string;                       // emoji or icon reference
}

// ---------------------------------------------------------------------------
// Spawned Ang (extends DeployedAng with persona + skill tier)
// ---------------------------------------------------------------------------

export interface SpawnedAngProfile {
  id: string;
  name: string;
  persona: AngPersona;
  skillTier: SkillTier;
  tierConfig: SkillTierConfig;
  assignedPmo: PmoId;
  director: DirectorId;
  specialties: string[];
  capabilities: Array<{ name: string; weight: number }>;
  spawnedAt: string;
  spawnedBy: string;
  spawnReason: string;         // the task/message that triggered creation
  complexityScore: number;
  status: 'SPAWNING' | 'DEPLOYED' | 'STANDBY' | 'OFFLINE';
  tasksCompleted: number;
  successRate: number;
}

// ---------------------------------------------------------------------------
// Persona Catalog — per-PMO persona templates
// ---------------------------------------------------------------------------

export interface PersonaTemplate {
  pmoOffice: PmoId;
  personas: AngPersona[];
}

// ---------------------------------------------------------------------------
// Spawn Request
// ---------------------------------------------------------------------------

export interface AngSpawnRequest {
  message: string;                       // the user's task message
  pmoOffice: PmoId;
  director: DirectorId;
  complexityScore: number;               // 0-100
  requestedBy: string;                   // userId or 'ACHEEVY'
  context?: Record<string, unknown>;
}

export interface AngSpawnResult {
  ang: SpawnedAngProfile;
  tierLabel: string;
  summary: string;
}
