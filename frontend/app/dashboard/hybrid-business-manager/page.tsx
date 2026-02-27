'use client';

/**
 * Hybrid Business Manager — Hub Page
 *
 * Dashboard entry point for the HBM vertical. Displays:
 * - Hero with HBM identity and status
 * - Quick stats strip
 * - Four role cards (Engineer, Architect, CISO, CTO)
 * - Multus Maven card (owner-only, PRIVATE mode)
 *
 * PUBLIC mode: "Professional AI Services" — no Multus Maven branding
 * PRIVATE mode: Full HBM command center with Multus Maven access
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, fadeUp } from '@/lib/motion';
import { usePlatformMode } from '@/lib/platform-mode';
import {
  Cpu, Shield, Building2, Compass, Briefcase,
  TrendingUp, Users, Clock, ChevronRight,
  Zap, Target, Lock, Code2, Layers,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────── */

interface RoleCard {
  id: string;
  title: string;
  publicTitle: string;
  description: string;
  href: string;
  icon: typeof Cpu;
  accentColor: string;
  borderColor: string;
  status: 'live' | 'beta' | 'coming-soon';
  agent: string;
  capabilities: string[];
}

/* ── Constants ─────────────────────────────────────────────── */

const ROLE_CARDS: RoleCard[] = [
  {
    id: 'engineer',
    title: 'H B Engineer',
    publicTitle: 'AI Deployment',
    description: 'Forward Deployment Engineering. Takes AI from pilot to production. RAG, agentic AI, MCP, CI/CD pipelines.',
    href: '/dashboard/hybrid-business-manager/engineer',
    icon: Code2,
    accentColor: 'from-blue-500/20 to-cyan-500/10',
    borderColor: 'border-blue-500/30',
    status: 'live',
    agent: 'HBEngineer_Ang',
    capabilities: ['AI Deployment', 'RAG Architecture', 'Production Systems', 'MCP Integration'],
  },
  {
    id: 'architect',
    title: 'Architect',
    publicTitle: 'Architecture Review',
    description: 'Systems and solutions architecture. Cloud design, microservices, infrastructure-as-code, C4 diagrams.',
    href: '/dashboard/hybrid-business-manager/architect',
    icon: Layers,
    accentColor: 'from-violet-500/20 to-purple-500/10',
    borderColor: 'border-violet-500/30',
    status: 'live',
    agent: 'Architect_Ang',
    capabilities: ['System Design', 'Cloud Architecture', 'IaC Templates', 'Data Modeling'],
  },
  {
    id: 'ciso',
    title: 'CISO',
    publicTitle: 'Security Assessment',
    description: 'Security posture, compliance audits, risk management. SOC2, HIPAA, FedRAMP, NIST frameworks.',
    href: '/dashboard/hybrid-business-manager/ciso',
    icon: Lock,
    accentColor: 'from-red-500/20 to-orange-500/10',
    borderColor: 'border-red-500/30',
    status: 'live',
    agent: 'Security_Ang',
    capabilities: ['Compliance Audit', 'Risk Management', 'Incident Response', 'Policy Generation'],
  },
  {
    id: 'cto',
    title: 'CTO',
    publicTitle: 'Technology Advisory',
    description: 'Technology strategy, digital transformation, engineering hiring, build-vs-buy analysis, AI strategy.',
    href: '/dashboard/hybrid-business-manager/cto',
    icon: Compass,
    accentColor: 'from-emerald-500/20 to-green-500/10',
    borderColor: 'border-emerald-500/30',
    status: 'live',
    agent: 'CTO_Ang',
    capabilities: ['Tech Strategy', 'Roadmap Planning', 'AI Strategy', 'Team Building'],
  },
];

const STATUS_BADGE = {
  live: { label: 'LIVE', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  beta: { label: 'BETA', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  'coming-soon': { label: 'SOON', className: 'bg-[#1F1F23] text-zinc-500 border-white/10' },
} as const;

const PROOF_POINTS = [
  { label: 'Cycle Reduction', value: '70%', color: 'text-blue-400' },
  { label: 'Gov Contracts', value: '$2.9M', color: 'text-emerald-400' },
  { label: 'Strategy Scale', value: '$50M+', color: 'text-amber-400' },
  { label: 'FDE Growth', value: '800%+', color: 'text-red-400' },
];

/* ── Component ─────────────────────────────────────────────── */

export default function HybridBusinessManagerPage() {
  const { mode, isOwner } = usePlatformMode();
  const isPrivate = mode === 'PRIVATE';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/10 border border-blue-500/30 flex items-center justify-center">
            <Briefcase className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-display text-zinc-100">
              {isPrivate ? 'Hybrid Business Manager' : 'Professional AI Services'}
            </h1>
            <p className="text-sm text-zinc-500 font-mono uppercase tracking-widest">
              {isPrivate
                ? 'Fractional Executive Roles — Automated by ACHEEVY'
                : 'Enterprise-Grade AI Services — Powered by ACHEEVY'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">4 Roles Active</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181B] border border-wireframe-stroke">
            <Users className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500 font-medium">
              {isPrivate ? '8 Agents Assigned' : 'Full AI Team Ready'}
            </span>
          </div>
          {isPrivate && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-blue-400 font-medium">DMAIC + Lean Six Sigma</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Proof Points Strip ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {PROOF_POINTS.map((stat) => (
          <div key={stat.label} className="px-4 py-3 rounded-xl bg-[#111113] border border-wireframe-stroke">
            <p className={`text-xl font-display ${stat.color}`}>{stat.value}</p>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Role Cards Grid ──────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-zinc-500">
            {isPrivate ? 'HBM Roles' : 'Services'}
          </span>
          <div className="flex-1 h-px bg-wireframe-stroke" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {ROLE_CARDS.map((card) => {
            const Icon = card.icon;
            const badge = STATUS_BADGE[card.status];

            return (
              <motion.div key={card.id} variants={staggerItem}>
                <Link href={card.href}>
                  <div className={`group rounded-xl border ${card.borderColor} bg-[#1F1F23]/60 hover:bg-white/5 transition-all p-6 h-full flex flex-col gap-4 cursor-pointer`}>
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.accentColor} border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform`}>
                        <Icon className="w-6 h-6 text-zinc-200" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-zinc-100 group-hover:text-blue-400 transition-colors">
                        {isPrivate ? card.title : card.publicTitle}
                      </h3>
                      <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{card.description}</p>
                    </div>

                    {isPrivate && (
                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-600">
                        <Cpu className="w-3 h-3" />
                        <span>{card.agent}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {card.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-zinc-500 border border-white/5"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-zinc-600 group-hover:text-blue-400 transition-colors">
                      <span>{isPrivate ? 'Open Role Console' : 'Start Assessment'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Multus Maven Card (Owner-Only) ───────────────────── */}
      {isPrivate && isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-amber-500/70">
              Owner Command
            </span>
            <div className="flex-1 h-px bg-amber-500/20" />
          </div>

          <Link href="/dashboard/hybrid-business-manager/multus-maven">
            <div className="group rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-blue-500/5 hover:from-amber-500/10 hover:to-blue-500/10 transition-all p-6 cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-blue-500/10 border border-amber-500/30 flex items-center justify-center">
                    <Target className="w-7 h-7 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display text-amber-400 group-hover:text-amber-300 transition-colors">
                      Multus Maven
                    </h3>
                    <p className="text-sm text-zinc-500 font-mono">
                      Fractional FDE Practice Command Center
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  OWNER
                </span>
              </div>

              <p className="text-sm text-zinc-400 mt-4 leading-relaxed">
                The convergence of all four HBM roles into one operator. Client pipeline, engagement
                management, proof points, outreach tools, and the AI Deployment Readiness Assessment.
                From Pilot to Production — AI That Actually Ships.
              </p>

              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-blue-400">Engineer</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <div className="w-2 h-2 rounded-full bg-violet-400" />
                  <span className="text-violet-400">Architect</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-red-400">CISO</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-emerald-400">CTO</span>
                </div>
              </div>

              <div className="flex items-center gap-1 mt-4 text-xs text-amber-500/70 group-hover:text-amber-400 transition-colors">
                <span>Open Command Center</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
