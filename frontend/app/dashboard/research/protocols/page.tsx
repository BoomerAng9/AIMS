// frontend/app/dashboard/research/protocols/page.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import {
  Network,
  ArrowLeft,
  Cpu,
  Wrench,
  Globe2,
  CheckCircle2,
  FlaskConical,
  Zap,
  Layers,
  ArrowDown,
  Shield,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

/* ── Protocol Data ─────────────────────────────────────────── */

const protocols = [
  {
    id: "acp",
    name: "ACP",
    fullName: "Agent Communication Protocol",
    icon: Cpu,
    description:
      "A.I.M.S. native protocol. Standardized request/response format for agent-to-agent communication within the AIMS ecosystem.",
    status: "Active" as const,
    statusColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    agents: ["ACHEEVY", "Boomer_Angs", "Chicken Hawks"],
    features: [
      "Typed request/response envelopes",
      "Built-in retry & circuit-breaking",
      "Persona-aware routing",
      "Chain of Command enforcement",
      "Event-driven pub/sub channels",
    ],
  },
  {
    id: "mcp",
    name: "MCP",
    fullName: "Model Context Protocol",
    icon: Wrench,
    description:
      "Anthropic's protocol for model-tool interaction. Enables structured tool use, context passing, and capability negotiation between LLMs and external tools.",
    status: "Integrated" as const,
    statusColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    agents: ["Claude-based agents", "II-Agent"],
    features: [
      "Tool schema declaration",
      "Structured input/output binding",
      "Context window management",
      "Multi-turn tool chaining",
      "Safety guardrails & permissions",
    ],
  },
  {
    id: "a2a",
    name: "A2A",
    fullName: "Agent-to-Agent Protocol",
    icon: Globe2,
    description:
      "Google's open protocol for cross-platform agent interoperability. Designed for heterogeneous agent ecosystems where agents from different vendors need to collaborate.",
    status: "Research" as const,
    statusColor: "bg-gold/10 text-gold border-gold/30",
    agents: ["Future: Vertex AI agents", "ADK pipelines"],
    features: [
      "Cross-platform agent discovery",
      "Capability advertisement & negotiation",
      "Federated task delegation",
      "Vendor-neutral message format",
      "Trust & identity verification",
    ],
  },
];

/* ── Protocol Stack Layers ─────────────────────────────────── */

const stackLayers = [
  {
    label: "Application Layer",
    protocol: "ACP",
    description: "Agent personas, Chain of Command, skill routing",
    color: "#D4A843",
  },
  {
    label: "Tool Layer",
    protocol: "MCP",
    description: "Tool schemas, context passing, LLM integration",
    color: "#3B82F6",
  },
  {
    label: "Interop Layer",
    protocol: "A2A",
    description: "Cross-platform discovery, federated delegation",
    color: "#F59E0B",
  },
  {
    label: "Transport Layer",
    protocol: "HTTP/WS",
    description: "Hono.js gateway, WebSocket channels, REST endpoints",
    color: "#6B7280",
  },
];

/* ── Status Icon ───────────────────────────────────────────── */

function StatusIcon({ status }: { status: string }) {
  if (status === "Active") return <CheckCircle2 size={14} />;
  if (status === "Integrated") return <Zap size={14} />;
  return <FlaskConical size={14} />;
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function ProtocolsPage() {
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
            <Network size={22} className="text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white font-display">
              Agentic Protocols
            </h1>
            <p className="text-sm text-white/50">
              Communication standards powering the A.I.M.S. agent ecosystem
            </p>
          </div>
        </div>
      </motion.section>

      {/* ── Protocol Cards Grid ────────────────────────────── */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          Protocol Registry
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {protocols.map((protocol) => (
            <motion.div
              key={protocol.id}
              whileHover={{ y: -4 }}
              className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl"
            >
              {/* Icon + Name + Status */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/10">
                    <protocol.icon size={18} className="text-gold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white font-display">
                      {protocol.name}
                    </h3>
                    <p className="text-xs text-white/40">{protocol.fullName}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${protocol.statusColor}`}
                >
                  <StatusIcon status={protocol.status} />
                  {protocol.status}
                </span>
              </div>

              {/* Description */}
              <p className="mb-4 text-sm leading-relaxed text-white/60">
                {protocol.description}
              </p>

              {/* Active Agents */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gold">
                  Used By
                </p>
                <div className="flex flex-wrap gap-2">
                  {protocol.agents.map((agent) => (
                    <span
                      key={agent}
                      className="rounded-lg border border-wireframe-stroke bg-white/5 px-2.5 py-1 text-xs text-white/70"
                    >
                      {agent}
                    </span>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gold">
                  Key Features
                </p>
                <ul className="space-y-1.5">
                  {protocol.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-xs text-white/50"
                    >
                      <CheckCircle2
                        size={12}
                        className="mt-0.5 flex-shrink-0 text-gold/60"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Protocol Stack ─────────────────────────────────── */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          Protocol Stack
        </h2>
        <div className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
          <p className="mb-6 text-sm text-white/50">
            How the three protocols layer within the A.I.M.S. architecture, from
            application logic down to transport.
          </p>

          <div className="mx-auto max-w-2xl space-y-0">
            {stackLayers.map((layer, i) => (
              <div key={layer.label}>
                {/* Layer Card */}
                <div
                  className="relative rounded-2xl border p-4"
                  style={{
                    borderColor: `${layer.color}30`,
                    backgroundColor: `${layer.color}08`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Layers size={16} style={{ color: layer.color }} />
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: layer.color }}
                        >
                          {layer.label}
                        </p>
                        <p className="text-xs text-white/40">{layer.description}</p>
                      </div>
                    </div>
                    <span
                      className="rounded-lg px-3 py-1 text-xs font-mono font-bold"
                      style={{
                        color: layer.color,
                        backgroundColor: `${layer.color}15`,
                        border: `1px solid ${layer.color}30`,
                      }}
                    >
                      {layer.protocol}
                    </span>
                  </div>
                </div>

                {/* Arrow Between Layers */}
                {i < stackLayers.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown size={16} className="text-white/20" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 border-t border-wireframe-stroke pt-4">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Shield size={12} className="text-gold" />
              <span>Security boundary at every layer</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <MessageSquare size={12} className="text-blue-400" />
              <span>Structured message passing</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <RefreshCw size={12} className="text-gold" />
              <span>Retry & circuit-breaking at ACP layer</span>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
