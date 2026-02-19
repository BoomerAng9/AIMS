'use client';

/**
 * Per|Form NFL Draft Hub
 *
 * Main entry for the NFL Draft vertical:
 * - Draft Big Board (top prospects ranked)
 * - Latest mock draft
 * - Draft simulator link
 * - Quick actions: generate mock, seed data
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Trophy,
  Users,
  Zap,
  BarChart3,
  Search,
  RefreshCw,
  Gamepad2,
} from 'lucide-react';
import { DRAFT_TIER_STYLES, TREND_STYLES, getScoreColor } from '@/lib/perform/types';
import type { DraftTier, Trend } from '@/lib/perform/types';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const POSITION_FILTERS = ['ALL', 'QB', 'WR', 'RB', 'TE', 'OT', 'IOL', 'EDGE', 'DT', 'LB', 'CB', 'S'];

export default function DraftPage() {
  const [prospects, setProspects] = useState<any[]>([]);
  const [mockDraft, setMockDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [posFilter, setPosFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/perform/draft?limit=50').then(r => r.json()),
      fetch('/api/perform/draft?mock=latest').then(r => r.json()),
    ])
      .then(([prospectData, mockData]) => {
        setProspects(prospectData.prospects || []);
        if (mockData && !mockData.error) setMockDraft(mockData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await fetch('/api/perform/draft?action=seed-all', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        // Reload data
        const prospectRes = await fetch('/api/perform/draft?limit=50');
        const prospectData = await prospectRes.json();
        setProspects(prospectData.prospects || []);
      }
    } catch (err) {
      console.error('Seed error:', err);
    }
    setSeeding(false);
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch('/api/perform/draft/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rounds: 3, title: `Mock Draft ${new Date().toLocaleDateString()}` }),
      });
      const data = await res.json();
      if (data.ok && data.mockDraft) {
        setMockDraft(data.mockDraft);
      }
    } catch (err) {
      console.error('Generate error:', err);
    }
    setGenerating(false);
  }

  // Filter prospects
  const filtered = prospects.filter(p => {
    if (posFilter !== 'ALL' && p.position !== posFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${p.firstName} ${p.lastName}`.toLowerCase();
      return name.includes(q) || p.college?.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="h-8 w-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        <span className="text-xs font-mono text-white/30">Loading Draft Board...</span>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-6xl mx-auto px-6 py-10 space-y-8"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Back nav */}
      <motion.div variants={staggerItem}>
        <Link
          href="/sandbox/perform"
          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-gold font-mono uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Per|Form Hub
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display text-white tracking-tight">
            NFL Draft
          </h1>
          <p className="text-sm text-white/40 mt-1 max-w-lg">
            Draft prospect rankings, mock drafts, and interactive simulator — powered by P.A.I. grading and Brave Search enrichment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {prospects.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="px-3 py-1.5 text-xs font-mono rounded-lg bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-colors disabled:opacity-50"
            >
              {seeding ? 'Seeding...' : 'Seed Data'}
            </button>
          )}
          {prospects.length > 0 && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-3 py-1.5 text-xs font-mono rounded-lg bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3 w-3 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'New Mock Draft'}
            </button>
          )}
        </div>
      </motion.div>

      {/* Quick nav */}
      <motion.div variants={staggerItem} className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/sandbox/perform/draft/mock"
          className="wireframe-card rounded-2xl p-4 flex items-center gap-3 hover:border-gold/20 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/20 text-gold">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">Mock Drafts</div>
            <div className="text-[0.6rem] font-mono text-white/30">Full 7-round projections</div>
          </div>
          <ArrowRight className="h-4 w-4 text-white/10 group-hover:text-gold transition-colors" />
        </Link>

        <Link
          href="/sandbox/perform/draft/simulator"
          className="wireframe-card rounded-2xl p-4 flex items-center gap-3 hover:border-emerald-400/20 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
            <Gamepad2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">Draft Simulator</div>
            <div className="text-[0.6rem] font-mono text-white/30">You pick — be the GM</div>
          </div>
          <ArrowRight className="h-4 w-4 text-white/10 group-hover:text-emerald-400 transition-colors" />
        </Link>

        <Link
          href="/sandbox/perform/big-board"
          className="wireframe-card rounded-2xl p-4 flex items-center gap-3 hover:border-blue-400/20 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10 border border-blue-400/20 text-blue-400">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">HS Recruiting</div>
            <div className="text-[0.6rem] font-mono text-white/30">Top 300 high school prospects</div>
          </div>
          <ArrowRight className="h-4 w-4 text-white/10 group-hover:text-blue-400 transition-colors" />
        </Link>
      </motion.div>

      {/* Draft Big Board */}
      <motion.div variants={staggerItem} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gold" />
            <h2 className="text-lg font-display text-white">Draft Big Board</h2>
            <span className="text-[0.55rem] font-mono text-white/25 ml-2">{filtered.length} prospects</span>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <input
              type="text"
              placeholder="Search prospects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-gold/30 transition-colors"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {POSITION_FILTERS.map(pos => (
              <button
                key={pos}
                onClick={() => setPosFilter(pos)}
                className={`px-2.5 py-1.5 text-[0.65rem] font-mono rounded-md border whitespace-nowrap transition-colors ${
                  posFilter === pos
                    ? 'bg-gold/15 text-gold border-gold/30'
                    : 'bg-white/[0.03] text-white/40 border-white/5 hover:border-white/10'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Prospect grid */}
        {filtered.length === 0 ? (
          <div className="wireframe-card rounded-2xl p-8 text-center">
            <Zap className="h-8 w-8 text-gold/30 mx-auto mb-3" />
            <p className="text-sm text-white/40">No draft prospects loaded.</p>
            <p className="text-xs text-white/20 mt-1">Click &quot;Seed Data&quot; to populate the draft board.</p>
          </div>
        ) : (
          <div className="wireframe-card rounded-2xl overflow-hidden">
            {/* Header row */}
            <div className="hidden md:grid grid-cols-[60px_1fr_120px_80px_80px_100px_80px] gap-2 px-4 py-2 border-b border-white/[0.06]">
              <span className="text-[0.55rem] font-mono text-white/25 uppercase">Rank</span>
              <span className="text-[0.55rem] font-mono text-white/25 uppercase">Prospect</span>
              <span className="text-[0.55rem] font-mono text-white/25 uppercase">College</span>
              <span className="text-[0.55rem] font-mono text-white/25 uppercase">Tier</span>
              <span className="text-[0.55rem] font-mono text-white/25 uppercase">P.A.I.</span>
              <span className="text-[0.55rem] font-mono text-white/25 uppercase">Projected</span>
              <span className="text-[0.55rem] font-mono text-white/25 uppercase">Trend</span>
            </div>

            {filtered.map((p: any) => {
              const tierStyle = DRAFT_TIER_STYLES[p.tier as DraftTier] || DRAFT_TIER_STYLES.DAY_3;
              const trendStyle = TREND_STYLES[p.trend as Trend] || TREND_STYLES.NEW;

              return (
                <div
                  key={p.id}
                  className="grid grid-cols-1 md:grid-cols-[60px_1fr_120px_80px_80px_100px_80px] gap-2 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors items-center"
                >
                  {/* Rank */}
                  <div className="flex items-center gap-2 md:block">
                    <span className="text-sm font-mono text-white/50 md:text-base">
                      #{p.overallRank}
                    </span>
                    <span className="md:hidden text-xs text-white font-medium">
                      {p.firstName} {p.lastName}
                    </span>
                  </div>

                  {/* Name + Position */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[0.6rem] font-mono px-1.5 py-0.5 rounded ${tierStyle.bg} ${tierStyle.border} ${tierStyle.text} border`}>
                      {p.position}
                    </span>
                    <div className="hidden md:block">
                      <span className="text-sm text-white font-medium">
                        {p.firstName} {p.lastName}
                      </span>
                    </div>
                  </div>

                  {/* College */}
                  <div>
                    <span className="md:hidden text-[0.55rem] font-mono text-white/25 uppercase mr-2">College</span>
                    <span className="text-xs text-white/50">{p.college}</span>
                  </div>

                  {/* Tier */}
                  <div>
                    <span className="md:hidden text-[0.55rem] font-mono text-white/25 uppercase mr-2">Tier</span>
                    <span className={`text-[0.6rem] font-mono ${tierStyle.text}`}>{tierStyle.label}</span>
                  </div>

                  {/* P.A.I. */}
                  <div>
                    <span className="md:hidden text-[0.55rem] font-mono text-white/25 uppercase mr-2">P.A.I.</span>
                    <span className={`text-sm font-mono font-bold ${getScoreColor(p.paiScore)}`}>
                      {p.paiScore}
                    </span>
                  </div>

                  {/* Projected */}
                  <div>
                    <span className="md:hidden text-[0.55rem] font-mono text-white/25 uppercase mr-2">Proj</span>
                    <span className="text-xs font-mono text-white/40">
                      {p.projectedRound ? `Rd ${p.projectedRound}${p.projectedPick ? ` (#${p.projectedPick})` : ''}` : '—'}
                    </span>
                  </div>

                  {/* Trend */}
                  <div>
                    <span className={`text-xs font-mono ${trendStyle.color}`}>
                      {trendStyle.icon}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Latest Mock Draft Preview */}
      {mockDraft && mockDraft.picks && (
        <motion.div variants={staggerItem} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-display text-white">Latest Mock Draft</h2>
            </div>
            <Link
              href="/sandbox/perform/draft/mock"
              className="text-[0.6rem] font-mono text-gold/50 hover:text-gold transition-colors"
            >
              View Full Mock →
            </Link>
          </div>

          <div className="wireframe-card rounded-2xl overflow-hidden">
            {mockDraft.picks.slice(0, 10).map((pick: any) => {
              const tierStyle = DRAFT_TIER_STYLES[pick.prospect?.tier as DraftTier] || DRAFT_TIER_STYLES.DAY_3;
              return (
                <div
                  key={pick.id}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] last:border-b-0"
                >
                  <span className="text-sm font-mono text-white/30 w-8">
                    #{pick.overall}
                  </span>
                  <span className="text-xs text-white/50 w-32 truncate">{pick.teamName}</span>
                  <span className={`text-[0.6rem] font-mono px-1.5 py-0.5 rounded ${tierStyle.bg} ${tierStyle.border} ${tierStyle.text} border`}>
                    {pick.prospect?.position}
                  </span>
                  <span className="text-sm text-white font-medium flex-1">
                    {pick.prospect?.firstName} {pick.prospect?.lastName}
                  </span>
                  <span className="text-xs text-white/30 hidden sm:block">{pick.prospect?.college}</span>
                  <span className={`text-xs font-mono font-bold ${getScoreColor(pick.prospect?.paiScore || 0)}`}>
                    {pick.prospect?.paiScore}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
