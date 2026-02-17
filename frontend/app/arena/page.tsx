'use client';

/**
 * The Arena — Main Lobby
 *
 * The ESPN SportsCenter of skill-based contests.
 * Features: Hero, Featured Contests, Live Now, Upcoming, Stats Bar.
 * Built to the same quality bar as a $10M ESPN product.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Trophy, Zap, Users, TrendingUp, Clock, ArrowRight,
  Star, Target, Brain, Flame, Crown, Award,
} from 'lucide-react';
import type { ArenaContest } from '@/lib/arena/types';
import {
  CONTEST_TYPE_STYLES, STATUS_STYLES, DIFFICULTY_STYLES,
  formatCurrency, getTimeRemaining,
} from '@/lib/arena/types';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function ArenaLobby() {
  const [contests, setContests] = useState<ArenaContest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/arena/contests')
      .then(r => r.json())
      .then(data => {
        setContests(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const liveContests = contests.filter(c => c.status === 'LIVE');
  const upcomingContests = contests.filter(c => c.status === 'UPCOMING');
  const featuredContests = contests.filter(c => c.featured);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-10"
    >
      {/* ── Hero ─────────────────────────────────────────────── */}
      <motion.section variants={fadeUp} className="relative overflow-hidden rounded-3xl border border-wireframe-stroke">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 30% 50%, rgba(212,175,55,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(147,51,234,0.06) 0%, transparent 60%)',
          }}
        />
        <div className="relative z-10 px-8 md:px-12 py-12 md:py-16">
          <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 border border-gold/20">
                <Trophy size={24} className="text-gold" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-display text-white tracking-tight">
                  THE ARENA
                </h1>
                <p className="text-[0.6rem] font-mono uppercase tracking-[0.3em] text-gold/60">
                  Skill-Based Contests Powered by AI
                </p>
              </div>
            </div>
            <p className="text-sm md:text-base text-white/40 leading-relaxed max-w-lg">
              Test your knowledge. Make your picks. Climb the ranks.
              Daily AI-generated contests across trivia, sports, and Per|Form prospect analysis.
              Free and paid entries. Real prizes. Pure skill.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#live"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-sm font-medium hover:bg-emerald-400/15 transition-all"
              >
                <Zap size={16} />
                Play Now
              </Link>
              <Link
                href="/arena/how-it-works"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 transition-all"
              >
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Stats Strip ──────────────────────────────────────── */}
      <motion.section variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: 'Active Players', value: '142', color: 'text-emerald-400' },
          { icon: Trophy, label: 'Contests Today', value: String(contests.length), color: 'text-gold' },
          { icon: TrendingUp, label: 'Prize Pools', value: formatCurrency(contests.reduce((sum, c) => sum + c.prizePool, 0)), color: 'text-blue-400' },
          { icon: Flame, label: 'Longest Streak', value: '25', color: 'text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="wireframe-card rounded-2xl p-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div>
              <p className={`text-lg font-display ${stat.color}`}>{stat.value}</p>
              <p className="text-[0.5rem] font-mono text-white/25 uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.section>

      {/* ── Featured Contests ────────────────────────────────── */}
      {featuredContests.length > 0 && (
        <motion.section variants={fadeUp} className="space-y-4" id="featured">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star size={14} className="text-gold" />
              <h2 className="text-xs uppercase tracking-widest text-gold/60 font-mono">Featured</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredContests.map(contest => (
              <ContestCard key={contest.id} contest={contest} featured />
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Live Now ─────────────────────────────────────────── */}
      {liveContests.length > 0 && (
        <motion.section variants={fadeUp} className="space-y-4" id="live">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xs uppercase tracking-widest text-emerald-400/60 font-mono">Live Now</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {liveContests.map(contest => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Upcoming ─────────────────────────────────────────── */}
      {upcomingContests.length > 0 && (
        <motion.section variants={fadeUp} className="space-y-4" id="upcoming">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-blue-400" />
              <h2 className="text-xs uppercase tracking-widest text-blue-400/60 font-mono">Upcoming</h2>
            </div>
            <span className="text-[0.5rem] font-mono text-white/20">
              {upcomingContests.length} contest{upcomingContests.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingContests.map(contest => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Quick Links ──────────────────────────────────────── */}
      <motion.section variants={fadeUp} className="grid gap-3 md:grid-cols-3">
        <Link
          href="/arena/leaderboard"
          className="wireframe-card rounded-2xl p-5 flex items-center gap-4 hover:border-gold/20 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/20 text-gold">
            <Crown size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white group-hover:text-gold transition-colors">Leaderboard</p>
            <p className="text-[0.55rem] text-white/30 font-mono">Top players and rankings</p>
          </div>
          <ArrowRight size={14} className="text-white/15 group-hover:text-gold/40 transition-colors" />
        </Link>

        <Link
          href="/sandbox/perform"
          className="wireframe-card rounded-2xl p-5 flex items-center gap-4 hover:border-emerald-400/20 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
            <Target size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">Per|Form Hub</p>
            <p className="text-[0.55rem] text-white/30 font-mono">AI scouting + P.A.I. grades</p>
          </div>
          <ArrowRight size={14} className="text-white/15 group-hover:text-emerald-400/40 transition-colors" />
        </Link>

        <Link
          href="/arena/how-it-works"
          className="wireframe-card rounded-2xl p-5 flex items-center gap-4 hover:border-purple-400/20 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/10 border border-purple-400/20 text-purple-400">
            <Brain size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">How It Works</p>
            <p className="text-[0.55rem] text-white/30 font-mono">Rules, payouts, and FAQ</p>
          </div>
          <ArrowRight size={14} className="text-white/15 group-hover:text-purple-400/40 transition-colors" />
        </Link>
      </motion.section>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-block h-8 w-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-xs text-white/30 mt-4 font-mono">Loading contests...</p>
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Contest Card Component
// ─────────────────────────────────────────────────────────────

function ContestCard({ contest, featured }: { contest: ArenaContest; featured?: boolean }) {
  const typeStyle = CONTEST_TYPE_STYLES[contest.type];
  const statusStyle = STATUS_STYLES[contest.status];
  const diffStyle = DIFFICULTY_STYLES[contest.difficulty];
  const spotsLeft = contest.maxEntries - contest.currentEntries;
  const fillPercent = Math.round((contest.currentEntries / contest.maxEntries) * 100);

  return (
    <Link
      href={`/arena/contests/${contest.slug}`}
      className={`wireframe-card rounded-2xl p-5 space-y-4 hover:border-gold/15 transition-all group ${
        featured ? `${typeStyle.glow}` : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${typeStyle.bg} ${typeStyle.border} border ${typeStyle.color} text-[0.6rem] font-display font-bold`}>
            {typeStyle.icon}
          </div>
          <div>
            <p className={`text-[0.5rem] font-mono uppercase tracking-wider ${typeStyle.color}`}>
              {typeStyle.label}
            </p>
            <p className={`text-[0.45rem] font-mono ${diffStyle.color}`}>
              {diffStyle.label}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${statusStyle.bg}`}>
          {statusStyle.pulse && (
            <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.color.replace('text-', 'bg-')} animate-pulse`} />
          )}
          <span className={`text-[0.5rem] font-mono ${statusStyle.color}`}>{statusStyle.label}</span>
        </div>
      </div>

      {/* Title */}
      <div>
        <h3 className="text-sm font-medium text-white group-hover:text-gold transition-colors leading-tight">
          {contest.title}
        </h3>
        <p className="text-[0.65rem] text-white/30 mt-1 line-clamp-2 leading-relaxed">
          {contest.description}
        </p>
      </div>

      {/* Prize & Entry */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-display text-gold">
            {contest.entryFee === 0 ? 'FREE' : formatCurrency(contest.entryFee)}
          </p>
          <p className="text-[0.5rem] font-mono text-white/20 uppercase">Entry</p>
        </div>
        {(contest.prizePool > 0 || contest.entryFee > 0) && (
          <div className="text-right">
            <p className="text-lg font-display text-emerald-400">
              {contest.prizePool > 0 ? formatCurrency(contest.prizePool) : 'TBD'}
            </p>
            <p className="text-[0.5rem] font-mono text-white/20 uppercase">Prize Pool</p>
          </div>
        )}
        {contest.entryFee === 0 && contest.prizePool === 0 && (
          <div className="text-right">
            <div className="flex items-center gap-1 text-amber-400">
              <Award size={14} />
              <span className="text-sm font-display">XP</span>
            </div>
            <p className="text-[0.5rem] font-mono text-white/20 uppercase">Reward</p>
          </div>
        )}
      </div>

      {/* Fill Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[0.5rem] font-mono text-white/25">
          <span>{contest.currentEntries} entered</span>
          <span>{spotsLeft} spots left</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold/40 to-gold/60 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(fillPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Time */}
      <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
        <div className="flex items-center gap-1.5 text-white/25">
          <Clock size={10} />
          <span className="text-[0.5rem] font-mono">
            {contest.status === 'LIVE'
              ? `Ends in ${getTimeRemaining(contest.endsAt)}`
              : `Starts in ${getTimeRemaining(contest.startsAt)}`}
          </span>
        </div>
        <ArrowRight size={12} className="text-white/10 group-hover:text-gold/30 transition-colors" />
      </div>
    </Link>
  );
}
