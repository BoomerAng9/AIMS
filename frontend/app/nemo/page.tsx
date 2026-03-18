"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import {
  ArrowRight,
  Brain,
  Cpu,
  Globe,
  Lock,
  Zap,
  Layers,
  Shield,
  ChevronRight,
  Sparkles,
} from "lucide-react";

// ── Background particle field ──
function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Primary cosmic glow — center */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1200px] h-[900px]
          bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12)_0%,rgba(59,130,246,0.06)_40%,transparent_70%)]" />
      {/* Secondary glow — bottom right */}
      <div className="absolute bottom-0 right-0 w-[700px] h-[700px]
          bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08)_0%,transparent_60%)]" />
      {/* Horizontal light band */}
      <div className="absolute top-[42%] inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
      {/* Grid overlay */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99,102,241,0.04) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />
      {/* Small orbit dots */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-indigo-400"
          style={{
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            top: `${10 + (i * 7.3) % 80}%`,
            left: `${5 + (i * 9.1) % 90}%`,
            opacity: 0.2 + (i % 4) * 0.1,
          }}
          animate={{ opacity: [0.1, 0.5, 0.1], scale: [1, 1.4, 1] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
    </div>
  );
}

const CAPABILITIES = [
  {
    icon: Brain,
    title: "Autonomous Intelligence",
    desc: "Self-governing AI agents that plan, execute, and adapt — without constant human prompting.",
  },
  {
    icon: Shield,
    title: "Private by Architecture",
    desc: "Your data never leaves your cluster. End-to-end encrypted, isolated, and sovereign.",
  },
  {
    icon: Cpu,
    title: "NVIDIA NIM Native",
    desc: "First-class integration with NVIDIA NIM for local GPU inference with zero cloud lock-in.",
  },
  {
    icon: Globe,
    title: "Globally Accessible",
    desc: "Access your private AI from anywhere through our zero-trust remote gateway.",
  },
  {
    icon: Zap,
    title: "Sub-second Execution",
    desc: "Low-latency inference pipelines tuned for real-time response across all agent types.",
  },
  {
    icon: Layers,
    title: "Multi-model Orchestration",
    desc: "Simultaneously run Nemotron, LLaMA, Qwen, and custom models under a single control plane.",
  },
];

const NAV_LINKS = [
  { href: "/nemo/dashboard", label: "Control Room" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#mission", label: "Mission" },
  { href: "/(auth)/sign-in", label: "Sign In" },
];

export default function FoaiLanding() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <main className="min-h-screen bg-[#020408] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-6 md:px-12 py-5
          bg-gradient-to-b from-[#020408]/90 to-transparent backdrop-blur-sm">
        <Link href="/nemo" className="flex items-center gap-2 group">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-lg bg-indigo-500/20 border border-indigo-500/30 group-hover:border-indigo-400/50 transition-colors" />
            <Sparkles className="absolute inset-0 m-auto w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-sm font-black tracking-[0.2em] uppercase bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            FOAI
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors tracking-wide uppercase"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          href="/nemo/dashboard"
          className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20
            hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all text-xs font-bold text-indigo-300 uppercase tracking-widest"
        >
          Enter
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        <ParticleField />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-5xl mx-auto text-center pt-24"
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full
              border border-indigo-500/20 bg-indigo-500/[0.06] text-[10px] uppercase tracking-[0.25em] font-bold text-indigo-400"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inset-0 rounded-full bg-indigo-400 opacity-75" />
              <span className="relative rounded-full h-1.5 w-1.5 bg-indigo-400" />
            </span>
            The Future of Artificial Intelligence
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl sm:text-7xl md:text-[96px] font-black tracking-[-0.03em] leading-[0.92] mb-8"
          >
            <span className="bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
              Intelligence
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
              Without Limits.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            FOAI is the sovereign AI platform for those who refuse to compromise.
            Private infrastructure. Autonomous agents. Full control — forever yours.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/nemo/dashboard"
              className="group flex items-center gap-3 px-8 py-4 rounded-full
                bg-gradient-to-r from-indigo-500 to-violet-600
                hover:from-indigo-400 hover:to-violet-500
                shadow-[0_0_40px_rgba(99,102,241,0.25)] hover:shadow-[0_0_60px_rgba(99,102,241,0.4)]
                text-sm font-bold tracking-wide transition-all"
            >
              Enter Control Room
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#capabilities"
              className="flex items-center gap-2 px-8 py-4 rounded-full
                border border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/5
                text-sm font-semibold text-zinc-300 transition-all"
            >
              Explore FOAI
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-20 pt-12 border-t border-white/[0.04] grid grid-cols-3 gap-12 max-w-2xl mx-auto"
          >
            {[
              { value: "∞", label: "Model Capacity" },
              { value: "0ms", label: "Data Egress" },
              { value: "100%", label: "Sovereign" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-[11px] text-zinc-600 mt-1 uppercase tracking-widest font-bold">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#020408] to-transparent pointer-events-none" />
      </section>

      {/* ── Capabilities ── */}
      <section id="capabilities" className="py-32 px-6 md:px-12 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 mb-4">Platform</p>
            <h2 className="text-5xl md:text-7xl font-black tracking-tight">
              <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                Built for
              </span>{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                What&apos;s Next.
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAPABILITIES.map((cap, i) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: i * 0.07, duration: 0.6 }}
                className="group p-8 rounded-3xl border border-white/[0.04] hover:border-indigo-500/20
                  bg-white/[0.02] hover:bg-indigo-500/[0.03] transition-all"
              >
                <div className="w-12 h-12 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06]
                  group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 flex items-center justify-center mb-6 transition-all">
                  <cap.icon className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold mb-3">{cap.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{cap.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission Statement ── */}
      <section id="mission" className="py-32 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 mb-6">Our Mission</p>
            <blockquote className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                We believe the future of AI belongs to those who{" "}
              </span>
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
                own their intelligence —
              </span>
              <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                {" "}not rent it.
              </span>
            </blockquote>
            <p className="mt-8 text-zinc-500 leading-relaxed max-w-2xl mx-auto">
              FOAI is built on the conviction that the next era of AI will be defined
              by sovereignty, privacy, and autonomous execution — not by who can access the
              most expensive API. We give you the full stack.
            </p>

            <div className="mt-12">
              <Link
                href="/nemo/dashboard"
                className="group inline-flex items-center gap-3 px-10 py-4 rounded-full
                  bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500
                  shadow-[0_0_40px_rgba(99,102,241,0.2)] hover:shadow-[0_0_60px_rgba(99,102,241,0.35)]
                  text-sm font-bold transition-all"
              >
                Start the Future
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] py-12 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
              &copy; 2026 FOAI · Future of AI · Powered by NVIDIA NemoClaw
            </span>
          </div>
          <div className="flex gap-8">
            {[
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
              { href: "/nemo/dashboard", label: "Control Room" },
            ].map((link) => (
              <Link key={link.label} href={link.href}
                className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-indigo-400 transition-colors font-bold">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
