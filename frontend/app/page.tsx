import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Zap,
  Users,
  BarChart3,
  Shield,
  MessageSquare,
  Layers,
  ChevronRight,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   A.I.M.S. Landing Page — v2
   Nothing-brand wireframe minimal · High contrast · Mobile-first
   ═══════════════════════════════════════════════════════════ */

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* ── Navigation ──────────────────────────────────────── */}
      <Nav />

      {/* ── Hero ────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── How It Works ────────────────────────────────────── */}
      <HowItWorksSection />

      {/* ── Use Cases ───────────────────────────────────────── */}
      <UseCasesSection />

      {/* ── Social Proof / Numbers ──────────────────────────── */}
      <NumbersSection />

      {/* ── Final CTA ───────────────────────────────────────── */}
      <FinalCTASection />

      {/* ── Footer ──────────────────────────────────────────── */}
      <Footer />
    </main>
  );
}

/* ─── Nav ──────────────────────────────────────────────────── */

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/logos/achievemor-gold.png"
            alt="A.I.M.S."
            width={120}
            height={32}
            className="h-7 w-auto"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#how-it-works" className="text-sm text-white/60 hover:text-white transition-colors">
            How It Works
          </a>
          <a href="#use-cases" className="text-sm text-white/60 hover:text-white transition-colors">
            Solutions
          </a>
          <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors">
            Pricing
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm text-white/70 hover:text-white transition-colors hidden sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="btn-primary text-xs h-9 px-4"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─── Hero ─────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06)_0%,transparent_70%)]" />

      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.05] px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" />
            <span className="text-xs font-medium text-gold/90">
              The Hybrid Business Architect
            </span>
          </div>

          {/* Headline */}
          <h1 className="max-w-4xl font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-balance">
            Your AI Team.{" "}
            <span className="text-gold-gradient">Always On.</span>
            <br className="hidden sm:block" />
            Always Working.
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-2xl text-lg text-white/60 leading-relaxed sm:text-xl">
            ACHEEVY orchestrates a team of expert AI agents — Boomer_Angs — to
            handle your CRM, automation, finance, research, and operations.
            Think it. Prompt it. Let ACHEEVY manage it.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/sign-up" className="btn-primary h-12 px-8 text-sm">
              Start with ACHEEVY
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#how-it-works" className="btn-secondary h-12 px-8 text-sm">
              See How It Works
            </Link>
          </div>

          {/* Trust line */}
          <p className="mt-12 text-xs text-white/30 tracking-wide uppercase">
            Sandbox-ready &middot; Voice-enabled &middot; Enterprise-grade security
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─────────────────────────────────────────── */

function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "You prompt",
      description:
        "Describe what you need in natural language — a marketing plan, a CRM pipeline, a financial forecast.",
    },
    {
      step: "02",
      title: "ACHEEVY orchestrates",
      description:
        "Your AI architect breaks the task down, assigns it to the right Boomer_Ang agents, and manages execution.",
    },
    {
      step: "03",
      title: "Agents deliver",
      description:
        "Specialized agents execute in parallel — research, build, analyze, design — and report back with evidence.",
    },
    {
      step: "04",
      title: "You review",
      description:
        "Everything comes back verified through our 7-gate quality system. No proof, no done.",
    },
  ];

  return (
    <section id="how-it-works" className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-gold/60 mb-3">
            How It Works
          </p>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            From prompt to production
          </h2>
          <p className="mt-4 text-white/50 max-w-xl mx-auto">
            A.I.M.S. turns your ideas into executed outcomes through intelligent
            agent orchestration.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <div
              key={item.step}
              className="wireframe-card p-6 flex flex-col"
            >
              <span className="font-mono text-xs text-gold/50 mb-3">
                {item.step}
              </span>
              <h3 className="text-lg font-semibold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-white/50 leading-relaxed flex-1">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Flow diagram */}
        <div className="mt-12 flex items-center justify-center gap-3 text-xs text-white/40">
          <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5">
            You
          </span>
          <ChevronRight className="w-4 h-4 text-gold/40" />
          <span className="rounded-lg border border-gold/20 bg-gold/[0.05] px-3 py-1.5 text-gold/80">
            ACHEEVY
          </span>
          <ChevronRight className="w-4 h-4 text-gold/40" />
          <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5">
            Boomer_Angs
          </span>
          <ChevronRight className="w-4 h-4 text-gold/40" />
          <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5">
            Results
          </span>
        </div>
      </div>
    </section>
  );
}

/* ─── Use Cases ────────────────────────────────────────────── */

function UseCasesSection() {
  const cases = [
    {
      icon: MessageSquare,
      title: "CRM & Client Management",
      description:
        "AI agents manage your leads, follow-ups, and client relationships around the clock.",
    },
    {
      icon: Zap,
      title: "Workflow Automation",
      description:
        "Build and deploy n8n-powered workflows through natural language. No drag-and-drop required.",
    },
    {
      icon: BarChart3,
      title: "Finance & Analytics",
      description:
        "Real-time dashboards, LUC token economics, and AI-powered financial forecasting.",
    },
    {
      icon: Users,
      title: "Team of Specialists",
      description:
        "25 Boomer_Ang agents across 8 PMO offices — research, design, code, operations, and more.",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description:
        "Sandboxed execution, 7-gate verification, and evidence-based completion for every task.",
    },
    {
      icon: Layers,
      title: "Plug Marketplace",
      description:
        "Deploy pre-built apps (Plugs) or have ACHEEVY build custom solutions for your business.",
    },
  ];

  return (
    <section id="use-cases" className="border-t border-white/[0.06] bg-[#080808]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-gold/60 mb-3">
            Solutions
          </p>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            One platform, every department
          </h2>
          <p className="mt-4 text-white/50 max-w-xl mx-auto">
            Replace scattered tools with a unified AI workforce that handles
            the full spectrum of business operations.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((item) => (
            <div
              key={item.title}
              className="group wireframe-card p-6 hover:border-gold/20 transition-all duration-300"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] group-hover:border-gold/20 group-hover:bg-gold/[0.05] transition-colors">
                <item.icon className="h-5 w-5 text-white/50 group-hover:text-gold/70 transition-colors" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-white/50 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Numbers ──────────────────────────────────────────────── */

function NumbersSection() {
  const stats = [
    { value: "25", label: "AI Agents" },
    { value: "8", label: "PMO Offices" },
    { value: "7", label: "Quality Gates" },
    { value: "24/7", label: "Always On" },
  ];

  return (
    <section className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-4xl font-bold text-gold sm:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-white/50">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ────────────────────────────────────────────── */

function FinalCTASection() {
  return (
    <section className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="wireframe-card relative overflow-hidden p-8 sm:p-12 lg:p-16 text-center">
          {/* Background accent */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.05)_0%,transparent_60%)]" />

          <div className="relative">
            <h2 className="font-display text-3xl font-bold sm:text-4xl mb-4">
              Ready to meet your AI team?
            </h2>
            <p className="text-white/50 max-w-lg mx-auto mb-8">
              Start with ACHEEVY today. Your first conversation is free — no
              credit card, no commitment.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row justify-center">
              <Link href="/sign-up" className="btn-primary h-12 px-8 text-sm">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/sign-in" className="btn-secondary h-12 px-8 text-sm">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ───────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Left */}
          <div className="flex items-center gap-3">
            <Image
              src="/images/logos/achievemor-gold.png"
              alt="A.I.M.S."
              width={100}
              height={28}
              className="h-6 w-auto opacity-60"
            />
            <span className="text-xs text-white/30">AI Managed Solutions</span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6 text-xs text-white/40">
            <Link href="/terms" className="hover:text-white/70 transition-colors">
              Terms
            </Link>
            <Link href="/about" className="hover:text-white/70 transition-colors">
              About
            </Link>
            <a
              href="https://discord.gg/aims"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/70 transition-colors"
            >
              Discord
            </a>
          </nav>

          {/* Right */}
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} Plugmein.cloud
          </p>
        </div>
      </div>
    </footer>
  );
}
