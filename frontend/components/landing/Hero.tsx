'use client';

/**
 * A.I.M.S. Landing Page — Hero + Feature Section
 *
 * Hero: Gold ACHIEVEMOR logo wallpaper background, "A.I.M.S. AI MANAGED SYSTEMS"
 * centered headline, two CTAs, System Online badge.
 * FeatureSection: 3 core platform feature cards.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion/variants';

// ─────────────────────────────────────────────────────────────
// Hero Component
// ─────────────────────────────────────────────────────────────

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0A0A0A]">
      {/* Gold ACHIEVEMOR logo wallpaper — repeated diagonal pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/images/logos/achievemor-gold.png')",
          backgroundSize: '120px 120px',
          backgroundRepeat: 'repeat',
          opacity: 0.04,
          transform: 'rotate(-15deg) scale(1.4)',
          transformOrigin: 'center center',
        }}
        aria-hidden="true"
      />

      {/* Subtle radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center px-4 max-w-3xl mx-auto"
      >
        {/* System Online badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-8"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400">
            <div className="w-full h-full rounded-full bg-emerald-400 animate-ping opacity-60" />
          </div>
          <span className="text-xs text-emerald-400/80 font-mono tracking-wide">System Online</span>
        </motion.div>

        {/* A.I.M.S. headline */}
        <h1
          className="text-5xl md:text-7xl lg:text-8xl mb-3 text-white/90 tracking-[0.15em]"
          style={{
            fontFamily: 'var(--font-display, "Doto", monospace)',
            textShadow: '0 0 30px rgba(212,168,67,0.15)',
          }}
        >
          A.I.M.S.
        </h1>

        {/* Subtitle */}
        <h2
          className="text-lg md:text-2xl lg:text-3xl text-gold/80 tracking-[0.2em] uppercase mb-6"
          style={{
            fontFamily: 'var(--font-display, "Doto", monospace)',
          }}
        >
          AI Managed Systems
        </h2>

        {/* Description */}
        <p className="text-sm md:text-base text-white/40 max-w-xl mx-auto leading-relaxed mb-10">
          We take powerful open-source AI tools and ship them as simple,
          managed solutions for you. No config. Just results.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/dashboard/acheevy"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-gold-light shadow-lg shadow-gold/20"
            >
              Chat w/ACHEEVY
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-8 py-3.5 text-sm font-medium uppercase tracking-wider text-white/60 transition-colors hover:bg-white/5 hover:text-white hover:border-white/25"
            >
              View Dashboard
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom feature cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-5xl mx-auto px-4 mt-16 md:mt-24 pb-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Automation & Workflows',
              description: 'Complete business logic automated behind the scenes. We route your requests to the best agents for the job.',
              icon: '⚡',
            },
            {
              title: 'Containerized Tools',
              description: 'We wrap industry-standard open source software in secure, managed Docker containers deployed instantly.',
              icon: '📦',
            },
            {
              title: 'AI Orchestrator',
              description: 'ACHEEVY is your single point of contact. Route any task, and the system builds the infrastructure.',
              icon: '🎯',
            },
          ].map((feature) => (
            <motion.div
              key={feature.title}
              variants={staggerItem}
              className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-gold/15 hover:bg-white/[0.04] transition-all"
            >
              <div className="text-2xl mb-3">{feature.icon}</div>
              <h3
                className="text-sm font-medium text-white/80 mb-2 tracking-wide"
                style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
              >
                {feature.title}
              </h3>
              <p className="text-xs text-white/35 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// FeatureSection kept for backwards compatibility if used elsewhere
export function FeatureSection() {
  return null;
}

export default Hero;
