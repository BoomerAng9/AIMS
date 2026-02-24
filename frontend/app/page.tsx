"use client";

import { useRef, useState, useEffect } from "react";
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
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   A.I.M.S. Landing Page — Dark Premium PaaS

   Inspired by: huly.io, manus.im, devin.ai, nothing.tech,
                base44.com, hockeystack.com, kimi.com

   Theme: Near-black with amber/gold accents
   Language: Customer-facing. No internal agent names.
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

// ── Domain detection ──
function useIsShowroom(): boolean {
  const [isShowroom, setIsShowroom] = useState(false);
  useEffect(() => {
    const host = window.location.hostname.replace(/^www\./, "");
    setIsShowroom(
      host === "aimanagedsolutions.cloud" ||
        host.includes("localhost") ||
        host === "127.0.0.1"
    );
  }, []);
  return isShowroom;
}

// ── Data ──
const DEPLOY_CATEGORIES = [
  {
    icon: Boxes,
    title: "Open Source Tools",
    description:
      "Deploy popular tools like n8n, Gitea, Metabase, and more with one click. Pre-configured and production-ready.",
    items: ["n8n", "Gitea", "Metabase", "Uptime Kuma"],
  },
  {
    icon: Bot,
    title: "AI Agents & Models",
    description:
      "Run AI assistants, chatbots, and model endpoints. GPU-accelerated inference available.",
    items: ["Custom Chatbots", "RAG Pipelines", "Model Endpoints", "Agent Swarms"],
  },
  {
    icon: Globe,
    title: "Full-Stack Apps",
    description:
      "Ship complete web applications with frontend, backend, and database. Auto-configured networking.",
    items: ["Next.js", "Express + Postgres", "Django", "Rails"],
  },
  {
    icon: Layers,
    title: "Custom Platforms",
    description:
      "Build and deploy your own multi-service platforms. Container orchestration handled for you.",
    items: ["Marketplaces", "SaaS Products", "Internal Tools", "API Gateways"],
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Describe",
    description:
      "Tell us what you need in plain language. Choose from our catalog or describe a custom deployment.",
  },
  {
    step: "02",
    title: "Deploy",
    description:
      "We provision containers, configure networking, set up SSL, and handle the entire infrastructure.",
  },
  {
    step: "03",
    title: "Manage",
    description:
      "Monitor health, scale resources, and manage the lifecycle — all orchestrated by AI.",
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
];

// ── Scroll Progress ──
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-amber-500 origin-left z-[60]"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

// ── Main Page ──
export default function HomePage() {
  const isShowroom = useIsShowroom();
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

      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.06)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.04)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10">
        {/* ── Navigation ── */}
        <Nav />

        {/* ══════════════════════════════════════════════════════
            HERO — Full-viewport, centered, bold typography
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
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-medium text-zinc-400">
                  Platform Live &middot; 17 Services Running
                </span>
              </div>
            </FadeIn>

            {/* Headline */}
            <FadeIn delay={0.1}>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6">
                Deploy Anything.
                <br />
                <span className="text-gold-gradient">AI Handles the Rest.</span>
              </h1>
            </FadeIn>

            {/* Subhead */}
            <FadeIn delay={0.2}>
              <p className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
                One-click deployment of open source tools, AI agents, and
                full-stack platforms. Provisioned, configured, and managed
                autonomously.
              </p>
            </FadeIn>

            {/* CTAs */}
            <FadeIn delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/chat"
                  className="group h-13 px-8 rounded-xl bg-amber-500 text-black font-semibold text-sm inline-flex items-center gap-2.5 hover:bg-amber-400 transition-all hover:shadow-lg hover:shadow-amber-500/20"
                >
                  Start Deploying
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="group h-13 px-8 rounded-xl border border-white/10 text-zinc-300 font-medium text-sm inline-flex items-center gap-2.5 hover:border-white/20 hover:bg-white/[0.03] transition-all"
                >
                  See How It Works
                  <Play className="w-3.5 h-3.5" />
                </Link>
              </div>
            </FadeIn>

            {/* Trust line */}
            <FadeIn delay={0.4}>
              <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-zinc-600">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> SOC 2 Ready
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Sub-60s Deploys
                </span>
                <span className="flex items-center gap-1.5">
                  <MonitorCheck className="w-3.5 h-3.5" /> 99.9% Uptime
                </span>
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> GPU Available
                </span>
              </div>
            </FadeIn>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════
            HOW IT WORKS — 3-step process
           ══════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="py-28 px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <div className="text-center mb-20">
                <p className="text-sm font-medium text-amber-500 mb-3">
                  How It Works
                </p>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                  Three Steps to Live
                </h2>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map((item, i) => (
                <FadeIn key={item.step} delay={i * 0.1}>
                  <div className="relative p-8 rounded-2xl border border-white/8 bg-[#111113] group hover:border-amber-500/20 transition-all">
                    {/* Step number */}
                    <span className="text-6xl font-bold text-white/[0.04] absolute top-4 right-6 font-display">
                      {item.step}
                    </span>
                    <div className="relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
                        <span className="text-amber-500 font-bold text-sm font-display">
                          {item.step}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                      <p className="text-sm text-zinc-500 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    {/* Connector line */}
                    {i < 2 && (
                      <div className="hidden md:block absolute top-1/2 -right-3 w-6 border-t border-dashed border-white/10" />
                    )}
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            WHAT YOU CAN DEPLOY — Category grid
           ══════════════════════════════════════════════════════ */}
        <section className="py-28 px-4 md:px-6 border-y border-white/8 bg-[#0D0D10]">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <div className="text-center mb-20">
                <p className="text-sm font-medium text-amber-500 mb-3">
                  Plug Catalog
                </p>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
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
                  <div className="group relative p-8 rounded-2xl border border-white/8 bg-[#111113] hover:border-amber-500/20 transition-all h-full">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
                      <cat.icon className="w-6 h-6 text-amber-500" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{cat.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed mb-5">
                      {cat.description}
                    </p>
                    {/* Item tags */}
                    <div className="flex flex-wrap gap-2">
                      {cat.items.map((item) => (
                        <span
                          key={item}
                          className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/8 text-xs text-zinc-400"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    {/* Arrow */}
                    <ChevronRight className="absolute top-8 right-8 w-5 h-5 text-zinc-700 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </FadeIn>
              ))}
            </div>

            <FadeIn delay={0.3}>
              <div className="mt-12 text-center">
                <Link
                  href="/plugs"
                  className="inline-flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400 transition-colors font-medium"
                >
                  Browse Full Catalog
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            CAPABILITIES — 4-column grid
           ══════════════════════════════════════════════════════ */}
        <section className="py-28 px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <div className="text-center mb-20">
                <p className="text-sm font-medium text-amber-500 mb-3">
                  Platform
                </p>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                  Built for Production
                </h2>
              </div>
            </FadeIn>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {CAPABILITIES.map((cap, i) => (
                <FadeIn key={cap.title} delay={i * 0.08}>
                  <div className="p-6 rounded-2xl border border-white/8 bg-[#111113] text-center">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
                      <cap.icon className="w-6 h-6 text-amber-500" />
                    </div>
                    <h3 className="font-bold mb-2">{cap.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      {cap.desc}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FINAL CTA
           ══════════════════════════════════════════════════════ */}
        <section className="py-28 px-4 md:px-6">
          <FadeIn>
            <div className="max-w-3xl mx-auto relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 rounded-[2rem] blur-xl" />
              <div className="relative p-12 md:p-20 text-center rounded-[2rem] border border-white/8 bg-[#111113] overflow-hidden">
                {/* Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none" />

                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-8 p-1">
                    <Image
                      src="/images/acheevy/acheevy-helmet.png"
                      alt="A.I.M.S."
                      width={48}
                      height={48}
                      className="rounded-xl"
                    />
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                    Ready to{" "}
                    <span className="text-gold-gradient">Deploy</span>?
                  </h2>
                  <p className="text-zinc-400 text-base md:text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                    Join the platform that turns ideas into running services.
                    No infrastructure headaches. No DevOps hiring.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/chat"
                      className="group h-13 px-8 rounded-xl bg-amber-500 text-black font-semibold text-sm inline-flex items-center justify-center gap-2.5 hover:bg-amber-400 transition-all hover:shadow-lg hover:shadow-amber-500/20"
                    >
                      Get Started Free
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <Link
                      href="/(auth)/sign-up"
                      className="h-13 px-8 rounded-xl border border-white/10 text-zinc-300 font-medium text-sm inline-flex items-center justify-center gap-2.5 hover:border-white/20 hover:bg-white/[0.03] transition-all"
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
        <footer className="py-12 border-t border-white/8 px-4 md:px-6">
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
              <Link
                href="/terms"
                className="hover:text-zinc-400 transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="hover:text-zinc-400 transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/economics"
                className="hover:text-zinc-400 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className="hover:text-zinc-400 transition-colors"
              >
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

  return (
    <nav className="sticky top-0 z-50 h-16 flex items-center justify-center px-4 md:px-6">
      <motion.div
        className="w-full max-w-6xl flex items-center justify-between bg-[#09090B]/80 backdrop-blur-xl px-5 py-2.5 rounded-2xl"
        style={{
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: useTransform(
            navBorder,
            (v) => `rgba(255, 255, 255, ${v * 0.08})`
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
          <Link
            href="/plugs"
            className="px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors rounded-lg"
          >
            Catalog
          </Link>
          <Link
            href="#how-it-works"
            className="px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors rounded-lg"
          >
            How It Works
          </Link>
          <Link
            href="/economics"
            className="px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors rounded-lg"
          >
            Pricing
          </Link>
          <Link
            href="/about"
            className="px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors rounded-lg"
          >
            About
          </Link>
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
            className="h-9 px-4 rounded-lg bg-amber-500 text-black text-sm font-semibold inline-flex items-center hover:bg-amber-400 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </motion.div>
    </nav>
  );
}
