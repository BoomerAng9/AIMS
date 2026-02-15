'use client';

/**
 * Minimal Sidebar Navigation
 *
 * Clean, Apple-friendly navigation inspired by OpenAI's design.
 * Features:
 * - Smooth spring animations
 * - SF-style typography
 * - Subtle vibrancy effects
 * - Proper touch targets for iOS
 * - System-consistent dark mode
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Navigation Items (OpenAI-style simple text links)
// ─────────────────────────────────────────────────────────────

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/deploy-dock', label: 'Deploy Dock' },
  { href: '/dashboard/plugs', label: 'aiPlugs' },
  { href: '/dashboard/house-of-ang', label: 'House of Ang' },
  { href: '/dashboard/circuit-box', label: 'Circuit Box' },
];

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function MinimalSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar (always visible) */}
      <aside className="hidden lg:flex flex-col w-48 h-screen fixed left-0 top-0 border-r border-white/[0.06] bg-black/40 backdrop-blur-xl">
        {/* Logo */}
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold flex items-center justify-center shadow-lg shadow-gold/20">
              <span className="text-sm font-bold text-black">A</span>
            </div>
            <span className="text-base font-semibold text-white tracking-tight">A.I.M.S.</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative block"
              >
                <motion.div
                  className={`
                    px-3 py-2.5 rounded-lg text-[15px] font-normal
                    transition-colors duration-200
                    ${isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                    }
                  `}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-white/[0.08] rounded-lg"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold flex items-center justify-center">
              <span className="text-xs font-medium text-black">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">User</p>
              <p className="text-xs text-gray-500 truncate">Free tier</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-black/60 backdrop-blur-xl border border-wireframe-stroke"
      >
        <MenuIcon className="w-5 h-5 text-white" />
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 w-64 h-screen bg-[#0a0a0a] border-r border-wireframe-stroke z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-wireframe-stroke">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold flex items-center justify-center">
                    <span className="text-sm font-bold text-black">A</span>
                  </div>
                  <span className="text-base font-semibold text-white">A.I.M.S.</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <CloseIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="p-3">
                {navItems.map((item, index) => {
                  const isActive = pathname === item.href ||
                    (item.href !== '/dashboard' && pathname?.startsWith(item.href));

                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`
                          block px-4 py-3 rounded-xl text-[15px] font-normal
                          transition-colors
                          ${isActive
                            ? 'bg-gold/20 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }
                        `}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Content Spacer for Desktop */}
      <div className="hidden lg:block w-48 flex-shrink-0" />
    </>
  );
}

export default MinimalSidebar;
