// frontend/app/(auth)/layout.tsx
// Three-column auth layout: ACHEEVY image | Sign-in form | Remotion video
import type { ReactNode } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { LogoWallBackground } from "@/components/LogoWallBackground";

const AuthWelcomePlayer = dynamic(
  () => import("@/components/auth/AuthWelcomePlayer"),
  { ssr: false }
);

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <LogoWallBackground mode="auth">
      <div className="flex h-screen items-center justify-center overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(420px,480px)_1fr] w-full h-full max-w-[1400px] mx-auto">

          {/* ── Left Column: ACHEEVY Office Image ──────────── */}
          <div className="hidden lg:flex items-center justify-center p-6">
            <div className="relative w-full h-[85vh] max-h-[800px] rounded-3xl overflow-hidden border border-gold/10 shadow-2xl shadow-gold/5">
              {/* Gold glow accent */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 z-10" />
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent z-20" />
              <Image
                src="/images/acheevy/acheevy-office-plug.png"
                alt="ACHEEVY in the office"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* ── Center Column: Auth Form Card ──────────────── */}
          <div className="flex items-center justify-center px-4 py-8 lg:py-12">
            <section className="wireframe-card w-full rounded-[24px] px-8 py-10 lg:px-10 lg:py-12 text-white bg-[#0A0A0A]/90 backdrop-blur-xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {children}
            </section>
          </div>

          {/* ── Right Column: Remotion Welcome Video ──────── */}
          <div className="hidden lg:flex items-center justify-center p-6">
            <div className="relative w-full h-[85vh] max-h-[800px] rounded-3xl overflow-hidden border border-white/[0.06] bg-[#0A0A0A]">
              {/* Subtle gold top accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent z-10" />
              <AuthWelcomePlayer />
            </div>
          </div>

        </div>
      </div>
    </LogoWallBackground>
  );
}
