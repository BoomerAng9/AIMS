'use client';

/**
 * FloatingACHEEVY — Chat Launcher
 *
 * Bottom-right floating button that launches the primary chat route.
 */

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

function LaunchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export function FloatingACHEEVY() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'j') {
        event.preventDefault();
        router.push('/chat');
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [router]);

  if (pathname === '/chat' || pathname === '/dashboard/chat' || pathname === '/dashboard/acheevy') {
    return null;
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => router.push('/chat')}
      className="fixed z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 px-5 py-3 text-sm font-semibold text-black shadow-[0_4px_24px_rgba(217,119,6,0.25)] transition-all duration-200 hover:scale-105 hover:shadow-[0_8px_32px_rgba(217,119,6,0.35)] active:scale-95"
      style={{ bottom: 'calc(var(--frame-inset, 12px) + 20px)', right: 'calc(var(--frame-inset, 12px) + 20px)' }}
      title="Chat w/ACHEEVY (Ctrl+J)"
    >
      <img
        src="/images/acheevy/acheevy-helmet.png"
        alt=""
        className="h-6 w-6 rounded-md border border-amber-500/30"
      />
      <span className="font-doto font-bold uppercase tracking-[0.2em] text-black">chat w/ A C H E E V Y</span>
      <LaunchIcon className="h-4 w-4" />
    </motion.button>
  );
}

export default FloatingACHEEVY;
