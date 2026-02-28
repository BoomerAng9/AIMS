'use client';

/**
 * TeamBestFits -- NFL Draft Team Fit Analysis
 *
 * Shows which prospects match which NFL teams based on their
 * projected landing spots and team needs. Dark theme matching
 * Per|Form design. Includes a draft-order mini-tracker (picks 1-32)
 * and prospect fit cards with scoring visualization.
 *
 * Reusable: takes prospects and teamNeeds as props.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, MapPin, Target, Shield,
} from 'lucide-react';
import type { SeedDraftProspect, TeamNeed } from '@/lib/perform/seed-draft-data';
import { spring, transition, stagger, duration } from '@/lib/motion/tokens';
import { staggerContainer, staggerItem, fadeUp } from '@/lib/motion/variants';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export interface TeamBestFitsProps {
  prospects: SeedDraftProspect[];
  teamNeeds: TeamNeed[];
}

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────

/** NFL Division colors for visual variety */
const DIVISION_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'AFC East':  { bg: 'bg-red-500/10',    border: 'border-red-500/20',    text: 'text-red-400' },
  'AFC North': { bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  text: 'text-amber-400' },
  'AFC South': { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-400' },
  'AFC West':  { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  'NFC East':  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  'NFC North': { bg: 'bg-sky-500/10',    border: 'border-sky-500/20',    text: 'text-sky-400' },
  'NFC South': { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
  'NFC West':  { bg: 'bg-pink-500/10',   border: 'border-pink-500/20',   text: 'text-pink-400' },
};

const DEFAULT_DIV_COLOR = { bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', text: 'text-zinc-400' };

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

interface FitAnalysis {
  prospect: SeedDraftProspect;
  team: TeamNeed;
  fitScore: number;
  matchingNeeds: string[];
  isPrimary: boolean;
}

/**
 * Calculate how well a prospect fits a team.
 * Returns a 0-100 fit score and the matching need categories.
 */
function calculateFit(prospect: SeedDraftProspect, team: TeamNeed): FitAnalysis {
  const pos = prospect.position.toUpperCase();
  const matchingPrimary = team.primaryNeeds.filter(n => {
    const need = n.toUpperCase();
    // Handle flexible position matching
    if (need === 'EDGE' && (pos === 'EDGE' || pos === 'DE' || pos === 'OLB')) return true;
    if (need === 'DT' && (pos === 'DT' || pos === 'DL')) return true;
    if (need === 'OT' && (pos === 'OT' || pos === 'OL')) return true;
    if (need === 'IOL' && (pos === 'IOL' || pos === 'OG' || pos === 'C')) return true;
    if (need === 'CB' && (pos === 'CB' || pos === 'DB')) return true;
    if (need === 'S' && (pos === 'S' || pos === 'FS' || pos === 'SS')) return true;
    if (need === 'LB' && (pos === 'LB' || pos === 'ILB' || pos === 'OLB')) return true;
    return need === pos;
  });

  const matchingSecondary = team.secondaryNeeds.filter(n => {
    const need = n.toUpperCase();
    if (need === 'EDGE' && (pos === 'EDGE' || pos === 'DE' || pos === 'OLB')) return true;
    if (need === 'DT' && (pos === 'DT' || pos === 'DL')) return true;
    if (need === 'OT' && (pos === 'OT' || pos === 'OL')) return true;
    if (need === 'IOL' && (pos === 'IOL' || pos === 'OG' || pos === 'C')) return true;
    if (need === 'CB' && (pos === 'CB' || pos === 'DB')) return true;
    if (need === 'S' && (pos === 'S' || pos === 'FS' || pos === 'SS')) return true;
    if (need === 'LB' && (pos === 'LB' || pos === 'ILB' || pos === 'OLB')) return true;
    return need === pos;
  });

  const isPrimary = matchingPrimary.length > 0;
  const allMatching = [...matchingPrimary, ...matchingSecondary.map(n => `${n} (secondary)`)];

  // Score: primary match = 40pts per match, secondary = 20pts, cap at 100
  let fitScore = (matchingPrimary.length * 40) + (matchingSecondary.length * 20);

  // Bonus for grade alignment with pick position
  const pickDelta = Math.abs((prospect.projectedPick ?? 50) - team.projectedPick);
  if (pickDelta <= 5) fitScore += 15;
  else if (pickDelta <= 10) fitScore += 8;

  // Bonus for combineGrade STOCK_UP
  if (prospect.combineGrade === 'STOCK_UP') fitScore += 10;

  fitScore = Math.min(100, fitScore);

  return {
    prospect,
    team,
    fitScore,
    matchingNeeds: allMatching,
    isPrimary,
  };
}

// ────────────────────────────────────────────────────────────
// Sub-Components
// ────────────────────────────────────────────────────────────

function DraftOrderTracker({ teamNeeds, highlightedTeams }: { teamNeeds: TeamNeed[]; highlightedTeams: Set<string> }) {
  // Get unique picks 1-32
  const picks = useMemo(() => {
    const seen = new Set<number>();
    return teamNeeds
      .filter(t => {
        if (seen.has(t.projectedPick)) return false;
        seen.add(t.projectedPick);
        return t.projectedPick <= 32;
      })
      .sort((a, b) => a.projectedPick - b.projectedPick);
  }, [teamNeeds]);

  return (
    <div className="mb-6">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
        Round 1 Draft Order
      </h3>
      <div className="flex flex-wrap gap-1">
        {picks.map(t => {
          const isHighlighted = highlightedTeams.has(t.abbrev);
          return (
            <div
              key={`${t.abbrev}-${t.projectedPick}`}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all ${
                isHighlighted
                  ? 'bg-gold/15 border border-gold/30 text-gold font-bold'
                  : 'bg-white/[0.03] border border-white/5 text-zinc-500'
              }`}
            >
              <span className="text-[9px] opacity-50">{t.projectedPick}.</span>
              <span>{t.abbrev}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FitScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? 'from-gold/50 to-gold/20' :
    score >= 60 ? 'from-emerald-400/40 to-emerald-400/15' :
    score >= 40 ? 'from-blue-400/30 to-blue-400/10' :
    'from-zinc-500/20 to-zinc-500/5';

  const labelColor =
    score >= 80 ? 'text-gold' :
    score >= 60 ? 'text-emerald-400' :
    score >= 40 ? 'text-blue-400' :
    'text-zinc-500';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-white/[0.03] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: duration.emphasis, ease: [0.2, 0, 0, 1] }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
      <span className={`text-xs font-black tabular-nums w-8 text-right ${labelColor}`}>
        {score}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────

export default function TeamBestFits({ prospects, teamNeeds }: TeamBestFitsProps) {
  // Build fit analysis for all prospects with a projected team
  const fits = useMemo(() => {
    const results: FitAnalysis[] = [];

    for (const p of prospects) {
      if (!p.projectedTeam) continue;

      // Find the matching team need entry
      const team = teamNeeds.find(t => t.abbrev === p.projectedTeam);
      if (!team) continue;

      const analysis = calculateFit(p, team);
      if (analysis.fitScore > 0) {
        results.push(analysis);
      }
    }

    // Sort by projected pick (draft order)
    return results.sort((a, b) => (a.team.projectedPick - b.team.projectedPick));
  }, [prospects, teamNeeds]);

  // Set of teams that have a fit
  const highlightedTeams = useMemo(
    () => new Set(fits.map(f => f.team.abbrev)),
    [fits]
  );

  if (fits.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 text-sm">
        No team fit data available.
      </div>
    );
  }

  return (
    <div>
      {/* ── Draft Order Mini-Tracker ─────────────────── */}
      <DraftOrderTracker teamNeeds={teamNeeds} highlightedTeams={highlightedTeams} />

      {/* ── Fit Cards ────────────────────────────────── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-3"
      >
        {fits.map((fit, idx) => {
          const divKey = fit.team.primaryNeeds.length > 0
            ? `${fit.team.abbrev}`
            : '';

          return (
            <motion.div
              key={`${fit.prospect.firstName}-${fit.prospect.lastName}-${fit.team.abbrev}`}
              variants={staggerItem}
              className="bg-white/[0.02] border border-white/5 rounded-lg p-4 hover:bg-white/[0.04] hover:border-white/10 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Left: Team Badge + Pick */}
                <div className="flex items-center gap-3 md:w-48 shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-zinc-600 font-mono">Pick</span>
                    <span className="text-2xl font-black tabular-nums text-white/80">
                      {fit.team.projectedPick}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-black uppercase tracking-wider text-white">
                      <Shield className="w-3.5 h-3.5 text-zinc-400" />
                      {fit.team.abbrev}
                    </span>
                    <p className="text-[11px] text-zinc-500 mt-1">{fit.team.team}</p>
                  </div>
                </div>

                {/* Center: Prospect + Arrow */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0 hidden md:block" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-black text-white truncate">
                        {fit.prospect.firstName} {fit.prospect.lastName}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded shrink-0">
                        {fit.prospect.position}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {fit.prospect.college} -- Rank #{fit.prospect.overallRank}
                    </p>

                    {/* Matching Needs */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {fit.matchingNeeds.map(need => (
                        <span
                          key={need}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            need.includes('secondary')
                              ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                              : 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                          }`}
                        >
                          <Target className="w-2.5 h-2.5" />
                          {need}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Fit Score */}
                <div className="md:w-36 shrink-0">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5">
                    Fit Score
                  </p>
                  <FitScoreBar score={fit.fitScore} />
                </div>
              </div>

              {/* Trade Note */}
              {fit.team.tradeNote && (
                <div className="mt-3 pt-3 border-t border-white/[0.03]">
                  <p className="text-[10px] text-zinc-500 italic">
                    <MapPin className="w-3 h-3 inline-block mr-1 text-zinc-600" />
                    {fit.team.tradeNote}
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
