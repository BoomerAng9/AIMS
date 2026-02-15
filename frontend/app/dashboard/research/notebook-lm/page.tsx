// frontend/app/dashboard/research/notebook-lm/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import {
  BookOpen,
  ArrowLeft,
  Play,
  Pause,
  FileText,
  Download,
  Headphones,
  Lightbulb,
  ExternalLink,
  CheckCircle2,
  Globe,
  Bot,
  Shield,
  TrendingUp,
  Library,
} from "lucide-react";

/* ── Key Findings ──────────────────────────────────────────── */

const keyFindings = [
  {
    icon: Bot,
    title: "Autonomous agents become mainstream",
    description:
      "By 2026, over 60% of enterprise software workflows involve at least one autonomous AI agent handling tasks from data ingestion to customer response, up from 8% in 2024.",
  },
  {
    icon: Globe,
    title: "Protocol standardization accelerates",
    description:
      "ACP, MCP, and A2A protocols form the foundation of the agentic web. Interoperability between agent frameworks is no longer optional — it is a market requirement.",
  },
  {
    icon: Shield,
    title: "Security & trust are the primary bottleneck",
    description:
      "Agent sandboxing, capability-based permissions, and audit trails are critical. Organizations that fail to implement defense-grade isolation face significant regulatory risk.",
  },
  {
    icon: TrendingUp,
    title: "Vibe coding reshapes development culture",
    description:
      "AI-assisted development (vibe coding) reduces time-to-prototype by 70%. Teams that embrace AI pair-programming ship features 3x faster with comparable quality.",
  },
  {
    icon: Lightbulb,
    title: "Platform consolidation drives winner-take-all dynamics",
    description:
      "The agentic web favors platforms that offer end-to-end agent lifecycle management — from build and test to deploy and billing — creating strong network effects.",
  },
];

/* ── Research Sources ──────────────────────────────────────── */

const researchSources = [
  {
    name: "NotebookLM",
    description: "AI-powered research synthesis and audio deep-dive generation",
    url: "https://notebooklm.google.com",
  },
  {
    name: "Google DeepMind Research Papers",
    description: "Foundation models, agent architectures, and safety research",
    url: "https://deepmind.google/research/",
  },
  {
    name: "Anthropic Research",
    description: "Constitutional AI, model alignment, and safety benchmarks",
    url: "https://www.anthropic.com/research",
  },
  {
    name: "Gartner 2026 AI Hype Cycle",
    description: "Enterprise adoption trends and technology maturity assessment",
    url: "#",
  },
  {
    name: "McKinsey Global AI Survey 2026",
    description: "Economic impact analysis and industry adoption patterns",
    url: "#",
  },
];

/* ── Audio Player Component ────────────────────────────────── */

function AudioPlayer({ src, title }: { src: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-wireframe-stroke bg-black/40 p-4 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => {
          const el = document.getElementById(
            "notebook-audio"
          ) as HTMLAudioElement | null;
          if (!el) return;
          if (playing) {
            el.pause();
          } else {
            el.play();
          }
          setPlaying(!playing);
        }}
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold transition hover:bg-gold/20"
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-white/40">Audio Playbook</p>
      </div>
      <audio
        id="notebook-audio"
        src={src}
        onEnded={() => setPlaying(false)}
        preload="metadata"
      />
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function NotebookLMPage() {
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
            <BookOpen size={22} className="text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white font-display">
              NotebookLM Research
            </h1>
            <p className="text-sm text-white/50">
              AI-powered research synthesis on the Agentic Web in 2026
            </p>
          </div>
        </div>
      </motion.section>

      {/* ── Embedded Video ──────────────────────────────────── */}
      <motion.section
        variants={staggerItem}
        className="relative overflow-hidden rounded-3xl border border-wireframe-stroke bg-black/60 backdrop-blur-2xl"
      >
        <div className="relative aspect-video w-full">
          <video
            className="h-full w-full rounded-3xl object-cover"
            controls
            playsInline
            preload="metadata"
          >
            <source
              src="/media/research/agentic-web-overview.mp4"
              type="video/mp4"
            />
            Your browser does not support the video element.
          </video>
          {/* Overlay title */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-start justify-end rounded-3xl bg-gradient-to-t from-black/80 via-transparent to-transparent p-6 md:p-8">
            <h2 className="text-xl font-display font-bold uppercase tracking-wider text-white md:text-2xl">
              The Agentic Web — 2026 Overview
            </h2>
            <p className="mt-1 text-sm text-gold/80">
              Video research brief generated via NotebookLM
            </p>
          </div>
        </div>
      </motion.section>

      {/* ── Audio Player Section ────────────────────────────── */}
      <motion.section variants={staggerItem}>
        <div className="mb-3 flex items-center gap-3">
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

      {/* ── PDF Report Card ────────────────────────────────── */}
      <motion.section variants={staggerItem}>
        <div className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/10">
                <FileText size={18} className="text-gold" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white font-display">
                  Agentic Web 2026 — Technical &amp; Strategic Report
                </h3>
                <p className="text-xs text-white/40">
                  Comprehensive PDF report generated from NotebookLM research
                </p>
              </div>
            </div>
            <a
              href="/media/research/agentic-web-report.pdf"
              download
              className="inline-flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/10 px-5 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/20"
            >
              <Download size={14} />
              Download PDF
            </a>
          </div>

          {/* Inline PDF Preview */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-wireframe-stroke">
            <iframe
              src="/media/research/agentic-web-report.pdf"
              className="h-[400px] w-full bg-white/5"
              title="Agentic Web 2026 Report"
            />
          </div>
        </div>
      </motion.section>

      {/* ── Key Findings ───────────────────────────────────── */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          Key Findings
        </h2>
        <div className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
          <div className="space-y-5">
            {keyFindings.map((finding, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/10">
                  <finding.icon size={18} className="text-gold" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white">
                    {finding.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    {finding.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Research Sources ───────────────────────────────── */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          Research Sources
        </h2>
        <div className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
          <div className="space-y-3">
            {researchSources.map((source) => (
              <div
                key={source.name}
                className="flex items-center justify-between rounded-2xl border border-wireframe-stroke bg-white/5 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Library size={14} className="flex-shrink-0 text-gold/60" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {source.name}
                    </p>
                    <p className="text-xs text-white/40 truncate">
                      {source.description}
                    </p>
                  </div>
                </div>
                {source.url !== "#" && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 ml-3 text-gold/60 transition hover:text-gold"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
