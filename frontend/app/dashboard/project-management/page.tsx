// frontend/app/dashboard/project-management/page.tsx
import React from "react";

/* ------------------------------------------------------------------ */
/*  PMO Office Data                                                    */
/* ------------------------------------------------------------------ */

interface PMOOffice {
  id: string;
  code: string;
  fullName: string;
  mission: string;
  director: { name: string; title: string; scope: string };
  departmentalAgent: { name: string; role: string };
  kpis: string[];
  status: "ACTIVE" | "STANDBY";
}

const PMO_OFFICES: PMOOffice[] = [
  {
    id: "tech-office", code: "TECH OFFICE", fullName: "Chief Technology Office",
    mission: "Architect platform infrastructure, agent design, and technology standards.",
    director: { name: "Boomer_CTO", title: "Chief Technology Officer", scope: "Architecture, stack alignment, infrastructure" },
    departmentalAgent: { name: "DevOps Agent", role: "CI/CD, containers, deployment automation" },
    kpis: ["Deployment frequency", "System uptime", "Build success rate", "Infra cost"],
    status: "ACTIVE",
  },
  {
    id: "finance-office", code: "FINANCE OFFICE", fullName: "Chief Financial Office",
    mission: "Manage budgets, cost tracking, token efficiency, and LUC alignment.",
    director: { name: "Boomer_CFO", title: "Chief Financial Officer", scope: "Token efficiency, LUC governance, budget allocation" },
    departmentalAgent: { name: "Value Agent", role: "Cost analysis, ROI modeling, pricing optimization" },
    kpis: ["Cost per task", "Token efficiency", "Budget utilization", "Revenue growth"],
    status: "ACTIVE",
  },
  {
    id: "ops-office", code: "OPS OFFICE", fullName: "Chief Operations Office",
    mission: "Ensure operational excellence, throughput, and SLA compliance across all pipelines.",
    director: { name: "Boomer_COO", title: "Chief Operating Officer", scope: "Runtime health, throughput, SLAs" },
    departmentalAgent: { name: "Flow Boss Agent", role: "Workflow orchestration, load balancing, queue management" },
    kpis: ["Pipeline throughput", "SLA compliance", "Mean time to resolution", "Agent utilization"],
    status: "ACTIVE",
  },
  {
    id: "marketing-office", code: "MARKETING OFFICE", fullName: "Chief Marketing Office",
    mission: "Drive user acquisition, brand strategy, content creation, and campaign management.",
    director: { name: "Boomer_CMO", title: "Chief Marketing Officer", scope: "Brand strategy, campaigns, content marketing" },
    departmentalAgent: { name: "Social Campaign Agent", role: "Social media campaigns, ad copy, conversion funnels" },
    kpis: ["User acquisition rate", "Campaign ROI", "Conversion rate", "Brand awareness"],
    status: "ACTIVE",
  },
  {
    id: "design-office", code: "DESIGN OFFICE", fullName: "Chief Design Office",
    mission: "Own visual identity, UI/UX design, multimedia production, and creative direction.",
    director: { name: "Boomer_CDO", title: "Chief Design Officer", scope: "Visual identity, UI/UX, multimedia production" },
    departmentalAgent: { name: "Video Editing Agent", role: "Video production, motion graphics, visual assets" },
    kpis: ["Design consistency", "Asset production rate", "Visual quality", "Brand compliance"],
    status: "ACTIVE",
  },
  {
    id: "publishing-office", code: "PUBLISHING OFFICE", fullName: "Chief Publication Office",
    mission: "Manage content publishing, editorial standards, and audience engagement.",
    director: { name: "Boomer_CPO", title: "Chief Publication Officer", scope: "Content publishing, distribution, audience engagement" },
    departmentalAgent: { name: "Social Agent", role: "Content scheduling, community management, cross-platform publishing" },
    kpis: ["Publishing cadence", "Engagement rate", "Audience growth", "Content quality"],
    status: "ACTIVE",
  },
  {
    id: "hr-office", code: "HR OFFICE", fullName: "Chief Human Resources Office",
    mission: "Manage talent acquisition, team culture, performance reviews, and agent workforce planning.",
    director: { name: "Boomer_CHRO", title: "Chief Human Resources Officer", scope: "Talent strategy, workforce planning, agent onboarding" },
    departmentalAgent: { name: "Talent Agent", role: "Recruitment automation, skill matching, onboarding workflows" },
    kpis: ["Agent utilization", "Onboarding speed", "Skill coverage", "Team satisfaction"],
    status: "ACTIVE",
  },
  {
    id: "sales-office", code: "SALES OFFICE", fullName: "Chief Sales Office",
    mission: "Drive revenue growth, manage sales pipelines, and optimize conversion funnels.",
    director: { name: "Boomer_CSO", title: "Chief Sales Officer", scope: "Revenue targets, pipeline management, deal closing" },
    departmentalAgent: { name: "Deal Closer Agent", role: "Lead qualification, proposal generation, follow-up automation" },
    kpis: ["Revenue growth", "Pipeline velocity", "Conversion rate", "Deal size"],
    status: "ACTIVE",
  },
  {
    id: "digital-transformation-office", code: "DIGITAL TRANSFORMATION", fullName: "Chief Digital Transformation Office",
    mission: "Lead innovation initiatives, digital strategy, and modernization of legacy processes.",
    director: { name: "Boomer_CDTO", title: "Chief Digital Transformation Officer", scope: "Innovation strategy, process automation, digital roadmap" },
    departmentalAgent: { name: "Innovation Agent", role: "Process analysis, automation opportunities, technology scouting" },
    kpis: ["Automation rate", "Process efficiency", "Innovation pipeline", "Digital adoption"],
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
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold/50 mb-1">
            Governance &middot; Strategy &middot; Execution
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-display">
            PROJECT MANAGEMENT
          </h1>
          <p className="text-sm text-white/50 mt-2 max-w-lg">
            PMO Offices &mdash; 9 C-Suite Boomer_Ang directors governing all operations.
            Every request flows through the command chain before reaching execution.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-wireframe-stroke bg-black/60 px-4 py-2">
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
            className="group relative overflow-hidden rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl transition-all hover:border-gold/20 hover:bg-black/80"
          >
            {/* Office Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white font-display">
                  {office.code}
                </h3>
                <p className="text-[10px] uppercase tracking-wider text-white/30 mt-0.5">
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
            <p className="mt-3 text-xs text-white/50 leading-relaxed">
              {office.mission}
            </p>

            {/* Director */}
            <div className="mt-4 rounded-xl bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-widest text-white/80 font-semibold">
                Director
              </p>
              <p className="text-sm font-medium text-white mt-1 font-mono">
                {office.director.name}
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">
                {office.director.title}
              </p>
              <p className="text-[10px] text-white/30 italic mt-0.5">
                {office.director.scope}
              </p>
            </div>

            {/* Departmental Agent */}
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-widest text-white/80 font-semibold mb-2">
                Departmental Agent
              </p>
              <div className="flex items-center justify-between rounded-lg border border-wireframe-stroke bg-black/40 px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-white font-mono">
                    {office.departmentalAgent.name}
                  </p>
                </div>
                <p className="text-[9px] text-white/20 max-w-[160px] text-right">
                  {office.departmentalAgent.role}
                </p>
              </div>
            </div>

            {/* KPIs */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {office.kpis.map((kpi) => (
                <span
                  key={kpi}
                  className="rounded-full border border-wireframe-stroke bg-white/5 px-2.5 py-1 text-[9px] text-white/50 uppercase tracking-wider"
                >
                  {kpi}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ---- ACHEEVY Command Chain Banner ---- */}
      <section className="rounded-3xl border border-gold/20 bg-gradient-to-r from-gold/10 to-transparent p-1 transition-all">
        <div className="rounded-[21px] bg-black/80 p-6 md:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
            ACHEEVY Command Chain
          </h2>
          <p className="mt-1 text-[10px] text-white/30 uppercase tracking-wider">
            Request lifecycle from user intent to execution
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 md:gap-0">
            {COMMAND_CHAIN.map((step, i) => (
              <React.Fragment key={step}>
                <div className="flex items-center justify-center rounded-xl border border-wireframe-stroke bg-white/5 px-4 py-2.5 text-xs font-semibold text-white font-mono">
                  {step}
                </div>
                {i < COMMAND_CHAIN.length - 1 && (
                  <span className="hidden md:block text-gold mx-2 text-lg select-none">
                    &rarr;
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>

          <p className="mt-5 text-center text-[10px] text-white/20 italic">
            Every request is routed through the governance layer before reaching execution agents.
          </p>
        </div>
      </section>
    </div>
  );
}
