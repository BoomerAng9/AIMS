// frontend/app/dashboard/circuit-box/page.tsx
import React from "react";

const DT_PMO_ANGS = [
  { role: "CDTO_Ang", title: "Chief Digital Transformation Officer", status: "Active", scope: "Strategy, final authority" },
  { role: "COO_Ang", title: "Chief Operating Officer", status: "Active", scope: "Runtime health, throughput, SLAs" },
  { role: "CTO_Ang", title: "Chief Technology Officer", status: "Active", scope: "Agent design, schemas, stack alignment" },
  { role: "CISO_Ang", title: "Chief Information Security Officer", status: "Active", scope: "KYB, permissions, sandbox boundaries" },
  { role: "CFO_Ang", title: "Chief Financial Officer", status: "Active", scope: "Token efficiency, LUC alignment" },
  { role: "QA_Ang", title: "Quality Assurance", status: "Active", scope: "Output verification readiness" },
];

const EXEC_BOOMERANGS = [
  { role: "EngineerAng", status: "Active", tasks: "Full-stack building, deployment" },
  { role: "MarketerAng", status: "Active", tasks: "Growth strategy, content, SEO" },
  { role: "AnalystAng", status: "Active", tasks: "Market research, competitive intel" },
  { role: "QualityAng", status: "Standby", tasks: "ORACLE verification gates" },
  { role: "Chicken Hawk", status: "Active", tasks: "Pipeline execution, multi-agent orchestration" },
];

const LIL_HAWK_SQUADS = [
  {
    squad: "PREP_SQUAD_ALPHA",
    purpose: "Pre-Execution Intelligence",
    hawks: ["INTAKE", "DECOMP", "CONTEXT", "POLICY", "COST", "ROUTER"],
  },
  {
    squad: "WORKFLOW_SMITH_SQUAD",
    purpose: "n8n Workflow Integrity",
    hawks: ["AUTHOR", "VALIDATE", "FAILURE", "GATE"],
  },
  {
    squad: "VISION_SCOUT_SQUAD",
    purpose: "Video/Footage Assessment",
    hawks: ["VISION", "SIGNAL", "COMPLIANCE"],
  },
];

export default function CircuitBoxPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-amber-50 font-display">
            CIRCUIT BOX
          </h1>
          <p className="text-sm text-amber-100/70">
            Configure ACHEEVY orchestrator, DT-PMO governance, Boomer_Ang routing, and Lil_Hawk squads.
          </p>
        </div>
        <button className="rounded-full bg-amber-300 px-4 py-2 text-xs font-semibold text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]">
          Save Configuration
        </button>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* The Park — Model Selection */}
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
            The Park
          </h2>
          <p className="mt-1 text-[0.65rem] text-amber-100/40 uppercase tracking-wider">Model Selection</p>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-amber-100/60 uppercase tracking-wider">Primary Reasoning Model</label>
              <select className="w-full rounded-xl border border-white/5 bg-black/80 p-2.5 text-sm text-amber-50 outline-none focus:border-amber-300">
                <option>Claude Opus 4.6 (Primary)</option>
                <option>Claude Sonnet 4.5 (Fast)</option>
                <option>Gemini 2.5 Pro (Fallback)</option>
                <option>Kimi K2.5 (Specialized)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-amber-100/60 uppercase tracking-wider">System Instructions</label>
              <textarea
                className="w-full h-32 rounded-xl border border-white/5 bg-black/80 p-3 text-sm text-amber-50 outline-none focus:border-amber-300"
                defaultValue="You are ACHEEVY, the lead orchestrator for A.I.M.S. Your primary goal is to maintain business architecture integrity while delegating discrete tasks to Boomer_Angs. All tasks pass through PREP_SQUAD_ALPHA before execution. Activity breeds Activity."
              />
            </div>
          </div>
        </section>

        {/* DT-PMO Supervisory Layer */}
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
            DT-PMO Governance
          </h2>
          <p className="mt-1 text-[0.65rem] text-amber-100/40 uppercase tracking-wider">Digital Transformation PMO — supervisory layer</p>
          <div className="mt-4 space-y-2">
            {DT_PMO_ANGS.map((ang) => (
              <div key={ang.role} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/40 p-3">
                <div>
                  <p className="text-xs font-medium text-amber-50">{ang.role}</p>
                  <p className="text-[10px] text-amber-100/40">{ang.scope}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[9px] uppercase font-semibold text-amber-50/60">{ang.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Execution Boomer_Angs */}
      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
          Boomer_Ang Routing
        </h2>
        <p className="mt-1 text-[0.65rem] text-amber-100/40 uppercase tracking-wider">Execution-level agents — task handlers</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXEC_BOOMERANGS.map((ang) => (
            <div key={ang.role} className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/40 p-4">
              <div>
                <p className="text-sm font-medium text-amber-50">{ang.role}</p>
                <p className="text-xs text-amber-100/50">{ang.tasks}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${ang.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className="text-[10px] uppercase font-semibold text-amber-50/70">{ang.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lil_Hawk Squads */}
      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
          Lil_Hawk Squads
        </h2>
        <p className="mt-1 text-[0.65rem] text-amber-100/40 uppercase tracking-wider">Ephemeral task-scoped specialists — shift workers</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {LIL_HAWK_SQUADS.map((squad) => (
            <div key={squad.squad} className="rounded-2xl border border-white/5 bg-black/40 p-4">
              <p className="text-xs font-semibold text-amber-200">{squad.squad}</p>
              <p className="text-[10px] text-amber-100/40 mt-0.5">{squad.purpose}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {squad.hawks.map((hawk) => (
                  <span key={hawk} className="rounded-full border border-amber-50/10 bg-amber-400/5 px-2 py-0.5 text-[9px] font-mono text-amber-100/60">
                    {hawk}_LIL_HAWK
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
