import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api-proxy';

export async function GET(req: NextRequest) {
  const archetype = req.nextUrl.searchParams.get('archetype') || '';
  return proxyToBackend({ path: `/intake/questions${archetype ? `?archetype=${archetype}` : ''}` });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyToBackend({ path: '/intake/analyze', method: 'POST', body });
}
