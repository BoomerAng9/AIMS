/**
 * Agentic Communication Protocol (ACP) v2
 * Core Typed Contracts
 *
 * v2 additions:
 *   - ACPStreamEvent for SSE streaming
 *   - ACPErrorResponse with typed error codes
 *   - ACPAgentCapability for negotiation
 *   - ACPRequestContext for carry-forward context
 */

// ---------------------------------------------------------------------------
// ACP v1 (preserved, backward-compatible)
// ---------------------------------------------------------------------------

export type ACPIntent = 'ESTIMATE_ONLY' | 'BUILD_PLUG' | 'RESEARCH' | 'AGENTIC_WORKFLOW' | 'CHAT';
export type ACPChannel = 'WEB' | 'VOICE' | 'WHATSAPP' | 'TELEGRAM' | 'SLACK' | 'DISCORD';

export interface ACPStandardizedRequest {
  reqId: string;
  userId: string;
  sessionId: string;
  timestamp: string;
  intent: ACPIntent;
  naturalLanguage: string;
  channel: ACPChannel;
  budget?: {
    maxUsd: number;
    maxTokens: number;
  };
  metadata?: Record<string, any>;
  /** v2: Carry-forward context from previous requests */
  context?: ACPRequestContext;
}

export interface ACPAgentTask {
  taskId: string;
  agentId: 'AGENT_ZERO' | 'CHICKEN_HAWK';
  spec: {
    description: string;
    requirements: string[];
  };
  complexity: number; // 0-100
  dependencies?: string[];
}

export interface ACPAgentResult {
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  artifacts?: {
    files?: string[];
    summary?: string;
  };
  logs: string[];
  cost?: {
    tokens: number;
    usd: number;
  };
  auditRefs?: string[]; // IDs in KYB flight recorder
}

export interface ACPResponse {
  reqId: string;
  status: 'SUCCESS' | 'ERROR' | 'ORACLE_FAILED';
  message?: string;
  quote?: any; // To be refined with UCP type
  taskId?: string;
  executionPlan?: {
    steps: string[];
    estimatedDuration: string;
  };
  oracle?: {
    passed: boolean;
    score: number;
    gates: Array<{
      name: string;
      passed: boolean;
      score: number;
      message: string;
    }>;
    failures: string[];
  };
}

// ---------------------------------------------------------------------------
// ACP v2 — Streaming Events
// ---------------------------------------------------------------------------

export type ACPStreamEventType =
  | 'quote'
  | 'oracle'
  | 'agent_start'
  | 'agent_progress'
  | 'agent_complete'
  | 'settlement'
  | 'error'
  | 'done';

export interface ACPStreamEvent {
  type: ACPStreamEventType;
  reqId: string;
  timestamp: string;
  data: unknown;
}

// ---------------------------------------------------------------------------
// ACP v2 — Error Codes
// ---------------------------------------------------------------------------

export type ACPErrorCode =
  | 'ORACLE_FAILED'
  | 'BUDGET_EXCEEDED'
  | 'AGENT_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'INVALID_REQUEST'
  | 'INTERNAL_ERROR'
  | 'TIMEOUT';

export interface ACPErrorResponse {
  reqId: string;
  status: 'ERROR';
  error: {
    code: ACPErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ---------------------------------------------------------------------------
// ACP v2 — Agent Capability Negotiation
// ---------------------------------------------------------------------------

export interface ACPAgentCapability {
  agentId: string;
  capabilities: string[];
  inputModes: string[];
  outputModes: string[];
  maxConcurrency: number;
  currentLoad: number;
}

// ---------------------------------------------------------------------------
// ACP v2 — Request Context (carry-forward between requests)
// ---------------------------------------------------------------------------

export interface ACPRequestContext {
  /** Previous request IDs in this conversation */
  previousReqIds?: string[];
  /** Conversation state from previous interactions */
  conversationState?: Record<string, unknown>;
  /** Agent preferences (e.g., "prefer research-ang for this task") */
  agentPreferences?: Record<string, string>;
}
