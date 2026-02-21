// frontend/app/dashboard/needs-analysis/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, fadeUp } from "@/lib/motion/variants";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Cloud,
  Code2,
  DollarSign,
  Download,
  Package,
  Shield,
  Truck,
  Zap,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────

interface NeedsQuestion {
  id: string;
  section: string;
  question: string;
  type: "text" | "select" | "multi-select" | "toggle" | "scale";
  options?: string[];
  required: boolean;
  helpText?: string;
}

interface NeedsResult {
  id: string;
  companyName: string;
  industry: string;
  scale: string;
  recommendedPlugs: string[];
  recommendedTier: string;
  recommendedDelivery: string;
  securityLevel: string;
  estimatedMonthlyCost: number;
  riskLevel: string;
  dataClassification: string;
  complianceRequirements: string[];
}

// ── Section Config ───────────────────────────────────────────────────────

const SECTIONS = [
  { id: "business", label: "Business", icon: Briefcase, description: "Company, industry, goals" },
  { id: "technical", label: "Technical", icon: Code2, description: "Stack, integrations, data" },
  { id: "security", label: "Security", icon: Shield, description: "Data sensitivity, compliance" },
  { id: "delivery", label: "Delivery", icon: Truck, description: "Hosting, SLA, support" },
  { id: "budget", label: "Budget", icon: DollarSign, description: "Monthly spend, scaling" },
];

const TIER_DISPLAY: Record<string, { label: string; color: string; description: string }> = {
  starter: { label: "Starter", color: "text-blue-400", description: "Best for small teams and simple workflows" },
  pro: { label: "Pro", color: "text-violet-400", description: "Full agent capabilities with priority support" },
  enterprise: { label: "Enterprise", color: "text-gold", description: "Dedicated resources, compliance, and SLA guarantees" },
};

const SECURITY_DISPLAY: Record<string, { label: string; color: string }> = {
  standard: { label: "Standard", color: "text-emerald-400" },
  hardened: { label: "Hardened", color: "text-amber-400" },
  enterprise: { label: "Enterprise", color: "text-red-400" },
};

const RISK_DISPLAY: Record<string, { label: string; color: string; dot: string }> = {
  low: { label: "Low", color: "text-emerald-400", dot: "bg-emerald-400" },
  medium: { label: "Medium", color: "text-amber-400", dot: "bg-amber-400" },
  high: { label: "High", color: "text-red-400", dot: "bg-red-400" },
  critical: { label: "Critical", color: "text-red-500", dot: "bg-red-500 animate-pulse" },
};

// ── Page ──────────────────────────────────────────────────────────────────

export default function NeedsAnalysisPage() {
  const [questions, setQuestions] = useState<NeedsQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<NeedsResult | null>(null);

  useEffect(() => {
    fetch("/api/needs-analysis")
      .then((res) => res.json())
      .then((data) => setQuestions(data.questions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentSectionId = SECTIONS[activeSection]?.id;
  const sectionQuestions = questions.filter((q) => q.section === currentSectionId);

  const setAnswer = useCallback((qId: string, value: string | string[] | boolean) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  }, []);

  const toggleMultiSelect = useCallback((qId: string, option: string) => {
    setAnswers((prev) => {
      const current = (prev[qId] as string[]) || [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [qId]: next };
    });
  }, []);

  const canAdvance = sectionQuestions
    .filter((q) => q.required)
    .every((q) => {
      const a = answers[q.id];
      if (a === undefined || a === "") return false;
      if (Array.isArray(a) && a.length === 0) return false;
      return true;
    });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const responses = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));
      const res = await fetch("/api/needs-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      // Error handling
    } finally {
      setSubmitting(false);
    }
  };

  // ── Result View ─────────────────────────────────────────────────────────
  if (result) {
    const tier = TIER_DISPLAY[result.recommendedTier] || TIER_DISPLAY.starter;
    const security = SECURITY_DISPLAY[result.securityLevel] || SECURITY_DISPLAY.standard;
    const risk = RISK_DISPLAY[result.riskLevel] || RISK_DISPLAY.low;

    return (
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div variants={staggerItem}>
          <p className="text-[0.6rem] uppercase tracking-[0.25em] text-gold/50 mb-1 font-mono">
            Analysis Complete
          </p>
          <h1 className="text-2xl md:text-3xl font-display uppercase tracking-wider text-white">
            Your AIMS Blueprint
          </h1>
          <p className="mt-1 text-xs text-white/40">
            Based on your responses, here is our recommended configuration for {result.companyName}.
          </p>
        </motion.div>

        {/* Recommendation Summary */}
        <motion.div variants={staggerItem} className="wireframe-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <h2 className="text-sm font-medium text-white">Recommendation Summary</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <p className="text-[0.55rem] uppercase tracking-widest text-white/30 font-mono">Tier</p>
              <p className={`text-sm font-medium ${tier.color}`}>{tier.label}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[0.55rem] uppercase tracking-widest text-white/30 font-mono">Security</p>
              <p className={`text-sm font-medium ${security.color}`}>{security.label}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[0.55rem] uppercase tracking-widest text-white/30 font-mono">Delivery</p>
              <p className="text-sm font-medium text-white/80 capitalize">{result.recommendedDelivery}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[0.55rem] uppercase tracking-widest text-white/30 font-mono">Risk Level</p>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                <p className={`text-sm font-medium ${risk.color}`}>{risk.label}</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-wireframe-stroke">
            <div className="flex items-baseline gap-2">
              <p className="text-[0.55rem] uppercase tracking-widest text-white/30 font-mono">Est. Monthly</p>
              <p className="text-xl font-display text-gold">${result.estimatedMonthlyCost}</p>
              <p className="text-[0.55rem] text-white/30 font-mono">/month</p>
            </div>
          </div>
        </motion.div>

        {/* Recommended Tools */}
        <motion.div variants={staggerItem} className="wireframe-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} className="text-gold" />
            <h2 className="text-sm font-medium text-white">Recommended Tools</h2>
          </div>
          <div className="space-y-2">
            {result.recommendedPlugs.map((plugId) => (
              <Link
                key={plugId}
                href={`/dashboard/plug-catalog/${plugId}`}
                className="flex items-center justify-between rounded-lg border border-wireframe-stroke px-4 py-3 hover:border-gold/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30 group-hover:text-gold transition-colors">
                    <Zap size={14} />
                  </div>
                  <span className="text-sm text-white/70 font-mono group-hover:text-white transition-colors">
                    {plugId}
                  </span>
                </div>
                <ChevronRight size={14} className="text-white/20 group-hover:text-gold transition-colors" />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Compliance */}
        {result.complianceRequirements.length > 0 && (
          <motion.div variants={staggerItem} className="wireframe-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-amber-400" />
              <h2 className="text-sm font-medium text-white">Compliance Requirements</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.complianceRequirements.map((req) => (
                <span
                  key={req}
                  className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-1 text-xs font-mono text-amber-400 uppercase"
                >
                  {req}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[0.6rem] text-white/30">
              Data classification: <span className="text-white/50 capitalize">{result.dataClassification}</span>
            </p>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/plug-catalog"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-medium text-black hover:bg-gold-light transition-colors"
          >
            <Cloud size={14} />
            Browse & Deploy Tools
          </Link>
          <button
            onClick={() => {
              setResult(null);
              setActiveSection(0);
              setAnswers({});
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-wireframe-stroke px-5 py-3 text-sm text-white/60 hover:border-gold/20 hover:text-gold transition-all"
          >
            <ArrowLeft size={14} />
            Start Over
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // ── Form View ───────────────────────────────────────────────────────────
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <header>
        <Link
          href="/dashboard/plug-catalog"
          className="inline-flex items-center gap-1 text-[0.6rem] uppercase tracking-widest text-white/30 hover:text-gold transition-colors font-mono mb-3"
        >
          <ArrowLeft size={10} /> Plug Catalog
        </Link>
        <p className="text-[0.6rem] uppercase tracking-[0.25em] text-gold/50 mb-1 font-mono">
          Business Client Intake
        </p>
        <h1 className="text-2xl md:text-3xl font-display uppercase tracking-wider text-white">
          Needs Analysis
        </h1>
        <p className="mt-1 text-xs text-white/40">
          Tell us about your business and we will recommend the right tools, security level, and delivery method.
        </p>
      </header>

      {/* Progress Steps */}
      <motion.div variants={staggerItem} className="flex items-center gap-1">
        {SECTIONS.map((section, i) => {
          const SectionIcon = section.icon;
          const isActive = i === activeSection;
          const isDone = i < activeSection;
          return (
            <React.Fragment key={section.id}>
              {i > 0 && (
                <div className={`flex-1 h-px ${isDone ? "bg-gold/40" : "bg-wireframe-stroke"}`} />
              )}
              <button
                onClick={() => i <= activeSection && setActiveSection(i)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[0.6rem] font-mono uppercase tracking-wider transition-all ${
                  isActive
                    ? "bg-gold/10 border border-gold/30 text-gold"
                    : isDone
                    ? "border border-emerald-400/20 text-emerald-400"
                    : "border border-wireframe-stroke text-white/30"
                }`}
              >
                {isDone ? <Check size={12} /> : <SectionIcon size={12} />}
                <span className="hidden sm:inline">{section.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </motion.div>

      {/* Section Header */}
      <motion.div variants={staggerItem}>
        <h2 className="text-lg font-display text-white uppercase tracking-wider">
          {SECTIONS[activeSection]?.label}
        </h2>
        <p className="text-xs text-white/40">{SECTIONS[activeSection]?.description}</p>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="wireframe-card p-6 animate-pulse">
              <div className="h-3 w-48 bg-white/5 rounded mb-4" />
              <div className="h-10 w-full bg-white/5 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Questions */}
      {!loading && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSectionId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {sectionQuestions.map((q) => (
              <div key={q.id} className="wireframe-card p-5">
                <label className="input-label flex items-center gap-1">
                  {q.question}
                  {q.required && <span className="text-gold">*</span>}
                </label>
                {q.helpText && (
                  <p className="text-[0.55rem] text-white/25 mb-3">{q.helpText}</p>
                )}

                {/* Text Input */}
                {q.type === "text" && (
                  <input
                    type="text"
                    value={(answers[q.id] as string) || ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    className="input-field w-full"
                    placeholder="Type your answer..."
                  />
                )}

                {/* Select */}
                {q.type === "select" && q.options && (
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt) => {
                      const isSelected = answers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setAnswer(q.id, opt)}
                          className={`rounded-lg px-3 py-2 text-xs font-mono transition-all ${
                            isSelected
                              ? "bg-gold/10 border border-gold/30 text-gold"
                              : "border border-wireframe-stroke text-white/40 hover:border-white/20 hover:text-white/60"
                          }`}
                        >
                          {opt.replace(/-/g, " ")}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Multi-Select */}
                {q.type === "multi-select" && q.options && (
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt) => {
                      const selected = ((answers[q.id] as string[]) || []).includes(opt);
                      return (
                        <button
                          key={opt}
                          onClick={() => toggleMultiSelect(q.id, opt)}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-mono transition-all ${
                            selected
                              ? "bg-gold/10 border border-gold/30 text-gold"
                              : "border border-wireframe-stroke text-white/40 hover:border-white/20"
                          }`}
                        >
                          {selected && <Check size={10} />}
                          {opt.replace(/-/g, " ")}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Toggle */}
                {q.type === "toggle" && (
                  <div className="flex gap-3">
                    {["Yes", "No"].map((opt) => {
                      const val = opt === "Yes";
                      const isSelected = answers[q.id] === val;
                      return (
                        <button
                          key={opt}
                          onClick={() => setAnswer(q.id, val)}
                          className={`rounded-lg px-5 py-2 text-xs font-mono transition-all ${
                            isSelected
                              ? "bg-gold/10 border border-gold/30 text-gold"
                              : "border border-wireframe-stroke text-white/40 hover:border-white/20"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Navigation */}
      <motion.div variants={staggerItem} className="flex justify-between gap-3 pt-2">
        <button
          onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
          disabled={activeSection === 0}
          className="flex items-center gap-2 rounded-xl border border-wireframe-stroke px-5 py-2.5 text-sm text-white/50 hover:border-gold/20 hover:text-gold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={14} /> Back
        </button>

        {activeSection < SECTIONS.length - 1 ? (
          <button
            onClick={() => setActiveSection(activeSection + 1)}
            disabled={!canAdvance}
            className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-medium text-black hover:bg-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next <ArrowRight size={14} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canAdvance || submitting}
            className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-medium text-black hover:bg-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <span className="h-3 w-3 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <ClipboardList size={14} />
                Generate Blueprint
              </>
            )}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
