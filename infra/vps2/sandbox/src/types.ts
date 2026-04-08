/**
 * A.I.M.S. OpenSandbox — Type Definitions
 * Secure code execution engine for VPS2
 */

// ── Execution Types ──────────────────────────────────────────

export type SandboxLanguage = 'python' | 'javascript' | 'typescript' | 'bash' | 'go' | 'rust';

export type ExecutionStatus = 'queued' | 'pulling' | 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';

export interface ExecutionRequest {
  /** Code or command to execute */
  code: string;
  /** Language / runtime */
  language: SandboxLanguage;
  /** Optional stdin input */
  stdin?: string;
  /** Environment variables to inject */
  env?: Record<string, string>;
  /** Max execution time in seconds (default: 30, max: 300) */
  timeoutSeconds?: number;
  /** Memory limit in MB (default: 256, max: 512) */
  memoryLimitMb?: number;
  /** Whether to allow network access (default: false) */
  networkEnabled?: boolean;
  /** Optional session ID to execute within a persistent sandbox */
  sessionId?: string;
  /** User/caller identifier */
  userId?: string;
}

export interface Execution {
  id: string;
  status: ExecutionStatus;
  language: SandboxLanguage;
  code: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  /** Wall-clock duration in milliseconds */
  durationMs: number | null;
  /** Docker container ID (while running) */
  containerId: string | null;
  /** Session this execution belongs to (if any) */
  sessionId: string | null;
  /** Resource usage */
  peakMemoryMb: number | null;
  createdAt: string;
  completedAt: string | null;
  /** Timeout setting used */
  timeoutSeconds: number;
  /** Error detail (if failed) */
  error: string | null;
}

// ── Session Types ────────────────────────────────────────────

export type SessionStatus = 'creating' | 'ready' | 'busy' | 'paused' | 'expired' | 'destroyed';

export interface SessionRequest {
  /** Language/runtime for the persistent sandbox */
  language: SandboxLanguage;
  /** Display name */
  name?: string;
  /** Pre-installed packages (npm/pip) */
  packages?: string[];
  /** Files to pre-load */
  files?: Array<{ path: string; content: string }>;
  /** TTL in minutes (default: 60, max: 480) */
  ttlMinutes?: number;
  /** Memory limit in MB (default: 512) */
  memoryLimitMb?: number;
  /** Whether to allow network access */
  networkEnabled?: boolean;
  /** User identifier */
  userId?: string;
}

export interface Session {
  id: string;
  status: SessionStatus;
  language: SandboxLanguage;
  name: string;
  containerId: string | null;
  /** Number of executions run in this session */
  executionCount: number;
  /** Files in the sandbox workspace */
  files: string[];
  /** Packages installed */
  packages: string[];
  ttlMinutes: number;
  expiresAt: string;
  memoryLimitMb: number;
  networkEnabled: boolean;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Runtime Image Map ────────────────────────────────────────

export const LANGUAGE_IMAGES: Record<SandboxLanguage, string> = {
  python: 'python:3.12-alpine',
  javascript: 'node:20-alpine',
  typescript: 'node:20-alpine',
  bash: 'alpine:3.19',
  go: 'golang:1.22-alpine',
  rust: 'rust:1.77-alpine',
};

/**
 * Command to execute code in each language.
 * `{FILE}` is replaced with the temp file path inside the container.
 */
export const LANGUAGE_COMMANDS: Record<SandboxLanguage, { ext: string; cmd: string[] }> = {
  python: { ext: 'py', cmd: ['python', '{FILE}'] },
  javascript: { ext: 'js', cmd: ['node', '{FILE}'] },
  typescript: { ext: 'ts', cmd: ['npx', '--yes', 'tsx', '{FILE}'] },
  bash: { ext: 'sh', cmd: ['sh', '{FILE}'] },
  go: { ext: 'go', cmd: ['go', 'run', '{FILE}'] },
  rust: { ext: 'rs', cmd: ['sh', '-c', 'rustc {FILE} -o /tmp/out && /tmp/out'] },
};

// ── Stats ────────────────────────────────────────────────────

export interface SandboxStats {
  totalExecutions: number;
  activeExecutions: number;
  activeSessions: number;
  executionsByLanguage: Record<string, number>;
  executionsByStatus: Record<string, number>;
  avgDurationMs: number;
  uptime: number;
}
