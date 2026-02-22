/**
 * Content Pipeline API — Frontend proxy to UEF Gateway
 *
 * POST /api/content/pipeline          — Launch pipeline (URL → Video → Ads)
 * GET  /api/content/pipeline?id=xxx   — Check pipeline status
 */

import { NextRequest, NextResponse } from 'next/server';

const UEF_GATEWAY = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || 'http://localhost:3001';
const API_KEY = process.env.INTERNAL_API_KEY || '';

async function gatewayFetch(path: string, options?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(`${UEF_GATEWAY}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
        ...(options?.headers || {}),
      },
    });
    return res;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, sourceType, platforms, style, model, duration, withAudio, tone, userId, hook, cta } = body;

    if (!source) {
      return NextResponse.json({ error: 'source is required' }, { status: 400 });
    }

    const res = await gatewayFetch('/api/content/pipeline', {
      method: 'POST',
      body: JSON.stringify({
        source,
        sourceType: sourceType || 'prompt',
        platforms: platforms || ['tiktok', 'instagram-reels'],
        style: style || 'auto',
        model: model || 'auto',
        duration: duration || 15,
        withAudio: withAudio !== false,
        tone,
        userId: userId || 'web-user',
        hook,
        cta,
      }),
    });

    if (res?.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: `Gateway ${res ? `returned ${res.status}` : 'unreachable'}` },
      { status: res?.status || 502 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Pipeline launch failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pipelineId = searchParams.get('id');

  if (!pipelineId) {
    // List all pipelines
    const res = await gatewayFetch(`/api/content/pipelines?userId=web-user`);
    if (res?.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    return NextResponse.json({ pipelines: [], count: 0 });
  }

  // Get specific pipeline status
  const res = await gatewayFetch(`/api/content/pipeline/${pipelineId}`);
  if (res?.ok) {
    const data = await res.json();
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
}
