"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
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
  Sparkles,
  Workflow,
  BarChart3,
  Lock,
  Cloud,
  Menu,
  X,
  MessageSquare,
  Play,
} from "lucide-react";
import { Badge, Button } from "agentic-ui";
import "@/lib/agentic-theme.css";

import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { GlowBorder } from "@/components/motion/GlowBorder";
import { BentoGrid, BentoItem } from "@/components/motion/BentoGrid";
import {
  spring,
  transition,
  stagger,
  heroStagger,
  heroItem,
  hoverLiftGlow,
} from "@/lib/motion";

/* ═══════════════════════════════════════════════════════════
   A.I.M.S. Landing Page — Agentic UI Design System

   Design language: Obsidian Dark · Gold (#D97706) accents · Glass
   Components: agentic-ui (Button, Badge) + A.I.M.S. motion library
   Motion: Tokens from @/lib/motion — zero magic numbers
   ═══════════════════════════════════════════════════════════ */

// ── Ambient background ──
function AgenticBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Subtle dot grid */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      {/* Primary gold orb — top center */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.07)_0%,transparent_70%)]" />
      {/* Secondary warm orb — bottom left */}
      <div className="absolute bottom-0 -left-20 w-[600px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.04)_0%,transparent_70%)]" />
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(9,9,11,0.6)_100%)]" />
    </div>
  );
}

// ── Data ──
const DEPLOY_CATEGORIES = [
  {
    icon: Boxes,
    title: "Open Source Tools",
    description: "Deploy popular tools like n8n, Gitea, Metabase, and more with one click. Pre-configured and production-ready.",
    items: ["n8n", "Gitea", "Metabase", "Uptime Kuma"],
  },
  {
    icon: Bot,
    title: "AI Agents & Models",
    description: "Run AI assistants, chatbots, and model endpoints. GPU-accelerated inference available.",
    items: ["Custom Chatbots", "RAG Pipelines", "Model Endpoints", "Agent Swarms"],
  },
  {
    icon: Globe,
    title: "Full-Stack Apps",
    description: "Ship complete web applications with frontend, backend, and database. Auto-configured networking.",
    items: ["Next.js", "Express + Postgres", "Django", "Rails"],
  },
  {
    icon: Layers,
    title: "Custom Platforms",
    description: "Build and deploy your own multi-service platforms. Container orchestration handled for you.",
    items: ["Marketplaces", "SaaS Products", "Internal Tools", "API Gateways"],
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Describe", description: "Tell ACHEEVY what you need in plain language. Choose from our catalog or describe a custom deployment.", icon: MessageSquare },
  { step: "02", title: "Deploy", description: "ACHEEVY provisions containers, configures networking, sets up SSL, and handles the entire infrastructure.", icon: Cloud },
  { step: "03", title: "Manage", description: "Monitor health, scale resources, and manage the lifecycle — all orchestrated autonomously by AI.", icon: BarChart3 },
];

const CAPABILITIES = [
  { icon: Zap, title: "One-Click Deploy", desc: "From idea to running service in under 60 seconds. No DevOps required." },
  { icon: Shield, title: "Secure by Default", desc: "Auto-SSL, isolated containers, firewall rules, and continuous security monitoring." },
  { icon: Cpu, title: "AI-Orchestrated", desc: "Autonomous health checks, scaling decisions, and incident response — 24/7." },
  { icon: MonitorCheck, title: "Full Lifecycle", desc: "Create, configure, deploy, monitor, scale, and decommission — all managed." },
  { icon: Workflow, title: "Workflow Automation", desc: "Chain services together with event-driven automations and CI/CD pipelines." },
  { icon: Lock, title: "Human-in-the-Loop", desc: "Critical actions require your approval. Full audit trail for every operation." },
];

const STATS = [
  { value: "17+", label: "Services Running" },
  { value: "<60s", label: "Deploy Time" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "24/7", label: "AI Monitoring" },
];

const LOGOS = ["Docker", "Kubernetes", "NGINX", "PostgreSQL", "Redis", "Node.js"];

// ══════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════

export default function HomePage() {
  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(heroProgress, [0, 1], ["0%", "15%"]);

  return (
    <main className="aims-agentic relative min-h-screen bg-[#09090B] text-zinc-100 selection:bg-gold/20">
      <ScrollProgress />
      <AgenticBackground />

      <div className="relative z-10">
        <Nav />

        {/* ══════════════════════════════════════════════════
            HERO — Agentic Design System
           ══════════════════════════════════════════════════ */}
        <section
          ref={heroRef}
          className="relative min-h-[92vh] flex items-center justify-center px-4 md:px-6"
        >
          <motion.div
            style={{ opacity: heroOpacity, y: heroY }}
            className="max-w-5xl mx-auto text-center"
            variants={heroStagger}
            initial="hidden"
            animate="visible"
          >
            {/* Status badge — agentic-ui Badge */}
            <motion.div variants={heroItem}>
              <Badge variant="outline" className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border-gold/25 bg-gold/[0.05] text-gold mb-8 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inset-0 rounded-full bg-gold opacity-75" />
                  <span className="relative rounded-full h-2 w-2 bg-gold" />
                </span>
                A.I.M.S. AI Managed Solutions · Platform Live
              </Badge>
            </motion.div>

            {/* Headline */}
            <motion.div variants={heroItem}>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6">
                Your AI Team.
                <br />
                <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  Fully Managed.
                </span>
              </h1>
            </motion.div>

            {/* Subhead */}
            <motion.div variants={heroItem}>
              <p className="text-lg sm:text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-6">
                A.I.M.S. is an AI-orchestrated platform that deploys, monitors, and
                manages your infrastructure — from containers to full-stack apps —
                with autonomous lifecycle management.
              </p>
            </motion.div>

            <motion.div variants={heroItem}>
              <p className="text-sm text-zinc-600 mb-10">
                Learn how we handle data in our{" "}
                <Link href="/privacy-policy" className="text-gold/70 hover:text-gold underline underline-offset-4 transition-colors">
                  Privacy Policy
                </Link>
                .
              </p>
            </motion.div>

            {/* CTAs — agentic-ui Buttons */}
            <motion.div variants={heroItem} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/chat">
                <Button className="h-13 px-8 text-base font-bold bg-gold hover:bg-gold-light text-black rounded-xl gap-2.5 shadow-[0_0_20px_rgba(217,119,6,0.2)] hover:shadow-[0_0_30px_rgba(217,119,6,0.3)] transition-all">
                  Chat with ACHEEVY
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" className="h-13 px-8 text-base font-semibold border-white/10 text-zinc-300 hover:border-gold/30 hover:bg-gold/[0.04] rounded-xl gap-2.5">
                  See How It Works
                  <Play className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </motion.div>

            {/* Stats strip */}
            <motion.div variants={heroItem} className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-zinc-600 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Ambient hero glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        </section>

        {/* ══════════════════════════════════════════════════
            TRUSTED BY — Logo cloud
           ══════════════════════════════════════════════════ */}
        <section className="py-16 px-4 md:px-6 border-y border-white/[0.04]">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal direction="none">
              <p className="text-center text-[10px] font-medium text-zinc-600 uppercase tracking-[0.2em] mb-8">
                Built on enterprise infrastructure
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
                {LOGOS.map((name) => (
                  <span key={name} className="text-sm font-medium text-zinc-600 hover:text-zinc-400 transition-colors cursor-default">
                    {name}
                  </span>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            HOW IT WORKS — 3-step pipeline
           ══════════════════════════════════════════════════ */}
        <section id="how-it-works" className="py-28 px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-20">
                <Badge variant="outline" className="text-gold border-gold/20 bg-gold/[0.05] mb-4">
                  How It Works
                </Badge>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight">
                  Three Steps to{" "}
                  <span className="bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent">Live</span>
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map((item, i) => (
                <ScrollReveal key={item.step} delay={i * stagger.normal}>
                  <GlowBorder theme="gold">
                    <motion.div
                      className="relative p-8 bg-[#111113] rounded-2xl h-full"
                      variants={hoverLiftGlow}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      {/* Step number watermark */}
                      <span className="text-7xl font-black text-white/[0.03] absolute top-3 right-5 select-none">
                        {item.step}
                      </span>
                      <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-6">
                          <item.icon className="w-5 h-5 text-gold" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-zinc-100">{item.title}</h3>
                        <p className="text-base text-zinc-500 leading-relaxed">{item.description}</p>
                      </div>
                      {/* Connector */}
                      {i < 2 && (
                        <div className="hidden md:block absolute top-1/2 -right-3 w-6 border-t border-dashed border-gold/15" />
                      )}
                    </motion.div>
                  </GlowBorder>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            WHAT YOU CAN DEPLOY — Category cards
           ══════════════════════════════════════════════════ */}
        <section className="py-28 px-4 md:px-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.03)_0%,transparent_70%)] pointer-events-none" />

          <div className="max-w-6xl mx-auto relative">
            <ScrollReveal>
              <div className="text-center mb-20">
                <Badge variant="outline" className="text-gold border-gold/20 bg-gold/[0.05] mb-4">
                  Plug Catalog
                </Badge>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight">
                  What You Can Deploy
                </h2>
                <p className="mt-4 text-zinc-500 max-w-xl mx-auto">
                  Browse our growing library of pre-configured deployments, or describe something custom.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-6">
              {DEPLOY_CATEGORIES.map((cat, i) => (
                <ScrollReveal key={cat.title} delay={i * stagger.normal}>
                  <GlowBorder theme="gold">
                    <motion.div
                      className="group relative p-8 h-full bg-[#111113] rounded-2xl"
                      variants={hoverLiftGlow}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-5">
                          <cat.icon className="w-6 h-6 text-gold" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-zinc-100">{cat.title}</h3>
                        <p className="text-base text-zinc-500 leading-relaxed mb-5">{cat.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {cat.items.map((item) => (
                            <Badge key={item} variant="outline" className="border-gold/15 bg-gold/[0.04] text-gold/80 text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <ChevronRight className="absolute top-8 right-8 w-5 h-5 text-zinc-700 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                    </motion.div>
                  </GlowBorder>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={0.3}>
              <div className="mt-12 text-center">
                <Link href="/plugs" className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors font-medium">
                  Browse Full Catalog
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            CAPABILITIES — Bento grid
           ══════════════════════════════════════════════════ */}
        <section className="py-28 px-4 md:px-6 border-y border-white/[0.04]">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-20">
                <Badge variant="outline" className="text-gold border-gold/20 bg-gold/[0.05] mb-4">
                  Platform
                </Badge>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight">
                  Built for{" "}
                  <span className="bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent">Production</span>
                </h2>
              </div>
            </ScrollReveal>

            <BentoGrid columns={3}>
              {CAPABILITIES.map((cap) => (
                <BentoItem key={cap.title}>
                  <GlowBorder theme="gold">
                    <motion.div
                      className="p-6 bg-[#111113] rounded-2xl h-full"
                      variants={hoverLiftGlow}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                        <cap.icon className="w-5 h-5 text-gold" />
                      </div>
                      <h3 className="font-semibold mb-2 text-zinc-100">{cap.title}</h3>
                      <p className="text-sm text-zinc-500 leading-relaxed">{cap.desc}</p>
                    </motion.div>
                  </GlowBorder>
                </BentoItem>
              ))}
            </BentoGrid>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            PHILOSOPHY
           ══════════════════════════════════════════════════ */}
        <section className="py-28 px-4 md:px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/[0.015] to-transparent pointer-events-none" />
          <div className="max-w-4xl mx-auto relative text-center">
            <ScrollReveal>
              <Badge variant="outline" className="text-gold border-gold/20 bg-gold/[0.05] mb-6">
                <Sparkles className="w-3 h-3 mr-1" />
                The Philosophy
              </Badge>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tight leading-tight">
                We build the{" "}
                <span className="bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent">
                  nervous system
                </span>{" "}
                for the autonomous enterprise.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="mt-8 text-base md:text-lg text-zinc-500 leading-relaxed max-w-2xl mx-auto">
                Rejecting the friction of manual orchestration, we engineer
                intelligent loops that blend data precision with infinite scale
                to accelerate and evolve.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            TESTIMONIALS
           ══════════════════════════════════════════════════ */}
        <section className="py-28 px-4 md:px-6 border-y border-white/[0.04]">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-16">
                <Badge variant="outline" className="text-gold border-gold/20 bg-gold/[0.05] mb-4">
                  Testimonials
                </Badge>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight">
                  Trusted by Teams Who{" "}
                  <span className="bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent">Automate</span>
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { quote: "A.I.M.S. completely changed how we handle deployment. The autonomous orchestration saved us hundreds of engineering hours.", name: "Operations Lead", role: "Tech Startup" },
                { quote: "The ability to deploy and manage containers through conversation is a game changer. We shipped 3x faster.", name: "CTO", role: "SaaS Platform" },
                { quote: "Finally, an AI platform that treats infrastructure as code. Full lifecycle management with human oversight where it matters.", name: "DevOps Lead", role: "Enterprise Team" },
              ].map((t, i) => (
                <ScrollReveal key={i} delay={i * stagger.normal}>
                  <GlowBorder theme="gold">
                    <div className="p-8 flex flex-col h-full bg-[#111113] rounded-2xl">
                      <p className="text-base text-zinc-400 leading-relaxed flex-1 italic">
                        &ldquo;{t.quote}&rdquo;
                      </p>
                      <div className="mt-6 pt-4 border-t border-white/[0.06]">
                        <p className="text-base font-bold text-zinc-100">{t.name}</p>
                        <p className="text-sm text-zinc-600">{t.role}</p>
                      </div>
                    </div>
                  </GlowBorder>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            FINAL CTA
           ══════════════════════════════════════════════════ */}
        <section className="py-28 px-4 md:px-6">
          <ScrollReveal speed="cinematic">
            <div className="max-w-3xl mx-auto relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 rounded-[2rem] blur-2xl" />

              <GlowBorder theme="gold" rounded="rounded-[2rem]">
                <div className="relative p-12 md:p-20 text-center bg-[#111113] rounded-[2rem] overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.08)_0%,transparent_70%)] pointer-events-none" />

                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-8 p-1 shadow-[0_0_20px_rgba(217,119,6,0.1)]">
                      <Image src="/images/acheevy/acheevy-helmet.png" alt="ACHEEVY" width={48} height={48} className="rounded-xl" />
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
                      Ready to{" "}
                      <span className="bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent">Automate</span>?
                    </h2>
                    <p className="text-zinc-500 text-base md:text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                      Join the platform that turns ideas into running services. No infrastructure headaches. No DevOps hiring.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Link href="/chat">
                        <Button className="h-13 px-8 text-base font-bold bg-gold hover:bg-gold-light text-black rounded-xl gap-2.5 shadow-[0_0_20px_rgba(217,119,6,0.2)] hover:shadow-[0_0_30px_rgba(217,119,6,0.3)] transition-all">
                          Get Started Free
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href="/(auth)/sign-up">
                        <Button variant="outline" className="h-13 px-8 text-base font-semibold border-gold/20 text-zinc-300 hover:border-gold/30 hover:bg-gold/[0.04] rounded-xl">
                          Create Account
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </GlowBorder>
            </div>
          </ScrollReveal>
        </section>

        {/* ── Footer ── */}
        <footer className="py-12 border-t border-white/[0.04] px-4 md:px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image src="/images/acheevy/acheevy-helmet.png" alt="A.I.M.S." width={24} height={24} />
              <span className="text-xs text-zinc-600">
                &copy; {new Date().getFullYear()} ACHIEVEMOR · A.I.M.S.
              </span>
            </div>
            <div className="flex gap-8 text-xs text-zinc-600">
              <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
              <Link href="/privacy-policy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
              <Link href="/pricing" className="hover:text-zinc-400 transition-colors">Pricing</Link>
              <Link href="/about" className="hover:text-zinc-400 transition-colors">About</Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

// ══════════════════════════════════════════════════════════
// Navigation — glass nav bar with agentic-ui Button
// ══════════════════════════════════════════════════════════

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
            borderColor: useTransform(navBorder, (v) => `rgba(217, 119, 6, ${v * 0.15})`),
          }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/images/acheevy/acheevy-helmet.png" alt="A.I.M.S." width={28} height={28} />
            <span className="text-base font-bold tracking-[0.15em] font-display text-zinc-100">A.I.M.S.</span>
          </Link>

          {/* Center links — desktop */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: "/plugs", label: "Catalog" },
              { href: "#how-it-works", label: "How It Works" },
              { href: "/pricing", label: "Pricing" },
              { href: "/privacy-policy", label: "Privacy" },
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
            <Link href="/(auth)/sign-in" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link href="/chat">
              <Button size="sm" className="bg-gold hover:bg-gold-light text-black font-semibold rounded-lg">
                Get Started
              </Button>
            </Link>
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
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={transition.fast}
            className="fixed top-16 left-0 right-0 z-40 bg-[#09090B]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 py-6"
          >
            <div className="flex flex-col gap-3 max-w-6xl mx-auto">
              {[
                { href: "/plugs", label: "Catalog" },
                { href: "#how-it-works", label: "How It Works" },
                { href: "/pricing", label: "Pricing" },
                { href: "/privacy-policy", label: "Privacy" },
                { href: "/about", label: "About" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-gold/[0.06] rounded-xl transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
