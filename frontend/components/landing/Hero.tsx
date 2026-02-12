'use client';

/**
 * A.I.M.S. Landing Page — Hero Section
 *
 * Triangle layout with three active cards:
 *   Top center: Chat w/ACHEEVY (main hero)
 *   Bottom-left: Automate Everything (with Boomer_Angs team image)
 *   Bottom-right: Deploy Your Apps (with Boomer_Ang on Assignment image)
 *
 * All three route to the Chat w/ACHEEVY interface.
 */

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion/variants';

// ─────────────────────────────────────────────────────────────
// Hero Component
// ─────────────────────────────────────────────────────────────

export function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-full overflow-hidden bg-[#0A0A0A]">
      {/* Subtle radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-6xl mx-auto px-4 py-12 md:py-20"
      >
        {/* System Online badge */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-6"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400">
              <div className="w-full h-full rounded-full bg-emerald-400 animate-ping opacity-60" />
            </div>
            <span className="text-xs text-emerald-400/80 font-mono tracking-wide">System Online</span>
          </motion.div>

          {/* A.I.M.S. headline */}
          <h1
            className="text-5xl md:text-7xl lg:text-8xl mb-2 text-white/90 tracking-[0.15em]"
            style={{
              fontFamily: 'var(--font-display, "Doto", monospace)',
              textShadow: '0 0 30px rgba(212,168,67,0.15)',
            }}
          >
            A.I.M.S.
          </h1>

          <h2
            className="text-lg md:text-2xl text-gold/80 tracking-[0.2em] uppercase mb-4"
            style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
          >
            Managed AI Platform
          </h2>

          <p className="text-sm text-white/35 max-w-md mx-auto">
            Think it. Prompt it. Let ACHEEVY build it.
          </p>
        </div>

        {/* ── Triangle Card Layout ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-5 mt-8"
        >
          {/* Top — Chat w/ACHEEVY (main hero card) */}
          <motion.div variants={staggerItem} className="w-full max-w-xl">
            <Link href="/chat" className="group block">
              <div className="wireframe-card p-6 md:p-8 text-center hover:border-gold/30 hover:shadow-[0_0_40px_rgba(212,175,55,0.08)] transition-all duration-500">
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                  <Image
                    src="/images/acheevy/acheevy-helmet.png"
                    alt="ACHEEVY"
                    width={56}
                    height={56}
                    className="w-12 h-12 md:w-14 md:h-14 object-cover"
                  />
                </div>
                <h3
                  className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-gold transition-colors"
                  style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                >
                  Chat w/ACHEEVY
                </h3>
                <p className="text-sm text-white/40 mb-3">
                  Your AI executive orchestrator. Route tasks through the Chain of Command.
                </p>
                <span
                  className="text-gold/60 text-sm uppercase tracking-[0.15em] group-hover:text-gold transition-colors"
                  style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                >
                  Activity Breeds Activity
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Bottom row — two cards forming triangle base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-4xl">
            {/* Bottom-left: Automate Everything */}
            <motion.div variants={staggerItem}>
              <Link href="/chat" className="group block h-full">
                <div className="wireframe-card p-5 md:p-6 flex items-center gap-4 hover:border-gold/30 hover:shadow-[0_0_30px_rgba(212,175,55,0.06)] transition-all duration-500 h-full">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 border border-white/[0.06] group-hover:border-gold/20 transition-colors">
                    <Image
                      src="/images/boomerangs/ACHEEVY and the Boomer_Angs in a Hanger.png"
                      alt="Boomer_Angs, Chicken_Hawk and Lil_Hawks"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3
                      className="text-base md:text-lg font-bold text-white mb-1 group-hover:text-gold transition-colors"
                      style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                    >
                      Automate Everything
                    </h3>
                    <p className="text-xs md:text-sm text-white/35 leading-relaxed">
                      Deploy Boomer_Angs, Chicken_Hawk &amp; Lil_Hawks to orchestrate your workflows.
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Bottom-right: Deploy Your Apps */}
            <motion.div variants={staggerItem}>
              <Link href="/chat" className="group block h-full">
                <div className="wireframe-card p-5 md:p-6 flex items-center gap-4 hover:border-gold/30 hover:shadow-[0_0_30px_rgba(212,175,55,0.06)] transition-all duration-500 h-full">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 border border-white/[0.06] group-hover:border-gold/20 transition-colors">
                    <Image
                      src="/images/boomerangs/Boomer_ang on Assignment.JPG"
                      alt="Boomer_Angs at the port"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3
                      className="text-base md:text-lg font-bold text-white mb-1 group-hover:text-gold transition-colors"
                      style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                    >
                      Deploy Your Apps
                    </h3>
                    <p className="text-xs md:text-sm text-white/35 leading-relaxed">
                      Containerized. Managed. Deployed to production instantly.
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// Kept for backwards compatibility
export function FeatureSection() {
  return null;
}

export default Hero;
