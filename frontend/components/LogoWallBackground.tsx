// frontend/components/LogoWallBackground.tsx
"use client";

import clsx from "clsx";

type LogoWallMode = "hero" | "auth" | "form" | "dashboard";

type Props = {
  mode?: LogoWallMode;
  children: React.ReactNode;
};

/**
 * LogoWallBackground — Clean branded environment with embossed logo
 *
 * Light, minimal background with a subtle raised/embossed AIMS logo watermark.
 * Professional SaaS feel with warm accent touches.
 */
export function LogoWallBackground({ mode = "hero", children }: Props) {
  const showLogo = mode === "hero" || mode === "auth" || mode === "dashboard";

  return (
    <div className={clsx(
      "relative overflow-hidden",
      mode === "dashboard" ? "h-full bg-[#09090B]" : "min-h-full bg-[#09090B]"
    )}>
      {/* Subtle warm gradient accent — top-left */}
      <div
        className="pointer-events-none absolute top-0 left-0 w-[600px] h-[600px] z-0"
        style={{
          background: 'radial-gradient(circle at 0% 0%, rgba(217,119,6,0.03) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Subtle warm gradient accent — bottom-right */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[400px] z-0"
        style={{
          background: 'radial-gradient(circle at 100% 100%, rgba(217,119,6,0.02) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Embossed logo watermark — subtle raised/debossed effect */}
      {showLogo && (
        <div
          className="pointer-events-none absolute z-[1]"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: mode === "auth" ? '500px' : '700px',
            height: mode === "auth" ? '500px' : '700px',
            backgroundImage: 'url(/assets/aims_transparent_logo.svg)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            opacity: 0.035,
            filter: 'drop-shadow(1px 1px 0 rgba(255,255,255,0.02)) drop-shadow(-1px -1px 0 rgba(0,0,0,0.2)) drop-shadow(2px 2px 1px rgba(245,158,11,0.04))',
            mixBlendMode: 'screen',
          }}
          aria-hidden="true"
        />
      )}

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
