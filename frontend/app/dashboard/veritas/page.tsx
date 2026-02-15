'use client';

/**
 * Veritas Dashboard — "The Firm" Research Verification UI
 *
 * Production interface for:
 *   1. Upload documents (PDF text / paste)
 *   2. Watch agent pipeline run in real-time (SSE)
 *   3. View consultant-grade Risk Assessment Reports
 *   4. Browse report history
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OwnerGate from '@/components/OwnerGate';

// ─── Types ────────────────────────────────────────────────────────────────

interface Claim {
  claimId: string;
  originalText: string;
  numericalValue: number | null;
  metricUnit: string;
  category: string;
  confidence: string;
  sourceLocation: string;
}

interface VerifiedFact {
  claimId: string;
  verifiedValue: number | null;
  verifiedText: string;
  sources: Array<{ title: string; url: string; snippet: string }>;
  variancePercent: number | null;
  riskLevel: 'critical' | 'warning' | 'verified' | 'unverified';
  explanation: string;
}

interface Report {
  reportId: string;
  projectName: string;
  documentName: string;
  submittedAt: string;
  completedAt: string;
  overallRisk: 'critical' | 'warning' | 'clean';
  confidenceScore: number;
  summary: string;
  claims: Claim[];
  findings: VerifiedFact[];
  recommendations: string[];
  totalClaimsAnalyzed: number;
  criticalErrors: number;
  warnings: number;
  verified: number;
  unverified: number;
  dataSources: number;
  processingTimeMs: number;
}

interface StreamEvent {
  status: string;
  progress: number;
  statusMessage: string;
  event: string;
  detail: string;
  timestamp: string;
}

interface ReportSummary {
  reportId: string;
  projectName: string;
  documentName: string;
  overallRisk: string;
  confidenceScore: number;
  criticalErrors: number;
  warnings: number;
  verified: number;
  completedAt: string;
}

type View = 'upload' | 'processing' | 'report' | 'history';

// ─── Constants ────────────────────────────────────────────────────────────

const VERITAS_API = '/api/veritas';

const RISK_STYLES = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'CRITICAL' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'WARNING' },
  verified: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'VERIFIED' },
  unverified: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20', label: 'UNVERIFIED' },
  clean: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'CLEAN' },
};

// ─── Component ───────────────────────────────────────────────────────────

export default function VeritasPage() {
  const [view, setView] = useState<View>('upload');
  const [projectName, setProjectName] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [history, setHistory] = useState<ReportSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const eventLogRef = useRef<HTMLDivElement>(null);

  // Fetch report history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${VERITAS_API}/reports`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.reports || []);
      }
    } catch {
      // Service may be offline
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Auto-scroll event log
  useEffect(() => {
    if (eventLogRef.current) {
      eventLogRef.current.scrollTop = eventLogRef.current.scrollHeight;
    }
  }, [events]);

  // Submit document for verification
  const submitDocument = async () => {
    if (!documentText.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`${VERITAS_API}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: projectName || 'Untitled Project',
          documentName: documentName || 'document.txt',
          documentText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setJobId(data.jobId);
        setView('processing');
        startPolling(data.jobId);
      }
    } catch (err) {
      setStatusMessage('Failed to submit — is Veritas service running?');
    } finally {
      setSubmitting(false);
    }
  };

  // Poll job status
  const startPolling = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${VERITAS_API}/job/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProgress(data.progress);
          setStatusMessage(data.statusMessage);
          setEvents(data.events || []);

          if (data.status === 'complete' && data.report) {
            setReport(data.report);
            setView('report');
            clearInterval(interval);
            fetchHistory();
          } else if (data.status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch {
        // Continue polling
      }
    }, 1500);
  };

  // Load a report from history
  const loadReport = async (reportId: string) => {
    try {
      const res = await fetch(`${VERITAS_API}/report/${reportId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        setView('report');
      }
    } catch {
      // Handle error
    }
  };

  return (
    <OwnerGate>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-red-400">Veritas</span>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                RESEARCH VERIFICATION
              </span>
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Upload a document. We fact-check every claim. You get a consultant-grade report.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setView('upload'); setReport(null); setEvents([]); }}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                view === 'upload' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'text-zinc-500 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              New Analysis
            </button>
            <button
              onClick={() => { setView('history'); fetchHistory(); }}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                view === 'history' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'text-zinc-500 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              History ({history.length})
            </button>
          </div>
        </div>

        {/* Upload View */}
        {view === 'upload' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Project Name</label>
                <input
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g., Q2 Expansion Analysis"
                  className="w-full px-3 py-2 bg-black/40 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 outline-none focus:border-red-500/30"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Document Name</label>
                <input
                  value={documentName}
                  onChange={e => setDocumentName(e.target.value)}
                  placeholder="e.g., business-plan.pdf"
                  className="w-full px-3 py-2 bg-black/40 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 outline-none focus:border-red-500/30"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Document Content</label>
              <textarea
                value={documentText}
                onChange={e => setDocumentText(e.target.value)}
                placeholder="Paste the text content of your business plan, pitch deck, or research document here. Veritas will extract and verify every numerical claim."
                className="w-full h-64 bg-black/40 border border-zinc-700/50 rounded-lg p-3 text-sm text-zinc-200 font-mono outline-none focus:border-red-500/30 resize-y"
              />
              <p className="text-[10px] text-zinc-600 mt-1">
                {documentText.length.toLocaleString()} characters &middot; Paste text from PDF, pitch deck, or business plan
              </p>
            </div>

            <button
              onClick={submitDocument}
              disabled={!documentText.trim() || submitting}
              className="w-full py-3 bg-red-500/15 text-red-400 border border-red-500/25 rounded-xl font-medium hover:bg-red-500/25 disabled:opacity-40 transition-all"
            >
              {submitting ? 'Submitting...' : 'Verify This Document'}
            </button>

            <p className="text-[10px] text-zinc-700 text-center">
              Boss (Claude) extracts claims → Grunts (Sonar/Brave) verify → Guardrails flag variance → You get the report
            </p>
          </motion.div>
        )}

        {/* Processing View (Watch Mode) */}
        {view === 'processing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-4">
            {/* Progress Bar */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{statusMessage}</p>
                <span className="text-xs font-mono text-zinc-500">{progress}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Agent Activity Log */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <p className="text-xs font-mono text-zinc-500">AGENT ACTIVITY — WATCH MODE</p>
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
                      evt.event.includes('START') ? 'text-amber-400' :
                      'text-zinc-400'
                    }`}>
                      [{evt.event}]
                    </span>
                    <span className="text-zinc-500 truncate">{evt.detail}</span>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-zinc-700">Waiting for pipeline to start...</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Report View */}
        {view === 'report' && report && (
          <ReportViewer report={report} />
        )}

        {/* History View */}
        {view === 'history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto">
            {history.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-zinc-600 text-lg">No reports yet</p>
                <p className="text-zinc-700 text-sm mt-1">Submit a document to generate your first verification report</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(r => {
                  const style = RISK_STYLES[r.overallRisk as keyof typeof RISK_STYLES] || RISK_STYLES.unverified;
                  return (
                    <button
                      key={r.reportId}
                      onClick={() => loadReport(r.reportId)}
                      className="w-full text-left bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-sm">{r.projectName}</h3>
                        <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${style.bg} ${style.text} ${style.border}`}>
                          {style.label}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">{r.documentName}</p>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span className="text-red-400">{r.criticalErrors} critical</span>
                        <span className="text-amber-400">{r.warnings} warnings</span>
                        <span className="text-emerald-400">{r.verified} verified</span>
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
    </OwnerGate>
  );
}

// ─── Report Viewer Component ─────────────────────────────────────────────

function ReportViewer({ report }: { report: Report }) {
  const riskStyle = RISK_STYLES[report.overallRisk] || RISK_STYLES.clean;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
      {/* Report Header */}
      <div className={`rounded-xl border p-6 ${riskStyle.bg} ${riskStyle.border}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-mono text-zinc-500 mb-1">VERITAS REPORT</p>
            <h2 className="text-xl font-bold">{report.projectName}</h2>
            <p className="text-sm text-zinc-500">{report.documentName} &middot; {new Date(report.completedAt).toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className={`text-3xl font-mono font-bold ${riskStyle.text}`}>
              {report.confidenceScore}
            </p>
            <p className="text-[10px] text-zinc-500">CONFIDENCE</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MiniStat label="Claims Analyzed" value={report.totalClaimsAnalyzed} />
          <MiniStat label="Critical Errors" value={report.criticalErrors} color="red" />
          <MiniStat label="Warnings" value={report.warnings} color="amber" />
          <MiniStat label="Verified" value={report.verified} color="emerald" />
          <MiniStat label="Data Sources" value={report.dataSources} />
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-zinc-400 mb-3">EXECUTIVE SUMMARY</h3>
        <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
          {report.summary}
        </div>
      </div>

      {/* Findings */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-zinc-400 mb-4">FINDINGS</h3>
        <div className="space-y-3">
          {report.findings.map((finding, i) => {
            const claim = report.claims.find(c => c.claimId === finding.claimId);
            const style = RISK_STYLES[finding.riskLevel];
            return (
              <div key={i} className={`p-4 rounded-lg border ${style.bg} ${style.border}`}>
                <div className="flex items-start gap-3">
                  <span className={`shrink-0 px-2 py-0.5 text-[10px] font-mono rounded ${style.bg} ${style.text} border ${style.border}`}>
                    {style.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 mb-1">
                      &ldquo;{claim?.originalText}&rdquo;
                    </p>
                    <p className="text-xs text-zinc-400 mb-2">{finding.explanation}</p>

                    {finding.variancePercent !== null && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-zinc-500">Variance:</span>
                        <span className={`text-sm font-mono font-bold ${
                          Math.abs(finding.variancePercent) > 10 ? 'text-red-400' :
                          Math.abs(finding.variancePercent) > 5 ? 'text-amber-400' :
                          'text-emerald-400'
                        }`}>
                          {finding.variancePercent > 0 ? '+' : ''}{finding.variancePercent.toFixed(1)}%
                        </span>
                        {claim?.numericalValue !== null && finding.verifiedValue !== null && (
                          <span className="text-xs text-zinc-600">
                            (Claimed: {claim?.numericalValue} → Actual: {finding.verifiedValue})
                          </span>
                        )}
                      </div>
                    )}

                    {finding.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {finding.sources.map((s, si) => (
                          <a
                            key={si}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            {s.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-zinc-400 mb-3">STRATEGIC RECOMMENDATIONS</h3>
          <ol className="space-y-2">
            {report.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3 text-sm text-zinc-300">
                <span className="text-amber-400 font-mono shrink-0">{i + 1}.</span>
                <span>{rec}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Meta */}
      <div className="text-center text-[10px] text-zinc-700 font-mono">
        Report ID: {report.reportId} &middot; Processing time: {(report.processingTimeMs / 1000).toFixed(1)}s &middot; A.I.M.S. Veritas v1.0
      </div>
    </motion.div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
  const textColor = color === 'red' ? 'text-red-400' : color === 'amber' ? 'text-amber-400' : color === 'emerald' ? 'text-emerald-400' : 'text-zinc-200';
  return (
    <div className="text-center">
      <p className={`text-lg font-mono font-bold ${textColor}`}>{value}</p>
      <p className="text-[10px] text-zinc-600">{label}</p>
    </div>
  );
}
