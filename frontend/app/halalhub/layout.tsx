'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, User, Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── HalalHub Vertical Layout ─────────────────────────────────────────────
   Domain: hh.aimanagedsolutions.cloud
   Vertical within A.I.M.S. — same design system, unique marketplace identity.
   Color palette: Emerald (#059669) primary, Gold (#F59E0B) accent, Slate base.
   ──────────────────────────────────────────────────────────────────────── */

function HalalHubNav() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const NAV_LINKS = [
    { label: 'Shop', href: '/halalhub/shop' },
    { label: 'Vendors', href: '/halalhub/shop?view=vendors' },
    { label: 'Services', href: '/halalhub/shop?view=services' },
    { label: 'Barakat', href: '/halalhub/shop?view=barakat' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/halalhub" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-sm">
            H
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-slate-900 leading-tight">
              HalalHub
            </span>
            <span className="text-[10px] font-medium text-emerald-600 leading-tight tracking-wide uppercase">
              by A.I.M.S.
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/halalhub/shop"
            className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>
          <Link
            href="/halalhub/(auth)/login"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <User className="h-4 w-4" />
            Sign In
          </Link>
          <button
            className="rounded-lg p-2 text-slate-500 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-200/60 md:hidden"
          >
            <nav className="flex flex-col gap-1 p-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/halalhub/(auth)/login"
                onClick={() => setMobileOpen(false)}
                className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white"
              >
                <User className="h-4 w-4" />
                Sign In
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function HalalHubFooter() {
  return (
    <footer className="border-t border-slate-200/60 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Shop</h4>
            <ul className="mt-3 space-y-2">
              {['Food & Groceries', 'Meat & Poultry', 'Restaurants', 'Catering'].map((item) => (
                <li key={item}>
                  <Link href="/halalhub/shop" className="text-sm text-slate-500 hover:text-emerald-600">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Services</h4>
            <ul className="mt-3 space-y-2">
              {['Certification', 'Consulting', 'Events', 'Education'].map((item) => (
                <li key={item}>
                  <Link href="/halalhub/shop" className="text-sm text-slate-500 hover:text-emerald-600">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Vendors</h4>
            <ul className="mt-3 space-y-2">
              {['Become a Vendor', 'Vendor Portal', 'Pricing', 'Barakat Program'].map((item) => (
                <li key={item}>
                  <Link href="/halalhub/shop" className="text-sm text-slate-500 hover:text-emerald-600">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">HalalHub</h4>
            <ul className="mt-3 space-y-2">
              {['About', 'How It Works', 'Trust & Safety', 'Contact'].map((item) => (
                <li key={item}>
                  <Link href="/halalhub" className="text-sm text-slate-500 hover:text-emerald-600">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center gap-3 border-t border-slate-200/60 pt-8 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} HalalHub by A.I.M.S. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">
            Powered by{' '}
            <Link href="/" className="font-medium text-amber-600 hover:text-amber-700">
              A.I.M.S.
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function HalalHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <HalalHubNav />
      <main className="flex-1">{children}</main>
      <HalalHubFooter />
    </div>
  );
}
