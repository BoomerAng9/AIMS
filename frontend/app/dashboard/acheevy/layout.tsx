import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Chat w/ACHEEVY',
  description: 'Chat w/ACHEEVY — your AI executive orchestrator. Build, research, deploy, and automate.',
  openGraph: {
    title: 'Chat w/ACHEEVY | A.I.M.S.',
    description: 'Chat w/ACHEEVY — build, research, deploy, and automate with AI Managed Solutions.',
  },
};

export default function AcheevyLayout({ children }: { children: ReactNode }) {
  return children;
}
