/**
 * ACHEEVY Orchestrator — Type Definitions
 */

export interface ConversationContext {
  sessionId: string;
  history: ChatMessage[];
  onboardingComplete: boolean;
  activeGoals: string[];
}

export interface ChatMessage {
  role: 'user' | 'acheevy' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    intent?: string;
    boomerangs_invoked?: string[];
    luc_cost?: number;
  };
}

export interface IntentAnalysis {
  primary_intent: string;
  capabilities_needed: string[];
  execution_strategy: 'parallel' | 'sequential' | 'single';
  confidence: number;
  requires_confirmation: boolean;
}

export interface AcheevyRequest {
  userId: string;
  sessionId: string;
  message: string;
  context?: Partial<ConversationContext>;
}

export interface AcheevyResponse {
  sessionId: string;
  reply: string;
  intent: IntentAnalysis;
  boomerangs_dispatched: DispatchedBoomerAng[];
  luc_debit: {
    tokens_used: number;
    usd_cost: number;
  };
  action_plan?: ActionStep[];
}

export interface DispatchedBoomerAng {
  id: string;
  name: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  result_summary?: string;
}

export interface ActionStep {
  step: number;
  description: string;
  boomerang_id: string | null;
  status: 'pending' | 'in_progress' | 'done';
}

export interface QuotaStatus {
  userId: string;
  tier: 'free' | 'starter' | 'pro' | 'enterprise';
  quotas: Record<string, { used: number; limit: number }>;
  can_execute: boolean;
  blocking_reason?: string;
}
