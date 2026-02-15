'use client';

/**
 * War Room Dashboard — Gridiron Sandbox Control Panel (Admin Only)
 *
 * Live view of the autonomous sports analytics pipeline:
 *   - Lil_Hawk debate feed (Scout Hub)
 *   - Chicken Hawk mediation results (GROC + Luke grading)
 *   - Film Room analysis status (SAM 2 via Vertex AI)
 *   - Boomer_Ang content production (blogs + podcasts)
 *   - Per|Form Rankings (HS Top 300, College Top 551)
 */

import { useState, useEffect, useCallback } from 'react';
import OwnerGate from '@/components/OwnerGate';

// ─── Types ────────────────────────────────────────────────────────────────

interface ServiceHealth {
  status: string;
  service: string;
  [key: string]: unknown;
}

interface RankingEntry {
  rank: number;
  prospectName: string;
  position: string;
  pool: string;
  grade: number;
  tier: string;
  trend: string;
  lastUpdated: string;
}

interface ContentItem {
  type: string;
  prospectName: string;
  title: string;
  generatedAt: string;
  generatedBy: string;
}

interface WarRoomStatus {
  state: {
    totalProspectsGraded: number;
    totalContentPieces: number;
    activeDossiers: number;
    rankings: { highSchool: number; college: number };
    contentQueue: number;
    lastScoutDelivery: string | null;
  };
  connections: {
    filmRoom: string;
    scoutHub: string;
    chickenhawkCore: string;
    elevenLabsConfigured: boolean;
    braveConfigured: boolean;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────

const WAR_ROOM_API = '/api/gridiron/war-room';
const SCOUT_HUB_API = '/api/gridiron/scout-hub';
const FILM_ROOM_API = '/api/gridiron/film-room';

const TIER_COLORS: Record<string, string> = {
  ELITE: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  BLUE_CHIP: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  PROSPECT: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  SLEEPER: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  DEVELOPMENTAL: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30',
};

const TREND_ICONS: Record<string, string> = {
  UP: '\u25B2',
  DOWN: '\u25BC',
  STEADY: '\u25C6',
  NEW: '\u2605',
};

// ─── Component ────────────────────────────────────────────────────────────

export default function WarRoomPage() {
  const [status, setStatus] = useState<WarRoomStatus | null>(null);
  const [scoutHealth, setScoutHealth] = useState<ServiceHealth | null>(null);
  const [filmHealth, setFilmHealth] = useState<ServiceHealth | null>(null);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [activePool, setActivePool] = useState<'all' | 'highSchool' | 'college'>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [statusRes, scoutRes, filmRes, rankRes, contentRes] = await Promise.allSettled([
        fetch(`${WAR_ROOM_API}/status`),
        fetch(`${SCOUT_HUB_API}/health`),
        fetch(`${FILM_ROOM_API}/health`),
        fetch(`${WAR_ROOM_API}/rankings?pool=${activePool}&limit=50`),
        fetch(`${WAR_ROOM_API}/content?limit=20`),
      ]);

      if (statusRes.status === 'fulfilled' && statusRes.value.ok)
        setStatus(await statusRes.value.json());
      if (scoutRes.status === 'fulfilled' && scoutRes.value.ok)
        setScoutHealth(await scoutRes.value.json());
      if (filmRes.status === 'fulfilled' && filmRes.value.ok)
        setFilmHealth(await filmRes.value.json());
      if (rankRes.status === 'fulfilled' && rankRes.value.ok) {
        const data = await rankRes.value.json();
        setRankings(data.rankings || []);
      }
      if (contentRes.status === 'fulfilled' && contentRes.value.ok) {
        const data = await contentRes.value.json();
        setContent(data.items || []);
      }

      setError(null);
    } catch (err) {
      setError('Gridiron services offline — check Docker containers');
    }
  }, [activePool]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const triggerScan = async () => {
    setIsScanning(true);
    try {
      await fetch(`${SCOUT_HUB_API}/trigger-scan`, { method: 'POST' });
      setTimeout(fetchAll, 3000);
    } catch {
      setError('Failed to trigger scout scan');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <OwnerGate>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              War Room
              <span className="ml-2 text-sm font-normal text-zinc-500">Gridiron Sandbox</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Autonomous sports analytics pipeline — Per|Form Platform
            </p>
          </div>
          <button
            onClick={triggerScan}
            disabled={isScanning}
            className="px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {isScanning ? 'Scanning...' : 'Trigger Scout Run'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Service Health Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ServiceCard
            name="Scout Hub"
            subtitle="Lil_Hawks"
            port={5001}
            health={scoutHealth}
            detail={scoutHealth ? `${(scoutHealth as Record<string, unknown>).totalScansCompleted || 0} scans` : '-'}
          />
          <ServiceCard
            name="Film Room"
            subtitle="SAM 2 Bridge"
            port={5002}
            health={filmHealth}
            detail={filmHealth ? `${(filmHealth as Record<string, unknown>).totalAnalyses || 0} analyses` : '-'}
          />
          <ServiceCard
            name="War Room"
            subtitle="Boomer_Angs + Chicken Hawk"
            port={5003}
            health={status ? { status: 'ok', service: 'war-room' } : null}
            detail={status ? `${status.state.totalProspectsGraded} graded` : '-'}
          />
        </div>

        {/* Stats Row */}
        {status && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatBox label="Prospects Graded" value={status.state.totalProspectsGraded} />
            <StatBox label="Content Pieces" value={status.state.totalContentPieces} />
            <StatBox label="HS Rankings" value={status.state.rankings.highSchool} />
            <StatBox label="College Rankings" value={status.state.rankings.college} />
            <StatBox label="Active Dossiers" value={status.state.activeDossiers} />
          </div>
        )}

        {/* Rankings Table */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Per|Form Rankings</h2>
            <div className="flex gap-2">
              {(['all', 'highSchool', 'college'] as const).map(pool => (
                <button
                  key={pool}
                  onClick={() => setActivePool(pool)}
                  className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                    activePool === pool
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {pool === 'all' ? 'All' : pool === 'highSchool' ? 'HS Top 300' : 'College Top 551'}
                </button>
              ))}
            </div>
          </div>

          {rankings.length === 0 ? (
            <div className="text-center py-12 text-zinc-600">
              <p className="text-lg">No rankings yet</p>
              <p className="text-sm mt-1">Trigger a scout run to start building rankings</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800">
                    <th className="text-left py-2 pr-4">#</th>
                    <th className="text-left py-2 pr-4">Prospect</th>
                    <th className="text-left py-2 pr-4">Pos</th>
                    <th className="text-left py-2 pr-4">Grade</th>
                    <th className="text-left py-2 pr-4">Tier</th>
                    <th className="text-left py-2 pr-4">Trend</th>
                    <th className="text-left py-2">Pool</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map(r => (
                    <tr key={`${r.prospectName}-${r.rank}`} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-2 pr-4 font-mono text-zinc-400">{r.rank}</td>
                      <td className="py-2 pr-4 font-medium">{r.prospectName}</td>
                      <td className="py-2 pr-4 text-zinc-400">{r.position}</td>
                      <td className="py-2 pr-4 font-mono font-bold">{r.grade}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-0.5 rounded text-xs border ${TIER_COLORS[r.tier] || TIER_COLORS.DEVELOPMENTAL}`}>
                          {r.tier}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className={r.trend === 'UP' ? 'text-emerald-400' : r.trend === 'DOWN' ? 'text-red-400' : 'text-zinc-500'}>
                          {TREND_ICONS[r.trend] || ''} {r.trend}
                        </span>
                      </td>
                      <td className="py-2 text-zinc-500">{r.pool}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Content Feed */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4">Content Feed</h2>
          {content.length === 0 ? (
            <div className="text-center py-8 text-zinc-600">
              <p>No content generated yet</p>
              <p className="text-sm mt-1">Boomer_Angs produce blogs and podcasts after scout runs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {content.map((item, i) => (
                <div key={`${item.title}-${i}`} className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                    item.type === 'BLOG' ? 'bg-cyan-500/20 text-cyan-400' :
                    item.type === 'PODCAST' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {item.type}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {item.generatedBy} &middot; {new Date(item.generatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Connection Status */}
        {status && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3">Connections</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <ConnectionBadge label="Film Room" url={status.connections.filmRoom} />
              <ConnectionBadge label="Scout Hub" url={status.connections.scoutHub} />
              <ConnectionBadge label="Chicken Hawk" url={status.connections.chickenhawkCore} />
              <ConnectionBadge
                label="ElevenLabs TTS"
                url={status.connections.elevenLabsConfigured ? 'configured' : 'NOT configured'}
              />
              <ConnectionBadge
                label="Brave Search"
                url={status.connections.braveConfigured ? 'configured' : 'NOT configured'}
              />
            </div>
          </div>
        )}
      </div>
    </OwnerGate>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function ServiceCard({ name, subtitle, port, health, detail }: {
  name: string; subtitle: string; port: number; health: ServiceHealth | null; detail: string;
}) {
  const isUp = health?.status === 'ok';
  return (
    <div className={`p-4 rounded-xl border ${isUp ? 'bg-zinc-900/50 border-zinc-800' : 'bg-red-950/20 border-red-900/30'}`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isUp ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
        <h3 className="font-semibold">{name}</h3>
        <span className="text-xs text-zinc-500">:{port}</span>
      </div>
      <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>
      <p className="text-sm font-mono text-zinc-300 mt-2">{detail}</p>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
      <p className="text-2xl font-mono font-bold text-amber-400">{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  );
}

function ConnectionBadge({ label, url }: { label: string; url: string }) {
  const isConfigured = !url.includes('NOT');
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
      <span className="text-zinc-400">{label}:</span>
      <span className={isConfigured ? 'text-zinc-300' : 'text-zinc-600'}>{url}</span>
    </div>
  );
}
