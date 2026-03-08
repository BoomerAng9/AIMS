/**
 * ACHEEVY Classify Proxy — /api/acheevy/classify
 *
 * Proxies classification requests to the UEF Gateway /acheevy/classify endpoint.
 * Returns: { intent, confidence, requiresAgent, verticalMatch }
 */

import { NextRequest, NextResponse } from 'next/server';
import { normalizeAcheevyClassification } from '@/lib/acheevy/routing';

const UEF_GATEWAY_URL = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || 'http://localhost:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

function gatewayHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (INTERNAL_API_KEY) headers['X-API-Key'] = INTERNAL_API_KEY;
  return headers;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body?.message === 'string' ? body.message : '';
    const res = await fetch(`${UEF_GATEWAY_URL}/acheevy/classify`, {
      method: 'POST',
      headers: gatewayHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        normalizeAcheevyClassification(message, { intent: 'conversation', confidence: 0, requiresAgent: false }),
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(normalizeAcheevyClassification(message, data));
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Classification failed';
    console.error('[ACHEEVY Classify] Error:', msg);
    return NextResponse.json(
      {
        ...normalizeAcheevyClassification('', { intent: 'conversation', confidence: 0, requiresAgent: false }),
        error: msg,
      },
      { status: 502 },
    );
  }
}
