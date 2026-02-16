/**
 * A.I.M.S. Shelving System — First-Class Data Types
 *
 * Every collection in the backend is a "shelf": a clean schema,
 * an API surface, and clear relationships between the shelves.
 *
 * Chicken Hawk and Lil_Hawks "walk the shelves" — pulling from
 * past Plugs, existing workflows, configuration, research, and code,
 * then assembling new Plugs from those parts.
 *
 * Collections:
 *   projects      — Top-level project records
 *   luc_projects  — LUC pricing & effort oracle records
 *   plugs         — Built artifacts (aiPlugs)
 *   boomer_angs   — Agent roster (Chicken Hawk, Lil_Hawks, directors)
 *   workflows     — Automation definitions (n8n, custom pipelines)
 *   runs          — Execution run records
 *   logs          — Structured log entries
 *   assets        — Files, diagrams, screenshots, configs
 */

// ---------------------------------------------------------------------------
// projects — Top-level project records
// ---------------------------------------------------------------------------

export interface AimsProject {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: 'draft' | 'scoping' | 'estimated' | 'in_progress' | 'review' | 'completed' | 'archived';
  complexity: 'simple' | 'intermediate' | 'complex' | 'enterprise';
  archetype: string;
  tags: string[];
  lucProjectId?: string;
  features: string[];
  integrations: string[];
  branding: {
    primaryColor: string;
    logo?: string;
    domain?: string;
  };
  techStack: {
    frontend?: string;
    backend?: string;
    database?: string;
    hosting?: string;
    models?: string[];
  };
  teamAssignment: {
    primaryBoomerAng?: string;
    chickenHawkAssigned: boolean;
    lilHawks: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// luc_projects — LUC pricing & effort oracle records
// ---------------------------------------------------------------------------

export type LucStatus = 'estimated' | 'approved' | 'in_progress' | 'completed' | 'cancelled';

export type TimeBand = 'INSTANT' | '1H' | '4H' | '1D' | '3D' | '1W' | '2W' | '1M' | 'TBD';

export interface ModelMixEntry {
  modelId: string;
  provider: 'vertex-ai' | 'openrouter' | 'oss-hosted' | 'personaplex';
  estimatedTokens: number;
  pricePerMillionInput: number;
  pricePerMillionOutput: number;
  estimatedCostUsd: number;
}

export interface CostBand {
  low: number;
  mid: number;
  high: number;
  currency: 'USD';
}

export interface LucProject {
  id: string;
  projectId: string;
  userId: string;
  scope: string;
  requirements: string;
  status: LucStatus;
  timeBand: TimeBand;
  estimatedTimeBands: {
    optimistic: TimeBand;
    expected: TimeBand;
    pessimistic: TimeBand;
  };
  modelMix: ModelMixEntry[];
  totalEstimatedTokens: number;
  costBand: CostBand;
  actualTokensUsed: number;
  actualCostUsd: number;
  historicalSimilarity: {
    matchedProjectIds: string[];
    confidenceScore: number;
  };
  linkedRunIds: string[];
  linkedAssetIds: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ---------------------------------------------------------------------------
// plugs — Built artifacts (aiPlugs)
// ---------------------------------------------------------------------------

export interface AimsPlug {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  version: string;
  description: string;
  status: 'building' | 'review' | 'ready' | 'deployed' | 'disabled' | 'archived';
  type: 'webapp' | 'api' | 'automation' | 'integration' | 'template' | 'custom';
  files: Array<{
    path: string;
    description: string;
    size: number;
    type: string;
  }>;
  deploymentId?: string;
  lucProjectId?: string;
  parentPlugId?: string;
  tags: string[];
  metrics: {
    requests: number;
    errors: number;
    uptime: number;
    lastDeployedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// boomer_angs — Agent roster
// ---------------------------------------------------------------------------

export type AgentTier = 'director' | 'executor' | 'specialist' | 'lil_hawk';
export type AgentState = 'idle' | 'busy' | 'offline' | 'spawning' | 'retiring';

export interface BoomerAngRecord {
  id: string;
  agentId: string;
  name: string;
  tier: AgentTier;
  role: string;
  squad?: string;
  capabilities: Array<{
    name: string;
    weight: number;
  }>;
  state: AgentState;
  maxConcurrency: number;
  currentTasks: number;
  specialization?: string;
  parentAgentId?: string;
  spawnedAt: string;
  lastActiveAt: string;
  totalTasksCompleted: number;
  totalTokensUsed: number;
  totalCostUsd: number;
  benchScore: number;
  config: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// workflows — Automation definitions
// ---------------------------------------------------------------------------

export type WorkflowEngine = 'n8n' | 'custom' | 'cloud-functions' | 'hybrid';
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'disabled' | 'archived';

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  agentId?: string;
  toolId?: string;
  config: Record<string, unknown>;
  dependencies: string[];
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
}

export interface AimsWorkflow {
  id: string;
  projectId?: string;
  userId: string;
  name: string;
  description: string;
  engine: WorkflowEngine;
  status: WorkflowStatus;
  trigger: {
    type: 'manual' | 'webhook' | 'schedule' | 'event';
    config: Record<string, unknown>;
  };
  steps: WorkflowStep[];
  externalWorkflowId?: string;
  tags: string[];
  lastRunId?: string;
  totalRuns: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// runs — Execution run records
// ---------------------------------------------------------------------------

export type RunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timed_out';

export interface RunStepResult {
  stepId: string;
  stepName: string;
  agentId?: string;
  status: RunStatus;
  output?: string;
  artifacts: string[];
  tokensUsed: number;
  costUsd: number;
  durationMs: number;
  startedAt: string;
  completedAt?: string;
}

export interface AimsRun {
  id: string;
  projectId?: string;
  workflowId?: string;
  lucProjectId?: string;
  userId: string;
  trigger: string;
  status: RunStatus;
  executorAgentId: string;
  steps: RunStepResult[];
  totalTokensUsed: number;
  totalCostUsd: number;
  totalDurationMs: number;
  artifacts: string[];
  error?: string;
  metadata: Record<string, unknown>;
  startedAt: string;
  completedAt?: string;
}

// ---------------------------------------------------------------------------
// logs — Structured log entries
// ---------------------------------------------------------------------------

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogSource = 'chicken-hawk' | 'lil-hawk' | 'boomer-ang' | 'luc' | 'gateway' | 'workflow' | 'system';

export interface AimsLog {
  id: string;
  runId?: string;
  projectId?: string;
  agentId?: string;
  userId?: string;
  level: LogLevel;
  source: LogSource;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// assets — Files, diagrams, screenshots, configs
// ---------------------------------------------------------------------------

export type AssetType = 'file' | 'image' | 'diagram' | 'screenshot' | 'config' | 'report' | 'code' | 'video' | 'audio';

export interface AimsAsset {
  id: string;
  projectId?: string;
  plugId?: string;
  runId?: string;
  userId: string;
  name: string;
  type: AssetType;
  mimeType: string;
  size: number;
  storageUrl: string;
  storageBucket: string;
  storagePath: string;
  metadata: Record<string, unknown>;
  tags: string[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Shelf metadata — for walking the shelves
// ---------------------------------------------------------------------------

export type ShelfName = 'projects' | 'luc_projects' | 'plugs' | 'boomer_angs' | 'workflows' | 'runs' | 'logs' | 'assets';

export interface ShelfInfo {
  name: ShelfName;
  description: string;
  docCount?: number;
  lastUpdated?: string;
}

export const SHELF_REGISTRY: Record<ShelfName, { description: string; idPrefix: string }> = {
  projects: { description: 'Top-level project records', idPrefix: 'proj' },
  luc_projects: { description: 'LUC pricing and effort oracle records', idPrefix: 'luc' },
  plugs: { description: 'Built artifacts (aiPlugs)', idPrefix: 'plug' },
  boomer_angs: { description: 'Agent roster (Chicken Hawk, Lil_Hawks, directors)', idPrefix: 'ang' },
  workflows: { description: 'Automation definitions and pipelines', idPrefix: 'wf' },
  runs: { description: 'Execution run records with step-level detail', idPrefix: 'run' },
  logs: { description: 'Structured log entries across all services', idPrefix: 'log' },
  assets: { description: 'Files, diagrams, screenshots, configs', idPrefix: 'ast' },
};
