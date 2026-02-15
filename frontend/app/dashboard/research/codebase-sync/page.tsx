// frontend/app/dashboard/research/codebase-sync/page.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import {
  GitBranch,
  ArrowLeft,
  Github,
  GitCommit,
  GitPullRequest,
  Users,
  Activity,
  Calendar,
  BarChart3,
  ExternalLink,
  Clock,
  Code2,
  FolderTree,
  Tag,
} from "lucide-react";

/* ── Placeholder Data ──────────────────────────────────────── */

const repoStats = {
  name: "A.I.M.S.",
  fullName: "rishj/A.I.M.S",
  description: "AI Managed Solutions — Agentic web platform",
  language: "TypeScript",
  stars: 12,
  commits: 156,
  branches: 4,
  contributors: 3,
  openPRs: 1,
  lastPush: "2026-02-09T08:30:00Z",
};

const recentCommits = [
  {
    hash: "0ecab3c",
    message: "feat: wire LUC calculator with seed data and persistent storage",
    author: "rishj",
    date: "2026-02-09T06:15:00Z",
    branch: "main",
  },
  {
    hash: "be52f5d",
    message: "fix: sweep remaining review items — PMO offices, Circuit Box, brand images",
    author: "rishj",
    date: "2026-02-08T22:40:00Z",
    branch: "main",
  },
  {
    hash: "a5b8853",
    message: "fix: comprehensive UI review — branding, RBAC nav, naming, jargon",
    author: "rishj",
    date: "2026-02-08T19:20:00Z",
    branch: "main",
  },
  {
    hash: "d08f595",
    message: "Merge branch 'claude/continue-recent-changes-Mq5st'",
    author: "rishj",
    date: "2026-02-08T16:50:00Z",
    branch: "main",
  },
  {
    hash: "823f519",
    message: "feat: implement Chain of Command + Persona System (canonical spec)",
    author: "rishj",
    date: "2026-02-08T14:10:00Z",
    branch: "main",
  },
];

const branches = [
  { name: "main", isDefault: true, aheadBehind: "up to date", lastCommit: "0ecab3c" },
  { name: "claude/continue-recent-changes-Mq5st", isDefault: false, aheadBehind: "merged", lastCommit: "d08f595" },
  { name: "feature/gateway-enforcement", isDefault: false, aheadBehind: "2 ahead", lastCommit: "f4a1b2c" },
  { name: "feature/luc-presets", isDefault: false, aheadBehind: "merged", lastCommit: "be52f5d" },
];

/* ── Helpers ───────────────────────────────────────────────── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function CodebaseSyncPage() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-8 animate-in fade-in duration-700"
    >
      {/* ── Back Link + Header ─────────────────────────────── */}
      <motion.section variants={staggerItem}>
        <Link
          href="/dashboard/research"
          className="mb-4 inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-gold"
        >
          <ArrowLeft size={14} />
          Back to Research Hub
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
            <GitBranch size={22} className="text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white font-display">
              Codebase Sync
            </h1>
            <p className="text-sm text-white/50">
              GitHub integration, repository stats, and code activity
            </p>
          </div>
        </div>
      </motion.section>

      {/* ── Connect GitHub CTA ─────────────────────────────── */}
      <motion.section variants={staggerItem}>
        <div className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-wireframe-stroke bg-white/5">
                <Github size={18} className="text-white/80" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  GitHub Integration
                </p>
                <p className="text-xs text-white/40">
                  Connect your account to enable real-time sync and activity tracking
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/research/connected-accounts"
              className="inline-flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/10 px-5 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/20"
            >
              <Github size={16} />
              Connect GitHub
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ── Repository Overview ─────────────────────────────── */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          Repository Overview
        </h2>
        <div className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
          {/* Repo Header */}
          <div className="mb-5 flex items-center gap-3">
            <FolderTree size={18} className="text-gold/70" />
            <div>
              <h3 className="text-lg font-semibold text-white font-display">
                {repoStats.fullName}
              </h3>
              <p className="text-xs text-white/40">{repoStats.description}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="rounded-xl border border-wireframe-stroke bg-white/5 px-3 py-2.5 text-center">
              <GitCommit size={16} className="mx-auto mb-1 text-gold/60" />
              <p className="text-lg font-bold text-white">{repoStats.commits}</p>
              <p className="text-[10px] uppercase tracking-wider text-gold/50">
                Commits
              </p>
            </div>
            <div className="rounded-xl border border-wireframe-stroke bg-white/5 px-3 py-2.5 text-center">
              <GitBranch size={16} className="mx-auto mb-1 text-blue-400/60" />
              <p className="text-lg font-bold text-white">{repoStats.branches}</p>
              <p className="text-[10px] uppercase tracking-wider text-gold/50">
                Branches
              </p>
            </div>
            <div className="rounded-xl border border-wireframe-stroke bg-white/5 px-3 py-2.5 text-center">
              <Users size={16} className="mx-auto mb-1 text-purple-400/60" />
              <p className="text-lg font-bold text-white">{repoStats.contributors}</p>
              <p className="text-[10px] uppercase tracking-wider text-gold/50">
                Contributors
              </p>
            </div>
            <div className="rounded-xl border border-wireframe-stroke bg-white/5 px-3 py-2.5 text-center">
              <GitPullRequest size={16} className="mx-auto mb-1 text-emerald-400/60" />
              <p className="text-lg font-bold text-white">{repoStats.openPRs}</p>
              <p className="text-[10px] uppercase tracking-wider text-gold/50">
                Open PRs
              </p>
            </div>
            <div className="rounded-xl border border-wireframe-stroke bg-white/5 px-3 py-2.5 text-center">
              <Code2 size={16} className="mx-auto mb-1 text-cyan-400/60" />
              <p className="text-lg font-bold text-white">{repoStats.language}</p>
              <p className="text-[10px] uppercase tracking-wider text-gold/50">
                Language
              </p>
            </div>
            <div className="rounded-xl border border-wireframe-stroke bg-white/5 px-3 py-2.5 text-center">
              <Clock size={16} className="mx-auto mb-1 text-gold" />
              <p className="text-lg font-bold text-white">
                {timeAgo(repoStats.lastPush)}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-gold/50">
                Last Push
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Recent Commits ─────────────────────────────────── */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          Recent Commits
        </h2>
        <div className="rounded-3xl border border-wireframe-stroke bg-black/60 backdrop-blur-2xl divide-y divide-white/5">
          {recentCommits.map((commit) => (
            <div key={commit.hash} className="flex items-start gap-4 px-6 py-4">
              {/* Commit Hash */}
              <code className="mt-0.5 flex-shrink-0 rounded-lg border border-wireframe-stroke bg-white/5 px-2 py-0.5 text-xs font-mono text-gold/80">
                {commit.hash}
              </code>

              {/* Message + Meta */}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">{commit.message}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/30">
                  <span className="flex items-center gap-1">
                    <Users size={10} />
                    {commit.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {timeAgo(commit.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitBranch size={10} />
                    {commit.branch}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Branch Overview ────────────────────────────────── */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          Branch Overview
        </h2>
        <div className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
          <div className="space-y-3">
            {branches.map((branch) => (
              <div
                key={branch.name}
                className="flex items-center justify-between rounded-2xl border border-wireframe-stroke bg-white/5 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <GitBranch
                    size={14}
                    className={
                      branch.isDefault ? "text-gold" : "text-white/40"
                    }
                  />
                  <span className="text-sm text-white truncate font-mono">
                    {branch.name}
                  </span>
                  {branch.isDefault && (
                    <span className="flex-shrink-0 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase text-gold">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-xs text-white/30 font-mono">
                    {branch.lastCommit}
                  </span>
                  <span
                    className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                      branch.aheadBehind === "merged"
                        ? "bg-purple-500/20 text-purple-400"
                        : branch.aheadBehind === "up to date"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {branch.aheadBehind}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Code Activity Chart Placeholder ────────────────── */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          Code Activity
        </h2>
        <div className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 size={16} className="text-gold/60" />
            <p className="text-sm text-white/60">
              Weekly commit activity (last 12 weeks)
            </p>
          </div>

          {/* Chart Placeholder — Bar visualization */}
          <div className="flex items-end gap-2 h-32">
            {[4, 7, 3, 9, 12, 6, 15, 8, 11, 5, 14, 10].map((val, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${(val / 15) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="flex-1 rounded-t-lg"
                style={{
                  background:
                    i === 11
                      ? "linear-gradient(to top, rgba(212,168,67,0.3), rgba(212,168,67,0.7))"
                      : "linear-gradient(to top, rgba(255,255,255,0.05), rgba(255,255,255,0.15))",
                  border: i === 11 ? "1px solid rgba(212,168,67,0.4)" : "1px solid rgba(255,255,255,0.05)",
                }}
              />
            ))}
          </div>

          {/* X-axis labels */}
          <div className="mt-2 flex gap-2">
            {["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"].map(
              (label, i) => (
                <p
                  key={label}
                  className={`flex-1 text-center text-[9px] ${
                    i === 11 ? "text-gold/70" : "text-white/20"
                  }`}
                >
                  {label}
                </p>
              )
            )}
          </div>

          <div className="mt-4 flex items-center gap-4 border-t border-wireframe-stroke pt-3">
            <Activity size={14} className="text-gold/60" />
            <p className="text-xs text-white/40">
              104 commits across 4 branches in the last 12 weeks
            </p>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
