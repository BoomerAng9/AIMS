// frontend/app/dashboard/research/connected-accounts/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import {
  Github,
  Twitter,
  Youtube,
  MessageCircle,
  ArrowLeft,
  Check,
  ExternalLink,
  RefreshCw,
  Unplug,
  LinkIcon,
} from "lucide-react";

/* ── Platform definitions ───────────────────────────────────── */
interface Platform {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgColor: string;
  description: string;
  features: string[];
  oauthUrl: string;
}

const platforms: Platform[] = [
  {
    id: "github",
    name: "GitHub",
    icon: Github,
    color: "text-white",
    borderColor: "border-white/20",
    bgColor: "bg-white/10",
    description: "Connect repositories, track commits, and monitor contributions.",
    features: ["Repository sync", "Commit tracking", "Contribution graph", "Pull request activity"],
    oauthUrl: "/api/auth/signin?provider=github",
  },
  {
    id: "x",
    name: "X (Twitter)",
    icon: Twitter,
    color: "text-sky-400",
    borderColor: "border-sky-400/20",
    bgColor: "bg-sky-400/10",
    description: "Track posts, mentions, and engagement metrics across your X profile.",
    features: ["Post tracking", "Mention alerts", "Engagement analytics", "Thread monitoring"],
    oauthUrl: "#",
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: MessageCircle,
    color: "text-orange-400",
    borderColor: "border-orange-400/20",
    bgColor: "bg-orange-400/10",
    description: "Monitor subreddit activity, track posts, comments, and karma.",
    features: ["Post tracking", "Comment activity", "Karma metrics", "Subreddit monitoring"],
    oauthUrl: "#",
  },
  {
    id: "discord",
    name: "Discord",
    icon: MessageCircle,
    color: "text-indigo-400",
    borderColor: "border-indigo-400/20",
    bgColor: "bg-indigo-400/10",
    description: "Link your Discord account for server membership and activity tracking.",
    features: ["Server membership", "Message activity", "Role tracking", "Channel monitoring"],
    oauthUrl: "#",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "text-red-400",
    borderColor: "border-red-400/20",
    bgColor: "bg-red-400/10",
    description: "Channel stats, video uploads, view counts, and subscriber tracking.",
    features: ["Channel analytics", "Upload tracking", "View count monitoring", "Subscriber growth"],
    oauthUrl: "#",
  },
];

/* ── Account card ───────────────────────────────────────────── */
function AccountCard({ platform }: { platform: Platform }) {
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const Icon = platform.icon;

  const handleConnect = () => {
    // In production, this would redirect to OAuth flow
    setConnected(true);
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };

  return (
    <motion.div
      variants={staggerItem}
      className={`rounded-2xl border ${connected ? platform.borderColor : "border-wireframe-stroke"} bg-black/40 p-5 backdrop-blur-xl transition`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${platform.borderColor} ${platform.bgColor}`}>
            <Icon size={22} className={platform.color} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{platform.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
              <span className="text-xs text-white/40">{connected ? "Connected" : "Not connected"}</span>
            </div>
          </div>
        </div>
        {connected && (
          <button
            type="button"
            onClick={handleSync}
            className="flex items-center gap-1.5 rounded-lg border border-wireframe-stroke bg-white/5 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10"
          >
            <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
            Sync
          </button>
        )}
      </div>

      <p className="text-xs text-white/50 leading-relaxed mb-4">{platform.description}</p>

      {/* Features */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {platform.features.map((f) => (
          <span key={f} className="rounded-full border border-wireframe-stroke bg-white/5 px-2.5 py-0.5 text-[10px] text-white/40">
            {f}
          </span>
        ))}
      </div>

      {/* Stats (when connected) */}
      {connected && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-lg border border-wireframe-stroke bg-white/5 p-2 text-center">
            <p className="text-lg font-bold text-white">—</p>
            <p className="text-[10px] text-white/30">Posts</p>
          </div>
          <div className="rounded-lg border border-wireframe-stroke bg-white/5 p-2 text-center">
            <p className="text-lg font-bold text-white">—</p>
            <p className="text-[10px] text-white/30">Engagement</p>
          </div>
        </div>
      )}

      {/* Action button */}
      {connected ? (
        <button
          type="button"
          onClick={() => setConnected(false)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
        >
          <Unplug size={14} />
          Disconnect
        </button>
      ) : (
        <button
          type="button"
          onClick={handleConnect}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border ${platform.borderColor} ${platform.bgColor} py-2.5 text-xs font-semibold ${platform.color} transition hover:opacity-80`}
        >
          <LinkIcon size={14} />
          Connect {platform.name}
        </button>
      )}
    </motion.div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function ConnectedAccountsPage() {
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
        <h1 className="text-2xl font-semibold tracking-tight text-white font-display">
          Connected Accounts
        </h1>
        <p className="text-sm text-white/50">
          Link your social and developer accounts to track activity across platforms.
        </p>
      </motion.header>

      {/* Status bar */}
      <motion.div variants={staggerItem} className="flex items-center gap-4 rounded-2xl border border-wireframe-stroke bg-black/40 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Check size={14} className="text-emerald-400" />
          <span className="text-xs text-white/60">0 of {platforms.length} accounts connected</span>
        </div>
        <div className="flex-1" />
        <span className="text-[10px] text-white/30">Connect accounts to enable the Activity Feed</span>
      </motion.div>

      {/* Platform grid */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map((platform) => (
          <AccountCard key={platform.id} platform={platform} />
        ))}
      </motion.div>

      {/* Privacy note */}
      <motion.div variants={staggerItem} className="rounded-2xl border border-wireframe-stroke bg-white/[0.02] p-4 text-center">
        <p className="text-xs text-white/30">
          A.I.M.S. only reads public data from connected accounts. You can disconnect at any time.
          We never post on your behalf without explicit permission.
        </p>
      </motion.div>
    </motion.div>
  );
}
