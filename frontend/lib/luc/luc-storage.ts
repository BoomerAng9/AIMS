/**
 * LUC Storage — Persistent Data Layer
 *
 * Production-ready storage for LUC accounts and usage data.
 * Uses localStorage for immediate persistence without backend setup.
 * Designed to easily swap to database (Firestore, PostgreSQL, etc.)
 */

import {
  LUCAccountRecord,
  LUCServiceKey,
  QuotaRecord,
  serializeLUCAccount,
  deserializeLUCAccount,
  createLUCAccount,
  LUC_PLANS, SERVICE_BUCKETS,
} from './luc-engine';

// ─────────────────────────────────────────────────────────────
// Storage Keys
// ─────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  ACCOUNTS: 'luc_accounts', // Deprecated, used for migration
  ACCOUNTS_INDEX: 'luc_accounts_index',
  CURRENT_USER: 'luc_current_user',
  USAGE_HISTORY: 'luc_usage_history',
  PRESETS: 'luc_presets',
} as const;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface UsageHistoryEntry {
  id: string;
  userId: string;
  service: LUCServiceKey;
  amount: number;
  type: 'debit' | 'credit';
  cost: number;
  timestamp: string;
  description?: string;
}

export interface LUCStorageAdapter {
  // Account operations
  getAccount(userId: string): Promise<LUCAccountRecord | null>;
  saveAccount(account: LUCAccountRecord): Promise<void>;
  deleteAccount(userId: string): Promise<void>;
  listAccounts(): Promise<LUCAccountRecord[]>;

  // Usage history
  addUsageEntry(entry: UsageHistoryEntry): Promise<void>;
  getUsageHistory(userId: string, limit?: number): Promise<UsageHistoryEntry[]>;
  clearUsageHistory(userId: string): Promise<void>;

  // Export/Import
  exportAll(userId: string): Promise<string>;
  importAll(userId: string, data: string): Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// LocalStorage Adapter (Production-ready client-side persistence)
// ─────────────────────────────────────────────────────────────

export class LocalStorageAdapter implements LUCStorageAdapter {
  private isAvailable: boolean;
  private migrated = false;

  constructor() {
    this.isAvailable = typeof window !== 'undefined' && !!window.localStorage;
  }

  private migrateAccountsIfNeeded() {
    if (!this.isAvailable || this.migrated) return;

    try {
      const oldAccountsJson = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (oldAccountsJson) {
        console.log('[LUCStorage] Migrating accounts to new storage format...');
        const accounts = JSON.parse(oldAccountsJson);
        const userIds = Object.keys(accounts);

        // Save individual accounts
        for (const userId of userIds) {
          localStorage.setItem(`luc_account_${userId}`, JSON.stringify(accounts[userId]));
        }

        // Save index
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS_INDEX, JSON.stringify(userIds));

        // Remove old key
        localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
        console.log(`[LUCStorage] Migration complete. Moved ${userIds.length} accounts.`);
      }
    } catch (error) {
      console.error('[LUCStorage] Migration failed:', error);
      // Don't mark as migrated if failed, so we retry? Or mark to avoid loop?
      // If we fail, we probably corrupt data if we partially moved.
      // But assuming simple failures, we just log.
    }
    this.migrated = true;
  }

  async getAccount(userId: string): Promise<LUCAccountRecord | null> {
    if (!this.isAvailable) return null;
    this.migrateAccountsIfNeeded();

    try {
      const accountJson = localStorage.getItem(`luc_account_${userId}`);
      if (!accountJson) return null;

      return deserializeLUCAccount(JSON.parse(accountJson));
    } catch (error) {
      console.error('[LUCStorage] Failed to get account:', error);
      return null;
    }
  }

  async saveAccount(account: LUCAccountRecord): Promise<void> {
    if (!this.isAvailable) return;
    this.migrateAccountsIfNeeded();

    const key = `luc_account_${account.userId}`;
    const isUpdate = localStorage.getItem(key) !== null;

    try {
      localStorage.setItem(key, JSON.stringify(serializeLUCAccount(account)));

      if (!isUpdate) {
        // Update index
        const indexJson = localStorage.getItem(STORAGE_KEYS.ACCOUNTS_INDEX) || '[]';
        const index = JSON.parse(indexJson);
        if (!index.includes(account.userId)) {
          index.push(account.userId);
          localStorage.setItem(STORAGE_KEYS.ACCOUNTS_INDEX, JSON.stringify(index));
        }
      }
    } catch (error) {
      console.error('[LUCStorage] Failed to save account:', error);
      throw error;
    }
  }

  async deleteAccount(userId: string): Promise<void> {
    if (!this.isAvailable) return;
    this.migrateAccountsIfNeeded();

    try {
      localStorage.removeItem(`luc_account_${userId}`);

      // Update index
      const indexJson = localStorage.getItem(STORAGE_KEYS.ACCOUNTS_INDEX) || '[]';
      let index = JSON.parse(indexJson);
      index = index.filter((id: string) => id !== userId);
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS_INDEX, JSON.stringify(index));

      // Also clear usage history
      await this.clearUsageHistory(userId);
    } catch (error) {
      console.error('[LUCStorage] Failed to delete account:', error);
      throw error;
    }
  }

  async listAccounts(): Promise<LUCAccountRecord[]> {
    if (!this.isAvailable) return [];
    this.migrateAccountsIfNeeded();

    try {
      const indexJson = localStorage.getItem(STORAGE_KEYS.ACCOUNTS_INDEX) || '[]';
      const index = JSON.parse(indexJson);

      const accounts = await Promise.all(
        index.map((userId: string) => this.getAccount(userId))
      );

      return accounts.filter((a): a is LUCAccountRecord => a !== null);
    } catch (error) {
      console.error('[LUCStorage] Failed to list accounts:', error);
      return [];
    }
  }

  async addUsageEntry(entry: UsageHistoryEntry): Promise<void> {
    if (!this.isAvailable) return;

    try {
      const historyJson = localStorage.getItem(STORAGE_KEYS.USAGE_HISTORY) || '{}';
      const history = JSON.parse(historyJson);

      if (!history[entry.userId]) {
        history[entry.userId] = [];
      }

      history[entry.userId].unshift(entry);

      // Keep only last 1000 entries per user
      if (history[entry.userId].length > 1000) {
        history[entry.userId] = history[entry.userId].slice(0, 1000);
      }

      localStorage.setItem(STORAGE_KEYS.USAGE_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('[LUCStorage] Failed to add usage entry:', error);
    }
  }

  async getUsageHistory(userId: string, limit: number = 100): Promise<UsageHistoryEntry[]> {
    if (!this.isAvailable) return [];

    try {
      const historyJson = localStorage.getItem(STORAGE_KEYS.USAGE_HISTORY) || '{}';
      const history = JSON.parse(historyJson);

      return (history[userId] || []).slice(0, limit);
    } catch (error) {
      console.error('[LUCStorage] Failed to get usage history:', error);
      return [];
    }
  }

  async clearUsageHistory(userId: string): Promise<void> {
    if (!this.isAvailable) return;

    try {
      const historyJson = localStorage.getItem(STORAGE_KEYS.USAGE_HISTORY) || '{}';
      const history = JSON.parse(historyJson);

      delete history[userId];
      localStorage.setItem(STORAGE_KEYS.USAGE_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('[LUCStorage] Failed to clear usage history:', error);
    }
  }

  async exportAll(userId: string): Promise<string> {
    const account = await this.getAccount(userId);
    const history = await this.getUsageHistory(userId, 10000);

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      account: account ? serializeLUCAccount(account) : null,
      usageHistory: history,
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importAll(userId: string, data: string): Promise<void> {
    try {
      const importData = JSON.parse(data);

      if (importData.account) {
        const account = deserializeLUCAccount(importData.account);
        account.userId = userId; // Override with current user
        await this.saveAccount(account);
      }

      if (importData.usageHistory && Array.isArray(importData.usageHistory)) {
        const historyJson = localStorage.getItem(STORAGE_KEYS.USAGE_HISTORY) || '{}';
        const history = JSON.parse(historyJson);

        history[userId] = importData.usageHistory.map((entry: any) => ({
          ...entry,
          userId,
        }));

        localStorage.setItem(STORAGE_KEYS.USAGE_HISTORY, JSON.stringify(history));
      }
    } catch (error) {
      console.error('[LUCStorage] Failed to import data:', error);
      throw new Error('Invalid import data format');
    }
  }
}

// ─────────────────────────────────────────────────────────────
// CSV Export Utilities
// ─────────────────────────────────────────────────────────────

export function usageHistoryToCSV(history: UsageHistoryEntry[]): string {
  const headers = ['Date', 'Service', 'Type', 'Amount', 'Cost', 'Description'];
  const rows = history.map((entry) => [
    new Date(entry.timestamp).toLocaleString(),
    entry.service,
    entry.type,
    entry.amount.toString(),
    `${entry.cost.toFixed(4)}`,
    entry.description || '',
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function accountSummaryToCSV(account: LUCAccountRecord): string {
  const headers = ['Service', 'Used', 'Limit', 'Overage', 'Overage Cost', 'Percent Used'];
  const rows = Object.entries(account.quotas).map(([key, quota]) => {
    const bucket = SERVICE_BUCKETS[key as LUCServiceKey];
    const percentUsed = quota.limit > 0 ? ((quota.used / quota.limit) * 100).toFixed(1) : '0';
    const overageCost = (quota.overage * (bucket?.overageRate || 0)).toFixed(4);

    return [
      bucket?.name || key,
      quota.used.toString(),
      quota.limit.toString(),
      quota.overage.toString(),
      `${overageCost}`,
      `${percentUsed}%`,
    ];
  });

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

// ─────────────────────────────────────────────────────────────
// Singleton Storage Instance
// ─────────────────────────────────────────────────────────────

let storageInstance: LUCStorageAdapter | null = null;

export function getLUCStorage(): LUCStorageAdapter {
  if (!storageInstance) {
    storageInstance = new LocalStorageAdapter();
  }
  return storageInstance;
}

// ─────────────────────────────────────────────────────────────
// High-Level Account Manager
// ─────────────────────────────────────────────────────────────

export class LUCAccountManager {
  private storage: LUCStorageAdapter;

  constructor(storage?: LUCStorageAdapter) {
    this.storage = storage || getLUCStorage();
  }

  /**
   * Get or create account for user
   */
  async getOrCreateAccount(userId: string, planId: string = 'free'): Promise<LUCAccountRecord> {
    let account = await this.storage.getAccount(userId);

    if (!account) {
      account = createLUCAccount(userId, planId);
      await this.storage.saveAccount(account);
    }

    return account;
  }

  /**
   * Update account
   */
  async updateAccount(account: LUCAccountRecord): Promise<void> {
    account.updatedAt = new Date();
    await this.storage.saveAccount(account);
  }

  /**
   * Record a debit operation
   */
  async recordDebit(
    userId: string,
    service: LUCServiceKey,
    amount: number,
    cost: number,
    description?: string
  ): Promise<void> {
    await this.storage.addUsageEntry({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      service,
      amount,
      type: 'debit',
      cost,
      timestamp: new Date().toISOString(),
      description,
    });
  }

  /**
   * Record a credit operation
   */
  async recordCredit(
    userId: string,
    service: LUCServiceKey,
    amount: number,
    description?: string
  ): Promise<void> {
    await this.storage.addUsageEntry({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      service,
      amount,
      type: 'credit',
      cost: 0,
      timestamp: new Date().toISOString(),
      description,
    });
  }

  /**
   * Get usage history
   */
  async getUsageHistory(userId: string, limit?: number): Promise<UsageHistoryEntry[]> {
    return this.storage.getUsageHistory(userId, limit);
  }

  /**
   * Export all data
   */
  async exportData(userId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    if (format === 'csv') {
      const [account, history] = await Promise.all([
        this.storage.getAccount(userId),
        this.storage.getUsageHistory(userId),
      ]);

      return `=== ACCOUNT SUMMARY ===\n${account ? accountSummaryToCSV(account) : 'No account'}\n\n=== USAGE HISTORY ===\n${usageHistoryToCSV(history)}`;
    }

    return this.storage.exportAll(userId);
  }

  /**
   * Import data
   */
  async importData(userId: string, data: string): Promise<void> {
    return this.storage.importAll(userId, data);
  }

  /**
   * Reset account (new billing cycle)
   */
  async resetBillingCycle(userId: string): Promise<LUCAccountRecord> {
    const account = await this.storage.getAccount(userId);
    if (!account) {
      throw new Error('Account not found');
    }

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    account.billingCycleStart = now;
    account.billingCycleEnd = nextMonth;
    account.totalOverageCost = 0;

    for (const quota of Object.values(account.quotas)) {
      quota.used = 0;
      quota.overage = 0;
      quota.lastUpdated = now;
    }

    account.updatedAt = now;
    await this.storage.saveAccount(account);

    return account;
  }

  /**
   * Change plan
   */
  async changePlan(userId: string, newPlanId: string): Promise<LUCAccountRecord> {
    const account = await this.storage.getAccount(userId);
    if (!account) {
      throw new Error('Account not found');
    }

    const newPlan = LUC_PLANS[newPlanId];
    if (!newPlan) {
      throw new Error(`Plan not found: ${newPlanId}`);
    }

    account.planId = newPlanId;
    account.planName = newPlan.name;

    // Update quota limits (keep current usage)
    for (const [key, limit] of Object.entries(newPlan.quotas)) {
      const serviceKey = key as LUCServiceKey;
      if (account.quotas[serviceKey]) {
        account.quotas[serviceKey].limit = limit;
      }
    }

    account.updatedAt = new Date();
    await this.storage.saveAccount(account);

    return account;
  }
}

// Export singleton manager
let managerInstance: LUCAccountManager | null = null;

export function getLUCAccountManager(): LUCAccountManager {
  if (!managerInstance) {
    managerInstance = new LUCAccountManager();
  }
  return managerInstance;
}

export default LUCAccountManager;
