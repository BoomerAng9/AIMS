/**
 * n8n Workflows API — List and trigger remote n8n workflows
 *
 * GET  /api/n8n/workflows — List active workflows on remote n8n
 * POST /api/n8n/workflows — Trigger a workflow by ID
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
  const { workflowId, payload } = body;

  if (!workflowId) {
    return NextResponse.json(
      { error: 'Missing required field: workflowId' },
      { status: 400 }
    );
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

  return NextResponse.json({
    triggered: true,
    workflowId,
    result: result.data,
  });
}
