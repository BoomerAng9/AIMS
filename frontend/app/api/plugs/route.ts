import { proxyToBackend, getSessionUserId } from '@/lib/api-proxy';

export async function GET() {
  const userId = await getSessionUserId();
  return proxyToBackend({ path: `/plugs${userId ? `?userId=${userId}` : ''}` });
}
