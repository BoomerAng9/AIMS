// frontend/components/LogoWallBackground.tsx
"use client";

import clsx from "clsx";

type LogoWallMode = "hero" | "auth" | "form" | "dashboard";

type Props = {
  mode?: LogoWallMode;
  children: React.ReactNode;
};

/**
 * LogoWallBackground — Clean branded environment
 *
 * Light, minimal background with optional subtle logo watermark.
 * Professional SaaS feel with warm accent touches.
 */
export function LogoWallBackground({ mode = "hero", children }: Props) {
  return (
    <div className={clsx(
      "relative",
      mode === "dashboard" ? "h-full bg-[#F8FAFC]" : "min-h-full bg-[#F8FAFC]"
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
