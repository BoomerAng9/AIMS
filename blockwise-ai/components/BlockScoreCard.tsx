'use client';

import { motion } from 'framer-motion';
import type { BlockScore, VerdictLevel } from '@/lib/types';
import { getVerdictColor } from '@/lib/neighborhood';

interface BlockScoreCardProps {
  blockScore: BlockScore;
  verdict: VerdictLevel;
}

const CATEGORIES: Array<{ key: keyof Omit<BlockScore, 'overall'>; label: string; icon: string }> = [
  { key: 'schools', label: 'Schools', icon: '🏫' },
  { key: 'safety', label: 'Safety', icon: '🛡️' },
  { key: 'appreciation', label: 'Appreciation', icon: '📈' },
  { key: 'livability', label: 'Livability', icon: '🚶' },
  { key: 'development', label: 'Development', icon: '🏗️' },
];

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#D4A843';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

export function BlockScoreCard({ blockScore, verdict }: BlockScoreCardProps) {
  const verdictColor = getVerdictColor(verdict);

  return (
    <div className="space-y-4">
      {/* Hero Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center gap-6 p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="text-center">
          <div
            className="text-6xl font-bold tabular-nums"
            style={{ color: getScoreColor(blockScore.overall) }}
          >
            {blockScore.overall}
          </div>
          <div className="text-sm text-zinc-400 mt-1">Block Score</div>
        </div>
        <div className="h-16 w-px bg-white/10" />
        <div className="text-center">
          <div
            className="text-lg font-semibold"
            style={{ color: verdictColor }}
          >
            {verdict === 'strong_buy' && 'STRONG BUY ZONE'}
            {verdict === 'worth_investigating' && 'WORTH INVESTIGATING'}
            {verdict === 'proceed_with_caution' && 'PROCEED WITH CAUTION'}
            {verdict === 'walk_away' && 'WALK AWAY'}
          </div>
        </div>
      </motion.div>

      {/* Category Scores */}
      <div className="grid grid-cols-5 gap-3">
        {CATEGORIES.map(({ key, label, icon }, i) => {
          const score = blockScore[key];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 rounded-lg bg-white/5 border border-white/10 text-center"
            >
              <div className="text-lg mb-1">{icon}</div>
              <div
                className="text-2xl font-bold tabular-nums"
                style={{ color: getScoreColor(score) }}
              >
                {score}
              </div>
              <div className="text-xs text-zinc-400 mt-1">{label}</div>
              {/* Score bar */}
              <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: getScoreColor(score) }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
