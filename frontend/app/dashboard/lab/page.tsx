// frontend/app/dashboard/lab/page.tsx
"use client";

import React, { useState } from "react";
import { FlaskConical, Play, RotateCcw, CheckCircle2, AlertTriangle } from "lucide-react";

export default function LabPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<null | { status: string; message: string; quote?: any }>(null);
  const [loading, setLoading] = useState(false);

  const runExperiment = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/acp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          intent: "ESTIMATE_ONLY",
          userId: "lab-user",
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ status: "ERROR", message: "UEF Gateway unreachable. Ensure Docker is running." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-amber-50 font-display">
          LAB
        </h1>
        <p className="text-sm text-amber-100/70">
          Experimental workspace. Test ACP requests, inspect UEF responses, and prototype agent workflows.
        </p>
      </header>

      {/* Request Builder */}
      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical size={16} className="text-amber-300" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
            ACP Request Builder
          </h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-amber-100/60 uppercase tracking-wider">Natural Language Query</label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Build a landing page for a fitness SaaS with pricing tiers and email capture..."
              className="w-full h-28 rounded-xl border border-white/5 bg-black/80 p-3 text-sm text-amber-50 outline-none focus:border-amber-300 transition-colors placeholder:text-amber-100/20 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={runExperiment}
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 rounded-full bg-amber-300 px-6 py-2.5 text-xs font-bold text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Play size={14} />
              {loading ? "Running..." : "Run Experiment"}
            </button>
            <button
              onClick={() => { setQuery(""); setResult(null); }}
              className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs text-amber-100/60 hover:text-amber-50 hover:border-white/20 transition-colors"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* Response Inspector */}
      {result && (
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-4">
            {result.status === "SUCCESS" ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={16} className="text-red-400" />
            )}
            <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
              UEF Response
            </h2>
            <span className={`ml-auto text-[10px] uppercase font-bold tracking-wider ${
              result.status === "SUCCESS" ? "text-emerald-400" : "text-red-400"
            }`}>
              {result.status}
            </span>
          </div>

          <div className="rounded-xl bg-black/80 border border-white/5 p-4 overflow-x-auto">
            <pre className="text-xs text-amber-100/80 font-mono whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>

          {result.quote?.variants && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {result.quote.variants.map((v: any, i: number) => (
                <div key={i} className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs font-semibold text-amber-200 mb-2">{v.name}</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-100/50">Cost</span>
                    <span className="font-mono text-amber-50">${v.estimate.totalUsd.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-amber-100/50">Tokens</span>
                    <span className="font-mono text-amber-50">{v.estimate.totalTokens.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Quick Templates */}
      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display mb-4">
          Quick Templates
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Build a CRM plug for realtors with lead tracking",
            "Design an automated email outreach sequence for SaaS",
            "Create a data pipeline for competitor price monitoring",
            "Deploy a customer success chatbot with escalation",
            "Audit website SEO and generate improvement plan",
            "Build invoice generator with Stripe integration",
          ].map((tpl) => (
            <button
              key={tpl}
              onClick={() => setQuery(tpl)}
              className="rounded-xl border border-white/5 bg-white/5 p-3 text-left text-xs text-amber-100/60 hover:border-amber-300/30 hover:text-amber-100 transition-all"
            >
              {tpl}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
