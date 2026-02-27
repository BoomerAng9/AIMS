'use client';

/**
 * CISO — Security Assessment Console (v2)
 *
 * Features:
 * - Security posture assessment intake form
 * - Compliance gap analysis workflow
 * - ii-agent execution for policy generation
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
  Lock, ArrowLeft, Cpu, Activity,
  GitBranch, Terminal, FileText, Shield,
  AlertTriangle, Eye, KeyRound,
} from 'lucide-react';

const INTAKE_SECTIONS: FormSection[] = [
  {
    id: 'org-profile',
    title: 'Organization Profile',
    description: 'Help us understand your organization and its security context.',
    fields: [
      { id: 'org_type', label: 'Organization type', type: 'radio', required: true, options: ['Startup (< 50 employees)', 'SMB (50-500 employees)', 'Mid-market (500-5,000)', 'Enterprise (5,000+)', 'Government / Public Sector'] },
      { id: 'industry', label: 'Industry', type: 'select', required: true, options: ['Technology / SaaS', 'Healthcare', 'Financial Services', 'Government / Defense', 'Retail / E-commerce', 'Manufacturing', 'Education', 'Energy / Utilities', 'Other'] },
      { id: 'security_maturity', label: 'Current security maturity', type: 'radio', required: true, options: ['No dedicated security staff', 'Part-time / shared IT security', 'Dedicated security team < 5', 'Full security org with SOC', 'Mature program with CISO'] },
    ],
  },
  {
    id: 'compliance',
    title: 'Compliance Landscape',
    description: 'Map the regulatory requirements you face or target.',
    fields: [
      { id: 'compliance_frameworks', label: 'Current or target frameworks (select all)', type: 'multiselect', required: true, options: ['SOC 2 Type II', 'HIPAA', 'FedRAMP', 'NIST 800-53', 'ISO 27001', 'PCI-DSS', 'GDPR', 'CMMC', 'FAR/DFARS', 'StateRAMP', 'None yet'] },
      { id: 'audit_timeline', label: 'Next audit or certification deadline', type: 'select', options: ['Within 30 days', 'Within 90 days', 'Within 6 months', 'Within 12 months', 'No deadline set'] },
      { id: 'known_gaps', label: 'Known compliance gaps', type: 'textarea', placeholder: 'Describe any gaps you are already aware of...' },
    ],
  },
  {
    id: 'threat-landscape',
    title: 'Threat Assessment',
    description: 'What keeps you up at night?',
    fields: [
      { id: 'top_threats', label: 'Primary concerns (select top 3)', type: 'multiselect', required: true, options: ['Data breaches', 'Ransomware', 'Insider threats', 'Supply chain attacks', 'Cloud misconfiguration', 'API vulnerabilities', 'Phishing / social engineering', 'AI model attacks'] },
      { id: 'current_controls', label: 'Existing controls (select all)', type: 'multiselect', options: ['MFA everywhere', 'EDR / endpoint protection', 'SIEM', 'DLP', 'WAF', 'Zero Trust network', 'Vulnerability scanning', 'Penetration testing', 'Security awareness training'] },
      { id: 'incident_history', label: 'Incident history', type: 'radio', options: ['No incidents', 'Minor incidents (contained)', 'Significant breach in past 24 months', 'Prefer not to say'] },
    ],
  },
];

const INITIAL_STEPS: WorkflowStep[] = [
  { id: 'posture-audit', name: 'Security Posture Audit', description: 'Evaluate against NIST Cybersecurity Framework.', status: 'pending', agentAssigned: 'Security_Ang' },
  { id: 'compliance-gaps', name: 'Compliance Gap Analysis', description: 'Map gaps for targeted frameworks.', status: 'pending', agentAssigned: 'Security_Ang' },
  { id: 'threat-analysis', name: 'Threat Landscape Analysis', description: 'Industry-specific threat intelligence report.', status: 'pending', agentAssigned: 'Lil_Audit_Hawk' },
  { id: 'risk-register', name: 'Risk Register Generation', description: 'Create risk register with likelihood/impact scoring.', status: 'pending', agentAssigned: 'Security_Ang' },
  { id: 'policy-gen', name: 'Policy Generation', description: 'Generate security policies: access control, IR, data classification.', status: 'pending', agentAssigned: 'Lil_Audit_Hawk' },
  { id: 'iam-audit', name: 'IAM & Access Review', description: 'Audit identity management, MFA coverage, privilege escalation.', status: 'pending', agentAssigned: 'Lil_Audit_Hawk' },
  { id: 'roadmap', name: 'Remediation Roadmap', description: 'Prioritized action plan: 30-day, 90-day, 6-month milestones.', status: 'pending', agentAssigned: 'Security_Ang' },
];

export default function CISOPage() {
  const { mode } = usePlatformMode();
  const isPrivate = mode === 'PRIVATE';
  const [activeTab, setActiveTab] = useState<'intake' | 'workflow' | 'execution'>('intake');
  const [steps, setSteps] = useState<WorkflowStep[]>(INITIAL_STEPS);
  const [wfStatus, setWfStatus] = useState<WorkflowStatus>('idle');
  const [intakeData, setIntakeData] = useState<Record<string, any> | null>(null);

  const agents: AgentNode[] = [
    { id: 'acheevy', name: 'ACHEEVY', role: 'Orchestrator', tier: 'orchestrator', status: 'idle' },
    { id: 'chicken-hawk', name: 'Chicken Hawk', role: 'Coordinator', tier: 'coordinator', status: 'idle' },
    { id: 'security-ang', name: 'Security_Ang', role: 'CISO Lead', tier: 'boomer_ang', status: 'idle' },
    { id: 'lil-audit-hawk', name: 'Lil_Audit_Hawk', role: 'Audit Specialist', tier: 'lil_hawk', status: 'idle' },
  ];

  const handleSubmit = useCallback(async (data: Record<string, any>) => {
    setIntakeData(data);
    try { await fetch('/api/acheevy/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Security assessment intake: ${JSON.stringify(data)}`, vertical: 'hbm-ciso', context: data }) }); } catch {}
    setActiveTab('workflow');
  }, []);

  const handleRun = useCallback(async () => {
    setWfStatus('running');
    for (let i = 0; i < steps.length; i++) {
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' as const } : s));
      await new Promise(r => setTimeout(r, 2000));
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'completed' as const, duration: 1800 + Math.random() * 3500 } : s));
    }
    setWfStatus('completed');
  }, [steps.length]);

  const TABS = [
    { id: 'intake' as const, label: 'Security Assessment', icon: FileText },
    { id: 'workflow' as const, label: 'Compliance Pipeline', icon: GitBranch },
    { id: 'execution' as const, label: 'ii-agent Audit', icon: Terminal },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <Link href="/dashboard/hybrid-business-manager" className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /><span>{isPrivate ? 'Hybrid Business Manager' : 'Professional Services'}</span>
      </Link>

      <motion.div variants={heroStagger} initial="hidden" animate="visible" className="space-y-3">
        <motion.div variants={heroItem} className="flex items-center gap-4">
          <motion.div
            className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/30 flex items-center justify-center"
            whileHover={{ scale: 1.05, rotateY: 10 }}
            transition={{ type: 'spring', stiffness: spring.snappy.stiffness, damping: spring.snappy.damping }}
            style={{ transformStyle: 'preserve-3d', perspective: 800 }}
          >
            <Lock className="w-7 h-7 text-red-400" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-display text-zinc-100">{isPrivate ? 'CISO' : 'Security Assessment'}</h1>
            <p className="text-sm text-zinc-500 font-mono uppercase tracking-widest">Compliance, Risk & Governance</p>
          </div>
        </motion.div>

        <motion.div variants={heroItem} className="flex items-center gap-3 flex-wrap">
          <div className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 flex items-center gap-3">
            <span className="text-2xl font-display text-red-400">$2.9M</span>
            <div>
              <p className="text-xs text-zinc-300">Gov Contracts Managed</p>
              <p className="text-[10px] text-zinc-600">FAR/DFARS compliance</p>
            </div>
          </div>
          {isPrivate && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181B] border border-wireframe-stroke">
              <Cpu className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-500 font-medium font-mono">Security_Ang + Lil_Audit_Hawk</span>
            </div>
          )}
        </motion.div>
      </motion.div>

      <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0A0A0B] border border-wireframe-stroke">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-mono transition-all ${activeTab === tab.id ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
              <Icon className="w-3.5 h-3.5" /><span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'intake' && <IntakeForm title="Security Posture Assessment" sections={INTAKE_SECTIONS} onSubmit={handleSubmit} accentColor="red" submitLabel="Submit & Start Audit" />}
          {activeTab === 'workflow' && <WorkflowRunner title="Compliance & Risk Pipeline" steps={steps} status={wfStatus} onRun={handleRun} accentColor="red" />}
          {activeTab === 'execution' && <ExecutionStream title="ii-agent Security Audit" endpoint="/api/admin/ii-agent" payload={{ type: 'research', prompt: intakeData ? `Security assessment and compliance gap analysis: ${JSON.stringify(intakeData)}` : 'Generate a NIST CSF security assessment template', streaming: true }} accentColor="red" />}
        </div>
        {isPrivate && <AgentStatusPanel agents={agents} accentColor="red" verticalId="hbm-ciso" />}
      </div>
    </div>
  );
}
