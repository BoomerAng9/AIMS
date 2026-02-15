import HangarRoot from '@/components/hangar/HangarRoot';

/**
 * /hangar — A.I.M.S. Hangar World
 *
 * Isolated 3D runtime environment. No sidebar, no dashboard chrome.
 * Runs in demo mode by default; pass ?mode=live&sse=<url> for real events.
 */
export default function HangarPage() {
  return <HangarRoot mode="demo" />;
}
