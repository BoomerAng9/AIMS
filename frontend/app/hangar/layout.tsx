import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'A.I.M.S. Hangar — AI Managed Solutions',
  description: 'Real-time 3D orchestration view of the A.I.M.S. build pipeline.',
};

/**
 * Hangar layout — fully isolated, no dashboard chrome.
 * The hangar route owns its entire viewport.
 */
export default function HangarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-[#0B0F14] overflow-hidden">
      {children}
    </div>
  );
}
