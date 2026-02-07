/**
 * Pillar Tests — All 12 Non-Negotiable Pillars
 *
 * Tests the SOP compliance layer: requirements rigor, authorization,
 * persistence, secrets, supply chain, sandbox, security testing,
 * observability, release engineering, backup, and incident management.
 */

import { auditStore, evidenceStore } from '../db';
import { riskAssessor, definitionOfDone, acceptanceCriteria } from '../intake/requirements';
import { ownershipEnforcer } from '../auth';
import { secrets } from '../secrets';
import { supplyChain } from '../supply-chain';
import { sandboxEnforcer } from '../sandbox';
import { securityTester } from '../security';
import { alertEngine, correlationManager, metricsExporter } from '../observability';
import { releaseManager } from '../release';
import { backupManager } from '../backup';
import { incidentManager } from '../backup/incident-runbook';
import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

const RUN = Date.now().toString(36);

// ---------------------------------------------------------------------------
// Pillar 1 — Requirements Rigor
// ---------------------------------------------------------------------------
describe('Pillar 1: Requirements Rigor', () => {
  it('assesses risk with factors and mitigations', () => {
    const result = riskAssessor.assessRisk({
      complexity: 'complex',
      features: ['payments', 'user-auth', 'file-upload'],
      integrations: ['Stripe', 'SendGrid', 'AWS S3'],
      scale: 'enterprise',
    });
    expect(result.level).toBeDefined();
    expect(['low', 'medium', 'high', 'critical']).toContain(result.level);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.factors.length).toBeGreaterThan(0);
    expect(result.mitigations.length).toBeGreaterThan(0);
  });

  it('generates DoD checklists with testable items', () => {
    const spec = {
      archetype: 'saas',
      techStack: { frontend: 'Next.js', backend: 'Node.js', database: 'PostgreSQL' },
      pages: ['/', '/dashboard', '/settings'],
      apiRoutes: ['/api/auth', '/api/data'],
      dbModels: ['User', 'Setting'],
      integrations: ['Stripe'],
      estimatedFiles: 20,
      estimatedBuildTime: '2 days',
    };
    const checklist = definitionOfDone.generate(spec, 'medium');
    expect(checklist.items.length).toBeGreaterThan(0);
    expect(checklist.totalItems).toBe(checklist.items.length);
    expect(checklist.items.every(i => i.testable === true || i.testable === false)).toBe(true);
    expect(checklist.items.every(i => ['functional', 'security', 'performance', 'accessibility', 'deployment'].includes(i.category))).toBe(true);
  });

  it('generates acceptance criteria in Given/When/Then format', () => {
    const criteria = acceptanceCriteria.generate('payments', 'saas');
    expect(criteria.length).toBeGreaterThan(0);
    criteria.forEach(c => {
      expect(c.given).toBeDefined();
      expect(c.when).toBeDefined();
      expect(c.then).toBeDefined();
      expect(['must', 'should', 'could']).toContain(c.priority);
    });
  });
});

// ---------------------------------------------------------------------------
// Pillar 3 — Authorization
// ---------------------------------------------------------------------------
describe('Pillar 3: Authorization', () => {
  it('grants and checks roles', () => {
    const pid = `auth-proj-${RUN}`;
    ownershipEnforcer.grantRole(pid, 'user-a', 'admin');
    const result = ownershipEnforcer.checkProjectAccess('user-a', pid, 'deploy');
    expect(result.allowed).toBe(true);
    expect(result.role).toBe('admin');
  });

  it('denies insufficient permissions', () => {
    const pid = `auth-proj2-${RUN}`;
    ownershipEnforcer.grantRole(pid, 'user-b', 'viewer');
    const result = ownershipEnforcer.checkProjectAccess('user-b', pid, 'delete');
    expect(result.allowed).toBe(false);
  });

  it('lists roles for a project', () => {
    const pid = `auth-proj3-${RUN}`;
    ownershipEnforcer.grantRole(pid, 'user-c', 'member');
    ownershipEnforcer.grantRole(pid, 'user-d', 'admin');
    const roles = ownershipEnforcer.listRoles(pid);
    expect(roles.length).toBe(2);
  });

  it('revokes roles', () => {
    const pid = `auth-proj4-${RUN}`;
    ownershipEnforcer.grantRole(pid, 'user-e', 'admin');
    ownershipEnforcer.revokeRole(pid, 'user-e');
    const result = ownershipEnforcer.checkProjectAccess('user-e', pid, 'read');
    expect(result.allowed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Pillar 4 — Persistence (SQLite Store)
// ---------------------------------------------------------------------------
describe('Pillar 4: Persistence', () => {
  it('audit store records and retrieves entries', () => {
    expect(auditStore).toBeDefined();
    // AuditRecord has: id, actor, action, resource, resourceId, detail, createdAt
    const rec = auditStore.create({
      id: `audit-${RUN}`,
      actor: 'test-user',
      action: 'CREATE',
      resource: 'project',
      resourceId: `proj-${RUN}`,
      detail: { test: true },
      createdAt: new Date().toISOString(),
    });
    expect(auditStore.get(rec.id)).toBeDefined();
  });

  it('evidence store records and retrieves entries', () => {
    expect(evidenceStore).toBeDefined();
    evidenceStore.create({
      id: `ev-${RUN}`,
      gateId: `gate-${RUN}`,
      projectId: `proj-${RUN}`,
      type: 'test-report',
      passed: true,
      report: { tests: 10, failures: 0 },
      createdAt: new Date().toISOString(),
    });
    const found = evidenceStore.findBy(r => r.gateId === `gate-${RUN}`);
    expect(found.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Pillar 5 — Secrets Management
// ---------------------------------------------------------------------------
describe('Pillar 5: Secrets Management', () => {
  it('lists available keys', () => {
    const keys = secrets.listKeys();
    expect(Array.isArray(keys)).toBe(true);
  });

  it('validates required secrets', () => {
    const result = secrets.validateRequired();
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('missing');
    expect(result).toHaveProperty('present');
  });

  it('provides audit report', () => {
    const report = secrets.audit();
    expect(report).toHaveProperty('totalSecrets');
    expect(report).toHaveProperty('configured');
    expect(report).toHaveProperty('missing');
  });

  it('supports rotation tracking', () => {
    // Set a test secret, rotate it, verify history
    secrets.set('TEST_SECRET_PILLAR5', 'value1');
    const rotation = secrets.rotate('TEST_SECRET_PILLAR5', 'value2');
    expect(rotation.key).toBe('TEST_SECRET_PILLAR5');
    expect(rotation.rotatedAt).toBeDefined();
    const history = secrets.getRotationHistory('TEST_SECRET_PILLAR5');
    expect(history.length).toBeGreaterThanOrEqual(1);
    // Cleanup
    secrets.delete('TEST_SECRET_PILLAR5');
  });
});

// ---------------------------------------------------------------------------
// Pillar 6 — Supply Chain Security
// ---------------------------------------------------------------------------
describe('Pillar 6: Supply Chain Security', () => {
  it('generates SBOM from package.json', () => {
    const sbom = supplyChain.generateSBOM();
    expect(sbom.projectName).toBeDefined();
    expect(sbom.totalDependencies).toBeGreaterThan(0);
    expect(sbom.packages.length).toBeGreaterThan(0);
    expect(sbom.packages[0]).toHaveProperty('name');
    expect(sbom.packages[0]).toHaveProperty('version');
  });

  it('verifies lockfile', () => {
    const result = supplyChain.verifyLockfile();
    expect(result.lockfileExists).toBe(true);
    expect(result).toHaveProperty('valid');
  });

  it('generates full supply chain report', () => {
    const report = supplyChain.getReport();
    expect(report).toHaveProperty('sbom');
    expect(report).toHaveProperty('lockfile');
    expect(report).toHaveProperty('generatedAt');
  });
});

// ---------------------------------------------------------------------------
// Pillar 7 — Execution Safety
// ---------------------------------------------------------------------------
describe('Pillar 7: Execution Safety', () => {
  it('generates sandbox config with security defaults', () => {
    const config = sandboxEnforcer.generateSandboxConfig('test-project');
    expect(config.projectName).toBe('test-project');
    expect(config.dockerConfig).toContain('no-new-privileges');
    expect(config.networkPolicy.denyByDefault).toBe(true);
    expect(config.fsPolicy.forbidden.length).toBeGreaterThan(0);
    expect(config.resourceLimits.maxMemoryMb).toBeGreaterThan(0);
  });

  it('validates sandbox configuration', () => {
    const config = sandboxEnforcer.generateSandboxConfig('test-project');
    const result = sandboxEnforcer.validateSandbox(config);
    expect(result.valid).toBe(true);
    expect(result.checks.length).toBeGreaterThan(0);
  });

  it('generates seccomp profile', () => {
    const profile = sandboxEnforcer.generateSeccompProfile();
    expect(profile).toBeDefined();
    expect(typeof profile).toBe('object');
  });

  it('reports security posture', () => {
    const posture = sandboxEnforcer.getSecurityPosture();
    expect(posture.score).toBeGreaterThanOrEqual(0);
    expect(posture.score).toBeLessThanOrEqual(100);
    expect(['minimal', 'standard', 'hardened', 'defense-grade']).toContain(posture.level);
  });
});

// ---------------------------------------------------------------------------
// Pillar 9 — Security Testing
// ---------------------------------------------------------------------------
describe('Pillar 9: Security Testing', () => {
  it('runs SCA (dependency scan)', () => {
    const result = securityTester.runSCA();
    expect(result).toHaveProperty('passed');
    expect(result).toHaveProperty('vulnerabilities');
    expect(result.vulnerabilities).toHaveProperty('total');
    expect(result).toHaveProperty('timestamp');
  });
});

// ---------------------------------------------------------------------------
// Pillar 10 — Observability
// ---------------------------------------------------------------------------
describe('Pillar 10: Observability', () => {
  it('generates correlation IDs', () => {
    const id = correlationManager.generateCorrelationId();
    expect(id).toMatch(/^aims-/);
    expect(id.length).toBeGreaterThan(10);
  });

  it('records and exports metrics', () => {
    metricsExporter.record('test_metric', 42, { env: 'test' });
    metricsExporter.record('test_metric', 58, { env: 'test' });
    const snapshot = metricsExporter.exportJSON();
    expect(snapshot.metrics).toBeDefined();
  });

  it('exports Prometheus format', () => {
    metricsExporter.record('test_prom', 1);
    const text = metricsExporter.exportPrometheus();
    expect(typeof text).toBe('string');
  });

  it('evaluates alerts against thresholds', () => {
    // The default alert for response_time > 2000ms
    const events = alertEngine.evaluate('response_time', 3000);
    // May or may not fire depending on window, but the method should return an array
    expect(Array.isArray(events)).toBe(true);
  });

  it('tracks active alerts and history', () => {
    const active = alertEngine.getActiveAlerts();
    const history = alertEngine.getAlertHistory();
    expect(Array.isArray(active)).toBe(true);
    expect(Array.isArray(history)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Pillar 11 — Release Engineering
// ---------------------------------------------------------------------------
describe('Pillar 11: Release Engineering', () => {
  it('creates a release with semver validation', () => {
    const release = releaseManager.createRelease('1.0.0', 'Initial release', ['bundle.tar.gz']);
    expect(release.version).toBe('1.0.0');
    expect(release.status).toBe('draft');
    expect(release.artifacts).toContain('bundle.tar.gz');
  });

  it('manages environments', () => {
    const dev = releaseManager.getEnvironmentState('development');
    expect(dev.name).toBe('development');
    expect(['healthy', 'degraded', 'down']).toContain(dev.status);
  });

  it('promotes releases through environments', () => {
    const release = releaseManager.createRelease('1.1.0', 'Feature release', []);
    const result = releaseManager.promote(release.id, 'development', 'development');
    expect(result).toHaveProperty('success');
  });

  it('lists releases', () => {
    const releases = releaseManager.listReleases();
    expect(releases.length).toBeGreaterThanOrEqual(1);
  });

  it('manages API versions', () => {
    releaseManager.registerAPIVersion('v1', undefined);
    const versions = releaseManager.getActiveVersions();
    expect(versions.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Pillar 12 — Backup & Restore + Incidents
// ---------------------------------------------------------------------------
describe('Pillar 12: Backup & Restore', () => {
  beforeAll(() => {
    // Ensure the database file exists on disk for backup operations
    // (backup manager copies the physical file, not in-memory db)
    const dataDir = path.resolve(process.cwd(), 'data');
    const dbPath = path.resolve(dataDir, 'aims.db');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(dbPath)) {
      // Create a minimal SQLite db file for backup tests
      const db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.exec(`
        CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS plugs (id TEXT PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS deployments (id TEXT PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS audit_log (id TEXT PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS evidence (id TEXT PRIMARY KEY);
      `);
      db.close();
    }
  });

  afterAll(() => {
    // Clean up test artifacts
    const dataDir = path.resolve(process.cwd(), 'data');
    const backupDir = path.resolve(dataDir, 'backups');
    if (fs.existsSync(backupDir)) {
      fs.readdirSync(backupDir).forEach(f => {
        if (f.startsWith('aims-backup-')) {
          fs.unlinkSync(path.resolve(backupDir, f));
        }
      });
    }
  });

  it('creates and lists backups', () => {
    const backup = backupManager.createBackup();
    expect(backup.id).toBeDefined();
    expect(backup.filename).toBeDefined();
    expect(backup.integrityHash).toBeDefined();
    const list = backupManager.listBackups();
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  it('runs restore drill with checks', () => {
    // Create a backup first to drill against
    backupManager.createBackup();
    const result = backupManager.runRestoreDrill();
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('checks');
    expect(result.checks.length).toBeGreaterThan(0);
  });

  it('reports drill schedule', () => {
    const schedule = backupManager.getDrillSchedule();
    expect(schedule).toHaveProperty('cadence');
  });
});

describe('Pillar 12: Incident Management', () => {
  it('creates incidents with severity', () => {
    const incident = incidentManager.createIncident('P2', 'Test Incident', 'Testing the incident system');
    expect(incident.id).toBeDefined();
    expect(incident.severity).toBe('P2');
    expect(incident.status).toBe('open');
    expect(incident.timeline.length).toBeGreaterThanOrEqual(1);
  });

  it('updates and resolves incidents', () => {
    const incident = incidentManager.createIncident('P3', 'Minor Issue', 'Cosmetic bug');
    const updated = incidentManager.updateIncident(incident.id, { status: 'investigating' });
    expect(updated.status).toBe('investigating');
    const resolved = incidentManager.resolveIncident(incident.id, 'Fixed the issue');
    expect(resolved.status).toBe('resolved');
    expect(resolved.resolvedAt).toBeDefined();
  });

  it('provides runbooks for each severity level', () => {
    for (const sev of ['P1', 'P2', 'P3', 'P4'] as const) {
      const runbook = incidentManager.getRunbook(sev);
      expect(runbook.length).toBeGreaterThan(0);
      expect(runbook[0]).toHaveProperty('order');
      expect(runbook[0]).toHaveProperty('action');
      expect(runbook[0]).toHaveProperty('responsible');
    }
  });

  it('filters incidents by status', () => {
    incidentManager.createIncident('P4', 'Open Issue', 'Stays open');
    const open = incidentManager.listIncidents({ status: 'open' });
    expect(open.length).toBeGreaterThanOrEqual(1);
    expect(open.every(i => i.status === 'open')).toBe(true);
  });
});
