'use client';

/**
 * Per|Form NFL Draft Hub — Broadcast-Quality Experience
 *
 * Features:
 * - Studio analyst hero imagery
 * - Bottom-line scrolling ticker (API-driven)
 * - Right-panel popup for breaking updates
 * - 3-second auto-scrolling news carousel
 * - Draft Big Board from /api/perform/draft
 * - Module navigation with studio images
 *
 * Zero hardcoded data — everything fetched from API routes.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Trophy, Users, Zap, BarChart3,
  Search, RefreshCw, Gamepad2, Radio, TrendingUp, ChevronRight,
  Radar, Target, X, Bell, ChevronDown, Swords, Gavel
} from 'lucide-react';
import { DRAFT_TIER_STYLES, TREND_STYLES, getScoreColor } from '@/lib/perform/types';
import type { DraftTier, Trend } from '@/lib/perform/types';
import { BroadcastProvider, useBroadcastEngine } from '@/components/perform/broadcast/engine';
import { StudioArena } from '@/components/perform/broadcast/studio';

function NetworkControls() {
  const { isLive, startBroadcast, stopBroadcast } = useBroadcastEngine();
  return (
    <button
      onClick={isLive ? stopBroadcast : startBroadcast}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[0.6rem] font-bold tracking-[0.2em] uppercase transition-all ${isLive
        ? 'bg-red-600/20 text-red-500 border-red-500/50 hover:bg-red-600/30'
        : 'bg-gold/10 text-gold border-gold/30 hover:bg-gold/20 shadow-[0_0_15px_rgba(218,165,32,0.1)]'
        }`}
    >
      <Radio size={12} className={isLive ? 'animate-pulse text-red-500' : 'text-gold'} />
      {isLive ? 'Exit Studio' : 'Watch Live Network'}
    </button>
  );
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const POSITION_FILTERS = ['ALL', 'QB', 'WR', 'RB', 'TE', 'OT', 'IOL', 'EDGE', 'DT', 'LB', 'CB', 'S'];

interface NewsItem {
  id: string;
  type: string;
  headline: string;
  source: string;
  timestamp: string;
  teamAbbrev?: string;
  prospectName?: string;
  url?: string;
}

function DraftPageContent() {
  const [prospects, setProspects] = useState<any[]>([]);
  const [mockDraft, setMockDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [posFilter, setPosFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // News/ticker state
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [activeNewsIdx, setActiveNewsIdx] = useState(0);
  const [showUpdatePanel, setShowUpdatePanel] = useState(false);
  const [latestUpdate, setLatestUpdate] = useState<NewsItem | null>(null);
  const newsInterval = useRef<NodeJS.Timeout | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const knownIds = useRef<Set<string>>(new Set());

  // Ticker interrupt state — flashes UPDATE when new data lands
  const [tickerInterrupt, setTickerInterrupt] = useState<NewsItem | null>(null);
  const [tickerPaused, setTickerPaused] = useState(false);

  // Debate cutscene state — Boomer_Ang vs Lil_Hawk
  const [showDebate, setShowDebate] = useState(false);
  const [debate, setDebate] = useState<any>(null);
  const [debatePhase, setDebatePhase] = useState<'bull' | 'bear' | 'verdict'>('bull');

  // ── Data fetch ──────────────────────────────────────────────
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

  // ── News/ticker fetch + polling ─────────────────────────────
  const fetchNews = useCallback(async (isInitial = false) => {
    try {
      const res = await fetch('/api/perform/draft/news');
      const data = await res.json();
      const items: NewsItem[] = data.items || [];

      if (isInitial) {
        // First load — set all items, track IDs, show panel
        setNewsItems(items);
        items.forEach(i => knownIds.current.add(i.id));
        if (items.length > 0) {
          setLatestUpdate(items[0]);
          setShowUpdatePanel(true);
          setTimeout(() => setShowUpdatePanel(false), 8000);
        }
      } else {
        // Poll — diff against known IDs to find NEW items
        const newItems = items.filter(i => !knownIds.current.has(i.id));
        if (newItems.length > 0) {
          // Flash UPDATE interrupt on ticker
          const newest = newItems[0];
          setTickerInterrupt(newest);
          setTickerPaused(true);

          // Show right panel popup for the update
          setLatestUpdate(newest);
          setShowUpdatePanel(true);

          // Trigger debate cutscene from the Boomer_Ang vs Lil_Hawk
          try {
            const debateRes = await fetch('/api/perform/draft/debate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                headline: newest.headline,
                prospectName: newest.prospectName,
                teamAbbrev: newest.teamAbbrev,
                type: newest.type,
              }),
            });
            const debateData = await debateRes.json();
            if (debateData.debate) {
              setDebate(debateData.debate);
              setDebatePhase('bull');
              // Show debate after 1.5s (let the UPDATE badge register first)
              setTimeout(() => setShowDebate(true), 1500);
              // Auto-advance through phases
              setTimeout(() => setDebatePhase('bear'), 5000);
              setTimeout(() => setDebatePhase('verdict'), 8500);
              // Close debate cutscene after 12 seconds total
              setTimeout(() => {
                setShowDebate(false);
                setDebate(null);
              }, 12000);
            }
          } catch (debateErr) {
            console.warn('[Debate Cutscene]', debateErr);
          }

          // After 4 seconds, clear interrupt and merge new data
          setTimeout(() => {
            setTickerInterrupt(null);
            setTickerPaused(false);
            setShowUpdatePanel(false);
            // Merge new items at the front
            setNewsItems(prev => {
              const merged = [...newItems, ...prev];
              newItems.forEach(i => knownIds.current.add(i.id));
              return merged;
            });
          }, 4000);
        }
      }
    } catch (err) {
      console.error('[News Poll]', err);
    }
  }, []);

  useEffect(() => {
    fetchNews(true);
    // Poll every 30 seconds for fresh data
    pollInterval.current = setInterval(() => fetchNews(false), 30000);
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [fetchNews]);

  // ── 3-second carousel rotation ──────────────────────────────
  useEffect(() => {
    if (newsItems.length > 1 && !tickerPaused) {
      newsInterval.current = setInterval(() => {
        setActiveNewsIdx(prev => (prev + 1) % newsItems.length);
      }, 3000);
    }
    return () => {
      if (newsInterval.current) clearInterval(newsInterval.current);
    };
  }, [newsItems.length, tickerPaused]);

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await fetch('/api/perform/draft?action=seed-all', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        const prospectRes = await fetch('/api/perform/draft?limit=50');
        const prospectData = await prospectRes.json();
        setProspects(prospectData.prospects || []);
        // Re-fetch news after seeding
        const newsRes = await fetch('/api/perform/draft/news');
        const newsData = await newsRes.json();
        setNewsItems(newsData.items || []);
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

  const filtered = prospects.filter(p => {
    if (posFilter !== 'ALL' && p.position !== posFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${p.firstName} ${p.lastName}`.toLowerCase();
      return name.includes(q) || p.college?.toLowerCase().includes(q);
    }
    return true;
  });

  const activeNews = newsItems[activeNewsIdx];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-gold/30 relative">
      <StudioArena />

      {/* ═══════════════════════════════════════════════════════════
          RIGHT PANEL POPUP — Breaking Updates
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showUpdatePanel && latestUpdate && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed top-24 right-6 z-[60] w-[360px] bg-[#111] border border-gold/30 rounded-2xl shadow-[0_0_40px_rgba(218,165,32,0.12)] overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gold/10 border-b border-gold/20">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[0.6rem] font-mono uppercase tracking-[0.2em] text-gold font-bold">Breaking Update</span>
              <button
                onClick={() => setShowUpdatePanel(false)}
                className="ml-auto text-white/30 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-sm text-white leading-relaxed font-sans">{latestUpdate.headline}</p>
              <div className="flex items-center justify-between text-[0.55rem] font-mono text-white/30">
                <span>{latestUpdate.source}</span>
                <span className={`px-1.5 py-0.5 rounded uppercase tracking-widest font-bold ${latestUpdate.type === 'combine' ? 'bg-blue-400/10 text-blue-400' :
                  latestUpdate.type === 'projection' ? 'bg-gold/10 text-gold' :
                    'bg-white/5 text-white/40'
                  }`}>
                  {latestUpdate.type.replace('_', ' ')}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          DEBATE CUTSCENE — Boomer_Ang vs Lil_Hawk
          Triggered during ticker UPDATE interrupts.
          3-phase: Bull Take → Bear Take → Verdict
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDebate && debate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[70] flex items-center justify-center"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDebate(false)} />

            {/* Debate Card */}
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="relative w-[90vw] max-w-[800px] bg-[#0c0c0c] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(218,165,32,0.15)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-red-900/30 via-[#0c0c0c] to-blue-900/30 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Swords size={16} className="text-gold" />
                  <span className="text-[0.6rem] font-mono uppercase tracking-[0.2em] text-gold font-bold">War Room Debate</span>
                </div>
                <button onClick={() => setShowDebate(false)} className="text-white/20 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Topic */}
              <div className="px-6 py-3 bg-white/[0.02] border-b border-white/5">
                <p className="text-xs text-white/50 font-mono truncate">{debate.topic}</p>
              </div>

              {/* Analysts Split Screen */}
              <div className="grid grid-cols-2 divide-x divide-white/5">
                {/* BULL ANALYST — Boomer_Ang */}
                <div className={`p-6 transition-all duration-500 ${debatePhase === 'bull' ? 'bg-red-950/20' : 'bg-transparent opacity-60'
                  }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-gold/40 shrink-0">
                      <Image src={debate.bull.avatar} alt={debate.bull.analyst} fill className="object-cover" />
                    </div>
                    <div>
                      <div className="text-sm font-display font-bold text-gold">{debate.bull.analyst}</div>
                      <div className="text-[0.5rem] font-mono text-red-400/60 uppercase tracking-widest">
                        🐂 BULL CASE · {debate.bull.angId}
                      </div>
                    </div>
                  </div>
                  <AnimatePresence mode="wait">
                    {debatePhase === 'bull' && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-white/80 leading-relaxed font-serif italic"
                      >
                        &ldquo;{debate.bull.take}&rdquo;
                      </motion.p>
                    )}
                    {debatePhase !== 'bull' && (
                      <p className="text-xs text-white/30 leading-relaxed font-serif italic line-clamp-3">
                        &ldquo;{debate.bull.take}&rdquo;
                      </p>
                    )}
                  </AnimatePresence>
                </div>

                {/* BEAR ANALYST — Lil_Hawk */}
                <div className={`p-6 transition-all duration-500 ${debatePhase === 'bear' ? 'bg-blue-950/20' : 'bg-transparent opacity-60'
                  }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-cyan-400/40 shrink-0">
                      <Image src={debate.bear.avatar} alt={debate.bear.analyst} fill className="object-cover" />
                    </div>
                    <div>
                      <div className="text-sm font-display font-bold text-cyan-400">{debate.bear.analyst}</div>
                      <div className="text-[0.5rem] font-mono text-blue-400/60 uppercase tracking-widest">
                        🐻 BEAR CASE · {debate.bear.angId}
                      </div>
                    </div>
                  </div>
                  <AnimatePresence mode="wait">
                    {debatePhase === 'bear' && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-white/80 leading-relaxed font-serif italic"
                      >
                        &ldquo;{debate.bear.take}&rdquo;
                      </motion.p>
                    )}
                    {debatePhase !== 'bear' && debatePhase !== 'bull' && (
                      <p className="text-xs text-white/30 leading-relaxed font-serif italic line-clamp-3">
                        &ldquo;{debate.bear.take}&rdquo;
                      </p>
                    )}
                    {debatePhase === 'bull' && (
                      <p className="text-xs text-white/10 font-mono uppercase tracking-widest">Awaiting response...</p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* VERDICT — Chicken Hawk Mediation */}
              <AnimatePresence>
                {debatePhase === 'verdict' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="border-t border-gold/20 bg-gold/[0.03] px-6 py-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Gavel size={14} className="text-gold" />
                      <span className="text-[0.55rem] font-mono uppercase tracking-[0.2em] text-gold font-bold">
                        Chicken Hawk — Mediation Verdict
                      </span>
                    </div>
                    <p className="text-sm text-white/70 font-sans leading-relaxed">{debate.verdict}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Phase indicators */}
              <div className="flex items-center justify-center gap-3 py-3 bg-white/[0.01] border-t border-white/5">
                {(['bull', 'bear', 'verdict'] as const).map(phase => (
                  <div
                    key={phase}
                    className={`flex items-center gap-1.5 text-[0.5rem] font-mono uppercase tracking-widest transition-colors ${debatePhase === phase ? 'text-gold' : 'text-white/15'
                      }`}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full transition-colors ${debatePhase === phase ? 'bg-gold animate-pulse' : 'bg-white/10'
                      }`} />
                    {phase === 'bull' ? '🐂 Bull' : phase === 'bear' ? '🐻 Bear' : '⚖️ Verdict'}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          STICKY NAV
          ═══════════════════════════════════════════════════════════ */}
      <nav className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/sandbox/perform" className="flex items-center gap-2 text-[0.65rem] text-white/40 hover:text-gold transition-colors font-mono uppercase tracking-widest">
            <ArrowLeft size={14} /> Per|Form Hub
          </Link>
          <div className="flex items-center gap-4">
            {newsItems.length > 0 && (
              <button
                onClick={() => setShowUpdatePanel(!showUpdatePanel)}
                className="relative text-white/30 hover:text-gold transition-colors"
              >
                <Bell size={16} />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
              </button>
            )}
            <NetworkControls />
          </div>
        </div>
      </nav>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-0"
      >
        {/* ═══════════════════════════════════════════════════════════
            HERO: Studio Broadcast Section
            ═══════════════════════════════════════════════════════════ */}
        <motion.div variants={staggerItem} className="relative w-full overflow-hidden">
          <div className="relative h-[420px] md:h-[520px] w-full">
            <Image
              src="/images/perform/draft-studio-hero.png"
              alt="Per|Form Draft analysts in the studio"
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]/40" />

            {/* Hero Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 max-w-[1400px] mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[0.6rem] font-mono uppercase tracking-[0.25em] text-red-400/80">Live Coverage</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-black tracking-tighter text-white leading-[0.95] mb-4">
                NFL Draft<br />
                <span className="text-gold">Command Center</span>
              </h1>
              <p className="text-sm md:text-base text-white/60 max-w-xl font-sans leading-relaxed mb-6">
                AI-scored prospects. Automated mock drafts. Interactive simulator.
                Every pick is backed by the A.I.M.S. Scoring &amp; Grading System.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {prospects.length === 0 && !loading ? (
                  <button
                    onClick={handleSeed}
                    disabled={seeding}
                    className="px-5 py-3 bg-gold text-black text-xs font-mono font-bold uppercase tracking-widest rounded-lg hover:shadow-[0_0_20px_rgba(218,165,32,0.3)] transition-all disabled:opacity-50"
                  >
                    {seeding ? 'Indexing Prospects...' : 'Initialize Draft Board'}
                  </button>
                ) : prospects.length > 0 ? (
                  <>
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="px-5 py-3 bg-gold text-black text-xs font-mono font-bold uppercase tracking-widest rounded-lg hover:shadow-[0_0_20px_rgba(218,165,32,0.3)] transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
                      {generating ? 'Generating...' : 'Generate Mock Draft'}
                    </button>
                    <Link
                      href="/sandbox/perform/draft/simulator"
                      className="px-5 py-3 bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs font-mono font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2"
                    >
                      <Gamepad2 size={13} /> Be The GM
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════
            NEWS CAROUSEL — 3-Second Auto-Scroll
            ═══════════════════════════════════════════════════════════ */}
        {newsItems.length > 0 && (
          <motion.div variants={staggerItem} className="border-y border-white/5 bg-[#0c0c0c]">
            <div className="max-w-[1400px] mx-auto px-6">
              <div className="flex items-stretch min-h-[72px]">
                {/* Label */}
                <div className="flex items-center gap-2 pr-6 border-r border-white/5">
                  <TrendingUp size={14} className="text-gold" />
                  <span className="text-[0.55rem] font-mono uppercase tracking-[0.2em] text-gold font-bold whitespace-nowrap">Draft Intel</span>
                </div>

                {/* Rotating News */}
                <div className="flex-1 flex items-center px-6 overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    {activeNews && (
                      <motion.div
                        key={activeNews.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center gap-4 w-full"
                      >
                        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[0.5rem] font-mono uppercase tracking-widest font-bold ${activeNews.type === 'combine' ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20' :
                          activeNews.type === 'projection' ? 'bg-gold/10 text-gold border border-gold/20' :
                            activeNews.type === 'general' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' :
                              'bg-white/5 text-white/40 border border-white/10'
                          }`}>
                          {activeNews.type.replace('_', ' ')}
                        </span>
                        <p className="text-sm text-white/80 font-sans truncate flex-1">{activeNews.headline}</p>
                        <span className="text-[0.5rem] font-mono text-white/20 whitespace-nowrap shrink-0">{activeNews.source}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Counter */}
                <div className="flex items-center gap-1 pl-4 border-l border-white/5">
                  {newsItems.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveNewsIdx(idx)}
                      className={`h-1.5 rounded-full transition-all ${idx === activeNewsIdx ? 'w-4 bg-gold' : 'w-1.5 bg-white/10 hover:bg-white/20'
                        }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-10">
          {/* ═══════════════════════════════════════════════════════
              MODULE NAVIGATION CARDS
              ═══════════════════════════════════════════════════════ */}
          <motion.div variants={staggerItem} className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/sandbox/perform/draft/mock"
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#0f0f0f] hover:border-gold/20 transition-all"
            >
              <div className="relative h-40 w-full overflow-hidden">
                <Image
                  src="/images/perform/draft-analyst-solo.png"
                  alt="Draft analyst reviewing mock draft"
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent" />
              </div>
              <div className="p-5 relative">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={16} className="text-gold" />
                  <h3 className="text-lg font-display font-bold text-white">Mock Drafts</h3>
                </div>
                <p className="text-xs text-white/40 font-mono leading-relaxed">Full 7-round projections ranked using the A.I.M.S. Scoring &amp; Grading System with adversarial debate analysis.</p>
                <ChevronRight size={16} className="absolute top-5 right-5 text-white/10 group-hover:text-gold transition-colors" />
              </div>
            </Link>

            <Link
              href="/sandbox/perform/draft/simulator"
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#0f0f0f] hover:border-emerald-400/20 transition-all"
            >
              <div className="relative h-40 w-full overflow-hidden">
                <Image
                  src="/images/perform/draft-war-room.png"
                  alt="Draft war room with analysts"
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent" />
              </div>
              <div className="p-5 relative">
                <div className="flex items-center gap-2 mb-2">
                  <Gamepad2 size={16} className="text-emerald-400" />
                  <h3 className="text-lg font-display font-bold text-white">Draft Simulator</h3>
                </div>
                <p className="text-xs text-white/40 font-mono leading-relaxed">Step into the war room. You make the picks — AI (Artificial General Intelligence) evaluates every move.</p>
                <ChevronRight size={16} className="absolute top-5 right-5 text-white/10 group-hover:text-emerald-400 transition-colors" />
              </div>
            </Link>

            <Link
              href="/sandbox/perform/big-board"
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#0f0f0f] hover:border-blue-400/20 transition-all"
            >
              <div className="relative h-40 w-full bg-gradient-to-br from-blue-950 via-[#0f0f0f] to-[#0f0f0f] overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users size={48} className="text-blue-400/10" />
                </div>
              </div>
              <div className="p-5 relative">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-blue-400" />
                  <h3 className="text-lg font-display font-bold text-white">Prospect Board</h3>
                </div>
                <p className="text-xs text-white/40 font-mono leading-relaxed">Top prospects ranked by pure production using the A.I.M.S. Scoring &amp; Grading System.</p>
                <ChevronRight size={16} className="absolute top-5 right-5 text-white/10 group-hover:text-blue-400 transition-colors" />
              </div>
            </Link>
          </motion.div>

          {/* ═══════════════════════════════════════════════════════
              DRAFT BIG BOARD (API-driven)
              ═══════════════════════════════════════════════════════ */}
          <motion.div variants={staggerItem} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-gold" />
                <h2 className="text-xl font-display font-bold text-white tracking-tight">Draft Big Board</h2>
                <span className="text-[0.55rem] font-mono text-white/25 ml-1">{filtered.length} prospects</span>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <input
                  type="text"
                  placeholder="Search prospects..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#0f0f0f] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-gold/30 transition-colors font-mono"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {POSITION_FILTERS.map(pos => (
                  <button
                    key={pos}
                    onClick={() => setPosFilter(pos)}
                    className={`px-3 py-1.5 text-[0.6rem] font-mono uppercase tracking-widest rounded-lg border whitespace-nowrap transition-colors ${posFilter === pos
                      ? 'bg-gold/15 text-gold border-gold/30 font-bold'
                      : 'bg-white/[0.03] text-white/40 border-white/5 hover:border-white/10'
                      }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="h-8 w-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                <span className="text-xs font-mono text-white/30">Loading Draft Board...</span>
              </div>
            )}

            {/* Empty State */}
            {!loading && filtered.length === 0 && (
              <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-12 text-center">
                <Radar size={32} className="text-gold/20 mx-auto mb-4" />
                <h3 className="text-lg font-display text-white/60 mb-2">No Prospects Indexed</h3>
                <p className="text-xs text-white/30 font-mono max-w-md mx-auto mb-6">
                  The draft board is empty. Initialize the database with prospect data to populate the board.
                </p>
                <button
                  onClick={handleSeed}
                  disabled={seeding}
                  className="px-5 py-3 bg-gold text-black text-xs font-mono font-bold uppercase tracking-widest rounded-lg hover:shadow-[0_0_20px_rgba(218,165,32,0.3)] transition-all disabled:opacity-50"
                >
                  {seeding ? 'Indexing...' : 'Initialize Draft Board'}
                </button>
              </div>
            )}

            {/* Prospect Table */}
            {!loading && filtered.length > 0 && (
              <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden">
                <div className="hidden md:grid grid-cols-[60px_1fr_140px_80px_80px_100px_80px] gap-2 px-5 py-3 border-b border-white/[0.06] bg-white/[0.01]">
                  <span className="text-[0.55rem] font-mono text-white/30 uppercase tracking-widest">Rank</span>
                  <span className="text-[0.55rem] font-mono text-white/30 uppercase tracking-widest">Prospect</span>
                  <span className="text-[0.55rem] font-mono text-white/30 uppercase tracking-widest">College</span>
                  <span className="text-[0.55rem] font-mono text-white/30 uppercase tracking-widest">Tier</span>
                  <span className="text-[0.55rem] font-mono text-white/30 uppercase tracking-widest">A.I.M.S. Score</span>
                  <span className="text-[0.55rem] font-mono text-white/30 uppercase tracking-widest">Projected</span>
                  <span className="text-[0.55rem] font-mono text-white/30 uppercase tracking-widest">Trend</span>
                </div>

                {filtered.map((p: any) => {
                  const tierStyle = DRAFT_TIER_STYLES[p.tier as DraftTier] || DRAFT_TIER_STYLES.DAY_3;
                  const trendStyle = TREND_STYLES[p.trend as Trend] || TREND_STYLES.NEW;

                  return (
                    <div
                      key={p.id}
                      className="grid grid-cols-1 md:grid-cols-[60px_1fr_140px_80px_80px_100px_80px] gap-2 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors items-center group"
                    >
                      <div className="flex items-center gap-2 md:block">
                        <span className="text-sm font-mono text-white/40 md:text-base group-hover:text-gold transition-colors">
                          #{p.overallRank}
                        </span>
                        <span className="md:hidden text-sm text-white font-display font-bold">
                          {p.firstName} {p.lastName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className={`text-[0.6rem] font-mono px-1.5 py-0.5 rounded ${tierStyle.bg} ${tierStyle.border} ${tierStyle.text} border`}>
                          {p.position}
                        </span>
                        <div className="hidden md:block">
                          <span className="text-sm text-white font-display font-medium group-hover:text-gold transition-colors">
                            {p.firstName} {p.lastName}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="md:hidden text-[0.55rem] font-mono text-white/25 uppercase mr-2">College</span>
                        <span className="text-xs text-white/50">{p.college}</span>
                      </div>

                      <div>
                        <span className="md:hidden text-[0.55rem] font-mono text-white/25 uppercase mr-2">Tier</span>
                        <span className={`text-[0.6rem] font-mono ${tierStyle.text}`}>{tierStyle.label}</span>
                      </div>

                      <div>
                        <span className="md:hidden text-[0.55rem] font-mono text-white/25 uppercase mr-2">A.I.M.S.</span>
                        <span className={`text-sm font-mono font-bold ${getScoreColor(p.paiScore)}`}>
                          {p.paiScore}
                        </span>
                      </div>

                      <div>
                        <span className="md:hidden text-[0.55rem] font-mono text-white/25 uppercase mr-2">Proj</span>
                        <span className="text-xs font-mono text-white/40">
                          {p.projectedRound ? `Rd ${p.projectedRound}${p.projectedPick ? ` (#${p.projectedPick})` : ''}` : '—'}
                        </span>
                      </div>

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

          {/* ═══════════════════════════════════════════════════════
              LATEST MOCK DRAFT PREVIEW (API-driven)
              ═══════════════════════════════════════════════════════ */}
          {mockDraft && mockDraft.picks && (
            <motion.div variants={staggerItem} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-xl font-display font-bold text-white tracking-tight">Latest Mock Draft</h2>
                </div>
                <Link
                  href="/sandbox/perform/draft/mock"
                  className="text-[0.65rem] font-mono text-gold/50 hover:text-gold transition-colors flex items-center gap-1"
                >
                  Full Mock <ArrowRight size={12} />
                </Link>
              </div>

              <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden">
                {mockDraft.picks.slice(0, 10).map((pick: any) => {
                  const tierStyle = DRAFT_TIER_STYLES[pick.prospect?.tier as DraftTier] || DRAFT_TIER_STYLES.DAY_3;
                  return (
                    <div
                      key={pick.id}
                      className="flex items-center gap-4 px-5 py-3 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors group"
                    >
                      <span className="text-sm font-mono text-white/30 w-10 group-hover:text-gold transition-colors">
                        #{pick.overall}
                      </span>
                      <span className="text-xs text-white/50 w-36 truncate">{pick.teamName}</span>
                      <span className={`text-[0.6rem] font-mono px-1.5 py-0.5 rounded ${tierStyle.bg} ${tierStyle.border} ${tierStyle.text} border`}>
                        {pick.prospect?.position}
                      </span>
                      <span className="text-sm text-white font-display font-medium flex-1">
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
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          BOTTOM TICKER — ESPN-Style Scrolling Tracker
          Interrupts with UPDATE flash when new data arrives,
          then resumes scrolling with merged data.
          ═══════════════════════════════════════════════════════════ */}
      {newsItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#111]/95 backdrop-blur-lg border-t border-gold/20">
          <div className="flex items-center h-10">
            {/* Label */}
            <div className="px-4 h-full flex items-center gap-2 bg-gold shrink-0">
              <Radio size={12} className="text-black" />
              <span className="text-[0.55rem] font-mono uppercase tracking-[0.15em] text-black font-black">Per|Form Tracker</span>
            </div>

            {/* UPDATE INTERRUPT — flashes when new data lands */}
            <AnimatePresence>
              {tickerInterrupt && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full flex items-center gap-2 px-4 bg-red-600 shrink-0 overflow-hidden"
                >
                  <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                  <span className="text-[0.55rem] font-mono uppercase tracking-[0.2em] text-white font-black whitespace-nowrap">UPDATE</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ticker Content */}
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                {tickerInterrupt ? (
                  /* Interrupt: show the new update headline statically */
                  <motion.div
                    key="interrupt"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3 h-10 px-4"
                  >
                    <span className="text-red-400 font-mono font-bold text-[0.6rem] uppercase tracking-widest animate-pulse">NEW →</span>
                    <span className="text-sm text-white font-sans">{tickerInterrupt.headline}</span>
                    <span className="text-[0.5rem] font-mono text-white/30 ml-2">{tickerInterrupt.source}</span>
                  </motion.div>
                ) : (
                  /* Normal: scrolling headlines */
                  <motion.div
                    key="scroll"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-12 whitespace-nowrap"
                    style={{
                      animation: `scrollLeft ${Math.max(20, newsItems.length * 8)}s linear infinite`,
                    }}
                  >
                    {[...newsItems, ...newsItems].map((item, idx) => (
                      <span key={`${item.id}-${idx}`} className="flex items-center gap-3 text-xs">
                        <span className={`font-mono font-bold uppercase tracking-wider ${item.type === 'combine' ? 'text-blue-400' :
                          item.type === 'projection' ? 'text-gold' :
                            item.type === 'general' ? 'text-emerald-400' :
                              'text-white/50'
                          }`}>
                          {item.type === 'projection' ? '📊' : item.type === 'combine' ? '🏋️' : '📰'}
                        </span>
                        <span className="text-white/80">{item.headline}</span>
                        <span className="text-white/20 font-mono text-[0.5rem]">{item.source}</span>
                        <span className="text-gold/30">•</span>
                      </span>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* Ticker animation keyframes */}
      <style jsx>{`
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

export default function DraftPage() {
  return (
    <BroadcastProvider>
      <DraftPageContent />
    </BroadcastProvider>
  );
}
