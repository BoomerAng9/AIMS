// =============================================================================
// Chicken Hawk — Squad Manager
// Spawns and manages Squads of Lil_Hawks per manifest.
// Each Lil_Hawk is a Claude Agent SDK agent with bounded capabilities.
// =============================================================================

import type {
  Manifest,
  ManifestTask,
  LilHawk,
  Squad,
  KYBRegistration,
  LilHawkFunction,
  CrewRole,
} from "../types";
import {
  generateLilHawkMoniker,
  generatePersonaHandle,
  generateKYBIdentity,
  generateSquadId,
  resetCounters,
  resolveCrewRole,
} from "../lib/moniker";

let batchCounter = 0;

export class SquadManager {
  private activeSquads: Map<string, Squad> = new Map();

  /**
   * Spawn a Squad for a manifest. Each task in each wave gets a Lil_Hawk.
   * KYB registration happens at birth — no hawk flies without identity.
   */
  spawnSquad(manifest: Manifest): Squad {
    batchCounter++;
    resetCounters();

    const squadId = generateSquadId(manifest.shift_id, batchCounter);
    const allTasks = manifest.plan.waves.flatMap((w) => w.tasks);
    const lilHawks = allTasks.map((task) => this.spawnLilHawk(task, manifest, squadId));

    const squad: Squad = {
      squad_id: squadId,
      shift_id: manifest.shift_id,
      manifest_id: manifest.manifest_id,
      lil_hawks: lilHawks,
      created_at: new Date().toISOString(),
      status: "active",
    };

    this.activeSquads.set(squadId, squad);
    console.log(`[squad-manager] Spawned ${squadId} with ${lilHawks.length} Lil_Hawks`);
    return squad;
  }

  /**
   * Spawn a single Lil_Hawk with full KYB registration.
   * Per bot-moniker-rules.json: KYB registration at birth is mandatory.
   */
  private spawnLilHawk(task: ManifestTask, manifest: Manifest, squadId: string): LilHawk {
    const fn = task.function as LilHawkFunction;
    const crewRole = (task.crew_role as CrewRole) || resolveCrewRole(task.function);
    const moniker = generateLilHawkMoniker(fn, crewRole, manifest.shift_id);
    const personaHandle = generatePersonaHandle();
    const kybIdentity = generateKYBIdentity(manifest.shift_id);

    const kyb: KYBRegistration = {
      identity: kybIdentity,
      moniker,
      persona_handle: personaHandle,
      shift_id: manifest.shift_id,
      squad_id: squadId,
      crew_role: crewRole,
      function: fn,
      spawned_at: new Date().toISOString(),
      spawned_by: "chickenhawk-core",
      contract_ref: manifest.manifest_id,
      capabilities: [task.function.toLowerCase()],
      flight_recorder_stream: `flight-${manifest.shift_id}-${kybIdentity}`,
    };

    console.log(`[squad-manager] KYB registered: ${moniker} → ${personaHandle}`);

    return {
      id: kybIdentity,
      moniker,
      persona_handle: personaHandle,
      kyb,
      status: "ready",
      task_id: task.task_id,
    };
  }

  /**
   * Get a Lil_Hawk from a squad by task_id
   */
  getLilHawkForTask(squadId: string, taskId: string): LilHawk | undefined {
    const squad = this.activeSquads.get(squadId);
    if (!squad) return undefined;
    return squad.lil_hawks.find((lh) => lh.task_id === taskId);
  }

  /**
   * Update a Lil_Hawk's status
   */
  updateLilHawkStatus(
    squadId: string,
    lilHawkId: string,
    status: LilHawk["status"],
    output?: unknown,
    error?: string,
  ): void {
    const squad = this.activeSquads.get(squadId);
    if (!squad) return;

    const hawk = squad.lil_hawks.find((lh) => lh.id === lilHawkId);
    if (!hawk) return;

    hawk.status = status;
    if (output !== undefined) hawk.output = output;
    if (error) hawk.error = error;
    if (status === "terminated") hawk.completed_at = new Date().toISOString();
    if (status === "executing") hawk.started_at = new Date().toISOString();
  }

  /**
   * Mark squad as completed/aborted
   */
  finalizeSquad(squadId: string, status: "completed" | "aborted"): void {
    const squad = this.activeSquads.get(squadId);
    if (!squad) return;
    squad.status = status;
    squad.lil_hawks.forEach((lh) => {
      if (lh.status !== "terminated") {
        lh.status = "terminated";
        lh.completed_at = new Date().toISOString();
      }
    });
  }

  getSquad(squadId: string): Squad | undefined {
    return this.activeSquads.get(squadId);
  }

  getActiveSquads(): Squad[] {
    return Array.from(this.activeSquads.values()).filter((s) => s.status === "active");
  }

  /**
   * Emergency stop — terminate all active squads immediately
   */
  emergencyStopAll(): number {
    let stopped = 0;
    for (const [id, squad] of this.activeSquads) {
      if (squad.status === "active") {
        this.finalizeSquad(id, "aborted");
        stopped++;
      }
    }
    console.log(`[squad-manager] EMERGENCY STOP: ${stopped} squads aborted`);
    return stopped;
  }
}
