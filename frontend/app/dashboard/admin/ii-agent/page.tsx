"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import OwnerGate from "@/components/OwnerGate";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Code2,
  Search,
  Presentation,
  Globe,
  Rocket,
  CircleDot,
  XCircle,
  Loader2,
  Send,
  Terminal,
  ShieldCheck,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type TaskType = "code" | "research" | "slides" | "fullstack" | "browser";

interface HealthStatus {
  status: string;
  iiAgent?: { status: string; version?: string };
  connected: boolean;
  error?: string;
}

interface TaskResult {
  id: string;
  status: string;
  type: TaskType;
  output?: string;
  artifacts?: Array<{ name: string; type: string; content: string }>;
  error?: string;
}

interface TaskHistoryEntry {
  id: string;
  type: TaskType;
  prompt: string;
  status: "running" | "completed" | "failed" | "cancelled";
  startedAt: string;
  result?: TaskResult;
  streamOutput?: string;
}

// ── Task type config ───────────────────────────────────────────────────────

const TASK_TYPES: Array<{
  id: TaskType;
  label: string;
  icon: React.ReactNode;
  description: string;
  placeholder: string;
}> = [
  {
    id: "code",
    label: "Code",
    icon: <Code2 className="h-4 w-4" />,
    description: "Execute code tasks autonomously",
    placeholder: "Describe the code task...",
  },
  {
    id: "research",
    label: "Research",
    icon: <Search className="h-4 w-4" />,
    description: "Deep research with citations",
    placeholder: "What topic should ii-agent research?",
  },
  {
    id: "fullstack",
    label: "Build",
    icon: <Rocket className="h-4 w-4" />,
    description: "Full-stack app development",
    placeholder: "Describe the app to build...",
  },
  {
    id: "slides",
    label: "Slides",
    icon: <Presentation className="h-4 w-4" />,
    description: "Create presentations",
    placeholder: "What presentation should be created?",
  },
  {
    id: "browser",
    label: "Browser",
    icon: <Globe className="h-4 w-4" />,
    description: "Web scraping & navigation",
    placeholder: "What should ii-agent browse or scrape?",
  },
];

// ── Component ──────────────────────────────────────────────────────────────

function IIAgentControl() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [taskType, setTaskType] = useState<TaskType>("code");
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<TaskHistoryEntry[]>([]);
  const [streamOutput, setStreamOutput] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Health check ──────────────────────────────────────────────────────

  const checkHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/admin/ii-agent");
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({ status: "unreachable", connected: false, error: "Cannot reach API" });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // ── Auto-scroll output ────────────────────────────────────────────────

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamOutput]);

  // ── Execute task ──────────────────────────────────────────────────────

  const executeTask = useCallback(async () => {
    if (!prompt.trim() || running) return;

    const isStreaming = taskType === "fullstack" || taskType === "code";
    const taskId = `local_${Date.now()}`;
    const entry: TaskHistoryEntry = {
      id: taskId,
      type: taskType,
      prompt: prompt.trim(),
      status: "running",
      startedAt: new Date().toISOString(),
    };

    setHistory((prev) => [entry, ...prev]);
    setRunning(true);
    setStreamOutput("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Determine action and payload
      let action = "execute";
      let payload: Record<string, unknown> = { prompt: prompt.trim(), type: taskType };

      if (taskType === "research") {
        action = "research";
        payload = { topic: prompt.trim() };
      } else if (taskType === "fullstack") {
        action = "build";
        payload = { description: prompt.trim() };
      } else if (taskType === "slides") {
        action = "slides";
        payload = { topic: prompt.trim() };
      }

      if (isStreaming) {
        payload.streaming = true;
      }

      const res = await fetch("/api/admin/ii-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      if (isStreaming && res.body) {
        // SSE streaming
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const raw = line.slice(6).trim();
              if (!raw || raw === "[DONE]") continue;
              try {
                const event = JSON.parse(raw);
                if (event.type === "done") continue;
                if (event.type === "output" || event.data) {
                  const text = typeof event.data === "string" ? event.data : event.data?.text || JSON.stringify(event.data);
                  accumulated += text + "\n";
                  setStreamOutput(accumulated);
                }
              } catch {
                // Not JSON, append raw
                accumulated += raw + "\n";
                setStreamOutput(accumulated);
              }
            }
          }
        }

        setHistory((prev) =>
          prev.map((h) =>
            h.id === taskId
              ? { ...h, status: "completed", streamOutput: accumulated }
              : h
          )
        );
      } else {
        // Non-streaming
        const data: TaskResult = await res.json();
        setStreamOutput(data.output || JSON.stringify(data, null, 2));
        setHistory((prev) =>
          prev.map((h) =>
            h.id === taskId
              ? { ...h, status: data.status === "failed" ? "failed" : "completed", result: data }
              : h
          )
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setHistory((prev) =>
          prev.map((h) => (h.id === taskId ? { ...h, status: "cancelled" } : h))
        );
      } else {
        const message = err instanceof Error ? err.message : "Unknown error";
        setStreamOutput(`Error: ${message}`);
        setHistory((prev) =>
          prev.map((h) => (h.id === taskId ? { ...h, status: "failed" } : h))
        );
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [prompt, taskType, running]);

  // ── Cancel ────────────────────────────────────────────────────────────

  const cancelTask = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // ── Key handler ───────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        executeTask();
      }
    },
    [executeTask]
  );

  // ── Render ────────────────────────────────────────────────────────────

  const isConnected = health?.connected === true;
  const selectedType = TASK_TYPES.find((t) => t.id === taskType)!;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <section className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-white/80 p-6 shadow-[0_0_40px_rgba(245,158,11,0.08)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/admin"
                className="rounded-full border border-wireframe-stroke p-1.5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-zinc-400" />
              </Link>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                Owner Only
              </span>
              <h1 className="text-2xl font-bold text-zinc-100 font-display">
                II-Agent Control
              </h1>
            </div>
            <p className="mt-1 ml-[54px] text-xs text-zinc-500">
              Autonomous task execution — code, research, builds, slides, browser.
              Gated via A.I.M.S. Gateway System.
            </p>
          </div>

          {/* Health indicator */}
          <div className="flex items-center gap-2">
            {healthLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    isConnected
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                      : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]"
                  }`}
                />
                <span className="text-[10px] font-mono text-zinc-500 uppercase">
                  {isConnected ? "Connected" : "Offline"}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Gateway Security Badge */}
      <div className="flex items-center gap-2 px-1">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
          A.I.M.S. Gateway System — OWNER access verified — All executions audit-logged
        </span>
      </div>

      {/* Task Type Selector */}
      <section className="rounded-3xl border border-wireframe-stroke bg-[#18181B]/70 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200 font-display">
          Task Type
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {TASK_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTaskType(t.id)}
              disabled={running}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-medium transition-all ${
                taskType === t.id
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                  : "border-wireframe-stroke bg-[#1F1F23]/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
              } disabled:opacity-40`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-zinc-600">{selectedType.description}</p>
      </section>

      {/* Input + Execute */}
      <section className="rounded-3xl border border-wireframe-stroke bg-[#18181B]/70 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200 font-display">
          Task Input
        </h2>
        <div className="mt-3 relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedType.placeholder}
            disabled={running}
            rows={4}
            className="w-full rounded-2xl border border-wireframe-stroke bg-[#1F1F23]/80 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20 disabled:opacity-50 resize-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-zinc-600 font-mono">
              {running ? "Task executing..." : "Cmd+Enter to execute"}
            </span>
            <div className="flex items-center gap-2">
              {running && (
                <button
                  onClick={cancelTask}
                  className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[10px] font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <XCircle className="h-3 w-3" />
                  Cancel
                </button>
              )}
              <button
                onClick={executeTask}
                disabled={running || !prompt.trim()}
                className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-xs font-semibold text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:bg-amber-400 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                {running ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {running ? "Executing..." : "Execute"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Output Panel */}
      <section className="rounded-3xl border border-wireframe-stroke bg-[#18181B]/70 p-6 backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-zinc-500" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200 font-display">
              Output
            </h2>
          </div>
          {running && (
            <div className="flex items-center gap-1.5">
              <CircleDot className="h-3 w-3 text-amber-400 animate-pulse" />
              <span className="text-[10px] text-amber-400 font-mono uppercase">
                Streaming
              </span>
            </div>
          )}
        </div>
        <div
          ref={outputRef}
          className="mt-3 max-h-[500px] overflow-y-auto rounded-2xl border border-wireframe-stroke bg-[#0D0D0F] p-4 font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap"
        >
          {streamOutput || (
            <span className="text-zinc-600">
              No output yet. Execute a task to see results here.
            </span>
          )}
        </div>
      </section>

      {/* Task History */}
      {history.length > 0 && (
        <section className="rounded-3xl border border-wireframe-stroke bg-[#18181B]/70 p-6 backdrop-blur-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200 font-display">
            Task History
          </h2>
          <p className="mt-1 text-[0.65rem] text-zinc-500 uppercase tracking-wider">
            This session only — audit logs persisted via Gateway
          </p>
          <div className="mt-4 space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-2xl border border-wireframe-stroke bg-[#1F1F23]/60 px-4 py-3 hover:bg-[#111113] transition-colors cursor-pointer"
                onClick={() => {
                  if (h.streamOutput) setStreamOutput(h.streamOutput);
                  else if (h.result?.output) setStreamOutput(h.result.output);
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-zinc-500">
                    {TASK_TYPES.find((t) => t.id === h.type)?.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-300 truncate max-w-[400px]">
                      {h.prompt}
                    </p>
                    <p className="text-[10px] text-zinc-600 font-mono mt-0.5">
                      {new Date(h.startedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    h.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : h.status === "running"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : h.status === "failed"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                  }`}
                >
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Page Export (Owner-Gated) ──────────────────────────────────────────────

export default function IIAgentPage() {
  return (
    <OwnerGate>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <IIAgentControl />
      </div>
    </OwnerGate>
  );
}
