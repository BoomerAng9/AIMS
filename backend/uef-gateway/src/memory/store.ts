/**
 * AIMS Memory Store — SQLite-Backed Persistence
 *
 * Uses the existing better-sqlite3 infrastructure to persist memories
 * in a dedicated `memories` table. Leverages the migration system for
 * schema management and prepared statements for performance.
 *
 * Handles:
 *  - CRUD operations on memories
 *  - Deduplication (same user + same summary = update instead of insert)
 *  - Relevance decay (older memories score lower unless frequently used)
 *  - TTL-based expiry
 *  - Feedback signal accumulation
 */

import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import type {
  MemoryRecord,
  MemoryType,
  MemoryScope,
  RememberInput,
  MemoryFeedback,
  MemoryStats,
} from './types';

// ── Memory Store ────────────────────────────────────────────────

export class MemoryStore {
  private get db() {
    return getDb();
  }

  /**
   * Store a new memory. Deduplicates by userId + summary hash —
   * if a memory with the same summary exists, it updates instead.
   */
  remember(input: RememberInput): MemoryRecord {
    const now = new Date().toISOString();

    // Check for existing memory with same user + summary
    const existing = this.db.prepare(
      `SELECT * FROM memories WHERE userId = ? AND summary = ? AND type = ?`
    ).get(input.userId, input.summary, input.type) as Record<string, unknown> | undefined;

    if (existing) {
      // Update existing — boost relevance, merge tags
      const existingTags: string[] = existing.tags
        ? JSON.parse(existing.tags as string)
        : [];
      const mergedTags = [...new Set([...existingTags, ...(input.tags || [])])];
      const newUseCount = (existing.useCount as number || 0) + 1;
      const newRelevance = Math.min(1.0, (existing.relevanceScore as number || 0.5) + 0.05);

      this.db.prepare(`
        UPDATE memories
        SET content = ?, payload = ?, tags = ?, relevanceScore = ?,
            useCount = ?, feedbackSignal = ?, updatedAt = ?, source = ?
        WHERE id = ?
      `).run(
        input.content,
        JSON.stringify(input.payload || {}),
        JSON.stringify(mergedTags),
        newRelevance,
        newUseCount,
        (existing.feedbackSignal as number || 0) + (input.feedbackSignal || 0),
        now,
        input.source || existing.source as string,
        existing.id as string,
      );

      logger.info({ id: existing.id, summary: input.summary }, '[Memory] Updated existing memory');
      return this.getById(existing.id as string)!;
    }

    // Create new memory
    const id = uuidv4();
    const expiresAt = input.ttlDays
      ? new Date(Date.now() + input.ttlDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const record: MemoryRecord = {
      id,
      userId: input.userId,
      projectId: input.projectId || '',
      type: input.type,
      scope: input.scope || 'user',
      summary: input.summary,
      content: input.content,
      payload: input.payload || {},
      tags: input.tags || [],
      relevanceScore: 0.5,
      useCount: 0,
      feedbackSignal: input.feedbackSignal || 0,
      source: input.source || 'system',
      expiresAt,
      createdAt: now,
      updatedAt: now,
      lastRecalledAt: null,
    };

    this.db.prepare(`
      INSERT INTO memories (
        id, userId, projectId, type, scope, summary, content,
        payload, tags, relevanceScore, useCount, feedbackSignal,
        source, expiresAt, createdAt, updatedAt, lastRecalledAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.id,
      record.userId,
      record.projectId,
      record.type,
      record.scope,
      record.summary,
      record.content,
      JSON.stringify(record.payload),
      JSON.stringify(record.tags),
      record.relevanceScore,
      record.useCount,
      record.feedbackSignal,
      record.source,
      record.expiresAt,
      record.createdAt,
      record.updatedAt,
      record.lastRecalledAt,
    );

    logger.info({ id, type: input.type, summary: input.summary }, '[Memory] Stored new memory');
    return record;
  }

  /**
   * Retrieve a memory by ID.
   */
  getById(id: string): MemoryRecord | undefined {
    const row = this.db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) return undefined;
    return this.deserialize(row);
  }

  /**
   * List all memories for a user, optionally filtered by type and/or project.
   */
  listForUser(
    userId: string,
    opts?: { type?: MemoryType; projectId?: string; limit?: number }
  ): MemoryRecord[] {
    let sql = 'SELECT * FROM memories WHERE userId = ?';
    const params: unknown[] = [userId];

    if (opts?.type) {
      sql += ' AND type = ?';
      params.push(opts.type);
    }
    if (opts?.projectId) {
      sql += ' AND projectId = ?';
      params.push(opts.projectId);
    }

    sql += ' ORDER BY relevanceScore DESC, updatedAt DESC';

    if (opts?.limit) {
      sql += ' LIMIT ?';
      params.push(opts.limit);
    }

    const rows = this.db.prepare(sql).all(...params) as Record<string, unknown>[];
    return rows.map(r => this.deserialize(r));
  }

  /**
   * Full-text keyword search across summary + content + tags.
   * Returns raw rows — the Retriever handles scoring and ranking.
   */
  search(
    userId: string,
    keywords: string[],
    opts?: { types?: MemoryType[]; projectId?: string; limit?: number; scope?: MemoryScope }
  ): MemoryRecord[] {
    // Build WHERE clause
    let sql = 'SELECT * FROM memories WHERE userId = ?';
    const params: unknown[] = [userId];

    // Also include global memories
    if (opts?.scope !== 'user') {
      sql = `SELECT * FROM memories WHERE (userId = ? OR scope = 'global')`;
    }

    if (opts?.types && opts.types.length > 0) {
      sql += ` AND type IN (${opts.types.map(() => '?').join(', ')})`;
      params.push(...opts.types);
    }

    if (opts?.projectId) {
      sql += ` AND (projectId = ? OR projectId = '')`;
      params.push(opts.projectId);
    }

    // Filter expired
    sql += ` AND (expiresAt IS NULL OR expiresAt > ?)`;
    params.push(new Date().toISOString());

    // Keyword matching: any keyword in summary, content, or tags
    if (keywords.length > 0) {
      const keywordClauses = keywords.map(() =>
        `(LOWER(summary) LIKE ? OR LOWER(content) LIKE ? OR LOWER(tags) LIKE ?)`
      );
      sql += ` AND (${keywordClauses.join(' OR ')})`;
      for (const kw of keywords) {
        const pattern = `%${kw.toLowerCase()}%`;
        params.push(pattern, pattern, pattern);
      }
    }

    sql += ' ORDER BY relevanceScore DESC, feedbackSignal DESC, updatedAt DESC';
    sql += ` LIMIT ?`;
    params.push(opts?.limit || 50);

    const rows = this.db.prepare(sql).all(...params) as Record<string, unknown>[];
    return rows.map(r => this.deserialize(r));
  }

  /**
   * Record that a memory was recalled (used in context).
   * Boosts relevance and increments use count.
   */
  markRecalled(id: string): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE memories
      SET useCount = useCount + 1,
          relevanceScore = MIN(1.0, relevanceScore + 0.02),
          lastRecalledAt = ?,
          updatedAt = ?
      WHERE id = ?
    `).run(now, now, id);
  }

  /**
   * Apply feedback to a memory (positive boosts relevance, negative decays it).
   */
  applyFeedback(feedback: MemoryFeedback): void {
    const signalDelta = feedback.signal === 'positive' ? 1 : feedback.signal === 'negative' ? -1 : 0;
    const relevanceDelta = feedback.signal === 'positive' ? 0.1 : feedback.signal === 'negative' ? -0.15 : 0;
    const now = new Date().toISOString();

    this.db.prepare(`
      UPDATE memories
      SET feedbackSignal = feedbackSignal + ?,
          relevanceScore = MAX(0, MIN(1.0, relevanceScore + ?)),
          updatedAt = ?
      WHERE id = ?
    `).run(signalDelta, relevanceDelta, now, feedback.memoryId);

    logger.info({ memoryId: feedback.memoryId, signal: feedback.signal }, '[Memory] Feedback applied');
  }

  /**
   * Delete a specific memory.
   */
  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM memories WHERE id = ?').run(id);
    return result.changes > 0;
  }

  /**
   * Purge all expired memories.
   */
  purgeExpired(): number {
    const now = new Date().toISOString();
    const result = this.db.prepare(
      `DELETE FROM memories WHERE expiresAt IS NOT NULL AND expiresAt < ?`
    ).run(now);
    if (result.changes > 0) {
      logger.info({ purged: result.changes }, '[Memory] Purged expired memories');
    }
    return result.changes;
  }

  /**
   * Decay relevance scores for memories not used recently.
   * Called periodically (e.g., daily) to ensure stale memories
   * naturally sink in ranking.
   */
  decayRelevance(ageDays: number = 30): number {
    const cutoff = new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000).toISOString();
    const result = this.db.prepare(`
      UPDATE memories
      SET relevanceScore = MAX(0.05, relevanceScore * 0.95)
      WHERE updatedAt < ? AND relevanceScore > 0.05
    `).run(cutoff);
    return result.changes;
  }

  /**
   * Get memory statistics for a user.
   */
  getStats(userId: string): MemoryStats {
    const total = this.db.prepare(
      'SELECT COUNT(*) as cnt FROM memories WHERE userId = ?'
    ).get(userId) as { cnt: number };

    const byType = this.db.prepare(
      'SELECT type, COUNT(*) as cnt FROM memories WHERE userId = ? GROUP BY type'
    ).all(userId) as { type: MemoryType; cnt: number }[];

    const byScope = this.db.prepare(
      'SELECT scope, COUNT(*) as cnt FROM memories WHERE userId = ? GROUP BY scope'
    ).all(userId) as { scope: MemoryScope; cnt: number }[];

    const oldest = this.db.prepare(
      'SELECT MIN(createdAt) as val FROM memories WHERE userId = ?'
    ).get(userId) as { val: string | null };

    const newest = this.db.prepare(
      'SELECT MAX(createdAt) as val FROM memories WHERE userId = ?'
    ).get(userId) as { val: string | null };

    const totalRecalls = this.db.prepare(
      'SELECT COALESCE(SUM(useCount), 0) as val FROM memories WHERE userId = ?'
    ).get(userId) as { val: number };

    const avgRelevance = this.db.prepare(
      'SELECT COALESCE(AVG(relevanceScore), 0) as val FROM memories WHERE userId = ?'
    ).get(userId) as { val: number };

    const typeMap: Record<string, number> = {};
    for (const row of byType) typeMap[row.type] = row.cnt;

    const scopeMap: Record<string, number> = {};
    for (const row of byScope) scopeMap[row.scope] = row.cnt;

    return {
      userId,
      totalMemories: total.cnt,
      byType: typeMap as Record<MemoryType, number>,
      byScope: scopeMap as Record<MemoryScope, number>,
      oldestMemory: oldest.val,
      newestMemory: newest.val,
      totalRecalls: totalRecalls.val,
      avgRelevanceScore: Math.round(avgRelevance.val * 100) / 100,
    };
  }

  // ── Private Helpers ─────────────────────────────────────────────

  private deserialize(row: Record<string, unknown>): MemoryRecord {
    return {
      id: row.id as string,
      userId: row.userId as string,
      projectId: (row.projectId as string) || undefined,
      type: row.type as MemoryType,
      scope: row.scope as MemoryScope,
      summary: row.summary as string,
      content: row.content as string,
      payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : (row.payload as Record<string, unknown> || {}),
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags as string[] || []),
      relevanceScore: row.relevanceScore as number,
      useCount: row.useCount as number,
      feedbackSignal: row.feedbackSignal as number,
      source: row.source as string,
      expiresAt: row.expiresAt as string | null,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
      lastRecalledAt: row.lastRecalledAt as string | null,
    };
  }
}

// Singleton
let _memoryStore: MemoryStore | undefined;

export function getMemoryStore(): MemoryStore {
  if (!_memoryStore) {
    _memoryStore = new MemoryStore();
  }
  return _memoryStore;
}
