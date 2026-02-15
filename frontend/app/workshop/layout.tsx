/**
 * Workshop Layout — Voice-First Companion Experiences
 *
 * The Workshop is the playful surface of plugmein.cloud.
 * Every flow starts with voice and ends with an artifact.
 * No blank text boxes. Always suggested conversation starters.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Mic } from "lucide-react";

export default function WorkshopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      {/* Workshop top bar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-wireframe-stroke bg-black/40 backdrop-blur-xl">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-white/50 hover:text-gold transition-colors"
        >
          <ArrowLeft size={14} />
          <span className="font-mono text-[0.6rem] uppercase tracking-widest">
            Back Home
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 text-[0.6rem] font-mono uppercase tracking-widest">
            <Link
              href="/workshop/life-scenes"
              className="text-white/40 hover:text-gold transition-colors"
            >
              Life Scenes
            </Link>
            <Link
              href="/workshop/moment-studio"
              className="text-white/40 hover:text-gold transition-colors"
            >
              Moment Studio
            </Link>
            <Link
              href="/workshop/money-moves"
              className="text-white/40 hover:text-gold transition-colors"
            >
              Money Moves
            </Link>
            <Link
              href="/workshop/creator-circles"
              className="text-white/40 hover:text-gold transition-colors"
            >
              Circles
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <Mic size={12} className="text-gold/60" />
            <span className="text-[0.55rem] uppercase font-mono tracking-widest text-gold/60">
              Voice-First
            </span>
          </div>
        </div>
      </nav>

      {/* Workshop content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
