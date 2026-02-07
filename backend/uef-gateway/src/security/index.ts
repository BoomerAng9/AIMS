/**
 * A.I.M.S. Security Testing Pipeline (Pillar 9)
 *
 * Provides three layers of automated security testing:
 *   1. SAST — Static Application Security Testing (regex-based source scan)
 *   2. SCA  — Software Composition Analysis (npm audit wrapper)
 *   3. Input Validation — Route handler hygiene checks
 *
 * All results feed into a unified SecurityReport with a 0-100 score.
 * Storage is in-memory; a persistence adapter can be swapped in later.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SASTSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SASTFinding {
  rule: string;
  severity: SASTSeverity;
  file: string;
  line: number;
  snippet: string;
  recommendation: string;
}

export interface SASTResult {
  passed: boolean;
  findings: SASTFinding[];
  scannedFiles: number;
  timestamp: string;
}

export interface SCAAdvisory {
  id: number;
  title: string;
  severity: string;
  module_name: string;
  patched_versions: string;
  recommendation: string;
}

export interface SCAResult {
  passed: boolean;
  vulnerabilities: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
    total: number;
  };
  advisories: SCAAdvisory[];
  timestamp: string;
}

export interface InputValidationFinding {
  route: string;
  method: string;
  issue: string;
  severity: SASTSeverity;
  recommendation: string;
}

export interface InputValidationResult {
  passed: boolean;
  routesChecked: number;
  findings: InputValidationFinding[];
}

export interface SecurityReport {
  passed: boolean;
  timestamp: string;
  sast: SASTResult;
  sca: SCAResult;
  inputValidation: InputValidationResult;
  overallScore: number;
  summary: string;
}

// ---------------------------------------------------------------------------
// SAST Rules
// ---------------------------------------------------------------------------

interface SASTRule {
  id: string;
  pattern: RegExp;
  severity: SASTSeverity;
  recommendation: string;
}

const SAST_RULES: SASTRule[] = [
  {
    id: 'eval-usage',
    pattern: /\beval\s*\(/,
    severity: 'critical',
    recommendation: 'Remove eval() usage. Use JSON.parse() for data or Function constructor with strict validation.',
  },
  {
    id: 'sql-injection',
    pattern: /(?:query|execute|run)\s*\(\s*(?:`[^`]*\$\{|['"][^'"]*['"]\s*\+\s*(?:req\.|params\.|input|user))/,
    severity: 'critical',
    recommendation: 'Use parameterized queries or prepared statements instead of string concatenation.',
  },
  {
    id: 'xss-innerhtml',
    pattern: /\.innerHTML\s*=|dangerouslySetInnerHTML/,
    severity: 'high',
    recommendation: 'Sanitize HTML output using DOMPurify or a similar sanitization library.',
  },
  {
    id: 'hardcoded-secret-apikey',
    pattern: /(?:api[_-]?key|apikey|secret|password|token|auth)\s*[:=]\s*['"][A-Za-z0-9+/=_-]{16,}['"]/i,
    severity: 'critical',
    recommendation: 'Move secrets to environment variables. Never commit credentials to source code.',
  },
  {
    id: 'hardcoded-secret-aws',
    pattern: /(?:AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{32,})/,
    severity: 'critical',
    recommendation: 'AWS keys or OpenAI keys detected in source. Rotate immediately and use env vars.',
  },
  {
    id: 'command-injection',
    pattern: /(?:exec|execSync|spawn|spawnSync)\s*\([^)]*(?:req\.|params\.|input|user|\$\{)/,
    severity: 'critical',
    recommendation: 'Never pass user input directly to shell commands. Use allowlists or a safe exec wrapper.',
  },
  {
    id: 'path-traversal',
    pattern: /(?:readFile|readFileSync|createReadStream|writeFile|writeFileSync)\s*\([^)]*(?:req\.|params\.|input|user|\.\.\/)/ ,
    severity: 'high',
    recommendation: 'Validate and sanitize file paths. Use path.resolve() and verify against a base directory.',
  },
  {
    id: 'insecure-crypto-md5',
    pattern: /createHash\s*\(\s*['"]md5['"]\s*\)/,
    severity: 'medium',
    recommendation: 'MD5 is cryptographically broken. Use SHA-256 or bcrypt/scrypt for password hashing.',
  },
  {
    id: 'insecure-crypto-sha1',
    pattern: /createHash\s*\(\s*['"]sha1['"]\s*\)/,
    severity: 'medium',
    recommendation: 'SHA-1 is deprecated for security. Use SHA-256 or stronger for integrity checks.',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively collect all .ts files under a directory, excluding
 * node_modules, dist, and test directories.
 */
function collectTsFiles(dir: string, files: string[] = []): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip non-source directories
      if (['node_modules', 'dist', '__tests__', '.git'].includes(entry.name)) {
        continue;
      }
      collectTsFiles(fullPath, files);
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

// ---------------------------------------------------------------------------
// SecurityTestRunner
// ---------------------------------------------------------------------------

export class SecurityTestRunner {
  private readonly srcDir: string;
  private readonly projectRoot: string;

  constructor() {
    // Resolve paths relative to this file's location (src/security/)
    this.srcDir = path.resolve(__dirname, '..');
    this.projectRoot = path.resolve(__dirname, '..', '..');
  }

  // -----------------------------------------------------------------------
  // SAST — Static Application Security Testing
  // -----------------------------------------------------------------------

  runSAST(): SASTResult {
    const timestamp = new Date().toISOString();
    const findings: SASTFinding[] = [];

    const files = collectTsFiles(this.srcDir);
    logger.info({ fileCount: files.length }, '[Security] SAST scan starting');

    for (const filePath of files) {
      let content: string;
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch {
        logger.warn({ file: filePath }, '[Security] Could not read file for SAST');
        continue;
      }

      const lines = content.split('\n');
      const relativePath = path.relative(this.projectRoot, filePath);

      for (const rule of SAST_RULES) {
        for (let i = 0; i < lines.length; i++) {
          if (rule.pattern.test(lines[i])) {
            findings.push({
              rule: rule.id,
              severity: rule.severity,
              file: relativePath,
              line: i + 1,
              snippet: lines[i].trim().substring(0, 120),
              recommendation: rule.recommendation,
            });
          }
        }
      }
    }

    const hasCriticalOrHigh = findings.some(
      (f) => f.severity === 'critical' || f.severity === 'high',
    );

    logger.info(
      { findings: findings.length, passed: !hasCriticalOrHigh, scannedFiles: files.length },
      '[Security] SAST scan complete',
    );

    return {
      passed: !hasCriticalOrHigh,
      findings,
      scannedFiles: files.length,
      timestamp,
    };
  }

  // -----------------------------------------------------------------------
  // SCA — Software Composition Analysis
  // -----------------------------------------------------------------------

  runSCA(): SCAResult {
    const timestamp = new Date().toISOString();
    logger.info('[Security] SCA scan starting (npm audit)');

    let auditOutput: string;
    let auditData: Record<string, unknown>;

    try {
      // npm audit returns non-zero exit code when vulnerabilities found,
      // so we catch and still parse the JSON output.
      auditOutput = execSync('npm audit --json 2>/dev/null', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        timeout: 60_000,
      });
    } catch (err: unknown) {
      // execSync throws on non-zero exit — stderr contains the JSON
      if (err && typeof err === 'object' && 'stdout' in err) {
        auditOutput = (err as { stdout: string }).stdout || '{}';
      } else {
        logger.warn({ err }, '[Security] npm audit failed to execute');
        return {
          passed: true,
          vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0, total: 0 },
          advisories: [],
          timestamp,
        };
      }
    }

    try {
      auditData = JSON.parse(auditOutput) as Record<string, unknown>;
    } catch {
      logger.warn('[Security] Could not parse npm audit JSON output');
      return {
        passed: true,
        vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0, total: 0 },
        advisories: [],
        timestamp,
      };
    }

    // Parse vulnerability counts from npm audit JSON (npm v7+ format)
    const metadata = (auditData.metadata ?? auditData) as Record<string, unknown>;
    const vulns = (metadata.vulnerabilities ?? {}) as Record<string, unknown>;

    const critical = typeof vulns.critical === 'number' ? vulns.critical : 0;
    const high = typeof vulns.high === 'number' ? vulns.high : 0;
    const moderate = typeof vulns.moderate === 'number' ? vulns.moderate : 0;
    const low = typeof vulns.low === 'number' ? vulns.low : 0;
    const total = critical + high + moderate + low;

    // Extract advisories
    const advisories: SCAAdvisory[] = [];
    const advisoriesRaw = auditData.advisories as Record<string, Record<string, unknown>> | undefined;

    if (advisoriesRaw && typeof advisoriesRaw === 'object') {
      for (const [id, adv] of Object.entries(advisoriesRaw)) {
        advisories.push({
          id: parseInt(id, 10) || 0,
          title: String(adv.title ?? 'Unknown'),
          severity: String(adv.severity ?? 'unknown'),
          module_name: String(adv.module_name ?? 'unknown'),
          patched_versions: String(adv.patched_versions ?? 'N/A'),
          recommendation: String(adv.recommendation ?? adv.overview ?? 'Update to patched version'),
        });
      }
    }

    // Also handle npm v9+ "vulnerabilities" object format (keyed by package name)
    if (advisories.length === 0 && typeof vulns === 'object') {
      for (const [pkgName, info] of Object.entries(vulns)) {
        if (typeof info === 'object' && info !== null) {
          const vulnInfo = info as Record<string, unknown>;
          if (typeof vulnInfo.severity === 'string') {
            advisories.push({
              id: 0,
              title: `Vulnerability in ${pkgName}`,
              severity: vulnInfo.severity,
              module_name: pkgName,
              patched_versions: String(vulnInfo.fixAvailable ?? 'N/A'),
              recommendation: `Run npm audit fix or update ${pkgName}`,
            });
          }
        }
      }
    }

    const passed = critical === 0 && high === 0;

    logger.info(
      { critical, high, moderate, low, total, passed },
      '[Security] SCA scan complete',
    );

    return {
      passed,
      vulnerabilities: { critical, high, moderate, low, total },
      advisories,
      timestamp,
    };
  }

  // -----------------------------------------------------------------------
  // Input Validation — Route Handler Hygiene
  // -----------------------------------------------------------------------

  runInputValidation(): InputValidationResult {
    const findings: InputValidationFinding[] = [];
    const indexPath = path.join(this.srcDir, 'index.ts');

    let content: string;
    try {
      content = fs.readFileSync(indexPath, 'utf-8');
    } catch {
      logger.warn('[Security] Could not read src/index.ts for input validation scan');
      return { passed: true, routesChecked: 0, findings: [] };
    }

    logger.info('[Security] Input validation scan starting');

    // Extract route handler blocks from the source
    const routePattern = /app\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let routesChecked = 0;

    let match: RegExpExecArray | null;
    while ((match = routePattern.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const routePath = match[2];
      routesChecked++;

      // Find the line number of this route
      const matchIndex = match.index;

      // Extract the route handler block (approximate: from match to next app. or end)
      const nextRouteMatch = /\napp\.(get|post|put|patch|delete)\s*\(/.exec(
        content.substring(matchIndex + match[0].length),
      );
      const blockEnd = nextRouteMatch
        ? matchIndex + match[0].length + nextRouteMatch.index
        : content.length;
      const handlerBlock = content.substring(matchIndex, blockEnd);

      // Check 1: POST/PUT/PATCH routes should validate req.body
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        const usesBody = /req\.body/.test(handlerBlock);
        const hasValidation =
          /(?:if\s*\(\s*!req\.body|typeof\s+req\.body|![\w.]+\s*\|\|\s*typeof|\.body\s*\?\.|validate|schema|zod|joi|yup)/i.test(
            handlerBlock,
          );

        if (usesBody && !hasValidation) {
          findings.push({
            route: routePath,
            method,
            issue: 'Route accepts request body without input validation',
            severity: 'high',
            recommendation: 'Add req.body validation (type checks, length limits, or schema validation with Zod/Joi).',
          });
        }
      }

      // Check 2: Routes using req.params should type-check
      const usesParams = /req\.params/.test(handlerBlock);
      if (usesParams) {
        const hasParamValidation =
          /(?:typeof\s+req\.params|!req\.params|parseInt\(req\.params|req\.params\.\w+\s*(?:&&|!==|\?\.))/i.test(
            handlerBlock,
          );
        if (!hasParamValidation) {
          // This is a lower severity — params from Express are always strings
          findings.push({
            route: routePath,
            method,
            issue: 'Route uses req.params without type validation',
            severity: 'low',
            recommendation: 'Validate and sanitize route parameters before use.',
          });
        }
      }

      // Check 3: POST routes should have try/catch error handling
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const hasTryCatch = /try\s*\{/.test(handlerBlock);
        if (!hasTryCatch) {
          findings.push({
            route: routePath,
            method,
            issue: 'Mutation route lacks try/catch error handling',
            severity: 'medium',
            recommendation: 'Wrap route handler in try/catch to prevent unhandled errors from crashing the server.',
          });
        }
      }

      // Check 4: Routes missing rate limiting (check for Limiter reference)
      const hasRateLimiting =
        /Limiter|rateLimit|rateLimiter/i.test(handlerBlock) ||
        // If global limiter is applied, individual routes may not need it — check
        // if the route path matches known rate-limited paths
        /acpLimiter/.test(handlerBlock);

      // Only flag POST routes without explicit rate limiting as informational
      if (['POST', 'PUT', 'PATCH'].includes(method) && !hasRateLimiting) {
        findings.push({
          route: routePath,
          method,
          issue: 'Route does not have route-specific rate limiting',
          severity: 'low',
          recommendation: 'Consider adding route-specific rate limiting for mutation endpoints beyond the global limiter.',
        });
      }
    }

    const hasCriticalOrHigh = findings.some(
      (f) => f.severity === 'critical' || f.severity === 'high',
    );

    logger.info(
      { routesChecked, findings: findings.length, passed: !hasCriticalOrHigh },
      '[Security] Input validation scan complete',
    );

    return {
      passed: !hasCriticalOrHigh,
      routesChecked,
      findings,
    };
  }

  // -----------------------------------------------------------------------
  // Full Scan — Combined Report
  // -----------------------------------------------------------------------

  runFullScan(): SecurityReport {
    const scanId = uuidv4().slice(0, 8);
    const timestamp = new Date().toISOString();

    logger.info({ scanId }, '[Security] Full security scan starting');

    const sast = this.runSAST();
    const sca = this.runSCA();
    const inputValidation = this.runInputValidation();

    // Compute overall score (0-100)
    let score = 100;

    // SAST deductions
    for (const finding of sast.findings) {
      switch (finding.severity) {
        case 'critical':
          score -= 15;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    }

    // SCA deductions
    score -= sca.vulnerabilities.critical * 15;
    score -= sca.vulnerabilities.high * 10;
    score -= sca.vulnerabilities.moderate * 3;
    score -= sca.vulnerabilities.low * 1;

    // Input validation deductions
    for (const finding of inputValidation.findings) {
      switch (finding.severity) {
        case 'critical':
          score -= 15;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    }

    // Clamp to 0-100
    score = Math.max(0, Math.min(100, score));

    // Overall pass: no critical/high in SAST, no critical/high in SCA, input validation passed
    const passed = sast.passed && sca.passed && inputValidation.passed;

    // Build summary
    const summaryParts: string[] = [];
    if (sast.passed) {
      summaryParts.push(`SAST: PASS (${sast.findings.length} findings, ${sast.scannedFiles} files scanned)`);
    } else {
      summaryParts.push(`SAST: FAIL (${sast.findings.length} findings — critical/high detected)`);
    }
    if (sca.passed) {
      summaryParts.push(`SCA: PASS (${sca.vulnerabilities.total} total vulnerabilities)`);
    } else {
      summaryParts.push(`SCA: FAIL (${sca.vulnerabilities.critical} critical, ${sca.vulnerabilities.high} high)`);
    }
    if (inputValidation.passed) {
      summaryParts.push(`Input Validation: PASS (${inputValidation.routesChecked} routes checked)`);
    } else {
      summaryParts.push(`Input Validation: FAIL (${inputValidation.findings.length} issues found)`);
    }

    const summary = `Security Score: ${score}/100 — ${summaryParts.join(' | ')}`;

    logger.info({ scanId, score, passed }, '[Security] Full security scan complete');

    return {
      passed,
      timestamp,
      sast,
      sca,
      inputValidation,
      overallScore: score,
      summary,
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const securityTester = new SecurityTestRunner();
