// frontend/app/dashboard/research/google-ecosystem/page.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import {
  Globe,
  ArrowLeft,
  BrainCircuit,
  Hammer,
  GitBranch,
  HardDrive,
  Package,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  Server,
} from "lucide-react";

/* ── Google Cloud Services Data ────────────────────────────── */

const services = [
  {
    id: "vertex-ai",
    name: "Vertex AI",
    icon: BrainCircuit,
    description:
      "Google's unified ML platform. Hosts model endpoints, manages training pipelines, and provides the Gemini API for A.I.M.S. agent inference.",
    integrationStatus: "Active",
    statusColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    metrics: [
      { label: "Models Deployed", value: "3" },
      { label: "Avg Latency", value: "240ms" },
      { label: "Monthly Predictions", value: "12.4K" },
      { label: "Uptime", value: "99.97%" },
    ],
    highlights: [
      "Gemini 2.0 Flash for real-time agent responses",
      "Custom fine-tuned models for domain tasks",
      "Integrated with ADK for agent orchestration",
    ],
  },
  {
    id: "google-adk",
    name: "Google ADK",
    icon: Hammer,
    description:
      "Agent Development Kit for building, testing, and deploying AI agents. Powers the LUC billing engine and agent orchestration within A.I.M.S.",
    integrationStatus: "Active",
    statusColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    metrics: [
      { label: "Agents Built", value: "5" },
      { label: "Tools Registered", value: "18" },
      { label: "Pipelines", value: "7" },
      { label: "Test Coverage", value: "82%" },
    ],
    highlights: [
      "LUC billing ADK with 530-line engine",
      "Multi-agent orchestration pipelines",
      "Tool registry with type-safe schemas",
    ],
  },
  {
    id: "cloud-build",
    name: "Cloud Build CI/CD",
    icon: GitBranch,
    description:
      "Serverless CI/CD platform. Automates build, test, and deploy workflows for the entire A.I.M.S. stack from code push to production VPS.",
    integrationStatus: "Active",
    statusColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    metrics: [
      { label: "Builds This Month", value: "47" },
      { label: "Success Rate", value: "94%" },
      { label: "Avg Build Time", value: "4m 32s" },
      { label: "Deploy Frequency", value: "Daily" },
    ],
    highlights: [
      "Multi-stage Docker builds with layer caching",
      "Automated testing before deploy",
      "SSH deploy to production VPS at 76.x.x.x",
    ],
  },
  {
    id: "gcs",
    name: "GCS Storage",
    icon: HardDrive,
    description:
      "Google Cloud Storage for persistent object storage. Houses agent avatars, slide assets, II-Agent execution artifacts, and media files.",
    integrationStatus: "Active",
    statusColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    metrics: [
      { label: "Buckets", value: "3" },
      { label: "Total Size", value: "2.1 GB" },
      { label: "Objects", value: "1,240" },
      { label: "Egress/mo", value: "8.4 GB" },
    ],
    highlights: [
      "ai-managed-services-ii-agent-storage",
      "aims-avatars bucket for agent personas",
      "aims-slide-assets for presentation media",
    ],
  },
  {
    id: "artifact-registry",
    name: "Artifact Registry",
    icon: Package,
    description:
      "Managed container registry for Docker images. Stores production-ready images built by Cloud Build and pulled during VPS deployments.",
    integrationStatus: "Active",
    statusColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    metrics: [
      { label: "Repositories", value: "1" },
      { label: "Images", value: "7" },
      { label: "Total Tags", value: "34" },
      { label: "Region", value: "us-central1" },
    ],
    highlights: [
      "aims-docker repository in us-central1",
      "Multi-arch images (linux/amd64)",
      "Automated cleanup of old tags",
    ],
  },
];

/* ── CI/CD Pipeline Stages ─────────────────────────────────── */

const pipelineStages = [
  {
    label: "Code Push",
    detail: "Developer pushes to main branch",
    icon: GitBranch,
    color: "#D4A843",
  },
  {
    label: "Cloud Build",
    detail: "Trigger fires, builds Docker images",
    icon: Server,
    color: "#3B82F6",
  },
  {
    label: "Artifact Registry",
    detail: "Images pushed to aims-docker repo",
    icon: Package,
    color: "#8B5CF6",
  },
  {
    label: "Deploy to VPS",
    detail: "SSH pull & docker compose up",
    icon: TrendingUp,
    color: "#22C55E",
  },
];

/* ── Main Page ─────────────────────────────────────────────── */

export default function GoogleEcosystemPage() {
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
            <Globe size={22} className="text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white font-display">
              Google Ecosystem
            </h1>
            <p className="text-sm text-white/50">
              Google Cloud integrations powering the A.I.M.S. infrastructure
            </p>
          </div>
        </div>
      </motion.section>

      {/* ── Service Cards ──────────────────────────────────── */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          Integrated Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map((service) => (
            <motion.div
              key={service.id}
              whileHover={{ y: -4 }}
              className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl"
            >
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/10">
                    <service.icon size={18} className="text-gold" />
                  </div>
                  <h3 className="text-lg font-semibold text-white font-display">
                    {service.name}
                  </h3>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${service.statusColor}`}
                >
                  <CheckCircle2 size={12} />
                  {service.integrationStatus}
                </span>
              </div>

              {/* Description */}
              <p className="mb-4 text-sm leading-relaxed text-white/60">
                {service.description}
              </p>

              {/* Metrics Grid */}
              <div className="mb-4 grid grid-cols-2 gap-3">
                {service.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-xl border border-wireframe-stroke bg-white/5 px-3 py-2"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-wider text-gold/50">
                      {metric.label}
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Highlights */}
              <ul className="space-y-1.5">
                {service.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-start gap-2 text-xs text-white/50"
                  >
                    <CheckCircle2
                      size={12}
                      className="mt-0.5 flex-shrink-0 text-gold/60"
                    />
                    {h}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── CI/CD Pipeline ─────────────────────────────────── */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          A.I.M.S. CI/CD Pipeline
        </h2>
        <div className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
          <p className="mb-6 text-sm text-white/50">
            End-to-end deployment flow from code commit to live production on
            the A.I.M.S. VPS.
          </p>

          {/* Pipeline Visualization */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-0 md:gap-0">
            {pipelineStages.map((stage, i) => (
              <div key={stage.label} className="flex items-center flex-1">
                {/* Stage Card */}
                <div
                  className="flex-1 rounded-2xl border p-4 text-center"
                  style={{
                    borderColor: `${stage.color}30`,
                    backgroundColor: `${stage.color}08`,
                  }}
                >
                  <div
                    className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${stage.color}15`,
                      border: `1px solid ${stage.color}30`,
                    }}
                  >
                    <stage.icon size={18} style={{ color: stage.color }} />
                  </div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: stage.color }}
                  >
                    {stage.label}
                  </p>
                  <p className="mt-1 text-xs text-white/40">{stage.detail}</p>
                </div>

                {/* Arrow */}
                {i < pipelineStages.length - 1 && (
                  <div className="hidden md:flex items-center px-2">
                    <ArrowRight size={18} className="text-white/20" />
                  </div>
                )}
                {i < pipelineStages.length - 1 && (
                  <div className="flex md:hidden justify-center py-1">
                    <ArrowRight
                      size={16}
                      className="rotate-90 text-white/20"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pipeline Details */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-wireframe-stroke pt-4">
            <div className="flex items-center gap-3 text-xs text-white/40">
              <Clock size={14} className="text-gold/60" />
              <span>Average pipeline: ~5 minutes end-to-end</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/40">
              <CheckCircle2 size={14} className="text-emerald-400/60" />
              <span>Automated rollback on health check failure</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/40">
              <TrendingUp size={14} className="text-blue-400/60" />
              <span>47 successful deployments this month</span>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
