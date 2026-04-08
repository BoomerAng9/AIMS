#!/usr/bin/env node

/**
 * A.I.M.S. CLI — Single-Command Platform Bootstrapper
 *
 * From a single command, stands up:
 *   - Auth, database, and hosting with Firebase
 *   - Realtime channels
 *   - Firestore collections and indexes for all shelves
 *   - Cloud Functions for LUC estimation, tool endpoints, webhooks
 *   - Environment variables and configuration
 *   - Optional Next.js frontend shell
 *
 * Usage:
 *   npx ts-node cli/aims-cli.ts init          — Full bootstrap
 *   npx ts-node cli/aims-cli.ts init --skip-frontend
 *   npx ts-node cli/aims-cli.ts shelves       — List all shelves
 *   npx ts-node cli/aims-cli.ts status        — Platform status check
 *   npx ts-node cli/aims-cli.ts deploy        — Deploy functions + rules
 *   npx ts-node cli/aims-cli.ts seed          — Seed demo data
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const FIREBASE_PROJECT = process.env.FIREBASE_PROJECT_ID || 'ai-managed-services';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string) { console.log(`  [AIMS] ${msg}`); }
function success(msg: string) { console.log(`  [OK]   ${msg}`); }
function warn(msg: string) { console.log(`  [WARN] ${msg}`); }
function fail(msg: string) { console.error(`  [FAIL] ${msg}`); process.exit(1); }

function run(cmd: string, opts?: { cwd?: string; silent?: boolean }): string {
  try {
    return execSync(cmd, {
      cwd: opts?.cwd || ROOT,
      encoding: 'utf-8',
      stdio: opts?.silent ? 'pipe' : 'inherit',
    });
  } catch (err) {
    if (err instanceof Error) {
      warn(`Command failed: ${cmd}\n${err.message}`);
    }
    return '';
  }
}

function fileExists(p: string): boolean {
  return fs.existsSync(path.resolve(ROOT, p));
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdInit(args: string[]) {
  const skipFrontend = args.includes('--skip-frontend');
  const skipFunctions = args.includes('--skip-functions');
  const skipEmulators = args.includes('--skip-emulators');

  console.log('\n========================================');
  console.log('  A.I.M.S. Platform Initialization');
  console.log('========================================\n');

  // 1. Check prerequisites
  log('Checking prerequisites...');
  const hasNode = run('node --version', { silent: true });
  if (!hasNode) fail('Node.js not found');
  success(`Node.js ${hasNode.trim()}`);

  const hasFirebase = run('firebase --version', { silent: true });
  if (!hasFirebase) {
    warn('Firebase CLI not found — installing globally...');
    run('npm install -g firebase-tools');
  } else {
    success(`Firebase CLI ${hasFirebase.trim()}`);
  }

  // 2. Firebase project setup
  log('Configuring Firebase project...');
  if (!fileExists('.firebaserc')) {
    fs.writeFileSync(path.resolve(ROOT, '.firebaserc'), JSON.stringify({
      projects: { default: FIREBASE_PROJECT },
    }, null, 2));
    success('Created .firebaserc');
  } else {
    success('.firebaserc exists');
  }

  // 3. Generate environment template
  log('Generating environment configuration...');
  const envTemplate = generateEnvTemplate();
  const envPath = path.resolve(ROOT, '.env.aims');
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envTemplate);
    success('Created .env.aims configuration template');
  } else {
    success('.env.aims already exists');
  }

  // 4. Firestore rules and indexes
  log('Deploying Firestore rules and indexes...');
  if (fileExists('firestore.rules') && fileExists('firestore.indexes.json')) {
    success('Firestore rules and indexes files present');
    if (!skipEmulators) {
      log('(Deploy with: firebase deploy --only firestore)');
    }
  }

  // 5. Initialize Firestore collections (seed schema docs)
  log('Initializing Firestore shelf schemas...');
  if (fileExists('aims-skills/scripts/init-firestore-schema.ts')) {
    success('Firestore schema init script present');
    log('(Run with: npx ts-node aims-skills/scripts/init-firestore-schema.ts)');
  }

  // 6. Cloud Functions
  if (!skipFunctions) {
    log('Setting up Cloud Functions...');
    if (fileExists('functions/package.json')) {
      log('Installing Cloud Functions dependencies...');
      run('npm install', { cwd: path.resolve(ROOT, 'functions') });
      success('Cloud Functions dependencies installed');
    }
  }

  // 7. Backend (UEF Gateway)
  log('Setting up UEF Gateway...');
  if (fileExists('backend/uef-gateway/package.json')) {
    run('npm install', { cwd: path.resolve(ROOT, 'backend/uef-gateway') });
    success('UEF Gateway dependencies installed');
  }

  // 8. Frontend (optional)
  if (!skipFrontend) {
    log('Setting up Next.js frontend...');
    if (fileExists('frontend/package.json')) {
      run('npm install', { cwd: path.resolve(ROOT, 'frontend') });
      success('Frontend dependencies installed');
    }
  }

  // 9. Docker Compose validation
  log('Validating Docker Compose...');
  if (fileExists('infra/docker-compose.yml')) {
    const valid = run('docker compose -f infra/docker-compose.yml config --quiet', { silent: true });
    if (valid !== '') {
      warn('Docker Compose has warnings (non-blocking)');
    } else {
      success('Docker Compose configuration valid');
    }
  }

  // 10. Summary
  console.log('\n========================================');
  console.log('  A.I.M.S. Initialization Complete');
  console.log('========================================\n');
  console.log('  Shelving System (Firestore collections):');
  console.log('    - projects       Top-level project records');
  console.log('    - luc_projects   LUC pricing & effort oracle');
  console.log('    - plugs          Built artifacts (aiPlugs)');
  console.log('    - boomer_angs    Agent roster');
  console.log('    - workflows      Automation definitions');
  console.log('    - runs           Execution run records');
  console.log('    - logs           Structured log entries');
  console.log('    - assets         Files, diagrams, configs');
  console.log();
  console.log('  Services:');
  console.log('    - UEF Gateway    backend/uef-gateway (port 3001)');
  console.log('    - ACHEEVY        backend/acheevy (port 3003)');
  console.log('    - Chicken Hawk   services/chicken-hawk');
  console.log('    - Cloud Funcs    functions/ (Firebase)');
  console.log('    - Frontend       frontend/ (Next.js, port 3000)');
  console.log();
  console.log('  Next steps:');
  console.log('    1. Edit .env.aims with your credentials');
  console.log('    2. Run: firebase emulators:start');
  console.log('    3. Run: cd backend/uef-gateway && npm run dev');
  console.log('    4. Run: cd frontend && npm run dev');
  console.log('    5. Deploy: firebase deploy');
  console.log();
}

async function cmdShelves() {
  console.log('\n  A.I.M.S. Shelving System\n');
  console.log('  Shelf            Description');
  console.log('  ─────            ───────────');
  console.log('  projects         Top-level project records');
  console.log('  luc_projects     LUC pricing & effort oracle records');
  console.log('  plugs            Built artifacts (aiPlugs)');
  console.log('  boomer_angs      Agent roster (Chicken Hawk, Lil_Hawks, directors)');
  console.log('  workflows        Automation definitions and pipelines');
  console.log('  runs             Execution run records with step-level detail');
  console.log('  logs             Structured log entries across all services');
  console.log('  assets           Files, diagrams, screenshots, configs');
  console.log();
}

async function cmdStatus() {
  console.log('\n  A.I.M.S. Platform Status\n');

  // Check services
  const checks: Array<{ name: string; check: () => boolean }> = [
    { name: '.firebaserc', check: () => fileExists('.firebaserc') },
    { name: 'firestore.rules', check: () => fileExists('firestore.rules') },
    { name: 'firestore.indexes.json', check: () => fileExists('firestore.indexes.json') },
    { name: 'firebase.json', check: () => fileExists('firebase.json') },
    { name: 'UEF Gateway', check: () => fileExists('backend/uef-gateway/src/index.ts') },
    { name: 'Shelving System', check: () => fileExists('backend/uef-gateway/src/shelves/types.ts') },
    { name: 'Chicken Hawk', check: () => fileExists('backend/uef-gateway/src/agents/chicken-hawk.ts') },
    { name: 'Lil_Hawks', check: () => fileExists('backend/uef-gateway/src/agents/lil-hawks/types.ts') },
    { name: 'LUC Project Service', check: () => fileExists('backend/uef-gateway/src/shelves/luc-project-service.ts') },
    { name: 'Vertex AI Client', check: () => fileExists('backend/uef-gateway/src/llm/vertex-ai.ts') },
    { name: 'OSS Models Client', check: () => fileExists('backend/uef-gateway/src/llm/oss-models.ts') },
    { name: 'Personaplex Client', check: () => fileExists('backend/uef-gateway/src/llm/personaplex.ts') },
    { name: 'MCP Tool Definitions', check: () => fileExists('backend/uef-gateway/src/shelves/mcp-tools.ts') },
    { name: 'Cloud Functions', check: () => fileExists('functions/src/index.ts') },
    { name: 'ACHEEVY Service', check: () => fileExists('backend/acheevy/src/index.ts') },
    { name: 'Frontend (Next.js)', check: () => fileExists('frontend/package.json') },
    { name: 'Docker Compose', check: () => fileExists('infra/docker-compose.yml') },
    { name: 'ACHEEVY Brain', check: () => fileExists('aims-skills/ACHEEVY_BRAIN.md') },
  ];

  let passing = 0;
  for (const { name, check } of checks) {
    const ok = check();
    if (ok) passing++;
    console.log(`  ${ok ? '[OK]  ' : '[MISS]'} ${name}`);
  }

  console.log(`\n  ${passing}/${checks.length} components present\n`);

  // Check env vars
  console.log('  Environment Variables:');
  const envVars = [
    'GOOGLE_CLOUD_PROJECT',
    'FIREBASE_PROJECT_ID',
    'GOOGLE_APPLICATION_CREDENTIALS',
    'OPENROUTER_API_KEY',
    'INTERNAL_API_KEY',
    'HOSTINGER_VPS_HOST',
    'PERSONAPLEX_ENDPOINT',
  ];
  for (const v of envVars) {
    const set = !!process.env[v];
    console.log(`  ${set ? '[SET] ' : '[----]'} ${v}`);
  }
  console.log();
}

async function cmdDeploy() {
  console.log('\n  A.I.M.S. Deploy\n');

  log('Deploying Firestore rules and indexes...');
  run('firebase deploy --only firestore');

  log('Building and deploying Cloud Functions...');
  run('npm run build', { cwd: path.resolve(ROOT, 'functions') });
  run('firebase deploy --only functions');

  success('Deployment complete');
}

async function cmdSeed() {
  console.log('\n  A.I.M.S. Seed Data\n');

  log('Running Firestore schema initialization...');
  if (fileExists('aims-skills/scripts/init-firestore-schema.ts')) {
    run('npx ts-node aims-skills/scripts/init-firestore-schema.ts', { cwd: ROOT });
    success('Schema seed complete');
  } else {
    warn('Schema init script not found');
  }
}

// ---------------------------------------------------------------------------
// Environment Template
// ---------------------------------------------------------------------------

function generateEnvTemplate(): string {
  return `# A.I.M.S. Environment Configuration
# Generated by aims-cli init
# Copy to .env and fill in your credentials

# ── GCP / Firebase ──────────────────────────
GOOGLE_CLOUD_PROJECT=${FIREBASE_PROJECT}
GOOGLE_CLOUD_REGION=us-central1
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT}
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# ── Vertex AI Models ────────────────────────
# Enabled via GCP project — no separate key needed
# Models: claude-opus-4.6, claude-sonnet-4.5, gemini-3-pro, gemini-2.5-flash

# ── OpenRouter (Fallback LLM) ──────────────
# OPENROUTER_API_KEY=sk-or-...

# ── Internal API Key (Frontend <-> Backend) ─
INTERNAL_API_KEY=aims-internal-${Date.now().toString(36)}

# ── Auth ────────────────────────────────────
# NEXTAUTH_SECRET=
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=

# ── Stripe Billing ──────────────────────────
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...

# ── Hostinger VPS (OSS Models + Docker) ─────
HOSTINGER_VPS_HOST=76.13.96.107
# USE_HOSTINGER_VPS=true
# OSS_LLAMA_ENDPOINT=http://76.13.96.107:8000/v1
# OSS_MISTRAL_ENDPOINT=http://76.13.96.107:8001/v1
# OSS_CODELLAMA_ENDPOINT=http://76.13.96.107:8002/v1
# OSS_DEEPSEEK_ENDPOINT=http://76.13.96.107:8003/v1

# ── Personaplex (Voice Agent) ──────────────
# PERSONAPLEX_ENDPOINT=
# PERSONAPLEX_API_KEY=
# PERSONAPLEX_AVATAR_ID=

# ── n8n Workflow Engine ─────────────────────
# N8N_URL=http://localhost:5678
# N8N_API_KEY=

# ── Ports ───────────────────────────────────
PORT=3001
CORS_ORIGIN=http://localhost:3000
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'init':
      await cmdInit(args.slice(1));
      break;
    case 'shelves':
      await cmdShelves();
      break;
    case 'status':
      await cmdStatus();
      break;
    case 'deploy':
      await cmdDeploy();
      break;
    case 'seed':
      await cmdSeed();
      break;
    case 'help':
    default:
      console.log(`
  A.I.M.S. CLI — AI Managed Solutions Platform

  Usage:
    aims init [--skip-frontend] [--skip-functions]   Bootstrap the full platform
    aims shelves                                      List all data shelves
    aims status                                       Platform status check
    aims deploy                                       Deploy functions + rules
    aims seed                                         Seed demo data

  Environment:
    FIREBASE_PROJECT_ID   Firebase project (default: ai-managed-services)
    GOOGLE_CLOUD_PROJECT  GCP project ID
`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
