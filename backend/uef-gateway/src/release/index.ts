/**
 * A.I.M.S. Release Engineering (Pillar 11)
 *
 * Manages the full release lifecycle:
 *   - Environment promotion chain: development -> staging -> production
 *   - Semver-validated release records with approval gates
 *   - One-click rollback with automatic state swap
 *   - API version management with sunset/deprecation enforcement
 *
 * All data is held in-memory Maps. A persistence adapter (Postgres,
 * Redis, etc.) can be swapped in later.
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Environment = 'development' | 'staging' | 'production';

export type ReleaseStatus = 'draft' | 'candidate' | 'released' | 'rolled-back';

export type APIVersionStatus = 'active' | 'deprecated' | 'sunset';

export type EnvironmentHealth = 'healthy' | 'degraded' | 'down';

export interface Approval {
  approver: string;
  role: string;
  approvedAt: string;
  environment: Environment;
}

export interface ReleaseRecord {
  id: string;
  version: string;
  changelog: string;
  artifacts: string[];
  createdAt: string;
  createdBy: string;
  status: ReleaseStatus;
  deployedTo: Environment[];
  approvals: Approval[];
}

export interface EnvironmentState {
  name: Environment;
  currentRelease?: ReleaseRecord;
  previousRelease?: ReleaseRecord;
  status: EnvironmentHealth;
  lastDeployedAt?: string;
  lastDeployedBy?: string;
}

export interface PromotionCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface PromotionResult {
  success: boolean;
  releaseId: string;
  from: Environment;
  to: Environment;
  timestamp: string;
  checks: PromotionCheck[];
}

export interface RollbackResult {
  success: boolean;
  environment: Environment;
  rolledBackFrom?: ReleaseRecord;
  rolledBackTo?: ReleaseRecord;
  timestamp: string;
  reason?: string;
}

export interface APIVersion {
  version: string;
  status: APIVersionStatus;
  registeredAt: string;
  deprecationDate?: string;
  sunsetDate?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Valid promotion path — cannot skip environments. */
const PROMOTION_ORDER: Environment[] = ['development', 'staging', 'production'];

/** Semver regex (strict: x.y.z with optional pre-release/build metadata). */
const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*)?(?:\+[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*)?$/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString();
}

function isValidSemver(version: string): boolean {
  return SEMVER_REGEX.test(version);
}

// ---------------------------------------------------------------------------
// ReleaseManager
// ---------------------------------------------------------------------------

export class ReleaseManager {
  private releases: Map<string, ReleaseRecord> = new Map();
  private environments: Map<Environment, EnvironmentState> = new Map();
  private apiVersions: Map<string, APIVersion> = new Map();
  private rollbackLog: RollbackResult[] = [];
  private incidents: Set<Environment> = new Set();

  constructor() {
    // Initialize environment states
    for (const env of PROMOTION_ORDER) {
      this.environments.set(env, {
        name: env,
        status: 'healthy',
      });
    }

    logger.info('[Release] ReleaseManager initialized with 3 environments');
  }

  // -----------------------------------------------------------------------
  // Release CRUD
  // -----------------------------------------------------------------------

  /**
   * Create a new release record. Version must be valid semver.
   */
  createRelease(version: string, changelog: string, artifacts: string[]): ReleaseRecord {
    if (!isValidSemver(version)) {
      throw new Error(`Invalid semver version: "${version}". Expected format: x.y.z`);
    }

    // Check for duplicate version
    for (const release of this.releases.values()) {
      if (release.version === version && release.status !== 'rolled-back') {
        throw new Error(`Release version "${version}" already exists (id: ${release.id})`);
      }
    }

    const record: ReleaseRecord = {
      id: uuidv4(),
      version,
      changelog,
      artifacts: [...artifacts],
      createdAt: now(),
      createdBy: 'system',
      status: 'draft',
      deployedTo: [],
      approvals: [],
    };

    this.releases.set(record.id, record);

    logger.info(
      { releaseId: record.id, version },
      '[Release] Release created',
    );

    return { ...record };
  }

  /**
   * List all releases.
   */
  listReleases(): ReleaseRecord[] {
    return Array.from(this.releases.values()).map((r) => ({ ...r }));
  }

  /**
   * Get a single release by ID.
   */
  getRelease(id: string): ReleaseRecord | undefined {
    const release = this.releases.get(id);
    return release ? { ...release } : undefined;
  }

  // -----------------------------------------------------------------------
  // Promotion
  // -----------------------------------------------------------------------

  /**
   * Promote a release from one environment to the next.
   * Enforces the promotion chain: development -> staging -> production.
   */
  promote(releaseId: string, from: Environment, to: Environment): PromotionResult {
    const timestamp = now();
    const checks: PromotionCheck[] = [];

    // Check 1: Release exists
    const release = this.releases.get(releaseId);
    checks.push({
      name: 'release_exists',
      passed: !!release,
      detail: release
        ? `Release ${release.version} (${releaseId}) found`
        : `Release ${releaseId} not found`,
    });

    if (!release) {
      return { success: false, releaseId, from, to, timestamp, checks };
    }

    // Check 2: Source environment has this release
    const sourceEnv = this.environments.get(from);
    const sourceHasRelease = sourceEnv?.currentRelease?.id === releaseId;
    checks.push({
      name: 'source_env_has_release',
      passed: sourceHasRelease,
      detail: sourceHasRelease
        ? `${from} currently runs release ${releaseId}`
        : `${from} does not have release ${releaseId} deployed`,
    });

    if (!sourceHasRelease) {
      return { success: false, releaseId, from, to, timestamp, checks };
    }

    // Check 3: Cannot skip environments
    const fromIdx = PROMOTION_ORDER.indexOf(from);
    const toIdx = PROMOTION_ORDER.indexOf(to);
    const isSequential = toIdx === fromIdx + 1;
    checks.push({
      name: 'sequential_promotion',
      passed: isSequential,
      detail: isSequential
        ? `Promotion path ${from} -> ${to} is valid`
        : `Cannot promote from ${from} to ${to} — must follow dev -> staging -> production`,
    });

    if (!isSequential) {
      return { success: false, releaseId, from, to, timestamp, checks };
    }

    // Check 4: Source environment gates passed (environment is healthy)
    const sourceHealthy = sourceEnv?.status === 'healthy';
    checks.push({
      name: 'source_gates_passed',
      passed: sourceHealthy,
      detail: sourceHealthy
        ? `${from} environment is healthy`
        : `${from} environment status: ${sourceEnv?.status ?? 'unknown'} — must be healthy`,
    });

    if (!sourceHealthy) {
      return { success: false, releaseId, from, to, timestamp, checks };
    }

    // Check 5: No active incidents in target environment
    const noIncidents = !this.incidents.has(to);
    checks.push({
      name: 'no_active_incidents',
      passed: noIncidents,
      detail: noIncidents
        ? `No active incidents in ${to}`
        : `Active incident in ${to} — resolve before promoting`,
    });

    if (!noIncidents) {
      return { success: false, releaseId, from, to, timestamp, checks };
    }

    // Check 6: Production requires at least 1 approval
    if (to === 'production') {
      const hasApproval = release.approvals.some((a) => a.environment === 'staging' || a.environment === 'production');
      checks.push({
        name: 'production_approval',
        passed: hasApproval,
        detail: hasApproval
          ? `Release has ${release.approvals.length} approval(s)`
          : 'Production promotion requires at least 1 approval',
      });

      if (!hasApproval) {
        return { success: false, releaseId, from, to, timestamp, checks };
      }
    }

    // All checks passed — execute promotion
    const targetEnv = this.environments.get(to)!;
    targetEnv.previousRelease = targetEnv.currentRelease
      ? { ...targetEnv.currentRelease }
      : undefined;
    targetEnv.currentRelease = { ...release };
    targetEnv.lastDeployedAt = timestamp;
    targetEnv.lastDeployedBy = 'system';

    // Update release status
    if (to === 'production') {
      release.status = 'released';
    } else {
      release.status = 'candidate';
    }

    if (!release.deployedTo.includes(to)) {
      release.deployedTo.push(to);
    }

    logger.info(
      { releaseId, version: release.version, from, to },
      '[Release] Release promoted',
    );

    return { success: true, releaseId, from, to, timestamp, checks };
  }

  // -----------------------------------------------------------------------
  // Rollback
  // -----------------------------------------------------------------------

  /**
   * Roll back an environment to its previous release.
   */
  rollback(environment: Environment): RollbackResult {
    const timestamp = now();
    const envState = this.environments.get(environment);

    if (!envState) {
      const result: RollbackResult = {
        success: false,
        environment,
        timestamp,
        reason: `Unknown environment: ${environment}`,
      };
      logger.error({ environment }, '[Release] Rollback failed — unknown environment');
      return result;
    }

    if (!envState.previousRelease) {
      const result: RollbackResult = {
        success: false,
        environment,
        rolledBackFrom: envState.currentRelease ? { ...envState.currentRelease } : undefined,
        timestamp,
        reason: `No previous release available in ${environment} to roll back to`,
      };
      logger.warn({ environment }, '[Release] Rollback failed — no previous release');
      return result;
    }

    const rolledBackFrom = envState.currentRelease
      ? { ...envState.currentRelease }
      : undefined;
    const rolledBackTo = { ...envState.previousRelease };

    // Mark the current release as rolled-back
    if (envState.currentRelease) {
      const originalRelease = this.releases.get(envState.currentRelease.id);
      if (originalRelease) {
        originalRelease.status = 'rolled-back';
      }
    }

    // Swap releases
    envState.currentRelease = { ...envState.previousRelease };
    envState.previousRelease = rolledBackFrom;
    envState.lastDeployedAt = timestamp;
    envState.lastDeployedBy = 'system (rollback)';

    const result: RollbackResult = {
      success: true,
      environment,
      rolledBackFrom,
      rolledBackTo,
      timestamp,
    };

    this.rollbackLog.push(result);

    logger.info(
      {
        environment,
        fromVersion: rolledBackFrom?.version,
        toVersion: rolledBackTo.version,
      },
      '[Release] Rollback executed',
    );

    return result;
  }

  // -----------------------------------------------------------------------
  // Environment State
  // -----------------------------------------------------------------------

  /**
   * Get the current state of an environment.
   */
  getEnvironmentState(env: Environment): EnvironmentState {
    const state = this.environments.get(env);
    if (!state) {
      return { name: env, status: 'down' };
    }
    return {
      ...state,
      currentRelease: state.currentRelease ? { ...state.currentRelease } : undefined,
      previousRelease: state.previousRelease ? { ...state.previousRelease } : undefined,
    };
  }

  /**
   * Set an environment's health status. Used for incident tracking.
   */
  setEnvironmentHealth(env: Environment, status: EnvironmentHealth): void {
    const state = this.environments.get(env);
    if (state) {
      state.status = status;
      logger.info({ environment: env, status }, '[Release] Environment health updated');
    }
  }

  /**
   * Register an active incident for an environment.
   * Blocks promotions to this environment until resolved.
   */
  registerIncident(env: Environment): void {
    this.incidents.add(env);
    logger.warn({ environment: env }, '[Release] Incident registered');
  }

  /**
   * Resolve an active incident for an environment.
   */
  resolveIncident(env: Environment): void {
    this.incidents.delete(env);
    logger.info({ environment: env }, '[Release] Incident resolved');
  }

  // -----------------------------------------------------------------------
  // Approvals
  // -----------------------------------------------------------------------

  /**
   * Add an approval to a release for a specific environment.
   * Production requires at least 1 approval before promotion.
   */
  addApproval(releaseId: string, approver: string, role: string, environment: Environment): void {
    const release = this.releases.get(releaseId);
    if (!release) {
      throw new Error(`Release ${releaseId} not found`);
    }

    const approval: Approval = {
      approver,
      role,
      approvedAt: now(),
      environment,
    };

    release.approvals.push(approval);

    logger.info(
      { releaseId, approver, role, environment },
      '[Release] Approval added',
    );
  }

  // -----------------------------------------------------------------------
  // API Versioning
  // -----------------------------------------------------------------------

  /**
   * Register a new API version. If a deprecation date is provided,
   * the version is automatically marked as deprecated after that date,
   * and sunset 90 days later.
   */
  registerAPIVersion(version: string, deprecationDate?: string): void {
    const apiVersion: APIVersion = {
      version,
      status: 'active',
      registeredAt: now(),
      deprecationDate,
      sunsetDate: deprecationDate
        ? this.calculateSunsetDate(deprecationDate)
        : undefined,
    };

    this.apiVersions.set(version, apiVersion);

    logger.info(
      { version, deprecationDate },
      '[Release] API version registered',
    );
  }

  /**
   * Get all active (non-sunset) API versions with their current status.
   * Statuses are computed dynamically based on the current date.
   */
  getActiveVersions(): APIVersion[] {
    const today = new Date().toISOString().slice(0, 10);
    const results: APIVersion[] = [];

    for (const apiVer of this.apiVersions.values()) {
      // Compute dynamic status based on dates
      let computedStatus: APIVersionStatus = apiVer.status;

      if (apiVer.sunsetDate && today >= apiVer.sunsetDate) {
        computedStatus = 'sunset';
      } else if (apiVer.deprecationDate && today >= apiVer.deprecationDate) {
        computedStatus = 'deprecated';
      }

      // Update stored status
      apiVer.status = computedStatus;

      results.push({ ...apiVer });
    }

    return results;
  }

  /**
   * Express middleware that validates the `X-API-Version` header against
   * registered API versions. Returns 410 Gone for sunset versions.
   */
  apiVersionMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
      const requestedVersion = req.headers['x-api-version'];

      // If no version header is provided, pass through (use default/latest)
      if (!requestedVersion || typeof requestedVersion !== 'string') {
        next();
        return;
      }

      const apiVersion = this.apiVersions.get(requestedVersion);

      // Unknown version — inform the client
      if (!apiVersion) {
        res.status(400).json({
          error: `Unknown API version: ${requestedVersion}`,
          availableVersions: this.getActiveVersions()
            .filter((v) => v.status !== 'sunset')
            .map((v) => v.version),
        });
        return;
      }

      // Compute current status
      const today = new Date().toISOString().slice(0, 10);

      if (apiVersion.sunsetDate && today >= apiVersion.sunsetDate) {
        apiVersion.status = 'sunset';
      } else if (apiVersion.deprecationDate && today >= apiVersion.deprecationDate) {
        apiVersion.status = 'deprecated';
      }

      // Sunset versions return 410 Gone
      if (apiVersion.status === 'sunset') {
        res.status(410).json({
          error: `API version ${requestedVersion} has been sunset as of ${apiVersion.sunsetDate}`,
          recommendation: 'Please upgrade to a supported API version.',
          availableVersions: this.getActiveVersions()
            .filter((v) => v.status !== 'sunset')
            .map((v) => v.version),
        });
        return;
      }

      // Deprecated versions get a warning header but still work
      if (apiVersion.status === 'deprecated') {
        res.setHeader(
          'X-API-Deprecation-Warning',
          `API version ${requestedVersion} is deprecated. Sunset date: ${apiVersion.sunsetDate ?? 'TBD'}`,
        );
      }

      // Attach version info to res.locals for downstream use
      res.locals.apiVersion = requestedVersion;

      next();
    };
  }

  // -----------------------------------------------------------------------
  // Deploy helpers (for programmatic use — bypasses promotion chain)
  // -----------------------------------------------------------------------

  /**
   * Directly deploy a release to development. This is the entry point;
   * all releases start in development before being promoted.
   */
  deployToDevelopment(releaseId: string): PromotionResult {
    const timestamp = now();
    const checks: PromotionCheck[] = [];

    const release = this.releases.get(releaseId);
    checks.push({
      name: 'release_exists',
      passed: !!release,
      detail: release
        ? `Release ${release.version} (${releaseId}) found`
        : `Release ${releaseId} not found`,
    });

    if (!release) {
      return { success: false, releaseId, from: 'development', to: 'development', timestamp, checks };
    }

    const devEnv = this.environments.get('development')!;
    devEnv.previousRelease = devEnv.currentRelease
      ? { ...devEnv.currentRelease }
      : undefined;
    devEnv.currentRelease = { ...release };
    devEnv.lastDeployedAt = timestamp;
    devEnv.lastDeployedBy = 'system';

    release.status = 'candidate';
    if (!release.deployedTo.includes('development')) {
      release.deployedTo.push('development');
    }

    checks.push({
      name: 'deployed_to_development',
      passed: true,
      detail: `Release ${release.version} deployed to development`,
    });

    logger.info(
      { releaseId, version: release.version },
      '[Release] Release deployed to development',
    );

    return { success: true, releaseId, from: 'development', to: 'development', timestamp, checks };
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  /**
   * Calculate a sunset date 90 days after the deprecation date.
   */
  private calculateSunsetDate(deprecationDate: string): string {
    const date = new Date(deprecationDate);
    date.setDate(date.getDate() + 90);
    return date.toISOString().slice(0, 10);
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const releaseManager = new ReleaseManager();
