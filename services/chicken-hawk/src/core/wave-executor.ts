// =============================================================================
// Chicken Hawk — Wave Executor
// Executes manifest waves sequentially. Tasks within a wave run in parallel
// up to the concurrency limit. Gate conditions determine wave pass/fail.
// =============================================================================

import type {
  ManifestWave,
  ManifestTask,
  TaskResult,
  WaveResult,
  Squad,
  EvidenceArtifact,
} from "../types";
import type { SquadManager } from "./squad-manager";
import type { ToolAdapterRegistry } from "../adapters/registry";
import type { PolicyClient } from "../policy/client";
import type { AuditClient } from "../audit/client";
import { sha256 } from "../lib/crypto";

export class WaveExecutor {
  constructor(
    private squadManager: SquadManager,
    private adapterRegistry: ToolAdapterRegistry,
    private policyClient: PolicyClient,
    private auditClient: AuditClient,
  ) {}

  /**
   * Execute a single wave. Tasks run in parallel up to wave.concurrency.
   * Gate determines success criteria: all_pass, majority_pass, any_pass.
   */
  async executeWave(
    wave: ManifestWave,
    squad: Squad,
    shiftId: string,
    manifestId: string,
    budgetRemaining: number,
  ): Promise<WaveResult> {
    const startTime = Date.now();

    await this.auditClient.emit({
      event_type: "wave_started",
      shift_id: shiftId,
      squad_id: squad.squad_id,
      manifest_id: manifestId,
      action: `wave_${wave.wave_id}_start`,
      status: "started",
      metadata: { wave_id: wave.wave_id, task_count: wave.tasks.length, concurrency: wave.concurrency },
    });

    // Execute tasks with concurrency control
    const taskResults: TaskResult[] = [];
    const chunks = chunkArray(wave.tasks, wave.concurrency);

    for (const chunk of chunks) {
      const results = await Promise.allSettled(
        chunk.map((task) => this.executeTask(task, squad, shiftId, manifestId, budgetRemaining)),
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          taskResults.push(result.value);
          budgetRemaining -= result.value.luc_cost_usd;
        } else {
          taskResults.push(createFailedResult(chunk[results.indexOf(result)], result.reason));
        }
      }
    }

    // Evaluate gate condition
    const passed = evaluateGate(wave.gate, taskResults);
    const status = passed ? "success" : "failed";

    const waveResult: WaveResult = {
      wave_id: wave.wave_id,
      status,
      task_results: taskResults,
      duration_ms: Date.now() - startTime,
    };

    await this.auditClient.emit({
      event_type: passed ? "wave_completed" : "wave_failed",
      shift_id: shiftId,
      squad_id: squad.squad_id,
      manifest_id: manifestId,
      action: `wave_${wave.wave_id}_${status}`,
      status,
      duration_ms: waveResult.duration_ms,
      metadata: {
        wave_id: wave.wave_id,
        passed_count: taskResults.filter((r) => r.status === "success").length,
        failed_count: taskResults.filter((r) => r.status === "failed").length,
      },
    });

    return waveResult;
  }

  /**
   * Execute a single task via its assigned Lil_Hawk.
   * Flow: policy check → adapter execute → evidence collect → audit log
   */
  private async executeTask(
    task: ManifestTask,
    squad: Squad,
    shiftId: string,
    manifestId: string,
    budgetRemaining: number,
  ): Promise<TaskResult> {
    const startTime = Date.now();
    const lilHawk = this.squadManager.getLilHawkForTask(squad.squad_id, task.task_id);

    if (!lilHawk) {
      throw new Error(`No Lil_Hawk assigned for task ${task.task_id}`);
    }

    // Mark hawk as executing
    this.squadManager.updateLilHawkStatus(squad.squad_id, lilHawk.id, "executing");

    await this.auditClient.emit({
      event_type: "task_started",
      shift_id: shiftId,
      squad_id: squad.squad_id,
      lil_hawk_id: lilHawk.id,
      manifest_id: manifestId,
      action: task.function,
      status: "started",
      metadata: { task_id: task.task_id, target: task.target },
    });

    // Policy gate check — nothing runs without clearance
    const policyResult = await this.policyClient.check({
      task_id: task.task_id,
      capability_id: task.function.toLowerCase(),
      badge_level: task.badge_level,
      estimated_cost_usd: task.estimated_cost_usd,
      shift_id: shiftId,
      lil_hawk_id: lilHawk.id,
      squad_id: squad.squad_id,
    });

    if (!policyResult.allowed) {
      this.squadManager.updateLilHawkStatus(squad.squad_id, lilHawk.id, "terminated", null, policyResult.reason);
      return {
        task_id: task.task_id,
        lil_hawk_id: lilHawk.id,
        status: "failed",
        output: null,
        input_hash: sha256(JSON.stringify(task.params)),
        output_hash: sha256(""),
        duration_ms: Date.now() - startTime,
        luc_cost_usd: 0,
        error: `Policy denied: ${policyResult.reason}`,
        evidence: [],
      };
    }

    // Execute via tool adapter
    try {
      const adapter = this.adapterRegistry.get(task.function.toLowerCase());
      const output = await adapter.execute(task.params, {
        shift_id: shiftId,
        lil_hawk_id: lilHawk.id,
        squad_id: squad.squad_id,
        budget_remaining_usd: budgetRemaining,
        policy_snapshot: policyResult.policy_snapshot,
      });

      const inputHash = sha256(JSON.stringify(task.params));
      const outputHash = sha256(JSON.stringify(output));
      const durationMs = Date.now() - startTime;

      // Collect evidence
      const evidence: EvidenceArtifact[] = [
        {
          type: "PROOF_HASHES",
          format: "sha256",
          content_hash: outputHash,
          storage_path: `evidence/${shiftId}/${task.task_id}/proof.json`,
          created_at: new Date().toISOString(),
        },
        {
          type: "RUN_LOG",
          format: "json",
          content_hash: sha256(JSON.stringify({ task, output, durationMs })),
          storage_path: `evidence/${shiftId}/${task.task_id}/run_log.json`,
          created_at: new Date().toISOString(),
        },
      ];

      this.squadManager.updateLilHawkStatus(squad.squad_id, lilHawk.id, "terminated", output);

      await this.auditClient.emit({
        event_type: "task_completed",
        shift_id: shiftId,
        squad_id: squad.squad_id,
        lil_hawk_id: lilHawk.id,
        manifest_id: manifestId,
        action: task.function,
        input_hash: inputHash,
        output_hash: outputHash,
        status: "success",
        duration_ms: durationMs,
        luc_cost_usd: task.estimated_cost_usd,
      });

      return {
        task_id: task.task_id,
        lil_hawk_id: lilHawk.id,
        status: "success",
        output,
        input_hash: inputHash,
        output_hash: outputHash,
        duration_ms: durationMs,
        luc_cost_usd: task.estimated_cost_usd,
        evidence,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.squadManager.updateLilHawkStatus(squad.squad_id, lilHawk.id, "terminated", null, errorMsg);

      await this.auditClient.emit({
        event_type: "task_failed",
        shift_id: shiftId,
        squad_id: squad.squad_id,
        lil_hawk_id: lilHawk.id,
        manifest_id: manifestId,
        action: task.function,
        status: "failed",
        duration_ms: Date.now() - startTime,
        error: errorMsg,
      });

      return {
        task_id: task.task_id,
        lil_hawk_id: lilHawk.id,
        status: "failed",
        output: null,
        input_hash: sha256(JSON.stringify(task.params)),
        output_hash: sha256(""),
        duration_ms: Date.now() - startTime,
        luc_cost_usd: 0,
        error: errorMsg,
        evidence: [],
      };
    }
  }
}

function evaluateGate(gate: string, results: TaskResult[]): boolean {
  const successCount = results.filter((r) => r.status === "success").length;
  switch (gate) {
    case "all_pass":
      return successCount === results.length;
    case "majority_pass":
      return successCount > results.length / 2;
    case "any_pass":
      return successCount > 0;
    default:
      return successCount === results.length;
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function createFailedResult(task: ManifestTask, error: unknown): TaskResult {
  return {
    task_id: task.task_id,
    lil_hawk_id: "unknown",
    status: "failed",
    output: null,
    input_hash: sha256(JSON.stringify(task.params)),
    output_hash: sha256(""),
    duration_ms: 0,
    luc_cost_usd: 0,
    error: error instanceof Error ? error.message : String(error),
    evidence: [],
  };
}
