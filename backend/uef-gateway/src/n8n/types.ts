/**
 * n8n PMO Routing — Type Definitions
 *
 * Types for the chain-of-command pipeline:
 *   User → ACHEEVY → Boomer_Ang → Chicken Hawk → Squad → Lil_Hawks → Receipt → ACHEEVY → User
 *
 * Doctrine: "Activity breeds Activity — shipped beats perfect."
 */

import { PmoId, DirectorId } from '../pmo/types';

// ---------------------------------------------------------------------------
// Chain of Command
// ---------------------------------------------------------------------------

export type ChainStep =
  | 'User'
  | 'ACHEEVY'
  | 'Boomer_Ang'
  | 'Chicken Hawk'
  | 'Squad'
  | 'Lil_Hawks'
  | 'Verification'
  | 'Receipt';

export const CHAIN_OF_COMMAND: ChainStep[] = [
  'User',
  'ACHEEVY',
  'Boomer_Ang',
  'Chicken Hawk',
  'Squad',
  'Lil_Hawks',
  'Verification',
  'Receipt',
];

export interface ChainPosition {
  step: number;
  current: ChainStep;
  next: ChainStep | 'User';
  path: string[];
  startedAt: string;
  completedAt?: string;
}

// ---------------------------------------------------------------------------
// Execution Lanes
// ---------------------------------------------------------------------------

export type ExecutionLane = 'deploy_it' | 'guide_me';

// ---------------------------------------------------------------------------
// ACHEEVY Classification
// ---------------------------------------------------------------------------

export interface PmoClassification {
  pmoOffice: PmoId;
  director: DirectorId;
  departmentalAgent: string;
  matchedKeywords: string[];
  confidence: number;
  executionLane: ExecutionLane;
}

// ---------------------------------------------------------------------------
// Boomer_Ang Directive
// ---------------------------------------------------------------------------

export type CrewSpecialty =
  | 'crane-ops'
  | 'load-ops'
  | 'deploy-ops'
  | 'safety-ops'
  | 'yard-ops'
  | 'dispatch-ops';

export interface BoomerDirective {
  director: DirectorId;
  office: PmoId;
  inScope: boolean;
  authority: string;
  executionSteps: string[];
  crewSpecialties: CrewSpecialty[];
  squadSize: number;
}

// ---------------------------------------------------------------------------
// Shift & Squad
// ---------------------------------------------------------------------------

export interface ShiftRecord {
  shiftId: string;
  phase: 'clock_in' | 'execution' | 'verification' | 'debrief' | 'clock_out';
  spawnedAt: string;
  director: DirectorId;
  office: PmoId;
}

export interface SquadMember {
  canonicalId: string;
  personaHandle: string;
  designation: CrewSpecialty;
  careerLevel: 'Hatchling' | 'Apprentice' | 'Journeyman' | 'Foreman';
  assignedCapability: string;
}

export interface SquadRecord {
  squadId: string;
  members: SquadMember[];
  size: number;
}

// ---------------------------------------------------------------------------
// Step & Wave Execution
// ---------------------------------------------------------------------------

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AssignedStep {
  stepIndex: number;
  description: string;
  assignedLilHawk: string;
  status: StepStatus;
}

export interface StepResult {
  stepIndex: number;
  lilHawk: string;
  description: string;
  status: StepStatus;
  outputSummary: string;
  durationMs: number;
}

export interface WaveResult {
  waveNumber: number;
  result: 'success' | 'partial' | 'failed';
  stepsCompleted: number;
  stepsFailed: number;
  stepResults: StepResult[];
  durationMs: number;
}

export interface ExecutionRecord {
  steps: AssignedStep[];
  totalSteps: number;
  estimatedWaves: number;
  currentWave: number;
  lane: ExecutionLane;
  completedSteps: number;
  failedSteps: number;
  waveResults: WaveResult[];
  totalDurationMs: number;
  logs: string[];
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export interface VerificationCheck {
  gate: string;
  passed: boolean;
  detail: string;
}

export interface VerificationResult {
  passed: boolean;
  checksRun: number;
  checksPassed: number;
  checks: VerificationCheck[];
  verifiedAt: string;
}

// ---------------------------------------------------------------------------
// Receipt (Sealed Audit Trail)
// ---------------------------------------------------------------------------

export type ShiftStatus = 'completed' | 'completed_with_warnings' | 'failed';

export interface ReceiptMetrics {
  totalDurationMs: number;
  wavesExecuted: number;
  stepsCompleted: number;
  stepsFailed: number;
  lilHawksUsed: number;
  verificationPassed: boolean;
  checksRun: number;
  checksPassed: number;
}

export interface ReceiptAuditTrail {
  director: DirectorId;
  office: PmoId;
  executionLane: ExecutionLane;
  squadId: string;
  squadMembers: string[];
}

export interface ShiftReceipt {
  receiptId: string;
  receiptHash: string;
  shiftId: string;
  sealedAt: string;
  shiftStatus: ShiftStatus;
  finalMetrics: ReceiptMetrics;
  auditTrail: ReceiptAuditTrail;
}

// ---------------------------------------------------------------------------
// Full Pipeline Packet (flows through entire chain)
// ---------------------------------------------------------------------------

export interface PmoPipelinePacket {
  requestId: string;
  userId: string;
  message: string;
  timestamp: string;
  classification: PmoClassification;
  chainOfCommand: ChainPosition;
  boomerDirective?: BoomerDirective;
  shift?: ShiftRecord;
  squad?: SquadRecord;
  execution?: ExecutionRecord;
  verification?: VerificationResult;
  receipt?: ShiftReceipt;
}

// ---------------------------------------------------------------------------
// n8n Integration
// ---------------------------------------------------------------------------

export interface N8nTriggerPayload {
  userId: string;
  message: string;
  requestId?: string;
  context?: Record<string, unknown>;
}

export interface N8nPipelineResponse {
  requestId: string;
  userId: string;
  status: ShiftStatus;
  summary: string;
  receipt: {
    receiptId: string;
    hash: string;
    shiftId: string;
    shiftStatus: ShiftStatus;
  };
  classification: {
    pmoOffice: PmoId;
    director: DirectorId;
    executionLane: ExecutionLane;
  };
  metrics: ReceiptMetrics;
  chainOfCommand: ChainPosition;
}
