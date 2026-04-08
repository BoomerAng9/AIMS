/**
 * Composio Integration API — Tools, actions, connections, and health
 *
 * GET  /api/composio                     — Health check + connected apps
 * GET  /api/composio?action=tools&apps=github,slack — Discover available tools
 * GET  /api/composio?action=connections  — List connected accounts
 * POST /api/composio                     — Execute action or initiate connection
 *
 * Works alongside /api/n8n:
 *   Composio = real-time, on-demand cross-platform actions
 *   n8n      = scheduled, event-driven workflow pipelines
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const UEF_GATEWAY_URL = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || '';
const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY || '';

// ── GET: Health, tools, connections ─────────────────────────────────

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  // Tool discovery
  if (action === 'tools') {
    const apps = searchParams.get('apps')?.split(',').filter(Boolean) || [];
    if (apps.length === 0) {
      return NextResponse.json({ error: 'Provide ?apps=github,slack,...' }, { status: 400 });
    }
    return proxyToGateway(`/composio/tools?apps=${apps.join(',')}`);
  }

  // Connected accounts
  if (action === 'connections') {
    return proxyToGateway('/composio/connections');
  }

  // Playbooks catalog
  if (action === 'playbooks') {
    return proxyToGateway('/composio/playbooks');
  }

  // Default: health check
  return proxyToGateway('/composio/health');
}

// ── POST: Execute action or connect ─────────────────────────────────

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  switch (action) {
    case 'execute':
      return handleExecute(body, session.user.email);
    case 'connect':
      return handleConnect(body, session.user.email);
    case 'run-playbook':
      return handlePlaybook(body, session.user.email);
    default:
      return NextResponse.json({ error: 'Unknown action. Use: execute, connect, run-playbook' }, { status: 400 });
  }
}

// ── Execute a Composio action ───────────────────────────────────────

async function handleExecute(
  body: { actionName: string; params: Record<string, unknown>; connectedAccountId?: string },
  userId: string
) {
  const { actionName, params, connectedAccountId } = body;

  if (!actionName) {
    return NextResponse.json({ error: 'Missing actionName' }, { status: 400 });
  }

  return proxyToGateway('/composio/execute', {
    method: 'POST',
    body: { actionName, params: params || {}, connectedAccountId, userId },
  });
}

// ── Initiate OAuth connection ───────────────────────────────────────

async function handleConnect(
  body: { appName: string; redirectUrl?: string },
  userId: string
) {
  const { appName, redirectUrl } = body;

  if (!appName) {
    return NextResponse.json({ error: 'Missing appName' }, { status: 400 });
  }

  return proxyToGateway('/composio/connect', {
    method: 'POST',
    body: { appName, userId, redirectUrl },
  });
}

// ── Run a creative playbook ─────────────────────────────────────────

async function handlePlaybook(
  body: { playbookId: string; params?: Record<string, unknown> },
  userId: string
) {
  const { playbookId, params } = body;

  if (!playbookId) {
    return NextResponse.json({ error: 'Missing playbookId' }, { status: 400 });
  }

  return proxyToGateway('/composio/playbook', {
    method: 'POST',
    body: { playbookId, params: params || {}, userId },
  });
}

// ── UEF Gateway Proxy ───────────────────────────────────────────────

async function proxyToGateway(
  path: string,
  options: { method?: string; body?: unknown } = {}
) {
  if (!UEF_GATEWAY_URL) {
    return NextResponse.json(
      { error: 'UEF_GATEWAY_URL not configured', healthy: false },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${UEF_GATEWAY_URL}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.INTERNAL_API_KEY ? { 'X-API-Key': process.env.INTERNAL_API_KEY } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(60000),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gateway unreachable', healthy: false },
      { status: 502 }
    );
  }
}
