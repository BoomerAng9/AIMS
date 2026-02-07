import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api-proxy';

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyToBackend({ path: '/make-it-mine/clone', method: 'POST', body });
}

export async function GET(req: NextRequest) {
  const templateId = req.nextUrl.searchParams.get('templateId') || '';
  const industry = req.nextUrl.searchParams.get('industry') || '';
  return proxyToBackend({ path: `/make-it-mine/suggest?templateId=${templateId}&industry=${industry}` });
}
