"use client";

import { SiteHeader } from "@/components/SiteHeader";
import { Hero } from "@/components/landing/Hero";
import Footer from "@/components/landing/Footer";
import Link from "next/link";
import {
  MessageSquare,
  Trophy,
  Shield,
  Zap,
  Clock,
  ChevronRight,
  CheckCircle2,
  Lock,
  Users,
  Code2,
  Workflow,
  GraduationCap,
  ArrowUpRight,
} from "lucide-react";
import { CONFERENCES, INDEPENDENTS, type Conference } from "@/lib/perform/conferences";
import { TIER_STYLES, TREND_STYLES, getScoreColor } from "@/lib/perform/types";

/* ═══════════════════════════════════════════════════════════
   A.I.M.S. Landing Page
   AIMS is the product. ACHEEVY is the AI orchestrator.
   Per|Form conferences + Big Board are featured prominently.
   Domain-aware Hero for plugmein.cloud vs aimanagedsolutions.cloud.
   ═══════════════════════════════════════════════════════════ */

// ── Prospect seed data (same as API route fallback) ──
const PROSPECTS = [
  { name: "Cameron Price", position: "QB", school: "IMG Academy", state: "FL", classYear: "'26", paiScore: 95, tier: "ELITE" as const, nationalRank: 1, trend: "STEADY" as const, previousRank: 1, nilEstimate: "$1M+", slug: "cameron-price" },
  { name: "Marcus Johnson", position: "QB", school: "Oakwood HS", state: "TX", classYear: "'26", paiScore: 92, tier: "ELITE" as const, nationalRank: 3, trend: "UP" as const, previousRank: 5, nilEstimate: "$500K–$1M", slug: "marcus-johnson" },
  { name: "Damien Brooks", position: "DE", school: "Riverside HS", state: "SC", classYear: "'26", paiScore: 91, tier: "ELITE" as const, nationalRank: 4, trend: "UP" as const, previousRank: 6, nilEstimate: "$400K–$800K", slug: "damien-brooks" },
  { name: "Khalil Robinson", position: "CB", school: "St. Augustine Prep", state: "NJ", classYear: "'26", paiScore: 88, tier: "BLUE_CHIP" as const, nationalRank: 8, trend: "STEADY" as const, previousRank: 7, nilEstimate: "$300K–$600K", slug: "khalil-robinson" },
  { name: "Isaiah Torres", position: "OT", school: "Don Bosco Prep", state: "NJ", classYear: "'26", paiScore: 86, tier: "BLUE_CHIP" as const, nationalRank: 10, trend: "UP" as const, previousRank: 14, nilEstimate: "$200K–$450K", slug: "isaiah-torres" },
  { name: "DeShawn Williams", position: "WR", school: "Central HS", state: "GA", classYear: "'26", paiScore: 85, tier: "BLUE_CHIP" as const, nationalRank: 12, trend: "UP" as const, previousRank: 18, nilEstimate: "$250K–$500K", slug: "deshawn-williams" },
  { name: "Andre Washington", position: "S", school: "Cass Tech", state: "MI", classYear: "'26", paiScore: 82, tier: "BLUE_CHIP" as const, nationalRank: 15, trend: "STEADY" as const, previousRank: 16, nilEstimate: "$150K–$350K", slug: "andre-washington" },
  { name: "Jaylen Carter", position: "RB", school: "Summit Prep", state: "FL", classYear: "'27", paiScore: 78, tier: "PROSPECT" as const, nationalRank: 28, trend: "STEADY" as const, previousRank: 28, nilEstimate: "$100K–$250K", slug: "jaylen-carter" },
  { name: "Trevor Mitchell", position: "LB", school: "Heritage Academy", state: "AL", classYear: "'26", paiScore: 68, tier: "SLEEPER" as const, nationalRank: 85, trend: "UP" as const, previousRank: 120, nilEstimate: "$10K–$50K", slug: "trevor-mitchell" },
  { name: "Xavier Coleman", position: "WR", school: "Mater Dei", state: "CA", classYear: "'26", paiScore: 58, tier: "DEVELOPMENTAL" as const, nationalRank: 180, trend: "NEW" as const, previousRank: 0, nilEstimate: "$5K–$15K", slug: "xavier-coleman" },
];

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      <SiteHeader />
      <Hero />
      <LiveNowSection />
      <ConferencesSection />
      <BigBoardSection />
      <WhyAIMSSection />
      <RoadmapSection />
      <FinalCTASection />
      <Footer />
    </main>
  );
}

/* ─── Live Now ─────────────────────────────────────────────── */

const LIVE_FEATURES = [
  {
    icon: MessageSquare,
    title: "Chat with ACHEEVY",
    description:
      "Full LLM streaming with model selection (Claude, Qwen, Gemini, Kimi). Voice input. File attachments. Thread history.",
    href: "/chat",
  },
  {
    icon: Shield,
    title: "Dashboard + Health Monitor",
    description:
      "Real-time platform health, onboarding flow, and quick-access to all AIMS capabilities.",
    href: "/dashboard",
  },
  {
    icon: Trophy,
    title: "Per|Form Sports Analytics",
    description:
      "P.A.I. prospect scoring, Big Board rankings, scouting content feed. 131 programs. 10 conferences.",
    href: "/sandbox/perform",
  },
  {
    icon: GraduationCap,
    title: "Conference Directory",
    description:
      "Complete CFB directory — Power 4, Group of 5, Independents. Every team, coach, stadium, and recruiting contact.",
    href: "/sandbox/perform/directory",
  },
  {
    icon: Zap,
    title: "Integrations Lab",
    description:
      "Test connected services — Groq, Brave Search, ElevenLabs TTS, E2B Sandbox — with live pass/fail results.",
    href: "/integrations",
  },
  {
    icon: Code2,
    title: "Sandbox",
    description:
      "Experiment with verticals, tools, and AI capabilities in a safe sandbox environment.",
    href: "/sandbox",
  },
];

function LiveNowSection() {
  return (
    <section id="live-now" className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="text-center mb-16">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-emerald-400/80 mb-3">
            Live Now
          </p>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            What you can use today
          </h2>
          <p className="mt-4 text-white/50 max-w-xl mx-auto">
            These features are built, deployed, and working. Try them now.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {LIVE_FEATURES.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group wireframe-card p-6 hover:border-emerald-500/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] group-hover:border-emerald-500/20 group-hover:bg-emerald-500/[0.05] transition-colors">
                  <feature.icon className="h-5 w-5 text-white/50 group-hover:text-emerald-400 transition-colors" />
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  Live
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2 group-hover:text-emerald-50 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-white/50 leading-relaxed">
                {feature.description}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs text-emerald-400/70 group-hover:text-emerald-400 transition-colors">
                Try it now
                <ChevronRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Conferences ──────────────────────────────────────────── */

function ConferenceCard({ conf }: { conf: Conference }) {
  // Show up to 6 team color dots
  const teamColors = conf.teams.slice(0, 8).map((t) => t.colors[0]?.hex || "#666");

  return (
    <Link
      href="/sandbox/perform/directory"
      className="group wireframe-card p-4 hover:border-gold/30 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-white group-hover:text-gold transition-colors">
          {conf.abbreviation}
        </h4>
        <span className={`text-[10px] font-mono uppercase tracking-wider rounded-full px-2 py-0.5 ${
          conf.tier === "power4"
            ? "text-gold bg-gold/10 border border-gold/20"
            : "text-blue-400 bg-blue-400/10 border border-blue-400/20"
        }`}>
          {conf.teams.length} teams
        </span>
      </div>
      <p className="text-xs text-white/40 mb-3 truncate">
        {conf.name}
      </p>
      {/* Team color strip */}
      <div className="flex gap-1.5 flex-wrap">
        {teamColors.map((hex, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full border border-white/10"
            style={{ backgroundColor: hex }}
            title={conf.teams[i]?.commonName}
          />
        ))}
        {conf.teams.length > 8 && (
          <div className="w-4 h-4 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
            <span className="text-[8px] text-white/40">+{conf.teams.length - 8}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function ConferencesSection() {
  const power4 = CONFERENCES.filter((c) => c.tier === "power4");
  const g5 = CONFERENCES.filter((c) => c.tier === "group_of_5");
  const totalTeams = CONFERENCES.reduce((sum, c) => sum + c.teams.length, 0) + INDEPENDENTS.length;

  return (
    <section className="border-t border-white/[0.06] bg-[#080808]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="text-center mb-12">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-gold/60 mb-3">
            Per|Form Directory
          </p>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            {totalTeams} Programs. Every Conference.
          </h2>
          <p className="mt-4 text-white/50 max-w-xl mx-auto">
            Complete college football directory with coaching staffs, stadiums, team colors, and recruiting contacts.
          </p>
        </div>

        {/* Power 4 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-gold/70">Power 4</span>
            <div className="h-px flex-1 bg-gold/10" />
          </div>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {power4.map((conf) => (
              <ConferenceCard key={conf.id} conf={conf} />
            ))}
          </div>
        </div>

        {/* Group of 5 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-400/70">Group of 5</span>
            <div className="h-px flex-1 bg-blue-400/10" />
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {g5.map((conf) => (
              <ConferenceCard key={conf.id} conf={conf} />
            ))}
          </div>
        </div>

        {/* Independents + CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <p className="text-sm text-white/40">
            + {INDEPENDENTS.length} Independents: {INDEPENDENTS.map((t) => t.commonName).join(", ")}
          </p>
          <Link
            href="/sandbox/perform/directory"
            className="inline-flex items-center gap-2 text-sm text-gold/80 hover:text-gold transition-colors"
          >
            Browse all teams
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Big Board (All Prospects) ────────────────────────────── */

function BigBoardSection() {
  return (
    <section className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="text-center mb-12">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-gold/60 mb-3">
            Per|Form Big Board
          </p>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Top Prospects — P.A.I. Rankings
          </h2>
          <p className="mt-4 text-white/50 max-w-xl mx-auto">
            Performance. Athleticism. Intangibles. AI-powered scouting with Bull vs Bear debate analysis.
          </p>
        </div>

        {/* Prospect table */}
        <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="p-3 text-left text-[10px] font-mono uppercase tracking-wider text-white/30 w-12">#</th>
                <th className="p-3 text-left text-[10px] font-mono uppercase tracking-wider text-white/30">Prospect</th>
                <th className="p-3 text-center text-[10px] font-mono uppercase tracking-wider text-white/30">Pos</th>
                <th className="p-3 text-center text-[10px] font-mono uppercase tracking-wider text-white/30">Class</th>
                <th className="p-3 text-center text-[10px] font-mono uppercase tracking-wider text-white/30">P.A.I.</th>
                <th className="p-3 text-center text-[10px] font-mono uppercase tracking-wider text-white/30">Tier</th>
                <th className="p-3 text-center text-[10px] font-mono uppercase tracking-wider text-white/30">Trend</th>
                <th className="p-3 text-right text-[10px] font-mono uppercase tracking-wider text-white/30">NIL Est.</th>
              </tr>
            </thead>
            <tbody>
              {PROSPECTS.map((p) => {
                const tierStyle = TIER_STYLES[p.tier];
                const trendStyle = TREND_STYLES[p.trend];
                const scoreColor = getScoreColor(p.paiScore);
                const delta = p.trend === "UP" && p.previousRank > 0
                  ? p.previousRank - p.nationalRank
                  : 0;

                return (
                  <tr
                    key={p.slug}
                    className="border-t border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="p-3 text-sm font-mono text-white/40">
                      {p.nationalRank}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/sandbox/perform/prospects/${p.slug}`}
                        className="group"
                      >
                        <span className="text-sm font-semibold text-white group-hover:text-gold transition-colors">
                          {p.name}
                        </span>
                        <span className="block text-xs text-white/40">
                          {p.school}, {p.state}
                        </span>
                      </Link>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-xs font-mono text-white/60 bg-white/[0.04] rounded px-1.5 py-0.5">
                        {p.position}
                      </span>
                    </td>
                    <td className="p-3 text-center text-xs text-white/50">
                      {p.classYear}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-lg font-bold font-display ${scoreColor}`}>
                        {p.paiScore}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] font-mono uppercase tracking-wider rounded-full px-2 py-0.5 ${tierStyle.bg} ${tierStyle.border} ${tierStyle.text} border`}>
                        {tierStyle.label}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-xs font-mono ${trendStyle.color}`}>
                        {trendStyle.icon}
                        {delta > 0 && <span className="ml-0.5">+{delta}</span>}
                      </span>
                    </td>
                    <td className="p-3 text-right text-xs text-white/50">
                      {p.nilEstimate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center mt-6">
          <Link
            href="/sandbox/perform/big-board"
            className="inline-flex items-center gap-2 text-sm text-gold/80 hover:text-gold transition-colors"
          >
            View full Big Board with scouting reports
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Why AIMS ─────────────────────────────────────────────── */

const PLATFORM_PILLARS = [
  {
    icon: Users,
    title: "25 AI Agents",
    description: "Boomer_Ang workers — researcher, coder, designer, marketer — executing real tasks end-to-end under ACHEEVY's command.",
  },
  {
    icon: Workflow,
    title: "Managed Operations",
    description: "From project management to deployment. ACHEEVY orchestrates your business operations with evidence-based execution.",
  },
  {
    icon: Code2,
    title: "Vibe Coding",
    description: "Conversate your way to working applications. ACHEEVY builds and deploys aiPLUGs — real apps from conversation.",
  },
  {
    icon: Shield,
    title: "No Proof, No Done",
    description: "Every completed task requires evidence. Built-in accountability across every operation and workflow.",
  },
];

function WhyAIMSSection() {
  return (
    <section className="border-t border-white/[0.06] bg-[#080808]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="text-center mb-16">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-gold/60 mb-3">
            The Platform
          </p>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            AI Managed Solutions
          </h2>
          <p className="mt-4 text-white/50 max-w-2xl mx-auto">
            AIMS is a full-stack AI operations platform. ACHEEVY orchestrates a team of specialized agents
            to handle your business — from content creation to code deployment.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {PLATFORM_PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="wireframe-card p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl border border-gold/20 bg-gold/[0.05] flex items-center justify-center">
                  <pillar.icon className="w-5 h-5 text-gold/70" />
                </div>
                <h3 className="text-base font-semibold text-white">
                  {pillar.title}
                </h3>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Roadmap ──────────────────────────────────────────────── */

const ROADMAP_ITEMS = [
  {
    title: "Chicken Hawk Execution Engine",
    description: "Manifest-based autonomous task execution. Spawns Lil_Hawk squads to execute multi-step work.",
    status: "wiring" as const,
    eta: "Now",
  },
  {
    title: "II-Agent Autonomous Backend",
    description: "Full-stack dev, deep research, browser automation, and code execution via the ii-agent engine.",
    status: "wiring" as const,
    eta: "Now",
  },
  {
    title: "Boomer_Ang Workers",
    description: "25 specialized AI agents (researcher, coder, designer, marketer, etc.) executing real tasks end-to-end.",
    status: "building" as const,
    eta: "Q1 2026",
  },
  {
    title: "Google OAuth + Stripe Payments",
    description: "One-click Google sign-in and subscription billing through Stripe for the 3-6-9 pricing model.",
    status: "building" as const,
    eta: "Q1 2026",
  },
  {
    title: "Per|Form Live Pipeline",
    description: "Nightly autonomous scouting runs, real Brave Search data, SAM 2 film analysis on Vertex AI.",
    status: "building" as const,
    eta: "Q1 2026",
  },
  {
    title: "PersonaPlex Full-Duplex Voice",
    description: "NVIDIA Nemotron-powered voice agent with real-time bidirectional conversation via GCP Cloud Run.",
    status: "planned" as const,
    eta: "Q2 2026",
  },
  {
    title: "Plug Marketplace + CDN Deploy",
    description: "ACHEEVY builds apps autonomously, deploys to CDN, and delivers to users. Revenue generation loop.",
    status: "planned" as const,
    eta: "Q2 2026",
  },
  {
    title: "Autonomous Scheduling",
    description: "Cloud Run cron jobs, background workers, and event-driven agent loops. Always-on operations.",
    status: "planned" as const,
    eta: "Q2 2026",
  },
];

function RoadmapSection() {
  return (
    <section id="roadmap" className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="text-center mb-16">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-gold/60 mb-3">
            Roadmap
          </p>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            What&apos;s coming next
          </h2>
          <p className="mt-4 text-white/50 max-w-xl mx-auto">
            Building in public. Every feature ships when it works — no placeholders, no demos.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {ROADMAP_ITEMS.map((item) => (
            <div
              key={item.title}
              className="wireframe-card p-5 flex gap-4"
            >
              <div className="flex-shrink-0 mt-0.5">
                {item.status === "wiring" ? (
                  <div className="h-8 w-8 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                ) : item.status === "building" ? (
                  <div className="h-8 w-8 rounded-lg border border-blue-500/30 bg-blue-500/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center">
                    <Lock className="w-4 h-4 text-white/30" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {item.title}
                  </h3>
                  <span className={`flex-shrink-0 text-[10px] font-mono uppercase tracking-wider rounded-full px-2 py-0.5 ${
                    item.status === "wiring"
                      ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                      : item.status === "building"
                      ? "text-blue-400 bg-blue-500/10 border border-blue-500/20"
                      : "text-white/40 bg-white/[0.03] border border-white/10"
                  }`}>
                    {item.status === "wiring" ? "In Progress" : item.status === "building" ? "Building" : "Planned"}
                  </span>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">
                  {item.description}
                </p>
                <p className="mt-1.5 text-[10px] font-mono text-white/25 uppercase">
                  ETA: {item.eta}
                </p>
              </div>
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
    <section className="border-t border-white/[0.06] bg-[#080808]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="wireframe-card relative overflow-hidden p-8 sm:p-12 lg:p-16 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.05)_0%,transparent_60%)]" />

          <div className="relative">
            <h2 className="font-display text-3xl font-bold sm:text-4xl mb-4">
              Your AI business architect awaits.
            </h2>
            <p className="text-white/50 max-w-lg mx-auto mb-8">
              ACHEEVY is live and building in public. Chat is live, the dashboard is live,
              and execution engines are being wired now.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row justify-center">
              <Link href="/chat" className="btn-primary h-12 px-8 text-sm">
                Chat with ACHEEVY
                <MessageSquare className="w-4 h-4" />
              </Link>
              <Link href="/dashboard" className="btn-secondary h-12 px-8 text-sm">
                Open Dashboard
                <Shield className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
