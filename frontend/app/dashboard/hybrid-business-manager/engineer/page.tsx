'use client';

/**
 * H B Engineer — Hybrid Business Engineer Role Page
 *
 * Forward Deployment Engineering console. Takes AI from pilot to production.
 * Displays capabilities, agent chain, and action triggers for HBEngineer_Ang.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, fadeUp } from '@/lib/motion';
import { usePlatformMode } from '@/lib/platform-mode';
import {
  Code2, ArrowLeft, Cpu, Zap, CheckCircle2,
  ChevronRight, GitBranch, Database, Cloud,
  Monitor, Rocket, Shield, Activity,
} from 'lucide-react';

const CAPABILITIES = [
  { name: 'AI Forward Deployment', description: 'Embed with teams to take AI from prototype to production systems.', icon: Rocket },
  { name: 'RAG Architecture', description: 'Design and deploy retrieval-augmented generation pipelines with vector stores.', icon: Database },
  { name: 'Agentic AI Orchestration', description: 'Multi-agent systems, tool use, MCP integration, autonomous workflows.', icon: GitBranch },
  { name: 'Production CI/CD', description: 'Build deployment pipelines with versioning, rollback, and blue-green deploy.', icon: Cloud },
  { name: 'Observability & Monitoring', description: 'Metrics, logs, traces — full observability stack for AI systems.', icon: Monitor },
  { name: 'Compliance Integration', description: 'Deploy AI in regulated environments: SOC2, HIPAA, FedRAMP, air-gapped.', icon: Shield },
];

const AGENT_CHAIN = [
  { name: 'ACHEEVY', role: 'Orchestrator', color: 'text-amber-400' },
  { name: 'Chicken Hawk', role: 'Coordinator', color: 'text-zinc-400' },
  { name: 'HBEngineer_Ang', role: 'Lead Engineer', color: 'text-blue-400' },
  { name: 'Lil_Deploy_Hawk', role: 'Deploy Specialist', color: 'text-cyan-400' },
];

const METHODOLOGY = [
  { phase: 'Define', description: 'Scope the deployment: what AI, what scale, what constraints.' },
  { phase: 'Measure', description: 'Benchmark current state: latency, accuracy, uptime, cost.' },
  { phase: 'Analyze', description: 'Identify gaps between pilot and production requirements.' },
  { phase: 'Improve', description: 'Build the deployment pipeline and production infrastructure.' },
  { phase: 'Control', description: 'Monitor, alert, rollback — keep it running at SLA.' },
];

export default function HBEngineerPage() {
  const { mode } = usePlatformMode();
  const isPrivate = mode === 'PRIVATE';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* ── Breadcrumb ────────────────────────────────────────── */}
      <Link
        href="/dashboard/hybrid-business-manager"
        className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{isPrivate ? 'Hybrid Business Manager' : 'Professional Services'}</span>
      </Link>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30 flex items-center justify-center">
            <Code2 className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-display text-zinc-100">
              {isPrivate ? 'H B Engineer' : 'AI Deployment Services'}
            </h1>
            <p className="text-sm text-zinc-500 font-mono uppercase tracking-widest">
              {isPrivate
                ? 'Hybrid Business Engineer — Forward Deployment'
                : 'From Pilot to Production — AI That Actually Ships'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-blue-400 font-medium">Pipeline Ready</span>
          </div>
          {isPrivate && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181B] border border-wireframe-stroke">
              <Cpu className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-500 font-medium">HBEngineer_Ang + Lil_Deploy_Hawk</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Key Stat ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20"
      >
        <div className="flex items-center gap-4">
          <span className="text-3xl font-display text-blue-400">70%</span>
          <div>
            <p className="text-sm text-zinc-300">AI Development Cycle Time Reduction</p>
            <p className="text-xs text-zinc-500">Proven across pilot customer engagements</p>
          </div>
        </div>
      </motion.div>

      {/* ── Capabilities Grid ─────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-zinc-500">Capabilities</span>
          <div className="flex-1 h-px bg-wireframe-stroke" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <motion.div
                key={cap.name}
                variants={staggerItem}
                className="rounded-xl border border-wireframe-stroke bg-[#1F1F23]/60 p-5 space-y-3"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <h4 className="text-sm font-medium text-zinc-100">{cap.name}</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">{cap.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── DMAIC Methodology (Private only) ──────────────────── */}
      {isPrivate && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-zinc-500">DMAIC Methodology</span>
            <div className="flex-1 h-px bg-wireframe-stroke" />
          </div>

          <div className="flex flex-col gap-2">
            {METHODOLOGY.map((step, i) => (
              <div key={step.phase} className="flex items-start gap-4 px-4 py-3 rounded-lg bg-[#111113] border border-wireframe-stroke">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-400">{i + 1}</span>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-zinc-200">{step.phase}</h5>
                  <p className="text-xs text-zinc-500 mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Agent Chain (Private only) ────────────────────────── */}
      {isPrivate && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-zinc-500">Agent Chain</span>
            <div className="flex-1 h-px bg-wireframe-stroke" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {AGENT_CHAIN.map((agent, i) => (
              <div key={agent.name} className="flex items-center gap-2">
                <div className="px-3 py-2 rounded-lg bg-[#111113] border border-wireframe-stroke">
                  <p className={`text-xs font-mono font-bold ${agent.color}`}>{agent.name}</p>
                  <p className="text-[10px] text-zinc-600">{agent.role}</p>
                </div>
                {i < AGENT_CHAIN.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-zinc-700 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Action CTA ────────────────────────────────────────── */}
      <Link href="/dashboard/chat">
        <div className="group rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all p-5 cursor-pointer flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm font-medium text-zinc-200">Start AI Deployment Assessment</p>
              <p className="text-xs text-zinc-500">Chat with ACHEEVY to begin the forward deployment process</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </div>
  );
}
