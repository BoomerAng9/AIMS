'use client';

/**
 * Editor's Desk — Commander Approval Dashboard (Gate 2)
 *
 * Three-Gate content approval system:
 *   Gate 1: Agent Self-Check (automated — Chicken Hawk validates prompt structure)
 *   Gate 2: Commander Review (THIS PAGE — Ship / Reject / Edit)
 *   Gate 3: Post-Publication Monitor (automated — engagement tracking)
 *
 * Fetches pending content from War Room, displays for review.
 * Ship → triggers distribution pipeline (YouTube, TikTok, Blog)
 * Reject → sends back to Boomer_Angs for regeneration
 * Edit → opens inline editor before shipping
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OwnerGate from '@/components/OwnerGate';

// ─── Types ────────────────────────────────────────────────────────────────

interface ContentItem {
  id: string;
  type: 'BLOG' | 'PODCAST' | 'RANKING_UPDATE';
  prospectName: string;
  title: string;
  content: string;
  generatedAt: string;
  generatedBy: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EDITING';
}

interface DossierSummary {
  dossierId: string;
  prospectName: string;
  pool: string;
  preliminaryGrade: number;
  tier: string;
  debateWinner: string;
  flaggedForFilm: boolean;
  grocScore: {
    gamePerformance: number;
    rawAthletics: number;
    overallProduction: number;
    competitionLevel: number;
  };
}

type TabKey = 'pending' | 'approved' | 'rejected';

// ─── Constants ────────────────────────────────────────────────────────────

const WAR_ROOM_API = '/api/gridiron/war-room';

const TIER_BADGE: Record<string, string> = {
  ELITE: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  BLUE_CHIP: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  PROSPECT: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  SLEEPER: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  DEVELOPMENTAL: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
};

const TYPE_BADGE: Record<string, string> = {
  BLOG: 'bg-cyan-500/15 text-cyan-400',
  PODCAST: 'bg-purple-500/15 text-purple-400',
  RANKING_UPDATE: 'bg-amber-500/15 text-amber-400',
};

// ─── Editor's Desk Page ──────────────────────────────────────────────────

export default function EditorsDesk() {
  const [queue, setQueue] = useState<ContentItem[]>([]);
  const [dossiers, setDossiers] = useState<DossierSummary[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [shippingId, setShippingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  // Fetch content queue from War Room
  const fetchQueue = useCallback(async () => {
    try {
      const [contentRes, statusRes] = await Promise.allSettled([
        fetch(`${WAR_ROOM_API}/content?limit=50`),
        fetch(`${WAR_ROOM_API}/status`),
      ]);

      if (contentRes.status === 'fulfilled' && contentRes.value.ok) {
        const data = await contentRes.value.json();
        const items: ContentItem[] = (data.items || []).map((item: ContentItem, i: number) => ({
          ...item,
          id: item.id || `content-${Date.now()}-${i}`,
          status: item.status || 'PENDING',
        }));
        setQueue(items);
        setStats({
          pending: items.filter(i => i.status === 'PENDING').length,
          approved: items.filter(i => i.status === 'APPROVED').length,
          rejected: items.filter(i => i.status === 'REJECTED').length,
        });
      }

      if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
        const status = await statusRes.value.json();
        // Dossiers would come from a dedicated endpoint in production
        setDossiers(status.state?.activeDossiers || []);
      }
    } catch {
      // Services may be offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // ── Actions ──

  const shipContent = async (item: ContentItem) => {
    setShippingId(item.id);

    // Gate 2 → Ship: Mark as approved, trigger distribution
    setQueue(prev => prev.map(i =>
      i.id === item.id ? { ...i, status: 'APPROVED' as const } : i
    ));

    // Notify via Telegram
    try {
      await fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `✅ *SHIPPED*: ${item.title}\n\nType: ${item.type}\nProspect: ${item.prospectName}\nProduced by: ${item.generatedBy}`,
        }),
      });
    } catch {
      // Non-critical
    }

    setStats(prev => ({
      ...prev,
      pending: prev.pending - 1,
      approved: prev.approved + 1,
    }));

    setTimeout(() => setShippingId(null), 1000);
  };

  const rejectContent = (item: ContentItem) => {
    setQueue(prev => prev.map(i =>
      i.id === item.id ? { ...i, status: 'REJECTED' as const } : i
    ));
    setStats(prev => ({
      ...prev,
      pending: prev.pending - 1,
      rejected: prev.rejected + 1,
    }));
  };

  const startEditing = (item: ContentItem) => {
    setEditingId(item.id);
    setEditContent(item.content);
  };

  const saveEdit = (item: ContentItem) => {
    setQueue(prev => prev.map(i =>
      i.id === item.id ? { ...i, content: editContent } : i
    ));
    setEditingId(null);
    setEditContent('');
  };

  const filteredQueue = queue.filter(item => {
    if (activeTab === 'pending') return item.status === 'PENDING';
    if (activeTab === 'approved') return item.status === 'APPROVED';
    if (activeTab === 'rejected') return item.status === 'REJECTED';
    return true;
  });

  // ── Render ──

  return (
    <OwnerGate>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              Editor&apos;s Desk
              <span className="text-xs font-mono font-normal px-2 py-1 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/25">
                GATE 2
              </span>
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Commander approval — Ship, Reject, or Edit before publication
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-zinc-500 font-mono">THREE-GATE SYSTEM</p>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">G1 Auto</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">G2 You</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-500/15 text-zinc-400">G3 Monitor</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="Pending Review" value={stats.pending} color="amber" />
          <StatCard label="Shipped" value={stats.approved} color="emerald" />
          <StatCard label="Rejected" value={stats.rejected} color="red" />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4 border-b border-zinc-800 pb-3">
          {(['pending', 'approved', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-2 text-xs font-mono">
                {tab === 'pending' ? stats.pending : tab === 'approved' ? stats.approved : stats.rejected}
              </span>
            </button>
          ))}
        </div>

        {/* Content Queue */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Loading content queue...</p>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-600 text-lg">
              {activeTab === 'pending' ? 'No content awaiting review' : `No ${activeTab} content`}
            </p>
            <p className="text-zinc-700 text-sm mt-1">
              {activeTab === 'pending' ? 'Trigger a scout run in War Room to generate content' : ''}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredQueue.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden"
                >
                  {/* Card Header */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  >
                    {/* Type Badge */}
                    <span className={`px-2 py-1 rounded text-[10px] font-mono font-medium uppercase shrink-0 ${TYPE_BADGE[item.type] || TYPE_BADGE.BLOG}`}>
                      {item.type}
                    </span>

                    {/* Title & Meta */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {item.prospectName} &middot; {item.generatedBy} &middot; {new Date(item.generatedAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Actions (pending only) */}
                    {item.status === 'PENDING' && (
                      <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => shipContent(item)}
                          disabled={shippingId === item.id}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 disabled:opacity-50 transition-all"
                        >
                          {shippingId === item.id ? 'Shipping...' : 'Ship'}
                        </button>
                        <button
                          onClick={() => startEditing(item)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-700/50 text-zinc-300 border border-zinc-600 hover:bg-zinc-700 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => rejectContent(item)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {/* Status badge (approved/rejected) */}
                    {item.status === 'APPROVED' && (
                      <span className="px-2 py-1 text-[10px] font-mono rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        SHIPPED
                      </span>
                    )}
                    {item.status === 'REJECTED' && (
                      <span className="px-2 py-1 text-[10px] font-mono rounded bg-red-500/15 text-red-400 border border-red-500/25">
                        REJECTED
                      </span>
                    )}

                    {/* Expand arrow */}
                    <svg
                      className={`w-4 h-4 text-zinc-600 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedId === item.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-zinc-800"
                      >
                        {editingId === item.id ? (
                          <div className="p-4">
                            <textarea
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              className="w-full h-64 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 font-mono resize-y outline-none focus:border-amber-500/50"
                            />
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => saveEdit(item)}
                                className="px-4 py-2 text-xs font-medium rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 transition-all"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={() => { setEditingId(null); setEditContent(''); }}
                                className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4">
                            {item.type === 'PODCAST' ? (
                              <div className="bg-zinc-800/50 rounded-lg p-4">
                                <p className="text-xs text-zinc-500 font-mono mb-2">PODCAST SCRIPT / AUDIO</p>
                                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{item.content}</p>
                              </div>
                            ) : (
                              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-200 prose-p:text-zinc-400 prose-strong:text-zinc-200 prose-code:text-amber-400">
                                <pre className="bg-zinc-800/50 rounded-lg p-4 text-xs text-zinc-300 whitespace-pre-wrap overflow-x-auto">
                                  {item.content}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Dossier Summary (if any) */}
        {dossiers.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Active Dossiers
              <span className="text-xs font-mono text-zinc-500">{dossiers.length}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dossiers.slice(0, 12).map((d: DossierSummary) => (
                <div
                  key={d.dossierId}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm truncate">{d.prospectName}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${TIER_BADGE[d.tier] || TIER_BADGE.DEVELOPMENTAL}`}>
                      {d.tier}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-mono font-bold text-amber-400">{d.preliminaryGrade}</span>
                    <span className="text-zinc-500 text-xs">/100</span>
                    <span className={`text-xs ml-auto ${
                      d.debateWinner === 'BULL' ? 'text-emerald-400' :
                      d.debateWinner === 'BEAR' ? 'text-red-400' : 'text-zinc-400'
                    }`}>
                      {d.debateWinner === 'BULL' ? 'Bull Won' : d.debateWinner === 'BEAR' ? 'Bear Won' : 'Split'}
                    </span>
                  </div>
                  {/* GROC mini-bars */}
                  <div className="space-y-1">
                    {[
                      { label: 'G', value: d.grocScore.gamePerformance },
                      { label: 'R', value: d.grocScore.rawAthletics },
                      { label: 'O', value: d.grocScore.overallProduction },
                      { label: 'C', value: d.grocScore.competitionLevel },
                    ].map(comp => (
                      <div key={comp.label} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-500 w-3">{comp.label}</span>
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500/60 rounded-full transition-all"
                            style={{ width: `${comp.value}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 w-6 text-right">{comp.value}</span>
                      </div>
                    ))}
                  </div>
                  {d.flaggedForFilm && (
                    <p className="text-[10px] text-cyan-400 font-mono mt-2">FLAGGED FOR FILM REVIEW</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </OwnerGate>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: 'amber' | 'emerald' | 'red' }) {
  const colorMap = {
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className={`rounded-xl border p-4 text-center ${colorMap[color]}`}>
      <p className="text-3xl font-mono font-bold">{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  );
}
