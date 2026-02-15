/**
 * Hangar Actor Registry — Actor definitions and initial placement
 *
 * v2 — Revised to match canonical Chain-of-Command hierarchy:
 *   ACHEEVY → Boomer_Ang (Managers) → Chicken Hawk (Coordinator) → Lil_Hawks (Workers)
 *
 * Display names use canonical <Nickname>_Ang and Lil_<Role>_Hawk patterns.
 * Persona ≠ Authority. Visual representation only.
 */

import type { ActorState } from './stateMachine';
import { createActorState } from './stateMachine';

export const ACTOR_TYPES = {
  ACHEEVY: 'ACHEEVY',
  BOOMER_ANG: 'BOOMER_ANG',
  CHICKEN_HAWK: 'CHICKEN_HAWK',
  LIL_HAWK: 'LIL_HAWK',
} as const;

export type ActorType = (typeof ACTOR_TYPES)[keyof typeof ACTOR_TYPES];

export interface HangarActor {
  id: string;
  type: ActorType;
  displayName: string;
  color: string;
  emissiveColor: string;
  emissiveIntensity: number;
  position: [number, number, number];
  state: ActorState;
  metadata?: Record<string, unknown>;
}

// Color tokens from the directive
export const ACTOR_COLORS: Record<ActorType, { color: string; emissive: string }> = {
  ACHEEVY: { color: '#C6A74E', emissive: '#C6A74E' },
  BOOMER_ANG: { color: '#2BD4FF', emissive: '#2BD4FF' },
  CHICKEN_HAWK: { color: '#FFC94D', emissive: '#FFC94D' },
  LIL_HAWK: { color: '#FF6A2A', emissive: '#FF6A2A' },
};

/** Creates the default actor setup for the hangar */
export function createDefaultActors(): HangarActor[] {
  return [
    // ACHEEVY — elevated command platform, center-back
    // Executive Orchestrator: speaks mainly to Boomer_Angs
    {
      id: 'acheevy-prime',
      type: 'ACHEEVY',
      displayName: 'ACHEEVY',
      color: ACTOR_COLORS.ACHEEVY.color,
      emissiveColor: ACTOR_COLORS.ACHEEVY.emissive,
      emissiveIntensity: 0.8,
      position: [0, 3, -8],
      state: createActorState(),
      metadata: { role: 'Executive Orchestrator' },
    },
    // Boomer_Ang pods — Managers; own capabilities; supervise Chicken Hawk + Lil_Hawks
    {
      id: 'boomer-ang-alpha',
      type: 'BOOMER_ANG',
      displayName: 'Forge_Ang',
      color: ACTOR_COLORS.BOOMER_ANG.color,
      emissiveColor: ACTOR_COLORS.BOOMER_ANG.emissive,
      emissiveIntensity: 0.5,
      position: [-4, 1.5, -2],
      state: createActorState(),
      metadata: { role: 'Supervisor / Manager', bench_level: 'Expert' },
    },
    {
      id: 'boomer-ang-beta',
      type: 'BOOMER_ANG',
      displayName: 'Betty-Ann_Ang',
      color: ACTOR_COLORS.BOOMER_ANG.color,
      emissiveColor: ACTOR_COLORS.BOOMER_ANG.emissive,
      emissiveIntensity: 0.5,
      position: [4, 1.5, -2],
      state: createActorState(),
      metadata: { role: 'Supervisor / Manager', bench_level: 'Expert' },
    },
    // Chicken Hawk — Coordinator / Throughput Regulator (NOT mentor, NOT strategy setter)
    {
      id: 'chicken-hawk-prime',
      type: 'CHICKEN_HAWK',
      displayName: 'Chicken Hawk',
      color: ACTOR_COLORS.CHICKEN_HAWK.color,
      emissiveColor: ACTOR_COLORS.CHICKEN_HAWK.emissive,
      emissiveIntensity: 0.6,
      position: [0, 0.5, 2],
      state: createActorState(),
      metadata: { role: 'Coordinator / Throughput Regulator' },
    },
    // Lil_Hawks — Workers / Role Specialists (Lil_<Role>_Hawk naming)
    {
      id: 'lil-hawk-0',
      type: 'LIL_HAWK',
      displayName: 'Lil_Messenger_Hawk',
      color: ACTOR_COLORS.LIL_HAWK.color,
      emissiveColor: ACTOR_COLORS.LIL_HAWK.emissive,
      emissiveIntensity: 0.7,
      position: [-5, 0.2, 6],
      state: createActorState(),
      metadata: { role: 'Worker / Role Specialist', specialty: 'handoffs + notifications' },
    },
    {
      id: 'lil-hawk-1',
      type: 'LIL_HAWK',
      displayName: 'Lil_Build_Surgeon_Hawk',
      color: ACTOR_COLORS.LIL_HAWK.color,
      emissiveColor: ACTOR_COLORS.LIL_HAWK.emissive,
      emissiveIntensity: 0.7,
      position: [0, 0.2, 7],
      state: createActorState(),
      metadata: { role: 'Worker / Role Specialist', specialty: 'code + build execution' },
    },
    {
      id: 'lil-hawk-2',
      type: 'LIL_HAWK',
      displayName: 'Lil_Verify_Hawk',
      color: ACTOR_COLORS.LIL_HAWK.color,
      emissiveColor: ACTOR_COLORS.LIL_HAWK.emissive,
      emissiveIntensity: 0.7,
      position: [5, 0.2, 6],
      state: createActorState(),
      metadata: { role: 'Worker / Role Specialist', specialty: 'checks + evidence capture' },
    },
  ];
}
