'use client';

/**
 * Architect — Solutions Architect Role Page
 *
 * Systems and solutions architecture console.
 * Cloud design, microservices, IaC, C4 diagrams.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, fadeUp } from '@/lib/motion';
import { usePlatformMode } from '@/lib/platform-mode';
import {
  Layers, ArrowLeft, Cpu, Zap, ChevronRight,
  GitBranch, Database, Cloud, Network,
  FileCode, Box, Activity,
} from 'lucide-react';

const CAPABILITIES = [
  { name: 'System Design', description: 'End-to-end architecture for distributed systems at any scale.', icon: Network },
  { name: 'Cloud Architecture', description: 'AWS, GCP, Azure — multi-cloud and hybrid cloud design patterns.', icon: Cloud },
  { name: 'Microservices & Event-Driven', description: 'Service boundaries, event buses, saga patterns, CQRS.', icon: GitBranch },
  { name: 'Infrastructure as Code', description: 'Terraform, Pulumi, CloudFormation — reproducible infrastructure.', icon: FileCode },
  { name: 'Data Architecture', description: 'Data modeling, pipelines, lakehouse patterns, real-time streaming.', icon: Database },
  { name: 'C4 Architecture Diagrams', description: 'Context, Container, Component, Code — stakeholder-appropriate views.', icon: Box },
];

const AGENT_CHAIN = [
  { name: 'ACHEEVY', role: 'Orchestrator', color: 'text-amber-400' },
  { name: 'Chicken Hawk', role: 'Coordinator', color: 'text-zinc-400' },
  { name: 'Architect_Ang', role: 'Solutions Architect', color: 'text-violet-400' },
  { name: 'Lil_Blueprint_Hawk', role: 'Documentation', color: 'text-purple-400' },
];

const DELIVERABLES = [
  'C4 Architecture Diagrams (Context → Code)',
  'Technology Decision Records (ADRs)',
  'Infrastructure-as-Code Templates',
  'Data Flow & Integration Maps',
  'Migration Path & Risk Assessment',
  'Non-Functional Requirements Matrix',
];

export default function ArchitectPage() {
  const { mode } = usePlatformMode();
  const isPrivate = mode === 'PRIVATE';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <Link
        href="/dashboard/hybrid-business-manager"
        className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{isPrivate ? 'Hybrid Business Manager' : 'Professional Services'}</span>
      </Link>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30 flex items-center justify-center">
            <Layers className="w-7 h-7 text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-display text-zinc-100">
              {isPrivate ? 'Architect' : 'Architecture Review'}
            </h1>
            <p className="text-sm text-zinc-500 font-mono uppercase tracking-widest">
              {isPrivate
                ? 'Solutions Architecture — Design at Scale'
                : 'Expert System Design & Architecture Advisory'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Activity className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs text-violet-400 font-medium">Blueprint Ready</span>
          </div>
          {isPrivate && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181B] border border-wireframe-stroke">
              <Cpu className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-500 font-medium">Architect_Ang + Lil_Blueprint_Hawk</span>
            </div>
          )}
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
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-violet-400" />
                </div>
                <h4 className="text-sm font-medium text-zinc-100">{cap.name}</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">{cap.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Deliverables ──────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-zinc-500">Deliverables</span>
          <div className="flex-1 h-px bg-wireframe-stroke" />
        </div>

        <div className="rounded-xl border border-wireframe-stroke bg-[#1F1F23]/60 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DELIVERABLES.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                </div>
                <span className="text-sm text-zinc-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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

      <Link href="/dashboard/chat">
        <div className="group rounded-xl border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 transition-all p-5 cursor-pointer flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-violet-400" />
            <div>
              <p className="text-sm font-medium text-zinc-200">Start Architecture Assessment</p>
              <p className="text-xs text-zinc-500">Chat with ACHEEVY to begin the architecture review</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-violet-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </div>
  );
}
