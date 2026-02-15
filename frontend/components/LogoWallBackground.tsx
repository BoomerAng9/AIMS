// frontend/components/LogoWallBackground.tsx
"use client";

import clsx from "clsx";

type LogoWallMode = "hero" | "auth" | "form" | "dashboard";

type Props = {
  mode?: LogoWallMode;
  children: React.ReactNode;
};

/**
 * LogoWallBackground — Premium branded environment
 *
 * Gold A.I.M.S. logo embossed across all pages at ultra-low opacity,
 * like a luxury brand's monogram wallpaper — think Louis Vuitton or
 * Gucci's repeating logo pattern pressed into leather.
 *
 * The emboss effect: subtle repeating logo + inner shadow illusion
 * on ink-dark background with ambient gold accent lighting.
 */
export function LogoWallBackground({ mode = "hero", children }: Props) {
  return (
    <div className={clsx(
      "relative text-white",
      mode === "dashboard" ? "h-full bg-ink" : "min-h-full bg-ink"
    )}>
      {/* Base gradient — warm ink with gold bias */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(212,175,55,0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(212,175,55,0.02) 0%, transparent 50%),
            linear-gradient(180deg, #0B0E14 0%, #080A10 50%, #0B0E14 100%)
          `,
        }}
        aria-hidden="true"
      />

      {/* EMBOSSED A.I.M.S. LOGO — repeating monogram wallpaper */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/images/logos/achievemor-gold.png')",
          backgroundSize: '100px 100px',
          backgroundRepeat: 'repeat',
          opacity: 0.025,
          filter: 'contrast(0.8) brightness(0.9)',
        }}
        aria-hidden="true"
      />

      {/* Emboss depth layer — shifted copy for 3D pressed-in effect */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/images/logos/achievemor-gold.png')",
          backgroundSize: '100px 100px',
          backgroundRepeat: 'repeat',
          backgroundPosition: '1px 1px',
          opacity: 0.012,
          filter: 'brightness(1.5) contrast(0.7)',
          mixBlendMode: 'overlay',
        }}
        aria-hidden="true"
      />

      {/* Ambient gold glow — top-left accent */}
      <div
        className="pointer-events-none absolute top-0 left-0 w-[600px] h-[600px] z-0"
        style={{
          background: 'radial-gradient(circle at 0% 0%, rgba(212,175,55,0.04) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Ambient gold glow — bottom-right */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[400px] z-0"
        style={{
          background: 'radial-gradient(circle at 100% 100%, rgba(212,175,55,0.025) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Cinematic vignette — dark edges for depth */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <main className={clsx(
        "relative z-10 flex flex-col",
        mode === "dashboard" ? "h-full" : "min-h-full",
        mode === "hero" ? "p-4 md:p-6 lg:p-8 xl:p-12" : "p-0"
      )}>
        <div className="flex-1 flex flex-col w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
