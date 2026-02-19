'use client';

/**
 * Per|Form Draft Simulator
 *
 * Interactive pick-by-pick draft simulator.
 * You be the GM — select prospects for each team.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Gamepad2,
  Clock,
  Check,
  Search,
  Trophy,
} from 'lucide-react';
import { DRAFT_TIER_STYLES, getScoreColor } from '@/lib/perform/types';
import type { DraftTier } from '@/lib/perform/types';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function SimulatorPage() {
  const [simId, setSimId] = useState<string | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [available, setAvailable] = useState<any[]>([]);
  const [picks, setPicks] = useState<any[]>([]);
  const [currentPick, setCurrentPick] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPickInRound, setCurrentPickInRound] = useState(1);
  const [onTheClock, setOnTheClock] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [justPicked, setJustPicked] = useState<any>(null);

  async function startSimulator() {
    setStarting(true);
    try {
      const res = await fetch('/api/perform/draft/simulate', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setSimId(data.simulatorId);
        setTeams(data.teams || []);
        setAvailable(data.topAvailable || []);
        setOnTheClock(data.onTheClock);
        setCurrentPick(1);
        setCurrentRound(1);
        setCurrentPickInRound(1);
      }
    } catch (err) {
      console.error('Start error:', err);
    }
    setStarting(false);
  }

  async function makePick() {
    if (!simId || !selectedProspect || !onTheClock) return;
    setLoading(true);
    try {
      const res = await fetch('/api/perform/draft/simulate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mockDraftId: simId,
          prospectId: selectedProspect.id,
          teamName: onTheClock.teamName,
          overall: currentPick,
          round: currentRound,
          pickInRound: currentPickInRound,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setJustPicked({ ...data.pick, teamName: onTheClock.teamName });
        setPicks(prev => [...prev, data.pick]);
        setAvailable(data.state.topAvailable || []);

        // Advance to next pick
        const nextPick = currentPick + 1;
        const nextPickInRound = currentPickInRound + 1;
        const nextRound = nextPickInRound > 32 ? currentRound + 1 : currentRound;

        setCurrentPick(nextPick);
        setCurrentPickInRound(nextPickInRound > 32 ? 1 : nextPickInRound);
        setCurrentRound(nextRound);

        // Next team on the clock
        const teamIndex = (nextPick - 1) % teams.length;
        setOnTheClock(teams[teamIndex] || null);

        setSelectedProspect(null);
        setSearch('');

        // Clear "just picked" notification after 3s
        setTimeout(() => setJustPicked(null), 3000);
      }
    } catch (err) {
      console.error('Pick error:', err);
    }
    setLoading(false);
  }

  const filteredAvailable = available.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${p.firstName} ${p.lastName}`.toLowerCase();
    return name.includes(q) || p.college?.toLowerCase().includes(q) || p.position?.toLowerCase().includes(q);
  });

  // Not started yet
  if (!simId) {
    return (
      <motion.div
        className="max-w-6xl mx-auto px-6 py-10 space-y-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerItem}>
          <Link
            href="/sandbox/perform/draft"
            className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-gold font-mono uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Draft Hub
          </Link>
        </motion.div>

        <motion.div variants={staggerItem} className="wireframe-card rounded-2xl p-10 text-center max-w-lg mx-auto">
          <Gamepad2 className="h-12 w-12 text-emerald-400/50 mx-auto mb-4" />
          <h1 className="text-2xl font-display text-white mb-2">Draft Simulator</h1>
          <p className="text-sm text-white/40 mb-6">
            Take control of every pick. You decide which prospect goes to each team.
            Build the perfect draft — or create chaos.
          </p>
          <button
            onClick={startSimulator}
            disabled={starting}
            className="px-6 py-2.5 text-sm font-mono rounded-xl bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/20 transition-colors disabled:opacity-50"
          >
            {starting ? 'Setting up...' : 'Start Draft Simulator'}
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="max-w-7xl mx-auto px-6 py-10 space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-start justify-between">
        <div>
          <Link
            href="/sandbox/perform/draft"
            className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-gold font-mono uppercase tracking-wider transition-colors mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Draft Hub
          </Link>
          <h1 className="text-2xl font-display text-white tracking-tight">Draft Simulator</h1>
        </div>
        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="text-[0.55rem] font-mono text-white/25 uppercase">Round</div>
            <div className="text-lg font-mono text-gold font-bold">{currentRound}</div>
          </div>
          <div>
            <div className="text-[0.55rem] font-mono text-white/25 uppercase">Pick</div>
            <div className="text-lg font-mono text-white font-bold">#{currentPick}</div>
          </div>
        </div>
      </motion.div>

      {/* Just Picked notification */}
      <AnimatePresence>
        {justPicked && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="wireframe-card rounded-2xl p-4 border-emerald-400/20 bg-emerald-400/[0.03]"
          >
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-emerald-400" />
              <span className="text-sm text-white">
                <span className="text-white/50">{justPicked.teamName} select</span>{' '}
                <span className="font-medium">
                  {justPicked.prospect?.firstName} {justPicked.prospect?.lastName}
                </span>{' '}
                <span className="text-white/50">({justPicked.prospect?.position}, {justPicked.prospect?.college})</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Available prospects */}
        <motion.div variants={staggerItem} className="space-y-3">
          {/* On the clock */}
          {onTheClock && (
            <div className="wireframe-card rounded-2xl p-4 border-gold/20 bg-gold/[0.02]">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gold animate-pulse" />
                <div>
                  <div className="text-[0.55rem] font-mono text-gold/50 uppercase">On the Clock</div>
                  <div className="text-lg font-display text-white">{onTheClock.teamName}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-[0.55rem] font-mono text-white/25">PICK #{currentPick}</div>
                  {onTheClock.needs && (
                    <div className="text-[0.5rem] font-mono text-white/20">
                      Needs: {Object.entries(JSON.parse(onTheClock.needs))
                        .filter(([, v]) => (v as number) === 1)
                        .map(([k]) => k)
                        .join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <input
              type="text"
              placeholder="Search available prospects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-gold/30 transition-colors"
            />
          </div>

          {/* Available list */}
          <div className="wireframe-card rounded-2xl overflow-hidden max-h-[600px] overflow-y-auto">
            {filteredAvailable.map((p: any) => {
              const tierStyle = DRAFT_TIER_STYLES[p.tier as DraftTier] || DRAFT_TIER_STYLES.DAY_3;
              const isSelected = selectedProspect?.id === p.id;

              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProspect(isSelected ? null : p)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] text-left transition-colors ${
                    isSelected
                      ? 'bg-gold/[0.05] border-l-2 border-l-gold'
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <span className="text-sm font-mono text-white/30 w-8">#{p.overallRank}</span>
                  <span className={`text-[0.6rem] font-mono px-1.5 py-0.5 rounded ${tierStyle.bg} ${tierStyle.border} ${tierStyle.text} border`}>
                    {p.position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white font-medium">
                      {p.firstName} {p.lastName}
                    </span>
                    <span className="text-xs text-white/30 ml-2">{p.college}</span>
                  </div>
                  <span className={`text-sm font-mono font-bold ${getScoreColor(p.paiScore)}`}>
                    {p.paiScore}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Make pick button */}
          {selectedProspect && (
            <button
              onClick={makePick}
              disabled={loading}
              className="w-full py-3 text-sm font-mono rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-colors disabled:opacity-50"
            >
              {loading
                ? 'Submitting pick...'
                : `Draft ${selectedProspect.firstName} ${selectedProspect.lastName} (${selectedProspect.position})`
              }
            </button>
          )}
        </motion.div>

        {/* Pick history sidebar */}
        <motion.div variants={staggerItem} className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-display text-white">Picks Made</h2>
            <span className="text-[0.55rem] font-mono text-white/25">{picks.length}</span>
          </div>

          <div className="wireframe-card rounded-2xl overflow-hidden max-h-[700px] overflow-y-auto">
            {picks.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-xs text-white/30 font-mono">No picks yet — select a prospect</p>
              </div>
            ) : (
              [...picks].reverse().map((pick: any, i) => {
                const prospect = pick.prospect;
                const tierStyle = DRAFT_TIER_STYLES[prospect?.tier as DraftTier] || DRAFT_TIER_STYLES.DAY_3;
                return (
                  <div
                    key={pick.id || i}
                    className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.04] last:border-b-0"
                  >
                    <span className="text-xs font-mono text-white/25 w-7">#{pick.overall}</span>
                    <span className={`text-[0.5rem] font-mono px-1 py-0.5 rounded ${tierStyle.bg} ${tierStyle.text} border ${tierStyle.border}`}>
                      {prospect?.position}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white truncate">
                        {prospect?.firstName} {prospect?.lastName}
                      </div>
                      <div className="text-[0.5rem] text-white/20 truncate">{pick.teamName}</div>
                    </div>
                    <span className={`text-[0.6rem] font-mono font-bold ${getScoreColor(prospect?.paiScore || 0)}`}>
                      {prospect?.paiScore}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
