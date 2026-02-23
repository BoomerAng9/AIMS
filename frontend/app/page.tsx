"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Trophy,
  Hammer,
  Bird,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Users,
  Code2,
  Workflow,
  Shield,
  Zap,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   A.I.M.S. Landing Page — Modern Light SaaS

   Theme: "AI Managed Solutions — Clean, Professional"
   Background: Light with warm amber accents
   ═══════════════════════════════════════════════════════════ */

// ── Domain Detection ──
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

// ── Experience Tiles ──
const EXPERIENCES = [
  {
    id: "chat",
    title: "Chat w/ACHEEVY",
    description: "Your AI executive orchestrator. Voice-first command center with multi-agent routing.",
    icon: MessageSquare,
    href: "/chat",
    gradient: "from-amber-50",
    border: "border-amber-200",
    accent: "text-amber-600",
    status: "live",
  },
  {
    id: "perform",
    title: "Per|Form Platform",
    description: "AI-powered sports analytics engine. Big Board, War Room, and full Draft Simulator.",
    icon: Trophy,
    href: "/sandbox/perform/draft",
    gradient: "from-emerald-50",
    border: "border-emerald-200",
    accent: "text-emerald-600",
    status: "live",
  },
  {
    id: "boomerang",
    title: "Build a Boomer_Ang",
    description: "Design specialized AI workers with custom skills and distinct operational personas.",
    icon: Hammer,
    href: "/dashboard/boomerangs",
    gradient: "from-blue-50",
    border: "border-blue-200",
    accent: "text-blue-600",
    status: "beta",
  },
  {
    id: "chicken-hawk",
    title: "Unleash Chicken Hawk",
    description: "Autonomous code and task execution. Parallelized workflow orchestration at scale.",
    icon: Bird,
    href: "/dashboard/custom-hawks",
    gradient: "from-purple-50",
    border: "border-purple-200",
    accent: "text-purple-600",
    status: "beta",
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
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] rounded-full px-2.5 py-0.5 border ${styles[status as keyof typeof styles] || styles.planned}`}>
      {status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {status}
    </span>
  );
}

export default function HomePage() {
  const isShowroom = useIsShowroom();

  return (
    <main className="relative min-h-screen bg-[#F8FAFC] overflow-x-hidden text-slate-900 selection:bg-amber-100">

      {/* ── Background ── */}
      <div className="fixed inset-0 z-0">
        {/* Warm gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#F8FAFC] to-slate-100" />
        {/* Subtle amber radial */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.04)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <SiteNav />

        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center px-6 py-20">
          <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center gap-16">

            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-amber-200 bg-amber-50"
              >
                <div className="relative w-2 h-2">
                  <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
                  <div className="relative w-full h-full rounded-full bg-emerald-500" />
                </div>
                <span className="text-xs font-mono uppercase tracking-[0.3em] text-amber-700">
                  Operations Live
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] text-slate-900 font-display uppercase"
              >
                AI Managed <br />
                <span className="text-amber-600">Solutions</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-xl text-slate-500 max-w-xl leading-relaxed font-light"
              >
                I&apos;m ACHEEVY, your autonomous operations lead. From code generation to complex business logic, A.I.M.S. orchestrates 25+ specialized agents to execute your vision.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <Link
                  href="/chat"
                  className="h-14 px-10 bg-amber-600 text-white font-bold uppercase tracking-widest text-xs rounded-xl inline-flex items-center justify-center gap-3 hover:bg-amber-700 hover:shadow-lg hover:shadow-amber-200/50 transition-all group"
                >
                  Initiate Chat <Zap size={18} className="group-hover:scale-125 transition-transform" />
                </Link>
                <Link
                  href="#experiences"
                  className="h-14 px-10 border border-slate-200 hover:border-amber-200 bg-white text-slate-700 font-bold uppercase tracking-widest text-xs rounded-xl inline-flex items-center justify-center gap-2 transition-all hover:shadow-sm"
                >
                  Catalog Hub <ChevronRight size={16} />
                </Link>
              </motion.div>
            </div>

            {/* Visual Hero */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="relative w-full max-w-[500px] aspect-square"
            >
              <div className="absolute inset-0 bg-amber-200/20 blur-[100px] rounded-full animate-pulse" />
              <div className="relative z-10 w-full h-full rounded-[3rem] p-8 overflow-hidden shadow-xl border border-slate-200 bg-white">
                <Image
                  src="/images/acheevy/hero-character.png"
                  alt="ACHEEVY"
                  fill
                  className="object-contain p-4 scale-[1.05]"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </section>

        <ExperienceGateway />
        <PlatformPillars />
        <FinalCTA />
        <SiteFooter />
      </div>
    </main>
  );
}

function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 h-20 flex items-center justify-center px-6">
      <div className="w-full max-w-7xl flex items-center justify-between bg-white/80 backdrop-blur-xl px-6 py-3 border border-slate-200 rounded-2xl shadow-sm">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/images/acheevy/acheevy-helmet.png"
            alt="A.I.M.S."
            width={32}
            height={32}
            className="group-hover:rotate-[15deg] transition-transform"
          />
          <span className="text-xl font-black text-slate-900 tracking-[0.2em] font-display">
            A.I.M.S.
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/chat" className="text-[11px] font-mono uppercase tracking-widest text-slate-400 hover:text-amber-600 transition-colors hidden md:block">
            Connect
          </Link>
          <Link
            href="/(auth)/sign-in"
            className="h-10 px-6 border border-amber-200 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-widest hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all"
          >
            Unlock
          </Link>
        </div>
      </div>
    </nav>
  );
}

function ExperienceGateway() {
  return (
    <section id="experiences" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4">
          <div className="space-y-4">
            <p className="text-xs font-mono uppercase tracking-[0.5em] text-amber-600/60">Operational Nodes</p>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase font-display leading-[0.9]">Choose Your <br /> Experience</h2>
          </div>
          <p className="text-slate-500 text-sm md:text-base max-w-md font-light leading-relaxed">
            The A.I.M.S. ecosystem spans from deep reasoning and analytics to autonomous execution and creative building.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {EXPERIENCES.map((exp, i) => (
            <Link
              key={exp.id}
              href={exp.href}
              className={`group relative overflow-hidden rounded-2xl border ${exp.border} bg-white p-8 h-[360px] flex flex-col transition-all hover:-translate-y-2 hover:shadow-lg`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${exp.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10 flex justify-between items-start mb-8">
                <div className={`size-14 rounded-2xl bg-white border ${exp.border} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                  <exp.icon className={`size-7 ${exp.accent}`} />
                </div>
                <StatusBadge status={exp.status} />
              </div>

              <div className="relative z-10 mt-auto space-y-4">
                <h3 className="text-2xl font-bold text-slate-800 leading-tight">{exp.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-light">{exp.description}</p>
                <div className={`flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest ${exp.accent} opacity-60 group-hover:opacity-100 transition-opacity`}>
                  Initialize <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlatformPillars() {
  const PILLARS = [
    { title: "Voice-First", desc: "Orchestrate complex business logic through natural conversation and intent.", icon: MessageSquare },
    { title: "Autonomous", desc: "A swarm of specialized agents handle research, design, and execution.", icon: Workflow },
    { title: "Verifiable", desc: "No proof, No done. Every task includes evidentiary validation.", icon: Shield },
    { title: "Scalable", desc: "Instantly deploy applications to global infrastructure via ACHEEVY.", icon: Zap },
  ];

  return (
    <section className="py-32 px-6 border-y border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-16 md:grid-cols-4">
          {PILLARS.map((p, i) => (
            <div key={p.title} className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
              <div className="size-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
                <p.icon size={28} />
              </div>
              <div className="space-y-3">
                <h3 className="text-slate-800 font-bold text-lg uppercase tracking-widest font-display">{p.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-light">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-40 px-6">
      <div className="max-w-5xl mx-auto relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-200/30 via-slate-100 to-amber-200/30 rounded-[4rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
        <div className="relative bg-white border border-slate-200 p-12 md:p-24 text-center rounded-[4rem] overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.03)_0%,transparent_70%)]" />

          <div className="relative z-10 size-24 mx-auto rounded-3xl bg-amber-50 border border-amber-200 p-2 mb-10 shadow-sm rotate-3">
            <Image
              src="/images/acheevy/acheevy-helmet-chat.png"
              alt="ACHEEVY"
              fill
              className="object-cover rounded-2xl p-1"
            />
          </div>

          <h2 className="relative z-10 text-4xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter font-display mb-6">
            Secure Your <span className="text-amber-600">Seat</span>
          </h2>
          <p className="relative z-10 text-slate-500 text-base md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            The network is expanding. Register to unlock full autonomous capabilities, custom agent workflows, and your personalized operational workspace.
          </p>

          <div className="relative z-10 flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/chat" className="h-16 px-12 bg-amber-600 text-white font-bold uppercase tracking-widest text-xs rounded-2xl inline-flex items-center justify-center gap-3 hover:bg-amber-700 hover:shadow-lg hover:shadow-amber-200/50 transition-all">
              Initiate Protocols
            </Link>
            <Link href="/(auth)/sign-up" className="h-16 px-12 border border-slate-200 hover:border-amber-200 bg-white text-slate-700 font-bold uppercase tracking-widest text-xs rounded-2xl inline-flex items-center justify-center gap-3 transition-all hover:shadow-sm">
              Establish Identity
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="py-16 border-t border-slate-200 px-6 relative z-10 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-slate-400 text-[10px] font-mono tracking-[0.3em] uppercase">
        <p>&copy; {new Date().getFullYear()} ACHIEVEMOR &middot; A.I.M.S. Operations Protocol v2.5</p>
        <div className="flex gap-10">
          <Link href="/terms" className="hover:text-amber-600 transition-colors">Terms of Service</Link>
          <Link href="/economics" className="hover:text-amber-600 transition-colors">Economics</Link>
          <Link href="/privacy" className="hover:text-amber-600 transition-colors">Operational Shield</Link>
        </div>
      </div>
    </footer>
  );
}
