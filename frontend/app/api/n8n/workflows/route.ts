/**
 * n8n Workflows API — List, trigger, generate, and deploy workflows
 *
 * GET  /api/n8n/workflows — List workflows on remote n8n
 * POST /api/n8n/workflows — Action-based: trigger, generate, deploy
 */

import { NextResponse } from 'next/server';
import { n8nFetch } from '@/lib/n8n-bridge';

export async function GET() {
  const result = await n8nFetch<{ data: unknown[] }>({
    path: '/api/v1/workflows',
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || 'Failed to list workflows' },
      { status: result.status }
    );
  }

  return NextResponse.json({
    workflows: (result.data as any)?.data || result.data || [],
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { action } = body;

  switch (action) {
    case 'trigger':
      return handleTrigger(body);
    case 'generate':
      return handleGenerate(body);
    case 'deploy':
      return handleDeploy(body);
    default:
      // Legacy: treat as workflow activation
      return handleLegacyTrigger(body);
  }
}

// ── Trigger via webhook ──
async function handleTrigger(body: { webhookPath: string; payload: unknown }) {
  const { webhookPath, payload } = body;
  if (!webhookPath) {
    return NextResponse.json({ error: 'Missing webhookPath' }, { status: 400 });
  }

  const result = await n8nFetch({
    path: `/webhook/${webhookPath}`,
    method: 'POST',
    body: payload || {},
    timeout: 30000,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || 'Webhook trigger failed' },
      { status: result.status }
    );
  }

  return NextResponse.json({
    triggered: true,
    executionId: (result.data as any)?.executionId || null,
    data: result.data,
  });
}

// ── Generate workflow JSON via LLM (Juno_Ang / Workflow Smith Squad) ──
async function handleGenerate(body: { query: string }) {
  const { query } = body;
  if (!query?.trim()) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  // First try UEF gateway for real LLM-powered generation
  const UEF_GATEWAY_URL = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || '';

  if (UEF_GATEWAY_URL) {
    try {
      const res = await fetch(`${UEF_GATEWAY_URL}/workflow-smith/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.INTERNAL_API_KEY ? { 'X-API-Key': process.env.INTERNAL_API_KEY } : {}),
        },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(60000),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fall through to local generation
    }
  }

  // Fallback: generate workflow structure locally
  const workflow = generateWorkflowLocally(query);
  return NextResponse.json(workflow);
}

// ── Deploy workflow JSON to n8n ──
async function handleDeploy(body: { workflow: Record<string, unknown> }) {
  const { workflow } = body;
  if (!workflow) {
    return NextResponse.json({ error: 'Missing workflow JSON' }, { status: 400 });
  }

  const result = await n8nFetch<{ id: string }>({
    path: '/api/v1/workflows',
    method: 'POST',
    body: workflow,
    timeout: 15000,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || 'Deploy to n8n failed' },
      { status: result.status }
    );
  }

  // Activate the workflow
  const workflowId = (result.data as any)?.id;
  if (workflowId) {
    await n8nFetch({
      path: `/api/v1/workflows/${workflowId}/activate`,
      method: 'POST',
    });
  }

  return NextResponse.json({
    deployed: true,
    id: workflowId,
    data: result.data,
  });
}

// ── Legacy trigger (backwards compat) ──
async function handleLegacyTrigger(body: { workflowId?: string; payload?: unknown }) {
  const { workflowId, payload } = body;
  if (!workflowId) {
    return NextResponse.json({ error: 'Missing workflowId or action' }, { status: 400 });
  }

  const result = await n8nFetch({
    path: `/api/v1/workflows/${workflowId}/activate`,
    method: 'POST',
    body: payload || {},
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || 'Failed to trigger workflow' },
      { status: result.status }
    );
  }

  return NextResponse.json({ triggered: true, workflowId, result: result.data });
}

// ── Local workflow generation (fallback when UEF gateway unavailable) ──
function generateWorkflowLocally(query: string) {
  const lower = query.toLowerCase();
  const id = `wf-${Date.now().toString(36)}`;

  // Detect workflow type from keywords
  const isIngest = /ingest|csv|import|data/.test(lower);
  const isEnrich = /enrich|search|brave|api/.test(lower);
  const isGrade = /grade|rank|score|evaluate/.test(lower);
  const isDeploy = /deploy|publish|launch|ship/.test(lower);
  const isAutomate = /automate|schedule|trigger|cron/.test(lower);

  // Build node graph
  const nodes: Array<{
    id: string;
    name: string;
    type: string;
    position: [number, number];
    parameters: Record<string, unknown>;
  }> = [];

  let x = 0;

  // Always start with webhook trigger
  nodes.push({
    id: 'trigger',
    name: 'Webhook Trigger',
    type: 'n8n-nodes-base.webhook',
    position: [x, 300],
    parameters: { path: id, httpMethod: 'POST' },
  });
  x += 250;

  if (isIngest) {
    nodes.push({
      id: 'ingest',
      name: 'Data Ingestion',
      type: 'n8n-nodes-base.function',
      position: [x, 300],
      parameters: { functionCode: '// Parse and validate incoming data\nreturn items;' },
    });
    x += 250;
  }

  if (isEnrich) {
    nodes.push({
      id: 'enrich',
      name: 'Data Enrichment',
      type: 'n8n-nodes-base.httpRequest',
      position: [x, 300],
      parameters: { url: 'https://api.search.brave.com/res/v1/web/search', method: 'GET' },
    });
    x += 250;
  }

  if (isGrade) {
    nodes.push({
      id: 'grade',
      name: 'Scoring & Ranking',
      type: 'n8n-nodes-base.function',
      position: [x, 300],
      parameters: { functionCode: '// Score and rank items\nreturn items.sort((a, b) => b.score - a.score);' },
    });
    x += 250;
  }

  if (isDeploy || isAutomate) {
    nodes.push({
      id: 'execute',
      name: 'Execute Action',
      type: 'n8n-nodes-base.httpRequest',
      position: [x, 300],
      parameters: { url: '{{ $env.TARGET_URL }}', method: 'POST' },
    });
    x += 250;
  }

  // Always end with response
  nodes.push({
    id: 'respond',
    name: 'Webhook Response',
    type: 'n8n-nodes-base.respondToWebhook',
    position: [x, 300],
    parameters: { respondWith: 'json' },
  });

  // Build connections
  const connections: Record<string, { main: Array<Array<{ node: string; type: string; index: number }>> }> = {};
  for (let i = 0; i < nodes.length - 1; i++) {
    connections[nodes[i].name] = {
      main: [[{ node: nodes[i + 1].name, type: 'main', index: 0 }]],
    };
  }

  // Detect dependencies
  const dependencies: string[] = [];
  if (isEnrich) dependencies.push('HTTP API');
  if (isIngest) dependencies.push('File System');
  if (lower.includes('postgres') || lower.includes('database')) dependencies.push('PostgreSQL');

  // Detect secrets
  const secretsRequired: string[] = [];
  if (isEnrich) secretsRequired.push('BRAVE_API_KEY');
  if (lower.includes('postgres')) secretsRequired.push('DATABASE_URL');

  // Validation
  const issues: string[] = [];
  if (nodes.length <= 2) issues.push('Workflow has minimal nodes — consider adding processing steps');
  if (secretsRequired.length > 0) issues.push(`Requires ${secretsRequired.length} secret(s) to be configured`);

  // Failure analysis
  const failures: Array<{ scenario: string; impact: string; handled: boolean }> = [
    { scenario: 'Webhook timeout', impact: 'LOW', handled: true },
    { scenario: 'API rate limit exceeded', impact: isEnrich ? 'CRITICAL' : 'LOW', handled: isEnrich },
  ];
  if (isIngest) {
    failures.push({ scenario: 'Malformed input data', impact: 'CRITICAL', handled: false });
  }

  const workflowJson = {
    name: `Generated: ${query.slice(0, 60)}`,
    nodes,
    connections,
    active: false,
    settings: { executionOrder: 'v1' },
  };

  return {
    workflowJson,
    manifest: {
      workflowId: id,
      name: `Generated: ${query.slice(0, 60)}`,
      description: query,
      nodeCount: nodes.length,
      dependencies,
      secretsRequired,
    },
    validation: { valid: issues.length === 0, issues },
    failures,
    gate: {
      approved: issues.length === 0 || issues.every(i => i.includes('minimal')),
      reasons: issues.filter(i => !i.includes('minimal')),
    },
  };
}
