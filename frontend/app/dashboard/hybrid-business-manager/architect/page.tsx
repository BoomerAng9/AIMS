'use client';

/**
 * Architect — Solutions Architecture Console (v2)
 *
 * Features:
 * - Architecture Review intake form
 * - Blueprint generation workflow
 * - ii-agent execution for diagram/IaC generation
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
  Layers, ArrowLeft, Cpu, Zap, Activity,
  GitBranch, Terminal, FileText, Network, Cloud,
  Box, Database, FileCode,
} from 'lucide-react';

const INTAKE_SECTIONS: FormSection[] = [
  {
    id: 'system-context',
    title: 'System Context',
    description: 'What system are we designing or reviewing?',
    fields: [
      { id: 'system_purpose', label: 'What does this system do?', type: 'textarea', required: true, placeholder: 'Describe the system and the business problem it solves...' },
      { id: 'target_scale', label: 'Target scale', type: 'radio', required: true, options: ['< 1,000 users', '1K - 10K users', '10K - 100K users', '100K - 1M users', '1M+ users'] },
      { id: 'is_new_build', label: 'New build or re-architecture?', type: 'radio', required: true, options: ['New system from scratch', 'Re-architecture of existing system', 'Migration to new platform', 'Architecture review / audit'] },
    ],
  },
  {
    id: 'constraints',
    title: 'Constraints & Requirements',
    description: 'Hard limits and quality attributes that drive architecture decisions.',
    fields: [
      { id: 'quality_attributes', label: 'Priority quality attributes (select top 3)', type: 'multiselect', required: true, options: ['Low latency (< 100ms)', 'High throughput', 'High availability (99.9%+)', 'Cost optimization', 'Security / Zero Trust', 'Developer experience', 'Observability', 'Portability'] },
      { id: 'constraints', label: 'Hard constraints', type: 'multiselect', options: ['Specific cloud vendor required', 'Compliance mandates', 'Team skill limitations', 'Budget ceiling', 'Legacy system integration', 'Real-time requirements'] },
      { id: 'current_architecture', label: 'Current architecture (if re-architecting)', type: 'select', options: ['Monolith', 'Modular monolith', 'Microservices', 'Serverless', 'Event-driven', 'Hybrid', 'No existing system'] },
    ],
  },
  {
    id: 'tech-preferences',
    title: 'Technology Preferences',
    description: 'Existing commitments and preferences.',
    fields: [
      { id: 'cloud_provider', label: 'Cloud platform', type: 'radio', options: ['AWS', 'GCP', 'Azure', 'Multi-cloud', 'On-premise', 'Flexible'] },
      { id: 'languages', label: 'Primary languages', type: 'multiselect', options: ['TypeScript/JavaScript', 'Python', 'Go', 'Java/Kotlin', 'Rust', 'C#/.NET', 'Other'] },
      { id: 'data_requirements', label: 'Data architecture needs', type: 'multiselect', options: ['Relational (PostgreSQL/MySQL)', 'Document (MongoDB/Firestore)', 'Key-value (Redis)', 'Graph database', 'Data lake / warehouse', 'Real-time streaming', 'Vector / embedding store'] },
    ],
  },
];

const INITIAL_STEPS: WorkflowStep[] = [
  { id: 'assess', name: 'Current State Assessment', description: 'Analyze existing architecture and document component relationships.', status: 'pending', agentAssigned: 'Architect_Ang' },
  { id: 'patterns', name: 'Pattern Research', description: 'Research best-fit architecture patterns for constraints and scale.', status: 'pending', agentAssigned: 'Architect_Ang' },
  { id: 'c4-diagrams', name: 'C4 Diagram Generation', description: 'Generate Context, Container, Component, and Code diagrams.', status: 'pending', agentAssigned: 'Lil_Blueprint_Hawk' },
  { id: 'data-flow', name: 'Data Flow Mapping', description: 'Map data flow patterns, identify bottlenecks and SPOFs.', status: 'pending', agentAssigned: 'Lil_Blueprint_Hawk' },
  { id: 'iac', name: 'Infrastructure as Code', description: 'Generate IaC templates for the recommended architecture.', status: 'pending', agentAssigned: 'Architect_Ang' },
  { id: 'review', name: 'Architecture Review', description: 'Verify against compliance requirements and quality attributes.', status: 'pending', agentAssigned: 'Architect_Ang' },
];

export default function ArchitectPage() {
  const { mode } = usePlatformMode();
  const isPrivate = mode === 'PRIVATE';
  const [activeTab, setActiveTab] = useState<'intake' | 'workflow' | 'execution'>('intake');
  const [steps, setSteps] = useState<WorkflowStep[]>(INITIAL_STEPS);
  const [wfStatus, setWfStatus] = useState<WorkflowStatus>('idle');
  const [intakeData, setIntakeData] = useState<Record<string, any> | null>(null);

  const agents: AgentNode[] = [
    { id: 'acheevy', name: 'ACHEEVY', role: 'Orchestrator', tier: 'orchestrator', status: 'idle' },
    { id: 'chicken-hawk', name: 'Chicken Hawk', role: 'Coordinator', tier: 'coordinator', status: 'idle' },
    { id: 'architect-ang', name: 'Architect_Ang', role: 'Solutions Architect', tier: 'boomer_ang', status: 'idle' },
    { id: 'lil-blueprint-hawk', name: 'Lil_Blueprint_Hawk', role: 'Documentation', tier: 'lil_hawk', status: 'idle' },
  ];

  const handleSubmit = useCallback(async (data: Record<string, any>) => {
    setIntakeData(data);
    try {
      await fetch('/api/acheevy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Architecture review intake: ${JSON.stringify(data)}`, vertical: 'hbm-architect', context: data }),
      });
    } catch { /* best effort */ }
    setActiveTab('workflow');
  }, []);

  const handleRun = useCallback(async () => {
    setWfStatus('running');
    for (let i = 0; i < steps.length; i++) {
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' as const } : s));
      await new Promise(r => setTimeout(r, 2000));
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'completed' as const, duration: 2000 + Math.random() * 4000 } : s));
    }
    setWfStatus('completed');
  }, [steps.length]);

  const TABS = [
    { id: 'intake' as const, label: 'Architecture Intake', icon: FileText },
    { id: 'workflow' as const, label: 'Blueprint Pipeline', icon: GitBranch },
    { id: 'execution' as const, label: 'ii-agent Build', icon: Terminal },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <Link href="/dashboard/hybrid-business-manager" className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /><span>{isPrivate ? 'Hybrid Business Manager' : 'Professional Services'}</span>
      </Link>

      <motion.div variants={heroStagger} initial="hidden" animate="visible" className="space-y-3">
        <motion.div variants={heroItem} className="flex items-center gap-4">
          <motion.div
            className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30 flex items-center justify-center"
            whileHover={{ scale: 1.05, rotateY: 10 }}
            transition={{ type: 'spring', stiffness: spring.snappy.stiffness, damping: spring.snappy.damping }}
            style={{ transformStyle: 'preserve-3d', perspective: 800 }}
          >
            <Layers className="w-7 h-7 text-violet-400" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-display text-zinc-100">{isPrivate ? 'Architect' : 'Architecture Review'}</h1>
            <p className="text-sm text-zinc-500 font-mono uppercase tracking-widest">Systems Design at Scale</p>
          </div>
        </motion.div>

        <motion.div variants={heroItem} className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Activity className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs text-violet-400 font-medium">Blueprint Ready</span>
          </div>
          {isPrivate && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181B] border border-wireframe-stroke">
              <Cpu className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-500 font-medium font-mono">Architect_Ang + Lil_Blueprint_Hawk</span>
            </div>
          )}
        </motion.div>
      </motion.div>

      <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0A0A0B] border border-wireframe-stroke">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-mono transition-all ${activeTab === tab.id ? 'bg-violet-500/10 border border-violet-500/20 text-violet-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
              <Icon className="w-3.5 h-3.5" /><span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'intake' && <IntakeForm title="Architecture Review Intake" sections={INTAKE_SECTIONS} onSubmit={handleSubmit} accentColor="violet" submitLabel="Submit & Generate Blueprint" />}
          {activeTab === 'workflow' && <WorkflowRunner title="Architecture Blueprint Pipeline" steps={steps} status={wfStatus} onRun={handleRun} accentColor="violet" />}
          {activeTab === 'execution' && <ExecutionStream title="ii-agent Architecture Build" endpoint="/api/admin/ii-agent" payload={{ type: 'code', prompt: intakeData ? `Generate architecture artifacts: ${JSON.stringify(intakeData)}` : 'Generate a cloud architecture template', streaming: true }} accentColor="violet" />}
        </div>
        {isPrivate && <AgentStatusPanel agents={agents} accentColor="violet" verticalId="hbm-architect" />}
      </div>
    </div>
  );
}
