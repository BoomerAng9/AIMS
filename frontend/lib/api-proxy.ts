/**
 * API Proxy Helper — Authenticated proxy calls to UEF Gateway
 *
 * All frontend API routes proxy through here to the backend,
 * attaching the internal API key and handling errors consistently.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const UEF_URL = process.env.UEF_ENDPOINT || 'http://uef-gateway:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

interface ProxyOptions {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  requireOwner?: boolean;
}

export async function proxyToBackend(opts: ProxyOptions): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (opts.requireOwner) {
    const role = (session.user as Record<string, unknown>).role;
    if (role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden — OWNER role required' }, { status: 403 });
    }
  }

  try {
    const fetchOpts: RequestInit = {
      method: opts.method || 'GET',
      headers: {
        'X-API-Key': INTERNAL_API_KEY,
        'Content-Type': 'application/json',
      },
    };

    if (opts.body && opts.method !== 'GET') {
      fetchOpts.body = JSON.stringify(opts.body);
    }

    const res = await fetch(`${UEF_URL}${opts.path}`, fetchOpts);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.error || `Backend returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Proxy error: ${message}` },
      { status: 502 }
    );
  }
}

/** Inject authenticated userId from session into the body */
export async function getSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as Record<string, unknown>)?.email as string || null;
}
