/**
 * Estate API Proxy — Routes frontend requests to BlockWise Estate services
 *
 * Proxies all /api/estate/* requests to the Estate Scout service.
 * Handles GET (health, status) and POST (scout, analyze) methods.
 */

import { NextRequest, NextResponse } from 'next/server';

const ESTATE_SCOUT_URL = process.env.ESTATE_SCOUT_URL || 'http://localhost:6001';

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const servicePath = path.join('/');

  // Route to appropriate service based on first path segment
  let baseUrl = ESTATE_SCOUT_URL;
  let targetPath = '/api/' + servicePath;

  // If path starts with "scout/", strip the prefix and route to scout service
  if (servicePath.startsWith('scout/')) {
    targetPath = '/' + servicePath.replace('scout/', '');
    if (!targetPath.startsWith('/api/') && !targetPath.startsWith('/health')) {
      targetPath = '/api/' + servicePath.replace('scout/', '');
    }
  }

  const url = `${baseUrl}${targetPath}`;

  try {
    const opts: RequestInit = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      opts.body = await req.text();
    }

    const res = await fetch(url, opts);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'Estate service unavailable', url },
      { status: 503 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
