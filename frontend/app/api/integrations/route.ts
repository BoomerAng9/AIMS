import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api-proxy';

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category') || '';
  return proxyToBackend({ path: `/integrations${category ? `?category=${category}` : ''}` });
}
