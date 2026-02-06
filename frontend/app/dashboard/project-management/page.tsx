// frontend/app/dashboard/project-management/page.tsx
import React from "react";

/* ------------------------------------------------------------------ */
/*  PMO Office Data                                                    */
/* ------------------------------------------------------------------ */

interface TeamMember {
  name: string;
  title: string;
  role: string;
}

interface PMOOffice {
  id: string;
  code: string;
  fullName: string;
  mission: string;
  director: { name: string; title: string; scope: string };
  team: TeamMember[];
  kpis: string[];
  status: "ACTIVE" | "STANDBY";
}

const PMO_OFFICES: PMOOffice[] = [
  {
    id: "dt-pmo",
    code: "DT-PMO",
    fullName: "Digital Transformation PMO",
    mission:
      "Drive end-to-end digital transformation across architecture, technology, and financial governance.",
    director: {
      name: "CDTO_Ang",
      title: "Chief Digital Transformation Officer",
      scope: "Strategy, architecture, final authority",
    },
    team: [
      { name: "CTO_Ang", title: "Chief Technology Officer", role: "Agent design, stack alignment" },
      { name: "CFO_Ang", title: "Chief Financial Officer", role: "Token efficiency, LUC alignment" },
      { name: "QA_Ang", title: "Quality Assurance", role: "Output verification readiness" },
    ],
    kpis: ["Deployment frequency", "System uptime", "Architecture compliance", "Tech debt ratio"],
    status: "ACTIVE",
  },
  {
    id: "strat-pmo",
    code: "STRAT-PMO",
    fullName: "Strategy PMO",
    mission:
      "Align portfolio initiatives with business strategy through prioritization and ROI modeling.",
    director: {
      name: "CSO_Ang",
      title: "Chief Strategy Officer",
      scope: "Portfolio management, business alignment, prioritization",
    },
    team: [
      { name: "Portfolio Analyst", title: "Portfolio Analyst", role: "Initiative tracking, ROI modeling" },
      { name: "Market Strategist", title: "Market Strategist", role: "Competitive intelligence, opportunity mapping" },
    ],
    kpis: ["Strategic alignment", "Portfolio ROI", "Initiative completion", "Resource utilization"],
    status: "ACTIVE",
  },
  {
    id: "ops-pmo",
    code: "OPS-PMO",
    fullName: "Operations PMO",
    mission:
      "Ensure runtime health, maximize throughput, and enforce SLA compliance across all pipelines.",
    director: {
      name: "COO_Ang",
      title: "Chief Operating Officer",
      scope: "Runtime health, throughput, SLAs, execution efficiency",
    },
    team: [
      { name: "Operations Monitor", title: "Operations Monitor", role: "Pipeline health, incident response" },
      { name: "Capacity Planner", title: "Capacity Planner", role: "Load balancing, scaling" },
      { name: "SLA Manager", title: "SLA Manager", role: "Service level tracking" },
    ],
    kpis: ["Pipeline throughput", "SLA compliance", "Mean time to resolution", "Agent utilization"],
    status: "ACTIVE",
  },
  {
    id: "innov-pmo",
    code: "INNOV-PMO",
    fullName: "Innovation PMO",
    mission:
      "Incubate emerging technologies and accelerate prototype-to-production pipelines.",
    director: {
      name: "CIO_Ang",
      title: "Chief Innovation Officer",
      scope: "R&D pipeline, emerging tech, prototype incubation",
    },
    team: [
      { name: "Research Lead", title: "Research Lead", role: "Tech scouting, proof-of-concept" },
      { name: "Prototype Engineer", title: "Prototype Engineer", role: "Rapid prototyping, MVP builds" },
    ],
    kpis: ["Experiments launched", "Prototype-to-production rate", "Innovation adoption", "Time to prototype"],
    status: "ACTIVE",
  },
  {
    id: "comply-pmo",
    code: "COMPLY-PMO",
    fullName: "Compliance PMO",
    mission:
      "Enforce KYB policies, manage audit trails, and maintain security boundaries across all agents.",
    director: {
      name: "CISO_Ang",
      title: "Chief Information Security Officer",
      scope: "KYB enforcement, permissions, sandbox boundaries, audit trails",
    },
    team: [
      { name: "Audit Analyst", title: "Audit Analyst", role: "Compliance auditing, regulatory tracking" },
      { name: "Risk Assessor", title: "Risk Assessor", role: "Threat modeling, mitigation" },
      { name: "Data Guardian", title: "Data Guardian", role: "PII protection, data governance" },
    ],
    kpis: ["Compliance score", "Audit pass rate", "Risk mitigation coverage", "Security incident rate"],
    status: "ACTIVE",
  },
  {
    id: "growth-pmo",
    code: "GROWTH-PMO",
    fullName: "Growth PMO",
    mission:
      "Accelerate revenue growth, user acquisition, and strategic partnerships.",
    director: {
      name: "CGO_Ang",
      title: "Chief Growth Officer",
      scope: "Revenue growth, user acquisition, partnerships",
    },
    team: [
      { name: "Growth Hacker", title: "Growth Hacker", role: "Acquisition funnels, conversion optimization" },
      { name: "Partnership Manager", title: "Partnership Manager", role: "Strategic partnerships, co-marketing" },
      { name: "Customer Success Lead", title: "Customer Success Lead", role: "Retention, onboarding, NPS" },
    ],
    kpis: ["User acquisition rate", "Revenue growth", "Customer retention", "NPS score"],
    status: "ACTIVE",
  },
];

/* ------------------------------------------------------------------ */
/*  Command Chain Steps                                                */
/* ------------------------------------------------------------------ */

const COMMAND_CHAIN = [
  "User",
  "ACHEEVY",
  "PMO Director",
  "Team",
  "Boomer_Angs",
  "Execution",
];

/* ------------------------------------------------------------------ */
/*  Page Component (RSC — no "use client")                             */
/* ------------------------------------------------------------------ */

export default function ProjectManagementPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* ---- Header ---- */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/50 mb-1">
            Governance &middot; Strategy &middot; Execution
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-amber-50 font-display">
            PROJECT MANAGEMENT
          </h1>
          <p className="text-sm text-amber-100/70 mt-1">
            PMO Offices &mdash; Governance, Strategy, and Execution
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/5 bg-black/60 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] uppercase font-bold text-emerald-400/80 tracking-widest">
            {PMO_OFFICES.length} OFFICES ONLINE
          </span>
        </div>
      </header>

      {/* ---- PMO Grid ---- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PMO_OFFICES.map((office) => (
          <div
            key={office.id}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl transition-all hover:border-amber-300/30 hover:bg-black/80"
          >
            {/* Office Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-amber-50 font-display">
                  {office.code}
                </h3>
                <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mt-0.5">
                  {office.fullName}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400">
                  {office.status}
                </span>
              </div>
            </div>

            {/* Mission */}
            <p className="mt-3 text-xs text-amber-100/60 leading-relaxed">
              {office.mission}
            </p>

            {/* Director */}
            <div className="mt-4 rounded-xl bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-widest text-amber-200/90 font-semibold">
                Director
              </p>
              <p className="text-sm font-medium text-amber-50 mt-1 font-mono">
                {office.director.name}
              </p>
              <p className="text-[10px] text-amber-100/50 mt-0.5">
                {office.director.title}
              </p>
              <p className="text-[10px] text-amber-100/40 italic mt-0.5">
                {office.director.scope}
              </p>
            </div>

            {/* Team */}
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-widest text-amber-200/90 font-semibold mb-2">
                Team
              </p>
              <div className="space-y-1.5">
                {office.team.map((member) => (
                  <div
                    key={member.name}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-black/40 px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-medium text-amber-50 font-mono">
                        {member.name}
                      </p>
                      <p className="text-[10px] text-amber-100/40">
                        {member.title}
                      </p>
                    </div>
                    <p className="text-[9px] text-amber-100/30 max-w-[120px] text-right">
                      {member.role}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* KPIs */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {office.kpis.map((kpi) => (
                <span
                  key={kpi}
                  className="rounded-full border border-white/5 bg-white/5 px-2.5 py-1 text-[9px] text-amber-100/60 uppercase tracking-wider"
                >
                  {kpi}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ---- ACHEEVY Command Chain Banner ---- */}
      <section className="rounded-3xl border border-amber-300/20 bg-gradient-to-r from-amber-400/10 to-transparent p-1 transition-all">
        <div className="rounded-[21px] bg-black/80 p-6 md:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
            ACHEEVY Command Chain
          </h2>
          <p className="mt-1 text-[10px] text-amber-100/40 uppercase tracking-wider">
            Request lifecycle from user intent to execution
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 md:gap-0">
            {COMMAND_CHAIN.map((step, i) => (
              <React.Fragment key={step}>
                <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-amber-50 font-mono">
                  {step}
                </div>
                {i < COMMAND_CHAIN.length - 1 && (
                  <span className="hidden md:block text-amber-300/60 mx-2 text-lg select-none">
                    &rarr;
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>

          <p className="mt-5 text-center text-[10px] text-amber-100/30 italic">
            Every request is routed through the governance layer before reaching execution agents.
          </p>
        </div>
      </section>
    </div>
  );
}
