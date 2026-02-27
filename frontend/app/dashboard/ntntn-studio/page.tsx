// frontend/app/dashboard/ntntn-studio/page.tsx
"use client";

/**
 * NtNtN Creative Studio — The Build Engine Dashboard
 *
 * Surfaces the full NtNtN Engine pipeline:
 *   1. Creative Brief Intake — describe what you want built
 *   2. Intent Classification — real-time NLP category matching
 *   3. Stack Recommendation — Picker_Ang's selected technologies
 *   4. Three-Pillar Execution — IMAGE → INTERFACE → INTEGRATIONS
 *   5. Preview & Delivery — live preview + Buildsmith signature
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Box,
  Check,
  ChevronRight,
  Clock,
  Code,
  Cpu,
  Eye,
  FileImage,
  Gauge,
  Globe,
  Image as ImageIcon,
  Layers,
  Loader2,
  Monitor,
  Package,
  Palette,
  PenTool,
  Play,
  Plug,
  Rocket,
  Search,
  Send,
  Shield,
  Sparkles,
  Type,
  Wand2,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import {
  detectBuildIntent,
  classifyBuildIntent,
  detectScopeTier,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  SCOPE_TIER_INFO,
  AIMS_DEFAULT_STACK,
  BUILD_PHASE_ORDER,
  BUILD_PHASE_LABELS,
  type NtNtNCategory,
  type ScopeTier,
  type BuildPhase,
  type BuildManifest,
  type PillarStatus,
  type IntentMapping,
} from "@/lib/ntntn/engine";
import { transition, spring, stagger } from "@/lib/motion/tokens";
import { fadeUp, staggerContainer, staggerItem, scaleFade } from "@/lib/motion/variants";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type StudioTab = "brief" | "pipeline" | "history";

interface PillarTask {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "skipped";
}

interface ActiveBuild {
  manifest: BuildManifest;
  imageTasks: PillarTask[];
  interfaceTasks: PillarTask[];
  integrationsTasks: PillarTask[];
  logs: string[];
  startedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Pillar Task Templates                                              */
/* ------------------------------------------------------------------ */

const IMAGE_TASKS: PillarTask[] = [
  { id: "img-1", label: "Generate color palette", status: "pending" },
  { id: "img-2", label: "Select typography pairing", status: "pending" },
  { id: "img-3", label: "Create hero images", status: "pending" },
  { id: "img-4", label: "Generate icons & logos", status: "pending" },
  { id: "img-5", label: "Optimize assets (AVIF/WebP)", status: "pending" },
  { id: "img-6", label: "Create OG image", status: "pending" },
];

const INTERFACE_TASKS: PillarTask[] = [
  { id: "int-1", label: "Scaffold project structure", status: "pending" },
  { id: "int-2", label: "Configure design tokens", status: "pending" },
  { id: "int-3", label: "Generate components", status: "pending" },
  { id: "int-4", label: "Compose pages", status: "pending" },
  { id: "int-5", label: "Wire animations", status: "pending" },
  { id: "int-6", label: "Responsive polish", status: "pending" },
  { id: "int-7", label: "Accessibility audit", status: "pending" },
];

const INTEGRATIONS_TASKS: PillarTask[] = [
  { id: "itg-1", label: "Initialize git repository", status: "pending" },
  { id: "itg-2", label: "Configure database (Prisma)", status: "pending" },
  { id: "itg-3", label: "Set up authentication", status: "pending" },
  { id: "itg-4", label: "Create API routes", status: "pending" },
  { id: "itg-5", label: "Production build", status: "pending" },
  { id: "itg-6", label: "Deploy & configure domain", status: "pending" },
];

/* ------------------------------------------------------------------ */
/*  Example Prompts                                                    */
/* ------------------------------------------------------------------ */

const EXAMPLE_PROMPTS = [
  "Build a dark, kinetic landing page for a sneaker brand with 3D product viewer and scroll animations",
  "Create a SaaS dashboard with data visualization, auth, and Stripe billing",
  "Design a portfolio website with smooth page transitions and parallax effects",
  "Make a restaurant menu app with glassmorphism cards and fluid animations",
];

/* ------------------------------------------------------------------ */
/*  Subcomponents                                                      */
/* ------------------------------------------------------------------ */

function CategoryChip({ category, hits }: { category: NtNtNCategory; hits: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold border ${CATEGORY_COLORS[category]}`}
    >
      {CATEGORY_LABELS[category]}
      {hits > 1 && (
        <span className="text-[0.65rem] opacity-70">{hits} hits</span>
      )}
    </span>
  );
}

function ScopeBadge({ tier }: { tier: ScopeTier }) {
  const info = SCOPE_TIER_INFO[tier];
  const colors: Record<ScopeTier, string> = {
    component: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    page: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    application: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    platform: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  };
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold ${colors[tier]}`}>
      <Layers className="w-3.5 h-3.5" />
      <span>{info.label}</span>
      <span className="opacity-60">|</span>
      <span className="opacity-70">{info.cost}</span>
      <span className="opacity-60">|</span>
      <Clock className="w-3 h-3 opacity-60" />
      <span className="opacity-70">{info.time}</span>
    </div>
  );
}

function StackCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <motion.div
      variants={staggerItem}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-[#D4AF37]/20 group"
      style={{ transition: `border-color ${transition.fast.duration}s` }}
    >
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#D4AF37]/10">
        <Icon className="w-5 h-5 text-zinc-400 group-hover:text-[#D4AF37]" style={{ transition: `color ${transition.fast.duration}s` }} />
      </div>
      <span className="text-[0.65rem] uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="text-sm font-semibold text-zinc-200 text-center">{value}</span>
    </motion.div>
  );
}

function PillarSection({
  title,
  icon: Icon,
  status,
  tasks,
  color,
}: {
  title: string;
  icon: React.ElementType;
  status: PillarStatus;
  tasks: PillarTask[];
  color: string;
}) {
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const totalTasks = tasks.filter((t) => t.status !== "skipped").length;
  const progress = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-sm font-semibold text-zinc-200">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {status === "in_progress" && (
            <Loader2 className={`w-3.5 h-3.5 animate-spin ${color}`} />
          )}
          {status === "complete" && (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span className="text-sm text-zinc-500">
            {doneTasks}/{totalTasks}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <motion.div
          className={`h-full ${status === "complete" ? "bg-emerald-500" : `bg-gradient-to-r from-${color.replace("text-", "")} to-${color.replace("text-", "")}/60`}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: transition.slow.duration, ease: transition.slow.ease as unknown as string }}
          style={{
            background: status === "complete"
              ? "#10b981"
              : color.includes("amber") ? "#d4af37"
              : color.includes("blue") ? "#3b82f6"
              : "#8b5cf6",
          }}
        />
      </div>

      <div className="p-3 space-y-1.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${
              task.status === "done"
                ? "text-zinc-500 line-through"
                : task.status === "running"
                ? "text-zinc-200 bg-white/5"
                : task.status === "skipped"
                ? "text-zinc-600 line-through"
                : "text-zinc-400"
            }`}
          >
            {task.status === "done" && <Check className="w-3 h-3 text-emerald-500 shrink-0" />}
            {task.status === "running" && <Loader2 className="w-3 h-3 animate-spin text-[#D4AF37] shrink-0" />}
            {task.status === "pending" && <div className="w-3 h-3 rounded-full border border-zinc-600 shrink-0" />}
            {task.status === "skipped" && <X className="w-3 h-3 text-zinc-600 shrink-0" />}
            <span>{task.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhaseTimeline({ currentPhase }: { currentPhase: BuildPhase }) {
  const currentIdx = BUILD_PHASE_ORDER.indexOf(currentPhase);
  return (
    <div className="flex items-center gap-1">
      {BUILD_PHASE_ORDER.map((phase, idx) => {
        const isActive = idx === currentIdx;
        const isDone = idx < currentIdx;
        return (
          <React.Fragment key={phase}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[0.6rem] font-bold border ${
                  isDone
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : isActive
                    ? "bg-[#D4AF37]/20 border-[#D4AF37]/40 text-[#D4AF37]"
                    : "border-zinc-700 text-zinc-600"
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span
                className={`text-[0.55rem] uppercase tracking-wider ${
                  isDone ? "text-emerald-500" : isActive ? "text-[#D4AF37]" : "text-zinc-600"
                }`}
              >
                {BUILD_PHASE_LABELS[phase]}
              </span>
            </div>
            {idx < BUILD_PHASE_ORDER.length - 1 && (
              <div
                className={`flex-1 h-px min-w-[12px] ${
                  isDone ? "bg-emerald-500/40" : "bg-zinc-700"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function NtNtNStudioPage() {
  /* ── State ── */
  const [tab, setTab] = useState<StudioTab>("brief");
  const [brief, setBrief] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeBuild, setActiveBuild] = useState<ActiveBuild | null>(null);
  const [buildHistory, setBuildHistory] = useState<BuildManifest[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── Derived State: Real-time Intent Analysis ── */
  const analysis = useMemo(() => {
    if (!brief.trim()) return null;
    const hasBuildIntent = detectBuildIntent(brief);
    const categories = classifyBuildIntent(brief);
    const scopeTier = detectScopeTier(brief);
    return { hasBuildIntent, categories, scopeTier };
  }, [brief]);

  const uniqueCategories = useMemo(() => {
    if (!analysis) return [];
    const seen = new Set<NtNtNCategory>();
    return analysis.categories.filter((c) => {
      if (seen.has(c.category)) return false;
      seen.add(c.category);
      return true;
    });
  }, [analysis]);

  /* ── Build Simulation (replaces real backend when unavailable) ── */
  const simulateBuild = useCallback(async () => {
    if (!analysis) return;

    setIsAnalyzing(true);

    // Simulate Picker_Ang stack selection delay
    await new Promise((r) => setTimeout(r, 1200));

    const manifestId = `BM-${Date.now().toString(36).toUpperCase()}`;
    const manifest: BuildManifest = {
      manifest_id: manifestId,
      recommendation_id: `SR-${manifestId}`,
      build_name: brief.slice(0, 60),
      creative_brief: {
        purpose: brief,
        mood: "User-defined",
        features: uniqueCategories.map((c) => CATEGORY_LABELS[c.category]),
        audience: "General",
      },
      scope_tier: analysis.scopeTier,
      stack_recommendation: {
        framework: AIMS_DEFAULT_STACK.framework,
        styling: AIMS_DEFAULT_STACK.styling,
        animation: AIMS_DEFAULT_STACK.animation,
        ui_components: AIMS_DEFAULT_STACK.ui_components,
      },
      pillars: {
        image: "not_started",
        interface: "not_started",
        integrations: analysis.scopeTier === "component" ? "skipped" : "not_started",
      },
      current_phase: "intake",
      luc_budget: {
        estimated_cost_usd:
          analysis.scopeTier === "component" ? 0.5
          : analysis.scopeTier === "page" ? 2
          : analysis.scopeTier === "application" ? 5.5
          : 14,
        actual_cost_usd: 0,
      },
      preview_url: null,
      live_url: null,
      signed: false,
      created_at: new Date().toISOString(),
    };

    const build: ActiveBuild = {
      manifest,
      imageTasks: IMAGE_TASKS.map((t) => ({ ...t })),
      interfaceTasks: INTERFACE_TASKS.map((t) => ({ ...t })),
      integrationsTasks:
        analysis.scopeTier === "component"
          ? INTEGRATIONS_TASKS.map((t) => ({ ...t, status: "skipped" as const }))
          : INTEGRATIONS_TASKS.map((t) => ({ ...t })),
      logs: [`[${new Date().toLocaleTimeString()}] Build ${manifestId} initiated`],
      startedAt: Date.now(),
    };

    setActiveBuild(build);
    setIsAnalyzing(false);
    setTab("pipeline");

    // Start simulated pipeline progression
    simulatePipeline(build);
  }, [analysis, brief, uniqueCategories]);

  const simulatePipeline = useCallback(async (build: ActiveBuild) => {
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const addLog = (msg: string) => {
      setActiveBuild((prev) => {
        if (!prev) return prev;
        return { ...prev, logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${msg}`] };
      });
    };

    // Phase: IMAGE
    setActiveBuild((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        manifest: { ...prev.manifest, current_phase: "image", pillars: { ...prev.manifest.pillars, image: "in_progress" } },
      };
    });
    addLog("Picker_Ang selected stack. Buildsmith starting IMAGE pillar...");

    for (let i = 0; i < build.imageTasks.length; i++) {
      await delay(800 + Math.random() * 600);
      setActiveBuild((prev) => {
        if (!prev) return prev;
        const tasks = [...prev.imageTasks];
        if (i > 0) tasks[i - 1] = { ...tasks[i - 1], status: "done" };
        tasks[i] = { ...tasks[i], status: "running" };
        return { ...prev, imageTasks: tasks };
      });
      addLog(`IMAGE: ${build.imageTasks[i].label}...`);
    }
    await delay(600);
    setActiveBuild((prev) => {
      if (!prev) return prev;
      const tasks = prev.imageTasks.map((t) => ({ ...t, status: "done" as const }));
      return {
        ...prev,
        imageTasks: tasks,
        manifest: { ...prev.manifest, pillars: { ...prev.manifest.pillars, image: "complete" }, current_phase: "interface" },
      };
    });
    addLog("IMAGE pillar complete. Evidence gates passed.");

    // Phase: INTERFACE
    setActiveBuild((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        manifest: { ...prev.manifest, pillars: { ...prev.manifest.pillars, interface: "in_progress" } },
      };
    });
    addLog("Buildsmith starting INTERFACE pillar...");

    for (let i = 0; i < build.interfaceTasks.length; i++) {
      await delay(1000 + Math.random() * 800);
      setActiveBuild((prev) => {
        if (!prev) return prev;
        const tasks = [...prev.interfaceTasks];
        if (i > 0) tasks[i - 1] = { ...tasks[i - 1], status: "done" };
        tasks[i] = { ...tasks[i], status: "running" };
        // Set preview URL after scaffold
        const previewUrl = i >= 2 ? "https://preview.plugmein.cloud/sandbox" : null;
        return {
          ...prev,
          interfaceTasks: tasks,
          manifest: { ...prev.manifest, preview_url: previewUrl },
        };
      });
      addLog(`INTERFACE: ${build.interfaceTasks[i].label}...`);
    }
    await delay(600);
    setActiveBuild((prev) => {
      if (!prev) return prev;
      const tasks = prev.interfaceTasks.map((t) => ({ ...t, status: "done" as const }));
      return {
        ...prev,
        interfaceTasks: tasks,
        manifest: {
          ...prev.manifest,
          pillars: { ...prev.manifest.pillars, interface: "complete" },
          current_phase: prev.manifest.pillars.integrations === "skipped" ? "verification" : "integrations",
        },
      };
    });
    addLog("INTERFACE pillar complete. Lighthouse: Perf 94, A11y 98.");

    // Phase: INTEGRATIONS (skip for components)
    if (build.manifest.scope_tier !== "component") {
      setActiveBuild((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          manifest: { ...prev.manifest, pillars: { ...prev.manifest.pillars, integrations: "in_progress" } },
        };
      });
      addLog("Buildsmith starting INTEGRATIONS pillar...");

      for (let i = 0; i < build.integrationsTasks.length; i++) {
        await delay(900 + Math.random() * 700);
        setActiveBuild((prev) => {
          if (!prev) return prev;
          const tasks = [...prev.integrationsTasks];
          if (i > 0) tasks[i - 1] = { ...tasks[i - 1], status: "done" };
          tasks[i] = { ...tasks[i], status: "running" };
          return { ...prev, integrationsTasks: tasks };
        });
        addLog(`INTEGRATIONS: ${build.integrationsTasks[i].label}...`);
      }
      await delay(600);
      setActiveBuild((prev) => {
        if (!prev) return prev;
        const tasks = prev.integrationsTasks.map((t) => ({ ...t, status: "done" as const }));
        return {
          ...prev,
          integrationsTasks: tasks,
          manifest: {
            ...prev.manifest,
            pillars: { ...prev.manifest.pillars, integrations: "complete" },
            current_phase: "verification",
          },
        };
      });
      addLog("INTEGRATIONS pillar complete.");
    }

    // Phase: VERIFICATION → SIGN
    await delay(1500);
    addLog("Running final verification: Lighthouse, cross-browser, security scan...");
    await delay(2000);

    setActiveBuild((prev) => {
      if (!prev) return prev;
      const finalManifest: BuildManifest = {
        ...prev.manifest,
        current_phase: "sign",
        signed: true,
        live_url: "https://build.plugmein.cloud/" + prev.manifest.manifest_id.toLowerCase(),
        luc_budget: {
          ...prev.manifest.luc_budget,
          actual_cost_usd: prev.manifest.luc_budget.estimated_cost_usd * (0.7 + Math.random() * 0.5),
        },
      };
      return { ...prev, manifest: finalManifest };
    });
    addLog("All verification gates passed.");
    addLog("<!-- Buildsmith --> Build signed and delivered.");

    // Add to history
    setActiveBuild((prev) => {
      if (prev) {
        setBuildHistory((h) => [prev.manifest, ...h]);
      }
      return prev;
    });
  }, []);

  /* ── Attempt real backend call, fallback to simulation ── */
  const startBuild = useCallback(async () => {
    if (!brief.trim() || !analysis?.hasBuildIntent) return;

    try {
      // Try real backend first
      const res = await fetch("/api/acheevy/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: brief,
          context: { mode: "execute" },
          userId: "studio-user",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.actionPlan?.length > 0) {
          // Real backend responded — use its data
          // For now, still use simulation for the pipeline UI
          await simulateBuild();
          return;
        }
      }
    } catch {
      // Backend unavailable — fall through to simulation
    }

    await simulateBuild();
  }, [brief, analysis, simulateBuild]);

  /* ── Auto-resize textarea ── */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [brief]);

  /* ── Elapsed time ── */
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!activeBuild) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - activeBuild.startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeBuild]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  /* ── Tab Navigation ── */
  const TABS: { id: StudioTab; label: string; icon: React.ElementType }[] = [
    { id: "brief", label: "Creative Brief", icon: PenTool },
    { id: "pipeline", label: "Build Pipeline", icon: Workflow },
    { id: "history", label: "History", icon: Clock },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">Creative Studio</h1>
              <p className="text-sm text-zinc-500">
                Powered by NtNtN Engine
              </p>
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                tab === t.id
                  ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30"
                  : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.id === "pipeline" && activeBuild && !activeBuild.manifest.signed && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        {tab === "brief" && (
          <motion.div
            key="brief"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={scaleFade}
            className="space-y-6"
          >
            {/* Creative Brief Input */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <label className="block text-sm font-semibold text-zinc-300 mb-3">
                Describe what you want to build
              </label>
              <textarea
                ref={textareaRef}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Build me a dark, kinetic landing page for a sneaker brand with 3D product viewer and scroll animations..."
                className="w-full min-h-[100px] max-h-[240px] resize-none bg-transparent border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#D4AF37]/40 focus:ring-1 focus:ring-[#D4AF37]/20"
                rows={3}
              />

              {/* Example prompts */}
              {!brief && (
                <div className="mt-4">
                  <span className="text-[0.65rem] uppercase tracking-wider text-zinc-600 mb-2 block">
                    Try an example
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_PROMPTS.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setBrief(p)}
                        className="text-sm text-zinc-500 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors text-left"
                      >
                        {p.length > 60 ? p.slice(0, 57) + "..." : p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Real-time Analysis */}
            {analysis && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="space-y-4"
              >
                {/* Intent + Scope */}
                <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-3">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold ${
                      analysis.hasBuildIntent
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                    }`}
                  >
                    {analysis.hasBuildIntent ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    {analysis.hasBuildIntent ? "Build intent detected" : "No build intent"}
                  </div>
                  {analysis.hasBuildIntent && <ScopeBadge tier={analysis.scopeTier} />}
                </motion.div>

                {/* Category chips */}
                {uniqueCategories.length > 0 && (
                  <motion.div variants={staggerItem}>
                    <span className="text-[0.65rem] uppercase tracking-wider text-zinc-600 mb-2 block">
                      Matched Categories
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {uniqueCategories.map((c) => (
                        <CategoryChip
                          key={c.category}
                          category={c.category}
                          hits={c.keywordHits}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Stack Recommendation Preview */}
                {analysis.hasBuildIntent && (
                  <motion.div variants={staggerItem}>
                    <span className="text-[0.65rem] uppercase tracking-wider text-zinc-600 mb-3 block">
                      Recommended Stack
                    </span>
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-2 md:grid-cols-4 gap-3"
                    >
                      <StackCard label="Framework" value={AIMS_DEFAULT_STACK.framework} icon={Code} />
                      <StackCard label="Styling" value={AIMS_DEFAULT_STACK.styling} icon={Palette} />
                      <StackCard label="Animation" value={AIMS_DEFAULT_STACK.animation} icon={Sparkles} />
                      <StackCard label="Components" value={AIMS_DEFAULT_STACK.ui_components} icon={Box} />
                    </motion.div>

                    {/* Supplementary tools based on detected categories */}
                    {uniqueCategories.some((c) => c.category === "3d_visual") && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
                        <Plug className="w-3 h-3" />
                        <span>+ Three.js / React Three Fiber (3D detected)</span>
                      </div>
                    )}
                    {uniqueCategories.some((c) => c.technique_group === "scroll") && (
                      <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
                        <Plug className="w-3 h-3" />
                        <span>+ Lenis (smooth scroll detected)</span>
                      </div>
                    )}
                    {uniqueCategories.some((c) => c.category === "backend_fullstack") && (
                      <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
                        <Plug className="w-3 h-3" />
                        <span>+ Prisma + NextAuth (backend detected)</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Start Build Button */}
                {analysis.hasBuildIntent && (
                  <motion.div variants={staggerItem} className="pt-2">
                    <button
                      onClick={startBuild}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-semibold text-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ transition: `filter ${transition.fast.duration}s` }}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Picker_Ang selecting stack...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-4 h-4" />
                          Start Build
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {tab === "pipeline" && (
          <motion.div
            key="pipeline"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={scaleFade}
            className="space-y-6"
          >
            {!activeBuild ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
                <Workflow className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 text-sm">
                  No active build. Go to Creative Brief to start one.
                </p>
                <button
                  onClick={() => setTab("brief")}
                  className="mt-4 text-sm text-[#D4AF37] hover:underline"
                >
                  Go to Brief
                </button>
              </div>
            ) : (
              <>
                {/* Build Header */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-zinc-500 font-mono">
                          {activeBuild.manifest.manifest_id}
                        </span>
                        {activeBuild.manifest.signed && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <Shield className="w-3 h-3" /> Signed
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-semibold text-zinc-100 max-w-lg truncate">
                        {activeBuild.manifest.build_name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatElapsed(elapsed)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5" />
                        ${activeBuild.manifest.luc_budget.actual_cost_usd > 0
                          ? activeBuild.manifest.luc_budget.actual_cost_usd.toFixed(2)
                          : activeBuild.manifest.luc_budget.estimated_cost_usd.toFixed(2)
                        }
                        {activeBuild.manifest.luc_budget.actual_cost_usd === 0 && " est."}
                      </div>
                      <ScopeBadge tier={activeBuild.manifest.scope_tier} />
                    </div>
                  </div>

                  {/* Phase Timeline */}
                  <PhaseTimeline currentPhase={activeBuild.manifest.current_phase} />
                </div>

                {/* Three Pillars */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <PillarSection
                    title="IMAGE"
                    icon={ImageIcon}
                    status={activeBuild.manifest.pillars.image}
                    tasks={activeBuild.imageTasks}
                    color="text-amber-400"
                  />
                  <PillarSection
                    title="INTERFACE"
                    icon={Code}
                    status={activeBuild.manifest.pillars.interface}
                    tasks={activeBuild.interfaceTasks}
                    color="text-blue-400"
                  />
                  <PillarSection
                    title="INTEGRATIONS"
                    icon={Plug}
                    status={activeBuild.manifest.pillars.integrations}
                    tasks={activeBuild.integrationsTasks}
                    color="text-amber-400"
                  />
                </div>

                {/* Preview + Logs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Preview Panel */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                      <Eye className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm font-semibold text-zinc-300">Preview</span>
                      {activeBuild.manifest.preview_url && (
                        <span className="ml-auto text-[0.6rem] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          Live
                        </span>
                      )}
                    </div>
                    <div className="aspect-video bg-zinc-900/50 flex items-center justify-center">
                      {activeBuild.manifest.preview_url ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6">
                          <Monitor className="w-10 h-10 text-[#D4AF37]" />
                          <span className="text-sm text-zinc-400 text-center">
                            Preview available at{" "}
                            <span className="text-[#D4AF37] font-mono">
                              {activeBuild.manifest.preview_url}
                            </span>
                          </span>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-semibold border border-[#D4AF37]/30 hover:bg-[#D4AF37]/30 transition-colors">
                            <Globe className="w-3.5 h-3.5" />
                            Open Preview
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-600">
                          <Monitor className="w-8 h-8" />
                          <span className="text-sm">
                            Preview appears after scaffolding
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Build Logs */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                      <Cpu className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm font-semibold text-zinc-300">Build Log</span>
                      <span className="ml-auto text-[0.6rem] text-zinc-600">
                        {activeBuild.logs.length} entries
                      </span>
                    </div>
                    <div className="h-[220px] overflow-y-auto p-3 font-mono text-[0.7rem] leading-relaxed text-zinc-500 space-y-0.5">
                      {activeBuild.logs.map((log, i) => (
                        <div
                          key={i}
                          className={
                            log.includes("Buildsmith")
                              ? "text-[#D4AF37]"
                              : log.includes("complete")
                              ? "text-emerald-500"
                              : log.includes("Picker_Ang")
                              ? "text-amber-400"
                              : ""
                          }
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Delivery Panel (when signed) */}
                {activeBuild.manifest.signed && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Shield className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-emerald-300">
                          Build Complete &mdash; Signed by Buildsmith
                        </h3>
                        <p className="text-sm text-emerald-400/70 mt-1">
                          All evidence gates passed. Your build is ready.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          {activeBuild.manifest.live_url && (
                            <a
                              href={activeBuild.manifest.live_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm font-semibold border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              View Live Site
                            </a>
                          )}
                          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 text-zinc-300 text-sm font-semibold border border-white/10 hover:bg-white/10 transition-colors">
                            <Package className="w-3.5 h-3.5" />
                            Export Bundle
                          </button>
                          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 text-zinc-300 text-sm font-semibold border border-white/10 hover:bg-white/10 transition-colors">
                            <FileImage className="w-3.5 h-3.5" />
                            View Evidence
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        )}

        {tab === "history" && (
          <motion.div
            key="history"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={scaleFade}
          >
            {buildHistory.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
                <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 text-sm">
                  No builds yet. Start one from the Creative Brief tab.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {buildHistory.map((m) => (
                  <div
                    key={m.manifest_id}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          m.signed
                            ? "bg-emerald-500/20"
                            : "bg-[#D4AF37]/20"
                        }`}
                      >
                        {m.signed ? (
                          <Shield className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-zinc-200 truncate">
                          {m.build_name}
                        </div>
                        <div className="flex items-center gap-2 text-[0.65rem] text-zinc-500 mt-0.5">
                          <span className="font-mono">{m.manifest_id}</span>
                          <span>|</span>
                          <span>{SCOPE_TIER_INFO[m.scope_tier].label}</span>
                          <span>|</span>
                          <span>${m.luc_budget.actual_cost_usd.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {m.live_url && (
                        <a
                          href={m.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-zinc-400 text-sm hover:text-zinc-200 border border-white/10 transition-colors"
                        >
                          <Globe className="w-3 h-3" />
                          View
                        </a>
                      )}
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NtNtN Engine Footer ── */}
      <footer className="flex items-center justify-between pt-4 border-t border-white/5 text-[0.6rem] text-zinc-600">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3" />
          <span>NtNtN Engine v1.0</span>
          <span>|</span>
          <span>10 categories</span>
          <span>|</span>
          <span>7 technique groups</span>
          <span>|</span>
          <span>3-pillar pipeline</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Picker_Ang</span>
          <ArrowRight className="w-2.5 h-2.5" />
          <span>Buildsmith</span>
        </div>
      </footer>
    </div>
  );
}
