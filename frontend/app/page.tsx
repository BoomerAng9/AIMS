import Link from 'next/link';
import { DynamicTagline } from '@/components/DynamicTagline';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ─── Top bar ─── */}
      <header className="flex items-center justify-between px-6 md:px-12 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-sm">
            A
          </div>
          <span className="text-sm font-semibold tracking-wider text-amber-200">A.I.M.S.</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-xs text-amber-100/60 hover:text-amber-100 transition-colors tracking-wide">
            Pricing
          </Link>
          <Link href="/sign-in" className="rounded-full border border-amber-400/30 px-5 py-2 text-xs font-medium text-amber-200 hover:bg-amber-400/10 transition-colors">
            Sign In
          </Link>
          <Link href="/sign-up" className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2 text-xs font-semibold text-black hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all">
            Get Started
          </Link>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center gap-12 max-w-6xl w-full">
          {/* Left: Copy */}
          <div className="flex-1 space-y-6 text-center md:text-left">
            <p className="text-[0.7rem] uppercase tracking-[0.3em] text-amber-400/80 font-medium">
              AI Managed Solutions
            </p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-amber-50 leading-[1.1]">
              Think it. Prompt it.<br />
              Let <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">ACHEEVY</span> build it.
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-amber-100/70">
              Orchestrate Boomer_Ang agents, aiPlugs, and A.I.M.S. workflows from a
              single executive console. You stay in the loop as final approver.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start">
              <Link
                href="/sign-up"
                className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-3.5 text-sm font-bold text-black hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all transform hover:scale-105 active:scale-95"
              >
                Start my project
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-medium text-amber-100 backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                Enter Dashboard
              </Link>
            </div>
          </div>

          {/* Right: ACHEEVY image */}
          <div className="flex-1 flex justify-center">
            <div className="relative group">
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-64 h-16 bg-amber-400/15 blur-[80px] rounded-full group-hover:bg-amber-400/25 transition-all duration-700" />
              <img
                src="/images/acheevy/acheevy-office-plug.png"
                alt="ACHEEVY holding an aiPlug cube"
                className="w-full max-w-[420px] drop-shadow-[0_0_60px_rgba(0,0,0,0.9)]"
              />
            </div>
          </div>
        </div>

        {/* Dynamic tagline */}
        <div className="mt-12 w-full max-w-md">
          <DynamicTagline />
        </div>
      </section>

      {/* ─── What A.I.M.S. Does ─── */}
      <section className="px-6 md:px-12 py-20 border-t border-amber-400/5">
        <div className="max-w-6xl mx-auto">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-amber-400/60 text-center mb-3">
            The Platform
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-amber-50 text-center mb-12">
            Your AI workforce, managed.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Boomer_Ang Agents',
                desc: 'Engineer_Ang builds. Marketer_Ang grows. Analyst_Ang researches. Quality_Ang verifies. All orchestrated by ACHEEVY.',
                icon: '\u{1FA83}',
              },
              {
                title: 'aiPlugs & Shelves',
                desc: 'Digital tools that plug into your workflow. Browse, deploy, and manage from your personal Shelf.',
                icon: '\u{1F50C}',
              },
              {
                title: 'ORACLE Verification',
                desc: '7-gate methodology ensures every deliverable passes security, quality, and compliance before shipping.',
                icon: '\u{1F6E1}',
              },
              {
                title: 'Build Pipeline',
                desc: 'From intake questionnaire to deployed product. Templates, scaffolding, CI/CD \u2014 all automated.',
                icon: '\u26A1',
              },
              {
                title: 'Make It Mine',
                desc: 'White-label any Plug with your brand colors, logo, domain, and custom features.',
                icon: '\u{1F3A8}',
              },
              {
                title: '12 SOP Pillars',
                desc: 'Enterprise-grade: auth, RBAC, secrets, SBOM, sandboxing, observability, backup, and more.',
                icon: '\u{1F3D7}',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-amber-400/10 bg-black/40 p-6 backdrop-blur-sm hover:border-amber-400/25 transition-colors group"
              >
                <div className="text-3xl mb-4">{card.icon}</div>
                <h3 className="text-base font-semibold text-amber-100 mb-2 group-hover:text-amber-300 transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-amber-100/60 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Boomerang section ─── */}
      <section className="px-6 md:px-12 py-20 border-t border-amber-400/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <img
              src="/images/acheevy/acheevy-helmet.png"
              alt="ACHEEVY helmet with amber visor"
              className="w-full max-w-[280px] mx-auto drop-shadow-[0_0_40px_rgba(212,175,55,0.3)]"
            />
          </div>
          <div className="flex-1 space-y-4">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-amber-400/60">
              The Boomer_Ang Way
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-amber-50">
              They go out. They come back with the goods.
            </h2>
            <p className="text-sm text-amber-100/70 leading-relaxed">
              Boomer_Angs take the digital form of the boomerang during task execution.
              Each agent is dispatched by ACHEEVY, completes their mission autonomously,
              and returns with verified deliverables. Activity breeds Activity &mdash; but only
              when discipline holds.
            </p>
            <Link
              href="/dashboard/house-of-ang"
              className="inline-block rounded-full border border-amber-400/30 px-6 py-2.5 text-xs font-medium text-amber-200 hover:bg-amber-400/10 transition-colors mt-2"
            >
              Visit the House of Ang
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-6 md:px-12 py-20 border-t border-amber-400/5">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-amber-50">
            Ready to build?
          </h2>
          <p className="text-amber-100/60 max-w-lg mx-auto">
            Start your first project in minutes. No credit card required. ACHEEVY and the
            full Boomer_Ang team are standing by.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/sign-up"
              className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-10 py-4 text-sm font-bold text-black hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all"
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border border-white/15 bg-white/5 px-8 py-4 text-sm font-medium text-amber-100 hover:bg-white/10 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Motto ─── */}
      <div className="py-8 text-center text-[0.6rem] uppercase tracking-[0.4em] text-amber-200/20 select-none border-t border-amber-400/5">
        Activity breeds Activity.
      </div>
    </div>
  );
}
