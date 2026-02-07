/* frontend/components/HeroAcheevy.tsx */
export function HeroAcheevy() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-20 md:flex-row md:items-center">
      <div className="flex-1 rounded-[40px] border border-white/5 bg-black/40 p-8 backdrop-blur-xl md:p-12 space-y-4">
        <p className="text-[0.7rem] uppercase tracking-[0.25em] text-amber-200/70 font-display">
          AI MANAGED SOLUTIONS
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-amber-50 md:text-5xl font-display leading-[1.1]">
          Think it. Prompt it.<br/>Let <span className="text-amber-300">ACHEEVY</span> build it.
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-amber-100/80">
          Orchestrate Boomer_Ang agents, aiPlugs, and A.I.M.S. workflows from a
          single executive console, while you stay in the loop as final approver.
        </p>
        <div className="flex flex-wrap gap-3 pt-4">
          <button className="rounded-full bg-gradient-to-r from-amber-400 to-amber-300 px-8 py-3 text-sm font-semibold text-black hover:shadow-[0_0_25px_rgba(251,191,36,0.4)] transition-all transform hover:scale-105 active:scale-95">
            Start my project
          </button>
          <button className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-amber-100 backdrop-blur-sm hover:bg-white/10 transition-colors">
            Watch ACHEEVY in action
          </button>
        </div>
      </div>

      <div className="flex-1 flex justify-center">
        <div className="relative group">
          {/* Subtle floor glow */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-10 bg-amber-400/20 blur-[60px] rounded-full group-hover:bg-amber-400/30 transition-all duration-700" />
          
          <img
            src="/images/acheevy/acheevy-office-plug.png"
            alt="ACHEEVY holding an aiPlug cube"
            className="w-full max-w-[480px] drop-shadow-[0_0_80px_rgba(0,0,0,0.8)] animate-float"
          />
        </div>
      </div>
    </section>
  );
}
