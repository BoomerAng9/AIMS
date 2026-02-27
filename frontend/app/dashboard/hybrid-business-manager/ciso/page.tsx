'use client';

/**
 * CISO — Chief Information Security Officer Role Page
 *
 * Security posture, compliance audits, risk management.
 * SOC2, HIPAA, FedRAMP, NIST, ISO 27001.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, fadeUp } from '@/lib/motion';
import { usePlatformMode } from '@/lib/platform-mode';
import {
  Lock, ArrowLeft, Cpu, Zap, ChevronRight,
  Shield, AlertTriangle, FileSearch, Eye,
  KeyRound, Bug, Activity,
} from 'lucide-react';

const CAPABILITIES = [
  { name: 'Security Assessment', description: 'Full posture evaluation against NIST Cybersecurity Framework and CIS Controls.', icon: Shield },
  { name: 'Compliance Auditing', description: 'SOC2 Type II, HIPAA, FedRAMP, NIST 800-53, ISO 27001, PCI-DSS gap analysis.', icon: FileSearch },
  { name: 'Risk Management', description: 'Risk register creation, likelihood/impact scoring, mitigation roadmaps.', icon: AlertTriangle },
  { name: 'Incident Response', description: 'IR plan development, tabletop exercises, playbook creation.', icon: Bug },
  { name: 'Access Control Review', description: 'IAM audit, MFA coverage, privilege escalation analysis, zero-trust design.', icon: KeyRound },
  { name: 'Threat Intelligence', description: 'Industry-specific threat landscape analysis and monitoring recommendations.', icon: Eye },
];

const AGENT_CHAIN = [
  { name: 'ACHEEVY', role: 'Orchestrator', color: 'text-amber-400' },
  { name: 'Chicken Hawk', role: 'Coordinator', color: 'text-zinc-400' },
  { name: 'Security_Ang', role: 'CISO Lead', color: 'text-red-400' },
  { name: 'Lil_Audit_Hawk', role: 'Audit Specialist', color: 'text-orange-400' },
];

const FRAMEWORKS = [
  { name: 'NIST CSF', description: 'Cybersecurity Framework — Identify, Protect, Detect, Respond, Recover' },
  { name: 'SOC 2 Type II', description: 'Service Organization Controls — Trust Services Criteria' },
  { name: 'HIPAA', description: 'Health Insurance Portability — PHI protection requirements' },
  { name: 'FedRAMP', description: 'Federal Risk and Authorization — Cloud service provider authorization' },
  { name: 'ISO 27001', description: 'Information Security Management System — International standard' },
  { name: 'FAR/DFARS', description: 'Federal Acquisition Regulation — Government contracting compliance' },
];

export default function CISOPage() {
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
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/30 flex items-center justify-center">
            <Lock className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-display text-zinc-100">
              {isPrivate ? 'CISO' : 'Security Assessment'}
            </h1>
            <p className="text-sm text-zinc-500 font-mono uppercase tracking-widest">
              {isPrivate
                ? 'Chief Information Security Officer — Compliance & Risk'
                : 'Comprehensive Security & Compliance Services'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <Activity className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs text-red-400 font-medium">Assessment Ready</span>
          </div>
          {isPrivate && (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181B] border border-wireframe-stroke">
                <Cpu className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500 font-medium">Security_Ang + Lil_Audit_Hawk</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">$2.9M Gov Contracts Managed</span>
              </div>
            </>
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
                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-red-400" />
                </div>
                <h4 className="text-sm font-medium text-zinc-100">{cap.name}</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">{cap.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Compliance Frameworks ─────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-zinc-500">Compliance Frameworks</span>
          <div className="flex-1 h-px bg-wireframe-stroke" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FRAMEWORKS.map((fw) => (
            <div key={fw.name} className="px-4 py-3 rounded-lg bg-[#111113] border border-wireframe-stroke">
              <p className="text-sm font-mono font-bold text-red-400">{fw.name}</p>
              <p className="text-xs text-zinc-500 mt-1">{fw.description}</p>
            </div>
          ))}
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
        <div className="group rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all p-5 cursor-pointer flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-zinc-200">Start Security Assessment</p>
              <p className="text-xs text-zinc-500">Chat with ACHEEVY to begin the compliance audit</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </div>
  );
}
