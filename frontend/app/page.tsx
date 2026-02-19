import { SiteHeader } from "@/components/SiteHeader";
import { Hero } from "@/components/landing/Hero";
import Footer from "@/components/landing/Footer";
import Link from "next/link";
import {
  MessageSquare,
  Trophy,
  BarChart3,
  Shield,
  Zap,
  Clock,
  ChevronRight,
  CheckCircle2,
  Lock,
  Users,
  Code2,
  Workflow,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   A.I.M.S. Landing Page
   AIMS is the product. ACHEEVY is the AI orchestrator.
   Per|Form, Arena, Workshop are verticals / features.
   Uses the domain-aware Hero component for plugmein.cloud
   vs aimanagedsolutions.cloud differentiation.
   ═══════════════════════════════════════════════════════════ */

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      <SiteHeader />
      <Hero />
      <LiveNowSection />
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
    status: "live" as const,
  },
  {
    icon: Shield,
    title: "Dashboard + Health Monitor",
    description:
      "Real-time platform health, onboarding flow, and quick-access to all AIMS capabilities.",
    href: "/dashboard",
    status: "live" as const,
  },
  {
    icon: Trophy,
    title: "Per|Form Sports Analytics",
    description:
      "P.A.I. prospect scoring, Big Board rankings, scouting content feed. College football recruiting intelligence.",
    href: "/sandbox/perform",
    status: "live" as const,
  },
  {
    icon: BarChart3,
    title: "Arena Contests",
    description:
      "AI contests with real-time prize pools, entry tracking, and leaderboard streaks.",
    href: "/arena",
    status: "live" as const,
  },
  {
    icon: Zap,
    title: "Integrations Lab",
    description:
      "Test connected services — Groq, Brave Search, ElevenLabs TTS, E2B Sandbox — with live pass/fail results.",
    href: "/integrations",
    status: "live" as const,
  },
  {
    icon: Code2,
    title: "Sandbox",
    description:
      "Experiment with verticals, tools, and AI capabilities in a safe sandbox environment.",
    href: "/sandbox",
    status: "live" as const,
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
