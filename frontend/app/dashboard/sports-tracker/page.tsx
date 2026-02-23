'use client';

/**
 * Sports Tracker Page
 *
 * Track player careers, stats, and injuries using Brave Search + SAM.
 * Features Nixie tube displays for real-time stats visualization.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NixieTubeDisplay, NixieStatsPanel, NixieCounter } from '@/components/ui/NixieTube';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface PlayerStats {
  gamesPlayed: number;
  gamesStarted: number;
  tackles: number;
  interceptions: number;
  passesDefended: number;
  forcedFumbles: number;
}

interface PlayerProfile {
  name: string;
  position: string;
  team: string;
  number: number;
  class: string;
  height: string;
  weight: number;
  hometown: string;
  imageUrl?: string;
  stats: PlayerStats;
  injuryGames: number;
  seasons: number;
}

// Player data fetched via Brave Search + SAM at runtime — no hardcoded entries

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function SportsTrackerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Player loads when user searches — no auto-load

  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowStats(false);
    setSearchError(null);

    try {
      const res = await fetch('/api/sports/tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: searchQuery.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Search failed' }));
        setSearchError(err.error || `Search failed (${res.status})`);
        setIsSearching(false);
        return;
      }

      const data = await res.json();

      if (data.player) {
        setPlayer({
          name: data.player.name || searchQuery,
          position: data.player.position || 'Unknown',
          team: data.player.team || 'Unknown',
          number: data.player.jerseyNumber || 0,
          class: data.player.class || '—',
          height: data.player.height || '—',
          weight: data.player.weight || 0,
          hometown: data.player.hometown || '—',
          imageUrl: data.player.imageUrl,
          stats: {
            gamesPlayed: data.nixieStats?.gamesPlayed || 0,
            gamesStarted: data.nixieStats?.gamesStarted || 0,
            tackles: data.nixieStats?.tackles || 0,
            interceptions: data.nixieStats?.interceptions || 0,
            passesDefended: data.nixieStats?.passesDefended || 0,
            forcedFumbles: 0,
          },
          injuryGames: data.nixieStats?.injuryGames || 0,
          seasons: data.careerStats?.length || 1,
        });
        setShowStats(true);
      } else {
        setSearchError('No player data found. Try a more specific search (e.g., "R.J. Johnson CU Buffs").');
      }
    } catch (err) {
      console.error('Sports tracker search failed:', err);
      setSearchError('Network error — could not reach search API.');
    }

    setIsSearching(false);
  };

  const nixieStats = player ? [
    {
      id: 'games',
      label: 'Games Played',
      value: showStats ? player.stats.gamesPlayed : 0,
      digits: 3,
      glowColor: '#ff6b1a',
    },
    {
      id: 'starts',
      label: 'Career Starts',
      value: showStats ? player.stats.gamesStarted : 0,
      digits: 3,
      glowColor: '#ff6b1a',
    },
    {
      id: 'tackles',
      label: 'Total Tackles',
      value: showStats ? player.stats.tackles : 0,
      digits: 3,
      glowColor: '#22c55e',
    },
    {
      id: 'ints',
      label: 'Interceptions',
      value: showStats ? player.stats.interceptions : 0,
      digits: 2,
      glowColor: '#3b82f6',
    },
    {
      id: 'pds',
      label: 'Pass Deflections',
      value: showStats ? player.stats.passesDefended : 0,
      digits: 3,
      glowColor: '#a855f7',
    },
    {
      id: 'injury',
      label: 'Games Missed',
      value: showStats ? player.injuryGames : 0,
      digits: 2,
      glowColor: '#ef4444',
    },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Sports Tracker</h1>
          <p className="text-slate-400">
            Track player careers, stats, and injury history with AI-powered analysis
          </p>
        </header>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search player (e.g., R.J. Johnson CU Buffs)"
                className="w-full h-14 pl-12 pr-4 rounded-xl bg-slate-100/60 border border-wireframe-stroke text-slate-800 placeholder:text-slate-300 focus:border-gold/30 outline-none text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-8 h-14 rounded-xl bg-gold text-black font-semibold hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Track Player'}
            </button>
          </div>
        </form>

        {/* Player Profile */}
        <AnimatePresence>
          {player && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Player Card */}
              <div className="flex gap-6 p-6 rounded-2xl bg-slate-100/60 border border-wireframe-stroke">
                {/* Avatar */}
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/30 flex items-center justify-center">
                  <span className="text-5xl font-bold text-gold">
                    #{player.number}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-slate-800 mb-1">{player.name}</h2>
                  <p className="text-slate-500 text-lg mb-4">
                    {player.position} • {player.team}
                  </p>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Class</p>
                      <p className="text-slate-500 font-medium">{player.class}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Height</p>
                      <p className="text-slate-500 font-medium">{player.height}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Weight</p>
                      <p className="text-slate-500 font-medium">{player.weight} lbs</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Hometown</p>
                      <p className="text-slate-500 font-medium">{player.hometown}</p>
                    </div>
                  </div>
                </div>

                {/* Start Rate */}
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase mb-1">Start Rate</p>
                  <NixieTubeDisplay
                    value={showStats ? Math.round((player.stats.gamesStarted / player.stats.gamesPlayed) * 100) : 0}
                    digits={3}
                    size="lg"
                    glowColor="#22c55e"
                    suffix="%"
                  />
                </div>
              </div>

              {/* Nixie Stats Panel */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <TrendingUpIcon className="w-5 h-5 text-gold" />
                  Career Statistics
                </h3>

                <NixieStatsPanel stats={nixieStats} size="md" />
              </div>

              {/* Availability Meter */}
              <div className="p-6 rounded-2xl bg-slate-100/60 border border-wireframe-stroke">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
                  <ActivityIcon className="w-5 h-5 text-gold" />
                  Availability Rate
                </h3>

                <div className="flex items-center gap-8">
                  <NixieCounter
                    target={showStats ? Math.round(((player.stats.gamesPlayed) / (player.stats.gamesPlayed + player.injuryGames)) * 100) : 0}
                    duration={2000}
                    size="xl"
                    suffix="%"
                    glowColor="#22c55e"
                    label="Games Available"
                  />

                  <div className="flex-1 h-4 bg-slate-50/70 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: showStats
                          ? `${(player.stats.gamesPlayed / (player.stats.gamesPlayed + player.injuryGames)) * 100}%`
                          : 0,
                      }}
                      transition={{ duration: 2, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
                        boxShadow: '0 0 20px #22c55e88',
                      }}
                    />
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-800">
                      {player.stats.gamesPlayed} / {player.stats.gamesPlayed + player.injuryGames}
                    </p>
                    <p className="text-xs text-slate-400">Games Played vs Available</p>
                  </div>
                </div>
              </div>

              {/* Season Breakdown */}
              <div className="grid grid-cols-2 gap-6">
                {/* Per Game Averages */}
                <div className="p-6 rounded-2xl bg-slate-100/60 border border-wireframe-stroke">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Per Game Averages</h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Tackles/Game</span>
                      <NixieTubeDisplay
                        value={showStats ? (player.stats.tackles / player.stats.gamesPlayed) : 0}
                        digits={3}
                        decimals={1}
                        size="sm"
                        glowColor="#ff6b1a"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Pass Deflections/Game</span>
                      <NixieTubeDisplay
                        value={showStats ? (player.stats.passesDefended / player.stats.gamesPlayed) : 0}
                        digits={3}
                        decimals={1}
                        size="sm"
                        glowColor="#a855f7"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">INTs/Season</span>
                      <NixieTubeDisplay
                        value={showStats ? (player.stats.interceptions / player.seasons) : 0}
                        digits={3}
                        decimals={1}
                        size="sm"
                        glowColor="#3b82f6"
                      />
                    </div>
                  </div>
                </div>

                {/* Injury History */}
                <div className="p-6 rounded-2xl bg-slate-100/60 border border-wireframe-stroke">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Injury Report</h3>

                  {player.injuryGames > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        <div className="flex-1">
                          <p className="text-red-400 font-medium">2024 - Lower Body</p>
                          <p className="text-xs text-red-400/60">{player.injuryGames} games missed</p>
                        </div>
                        <NixieTubeDisplay
                          value={player.injuryGames}
                          digits={2}
                          size="sm"
                          glowColor="#ef4444"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <p className="text-green-400 font-medium">No significant injuries</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-gold/30 border-t-gold rounded-full animate-spin mb-4" />
            <p className="text-slate-400">Searching via Brave Search + AI extraction...</p>
          </div>
        )}

        {/* Error State */}
        {searchError && !isSearching && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center max-w-md">
              <p className="text-red-400 font-medium mb-1">Search Error</p>
              <p className="text-red-400/60 text-sm">{searchError}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!player && !isSearching && !searchError && (
          <div className="flex flex-col items-center justify-center py-20">
            <UserIcon className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-400 text-lg">Search for a player to begin tracking</p>
            <p className="text-slate-300 text-sm mt-1">Try: &ldquo;R.J. Johnson CU Buffs&rdquo; or &ldquo;Travis Hunter Colorado&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  );
}
