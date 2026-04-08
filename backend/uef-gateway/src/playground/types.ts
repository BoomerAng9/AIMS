/**
 * Playground/Sandbox System — Types
 *
 * Provides isolated execution environments for:
 *   - Code execution (E2B sandboxes)
 *   - AI model testing (prompt playground)
 *   - Education (student assignments, teacher grading)
 *   - Training data annotation (Outlier-style contracts)
 *   - Agent testing (Lil_Hawk sandbox runs)
 *
 * Competes with: Manus VM viewport, GenSpark AI Developer,
 * Outlier training platform, Replit/CodeSandbox
 */

// ── Playground Types ──────────────────────────────────────────

export type PlaygroundType =
  | 'code'        // Code execution sandbox (E2B)
  | 'prompt'      // LLM prompt testing
  | 'agent'       // Agent testing (Custom Lil_Hawks in sandbox)
  | 'training'    // Training data annotation/evaluation
  | 'education';  // Student workspace

export type PlaygroundStatus =
  | 'creating'
  | 'ready'
  | 'running'
  | 'paused'
  | 'completed'
  | 'expired'
  | 'error';

export type PlaygroundLanguage =
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'bash'
  | 'go'
  | 'rust';

// ── Playground Session ────────────────────────────────────────

export interface PlaygroundSession {
  sessionId: string;
  userId: string;
  type: PlaygroundType;
  status: PlaygroundStatus;

  /** Display name for the session */
  name: string;

  /** Configuration specific to playground type */
  config: PlaygroundConfig;

  /** Execution history within this session */
  executions: PlaygroundExecution[];

  /** Files in the playground workspace */
  files: PlaygroundFile[];

  /** Time limits */
  maxDurationMinutes: number;
  expiresAt: string;

  /** Cost tracking */
  cost: {
    totalTokens: number;
    totalComputeSeconds: number;
    totalUsd: number;
  };

  createdAt: string;
  updatedAt: string;
}

// ── Config per Playground Type ─────────────────────────────────

export type PlaygroundConfig =
  | CodePlaygroundConfig
  | PromptPlaygroundConfig
  | AgentPlaygroundConfig
  | TrainingPlaygroundConfig
  | EducationPlaygroundConfig;

export interface CodePlaygroundConfig {
  type: 'code';
  language: PlaygroundLanguage;
  /** Pre-installed packages */
  packages: string[];
  /** Whether internet access is allowed */
  networkEnabled: boolean;
  /** Max execution time per run in seconds */
  maxExecutionSeconds: number;
  /** Memory limit in MB */
  memoryLimitMb: number;
}

export interface PromptPlaygroundConfig {
  type: 'prompt';
  /** Models to test against (multi-model comparison) */
  models: string[];
  /** Temperature range for testing */
  temperatureRange: [number, number];
  /** System prompt to test */
  systemPrompt: string;
  /** Whether to show token counts and costs */
  showMetrics: boolean;
}

export interface AgentPlaygroundConfig {
  type: 'agent';
  /** Custom Lil_Hawk ID to test */
  hawkId: string;
  /** Tools enabled in sandbox (subset of hawk's tools) */
  enabledTools: string[];
  /** Whether to log all internal reasoning */
  verboseLogging: boolean;
  /** Max turns before auto-stop */
  maxTurns: number;
}

export interface TrainingPlaygroundConfig {
  type: 'training';
  /** Training task type */
  taskType: 'annotation' | 'evaluation' | 'comparison' | 'generation';
  /** Dataset to work with */
  datasetId: string;
  /** Instructions for the annotator */
  instructions: string;
  /** Labels/categories for annotation */
  labels: string[];
  /** Quality threshold for auto-acceptance */
  qualityThreshold: number;
}

export interface EducationPlaygroundConfig {
  type: 'education';
  /** Subject area */
  subject: string;
  /** Difficulty level */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Whether an AI tutor is available */
  tutorEnabled: boolean;
  /** Assignment description (if any) */
  assignment?: string;
  /** Grading rubric */
  rubric?: string[];
}

// ── Execution Record ──────────────────────────────────────────

export interface PlaygroundExecution {
  executionId: string;
  /** What was executed (code, prompt, or agent action) */
  input: string;
  /** The output/result */
  output: string;
  /** Status of this specific execution */
  status: 'success' | 'error' | 'timeout';
  /** Execution duration in ms */
  durationMs: number;
  /** Token usage (for LLM executions) */
  tokens?: { input: number; output: number };
  /** Cost of this execution */
  costUsd: number;
  timestamp: string;
}

// ── Workspace Files ───────────────────────────────────────────

export interface PlaygroundFile {
  path: string;
  content: string;
  language: string;
  sizeBytes: number;
  lastModified: string;
}

// ── API Types ─────────────────────────────────────────────────

export interface CreatePlaygroundRequest {
  userId: string;
  type: PlaygroundType;
  name: string;
  config: PlaygroundConfig;
  maxDurationMinutes?: number;
}

export interface ExecuteInPlaygroundRequest {
  sessionId: string;
  userId: string;
  input: string;
  /** For code: the file to execute. For prompt: the model to use. */
  target?: string;
}

export interface PlaygroundResponse {
  success: boolean;
  session?: PlaygroundSession;
  error?: string;
}
