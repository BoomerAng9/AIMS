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
  Clock,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   A.I.M.S. Landing Page — Warm Loft / Showroom Redesign
   
   Two domains, two vibes:
   • aimanagedsolutions.cloud → Showroom (loft, warm, premium)
   • plugmein.cloud → Storefront (ACHEEVY with plug cube)
   
   Post sign-up → Experience Selection Gateway
   All chat routes → /chat (central hub)
   ═══════════════════════════════════════════════════════════ */

// ── Domain Detection ──
function useIsShowroom(): boolean {
  const [isShowroom, setIsShowroom] = useState(false);
  useEffect(() => {
    const host = window.location.hostname.replace(/^www\./, "");
    setIsShowroom(
      host === "aimanagedsolutions.cloud" ||
      host === "localhost" ||
      host === "127.0.0.1"
    );
  }, []);
  return isShowroom;
}

// ── Animation Variants ──
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

// ── Experience Tiles ──
const EXPERIENCES = [
  {
    id: "chat",
    title: "Chat w/ACHEEVY",
    description: "Your AI executive orchestrator. Voice + text. Multi-model. Real-time streaming.",
    icon: MessageSquare,
    href: "/chat",
    gradient: "from-amber-900/40 to-yellow-900/20",
    border: "border-gold/30",
    accent: "text-gold",
    status: "live",
  },
  {
    id: "perform",
    title: "Per|Form Platform",
    description: "AI-powered sports analytics. P.A.I. scoring. 131 programs. Big Board. War Room.",
    icon: Trophy,
    href: "/sandbox/perform",
    gradient: "from-emerald-900/30 to-teal-900/20",
    border: "border-emerald-500/30",
    accent: "text-emerald-400",
    status: "live",
  },
  {
    id: "boomerang",
    title: "Build a Boomer_Ang",
    description: "Design and deploy your own specialized AI worker. Custom skills. Custom persona.",
    icon: Hammer,
    href: "/dashboard/boomerangs",
    gradient: "from-blue-900/30 to-indigo-900/20",
    border: "border-blue-500/30",
    accent: "text-blue-400",
    status: "beta",
  },
  {
    id: "chicken-hawk",
    title: "Unleash Chicken Hawk",
    description: "Autonomous execution engine. Chicken Hawk spawns Lil_Hawks to handle multi-step tasks.",
    icon: Bird,
    href: "/dashboard/deploy-dock",
    gradient: "from-purple-900/30 to-violet-900/20",
    border: "border-purple-500/30",
    accent: "text-purple-400",
    status: "beta",
  },
  {
    id: "coming-soon",
    title: "Coming Soon",
    description: "PersonaPlex Voice Agent. Plug Marketplace. Autonomous Scheduling. Always growing.",
    icon: Sparkles,
    href: "#roadmap",
    gradient: "from-white/[0.03] to-white/[0.01]",
    border: "border-white/10",
    accent: "text-white/50",
    status: "planned",
  },
];

// ── Status Badge ──
function StatusBadge({ status }: { status: string }) {
  const styles = {
    live: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    beta: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    planned: "bg-white/5 text-white/40 border-white/10",
  };
  const labels = { live: "Live", beta: "Beta", planned: "Planned" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider rounded-full px-2.5 py-0.5 border ${styles[status as keyof typeof styles] || styles.planned}`}>
      {status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function HomePage() {
  const isShowroom = useIsShowroom();

  return (
    <main className="relative flex flex-col min-h-screen bg-loft-bg overflow-x-hidden">
      {/* Warm ambient grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[1] opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Warm vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-[2]"
        aria-hidden="true"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(12,8,4,0.6) 100%)",
        }}
      />

      <SiteNav />
      {isShowroom ? <ShowroomHero /> : <PlugmeinHero />}
      <ExperienceGateway />
      <PlatformPillars />
      <RoadmapPreview />
      <FinalCTA />
      <SiteFooter />
    </main>
  );
}

/* ─── Site Nav ─────────────────────────────────────────────── */

function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-loft-bg/80 border-b border-loft-floor/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/images/acheevy/acheevy-helmet.png"
            alt="A.I.M.S."
            width={28}
            height={28}
            className="rounded-lg group-hover:scale-110 transition-transform"
          />
          <span
            className="text-lg font-black text-loft-cream tracking-wider"
            style={{ fontFamily: "var(--font-marker), cursive" }}
          >
            A.I.M.S.
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            className="hidden sm:inline-flex items-center gap-2 text-sm text-loft-tan hover:text-loft-cream transition-colors"
          >
            Chat w/ACHEEVY
          </Link>
          <Link
            href="/(auth)/sign-in"
            className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-gold text-loft-bg text-sm font-semibold hover:bg-gold-light transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─── Showroom Hero (aimanagedsolutions.cloud) ─────────────── */

function ShowroomHero() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Showroom background */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/acheevy/showroom-hero.png"
          alt=""
          fill
          priority
          className="object-cover object-center opacity-50"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(28,20,16,0.4) 0%, rgba(28,20,16,0.2) 30%, rgba(28,20,16,0.6) 70%, rgba(28,20,16,0.98) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-20 md:py-28 w-full">
        <div className="max-w-2xl">
          {/* System badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/20 bg-gold/5 mb-8"
          >
            <div className="relative w-2.5 h-2.5">
              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
              <div className="relative w-full h-full rounded-full bg-emerald-400" />
            </div>
            <span className="text-sm text-loft-cream/80 font-mono tracking-wide">
              System Online
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-loft-cream mb-4 leading-[1.1]"
            style={{
              fontFamily: 'var(--font-marker), "Permanent Marker", cursive',
              textShadow: "0 4px 40px rgba(212,168,67,0.15)",
            }}
          >
            A.I.M.S.
          </motion.h1>

          {/* Subtitle */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg sm:text-xl md:text-2xl text-gold font-bold tracking-[0.15em] uppercase mb-6"
            style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}
          >
            AI Managed Solutions
          </motion.h2>

          {/* Copy */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-base sm:text-lg text-loft-cream/70 max-w-lg leading-relaxed mb-10"
          >
            I&apos;m ACHEEVY, at your service. Your AI-managed operations
            platform — 25 specialized agents, voice-first orchestration, and
            evidence-based execution.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-gold text-loft-bg text-base font-bold hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all"
            >
              Chat w/ACHEEVY
              <MessageSquare className="w-5 h-5" />
            </Link>
            <Link
              href="#experiences"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl border border-loft-tan/30 text-loft-cream text-base font-medium hover:border-gold/40 hover:bg-gold/5 transition-all"
            >
              Choose Your Experience
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Plugmein Hero (plugmein.cloud) ───────────────────────── */

function PlugmeinHero() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-loft-bg via-loft-wall to-loft-bg" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-20 md:py-28 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Text side */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1
                className="text-4xl sm:text-5xl md:text-6xl font-black text-loft-cream mb-4 leading-[1.1]"
                style={{
                  fontFamily: 'var(--font-marker), "Permanent Marker", cursive',
                  textShadow: "0 4px 40px rgba(212,168,67,0.15)",
                }}
              >
                PLUG ME IN
              </h1>
              <p
                className="text-xl text-gold/80 tracking-[0.2em] uppercase font-bold mb-6"
                style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}
              >
                Deploy More Plugs
              </p>
              <p className="text-base sm:text-lg text-loft-cream/60 max-w-md mx-auto lg:mx-0 leading-relaxed mb-8">
                ACHEEVY builds apps autonomously, deploys to CDN, and delivers
                to users. From conversation to working software.
              </p>
              <Link
                href="/chat"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-gold text-loft-bg text-base font-bold hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all"
              >
                Start Building
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>

          {/* ACHEEVY character */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex-shrink-0"
          >
            <div className="relative w-[280px] h-[380px] sm:w-[340px] sm:h-[460px]">
              <Image
                src="/images/acheevy/hero-character.png"
                alt="ACHEEVY holding a plug"
                fill
                className="object-contain drop-shadow-[0_20px_60px_rgba(212,175,55,0.15)]"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Experience Gateway ───────────────────────────────────── */

function ExperienceGateway() {
  return (
    <section id="experiences" className="relative border-t border-loft-floor/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-mono uppercase tracking-[0.25em] text-gold/60 mb-3"
          >
            Choose Your Experience
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-loft-cream"
            style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}
          >
            What will we build today?
          </motion.h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {EXPERIENCES.map((exp, i) => (
            <motion.div
              key={exp.id}
              custom={i}
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <Link
                href={exp.href}
                className={`group block rounded-2xl border ${exp.border} bg-gradient-to-b ${exp.gradient} p-6 hover:scale-[1.02] hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)] transition-all duration-300 h-full`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-11 h-11 rounded-xl border ${exp.border} bg-black/20 flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <exp.icon className={`w-5 h-5 ${exp.accent}`} />
                  </div>
                  <StatusBadge status={exp.status} />
                </div>

                <h3
                  className={`text-lg font-bold text-loft-cream mb-2 group-hover:${exp.accent} transition-colors`}
                >
                  {exp.title}
                </h3>
                <p className="text-sm text-loft-cream/50 leading-relaxed mb-4">
                  {exp.description}
                </p>

                <div
                  className={`flex items-center gap-1.5 text-xs font-mono ${exp.accent} opacity-60 group-hover:opacity-100 transition-opacity`}
                >
                  {exp.status === "planned" ? "Coming soon" : "Enter"}
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Platform Pillars ─────────────────────────────────────── */

const PILLARS = [
  {
    icon: Users,
    title: "25 AI Agents",
    description:
      "Boomer_Ang workers — researcher, coder, designer, marketer — executing real tasks end-to-end under ACHEEVY's command.",
  },
  {
    icon: Workflow,
    title: "Managed Operations",
    description:
      "From project management to deployment. ACHEEVY orchestrates your business operations with evidence-based execution.",
  },
  {
    icon: Code2,
    title: "Vibe Coding",
    description:
      "Conversate your way to working applications. ACHEEVY builds and deploys aiPLUGs — real apps from conversation.",
  },
  {
    icon: Shield,
    title: "No Proof, No Done",
    description:
      "Every completed task requires evidence. Built-in accountability across every operation and workflow.",
  },
];

function PlatformPillars() {
  return (
    <section className="relative border-t border-loft-floor/20 bg-loft-wall/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center mb-14">
          <p className="text-xs font-mono uppercase tracking-[0.25em] text-gold/60 mb-3">
            The Platform
          </p>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-loft-cream"
            style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}
          >
            AI Managed Solutions
          </h2>
          <p className="mt-4 text-loft-cream/50 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            A.I.M.S. is a full-stack AI operations platform. ACHEEVY
            orchestrates a team of specialized agents to handle your business —
            from content creation to code deployment.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {PILLARS.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="rounded-2xl border border-loft-floor/30 bg-loft-bg/60 p-6 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl border border-gold/20 bg-gold/5 flex items-center justify-center">
                  <pillar.icon className="w-5 h-5 text-gold/70" />
                </div>
                <h3 className="text-base font-semibold text-loft-cream">
                  {pillar.title}
                </h3>
              </div>
              <p className="text-sm text-loft-cream/50 leading-relaxed">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Roadmap Preview ──────────────────────────────────────── */

const ROADMAP = [
  {
    title: "Google OAuth + Stripe Payments",
    eta: "Now",
    status: "wiring",
  },
  {
    title: "Per|Form Live Pipeline",
    eta: "Q1 2026",
    status: "building",
  },
  {
    title: "PersonaPlex Full-Duplex Voice",
    eta: "Q2 2026",
    status: "planned",
  },
  {
    title: "Plug Marketplace + CDN Deploy",
    eta: "Q2 2026",
    status: "planned",
  },
];

function RoadmapPreview() {
  return (
    <section id="roadmap" className="border-t border-loft-floor/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center mb-14">
          <p className="text-xs font-mono uppercase tracking-[0.25em] text-gold/60 mb-3">
            Roadmap
          </p>
          <h2
            className="text-2xl sm:text-3xl font-bold text-loft-cream"
            style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}
          >
            What&apos;s coming next
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {ROADMAP.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-loft-floor/20 bg-loft-wall/30 p-5 flex items-center gap-4"
            >
              <div
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.status === "wiring"
                    ? "bg-amber-400"
                    : item.status === "building"
                      ? "bg-blue-400"
                      : "bg-white/20"
                  }`}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-loft-cream truncate">
                  {item.title}
                </h3>
              </div>
              <span className="text-[11px] font-mono text-loft-cream/30 uppercase flex-shrink-0">
                {item.eta}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ────────────────────────────────────────────── */

function FinalCTA() {
  return (
    <section className="relative border-t border-loft-floor/20 bg-loft-wall/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
        <div className="relative rounded-3xl border border-gold/15 bg-gradient-to-b from-gold/[0.06] to-transparent p-8 sm:p-12 lg:p-16 text-center overflow-hidden">
          {/* ACHEEVY avatar */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl border border-gold/20 bg-loft-bg overflow-hidden">
            <Image
              src="/images/acheevy/acheevy-helmet-chat.png"
              alt="ACHEEVY"
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>

          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-loft-cream mb-4"
            style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}
          >
            Your AI team awaits.
          </h2>
          <p className="text-loft-cream/50 max-w-lg mx-auto mb-8 text-sm sm:text-base leading-relaxed">
            ACHEEVY is live and building in public. Chat is live, the dashboard
            is live, and execution engines are being wired now.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row justify-center">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-gold text-loft-bg text-sm font-bold hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all"
            >
              Chat w/ACHEEVY
              <MessageSquare className="w-4 h-4" />
            </Link>
            <Link
              href="/(auth)/sign-up"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl border border-loft-tan/30 text-loft-cream text-sm font-medium hover:border-gold/40 hover:bg-gold/5 transition-all"
            >
              Sign Up Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ───────────────────────────────────────────────── */

function SiteFooter() {
  return (
    <footer className="border-t border-loft-floor/15 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-loft-cream/30">
          © {new Date().getFullYear()} ACHIEVEMOR · AI Managed Solutions
        </p>
        <div className="flex gap-6">
          <Link
            href="/the-book-of-vibe"
            className="text-xs text-loft-cream/30 hover:text-gold/60 transition-colors"
          >
            The Book of V.I.B.E.
          </Link>
          <Link
            href="/gallery"
            className="text-xs text-loft-cream/30 hover:text-gold/60 transition-colors"
          >
            Gallery
          </Link>
          <Link
            href="/pricing"
            className="text-xs text-loft-cream/30 hover:text-gold/60 transition-colors"
          >
            Pricing
          </Link>
        </div>
      </div>
    </footer>
  );
}
