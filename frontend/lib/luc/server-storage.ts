/**
 * LUC Server Storage — Persistent Data Layer
 *
 * Production-ready server-side storage for LUC accounts.
 * Uses JSON files for persistence across server restarts (VPS/Docker).
 */

import {
  LUCAccountRecord,
  LUCServiceKey,
  serializeLUCAccount,
  deserializeLUCAccount,
  createLUCAccount,
  LUC_PLANS,
  SERVICE_BUCKETS,
} from './luc-engine';

// ─────────────────────────────────────────────────────────────
// Storage Configuration
// ─────────────────────────────────────────────────────────────

const path = require('path');
const DATA_DIR = process.env.LUC_DATA_DIR || path.join(process.cwd(), '.luc-data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const USAGE_HISTORY_FILE = path.join(DATA_DIR, 'usage-history.json');

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

interface AccountsData {
  [userId: string]: ReturnType<typeof serializeLUCAccount>;
}

interface UsageHistoryData {
  [userId: string]: UsageHistoryEntry[];
}
// ─────────────────────────────────────────────────────────────
// File System Utilities
// ─────────────────────────────────────────────────────────────

async function ensureDataDir(): Promise<void> {
  const fs = require('fs') as typeof import('fs');
  try {
    await fs.promises.access(DATA_DIR);
  } catch {
    await fs.promises.mkdir(DATA_DIR, { recursive: true });
    console.log(`[LUC Server Storage] Created data directory: ${DATA_DIR}`);
  }
}

async function readJSONFile<T>(filePath: string, defaultValue: T): Promise<T> {
  const fs = require('fs') as typeof import('fs');
  try {
    try {
      await fs.promises.access(filePath);
    } catch {
      return defaultValue;
    }
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`[LUC Server Storage] Failed to read ${filePath}:`, error);
    return defaultValue;
  }
}

async function writeJSONFile<T>(filePath: string, data: T): Promise<void> {
  const fs = require('fs') as typeof import('fs');
  try {
    await ensureDataDir();
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`[LUC Server Storage] Failed to write ${filePath}:`, error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// Server Storage Adapter
// ─────────────────────────────────────────────────────────────

export class ServerStorageAdapter {
  private accountsCache: AccountsData | null = null;
  private historyCache: UsageHistoryData | null = null;
  private cacheTimestamp: number = 0;
  private readonly cacheTTL: number = 5000; // 5 second cache

  constructor() {
    ensureDataDir().catch(console.error);
  }

  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.cacheTTL;
  }

  private async getAccounts(): Promise<AccountsData> {
    if (this.accountsCache && this.isCacheValid()) {
      return this.accountsCache;
    }
    this.accountsCache = await readJSONFile<AccountsData>(ACCOUNTS_FILE, {});
    this.cacheTimestamp = Date.now();
    return this.accountsCache;
  }

  private async saveAccounts(accounts: AccountsData): Promise<void> {
    await writeJSONFile(ACCOUNTS_FILE, accounts);
    this.accountsCache = accounts;
    this.cacheTimestamp = Date.now();
  }

  private async getHistory(): Promise<UsageHistoryData> {
    if (this.historyCache && this.isCacheValid()) {
      return this.historyCache;
    }
    this.historyCache = await readJSONFile<UsageHistoryData>(USAGE_HISTORY_FILE, {});
    return this.historyCache;
  }

  private async saveHistory(history: UsageHistoryData): Promise<void> {
    await writeJSONFile(USAGE_HISTORY_FILE, history);
    this.historyCache = history;
  }

  // ─────────────────────────────────────────────────────────
  // Account Operations
  // ─────────────────────────────────────────────────────────
  async getAccount(userId: string): Promise<LUCAccountRecord | null> {
    const accounts = await this.getAccounts();
    const accountData = accounts[userId];
    if (!accountData) return null;

    try {
      return deserializeLUCAccount(accountData);
    } catch (error) {
      console.error(`[LUC Server Storage] Failed to deserialize account ${userId}:`, error);
      return null;
    }
  }

  async saveAccount(account: LUCAccountRecord): Promise<void> {
    const accounts = await this.getAccounts();
    accounts[account.userId] = serializeLUCAccount(account);
    await this.saveAccounts(accounts);
  }

  async deleteAccount(userId: string): Promise<void> {
    const accounts = await this.getAccounts();
    delete accounts[userId];
    await this.saveAccounts(accounts);

    // Also clear usage history
    await this.clearUsageHistory(userId);
  }

  async listAccounts(): Promise<LUCAccountRecord[]> {
    const accounts = await this.getAccounts();
    const result: LUCAccountRecord[] = [];

    for (const data of Object.values(accounts)) {
      try {
        result.push(deserializeLUCAccount(data));
      } catch (error) {
        console.error('[LUC Server Storage] Failed to deserialize account:', error);
      }
    }

    return result;
  }

  async getOrCreateAccount(userId: string, planId: string = 'p2p'): Promise<LUCAccountRecord> {
    let account = await this.getAccount(userId);

    if (!account) {
      account = createLUCAccount(userId, planId);
      await this.saveAccount(account);
      console.log(`[LUC Server Storage] Created new account for ${userId} with plan ${planId}`);
    }

    return account;
  }

  // ─────────────────────────────────────────────────────────
  // Usage History Operations
  // ─────────────────────────────────────────────────────────
  async addUsageEntry(entry: UsageHistoryEntry): Promise<void> {
    const history = await this.getHistory();

    if (!history[entry.userId]) {
      history[entry.userId] = [];
    }

    // Add to beginning (most recent first)
    history[entry.userId].unshift(entry);

    // Keep only last 1000 entries per user
    if (history[entry.userId].length > 1000) {
      history[entry.userId] = history[entry.userId].slice(0, 1000);
    }

    await this.saveHistory(history);
  }

  async getUsageHistory(userId: string, limit: number = 100): Promise<UsageHistoryEntry[]> {
    const history = await this.getHistory();
    return (history[userId] || []).slice(0, limit);
  }

  async clearUsageHistory(userId: string): Promise<void> {
    const history = await this.getHistory();
    delete history[userId];
    await this.saveHistory(history);
  }

  // ─────────────────────────────────────────────────────────
  // Export/Import Operations
  // ─────────────────────────────────────────────────────────
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
    const importData = JSON.parse(data);

    if (importData.account) {
      const account = deserializeLUCAccount(importData.account);
      account.userId = userId; // Override with current user
      await this.saveAccount(account);
    }

    if (importData.usageHistory && Array.isArray(importData.usageHistory)) {
      const history = await this.getHistory();
      history[userId] = importData.usageHistory.map((entry: UsageHistoryEntry) => ({
        ...entry,
        userId,
      }));
      await this.saveHistory(history);
    }
  }

  // ─────────────────────────────────────────────────────────
  // CSV Export Utilities
  // ─────────────────────────────────────────────────────────

  async exportCSV(userId: string): Promise<string> {
    const [account, history] = await Promise.all([
      this.getAccount(userId),
      this.getUsageHistory(userId),
    ]);

    let csv = '=== LUC ACCOUNT EXPORT ===\n\n';

    // Account summary
    if (account) {
      csv += '--- Account Summary ---\n';
      csv += `User ID,${account.userId}\n`;
      csv += `Plan,${account.planName}\n`;
      csv += `Created,${account.createdAt.toISOString()}\n`;
      csv += `Billing Cycle Start,${account.billingCycleStart.toISOString()}\n`;
      csv += `Billing Cycle End,${account.billingCycleEnd.toISOString()}\n`;
      csv += `Total Overage Cost,$${account.totalOverageCost.toFixed(2)}\n\n`;

      // Quota summary
      csv += '--- Quota Summary ---\n';
      csv += 'Service,Used,Limit,Overage,Overage Cost,Percent Used\n';

      for (const [key, quota] of Object.entries(account.quotas)) {
        const bucket = SERVICE_BUCKETS[key as LUCServiceKey];
        const percentUsed = quota.limit > 0 ? ((quota.used / quota.limit) * 100).toFixed(1) : '0';
        const overageCost = (quota.overage * (bucket?.overageRate || 0)).toFixed(4);

        csv += `${bucket?.name || key},${quota.used},${quota.limit},${quota.overage},$${overageCost},${percentUsed}%\n`;
      }
    }

    // Usage history
    csv += '\n--- Usage History ---\n';
    csv += 'Date,Service,Type,Amount,Cost,Description\n';

    for (const entry of history) {
      csv += `${new Date(entry.timestamp).toLocaleString()},${entry.service},${entry.type},${entry.amount},$${entry.cost.toFixed(4)},${entry.description || ''}\n`;
    }

    return csv;
  }
}

// ─────────────────────────────────────────────────────────────
// Singleton Instance
// ─────────────────────────────────────────────────────────────

let serverStorageInstance: ServerStorageAdapter | null = null;

export function getServerStorage(): ServerStorageAdapter {
  if (!serverStorageInstance) {
    serverStorageInstance = new ServerStorageAdapter();
  }
  return serverStorageInstance;
}

// ─────────────────────────────────────────────────────────────
// High-Level Server Account Manager
// ─────────────────────────────────────────────────────────────

export class LUCServerAccountManager {
  private storage: ServerStorageAdapter;

  constructor(storage?: ServerStorageAdapter) {
    this.storage = storage || getServerStorage();
  }

  /**
   * Get or create account for user
   */
  async getOrCreateAccount(userId: string, planId: string = 'p2p'): Promise<LUCAccountRecord> {
    return this.storage.getOrCreateAccount(userId, planId);
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
      return this.storage.exportCSV(userId);
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

  /**
   * Get account statistics
   */
  async getAccountStats(userId: string): Promise<{
    totalUsage: number;
    totalCost: number;
    topServices: Array<{ service: string; usage: number; cost: number }>;
    usageByDay: Array<{ date: string; usage: number; cost: number }>;
  }> {
    const history = await this.storage.getUsageHistory(userId, 1000);

    const serviceStats = new Map<string, { usage: number; cost: number }>();
    const dayStats = new Map<string, { usage: number; cost: number }>();

    let totalUsage = 0;
    let totalCost = 0;

    for (const entry of history) {
      if (entry.type === 'debit') {
        totalUsage += entry.amount;
        totalCost += entry.cost;

        // Service stats
        const serviceData = serviceStats.get(entry.service) || { usage: 0, cost: 0 };
        serviceData.usage += entry.amount;
        serviceData.cost += entry.cost;
        serviceStats.set(entry.service, serviceData);

        // Day stats
        const day = entry.timestamp.split('T')[0];
        const dayData = dayStats.get(day) || { usage: 0, cost: 0 };
        dayData.usage += entry.amount;
        dayData.cost += entry.cost;
        dayStats.set(day, dayData);
      }
    }

    // Top services
    const topServices = Array.from(serviceStats.entries())
      .map(([service, data]) => ({ service, ...data }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    // Usage by day (last 30 days)
    const usageByDay = Array.from(dayStats.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    return { totalUsage, totalCost, topServices, usageByDay };
  }
}

// Export singleton manager
let serverManagerInstance: LUCServerAccountManager | null = null;

export function getLUCServerManager(): LUCServerAccountManager {
  if (!serverManagerInstance) {
    serverManagerInstance = new LUCServerAccountManager();
  }
  return serverManagerInstance;
}

export default LUCServerAccountManager;
