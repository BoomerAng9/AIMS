/**
 * The Arena Layout — Contest & Gamification Platform
 *
 * ESPN-tier layout with persistent nav, live ticker, and wallet display.
 * Sits outside the dashboard — this is a standalone product.
 */
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'The Arena | A.I.M.S.',
  description: 'Skill-based contests powered by AI. Trivia, pick\'em, prospect ranking. Compete, earn, and climb the leaderboard.',
};

export default function ArenaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full flex flex-col bg-ink">
      {/* Arena Top Bar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 py-3 border-b border-wireframe-stroke bg-black/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-white/40 hover:text-gold transition-colors"
          >
            <ArrowLeft size={14} />
            <span className="font-mono text-[0.55rem] uppercase tracking-widest hidden sm:inline">
              A.I.M.S.
            </span>
          </Link>
          <div className="h-4 w-px bg-wireframe-stroke" />
          <Link href="/arena" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/10 border border-gold/20">
              <span className="text-gold font-display text-xs font-bold">A</span>
            </div>
            <span className="text-white font-display text-sm tracking-wider">THE ARENA</span>
          </Link>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          <Link href="/arena" className="px-3 py-1.5 text-[0.6rem] font-mono uppercase tracking-widest text-white/50 hover:text-gold transition-colors rounded-lg hover:bg-white/5">
            Lobby
          </Link>
          <Link href="/arena/leaderboard" className="px-3 py-1.5 text-[0.6rem] font-mono uppercase tracking-widest text-white/50 hover:text-gold transition-colors rounded-lg hover:bg-white/5">
            Rankings
          </Link>
          <Link href="/arena/how-it-works" className="px-3 py-1.5 text-[0.6rem] font-mono uppercase tracking-widest text-white/50 hover:text-gold transition-colors rounded-lg hover:bg-white/5 hidden md:block">
            How It Works
          </Link>
          <div className="h-4 w-px bg-wireframe-stroke mx-1" />
          <Link
            href="/arena/wallet"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/5 border border-gold/15 text-gold text-[0.6rem] font-mono hover:bg-gold/10 transition-colors"
          >
            <span className="font-display">$0.00</span>
            <span className="uppercase tracking-widest hidden sm:inline">Wallet</span>
          </Link>
        </div>
      </nav>

      {/* Live Contest Ticker */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-2 border-b border-wireframe-stroke bg-black/40 overflow-x-auto scrollbar-hide">
        <span className="flex items-center gap-1.5 flex-shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[0.5rem] font-mono uppercase tracking-widest text-emerald-400/80">LIVE</span>
        </span>
        <div className="flex items-center gap-4 overflow-x-auto">
          <span className="text-[0.55rem] text-white/40 font-mono whitespace-nowrap">
            Daily Trivia Blitz — 23 entered — $42.50 pool
          </span>
          <span className="text-white/10">|</span>
          <span className="text-[0.55rem] text-white/40 font-mono whitespace-nowrap">
            Free Sports Trivia — 87 entered — 50 XP reward
          </span>
          <span className="text-white/10">|</span>
          <span className="text-[0.55rem] text-amber-400/60 font-mono whitespace-nowrap">
            QB Prospect Showdown starts in 4h — $10 entry
          </span>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-wireframe-stroke px-6 py-6 bg-black/40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="text-[0.5rem] font-mono text-white/20 uppercase tracking-widest">
              The Arena by A.I.M.S.
            </span>
            <Link href="/arena/how-it-works" className="text-[0.5rem] font-mono text-white/20 hover:text-gold/50 uppercase tracking-widest transition-colors">
              Rules
            </Link>
            <Link href="/arena/how-it-works#legal" className="text-[0.5rem] font-mono text-white/20 hover:text-gold/50 uppercase tracking-widest transition-colors">
              Legal
            </Link>
          </div>
          <p className="text-[0.5rem] text-white/15 font-mono">
            Skill-based contests only. Must be 18+. Not available in all states. Play responsibly.
          </p>
        </div>
      </footer>
    </div>
  );
}
