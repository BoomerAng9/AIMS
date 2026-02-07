/**
 * A.I.M.S. Execution Safety — Sandbox Enforcer
 *
 * Generates hardened sandbox configurations for project containers:
 * Docker security options, network policies, filesystem restrictions,
 * resource limits, seccomp profiles, and posture assessments.
 */

import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NetworkPolicy {
  egressAllowed: string[];
  ingressPorts: number[];
  denyByDefault: boolean;
}

export interface FsPolicy {
  readOnly: string[];
  readWrite: string[];
  forbidden: string[];
  maxFileSize: number;
  maxTotalSize: number;
}

export interface ResourceLimits {
  maxMemoryMb: number;
  maxCpuPercent: number;
  maxProcesses: number;
  maxOpenFiles: number;
  timeoutSeconds: number;
}

export interface SandboxConfig {
  projectName: string;
  dockerConfig: string;
  networkPolicy: NetworkPolicy;
  fsPolicy: FsPolicy;
  resourceLimits: ResourceLimits;
}

export interface SandboxCheck {
  name: string;
  passed: boolean;
  detail: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ValidationResult {
  valid: boolean;
  checks: SandboxCheck[];
}

export interface SecurityPosture {
  level: 'minimal' | 'standard' | 'hardened' | 'defense-grade';
  checks: SandboxCheck[];
  score: number;
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_EGRESS_WHITELIST: string[] = [
  'registry.npmjs.org',
  'api.github.com',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'unpkg.com',
];

const DEFAULT_INGRESS_PORTS: number[] = [3000, 8080];

const FORBIDDEN_PATHS: string[] = [
  '/etc/shadow',
  '/etc/passwd',
  '/proc',
  '/sys',
  '/dev',
  '/boot',
];

const DANGEROUS_SYSCALLS: string[] = [
  'ptrace',
  'mount',
  'umount',
  'umount2',
  'reboot',
  'kexec_load',
  'kexec_file_load',
  'init_module',
  'finit_module',
  'delete_module',
  'pivot_root',
  'swapon',
  'swapoff',
  'acct',
  'settimeofday',
  'clock_settime',
  'adjtimex',
  'nfsservctl',
  'personality',
  'unshare',
  'setns',
  'userfaultfd',
  'perf_event_open',
  'bpf',
  'lookup_dcookie',
  'keyctl',
  'request_key',
  'add_key',
  'mbind',
  'set_mempolicy',
  'move_pages',
  'ioperm',
  'iopl',
  'create_module',
  'get_kernel_syms',
  'query_module',
  'open_by_handle_at',
  'name_to_handle_at',
];

// ---------------------------------------------------------------------------
// Sandbox Enforcer
// ---------------------------------------------------------------------------

export class SandboxEnforcer {
  /**
   * Generate a full sandbox configuration for a project container.
   */
  generateSandboxConfig(projectName: string): SandboxConfig {
    logger.info({ projectName }, '[Sandbox] Generating sandbox configuration');

    const sanitizedName = projectName.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();

    const dockerConfig = this.buildDockerfile(sanitizedName);

    const networkPolicy: NetworkPolicy = {
      egressAllowed: [...DEFAULT_EGRESS_WHITELIST],
      ingressPorts: [...DEFAULT_INGRESS_PORTS],
      denyByDefault: true,
    };

    const fsPolicy: FsPolicy = {
      readOnly: ['/app/node_modules', '/app/package.json', '/app/tsconfig.json'],
      readWrite: ['/app/src', '/tmp'],
      forbidden: [...FORBIDDEN_PATHS],
      maxFileSize: 50 * 1024 * 1024,       // 50 MB
      maxTotalSize: 500 * 1024 * 1024,      // 500 MB
    };

    const resourceLimits: ResourceLimits = {
      maxMemoryMb: 512,
      maxCpuPercent: 50,
      maxProcesses: 100,
      maxOpenFiles: 1024,
      timeoutSeconds: 600,
    };

    const config: SandboxConfig = {
      projectName: sanitizedName,
      dockerConfig,
      networkPolicy,
      fsPolicy,
      resourceLimits,
    };

    logger.info({ projectName: sanitizedName }, '[Sandbox] Configuration generated');

    return config;
  }

  /**
   * Validate a sandbox configuration against security best practices.
   */
  validateSandbox(config: SandboxConfig): ValidationResult {
    logger.info({ projectName: config.projectName }, '[Sandbox] Validating sandbox configuration');

    const checks: SandboxCheck[] = [];

    // --- no-new-privileges ---
    checks.push({
      name: 'no-new-privileges',
      passed: config.dockerConfig.includes('--security-opt=no-new-privileges'),
      detail: 'Container must not gain additional privileges after start',
      severity: 'critical',
    });

    // --- capabilities dropped ---
    checks.push({
      name: 'capabilities-dropped',
      passed: config.dockerConfig.includes('--cap-drop=ALL'),
      detail: 'All Linux capabilities must be dropped',
      severity: 'critical',
    });

    // --- read-only rootfs ---
    checks.push({
      name: 'read-only-rootfs',
      passed: config.dockerConfig.includes('--read-only'),
      detail: 'Root filesystem must be mounted read-only',
      severity: 'high',
    });

    // --- network restricted ---
    checks.push({
      name: 'network-deny-by-default',
      passed: config.networkPolicy.denyByDefault === true,
      detail: 'Network policy must deny all traffic by default',
      severity: 'high',
    });

    checks.push({
      name: 'egress-whitelist-present',
      passed: config.networkPolicy.egressAllowed.length > 0 && config.networkPolicy.egressAllowed.length <= 20,
      detail: 'Egress must be restricted to a reasonable whitelist',
      severity: 'medium',
    });

    // --- filesystem boundaries ---
    checks.push({
      name: 'forbidden-paths-defined',
      passed: config.fsPolicy.forbidden.length > 0,
      detail: 'Sensitive filesystem paths must be explicitly forbidden',
      severity: 'critical',
    });

    checks.push({
      name: 'writable-paths-limited',
      passed: config.fsPolicy.readWrite.length <= 5,
      detail: 'Writable paths should be minimal',
      severity: 'medium',
    });

    checks.push({
      name: 'file-size-limit',
      passed: config.fsPolicy.maxFileSize > 0 && config.fsPolicy.maxFileSize <= 100 * 1024 * 1024,
      detail: 'Maximum file size must be capped (<=100MB)',
      severity: 'medium',
    });

    // --- resource limits ---
    checks.push({
      name: 'memory-limit',
      passed: config.resourceLimits.maxMemoryMb > 0 && config.resourceLimits.maxMemoryMb <= 4096,
      detail: 'Memory limit must be set and <= 4GB',
      severity: 'high',
    });

    checks.push({
      name: 'cpu-limit',
      passed: config.resourceLimits.maxCpuPercent > 0 && config.resourceLimits.maxCpuPercent <= 100,
      detail: 'CPU limit must be set',
      severity: 'high',
    });

    checks.push({
      name: 'process-limit',
      passed: config.resourceLimits.maxProcesses > 0 && config.resourceLimits.maxProcesses <= 500,
      detail: 'Process limit must be set and <= 500',
      severity: 'medium',
    });

    checks.push({
      name: 'timeout-set',
      passed: config.resourceLimits.timeoutSeconds > 0 && config.resourceLimits.timeoutSeconds <= 3600,
      detail: 'Execution timeout must be set and <= 1 hour',
      severity: 'medium',
    });

    const valid = checks.every(c => c.passed);

    const result: ValidationResult = { valid, checks };

    logger.info(
      { valid, passed: checks.filter(c => c.passed).length, total: checks.length },
      '[Sandbox] Validation complete',
    );

    return result;
  }

  /**
   * Generate a seccomp profile that blocks dangerous syscalls.
   */
  generateSeccompProfile(): object {
    logger.info('[Sandbox] Generating seccomp profile');

    return {
      defaultAction: 'SCMP_ACT_ALLOW',
      architectures: ['SCMP_ARCH_X86_64', 'SCMP_ARCH_AARCH64'],
      syscalls: [
        {
          names: DANGEROUS_SYSCALLS,
          action: 'SCMP_ACT_ERRNO',
          args: [],
          comment: 'Block dangerous syscalls that could escape the sandbox',
        },
      ],
    };
  }

  /**
   * Compute an overall security posture assessment.
   */
  getSecurityPosture(): SecurityPosture {
    logger.info('[Sandbox] Computing security posture');

    // Generate and validate a reference config
    const config = this.generateSandboxConfig('posture-check');
    const validation = this.validateSandbox(config);

    // Weighted scoring: critical=15, high=10, medium=5, low=2
    const SEVERITY_WEIGHTS: Record<SandboxCheck['severity'], number> = {
      critical: 15,
      high: 10,
      medium: 5,
      low: 2,
    };

    const maxScore = validation.checks.reduce(
      (acc, c) => acc + SEVERITY_WEIGHTS[c.severity],
      0,
    );
    const earnedScore = validation.checks
      .filter(c => c.passed)
      .reduce((acc, c) => acc + SEVERITY_WEIGHTS[c.severity], 0);

    const score = maxScore > 0 ? Math.round((earnedScore / maxScore) * 100) : 0;

    let level: SecurityPosture['level'];
    if (score >= 90) level = 'defense-grade';
    else if (score >= 70) level = 'hardened';
    else if (score >= 40) level = 'standard';
    else level = 'minimal';

    // Recommendations for any failed checks
    const recommendations: string[] = [];
    for (const check of validation.checks) {
      if (!check.passed) {
        recommendations.push(`[${check.severity.toUpperCase()}] ${check.name}: ${check.detail}`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('All checks passed. Consider periodic re-validation.');
    }

    const posture: SecurityPosture = {
      level,
      checks: validation.checks,
      score,
      recommendations,
    };

    logger.info(
      { level, score, checksPassed: validation.checks.filter(c => c.passed).length },
      '[Sandbox] Security posture computed',
    );

    return posture;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Build a hardened Dockerfile string with security-opt flags.
   */
  private buildDockerfile(projectName: string): string {
    return [
      `# Hardened sandbox Dockerfile for ${projectName}`,
      `# Generated by A.I.M.S. Sandbox Enforcer`,
      ``,
      `FROM node:20-alpine AS builder`,
      `WORKDIR /app`,
      `COPY package*.json ./`,
      `RUN npm ci --ignore-scripts`,
      `COPY . .`,
      `RUN npm run build`,
      ``,
      `FROM node:20-alpine`,
      `WORKDIR /app`,
      ``,
      `# Security: copy only production artifacts`,
      `COPY --from=builder /app/dist ./dist`,
      `COPY --from=builder /app/node_modules ./node_modules`,
      `COPY --from=builder /app/package.json ./package.json`,
      ``,
      `# Security: non-root user`,
      `RUN addgroup -S appgroup && adduser -S appuser -G appgroup`,
      `USER appuser`,
      ``,
      `# Health check`,
      `HEALTHCHECK --interval=30s --timeout=5s --retries=3 \\`,
      `  CMD wget -qO- http://localhost:3000/health || exit 1`,
      ``,
      `EXPOSE 3000`,
      ``,
      `# Security runtime flags (applied via docker run):`,
      `#   --security-opt=no-new-privileges`,
      `#   --read-only`,
      `#   --cap-drop=ALL`,
      `#   --cap-add=NET_BIND_SERVICE`,
      `#   --tmpfs /tmp:rw,noexec,nosuid,size=64m`,
      `#   --memory=512m`,
      `#   --cpus=0.5`,
      `#   --pids-limit=100`,
      `#   --ulimit nofile=1024:1024`,
      ``,
      `# The following labels encode security options for the A.I.M.S. deployer`,
      `LABEL aims.security.no-new-privileges="--security-opt=no-new-privileges"`,
      `LABEL aims.security.read-only="--read-only"`,
      `LABEL aims.security.cap-drop="--cap-drop=ALL"`,
      `LABEL aims.security.cap-add="--cap-add=NET_BIND_SERVICE"`,
      ``,
      `CMD ["node", "dist/index.js"]`,
    ].join('\n');
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const sandboxEnforcer = new SandboxEnforcer();
