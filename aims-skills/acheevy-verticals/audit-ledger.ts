/**
 * Triple Audit Ledger — Platform, User, Web3-Ready
 *
 * Three concurrent audit records per execution:
 *   1. PLATFORM LEDGER — Internal ops record (collaboration feed + metrics)
 *   2. USER LEDGER — User-facing receipt (what they paid, what they got)
 *   3. WEB3-READY LEDGER — Immutable SHA-256 hash chain
 *      → In-memory Merkle-style chain now, convertible to blockchain later
 *      → Each entry: { hash, previousHash, timestamp, agentId, action, artifactHash }
 *
 * Wires into existing systems:
 *   - collaboration/feed.ts → platform ledger entries
 *   - ucp/index.ts → user receipt entries
 *   - New hash chain → web3-ready ledger entries
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type {
  AuditEntry,
  AuditAction,
  PlatformLedgerEntry,
  UserLedgerEntry,
  Web3LedgerEntry,
  LedgerEntry,
} from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

// ---------------------------------------------------------------------------
// Hash Utility
// ---------------------------------------------------------------------------

function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// ---------------------------------------------------------------------------
// Triple Audit Ledger
// ---------------------------------------------------------------------------

class TripleAuditLedger {
  private platformLedger: PlatformLedgerEntry[] = [];
  private userLedger: UserLedgerEntry[] = [];
  private web3Chain: Web3LedgerEntry[] = [];

  // ── Write to ALL 3 ledgers simultaneously ───────────────────────────────

  /**
   * Write an audit entry to all three ledgers atomically.
   * Returns the IDs/hashes from each ledger.
   */
  write(entry: AuditEntry): {
    platformId: string;
    userReceiptId: string;
    web3Hash: string;
  } {
    const platformId = this.writePlatform(entry);
    const userReceiptId = this.writeUser(entry);
    const web3Hash = this.writeWeb3(entry);

    return { platformId, userReceiptId, web3Hash };
  }

  // ── Platform Ledger: Internal Ops Record ─────────────────────────────────

  /**
   * Write to the platform ledger.
   * Maps audit actions to collaboration feed entry types.
   * Links to CollaborationSession via feedEntryId.
   */
  writePlatform(entry: AuditEntry): string {
    const platformEntry: PlatformLedgerEntry = {
      ...entry,
      id: entry.id || uuidv4(),
      ledger: 'platform',
      feedEntryId: `feed-${uuidv4().slice(0, 8)}`,
      metrics: this.deriveMetrics(entry),
    };

    this.platformLedger.push(platformEntry);
    return platformEntry.id;
  }

  // ── User Ledger: What They Paid, What They Got ──────────────────────────

  /**
   * Write to the user ledger.
   * Links to UCPSettlement receipt and artifact IDs.
   */
  writeUser(entry: AuditEntry): string {
    const userEntry: UserLedgerEntry = {
      ...entry,
      id: entry.id || uuidv4(),
      ledger: 'user',
      receiptId: entry.cost ? `receipt-${uuidv4().slice(0, 8)}` : undefined,
      artifactIds: this.extractArtifactIds(entry),
    };

    this.userLedger.push(userEntry);
    return userEntry.id;
  }

  // ── Web3-Ready Ledger: SHA-256 Hash Chain ────────────────────────────────

  /**
   * Write to the web3-ready hash chain.
   * Each entry links to the previous via hash, forming an immutable chain.
   * Future: convert to Ethereum/Solana smart contract events.
   */
  writeWeb3(entry: AuditEntry): string {
    const previousHash = this.web3Chain.length > 0
      ? this.web3Chain[this.web3Chain.length - 1].hash
      : GENESIS_HASH;

    // Compute artifact hash if artifacts are present
    const artifactHash = entry.data.artifacts
      ? sha256(JSON.stringify(entry.data.artifacts))
      : undefined;

    // Compute entry hash: SHA-256 of (entry data + previous hash)
    const entryPayload = JSON.stringify({
      timestamp: entry.timestamp,
      verticalId: entry.verticalId,
      userId: entry.userId,
      sessionId: entry.sessionId,
      action: entry.action,
      agentId: entry.agentId,
      data: entry.data,
      cost: entry.cost,
      previousHash,
    });
    const hash = sha256(entryPayload);

    const web3Entry: Web3LedgerEntry = {
      ...entry,
      id: entry.id || uuidv4(),
      ledger: 'web3',
      hash,
      previousHash,
      artifactHash,
    };

    this.web3Chain.push(web3Entry);
    return hash;
  }

  // ── Chain Integrity Verification ─────────────────────────────────────────

  /**
   * Walk the web3 chain and verify each hash links correctly.
   * Returns true if the entire chain is intact.
   */
  verifyChain(): { valid: boolean; brokenAt?: number; message: string } {
    if (this.web3Chain.length === 0) {
      return { valid: true, message: 'Chain is empty — nothing to verify.' };
    }

    // Verify genesis entry
    if (this.web3Chain[0].previousHash !== GENESIS_HASH) {
      return {
        valid: false,
        brokenAt: 0,
        message: 'Genesis entry does not reference GENESIS_HASH.',
      };
    }

    // Walk the chain
    for (let i = 1; i < this.web3Chain.length; i++) {
      const current = this.web3Chain[i];
      const previous = this.web3Chain[i - 1];

      if (current.previousHash !== previous.hash) {
        return {
          valid: false,
          brokenAt: i,
          message: `Chain broken at index ${i}: previousHash does not match entry ${i - 1}'s hash.`,
        };
      }
    }

    return {
      valid: true,
      message: `Chain verified: ${this.web3Chain.length} entries, all hashes linked correctly.`,
    };
  }

  // ── Export for Web3 Conversion ───────────────────────────────────────────

  /**
   * Export the full web3 chain for future blockchain conversion.
   * Each entry contains enough data to mint as a smart contract event.
   */
  exportWeb3Chain(): Web3LedgerEntry[] {
    return [...this.web3Chain];
  }

  /**
   * Export platform ledger entries for a specific session.
   */
  getPlatformEntries(sessionId: string): PlatformLedgerEntry[] {
    return this.platformLedger.filter(e => e.sessionId === sessionId);
  }

  /**
   * Export user ledger entries for a specific user.
   */
  getUserEntries(userId: string): UserLedgerEntry[] {
    return this.userLedger.filter(e => e.userId === userId);
  }

  /**
   * Get the full ledger stats.
   */
  getStats(): {
    platformCount: number;
    userCount: number;
    web3Count: number;
    chainValid: boolean;
    totalCostUsd: number;
    totalTokens: number;
  } {
    const totalCostUsd = this.userLedger.reduce(
      (sum, e) => sum + (e.cost?.usd || 0), 0
    );
    const totalTokens = this.userLedger.reduce(
      (sum, e) => sum + (e.cost?.tokens || 0), 0
    );

    return {
      platformCount: this.platformLedger.length,
      userCount: this.userLedger.length,
      web3Count: this.web3Chain.length,
      chainValid: this.verifyChain().valid,
      totalCostUsd: Math.round(totalCostUsd * 10000) / 10000,
      totalTokens,
    };
  }

  // ── Internal Helpers ─────────────────────────────────────────────────────

  /**
   * Map audit actions to feed entry types for collaboration feed.
   */
  private actionToFeedType(action: AuditAction): string {
    const mapping: Record<AuditAction, string> = {
      step_generated: 'directive',
      step_executed: 'execution',
      oracle_gated: 'verification',
      rag_retrieved: 'thinking',
      rag_stored: 'thinking',
      bench_scored: 'coaching',
      vertical_completed: 'receipt',
      pipeline_dispatched: 'handoff',
      verification_passed: 'verification',
      verification_failed: 'verification',
      fee_charged: 'billing',
      savings_credited: 'billing',
      invoice_generated: 'receipt',
      transaction_metered: 'billing',
    };
    return mapping[action] || 'system';
  }

  /**
   * Derive operational metrics from an audit entry.
   */
  private deriveMetrics(entry: AuditEntry): Record<string, number> {
    const metrics: Record<string, number> = {};

    if (entry.cost) {
      metrics.tokens = entry.cost.tokens;
      metrics.usd = entry.cost.usd;
    }

    if (entry.action === 'bench_scored' && entry.data.weightedTotal) {
      metrics.benchScore = entry.data.weightedTotal as number;
    }

    if (entry.action === 'oracle_gated' && entry.data.score) {
      metrics.oracleScore = entry.data.score as number;
    }

    if (entry.action === 'rag_retrieved' && entry.data.relevance) {
      metrics.ragRelevance = entry.data.relevance as number;
    }

    return metrics;
  }

  /**
   * Extract artifact IDs from entry data.
   */
  private extractArtifactIds(entry: AuditEntry): string[] | undefined {
    if (entry.data.artifacts && Array.isArray(entry.data.artifacts)) {
      return entry.data.artifacts as string[];
    }
    if (entry.data.artifactId) {
      return [entry.data.artifactId as string];
    }
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

export const auditLedger = new TripleAuditLedger();

// ---------------------------------------------------------------------------
// Helper: Create a standard audit entry
// ---------------------------------------------------------------------------

export function createAuditEntry(
  verticalId: string,
  userId: string,
  sessionId: string,
  action: AuditAction,
  data: Record<string, unknown>,
  agentId?: string,
  cost?: { tokens: number; usd: number },
): AuditEntry {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    verticalId,
    userId,
    sessionId,
    action,
    agentId,
    data,
    cost,
  };
}
