/**
 * A.I.M.S. Agent Bridge Protocol Types
 *
 * Defines the WebSocket message format between the frontend and
 * ACHEEVY via the Agent Bridge service running on :3003.
 */

// ─── Message Types ──────────────────────────────
export type BridgeMessageType =
  | 'text'
  | 'generative_block'
  | 'tool_execution'
  | 'approval_request'
  | 'status_update'
  | 'error'
  | 'session_init'
  | 'session_ready'
  | 'heartbeat';

export interface BridgeMessage {
  id: string;
  type: BridgeMessageType;
  timestamp: string;
  sender: 'user' | 'acheevy' | 'system';
  payload: unknown;
}

// ─── Text Message ───────────────────────────────
export interface TextPayload {
  content: string;
  streaming?: boolean;
  done?: boolean;
}

// ─── Generative Blocks ─────────────────────────
export type GenerativeBlockType =
  | 'plug_deploy'
  | 'approval_gate'
  | 'service_health'
  | 'progress_tracker'
  | 'cost_estimate'
  | 'config_form'
  | 'metric_chart'
  | 'file_deliverable'
  | 'sandbox_execution';

export interface GenerativeBlock {
  blockType: GenerativeBlockType;
  blockId: string;
  data: Record<string, unknown>;
  interactive?: boolean;
}

// ─── Tool Execution ─────────────────────────────
export interface ToolExecution {
  toolName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input?: Record<string, unknown>;
  output?: unknown;
  duration?: number;
}

// ─── Approval Request ───────────────────────────
export interface ApprovalRequest {
  requestId: string;
  action: string;
  description: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, unknown>;
  expiresAt?: string;
}

// ─── User Actions ───────────────────────────────
export interface UserAction {
  type: 'approve' | 'reject' | 'form_submit' | 'cancel';
  targetId: string;
  data?: Record<string, unknown>;
}

// ─── Session ────────────────────────────────────
export interface SessionInit {
  userId: string;
  mode: 'owner' | 'customer';
  capabilities?: string[];
}

export interface SessionReady {
  sessionId: string;
  agentVersion: string;
  capabilities: string[];
}

// ─── Status Update ──────────────────────────────
export interface StatusUpdate {
  phase: string;
  message: string;
  progress?: number; // 0-100
}

// ─── Connection State ───────────────────────────
export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

// ─── Chat Message (frontend model) ──────────────
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  blocks?: GenerativeBlock[];
  tools?: ToolExecution[];
  approval?: ApprovalRequest;
  status?: StatusUpdate;
  streaming?: boolean;
}
