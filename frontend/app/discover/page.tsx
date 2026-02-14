'use client';

/**
 * Discover — plugmein.cloud Entry Point
 *
 * "The Workshop" landing page showing:
 *   - Featured case study ("How We Caught a $180M Error")
 *   - Vertical showcase grid (Veritas, BlockWise, Strategos, etc.)
 *   - Live agent activity feed
 *   - "Try it free" CTA
 */

import { motion } from 'framer-motion';
import Link from 'next/link';

const VERTICALS = [
  {
    name: 'Veritas',
    tagline: 'Catch Million-Dollar Errors',
    description: 'Upload a business plan. Get a consultant-grade fact-check. Our agents caught a $180M CLV error that humans missed.',
    icon: 'shield',
    color: 'red',
    href: '/dashboard/veritas',
    status: 'live',
  },
  {
    name: 'BlockWise AI',
    tagline: 'Wealth Tech for the Culture',
    description: 'AI finds deals BEFORE Zillow. Know your numbers, fund with OPM, close in 90 days. From renter to landlord.',
    icon: 'building',
    color: 'emerald',
    href: '/dashboard/blockwise',
    status: 'live',
  },
  {
    name: 'Per|Form',
    tagline: 'Autonomous Sports Scouting',
    description: 'AI scouts debate prospects 24/7. GROC+Luke grading, SAM 2 film analysis, auto-generated content.',
    icon: 'trophy',
    color: 'amber',
    href: '/dashboard/war-room',
    status: 'live',
  },
  {
    name: 'Strategos',
    tagline: 'McKinsey Personas, Zero Budget',
    description: 'Census-backed customer segmentation. 3-tier personas with "Day in the Life" narratives. Data, not guesses.',
    icon: 'users',
    color: 'violet',
    href: '#',
    status: 'coming',
  },
  {
    name: 'Grant Scout',
    tagline: 'Government Money Finder',
    description: 'Daily briefing of contracts and grants matched to YOUR capabilities. SAM.gov + Grants.gov, filtered for you.',
    icon: 'search',
    color: 'cyan',
    href: '#',
    status: 'coming',
  },
  {
    name: 'Content Engine',
    tagline: 'Upload Once, Post Everywhere',
    description: 'Video to clips, captions, and cross-platform scheduling. Handles AAVE correctly. Creator-first.',
    icon: 'video',
    color: 'pink',
    href: '#',
    status: 'coming',
  },
];

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', glow: 'hover:shadow-red-500/10' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'hover:shadow-emerald-500/10' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'hover:shadow-amber-500/10' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', glow: 'hover:shadow-violet-500/10' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'hover:shadow-cyan-500/10' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20', glow: 'hover:shadow-pink-500/10' },
};

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-amber-400 font-mono text-sm tracking-widest mb-4"
          >
            A.I.M.S. — AI MANAGED SOLUTIONS
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight leading-tight"
          >
            Deploy AI agents that do
            <br />
            <span className="text-amber-400">$500/hr consulting work</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-zinc-400 mt-6 max-w-2xl mx-auto"
          >
            Fact-check business plans. Find real estate deals. Scout athlete talent.
            Build customer personas. All autonomous. All verified. All yours.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4 justify-center mt-8"
          >
            <Link
              href="/dashboard/veritas"
              className="px-6 py-3 bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-xl font-medium hover:bg-amber-500/25 transition-all"
            >
              Try Veritas Free
            </Link>
            <Link
              href="/dashboard/blockwise"
              className="px-6 py-3 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-xl font-medium hover:bg-zinc-700 transition-all"
            >
              Analyze a Deal
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Case Study */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-red-500/10 via-zinc-900/80 to-zinc-900/80 border border-red-500/20 rounded-2xl p-8 md:p-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-1 text-[10px] font-mono rounded bg-red-500/15 text-red-400 border border-red-500/20">
              CASE STUDY
            </span>
            <span className="text-xs text-zinc-500">Veritas Research Verification</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            How We Caught a <span className="text-red-400">$180 Million</span> Error
          </h2>
          <p className="text-zinc-400 text-lg mb-6 max-w-3xl">
            A client&apos;s expansion report claimed $4,000 Customer Lifetime Value over 7 years.
            Our agents cross-referenced 47 data sources and found the actual weighted average was
            <strong className="text-zinc-200"> $485</strong> — an
            <strong className="text-red-400"> 824% overestimation</strong> that inflated
            the entire market projection by $180M.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatPill label="Data Sources Checked" value="47" />
            <StatPill label="Claims Verified" value="12" />
            <StatPill label="Critical Error" value="$180M" color="red" />
            <StatPill label="Variance Detected" value="824%" color="red" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {['EXTRACT', 'VERIFY', 'ASSESS', 'REPORT'].map((step, i) => (
                <span key={step} className="px-2 py-1 text-[9px] font-mono rounded bg-zinc-800 text-zinc-500">
                  {i + 1}. {step}
                </span>
              ))}
            </div>
            <span className="text-xs text-zinc-600 ml-auto">Fully autonomous. Human reviewed only the final report.</span>
          </div>
        </motion.div>
      </section>

      {/* Verticals Grid */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold">Deploy a Boomer_Ang for Any Vertical</h2>
          <p className="text-zinc-500 mt-2">Each agent runs autonomously. You approve the output.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {VERTICALS.map((v, i) => {
            const c = COLOR_MAP[v.color] || COLOR_MAP.amber;
            return (
              <motion.div
                key={v.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={v.href}>
                  <div className={`group relative p-6 rounded-xl border ${c.border} ${c.bg} hover:shadow-lg ${c.glow} transition-all cursor-pointer h-full`}>
                    {v.status === 'coming' && (
                      <span className="absolute top-4 right-4 text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">
                        SOON
                      </span>
                    )}
                    {v.status === 'live' && (
                      <span className={`absolute top-4 right-4 text-[9px] font-mono px-1.5 py-0.5 rounded ${c.bg} ${c.text} border ${c.border}`}>
                        LIVE
                      </span>
                    )}
                    <h3 className={`text-lg font-bold ${c.text} mb-1`}>{v.name}</h3>
                    <p className="text-sm text-zinc-300 font-medium mb-2">{v.tagline}</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">{v.description}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Architecture Strip */}
      <section className="px-6 py-16 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-mono text-zinc-600 mb-4 tracking-widest">THE BOSS-GRUNT ARCHITECTURE</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
            <div className="px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <p className="font-bold">The Boss</p>
              <p className="text-xs text-zinc-500">Claude Opus — Strategy + Review</p>
            </div>
            <span className="text-zinc-700 text-lg">→</span>
            <div className="px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
              <p className="font-bold">The Grunts</p>
              <p className="text-xs text-zinc-500">Sonar + Brave — Data Retrieval</p>
            </div>
            <span className="text-zinc-700 text-lg">→</span>
            <div className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <p className="font-bold">The Guardrails</p>
              <p className="text-xs text-zinc-500">Variance Check — No Hallucinations</p>
            </div>
          </div>
          <p className="text-zinc-600 text-xs mt-6">
            Opus writes the prompts. Cheap models do the work. Python enforces the rules. You approve the output.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center border-t border-zinc-800/50">
        <h2 className="text-2xl font-bold mb-2">Ready for production?</h2>
        <p className="text-zinc-500 mb-6">Deploy these agents on aimanagedsolutions.cloud</p>
        <Link
          href="/dashboard/chat"
          className="inline-block px-8 py-4 bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-xl font-medium hover:bg-amber-500/25 transition-all text-lg"
        >
          Talk to ACHEEVY
        </Link>
      </section>
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center">
      <p className={`text-xl md:text-2xl font-mono font-bold ${color === 'red' ? 'text-red-400' : 'text-zinc-200'}`}>
        {value}
      </p>
      <p className="text-[10px] text-zinc-600 mt-0.5">{label}</p>
    </div>
  );
}
