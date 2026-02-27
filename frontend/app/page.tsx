"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  Bot,
  Globe,
  Shield,
  Zap,
  Cpu,
  MonitorCheck,
  Layers,
  ChevronRight,
  Play,
  Sparkles,
  Workflow,
  BarChart3,
  Lock,
  Cloud,
  Menu,
  X,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   A.I.M.S. Landing Page — Loopra AI Automation Theme

   Aesthetic: Dark · Gold/Amber gradients · Glassmorphism
   Inspired by: Loopra AI Automation (aura.build)
   Accents: Amber (#F59E0B) → Cyan (#06B6D4)
   Cards: Frosted glass with gradient borders
   ═══════════════════════════════════════════════════════════ */

// ── Fade-in animation helper ──
function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Animated gradient border card ──
function GlassCard({
  children,
  className = "",
  glowColor = "amber",
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: "amber" | "cyan" | "mixed";
}) {
  const colors = {
    amber: "from-amber-500/20 via-transparent to-amber-500/20",
    cyan: "from-cyan-500/20 via-transparent to-cyan-500/20",
    mixed: "from-amber-500/20 via-cyan-500/10 to-amber-500/20",
  };
  return (
    <div className={`relative group ${className}`}>
      {/* Animated gradient border */}
      <div
        className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r ${colors[glowColor]} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]`}
      />
      {/* Card body */}
      <div className="relative rounded-2xl border border-white/[0.06] bg-[#111113]/80 backdrop-blur-xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// ── Floating orb background ──
function AmbientOrbs() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-grid opacity-40" />
      {/* Primary amber orb — top center */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)]" />
      {/* Secondary cyan orb — bottom left */}
      <div className="absolute bottom-0 -left-20 w-[600px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)]" />
      {/* Tertiary amber orb — right */}
      <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.04)_0%,transparent_70%)]" />
      {/* Vignette */}
      <div className="absolute inset-0 vignette-overlay" />
    </div>
  );
}

// ── Data ──
const DEPLOY_CATEGORIES = [
  {
    icon: Boxes,
    title: "Open Source Tools",
    description:
      "Deploy popular tools like n8n, Gitea, Metabase, and more with one click. Pre-configured and production-ready.",
    items: ["n8n", "Gitea", "Metabase", "Uptime Kuma"],
    gradient: "from-amber-500/10 to-transparent",
  },
  {
    icon: Bot,
    title: "AI Agents & Models",
    description:
      "Run AI assistants, chatbots, and model endpoints. GPU-accelerated inference available.",
    items: ["Custom Chatbots", "RAG Pipelines", "Model Endpoints", "Agent Swarms"],
    gradient: "from-cyan-500/10 to-transparent",
  },
  {
    icon: Globe,
    title: "Full-Stack Apps",
    description:
      "Ship complete web applications with frontend, backend, and database. Auto-configured networking.",
    items: ["Next.js", "Express + Postgres", "Django", "Rails"],
    gradient: "from-amber-500/10 to-transparent",
  },
  {
    icon: Layers,
    title: "Custom Platforms",
    description:
      "Build and deploy your own multi-service platforms. Container orchestration handled for you.",
    items: ["Marketplaces", "SaaS Products", "Internal Tools", "API Gateways"],
    gradient: "from-cyan-500/10 to-transparent",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Describe",
    description:
      "Tell us what you need in plain language. Choose from our catalog or describe a custom deployment.",
    icon: Sparkles,
  },
  {
    step: "02",
    title: "Deploy",
    description:
      "We provision containers, configure networking, set up SSL, and handle the entire infrastructure.",
    icon: Cloud,
  },
  {
    step: "03",
    title: "Manage",
    description:
      "Monitor health, scale resources, and manage the lifecycle — all orchestrated by AI.",
    icon: BarChart3,
  },
];

const CAPABILITIES = [
  {
    icon: Zap,
    title: "One-Click Deploy",
    desc: "From idea to running service in under 60 seconds. No DevOps required.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    desc: "Auto-SSL, isolated containers, firewall rules, and continuous security monitoring.",
  },
  {
    icon: Cpu,
    title: "AI-Orchestrated",
    desc: "Autonomous health checks, scaling decisions, and incident response — 24/7.",
  },
  {
    icon: MonitorCheck,
    title: "Full Lifecycle",
    desc: "Create, configure, deploy, monitor, scale, and decommission — all managed.",
  },
  {
    icon: Workflow,
    title: "Workflow Automation",
    desc: "Chain services together with event-driven automations and CI/CD pipelines.",
  },
  {
    icon: Lock,
    title: "Human-in-the-Loop",
    desc: "Critical actions require your approval. Full audit trail for every operation.",
  },
];

const LOGOS = [
  "Docker", "Kubernetes", "NGINX", "PostgreSQL", "Redis", "Node.js",
];

// ── Scroll Progress ──
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[60]"
      style={{
        scaleX: scrollYProgress,
        background: "linear-gradient(90deg, #F59E0B, #06B6D4)",
      }}
    />
  );
}

// ── Main Page ──
export default function HomePage() {
  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(heroProgress, [0, 1], ["0%", "15%"]);

  return (
    <main className="relative min-h-screen bg-[#09090B] text-zinc-100 selection:bg-amber-500/20">
      <ScrollProgress />
      <AmbientOrbs />

      <div className="relative z-10">
        {/* ── Navigation ── */}
        <Nav />

        {/* ══════════════════════════════════════════════════════
            HERO — Centered, gradient text, floating orbs
           ══════════════════════════════════════════════════════ */}
        <section
          ref={heroRef}
          className="relative min-h-[92vh] flex items-center justify-center px-4 md:px-6"
        >
          <motion.div
            style={{ opacity: heroOpacity, y: heroY }}
            className="max-w-5xl mx-auto text-center"
          >
            {/* Status badge */}
            <FadeIn>
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-amber-500/20 bg-amber-500/[0.05] mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inset-0 rounded-full bg-amber-400 opacity-75" />
                  <span className="relative rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <span className="text-xs font-medium text-amber-300">
                  Platform Live &middot; AI-Powered Infrastructure
                </span>
              </div>
            </FadeIn>

            {/* Headline */}
            <FadeIn delay={0.1}>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6">
                Automate Your
                <br />
                <span className="text-aurora-gradient">Infrastructure.</span>
              </h1>
            </FadeIn>

            {/* Subhead */}
            <FadeIn delay={0.2}>
              <p className="text-lg sm:text-xl md:text-2xl text-zinc-300 max-w-2xl mx-auto leading-relaxed mb-10">
                One-click deployment of open source tools, AI agents, and
                full-stack platforms. Provisioned, configured, and managed
                by autonomous AI.
              </p>
            </FadeIn>

            {/* CTAs */}
            <FadeIn delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/chat"
                  className="group h-13 px-8 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-base inline-flex items-center gap-2.5 hover:from-amber-500 hover:to-amber-400 transition-all hover:shadow-lg hover:shadow-amber-500/25"
                >
                  Start Deploying
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="group h-13 px-8 rounded-xl border border-white/10 text-zinc-300 font-semibold text-base inline-flex items-center gap-2.5 hover:border-amber-500/30 hover:bg-amber-500/[0.04] transition-all"
                >
                  See How It Works
                  <Play className="w-3.5 h-3.5" />
                </Link>
              </div>
            </FadeIn>

            {/* Stats strip */}
            <FadeIn delay={0.4}>
              <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
                {[
                  { value: "17+", label: "Services Running" },
                  { value: "<60s", label: "Deploy Time" },
                  { value: "99.9%", label: "Uptime SLA" },
                  { value: "24/7", label: "AI Monitoring" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-aurora-gradient">{stat.value}</div>
                    <div className="text-sm font-medium text-zinc-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════
            TRUSTED BY — Logo cloud
           ══════════════════════════════════════════════════════ */}
        <section className="py-16 px-4 md:px-6 border-y border-white/[0.04]">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <p className="text-center text-xs font-medium text-zinc-600 uppercase tracking-widest mb-8">
                Built on enterprise infrastructure
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
                {LOGOS.map((name) => (
                  <span
                    key={name}
                    className="text-sm font-medium text-zinc-600 hover:text-zinc-400 transition-colors cursor-default"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            HOW IT WORKS — 3-step with gradient accents
           ══════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="py-28 px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <div className="text-center mb-20">
                <p className="text-base font-semibold text-amber-400 mb-3">
                  How It Works
                </p>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight">
                  Three Steps to{" "}
                  <span className="text-aurora-gradient">Live</span>
                </h2>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map((item, i) => (
                <FadeIn key={item.step} delay={i * 0.1}>
                  <GlassCard glowColor={i === 1 ? "cyan" : "amber"}>
                    <div className="relative p-8">
                      {/* Step number watermark */}
                      <span className="text-6xl font-bold text-white/[0.03] absolute top-4 right-6 font-display">
                        {item.step}
                      </span>
                      <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/15 to-cyan-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
                          <item.icon className="w-5 h-5 text-amber-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                        <p className="text-base font-medium text-zinc-400 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      {/* Connector line */}
                      {i < 2 && (
                        <div className="hidden md:block absolute top-1/2 -right-3 w-6 border-t border-dashed border-amber-500/20" />
                      )}
                    </div>
                  </GlassCard>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            WHAT YOU CAN DEPLOY — Category grid with glass cards
           ══════════════════════════════════════════════════════ */}
        <section className="py-28 px-4 md:px-6 relative">
          {/* Section ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.04)_0%,transparent_70%)] pointer-events-none" />

          <div className="max-w-6xl mx-auto relative">
            <FadeIn>
              <div className="text-center mb-20">
                <p className="text-base font-semibold text-amber-400 mb-3">
                  Plug Catalog
                </p>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight">
                  What You Can Deploy
                </h2>
                <p className="mt-4 text-zinc-500 max-w-xl mx-auto">
                  Browse our growing library of pre-configured deployments, or
                  describe something custom.
                </p>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-6">
              {DEPLOY_CATEGORIES.map((cat, i) => (
                <FadeIn key={cat.title} delay={i * 0.08}>
                  <GlassCard glowColor={i % 2 === 0 ? "amber" : "cyan"}>
                    <div className="group relative p-8 h-full">
                      {/* Subtle gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />

                      <div className="relative z-10">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/15 to-cyan-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
                          <cat.icon className="w-6 h-6 text-amber-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">{cat.title}</h3>
                        <p className="text-base font-medium text-zinc-400 leading-relaxed mb-5">
                          {cat.description}
                        </p>
                        {/* Item tags */}
                        <div className="flex flex-wrap gap-2">
                          {cat.items.map((item) => (
                            <span
                              key={item}
                              className="px-2.5 py-1 rounded-md bg-amber-500/[0.06] border border-amber-500/10 text-sm font-semibold text-amber-300"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      {/* Arrow */}
                      <ChevronRight className="absolute top-8 right-8 w-5 h-5 text-zinc-700 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </GlassCard>
                </FadeIn>
              ))}
            </div>

            <FadeIn delay={0.3}>
              <div className="mt-12 text-center">
                <Link
                  href="/plugs"
                  className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
                >
                  Browse Full Catalog
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            CAPABILITIES — Bento-style 3x2 grid
           ══════════════════════════════════════════════════════ */}
        <section className="py-28 px-4 md:px-6 border-y border-white/[0.04]">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <div className="text-center mb-20">
                <p className="text-base font-semibold text-amber-400 mb-3">
                  Platform
                </p>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight">
                  Built for{" "}
                  <span className="text-aurora-gradient">Production</span>
                </h2>
              </div>
            </FadeIn>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {CAPABILITIES.map((cap, i) => (
                <FadeIn key={cap.title} delay={i * 0.06}>
                  <GlassCard glowColor={i % 3 === 0 ? "amber" : i % 3 === 1 ? "cyan" : "mixed"}>
                    <div className="p-6">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/15 to-cyan-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                        <cap.icon className="w-5 h-5 text-amber-400" />
                      </div>
                      <h3 className="font-semibold mb-2">{cap.title}</h3>
                      <p className="text-base font-medium text-zinc-400 leading-relaxed">
                        {cap.desc}
                      </p>
                    </div>
                  </GlassCard>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            PHILOSOPHY — Loopra-inspired "nervous system" section
           ══════════════════════════════════════════════════════ */}
        <section className="py-28 px-4 md:px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.02] to-transparent pointer-events-none" />
          <div className="max-w-4xl mx-auto relative text-center">
            <FadeIn>
              <p className="text-sm font-bold text-amber-400 uppercase tracking-[0.25em] mb-6">
                The Philosophy
              </p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tight leading-tight">
                We build the{" "}
                <span className="text-aurora-gradient">nervous system</span>{" "}
                for the autonomous enterprise.
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="mt-8 text-base md:text-lg text-zinc-500 leading-relaxed max-w-2xl mx-auto">
                Rejecting the friction of manual orchestration, we engineer
                intelligent loops that blend data precision with infinite scale
                to accelerate and evolve.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            TESTIMONIALS — Social proof (Loopra pattern)
           ══════════════════════════════════════════════════════ */}
        <section className="py-28 px-4 md:px-6 border-y border-white/[0.04]">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <p className="text-base font-semibold text-amber-400 mb-3">
                  Testimonials
                </p>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight">
                  Trusted by Teams Who{" "}
                  <span className="text-aurora-gradient">Automate</span>
                </h2>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  quote:
                    "A.I.M.S. completely changed how we handle deployment. The autonomous orchestration saved us hundreds of engineering hours.",
                  name: "Operations Lead",
                  role: "Tech Startup",
                  glow: "amber" as const,
                },
                {
                  quote:
                    "The ability to deploy and manage containers through conversation is a game changer. We shipped 3x faster.",
                  name: "CTO",
                  role: "SaaS Platform",
                  glow: "cyan" as const,
                },
                {
                  quote:
                    "Finally, an AI platform that treats infrastructure as code. Full lifecycle management with human oversight where it matters.",
                  name: "DevOps Lead",
                  role: "Enterprise Team",
                  glow: "mixed" as const,
                },
              ].map((t, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <GlassCard glowColor={t.glow}>
                    <div className="p-8 flex flex-col h-full">
                      <p className="text-base font-medium text-zinc-400 leading-relaxed flex-1 italic">
                        &ldquo;{t.quote}&rdquo;
                      </p>
                      <div className="mt-6 pt-4 border-t border-white/[0.06]">
                        <p className="text-base font-bold text-zinc-100">
                          {t.name}
                        </p>
                        <p className="text-sm font-medium text-zinc-500">{t.role}</p>
                      </div>
                    </div>
                  </GlassCard>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FINAL CTA — Gradient border card
           ══════════════════════════════════════════════════════ */}
        <section className="py-28 px-4 md:px-6">
          <FadeIn>
            <div className="max-w-3xl mx-auto relative">
              {/* Gradient glow behind card */}
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/10 via-cyan-500/5 to-amber-500/10 rounded-[2rem] blur-2xl" />

              <div className="relative p-12 md:p-20 text-center rounded-[2rem] border border-amber-500/10 bg-[#111113]/90 backdrop-blur-xl overflow-hidden">
                {/* Ambient glow inside card */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.1)_0%,transparent_70%)] pointer-events-none" />

                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/15 to-cyan-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-8 p-1">
                    <Image
                      src="/images/acheevy/acheevy-helmet.png"
                      alt="A.I.M.S."
                      width={48}
                      height={48}
                      className="rounded-xl"
                    />
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
                    Ready to{" "}
                    <span className="text-aurora-gradient">Automate</span>?
                  </h2>
                  <p className="text-zinc-400 text-base md:text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                    Join the platform that turns ideas into running services.
                    No infrastructure headaches. No DevOps hiring.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/chat"
                      className="group h-13 px-8 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-base inline-flex items-center justify-center gap-2.5 hover:from-amber-500 hover:to-amber-400 transition-all hover:shadow-lg hover:shadow-amber-500/25"
                    >
                      Get Started Free
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <Link
                      href="/(auth)/sign-up"
                      className="h-13 px-8 rounded-xl border border-amber-500/20 text-zinc-300 font-semibold text-base inline-flex items-center justify-center gap-2.5 hover:border-amber-500/30 hover:bg-amber-500/[0.04] transition-all"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ── Footer ── */}
        <footer className="py-12 border-t border-white/[0.04] px-4 md:px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/images/acheevy/acheevy-helmet.png"
                alt="A.I.M.S."
                width={24}
                height={24}
              />
              <span className="text-xs text-zinc-500">
                &copy; {new Date().getFullYear()} ACHIEVEMOR &middot; A.I.M.S.
              </span>
            </div>
            <div className="flex gap-8 text-xs text-zinc-600">
              <Link href="/terms" className="hover:text-zinc-400 transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-zinc-400 transition-colors">
                Privacy
              </Link>
              <Link href="/pricing" className="hover:text-zinc-400 transition-colors">
                Pricing
              </Link>
              <Link href="/about" className="hover:text-zinc-400 transition-colors">
                About
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

// ── Navigation Component ──
function Nav() {
  const { scrollY } = useScroll();
  const navBorder = useTransform(scrollY, [0, 50], [0, 1]);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 h-16 flex items-center justify-center px-4 md:px-6">
        <motion.div
          className="w-full max-w-6xl flex items-center justify-between bg-[#09090B]/80 backdrop-blur-xl px-5 py-2.5 rounded-2xl"
          style={{
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: useTransform(
              navBorder,
              (v) => `rgba(139, 92, 246, ${v * 0.1})`
            ),
          }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/images/acheevy/acheevy-helmet.png"
              alt="A.I.M.S."
              width={28}
              height={28}
            />
            <span className="text-base font-bold tracking-[0.15em] font-display text-zinc-100">
              A.I.M.S.
            </span>
          </Link>

          {/* Center links — desktop */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: "/plugs", label: "Catalog" },
              { href: "#how-it-works", label: "How It Works" },
              { href: "/pricing", label: "Pricing" },
              { href: "/about", label: "About" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors rounded-lg"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <Link
              href="/(auth)/sign-in"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              href="/chat"
              className="h-9 px-4 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-semibold inline-flex items-center hover:from-amber-500 hover:to-amber-400 transition-all"
            >
              Get Started
            </Link>
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-200"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-16 left-0 right-0 z-40 bg-[#09090B]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 py-6"
        >
          <div className="flex flex-col gap-3 max-w-6xl mx-auto">
            {[
              { href: "/plugs", label: "Catalog" },
              { href: "#how-it-works", label: "How It Works" },
              { href: "/pricing", label: "Pricing" },
              { href: "/about", label: "About" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-amber-500/[0.06] rounded-xl transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </>
  );
}
