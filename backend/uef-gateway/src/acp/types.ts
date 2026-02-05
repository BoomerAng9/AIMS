/**
 * Agentic Communication Protocol (ACP)
 * Core Typed Contracts
 */

export interface ACPStandardizedRequest {
  reqId: string;
  userId: string;
  sessionId: string;
  timestamp: string;
  intent: 'ESTIMATE_ONLY' | 'BUILD_PLUG' | 'RESEARCH' | 'AGENTIC_WORKFLOW' | 'CHAT';
  naturalLanguage: string;
  channel: 'WEB' | 'VOICE' | 'WHATSAPP' | 'TELEGRAM' | 'SLACK' | 'DISCORD' | 'OPENCLAW';
  budget?: {
    maxUsd: number;
    maxTokens: number;
  };
  metadata?: Record<string, any>;
}

export interface ACPAgentTask {
  taskId: string;
  agentId: 'AGENT_ZERO' | 'OPENCLAW' | 'CHICKEN_HAWK';
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

