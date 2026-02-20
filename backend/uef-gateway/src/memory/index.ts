/**
 * AIMS Memory Engine — Main Entry Point
 *
 * Integrates the MemoryStore (persistence) and MemoryRetriever (search)
 * into a single engine that the orchestrator and API routes can use.
 *
 * Provides:
 *  - autoRemember() — called after every execution to store learnings
 *  - autoRecall()   — called before every execution to inject context
 *  - remember()     — manual memory creation
 *  - recall()       — manual memory retrieval
 *  - feedback()     — feedback loop signal
 */

import { getMemoryStore, MemoryStore } from './store';
import { getMemoryRetriever, MemoryRetriever } from './retriever';
import logger from '../logger';
import type {
  MemoryRecord,
  MemoryType,
  RememberInput,
  RecallQuery,
  RecallResult,
  MemoryFeedback,
  MemoryStats,
  ExecutionOutcome,
} from './types';

// Re-export types
export type {
  MemoryRecord,
  MemoryType,
  RememberInput,
  RecallQuery,
  RecallResult,
  MemoryFeedback,
  MemoryStats,
  ExecutionOutcome,
} from './types';

// ── Memory Engine ───────────────────────────────────────────────

export class MemoryEngine {
  private store: MemoryStore;
  private retriever: MemoryRetriever;

  constructor() {
    this.store = getMemoryStore();
    this.retriever = getMemoryRetriever();
  }

  // ── Manual Operations ───────────────────────────────────────

  /** Store a memory explicitly. */
  remember(input: RememberInput): MemoryRecord {
    return this.store.remember(input);
  }

  /** Search memories by query. */
  recall(query: RecallQuery): RecallResult {
    return this.retriever.recall(query);
  }

  /** Apply feedback to a memory. */
  feedback(fb: MemoryFeedback): void {
    this.store.applyFeedback(fb);
  }

  /** Get user memory stats. */
  getStats(userId: string): MemoryStats {
    return this.store.getStats(userId);
  }

  /** List memories for a user. */
  listMemories(userId: string, opts?: { type?: MemoryType; projectId?: string; limit?: number }): MemoryRecord[] {
    return this.store.listForUser(userId, opts);
  }

  /** Delete a memory. */
  deleteMemory(id: string): boolean {
    return this.store.delete(id);
  }

  // ── Auto-Remember (post-execution) ─────────────────────────

  /**
   * Called after every orchestrator execution. Extracts learnings
   * from the outcome and stores them as memories.
   */
  autoRemember(outcome: ExecutionOutcome): void {
    try {
      // 1. Store action pattern (what worked / what failed)
      this.rememberActionPattern(outcome);

      // 2. Store feedback signal
      this.rememberFeedback(outcome);

      // 3. Store project context if project-scoped
      if (outcome.projectId) {
        this.rememberProjectContext(outcome);
      }

      // 4. Store entity references
      this.rememberEntities(outcome);

    } catch (err: any) {
      // Memory failures should never break the main flow
      logger.warn({ err: err.message }, '[Memory] Auto-remember failed (non-fatal)');
    }
  }

  /**
   * Remember the action pattern — what tools/agents were used and whether it worked.
   */
  private rememberActionPattern(outcome: ExecutionOutcome): void {
    if (!outcome.toolsUsed?.length && !outcome.agentsInvolved?.length) return;

    const isSuccess = outcome.status === 'completed';
    const tools = outcome.toolsUsed || [];
    const agents = outcome.agentsInvolved || [];

    const summary = isSuccess
      ? `Successful ${outcome.intent}: used ${[...tools, ...agents].join(', ')}`
      : `Failed ${outcome.intent}: attempted ${[...tools, ...agents].join(', ')}`;

    this.store.remember({
      userId: outcome.userId,
      projectId: outcome.projectId,
      type: 'action_pattern',
      summary,
      content: `Intent: ${outcome.intent}\nMessage: ${outcome.message}\nTools: ${tools.join(', ')}\nAgents: ${agents.join(', ')}\nStatus: ${outcome.status}\nDuration: ${outcome.durationMs || 0}ms\nCost: $${outcome.costUsd || 0}`,
      payload: {
        intent: outcome.intent,
        tools,
        agents,
        status: outcome.status,
        durationMs: outcome.durationMs,
        costUsd: outcome.costUsd,
      },
      tags: [outcome.intent, ...tools, ...agents, outcome.status],
      source: 'auto-remember',
      feedbackSignal: isSuccess ? 1 : -1,
    });
  }

  /**
   * Remember the execution feedback — success or failure signal.
   */
  private rememberFeedback(outcome: ExecutionOutcome): void {
    const isSuccess = outcome.status === 'completed';

    this.store.remember({
      userId: outcome.userId,
      projectId: outcome.projectId,
      type: 'feedback',
      summary: `${isSuccess ? 'Success' : 'Failure'}: ${outcome.intent} — "${truncate(outcome.message, 80)}"`,
      content: `User asked: ${outcome.message}\nResult: ${outcome.status}\nReply: ${truncate(outcome.reply, 200)}`,
      payload: {
        intent: outcome.intent,
        status: outcome.status,
        artifacts: outcome.artifacts,
      },
      tags: [outcome.intent, outcome.status],
      source: 'auto-remember',
      feedbackSignal: isSuccess ? 1 : -1,
      ttlDays: isSuccess ? undefined : 30, // failures expire after 30 days
    });
  }

  /**
   * Remember project-specific context.
   */
  private rememberProjectContext(outcome: ExecutionOutcome): void {
    this.store.remember({
      userId: outcome.userId,
      projectId: outcome.projectId,
      type: 'project_context',
      scope: 'project',
      summary: `Project activity: ${outcome.intent} — "${truncate(outcome.message, 60)}"`,
      content: `Action: ${outcome.intent}\nRequest: ${outcome.message}\nOutcome: ${outcome.status}\nArtifacts: ${(outcome.artifacts || []).join(', ')}`,
      payload: {
        intent: outcome.intent,
        status: outcome.status,
        artifacts: outcome.artifacts,
      },
      tags: [outcome.intent, 'project-activity'],
      source: 'auto-remember',
    });
  }

  /**
   * Extract and remember named entities from the message.
   */
  private rememberEntities(outcome: ExecutionOutcome): void {
    const entities = extractEntities(outcome.message);
    if (entities.length === 0) return;

    for (const entity of entities) {
      this.store.remember({
        userId: outcome.userId,
        projectId: outcome.projectId,
        type: 'entity',
        summary: `Entity: ${entity.name} (${entity.category})`,
        content: `Found in: ${outcome.message}\nContext: ${outcome.intent}`,
        payload: { name: entity.name, category: entity.category },
        tags: [entity.name.toLowerCase(), entity.category],
        source: 'auto-remember',
      });
    }
  }

  // ── Auto-Recall (pre-execution) ────────────────────────────

  /**
   * Called before orchestrator execution. Retrieves relevant memories
   * and returns formatted context for prompt injection.
   */
  autoRecall(
    userId: string,
    message: string,
    opts?: { projectId?: string; maxMemories?: number }
  ): string {
    try {
      return this.retriever.getContextForPrompt(userId, message, {
        projectId: opts?.projectId,
        maxMemories: opts?.maxMemories || 5,
      });
    } catch (err: any) {
      logger.warn({ err: err.message }, '[Memory] Auto-recall failed (non-fatal)');
      return '';
    }
  }

  // ── Maintenance ─────────────────────────────────────────────

  /** Purge expired memories. */
  purgeExpired(): number {
    return this.store.purgeExpired();
  }

  /** Decay relevance for old unused memories. */
  decayRelevance(ageDays?: number): number {
    return this.store.decayRelevance(ageDays);
  }

  /**
   * Store a conversation summary for cross-session persistence.
   */
  rememberConversation(
    userId: string,
    conversationId: string,
    summary: string,
    keyTopics: string[],
    projectId?: string,
  ): MemoryRecord {
    return this.store.remember({
      userId,
      projectId,
      type: 'conversation_summary',
      summary: `Session: ${truncate(summary, 100)}`,
      content: summary,
      payload: { conversationId, keyTopics },
      tags: ['conversation', ...keyTopics],
      source: 'auto-remember',
      ttlDays: 90, // conversation summaries expire after 90 days
    });
  }

  /**
   * Store a user preference.
   */
  rememberPreference(
    userId: string,
    key: string,
    value: string,
    context?: string,
  ): MemoryRecord {
    return this.store.remember({
      userId,
      type: 'preference',
      summary: `Preference: ${key} = ${value}`,
      content: context || `User prefers ${key}: ${value}`,
      payload: { key, value },
      tags: ['preference', key],
      source: 'auto-remember',
    });
  }
}

// ── Entity Extraction ───────────────────────────────────────────

interface ExtractedEntity {
  name: string;
  category: string;
}

/**
 * Simple entity extraction from user messages.
 * Identifies domains, technologies, business concepts.
 */
function extractEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const seen = new Set<string>();

  // Domain patterns
  const domainPatterns: [RegExp, string][] = [
    [/\b(crypto|bitcoin|ethereum|defi|nft|web3|blockchain)\b/gi, 'crypto'],
    [/\b(trading|stocks?|forex|portfolio|investment)\b/gi, 'finance'],
    [/\b(react|vue|angular|next\.?js|node\.?js|python|typescript)\b/gi, 'technology'],
    [/\b(marketing|seo|social media|content|brand)\b/gi, 'marketing'],
    [/\b(ml|machine learning|ai|deep learning|llm|gpt|claude)\b/gi, 'ai'],
    [/\b(saas|startup|mvp|product|launch)\b/gi, 'business'],
    [/\b(email|newsletter|outreach|campaign)\b/gi, 'communication'],
    [/\b(api|database|backend|frontend|deployment|docker)\b/gi, 'engineering'],
  ];

  for (const [pattern, category] of domainPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const key = `${match.toLowerCase()}:${category}`;
        if (!seen.has(key)) {
          seen.add(key);
          entities.push({ name: match, category });
        }
      }
    }
  }

  return entities.slice(0, 5); // cap at 5 entities per message
}

// ── Helpers ─────────────────────────────────────────────────────

function truncate(str: string, maxLen: number): string {
  return str.length <= maxLen ? str : str.slice(0, maxLen - 3) + '...';
}

// ── Singleton ───────────────────────────────────────────────────

let _engine: MemoryEngine | undefined;

export function getMemoryEngine(): MemoryEngine {
  if (!_engine) {
    _engine = new MemoryEngine();
  }
  return _engine;
}
