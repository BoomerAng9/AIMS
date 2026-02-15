/**
 * Veritas API Proxy — Routes frontend requests to the Veritas service
 *
 * Proxies all /api/veritas/* requests to the Veritas service.
 * Handles GET (job status, reports) and POST (ingest) methods.
 */

import { NextRequest, NextResponse } from 'next/server';

const VERITAS_URL = process.env.VERITAS_URL || 'http://localhost:7001';

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = '/api/' + path.join('/');
  const url = `${VERITAS_URL}${targetPath}`;

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
      { error: 'Veritas service unavailable', url },
      { status: 503 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
