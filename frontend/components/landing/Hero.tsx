'use client';

/**
 * A.I.M.S. Landing Page — Hero Section
 *
 * Domain-aware hero that serves both domains:
 *
 * plugmein.cloud (LORE):
 *   Background: ACHEEVY x Elder Ceremony
 *   EXPLORE cards → lore pages (Book of V.I.B.E., Gallery, Merch)
 *   DO cards → cross-domain links to aimanagedsolutions.cloud
 *
 * aimanagedsolutions.cloud (FUNCTIONS):
 *   Background: Port Dock (managed services)
 *   Action Chain visual → pipeline visualization (Classify → Route → Execute → Deliver)
 *   DO cards → Chat, Dashboard, Deploy
 *   No lore — pure operations
 *
 * Hero copy (non-negotiable):
 *   1) "Welcome to AI Managed Solutions."
 *   2) "I'm ACHEEVY, at your service."
 *   3) "What will we deploy today?"
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MessageSquare, LayoutDashboard, Rocket, ArrowRight, Brain, GitBranch, Cpu, CheckCircle2 } from 'lucide-react';

// Cross-domain URLs
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://plugmein.cloud';

// ── Domain Detection (hydration-safe) ──

function useIsLandingDomain(): boolean {
  const [isLanding, setIsLanding] = useState(true);
  useEffect(() => {
    const host = window.location.hostname.replace(/^www\./, '');
    setIsLanding(host === 'plugmein.cloud' || host === 'localhost' || host === '127.0.0.1');
  }, []);
  return isLanding;
}

// ── Animation Variants ──

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const chainStep = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

// ── Action Chain Steps ──
const ACTION_CHAIN = [
  { icon: Brain, label: 'Classify', desc: 'Intent detection', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { icon: GitBranch, label: 'Route', desc: 'Team assignment', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { icon: Cpu, label: 'Execute', desc: 'Task pipeline', color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/20' },
  { icon: CheckCircle2, label: 'Deliver', desc: 'Verified output', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
];

// ── Hero Component ──

export function Hero() {
  const isLore = useIsLandingDomain();

  return (
    <section className="relative flex flex-col items-center bg-ink min-h-[90vh]">
      {/* Hero background — domain-aware */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <Image
          src={isLore ? '/images/acheevy/elder-ceremony-hero.jpeg' : '/assets/port_dock_brand.png'}
          alt=""
          fill
          priority
          className={`object-cover object-center ${isLore ? 'opacity-30' : 'opacity-20'}`}
          sizes="100vw"
        />
      </div>

      {/* Gradient overlays */}
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
        className="relative z-10 w-full max-w-6xl mx-auto px-4 pt-20 md:pt-28 pb-24 md:pb-32"
      >
        {/* System Online badge */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-8"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400">
              <div className="w-full h-full rounded-full bg-emerald-400 animate-ping opacity-60" />
            </div>
            <span className="text-sm text-emerald-400/80 font-mono tracking-wide">System Online</span>
          </motion.div>

          {/* A.I.M.S. — Permanent Marker font (embossed wordmark) */}
          <h1
            className="text-6xl md:text-8xl lg:text-9xl mb-4 text-white/90 tracking-[0.08em]"
            style={{
              fontFamily: 'var(--font-marker), "Permanent Marker", cursive',
              textShadow: '0 2px 40px rgba(212,168,67,0.2), 0 0 60px rgba(212,168,67,0.08)',
            }}
          >
            A.I.M.S.
          </h1>

          {/* AI Managed Solutions — Doto Black font */}
          <h2
            className="text-xl md:text-3xl text-gold/80 tracking-[0.2em] uppercase mb-6 font-black"
            style={{
              fontFamily: 'var(--font-doto), "Doto", monospace',
            }}
          >
            AI Managed Solutions
          </h2>

          <p className="text-base md:text-xl text-white/75 max-w-lg mx-auto leading-relaxed">
            I&apos;m ACHEEVY, at your service.<br />
            {isLore ? 'What will we deploy today?' : 'Your AI-managed operations platform.'}
          </p>
        </div>

        {/* ── FUNCTIONS site: Action Chain + DO cards ── */}
        {!isLore && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-8 mt-6"
          >
            {/* Action Chain — Pipeline Visualization */}
            <motion.div variants={staggerItem} className="w-full max-w-3xl">
              <div className="flex items-center gap-3 mb-6 justify-center">
                <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
                <span
                  className="text-sm tracking-[0.3em] uppercase text-gold/60"
                  style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}
                >
                  How ACHEEVY Works
                </span>
                <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
              </div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
              >
                {ACTION_CHAIN.map((step, i) => (
                  <motion.div key={step.label} variants={chainStep} className="relative">
                    <div className={`wireframe-card p-4 md:p-5 text-center ${step.bg} ${step.border} hover:scale-[1.03] transition-transform duration-300`}>
                      <div className={`w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 rounded-xl ${step.bg} border ${step.border} flex items-center justify-center`}>
                        <step.icon className={`w-5 h-5 md:w-6 md:h-6 ${step.color}`} />
                      </div>
                      <h4
                        className={`text-sm md:text-base font-bold ${step.color} mb-1`}
                        style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                      >
                        {step.label}
                      </h4>
                      <p className="text-xs md:text-sm text-white/55">{step.desc}</p>
                    </div>
                    {/* Connector arrow (hidden on last) */}
                    {i < ACTION_CHAIN.length - 1 && (
                      <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                        <ArrowRight className="w-4 h-4 text-white/30" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Section Label: DO */}
            <motion.div variants={staggerItem} className="flex items-center gap-3 w-full max-w-xl">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
              <span
                className="text-sm tracking-[0.3em] uppercase text-gold/50"
                style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}
              >
                Get Started
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            </motion.div>

            {/* Main CTA — Chat w/ACHEEVY */}
            <motion.div variants={staggerItem} className="w-full max-w-xl">
              <Link href="/chat" className="group block">
                <div className="wireframe-card p-7 md:p-10 text-center hover:border-gold/30 hover:shadow-[0_0_40px_rgba(212,175,55,0.08)] transition-all duration-500">
                  <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-5 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                    <Image
                      src="/images/acheevy/acheevy-helmet.png"
                      alt="ACHEEVY"
                      width={64}
                      height={64}
                      className="w-14 h-14 md:w-16 md:h-16 object-cover animate-head-bob"
                    />
                  </div>
                  <h3
                    className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-gold transition-colors"
                    style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                  >
                    Chat w/ACHEEVY
                  </h3>
                  <p className="text-base md:text-lg text-white/65 mb-4 max-w-md mx-auto">
                    Your AI executive orchestrator. Tell ACHEEVY what you need — the team handles the rest.
                  </p>
                  <span
                    className="inline-flex items-center gap-2 text-gold/60 text-base uppercase tracking-[0.15em] group-hover:text-gold transition-colors"
                    style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                  >
                    Start a conversation <MessageSquare className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* Secondary DO cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-4xl">
              {/* Dashboard */}
              <motion.div variants={staggerItem}>
                <Link href="/dashboard" className="group block h-full">
                  <div className="wireframe-card p-6 md:p-7 flex items-center gap-5 hover:border-gold/30 hover:shadow-[0_0_30px_rgba(212,175,55,0.06)] transition-all duration-500 h-full">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <LayoutDashboard className="w-7 h-7 md:w-8 md:h-8 text-gold/70" />
                    </div>
                    <div>
                      <h3
                        className="text-lg md:text-xl font-bold text-white mb-1.5 group-hover:text-gold transition-colors"
                        style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                      >
                        Mission Control
                      </h3>
                      <p className="text-sm md:text-base text-white/60 leading-relaxed">
                        Your operational dashboard. Monitor services, deploy apps, manage your AI fleet.
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Deploy */}
              <motion.div variants={staggerItem}>
                <Link href="/chat" className="group block h-full">
                  <div className="wireframe-card p-6 md:p-7 flex items-center gap-5 hover:border-gold/30 hover:shadow-[0_0_30px_rgba(212,175,55,0.06)] transition-all duration-500 h-full">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Rocket className="w-7 h-7 md:w-8 md:h-8 text-emerald-400/70" />
                    </div>
                    <div>
                      <h3
                        className="text-lg md:text-xl font-bold text-white mb-1.5 group-hover:text-emerald-400 transition-colors"
                        style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                      >
                        Deploy Your Apps
                      </h3>
                      <p className="text-sm md:text-base text-white/60 leading-relaxed">
                        Managed Vibe Coding. Conversate your way to a working aiPLUG.
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </div>

            {/* Capabilities row */}
            <motion.div variants={staggerItem} className="w-full max-w-4xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Voice I/O', desc: 'Speak and listen', icon: '🎙' },
                  { label: 'Multi-Model', desc: 'Claude, Gemini, Qwen', icon: '🧠' },
                  { label: 'Auto-Deploy', desc: 'Docker + CI/CD', icon: '🚀' },
                  { label: 'Evidence-Based', desc: 'No proof, no done', icon: '📋' },
                ].map(cap => (
                  <div key={cap.label} className="wireframe-card p-4 text-center">
                    <div className="text-2xl mb-2">{cap.icon}</div>
                    <h4
                      className="text-sm font-bold text-white/80 mb-0.5"
                      style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                    >
                      {cap.label}
                    </h4>
                    <p className="text-xs text-white/50">{cap.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── LORE site: DO section + EXPLORE section ── */}
        {isLore && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-6 mt-8"
          >
            {/* Section Label: DO */}
            <motion.div variants={staggerItem} className="flex items-center gap-3 w-full max-w-xl">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
              <span
                className="text-sm tracking-[0.3em] uppercase text-gold/50"
                style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}
              >
                Do
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            </motion.div>

            {/* Main CTA — Chat w/ACHEEVY */}
            <motion.div variants={staggerItem} className="w-full max-w-xl">
              <a href={`${APP_DOMAIN}/chat`} className="group block">
                <div className="wireframe-card p-7 md:p-10 text-center hover:border-gold/30 hover:shadow-[0_0_40px_rgba(212,175,55,0.08)] transition-all duration-500">
                  <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-5 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                    <Image
                      src="/images/acheevy/acheevy-helmet.png"
                      alt="ACHEEVY"
                      width={64}
                      height={64}
                      className="w-14 h-14 md:w-16 md:h-16 object-cover animate-head-bob"
                    />
                  </div>
                  <h3
                    className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-gold transition-colors"
                    style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                  >
                    Chat w/ACHEEVY
                  </h3>
                  <p className="text-base md:text-lg text-white/65 mb-4">
                    Your AI executive orchestrator. Tell ACHEEVY what you need — the team handles the rest.
                  </p>
                  <span
                    className="text-gold/60 text-base uppercase tracking-[0.15em] group-hover:text-gold transition-colors"
                    style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                  >
                    Activity Breeds Activity
                  </span>
                </div>
              </a>
            </motion.div>

            {/* Secondary DO cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-4xl">
              <motion.div variants={staggerItem}>
                <a href={`${APP_DOMAIN}/dashboard`} className="group block h-full">
                  <div className="wireframe-card p-6 md:p-7 flex items-center gap-5 hover:border-gold/30 hover:shadow-[0_0_30px_rgba(212,175,55,0.06)] transition-all duration-500 h-full">
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
                        className="text-lg md:text-xl font-bold text-white mb-1.5 group-hover:text-gold transition-colors"
                        style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                      >
                        Automate Everything
                      </h3>
                      <p className="text-sm md:text-base text-white/60 leading-relaxed">
                        Deploy Boomer_Angs, Chicken Hawk &amp; Lil_Hawks to orchestrate your workflows.
                      </p>
                    </div>
                  </div>
                </a>
              </motion.div>

              <motion.div variants={staggerItem}>
                <a href={`${APP_DOMAIN}/chat`} className="group block h-full">
                  <div className="wireframe-card p-6 md:p-7 flex items-center gap-5 hover:border-gold/30 hover:shadow-[0_0_30px_rgba(212,175,55,0.06)] transition-all duration-500 h-full">
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
                        className="text-lg md:text-xl font-bold text-white mb-1.5 group-hover:text-gold transition-colors"
                        style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                      >
                        Deploy Your Apps
                      </h3>
                      <p className="text-sm md:text-base text-white/60 leading-relaxed">
                        Managed Vibe Coding. Conversate your way to a working aiPLUG.
                      </p>
                    </div>
                  </div>
                </a>
              </motion.div>
            </div>

            {/* ── EXPLORE Section — Lore pages ── */}
            <motion.div variants={staggerItem} className="flex items-center gap-3 w-full max-w-4xl mt-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span
                className="text-sm tracking-[0.3em] uppercase text-white/50"
                style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}
              >
                Explore
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
              <motion.div variants={staggerItem}>
                <Link href="/the-book-of-vibe" className="group block h-full">
                  <div className="wireframe-card p-6 text-center hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(147,51,234,0.06)] transition-all duration-500 h-full">
                    <div className="text-4xl mb-3">📖</div>
                    <h3
                      className="text-base md:text-lg font-bold text-white mb-1.5 group-hover:text-purple-400 transition-colors"
                      style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                    >
                      The Book of V.I.B.E.
                    </h3>
                    <p className="text-sm text-white/55">
                      An Afrofuturist saga of Achievmor &mdash; the canonical origin of the V.I.B.E. universe. 12 chapters.
                    </p>
                  </div>
                </Link>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Link href="/gallery" className="group block h-full">
                  <div className="wireframe-card p-6 text-center hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.06)] transition-all duration-500 h-full">
                    <div className="text-4xl mb-3">🖼</div>
                    <h3
                      className="text-base md:text-lg font-bold text-white mb-1.5 group-hover:text-cyan-400 transition-colors"
                      style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                    >
                      Character Gallery
                    </h3>
                    <p className="text-sm text-white/55">
                      Aether Vos, The Elder, ACHEEVY &mdash; the full V.I.B.E. roster and the seven peoples of Achievmor.
                    </p>
                  </div>
                </Link>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Link href="/merch" className="group block h-full">
                  <div className="wireframe-card p-6 text-center hover:border-gold/30 hover:shadow-[0_0_30px_rgba(212,175,55,0.06)] transition-all duration-500 h-full">
                    <div className="text-4xl mb-3">🛍</div>
                    <h3
                      className="text-base md:text-lg font-bold text-white mb-1.5 group-hover:text-gold transition-colors"
                      style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                    >
                      Merch Store
                    </h3>
                    <p className="text-sm text-white/55">
                      Rep the V.I.B.E. &mdash; apparel, gear, and collectibles from the Aether.
                    </p>
                  </div>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}

export function FeatureSection() {
  return null;
}

export default Hero;
