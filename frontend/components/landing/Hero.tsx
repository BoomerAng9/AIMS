'use client';

/**
 * A.I.M.S. Landing Page — Hero Section
 *
 * Dual-purpose hero that serves both domains:
 *
 * plugmein.cloud (LEARN):
 *   DO cards → link to plugmein.cloud (Chat, Build, Deploy)
 *   EXPLORE cards → local lore pages (Book of V.I.B.E., Gallery, About)
 *
 * plugmein.cloud (DO):
 *   Direct action cards → local routes (Chat, Dashboard, Circuit Box)
 *
 * Hero copy (non-negotiable):
 *   1) "Welcome to AI Managed Solutions."
 *   2) "I'm ACHEEVY, at your service."
 *   3) "What will we deploy today?"
 */

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Cross-domain URLs
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://plugmein.cloud';

// ── Animation Variants ──

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

// ── Hero Component ──

export function Hero() {
  return (
    <section className="relative flex flex-col items-center bg-ink">
      {/* Hero background — ACHEEVY X Elder Ceremony */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <Image
          src="/images/acheevy/elder-ceremony-hero.jpeg"
          alt=""
          fill
          priority
          className="object-cover object-center opacity-30"
          sizes="100vw"
        />
      </div>

      {/* Gradient overlays for text readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(10,10,12,0.55) 0%, rgba(10,10,12,0.3) 35%, rgba(10,10,12,0.7) 65%, rgba(10,10,12,0.95) 100%)',
        }}
        aria-hidden="true"
      />
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
        className="relative z-10 w-full max-w-6xl mx-auto px-4 pt-16 md:pt-24 pb-24 md:pb-32"
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

          {/* A.I.M.S. — Permanent Marker font (embossed wordmark) */}
          <h1
            className="text-5xl md:text-7xl lg:text-8xl mb-3 text-white/90 tracking-[0.08em]"
            style={{
              fontFamily: 'var(--font-marker), "Permanent Marker", cursive',
              textShadow: '0 2px 40px rgba(212,168,67,0.2), 0 0 60px rgba(212,168,67,0.08)',
            }}
          >
            A.I.M.S.
          </h1>

          {/* AI Managed Solutions — Doto Black font */}
          <h2
            className="text-lg md:text-2xl text-gold/80 tracking-[0.2em] uppercase mb-4 font-black"
            style={{
              fontFamily: 'var(--font-doto), "Doto", monospace',
            }}
          >
            AI Managed Solutions
          </h2>

          <p className="text-sm text-white/35 max-w-md mx-auto">
            I&apos;m ACHEEVY, at your service.<br />
            What will we deploy today?
          </p>
        </div>

        {/* ── DO Section — Actions that go to plugmein.cloud ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-5 mt-8"
        >
          {/* Section Label: DO */}
          <motion.div variants={staggerItem} className="flex items-center gap-3 w-full max-w-xl">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            <span
              className="text-xs tracking-[0.3em] uppercase text-gold/50"
              style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}
            >
              Do
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          </motion.div>

          {/* Top — Chat w/ACHEEVY (main hero card) */}
          <motion.div variants={staggerItem} className="w-full max-w-xl">
            <a href={`${APP_DOMAIN}/chat`} className="group block">
              <div className="wireframe-card p-6 md:p-8 text-center hover:border-gold/30 hover:shadow-[0_0_40px_rgba(212,175,55,0.08)] transition-all duration-500">
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                  <Image
                    src="/images/acheevy/acheevy-helmet.png"
                    alt="ACHEEVY"
                    width={56}
                    height={56}
                    className="w-12 h-12 md:w-14 md:h-14 object-cover animate-head-bob"
                  />
                </div>
                <h3
                  className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-gold transition-colors"
                  style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                >
                  Chat w/ACHEEVY
                </h3>
                <p className="text-sm text-white/40 mb-3">
                  Your AI executive orchestrator. Tell ACHEEVY what you need — the team handles the rest.
                </p>
                <span
                  className="text-gold/60 text-sm uppercase tracking-[0.15em] group-hover:text-gold transition-colors"
                  style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                >
                  Activity Breeds Activity
                </span>
              </div>
            </a>
          </motion.div>

          {/* Bottom row — two DO cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-4xl">
            {/* Automate Everything */}
            <motion.div variants={staggerItem}>
              <a href={`${APP_DOMAIN}/dashboard`} className="group block h-full">
                <div className="wireframe-card p-5 md:p-6 flex items-center gap-4 hover:border-gold/30 hover:shadow-[0_0_30px_rgba(212,175,55,0.06)] transition-all duration-500 h-full">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 border border-white/[0.06] group-hover:border-gold/20 transition-colors">
                    <Image
                      src="/images/boomerangs/ACHEEVY and the Boomer_Angs in a Hanger.png"
                      alt="Boomer_Angs, Chicken Hawk and Lil_Hawks"
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
                      Deploy Boomer_Angs, Chicken Hawk &amp; Lil_Hawks to orchestrate your workflows.
                    </p>
                  </div>
                </div>
              </a>
            </motion.div>

            {/* Deploy Your Apps — Managed Vibe Coding */}
            <motion.div variants={staggerItem}>
              <a href={`${APP_DOMAIN}/chat`} className="group block h-full">
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
                      Managed Vibe Coding. Conversate your way to a working aiPLUG.
                    </p>
                  </div>
                </div>
              </a>
            </motion.div>
          </div>

          {/* ── EXPLORE Section — Lore pages on plugmein.cloud ── */}
          <motion.div variants={staggerItem} className="flex items-center gap-3 w-full max-w-4xl mt-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span
              className="text-xs tracking-[0.3em] uppercase text-white/30"
              style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}
            >
              Explore
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
            {/* Book of V.I.B.E. */}
            <motion.div variants={staggerItem}>
              <Link href="/the-book-of-vibe" className="group block h-full">
                <div className="wireframe-card p-5 text-center hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(147,51,234,0.06)] transition-all duration-500 h-full">
                  <div className="text-3xl mb-3">📖</div>
                  <h3
                    className="text-sm font-bold text-white mb-1 group-hover:text-purple-400 transition-colors"
                    style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                  >
                    The Book of V.I.B.E.
                  </h3>
                  <p className="text-xs text-white/30">
                    From NIL to ACHEEVY &mdash; the canonical origin of the V.I.B.E. universe. 13 chapters.
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Character Gallery */}
            <motion.div variants={staggerItem}>
              <Link href="/gallery" className="group block h-full">
                <div className="wireframe-card p-5 text-center hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.06)] transition-all duration-500 h-full">
                  <div className="text-3xl mb-3">🖼</div>
                  <h3
                    className="text-sm font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors"
                    style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                  >
                    Character Gallery
                  </h3>
                  <p className="text-xs text-white/30">
                    The Elder, SOLAYNJ, Aether Vos, ACHEEVY, NIL &mdash; the full V.I.B.E. roster and the five races.
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Merch */}
            <motion.div variants={staggerItem}>
              <Link href="/merch" className="group block h-full">
                <div className="wireframe-card p-5 text-center hover:border-gold/30 hover:shadow-[0_0_30px_rgba(212,175,55,0.06)] transition-all duration-500 h-full">
                  <div className="text-3xl mb-3">🛍</div>
                  <h3
                    className="text-sm font-bold text-white mb-1 group-hover:text-gold transition-colors"
                    style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                  >
                    Merch Store
                  </h3>
                  <p className="text-xs text-white/30">
                    Rep the V.I.B.E. &mdash; apparel, gear, and collectibles from the Aether.
                  </p>
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export function FeatureSection() {
  return null;
}

export default Hero;
