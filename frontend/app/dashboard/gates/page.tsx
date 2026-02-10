// frontend/app/dashboard/gates/page.tsx
"use client";

import React, { useState } from "react";
import {
  Shield,
  CheckCircle2,
  XCircle,
  FileText,
  Lock,
  Clock,
  AlertTriangle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// ORACLE 7-Gate Mock Data
// ---------------------------------------------------------------------------

type GateStatus = "passed" | "failed" | "pending";

interface OracleGate {
  id: number;
  name: string;
  description: string;
  status: GateStatus;
  timestamp: string;
  evidenceCount: number;
  verifiedBy: string;
  details: string;
}

const ORACLE_GATES: OracleGate[] = [
  {
    id: 1,
    name: "Requirements Gate",
    description: "Acceptance criteria verified against Definition of Done",
    status: "passed",
    timestamp: "2026-02-07T09:14:00Z",
    evidenceCount: 4,
    verifiedBy: "Quality_Ang",
    details:
      "All 12 acceptance criteria validated. DoD checklist complete. Risk assessment documented with P1 RiskAssessor output attached.",
  },
  {
    id: 2,
    name: "Architecture Gate",
    description: "Design review passed — structural integrity confirmed",
    status: "passed",
    timestamp: "2026-02-07T09:32:00Z",
    evidenceCount: 3,
    verifiedBy: "Quality_Ang",
    details:
      "Voltron architecture alignment confirmed. ACP/UCP/MCP protocol boundaries respected. No circular dependencies detected.",
  },
  {
    id: 3,
    name: "Implementation Gate",
    description: "Code review complete — standards and patterns enforced",
    status: "passed",
    timestamp: "2026-02-07T10:05:00Z",
    evidenceCount: 5,
    verifiedBy: "Engineer_Ang",
    details:
      "TypeScript strict mode enforced. Pino logger confirmed (no console.log). Boomer_Ang naming convention validated across all modules.",
  },
  {
    id: 4,
    name: "Security Gate",
    description: "SAST/SCA scan clean — no critical vulnerabilities",
    status: "passed",
    timestamp: "2026-02-07T10:18:00Z",
    evidenceCount: 6,
    verifiedBy: "The Farmer",
    details:
      "SBOM generated. npm audit clean. SAST scan: 0 critical, 0 high. SCA dependency check passed. OPA/Rego policy gates green.",
  },
  {
    id: 5,
    name: "Testing Gate",
    description: "100% critical path coverage — all suites passing",
    status: "passed",
    timestamp: "2026-02-07T10:41:00Z",
    evidenceCount: 4,
    verifiedBy: "Quality_Ang",
    details:
      "203 tests across 11 suites passing. Platform (31), Pillars (38), Smoke (31) suites all green. Coverage threshold met.",
  },
  {
    id: 6,
    name: "Deployment Gate",
    description: "Environment validation — infrastructure readiness check",
    status: "failed",
    timestamp: "2026-02-07T11:02:00Z",
    evidenceCount: 2,
    verifiedBy: "DevOps Agent",
    details:
      "VPS bootstrap pending (vps-setup.sh not yet executed). Docker Compose configured but not deployed. Domain DNS not yet pointed. GitHub Actions CI/CD pipeline ready.",
  },
  {
    id: 7,
    name: "Operations Gate",
    description: "Monitoring & alerting configured — observability verified",
    status: "pending",
    timestamp: "",
    evidenceCount: 0,
    verifiedBy: "",
    details:
      "Blocked by Deployment Gate. Prometheus metrics endpoints defined in P10. Correlation IDs implemented. Alerting configuration awaiting live environment.",
  },
];

// ---------------------------------------------------------------------------
// Evidence Locker Mock Data
// ---------------------------------------------------------------------------

interface EvidenceArtifact {
  id: string;
  name: string;
  type: "audit-log" | "test-report" | "scan-result" | "review" | "certificate";
  gateId: number;
  gateName: string;
  timestamp: string;
  size: string;
  signedBy: string;
}

const EVIDENCE_ARTIFACTS: EvidenceArtifact[] = [
  {
    id: "EVD-001",
    name: "Requirements DoD Checklist",
    type: "review",
    gateId: 1,
    gateName: "Requirements Gate",
    timestamp: "2026-02-07T09:10:00Z",
    size: "12 KB",
    signedBy: "Quality_Ang",
  },
  {
    id: "EVD-002",
    name: "Risk Assessment Report (P1)",
    type: "audit-log",
    gateId: 1,
    gateName: "Requirements Gate",
    timestamp: "2026-02-07T09:12:00Z",
    size: "28 KB",
    signedBy: "Quality_Ang",
  },
  {
    id: "EVD-003",
    name: "Architecture Decision Record",
    type: "review",
    gateId: 2,
    gateName: "Architecture Gate",
    timestamp: "2026-02-07T09:28:00Z",
    size: "18 KB",
    signedBy: "Boomer_CTO",
  },
  {
    id: "EVD-004",
    name: "Protocol Boundary Validation",
    type: "audit-log",
    gateId: 2,
    gateName: "Architecture Gate",
    timestamp: "2026-02-07T09:30:00Z",
    size: "8 KB",
    signedBy: "Quality_Ang",
  },
  {
    id: "EVD-005",
    name: "Code Review — Strict Mode Audit",
    type: "review",
    gateId: 3,
    gateName: "Implementation Gate",
    timestamp: "2026-02-07T10:00:00Z",
    size: "34 KB",
    signedBy: "Engineer_Ang",
  },
  {
    id: "EVD-006",
    name: "Naming Convention Scan Report",
    type: "scan-result",
    gateId: 3,
    gateName: "Implementation Gate",
    timestamp: "2026-02-07T10:03:00Z",
    size: "6 KB",
    signedBy: "Quality_Ang",
  },
  {
    id: "EVD-007",
    name: "SBOM — Software Bill of Materials",
    type: "certificate",
    gateId: 4,
    gateName: "Security Gate",
    timestamp: "2026-02-07T10:10:00Z",
    size: "142 KB",
    signedBy: "BuildSmith",
  },
  {
    id: "EVD-008",
    name: "npm Audit Report",
    type: "scan-result",
    gateId: 4,
    gateName: "Security Gate",
    timestamp: "2026-02-07T10:12:00Z",
    size: "22 KB",
    signedBy: "The Farmer",
  },
  {
    id: "EVD-009",
    name: "SAST Scan Results",
    type: "scan-result",
    gateId: 4,
    gateName: "Security Gate",
    timestamp: "2026-02-07T10:14:00Z",
    size: "56 KB",
    signedBy: "The Farmer",
  },
  {
    id: "EVD-010",
    name: "OPA/Rego Policy Gate Output",
    type: "scan-result",
    gateId: 4,
    gateName: "Security Gate",
    timestamp: "2026-02-07T10:16:00Z",
    size: "14 KB",
    signedBy: "BuildSmith",
  },
  {
    id: "EVD-011",
    name: "Jest Test Suite Report (203 tests)",
    type: "test-report",
    gateId: 5,
    gateName: "Testing Gate",
    timestamp: "2026-02-07T10:38:00Z",
    size: "88 KB",
    signedBy: "Quality_Ang",
  },
  {
    id: "EVD-012",
    name: "Coverage Threshold Report",
    type: "test-report",
    gateId: 5,
    gateName: "Testing Gate",
    timestamp: "2026-02-07T10:40:00Z",
    size: "16 KB",
    signedBy: "Quality_Ang",
  },
  {
    id: "EVD-013",
    name: "VPS Readiness Check (FAILED)",
    type: "audit-log",
    gateId: 6,
    gateName: "Deployment Gate",
    timestamp: "2026-02-07T11:00:00Z",
    size: "4 KB",
    signedBy: "DevOps Agent",
  },
  {
    id: "EVD-014",
    name: "CI/CD Pipeline Validation",
    type: "audit-log",
    gateId: 6,
    gateName: "Deployment Gate",
    timestamp: "2026-02-07T11:01:00Z",
    size: "10 KB",
    signedBy: "DevOps Agent",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(iso: string): string {
  if (!iso) return "Awaiting...";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function statusColor(status: GateStatus) {
  switch (status) {
    case "passed":
      return {
        border: "border-emerald-400/20",
        bg: "bg-emerald-400/5",
        text: "text-emerald-400",
        dot: "bg-emerald-400",
        badge: "bg-emerald-400/10 border-emerald-400/20 text-emerald-400",
        glow: "shadow-[0_0_20px_rgba(52,211,153,0.06)]",
      };
    case "failed":
      return {
        border: "border-red-400/20",
        bg: "bg-red-400/5",
        text: "text-red-400",
        dot: "bg-red-400",
        badge: "bg-red-400/10 border-red-400/20 text-red-400",
        glow: "shadow-[0_0_20px_rgba(248,113,113,0.06)]",
      };
    case "pending":
      return {
        border: "border-gold/20",
        bg: "bg-gold/10",
        text: "text-gold",
        dot: "bg-gold",
        badge: "bg-gold/10 border-gold/20 text-gold",
        glow: "shadow-[0_0_20px_rgba(251,191,36,0.06)]",
      };
  }
}

function StatusIcon({ status }: { status: GateStatus }) {
  switch (status) {
    case "passed":
      return <CheckCircle2 size={18} className="text-emerald-400" />;
    case "failed":
      return <XCircle size={18} className="text-red-400" />;
    case "pending":
      return <Clock size={18} className="text-gold" />;
  }
}

function artifactTypeLabel(type: EvidenceArtifact["type"]) {
  switch (type) {
    case "audit-log":
      return { label: "Audit Log", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" };
    case "test-report":
      return { label: "Test Report", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" };
    case "scan-result":
      return { label: "Scan Result", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" };
    case "review":
      return { label: "Review", color: "text-gold bg-gold/10 border-gold/20" };
    case "certificate":
      return { label: "Certificate", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" };
  }
}

// ---------------------------------------------------------------------------
// Computed Stats
// ---------------------------------------------------------------------------

const PASSED = ORACLE_GATES.filter((g) => g.status === "passed").length;
const FAILED = ORACLE_GATES.filter((g) => g.status === "failed").length;
const PENDING = ORACLE_GATES.filter((g) => g.status === "pending").length;
const TOTAL = ORACLE_GATES.length;
const TOTAL_EVIDENCE = EVIDENCE_ARTIFACTS.length;
const PASS_PERCENTAGE = Math.round((PASSED / TOTAL) * 100);

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function GatesPage() {
  const [expandedGate, setExpandedGate] = useState<number | null>(null);
  const [evidenceFilter, setEvidenceFilter] = useState<"all" | GateStatus>("all");

  const filteredEvidence =
    evidenceFilter === "all"
      ? EVIDENCE_ARTIFACTS
      : EVIDENCE_ARTIFACTS.filter((e) => {
          const gate = ORACLE_GATES.find((g) => g.id === e.gateId);
          return gate?.status === evidenceFilter;
        });

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* ---- Hero Section ---- */}
      <section className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-[#0a0a0a] via-black/90 to-gold/10 shadow-[0_0_60px_rgba(251,191,36,0.1)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.04),transparent_60%)]" />
        <div className="relative z-10 p-8 md:p-10">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} className="text-gold" />
            <span className="text-[10px] uppercase font-bold text-gold tracking-widest">
              ORACLE Methodology
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-1">
            7-Gate Verification &amp; Compliance
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-display">
            GATES &amp; EVIDENCE LOCKER
          </h1>
          <p className="mt-2 text-sm text-white/40 max-w-xl">
            Quality_Ang applies the ORACLE methodology across seven gates.
            Every gate must pass before deployment is authorized.
            Evidence artifacts are immutably logged for audit and compliance.
          </p>
        </div>
      </section>

      {/* ---- Summary Bar ---- */}
      <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
              Gate Progress
            </h2>
            <p className="mt-1 text-[0.65rem] text-white/30 uppercase tracking-wider">
              {PASSED}/{TOTAL} gates passed — {PASS_PERCENTAGE}% complete
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400">{PASSED} Passed</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-400/5 px-3 py-1.5">
              <XCircle size={12} className="text-red-400" />
              <span className="text-[10px] font-bold text-red-400">{FAILED} Failed</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/10 px-3 py-1.5">
              <Clock size={12} className="text-gold" />
              <span className="text-[10px] font-bold text-gold">{PENDING} Pending</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
            <div className="h-full flex">
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                style={{ width: `${(PASSED / TOTAL) * 100}%` }}
              />
              <div
                className="bg-gradient-to-r from-red-500 to-red-400 transition-all duration-700"
                style={{ width: `${(FAILED / TOTAL) * 100}%` }}
              />
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700"
                style={{ width: `${(PENDING / TOTAL) * 100}%` }}
              />
            </div>
          </div>
          <div className="mt-2 flex justify-between text-[9px] text-white/20">
            <span>Gate 1</span>
            <span>Gate 7</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-wireframe-stroke bg-black/40 p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-white/30">Total Gates</p>
            <p className="text-xl font-bold text-white mt-1">{TOTAL}</p>
          </div>
          <div className="rounded-2xl border border-wireframe-stroke bg-black/40 p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-white/30">Pass Rate</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{PASS_PERCENTAGE}%</p>
          </div>
          <div className="rounded-2xl border border-wireframe-stroke bg-black/40 p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-white/30">Evidence</p>
            <p className="text-xl font-bold text-gold mt-1">{TOTAL_EVIDENCE}</p>
          </div>
          <div className="rounded-2xl border border-wireframe-stroke bg-black/40 p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-white/30">Deploy Ready</p>
            <p className="text-xl font-bold text-red-400 mt-1">No</p>
          </div>
        </div>
      </section>

      {/* ---- ORACLE 7-Gate Grid ---- */}
      <section>
        <div className="flex items-center gap-3 mb-1">
          <Shield size={16} className="text-gold" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
            ORACLE 7-Gate Verification
          </h2>
        </div>
        <p className="text-[0.65rem] text-white/30 uppercase tracking-wider mb-4">
          Sequential gates — each must pass before proceeding
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ORACLE_GATES.map((gate) => {
            const colors = statusColor(gate.status);
            const isExpanded = expandedGate === gate.id;

            return (
              <div
                key={gate.id}
                onClick={() => setExpandedGate(isExpanded ? null : gate.id)}
                className={`group relative rounded-2xl border p-5 backdrop-blur-2xl transition-all cursor-pointer hover:bg-black/80 ${colors.border} ${colors.bg} ${colors.glow}`}
              >
                {/* Gate Number Badge */}
                <div className="absolute -top-2.5 -left-1 flex items-center gap-1.5">
                  <span className="rounded-full bg-black border border-wireframe-stroke px-2.5 py-0.5 text-[9px] font-bold text-gold uppercase tracking-wider">
                    Gate {gate.id}
                  </span>
                </div>

                {/* Header */}
                <div className="flex items-start justify-between mt-2">
                  <div className="flex-1 pr-3">
                    <h3 className="text-sm font-semibold text-white">{gate.name}</h3>
                    <p className="text-[10px] text-white/30 mt-1 leading-relaxed">
                      {gate.description}
                    </p>
                  </div>
                  <StatusIcon status={gate.status} />
                </div>

                {/* Status + Timestamp */}
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${colors.badge}`}
                  >
                    <span className={`h-1 w-1 rounded-full ${colors.dot}`} />
                    {gate.status}
                  </span>
                  <span className="text-[9px] text-white/20 font-mono">
                    {formatTimestamp(gate.timestamp)}
                  </span>
                </div>

                {/* Evidence Count */}
                <div className="mt-3 flex items-center justify-between border-t border-wireframe-stroke pt-3">
                  <div className="flex items-center gap-1.5">
                    <FileText size={10} className="text-white/20" />
                    <span className="text-[10px] text-white/30">
                      {gate.evidenceCount} artifact{gate.evidenceCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {gate.verifiedBy && (
                    <span className="text-[9px] text-white/20 font-mono">
                      {gate.verifiedBy}
                    </span>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 border-t border-wireframe-stroke pt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1.5">
                      Details
                    </p>
                    <p className="text-xs text-white/50 leading-relaxed">
                      {gate.details}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- Deployment Blocker Warning ---- */}
      <section className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-400">Deployment Blocked</h3>
            <p className="text-xs text-red-400/60 mt-1 leading-relaxed">
              Gate 6 (Deployment) failed: VPS bootstrap not yet executed. Gate 7 (Operations) is
              blocked pending deployment environment availability. Run{" "}
              <code className="rounded bg-black/60 border border-wireframe-stroke px-1.5 py-0.5 text-[10px] font-mono text-red-300/70">
                infra/vps-setup.sh
              </code>{" "}
              on the target VPS to unblock. Once the environment is live, Operations Gate can
              proceed with Prometheus, alerting, and correlation ID verification.
            </p>
          </div>
        </div>
      </section>

      {/* ---- Evidence Locker ---- */}
      <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Lock size={16} className="text-gold" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
                Evidence Locker
              </h2>
              <p className="mt-1 text-[0.65rem] text-white/30 uppercase tracking-wider">
                Immutable audit trail — {TOTAL_EVIDENCE} artifacts collected
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            {(["all", "passed", "failed", "pending"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setEvidenceFilter(filter)}
                className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  evidenceFilter === filter
                    ? "border-gold/20 bg-gold/10 text-gold"
                    : "border-wireframe-stroke bg-black/40 text-white/30 hover:border-white/20 hover:text-white/50"
                }`}
              >
                {filter === "all" ? `All (${TOTAL_EVIDENCE})` : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Evidence Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-wireframe-stroke">
                <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">
                  ID
                </th>
                <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">
                  Artifact
                </th>
                <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">
                  Type
                </th>
                <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">
                  Gate
                </th>
                <th className="p-3 text-center text-[10px] uppercase tracking-widest text-white/30 font-semibold">
                  Size
                </th>
                <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">
                  Signed By
                </th>
                <th className="p-3 text-right text-[10px] uppercase tracking-widest text-white/30 font-semibold">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEvidence.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-white/20">
                    No evidence artifacts match this filter.
                  </td>
                </tr>
              ) : (
                filteredEvidence.map((artifact) => {
                  const typeInfo = artifactTypeLabel(artifact.type);
                  return (
                    <tr
                      key={artifact.id}
                      className="border-t border-wireframe-stroke hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-3">
                        <code className="rounded bg-black/60 border border-wireframe-stroke px-2 py-0.5 text-[10px] font-mono text-gold">
                          {artifact.id}
                        </code>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <FileText size={12} className="text-white/20 shrink-0" />
                          <span className="text-xs font-medium text-white">
                            {artifact.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase ${typeInfo.color}`}
                        >
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] text-white/40 font-mono">
                          G{artifact.gateId}
                        </span>
                        <span className="text-[10px] text-white/20 ml-1.5">
                          {artifact.gateName}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] text-white/30 font-mono">
                          {artifact.size}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] text-white/40 font-mono">
                          {artifact.signedBy}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-[9px] text-white/20 font-mono">
                          {formatTimestamp(artifact.timestamp)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Locker Footer */}
        <div className="mt-4 rounded-2xl border border-dashed border-gold/20 bg-gold/[0.02] p-4">
          <div className="flex items-start gap-2">
            <Lock size={12} className="text-white/20 mt-0.5 shrink-0" />
            <p className="text-[10px] text-white/30 leading-relaxed">
              All evidence artifacts are cryptographically stamped and immutable once submitted.
              Artifacts are signed by the verifying agent (Quality_Ang, The Farmer, BuildSmith, or
              the responsible Boomer_Ang). Evidence cannot be modified or deleted after gate
              evaluation. This locker serves as the compliance backbone for the ORACLE methodology.
            </p>
          </div>
        </div>
      </section>

      {/* ---- SOP Pillar Alignment ---- */}
      <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          SOP Pillar Alignment
        </h2>
        <p className="mt-1 text-[0.65rem] text-white/30 uppercase tracking-wider mb-4">
          Gate coverage mapped to the 12 SOP pillars
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[
            { pillar: "P1", name: "Risk + DoD", gate: "G1 Requirements", met: true },
            { pillar: "P2", name: "NextAuth", gate: "G3 Implementation", met: true },
            { pillar: "P3", name: "RBAC Middleware", gate: "G4 Security", met: true },
            { pillar: "P4", name: "SQLite + WAL", gate: "G3 Implementation", met: true },
            { pillar: "P5", name: "Secrets Manager", gate: "G4 Security", met: true },
            { pillar: "P6", name: "SBOM + Audit", gate: "G4 Security", met: true },
            { pillar: "P7", name: "Sandbox + seccomp", gate: "G4 Security", met: true },
            { pillar: "P8", name: "Smoke Tests", gate: "G5 Testing", met: true },
            { pillar: "P9", name: "SAST + SCA", gate: "G4 Security", met: true },
            { pillar: "P10", name: "Alerts + Metrics", gate: "G7 Operations", met: false },
            { pillar: "P11", name: "Release + Rollback", gate: "G6 Deployment", met: false },
            { pillar: "P12", name: "Backup + Incidents", gate: "G7 Operations", met: false },
          ].map((p) => (
            <div
              key={p.pillar}
              className={`rounded-xl border p-3 flex items-center gap-3 ${
                p.met
                  ? "border-emerald-400/10 bg-emerald-400/[0.02]"
                  : "border-red-400/10 bg-red-400/[0.02]"
              }`}
            >
              {p.met ? (
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              ) : (
                <XCircle size={14} className="text-red-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-white/50">{p.pillar}</span>
                  <span className="text-[10px] text-white font-medium truncate">{p.name}</span>
                </div>
                <span className="text-[9px] text-white/20 font-mono">{p.gate}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
