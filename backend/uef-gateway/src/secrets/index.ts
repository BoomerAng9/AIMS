/**
 * A.I.M.S. Secrets Manager — Pillar 5
 *
 * Pluggable secrets management with a default environment-variable backend.
 * Provides rotation tracking, audit reporting, scoped access, and an
 * interface for future vault backends (AWS Secrets Manager, HashiCorp Vault).
 *
 * Singleton export: `secrets`
 */

import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RotationRecord {
  key: string;
  rotatedAt: string;
  rotatedBy: string;
  /** First 4 characters of the previous value (for audit trail). */
  previousKeyPrefix: string;
}

export interface SecretAuditReport {
  totalSecrets: number;
  configured: string[];
  missing: string[];
  /** Secrets older than 90 days without rotation. */
  stale: string[];
  rotationHistory: RotationRecord[];
}

export interface ValidationResult {
  valid: boolean;
  present: string[];
  missing: string[];
}

// ---------------------------------------------------------------------------
// Secret Backend Interface
// ---------------------------------------------------------------------------

/**
 * Pluggable backend interface. Implement this to wire up AWS Secrets Manager,
 * HashiCorp Vault, GCP Secret Manager, or any other provider.
 */
export interface SecretBackend {
  name: string;
  get(key: string): string | undefined;
  has(key: string): boolean;
  set(key: string, value: string): void;
  delete(key: string): void;
  listKeys(): string[];
}

// ---------------------------------------------------------------------------
// Environment Variable Backend (Default)
// ---------------------------------------------------------------------------

export class EnvBackend implements SecretBackend {
  readonly name = 'env';

  get(key: string): string | undefined {
    return process.env[key];
  }

  has(key: string): boolean {
    return process.env[key] !== undefined && process.env[key] !== '';
  }

  set(key: string, value: string): void {
    process.env[key] = value;
  }

  delete(key: string): void {
    delete process.env[key];
  }

  listKeys(): string[] {
    return Object.keys(process.env).filter(
      (k) => process.env[k] !== undefined && process.env[k] !== '',
    );
  }
}

// ---------------------------------------------------------------------------
// Required Secrets Registry
// ---------------------------------------------------------------------------

const REQUIRED_SECRETS: string[] = [
  'INTERNAL_API_KEY',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'OPENROUTER_API_KEY',
  'DATABASE_URL',
];

// ---------------------------------------------------------------------------
// Scoped Secrets Manager
// ---------------------------------------------------------------------------

/**
 * A restricted view of SecretsManager that only allows access to keys
 * matching a specific prefix (e.g. "STRIPE_" or "GOOGLE_").
 */
export class ScopedSecretsManager {
  private readonly manager: SecretsManager;
  private readonly scope: string;

  constructor(manager: SecretsManager, scope: string) {
    this.manager = manager;
    this.scope = scope;
  }

  private assertScope(key: string): void {
    if (!key.startsWith(this.scope)) {
      throw new Error(
        `Access denied: key "${key}" is outside scope "${this.scope}"`,
      );
    }
  }

  get(key: string): string | undefined {
    this.assertScope(key);
    return this.manager.get(key);
  }

  has(key: string): boolean {
    this.assertScope(key);
    return this.manager.has(key);
  }

  set(key: string, value: string): void {
    this.assertScope(key);
    this.manager.set(key, value);
  }

  delete(key: string): void {
    this.assertScope(key);
    this.manager.delete(key);
  }

  listKeys(): string[] {
    return this.manager.listKeys().filter((k) => k.startsWith(this.scope));
  }
}

// ---------------------------------------------------------------------------
// Secrets Manager
// ---------------------------------------------------------------------------

export class SecretsManager {
  private readonly backend: SecretBackend;
  private readonly rotationHistory: RotationRecord[] = [];
  private readonly setTimestamps: Map<string, string> = new Map();

  constructor(backend?: SecretBackend) {
    this.backend = backend ?? new EnvBackend();
    logger.info(
      { backend: this.backend.name },
      '[Secrets] Manager initialized',
    );
  }

  // ---- Core Operations ----

  /** Retrieve a secret value by key. */
  get(key: string): string | undefined {
    return this.backend.get(key);
  }

  /** Check whether a secret exists and is non-empty. */
  has(key: string): boolean {
    return this.backend.has(key);
  }

  /** Store a secret value. For the env backend this writes to process.env. */
  set(key: string, value: string): void {
    this.backend.set(key, value);
    this.setTimestamps.set(key, new Date().toISOString());
    logger.info({ key }, '[Secrets] Secret set');
  }

  /** Remove a secret. */
  delete(key: string): void {
    this.backend.delete(key);
    this.setTimestamps.delete(key);
    logger.info({ key }, '[Secrets] Secret deleted');
  }

  // ---- Rotation ----

  /**
   * Rotate a secret: replace the current value with `newValue`.
   * Records the rotation for audit trail (stores first 4 chars of old value).
   */
  rotate(key: string, newValue: string, rotatedBy: string = 'system'): RotationRecord {
    const oldValue = this.backend.get(key) ?? '';
    const previousKeyPrefix = oldValue.substring(0, 4);

    this.backend.set(key, newValue);
    this.setTimestamps.set(key, new Date().toISOString());

    const record: RotationRecord = {
      key,
      rotatedAt: new Date().toISOString(),
      rotatedBy,
      previousKeyPrefix,
    };

    this.rotationHistory.push(record);
    logger.info(
      { key, rotatedBy, prefix: previousKeyPrefix },
      '[Secrets] Secret rotated',
    );

    return record;
  }

  /** Return the full rotation history for a specific key. */
  getRotationHistory(key: string): RotationRecord[] {
    return this.rotationHistory.filter((r) => r.key === key);
  }

  // ---- Listing ----

  /** List all available secret key names (never values). */
  listKeys(): string[] {
    return this.backend.listKeys();
  }

  // ---- Validation ----

  /**
   * Validate that all required secrets are present and non-empty.
   * Returns which are present and which are missing.
   */
  validateRequired(): ValidationResult {
    const present: string[] = [];
    const missing: string[] = [];

    for (const key of REQUIRED_SECRETS) {
      if (this.backend.has(key)) {
        present.push(key);
      } else {
        missing.push(key);
      }
    }

    const valid = missing.length === 0;

    if (!valid) {
      logger.warn(
        { missing, count: missing.length },
        '[Secrets] Required secrets validation failed',
      );
    } else {
      logger.info('[Secrets] All required secrets present');
    }

    return { valid, present, missing };
  }

  // ---- Audit ----

  /**
   * Produce a full audit report: which secrets exist, which are missing,
   * which are stale (>90 days without rotation), and full rotation history.
   */
  audit(): SecretAuditReport {
    const now = Date.now();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

    const configured: string[] = [];
    const missing: string[] = [];
    const stale: string[] = [];

    for (const key of REQUIRED_SECRETS) {
      if (this.backend.has(key)) {
        configured.push(key);

        // Check staleness: was it set or rotated within 90 days?
        const lastRotation = this.rotationHistory
          .filter((r) => r.key === key)
          .sort((a, b) => new Date(b.rotatedAt).getTime() - new Date(a.rotatedAt).getTime())[0];

        const setTime = this.setTimestamps.get(key);
        const lastTouched = lastRotation
          ? new Date(lastRotation.rotatedAt).getTime()
          : setTime
            ? new Date(setTime).getTime()
            : 0;

        if (lastTouched === 0 || now - lastTouched > ninetyDaysMs) {
          stale.push(key);
        }
      } else {
        missing.push(key);
      }
    }

    return {
      totalSecrets: configured.length,
      configured,
      missing,
      stale,
      rotationHistory: [...this.rotationHistory],
    };
  }

  // ---- Scoped Access ----

  /**
   * Returns a ScopedSecretsManager that restricts access to keys
   * matching the given prefix (e.g. "STRIPE_", "GOOGLE_").
   */
  getScopedManager(scope: string): ScopedSecretsManager {
    return new ScopedSecretsManager(this, scope);
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const secrets = new SecretsManager();
