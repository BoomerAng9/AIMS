// =============================================================================
// Chicken Hawk — Execution Engine
// The heart of Chicken Hawk. Receives manifests, enforces policy, spawns
// squads, executes waves, collects evidence, reports up.
//
// Command chain: ACHEEVY → Boomer_Ang → Chicken Hawk → Squad → Lil_Hawk
// Core principle: "Packet first. Proof always."
// =============================================================================

import type { Manifest, ManifestResult, ManifestStatus, WaveResult } from "../types";
import { SquadManager } from "./squad-manager";
import { WaveExecutor } from "./wave-executor";
import { ToolAdapterRegistry } from "../adapters/registry";
import { PolicyClient } from "../policy/client";
import { AuditClient } from "../audit/client";
import { getBuiltInAdapters } from "../adapters/built-in";

export class ChickenHawkEngine {
  private squadManager: SquadManager;
  private waveExecutor: WaveExecutor;
  private adapterRegistry: ToolAdapterRegistry;
  private policyClient: PolicyClient;
  private auditClient: AuditClient;
  private activeManifests: Map<string, ManifestStatus> = new Map();

  constructor() {
    this.squadManager = new SquadManager();
    this.adapterRegistry = new ToolAdapterRegistry();
    this.policyClient = new PolicyClient();
    this.auditClient = new AuditClient();
    this.waveExecutor = new WaveExecutor(
      this.squadManager,
      this.adapterRegistry,
      this.policyClient,
      this.auditClient,
    );

    // Register built-in adapters
    for (const adapter of getBuiltInAdapters()) {
      this.adapterRegistry.register(adapter);
    }
  }

  /**
   * Execute a manifest end-to-end.
   * This is the main entry point — the execution loop from the spec:
   *
   * receive_manifest → policy_check → luc_budget_check → plan →
   * spawn_squad → execute_waves → collect_evidence → report_up
   */
  async execute(manifest: Manifest): Promise<ManifestResult> {
    const startTime = Date.now();
    this.activeManifests.set(manifest.manifest_id, "received");

    console.log(`\n${"=".repeat(72)}`);
    console.log(`[engine] Manifest received: ${manifest.manifest_id}`);
    console.log(`[engine] Shift: ${manifest.shift_id} | Budget: $${manifest.budget_limit_usd}`);
    console.log(`[engine] Waves: ${manifest.plan.waves.length} | Requested by: ${manifest.requested_by}`);
    console.log(`${"=".repeat(72)}\n`);

    await this.auditClient.emit({
      event_type: "manifest_received",
      shift_id: manifest.shift_id,
      manifest_id: manifest.manifest_id,
      action: "receive_manifest",
      status: "received",
      metadata: { requested_by: manifest.requested_by, approved_by: manifest.approved_by },
    });

    // Step 1: Policy check on the manifest itself
    this.activeManifests.set(manifest.manifest_id, "policy_check");
    const config = await this.policyClient.getConfig();

    if (config.emergency_stop) {
      return this.failManifest(manifest, startTime, "Emergency stop is active — manifest rejected");
    }

    if (manifest.budget_limit_usd > config.budget_cap_usd) {
      return this.failManifest(
        manifest,
        startTime,
        `Manifest budget $${manifest.budget_limit_usd} exceeds cap $${config.budget_cap_usd}`,
      );
    }

    // Check concurrency
    const activeSquads = this.squadManager.getActiveSquads();
    const activeLilHawks = activeSquads.reduce((sum, s) => sum + s.lil_hawks.filter((lh) => lh.status === "executing").length, 0);
    const totalTasks = manifest.plan.waves.reduce((sum, w) => sum + w.tasks.length, 0);

    if (activeLilHawks + totalTasks > config.concurrency_limit) {
      return this.failManifest(
        manifest,
        startTime,
        `Would exceed concurrency limit: ${activeLilHawks} active + ${totalTasks} new > ${config.concurrency_limit} limit`,
      );
    }

    await this.auditClient.emit({
      event_type: "policy_check",
      shift_id: manifest.shift_id,
      manifest_id: manifest.manifest_id,
      action: "policy_check_manifest",
      status: "passed",
    });

    // Step 2: Spawn squad
    this.activeManifests.set(manifest.manifest_id, "planning");
    const squad = this.squadManager.spawnSquad(manifest);

    await this.auditClient.emit({
      event_type: "squad_spawned",
      shift_id: manifest.shift_id,
      squad_id: squad.squad_id,
      manifest_id: manifest.manifest_id,
      action: "spawn_squad",
      status: "spawned",
      metadata: { lil_hawk_count: squad.lil_hawks.length },
    });

    // Log each Lil_Hawk spawn
    for (const hawk of squad.lil_hawks) {
      await this.auditClient.emit({
        event_type: "lil_hawk_spawned",
        shift_id: manifest.shift_id,
        squad_id: squad.squad_id,
        lil_hawk_id: hawk.id,
        manifest_id: manifest.manifest_id,
        action: "spawn_lil_hawk",
        status: "ready",
        metadata: {
          moniker: hawk.moniker,
          persona: hawk.persona_handle,
          crew_role: hawk.kyb.crew_role,
          function: hawk.kyb.function,
        },
      });
    }

    // Step 3: Execute waves sequentially
    this.activeManifests.set(manifest.manifest_id, "executing");
    const waveResults: WaveResult[] = [];
    let budgetRemaining = manifest.budget_limit_usd;
    let aborted = false;

    for (const wave of manifest.plan.waves) {
      // Check for emergency stop between waves
      const freshConfig = await this.policyClient.getConfig();
      if (freshConfig.emergency_stop) {
        aborted = true;
        break;
      }

      // Budget check before wave
      if (budgetRemaining <= 0) {
        await this.auditClient.emit({
          event_type: "budget_exceeded",
          shift_id: manifest.shift_id,
          manifest_id: manifest.manifest_id,
          action: "budget_check",
          status: "exceeded",
        });
        aborted = true;
        break;
      }

      console.log(`\n[engine] Executing wave ${wave.wave_id} (${wave.tasks.length} tasks, concurrency: ${wave.concurrency})`);

      const waveResult = await this.waveExecutor.executeWave(
        wave,
        squad,
        manifest.shift_id,
        manifest.manifest_id,
        budgetRemaining,
      );

      waveResults.push(waveResult);
      budgetRemaining -= waveResult.task_results.reduce((sum, r) => sum + r.luc_cost_usd, 0);

      // If wave failed and gate was all_pass, stop execution
      if (waveResult.status === "failed" && wave.gate === "all_pass") {
        console.log(`[engine] Wave ${wave.wave_id} failed with all_pass gate — halting execution`);
        aborted = true;
        break;
      }
    }

    // Step 4: Finalize
    const allSucceeded = waveResults.every((w) => w.status === "success");
    const finalStatus: ManifestStatus = aborted ? "aborted" : allSucceeded ? "completed" : "failed";
    this.activeManifests.set(manifest.manifest_id, finalStatus);
    this.squadManager.finalizeSquad(squad.squad_id, aborted ? "aborted" : "completed");

    const totalCost = waveResults.reduce(
      (sum, w) => sum + w.task_results.reduce((s, r) => s + r.luc_cost_usd, 0),
      0,
    );

    const result: ManifestResult = {
      manifest_id: manifest.manifest_id,
      shift_id: manifest.shift_id,
      status: finalStatus,
      wave_results: waveResults,
      total_duration_ms: Date.now() - startTime,
      total_luc_cost_usd: totalCost,
      completed_at: new Date().toISOString(),
    };

    await this.auditClient.emit({
      event_type: finalStatus === "completed" ? "shift_completed" : "shift_failed",
      shift_id: manifest.shift_id,
      squad_id: squad.squad_id,
      manifest_id: manifest.manifest_id,
      action: "shift_finalize",
      status: finalStatus,
      duration_ms: result.total_duration_ms,
      luc_cost_usd: totalCost,
    });

    console.log(`\n${"=".repeat(72)}`);
    console.log(`[engine] Manifest ${manifest.manifest_id} → ${finalStatus.toUpperCase()}`);
    console.log(`[engine] Duration: ${result.total_duration_ms}ms | Cost: $${totalCost.toFixed(4)}`);
    console.log(`${"=".repeat(72)}\n`);

    return result;
  }

  /**
   * Emergency stop — halt all active squads and reject new manifests
   */
  async emergencyStop(): Promise<{ stopped_squads: number }> {
    const stopped = this.squadManager.emergencyStopAll();
    await this.policyClient.emergencyStop();

    for (const [id] of this.activeManifests) {
      this.activeManifests.set(id, "aborted");
    }

    return { stopped_squads: stopped };
  }

  /**
   * Get current engine status
   */
  getStatus() {
    return {
      active_manifests: Object.fromEntries(this.activeManifests),
      active_squads: this.squadManager.getActiveSquads().map((s) => ({
        squad_id: s.squad_id,
        shift_id: s.shift_id,
        lil_hawks: s.lil_hawks.length,
        status: s.status,
      })),
      registered_adapters: this.adapterRegistry.list(),
      buffered_audit_events: this.auditClient.getBuffer().length,
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    await this.auditClient.shutdown();
  }

  private async failManifest(manifest: Manifest, startTime: number, reason: string): Promise<ManifestResult> {
    this.activeManifests.set(manifest.manifest_id, "failed");

    await this.auditClient.emit({
      event_type: "shift_failed",
      shift_id: manifest.shift_id,
      manifest_id: manifest.manifest_id,
      action: "manifest_rejected",
      status: "failed",
      error: reason,
    });

    console.error(`[engine] Manifest REJECTED: ${reason}`);

    return {
      manifest_id: manifest.manifest_id,
      shift_id: manifest.shift_id,
      status: "failed",
      wave_results: [],
      total_duration_ms: Date.now() - startTime,
      total_luc_cost_usd: 0,
      completed_at: new Date().toISOString(),
    };
  }
}
