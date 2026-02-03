// frontend/app/dashboard/page.tsx
export default function DashboardHome() {
  const tiles = [
    {
      title: "Plan",
      subtitle: "Review or upgrade your Hybrid Business Architect plan.",
      href: "/dashboard/plan",
    },
    {
      title: "aiPlugs",
      subtitle: "Spin up and manage your Workspace aiPlugs.",
      href: "/dashboard/ai-plugs",
    },
    {
      title: "BoomerAngs",
      subtitle: "Configure how ACHEEVY delegates to your agents.",
      href: "/dashboard/boomerangs",
    },
    {
      title: "Lab",
      subtitle: "Experiment with new models and workflows in the Lab.",
      href: "/dashboard/lab",
    },
    {
      title: "LUC Usage",
      subtitle: "Track token, compute, and API costs in real time.",
      href: "/dashboard/luc",
    },
    {
      title: "Circuit Box",
      subtitle: "Edit ACHEEVY and BoomerAng instructions and routing.",
      href: "/dashboard/circuit-box",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        {/* Primary glass card */}
        <div className="rounded-3xl border border-amber-50/18 bg-gradient-to-br from-white/6 via-black/80 to-black/95 p-5 text-amber-50 shadow-[0_40px_120px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-amber-200/70">
            ACHEEVY Briefing
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
            Welcome back to your command center.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-amber-100/80">
            From here, you can orchestrate BoomerAngs, deploy aiPlugs, and tune
            the Lab while LUC keeps an eye on every token you spend.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-amber-100/80">
            <span className="rounded-full border border-amber-200/30 bg-black/60 px-3 py-1">
              • ACHEEVY: orchestrator online
            </span>
            <span className="rounded-full border border-amber-200/30 bg-black/60 px-3 py-1">
              • LUC: live metering
            </span>
            <span className="rounded-full border border-amber-200/30 bg-black/60 px-3 py-1">
              • Circuit Box: config-driven
            </span>
          </div>
        </div>

        {/* Quick LUC & plan */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-amber-50/18 bg-gradient-to-br from-amber-500/10 via-black/85 to-black/95 p-4 text-amber-50 backdrop-blur-2xl">
            <p className="text-[0.7rem] uppercase tracking-[0.18em] text-amber-200/70">
              LUC Snapshot
            </p>
            <p className="mt-2 text-sm text-amber-100/80">
              Todays estimated usage
            </p>
            <p className="mt-1 text-2xl font-semibold text-amber-200">
              $0.00
            </p>
            <p className="mt-1 text-[0.8rem] text-amber-100/70">
              Live metering will appear here once your first session runs.
            </p>
          </div>

          <div className="rounded-3xl border border-amber-50/15 bg-black/80 p-4 text-amber-50 backdrop-blur-2xl">
            <p className="text-[0.7rem] uppercase tracking-[0.18em] text-amber-200/70">
              Plan
            </p>
            <p className="mt-2 text-sm text-amber-100/80">
              Youre on the Hybrid Business Architect starter plan.
            </p>
            <button className="mt-3 inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 to-amber-300 px-4 py-1.5 text-xs font-semibold text-black">
              Manage plan
            </button>
          </div>
        </div>
      </section>

      {/* Navigation tiles */}
      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <a
            key={tile.href}
            href={tile.href}
            className="group rounded-3xl border border-amber-50/14 bg-black/75 p-4 text-sm text-amber-50 shadow-[0_24px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-colors hover:border-amber-300/60 hover:bg-black/90"
          >
            <p className="text-[0.7rem] uppercase tracking-[0.18em] text-amber-200/70">
              {tile.title}
            </p>
            <p className="mt-2 text-amber-50">{tile.subtitle}</p>
            <p className="mt-3 text-[0.8rem] text-amber-100/70 group-hover:text-amber-200">
              Open {tile.title} →
            </p>
          </a>
        ))}
      </section>
    </div>
  );
}
