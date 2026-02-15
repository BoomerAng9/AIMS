// frontend/app/dashboard/research/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import {
  Play,
  FileText,
  Headphones,
  ArrowRight,
  Download,
  Globe,
  GitBranch,
  DollarSign,
  BookOpen,
  Network,
  Users,
  Activity,
  Pause,
} from "lucide-react";

/* ── Sub-page cards ─────────────────────────────────────────── */
const researchPages = [
  {
    href: "/dashboard/research/protocols",
    icon: Network,
    title: "Protocols",
    description: "ACP, MCP, A2A — agentic communication standards powering the 2026 web.",
  },
  {
    href: "/dashboard/research/google-ecosystem",
    icon: Globe,
    title: "Google Ecosystem",
    description: "Vertex AI, ADK, Cloud Build — how A.I.M.S. integrates with Google Cloud.",
  },
  {
    href: "/dashboard/research/revenue-platform",
    icon: DollarSign,
    title: "Revenue Platform",
    description: "LUC billing tiers, aiPlug marketplace, and monetization strategy.",
  },
  {
    href: "/dashboard/research/codebase-sync",
    icon: GitBranch,
    title: "Codebase Sync",
    description: "GitHub integration, repository connections, and code activity tracking.",
  },
  {
    href: "/dashboard/research/notebook-lm",
    icon: BookOpen,
    title: "NotebookLM",
    description: "AI-powered research summaries, audio deep-dives, and knowledge synthesis.",
  },
  {
    href: "/dashboard/research/connected-accounts",
    icon: Users,
    title: "Connected Accounts",
    description: "Link your GitHub, X, Reddit, Discord, and YouTube for unified tracking.",
  },
  {
    href: "/dashboard/research/activity-feed",
    icon: Activity,
    title: "Activity Feed",
    description: "Track posts, engagement, and contributions across all connected platforms.",
  },
];

/* ── Audio Player ───────────────────────────────────────────── */
function AudioPlayer({ src, title }: { src: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-wireframe-stroke bg-black/40 p-4 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => {
          const el = document.getElementById("research-audio") as HTMLAudioElement | null;
          if (!el) return;
          if (playing) { el.pause(); } else { el.play(); }
          setPlaying(!playing);
        }}
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold transition hover:bg-gold/20"
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{title}</p>
        <p className="text-xs text-white/40">Audio Playbook</p>
      </div>
      <audio id="research-audio" src={src} onEnded={() => setPlaying(false)} preload="metadata" />
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function ResearchHubPage() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-8 animate-in fade-in duration-700"
    >
      {/* ── Hero: Video Section ───────────────────────────── */}
      <motion.section variants={staggerItem} className="relative overflow-hidden rounded-3xl border border-wireframe-stroke bg-black/60 backdrop-blur-2xl">
        <div className="relative aspect-video w-full">
          <video
            className="h-full w-full rounded-3xl object-cover"
            controls
            playsInline
            preload="metadata"
            poster=""
          >
            <source src="/media/research/agentic-web-overview.mp4" type="video/mp4" />
            Your browser does not support the video element.
          </video>
          {/* Overlay title */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-start justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-6 md:p-8 rounded-3xl">
            <h1 className="text-2xl md:text-4xl font-display font-bold uppercase tracking-wider text-white">
              A.I.M.S. Research &amp; Development Hub
            </h1>
            <p className="mt-1 text-sm md:text-base text-gold/80">
              The Agentic Web — 2026 Technical &amp; Strategic Overview
            </p>
          </div>
        </div>
      </motion.section>

      {/* ── PDF Slide Deck ────────────────────────────────── */}
      <motion.section variants={staggerItem} className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/10">
              <FileText size={18} className="text-gold" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white font-display">
                Agentic Web 2026 — Technical &amp; Strategic Report
              </h2>
              <p className="text-xs text-white/40">Research conducted via NotebookLM</p>
            </div>
          </div>
          <a
            href="/media/research/agentic-web-report.pdf"
            download
            className="flex items-center gap-2 rounded-lg border border-gold/20 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold transition hover:bg-gold/20"
          >
            <Download size={14} />
            Download PDF
          </a>
        </div>
        <div className="overflow-hidden rounded-2xl border border-wireframe-stroke">
          <iframe
            src="/media/research/agentic-web-report.pdf"
            className="h-[600px] w-full bg-white/5"
            title="Agentic Web 2026 Report"
          />
        </div>
      </motion.section>

      {/* ── Audio Playbook ────────────────────────────────── */}
      <motion.section variants={staggerItem}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/20 bg-gold/10">
            <Headphones size={14} className="text-gold" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
            Audio Deep-Dive
          </h2>
        </div>
        <AudioPlayer
          src="/media/research/vibe-coding-playbook.m4a"
          title="Vibe Coding & the Agentic Web Playbook"
        />
      </motion.section>

      {/* ── Quick Nav Cards ───────────────────────────────── */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          Explore Research Areas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {researchPages.map((page) => (
            <Link key={page.href} href={page.href}>
              <motion.div
                whileHover={{ y: -2, scale: 1.01 }}
                className="group flex flex-col gap-3 rounded-2xl border border-wireframe-stroke bg-black/40 p-5 backdrop-blur-xl transition hover:border-gold/20 hover:bg-gold/5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-wireframe-stroke bg-white/5 group-hover:border-gold/20 group-hover:bg-gold/10 transition">
                    <page.icon size={18} className="text-white/60 group-hover:text-gold transition" />
                  </div>
                  <ArrowRight size={14} className="text-white/20 group-hover:text-gold/60 transition" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-gold transition">{page.title}</h3>
                  <p className="mt-1 text-xs text-white/40 leading-relaxed">{page.description}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
