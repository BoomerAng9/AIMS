'use client';

/**
 * Deep Scout — AI Research Engine
 *
 * The M.I.M. D.U.M.B. Phase 2 interface. Users describe a product idea or
 * paste a competitor URL → ACHEEVY runs the Search → Extract → Plan pipeline
 * → results display in an interactive research report.
 *
 * Architecture per D.U.M.B. docs:
 *   /dashboard/deep-scout          → This page (input + prompt selection)
 *   /dashboard/deep-scout/results  → Research results (scrollytelling report)
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Lightbulb,
  Loader2,
  Search,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { transition, spring, stagger } from '@/lib/motion/tokens';

/* ─────────────────────────────────────────────────────────────────── */
/*  Constants                                                          */
/* ─────────────────────────────────────────────────────────────────── */

const RESEARCH_MODES = [
  {
    id: 'idea',
    label: 'Validate an Idea',
    icon: Lightbulb,
    description: 'Run the 4-step validation chain on your concept',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 'clone',
    label: 'Clone & Improve',
    icon: Target,
    description: 'Research a competitor and build something better',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'market',
    label: 'Market Research',
    icon: TrendingUp,
    description: 'Deep dive into an industry or market opportunity',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
] as const;

const INDUSTRIES = [
  'SaaS', 'Healthcare', 'Real Estate', 'Legal', 'Education',
  'Fitness', 'Construction', 'E-commerce', 'Marketing', 'Finance',
  'Food & Beverage', 'Entertainment', 'Other',
] as const;

const STARTER_PROMPTS = [
  { text: 'AI scheduling assistant for dentists', industry: 'Healthcare' },
  { text: 'Clone Notion but for construction teams', industry: 'Construction' },
  { text: 'Subscription box platform for local artisans', industry: 'E-commerce' },
  { text: 'Legal document automation for small firms', industry: 'Legal' },
];

/* ─────────────────────────────────────────────────────────────────── */
/*  Types                                                              */
/* ─────────────────────────────────────────────────────────────────── */

interface ValidationStep {
  step: number;
  title: string;
  content: string;
  status: 'pending' | 'running' | 'complete';
}

interface ResearchResult {
  facts: {
    productName: string;
    description: string;
    targetAudience: string;
    keyFeatures: string[];
    monetization: string[];
    techStack: string[];
    competitors: string[];
    differentiators: string[];
    sourceUrls: string[];
  };
  searchQueries: string[];
  totalSources: number;
}

interface ClonePlan {
  projectName: string;
  description: string;
  phases: Array<{
    name: string;
    tasks: string[];
    estimatedComplexity: 'low' | 'medium' | 'high';
  }>;
  requiredServices: string[];
  recommendedStack: string[];
}

interface AdaptationPlan {
  uniqueAngle: string;
  differentiators: string[];
  targetNiche: string;
  brandSuggestions: string[];
  pricingStrategy: string;
  launchSteps: string[];
}

interface FullResearchOutput {
  research: ResearchResult;
  clonePlan: ClonePlan;
  adaptationPlan: AdaptationPlan;
  evidence: Array<{
    id: string;
    query: string;
    resultCount: number;
    sources: Array<{ title: string; url: string }>;
    timestamp: string;
  }>;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Component                                                          */
/* ─────────────────────────────────────────────────────────────────── */

export default function DeepScoutPage() {
  // ── State ──
  const [mode, setMode] = useState<string | null>(null);
  const [idea, setIdea] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  // Idea Validation state
  const [validationSteps, setValidationSteps] = useState<ValidationStep[]>([
    { step: 1, title: 'Raw Idea Capture', content: '', status: 'pending' },
    { step: 2, title: 'Gap Analysis', content: '', status: 'pending' },
    { step: 3, title: 'Audience Resonance', content: '', status: 'pending' },
    { step: 4, title: 'Expert Perspective', content: '', status: 'pending' },
  ]);
  const [currentValidationStep, setCurrentValidationStep] = useState(0);

  // Research state
  const [researchResult, setResearchResult] = useState<FullResearchOutput | null>(null);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [pipelineStage, setPipelineStage] = useState('');

  const abortRef = useRef<AbortController | null>(null);

  // ── Idea Validation (4-step streaming) ──
  const runValidation = useCallback(async () => {
    if (!idea.trim()) return;
    setIsRunning(true);
    setResearchError(null);
    setCurrentValidationStep(0);

    const stepsAccumulator: Record<string, unknown> = {};

    for (let step = 1; step <= 4; step++) {
      setCurrentValidationStep(step);
      setValidationSteps(prev =>
        prev.map(s => ({
          ...s,
          status: s.step === step ? 'running' : s.step < step ? 'complete' : 'pending',
        })),
      );

      try {
        const controller = new AbortController();
        abortRef.current = controller;

        const res = await fetch('/api/acheevy/idea-validation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idea,
            industry: industry || undefined,
            step,
            previousSteps: stepsAccumulator,
          }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Step ${step} failed: ${res.statusText}`);
        if (!res.body) throw new Error('No response stream');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          // Parse Vercel AI SDK streaming format
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const text = JSON.parse(line.slice(2));
                fullText += text;
              } catch { /* skip */ }
            }
          }
          setValidationSteps(prev =>
            prev.map(s => (s.step === step ? { ...s, content: fullText } : s)),
          );
        }

        stepsAccumulator[`step${step}`] = fullText;

        setValidationSteps(prev =>
          prev.map(s => (s.step === step ? { ...s, content: fullText, status: 'complete' } : s)),
        );
      } catch (err) {
        if ((err as Error).name === 'AbortError') break;
        setResearchError(`Step ${step} failed: ${(err as Error).message}`);
        break;
      }
    }

    setIsRunning(false);
  }, [idea, industry]);

  // ── Research Pipeline (Search → Extract → Plan) ──
  const runResearch = useCallback(async () => {
    if (!idea.trim()) return;
    setIsRunning(true);
    setResearchError(null);
    setResearchResult(null);

    setPipelineStage('Searching for information...');

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch('/api/make-it-mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIdea: idea,
          targetUrl: targetUrl || undefined,
          industry: industry || undefined,
        }),
        signal: controller.signal,
      });

      setPipelineStage('Extracting structured data...');

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `Research failed: ${res.statusText}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Pipeline returned no results');

      setPipelineStage('Research complete!');
      setResearchResult(data as FullResearchOutput);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setResearchError((err as Error).message);
      }
    } finally {
      setIsRunning(false);
      setPipelineStage('');
    }
  }, [idea, targetUrl, industry]);

  // ── Actions ──
  const handleSubmit = useCallback(() => {
    if (mode === 'idea') runValidation();
    else runResearch();
  }, [mode, runValidation, runResearch]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setIsRunning(false);
  }, []);

  const resetAll = useCallback(() => {
    setMode(null);
    setIdea('');
    setTargetUrl('');
    setIndustry('');
    setIsRunning(false);
    setResearchResult(null);
    setResearchError(null);
    setCurrentValidationStep(0);
    setValidationSteps(prev => prev.map(s => ({ ...s, content: '', status: 'pending' as const })));
  }, []);

  // ── Render helpers ──
  const hasResults = researchResult !== null || validationSteps.some(s => s.status === 'complete');

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0A0A0B]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link
            href="/dashboard/make-it-mine"
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">M.I.M.</span>
          </Link>

          <div className="flex items-center gap-3">
            <Image
              src="/assets/aims_transparent_logo.svg"
              alt="A.I.M.S."
              width={24}
              height={24}
              className="opacity-90"
            />
            <h1 className="text-sm font-semibold tracking-wide">DEEP SCOUT</h1>
            <span className="text-[0.6rem] uppercase tracking-wider text-gold/60 bg-gold/5 border border-gold/10 px-2 py-0.5 rounded">
              Research Engine
            </span>
          </div>

          {hasResults && (
            <button
              onClick={resetAll}
              className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              New Research
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <AnimatePresence mode="wait">
          {/* ── Mode Selection ── */}
          {!mode && !hasResults && (
            <motion.div
              key="mode-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={transition.normal}
            >
              <div className="text-center mb-10">
                <Image
                  src="/assets/aims_transparent_logo.svg"
                  alt=""
                  width={48}
                  height={48}
                  className="mx-auto mb-4 opacity-80"
                />
                <h2 className="text-2xl font-bold text-zinc-100">
                  What would you like to research?
                </h2>
                <p className="mt-2 text-zinc-500 text-sm">
                  Deep Scout researches exhaustively, then ACHEEVY builds meticulously.
                </p>
              </div>

              <div className="grid gap-4">
                {RESEARCH_MODES.map((rm, i) => (
                  <motion.button
                    key={rm.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...transition.normal, delay: i * stagger.fast }}
                    onClick={() => setMode(rm.id)}
                    className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-[#111113] p-5 text-left hover:border-gold/20 hover:bg-white/[0.03] transition-all duration-300"
                  >
                    <div className={`mt-0.5 rounded-xl p-2.5 ${rm.bgColor}`}>
                      <rm.icon size={20} className={rm.color} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-200 group-hover:text-gold transition-colors">
                        {rm.label}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-500">{rm.description}</p>
                    </div>
                    <ArrowRight size={16} className="ml-auto mt-2 text-zinc-600 group-hover:text-gold/60 transition-colors" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Input Form ── */}
          {mode && !hasResults && !isRunning && (
            <motion.div
              key="input-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={transition.normal}
            >
              <button
                onClick={() => setMode(null)}
                className="mb-6 flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <div className="rounded-2xl border border-white/5 bg-[#111113] p-6 space-y-6">
                <div>
                  <label htmlFor="idea" className="block text-sm font-medium text-zinc-300 mb-2">
                    {mode === 'idea'
                      ? 'Describe your idea — raw, unpolished, just the concept'
                      : mode === 'clone'
                        ? 'What product or service do you want to clone & improve?'
                        : 'What market or opportunity do you want to research?'}
                  </label>
                  <textarea
                    id="idea"
                    rows={3}
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder={
                      mode === 'idea'
                        ? 'e.g., AI scheduling assistant for dentists that learns from no-shows'
                        : mode === 'clone'
                          ? 'e.g., Build something like Notion but for construction project management'
                          : 'e.g., What does the AI tutoring market look like for K-12?'
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-gold/30 focus:outline-none focus:ring-1 focus:ring-gold/20 resize-none"
                  />
                </div>

                {mode === 'clone' && (
                  <div>
                    <label htmlFor="targetUrl" className="block text-sm font-medium text-zinc-300 mb-2">
                      Competitor URL (optional)
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5">
                      <Globe size={14} className="text-zinc-600" />
                      <input
                        id="targetUrl"
                        type="url"
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        placeholder="https://competitor.com"
                        className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-zinc-300 mb-2">
                    Industry
                  </label>
                  <select
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-zinc-100 focus:border-gold/30 focus:outline-none focus:ring-1 focus:ring-gold/20"
                  >
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                {/* Starter prompts */}
                {!idea && (
                  <div>
                    <p className="text-xs text-zinc-600 mb-2">Or try one of these:</p>
                    <div className="flex flex-wrap gap-2">
                      {STARTER_PROMPTS.map((sp) => (
                        <button
                          key={sp.text}
                          onClick={() => { setIdea(sp.text); setIndustry(sp.industry); }}
                          className="text-xs px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-zinc-400 hover:text-zinc-200 hover:border-gold/20 transition-all"
                        >
                          {sp.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!idea.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gold/90 hover:bg-gold px-6 py-3 text-sm font-semibold text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {mode === 'idea' ? (
                    <>
                      <Sparkles size={16} /> Run 4-Step Validation
                    </>
                  ) : (
                    <>
                      <Search size={16} /> Run Deep Research
                    </>
                  )}
                </button>

                {researchError && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
                    {researchError}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Running / Pipeline ── */}
          {isRunning && mode !== 'idea' && (
            <motion.div
              key="pipeline-running"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <Loader2 size={32} className="text-gold animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-zinc-200">Deep Scout is researching...</h3>
              <p className="mt-2 text-sm text-zinc-500">{pipelineStage || 'Initializing pipeline...'}</p>
              <button
                onClick={handleStop}
                className="mt-6 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* ── Idea Validation Steps (streaming) ── */}
          {(isRunning && mode === 'idea' || (mode === 'idea' && validationSteps.some(s => s.status === 'complete'))) && (
            <motion.div
              key="validation-steps"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transition.normal}
            >
              <div className="mb-6 flex items-center gap-3">
                <Sparkles size={18} className="text-gold" />
                <h3 className="text-lg font-semibold text-zinc-200">Idea Validation Chain</h3>
                {isRunning && <Loader2 size={14} className="text-gold animate-spin" />}
              </div>

              {/* Step progress bar */}
              <div className="mb-8 flex gap-2">
                {validationSteps.map((vs) => (
                  <div key={vs.step} className="flex-1">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className={`text-[0.6rem] font-bold ${
                        vs.status === 'complete' ? 'text-emerald-400' :
                        vs.status === 'running' ? 'text-gold' : 'text-zinc-600'
                      }`}>
                        STEP {vs.step}
                      </span>
                      <span className="text-[0.6rem] text-zinc-600">{vs.title}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          vs.status === 'complete' ? 'bg-emerald-400' :
                          vs.status === 'running' ? 'bg-gold' : 'bg-transparent'
                        }`}
                        initial={{ width: '0%' }}
                        animate={{ width: vs.status === 'complete' ? '100%' : vs.status === 'running' ? '60%' : '0%' }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Step content */}
              <div className="space-y-4">
                {validationSteps.map((vs) => vs.content && (
                  <motion.div
                    key={vs.step}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-white/5 bg-[#111113] p-5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {vs.status === 'complete' ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Zap size={12} className="text-emerald-400" />
                        </span>
                      ) : (
                        <Loader2 size={14} className="text-gold animate-spin" />
                      )}
                      <h4 className="text-sm font-semibold text-zinc-300">
                        Step {vs.step}: {vs.title}
                      </h4>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-zinc-400 whitespace-pre-wrap">
                      {vs.content}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Post-validation CTA */}
              {!isRunning && validationSteps[3]?.status === 'complete' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 flex flex-col sm:flex-row gap-3"
                >
                  <Link
                    href={`/dashboard/make-it-mine/web-app?idea=${encodeURIComponent(idea)}`}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gold/90 hover:bg-gold px-5 py-3 text-sm font-semibold text-black transition-colors"
                  >
                    <Zap size={16} /> Build It Now
                  </Link>
                  <button
                    onClick={() => { setMode('clone'); setResearchResult(null); setValidationSteps(prev => prev.map(s => ({ ...s, content: '', status: 'pending' as const }))); }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 px-5 py-3 text-sm font-medium text-zinc-300 transition-colors"
                  >
                    <Search size={16} /> Deep Research Instead
                  </button>
                  <button
                    onClick={resetAll}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 px-5 py-3 text-sm font-medium text-zinc-400 transition-colors"
                  >
                    New Idea
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Research Results ── */}
          {researchResult && (
            <motion.div
              key="research-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transition.normal}
            >
              <ResearchReport data={researchResult} idea={idea} onBuild={() => {}} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Research Report (Scrollytelling-ready)                             */
/* ─────────────────────────────────────────────────────────────────── */

function ResearchReport({
  data,
  idea,
}: {
  data: FullResearchOutput;
  idea: string;
  onBuild: () => void;
}) {
  const { research, clonePlan, adaptationPlan, evidence } = data;

  return (
    <div className="space-y-8">
      {/* Title Card */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gold/10 bg-gradient-to-br from-gold/5 via-transparent to-transparent p-8"
      >
        <span className="text-[0.6rem] uppercase tracking-wider text-gold/60 bg-gold/5 border border-gold/10 px-2 py-0.5 rounded">
          Deep Scout Report
        </span>
        <h2 className="mt-4 text-2xl font-bold text-zinc-100">{research.facts.productName}</h2>
        <p className="mt-2 text-zinc-400">{research.facts.description}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {research.totalSources} sources analyzed
          </span>
          <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {research.facts.competitors.length} competitors mapped
          </span>
          <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {clonePlan.phases.length} build phases
          </span>
        </div>
      </motion.section>

      {/* Key Features */}
      <ReportSection title="Key Features" icon={<Sparkles size={16} className="text-gold" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {research.facts.keyFeatures.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-zinc-400">
              <Zap size={12} className="mt-1 text-gold/60 shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </ReportSection>

      {/* Competitors */}
      <ReportSection title="Competitive Landscape" icon={<Target size={16} className="text-emerald-400" />}>
        <div className="flex flex-wrap gap-2">
          {research.facts.competitors.map((c, i) => (
            <span key={i} className="text-sm px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-zinc-400">
              {c}
            </span>
          ))}
        </div>
        {research.facts.differentiators.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Current Differentiators</h4>
            <ul className="space-y-1">
              {research.facts.differentiators.map((d, i) => (
                <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span> {d}
                </li>
              ))}
            </ul>
          </div>
        )}
      </ReportSection>

      {/* Clone Plan */}
      <ReportSection title="Build Plan" icon={<Zap size={16} className="text-blue-400" />}>
        <p className="text-sm text-zinc-400 mb-4">{clonePlan.description}</p>
        <div className="space-y-4">
          {clonePlan.phases.map((phase, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-zinc-500">PHASE {i + 1}</span>
                <span className="text-sm font-medium text-zinc-300">{phase.name}</span>
                <span className={`ml-auto text-[0.6rem] uppercase tracking-wider px-2 py-0.5 rounded ${
                  phase.estimatedComplexity === 'high'
                    ? 'text-red-400 bg-red-500/10'
                    : phase.estimatedComplexity === 'medium'
                      ? 'text-amber-400 bg-amber-500/10'
                      : 'text-emerald-400 bg-emerald-500/10'
                }`}>
                  {phase.estimatedComplexity}
                </span>
              </div>
              <ul className="space-y-1">
                {phase.tasks.map((t, j) => (
                  <li key={j} className="text-sm text-zinc-500 flex items-start gap-2">
                    <span className="text-zinc-700 mt-0.5">→</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ReportSection>

      {/* Adaptation / Differentiation Plan */}
      <ReportSection title="Your Unique Angle" icon={<TrendingUp size={16} className="text-amber-400" />}>
        <div className="rounded-xl border border-gold/10 bg-gold/[0.02] p-4 mb-4">
          <p className="text-sm font-medium text-gold/80">&ldquo;{adaptationPlan.uniqueAngle}&rdquo;</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Differentiators</h4>
            <ul className="space-y-1">
              {adaptationPlan.differentiators.map((d, i) => (
                <li key={i} className="text-sm text-zinc-400">• {d}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Launch Steps</h4>
            <ol className="space-y-1">
              {adaptationPlan.launchSteps.map((s, i) => (
                <li key={i} className="text-sm text-zinc-400">
                  <span className="text-gold/60 font-medium mr-1">{i + 1}.</span> {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg border border-white/5 bg-white/[0.02]">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Pricing Strategy</p>
          <p className="text-sm text-zinc-300">{adaptationPlan.pricingStrategy}</p>
        </div>
      </ReportSection>

      {/* Tech Stack */}
      <ReportSection title="Recommended Stack" icon={<Globe size={16} className="text-purple-400" />}>
        <div className="flex flex-wrap gap-2">
          {clonePlan.recommendedStack.map((tech, i) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-lg border border-purple-500/20 bg-purple-500/5 text-purple-300">
              {tech}
            </span>
          ))}
        </div>
        {clonePlan.requiredServices.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-zinc-600 mb-1">Required Services:</p>
            <div className="flex flex-wrap gap-2">
              {clonePlan.requiredServices.map((svc, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded bg-white/[0.03] text-zinc-500">
                  {svc}
                </span>
              ))}
            </div>
          </div>
        )}
      </ReportSection>

      {/* Sources */}
      <ReportSection title="Sources & Evidence" icon={<Search size={16} className="text-zinc-400" />}>
        {evidence.map((ev) => (
          <div key={ev.id} className="mb-3 last:mb-0">
            <p className="text-xs text-zinc-600 mb-1">
              Query: &ldquo;{ev.query}&rdquo; — {ev.resultCount} results
            </p>
            <div className="flex flex-wrap gap-1">
              {ev.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.65rem] px-2 py-1 rounded bg-white/[0.02] text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors truncate max-w-[200px]"
                  title={src.title}
                >
                  {src.title}
                </a>
              ))}
            </div>
          </div>
        ))}
      </ReportSection>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-3 pt-4"
      >
        <Link
          href={`/dashboard/make-it-mine/web-app?idea=${encodeURIComponent(idea)}`}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gold/90 hover:bg-gold px-5 py-3 text-sm font-semibold text-black transition-colors"
        >
          <Zap size={16} /> Build This with ACHEEVY
        </Link>
        <Link
          href="/dashboard/make-it-mine"
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 px-5 py-3 text-sm font-medium text-zinc-300 transition-colors"
        >
          Back to M.I.M.
        </Link>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Report Section Wrapper                                             */
/* ─────────────────────────────────────────────────────────────────── */

function ReportSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={transition.normal}
      className="rounded-2xl border border-white/5 bg-[#111113] p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </motion.section>
  );
}
