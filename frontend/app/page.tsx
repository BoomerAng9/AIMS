"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  MessageSquare,
  Trophy,
  Bot,
  Workflow,
  ArrowRight,
  ChevronRight,
  Shield,
  Zap,
  Rocket,
  BarChart3,
  Package,
  Clock,
  CheckCircle2,
  HeartHandshake,
} from "lucide-react";
import {
  scrollReveal,
  scrollRevealScale,
  staggerContainer,
  staggerItem,
  heroStagger,
  heroItem,
  viewportMargin,
} from "@/lib/motion";
import {
  ScrollProgress as ScrollProgressBar,
  GlowBorder,
} from "@/components/motion";

/* ═══════════════════════════════════════════════════════════
   A.I.M.S. Landing Page — PaaS Platform

   AI Managed Solutions — Deploy AI tools, agents, and
   platforms with one click. Managed end-to-end by ACHEEVY.

   Theme: Light with warm amber accents on #F8FAFC base
   ═══════════════════════════════════════════════════════════ */

// ── Service Cards ──
const SERVICES = [
  {
    id: "assistant",
    title: "Talk to ACHEEVY",
    description: "Your AI operations assistant. Describe what you need — ACHEEVY handles the rest, from deployment to monitoring.",
    icon: MessageSquare,
    href: "/chat",
    gradient: "from-amber-50",
    border: "border-amber-200",
    accent: "text-amber-600",
    status: "live",
  },
  {
    id: "analytics",
    title: "Sports Analytics",
    description: "AI-powered draft simulator, big board rankings, and real-time analytics for fantasy and professional sports.",
    icon: Trophy,
    href: "/sandbox/perform/draft",
    gradient: "from-emerald-50",
    border: "border-emerald-200",
    accent: "text-emerald-600",
    status: "live",
  },
  {
    id: "agents",
    title: "Custom AI Agents",
    description: "Build specialized AI workers tailored to your business. Define skills, personas, and workflows — deploy instantly.",
    icon: Bot,
    href: "/dashboard/boomerangs",
    gradient: "from-blue-50",
    border: "border-blue-200",
    accent: "text-blue-600",
    status: "beta",
  },
  {
    id: "automation",
    title: "Workflow Automation",
    description: "Connect your tools and automate complex business processes. Parallel execution, smart routing, built-in monitoring.",
    icon: Workflow,
    href: "/dashboard/automations",
    gradient: "from-purple-50",
    border: "border-purple-200",
    accent: "text-purple-600",
    status: "beta",
  },
];

// ── How It Works Steps ──
const STEPS = [
  {
    number: "01",
    title: "Browse & Choose",
    description: "Explore our catalog of AI tools, agents, and platforms. Find exactly what your business needs.",
    icon: Package,
  },
  {
    number: "02",
    title: "Deploy Instantly",
    description: "One click to launch. Auto-configured with SSL, health checks, and monitoring built in from day one.",
    icon: Rocket,
  },
  {
    number: "03",
    title: "Scale & Manage",
    description: "ACHEEVY monitors performance, handles scaling, and keeps everything running. You focus on your business.",
    icon: BarChart3,
  },
];

// ── Status Badge ──
function StatusBadge({ status }: { status: string }) {
  const styles = {
    live: "bg-emerald-50 text-emerald-700 border-emerald-200",
    beta: "bg-amber-50 text-amber-700 border-amber-200",
    planned: "bg-slate-50 text-slate-500 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.15em] rounded-full px-2.5 py-0.5 border ${styles[status as keyof typeof styles] || styles.planned}`}>
      {status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {status}
    </span>
  );
}

export default function HomePage() {
  // Parallax for hero section
  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroBgY = useTransform(heroProgress, [0, 1], ["0%", "25%"]);
  const heroTextY = useTransform(heroProgress, [0, 1], ["0%", "15%"]);
  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);

  return (
    <main className="relative min-h-screen bg-[#F8FAFC] overflow-x-hidden text-slate-900 selection:bg-amber-100">

      <ScrollProgressBar height={2} zIndex={60} />

      {/* ── Background ── */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#F8FAFC] to-slate-100" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.04)_0%,transparent_70%)]" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none"
          style={{
            backgroundImage: 'url(/assets/aims_transparent_logo.svg)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            opacity: 0.025,
            filter: 'drop-shadow(2px 2px 0 rgba(217,119,6,0.08)) drop-shadow(-1px -1px 0 rgba(255,255,255,0.6))',
          }}
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <SiteNav />

        {/* ── Hero Section ── */}
        <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center px-6 py-20 overflow-hidden">
          <motion.div style={{ y: heroBgY }} className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.06)_0%,transparent_50%)]" />
          </motion.div>

          <motion.div
            style={{ y: heroTextY, opacity: heroOpacity }}
            className="max-w-6xl w-full flex flex-col lg:flex-row items-center gap-16"
          >
            {/* Text Content */}
            <motion.div
              className="flex-1 text-center lg:text-left space-y-8"
              variants={heroStagger}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={heroItem}
                className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-amber-200 bg-amber-50"
              >
                <div className="relative w-2 h-2">
                  <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
                  <div className="relative w-full h-full rounded-full bg-emerald-500" />
                </div>
                <span className="text-xs font-mono uppercase tracking-[0.3em] text-amber-700">
                  Platform Active
                </span>
              </motion.div>

              <motion.h1
                variants={heroItem}
                className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] text-slate-900 font-display uppercase"
              >
                AI Managed <br />
                <span className="text-amber-600">Solutions</span>
              </motion.h1>

              <motion.p
                variants={heroItem}
                className="text-lg md:text-xl text-slate-500 max-w-xl leading-relaxed font-light"
              >
                Deploy AI-powered tools, agents, and platforms with one click.
                ACHEEVY manages everything — from provisioning to monitoring — so you can focus on growing your business.
              </motion.p>

              <motion.div
                variants={heroItem}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <GlowBorder theme="gold" rounded="rounded-xl">
                  <Link
                    href="/chat"
                    className="h-14 px-10 bg-amber-600 text-white font-bold uppercase tracking-widest text-xs rounded-xl inline-flex items-center justify-center gap-3 hover:bg-amber-700 hover:shadow-lg hover:shadow-amber-200/50 transition-all group"
                  >
                    Get Started <Zap size={18} className="group-hover:scale-125 transition-transform" />
                  </Link>
                </GlowBorder>
                <Link
                  href="#solutions"
                  className="h-14 px-10 border border-slate-200 hover:border-amber-200 bg-white text-slate-700 font-bold uppercase tracking-widest text-xs rounded-xl inline-flex items-center justify-center gap-2 transition-all hover:shadow-sm"
                >
                  Browse Tools <ChevronRight size={16} />
                </Link>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                variants={heroItem}
                className="flex flex-wrap items-center gap-6 pt-2 text-sm text-slate-400"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  One-Click Deploy
                </span>
                <span className="flex items-center gap-2">
                  <Shield size={16} className="text-emerald-500" />
                  SSL Included
                </span>
                <span className="flex items-center gap-2">
                  <Clock size={16} className="text-emerald-500" />
                  24/7 Monitoring
                </span>
              </motion.div>
            </motion.div>

            {/* Visual Hero */}
            <motion.div
              variants={heroItem}
              className="relative w-full max-w-[500px] aspect-square"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 bg-amber-200/20 blur-[100px] rounded-full animate-pulse" />
              <div className="relative z-10 w-full h-full rounded-[3rem] p-8 overflow-hidden shadow-xl border border-slate-200 bg-white">
                <Image
                  src="/images/acheevy/hero-character.png"
                  alt="ACHEEVY — Your AI Operations Assistant"
                  fill
                  className="object-contain p-4 scale-[1.05]"
                  priority
                />
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Solutions ── */}
        <SolutionsSection />

        {/* ── How It Works ── */}
        <HowItWorks />

        {/* ── Platform Pillars ── */}
        <PlatformPillars />

        {/* ── Final CTA ── */}
        <FinalCTA />

        <SiteFooter />
      </div>
    </main>
  );
}

function SiteNav() {
  const { scrollY } = useScroll();
  const navBgOpacity = useTransform(scrollY, [0, 100], [0.6, 0.95]);
  const navShadow = useTransform(scrollY, [0, 100], [0, 1]);

  return (
    <motion.nav
      className="sticky top-0 z-50 h-20 flex items-center justify-center px-6"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <motion.div
        className="w-full max-w-7xl flex items-center justify-between backdrop-blur-xl px-6 py-3 border border-slate-200 rounded-2xl"
        style={{
          backgroundColor: useTransform(navBgOpacity, (v) => `rgba(255, 255, 255, ${v})`),
          boxShadow: useTransform(navShadow, (v) => `0 ${v * 4}px ${v * 16}px rgba(0,0,0,${v * 0.06})`),
        }}
      >
        <Link href="/" className="flex items-center gap-3 group">
          <motion.div whileHover={{ rotate: 15 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
            <Image
              src="/images/acheevy/acheevy-helmet.png"
              alt="A.I.M.S."
              width={32}
              height={32}
            />
          </motion.div>
          <span className="text-xl font-black text-slate-900 tracking-[0.2em] font-display">
            A.I.M.S.
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/chat" className="text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-amber-600 transition-colors hidden md:block">
            Dashboard
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/(auth)/sign-in"
              className="h-10 px-6 border border-amber-200 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-widest hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all inline-flex items-center justify-center"
            >
              Sign In
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </motion.nav>
  );
}

function SolutionsSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: viewportMargin.early });

  return (
    <section id="solutions" ref={sectionRef} className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4"
          variants={scrollReveal}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <div className="space-y-4">
            <p className="text-xs font-mono uppercase tracking-[0.5em] text-amber-600/60">What You Can Deploy</p>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase font-display leading-[0.9]">Ready-to-Launch <br /> Solutions</h2>
          </div>
          <p className="text-slate-500 text-sm md:text-base max-w-md font-light leading-relaxed">
            From AI assistants to analytics platforms — browse our catalog, pick a solution, and deploy it in seconds.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {SERVICES.map((svc) => (
            <motion.div key={svc.id} variants={staggerItem}>
              <Link
                href={svc.href}
                className={`group relative overflow-hidden rounded-2xl border ${svc.border} bg-white p-8 h-[360px] flex flex-col transition-all hover:-translate-y-2 hover:shadow-lg`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${svc.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10 flex justify-between items-start mb-8">
                  <div className={`size-14 rounded-2xl bg-white border ${svc.border} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                    <svc.icon className={`size-7 ${svc.accent}`} />
                  </div>
                  <StatusBadge status={svc.status} />
                </div>

                <div className="relative z-10 mt-auto space-y-4">
                  <h3 className="text-2xl font-bold text-slate-800 leading-tight">{svc.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-light">{svc.description}</p>
                  <div className={`flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest ${svc.accent} opacity-60 group-hover:opacity-100 transition-opacity`}>
                    Explore <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: viewportMargin.standard });

  return (
    <section ref={sectionRef} className="py-32 px-6 border-y border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-20"
          variants={scrollReveal}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <p className="text-xs font-mono uppercase tracking-[0.5em] text-amber-600/60 mb-4">Simple Process</p>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase font-display leading-[0.9]">
            How It Works
          </h2>
        </motion.div>

        <motion.div
          className="grid gap-12 md:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {STEPS.map((step) => (
            <motion.div
              key={step.number}
              variants={staggerItem}
              className="relative flex flex-col items-center text-center space-y-6"
            >
              <div className="relative">
                <div className="size-20 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
                  <step.icon size={32} />
                </div>
                <span className="absolute -top-3 -right-3 size-8 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                  {step.number}
                </span>
              </div>
              <div className="space-y-3">
                <h3 className="text-slate-800 font-bold text-xl uppercase tracking-wide font-display">
                  {step.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-light max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function PlatformPillars() {
  const PILLARS = [
    {
      title: "Conversational",
      desc: "Tell ACHEEVY what you need in plain language. No config files, no terminals — just results.",
      icon: MessageSquare,
    },
    {
      title: "Fully Managed",
      desc: "Your AI team handles provisioning, configuration, health checks, and scaling automatically.",
      icon: Workflow,
    },
    {
      title: "Accountable",
      desc: "Every action is documented with evidence. Full audit trail so you always know what happened and why.",
      icon: Shield,
    },
    {
      title: "Instant Deploy",
      desc: "From catalog to live in seconds. SSL, monitoring, and backups included — no setup required.",
      icon: Zap,
    },
  ];

  const pillarsRef = useRef(null);
  const isInView = useInView(pillarsRef, { once: true, margin: viewportMargin.standard });

  return (
    <section className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-20"
          variants={scrollReveal}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <p className="text-xs font-mono uppercase tracking-[0.5em] text-amber-600/60 mb-4">Why A.I.M.S.</p>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase font-display leading-[0.9]">
            Built for <span className="text-amber-600">Business</span>
          </h2>
        </motion.div>

        <motion.div
          ref={pillarsRef}
          className="grid gap-16 md:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {PILLARS.map((p) => (
            <motion.div
              key={p.title}
              variants={staggerItem}
              className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6"
            >
              <motion.div
                className="size-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm"
                whileHover={{ scale: 1.1, rotate: 3 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <p.icon size={28} />
              </motion.div>
              <div className="space-y-3">
                <h3 className="text-slate-800 font-bold text-lg uppercase tracking-widest font-display">{p.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-light">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const ctaRef = useRef(null);
  const isInView = useInView(ctaRef, { once: true, margin: viewportMargin.early });

  return (
    <section className="py-40 px-6">
      <motion.div
        ref={ctaRef}
        className="max-w-5xl mx-auto relative group"
        variants={scrollRevealScale}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-200/30 via-slate-100 to-amber-200/30 rounded-[4rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-white border border-slate-200 p-12 md:p-24 text-center rounded-[4rem] overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.03)_0%,transparent_70%)]" />

          <motion.div
            className="relative z-10 size-24 mx-auto rounded-3xl bg-amber-50 border border-amber-200 p-2 mb-10 shadow-sm rotate-3"
            animate={{ rotate: [3, -3, 3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/images/acheevy/acheevy-helmet-chat.png"
              alt="ACHEEVY"
              fill
              className="object-cover rounded-2xl p-1"
            />
          </motion.div>

          <h2 className="relative z-10 text-4xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter font-display mb-6">
            Start Building <span className="text-amber-600">Today</span>
          </h2>
          <p className="relative z-10 text-slate-500 text-base md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Join A.I.M.S. and let ACHEEVY manage your AI tools, agents, and platforms.
            One conversation is all it takes to deploy your first solution.
          </p>

          <div className="relative z-10 flex flex-col sm:flex-row gap-6 justify-center">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <GlowBorder theme="gold" rounded="rounded-2xl">
                <Link href="/chat" className="h-16 px-12 bg-amber-600 text-white font-bold uppercase tracking-widest text-xs rounded-2xl inline-flex items-center justify-center gap-3 hover:bg-amber-700 hover:shadow-lg hover:shadow-amber-200/50 transition-all">
                  <HeartHandshake size={18} />
                  Get Started Free
                </Link>
              </GlowBorder>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/(auth)/sign-up" className="h-16 px-12 border border-slate-200 hover:border-amber-200 bg-white text-slate-700 font-bold uppercase tracking-widest text-xs rounded-2xl inline-flex items-center justify-center gap-3 transition-all hover:shadow-sm">
                Create Account
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="py-16 border-t border-slate-200 px-6 relative z-10 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-slate-400 text-xs font-mono tracking-[0.2em] uppercase">
        <p>&copy; {new Date().getFullYear()} A.I.M.S. &mdash; AI Managed Solutions</p>
        <div className="flex gap-10">
          <Link href="/terms" className="hover:text-amber-600 transition-colors">Terms</Link>
          <Link href="/economics" className="hover:text-amber-600 transition-colors">Pricing</Link>
          <Link href="/privacy" className="hover:text-amber-600 transition-colors">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
