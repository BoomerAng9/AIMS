/**
 * GET /api/circuit-box/integrations
 *
 * Fetches real integration registry from UEF Gateway /integrations
 * and real API key status from /admin/api-keys.
 * Merges both into a single response the frontend can display.
 */

import { NextResponse } from 'next/server';

const UEF_URL = process.env.UEF_GATEWAY_URL || process.env.UEF_ENDPOINT || 'http://uef-gateway:4000';

interface KeyInfo {
  id: string;
  label: string;
  scope: string;
  configured: boolean;
  masked: string;
}

export async function GET() {
  const results: {
    integrations: unknown[];
    keys: KeyInfo[];
    source: string;
    error?: string;
  } = {
    integrations: [],
    keys: [],
    source: 'none',
  };

  // Fetch integration registry
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${UEF_URL}/integrations`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      results.integrations = data.integrations || [];
      results.source = 'uef-gateway';
    }
  } catch {
    // UEF Gateway unreachable for integrations
  }

  // Fetch API key status
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${UEF_URL}/admin/api-keys`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      results.keys = data.keys || [];
      results.source = results.source === 'uef-gateway' ? 'uef-gateway' : 'uef-gateway-partial';
    }
  } catch {
    // UEF Gateway unreachable for keys
  }

  if (results.source === 'none') {
    return NextResponse.json(
      { ...results, error: 'UEF Gateway unreachable' },
      { status: 503 }
    );
  }

  return NextResponse.json(results);
}
