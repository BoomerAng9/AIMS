'use client';

/**
 * CTO — Technology Advisory Console (v2)
 *
 * Features:
 * - Technology strategy intake form
 * - Roadmap generation workflow
 * - ii-agent execution for analysis
 * - Agent status panel
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { heroStagger, heroItem } from '@/lib/motion';
import { spring } from '@/lib/motion/tokens';
import { usePlatformMode } from '@/lib/platform-mode';
import {
  IntakeForm, type FormSection,
  WorkflowRunner, type WorkflowStep, type WorkflowStatus,
  AgentStatusPanel, type AgentNode,
  ExecutionStream,
} from '@/components/hbm';
import {
  Compass, ArrowLeft, Cpu, Activity,
  GitBranch, Terminal, FileText, TrendingUp,
  Users, DollarSign, Target, Lightbulb,
} from 'lucide-react';

const INTAKE_SECTIONS: FormSection[] = [
  {
    id: 'business-vision',
    title: 'Business Vision & Technology Role',
    description: 'Where is the business headed and how does technology fit?',
    fields: [
      { id: 'business_goals', label: 'Business goals (next 12-18 months)', type: 'textarea', required: true, placeholder: 'e.g., Launch new product line, expand to 3 new markets, achieve $10M ARR...' },
      { id: 'tech_role', label: 'Role of technology in the business', type: 'radio', required: true, options: ['Cost center — keep the lights on', 'Enabler — supports business operations', 'Differentiator — creates competitive advantage', 'THE product — technology IS the business'] },
      { id: 'timeline', label: 'Transformation timeline', type: 'radio', required: true, options: ['Urgent — need results in 3 months', 'Near-term — 6 month horizon', 'Strategic — 12-18 month plan', 'Long-term — 2+ year vision'] },
    ],
  },
  {
    id: 'current-state',
    title: 'Current Technology & Team',
    description: 'What do you have today?',
    fields: [
      { id: 'current_stack', label: 'Current tech stack summary', type: 'textarea', required: true, placeholder: 'Languages, frameworks, databases, cloud, deployment...' },
      { id: 'team_size', label: 'Engineering team size', type: 'radio', required: true, options: ['No engineers — founder does it all', '1-5 engineers', '5-15 engineers', '15-50 engineers', '50+ engineers'] },
      { id: 'bottleneck', label: 'Biggest technical bottleneck', type: 'select', required: true, options: ['No clear technical leadership', 'Legacy system constraints', 'Hiring / team skill gaps', 'Architecture / scalability issues', 'Security / compliance blockers', 'AI / data infrastructure gaps', 'Vendor lock-in', 'Budget limitations'] },
    ],
  },
  {
    id: 'strategy-focus',
    title: 'Strategic Focus Areas',
    description: 'Which decisions need to be made?',
    fields: [
      { id: 'strategic_decisions', label: 'Key decisions needed (select all)', type: 'multiselect', required: true, options: ['Build vs. Buy analysis', 'AI / ML strategy', 'Cloud migration or optimization', 'Platform re-architecture', 'Engineering team scaling', 'Security / compliance program', 'Data strategy', 'Vendor evaluation'] },
      { id: 'ai_interest', label: 'AI strategy importance', type: 'radio', options: ['Critical — AI is central to our strategy', 'Important — exploring AI opportunities', 'Curious — want to understand potential', 'Not a priority right now'] },
      { id: 'budget_range', label: 'Annual technology budget', type: 'radio', options: ['< $250K', '$250K - $1M', '$1M - $5M', '$5M - $20M', '$20M+', 'Undetermined'] },
    ],
  },
];

const INITIAL_STEPS: WorkflowStep[] = [
  { id: 'landscape', name: 'Technology Landscape Analysis', description: 'Research competitive technology positioning and market trends.', status: 'pending', agentAssigned: 'CTO_Ang' },
  { id: 'gap-analysis', name: 'Stack Gap Analysis', description: 'Analyze current stack against business goals, identify gaps.', status: 'pending', agentAssigned: 'CTO_Ang' },
  { id: 'build-buy', name: 'Build vs. Buy Matrix', description: 'Generate decision matrix for key platform capabilities.', status: 'pending', agentAssigned: 'CTO_Ang' },
  { id: 'ai-opportunities', name: 'AI Integration Analysis', description: 'Research AI opportunities with ROI projections.', status: 'pending', agentAssigned: 'Lil_Assess_Hawk' },
  { id: 'roadmap', name: 'Technology Roadmap', description: '12-month roadmap with quarterly milestones.', status: 'pending', agentAssigned: 'CTO_Ang' },
  { id: 'hiring-plan', name: 'Engineering Hiring Plan', description: 'Roles, seniority mix, timeline aligned to roadmap.', status: 'pending', agentAssigned: 'Lil_Assess_Hawk' },
  { id: 'budget', name: 'Budget Allocation Framework', description: 'Allocation across infrastructure, tooling, and headcount.', status: 'pending', agentAssigned: 'CTO_Ang' },
  { id: 'exec-summary', name: 'Executive Summary', description: 'Board-ready presentation with key recommendations.', status: 'pending', agentAssigned: 'CTO_Ang' },
];

export default function CTOPage() {
  const { mode } = usePlatformMode();
  const isPrivate = mode === 'PRIVATE';
  const [activeTab, setActiveTab] = useState<'intake' | 'workflow' | 'execution'>('intake');
  const [steps, setSteps] = useState<WorkflowStep[]>(INITIAL_STEPS);
  const [wfStatus, setWfStatus] = useState<WorkflowStatus>('idle');
  const [intakeData, setIntakeData] = useState<Record<string, any> | null>(null);

  const agents: AgentNode[] = [
    { id: 'acheevy', name: 'ACHEEVY', role: 'Orchestrator', tier: 'orchestrator', status: 'idle' },
    { id: 'chicken-hawk', name: 'Chicken Hawk', role: 'Coordinator', tier: 'coordinator', status: 'idle' },
    { id: 'cto-ang', name: 'CTO_Ang', role: 'Tech Strategist', tier: 'boomer_ang', status: 'idle' },
    { id: 'lil-assess-hawk', name: 'Lil_Assess_Hawk', role: 'Assessment Specialist', tier: 'lil_hawk', status: 'idle' },
  ];

  const handleSubmit = useCallback(async (data: Record<string, any>) => {
    setIntakeData(data);
    try { await fetch('/api/acheevy/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `CTO advisory intake: ${JSON.stringify(data)}`, vertical: 'hbm-cto', context: data }) }); } catch {}
    setActiveTab('workflow');
  }, []);

  const handleRun = useCallback(async () => {
    setWfStatus('running');
    for (let i = 0; i < steps.length; i++) {
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' as const } : s));
      await new Promise(r => setTimeout(r, 2000));
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'completed' as const, duration: 2500 + Math.random() * 5000 } : s));
    }
    setWfStatus('completed');
  }, [steps.length]);

  const TABS = [
    { id: 'intake' as const, label: 'Strategy Intake', icon: FileText },
    { id: 'workflow' as const, label: 'Roadmap Pipeline', icon: GitBranch },
    { id: 'execution' as const, label: 'ii-agent Analysis', icon: Terminal },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <Link href="/dashboard/hybrid-business-manager" className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /><span>{isPrivate ? 'Hybrid Business Manager' : 'Professional Services'}</span>
      </Link>

      <motion.div variants={heroStagger} initial="hidden" animate="visible" className="space-y-3">
        <motion.div variants={heroItem} className="flex items-center gap-4">
          <motion.div
            className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30 flex items-center justify-center"
            whileHover={{ scale: 1.05, rotateY: 10 }}
            transition={{ type: 'spring', stiffness: spring.snappy.stiffness, damping: spring.snappy.damping }}
            style={{ transformStyle: 'preserve-3d', perspective: 800 }}
          >
            <Compass className="w-7 h-7 text-emerald-400" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-display text-zinc-100">{isPrivate ? 'CTO' : 'Technology Advisory'}</h1>
            <p className="text-sm text-zinc-500 font-mono uppercase tracking-widest">Strategy, Innovation & Leadership</p>
          </div>
        </motion.div>

        <motion.div variants={heroItem} className="flex items-center gap-3 flex-wrap">
          <div className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 flex items-center gap-3">
            <span className="text-2xl font-display text-emerald-400">$50M+</span>
            <div>
              <p className="text-xs text-zinc-300">Strategy Scale</p>
              <p className="text-[10px] text-zinc-600">Data-driven expansion</p>
            </div>
          </div>
          {isPrivate && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181B] border border-wireframe-stroke">
              <Cpu className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-500 font-medium font-mono">CTO_Ang + Lil_Assess_Hawk</span>
            </div>
          )}
        </motion.div>
      </motion.div>

      <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0A0A0B] border border-wireframe-stroke">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-mono transition-all ${activeTab === tab.id ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
              <Icon className="w-3.5 h-3.5" /><span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'intake' && <IntakeForm title="Technology Strategy Intake" sections={INTAKE_SECTIONS} onSubmit={handleSubmit} accentColor="emerald" submitLabel="Submit & Build Roadmap" />}
          {activeTab === 'workflow' && <WorkflowRunner title="Technology Roadmap Pipeline" steps={steps} status={wfStatus} onRun={handleRun} accentColor="emerald" />}
          {activeTab === 'execution' && <ExecutionStream title="ii-agent Strategy Analysis" endpoint="/api/admin/ii-agent" payload={{ type: 'research', prompt: intakeData ? `Technology strategy analysis and roadmap: ${JSON.stringify(intakeData)}` : 'Analyze technology trends and build a strategy template', streaming: true }} accentColor="emerald" />}
        </div>
        {isPrivate && <AgentStatusPanel agents={agents} accentColor="emerald" verticalId="hbm-cto" />}
      </div>
    </div>
  );
}
