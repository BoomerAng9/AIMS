#!/usr/bin/env node

/**
 * deploy-n8n-workflows.mjs — Deploy AIMS workflows to the n8n instance
 *
 * Reads workflow JSON files from infra/n8n/workflows/ and deploys them
 * to the n8n VPS instance via the n8n REST API.
 *
 * Usage:
 *   node scripts/deploy-n8n-workflows.mjs
 *   node scripts/deploy-n8n-workflows.mjs --activate
 *   node scripts/deploy-n8n-workflows.mjs --host http://n8n:5678
 *   node scripts/deploy-n8n-workflows.mjs --dry-run
 *
 * Environment:
 *   N8N_HOST     — n8n instance URL (default: http://n8n:5678)
 *   N8N_API_KEY  — n8n API key (required for deployment)
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const WORKFLOWS_DIR = resolve(import.meta.dirname || '.', '../infra/n8n/workflows');
const DEFAULT_HOST = process.env.N8N_HOST || 'http://n8n:5678';
const API_KEY = process.env.N8N_API_KEY || '';

// ---------------------------------------------------------------------------
// CLI Args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const flags = {
  activate: args.includes('--activate'),
  dryRun: args.includes('--dry-run'),
  host: (() => {
    const idx = args.indexOf('--host');
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : DEFAULT_HOST;
  })(),
  help: args.includes('--help') || args.includes('-h'),
};

if (flags.help) {
  console.log(`
  deploy-n8n-workflows.mjs — Deploy AIMS workflows to n8n

  Usage:
    node scripts/deploy-n8n-workflows.mjs [options]

  Options:
    --activate     Activate workflows after deployment
    --dry-run      Print what would be deployed without executing
    --host <url>   n8n instance URL (default: ${DEFAULT_HOST})
    --help, -h     Show this help

  Environment:
    N8N_HOST       n8n instance URL
    N8N_API_KEY    n8n API key (required for deployment)
  `);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// n8n API Helpers
// ---------------------------------------------------------------------------

async function apiRequest(path, method = 'GET', body = null) {
  const url = `${flags.host}/api/v1${path}`;
  const headers = {
    'Content-Type': 'application/json',
  };

  if (API_KEY) {
    headers['X-N8N-API-KEY'] = API_KEY;
  }

  const opts = { method, headers };
  if (body) {
    opts.body = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  opts.signal = controller.signal;

  try {
    const res = await fetch(url, opts);
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function listWorkflows() {
  const data = await apiRequest('/workflows');
  return data.data || [];
}

async function createWorkflow(workflow) {
  return await apiRequest('/workflows', 'POST', workflow);
}

async function updateWorkflow(id, workflow) {
  return await apiRequest(`/workflows/${id}`, 'PATCH', workflow);
}

async function activateWorkflow(id) {
  return await apiRequest(`/workflows/${id}/activate`, 'POST');
}

async function healthCheck() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${flags.host}/healthz`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Deploy Logic
// ---------------------------------------------------------------------------

async function deploy() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   AIMS n8n Workflow Deployer                    ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log();
  console.log(`  Host:      ${flags.host}`);
  console.log(`  API Key:   ${API_KEY ? '****' + API_KEY.slice(-4) : '(not set)'}`);
  console.log(`  Activate:  ${flags.activate}`);
  console.log(`  Dry Run:   ${flags.dryRun}`);
  console.log(`  Directory: ${WORKFLOWS_DIR}`);
  console.log();

  // 1. Read workflow files
  let files;
  try {
    files = await readdir(WORKFLOWS_DIR);
  } catch (err) {
    console.error(`❌ Cannot read workflows directory: ${WORKFLOWS_DIR}`);
    console.error(`   ${err.message}`);
    process.exit(1);
  }

  const jsonFiles = files.filter(f => f.endsWith('.json'));
  if (jsonFiles.length === 0) {
    console.log('⚠️  No workflow JSON files found.');
    process.exit(0);
  }

  console.log(`📁 Found ${jsonFiles.length} workflow file(s):`);
  for (const f of jsonFiles) {
    console.log(`   • ${f}`);
  }
  console.log();

  // 2. Parse each workflow
  const workflows = [];
  for (const file of jsonFiles) {
    try {
      const content = await readFile(join(WORKFLOWS_DIR, file), 'utf-8');
      const parsed = JSON.parse(content);
      workflows.push({ file, data: parsed });
      console.log(`✅ Parsed: ${file} → "${parsed.name || 'unnamed'}"`);
    } catch (err) {
      console.error(`❌ Failed to parse ${file}: ${err.message}`);
    }
  }

  if (workflows.length === 0) {
    console.error('❌ No valid workflows to deploy.');
    process.exit(1);
  }

  if (flags.dryRun) {
    console.log();
    console.log('🔍 DRY RUN — would deploy:');
    for (const wf of workflows) {
      console.log(`   • ${wf.data.name} (${wf.data.nodes?.length || 0} nodes)`);
    }
    process.exit(0);
  }

  // 3. Check n8n health
  if (!API_KEY) {
    console.error('❌ N8N_API_KEY is required for deployment. Set it in your environment.');
    process.exit(1);
  }

  console.log();
  console.log('🔗 Checking n8n health...');
  const healthy = await healthCheck();
  if (!healthy) {
    console.error(`❌ n8n is not reachable at ${flags.host}`);
    console.error('   Is n8n running? Try: docker compose -f infra/docker-compose.prod.yml --profile n8n up -d');
    process.exit(1);
  }
  console.log('✅ n8n is healthy');

  // 4. Get existing workflows to check for updates
  console.log('📋 Fetching existing workflows...');
  let existing;
  try {
    existing = await listWorkflows();
    console.log(`   Found ${existing.length} existing workflow(s)`);
  } catch (err) {
    console.error(`❌ Failed to list workflows: ${err.message}`);
    process.exit(1);
  }

  // 5. Deploy each workflow
  console.log();
  console.log('🚀 Deploying workflows...');
  const results = [];

  for (const wf of workflows) {
    const existingWf = existing.find(e => e.name === wf.data.name);

    try {
      let result;
      if (existingWf) {
        // Update existing workflow
        console.log(`   📝 Updating: "${wf.data.name}" (id: ${existingWf.id})`);
        result = await updateWorkflow(existingWf.id, wf.data);
        results.push({ file: wf.file, name: wf.data.name, action: 'updated', id: existingWf.id });
      } else {
        // Create new workflow
        console.log(`   ➕ Creating: "${wf.data.name}"`);
        result = await createWorkflow(wf.data);
        results.push({ file: wf.file, name: wf.data.name, action: 'created', id: result.id });
      }

      // Activate if requested
      if (flags.activate && result?.id) {
        console.log(`   ⚡ Activating: "${wf.data.name}" (id: ${result.id})`);
        await activateWorkflow(result.id);
        results[results.length - 1].activated = true;
      }
    } catch (err) {
      console.error(`   ❌ Failed to deploy "${wf.data.name}": ${err.message}`);
      results.push({ file: wf.file, name: wf.data.name, action: 'failed', error: err.message });
    }
  }

  // 6. Summary
  console.log();
  console.log('═══════════════════════════════════════════════════');
  console.log('  Deployment Summary');
  console.log('═══════════════════════════════════════════════════');

  const created = results.filter(r => r.action === 'created');
  const updated = results.filter(r => r.action === 'updated');
  const failed = results.filter(r => r.action === 'failed');

  if (created.length > 0) {
    console.log(`  ➕ Created: ${created.length}`);
    for (const r of created) {
      console.log(`     • ${r.name} (id: ${r.id})${r.activated ? ' [activated]' : ''}`);
    }
  }
  if (updated.length > 0) {
    console.log(`  📝 Updated: ${updated.length}`);
    for (const r of updated) {
      console.log(`     • ${r.name} (id: ${r.id})${r.activated ? ' [activated]' : ''}`);
    }
  }
  if (failed.length > 0) {
    console.log(`  ❌ Failed: ${failed.length}`);
    for (const r of failed) {
      console.log(`     • ${r.name}: ${r.error}`);
    }
  }
  console.log();
  console.log(`  Total: ${results.length} | Success: ${created.length + updated.length} | Failed: ${failed.length}`);
  console.log();

  if (failed.length > 0) {
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

deploy().catch(err => {
  console.error(`\n💥 Deployment failed: ${err.message}`);
  process.exit(1);
});
