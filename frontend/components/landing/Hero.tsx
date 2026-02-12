'use client';

/**
 * A.I.M.S. Landing Page Hero — Triangle Layout
 *
 * Three primary actions arranged in a triangle:
 * 1. Chat w/ACHEEVY (primary — top center)
 * 2. Automate Everything (bottom left)
 * 3. Deploy Your Apps (bottom right — with Boomer_Angs at Port image)
 *
 * All three route through ACHEEVY.
 * Dark cinematic background. No static marketing cards.
 */

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MessageSquare, Zap, Rocket } from 'lucide-react';

// ── Animation Variants ──

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.3 + i * 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

// ── Hero Component ──

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0A0A0A]">
      {/* Cinematic background — Tron/Matrix digital hangar */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid floor perspective */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.6) 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.6) 70%, transparent 100%)',
          }}
        />
        {/* Gold ACHIEVEMOR logo — edges only */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/images/logos/achievemor-gold.png')",
            backgroundSize: '100px 100px',
            backgroundRepeat: 'repeat',
            opacity: 0.025,
            maskImage: 'linear-gradient(135deg, black 0%, transparent 20%, transparent 80%, black 100%)',
            WebkitMaskImage: 'linear-gradient(135deg, black 0%, transparent 20%, transparent 80%, black 100%)',
          }}
        />
        {/* Central vignette — dark cinematic */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.85) 100%)',
          }}
        />
        {/* Horizontal scan line — subtle */}
        <div className="absolute inset-0 opacity-[0.015]">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(212,175,55,0.3) 2px, rgba(212,175,55,0.3) 4px)',
            }}
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* System Online badge */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5">
            <div className="relative w-2 h-2">
              <div className="absolute inset-0 rounded-full bg-emerald-400" />
              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
            </div>
            <span className="text-xs text-emerald-400/80 font-mono tracking-wide">System Online</span>
          </div>
        </motion.div>

        {/* A.I.M.S. headline */}
        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-center mb-16 md:mb-20"
        >
          <h1
            className="text-5xl md:text-7xl lg:text-8xl mb-3 text-white/90 tracking-[0.15em]"
            style={{
              fontFamily: 'var(--font-display, "Doto", monospace)',
              textShadow: '0 0 40px rgba(212,175,55,0.15), 0 0 80px rgba(212,175,55,0.05)',
            }}
          >
            A.I.M.S.
          </h1>
          <h2
            className="text-lg md:text-2xl text-gold/70 tracking-[0.25em] uppercase"
            style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
          >
            AI Managed Solutions
          </h2>
        </motion.div>

        {/* ── Triangle Layout — 3 Primary Actions ── */}

        {/* Top: Chat w/ACHEEVY (Primary) */}
        <motion.div
          custom={0}
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="flex justify-center mb-8 md:mb-12"
        >
          <Link href="/dashboard/chat" className="group block">
            <div className="relative w-64 sm:w-72 md:w-80">
              <div className="wireframe-card p-6 md:p-8 text-center transition-all duration-500 group-hover:border-gold/40 group-hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] group-hover:bg-gold/5">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <MessageSquare className="w-8 h-8 text-gold" />
                </div>
                <h3
                  className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-gold transition-colors"
                  style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                >
                  Chat w/ACHEEVY
                </h3>
                <p className="text-xs text-white/35 leading-relaxed">
                  Your AI command center. Speak, type, build — everything starts here.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold text-black text-xs font-bold uppercase tracking-wider group-hover:shadow-lg group-hover:shadow-gold/20 transition-all">
                  Enter Command Center
                </div>
              </div>
              {/* Glow line connecting down */}
              <div className="hidden md:block absolute -bottom-12 left-1/2 w-px h-12 bg-gradient-to-b from-gold/20 to-transparent" />
            </div>
          </Link>
        </motion.div>

        {/* Bottom Row: Automate Everything + Deploy Your Apps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 max-w-4xl mx-auto">
          {/* Bottom Left: Automate Everything */}
          <motion.div
            custom={1}
            variants={scaleIn}
            initial="hidden"
            animate="visible"
          >
            <Link href="/dashboard/chat" className="group block">
              <div className="wireframe-card p-6 transition-all duration-500 group-hover:border-gold/30 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/15 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 transition-colors">
                    <Zap className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3
                      className="text-base md:text-lg font-bold text-white mb-1.5 group-hover:text-gold transition-colors"
                      style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                    >
                      Automate Everything
                    </h3>
                    <p className="text-xs text-white/30 leading-relaxed mb-3">
                      Route any task to ACHEEVY. Workflows, agents, and orchestration handled automatically.
                    </p>
                    <span className="text-[10px] text-gold/50 font-mono uppercase tracking-wider group-hover:text-gold/80 transition-colors">
                      Launch via ACHEEVY &rarr;
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Bottom Right: Deploy Your Apps */}
          <motion.div
            custom={2}
            variants={scaleIn}
            initial="hidden"
            animate="visible"
          >
            <Link href="/dashboard/chat" className="group block">
              <div className="wireframe-card p-6 transition-all duration-500 group-hover:border-gold/30 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] overflow-hidden">
                <div className="flex items-start gap-4">
                  {/* Boomer_Angs at Port image */}
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border border-gold/10 flex-shrink-0 bg-black/40">
                    <Image
                      src="/assets/port_dock_brand.png"
                      alt="Boomer_Angs at the Port"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div>
                    <h3
                      className="text-base md:text-lg font-bold text-white mb-1.5 group-hover:text-gold transition-colors"
                      style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                    >
                      Deploy Your Apps
                    </h3>
                    <p className="text-xs text-white/30 leading-relaxed mb-3">
                      Ship to production. Containers, infrastructure, and deployment — all managed.
                    </p>
                    <span className="text-[10px] text-gold/50 font-mono uppercase tracking-wider group-hover:text-gold/80 transition-colors flex items-center gap-1">
                      <Rocket className="w-3 h-3" />
                      Deploy via ACHEEVY &rarr;
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Connecting lines for triangle (desktop only) */}
        <div className="hidden md:block absolute top-0 left-0 w-full h-full pointer-events-none z-0" aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gold-line" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(212,175,55,0.4)" />
                <stop offset="100%" stopColor="rgba(212,175,55,0)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Bottom ambient glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(212,175,55,0.03), transparent)',
        }}
      />
    </section>
  );
}

export function FeatureSection() {
  return null;
}

export default Hero;
