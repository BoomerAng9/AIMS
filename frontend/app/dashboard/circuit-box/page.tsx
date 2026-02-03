// frontend/app/dashboard/circuit-box/page.tsx
export default function CircuitBoxPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-amber-50 font-display">
            CIRCUIT BOX
          </h1>
          <p className="text-sm text-amber-100/70">
            Configure ACHEEVY orchestrator and BoomerAng routing.
          </p>
        </div>
        <button className="rounded-full bg-amber-300 px-4 py-2 text-xs font-semibold text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]">
          Save Configuration
        </button>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Orchestrator Config */}
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
            ACHEEVY Core
          </h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-amber-100/60 uppercase tracking-wider">Reasoning Model</label>
              <select className="w-full rounded-xl border border-white/5 bg-black/80 p-2.5 text-sm text-amber-50 outline-none focus:border-amber-300">
                <option>Kimi K2.5 (Primary)</option>
                <option>Gemini 1.5 Pro (Fallback)</option>
                <option>Claude 3.5 Sonnet</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-amber-100/60 uppercase tracking-wider">System Instructions</label>
              <textarea 
                className="w-full h-32 rounded-xl border border-white/5 bg-black/80 p-3 text-sm text-amber-50 outline-none focus:border-amber-300"
                defaultValue="You are ACHEEVY, the lead orchestrator for A.I.M.S. Your primary goal is to maintain business architecture integrity while delegating discrete tasks to BoomerAngs..."
              />
            </div>
          </div>
        </section>

        {/* BoomerAng Routing */}
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
            BoomerAng Routing
          </h2>
          <div className="mt-4 space-y-3">
            {[
              { role: "EngineerAng", status: "Active", tasks: "Refactoring, UI implementation" },
              { role: "MarketerAng", status: "Active", tasks: "Content generation, SEO" },
              { role: "QualityAng", status: "Standby", tasks: "ORACLE verification gates" },
            ].map((ang) => (
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
            <button className="w-full mt-2 rounded-xl border border-dashed border-white/20 p-3 text-xs text-amber-100/40 hover:border-amber-300/40 hover:text-amber-300 transition-all">
              + Spawn New BoomerAng
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
