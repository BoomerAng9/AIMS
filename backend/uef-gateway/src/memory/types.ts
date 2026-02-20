/**
 * AIMS Memory System — Type Definitions
 *
 * Persistent agent memory enabling:
 *  1. Repetitive efficient actions — remember what worked (tool combos, prompt patterns, agent configs)
 *  2. Learn from past actions — success/failure signals feed back into future routing decisions
 *  3. Cross-session persistence — user returns tomorrow, ACHEEVY remembers projects, preferences, progress
 *  4. Semantic retrieval — "find that thing I was working on about crypto trading" works
 */

// ── Memory Entry Types ──────────────────────────────────────────

export type MemoryType =
  | 'action_pattern'       // Tool combos / prompt patterns that worked
  | 'feedback'             // Success/failure signals from past executions
  | 'preference'           // User preferences (communication style, domains, tools)
  | 'project_context'      // Project state, progress, artifacts
  | 'conversation_summary' // Compressed conversation context
  | 'agent_config'         // Effective agent configurations that performed well
  | 'skill_outcome'        // Skill execution results and learnings
  | 'entity'               // Named entities (people, companies, topics the user cares about)
  ;

export type MemoryScope =
  | 'user'                 // Scoped to a specific user
  | 'project'              // Scoped to a specific project
  | 'global'               // Platform-wide learnings
  ;

// ── Core Memory Record ──────────────────────────────────────────

export interface MemoryRecord {
  id: string;

  /** Who this memory belongs to */
  userId: string;

  /** Optional project scope */
  projectId?: string;

  /** Memory classification */
  type: MemoryType;

  /** Visibility scope */
  scope: MemoryScope;

  /** Human-readable summary of what was remembered */
  summary: string;

  /** Searchable content — the full detail used for semantic retrieval */
  content: string;

  /** Structured data payload (tool configs, agent params, etc.) */
  payload: Record<string, unknown>;

  /** Tags for fast filtering */
  tags: string[];

  /** Relevance score: boosted by successful reuse, decayed over time */
  relevanceScore: number;

  /** How many times this memory has been recalled and used */
  useCount: number;

  /** Signal: positive = worked well, negative = caused issues */
  feedbackSignal: number;

  /** Source that created this memory */
  source: string;

  /** Optional expiry (ISO string). null = never expires */
  expiresAt: string | null;

  /** Timestamps */
  createdAt: string;
  updatedAt: string;
  lastRecalledAt: string | null;
}

// ── Memory Operations ───────────────────────────────────────────

export interface RememberInput {
  userId: string;
  projectId?: string;
  type: MemoryType;
  scope?: MemoryScope;
  summary: string;
  content: string;
  payload?: Record<string, unknown>;
  tags?: string[];
  source?: string;
  feedbackSignal?: number;
  ttlDays?: number;
}

export interface RecallQuery {
  userId: string;
  projectId?: string;
  query: string;
  types?: MemoryType[];
  tags?: string[];
  limit?: number;
  minRelevance?: number;
  scope?: MemoryScope;
}

export interface RecallResult {
  memories: ScoredMemory[];
  query: string;
  totalMatched: number;
  retrievalTimeMs: number;
}

export interface ScoredMemory {
  memory: MemoryRecord;
  matchScore: number;
  matchReason: string;
}

// ── Feedback Loop ───────────────────────────────────────────────

export interface MemoryFeedback {
  memoryId: string;
  signal: 'positive' | 'negative' | 'neutral';
  context?: string;
}

// ── Auto-Remember Triggers ──────────────────────────────────────

export interface ExecutionOutcome {
  userId: string;
  projectId?: string;
  intent: string;
  message: string;
  status: 'completed' | 'failed' | 'queued' | 'dispatched';
  reply: string;
  toolsUsed?: string[];
  agentsInvolved?: string[];
  durationMs?: number;
  costUsd?: number;
  artifacts?: string[];
}

// ── Memory Stats ────────────────────────────────────────────────

export interface MemoryStats {
  userId: string;
  totalMemories: number;
  byType: Record<MemoryType, number>;
  byScope: Record<MemoryScope, number>;
  oldestMemory: string | null;
  newestMemory: string | null;
  totalRecalls: number;
  avgRelevanceScore: number;
}
