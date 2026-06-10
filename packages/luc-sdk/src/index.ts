/**
 * LUC SDK - Layered Usage Calculator
 *
 * A framework-agnostic library for usage tracking, quota gating,
 * and cost estimation across any industry.
 *
 * Originally developed for real estate, re-engineered for general use.
 *
 * Open Source: npm install @plugmein/luc-sdk
 * Hosted Version: https://luc.plugmein.cloud
 *
 * @packageDocumentation
 */

// ─────────────────────────────────────────────────────────────
// Core Engine
// ─────────────────────────────────────────────────────────────

export { LUCEngine, createAccount, createEngine } from './engine';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type {
  // Core types
  ServiceBucket,
  QuotaRecord,
  LUCAccountRecord,
  LUCPlan,
  LUCConfig,
  LUCStorageAdapter,

  // Operation results
  CanExecuteResult,
  DebitResult,
  CreditResult,
  LUCQuote,

  // Summary types
  ServiceStatus,
  ServiceSummary,
  LUCSummary,

  // Event types
  LUCEventType,
  LUCEvent,
  LUCEventHandler,
} from './types';

// ─────────────────────────────────────────────────────────────
// Presets
// ─────────────────────────────────────────────────────────────

export {
  // Configuration builders
  createConfig,
  defineService,
  definePlan,

  // Industry presets
  REAL_ESTATE_PRESET,
  SAAS_PRESET,
  AI_PLATFORM_PRESET,
  ECOMMERCE_PRESET,
  HEALTHCARE_PRESET,
  CONTENT_CREATOR_PRESET,

  // Preset types
  type RealEstateServiceKey,
  type SaaSServiceKey,
  type AIServiceKey,
  type ECommerceServiceKey,
  type HealthcareServiceKey,
  type ContentCreatorServiceKey,

  // Registry
  PRESETS,
  type PresetKey,
  getPreset,
  listPresets,
} from './presets';

// ─────────────────────────────────────────────────────────────
// Storage Adapters
// ─────────────────────────────────────────────────────────────

export {
  MemoryStorageAdapter,
  createMemoryAdapter,
} from './adapters/memory';

export {
  LocalStorageAdapter,
  createLocalStorageAdapter,
} from './adapters/local-storage';

// ─────────────────────────────────────────────────────────────
// Monetary Ledger (atomic wallet: reserve -> settle)
// ─────────────────────────────────────────────────────────────

export {
  MemoryLedgerAdapter,
  createMemoryLedgerAdapter,
} from './ledger/memory-ledger';

export type {
  WalletRecord,
  CreateWalletInput,
  ReserveResult,
  SettleResult,
  WalletBalance,
  ReservationStatus,
  ReservationRecord,
  LedgerAdapter,
} from './ledger/types';

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

export {
  // Serialization
  serializeAccount,
  deserializeAccount,

  // Import/Export
  exportAccounts,
  exportToJSON,
  importAccounts,
  importFromJSON,
  type LUCExportData,

  // CSV Export
  summaryToCSV,
  accountsToCSV,

  // Calculations
  daysRemainingInCycle,
  projectUsage,
  getUsageTrend,
  type UsageTrend,
} from './utils';

// ─────────────────────────────────────────────────────────────
// Version
// ─────────────────────────────────────────────────────────────

export const VERSION = '1.0.0';

// ─────────────────────────────────────────────────────────────
// Quick Start Helper
// ─────────────────────────────────────────────────────────────

import { LUCEngine, createAccount, createEngine } from './engine';
import { LUCConfig } from './types';
import { MemoryStorageAdapter } from './adapters/memory';

/**
 * Quick start helper - creates a fully configured LUC instance
 *
 * @example
 * ```typescript
 * import { quickStart, SAAS_PRESET } from '@plugmein/luc-sdk';
 *
 * const { engine, storage } = quickStart('user-123', 'startup', SAAS_PRESET);
 *
 * // Check if action is allowed
 * const result = engine.canExecute('api_calls', 100);
 *
 * // Debit usage after action completes
 * if (result.allowed) {
 *   engine.debit('api_calls', 100);
 * }
 *
 * // Get summary
 * const summary = engine.getSummary();
 * ```
 */
export function quickStart<K extends string>(
  accountId: string,
  planId: string,
  config: LUCConfig<K>
): {
  engine: LUCEngine<K>;
  account: ReturnType<typeof createAccount<K>>;
  storage: MemoryStorageAdapter<K>;
} {
  const storage = new MemoryStorageAdapter<K>();
  const account = createAccount(accountId, planId, config);
  const engine = createEngine(account, config);

  // Store initial account
  storage.set(account);

  return { engine, account, storage };
}

// Default export
export default LUCEngine;
