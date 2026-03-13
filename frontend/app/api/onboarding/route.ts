import { NextResponse } from 'next/server';
import { onboardingRequestSchema, validateInput } from '@/lib/validation/schemas';

const GATEWAY_URL = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || 'http://uef-gateway:4000';

/**
 * POST /api/onboarding
 *
 * Persists the new user onboarding profile to the gateway.
 * Best-effort: if the gateway is down, the frontend still proceeds.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateInput(onboardingRequestSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid onboarding request', details: validation.errors }, { status: 400 });
    }

    const { fullName, region, objective, industry, companyName } = validation.data;

    // Forward to UEF Gateway
    const res = await fetch(`${GATEWAY_URL}/api/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        region: region || 'Not specified',
        objective: objective || 'Just exploring',
        industry: industry || 'Technology / SaaS',
        companyName: companyName || '',
        onboardedAt: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => 'Unknown error');
      console.error('[Onboarding] Gateway error:', res.status, errBody);
      return NextResponse.json({ error: 'Gateway error', saved: false }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ saved: true, ...data });
  } catch (err) {
    console.error('[Onboarding] Error:', err);
    return NextResponse.json({ error: 'Internal error', saved: false }, { status: 500 });
  }
}
