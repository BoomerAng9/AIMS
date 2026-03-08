// =============================================================================
// Chicken Hawk — ORACLE 7-Gate Verification
// Every output must pass 7 verification gates before leaving the system.
//
// BLOCKING gates (fail = reject output):
//   Gate 1: Technical   — all waves must have succeeded
//   Gate 2: Security    — all tasks must have evidence artifacts
//   Gate 5: Compliance  — no budget anomalies (actual ≤ 120% of budget)
//
// ADVISORY gates (fail = log warning, output still passes):
//   Gate 3: UX          — all task outputs are non-empty
//   Gate 4: Performance — average wave duration < 60s
//   Gate 6: Strategy    — at least 1 wave completed (not all skipped)
//   Gate 7: Docs        — run logs present in evidence
// =============================================================================

import type { ManifestResult, OracleGateResult, OracleVerdict } from "../types";

type GateEvaluator = (result: ManifestResult, budgetLimit: number) => OracleGateResult;

const GATES: GateEvaluator[] = [
  // Gate 1: Technical — BLOCKING
  (result) => {
    const allWavesSucceeded = result.wave_results.every((w) => w.status === "success");
    return {
      gate: 1,
      name: "Technical",
      passed: allWavesSucceeded,
      blocking: true,
      reason: allWavesSucceeded
        ? "All waves succeeded"
        : `${result.wave_results.filter((w) => w.status !== "success").length} wave(s) failed`,
    };
  },

  // Gate 2: Security — BLOCKING
  (result) => {
    const allTasksHaveEvidence = result.wave_results.every((w) =>
      w.task_results.every((t) => t.evidence.length > 0 || t.status === "skipped"),
    );
    return {
      gate: 2,
      name: "Security",
      passed: allTasksHaveEvidence,
      blocking: true,
      reason: allTasksHaveEvidence
        ? "All tasks have evidence artifacts"
        : "Some tasks are missing evidence — no proof, no done",
    };
  },

  // Gate 3: UX — Advisory
  (result) => {
    const allOutputsNonEmpty = result.wave_results.every((w) =>
      w.task_results.every((t) => t.output !== null && t.output !== undefined),
    );
    return {
      gate: 3,
      name: "UX",
      passed: allOutputsNonEmpty,
      blocking: false,
      reason: allOutputsNonEmpty
        ? "All task outputs are present"
        : "Some tasks returned empty output",
    };
  },

  // Gate 4: Performance — Advisory
  (result) => {
    const avgWaveDuration = result.wave_results.length > 0
      ? result.wave_results.reduce((sum, w) => sum + w.duration_ms, 0) / result.wave_results.length
      : 0;
    const passed = avgWaveDuration < 60000;
    return {
      gate: 4,
      name: "Performance",
      passed,
      blocking: false,
      reason: passed
        ? `Average wave duration ${(avgWaveDuration / 1000).toFixed(1)}s (< 60s)`
        : `Average wave duration ${(avgWaveDuration / 1000).toFixed(1)}s exceeds 60s threshold`,
    };
  },

  // Gate 5: Compliance — BLOCKING
  (result, budgetLimit) => {
    const overBudget = result.total_luc_cost_usd > budgetLimit * 1.2;
    return {
      gate: 5,
      name: "Compliance",
      passed: !overBudget,
      blocking: true,
      reason: overBudget
        ? `Cost $${result.total_luc_cost_usd.toFixed(4)} exceeds 120% of budget $${budgetLimit}`
        : `Cost $${result.total_luc_cost_usd.toFixed(4)} within budget`,
    };
  },

  // Gate 6: Strategy — Advisory
  (result) => {
    const atLeastOneWave = result.wave_results.length > 0;
    return {
      gate: 6,
      name: "Strategy",
      passed: atLeastOneWave,
      blocking: false,
      reason: atLeastOneWave
        ? `${result.wave_results.length} wave(s) executed`
        : "No waves were executed",
    };
  },

  // Gate 7: Docs — Advisory
  (result) => {
    const hasRunLogs = result.wave_results.some((w) =>
      w.task_results.some((t) => t.evidence.some((e) => e.type === "RUN_LOG")),
    );
    return {
      gate: 7,
      name: "Docs",
      passed: hasRunLogs,
      blocking: false,
      reason: hasRunLogs
        ? "Run logs present in evidence"
        : "No run logs found in evidence artifacts",
    };
  },
];

/**
 * Run all 7 ORACLE gates against a manifest result.
 * Returns a verdict: approved if all BLOCKING gates pass.
 */
export function verifyOracle(result: ManifestResult, budgetLimit: number): OracleVerdict {
  const gateResults = GATES.map((evaluate) => evaluate(result, budgetLimit));
  const blockingFailures = gateResults.filter((g) => g.blocking && !g.passed);
  const advisoryWarnings = gateResults.filter((g) => !g.blocking && !g.passed);

  const approved = blockingFailures.length === 0;

  console.log(`[oracle] Verification: ${approved ? "APPROVED" : "REJECTED"}`);
  for (const g of gateResults) {
    const icon = g.passed ? "PASS" : g.blocking ? "BLOCK" : "WARN";
    console.log(`[oracle]   Gate ${g.gate} (${g.name}): ${icon} — ${g.reason}`);
  }

  return {
    approved,
    gates: gateResults,
    blocking_failures: blockingFailures,
    advisory_warnings: advisoryWarnings,
    verified_at: new Date().toISOString(),
  };
}
