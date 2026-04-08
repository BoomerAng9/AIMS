/**
 * AIMS Memory Retriever — Semantic Search Engine
 *
 * Implements keyword-based semantic retrieval with TF-IDF-like scoring.
 * No external vector DB needed — uses SQLite full-text search + in-memory
 * scoring to find relevant memories by meaning.
 *
 * Scoring factors:
 *  1. Keyword match density (how many query terms hit)
 *  2. Field weight (summary > tags > content)
 *  3. Relevance score (accumulated from feedback + usage)
 *  4. Recency bias (newer memories score higher, unless old ones are very relevant)
 *  5. Feedback signal (positive feedback boosts, negative suppresses)
 */

import { getMemoryStore } from './store';
import logger from '../logger';
import type {
  MemoryRecord,
  MemoryType,
  RecallQuery,
  RecallResult,
  ScoredMemory,
} from './types';

// ── Scoring Weights ─────────────────────────────────────────────

const WEIGHTS = {
  summaryMatch: 3.0,     // Match in summary is most valuable
  tagMatch: 2.5,         // Tags are explicitly categorized
  contentMatch: 1.0,     // Content is the body, lower weight per match
  relevanceScore: 2.0,   // Stored relevance from feedback loops
  recencyBoost: 1.5,     // Recent memories get a boost
  feedbackBoost: 1.0,    // Positive feedback signal
  useCountBoost: 0.3,    // Frequently recalled memories are valuable
};

// ── Stop Words ──────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both',
  'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than',
  'too', 'very', 'just', 'because', 'if', 'when', 'where', 'how', 'what',
  'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'i', 'me',
  'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
  'it', 'its', 'they', 'them', 'their', 'about', 'up', 'out', 'then',
]);

// ── Query Tokenizer ─────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * Extract semantic keywords from a query string.
 * Removes stop words, normalizes, and deduplicates.
 */
function extractKeywords(query: string): string[] {
  const tokens = tokenize(query);
  return [...new Set(tokens)];
}

// ── Scoring Engine ──────────────────────────────────────────────

function scoreMemory(memory: MemoryRecord, keywords: string[]): { score: number; reason: string } {
  if (keywords.length === 0) {
    return { score: memory.relevanceScore, reason: 'no-keywords (relevance only)' };
  }

  let score = 0;
  const reasons: string[] = [];

  const summaryLower = memory.summary.toLowerCase();
  const contentLower = memory.content.toLowerCase();
  const tagsLower = memory.tags.map(t => t.toLowerCase());

  // 1. Keyword match scoring
  let summaryHits = 0;
  let tagHits = 0;
  let contentHits = 0;

  for (const kw of keywords) {
    // Summary matches
    if (summaryLower.includes(kw)) {
      summaryHits++;
      score += WEIGHTS.summaryMatch;
    }

    // Tag matches (exact or partial)
    for (const tag of tagsLower) {
      if (tag.includes(kw) || kw.includes(tag)) {
        tagHits++;
        score += WEIGHTS.tagMatch;
        break; // count each keyword once per tag field
      }
    }

    // Content matches
    const contentOccurrences = (contentLower.match(new RegExp(escapeRegex(kw), 'g')) || []).length;
    if (contentOccurrences > 0) {
      contentHits++;
      // Diminishing returns for content matches
      score += WEIGHTS.contentMatch * Math.min(contentOccurrences, 3);
    }
  }

  // Match density: what fraction of keywords hit
  const matchDensity = (summaryHits + tagHits + contentHits) / (keywords.length * 3);
  score *= (0.5 + matchDensity);

  if (summaryHits > 0) reasons.push(`summary(${summaryHits})`);
  if (tagHits > 0) reasons.push(`tags(${tagHits})`);
  if (contentHits > 0) reasons.push(`content(${contentHits})`);

  // 2. Relevance score (accumulated)
  score += memory.relevanceScore * WEIGHTS.relevanceScore;

  // 3. Recency bias
  const ageMs = Date.now() - new Date(memory.updatedAt).getTime();
  const ageDays = ageMs / (24 * 60 * 60 * 1000);
  const recencyFactor = Math.max(0.1, 1 - (ageDays / 365)); // decay over a year
  score += recencyFactor * WEIGHTS.recencyBoost;

  // 4. Feedback signal
  if (memory.feedbackSignal > 0) {
    score += Math.min(memory.feedbackSignal, 5) * WEIGHTS.feedbackBoost * 0.2;
    reasons.push(`feedback(+${memory.feedbackSignal})`);
  } else if (memory.feedbackSignal < 0) {
    score += memory.feedbackSignal * WEIGHTS.feedbackBoost * 0.1; // negative suppression
  }

  // 5. Use count boost (diminishing)
  if (memory.useCount > 0) {
    score += Math.log2(memory.useCount + 1) * WEIGHTS.useCountBoost;
    reasons.push(`used(${memory.useCount}x)`);
  }

  return {
    score: Math.max(0, score),
    reason: reasons.length > 0 ? reasons.join(', ') : 'low-match',
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Memory Retriever ────────────────────────────────────────────

export class MemoryRetriever {
  private store = getMemoryStore();

  /**
   * Recall memories relevant to a query.
   * Uses keyword extraction + multi-factor scoring to rank results.
   */
  recall(query: RecallQuery): RecallResult {
    const startMs = Date.now();

    // Extract searchable keywords
    const keywords = extractKeywords(query.query);

    // Pull candidate memories from the store
    const candidates = this.store.search(
      query.userId,
      keywords,
      {
        types: query.types,
        projectId: query.projectId,
        limit: 100, // pull more candidates than needed for re-ranking
        scope: query.scope,
      },
    );

    // Score and rank
    const scored: ScoredMemory[] = candidates
      .map(memory => {
        const { score, reason } = scoreMemory(memory, keywords);
        return { memory, matchScore: score, matchReason: reason };
      })
      .filter(s => s.matchScore >= (query.minRelevance || 0.1))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, query.limit || 10);

    // Mark top results as recalled (boosts their relevance for next time)
    for (const s of scored.slice(0, 5)) {
      this.store.markRecalled(s.memory.id);
    }

    const elapsed = Date.now() - startMs;
    logger.info(
      { userId: query.userId, query: query.query, keywords, results: scored.length, timeMs: elapsed },
      '[Memory] Recall completed'
    );

    return {
      memories: scored,
      query: query.query,
      totalMatched: scored.length,
      retrievalTimeMs: elapsed,
    };
  }

  /**
   * Get context-enrichment text for injecting into agent prompts.
   * Returns a formatted string of relevant memories for a given situation.
   */
  getContextForPrompt(
    userId: string,
    currentMessage: string,
    opts?: { projectId?: string; maxMemories?: number; types?: MemoryType[] }
  ): string {
    const result = this.recall({
      userId,
      projectId: opts?.projectId,
      query: currentMessage,
      types: opts?.types,
      limit: opts?.maxMemories || 5,
      minRelevance: 0.3,
    });

    if (result.memories.length === 0) {
      return '';
    }

    const lines = result.memories.map((s, i) => {
      const m = s.memory;
      const typeLabel = m.type.replace(/_/g, ' ');
      return `  ${i + 1}. [${typeLabel}] ${m.summary}${m.tags.length > 0 ? ` (tags: ${m.tags.join(', ')})` : ''}`;
    });

    return [
      '--- ACHEEVY Memory Context ---',
      `Recalled ${result.memories.length} relevant memories for this user:`,
      ...lines,
      '--- End Memory Context ---',
    ].join('\n');
  }

  /**
   * Find similar memories to prevent exact duplicates.
   */
  findSimilar(
    userId: string,
    summary: string,
    type: MemoryType
  ): MemoryRecord[] {
    const keywords = extractKeywords(summary);
    if (keywords.length === 0) return [];

    return this.store.search(userId, keywords, { types: [type], limit: 5 });
  }
}

// Singleton
let _retriever: MemoryRetriever | undefined;

export function getMemoryRetriever(): MemoryRetriever {
  if (!_retriever) {
    _retriever = new MemoryRetriever();
  }
  return _retriever;
}
