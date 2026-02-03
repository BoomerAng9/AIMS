// frontend/app/dashboard/ai-plugs/page.tsx
export default function AiPlugsPage() {
  const plugs = [
    { title: "Standard Plug", weight: "Light", color: "sky", price: "$0.00", desc: "Basic automation and connectivity." },
    { title: "Crystal Plug", weight: "Medium", color: "amber", price: "$19.00", desc: "Advanced reasoning and multi-tool access." },
    { title: "Heavy Plug", weight: "Heavy", color: "violet", price: "$99.00", desc: "Full autonomous execution and large context." },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-amber-50 font-display">
          AIPLUGS
        </h1>
        <p className="text-sm text-amber-100/70">
          Deploy specialized capability modules to your workspace.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plugs.map((plug) => (
          <div key={plug.title} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-6 shadow-2xl transition-all hover:border-amber-300/40 hover:bg-black/80">
            {/* Visual indicator (crystal effect placeholder) */}
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-${plug.color}-500/10 blur-3xl group-hover:bg-${plug.color}-500/20 transition-all`} />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-amber-50/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-200/80">
                  {plug.weight}
                </span>
                <span className="text-lg font-mono font-bold text-amber-50">{plug.price}</span>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-amber-50">{plug.title}</h3>
                <p className="mt-2 text-sm text-amber-100/60 leading-relaxed">
                  {plug.desc}
                </p>
              </div>

              <button className="w-full rounded-2xl bg-white/5 py-3 text-sm font-semibold text-amber-50 transition-all hover:bg-amber-300 hover:text-black">
                Deploy Plug
              </button>
            </div>
          </div>
        ))}
        
        {/* Empty state / Build your own */}
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-amber-100/30">
          <div className="h-12 w-12 rounded-full border border-dashed border-white/20 flex items-center justify-center text-xl">+</div>
          <p className="mt-4 text-sm">Need something custom?</p>
          <button className="mt-2 text-xs text-amber-300 hover:underline">Request a Custom Plug</button>
        </div>
      </div>
    </div>
  );
}
