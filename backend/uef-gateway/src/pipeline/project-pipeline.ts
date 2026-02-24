/**
 * Project Build Pipeline — Lifecycle stage tracker
 *
 * Tracks project stages: INTAKE → SCOPE → SCAFFOLD → BUILD → TEST → DEPLOY → LIVE
 * Used by the /projects routes to manage project lifecycle.
 */

import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PipelineStage =
  | 'INTAKE'
  | 'SCOPE'
  | 'SCAFFOLD'
  | 'BUILD'
  | 'TEST'
  | 'DEPLOY'
  | 'LIVE'
  | 'FAILED';

export interface PipelineState {
  id: string;
  projectId: string;
  currentStage: PipelineStage;
  overallStatus: 'running' | 'completed' | 'failed';
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  stageHistory: Array<{ stage: PipelineStage; at: string }>;
}

export interface AdvanceResult {
  stage: PipelineStage;
  status: 'completed' | 'failed';
  nextStage: PipelineStage | null;
}

// ---------------------------------------------------------------------------
// Stage Ordering
// ---------------------------------------------------------------------------

const STAGE_ORDER: PipelineStage[] = [
  'INTAKE',
  'SCOPE',
  'SCAFFOLD',
  'BUILD',
  'TEST',
  'DEPLOY',
  'LIVE',
];

// ---------------------------------------------------------------------------
// In-memory Pipeline Store
// ---------------------------------------------------------------------------

const pipelines = new Map<string, PipelineState>();

// ---------------------------------------------------------------------------
// Pipeline API
// ---------------------------------------------------------------------------

export const pipeline = {
  start(projectId: string): PipelineState {
    const now = new Date().toISOString();
    const state: PipelineState = {
      id: `pipe-${uuidv4().slice(0, 8)}`,
      projectId,
      currentStage: 'INTAKE',
      overallStatus: 'running',
      startedAt: now,
      updatedAt: now,
      stageHistory: [{ stage: 'INTAKE', at: now }],
    };
    pipelines.set(projectId, state);
    return state;
  },

  getState(projectId: string): PipelineState | null {
    return pipelines.get(projectId) ?? null;
  },

  advanceStage(projectId: string): AdvanceResult {
    const state = pipelines.get(projectId);
    if (!state) return { stage: 'FAILED', status: 'failed', nextStage: null };

    const currentIdx = STAGE_ORDER.indexOf(state.currentStage);
    if (currentIdx < 0 || currentIdx >= STAGE_ORDER.length - 1) {
      return { stage: state.currentStage, status: 'completed', nextStage: null };
    }

    const completedStage = state.currentStage;
    const nextStage = STAGE_ORDER[currentIdx + 1];
    const now = new Date().toISOString();

    state.currentStage = nextStage;
    state.updatedAt = now;
    state.stageHistory.push({ stage: nextStage, at: now });

    if (nextStage === 'LIVE') {
      state.overallStatus = 'completed';
      state.completedAt = now;
    }

    return { stage: completedStage, status: 'completed', nextStage };
  },

  listActive(): PipelineState[] {
    return Array.from(pipelines.values()).filter(
      (p) => p.overallStatus === 'running',
    );
  },
};
