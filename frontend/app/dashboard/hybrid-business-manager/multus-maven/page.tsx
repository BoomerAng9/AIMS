'use client';

/**
 * Multus Maven — Owner-Only FDE Practice Command Center
 *
 * The convergence of all four HBM roles into one fractional practice.
 * "Multus" = many. "Maven" = expert.
 *
 * Displays:
 * - Practice identity and brand positioning
 * - Proof points and engagement models
 * - Target segments with pipeline tracking
 * - Brand pillars (content strategy)
 * - 90-day launch plan overview
 * - AI Deployment Readiness Assessment tool
 * - Agent hierarchy visualization
 *
 * PRIVATE mode only — redirects to HBM hub if accessed in PUBLIC mode.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, fadeUp } from '@/lib/motion';
import { usePlatformMode } from '@/lib/platform-mode';
import {
  Target, ArrowLeft, Briefcase, Zap, ChevronRight,
  TrendingUp, Users, DollarSign, Shield, Globe,
  BookOpen, Mic, Building2, Cpu, Crown,
  Code2, Layers, Lock, Compass, Clock,
} from 'lucide-react';

/* ── Data ──────────────────────────────────────────────────── */

const PROOF_POINTS = [
  { metric: '70%', label: 'AI Dev Cycle Reduction', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20' },
  { metric: '$2.9M', label: 'Gov Contracts Managed', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
  { metric: '$50M+', label: 'Strategy Scale', color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  { metric: '800%+', label: 'FDE Market Growth', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/20' },
];

const ENGAGEMENT_MODELS = [
  { name: 'Monthly Retainer', rate: '$10K-$15K/mo', hours: '15-20 hrs/month', icon: Clock },
  { name: 'Daily Embedded', rate: '$2K-$3K/day', hours: 'Full-day deployment', icon: Code2 },
  { name: 'Hourly Advisory', rate: '$200-$300/hr', hours: 'Strategic consultation', icon: Briefcase },
  { name: 'Expert Network', rate: '$300-$500/hr', hours: 'GLG/AlphaSights calls', icon: Mic },
];

const BRAND_PILLARS = [
  {
    id: 'ai-deployment',
    name: 'AI Deployment Engineering',
    icon: Code2,
    color: 'text-blue-400',
    border: 'border-blue-500/20',
    description: 'RAG architecture, agentic AI orchestration, LLM integration, MCP, production AI systems.',
  },
  {
    id: 'process-rigor',
    name: 'Process Rigor Meets AI',
    icon: Target,
    color: 'text-violet-400',
    border: 'border-violet-500/20',
    description: 'Applying DMAIC and Lean Six Sigma to AI deployment. The most differentiating angle.',
  },
  {
    id: 'strategic-consulting',
    name: 'Strategic Consulting',
    icon: TrendingUp,
    color: 'text-amber-400',
    border: 'border-amber-500/20',
    description: 'The Buc-ee\'s $50M+ expansion strategy. Data-driven decision-making at scale.',
  },
  {
    id: 'gov-regulated-ai',
    name: 'Government & Regulated AI',
    icon: Shield,
    color: 'text-red-400',
    border: 'border-red-500/20',
    description: 'FAR/DFARS compliance, $2.9M contracts, deploying AI in regulated environments.',
  },
  {
    id: 'global-operations',
    name: 'Global Operations',
    icon: Globe,
    color: 'text-emerald-400',
    border: 'border-emerald-500/20',
    description: 'Saudi Arabia launch, international operations, cross-cultural technology deployment.',
  },
];

const TARGET_TIERS = [
  {
    tier: 'Tier 1',
    name: 'AI Startups (Series B-D)',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    targets: [
      'Reducto — a16z backed, hiring Founding FDEs at $150K-$300K',
      'Distyl AI — $175M Series B (Khosla/Lightspeed)',
      'Harvey — $300M Series D, $3B valuation (legal AI)',
      'Sierra — Bret Taylor, $350M round, $10B+ valuation',
      'Glean — $316M Series E, $5.3B valuation',
    ],
  },
  {
    tier: 'Tier 2',
    name: 'Enterprise / Fortune 500',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    targets: [
      'Dollar General — SVP AI Optimization (Travis Nixon)',
      'Kroger — Google Cloud/Gemini partnership (Yael Cosset)',
      'UPS — $9B Network of the Future (Atlanta HQ)',
      'Delta Air Lines — Delta Concierge AI (Atlanta HQ)',
      'Carnival — 100 AI pilots, only 6 in production',
    ],
  },
  {
    tier: 'Tier 3',
    name: 'Government / Public Sector',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    targets: [
      'DoD CDAO — $13.4B FY2026 AI budget',
      'DHS — $56B contractor market FY2026',
      'Georgia Technology Authority — Office of AI',
      'VA — Ambient AI scribe program nationwide',
      'Georgia SB37 — AI usage plans required by Dec 2026',
    ],
  },
  {
    tier: 'Tier 4',
    name: 'Fractional Platforms',
    color: 'text-violet-400',
    border: 'border-violet-500/30',
    targets: [
      'A.Team — Elite AI engineers for Fortune 500s',
      'Catalant — Fortune 1000 consulting marketplace',
      'Toptal — Top 3%, $200-$300/hr CTOs',
      'GLG / AlphaSights — Expert network calls',
    ],
  },
];

const LAUNCH_PLAN = [
  { week: 'Week 1-2', action: 'LinkedIn optimization, positioning doc, A.Team + Catalant registration', status: 'foundation' },
  { week: 'Week 2-4', action: 'Daily LinkedIn posts (Pillar 2), X Reply Guy strategy, SAM.gov update', status: 'content' },
  { week: 'Week 3-4', action: 'AI Deployment Readiness Assessment tool, sanitized Buc-ee\'s case study', status: 'magnets' },
  { week: 'Week 4-6', action: 'LinkedIn DMs (20/week) to startups, pitch 3 podcasts', status: 'outbound' },
  { week: 'Week 6-8', action: 'Booz Allen + Leidos subcontractor registration, Georgia APEX Accelerator', status: 'gov' },
  { week: 'Week 8-10', action: 'Enterprise cold emails (10/week): Dollar General, Kroger, Carnival, UPS, Delta', status: 'enterprise' },
  { week: 'Week 10-12', action: '"Companies Hiring FDEs" directory, YouTube content, platform review', status: 'inbound' },
];

const STATUS_COLORS: Record<string, string> = {
  foundation: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  content: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  magnets: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  outbound: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  gov: 'bg-red-500/10 text-red-400 border-red-500/20',
  enterprise: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  inbound: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const HBM_ROLES = [
  { name: 'H B Engineer', icon: Code2, color: 'text-blue-400', agent: 'HBEngineer_Ang', hawk: 'Lil_Deploy_Hawk' },
  { name: 'Architect', icon: Layers, color: 'text-violet-400', agent: 'Architect_Ang', hawk: 'Lil_Blueprint_Hawk' },
  { name: 'CISO', icon: Lock, color: 'text-red-400', agent: 'Security_Ang', hawk: 'Lil_Audit_Hawk' },
  { name: 'CTO', icon: Compass, color: 'text-emerald-400', agent: 'CTO_Ang', hawk: 'Lil_Assess_Hawk' },
];

/* ── Component ─────────────────────────────────────────────── */

export default function MultusMavenPage() {
  const { mode, isOwner } = usePlatformMode();
  const router = useRouter();

  useEffect(() => {
    if (mode === 'PUBLIC' || !isOwner) {
      router.replace('/dashboard/hybrid-business-manager');
    }
  }, [mode, isOwner, router]);

  if (mode === 'PUBLIC' || !isOwner) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* ── Breadcrumb ────────────────────────────────────────── */}
      <Link
        href="/dashboard/hybrid-business-manager"
        className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Hybrid Business Manager</span>
      </Link>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-blue-500/10 border border-amber-500/30 flex items-center justify-center">
            <Crown className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-display text-amber-400">Multus Maven</h1>
            <p className="text-sm text-zinc-400 font-mono">
              Fractional AI Forward Deployment Engineer
            </p>
            <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest mt-1">
              From Pilot to Production — AI That Actually Ships
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">Owner Command Center</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181B] border border-wireframe-stroke">
            <Cpu className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500 font-medium">4 Boomer_Angs + 4 Lil_Hawks</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-blue-400 font-medium">DMAIC + Lean Six Sigma</span>
          </div>
        </div>
      </motion.div>

      {/* ── Proof Points ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {PROOF_POINTS.map((pp) => (
          <div key={pp.label} className={`px-4 py-3 rounded-xl border ${pp.bgColor}`}>
            <p className={`text-2xl font-display ${pp.color}`}>{pp.metric}</p>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{pp.label}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Engagement Models ─────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-zinc-500">Engagement Models</span>
          <div className="flex-1 h-px bg-wireframe-stroke" />
          <span className="text-xs font-mono text-emerald-400">Target: $40K-$60K/mo</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* ── HBM Role Matrix ───────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-zinc-500">Role Matrix</span>
          <div className="flex-1 h-px bg-wireframe-stroke" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* ── Brand Pillars (Content Strategy) ──────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-zinc-500">Brand Pillars</span>
          <div className="flex-1 h-px bg-wireframe-stroke" />
          <span className="text-xs font-mono text-zinc-600">Content Strategy</span>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {BRAND_PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.id}
                variants={staggerItem}
                className={`flex items-start gap-4 px-4 py-3 rounded-lg bg-[#111113] border ${pillar.border}`}
              >
                <div className="flex items-center gap-3 flex-shrink-0 w-40">
                  <span className="text-xs font-bold text-zinc-600 w-4">{i + 1}</span>
                  <Icon className={`w-4 h-4 ${pillar.color}`} />
                  <span className={`text-xs font-mono font-bold ${pillar.color}`}>{pillar.name}</span>
                </div>
                <p className="text-xs text-zinc-500">{pillar.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Target Pipeline ───────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-zinc-500">Target Pipeline</span>
          <div className="flex-1 h-px bg-wireframe-stroke" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {TARGET_TIERS.map((tier) => (
            <div key={tier.tier} className={`rounded-xl border ${tier.border} bg-[#1F1F23]/40 overflow-hidden`}>
              <div className="px-4 py-3 border-b border-wireframe-stroke flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold ${tier.color}`}>{tier.tier}</span>
                  <span className="text-xs font-mono text-zinc-400">{tier.name}</span>
                </div>
                <span className="text-xs font-mono text-zinc-600">{tier.targets.length} targets</span>
              </div>
              <div className="divide-y divide-wireframe-stroke">
                {tier.targets.map((target) => (
                  <div key={target} className="px-4 py-2.5 text-xs text-zinc-400 hover:bg-[#111113] transition-colors">
                    {target}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 90-Day Launch Plan ─────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-zinc-500">90-Day Launch Plan</span>
          <div className="flex-1 h-px bg-wireframe-stroke" />
        </div>

        <div className="space-y-2">
          {LAUNCH_PLAN.map((item) => (
            <div key={item.week} className="flex items-start gap-4 px-4 py-3 rounded-lg bg-[#111113] border border-wireframe-stroke">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex-shrink-0 ${STATUS_COLORS[item.status]}`}>
                {item.week}
              </span>
              <p className="text-xs text-zinc-400">{item.action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Action CTAs ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/chat">
          <div className="group rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all p-5 cursor-pointer flex items-center justify-between h-full">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-zinc-200">Start Client Engagement</p>
                <p className="text-xs text-zinc-500">Activate the Multus Maven playbook via ACHEEVY</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link href="/dashboard/hybrid-business-manager">
          <div className="group rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all p-5 cursor-pointer flex items-center justify-between h-full">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-zinc-200">View Role Consoles</p>
                <p className="text-xs text-zinc-500">Access individual HBM role dashboards</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
