import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { SessionSnapshot } from '@/lib/context-packs/contracts';

function resolveUserId(session: Awaited<ReturnType<typeof getServerSession>>) {
  return session?.user?.email || 'anon-unknown';
}

function buildMemoryApiUrl(request: NextRequest) {
  return new URL('/api/memory', request.nextUrl.origin);
}

async function fetchPreferenceMemories(request: NextRequest, userId: string) {
  const url = buildMemoryApiUrl(request);
  url.searchParams.set('type', 'preference');
  url.searchParams.set('userId', userId);
  url.searchParams.set('limit', '200');

  const response = await fetch(url, {
    headers: {
      'x-user-id': userId,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Memory lookup failed: ${response.status}`);
  }

  return response.json() as Promise<{
    memories?: Array<{
      payload?: { key?: string; value?: string };
      updatedAt?: string;
      createdAt?: string;
    }>;
  }>;
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const scope = request.nextUrl.searchParams.get('scope');
    if (!scope) {
      return NextResponse.json({ error: 'scope is required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = resolveUserId(session);
  const data = await fetchPreferenceMemories(request, userId);
    const snapshotKey = `session_snapshot:${scope}`;
    const matchingMemory = (data.memories || [])
      .filter((memory) => memory.payload?.key === snapshotKey && memory.payload?.value)
      .sort((left, right) => {
        const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
        const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
        return rightTime - leftTime;
      })[0];

    if (!matchingMemory?.payload?.value) {
      return NextResponse.json({ snapshot: null });
    }

    return NextResponse.json({
      snapshot: JSON.parse(matchingMemory.payload.value) as SessionSnapshot,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Session snapshot load failed';
    return NextResponse.json({ error: message, snapshot: null }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { scope?: string; snapshot?: SessionSnapshot };
    if (!body.scope || !body.snapshot) {
      return NextResponse.json({ error: 'scope and snapshot are required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = resolveUserId(session);
    const memoryApiUrl = buildMemoryApiUrl(request);

    const response = await fetch(memoryApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        action: 'preference',
        userId,
        key: `session_snapshot:${body.scope}`,
        value: JSON.stringify(body.snapshot),
        context: `Session Snapshot persisted for ${body.scope}`,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Session snapshot save failed' }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Session snapshot save failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}