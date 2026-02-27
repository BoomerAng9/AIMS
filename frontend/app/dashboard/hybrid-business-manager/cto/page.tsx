'use client';

/**
 * CTO — Chief Technology Officer Role Page
 *
 * Technology strategy, digital transformation, engineering hiring,
 * build-vs-buy analysis, AI strategy, and budget planning.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, fadeUp } from '@/lib/motion';
import { usePlatformMode } from '@/lib/platform-mode';
import {
  Compass, ArrowLeft, Cpu, Zap, ChevronRight,
  TrendingUp, Users, DollarSign, Lightbulb,
  Target, BarChart3, Activity,
} from 'lucide-react';

const CAPABILITIES = [
  { name: 'Technology Strategy', description: 'Align technology investments with business objectives. 12-18 month roadmaps.', icon: Target },
  { name: 'Digital Transformation', description: 'Modernize legacy systems, adopt AI, enable data-driven operations.', icon: Lightbulb },
  { name: 'Build vs. Buy Analysis', description: 'Rigorous evaluation framework for make-or-buy technology decisions.', icon: BarChart3 },
  { name: 'AI Strategy', description: 'Where AI creates value, what to build, what to buy, ROI projections.', icon: TrendingUp },
  { name: 'Engineering Team Building', description: 'Hiring plans, seniority mix, org structure, culture development.', icon: Users },
  { name: 'Budget & Vendor Planning', description: 'Technology budget allocation, vendor evaluation, contract negotiation.', icon: DollarSign },
];

const AGENT_CHAIN = [
  { name: 'ACHEEVY', role: 'Orchestrator', color: 'text-amber-400' },
  { name: 'Chicken Hawk', role: 'Coordinator', color: 'text-zinc-400' },
  { name: 'CTO_Ang', role: 'Tech Strategist', color: 'text-emerald-400' },
  { name: 'Lil_Assess_Hawk', role: 'Assessment Specialist', color: 'text-green-400' },
];

const DELIVERABLES = [
  '12-Month Technology Roadmap with Quarterly Milestones',
  'Build vs. Buy Decision Matrix',
  'AI Integration Opportunity Analysis with ROI',
  'Engineering Hiring Plan (Roles, Seniority, Timeline)',
  'Technology Budget Allocation Framework',
  'Competitive Technology Landscape Report',
  'Vendor Evaluation Scorecards',
  'Executive Summary & Board Presentation',
];

export default function CTOPage() {
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
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Compass className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-display text-zinc-100">
              {isPrivate ? 'CTO' : 'Technology Advisory'}
            </h1>
            <p className="text-sm text-zinc-500 font-mono uppercase tracking-widest">
              {isPrivate
                ? 'Chief Technology Officer — Strategy & Leadership'
                : 'Strategic Technology Planning & Advisory'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Strategy Ready</span>
          </div>
          {isPrivate && (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181B] border border-wireframe-stroke">
                <Cpu className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500 font-medium">CTO_Ang + Lil_Assess_Hawk</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">$50M+ Strategy Track Record</span>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* ── Key Stat ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20"
      >
        <div className="flex items-center gap-4">
          <span className="text-3xl font-display text-emerald-400">$50M+</span>
          <div>
            <p className="text-sm text-zinc-300">Retail Expansion Strategy Created</p>
            <p className="text-xs text-zinc-500">Data-driven customer targeting for Southeast expansion</p>
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
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-emerald-400" />
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
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
        <div className="group rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all p-5 cursor-pointer flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-zinc-200">Start Technology Advisory</p>
              <p className="text-xs text-zinc-500">Chat with ACHEEVY to begin the strategic assessment</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </div>
  );
}
