import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 py-8">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.04)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Logo — links home */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image
              src="/images/logos/achievemor-gold.png"
              alt="A.I.M.S."
              width={140}
              height={36}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </div>

        {/* Glass card */}
        <section className="auth-glass-card rounded-[24px] px-8 py-10 sm:px-10 sm:py-12">
          {children}
        </section>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-white/25">
          Powered by ACHEEVY &middot; plugmein.cloud
        </p>
      </div>
    </div>
  );
}
