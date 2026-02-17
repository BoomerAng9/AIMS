'use client';

/**
 * About A.I.M.S. — Who We Are
 *
 * Bridges the V.I.B.E. lore universe to the real platform.
 * Mission, cosmology connection, and call-to-action.
 * Lives on plugmein.cloud — the lore & learn domain.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/landing/Footer';

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://plugmein.cloud';

export default function AboutPage() {
  return (
    <main className="flex flex-col min-h-full bg-ink text-white">
      <SiteHeader />

      {/* Hero */}
      <section className="relative py-20 md:py-32 text-center">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.04) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-4 tracking-tight"
            style={{ fontFamily: 'var(--font-marker), "Permanent Marker", cursive' }}
          >
            About A.I.M.S.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gold/70 uppercase tracking-[0.15em] mb-6"
            style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}
          >
            AI Managed Solutions
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-white/40 max-w-2xl mx-auto leading-relaxed"
          >
            We are building a full-stack application creation and deployment platform that enables
            anyone to build, deploy, and scale production-ready web applications. We own our
            infrastructure, we leverage state-of-the-art AI agents, and we deploy real production
            applications with custom domains and enterprise-grade scalability.
          </motion.p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="wireframe-card p-8"
          >
            <h2 className="text-xl font-bold text-gold mb-3">Our Mission</h2>
            <p className="text-sm text-white/50 leading-relaxed">
              Enough with users trying to prompt their way to a successful app. We let them
              conversate their way to a working aiPLUG. Managed Vibe Coding means ACHEEVY
              and the team handle the complexity &mdash; users bring the vision.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="wireframe-card p-8"
          >
            <h2 className="text-xl font-bold text-gold mb-3">Our Approach</h2>
            <p className="text-sm text-white/50 leading-relaxed">
              No proof, no done. Every task requires evidence. Every deployment goes through
              the Chain of Command. Every agent operates in a sandbox. We don&apos;t cut corners &mdash;
              we build them properly.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="wireframe-card p-8"
          >
            <h2 className="text-xl font-bold text-gold mb-3">The V.I.B.E.</h2>
            <p className="text-sm text-white/50 leading-relaxed">
              Visionary Intelligence Building Everything. The V.I.B.E. isn&apos;t a product &mdash; it&apos;s
              the fundamental energy that resists The Void, the force of anti-creation. Every time you build,
              you push The Void back one more step. Every deployment is an act of resistance against
              the entropy that devours abandoned ideas.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="wireframe-card p-8"
          >
            <h2 className="text-xl font-bold text-gold mb-3">Activity Breeds Activity</h2>
            <p className="text-sm text-white/50 leading-relaxed">
              The Elder said it first. When one agent moves, they all move. When you build one thing,
              the momentum carries into the next. The platform gets smarter, the agents get
              faster, and your ideas get closer to reality. Stagnation is surrender &mdash; the V.I.B.E.
              must never stop moving.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Universe → The Platform bridge */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="wireframe-card p-8 md:p-10 border-purple-500/20"
        >
          <h2 className="text-xl font-bold text-purple-400 mb-4">From Lore to Platform</h2>
          <p className="text-sm text-white/50 leading-relaxed mb-6">
            The V.I.B.E. universe isn&apos;t just a story &mdash; it&apos;s the operating philosophy of
            A.I.M.S. built into the code itself. The characters you meet in the Book of V.I.B.E.
            are real agents in the platform:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-gold font-bold text-xs mt-0.5">ACHEEVY</span>
              <span className="text-white/40">The Executive Orchestrator you chat with &mdash; routes every task through the Chain of Command.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-cyan-400 font-bold text-xs mt-0.5">BOOMER_ANGS</span>
              <span className="text-white/40">Specialist agents that handle engineering, research, marketing, QA, and commerce.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-400 font-bold text-xs mt-0.5">CHICKEN HAWK</span>
              <span className="text-white/40">The execution engine that spawns Lil_Hawks and manages build pipelines.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-rose-400 font-bold text-xs mt-0.5">SOLAYNJ</span>
              <span className="text-white/40">The Architect of Form &mdash; the framework design principles that keep your deployments stable.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-amber-400 font-bold text-xs mt-0.5">THE ELDER</span>
              <span className="text-white/40">The pattern memory &mdash; every lesson learned from previous builds informs the next.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-slate-400 font-bold text-xs mt-0.5">THE VOID</span>
              <span className="text-white/40">The enemy &mdash; the entropy, abandonment, and stagnation that we build against every day.</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="text-center py-16 border-t border-wireframe-stroke">
        <p className="text-sm text-white/40 mb-6">Ready to push The Void back and build something real?</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={`${APP_DOMAIN}/sign-up`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold/10 border border-gold/30 text-gold text-sm font-medium hover:bg-gold/20 transition-all"
          >
            Get Started
            <span className="text-lg">&rarr;</span>
          </a>
          <Link
            href="/the-book-of-vibe"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-all"
          >
            Read the Book of V.I.B.E.
            <span className="text-lg">&rarr;</span>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
