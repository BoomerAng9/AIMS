import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { extractSessionSnapshots, type PreferenceMemory } from '@/lib/session-snapshot/history';

function resolveUserId(session: Awaited<ReturnType<typeof getServerSession>>) {
  const authSession = session as { user?: { email?: string } } | null;
  return authSession?.user?.email || 'anon-unknown';
}

function buildMemoryApiUrl(request: NextRequest) {
  return new URL('/api/memory', request.nextUrl.origin);
}


async function fetchPreferenceMemories(request: NextRequest, userId: string) {
  const url = buildMemoryApiUrl(request);
  url.searchParams.set('type', 'preference');
  url.searchParams.set('userId', userId);
  url.searchParams.set('limit', '300');

  const response = await fetch(url, {
    headers: {
      'x-user-id': userId,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Memory lookup failed: ${response.status}`);
  }

  return response.json() as Promise<{ memories?: PreferenceMemory[] }>;
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = resolveUserId(session);
    const data = await fetchPreferenceMemories(request, userId);

    const snapshots = extractSessionSnapshots(data.memories || []);

    return NextResponse.json({
      snapshots,
      count: snapshots.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Session snapshot history load failed';
    return NextResponse.json({ error: message, snapshots: [], count: 0 }, { status: 502 });
  }
}
