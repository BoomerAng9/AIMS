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
      setResult({ status: "ERROR", message: "Service temporarily unavailable. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white font-display">
          WORKBENCH
        </h1>
        <p className="text-sm text-white/50">
          Your sandbox and playground. Test your ideas, preview Plugs, and see real results before you deploy.
        </p>
      </header>

      {/* Request Builder */}
      <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical size={16} className="text-gold" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
            Describe What You Want to Build
          </h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-wider">Tell us your idea</label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Build a landing page for a fitness SaaS with pricing tiers and email capture..."
              className="w-full h-28 rounded-xl border border-wireframe-stroke bg-black/80 p-3 text-sm text-white outline-none focus:border-gold/30 transition-colors placeholder:text-white/20 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={runExperiment}
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-xs font-bold text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Play size={14} />
              {loading ? "Testing..." : "Test My Idea"}
            </button>
            <button
              onClick={() => { setQuery(""); setResult(null); }}
              className="flex items-center gap-2 rounded-full border border-wireframe-stroke px-4 py-2.5 text-xs text-white/50 hover:text-white hover:border-white/20 transition-colors"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* Response Inspector */}
      {result && (
        <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-4">
            {result.status === "SUCCESS" ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={16} className="text-red-400" />
            )}
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
              Results
            </h2>
            <span className={`ml-auto text-[10px] uppercase font-bold tracking-wider ${
              result.status === "SUCCESS" ? "text-emerald-400" : "text-red-400"
            }`}>
              {result.status === "SUCCESS" ? "Ready" : "Error"}
            </span>
          </div>

          <div className="rounded-xl bg-black/80 border border-wireframe-stroke p-4 overflow-x-auto">
            <pre className="text-xs text-white/70 font-mono whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>

          {result.quote?.variants && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {result.quote.variants.map((v: any, i: number) => (
                <div key={i} className="rounded-xl border border-wireframe-stroke bg-white/5 p-4">
                  <p className="text-xs font-semibold text-gold mb-2">{v.name}</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Cost</span>
                    <span className="font-mono text-white">${v.estimate.totalUsd.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-white/40">Tokens</span>
                    <span className="font-mono text-white">{v.estimate.totalTokens.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Quick Templates */}
      <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display mb-4">
          Try One of These
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
              className="rounded-xl border border-wireframe-stroke bg-white/5 p-3 text-left text-xs text-white/50 hover:border-gold/20 hover:text-white/50 transition-all"
            >
              {tpl}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
