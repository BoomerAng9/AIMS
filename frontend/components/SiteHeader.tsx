// frontend/components/SiteHeader.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

// Domain constants
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://plugmein.cloud';
const LANDING_DOMAIN = process.env.NEXT_PUBLIC_LANDING_URL || 'https://plugmein.cloud';

// Navigation for the LANDING domain (plugmein.cloud — lore, learn, explore)
const LANDING_NAV = [
  { href: "/", label: "Home" },
  { href: "/the-book-of-vibe", label: "Book of V.I.B.E." },
  { href: "/arena", label: "The Arena" },
  { href: "/sandbox", label: "Sandbox" },
  { href: "/gallery", label: "Gallery" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

// Navigation for the APP domain (plugmein.cloud — do, build, deploy)
const APP_NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chat", label: "Chat w/ACHEEVY" },
  { href: "/dashboard/circuit-box", label: "Circuit Box" },
  { href: "/dashboard/model-garden", label: "Model Garden" },
];

function useIsLandingDomain(): boolean {
  if (typeof window === 'undefined') return true; // SSR default
  const host = window.location.hostname.replace(/^www\./, '');
  // In dev, localhost serves both — show landing nav on root
  return host === 'plugmein.cloud' || host === 'localhost' || host === '127.0.0.1';
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isLanding = useIsLandingDomain();

  const navLinks = isLanding ? LANDING_NAV : APP_NAV;
  const crossDomainCta = isLanding
    ? { href: `${APP_DOMAIN}/sign-up`, label: "Get Started" }
    : { href: `${LANDING_DOMAIN}/the-book-of-vibe`, label: "Explore Lore" };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-wireframe-stroke glass-card h-14">
      <div className="flex h-full items-center px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Brand */}
        <Link className="flex items-center gap-2 flex-shrink-0" href="/">
          <div className="relative w-8 h-8 rounded-lg bg-white/5 border border-gold/20 flex items-center justify-center overflow-hidden">
            <img
              src="/images/acheevy/acheevy-helmet.png"
              className="object-contain"
              alt="ACHEEVY"
            />
          </div>
          <span className="font-display text-base tracking-[0.2em] font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold to-white hidden sm:inline uppercase">
            A.I.M.S.
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="ml-auto hidden md:flex items-center gap-2">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors text-white/70 hover:text-white"
              >
                {active && (
                  <motion.div
                    layoutId="header-active-tab"
                    className="absolute inset-0 rounded-lg bg-gold/10 border border-gold/20"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
          <div className="ml-4 flex items-center border-l border-white/10 pl-4">
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={crossDomainCta.href}
              className="rounded-lg bg-gold px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-gold/20 transition-all hover:bg-gold-light"
            >
              {crossDomainCta.label}
            </motion.a>
          </div>
        </nav>

        {/* Mobile hamburger */}
        <div className="ml-auto flex items-center gap-3 md:hidden">
          <a
            href={crossDomainCta.href}
            className="rounded-lg bg-gold px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-gold/20"
          >
            {crossDomainCta.label}
          </a>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-white/60 hover:text-white bg-white/5 border border-wireframe-stroke"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown nav */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-full left-0 w-full border-b border-wireframe-stroke glass-card px-4 py-4 space-y-2 shadow-2xl"
          >
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={clsx(
                    "block rounded-xl px-4 py-3 text-sm font-medium transition-colors border",
                    active
                      ? "bg-gold/10 text-gold border-gold/20"
                      : "text-white/70 hover:text-white bg-white/5 border-transparent hover:border-white/10"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
