/**
 * /hangar — A.I.M.S. Hangar World
 *
 * Isolated 3D runtime environment. No sidebar, no dashboard chrome.
 * Runs in demo mode by default; pass ?mode=live&sse=<url> for real events.
 */

import HangarRoot from '@/components/hangar/HangarRoot';

interface HangarPageProps {
  searchParams: Promise<{ mode?: string; sse?: string }>;
}

export default async function HangarPage({ searchParams }: HangarPageProps) {
  const params = await searchParams;
  const mode = params.mode === 'live' ? 'live' : 'demo';
  const sseUrl = params.sse || undefined;

  return <HangarRoot mode={mode} sseUrl={sseUrl} />;
}
