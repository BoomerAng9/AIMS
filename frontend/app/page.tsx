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
   A.I.M.S. Landing Page — Shipping & Operations Hub
   
   Theme: "WE ARE SHIPPING"
   Background: Port Scene with Branded Containers
   Vibe: Premium, Professional, Authentic
   ═══════════════════════════════════════════════════════════ */

// ── Domain Detection ──
function useIsShowroom(): boolean {
  const [isShowroom, setIsShowroom] = useState(false);
  useEffect(() => {
    const host = window.location.hostname.replace(/^www\./, "");
    setIsShowroom(
      host === "aimanagedsolutions.cloud" ||
      host === host.includes("localhost") ||
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
    gradient: "from-amber-900/40 text-amber-500",
    border: "border-gold/30",
    accent: "text-gold",
    status: "live",
  },
  {
    id: "perform",
    title: "Per|Form Platform",
    description: "AI-powered sports analytics engine. Big Board, War Room, and full Draft Simulator.",
    icon: Trophy,
    href: "/sandbox/perform/draft",
    gradient: "from-emerald-900/30 text-emerald-400",
    border: "border-emerald-500/30",
    accent: "text-emerald-400",
    status: "live",
  },
  {
    id: "boomerang",
    title: "Build a Boomer_Ang",
    description: "Design specialized AI workers with custom skills and distinct operational personas.",
    icon: Hammer,
    href: "/dashboard/boomerangs",
    gradient: "from-blue-900/30 text-blue-400",
    border: "border-blue-500/30",
    accent: "text-blue-400",
    status: "beta",
  },
  {
    id: "chicken-hawk",
    title: "Unleash Chicken Hawk",
    description: "Autonomous code and task execution. Parallelized workflow orchestration at scale.",
    icon: Bird,
    href: "/dashboard/custom-hawks",
    gradient: "from-purple-900/30 text-purple-400",
    border: "border-purple-500/30",
    accent: "text-purple-400",
    status: "beta",
  },
];

// ── Status Badge ──
function StatusBadge({ status }: { status: string }) {
  const styles = {
    live: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    beta: "bg-amber-500/15 text-gold border-amber-500/25",
    planned: "bg-white/5 text-white/40 border-white/10",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] rounded-full px-2.5 py-0.5 border ${styles[status as keyof typeof styles] || styles.planned}`}>
      {status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
      {status}
    </span>
  );
}

export default function HomePage() {
  const isShowroom = useIsShowroom();

  return (
    <main className="relative min-h-screen bg-[#0A0A0A] overflow-x-hidden text-white selection:bg-gold/30">

      {/* ── Global Background (The Port) ── */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/assets/port_dock_brand.png"
          alt="A.I.M.S. Operations"
          fill
          priority
          className="object-cover object-center scale-[1.02]" // Subtle scale to hide edge watermarks
          sizes="100vw"
        />
        {/* Dark mesh overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0A0A0A]/95" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <SiteNav />

        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center px-6 py-20">
          <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center gap-16">

            {/* Text Context */}
            <div className="flex-1 text-center lg:text-left space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-gold/20 bg-gold/5 backdrop-blur-md"
              >
                <div className="relative w-2 h-2">
                  <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
                  <div className="relative w-full h-full rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-mono uppercase tracking-[0.3em] text-gold/80">
                  Operations Live · We are shipping
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white font-display uppercase"
              >
                AI Managed <br />
                <span className="text-gold">Solutions</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-xl text-white/60 max-w-xl leading-relaxed font-light"
              >
                I'm ACHEEVY, your autonomous operations lead. From code generation to complex business logic, A.I.M.S. orchestrates 25+ specialized agents to execute your vision with zero proof overhead.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <Link
                  href="/chat"
                  className="h-14 px-10 bg-gold text-black font-bold uppercase tracking-widest text-xs rounded-xl inline-flex items-center justify-center gap-3 hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all group"
                >
                  Initiate Chat <Zap size={18} className="group-hover:scale-125 transition-transform" />
                </Link>
                <Link
                  href="#experiences"
                  className="h-14 px-10 border border-white/20 hover:border-gold/50 bg-white/5 backdrop-blur-md text-white font-bold uppercase tracking-widest text-xs rounded-xl inline-flex items-center justify-center gap-2 transition-all"
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
              <div className="absolute inset-0 bg-gold/10 blur-[100px] rounded-full animate-pulse" />
              <div className="relative z-10 w-full h-full glass-card border border-gold/20 rounded-[3rem] p-8 overflow-hidden shadow-2xl">
                <Image
                  src="/images/acheevy/hero-character.png"
                  alt="ACHEEVY"
                  fill
                  className="object-contain p-4 scale-[1.05]" // Slightly scale to hide potential watermarks
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
      <div className="w-full max-w-7xl flex items-center justify-between glass-card px-6 py-3 border border-white/10 shadow-2xl">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/images/acheevy/acheevy-helmet.png"
            alt="A.I.M.S."
            width={32}
            height={32}
            className="group-hover:rotate-[15deg] transition-transform"
          />
          <span className="text-xl font-black text-white tracking-[0.2em] font-display">
            A.I.M.S.
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/chat" className="text-[11px] font-mono uppercase tracking-widest text-white/40 hover:text-gold transition-colors hidden md:block">
            Connect
          </Link>
          <Link
            href="/(auth)/sign-in"
            className="h-10 px-6 border border-gold/40 rounded-lg bg-gold/10 text-gold text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-black transition-all"
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
            <p className="text-xs font-mono uppercase tracking-[0.5em] text-gold/60">Operational Nodes</p>
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase font-display leading-[0.9]">Choose Your <br /> Experience</h2>
          </div>
          <p className="text-white/40 text-sm md:text-base max-w-md font-light leading-relaxed">
            The A.I.M.S. ecosystem spans from deep reasoning and analytics to autonomous execution and creative building.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {EXPERIENCES.map((exp, i) => (
            <Link
              key={exp.id}
              href={exp.href}
              className={`group relative overflow-hidden glass-card border ${exp.border} p-8 h-[360px] flex flex-col transition-all hover:-translate-y-2 hover:shadow-gold/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${exp.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10 flex justify-between items-start mb-8">
                <div className={`size-14 rounded-2xl bg-black/40 border ${exp.border} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <exp.icon className={`size-7 ${exp.accent}`} />
                </div>
                <StatusBadge status={exp.status} />
              </div>

              <div className="relative z-10 mt-auto space-y-4">
                <h3 className="text-2xl font-bold text-white leading-tight">{exp.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed font-light">{exp.description}</p>
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
    <section className="py-32 px-6 border-y border-white/5 bg-black/40 backdrop-blur-3xl">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-16 md:grid-cols-4">
          {PILLARS.map((p, i) => (
            <div key={p.title} className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
              <div className="size-16 rounded-3xl bg-gold/5 border border-gold/10 flex items-center justify-center text-gold shadow-sm">
                <p.icon size={28} />
              </div>
              <div className="space-y-3">
                <h3 className="text-white font-bold text-lg uppercase tracking-widest font-display">{p.title}</h3>
                <p className="text-white/35 text-sm leading-relaxed font-light">{p.desc}</p>
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
        <div className="absolute -inset-1 bg-gradient-to-r from-gold/20 via-white/5 to-gold/20 rounded-[4rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
        <div className="relative glass-card border border-white/10 p-12 md:p-24 text-center rounded-[4rem] overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)]" />

          <div className="relative z-10 size-24 mx-auto rounded-3xl bg-black border border-gold/30 p-2 mb-10 shadow-gold/20 shadow-2xl rotate-3">
            <Image
              src="/images/acheevy/acheevy-helmet-chat.png"
              alt="ACHEEVY"
              fill
              className="object-cover rounded-2xl p-1"
            />
          </div>

          <h2 className="relative z-10 text-4xl md:text-7xl font-black text-white uppercase tracking-tighter font-display mb-6">
            Secure Your <span className="text-gold">Seat</span>
          </h2>
          <p className="relative z-10 text-white/50 text-base md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            The network is expanding. Register to unlock full autonomous capabilities, custom agent workflows, and your personalized operational workspace.
          </p>

          <div className="relative z-10 flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/chat" className="h-16 px-12 bg-gold text-black font-bold uppercase tracking-widest text-xs rounded-2xl inline-flex items-center justify-center gap-3 hover:shadow-[0_0_60px_rgba(212,175,55,0.4)] transition-all">
              Initiate Protocols
            </Link>
            <Link href="/(auth)/sign-up" className="h-16 px-12 border border-white/20 hover:border-gold/50 bg-white/5 text-white font-bold uppercase tracking-widest text-xs rounded-2xl inline-flex items-center justify-center gap-3 transition-all">
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
    <footer className="py-16 border-t border-white/5 px-6 relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 opacity-40 text-[10px] font-mono tracking-[0.3em] uppercase">
        <p>© {new Date().getFullYear()} ACHIEVEMOR · A.I.M.S. Operations Protocol v2.5</p>
        <div className="flex gap-10">
          <Link href="/terms" className="hover:text-gold transition-colors">Terms of Service</Link>
          <Link href="/economics" className="hover:text-gold transition-colors">Economics</Link>
          <Link href="/privacy" className="hover:text-gold transition-colors">Operational Shield</Link>
        </div>
      </div>
    </footer>
  );
}
