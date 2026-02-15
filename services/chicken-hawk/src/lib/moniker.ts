// =============================================================================
// Chicken Hawk — Bot Moniker Generator
// Per bot-moniker-rules.json v2.0.0
// Pattern: <Function>_<CrewRole>_Lil_Hawk_<ShiftId>-<Serial>
// =============================================================================

import type { CrewRole, LilHawkFunction } from "../types";

const PERSONA_VOCAB = [
  "Harbor", "Cargo", "Dock", "Anchor", "Crane", "Fleet", "Stern", "Bow",
  "Compass", "Rudder", "Beacon", "Mast", "Hull", "Keel", "Rigging", "Galley",
  "Helm", "Portside", "Starboard", "Ballast", "Windward", "Leeward", "Berth",
  "Jetty", "Quay", "Wharf", "Buoy", "Lantern", "Sextant", "Lookout",
];

let serialCounter = 0;
let personaIndex = 0;

export function resetCounters(): void {
  serialCounter = 0;
  personaIndex = 0;
}

export function generateLilHawkMoniker(
  fn: LilHawkFunction,
  crewRole: CrewRole,
  shiftId: string,
): string {
  serialCounter++;
  const serial = String(serialCounter).padStart(3, "0");
  return `${fn}_${crewRole}_Lil_Hawk_${shiftId}-LH${serial}`;
}

export function generatePersonaHandle(): string {
  const name = PERSONA_VOCAB[personaIndex % PERSONA_VOCAB.length];
  personaIndex++;
  return `${name}_Lil_Hawk`;
}

export function generateKYBIdentity(shiftId: string): string {
  serialCounter++;
  const serial = String(serialCounter).padStart(3, "0");
  return `KYB-LH-${shiftId}-LH${serial}`;
}

export function generateSquadId(shiftId: string, batchSerial: number): string {
  const batch = String(batchSerial).padStart(2, "0");
  return `Squad_${shiftId}-B${batch}`;
}

/**
 * Map a capability function to its crew role per bot-moniker-rules.json
 */
const FUNCTION_TO_CREW: Record<string, CrewRole> = {
  Deploy: "CraneOps", Scale: "CraneOps", Update: "CraneOps", Swap: "CraneOps",
  Canary: "CraneOps", Rollback: "CraneOps", Terminate: "CraneOps", Health: "CraneOps",
  Assign: "YardOps", Bind: "YardOps", Attach: "YardOps", Release: "YardOps",
  Quarantine: "YardOps", Rebalance: "YardOps", Route: "YardOps",
  Guard: "SafetyOps", Limit: "SafetyOps", Kill: "SafetyOps", Incident: "SafetyOps",
  Verify: "SafetyOps",
  Cleanup: "LoadOps", Rotate: "LoadOps", Prewarm: "LoadOps", Heal: "LoadOps",
  Detect: "LoadOps", Move: "LoadOps", Export: "LoadOps", Import: "LoadOps",
  Dispatch: "DispatchOps", Split: "DispatchOps", Pause: "DispatchOps",
  Resume: "DispatchOps", Sync: "DispatchOps", Monitor: "DispatchOps",
  Check: "SafetyOps",
};

export function resolveCrewRole(fn: string): CrewRole {
  return FUNCTION_TO_CREW[fn] || "CraneOps";
}
