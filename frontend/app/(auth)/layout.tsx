import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4 py-8">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] glow-orb glow-orb-amber opacity-40" />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Logo */}
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

        {/* Auth card */}
        <section className="auth-glass-card rounded-[24px] px-8 py-10 sm:px-10 sm:py-12">
          {children}
        </section>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-zinc-500">
          Powered by A.I.M.S. &middot; plugmein.cloud
        </p>
      </div>
    </div>
  );
}
