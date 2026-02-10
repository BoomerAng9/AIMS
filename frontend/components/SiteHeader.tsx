// frontend/components/SiteHeader.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chat", label: "Chat w/ACHEEVY" },
  { href: "/plugs", label: "Plugs" },
  { href: "/integrations", label: "Integrations" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-t border-gold/20 border-b border-b-wireframe-stroke bg-[#0A0A0A]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center px-4 md:px-6 lg:px-8 xl:px-12">
        {/* Brand */}
        <Link className="flex items-center gap-2.5" href="/">
          <img
            src="/images/acheevy/acheevy-helmet.png"
            className="h-8 w-8 rounded-full border border-gold/30"
            alt="ACHEEVY"
          />
          <div className="flex flex-col">
            <span className="font-display text-lg uppercase tracking-wider text-white">
              A.I.M.S.
            </span>
            <span className="text-[0.5rem] uppercase tracking-[0.15em] text-white/40 -mt-1">
              AI Managed Solutions
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="ml-auto flex gap-1 sm:gap-2">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-gold/10 text-gold border border-gold/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth actions */}
        <div className="ml-4 flex items-center gap-2">
          <Link
            href="/sign-up"
            className="rounded-lg border border-wireframe-stroke px-3 py-1.5 text-sm text-white/70 transition-colors hover:border-white/20 hover:text-white hover:bg-white/5"
          >
            Registration
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-gold/90 px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-gold"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
