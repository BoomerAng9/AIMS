/**
 * A2A (Agent-to-Agent) Protocol Types
 *
 * Based on Google's A2A specification. Agents advertise capabilities
 * via Agent Cards, communicate through typed Tasks, and support
 * streaming updates.
 *
 * These types extend (not replace) the existing Agent types in ../agents/types.ts.
 */

// ---------------------------------------------------------------------------
// Agent Card — capability advertisement
// ---------------------------------------------------------------------------

export interface AgentCard {
  /** Unique agent identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Short description of what this agent does */
  description: string;
  /** A2A endpoint URL (e.g., http://research-ang:3020) */
  url: string;
  /** Version of the A2A protocol supported */
  protocolVersion: '1.0';
  /** Agent capabilities */
  capabilities: AgentSkill[];
  /** Supported input modes */
  inputModes: Array<'text' | 'file' | 'data'>;
  /** Supported output modes */
  outputModes: Array<'text' | 'file' | 'data'>;
  /** Authentication requirements */
  authentication?: {
    type: 'none' | 'api-key' | 'bearer';
    headerName?: string;
  };
  /** Whether this agent is hosted in-process or as a container */
  hosting: 'in-process' | 'container' | 'external';
  /** Current availability */
  status: 'online' | 'offline' | 'degraded';
}

export interface AgentSkill {
  /** Skill identifier (e.g., 'code-generation') */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of this capability */
  description: string;
  /** Relevance weight 0-1 (how central this skill is) */
  weight: number;
  /** Tags for discovery (e.g., ['typescript', 'react', 'deploy']) */
  tags: string[];
}

// ---------------------------------------------------------------------------
// A2A Task — the unit of agent-to-agent communication
// ---------------------------------------------------------------------------

export type A2ATaskStatus = 'submitted' | 'working' | 'input-required' | 'completed' | 'failed' | 'canceled';

export interface A2ATask {
  /** Unique task ID */
  id: string;
  /** Agent assigned to this task */
  agentId: string;
  /** Current status */
  status: A2ATaskStatus;
  /** Message history */
  messages: A2AMessage[];
  /** Output artifacts produced by the agent */
  artifacts: A2AArtifact[];
  /** Metadata */
  metadata: {
    createdAt: string;
    updatedAt: string;
    requestedBy: string;
    /** Capability that was matched during routing */
    matchedCapability?: string;
  };
  /** Cost tracking */
  cost?: {
    tokens: number;
    usd: number;
  };
}

export interface A2AMessage {
  role: 'user' | 'agent';
  parts: A2APart[];
  timestamp: string;
}

export type A2APart =
  | { type: 'text'; text: string }
  | { type: 'file'; uri: string; mimeType: string; name?: string }
  | { type: 'data'; data: Record<string, unknown> };

export interface A2AArtifact {
  id: string;
  name: string;
  type: 'text' | 'code' | 'file' | 'data';
  content: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// A2A Task Events (SSE streaming)
// ---------------------------------------------------------------------------

export type A2ATaskEvent =
  | { type: 'status'; status: A2ATaskStatus }
  | { type: 'message'; message: A2AMessage }
  | { type: 'artifact'; artifact: A2AArtifact }
  | { type: 'progress'; progress: { percent: number; message: string } }
  | { type: 'cost'; cost: { tokens: number; usd: number } }
  | { type: 'error'; error: { code: string; message: string } }
  | { type: 'done' };

// ---------------------------------------------------------------------------
// A2A Discovery — request/response types for the API
// ---------------------------------------------------------------------------

export interface A2ATaskSendRequest {
  /** Target agent ID (direct routing) */
  agentId?: string;
  /** Required capability (discovery routing) */
  capability?: string;
  /** Task message */
  message: {
    role: 'user';
    parts: A2APart[];
  };
  /** Who is requesting this task */
  requestedBy: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

export interface A2ATaskSendResponse {
  task: A2ATask;
}
