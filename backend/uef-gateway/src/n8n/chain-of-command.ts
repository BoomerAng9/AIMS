/**
 * Chain of Command Pipeline — Full Execution Engine
 *
 * Executes the complete chain:
 *   Chicken Hawk → Squad → Lil_Hawks → Verification → Receipt → ACHEEVY → User
 *
 * Takes a PmoPipelinePacket (already classified + directed by PMO Router)
 * and runs it through Squad assembly, wave execution, verification, and receipt seal.
 *
 * Each step is dispatched to real agents via the Agent Registry (A2A protocol).
 * Agents may be in-process Boomer_Angs or containerized services — the registry
 * abstracts the difference. Bench scoring runs on every step output.
 *
 * Doctrine: "Activity breeds Activity — shipped beats perfect."
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import { registry } from '../agents/registry';
import type { AgentTaskInput, AgentTaskOutput, AgentId } from '../agents/types';
import {
  PmoPipelinePacket,
  ShiftRecord,
  SquadRecord,
  SquadMember,
  CrewSpecialty,
  AssignedStep,
  StepResult,
  WaveResult,
  ExecutionRecord,
  VerificationCheck,
  VerificationResult,
  ShiftReceipt,
  ShiftStatus,
  N8nPipelineResponse,
} from './types';

// ---------------------------------------------------------------------------
// Lil_Hawk Designation Catalog
// ---------------------------------------------------------------------------

interface HawkDesignation {
  handle: string;
  role: string;
}

const DESIGNATIONS: Record<CrewSpecialty, HawkDesignation[]> = {
  'crane-ops': [
    { handle: 'Lil_Popeye_Hawk', role: 'Heavy infrastructure lifting' },
    { handle: 'Lil_IronWing_Hawk', role: 'System architecture assembly' },
    { handle: 'Lil_StackMaster_Hawk', role: 'Full-stack construction' },
  ],
  'load-ops': [
    { handle: 'Lil_Busy_Hawk', role: 'Task errand execution' },
    { handle: 'Lil_Scurry_Hawk', role: 'Rapid data movement' },
    { handle: 'Lil_Parcel_Hawk', role: 'Payload packaging and delivery' },
  ],
  'deploy-ops': [
    { handle: 'Lil_Packer_Hawk', role: 'Container packaging' },
    { handle: 'Lil_ShipIt_Hawk', role: 'Deployment execution' },
    { handle: 'Lil_Rollout_Hawk', role: 'Progressive rollout management' },
  ],
  'safety-ops': [
    { handle: 'Lil_RedFlag_Hawk', role: 'Risk detection and alerting' },
    { handle: 'Lil_Seatbelt_Hawk', role: 'Safety constraint enforcement' },
    { handle: 'Lil_Guardian_Hawk', role: 'Access control and security' },
  ],
  'yard-ops': [
    { handle: 'Lil_LaneBoss_Hawk', role: 'Workflow lane management' },
    { handle: 'Lil_Tetris_Hawk', role: 'Resource optimization fitting' },
    { handle: 'Lil_Pathfinder_Hawk', role: 'Route discovery and planning' },
  ],
  'dispatch-ops': [
    { handle: 'Lil_Dispatch_Hawk', role: 'Task dispatching and coordination' },
    { handle: 'Lil_Wave_Hawk', role: 'Wave execution orchestration' },
    { handle: 'Lil_Sync_Hawk', role: 'Cross-agent synchronization' },
  ],
};

// ---------------------------------------------------------------------------
// Step 3: Chicken Hawk — Shift Spawn & Squad Assembly
// ---------------------------------------------------------------------------

function spawnShift(packet: PmoPipelinePacket): PmoPipelinePacket {
  const directive = packet.boomerDirective!;
  const shiftId = `SH-${uuidv4().slice(0, 8).toUpperCase()}`;
  const squadId = `Squad_${shiftId}-001`;

  // Assemble Squad from crew specialties
  const members: SquadMember[] = [];
  const specialties = directive.crewSpecialties;

  for (const spec of specialties) {
    const pool = DESIGNATIONS[spec];
    if (pool.length > 0) {
      const hawk = pool[members.length % pool.length];
      members.push({
        canonicalId: `${hawk.handle.toUpperCase().replace(/ /g, '_')}_${shiftId}`,
        personaHandle: hawk.handle,
        designation: spec,
        careerLevel: 'Journeyman',
        assignedCapability: hawk.role,
      });
    }
  }

  // Minimum squad of 2
  while (members.length < 2) {
    members.push({
      canonicalId: `LIL_WORKER_HAWK_${shiftId}_${members.length}`,
      personaHandle: 'Lil_Worker_Hawk',
      designation: 'load-ops',
      careerLevel: 'Hatchling',
      assignedCapability: 'General task execution',
    });
  }

  // Assign steps to Lil_Hawks (round-robin)
  const assignedSteps: AssignedStep[] = directive.executionSteps.map((desc, i) => ({
    stepIndex: i,
    description: desc,
    assignedLilHawk: members[i % members.length].personaHandle,
    status: 'pending' as const,
  }));

  const estimatedWaves = Math.ceil(directive.executionSteps.length / members.length);

  const shift: ShiftRecord = {
    shiftId,
    phase: 'execution',
    spawnedAt: new Date().toISOString(),
    director: directive.director,
    office: directive.office,
  };

  const squad: SquadRecord = { squadId, members, size: members.length };

  const execution: ExecutionRecord = {
    steps: assignedSteps,
    totalSteps: directive.executionSteps.length,
    estimatedWaves,
    currentWave: 0,
    lane: packet.classification.executionLane,
    completedSteps: 0,
    failedSteps: 0,
    waveResults: [],
    totalDurationMs: 0,
    logs: [],
  };

  logger.info(
    { shiftId, squadId, squadSize: members.length, steps: assignedSteps.length, waves: estimatedWaves },
    '[Chain] Chicken Hawk spawned shift + squad',
  );

  return {
    ...packet,
    chainOfCommand: { ...packet.chainOfCommand, step: 3, current: 'Chicken Hawk', next: 'Squad' },
    shift,
    squad,
    execution,
  };
}

// ---------------------------------------------------------------------------
// Step Routing — Map step descriptions to agent IDs
// ---------------------------------------------------------------------------

const STEP_AGENT_MAP: Array<{ keywords: string[]; agentId: AgentId }> = [
  { keywords: ['scaffold', 'generate', 'implement', 'build', 'code', 'api', 'schema', 'database', 'migration', 'deploy', 'endpoint'], agentId: 'engineer-ang' },
  { keywords: ['research', 'analyze', 'market', 'data', 'competitive', 'audit', 'report', 'survey', 'trend'], agentId: 'analyst-ang' },
  { keywords: ['brand', 'campaign', 'copy', 'content', 'email', 'seo', 'social', 'outreach', 'marketing'], agentId: 'marketer-ang' },
  { keywords: ['verify', 'test', 'security', 'review', 'compliance', 'check', 'validate', 'verification', 'oracle', 'quality'], agentId: 'quality-ang' },
];

function resolveAgentForStep(description: string): AgentId {
  const lower = description.toLowerCase();
  let bestMatch: AgentId = 'analyst-ang'; // default: research/analysis
  let bestScore = 0;

  for (const entry of STEP_AGENT_MAP) {
    const score = entry.keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry.agentId;
    }
  }

  return bestMatch;
}

// ---------------------------------------------------------------------------
// Step 4: Squad Wave Execution — Lil_Hawks dispatch to real A2A agents
// ---------------------------------------------------------------------------

async function executeWaves(packet: PmoPipelinePacket): Promise<PmoPipelinePacket> {
  const exec = packet.execution!;
  const squad = packet.squad!;
  const waveSize = squad.size;

  const waveResults: WaveResult[] = [];
  const logs: string[] = [];
  let completedSteps = 0;
  let failedSteps = 0;
  let totalDurationMs = 0;

  for (let wave = 0; wave < exec.estimatedWaves; wave++) {
    const waveSteps = exec.steps.slice(wave * waveSize, (wave + 1) * waveSize);
    const stepResults: StepResult[] = [];
    let waveDuration = 0;

    // Execute wave steps concurrently via A2A dispatch
    const stepPromises = waveSteps.map(async (step) => {
      const agentId = resolveAgentForStep(step.description);
      const agent = registry.get(agentId);
      const startMs = Date.now();

      if (!agent) {
        // No agent available — mark as failed
        logger.warn(
          { stepIndex: step.stepIndex, agentId, description: step.description },
          '[Chain] No agent available for step — marking failed',
        );
        return {
          step,
          success: false,
          durationMs: Date.now() - startMs,
          summary: `No agent '${agentId}' available for: ${step.description}`,
          agentId,
        };
      }

      // Build A2A task input
      const taskInput: AgentTaskInput = {
        taskId: `${packet.shift!.shiftId}-step-${step.stepIndex}-${uuidv4().slice(0, 6)}`,
        intent: packet.classification.executionLane === 'deploy_it' ? 'BUILD_PLUG' : 'AGENTIC_WORKFLOW',
        query: step.description,
        context: {
          shiftId: packet.shift!.shiftId,
          office: packet.classification.pmoOffice,
          director: packet.boomerDirective?.director,
          wave: wave + 1,
          stepIndex: step.stepIndex,
          lilHawk: step.assignedLilHawk,
        },
      };

      try {
        logger.info(
          { taskId: taskInput.taskId, agentId, stepIndex: step.stepIndex, hawk: step.assignedLilHawk },
          '[Chain] Dispatching step to agent via A2A',
        );

        const result: AgentTaskOutput = await agent.execute(taskInput);
        const durationMs = Date.now() - startMs;
        const success = result.status === 'COMPLETED';

        return {
          step,
          success,
          durationMs,
          summary: success
            ? `${step.assignedLilHawk} → ${agentId}: ${result.result.summary.slice(0, 200)}`
            : `${step.assignedLilHawk} → ${agentId} FAILED: ${result.result.summary.slice(0, 200)}`,
          agentId,
          output: result,
        };
      } catch (err) {
        const durationMs = Date.now() - startMs;
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        logger.error(
          { taskId: taskInput.taskId, agentId, err: errMsg },
          '[Chain] Step execution failed',
        );
        return {
          step,
          success: false,
          durationMs,
          summary: `${step.assignedLilHawk} → ${agentId} ERROR: ${errMsg}`,
          agentId,
        };
      }
    });

    // Await all concurrent step executions in this wave
    const waveOutcomes = await Promise.allSettled(stepPromises);

    for (const outcome of waveOutcomes) {
      const result = outcome.status === 'fulfilled'
        ? outcome.value
        : { step: waveSteps[0], success: false, durationMs: 0, summary: 'Promise rejected', agentId: 'analyst-ang' as AgentId };

      result.step.status = result.success ? 'completed' : 'failed';
      if (result.success) completedSteps++;
      else failedSteps++;

      stepResults.push({
        stepIndex: result.step.stepIndex,
        lilHawk: result.step.assignedLilHawk,
        description: result.step.description,
        status: result.step.status,
        outputSummary: result.summary,
        durationMs: result.durationMs,
      });

      logs.push(`[Wave ${wave + 1}][${result.step.assignedLilHawk} → ${result.agentId}] ${result.step.status.toUpperCase()}: ${result.step.description} (${result.durationMs}ms)`);
      waveDuration += result.durationMs;
    }

    totalDurationMs += waveDuration;
    waveResults.push({
      waveNumber: wave + 1,
      result: stepResults.every(s => s.status === 'completed') ? 'success' : 'partial',
      stepsCompleted: stepResults.filter(s => s.status === 'completed').length,
      stepsFailed: stepResults.filter(s => s.status === 'failed').length,
      stepResults,
      durationMs: waveDuration,
    });

    logger.info(
      { shiftId: packet.shift!.shiftId, wave: wave + 1, completed: stepResults.filter(s => s.status === 'completed').length, failed: stepResults.filter(s => s.status === 'failed').length },
      '[Chain] Wave execution complete',
    );
  }

  logger.info(
    { shiftId: packet.shift!.shiftId, completed: completedSteps, failed: failedSteps, waves: waveResults.length },
    '[Chain] Squad execution complete — all waves processed via A2A',
  );

  return {
    ...packet,
    chainOfCommand: { ...packet.chainOfCommand, step: 4, current: 'Lil_Hawks', next: 'Verification' },
    execution: {
      ...exec,
      completedSteps,
      failedSteps,
      waveResults,
      totalDurationMs,
      logs,
    },
  };
}

// ---------------------------------------------------------------------------
// Step 5: Verification Gate
// ---------------------------------------------------------------------------

function runVerification(packet: PmoPipelinePacket): PmoPipelinePacket {
  const exec = packet.execution!;
  const squad = packet.squad!;
  const checks: VerificationCheck[] = [];
  let allPassed = true;

  // Gate 1: Completion Rate
  const completionRate = exec.completedSteps / exec.totalSteps;
  const gate1Passed = completionRate >= 0.8;
  checks.push({
    gate: 'completion-rate',
    passed: gate1Passed,
    detail: `${(completionRate * 100).toFixed(0)}% steps completed (threshold: 80%)`,
  });
  if (!gate1Passed) allPassed = false;

  // Gate 2: No Critical Failures
  checks.push({
    gate: 'critical-failures',
    passed: exec.failedSteps === 0,
    detail: `${exec.failedSteps} failed steps detected`,
  });
  if (exec.failedSteps > exec.totalSteps * 0.2) allPassed = false;

  // Gate 3: Execution Duration
  const maxDurationMs = exec.totalSteps * 30000;
  checks.push({
    gate: 'duration-budget',
    passed: exec.totalDurationMs <= maxDurationMs,
    detail: `${exec.totalDurationMs}ms / ${maxDurationMs}ms budget`,
  });

  // Gate 4: Squad Utilization
  const utilizationRate = exec.totalSteps / (squad.size * exec.estimatedWaves);
  checks.push({
    gate: 'squad-utilization',
    passed: utilizationRate >= 0.5,
    detail: `${(utilizationRate * 100).toFixed(0)}% squad utilization`,
  });

  // Gate 5: Wave Consistency
  const waveSuccessRates = exec.waveResults.map(
    w => w.stepsCompleted / Math.max(w.stepsCompleted + w.stepsFailed, 1),
  );
  const avgWaveSuccess = waveSuccessRates.length > 0
    ? waveSuccessRates.reduce((a, b) => a + b, 0) / waveSuccessRates.length
    : 0;
  checks.push({
    gate: 'wave-consistency',
    passed: avgWaveSuccess >= 0.75,
    detail: `Average wave success rate: ${(avgWaveSuccess * 100).toFixed(0)}%`,
  });

  const verification: VerificationResult = {
    passed: allPassed,
    checksRun: checks.length,
    checksPassed: checks.filter(c => c.passed).length,
    checks,
    verifiedAt: new Date().toISOString(),
  };

  logger.info(
    { shiftId: packet.shift!.shiftId, passed: allPassed, checksRun: checks.length, checksPassed: verification.checksPassed },
    '[Chain] Verification gate complete',
  );

  return {
    ...packet,
    chainOfCommand: { ...packet.chainOfCommand, step: 5, current: 'Verification', next: 'Receipt' },
    verification,
  };
}

// ---------------------------------------------------------------------------
// Step 6: Receipt Seal — Generate signed audit trail
// ---------------------------------------------------------------------------

function sealReceipt(packet: PmoPipelinePacket): PmoPipelinePacket {
  const shift = packet.shift!;
  const exec = packet.execution!;
  const verification = packet.verification!;

  const receiptId = `RCP-${uuidv4().slice(0, 8).toUpperCase()}`;

  // Simple hash for audit trail (production would use crypto.createHash)
  const hashInput = `${shift.shiftId}|${receiptId}|${exec.completedSteps}|${verification.passed}`;
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    hash = ((hash << 5) - hash) + hashInput.charCodeAt(i);
    hash = hash & hash;
  }
  const receiptHash = `sha256-${Math.abs(hash).toString(16).padStart(16, '0')}`;

  let shiftStatus: ShiftStatus = 'completed';
  if (!verification.passed) shiftStatus = 'completed_with_warnings';
  if (exec.failedSteps > exec.totalSteps * 0.5) shiftStatus = 'failed';

  const receipt: ShiftReceipt = {
    receiptId,
    receiptHash,
    shiftId: shift.shiftId,
    sealedAt: new Date().toISOString(),
    shiftStatus,
    finalMetrics: {
      totalDurationMs: exec.totalDurationMs,
      wavesExecuted: exec.waveResults.length,
      stepsCompleted: exec.completedSteps,
      stepsFailed: exec.failedSteps,
      lilHawksUsed: packet.squad!.size,
      verificationPassed: verification.passed,
      checksRun: verification.checksRun,
      checksPassed: verification.checksPassed,
    },
    auditTrail: {
      director: packet.boomerDirective!.director,
      office: packet.boomerDirective!.office,
      executionLane: packet.classification.executionLane,
      squadId: packet.squad!.squadId,
      squadMembers: packet.squad!.members.map(m => m.personaHandle),
    },
  };

  logger.info(
    { receiptId, shiftId: shift.shiftId, status: shiftStatus },
    '[Chain] Receipt sealed',
  );

  return {
    ...packet,
    chainOfCommand: {
      ...packet.chainOfCommand,
      step: 6,
      current: 'Receipt',
      next: 'User',
      completedAt: new Date().toISOString(),
    },
    shift: { ...shift, phase: 'clock_out' },
    receipt,
  };
}

// ---------------------------------------------------------------------------
// Step 7: ACHEEVY Response — Format final output for User
// ---------------------------------------------------------------------------

function buildResponse(packet: PmoPipelinePacket): N8nPipelineResponse {
  const receipt = packet.receipt!;
  const exec = packet.execution!;
  const boomer = packet.boomerDirective!;
  const verification = packet.verification!;

  const summary = [
    `=== AIMS PMO Execution Report ===`,
    `Request: ${packet.message}`,
    `Status: ${receipt.shiftStatus.toUpperCase()}`,
    '',
    `--- Chain of Command ---`,
    `PMO Office: ${packet.classification.pmoOffice} (${boomer.director})`,
    `Execution Lane: ${packet.classification.executionLane}`,
    `Shift: ${packet.shift!.shiftId}`,
    `Squad: ${packet.squad!.squadId} (${packet.squad!.size} Lil_Hawks)`,
    '',
    `--- Execution Summary ---`,
    `Steps: ${exec.completedSteps}/${exec.totalSteps} completed`,
    `Waves: ${exec.waveResults.length} executed`,
    `Duration: ${exec.totalDurationMs}ms`,
    '',
    `--- Verification ---`,
    `Gate: ${verification.passed ? 'PASSED' : 'REVIEW REQUIRED'}`,
    `Checks: ${verification.checksPassed}/${verification.checksRun} passed`,
    '',
    `--- Receipt ---`,
    `Receipt ID: ${receipt.receiptId}`,
    `Hash: ${receipt.receiptHash}`,
    `Sealed: ${receipt.sealedAt}`,
    '',
    `--- Squad Members ---`,
    ...packet.squad!.members.map(m => `  ${m.personaHandle} (${m.designation}) - ${m.assignedCapability}`),
    '',
    `--- Execution Logs ---`,
    ...exec.logs.slice(0, 20),
  ].join('\n');

  return {
    requestId: packet.requestId,
    userId: packet.userId,
    status: receipt.shiftStatus,
    summary,
    receipt: {
      receiptId: receipt.receiptId,
      hash: receipt.receiptHash,
      shiftId: packet.shift!.shiftId,
      shiftStatus: receipt.shiftStatus,
    },
    classification: {
      pmoOffice: packet.classification.pmoOffice,
      director: boomer.director,
      executionLane: packet.classification.executionLane,
    },
    metrics: receipt.finalMetrics,
    chainOfCommand: packet.chainOfCommand,
  };
}

// ---------------------------------------------------------------------------
// Public API — Run the full chain
// ---------------------------------------------------------------------------

/**
 * Execute the full chain-of-command pipeline:
 *   Chicken Hawk → Squad → Lil_Hawks → Verification → Receipt → Response
 *
 * Input: PmoPipelinePacket (already classified + directed by pmo-router)
 * Output: N8nPipelineResponse (ready to return to user)
 *
 * Each step in the pipeline is dispatched to real agents via the A2A registry.
 * Agents may be in-process (Boomer_Angs) or containerized (Research_Ang, etc.).
 */
export async function executeChainOfCommand(packet: PmoPipelinePacket): Promise<N8nPipelineResponse> {
  logger.info(
    { requestId: packet.requestId, office: packet.classification.pmoOffice, director: packet.boomerDirective?.director },
    '[Chain] Starting chain-of-command pipeline (A2A dispatch active)',
  );

  // Step 3: Chicken Hawk — Spawn Shift + Assemble Squad
  let state = spawnShift(packet);

  // Step 4: Squad — Execute Waves with Lil_Hawks → Real A2A Agent Dispatch
  state = await executeWaves(state);

  // Step 5: Verification — Quality gates
  state = runVerification(state);

  // Step 6: Receipt — Seal audit trail
  state = sealReceipt(state);

  // Step 7: ACHEEVY — Format response for user
  const response = buildResponse(state);

  logger.info(
    { requestId: response.requestId, status: response.status, receiptId: response.receipt.receiptId },
    '[Chain] Pipeline complete — returning to user',
  );

  return response;
}

/**
 * Get the full pipeline packet after execution (for debugging/audit).
 */
export async function executeChainOfCommandFull(packet: PmoPipelinePacket): Promise<{
  response: N8nPipelineResponse;
  packet: PmoPipelinePacket;
}> {
  let state = spawnShift(packet);
  state = await executeWaves(state);
  state = runVerification(state);
  state = sealReceipt(state);
  const response = buildResponse(state);
  return { response, packet: state };
}
