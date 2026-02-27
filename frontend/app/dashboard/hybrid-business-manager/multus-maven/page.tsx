'use client';

/**
 * Multus Maven — Owner-Only FDE Practice Command Center (v2)
 *
 * Features:
 * - 3D interactive hero with mouse-tracking perspective
 * - Tabbed command center: Overview, Client Engagement, Research, Pipeline
 * - IntakeForm for new client engagement creation
 * - WorkflowRunner for 90-day launch plan execution
 * - ExecutionStream for ii-agent research/content generation
 * - AgentStatusPanel with all 8 HBM agents
 * - Proof points, engagement models, brand pillars, target pipeline
 *
 * PRIVATE + OWNER only — redirects to HBM hub if not authorized.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { heroStagger, heroItem, staggerContainer, staggerItem } from '@/lib/motion';
import { spring } from '@/lib/motion/tokens';
import { usePlatformMode } from '@/lib/platform-mode';
import {
  IntakeForm, type FormSection,
  WorkflowRunner, type WorkflowStep, type WorkflowStatus,
  AgentStatusPanel, type AgentNode,
  ExecutionStream,
} from '@/components/hbm';
import {
  Target, ArrowLeft, Briefcase, Zap, ChevronRight,
  TrendingUp, Users, DollarSign, Shield, Globe,
  BookOpen, Mic, Building2, Cpu, Crown,
  Code2, Layers, Lock, Compass, Clock,
  Activity, GitBranch, Terminal, FileText,
  BarChart3, Rocket, Search, PenTool,
} from 'lucide-react';

/* ── 3D Perspective Hero ─────────────────────────────────────── */

function MavenHero() {
  const prefersReduced = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springCfg = { stiffness: spring.gentle.stiffness, damping: spring.gentle.damping };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), springCfg);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), springCfg);

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

  const ROLE_NODES = [
    { icon: Code2, label: 'Engineer', color: 'from-blue-500/30 to-blue-600/10', x: 15, y: 20, delay: 0.4 },
    { icon: Layers, label: 'Architect', color: 'from-violet-500/30 to-violet-600/10', x: 85, y: 20, delay: 0.5 },
    { icon: Lock, label: 'CISO', color: 'from-red-500/30 to-red-600/10', x: 15, y: 80, delay: 0.6 },
    { icon: Compass, label: 'CTO', color: 'from-emerald-500/30 to-emerald-600/10', x: 85, y: 80, delay: 0.7 },
  ];

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative rounded-2xl border border-amber-500/20 bg-gradient-to-br from-[#111113] to-[#0A0A0B] overflow-hidden"
      style={prefersReduced ? {} : { perspective: 1200, rotateX, rotateY, transformStyle: 'preserve-3d' as const }}
    >
      {/* Ambient grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Golden glow */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-amber-500/5 blur-3xl" />

      <div className="relative z-10 p-6 md:p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
          <motion.div variants={heroStagger} initial="hidden" animate="visible" className="flex-1 space-y-4">
            <motion.div variants={heroItem} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30 flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500/60">
                Owner Command Center
              </span>
            </motion.div>

            <motion.h1 variants={heroItem} className="text-3xl md:text-4xl font-display text-zinc-100 leading-tight">
              Multus<br /><span className="text-amber-400">Maven</span>
            </motion.h1>

            <motion.p variants={heroItem} className="text-sm text-zinc-500 max-w-md leading-relaxed">
              Fractional AI Forward Deployment Engineer. The convergence of all four HBM roles
              into one practice — powered by ACHEEVY, 4 Boomer_Angs, and 4 Lil_Hawks.
            </motion.p>

            <motion.div variants={heroItem} className="text-xs text-zinc-600 font-mono uppercase tracking-widest">
              From Pilot to Production — AI That Actually Ships
            </motion.div>

            <motion.div variants={heroItem} className="flex items-center gap-3 flex-wrap pt-1">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">Owner Only</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181B] border border-wireframe-stroke">
                <Cpu className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500 font-medium font-mono">4 Boomer_Angs + 4 Lil_Hawks</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-blue-400 font-medium">DMAIC + Lean Six Sigma</span>
              </div>
            </motion.div>
          </motion.div>

          {/* 3D Floating Role Nodes */}
          <div className="relative w-full lg:w-72 h-48 lg:h-56 flex-shrink-0" style={{ transformStyle: 'preserve-3d' }}>
            <svg className="absolute inset-0 w-full h-full" style={{ transform: 'translateZ(-10px)' }}>
              {ROLE_NODES.map((node) => (
                <line key={node.label} x1="50%" y1="50%" x2={`${node.x}%`} y2={`${node.y}%`} stroke="rgba(245,158,11,0.12)" strokeWidth="1" />
              ))}
            </svg>

            {/* Center Maven node */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/25 to-amber-600/5 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-900/10">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-[10px] font-mono text-amber-400/70 text-center mt-1">Maven</p>
            </motion.div>

            {ROLE_NODES.map((node) => {
              const Icon = node.icon;
              return (
                <motion.div
                  key={node.label}
                  initial={{ opacity: 0, scale: 0, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: node.delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute"
                  style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <motion.div
                    animate={{ y: [-3, 3, -3] }}
                    transition={{ duration: 3 + node.delay, repeat: Infinity, ease: 'easeInOut' }}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${node.color} border border-white/10 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-black/20`}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <Icon className="w-4 h-4 md:w-5 md:h-5 text-zinc-200" />
                  </motion.div>
                  <p className="text-[9px] font-mono text-zinc-500 text-center mt-1 whitespace-nowrap">{node.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Data Constants ──────────────────────────────────────────── */

const PROOF_POINTS = [
  { metric: '70%', label: 'AI Dev Cycle Reduction', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { metric: '$2.9M', label: 'Gov Contracts Managed', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { metric: '$50M+', label: 'Strategy Scale', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { metric: '800%+', label: 'FDE Market Growth', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
];

const ENGAGEMENT_MODELS = [
  { name: 'Monthly Retainer', rate: '$10K-$15K/mo', hours: '15-20 hrs/month', icon: Clock },
  { name: 'Daily Embedded', rate: '$2K-$3K/day', hours: 'Full-day deployment', icon: Code2 },
  { name: 'Hourly Advisory', rate: '$200-$300/hr', hours: 'Strategic consultation', icon: Briefcase },
  { name: 'Expert Network', rate: '$300-$500/hr', hours: 'GLG/AlphaSights calls', icon: Mic },
];

const BRAND_PILLARS = [
  { id: 'ai-deployment', name: 'AI Deployment Engineering', icon: Code2, color: 'text-blue-400', border: 'border-blue-500/20', description: 'RAG architecture, agentic AI orchestration, LLM integration, MCP, production AI systems.' },
  { id: 'process-rigor', name: 'Process Rigor Meets AI', icon: Target, color: 'text-violet-400', border: 'border-violet-500/20', description: 'Applying DMAIC and Lean Six Sigma to AI deployment. The most differentiating angle.' },
  { id: 'strategic-consulting', name: 'Strategic Consulting', icon: TrendingUp, color: 'text-amber-400', border: 'border-amber-500/20', description: "The Buc-ee's $50M+ expansion strategy. Data-driven decision-making at scale." },
  { id: 'gov-regulated-ai', name: 'Government & Regulated AI', icon: Shield, color: 'text-red-400', border: 'border-red-500/20', description: 'FAR/DFARS compliance, $2.9M contracts, deploying AI in regulated environments.' },
  { id: 'global-operations', name: 'Global Operations', icon: Globe, color: 'text-emerald-400', border: 'border-emerald-500/20', description: 'Saudi Arabia launch, international operations, cross-cultural technology deployment.' },
];

const HBM_ROLES = [
  { name: 'H B Engineer', icon: Code2, color: 'text-blue-400', agent: 'HBEngineer_Ang', hawk: 'Lil_Deploy_Hawk' },
  { name: 'Architect', icon: Layers, color: 'text-violet-400', agent: 'Architect_Ang', hawk: 'Lil_Blueprint_Hawk' },
  { name: 'CISO', icon: Lock, color: 'text-red-400', agent: 'Security_Ang', hawk: 'Lil_Audit_Hawk' },
  { name: 'CTO', icon: Compass, color: 'text-emerald-400', agent: 'CTO_Ang', hawk: 'Lil_Assess_Hawk' },
];

const TARGET_TIERS = [
  { tier: 'Tier 1', name: 'AI Startups (Series B-D)', color: 'text-blue-400', border: 'border-blue-500/30', count: 5, examples: 'Reducto, Distyl AI, Harvey, Sierra, Glean' },
  { tier: 'Tier 2', name: 'Enterprise / Fortune 500', color: 'text-emerald-400', border: 'border-emerald-500/30', count: 5, examples: 'Dollar General, Kroger, UPS, Delta, Carnival' },
  { tier: 'Tier 3', name: 'Government / Public Sector', color: 'text-amber-400', border: 'border-amber-500/30', count: 5, examples: 'DoD CDAO, DHS, GA Tech Authority, VA, SB37' },
  { tier: 'Tier 4', name: 'Fractional Platforms', color: 'text-violet-400', border: 'border-violet-500/30', count: 4, examples: 'A.Team, Catalant, Toptal, GLG/AlphaSights' },
];

/* ── Client Engagement Intake Form ───────────────────────────── */

const ENGAGEMENT_SECTIONS: FormSection[] = [
  {
    id: 'client-profile',
    title: 'Client Profile',
    description: 'Who is the prospective client?',
    fields: [
      { id: 'company_name', label: 'Company name', type: 'text', required: true, placeholder: 'e.g., Reducto, Dollar General, DoD CDAO...' },
      { id: 'client_tier', label: 'Target tier', type: 'radio', required: true, options: ['Tier 1 — AI Startup (Series B-D)', 'Tier 2 — Enterprise / Fortune 500', 'Tier 3 — Government / Public Sector', 'Tier 4 — Fractional Platform'] },
      { id: 'contact_info', label: 'Key contact / decision maker', type: 'text', placeholder: 'Name, title, LinkedIn...' },
      { id: 'source_channel', label: 'Lead source', type: 'select', required: true, options: ['LinkedIn outreach', 'Expert network (GLG/AlphaSights)', 'Platform (A.Team/Catalant/Toptal)', 'Referral', 'Inbound (website/content)', 'Government RFP/SAM.gov', 'Conference/event', 'Other'] },
    ],
  },
  {
    id: 'engagement-scope',
    title: 'Engagement Scope',
    description: 'What roles and capabilities does this client need?',
    fields: [
      { id: 'roles_needed', label: 'HBM roles needed (select all)', type: 'multiselect', required: true, options: ['H B Engineer — AI deployment', 'Architect — systems design', 'CISO — security & compliance', 'CTO — technology strategy'] },
      { id: 'engagement_type', label: 'Engagement model', type: 'radio', required: true, options: ['Monthly Retainer ($10K-$15K/mo)', 'Daily Embedded ($2K-$3K/day)', 'Hourly Advisory ($200-$300/hr)', 'Expert Network ($300-$500/hr)', 'Custom / TBD'] },
      { id: 'client_challenge', label: 'Primary challenge or need', type: 'textarea', required: true, placeholder: 'What problem are they trying to solve? What brought them to look for fractional help?' },
    ],
  },
  {
    id: 'qualification',
    title: 'Qualification & Timeline',
    description: 'Assess readiness and urgency.',
    fields: [
      { id: 'budget_indicator', label: 'Budget signal', type: 'radio', options: ['Strong — budget allocated', 'Moderate — exploring options', 'Weak — no budget yet', 'Unknown'] },
      { id: 'urgency', label: 'Timeline urgency', type: 'radio', required: true, options: ['Immediate — starting this month', 'Near-term — within 30 days', 'Planning — 60-90 days', 'Exploratory — no timeline'] },
      { id: 'competition', label: 'Competitive landscape', type: 'textarea', placeholder: 'Who else are they considering? In-house vs. fractional?' },
      { id: 'next_step', label: 'Proposed next step', type: 'select', required: true, options: ['Discovery call', 'AI Readiness Assessment', 'Technical deep-dive', 'Proposal / SOW', 'Platform demo', 'Expert network call'] },
    ],
  },
];

/* ── 90-Day Launch Pipeline Steps ────────────────────────────── */

const LAUNCH_STEPS: WorkflowStep[] = [
  { id: 'foundation', name: 'Foundation (Week 1-2)', description: 'LinkedIn optimization, positioning doc, A.Team + Catalant registration.', status: 'pending', agentAssigned: 'CTO_Ang' },
  { id: 'content-launch', name: 'Content Launch (Week 2-4)', description: 'Daily LinkedIn posts (Pillar 2), X Reply Guy strategy, SAM.gov update.', status: 'pending', agentAssigned: 'Lil_Assess_Hawk' },
  { id: 'lead-magnets', name: 'Lead Magnets (Week 3-4)', description: "AI Deployment Readiness Assessment tool, sanitized Buc-ee's case study.", status: 'pending', agentAssigned: 'HBEngineer_Ang' },
  { id: 'outbound', name: 'Outbound (Week 4-6)', description: 'LinkedIn DMs (20/week) to startups, pitch 3 podcasts.', status: 'pending', agentAssigned: 'Lil_Deploy_Hawk' },
  { id: 'gov-track', name: 'Government Track (Week 6-8)', description: 'Booz Allen + Leidos subcontractor registration, Georgia APEX Accelerator.', status: 'pending', agentAssigned: 'Security_Ang' },
  { id: 'enterprise-outreach', name: 'Enterprise Outreach (Week 8-10)', description: 'Enterprise cold emails (10/week): Dollar General, Kroger, Carnival, UPS, Delta.', status: 'pending', agentAssigned: 'Architect_Ang' },
  { id: 'inbound-engine', name: 'Inbound Engine (Week 10-12)', description: '"Companies Hiring FDEs" directory, YouTube content, platform review.', status: 'pending', agentAssigned: 'Lil_Blueprint_Hawk' },
];

/* ── Component ───────────────────────────────────────────────── */

export default function MultusMavenPage() {
  const { mode, isOwner } = usePlatformMode();
  const router = useRouter();

  useEffect(() => {
    if (mode === 'PUBLIC' || !isOwner) {
      router.replace('/dashboard/hybrid-business-manager');
    }
  }, [mode, isOwner, router]);

  const [activeTab, setActiveTab] = useState<'overview' | 'engagement' | 'pipeline' | 'research'>('overview');
  const [launchSteps, setLaunchSteps] = useState<WorkflowStep[]>(LAUNCH_STEPS);
  const [launchStatus, setLaunchStatus] = useState<WorkflowStatus>('idle');
  const [engagementData, setEngagementData] = useState<Record<string, any> | null>(null);

  const agents: AgentNode[] = [
    { id: 'acheevy', name: 'ACHEEVY', role: 'Orchestrator', tier: 'orchestrator', status: 'idle' },
    { id: 'chicken-hawk', name: 'Chicken Hawk', role: 'Coordinator', tier: 'coordinator', status: 'idle' },
    { id: 'hbengineer-ang', name: 'HBEngineer_Ang', role: 'H B Engineer', tier: 'boomer_ang', status: 'idle' },
    { id: 'architect-ang', name: 'Architect_Ang', role: 'Solutions Architect', tier: 'boomer_ang', status: 'idle' },
    { id: 'security-ang', name: 'Security_Ang', role: 'CISO Lead', tier: 'boomer_ang', status: 'idle' },
    { id: 'cto-ang', name: 'CTO_Ang', role: 'Tech Strategist', tier: 'boomer_ang', status: 'idle' },
    { id: 'lil-deploy-hawk', name: 'Lil_Deploy_Hawk', role: 'Deploy Specialist', tier: 'lil_hawk', status: 'idle' },
    { id: 'lil-blueprint-hawk', name: 'Lil_Blueprint_Hawk', role: 'Documentation', tier: 'lil_hawk', status: 'idle' },
    { id: 'lil-audit-hawk', name: 'Lil_Audit_Hawk', role: 'Audit Specialist', tier: 'lil_hawk', status: 'idle' },
    { id: 'lil-assess-hawk', name: 'Lil_Assess_Hawk', role: 'Assessment Specialist', tier: 'lil_hawk', status: 'idle' },
  ];

  const handleEngagementSubmit = useCallback(async (data: Record<string, any>) => {
    setEngagementData(data);
    try {
      await fetch('/api/acheevy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `New client engagement created: ${JSON.stringify(data)}`, vertical: 'hbm-multus-maven', context: data }),
      });
    } catch { /* best effort */ }
    setActiveTab('pipeline');
  }, []);

  const handleRunLaunch = useCallback(async () => {
    setLaunchStatus('running');
    for (let i = 0; i < launchSteps.length; i++) {
      setLaunchSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' as const } : s));
      await new Promise(r => setTimeout(r, 2000));
      setLaunchSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'completed' as const, duration: 2000 + Math.random() * 4000 } : s));
    }
    setLaunchStatus('completed');
  }, [launchSteps.length]);

  const handleDispatch = useCallback(async (agentId: string, task: string) => {
    await fetch('/api/acheevy/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: task, vertical: 'hbm-multus-maven', agentTarget: agentId }),
    });
  }, []);

  if (mode === 'PUBLIC' || !isOwner) return null;

  const TABS = [
    { id: 'overview' as const, label: 'Command Center', icon: Crown },
    { id: 'engagement' as const, label: 'New Engagement', icon: FileText },
    { id: 'pipeline' as const, label: '90-Day Pipeline', icon: GitBranch },
    { id: 'research' as const, label: 'ii-agent Research', icon: Terminal },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/dashboard/hybrid-business-manager"
        className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Hybrid Business Manager</span>
      </Link>

      {/* 3D Hero */}
      <MavenHero />

      {/* Proof Points Strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {PROOF_POINTS.map((pp) => (
          <div key={pp.label} className={`px-4 py-3 rounded-xl border ${pp.bg}`}>
            <p className={`text-2xl font-display ${pp.color}`}>{pp.metric}</p>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{pp.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0A0A0B] border border-wireframe-stroke">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-mono transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content + Agent Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (2/3) */}
        <div className="lg:col-span-2">
          {activeTab === 'overview' && <OverviewTab />}

          {activeTab === 'engagement' && (
            <IntakeForm
              title="New Client Engagement"
              sections={ENGAGEMENT_SECTIONS}
              onSubmit={handleEngagementSubmit}
              accentColor="amber"
              submitLabel="Create Engagement & Launch Pipeline"
            />
          )}

          {activeTab === 'pipeline' && (
            <WorkflowRunner
              title="90-Day Launch Pipeline"
              steps={launchSteps}
              status={launchStatus}
              onRun={handleRunLaunch}
              accentColor="amber"
            />
          )}

          {activeTab === 'research' && (
            <ExecutionStream
              title="ii-agent Market Research"
              endpoint="/api/admin/ii-agent"
              payload={{
                type: 'research',
                prompt: engagementData
                  ? `Research prospect and prepare engagement strategy: ${JSON.stringify(engagementData)}`
                  : 'Research current FDE market landscape: companies hiring, compensation benchmarks, engagement models, and AI deployment trends',
                streaming: true,
              }}
              accentColor="amber"
            />
          )}
        </div>

        {/* Agent Panel (1/3) */}
        <div className="space-y-4">
          <AgentStatusPanel
            agents={agents}
            onDispatch={handleDispatch}
            accentColor="amber"
            verticalId="hbm-multus-maven"
          />
        </div>
      </div>
    </div>
  );
}

/* ── Overview Tab ─────────────────────────────────────────────── */

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Engagement Models */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-zinc-500">Engagement Models</span>
          <div className="flex-1 h-px bg-wireframe-stroke" />
          <span className="text-xs font-mono text-emerald-400">Target: $40K-$60K/mo</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ENGAGEMENT_MODELS.map((model) => {
            const Icon = model.icon;
            return (
              <div key={model.name} className="px-4 py-4 rounded-xl bg-[#111113] border border-wireframe-stroke space-y-2">
                <Icon className="w-5 h-5 text-amber-400" />
                <p className="text-sm font-medium text-zinc-200">{model.name}</p>
                <p className="text-lg font-display text-amber-400">{model.rate}</p>
                <p className="text-xs text-zinc-500">{model.hours}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role Matrix */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-zinc-500">Role Matrix</span>
          <div className="flex-1 h-px bg-wireframe-stroke" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HBM_ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <div key={role.name} className="rounded-xl bg-[#111113] border border-wireframe-stroke p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${role.color}`} />
                  <span className="text-sm font-medium text-zinc-200">{role.name}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="text-xs font-mono text-zinc-400">{role.agent}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span className="text-xs font-mono text-zinc-500">{role.hawk}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Brand Pillars */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-zinc-500">Brand Pillars</span>
          <div className="flex-1 h-px bg-wireframe-stroke" />
          <span className="text-xs font-mono text-zinc-600">Content Strategy</span>
        </div>
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-2">
          {BRAND_PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.id}
                variants={staggerItem}
                className={`flex items-start gap-4 px-4 py-3 rounded-lg bg-[#111113] border ${pillar.border}`}
              >
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs font-bold text-zinc-600 w-4">{i + 1}</span>
                  <Icon className={`w-4 h-4 ${pillar.color}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-mono font-bold ${pillar.color}`}>{pillar.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{pillar.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Target Pipeline Summary */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-zinc-500">Target Pipeline</span>
          <div className="flex-1 h-px bg-wireframe-stroke" />
          <span className="text-xs font-mono text-zinc-600">{TARGET_TIERS.reduce((a, t) => a + t.count, 0)} targets</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TARGET_TIERS.map((tier) => (
            <div key={tier.tier} className={`rounded-xl border ${tier.border} bg-[#1F1F23]/40 p-4 space-y-2`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-bold ${tier.color}`}>{tier.tier}</span>
                <span className="text-[10px] font-mono text-zinc-600">{tier.count} targets</span>
              </div>
              <p className="text-sm text-zinc-300">{tier.name}</p>
              <p className="text-[10px] text-zinc-600 leading-relaxed">{tier.examples}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
