/**
 * Boost|Bridge API Proxy — Routes frontend requests to the Boost|Bridge service
 *
 * Proxies all /api/boost-bridge/* requests to the Boost|Bridge service.
 * Handles GET (job status, reports, badges) and POST (simulate, trial, dojo) methods.
 */

import { NextRequest, NextResponse } from 'next/server';

const BOOST_BRIDGE_URL = process.env.BOOST_BRIDGE_URL || 'http://localhost:7001';

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = '/api/' + path.join('/');
  const url = `${BOOST_BRIDGE_URL}${targetPath}`;

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
      { error: 'Boost|Bridge service unavailable', url },
      { status: 503 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
