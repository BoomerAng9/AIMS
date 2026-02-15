'use client';

/**
 * Boost|Bridge Dashboard — "Productively Fun"
 *
 * Three engines, one interface:
 *   The Crowd   — Run synthetic persona simulations
 *   The Proving Ground — Manage trial runs
 *   The Dojo    — P2P training & accreditation
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OwnerGate from '@/components/OwnerGate';

// ─── Types ────────────────────────────────────────────────────────────────

interface StreamEvent {
  status: string;
  progress: number;
  statusMessage: string;
  event: string;
  detail: string;
  timestamp: string;
}

interface CrowdReport {
  reportId: string;
  productName: string;
  totalPersonas: number;
  completedAt: string;
  sentimentBreakdown: { negative: number; neutral: number; positive: number; enthusiastic: number };
  avgNPS: number;
  wouldUsePercent: number;
  wouldPayPercent: number;
  avgMaxPrice: number | null;
  topFrictionPoints: Array<{ issue: string; frequency: number }>;
  topDelightPoints: Array<{ feature: string; frequency: number }>;
  personas: Array<{ id: string; name: string; age: number; occupation: string; personality: string }>;
  reactions: Array<{ personaId: string; firstImpression: string; wouldUse: boolean; rawFeedback: string; sentiment: string; npsScore: number }>;
  executiveSummary: string;
  recommendations: string[];
}

interface ReportSummary {
  reportId: string;
  productName: string;
  totalPersonas: number;
  avgNPS: number;
  wouldUsePercent: number;
  wouldPayPercent: number;
  completedAt: string;
}

interface Badge {
  badgeId: string;
  recipientName: string;
  tier: string;
  domain: string;
  score: number;
  earnedAt: string;
}

type Engine = 'crowd' | 'proving-ground' | 'dojo';
type CrowdView = 'submit' | 'processing' | 'report' | 'history';

// ─── Constants ────────────────────────────────────────────────────────────

const API = '/api/boost-bridge';

const ENGINE_TABS = [
  { id: 'crowd' as const, label: 'The Crowd', emoji: '🧪', color: 'blue' },
  { id: 'proving-ground' as const, label: 'Proving Ground', emoji: '🏟️', color: 'amber' },
  { id: 'dojo' as const, label: 'The Dojo', emoji: '🥋', color: 'purple' },
];

const NPS_STYLES = {
  fire: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  solid: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  mid: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  nah: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

function npsStyle(nps: number) {
  if (nps >= 8) return NPS_STYLES.fire;
  if (nps >= 6) return NPS_STYLES.solid;
  if (nps >= 4) return NPS_STYLES.mid;
  return NPS_STYLES.nah;
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function BoostBridgePage() {
  const [engine, setEngine] = useState<Engine>('crowd');
  const [crowdView, setCrowdView] = useState<CrowdView>('submit');

  // Crowd state
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [targetDemo, setTargetDemo] = useState('');
  const [personaCount, setPersonaCount] = useState(20);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [report, setReport] = useState<CrowdReport | null>(null);
  const [history, setHistory] = useState<ReportSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Dojo state
  const [badges, setBadges] = useState<Badge[]>([]);

  const eventLogRef = useRef<HTMLDivElement>(null);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API}/crowd/reports`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.reports || []);
      }
    } catch { /* Service may be offline */ }
  }, []);

  const fetchBadges = useCallback(async () => {
    try {
      const res = await fetch(`${API}/dojo/badges`);
      if (res.ok) {
        const data = await res.json();
        setBadges(data.badges || []);
      }
    } catch { /* Service may be offline */ }
  }, []);

  useEffect(() => { fetchHistory(); fetchBadges(); }, [fetchHistory, fetchBadges]);

  useEffect(() => {
    if (eventLogRef.current) eventLogRef.current.scrollTop = eventLogRef.current.scrollHeight;
  }, [events]);

  // Submit simulation
  const submitSimulation = async () => {
    if (!productDescription.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`${API}/crowd/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName || 'Untitled Product',
          productDescription,
          targetDemo: targetDemo || 'General consumers, ages 18-55, US-based',
          personaCount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setJobId(data.jobId);
        setCrowdView('processing');
        startPolling(data.jobId);
      }
    } catch {
      setStatusMessage('Failed to submit — is Boost|Bridge service running?');
    } finally {
      setSubmitting(false);
    }
  };

  const startPolling = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/crowd/job/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProgress(data.progress);
          setStatusMessage(data.statusMessage);
          setEvents(data.events || []);

          if (data.status === 'complete' && data.report) {
            setReport(data.report);
            setCrowdView('report');
            clearInterval(interval);
            fetchHistory();
          } else if (data.status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch { /* Continue polling */ }
    }, 1500);
  };

  const loadReport = async (reportId: string) => {
    try {
      const res = await fetch(`${API}/crowd/report/${reportId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        setCrowdView('report');
      }
    } catch { /* Handle error */ }
  };

  return (
    <OwnerGate>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-blue-400">Boost</span>
              <span className="text-zinc-600">|</span>
              <span className="text-purple-400">Bridge</span>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PRODUCTIVELY FUN
              </span>
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Simulate. Validate. Elevate. AI meets the real world.
            </p>
          </div>
        </div>

        {/* Engine Tabs */}
        <div className="flex gap-2 mb-6">
          {ENGINE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setEngine(tab.id)}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors flex items-center gap-2 ${
                engine === tab.id
                  ? `bg-${tab.color}-500/10 text-${tab.color}-400 border-${tab.color}-500/20`
                  : 'text-zinc-500 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── THE CROWD ENGINE ────────────────────────────────────── */}
        {engine === 'crowd' && (
          <div>
            {/* Sub-nav */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => { setCrowdView('submit'); setReport(null); setEvents([]); }}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  crowdView === 'submit' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'text-zinc-500 border-zinc-800'
                }`}
              >
                New Simulation
              </button>
              <button
                onClick={() => { setCrowdView('history'); fetchHistory(); }}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  crowdView === 'history' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'text-zinc-500 border-zinc-800'
                }`}
              >
                History ({history.length})
              </button>
            </div>

            {/* Submit View */}
            {crowdView === 'submit' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Product / Idea Name</label>
                    <input
                      value={productName}
                      onChange={e => setProductName(e.target.value)}
                      placeholder="e.g., FitCheck — AI Style Advisor"
                      className="w-full px-3 py-2 bg-black/40 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 outline-none focus:border-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Target Demographic</label>
                    <input
                      value={targetDemo}
                      onChange={e => setTargetDemo(e.target.value)}
                      placeholder="e.g., Gen Z consumers, 18-28, urban, fashion-forward"
                      className="w-full px-3 py-2 bg-black/40 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 outline-none focus:border-blue-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Product Description</label>
                  <textarea
                    value={productDescription}
                    onChange={e => setProductDescription(e.target.value)}
                    placeholder="Describe your product or idea in 2-5 sentences. What does it do? Who is it for? What problem does it solve? The more specific, the better the simulation."
                    className="w-full h-48 bg-black/40 border border-zinc-700/50 rounded-lg p-3 text-sm text-zinc-200 font-mono outline-none focus:border-blue-500/30 resize-y"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">
                    Crowd Size: {personaCount} personas
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    value={personaCount}
                    onChange={e => setPersonaCount(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-700">
                    <span>5 (quick pulse)</span>
                    <span>50 (solid read)</span>
                    <span>100 (deep dive)</span>
                  </div>
                </div>

                <button
                  onClick={submitSimulation}
                  disabled={!productDescription.trim() || submitting}
                  className="w-full py-3 bg-blue-500/15 text-blue-400 border border-blue-500/25 rounded-xl font-medium hover:bg-blue-500/25 disabled:opacity-40 transition-all"
                >
                  {submitting ? 'Assembling The Crowd...' : 'Run Simulation'}
                </button>

                <p className="text-[10px] text-zinc-700 text-center">
                  Synthetic personas get generated, experience your product, and give raw unfiltered feedback. No cap.
                </p>
              </motion.div>
            )}

            {/* Processing View */}
            {crowdView === 'processing' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{statusMessage}</p>
                    <span className="text-xs font-mono text-zinc-500">{progress}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <p className="text-xs font-mono text-zinc-500">THE CROWD — LIVE FEED</p>
                  </div>
                  <div ref={eventLogRef} className="h-64 overflow-y-auto space-y-1 font-mono text-xs">
                    {events.map((evt, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-zinc-700 shrink-0">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`shrink-0 ${
                          evt.event.includes('ERROR') || evt.event.includes('FAILED') ? 'text-red-400' :
                          evt.event.includes('COMPLETE') ? 'text-emerald-400' :
                          evt.event.includes('START') || evt.event.includes('ASSEMBLING') ? 'text-blue-400' :
                          'text-zinc-400'
                        }`}>
                          [{evt.event}]
                        </span>
                        <span className="text-zinc-500 truncate">{evt.detail}</span>
                      </div>
                    ))}
                    {events.length === 0 && (
                      <p className="text-zinc-700">Assembling The Crowd...</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Report View */}
            {crowdView === 'report' && report && (
              <CrowdReportViewer report={report} />
            )}

            {/* History View */}
            {crowdView === 'history' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto">
                {history.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-zinc-600 text-lg">No simulations yet</p>
                    <p className="text-zinc-700 text-sm mt-1">Run your first Crowd simulation to see results here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map(r => {
                      const style = npsStyle(r.avgNPS);
                      return (
                        <button
                          key={r.reportId}
                          onClick={() => loadReport(r.reportId)}
                          className="w-full text-left bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-sm">{r.productName}</h3>
                            <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${style.bg} ${style.text} ${style.border}`}>
                              NPS {r.avgNPS}
                            </span>
                          </div>
                          <div className="flex gap-4 mt-2 text-xs">
                            <span className="text-blue-400">{r.totalPersonas} personas</span>
                            <span className="text-emerald-400">{r.wouldUsePercent}% would use</span>
                            <span className="text-amber-400">{r.wouldPayPercent}% would pay</span>
                            <span className="text-zinc-600 ml-auto">{new Date(r.completedAt).toLocaleDateString()}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* ─── THE PROVING GROUND ──────────────────────────────────── */}
        {engine === 'proving-ground' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto text-center py-20">
            <p className="text-4xl mb-4">🏟️</p>
            <h2 className="text-xl font-bold text-amber-400 mb-2">The Proving Ground</h2>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              Real trial users. Real products. Automated recruitment, onboarding flows,
              and feedback loops. The bridge between simulation and validation.
            </p>
            <p className="text-zinc-700 text-xs mt-4">
              API ready at /api/trial/* — Frontend coming in next sprint.
            </p>
          </motion.div>
        )}

        {/* ─── THE DOJO ────────────────────────────────────────────── */}
        {engine === 'dojo' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-4xl mb-4">🥋</p>
              <h2 className="text-xl font-bold text-purple-400 mb-2">The Dojo</h2>
              <p className="text-zinc-500 text-sm">
                P2P training with AI-evaluated accreditation. Not participation trophies — verified skills.
              </p>
            </div>

            {/* Badge Wall */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-zinc-400 mb-4">ACCREDITATION LOG</h3>
              {badges.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-8">No badges earned yet. Be the first.</p>
              ) : (
                <div className="space-y-3">
                  {badges.map(b => {
                    const emoji = b.tier === 'sensei' ? '👑' : b.tier === 'black' ? '🥋' : b.tier === 'blue' ? '🔵' : '⚪';
                    return (
                      <div key={b.badgeId} className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-zinc-800/50">
                        <span className="text-2xl">{emoji}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{b.recipientName}</p>
                          <p className="text-xs text-zinc-500">{b.tier.toUpperCase()} BELT in {b.domain}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono text-purple-400">{b.score}%</p>
                          <p className="text-[10px] text-zinc-600">{new Date(b.earnedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="text-zinc-700 text-xs mt-4 text-center">
              API ready at /api/dojo/* — Full curriculum builder coming in next sprint.
            </p>
          </motion.div>
        )}
      </div>
    </OwnerGate>
  );
}

// ─── Crowd Report Viewer ──────────────────────────────────────────────────

function CrowdReportViewer({ report }: { report: CrowdReport }) {
  const style = npsStyle(report.avgNPS);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
      {/* Report Header */}
      <div className={`rounded-xl border p-6 ${style.bg} ${style.border}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-mono text-zinc-500 mb-1">CROWD SIMULATION REPORT</p>
            <h2 className="text-xl font-bold">{report.productName}</h2>
            <p className="text-sm text-zinc-500">{report.totalPersonas} personas &middot; {new Date(report.completedAt).toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className={`text-3xl font-mono font-bold ${style.text}`}>{report.avgNPS}</p>
            <p className="text-[10px] text-zinc-500">NPS / 10</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MiniStat label="Personas" value={report.totalPersonas} />
          <MiniStat label="Would Use" value={`${report.wouldUsePercent}%`} color="emerald" />
          <MiniStat label="Would Pay" value={`${report.wouldPayPercent}%`} color="blue" />
          <MiniStat label="Avg Price" value={report.avgMaxPrice ? `$${report.avgMaxPrice}` : 'N/A'} color="amber" />
          <MiniStat
            label="Sentiment"
            value={`${report.sentimentBreakdown.enthusiastic + report.sentimentBreakdown.positive}/${report.totalPersonas}`}
            color="purple"
          />
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-zinc-400 mb-3">THE READ</h3>
        <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
          {report.executiveSummary}
        </div>
      </div>

      {/* Friction vs Delight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 border border-red-500/10 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-red-400 mb-3">FRICTION POINTS</h3>
          <div className="space-y-2">
            {report.topFrictionPoints.slice(0, 7).map((f, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-zinc-300 truncate">{f.issue}</span>
                <span className="text-xs font-mono text-red-400 shrink-0 ml-2">{f.frequency}x</span>
              </div>
            ))}
            {report.topFrictionPoints.length === 0 && (
              <p className="text-zinc-600 text-sm">No significant friction reported</p>
            )}
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-emerald-500/10 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-emerald-400 mb-3">DELIGHT POINTS</h3>
          <div className="space-y-2">
            {report.topDelightPoints.slice(0, 7).map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-zinc-300 truncate">{d.feature}</span>
                <span className="text-xs font-mono text-emerald-400 shrink-0 ml-2">{d.frequency}x</span>
              </div>
            ))}
            {report.topDelightPoints.length === 0 && (
              <p className="text-zinc-600 text-sm">No significant delight reported</p>
            )}
          </div>
        </div>
      </div>

      {/* Persona Reactions (sample) */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-zinc-400 mb-4">RAW REACTIONS (sample)</h3>
        <div className="space-y-3">
          {report.reactions.slice(0, 8).map((r, i) => {
            const persona = report.personas.find(p => p.id === r.personaId);
            const sentimentColor = r.sentiment === 'enthusiastic' ? 'text-emerald-400'
              : r.sentiment === 'positive' ? 'text-blue-400'
              : r.sentiment === 'neutral' ? 'text-zinc-400'
              : 'text-red-400';

            return (
              <div key={i} className="p-3 bg-black/30 rounded-lg border border-zinc-800/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-zinc-300">
                    {persona?.name || r.personaId} &middot; {persona?.age}, {persona?.occupation}
                  </span>
                  <span className={`text-[10px] font-mono ${sentimentColor}`}>
                    NPS {r.npsScore}/10
                  </span>
                </div>
                <p className="text-sm text-zinc-400 italic">&ldquo;{r.rawFeedback}&rdquo;</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-zinc-400 mb-3">THE MOVE</h3>
          <ol className="space-y-2">
            {report.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3 text-sm text-zinc-300">
                <span className="text-blue-400 font-mono shrink-0">{i + 1}.</span>
                <span>{rec}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Meta */}
      <div className="text-center text-[10px] text-zinc-700 font-mono">
        Report ID: {report.reportId} &middot; Boost|Bridge v1.0 &middot; Productively Fun
      </div>
    </motion.div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const textColor = color === 'red' ? 'text-red-400'
    : color === 'amber' ? 'text-amber-400'
    : color === 'emerald' ? 'text-emerald-400'
    : color === 'blue' ? 'text-blue-400'
    : color === 'purple' ? 'text-purple-400'
    : 'text-zinc-200';
  return (
    <div className="text-center">
      <p className={`text-lg font-mono font-bold ${textColor}`}>{value}</p>
      <p className="text-[10px] text-zinc-600">{label}</p>
    </div>
  );
}
