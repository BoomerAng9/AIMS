'use client';

/**
 * Hybrid Business Manager — Hub Page (v2)
 *
 * Full command center with:
 * - 3D interactive hero with floating role nodes
 * - Live agent status panel
 * - Role cards with dispatch capabilities
 * - Active workflow tracking
 * - Multus Maven command link (owner-only)
 */

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { staggerContainer, staggerItem, heroStagger, heroItem } from '@/lib/motion';
import { spring } from '@/lib/motion/tokens';
import { usePlatformMode } from '@/lib/platform-mode';
import { AgentStatusPanel, type AgentNode } from '@/components/hbm';
import {
  Cpu, Shield, Briefcase, TrendingUp, Users,
  ChevronRight, Zap, Target, Lock, Code2, Layers,
  Compass, Activity, Play, MessageSquare,
  GitBranch, Terminal, Crown, Loader2,
} from 'lucide-react';

/* ── 3D Hero Floating Node ─────────────────────────────────── */

function FloatingNode({
  icon: Icon, label, color, delay, x, y,
}: {
  icon: typeof Code2; label: string; color: string; delay: number; x: number; y: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <motion.div
        animate={{ y: [-3, 3, -3] }}
        transition={{ duration: 3 + delay, repeat: Infinity, ease: 'easeInOut' }}
        className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${color} border border-white/10 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-black/20`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <Icon className="w-5 h-5 md:w-6 md:h-6 text-zinc-200" />
      </motion.div>
      <p className="text-[10px] font-mono text-zinc-500 text-center mt-1.5 whitespace-nowrap">{label}</p>
    </motion.div>
  );
}

/* ── 3D Perspective Hero ───────────────────────────────────── */

function Hero3D({ isPrivate }: { isPrivate: boolean }) {
  const prefersReduced = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springCfg = { stiffness: spring.gentle.stiffness, damping: spring.gentle.damping };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springCfg);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springCfg);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [prefersReduced, mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative rounded-2xl border border-wireframe-stroke bg-gradient-to-br from-[#111113] to-[#0A0A0B] overflow-hidden"
      style={prefersReduced ? {} : { perspective: 1200, rotateX, rotateY, transformStyle: 'preserve-3d' as const }}
    >
      {/* Ambient grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Glowing orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="relative z-10 p-6 md:p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
          {/* Left: Text content */}
          <motion.div
            variants={heroStagger}
            initial="hidden"
            animate="visible"
            className="flex-1 space-y-4"
          >
            <motion.div variants={heroItem} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/10 border border-blue-500/30 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
                {isPrivate ? 'HBM Vertical' : 'AI Services'}
              </span>
            </motion.div>

            <motion.h1 variants={heroItem} className="text-3xl md:text-4xl font-display text-zinc-100 leading-tight">
              {isPrivate ? (
                <>Hybrid Business<br /><span className="text-blue-400">Manager</span></>
              ) : (
                <>Professional AI<br /><span className="text-blue-400">Services</span></>
              )}
            </motion.h1>

            <motion.p variants={heroItem} className="text-sm text-zinc-500 max-w-md leading-relaxed">
              {isPrivate
                ? 'Fractional executive roles automated through ACHEEVY. Engineer, Architect, CISO, and CTO — each backed by dedicated Boomer_Angs and Lil_Hawks.'
                : 'Enterprise-grade AI services powered by ACHEEVY. From deployment engineering to security compliance, your AI team handles it all.'
              }
            </motion.p>

            <motion.div variants={heroItem} className="flex items-center gap-3 flex-wrap pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">4 Roles Active</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181B] border border-wireframe-stroke">
                <Users className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500 font-medium">
                  {isPrivate ? '8 Agents Assigned' : 'Full AI Team'}
                </span>
              </div>
              {isPrivate && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs text-blue-400 font-medium">DMAIC Pipeline</span>
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Right: 3D Floating Role Nodes */}
          <div className="relative w-full lg:w-80 h-52 lg:h-60 flex-shrink-0" style={{ transformStyle: 'preserve-3d' }}>
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full" style={{ transform: 'translateZ(-10px)' }}>
              <line x1="50%" y1="50%" x2="25%" y2="15%" stroke="rgba(59,130,246,0.15)" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="75%" y2="15%" stroke="rgba(139,92,246,0.15)" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="25%" y2="85%" stroke="rgba(239,68,68,0.15)" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="75%" y2="85%" stroke="rgba(16,185,129,0.15)" strokeWidth="1" />
            </svg>

            {/* Center ACHEEVY node */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ transform: 'translate(-50%, -50%) translateZ(20px)' }}
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-900/10">
                <Zap className="w-7 h-7 text-amber-400" />
              </div>
              <p className="text-[10px] font-mono text-amber-400/70 text-center mt-1.5">ACHEEVY</p>
            </motion.div>

            {/* Floating role nodes */}
            <FloatingNode icon={Code2}   label="Engineer"  color="from-blue-500/20 to-blue-600/5"    delay={0.4} x={25} y={15} />
            <FloatingNode icon={Layers}  label="Architect" color="from-violet-500/20 to-violet-600/5" delay={0.5} x={75} y={15} />
            <FloatingNode icon={Lock}    label="CISO"      color="from-red-500/20 to-red-600/5"       delay={0.6} x={25} y={85} />
            <FloatingNode icon={Compass} label="CTO"       color="from-emerald-500/20 to-emerald-600/5" delay={0.7} x={75} y={85} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Constants ─────────────────────────────────────────────── */

interface RoleCard {
  id: string;
  title: string;
  publicTitle: string;
  description: string;
  href: string;
  icon: typeof Cpu;
  accentGrad: string;
  borderColor: string;
  status: 'live' | 'beta';
  agent: string;
  hawk: string;
  capabilities: string[];
}

const ROLE_CARDS: RoleCard[] = [
  {
    id: 'engineer', title: 'H B Engineer', publicTitle: 'AI Deployment',
    description: 'Forward Deployment Engineering. Takes AI from pilot to production. RAG, agentic AI, MCP, CI/CD.',
    href: '/dashboard/hybrid-business-manager/engineer',
    icon: Code2, accentGrad: 'from-blue-500/20 to-cyan-500/10', borderColor: 'border-blue-500/30',
    status: 'live', agent: 'HBEngineer_Ang', hawk: 'Lil_Deploy_Hawk',
    capabilities: ['AI Deployment', 'RAG', 'Production Systems', 'MCP'],
  },
  {
    id: 'architect', title: 'Architect', publicTitle: 'Architecture Review',
    description: 'Systems and solutions architecture. Cloud design, microservices, IaC, C4 diagrams.',
    href: '/dashboard/hybrid-business-manager/architect',
    icon: Layers, accentGrad: 'from-violet-500/20 to-purple-500/10', borderColor: 'border-violet-500/30',
    status: 'live', agent: 'Architect_Ang', hawk: 'Lil_Blueprint_Hawk',
    capabilities: ['System Design', 'Cloud Arch', 'IaC', 'Data Model'],
  },
  {
    id: 'ciso', title: 'CISO', publicTitle: 'Security Assessment',
    description: 'Security posture, compliance audits, risk management. SOC2, HIPAA, FedRAMP, NIST.',
    href: '/dashboard/hybrid-business-manager/ciso',
    icon: Lock, accentGrad: 'from-red-500/20 to-orange-500/10', borderColor: 'border-red-500/30',
    status: 'live', agent: 'Security_Ang', hawk: 'Lil_Audit_Hawk',
    capabilities: ['Compliance', 'Risk Mgmt', 'IR', 'Policy Gen'],
  },
  {
    id: 'cto', title: 'CTO', publicTitle: 'Technology Advisory',
    description: 'Technology strategy, digital transformation, build-vs-buy analysis, AI strategy.',
    href: '/dashboard/hybrid-business-manager/cto',
    icon: Compass, accentGrad: 'from-emerald-500/20 to-green-500/10', borderColor: 'border-emerald-500/30',
    status: 'live', agent: 'CTO_Ang', hawk: 'Lil_Assess_Hawk',
    capabilities: ['Tech Strategy', 'Roadmaps', 'AI Strategy', 'Hiring'],
  },
];

const PROOF_POINTS = [
  { label: 'Cycle Reduction', value: '70%', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { label: 'Gov Contracts', value: '$2.9M', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { label: 'Strategy Scale', value: '$50M+', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { label: 'FDE Growth', value: '800%+', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
];

/* ── Main Component ────────────────────────────────────────── */

export default function HybridBusinessManagerPage() {
  const { mode, isOwner } = usePlatformMode();
  const isPrivate = mode === 'PRIVATE';

  // Agent status state (would connect to real API)
  const [agentStates] = useState<AgentNode[]>([
    { id: 'acheevy', name: 'ACHEEVY', role: 'Orchestrator', tier: 'orchestrator', status: 'idle' },
    { id: 'chicken-hawk', name: 'Chicken Hawk', role: 'Coordinator', tier: 'coordinator', status: 'idle' },
    { id: 'hbengineer-ang', name: 'HBEngineer_Ang', role: 'H B Engineer', tier: 'boomer_ang', status: 'idle' },
    { id: 'architect-ang', name: 'Architect_Ang', role: 'Solutions Architect', tier: 'boomer_ang', status: 'idle' },
    { id: 'security-ang', name: 'Security_Ang', role: 'CISO', tier: 'boomer_ang', status: 'idle' },
    { id: 'cto-ang', name: 'CTO_Ang', role: 'CTO', tier: 'boomer_ang', status: 'idle' },
  ]);

  const handleDispatch = useCallback(async (agentId: string, task: string) => {
    try {
      await fetch('/api/acheevy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: task, vertical: 'hybrid-business-manager', agentTarget: agentId }),
      });
    } catch { /* dispatch attempted */ }
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">
      {/* ── 3D Hero ─────────────────────────────────────────── */}
      <Hero3D isPrivate={isPrivate} />

      {/* ── Proof Points Strip ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {PROOF_POINTS.map((stat) => (
          <div key={stat.label} className={`px-4 py-3 rounded-xl border ${stat.bg}`}>
            <p className={`text-xl font-display ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Role Cards + Agent Panel ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Cards (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
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
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {ROLE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.id} variants={staggerItem}>
                  <Link href={card.href}>
                    <div className={`group rounded-xl border ${card.borderColor} bg-[#1F1F23]/60 hover:bg-white/5 transition-all p-5 h-full flex flex-col gap-3 cursor-pointer`}>
                      <div className="flex items-start justify-between">
                        <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${card.accentGrad} border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="w-5 h-5 text-zinc-200" />
                        </div>
                        <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          LIVE
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-medium text-zinc-100 group-hover:text-blue-400 transition-colors">
                          {isPrivate ? card.title : card.publicTitle}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-2">{card.description}</p>
                      </div>

                      {isPrivate && (
                        <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-600">
                          <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />{card.agent}</span>
                          <span className="text-zinc-700">+</span>
                          <span>{card.hawk}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1 mt-auto">
                        {card.capabilities.map((cap) => (
                          <span key={cap} className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-zinc-600 border border-white/5">
                            {cap}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-wireframe-stroke">
                        <span className="text-[10px] text-zinc-600 group-hover:text-blue-400 transition-colors flex items-center gap-1">
                          {isPrivate ? 'Open Console' : 'Start Assessment'}
                          <ChevronRight className="w-3 h-3" />
                        </span>
                        <span className="text-[10px] font-mono text-zinc-700 flex items-center gap-1">
                          <Terminal className="w-3 h-3" /> ii-agent ready
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Agent Status Panel (1/3 width) */}
        {isPrivate && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-zinc-500">Agents</span>
              <div className="flex-1 h-px bg-wireframe-stroke" />
            </div>
            <AgentStatusPanel
              agents={agentStates}
              onDispatch={handleDispatch}
              accentColor="blue"
              verticalId="hybrid-business-manager"
            />
          </div>
        )}
      </div>

      {/* ── Quick Actions ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/chat">
          <div className="group rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all p-5 cursor-pointer flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-zinc-200">Chat with ACHEEVY</p>
                <p className="text-xs text-zinc-500">Describe your needs — ACHEEVY routes to the right role</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link href={isPrivate && isOwner ? '/dashboard/hybrid-business-manager/multus-maven' : '/dashboard/chat'}>
          <div className={`group rounded-xl border ${isPrivate && isOwner ? 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10' : 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'} transition-all p-5 cursor-pointer flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              {isPrivate && isOwner ? <Crown className="w-5 h-5 text-amber-400" /> : <Play className="w-5 h-5 text-emerald-400" />}
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  {isPrivate && isOwner ? 'Multus Maven Command Center' : 'Start AI Assessment'}
                </p>
                <p className="text-xs text-zinc-500">
                  {isPrivate && isOwner ? 'Full FDE practice — pipeline, engagements, playbook' : 'Run the AI Deployment Readiness Assessment'}
                </p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 ${isPrivate && isOwner ? 'text-amber-400' : 'text-emerald-400'} group-hover:translate-x-1 transition-transform`} />
          </div>
        </Link>
      </div>
    </div>
  );
}
