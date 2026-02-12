// frontend/components/LogoWallBackground.tsx
"use client";

import clsx from "clsx";

type LogoWallMode = "hero" | "auth" | "form" | "dashboard";

type Props = {
  mode?: LogoWallMode;
  children: React.ReactNode;
};

/**
 * LogoWallBackground — Dark cinematic background system
 *
 * Tron/Matrix/digital hangar aesthetic:
 * - Dark base with subtle gold grid
 * - Gold ACHIEVEMOR logo on edges only (never tiled across content)
 * - Cinematic vignette depth
 * - Content centered within margins, no clipping
 */
export function LogoWallBackground({ mode = "hero", children }: Props) {
  return (
    <div className={clsx(
      "relative text-white",
      mode === "dashboard" ? "h-screen overflow-hidden bg-[#050505]" : "min-h-screen bg-[#050505]"
    )}>
      {/* Base: Fine gold grid — Tron aesthetic */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(212,175,55,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,175,55,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
        aria-hidden="true"
      />

      {/* Dot matrix overlay — subtle depth */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      {/* Cinematic vignette — dark edges */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Gold ACHIEVEMOR logo — edges only, never tiled across content */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/images/logos/achievemor-gold.png')",
          backgroundSize: '80px 80px',
          backgroundRepeat: 'repeat',
          opacity: 0.02,
          maskImage: 'linear-gradient(135deg, black 0%, transparent 15%, transparent 85%, black 100%)',
          WebkitMaskImage: 'linear-gradient(135deg, black 0%, transparent 15%, transparent 85%, black 100%)',
        }}
        aria-hidden="true"
      />

      {/* Gold edge glow — corner accents */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `
            linear-gradient(135deg, rgba(212,175,55,0.04) 0%, transparent 15%),
            linear-gradient(225deg, rgba(212,175,55,0.03) 0%, transparent 15%),
            linear-gradient(315deg, rgba(212,175,55,0.04) 0%, transparent 15%),
            linear-gradient(45deg, rgba(212,175,55,0.03) 0%, transparent 15%)
          `,
        }}
        aria-hidden="true"
      />

      {/* Horizontal scan lines — cinematic Matrix effect */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.01]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <main className={clsx(
        "relative z-10 flex flex-col",
        mode === "dashboard" ? "h-full" : "min-h-screen",
      )}>
        <div className="flex-1 flex flex-col w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
