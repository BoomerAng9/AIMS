#!/usr/bin/env node
/**
 * A.I.M.S. Security Monitor
 * Continuous code monitoring for security vulnerabilities and code quality
 * 
 * Replaces Jules with local AI-powered scanning using available services
 */

const chokidar = require('chokidar');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  watchPaths: [
    'app/**/*.{ts,tsx,js,jsx}',
    'lib/**/*.{ts,tsx,js,jsx}',
    'components/**/*.{ts,tsx,js,jsx}',
    '../backend/**/*.{ts,js}',
  ],
  ignorePaths: [
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
    '**/*.test.{ts,tsx,js,jsx}',
  ],
  // Security patterns to detect
  securityPatterns: [
    { pattern: /process\.env\.\w+/g, severity: 'info', message: 'Environment variable usage' },
    { pattern: /apiKey|api_key|API_KEY/gi, severity: 'warning', message: 'Possible API key reference' },
    { pattern: /password|secret|token/gi, severity: 'warning', message: 'Sensitive data reference' },
    { pattern: /eval\s*\(/g, severity: 'critical', message: 'Dangerous eval() usage detected' },
    { pattern: /dangerouslySetInnerHTML/g, severity: 'warning', message: 'XSS risk: dangerouslySetInnerHTML' },
    { pattern: /innerHTML\s*=/g, severity: 'warning', message: 'XSS risk: innerHTML assignment' },
    { pattern: /document\.write/g, severity: 'critical', message: 'Dangerous document.write usage' },
    { pattern: /exec\s*\(|execSync\s*\(/g, severity: 'warning', message: 'Shell command execution' },
    { pattern: /http:\/\//g, severity: 'info', message: 'Non-HTTPS URL detected' },
    { pattern: /console\.(log|error|warn|debug)/g, severity: 'info', message: 'Console statement (remove for production)' },
    { pattern: /TODO|FIXME|HACK|XXX/gi, severity: 'info', message: 'Code annotation found' },
    { pattern: /catch\s*\(\s*\)\s*\{/g, severity: 'warning', message: 'Empty catch block' },
    { pattern: /any\s*[;,)]/g, severity: 'info', message: 'TypeScript "any" type usage' },
  ],
  debounceMs: 1000,
  logFile: path.join(__dirname, '..', 'security-monitor.log'),
};

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// State
let scanQueue = new Set();
let scanTimeout = null;
let totalScans = 0;
let totalIssues = 0;

/**
 * Log message with timestamp
 */
function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors.gray}[${timestamp}]${colors.reset} ${color}${message}${colors.reset}`);
}

/**
 * Log to file
 */
function logToFile(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(CONFIG.logFile, `[${timestamp}] ${message}\n`);
}

/**
 * Scan a single file for security issues
 */
function scanFile(filePath) {
  const issues = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    CONFIG.securityPatterns.forEach(({ pattern, severity, message }) => {
      lines.forEach((line, index) => {
        const matches = line.match(pattern);
        if (matches) {
          issues.push({
            file: filePath,
            line: index + 1,
            severity,
            message,
            match: matches[0],
            context: line.trim().substring(0, 80),
          });
        }
      });
    });
  } catch (error) {
    // File might be deleted or inaccessible
  }
  
  return issues;
}

/**
 * Process queued files
 */
function processQueue() {
  if (scanQueue.size === 0) return;
  
  const files = Array.from(scanQueue);
  scanQueue.clear();
  totalScans++;
  
  console.log('');
  log(`🔍 Scanning ${files.length} file(s)...`, colors.cyan);
  
  let allIssues = [];
  
  files.forEach(file => {
    const issues = scanFile(file);
    allIssues = allIssues.concat(issues);
  });
  
  // Group by severity
  const critical = allIssues.filter(i => i.severity === 'critical');
  const warnings = allIssues.filter(i => i.severity === 'warning');
  const info = allIssues.filter(i => i.severity === 'info');
  
  // Display results
  if (allIssues.length === 0) {
    log('✅ No issues detected', colors.green);
  } else {
    totalIssues += allIssues.length;
    
    if (critical.length > 0) {
      log(`🚨 CRITICAL: ${critical.length} issue(s)`, colors.red);
      critical.forEach(issue => {
        console.log(`   ${colors.red}${issue.file}:${issue.line}${colors.reset} - ${issue.message}`);
        console.log(`   ${colors.gray}→ ${issue.context}${colors.reset}`);
        logToFile(`CRITICAL: ${issue.file}:${issue.line} - ${issue.message}`);
      });
    }
    
    if (warnings.length > 0) {
      log(`⚠️  Warnings: ${warnings.length} issue(s)`, colors.yellow);
      warnings.slice(0, 5).forEach(issue => {
        console.log(`   ${colors.yellow}${path.basename(issue.file)}:${issue.line}${colors.reset} - ${issue.message}`);
      });
      if (warnings.length > 5) {
        console.log(`   ${colors.gray}... and ${warnings.length - 5} more${colors.reset}`);
      }
    }
    
    if (info.length > 0) {
      log(`ℹ️  Info: ${info.length} item(s)`, colors.blue);
    }
  }
  
  // Stats
  console.log(`${colors.gray}   Scans: ${totalScans} | Total issues found: ${totalIssues}${colors.reset}`);
}

/**
 * Queue a file for scanning
 */
function queueFile(filePath) {
  scanQueue.add(filePath);
  
  // Debounce processing
  if (scanTimeout) {
    clearTimeout(scanTimeout);
  }
  scanTimeout = setTimeout(processQueue, CONFIG.debounceMs);
}

/**
 * Main watch function
 */
function startWatching() {
  console.log('');
  console.log(`${colors.bright}${colors.cyan}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║          A.I.M.S. SECURITY MONITOR                       ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║          Continuous Code Watching Active                 ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚══════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
  log('🛡️  Security patterns loaded: ' + CONFIG.securityPatterns.length, colors.green);
  log('👁️  Watching for changes...', colors.blue);
  log('📁 Log file: ' + CONFIG.logFile, colors.gray);
  console.log('');
  log('Press Ctrl+C to stop', colors.gray);
  console.log('');
  
  // Initialize watcher
  const watcher = chokidar.watch(CONFIG.watchPaths, {
    ignored: CONFIG.ignorePaths,
    persistent: true,
    ignoreInitial: false,
    cwd: __dirname,
  });
  
  // Event handlers
  watcher
    .on('add', filePath => {
      log(`📄 New file: ${path.basename(filePath)}`, colors.gray);
      queueFile(filePath);
    })
    .on('change', filePath => {
      log(`✏️  Changed: ${path.basename(filePath)}`, colors.blue);
      queueFile(filePath);
    })
    .on('unlink', filePath => {
      log(`🗑️  Deleted: ${path.basename(filePath)}`, colors.gray);
    })
    .on('error', error => {
      log(`Error: ${error.message}`, colors.red);
    })
    .on('ready', () => {
      log('✅ Initial scan complete. Watching for changes...', colors.green);
      console.log('');
    });
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('');
    log('👋 Shutting down security monitor...', colors.yellow);
    log(`📊 Session stats: ${totalScans} scans, ${totalIssues} issues detected`, colors.cyan);
    watcher.close();
    process.exit(0);
  });
}

// Start the monitor
startWatching();
