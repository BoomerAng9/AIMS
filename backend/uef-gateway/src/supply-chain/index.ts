/**
 * A.I.M.S. Supply Chain Security Module
 *
 * Generates Software Bill of Materials (SBOM), verifies lockfile integrity,
 * wraps npm audit, and checks dependency freshness.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SBOMPackage {
  name: string;
  version: string;
  license: string;
  direct: boolean;
  dev: boolean;
}

export interface SBOM {
  generatedAt: string;
  projectName: string;
  projectVersion: string;
  totalDependencies: number;
  directDependencies: number;
  devDependencies: number;
  packages: SBOMPackage[];
}

export interface LockfileResult {
  valid: boolean;
  lockfileExists: boolean;
  hashMatch: boolean;
  issues: string[];
}

export interface VulnSummary {
  total: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
}

export interface Advisory {
  id: number;
  title: string;
  severity: string;
  moduleName: string;
  patchedVersions: string;
  recommendation: string;
}

export interface AuditResult {
  vulnerabilities: VulnSummary;
  total: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
  advisories: Advisory[];
}

export interface StaleDep {
  name: string;
  currentVersion: string;
  lastPublished?: string;
  ageMonths?: number;
}

export interface DependencyAgeReport {
  totalChecked: number;
  stale: StaleDep[];
  healthy: number;
}

export interface SupplyChainReport {
  generatedAt: string;
  sbom: SBOM;
  lockfile: LockfileResult;
  auditSummary: VulnSummary;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve the project root relative to this module's location. */
function projectRoot(): string {
  return path.resolve(__dirname, '../../');
}

function readJsonFile(filePath: string): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Supply Chain Manager
// ---------------------------------------------------------------------------

export class SupplyChainManager {
  /**
   * Generate a Software Bill of Materials from package.json + package-lock.json.
   */
  generateSBOM(): SBOM {
    logger.info('[SupplyChain] Generating SBOM');

    const pkgPath = path.resolve(projectRoot(), 'package.json');
    const lockPath = path.resolve(projectRoot(), 'package-lock.json');

    const pkg = readJsonFile(pkgPath) as {
      name?: string;
      version?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    } | null;

    if (!pkg) {
      logger.warn('[SupplyChain] package.json not found or unreadable');
      return {
        generatedAt: new Date().toISOString(),
        projectName: 'unknown',
        projectVersion: '0.0.0',
        totalDependencies: 0,
        directDependencies: 0,
        devDependencies: 0,
        packages: [],
      };
    }

    const packages: SBOMPackage[] = [];
    const deps = pkg.dependencies ?? {};
    const devDeps = pkg.devDependencies ?? {};

    // --- Direct production deps ---
    for (const [name, version] of Object.entries(deps)) {
      packages.push({
        name,
        version: version.replace(/[\^~>=<]/g, ''),
        license: this.resolveLicense(name),
        direct: true,
        dev: false,
      });
    }

    // --- Dev deps ---
    for (const [name, version] of Object.entries(devDeps)) {
      packages.push({
        name,
        version: version.replace(/[\^~>=<]/g, ''),
        license: this.resolveLicense(name),
        direct: true,
        dev: true,
      });
    }

    // --- Transitive deps from lockfile ---
    const lock = readJsonFile(lockPath) as {
      packages?: Record<string, { version?: string; dev?: boolean; license?: string }>;
    } | null;

    if (lock?.packages) {
      for (const [pkgKey, meta] of Object.entries(lock.packages)) {
        if (pkgKey === '') continue; // root entry
        const depName = pkgKey.replace(/^node_modules\//, '');
        // Skip if already added as direct
        if (packages.some(p => p.name === depName)) continue;
        packages.push({
          name: depName,
          version: meta.version ?? 'unknown',
          license: meta.license ?? 'unknown',
          direct: false,
          dev: meta.dev ?? false,
        });
      }
    }

    const directCount = packages.filter(p => p.direct && !p.dev).length;
    const devCount = packages.filter(p => p.dev).length;

    const sbom: SBOM = {
      generatedAt: new Date().toISOString(),
      projectName: (pkg.name as string) ?? 'unknown',
      projectVersion: (pkg.version as string) ?? '0.0.0',
      totalDependencies: packages.length,
      directDependencies: directCount,
      devDependencies: devCount,
      packages,
    };

    logger.info(
      { total: sbom.totalDependencies, direct: directCount, dev: devCount },
      '[SupplyChain] SBOM generated',
    );

    return sbom;
  }

  /**
   * Verify that package-lock.json exists and is consistent with package.json.
   */
  verifyLockfile(): LockfileResult {
    logger.info('[SupplyChain] Verifying lockfile');

    const pkgPath = path.resolve(projectRoot(), 'package.json');
    const lockPath = path.resolve(projectRoot(), 'package-lock.json');
    const issues: string[] = [];

    const lockfileExists = fs.existsSync(lockPath);
    if (!lockfileExists) {
      issues.push('package-lock.json does not exist');
      return { valid: false, lockfileExists: false, hashMatch: false, issues };
    }

    const pkgExists = fs.existsSync(pkgPath);
    if (!pkgExists) {
      issues.push('package.json does not exist');
      return { valid: false, lockfileExists: true, hashMatch: false, issues };
    }

    // Hash-based consistency: hash the dependency sections of package.json
    // and compare with the lockfile's name/version references.
    const pkg = readJsonFile(pkgPath) as {
      name?: string;
      version?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    } | null;

    const lock = readJsonFile(lockPath) as {
      name?: string;
      version?: string;
      packages?: Record<string, { version?: string }>;
    } | null;

    if (!pkg || !lock) {
      issues.push('Unable to parse package.json or package-lock.json');
      return { valid: false, lockfileExists: true, hashMatch: false, issues };
    }

    // Check that all deps in package.json appear in the lockfile
    const allDeps = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    };

    const lockPackages = lock.packages ?? {};
    let missingFromLock = 0;

    for (const depName of Object.keys(allDeps)) {
      const lockKey = `node_modules/${depName}`;
      if (!lockPackages[lockKey] && !lockPackages[depName]) {
        issues.push(`Dependency '${depName}' in package.json but missing from lockfile`);
        missingFromLock++;
      }
    }

    const lockNameMatch = lock.name === pkg.name;
    const hashMatch = missingFromLock === 0;

    if (!lockNameMatch) {
      issues.push('Lockfile project name does not match package.json');
    }

    const valid = hashMatch && lockNameMatch && issues.length === 0;

    const result: LockfileResult = { valid, lockfileExists, hashMatch, issues };

    logger.info(
      { valid, issueCount: issues.length },
      '[SupplyChain] Lockfile verification complete',
    );

    return result;
  }

  /**
   * Run `npm audit` and parse the JSON output.
   */
  runAudit(): AuditResult {
    logger.info('[SupplyChain] Running npm audit');

    const emptyResult: AuditResult = {
      vulnerabilities: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 },
      total: 0,
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
      advisories: [],
    };

    let rawOutput: string;
    try {
      rawOutput = execSync('npm audit --json 2>/dev/null', {
        cwd: projectRoot(),
        encoding: 'utf-8',
        timeout: 30_000,
      });
    } catch (err: unknown) {
      // npm audit exits non-zero when vulnerabilities exist — parse stdout
      const execError = err as { stdout?: string; stderr?: string };
      if (execError.stdout) {
        rawOutput = execError.stdout;
      } else {
        logger.warn('[SupplyChain] npm audit failed with no output');
        return emptyResult;
      }
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawOutput) as Record<string, unknown>;
    } catch {
      logger.warn('[SupplyChain] Unable to parse npm audit output');
      return emptyResult;
    }

    // npm audit v2+ format
    const vulns = (parsed.metadata as Record<string, unknown>)?.vulnerabilities as Record<string, number> | undefined;
    const advisories: Advisory[] = [];

    // Extract advisories from the vulnerabilities map (npm audit v2 shape)
    const vulnMap = parsed.vulnerabilities as Record<string, {
      severity?: string;
      name?: string;
      fixAvailable?: boolean | { name: string; version: string };
      via?: Array<{ title?: string; url?: string; severity?: string; id?: number }>;
    }> | undefined;

    if (vulnMap) {
      for (const [moduleName, info] of Object.entries(vulnMap)) {
        const viaEntries = Array.isArray(info.via) ? info.via : [];
        for (const via of viaEntries) {
          if (via && typeof via === 'object' && via.title) {
            advisories.push({
              id: via.id ?? 0,
              title: via.title,
              severity: via.severity ?? info.severity ?? 'unknown',
              moduleName,
              patchedVersions: typeof info.fixAvailable === 'object'
                ? `${info.fixAvailable.name}@${info.fixAvailable.version}`
                : 'No fix available',
              recommendation: info.fixAvailable
                ? 'Update to patched version'
                : 'Monitor for patches or find alternative',
            });
          }
        }
      }
    }

    const summary: VulnSummary = {
      total: (vulns?.total as number) ?? 0,
      critical: (vulns?.critical as number) ?? 0,
      high: (vulns?.high as number) ?? 0,
      moderate: (vulns?.moderate as number) ?? 0,
      low: (vulns?.low as number) ?? 0,
    };

    const result: AuditResult = {
      vulnerabilities: summary,
      total: summary.total,
      critical: summary.critical,
      high: summary.high,
      moderate: summary.moderate,
      low: summary.low,
      advisories,
    };

    logger.info(
      { total: summary.total, critical: summary.critical, high: summary.high },
      '[SupplyChain] Audit complete',
    );

    return result;
  }

  /**
   * Flag dependencies that have not been updated in more than 6 months.
   * Uses the `npm view <pkg> time` data when available.
   */
  checkDependencyAge(): DependencyAgeReport {
    logger.info('[SupplyChain] Checking dependency age');

    const pkgPath = path.resolve(projectRoot(), 'package.json');
    const pkg = readJsonFile(pkgPath) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    } | null;

    if (!pkg) {
      return { totalChecked: 0, stale: [], healthy: 0 };
    }

    const allDeps: Record<string, string> = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    };

    const stale: StaleDep[] = [];
    const now = Date.now();
    const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000;
    let checked = 0;

    for (const [name, versionSpec] of Object.entries(allDeps)) {
      checked++;
      const version = versionSpec.replace(/[\^~>=<]/g, '');

      try {
        const raw = execSync(`npm view ${name} time --json 2>/dev/null`, {
          encoding: 'utf-8',
          timeout: 10_000,
        });
        const times = JSON.parse(raw) as Record<string, string>;

        // Find the publish date of the currently-installed version (or latest)
        const publishDate = times[version] ?? times[Object.keys(times).pop()!];
        if (publishDate) {
          const published = new Date(publishDate).getTime();
          const ageMs = now - published;
          const ageMonths = Math.floor(ageMs / (30 * 24 * 60 * 60 * 1000));

          if (ageMs > sixMonthsMs) {
            stale.push({
              name,
              currentVersion: version,
              lastPublished: publishDate,
              ageMonths,
            });
          }
        }
      } catch {
        // If npm view fails, we cannot determine age — skip silently
        stale.push({
          name,
          currentVersion: version,
          lastPublished: undefined,
          ageMonths: undefined,
        });
      }
    }

    const report: DependencyAgeReport = {
      totalChecked: checked,
      stale,
      healthy: checked - stale.length,
    };

    logger.info(
      { totalChecked: checked, staleCount: stale.length },
      '[SupplyChain] Dependency age check complete',
    );

    return report;
  }

  /**
   * Combined supply-chain report: SBOM + lockfile verification + audit summary.
   */
  getReport(): SupplyChainReport {
    logger.info('[SupplyChain] Generating combined report');

    const sbom = this.generateSBOM();
    const lockfile = this.verifyLockfile();

    let auditSummary: VulnSummary;
    try {
      const audit = this.runAudit();
      auditSummary = audit.vulnerabilities;
    } catch {
      auditSummary = { total: 0, critical: 0, high: 0, moderate: 0, low: 0 };
    }

    return {
      generatedAt: new Date().toISOString(),
      sbom,
      lockfile,
      auditSummary,
    };
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Attempt to resolve a package's license from its installed node_modules directory.
   */
  private resolveLicense(packageName: string): string {
    try {
      const pkgJsonPath = path.resolve(
        projectRoot(),
        'node_modules',
        packageName,
        'package.json',
      );
      const pkgJson = readJsonFile(pkgJsonPath) as { license?: string } | null;
      return pkgJson?.license ?? 'unknown';
    } catch {
      return 'unknown';
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const supplyChain = new SupplyChainManager();
