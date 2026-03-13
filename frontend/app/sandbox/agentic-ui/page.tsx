"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  CalendarClock,
  Database,
  Gauge,
  Layers3,
  Phone,
  PhoneCall,
  PlugZap,
  Rocket,
  Settings2,
  Shield,
  Workflow,
} from "lucide-react";

type RangeKey = "24h" | "7d" | "14d" | "1m";

interface SidebarSection {
  title: string;
  items: string[];
}

interface ActionItem {
  title: string;
  description: string;
  icon: typeof Settings2;
}

interface VariantItem {
  label: string;
  model: string;
  knowledgeSource: string;
  provider: string;
  accuracy: number;
  tone: "amber" | "emerald" | "sky";
}

interface RangeSnapshot {
  totalRequests: number;
  users: number;
  errors: number;
  latency: number;
  points: number[];
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  { title: "Monitor", items: ["Dashboard", "Call history", "Live calls"] },
  { title: "Orchestrate", items: ["Agents", "Campaigns", "Playbooks"] },
  { title: "Delegate", items: ["Phone numbers", "Voice library", "Integrations", "Events"] },
];

const ACTIONS: ActionItem[] = [
  {
    title: "Configure agent",
    description: "Tune policies, model mix, and escalation gates.",
    icon: Settings2,
  },
  {
    title: "Create variant",
    description: "Branch a new operating profile for a specific client segment.",
    icon: Layers3,
  },
  {
    title: "Deploy variants",
    description: "Promote approved variants into the active production roster.",
    icon: Rocket,
  },
  {
    title: "View performance",
    description: "Inspect quality, retrieval, and trust trends over time.",
    icon: Activity,
  },
];

const REPORT_METRICS = [
  { label: "Accuracy", value: 90 },
  { label: "Quality", value: 100 },
  { label: "Retrieval", value: 84 },
  { label: "Trust and Safety", value: 75 },
];

const RANGE_SNAPSHOTS: Record<RangeKey, RangeSnapshot> = {
  "24h": { totalRequests: 428, users: 16, errors: 2, latency: 5132, points: [0.3, 0.7, 0.5, 1.2, 0.9, 1.4, 1.1, 1.8] },
  "7d": { totalRequests: 2814, users: 42, errors: 3, latency: 6374, points: [0.2, 0.2, 1.7, 0.4, 1.0, 0.4, 0.3, 0.2] },
  "14d": { totalRequests: 5211, users: 68, errors: 5, latency: 5891, points: [0.8, 1.4, 1.2, 1.8, 1.1, 1.5, 1.6, 1.3] },
  "1m": { totalRequests: 11264, users: 103, errors: 8, latency: 5440, points: [0.4, 0.9, 0.8, 1.5, 1.8, 1.7, 1.9, 1.6] },
};

const VARIANTS: VariantItem[] = [
  {
    label: "New variant",
    model: "GPT-4o",
    knowledgeSource: "Economic Risks and Forecasts",
    provider: "Moody's Analytics",
    accuracy: 80,
    tone: "sky",
  },
  {
    label: "Variant 8",
    model: "GPT-4o",
    knowledgeSource: "Economic Risks and Forecasts",
    provider: "Moody's Analytics",
    accuracy: 86,
    tone: "sky",
  },
  {
    label: "Variant 7",
    model: "Claude 4.1 Opus",
    knowledgeSource: "Economic Risks and Forecasts",
    provider: "Moody's Analytics",
    accuracy: 90,
    tone: "amber",
  },
  {
    label: "Variant 6",
    model: "Claude 4 Opus",
    knowledgeSource: "Economic Risks and Forecasts",
    provider: "Moody's Analytics",
    accuracy: 85,
    tone: "amber",
  },
  {
    label: "Variant 5",
    model: "GPT-4o",
    knowledgeSource: "Economic Risks and Forecasts",
    provider: "Moody's Analytics",
    accuracy: 84,
    tone: "sky",
  },
  {
    label: "Variant 4",
    model: "Gemini 3",
    knowledgeSource: "Economic Risks and Forecasts",
    provider: "Moody's Analytics",
    accuracy: 88,
    tone: "emerald",
  },
];

function toneClasses(tone: VariantItem["tone"]) {
  if (tone === "emerald") {
    return {
      chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: "bg-emerald-50 text-emerald-600 border-emerald-200",
    };
  }

  if (tone === "sky") {
    return {
      chip: "border-sky-200 bg-sky-50 text-sky-700",
      icon: "bg-sky-50 text-sky-600 border-sky-200",
    };
  }

  return {
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    icon: "bg-amber-50 text-amber-700 border-amber-200",
  };
}

function buildPolyline(points: number[]) {
  return points
    .map((point, index) => {
      const x = 28 + index * 84;
      const y = 150 - point * 54;
      return `${x},${y}`;
    })
    .join(" ");
}

function TickMeter({ value }: { value: number }) {
  const filled = Math.round((value / 100) * 16);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 16 }).map((_, index) => (
        <span
          key={`${value}-${index}`}
          className={`h-2 w-1 rounded-full ${index < filled ? "bg-amber-500" : "bg-slate-200"}`}
        />
      ))}
    </div>
  );
}

function VariantCard({ variant }: { variant: VariantItem }) {
  const tone = toneClasses(variant.tone);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-slate-500">
            {variant.label}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tone.icon}`}>
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{variant.model}</p>
              <p className="text-xs text-slate-500">Model family</p>
            </div>
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-medium ${tone.chip}`}>
          Accuracy {variant.accuracy}%
        </span>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600">
          <Database className="h-4 w-4" />
        </div>
        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-slate-800">
            {variant.knowledgeSource}
          </p>
          <p className="mt-1 text-xs text-slate-500">{variant.provider}</p>
        </div>
      </div>
    </article>
  );
}

export default function AgenticUIPage() {
  const [activeSection, setActiveSection] = useState("Agents");
  const [selectedRange, setSelectedRange] = useState<RangeKey>("7d");

  const chartData = RANGE_SNAPSHOTS[selectedRange];
  const polyline = useMemo(() => buildPolyline(chartData.points), [chartData.points]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="grid min-h-[820px] lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <Workflow className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-sm uppercase tracking-[0.2em] text-slate-900">Agentic</p>
                    <p className="text-xs text-slate-500">Sandbox Preview</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-1 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-emerald-700">
                  Beta
                </span>
              </div>

              <div className="space-y-6 px-4 pb-6">
                {SIDEBAR_SECTIONS.map((section) => (
                  <section key={section.title}>
                    <div className="mb-2 flex items-center gap-2 px-2">
                      {section.title === "Monitor" && <Gauge className="h-4 w-4 text-slate-700" />}
                      {section.title === "Orchestrate" && <Bot className="h-4 w-4 text-slate-700" />}
                      {section.title === "Delegate" && <PhoneCall className="h-4 w-4 text-slate-700" />}
                      <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-slate-600">
                        {section.title}
                      </p>
                    </div>
                    <div className="space-y-1 border-l border-slate-200 pl-4">
                      {section.items.map((item) => {
                        const active = item === activeSection;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setActiveSection(item)}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                              active
                                ? "bg-slate-900 text-white"
                                : "text-slate-600 hover:bg-white hover:text-slate-900"
                            }`}
                          >
                            <span>{item}</span>
                            {active && <span className="h-2 w-2 rounded-full bg-amber-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>

              <div className="mt-auto border-t border-slate-200 px-5 py-4">
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Hi, Alex</p>
                    <p className="text-xs text-slate-500">Workspace operator</p>
                  </div>
                  <button type="button" className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:border-slate-300 hover:text-slate-900">
                    Manage
                  </button>
                </div>
              </div>
            </aside>

            <main className="relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12),transparent_52%)]" />
              <div className="absolute left-1/2 top-[220px] hidden h-16 w-[58%] -translate-x-1/2 bg-[radial-gradient(circle,_rgba(148,163,184,0.16)_1px,_transparent_1px)] bg-[length:12px_12px] lg:block" />

              <div className="relative px-5 py-6 sm:px-8 sm:py-8">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-slate-500">
                      <span>Agents</span>
                      <span>/</span>
                      <span className="text-slate-900">Wealth Management</span>
                    </div>
                    <h1 className="mt-5 font-display text-3xl tracking-tight text-slate-950 sm:text-4xl">
                      Equity Research Agent
                    </h1>
                    <dl className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-3 sm:gap-5">
                      <div>
                        <dt className="text-slate-500">Created</dt>
                        <dd className="mt-1 font-medium text-slate-900">Sep 6, 2025</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Variants</dt>
                        <dd className="mt-1 font-medium text-slate-900">10 active profiles</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Accuracy</dt>
                        <dd className="mt-1 font-medium text-slate-900">81% operating baseline</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-violet-100 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-violet-800">
                      Deployed
                    </span>
                    <button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-50">
                      Configure
                    </button>
                    <button type="button" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800">
                      Launch
                    </button>
                  </div>
                </div>

                <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {ACTIONS.map((action) => (
                    <button
                      key={action.title}
                      type="button"
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                        <action.icon className="h-5 w-5" />
                      </div>
                      <p className="mt-4 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-slate-900">
                        {action.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{action.description}</p>
                    </button>
                  ))}
                </div>

                <div className="mt-8 grid gap-4 xl:grid-cols-[348px_minmax(0,1fr)]">
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-slate-500">Report Card</p>
                        <p className="mt-1 text-xs text-slate-500">Last evaluated Jan 14</p>
                      </div>
                      <button type="button" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        Export
                      </button>
                    </div>

                    <div className="mt-8 space-y-5">
                      {REPORT_METRICS.map((metric) => (
                        <div key={metric.label} className="grid grid-cols-[minmax(0,140px)_1fr_auto] items-center gap-4">
                          <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-slate-800">
                            {metric.label}
                          </p>
                          <TickMeter value={metric.value} />
                          <p className="text-sm font-medium text-slate-900">{metric.value}%</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-slate-500">Requests (Live)</p>
                        <p className="mt-1 text-xs text-slate-500">Jan 7 - Jan 14, 2025</p>
                      </div>
                      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                        {Object.keys(RANGE_SNAPSHOTS).map((range) => {
                          const active = range === selectedRange;
                          return (
                            <button
                              key={range}
                              type="button"
                              onClick={() => setSelectedRange(range as RangeKey)}
                              className={`rounded-lg px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] transition-colors ${
                                active ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                              }`}
                            >
                              {range}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div>
                        <svg viewBox="0 0 660 180" className="h-[220px] w-full overflow-visible">
                          {[0, 1, 2].map((row) => (
                            <line
                              key={row}
                              x1="28"
                              y1={42 + row * 54}
                              x2="616"
                              y2={42 + row * 54}
                              className="stroke-slate-200"
                              strokeWidth="1"
                            />
                          ))}
                          {chartData.points.map((_, index) => (
                            <g key={`label-${index}`}>
                              <text
                                x={28 + index * 84}
                                y="170"
                                textAnchor="middle"
                                className="fill-slate-500 text-[11px] font-mono"
                              >
                                {selectedRange === "24h" ? `${index * 3}:00` : `01/${7 + index}`}
                              </text>
                            </g>
                          ))}
                          <polyline
                            fill="none"
                            stroke="#0f172a"
                            strokeWidth="3"
                            points={polyline}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {chartData.points.map((point, index) => {
                            const x = 28 + index * 84;
                            const y = 150 - point * 54;
                            return (
                              <circle
                                key={`dot-${index}`}
                                cx={x}
                                cy={y}
                                r="5"
                                fill="#ffffff"
                                stroke="#16a34a"
                                strokeWidth="2"
                              />
                            );
                          })}
                        </svg>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-slate-500">Total Requests</p>
                          <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-700">{chartData.totalRequests.toLocaleString()}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-slate-500">Users</p>
                          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{chartData.users}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-slate-500">Total Errors</p>
                          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{chartData.errors}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-slate-500">Average Latency</p>
                          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                            {chartData.latency.toLocaleString()}
                            <span className="ml-1 text-sm font-normal text-slate-500">ms</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="mt-8">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-slate-500">Variant Library</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Sandbox implementation of the Figma Agent Management grid for testing design-system fit.
                      </p>
                    </div>
                    <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50">
                      Create variant
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {VARIANTS.map((variant) => (
                      <VariantCard key={variant.label} variant={variant} />
                    ))}
                  </div>
                </section>

                <section className="mt-8 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-slate-500">Trust controls</p>
                        <p className="text-sm font-medium text-slate-900">Policy gating enabled</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-slate-500">Delegation</p>
                        <p className="text-sm font-medium text-slate-900">Voice and event channels ready</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                        <PlugZap className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-slate-500">Sandbox note</p>
                        <p className="text-sm font-medium text-slate-900">Telemetry shown here is design-preview data</p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Last evaluated Jan 14
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                    <Gauge className="h-3.5 w-3.5" />
                    Active view: {activeSection}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    Range: {selectedRange.toUpperCase()}
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
