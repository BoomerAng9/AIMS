// frontend/app/dashboard/research/activity-feed/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import {
  Activity,
  ArrowLeft,
  Filter,
  Github,
  Twitter,
  Youtube,
  MessageCircle,
  Heart,
  MessageSquare,
  Eye,
  Share2,
  Star,
  GitCommit,
  TrendingUp,
  Calendar,
  BarChart3,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────────── */
type PlatformId = "github" | "x" | "reddit" | "discord" | "youtube" | "all";

interface FeedEntry {
  id: string;
  platform: PlatformId;
  type: string;
  title: string;
  preview: string;
  timestamp: string;
  metrics: { label: string; value: string; icon: React.ElementType }[];
}

/* ── Sample feed data ───────────────────────────────────────── */
const sampleFeed: FeedEntry[] = [
  {
    id: "1",
    platform: "github",
    type: "commit",
    title: "feat: wire LUC calculator with seed data",
    preview: "Pushed to main — A.I.M.S. repository",
    timestamp: "2 hours ago",
    metrics: [
      { label: "Files", value: "8", icon: GitCommit },
      { label: "Additions", value: "+342", icon: TrendingUp },
    ],
  },
  {
    id: "2",
    platform: "x",
    type: "post",
    title: "Excited to share our latest A.I.M.S. update...",
    preview: "The agentic web is here. Our R&D hub now tracks protocols, revenue models, and codebase sync.",
    timestamp: "5 hours ago",
    metrics: [
      { label: "Likes", value: "47", icon: Heart },
      { label: "Replies", value: "12", icon: MessageSquare },
      { label: "Views", value: "1.2K", icon: Eye },
    ],
  },
  {
    id: "3",
    platform: "reddit",
    type: "post",
    title: "Building an AI-first platform in 2026 — lessons learned",
    preview: "Posted in r/artificial — A deep-dive into agentic protocols and how they're reshaping SaaS.",
    timestamp: "1 day ago",
    metrics: [
      { label: "Upvotes", value: "89", icon: TrendingUp },
      { label: "Comments", value: "23", icon: MessageSquare },
    ],
  },
  {
    id: "4",
    platform: "youtube",
    type: "upload",
    title: "A.I.M.S. Platform Demo — Agentic Web Overview",
    preview: "New video uploaded to your channel showcasing the R&D Hub features.",
    timestamp: "2 days ago",
    metrics: [
      { label: "Views", value: "324", icon: Eye },
      { label: "Likes", value: "28", icon: Heart },
    ],
  },
  {
    id: "5",
    platform: "discord",
    type: "message",
    title: "Shared update in #announcements",
    preview: "A.I.M.S. Community Server — New research hub feature is live!",
    timestamp: "3 days ago",
    metrics: [
      { label: "Reactions", value: "15", icon: Star },
      { label: "Replies", value: "8", icon: MessageSquare },
    ],
  },
  {
    id: "6",
    platform: "github",
    type: "pr",
    title: "fix: comprehensive UI review — branding, RBAC nav",
    preview: "Pull request merged — 12 files changed across frontend components.",
    timestamp: "3 days ago",
    metrics: [
      { label: "Reviews", value: "2", icon: Eye },
      { label: "Files", value: "12", icon: GitCommit },
    ],
  },
];

/* ── Helpers ─────────────────────────────────────────────────── */
const platformConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  github: { icon: Github, color: "text-white", bg: "bg-white/10", label: "GitHub" },
  x: { icon: Twitter, color: "text-sky-400", bg: "bg-sky-400/10", label: "X" },
  reddit: { icon: MessageCircle, color: "text-orange-400", bg: "bg-orange-400/10", label: "Reddit" },
  discord: { icon: MessageCircle, color: "text-indigo-400", bg: "bg-indigo-400/10", label: "Discord" },
  youtube: { icon: Youtube, color: "text-red-400", bg: "bg-red-400/10", label: "YouTube" },
};

/* ── Stats cards ─────────────────────────────────────────────── */
const weeklyStats = [
  { label: "Total Posts", value: "18", change: "+5 this week", icon: Share2 },
  { label: "Engagements", value: "2.4K", change: "+320 this week", icon: Heart },
  { label: "Commits", value: "34", change: "+12 this week", icon: GitCommit },
  { label: "Reach", value: "8.7K", change: "+1.2K this week", icon: Eye },
];

/* ── Main Page ──────────────────────────────────────────────── */
export default function ActivityFeedPage() {
  const [filter, setFilter] = useState<PlatformId>("all");

  const filteredFeed = filter === "all"
    ? sampleFeed
    : sampleFeed.filter((e) => e.platform === filter);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6 animate-in fade-in duration-700"
    >
      {/* Back link */}
      <Link href="/dashboard/research" className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-gold transition">
        <ArrowLeft size={14} />
        Back to R&D Hub
      </Link>

      {/* Header */}
      <motion.header variants={staggerItem}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/10">
            <Activity size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white font-display">
              Activity Feed
            </h1>
            <p className="text-sm text-white/50">
              Track your posts and engagement across all connected platforms.
            </p>
          </div>
        </div>
      </motion.header>

      {/* Stats row */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {weeklyStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} className="text-gold/60" />
              <span className="text-[10px] uppercase tracking-wider text-white/30">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-emerald-400/70 mt-1">{stat.change}</p>
          </div>
        ))}
      </motion.div>

      {/* Platform breakdown */}
      <motion.div variants={staggerItem} className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={14} className="text-gold/60" />
          <span className="text-xs font-semibold uppercase tracking-widest text-white/80 font-display">
            Platform Breakdown
          </span>
        </div>
        <div className="flex gap-2">
          {Object.entries(platformConfig).map(([id, cfg]) => (
            <div key={id} className="flex-1 rounded-xl border border-wireframe-stroke bg-white/[0.03] p-3 text-center">
              <cfg.icon size={16} className={`${cfg.color} mx-auto mb-1`} />
              <p className="text-sm font-bold text-white">
                {sampleFeed.filter((e) => e.platform === id).length}
              </p>
              <p className="text-[9px] text-white/30">{cfg.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Filter bar */}
      <motion.div variants={staggerItem} className="flex items-center gap-2">
        <Filter size={14} className="text-white/30" />
        <span className="text-xs text-white/30 mr-2">Filter:</span>
        {(["all", "github", "x", "reddit", "discord", "youtube"] as PlatformId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-3 py-1 text-xs transition border ${
              filter === id
                ? "border-gold/30 bg-gold/10 text-gold"
                : "border-wireframe-stroke bg-white/5 text-white/40 hover:bg-white/10"
            }`}
          >
            {id === "all" ? "All" : platformConfig[id]?.label || id}
          </button>
        ))}
      </motion.div>

      {/* Feed entries */}
      <motion.div variants={staggerItem} className="space-y-3">
        {filteredFeed.map((entry) => {
          const cfg = platformConfig[entry.platform];
          const Icon = cfg?.icon || Activity;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4 backdrop-blur-xl hover:border-white/15 transition"
            >
              <div className="flex items-start gap-4">
                {/* Platform icon */}
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${cfg?.bg || "bg-white/10"}`}>
                  <Icon size={18} className={cfg?.color || "text-white"} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${cfg?.bg || "bg-white/10"} ${cfg?.color || "text-white"}`}>
                      {cfg?.label || entry.platform}
                    </span>
                    <span className="text-[10px] text-white/20">{entry.type}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white truncate">{entry.title}</h3>
                  <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{entry.preview}</p>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 mt-3">
                    {entry.metrics.map((m) => (
                      <div key={m.label} className="flex items-center gap-1.5">
                        <m.icon size={12} className="text-white/20" />
                        <span className="text-xs font-medium text-white/60">{m.value}</span>
                        <span className="text-[9px] text-white/20">{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Calendar size={10} className="text-white/20" />
                  <span className="text-[10px] text-white/20">{entry.timestamp}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Empty state when filtered */}
      {filteredFeed.length === 0 && (
        <div className="rounded-2xl border border-wireframe-stroke bg-white/[0.02] p-12 text-center">
          <Activity size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No activity for this platform yet.</p>
          <Link href="/dashboard/research/connected-accounts" className="text-xs text-gold mt-2 inline-block hover:underline">
            Connect accounts to start tracking
          </Link>
        </div>
      )}
    </motion.div>
  );
}
