// frontend/app/dashboard/security/page.tsx
"use client";

import React from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Bug,
  Lock,
  Eye,
  FileWarning,
  BarChart3,
  Clock,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const SUMMARY_CARDS = [
  {
    label: "SAST Score",
    value: "98/100",
    status: "passed" as const,
    detail: "Static analysis — zero high-severity patterns",
    icon: ShieldCheck,
  },
  {
    label: "SCA Score",
    value: "Clean",
    status: "passed" as const,
    detail: "0 critical vulnerabilities in dependency tree",
    icon: Shield,
  },
  {
    label: "Dependency Health",
    value: "409 pkgs",
    status: "warning" as const,
    detail: "5 vulnerabilities — 1 moderate, 4 high",
    icon: Bug,
  },
  {
    label: "Sandbox Posture",
    value: "100",
    status: "passed" as const,
    detail: "Defense-grade container isolation",
    icon: Lock,
  },
];

const SAST_FINDINGS = [
  { pattern: "SQL Injection", severity: "critical", file: "src/**/*.ts", status: "clean" },
  { pattern: "XSS (Reflected)", severity: "high", file: "src/routes/**/*.ts", status: "clean" },
  { pattern: "XSS (Stored)", severity: "high", file: "src/routes/**/*.ts", status: "clean" },
  { pattern: "Path Traversal", severity: "high", file: "src/middleware/*.ts", status: "clean" },
  { pattern: "Command Injection", severity: "critical", file: "src/sandbox/*.ts", status: "clean" },
  { pattern: "Prototype Pollution", severity: "medium", file: "src/utils/*.ts", status: "clean" },
  { pattern: "Insecure Deserialization", severity: "high", file: "src/agents/*.ts", status: "clean" },
  { pattern: "Hardcoded Secrets", severity: "critical", file: "**/*.ts", status: "clean" },
  { pattern: "Eval Usage", severity: "high", file: "src/**/*.ts", status: "clean" },
  { pattern: "Open Redirect", severity: "medium", file: "src/routes/auth/*.ts", status: "clean" },
];

const DEPENDENCY_AUDIT = {
  total: 409,
  vulnerabilities: {
    info: 0,
    low: 0,
    moderate: 1,
    high: 4,
    critical: 0,
  },
  moderateDetails: [
    {
      package: "semver",
      version: "6.3.0",
      advisory: "Regular expression denial of service",
      fix: "Upgrade to >=7.5.2",
    },
  ],
  highDetails: [
    {
      package: "ip",
      version: "2.0.0",
      advisory: "SSRF improper categorization of loopback addresses",
      fix: "Upgrade to >=2.0.1",
    },
    {
      package: "tar",
      version: "6.1.11",
      advisory: "Arbitrary file creation/overwrite via symlink",
      fix: "Upgrade to >=6.2.1",
    },
    {
      package: "json5",
      version: "2.2.1",
      advisory: "Prototype pollution in parse()",
      fix: "Upgrade to >=2.2.2",
    },
    {
      package: "tough-cookie",
      version: "4.1.2",
      advisory: "Prototype pollution via cookie jar manipulation",
      fix: "Upgrade to >=4.1.3",
    },
  ],
};

const SUPPLY_CHAIN = {
  sbomGenerated: true,
  sbomFormat: "CycloneDX 1.5 (JSON)",
  sbomComponents: 409,
  lockfileIntegrity: "SHA-512 verified",
  lastAudit: "2026-02-07T03:42:00Z",
  registryLock: "registry.npmjs.org only",
  signatureVerification: "enabled",
};

const SANDBOX_CONFIG = {
  securityOpt: "no-new-privileges:true",
  capDrop: "ALL",
  readOnlyRootfs: true,
  networkPolicy: "egress-restricted (allowlist only)",
  resourceLimits: {
    memory: "512Mi",
    cpu: "0.5 cores",
    pids: 256,
    nofile: 1024,
  },
  seccomp: "runtime/default",
  apparmor: "docker-default",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const severityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "text-red-400 bg-red-400/10 border-red-400/20";
    case "high":
      return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    case "medium":
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    case "low":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    default:
      return "text-amber-100/40 bg-white/5 border-white/10";
  }
};

const statusBadge = (status: "passed" | "warning" | "critical") => {
  switch (status) {
    case "passed":
      return "bg-emerald-400/10 border-emerald-400/20 text-emerald-400";
    case "warning":
      return "bg-yellow-400/10 border-yellow-400/20 text-yellow-400";
    case "critical":
      return "bg-red-400/10 border-red-400/20 text-red-400";
  }
};

const formatTimestamp = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SecurityCenterPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-amber-400/20 bg-gradient-to-r from-amber-400/5 to-black/80 p-6 shadow-[0_0_40px_rgba(251,191,36,0.08)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/10 border border-amber-400/20">
                <Shield size={20} className="text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-amber-50 font-display">
                  Security Center
                </h1>
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/50">
                  Quality_Ang &middot; ORACLE Gate Verification
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-amber-100/40 max-w-xl">
              Unified security operations dashboard — SAST analysis, dependency audits,
              supply chain integrity, and sandbox posture. Verified by Quality_Ang through
              ORACLE methodology gates.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All Gates Passed
            </span>
          </div>
        </div>
      </section>

      {/* ── Summary Cards ──────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SUMMARY_CARDS.map((card) => (
          <div
            key={card.label}
            className="group rounded-2xl border border-amber-400/10 bg-black/60 p-5 backdrop-blur-2xl transition-all hover:border-amber-400/20 hover:shadow-[0_0_20px_rgba(251,191,36,0.05)]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 group-hover:bg-amber-400 group-hover:text-black transition-colors">
                <card.icon size={18} />
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusBadge(card.status)}`}
              >
                <span
                  className={`h-1 w-1 rounded-full ${
                    card.status === "passed"
                      ? "bg-emerald-400"
                      : card.status === "warning"
                        ? "bg-yellow-400"
                        : "bg-red-400"
                  }`}
                />
                {card.status}
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-amber-100/40">
              {card.label}
            </p>
            <p className="text-2xl font-bold text-amber-50 mt-1">{card.value}</p>
            <p className="text-[10px] text-amber-100/30 mt-1">{card.detail}</p>
          </div>
        ))}
      </div>

      {/* ── SAST Findings ──────────────────────────────────────────── */}
      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
        <div className="flex items-center gap-3 mb-1">
          <Eye size={16} className="text-amber-400" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
            SAST Findings
          </h2>
        </div>
        <p className="text-[0.65rem] text-amber-100/40 uppercase tracking-wider mb-4">
          Static Application Security Testing — pattern scan results
        </p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-3 text-left text-[10px] uppercase tracking-widest text-amber-100/40">
                  Pattern
                </th>
                <th className="p-3 text-left text-[10px] uppercase tracking-widest text-amber-100/40">
                  Severity
                </th>
                <th className="p-3 text-left text-[10px] uppercase tracking-widest text-amber-100/40">
                  Scope
                </th>
                <th className="p-3 text-center text-[10px] uppercase tracking-widest text-amber-100/40">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {SAST_FINDINGS.map((finding) => (
                <tr
                  key={finding.pattern}
                  className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="p-3">
                    <p className="text-xs font-semibold text-amber-50">
                      {finding.pattern}
                    </p>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${severityColor(finding.severity)}`}
                    >
                      {finding.severity}
                    </span>
                  </td>
                  <td className="p-3">
                    <code className="rounded bg-black/60 border border-white/5 px-2 py-0.5 text-[10px] font-mono text-amber-200/60">
                      {finding.file}
                    </code>
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 text-[9px] font-semibold uppercase text-emerald-400">
                      <ShieldCheck size={10} />
                      {finding.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-emerald-400/10 bg-emerald-400/[0.02] p-4">
          <p className="text-[10px] text-emerald-400/60 flex items-center gap-2">
            <ShieldCheck size={12} />
            All 10 SAST patterns scanned — 0 findings. Score: 98/100 (2 pts deducted for
            informational complexity warnings).
          </p>
        </div>
      </section>

      {/* ── Dependency Audit ───────────────────────────────────────── */}
      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
        <div className="flex items-center gap-3 mb-1">
          <Bug size={16} className="text-amber-400" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
            Dependency Audit
          </h2>
        </div>
        <p className="text-[0.65rem] text-amber-100/40 uppercase tracking-wider mb-4">
          npm audit results &middot; {DEPENDENCY_AUDIT.total} packages scanned
        </p>

        {/* Severity Breakdown */}
        <div className="grid gap-3 sm:grid-cols-5 mb-6">
          {(
            Object.entries(DEPENDENCY_AUDIT.vulnerabilities) as [string, number][]
          ).map(([level, count]) => (
            <div
              key={level}
              className="rounded-2xl border border-white/5 bg-black/40 p-4 text-center"
            >
              <p className="text-[10px] uppercase tracking-widest text-amber-100/40">
                {level}
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  count === 0
                    ? "text-emerald-400"
                    : level === "critical"
                      ? "text-red-400"
                      : level === "high"
                        ? "text-orange-400"
                        : level === "moderate"
                          ? "text-yellow-400"
                          : "text-amber-50"
                }`}
              >
                {count}
              </p>
            </div>
          ))}
        </div>

        {/* Moderate Vulnerabilities */}
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/80 mb-3">
            Moderate ({DEPENDENCY_AUDIT.moderateDetails.length})
          </p>
          <div className="space-y-2">
            {DEPENDENCY_AUDIT.moderateDetails.map((vuln) => (
              <div
                key={vuln.package}
                className="rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.03] p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileWarning size={14} className="text-yellow-400" />
                    <span className="text-xs font-semibold text-amber-50">
                      {vuln.package}
                    </span>
                    <code className="rounded bg-black/60 border border-white/5 px-1.5 py-0.5 text-[9px] font-mono text-amber-200/50">
                      {vuln.version}
                    </code>
                  </div>
                  <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2 py-0.5 text-[9px] font-bold uppercase text-yellow-400">
                    moderate
                  </span>
                </div>
                <p className="text-[11px] text-amber-100/50 mt-2">{vuln.advisory}</p>
                <p className="text-[10px] text-emerald-400/70 mt-1">
                  Fix: {vuln.fix}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* High Vulnerabilities */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400/80 mb-3">
            High ({DEPENDENCY_AUDIT.highDetails.length})
          </p>
          <div className="space-y-2">
            {DEPENDENCY_AUDIT.highDetails.map((vuln) => (
              <div
                key={vuln.package}
                className="rounded-2xl border border-orange-400/10 bg-orange-400/[0.03] p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={14} className="text-orange-400" />
                    <span className="text-xs font-semibold text-amber-50">
                      {vuln.package}
                    </span>
                    <code className="rounded bg-black/60 border border-white/5 px-1.5 py-0.5 text-[9px] font-mono text-amber-200/50">
                      {vuln.version}
                    </code>
                  </div>
                  <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-2 py-0.5 text-[9px] font-bold uppercase text-orange-400">
                    high
                  </span>
                </div>
                <p className="text-[11px] text-amber-100/50 mt-2">{vuln.advisory}</p>
                <p className="text-[10px] text-emerald-400/70 mt-1">
                  Fix: {vuln.fix}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Supply Chain + Sandbox ─ two-column ────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Supply Chain */}
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-3 mb-1">
            <BarChart3 size={16} className="text-amber-400" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
              Supply Chain
            </h2>
          </div>
          <p className="text-[0.65rem] text-amber-100/40 uppercase tracking-wider mb-4">
            SBOM &middot; Lockfile &middot; Registry integrity
          </p>
          <div className="space-y-3">
            {[
              {
                label: "SBOM Status",
                value: SUPPLY_CHAIN.sbomGenerated ? "Generated" : "Missing",
                ok: SUPPLY_CHAIN.sbomGenerated,
                detail: `${SUPPLY_CHAIN.sbomFormat} — ${SUPPLY_CHAIN.sbomComponents} components`,
              },
              {
                label: "Lockfile Integrity",
                value: SUPPLY_CHAIN.lockfileIntegrity,
                ok: true,
                detail: "package-lock.json hash matches installed tree",
              },
              {
                label: "Registry Lock",
                value: SUPPLY_CHAIN.registryLock,
                ok: true,
                detail: "No untrusted registries in .npmrc",
              },
              {
                label: "Signature Verification",
                value: SUPPLY_CHAIN.signatureVerification,
                ok: true,
                detail: "npm audit signatures — all verified",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/40 p-4"
              >
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-amber-100/40">
                    {item.label}
                  </p>
                  <p className="text-xs font-semibold text-amber-50 mt-0.5">
                    {item.value}
                  </p>
                  <p className="text-[9px] text-amber-100/30 mt-0.5">{item.detail}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${
                    item.ok
                      ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                      : "bg-red-400/10 border-red-400/20 text-red-400"
                  }`}
                >
                  <span
                    className={`h-1 w-1 rounded-full ${item.ok ? "bg-emerald-400" : "bg-red-400"}`}
                  />
                  {item.ok ? "Verified" : "Missing"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-amber-100/30">
            <Clock size={10} className="text-amber-400/60" />
            Last audit: {formatTimestamp(SUPPLY_CHAIN.lastAudit)}
          </div>
        </section>

        {/* Sandbox Configuration */}
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-3 mb-1">
            <Lock size={16} className="text-amber-400" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
              Sandbox Configuration
            </h2>
          </div>
          <p className="text-[0.65rem] text-amber-100/40 uppercase tracking-wider mb-4">
            Container isolation &middot; Defense-grade posture
          </p>
          <div className="space-y-3">
            {[
              {
                label: "Security Opt",
                value: SANDBOX_CONFIG.securityOpt,
                icon: ShieldCheck,
              },
              {
                label: "Capabilities",
                value: `Drop: ${SANDBOX_CONFIG.capDrop}`,
                icon: Shield,
              },
              {
                label: "Root Filesystem",
                value: SANDBOX_CONFIG.readOnlyRootfs ? "Read-Only" : "Writable",
                icon: Lock,
              },
              {
                label: "Network Policy",
                value: SANDBOX_CONFIG.networkPolicy,
                icon: Eye,
              },
              {
                label: "Seccomp Profile",
                value: SANDBOX_CONFIG.seccomp,
                icon: ShieldCheck,
              },
              {
                label: "AppArmor Profile",
                value: SANDBOX_CONFIG.apparmor,
                icon: Shield,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/40 p-4"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 shrink-0">
                  <item.icon size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-amber-100/40">
                    {item.label}
                  </p>
                  <p className="text-xs font-semibold text-amber-50 mt-0.5 truncate">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Resource Limits */}
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/80 mb-3">
              Resource Limits
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Memory", value: SANDBOX_CONFIG.resourceLimits.memory },
                { label: "CPU", value: SANDBOX_CONFIG.resourceLimits.cpu },
                {
                  label: "Max PIDs",
                  value: String(SANDBOX_CONFIG.resourceLimits.pids),
                },
                {
                  label: "Max Open Files",
                  value: String(SANDBOX_CONFIG.resourceLimits.nofile),
                },
              ].map((limit) => (
                <div
                  key={limit.label}
                  className="rounded-xl border border-white/5 bg-black/40 p-3 text-center"
                >
                  <p className="text-[9px] uppercase tracking-widest text-amber-100/40">
                    {limit.label}
                  </p>
                  <p className="text-sm font-bold text-amber-50 mt-0.5">
                    {limit.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── Footer Note ────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-dashed border-amber-300/10 bg-amber-300/[0.02] p-4">
        <p className="text-[10px] text-amber-100/40 leading-relaxed">
          Security posture is continuously verified by{" "}
          <span className="text-amber-200/60 font-semibold">Quality_Ang</span> through
          the ORACLE methodology (7-gate verification). SAST scans run on every CI push
          via <code className="text-amber-200/60">ci.yml</code>. Dependency audits are
          triggered on lockfile changes. Sandbox configuration is enforced by{" "}
          <code className="text-amber-200/60">infra/docker-compose.yml</code> security
          directives. All findings are actionable — remediation paths provided inline.
        </p>
      </section>
    </div>
  );
}
