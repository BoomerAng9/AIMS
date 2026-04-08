'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { History, MessageSquare, Layers, BookOpen, Volume2, Clock3 } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/motion/variants';
import type { SessionSnapshot } from '@/lib/context-packs/contracts';
import { formatSavedAt, routeForScope } from '@/lib/session-snapshot/history';

type SnapshotEntry = {
  scope: string;
  savedAt: string | null;
  snapshot: SessionSnapshot;
};

type SnapshotHistoryResponse = {
  snapshots: SnapshotEntry[];
  count: number;
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to load session snapshot history');
  }
  return response.json() as Promise<SnapshotHistoryResponse>;
};


export default function HistoryPage() {
  const { data, isLoading, error } = useSWR('/api/session-snapshot/history', fetcher);
  const snapshots = useMemo(() => data?.snapshots ?? [], [data]);
  const [selectedScope, setSelectedScope] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!snapshots.length) return null;
    if (!selectedScope) return snapshots[0];
    return snapshots.find((entry) => entry.scope === selectedScope) || snapshots[0];
  }, [selectedScope, snapshots]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.header variants={staggerItem} className="wireframe-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 font-mono text-[0.6rem] uppercase tracking-[0.25em] text-gold/50">Session Snapshot</p>
            <h1 className="text-2xl font-display uppercase tracking-wider text-zinc-100 md:text-3xl">History</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Review prior conversation sessions and inspect their Working Notebook and Context Pack composition.
            </p>
          </div>
          <Link
            href="/dashboard/chat"
            className="inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs font-medium text-gold transition hover:bg-gold/20"
          >
            <MessageSquare size={14} />
            Open Chat
          </Link>
        </div>
      </motion.header>

      {error && (
        <motion.div variants={staggerItem} className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          Unable to load session history from Session Snapshot storage.
        </motion.div>
      )}

      <motion.div variants={staggerItem} className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
        <section className="wireframe-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <History size={14} className="text-gold" />
              Sessions
            </h2>
            <span className="text-xs text-zinc-500">{isLoading ? 'Loading...' : `${data?.count || 0} total`}</span>
          </div>

          <div className="space-y-2">
            {isLoading && (
              <div className="space-y-2">
                <div className="h-16 animate-pulse rounded-lg bg-white/5" />
                <div className="h-16 animate-pulse rounded-lg bg-white/5" />
                <div className="h-16 animate-pulse rounded-lg bg-white/5" />
              </div>
            )}

            {!isLoading && snapshots.length === 0 && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
                No Session Snapshot records found yet.
              </div>
            )}

            {snapshots.map((entry) => {
              const active = selected?.scope === entry.scope;
              return (
                <button
                  type="button"
                  key={`${entry.scope}-${entry.savedAt || 'none'}`}
                  onClick={() => setSelectedScope(entry.scope)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    active
                      ? 'border-gold/40 bg-gold/10'
                      : 'border-white/10 bg-[#111113] hover:border-gold/25'
                  }`}
                >
                  <p className="truncate text-sm font-medium text-zinc-100">{entry.scope}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                    <Clock3 size={12} /> {formatSavedAt(entry.savedAt)}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="wireframe-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-200">Snapshot Details</h2>

          {!selected && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
              Select a session to inspect its context.
            </div>
          )}

          {selected && (
            <div className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-[#111113] p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Scope</p>
                <p className="mt-1 text-sm font-medium text-zinc-100">{selected.scope}</p>
                <p className="mt-2 text-xs text-zinc-500">Saved at {formatSavedAt(selected.savedAt)}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-[#111113] p-3">
                  <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-zinc-500">
                    <Layers size={12} /> Context Packs
                  </p>
                  <p className="mt-1 text-lg font-semibold text-zinc-100">
                    {selected.snapshot.context.selectedContextPackIds.length}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#111113] p-3">
                  <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-zinc-500">
                    <BookOpen size={12} /> Working Notebook
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-100">
                    {selected.snapshot.workingNotebook ? 'Attached' : 'Not attached'}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#111113] p-3">
                  <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-zinc-500">
                    <Volume2 size={12} /> Speech Output
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-100">
                    {selected.snapshot.context.speechOutputEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#111113] p-4">
                <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Context Pack IDs</p>
                <div className="flex flex-wrap gap-2">
                  {selected.snapshot.context.selectedContextPackIds.length === 0 && (
                    <span className="text-sm text-zinc-500">No Context Pack IDs recorded.</span>
                  )}
                  {selected.snapshot.context.selectedContextPackIds.map((packId) => (
                    <span key={packId} className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs text-gold">
                      {packId}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#111113] p-4 text-xs text-zinc-400">
                <p>Model: <span className="font-mono text-zinc-200">{selected.snapshot.context.selectedModel || 'unknown'}</span></p>
                <p className="mt-2">Language: <span className="font-mono text-zinc-200">{selected.snapshot.context.selectedLanguage || 'unknown'}</span></p>
                <p className="mt-2">Session ID: <span className="font-mono text-zinc-200">{selected.snapshot.context.sessionId || selected.scope}</span></p>
              </div>

              <div>
                <Link
                  href={routeForScope(selected.scope)}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-zinc-200 transition hover:border-gold/30 hover:text-gold"
                >
                  Resume Session in Chat
                </Link>
              </div>
            </div>
          )}
        </section>
      </motion.div>
    </motion.div>
  );
}
