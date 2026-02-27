'use client';

/**
 * H B Engineer — Full Deployment Engineering Console (v2)
 *
 * Features:
 * - AI Deployment Readiness Assessment (10-question intake form)
 * - DMAIC workflow pipeline runner
 * - ii-agent execution stream for build tasks
 * - Agent status panel with dispatch controls
 * - Paper form → agent pipeline integration
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  Code2, ArrowLeft, Cpu, Zap, ChevronRight, Activity,
  GitBranch, Database, Cloud, Monitor, Rocket, Shield,
  Play, Terminal, FileText,
} from 'lucide-react';

/* ── Assessment Form Sections ──────────────────────────────── */

const ASSESSMENT_SECTIONS: FormSection[] = [
  {
    id: 'ai-maturity',
    title: 'AI Maturity & Current State',
    description: 'Tell us where your AI initiative stands today.',
    fields: [
      {
        id: 'ai_stage', label: 'What stage is your AI initiative?', type: 'radio', required: true,
        options: ['Exploration — researching options', 'Pilot — proof of concept running', 'Scaling — expanding to more use cases', 'Production — live and serving users'],
      },
      {
        id: 'deployment_blocker', label: 'What is the biggest deployment blocker?', type: 'select', required: true,
        options: ['No deployment pipeline', 'Data quality issues', 'Team skill gaps', 'Compliance requirements', 'Infrastructure limitations', 'Budget constraints', 'Executive buy-in'],
      },
      {
        id: 'current_stack', label: 'Describe your current tech stack', type: 'textarea', required: true,
        placeholder: 'e.g., Python, FastAPI, PostgreSQL, AWS EC2, no CI/CD...',
        helpText: 'Languages, frameworks, databases, cloud provider, deployment method',
      },
    ],
  },
  {
    id: 'technical-env',
    title: 'Technical Environment',
    description: 'Map the infrastructure and compliance landscape.',
    fields: [
      {
        id: 'cloud_provider', label: 'Cloud provider', type: 'radio', required: true,
        options: ['AWS', 'GCP', 'Azure', 'Multi-cloud', 'On-premise', 'No cloud yet'],
      },
      {
        id: 'compliance_requirements', label: 'Compliance requirements (select all)', type: 'multiselect',
        options: ['SOC2', 'HIPAA', 'FedRAMP', 'NIST 800-53', 'ISO 27001', 'PCI-DSS', 'GDPR', 'None / Unknown'],
      },
      {
        id: 'has_cicd', label: 'Do you have CI/CD pipelines for model deployment?', type: 'radio', required: true,
        options: ['Yes, fully automated', 'Manual process exists', 'No pipeline'],
      },
    ],
  },
  {
    id: 'production-reqs',
    title: 'Production Requirements',
    description: 'Define what production-ready looks like for your use case.',
    fields: [
      {
        id: 'user_scale', label: 'Target user scale', type: 'radio', required: true,
        options: ['< 100 users', '100 - 1,000 users', '1,000 - 10,000 users', '10,000 - 100,000 users', '100,000+ users'],
      },
      {
        id: 'sla_requirements', label: 'SLA requirements', type: 'select',
        options: ['99.9% uptime (8.7 hrs/year downtime)', '99.5% uptime (43.8 hrs/year)', '99% uptime (87.6 hrs/year)', 'Best effort / no SLA'],
      },
      {
        id: 'monitoring_needs', label: 'Monitoring strategy', type: 'radio', required: true,
        options: ['Full observability (metrics, logs, traces)', 'Basic logging only', 'No monitoring yet'],
      },
      {
        id: 'ai_budget', label: 'AI infrastructure budget', type: 'radio',
        options: ['> $500K annually', '$100K - $500K', '$25K - $100K', '< $25K', 'Unknown'],
      },
    ],
  },
];

/* ── DMAIC Workflow Steps ──────────────────────────────────── */

const INITIAL_WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'define', name: 'Define', description: 'Scope the deployment: what AI, what scale, what constraints.', status: 'pending', agentAssigned: 'HBEngineer_Ang' },
  { id: 'measure', name: 'Measure', description: 'Benchmark current state: latency, accuracy, uptime, cost.', status: 'pending', agentAssigned: 'Lil_Assess_Hawk' },
  { id: 'analyze', name: 'Analyze', description: 'Identify gaps between pilot and production requirements.', status: 'pending', agentAssigned: 'HBEngineer_Ang' },
  { id: 'improve', name: 'Improve', description: 'Build the deployment pipeline and production infrastructure.', status: 'pending', agentAssigned: 'Lil_Deploy_Hawk' },
  { id: 'control', name: 'Control', description: 'Monitor, alert, rollback — keep it running at SLA.', status: 'pending', agentAssigned: 'Lil_Deploy_Hawk' },
];

/* ── Component ─────────────────────────────────────────────── */

export default function HBEngineerPage() {
  const { mode } = usePlatformMode();
  const isPrivate = mode === 'PRIVATE';
  const [activeTab, setActiveTab] = useState<'assessment' | 'workflow' | 'execution'>('assessment');

  // Workflow state
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(INITIAL_WORKFLOW_STEPS);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('idle');
  const [assessmentData, setAssessmentData] = useState<Record<string, any> | null>(null);

  // Agent state
  const [agents] = useState<AgentNode[]>([
    { id: 'acheevy', name: 'ACHEEVY', role: 'Orchestrator', tier: 'orchestrator', status: 'idle' },
    { id: 'chicken-hawk', name: 'Chicken Hawk', role: 'Coordinator', tier: 'coordinator', status: 'idle' },
    { id: 'hbengineer-ang', name: 'HBEngineer_Ang', role: 'Lead Engineer', tier: 'boomer_ang', status: 'idle' },
    { id: 'lil-deploy-hawk', name: 'Lil_Deploy_Hawk', role: 'Deploy Specialist', tier: 'lil_hawk', status: 'idle' },
  ]);

  const handleAssessmentSubmit = useCallback(async (data: Record<string, any>) => {
    setAssessmentData(data);
    // Submit to ACHEEVY for processing
    try {
      await fetch('/api/acheevy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `AI Deployment Readiness Assessment completed. Data: ${JSON.stringify(data)}`,
          vertical: 'hbm-engineer',
          context: data,
        }),
      });
    } catch { /* best effort */ }
    setActiveTab('workflow');
  }, []);

  const handleRunWorkflow = useCallback(async () => {
    setWorkflowStatus('running');
    // Simulate step execution (would connect to real ACHEEVY dispatch)
    for (let i = 0; i < workflowSteps.length; i++) {
      setWorkflowSteps(prev => prev.map((s, idx) =>
        idx === i ? { ...s, status: 'running' as const } : s
      ));
      await new Promise(r => setTimeout(r, 2000));
      setWorkflowSteps(prev => prev.map((s, idx) =>
        idx === i ? { ...s, status: 'completed' as const, duration: 1500 + Math.random() * 3000 } : s
      ));
    }
    setWorkflowStatus('completed');
  }, [workflowSteps.length]);

  const handleDispatch = useCallback(async (agentId: string, task: string) => {
    await fetch('/api/acheevy/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: task, vertical: 'hbm-engineer', agentTarget: agentId }),
    });
  }, []);

  const TABS = [
    { id: 'assessment' as const, label: 'Readiness Assessment', icon: FileText },
    { id: 'workflow' as const, label: 'DMAIC Pipeline', icon: GitBranch },
    { id: 'execution' as const, label: 'ii-agent Execution', icon: Terminal },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/dashboard/hybrid-business-manager"
        className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{isPrivate ? 'Hybrid Business Manager' : 'Professional Services'}</span>
      </Link>

      {/* Hero */}
      <motion.div variants={heroStagger} initial="hidden" animate="visible" className="space-y-3">
        <motion.div variants={heroItem} className="flex items-center gap-4">
          <motion.div
            className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30 flex items-center justify-center"
            whileHover={{ scale: 1.05, rotateY: 10 }}
            transition={{ type: 'spring', stiffness: spring.snappy.stiffness, damping: spring.snappy.damping }}
            style={{ transformStyle: 'preserve-3d', perspective: 800 }}
          >
            <Code2 className="w-7 h-7 text-blue-400" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-display text-zinc-100">
              {isPrivate ? 'H B Engineer' : 'AI Deployment Services'}
            </h1>
            <p className="text-sm text-zinc-500 font-mono uppercase tracking-widest">
              From Pilot to Production — AI That Actually Ships
            </p>
          </div>
        </motion.div>

        <motion.div variants={heroItem} className="flex items-center gap-3 flex-wrap">
          <div className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 flex items-center gap-3">
            <span className="text-2xl font-display text-blue-400">70%</span>
            <div>
              <p className="text-xs text-zinc-300">Cycle Time Reduction</p>
              <p className="text-[10px] text-zinc-600">Proven across deployments</p>
            </div>
          </div>
          {isPrivate && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181B] border border-wireframe-stroke">
              <Cpu className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-500 font-medium font-mono">HBEngineer_Ang + Lil_Deploy_Hawk</span>
            </div>
          )}
        </motion.div>
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
                  ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
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
          {activeTab === 'assessment' && (
            <IntakeForm
              title="AI Deployment Readiness Assessment"
              sections={ASSESSMENT_SECTIONS}
              onSubmit={handleAssessmentSubmit}
              accentColor="blue"
              submitLabel="Submit & Start Pipeline"
            />
          )}

          {activeTab === 'workflow' && (
            <WorkflowRunner
              title="DMAIC Deployment Pipeline"
              steps={workflowSteps}
              status={workflowStatus}
              onRun={handleRunWorkflow}
              accentColor="blue"
            />
          )}

          {activeTab === 'execution' && (
            <ExecutionStream
              title="ii-agent Execution"
              endpoint="/api/admin/ii-agent"
              payload={{
                type: 'code',
                prompt: assessmentData
                  ? `Build a deployment pipeline based on this assessment: ${JSON.stringify(assessmentData)}`
                  : 'Analyze current AI deployment readiness and generate recommendations',
                streaming: true,
              }}
              accentColor="blue"
            />
          )}
        </div>

        {/* Agent Panel (1/3) */}
        {isPrivate && (
          <div>
            <AgentStatusPanel
              agents={agents}
              onDispatch={handleDispatch}
              accentColor="blue"
              verticalId="hbm-engineer"
            />
          </div>
        )}
      </div>
    </div>
  );
}
