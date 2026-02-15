// frontend/lib/deploy-dock/types.ts

/**
 * Deploy Dock Types
 *
 * Core types for the ACHEEVY-first deployment model.
 * Encodes the delegation hierarchy and proof standards.
 *
 * tool_id: deploy_dock
 * service_key: DEPLOYMENT
 */

// ─────────────────────────────────────────────────────────────
// Agent Hierarchy
// ─────────────────────────────────────────────────────────────

export type AgentType = "acheevy" | "boomer_ang" | "chicken_hawk" | "lil_hawk";
export type AgentStatus = "idle" | "active" | "busy" | "complete" | "error";

export interface AgentCapability {
  id: string;
  name: string;
  category: "code" | "test" | "deploy" | "monitor" | "orchestrate";
  scope: string[];
  lucCost: number;
}

export interface AgentRoster {
  id: string;
  name: string;
  displayName: string;
  type: AgentType;
  role: string;
  status: AgentStatus;
  capabilities: AgentCapability[];
  imageUrl?: string;
  crewAiAgentId?: string; // Link to CrewAI
  lastActivity?: Date;
}

// ─────────────────────────────────────────────────────────────
// Job Packets (Deterministic Task Bundles)
// ─────────────────────────────────────────────────────────────

export type JobStatus = "draft" | "pending" | "approved" | "running" | "complete" | "failed" | "rolled_back";

export interface JobGate {
  id: string;
  name: string;
  type: "approval" | "automated" | "evidence";
  condition: string;
  passed: boolean;
  passedAt?: Date;
  passedBy?: string;
}

export interface JobPacket {
  id: string;
  name: string;
  description: string;
  status: JobStatus;
  assignedTo: string; // Agent ID
  scope: string[];
  gates: JobGate[];
  lucBudget: number;
  lucSpent: number;
  permissions: string[];
  n8nWorkflowId?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  artifacts: ProofArtifact[];
}

// ─────────────────────────────────────────────────────────────
// Proof & Evidence
// ─────────────────────────────────────────────────────────────

export type ProofType = "manifest" | "hash" | "scan" | "attestation" | "artifact" | "log" | "signature";

export interface ProofArtifact {
  id: string;
  type: ProofType;
  label: string;
  value: string;
  hash?: string;
  signedBy?: string;
  timestamp: Date;
  url?: string;
}

export interface EvidenceLocker {
  deploymentId: string;
  artifacts: ProofArtifact[];
  complete: boolean;
  attestationBundle?: string;
}

// ─────────────────────────────────────────────────────────────
// Deployment Events (Glass Box)
// ─────────────────────────────────────────────────────────────

export type DeploymentStage =
  | "ingest"
  | "plan"
  | "quote"
  | "approved"
  | "hatch"
  | "assign"
  | "launch"
  | "verify"
  | "done"
  | "failed";

export interface DeploymentEvent {
  id: string;
  deploymentId: string;
  timestamp: Date;
  stage: DeploymentStage;
  title: string;
  description: string;
  agent: AgentType;
  proof?: ProofArtifact;
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────
// Deployment Session
// ─────────────────────────────────────────────────────────────

export type DeploymentPhase = "idle" | "hatch" | "assign" | "launch" | "verify" | "complete";

export interface DeploymentSession {
  id: string;
  name: string;
  description?: string;
  phase: DeploymentPhase;
  status: "active" | "paused" | "complete" | "failed";
  userId: string;
  roster: AgentRoster[];
  jobPackets: JobPacket[];
  events: DeploymentEvent[];
  evidenceLocker: EvidenceLocker;
  lucBudget: number;
  lucSpent: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// ─────────────────────────────────────────────────────────────
// ACHEEVY Execution Model
// ─────────────────────────────────────────────────────────────

export type ExecutionMode = "inline" | "delegated";

export interface ExecutionDecision {
  mode: ExecutionMode;
  reason: string;
  delegateTo?: AgentType[];
  lucEstimate: number;
  requiresApproval: boolean;
  gates: string[];
}

export interface AcheevyIntent {
  id: string;
  rawInput: string;
  parsedIntent: string;
  category: "deploy" | "explain" | "recommend" | "prove" | "execute";
  execution: ExecutionDecision;
  timestamp: Date;
}

// ─────────────────────────────────────────────────────────────
// n8n Workflow Integration
// ─────────────────────────────────────────────────────────────

export interface N8nWorkflowBinding {
  id: string;
  workflowId: string;
  workflowName: string;
  triggerType: "webhook" | "schedule" | "manual";
  webhookUrl?: string;
  parameters: Record<string, unknown>;
  linkedJobPacketId?: string;
}

export interface N8nExecutionResult {
  executionId: string;
  workflowId: string;
  status: "running" | "success" | "error";
  startedAt: Date;
  finishedAt?: Date;
  data?: Record<string, unknown>;
  error?: string;
}

// ─────────────────────────────────────────────────────────────
// CrewAI Integration
// ─────────────────────────────────────────────────────────────

export interface CrewAiAgent {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  tools: string[];
  llm?: string;
  allowDelegation: boolean;
  maxIterations: number;
}

export interface CrewAiTask {
  id: string;
  description: string;
  expectedOutput: string;
  agentId: string;
  context?: string[];
  asyncExecution: boolean;
}

export interface CrewAiCrew {
  id: string;
  name: string;
  agents: CrewAiAgent[];
  tasks: CrewAiTask[];
  process: "sequential" | "hierarchical";
  managerAgentId?: string;
}

// ─────────────────────────────────────────────────────────────
// LUC Integration
// ─────────────────────────────────────────────────────────────

export interface LucQuote {
  deploymentId: string;
  estimatedTokens: number;
  breakdown: {
    category: string;
    tokens: number;
    description: string;
  }[];
  totalCost: number;
  currency: "LUC";
  validUntil: Date;
  approved: boolean;
  approvedAt?: Date;
  approvedBy?: string;
}

// ─────────────────────────────────────────────────────────────
// API Request/Response Types
// ─────────────────────────────────────────────────────────────

export interface CreateDeploymentRequest {
  name: string;
  description?: string;
  intent: string;
  lucBudget?: number;
}

export interface CreateDeploymentResponse {
  deployment: DeploymentSession;
  quote: LucQuote;
  suggestedRoster: AgentRoster[];
}

export interface HatchAgentRequest {
  deploymentId: string;
  agentId: string;
}

export interface AssignWorkflowRequest {
  deploymentId: string;
  jobPacketId: string;
  workflowId: string;
}

export interface LaunchDeploymentRequest {
  deploymentId: string;
  confirmed: boolean;
}

export interface LaunchDeploymentResponse {
  success: boolean;
  executionId: string;
  events: DeploymentEvent[];
}
