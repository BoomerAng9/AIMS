/**
 * Lil_Hawks — Ephemeral Shift-Scoped Specialist Agents
 *
 * Unlike BoomerAngs (persistent domain specialists), Lil_Hawks are
 * lightweight, task-scoped workers that operate in squads under
 * Chicken Hawk command.
 *
 * Squads:
 *   WorkflowSmith Squad — n8n workflow integrity
 *   VisionScout Squad  — video/footage assessment
 *   StyleIntake Squad  — card style learning from examples
 */

export type LilHawkId =
  // WorkflowSmith Squad
  | 'lil-workflowsmith-hawk'
  | 'lil-checkmark-hawk'
  | 'lil-redflag-hawk'
  | 'lil-lockstep-hawk'
  // VisionScout Squad
  | 'lil-visionscout-hawk'
  | 'lil-framejudge-hawk'
  | 'lil-whoathere-hawk';

export type SquadId = 'workflow-smith' | 'vision-scout' | 'style-intake';

export interface LilHawkProfile {
  id: LilHawkId;
  name: string;
  squad: SquadId;
  role: string;
  gate: boolean;       // true = this hawk is a gate (can block progression)
}

export interface WorkflowArtifacts {
  workflowJson: Record<string, unknown>;    // n8n export
  manifest: WorkflowManifest;
  testPack: TestPack;
  failureMatrix: FailureCase[];
  versionStamp: VersionStamp;
}

export interface WorkflowManifest {
  workflowId: string;
  name: string;
  description: string;
  inputs: Array<{ name: string; type: string; required: boolean }>;
  outputs: Array<{ name: string; type: string }>;
  dependencies: string[];       // external services needed
  secretsRequired: string[];    // env vars / API keys needed
  estimatedDurationMs: number;
  nodeCount: number;
}

export interface TestPack {
  cases: TestCase[];
  coveragePercent: number;
}

export interface TestCase {
  name: string;
  input: Record<string, unknown>;
  expectedOutput: Record<string, unknown>;
  expectSuccess: boolean;
}

export interface FailureCase {
  scenario: string;
  trigger: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitigation: string;
  handled: boolean;
}

export interface VersionStamp {
  version: string;              // semver
  author: LilHawkId;
  reviewedBy: LilHawkId[];
  timestamp: string;
  changeSummary: string;
  checksum: string;
}
