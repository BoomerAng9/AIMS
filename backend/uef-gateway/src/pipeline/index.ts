/**
 * Execution Pipeline Orchestrator
 *
 * Manages the full lifecycle of building a Plug, from intake through
 * deployment. Each project travels sequentially through six stages:
 *   INTAKE -> SCOPE -> BUILD -> REVIEW -> DEPLOY -> LIVE
 *
 * Agents are assigned per-stage following the canonical delegation chain:
 *   Analyst_Ang -> Engineer_Ang -> Engineer_Ang -> Quality_Ang -> Chicken Hawk -> (complete)
 *
 * Storage is in-memory (Map). A persistence adapter can be swapped in later.
 */

import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PipelineStage = 'INTAKE' | 'SCOPE' | 'BUILD' | 'REVIEW' | 'DEPLOY' | 'LIVE';
export type PipelineStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';

export interface StageState {
  status: PipelineStatus;
  startedAt?: string;
  completedAt?: string;
  assignedAgent?: string;
  output?: string;
  error?: string;
}

export interface PipelineState {
  projectId: string;
  currentStage: PipelineStage;
  stageStatus: Record<PipelineStage, StageState>;
  overallStatus: PipelineStatus;
  startedAt: string;
  completedAt?: string;
}

export interface StageResult {
  stage: PipelineStage;
  status: 'completed' | 'failed';
  output: string;
  artifacts?: string[];
  nextStage?: PipelineStage;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Ordered sequence of pipeline stages. */
const STAGE_ORDER: PipelineStage[] = ['INTAKE', 'SCOPE', 'BUILD', 'REVIEW', 'DEPLOY', 'LIVE'];

/** Canonical agent assignment per stage. */
const STAGE_AGENT: Record<PipelineStage, string> = {
  INTAKE: 'Analyst_Ang',
  SCOPE: 'Engineer_Ang',
  BUILD: 'Engineer_Ang',
  REVIEW: 'Quality_Ang',
  DEPLOY: 'Chicken Hawk',
  LIVE: 'System',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString();
}

function nextStage(current: PipelineStage): PipelineStage | undefined {
  const idx = STAGE_ORDER.indexOf(current);
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : undefined;
}

function emptyStageStatus(): Record<PipelineStage, StageState> {
  const record = {} as Record<PipelineStage, StageState>;
  for (const stage of STAGE_ORDER) {
    record[stage] = { status: 'pending' };
  }
  return record;
}

// ---------------------------------------------------------------------------
// Pipeline class
// ---------------------------------------------------------------------------

export class ExecutionPipeline {
  private projects = new Map<string, PipelineState>();

  // -----------------------------------------------------------------------
  // start
  // -----------------------------------------------------------------------

  /**
   * Initialize a new pipeline for `projectId`. All stages begin as pending and
   * INTAKE is immediately set to running.
   */
  start(projectId: string): PipelineState {
    if (this.projects.has(projectId)) {
      logger.warn({ projectId }, '[Pipeline] Project already has an active pipeline — returning existing state');
      return this.projects.get(projectId)!;
    }

    const timestamp = now();
    const state: PipelineState = {
      projectId,
      currentStage: 'INTAKE',
      stageStatus: emptyStageStatus(),
      overallStatus: 'running',
      startedAt: timestamp,
    };

    // Kick off INTAKE
    state.stageStatus.INTAKE = {
      status: 'running',
      startedAt: timestamp,
      assignedAgent: STAGE_AGENT.INTAKE,
    };

    this.projects.set(projectId, state);

    logger.info(
      { projectId, stage: 'INTAKE', agent: STAGE_AGENT.INTAKE },
      '[Pipeline] Pipeline started — INTAKE running',
    );

    return state;
  }

  // -----------------------------------------------------------------------
  // advanceStage
  // -----------------------------------------------------------------------

  /**
   * Complete the current stage and transition to the next one.
   * Returns a `StageResult` describing what happened.
   */
  advanceStage(projectId: string): StageResult {
    const state = this.projects.get(projectId);

    if (!state) {
      logger.error({ projectId }, '[Pipeline] advanceStage called for unknown project');
      return {
        stage: 'INTAKE',
        status: 'failed',
        output: `No pipeline found for project "${projectId}".`,
      };
    }

    if (state.overallStatus === 'paused') {
      logger.warn({ projectId }, '[Pipeline] Cannot advance — pipeline is paused');
      return {
        stage: state.currentStage,
        status: 'failed',
        output: 'Pipeline is paused. Call resume() first.',
      };
    }

    if (state.overallStatus === 'failed') {
      logger.warn({ projectId }, '[Pipeline] Cannot advance — pipeline has failed');
      return {
        stage: state.currentStage,
        status: 'failed',
        output: 'Pipeline has failed. Resolve the failure before advancing.',
      };
    }

    if (state.overallStatus === 'completed') {
      logger.warn({ projectId }, '[Pipeline] Pipeline already completed');
      return {
        stage: 'LIVE',
        status: 'completed',
        output: 'Pipeline already completed.',
      };
    }

    const current = state.currentStage;
    const result = this.executeStage(state, current);

    if (result.status === 'failed') {
      this.fail(projectId, current, result.output);
      return result;
    }

    // Mark current stage completed
    const timestamp = now();
    state.stageStatus[current].status = 'completed';
    state.stageStatus[current].completedAt = timestamp;
    state.stageStatus[current].output = result.output;

    logger.info(
      { projectId, stage: current, agent: state.stageStatus[current].assignedAgent },
      `[Pipeline] Stage ${current} completed`,
    );

    // Transition to next stage
    const next = nextStage(current);
    if (next) {
      state.currentStage = next;
      state.stageStatus[next] = {
        status: 'running',
        startedAt: timestamp,
        assignedAgent: STAGE_AGENT[next],
      };
      result.nextStage = next;

      logger.info(
        { projectId, stage: next, agent: STAGE_AGENT[next] },
        `[Pipeline] Stage ${next} started`,
      );
    } else {
      // LIVE was the last stage
      state.overallStatus = 'completed';
      state.completedAt = timestamp;

      logger.info({ projectId }, '[Pipeline] Pipeline completed — Plug is LIVE');
    }

    return result;
  }

  // -----------------------------------------------------------------------
  // getState / listActive
  // -----------------------------------------------------------------------

  getState(projectId: string): PipelineState | undefined {
    return this.projects.get(projectId);
  }

  listActive(): PipelineState[] {
    return Array.from(this.projects.values()).filter(
      (s) => s.overallStatus === 'running' || s.overallStatus === 'paused',
    );
  }

  // -----------------------------------------------------------------------
  // pause / resume
  // -----------------------------------------------------------------------

  pause(projectId: string): void {
    const state = this.projects.get(projectId);
    if (!state) {
      logger.warn({ projectId }, '[Pipeline] pause — project not found');
      return;
    }
    if (state.overallStatus !== 'running') {
      logger.warn({ projectId, status: state.overallStatus }, '[Pipeline] Cannot pause — not running');
      return;
    }

    state.overallStatus = 'paused';
    state.stageStatus[state.currentStage].status = 'paused';
    logger.info({ projectId, stage: state.currentStage }, '[Pipeline] Pipeline paused');
  }

  resume(projectId: string): void {
    const state = this.projects.get(projectId);
    if (!state) {
      logger.warn({ projectId }, '[Pipeline] resume — project not found');
      return;
    }
    if (state.overallStatus !== 'paused') {
      logger.warn({ projectId, status: state.overallStatus }, '[Pipeline] Cannot resume — not paused');
      return;
    }

    state.overallStatus = 'running';
    state.stageStatus[state.currentStage].status = 'running';
    logger.info({ projectId, stage: state.currentStage }, '[Pipeline] Pipeline resumed');
  }

  // -----------------------------------------------------------------------
  // fail
  // -----------------------------------------------------------------------

  fail(projectId: string, stage: PipelineStage, error: string): void {
    const state = this.projects.get(projectId);
    if (!state) {
      logger.warn({ projectId }, '[Pipeline] fail — project not found');
      return;
    }

    state.overallStatus = 'failed';
    state.stageStatus[stage].status = 'failed';
    state.stageStatus[stage].error = error;
    state.stageStatus[stage].completedAt = now();

    logger.error({ projectId, stage, error }, '[Pipeline] Stage failed');
  }

  // -----------------------------------------------------------------------
  // Private — per-stage execution logic
  // -----------------------------------------------------------------------

  /**
   * Simulates stage-specific work. In production each case would invoke real
   * subsystems (scaffolder, ORACLE gates, deployer, etc.).
   */
  private executeStage(state: PipelineState, stage: PipelineStage): StageResult {
    switch (stage) {
      case 'INTAKE': {
        // Validate project specification exists
        if (!state.projectId || state.projectId.trim().length === 0) {
          return {
            stage,
            status: 'failed',
            output: 'Project spec is missing — cannot proceed with intake.',
          };
        }
        return {
          stage,
          status: 'completed',
          output: `Intake validated for project "${state.projectId}". Analyst_Ang confirmed spec is complete.`,
          artifacts: [`spec-${state.projectId}.json`],
        };
      }

      case 'SCOPE': {
        // Generate architecture plan
        return {
          stage,
          status: 'completed',
          output: `Architecture plan generated by Engineer_Ang. Tech stack selected, component map produced.`,
          artifacts: [`arch-plan-${state.projectId}.md`, `component-map-${state.projectId}.json`],
        };
      }

      case 'BUILD': {
        // Run scaffolder and generate files
        return {
          stage,
          status: 'completed',
          output: `Scaffolder executed by Engineer_Ang. Project files generated and assembled.`,
          artifacts: [
            `src-${state.projectId}.tar.gz`,
            `Dockerfile`,
            `docker-compose.yml`,
          ],
        };
      }

      case 'REVIEW': {
        // Run quality checks via ORACLE methodology
        return {
          stage,
          status: 'completed',
          output: `Quality_Ang completed ORACLE 7-gate review. All gates passed — score 100/100.`,
          artifacts: [`oracle-report-${state.projectId}.json`],
        };
      }

      case 'DEPLOY': {
        // Trigger deployment through Chicken Hawk
        return {
          stage,
          status: 'completed',
          output: `Chicken Hawk triggered deployment. Container provisioned and health-checked.`,
          artifacts: [`deployment-manifest-${state.projectId}.yml`],
        };
      }

      case 'LIVE': {
        // Mark as complete — Plug is live
        return {
          stage,
          status: 'completed',
          output: `Plug "${state.projectId}" is now LIVE. Monitoring active.`,
        };
      }

      default: {
        return {
          stage,
          status: 'failed',
          output: `Unknown stage "${stage}".`,
        };
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const pipeline = new ExecutionPipeline();
