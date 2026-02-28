'use client';

/**
 * Film Room — Per|Form Video Intelligence Dashboard
 *
 * Powered by Twelve Labs Marengo 3.0 (embeddings/search) + Pegasus (generation).
 *
 * Features:
 *   - Upload/index game film via URL
 *   - Semantic search over indexed film ("third-and-long scrambles")
 *   - AI-generated scouting reports from video
 *   - ScoutVerify: automated prospect evaluation verification
 */

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────

interface FilmRoomStatus {
  status: 'connected' | 'disabled' | 'error';
  reason?: string;
  provider?: string;
}

interface VideoIndex {
  id: string;
  name: string;
  videoCount?: number;
  createdAt?: string;
}

interface SearchResult {
  id: string;
  videoId: string;
  start: number;
  end: number;
  rank: number;
}

interface ScoutVerifyReport {
  reportId: string;
  prospectName: string;
  position?: string;
  school?: string;
  generatedAt: string;
  claims: Array<{
    claim: string;
    category: string;
    verified: boolean | null;
    confidence: number;
  }>;
  highlightBias: {
    biasScore: number;
    totalPlaysShown: number;
    onlyPositivePlays: boolean;
    editingFlags: string[];
  };
  hypeAnalysis: {
    hypeIndex: number;
    inflatedClaims: string[];
    supportedClaims: string[];
    unknownClaims: string[];
  };
  paiConfidence: number;
  overallVerificationScore: number;
  scoutingReport?: string;
  bullCase?: string;
  bearCase?: string;
  videosAnalyzed: number;
  processingTimeMs: number;
}

// ─── Constants ────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || '';

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  low: 'text-red-400 bg-red-400/10 border-red-400/30',
};

function getConfidenceLevel(score: number): string {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─── Component ────────────────────────────────────────────────────────────

export default function FilmRoomPage() {
  const [status, setStatus] = useState<FilmRoomStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'index' | 'verify' | 'report'>('search');
  const [loading, setLoading] = useState(false);

  // Search state
  const [indexes, setIndexes] = useState<VideoIndex[]>([]);
  const [selectedIndex, setSelectedIndex] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Index state
  const [videoUrl, setVideoUrl] = useState('');
  const [indexName, setIndexName] = useState('');
  const [indexingStatus, setIndexingStatus] = useState<string | null>(null);

  // ScoutVerify state
  const [prospectName, setProspectName] = useState('');
  const [prospectPosition, setProspectPosition] = useState('');
  const [prospectSchool, setProspectSchool] = useState('');
  const [verifyVideoUrl, setVerifyVideoUrl] = useState('');
  const [verifyReport, setVerifyReport] = useState<ScoutVerifyReport | null>(null);

  // Report state
  const [reportVideoId, setReportVideoId] = useState('');
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);

  // ─── API helpers ─────────────────────────────────────────────────────────

  const apiCall = useCallback(async (path: string, opts?: RequestInit) => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...opts?.headers },
    });
    return res.json();
  }, []);

  // ─── Load status + indexes on mount ──────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const [s, idx] = await Promise.all([
          apiCall('/api/perform/film-room/status'),
          apiCall('/api/perform/film-room/indexes').catch(() => ({ data: [] })),
        ]);
        setStatus(s);
        if (idx.data) setIndexes(idx.data);
      } catch {
        setStatus({ status: 'error', reason: 'Failed to reach gateway' });
      }
    }
    load();
  }, [apiCall]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!selectedIndex || !searchQuery) return;
    setLoading(true);
    try {
      const res = await apiCall('/api/perform/film-room/search', {
        method: 'POST',
        body: JSON.stringify({ indexId: selectedIndex, query: searchQuery }),
      });
      setSearchResults(res.data || []);
    } catch { /* error handled by status */ }
    setLoading(false);
  };

  const handleCreateIndex = async () => {
    if (!indexName) return;
    setLoading(true);
    try {
      const idx = await apiCall('/api/perform/film-room/indexes', {
        method: 'POST',
        body: JSON.stringify({ name: indexName }),
      });
      setIndexes(prev => [...prev, idx]);
      setIndexName('');
    } catch { /* */ }
    setLoading(false);
  };

  const handleIndexVideo = async () => {
    if (!selectedIndex || !videoUrl) return;
    setLoading(true);
    setIndexingStatus('Submitting...');
    try {
      const task = await apiCall('/api/perform/film-room/videos', {
        method: 'POST',
        body: JSON.stringify({ indexId: selectedIndex, videoUrl }),
      });
      setIndexingStatus(`Task ${task.id} — ${task.status}`);
      setVideoUrl('');
    } catch {
      setIndexingStatus('Failed to submit video');
    }
    setLoading(false);
  };

  const handleScoutVerify = async () => {
    if (!prospectName) return;
    setLoading(true);
    setVerifyReport(null);
    try {
      const report = await apiCall('/api/perform/scout-verify', {
        method: 'POST',
        body: JSON.stringify({
          prospectName,
          position: prospectPosition || undefined,
          school: prospectSchool || undefined,
          videoUrl: verifyVideoUrl || undefined,
        }),
      });
      setVerifyReport(report);
    } catch { /* */ }
    setLoading(false);
  };

  const handleGenerateReport = async () => {
    if (!reportVideoId) return;
    setLoading(true);
    setGeneratedReport(null);
    try {
      const res = await apiCall('/api/perform/film-room/report', {
        method: 'POST',
        body: JSON.stringify({ videoId: reportVideoId }),
      });
      setGeneratedReport(res.text || 'No report generated');
    } catch { /* */ }
    setLoading(false);
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-cyan-400">Film Room</span>
          </h1>
          <p className="text-zinc-400 mt-1">Per|Form Video Intelligence — Twelve Labs + ScoutVerify</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border ${
            status?.status === 'connected'
              ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
              : status?.status === 'disabled'
              ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
              : 'text-red-400 bg-red-400/10 border-red-400/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              status?.status === 'connected' ? 'bg-emerald-400' :
              status?.status === 'disabled' ? 'bg-amber-400' : 'bg-red-400'
            }`} />
            {status?.status === 'connected' ? 'Twelve Labs Connected' :
             status?.status === 'disabled' ? 'API Key Required' : 'Checking...'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111113] rounded-lg p-1 w-fit">
        {(['search', 'index', 'verify', 'report'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/8'
            }`}
          >
            {tab === 'search' ? 'Semantic Search' :
             tab === 'index' ? 'Index Film' :
             tab === 'verify' ? 'ScoutVerify' : 'Scouting Report'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[#111113] border border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.3)] rounded-xl p-6">
        {/* ── SEARCH TAB ── */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Semantic Film Search</h2>
            <p className="text-zinc-400 text-sm">Search indexed game film using natural language. Example: &quot;quarterback scrambles right and throws deep&quot;</p>
            <div className="flex gap-3">
              <select
                value={selectedIndex}
                onChange={e => setSelectedIndex(e.target.value)}
                className="bg-[#1F1F23] border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100"
              >
                <option value="">Select index...</option>
                {indexes.map(idx => (
                  <option key={idx.id} value={idx.id}>{idx.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Describe what you're looking for..."
                className="flex-1 bg-[#1F1F23] border border-white/10 rounded-lg px-4 py-2 text-sm text-zinc-100 placeholder-slate-400"
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={loading || !selectedIndex || !searchQuery}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-[#1F1F23] disabled:text-zinc-500 text-zinc-100 rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-2 mt-4">
                <h3 className="text-sm font-medium text-zinc-300">{searchResults.length} results</h3>
                {searchResults.map(r => (
                  <div key={r.id} className="bg-[#18181B] border border-white/10 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <span className="text-cyan-400 font-mono text-sm">{formatSeconds(r.start)} — {formatSeconds(r.end)}</span>
                      <span className="text-zinc-400 text-sm ml-3">Video: {r.videoId.slice(0, 8)}...</span>
                    </div>
                    <span className="text-sm text-zinc-400">Rank #{r.rank}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── INDEX TAB ── */}
        {activeTab === 'index' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Index Game Film</h2>
              <p className="text-zinc-400 text-sm mt-1">Upload game film for AI analysis. Videos are processed through Twelve Labs Marengo 3.0 for embeddings and searchability.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Create Index */}
              <div className="bg-[#18181B] border border-white/10 rounded-lg p-4 space-y-3">
                <h3 className="font-medium">Create New Index</h3>
                <input
                  type="text"
                  value={indexName}
                  onChange={e => setIndexName(e.target.value)}
                  placeholder="Index name (e.g., 2026-hs-prospects)"
                  className="w-full bg-[#1F1F23] border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-slate-400"
                />
                <button
                  onClick={handleCreateIndex}
                  disabled={loading || !indexName}
                  className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-[#1F1F23] disabled:text-zinc-500 text-zinc-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Create Index
                </button>
              </div>
              {/* Add Video */}
              <div className="bg-[#18181B] border border-white/10 rounded-lg p-4 space-y-3">
                <h3 className="font-medium">Add Video to Index</h3>
                <select
                  value={selectedIndex}
                  onChange={e => setSelectedIndex(e.target.value)}
                  className="w-full bg-[#1F1F23] border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100"
                >
                  <option value="">Select index...</option>
                  {indexes.map(idx => (
                    <option key={idx.id} value={idx.id}>{idx.name}</option>
                  ))}
                </select>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="Video URL (MP4, YouTube, etc.)"
                  className="w-full bg-[#1F1F23] border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-slate-400"
                />
                <button
                  onClick={handleIndexVideo}
                  disabled={loading || !selectedIndex || !videoUrl}
                  className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-[#1F1F23] disabled:text-zinc-500 text-zinc-100 rounded-lg text-sm font-medium transition-colors"
                >
                  {loading ? 'Submitting...' : 'Index Video'}
                </button>
                {indexingStatus && (
                  <p className="text-sm text-amber-400">{indexingStatus}</p>
                )}
              </div>
            </div>
            {/* Existing Indexes */}
            {indexes.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Existing Indexes</h3>
                <div className="grid gap-2">
                  {indexes.map(idx => (
                    <div key={idx.id} className="bg-[#18181B] border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between">
                      <div>
                        <span className="text-zinc-100 font-medium">{idx.name}</span>
                        <span className="text-zinc-400 text-sm ml-3">ID: {idx.id}</span>
                      </div>
                      <span className="text-zinc-400 text-sm">{idx.videoCount ?? '?'} videos</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SCOUTVERIFY TAB ── */}
        {activeTab === 'verify' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">ScoutVerify</h2>
              <p className="text-zinc-400 text-sm mt-1">Automated prospect evaluation verification — checks highlight bias, cross-references claims, and scores confidence.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={prospectName}
                onChange={e => setProspectName(e.target.value)}
                placeholder="Prospect name *"
                className="bg-[#1F1F23] border border-white/10 rounded-lg px-4 py-2 text-sm text-zinc-100 placeholder-slate-400"
              />
              <input
                type="text"
                value={prospectPosition}
                onChange={e => setProspectPosition(e.target.value)}
                placeholder="Position (e.g., QB, WR)"
                className="bg-[#1F1F23] border border-white/10 rounded-lg px-4 py-2 text-sm text-zinc-100 placeholder-slate-400"
              />
              <input
                type="text"
                value={prospectSchool}
                onChange={e => setProspectSchool(e.target.value)}
                placeholder="School"
                className="bg-[#1F1F23] border border-white/10 rounded-lg px-4 py-2 text-sm text-zinc-100 placeholder-slate-400"
              />
              <input
                type="url"
                value={verifyVideoUrl}
                onChange={e => setVerifyVideoUrl(e.target.value)}
                placeholder="Highlight reel URL (optional)"
                className="bg-[#1F1F23] border border-white/10 rounded-lg px-4 py-2 text-sm text-zinc-100 placeholder-slate-400"
              />
            </div>
            <button
              onClick={handleScoutVerify}
              disabled={loading || !prospectName}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-[#1F1F23] disabled:text-zinc-500 text-zinc-100 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Verifying...' : 'Run ScoutVerify'}
            </button>

            {/* ScoutVerify Results */}
            {verifyReport && (
              <div className="space-y-4 mt-4">
                {/* Score Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Verification', value: verifyReport.overallVerificationScore, suffix: '/100' },
                    { label: 'P.A.I. Confidence', value: verifyReport.paiConfidence, suffix: '%' },
                    { label: 'Highlight Bias', value: verifyReport.highlightBias.biasScore, suffix: '/100', invert: true },
                    { label: 'Hype Index', value: verifyReport.hypeAnalysis.hypeIndex, suffix: '/100', invert: true },
                  ].map(card => {
                    const level = card.invert
                      ? getConfidenceLevel(100 - card.value)
                      : getConfidenceLevel(card.value);
                    return (
                      <div key={card.label} className={`border rounded-lg p-4 text-center ${CONFIDENCE_COLORS[level]}`}>
                        <div className="text-2xl font-bold">{card.value}{card.suffix}</div>
                        <div className="text-xs mt-1 opacity-80">{card.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Bias Flags */}
                {verifyReport.highlightBias.editingFlags.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <h4 className="text-red-400 font-medium mb-2">Editing Flags Detected</h4>
                    <div className="flex flex-wrap gap-2">
                      {verifyReport.highlightBias.editingFlags.map(flag => (
                        <span key={flag} className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs">{flag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Claims */}
                {verifyReport.claims.length > 0 && (
                  <div className="bg-[#18181B] border border-white/10 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Extracted Claims ({verifyReport.claims.length})</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {verifyReport.claims.map((claim, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                            claim.verified === true ? 'bg-emerald-400' :
                            claim.verified === false ? 'bg-red-400' : 'bg-zinc-500'
                          }`} />
                          <span className="text-zinc-300">{claim.claim}</span>
                          <span className="text-zinc-400 text-xs ml-auto shrink-0">{claim.category}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scouting Report */}
                {verifyReport.scoutingReport && (
                  <div className="bg-[#18181B] border border-white/10 rounded-lg p-4">
                    <h4 className="font-medium mb-3">AI Scouting Report</h4>
                    <pre className="text-zinc-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                      {verifyReport.scoutingReport}
                    </pre>
                  </div>
                )}

                {/* Bull/Bear */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {verifyReport.bullCase && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                      <h4 className="text-emerald-400 font-medium mb-2">Bull Case</h4>
                      <p className="text-zinc-300 text-sm">{verifyReport.bullCase}</p>
                    </div>
                  )}
                  {verifyReport.bearCase && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <h4 className="text-red-400 font-medium mb-2">Bear Case</h4>
                      <p className="text-zinc-300 text-sm">{verifyReport.bearCase}</p>
                    </div>
                  )}
                </div>

                {/* Meta */}
                <p className="text-zinc-400 text-xs">
                  Report {verifyReport.reportId} | {verifyReport.videosAnalyzed} video(s) analyzed | {verifyReport.processingTimeMs}ms
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── REPORT TAB ── */}
        {activeTab === 'report' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Generate Scouting Report</h2>
            <p className="text-zinc-400 text-sm">Enter a Twelve Labs video ID to generate an AI scouting report from game film using Pegasus.</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={reportVideoId}
                onChange={e => setReportVideoId(e.target.value)}
                placeholder="Twelve Labs Video ID"
                className="flex-1 bg-[#1F1F23] border border-white/10 rounded-lg px-4 py-2 text-sm text-zinc-100 placeholder-slate-400"
              />
              <button
                onClick={handleGenerateReport}
                disabled={loading || !reportVideoId}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-[#1F1F23] disabled:text-zinc-500 text-zinc-100 rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
            {generatedReport && (
              <div className="bg-[#18181B] border border-white/10 rounded-lg p-6 mt-4">
                <h3 className="font-medium mb-3 text-cyan-400">Generated Scouting Report</h3>
                <pre className="text-zinc-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                  {generatedReport}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
