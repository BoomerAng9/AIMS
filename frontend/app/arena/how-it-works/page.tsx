'use client';

/**
 * How It Works — The Arena Explainer
 *
 * Rules, contest types, payout structure, legal info, and FAQ.
 * This is the trust-building page that converts browsers to players.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Trophy, Brain, Target, Zap, Award, Shield, Clock,
  ArrowRight, Users, DollarSign, Star, TrendingUp,
  CheckCircle, XCircle,
} from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

const CONTEST_TYPES = [
  {
    icon: Brain, label: 'Trivia', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20',
    desc: 'Answer questions across categories — science, sports, history, entertainment. Faster correct answers earn bonus points.',
  },
  {
    icon: Target, label: "Pick'em", color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20',
    desc: 'Pick winners for real sporting events against the spread. Best record wins. Powered by live odds data.',
  },
  {
    icon: Trophy, label: 'Rank It', color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/20',
    desc: 'Rank prospects by P.A.I. score using your scouting knowledge. Perfect matches hit the jackpot. Powered by Per|Form data.',
  },
  {
    icon: Zap, label: 'Streak', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20',
    desc: 'Answer questions in a row. One wrong answer eliminates you. Last person standing wins. High risk, high reward.',
  },
];

const STEPS = [
  { num: '01', title: 'Create Account', desc: 'Sign up for free. No credit card needed to start. Jump into free contests immediately.' },
  { num: '02', title: 'Browse Contests', desc: 'Check the lobby for live and upcoming contests. Filter by type, category, and entry fee.' },
  { num: '03', title: 'Enter & Play', desc: 'Join a contest. Free contests cost nothing. Paid contests deduct from your wallet. Answer questions or make picks.' },
  { num: '04', title: 'Win & Earn', desc: 'Top finishers split the prize pool. Winnings go directly to your wallet. Earn XP and climb the leaderboard.' },
];

const TIERS = [
  { name: 'Rookie', xp: '0', color: 'text-zinc-400', bg: 'bg-zinc-400/10' },
  { name: 'Contender', xp: '500', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { name: 'Veteran', xp: '2,000', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { name: 'Elite', xp: '5,000', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { name: 'Legend', xp: '15,000', color: 'text-gold', bg: 'bg-gold/10' },
];

export default function HowItWorksPage() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-16"
    >
      {/* Hero */}
      <motion.section variants={fadeUp} className="text-center space-y-4">
        <h1 className="text-3xl md:text-5xl font-display text-white tracking-tight">
          How The Arena Works
        </h1>
        <p className="text-sm md:text-base text-white/40 max-w-2xl mx-auto">
          Skill-based contests where knowledge pays. AI generates fresh contests daily.
          Free and paid options. Real prizes. Pure skill — never luck.
        </p>
      </motion.section>

      {/* 4-Step Flow */}
      <motion.section variants={fadeUp} className="space-y-6">
        <h2 className="text-xs uppercase tracking-widest text-gold/50 font-mono text-center">
          Getting Started
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {STEPS.map(step => (
            <div key={step.num} className="wireframe-card rounded-2xl p-6 flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/20 text-gold font-display text-sm flex-shrink-0">
                {step.num}
              </div>
              <div>
                <h3 className="text-sm font-medium text-white mb-1">{step.title}</h3>
                <p className="text-[0.65rem] text-white/35 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Contest Types */}
      <motion.section variants={fadeUp} className="space-y-6">
        <h2 className="text-xs uppercase tracking-widest text-gold/50 font-mono text-center">
          Contest Types
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {CONTEST_TYPES.map(ct => (
            <div key={ct.label} className={`wireframe-card rounded-2xl p-6 ${ct.border}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${ct.bg} border ${ct.border} ${ct.color}`}>
                  <ct.icon size={18} />
                </div>
                <h3 className={`text-sm font-display ${ct.color}`}>{ct.label}</h3>
              </div>
              <p className="text-[0.65rem] text-white/35 leading-relaxed">{ct.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Payout Structure */}
      <motion.section variants={fadeUp} className="space-y-6">
        <h2 className="text-xs uppercase tracking-widest text-gold/50 font-mono text-center">
          Payout Structure
        </h2>
        <div className="wireframe-card rounded-2xl p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm text-white font-medium mb-4">Standard Payout</h3>
              <div className="space-y-2">
                {[
                  { place: '1st Place', pct: '50%', icon: Trophy, color: 'text-gold' },
                  { place: '2nd Place', pct: '30%', icon: Award, color: 'text-zinc-300' },
                  { place: '3rd Place', pct: '20%', icon: Award, color: 'text-amber-600' },
                ].map(row => (
                  <div key={row.place} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <row.icon size={14} className={row.color} />
                      <span className="text-sm text-white/60">{row.place}</span>
                    </div>
                    <span className="font-display text-gold">{row.pct}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm text-white font-medium mb-4">How Prize Pools Work</h3>
              <div className="space-y-3 text-[0.65rem] text-white/35 leading-relaxed">
                <p>Prize pools are funded by entry fees. A 15% platform fee is deducted, and the remaining 85% is distributed to winners.</p>
                <p>Free contests award XP instead of cash prizes. Some free contests have sponsored prize pools.</p>
                <div className="p-3 rounded-xl bg-gold/5 border border-gold/10">
                  <p className="text-gold text-xs font-medium mb-1">Example</p>
                  <p className="text-white/40">50 players x $10 entry = $500 total. After 15% fee ($75), the prize pool is $425. 1st gets $212.50, 2nd gets $127.50, 3rd gets $85.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Tier System */}
      <motion.section variants={fadeUp} className="space-y-6">
        <h2 className="text-xs uppercase tracking-widest text-gold/50 font-mono text-center">
          Player Tiers
        </h2>
        <div className="wireframe-card rounded-2xl p-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {TIERS.map((tier, i) => (
              <div key={tier.name} className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-lg ${tier.bg} ${tier.color} text-xs font-display`}>
                  {tier.name}
                </div>
                <span className="text-[0.5rem] font-mono text-white/20">{tier.xp} XP</span>
                {i < TIERS.length - 1 && <ArrowRight size={10} className="text-white/10 mx-1" />}
              </div>
            ))}
          </div>
          <p className="text-[0.6rem] text-white/25 text-center mt-4 font-mono">
            Earn XP by entering contests, winning, and maintaining streaks. Higher tiers unlock exclusive contests.
          </p>
        </div>
      </motion.section>

      {/* Legal / Fair Play */}
      <motion.section variants={fadeUp} className="space-y-6" id="legal">
        <h2 className="text-xs uppercase tracking-widest text-gold/50 font-mono text-center">
          Fair Play & Legal
        </h2>
        <div className="wireframe-card rounded-2xl p-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm text-white font-medium flex items-center gap-2">
                <Shield size={14} className="text-emerald-400" /> Skill-Based Contests
              </h3>
              <ul className="space-y-2">
                {[
                  'All contests are 100% skill-based — no random elements',
                  'Outcomes depend on knowledge, research, and analysis',
                  'No random draws, dice rolls, or chance elements',
                  'Compliant with skill-based contest regulations',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[0.65rem] text-white/35">
                    <CheckCircle size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm text-white font-medium flex items-center gap-2">
                <XCircle size={14} className="text-red-400" /> Not Gambling
              </h3>
              <ul className="space-y-2">
                {[
                  'No sports betting or wagering on game outcomes',
                  'No random number generators or slot mechanics',
                  'No house edge — platform only takes a flat fee',
                  'Free alternative entry method always available',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[0.65rem] text-white/35">
                    <CheckCircle size={12} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-4 border-t border-white/[0.04] text-[0.55rem] text-white/20 font-mono space-y-1">
            <p>Must be 18+ to participate in paid contests. Not available in all U.S. states.</p>
            <p>Excluded states: AZ, HI, ID, LA, MT, NV, WA. Play responsibly.</p>
            <p>Contest results are final. Disputes resolved within 48 hours.</p>
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section variants={fadeUp} className="text-center py-8">
        <Link
          href="/arena"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gold/10 border-2 border-gold/30 text-gold text-sm font-display font-medium hover:bg-gold/20 hover:border-gold/50 transition-all"
        >
          <Zap size={18} />
          Enter The Arena
        </Link>
      </motion.section>
    </motion.div>
  );
}
