// frontend/components/SiteHeader.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chat", label: "Chat" },
  { href: "/plugs", label: "Plugs" },
  { href: "/integrations", label: "Integrations" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-wireframe-stroke bg-[#0A0A0A]/90 backdrop-blur-xl">
      <div className="flex h-14 items-center px-4 md:px-6 lg:px-8">
        {/* Brand */}
        <Link className="flex items-center gap-2 flex-shrink-0" href="/">
          <img
            src="/images/acheevy/acheevy-helmet.png"
            className="h-7 w-7 rounded-full border border-gold/30"
            alt="ACHEEVY"
          />
          <span className="font-display text-base uppercase tracking-wider text-white hidden sm:inline">
            A.I.M.S.
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="ml-auto hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-gold/10 text-gold border border-gold/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="ml-2 flex items-center gap-2">
            <Link
              href="/sign-up"
              className="rounded-lg bg-gold/90 px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-gold"
            >
              Sign Up
            </Link>
          </div>
        </nav>

        {/* Mobile hamburger */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <Link
            href="/sign-up"
            className="rounded-lg bg-gold/90 px-2.5 py-1.5 text-xs font-medium text-black"
          >
            Sign Up
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown nav */}
      {menuOpen && (
        <div className="md:hidden border-t border-wireframe-stroke bg-[#0A0A0A]/95 backdrop-blur-xl px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={clsx(
                  "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-gold/10 text-gold border border-gold/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
