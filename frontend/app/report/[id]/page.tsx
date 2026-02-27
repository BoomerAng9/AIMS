'use client';

/**
 * Scrollytelling Report Renderer — /report/[id]
 *
 * Interactive scroll-driven research report. The "killer feature" of Deep Scout.
 * Each section animates into view as the user scrolls, creating a cinematic
 * reading experience for research reports.
 *
 * Data sources (in priority order):
 *   1. sessionStorage (set by Deep Scout page before navigation)
 *   2. API fetch from /api/reports/[id] (future: Firestore)
 *
 * Design: Full-screen sections, parallax effects, scroll-triggered animations.
 * Follows A.I.M.S. glass/dark/gold design system.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Loader2,
  Search,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { transition } from '@/lib/motion/tokens';

/* ─────────────────────────────────────────────────────────────────── */
/*  Types                                                              */
/* ─────────────────────────────────────────────────────────────────── */

interface ReportData {
  id: string;
  createdAt: string;
  idea: string;
  industry?: string;
  research: {
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
  };
  clonePlan: {
    projectName: string;
    description: string;
    phases: Array<{
      name: string;
      tasks: string[];
      estimatedComplexity: string;
    }>;
    requiredServices: string[];
    recommendedStack: string[];
  };
  adaptationPlan: {
    uniqueAngle: string;
    differentiators: string[];
    targetNiche: string;
    brandSuggestions: string[];
    pricingStrategy: string;
    launchSteps: string[];
  };
  evidence: Array<{
    id: string;
    query: string;
    resultCount: number;
    sources: Array<{ title: string; url: string }>;
    timestamp: string;
  }>;
  validationSteps?: Array<{
    step: number;
    title: string;
    content: string;
  }>;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Main Page Component                                                */
/* ─────────────────────────────────────────────────────────────────── */

export default function ScrollytellingReport() {
  const params = useParams();
  const reportId = params?.id as string;
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      // 1. Try sessionStorage first (set by Deep Scout before navigation)
      try {
        const stored = sessionStorage.getItem(`deep-scout-report-${reportId}`);
        if (stored) {
          setReport(JSON.parse(stored));
          setLoading(false);
          return;
        }
      } catch { /* sessionStorage unavailable */ }

      // 2. Try API
      try {
        const res = await fetch(`/api/reports/${reportId}`);
        if (res.ok) {
          const data = await res.json();
          setReport(data);
        } else {
          setError('Report not found. It may have expired or the link is invalid.');
        }
      } catch {
        setError('Failed to load report.');
      }
      setLoading(false);
    }

    if (reportId) loadReport();
  }, [reportId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <Loader2 size={32} className="text-gold animate-spin" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center gap-4 text-center px-4">
        <BookOpen size={40} className="text-zinc-600" />
        <h2 className="text-lg font-semibold text-zinc-300">{error || 'Report not found'}</h2>
        <Link
          href="/dashboard/deep-scout"
          className="text-sm text-gold hover:text-gold/80 transition-colors"
        >
          ← Back to Deep Scout
        </Link>
      </div>
    );
  }

  return <ReportView report={report} />;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Report View — Full Scrollytelling Experience                       */
/* ─────────────────────────────────────────────────────────────────── */

function ReportView({ report }: { report: ReportData }) {
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const [copied, setCopied] = useState(false);

  const totalFeatures = report.research.facts.keyFeatures.length;
  const totalCompetitors = report.research.facts.competitors.length;
  const totalPhases = report.clonePlan.phases.length;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gold/80 z-50 origin-left"
        style={{ width: progressWidth }}
      />

      {/* Sticky Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
          <Link
            href="/dashboard/deep-scout"
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
          >
            <ArrowLeft size={14} /> Deep Scout
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Copy report link"
            >
              {copied ? <><Zap size={12} className="text-emerald-400" /> Copied!</> : <><Share2 size={12} /> Share</>}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <HeroSection report={report} />

      {/* ── Stats Bar ── */}
      <ScrollSection>
        <div className="mx-auto max-w-4xl grid grid-cols-3 gap-6 py-8">
          <StatCard value={report.research.totalSources} label="Sources Analyzed" color="blue" />
          <StatCard value={totalCompetitors} label="Competitors Mapped" color="emerald" />
          <StatCard value={totalPhases} label="Build Phases" color="amber" />
        </div>
      </ScrollSection>

      {/* ── Product Overview ── */}
      <ScrollSection className="py-20">
        <div className="mx-auto max-w-3xl">
          <SectionLabel>Product Overview</SectionLabel>
          <h2 className="text-3xl font-bold text-zinc-100 mt-4 mb-6">
            {report.research.facts.productName}
          </h2>
          <p className="text-lg text-zinc-400 leading-relaxed">
            {report.research.facts.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <InfoChip icon={<Target size={12} />} label={report.research.facts.targetAudience} />
            {report.industry && <InfoChip icon={<Globe size={12} />} label={report.industry} />}
          </div>
        </div>
      </ScrollSection>

      {/* ── Key Features ── */}
      <ScrollSection className="py-20 bg-white/[0.01]">
        <div className="mx-auto max-w-4xl">
          <SectionLabel>Key Features</SectionLabel>
          <h2 className="text-2xl font-bold text-zinc-100 mt-4 mb-8">
            {totalFeatures} capabilities identified
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {report.research.facts.keyFeatures.map((feature, i) => (
              <FeatureCard key={i} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* ── Competitive Landscape ── */}
      <ScrollSection className="py-20">
        <div className="mx-auto max-w-4xl">
          <SectionLabel>Competitive Landscape</SectionLabel>
          <h2 className="text-2xl font-bold text-zinc-100 mt-4 mb-8">
            {totalCompetitors} competitors in the space
          </h2>
          <div className="flex flex-wrap gap-3 mb-8">
            {report.research.facts.competitors.map((comp, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="text-sm px-4 py-2 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-emerald-300"
              >
                {comp}
              </motion.span>
            ))}
          </div>
          {report.research.facts.differentiators.length > 0 && (
            <div className="rounded-2xl border border-white/5 bg-[#111113] p-6">
              <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">
                Differentiators
              </h3>
              {report.research.facts.differentiators.map((d, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="text-zinc-400 mb-2 flex items-start gap-2"
                >
                  <Sparkles size={14} className="text-gold/50 mt-1 shrink-0" /> {d}
                </motion.p>
              ))}
            </div>
          )}
        </div>
      </ScrollSection>

      {/* ── Monetization ── */}
      {report.research.facts.monetization.length > 0 && (
        <ScrollSection className="py-20 bg-white/[0.01]">
          <div className="mx-auto max-w-3xl">
            <SectionLabel>Revenue Model</SectionLabel>
            <h2 className="text-2xl font-bold text-zinc-100 mt-4 mb-8">
              How they make money
            </h2>
            <div className="space-y-3">
              {report.research.facts.monetization.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#111113] p-4"
                >
                  <span className="text-gold font-bold text-lg">{i + 1}</span>
                  <span className="text-zinc-300">{m}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollSection>
      )}

      {/* ── Your Unique Angle ── */}
      <ScrollSection className="py-24">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>Your Unique Angle</SectionLabel>
          <motion.blockquote
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-2xl sm:text-3xl font-bold text-gold/90 leading-snug"
          >
            &ldquo;{report.adaptationPlan.uniqueAngle}&rdquo;
          </motion.blockquote>
          <p className="mt-4 text-zinc-500">
            Target niche: {report.adaptationPlan.targetNiche}
          </p>
        </div>
      </ScrollSection>

      {/* ── Build Plan ── */}
      <ScrollSection className="py-20 bg-white/[0.01]">
        <div className="mx-auto max-w-4xl">
          <SectionLabel>Build Plan</SectionLabel>
          <h2 className="text-2xl font-bold text-zinc-100 mt-4 mb-2">
            {report.clonePlan.projectName}
          </h2>
          <p className="text-zinc-500 mb-8">{report.clonePlan.description}</p>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-white/5" />

            {report.clonePlan.phases.map((phase, i) => (
              <PhaseCard key={i} phase={phase} index={i} total={totalPhases} />
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* ── Adaptation Strategy ── */}
      <ScrollSection className="py-20">
        <div className="mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Differentiators */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/5 bg-[#111113] p-6"
          >
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">
              Your Differentiators
            </h3>
            <ul className="space-y-3">
              {report.adaptationPlan.differentiators.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <Zap size={14} className="text-gold mt-0.5 shrink-0" /> {d}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Launch Steps */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/5 bg-[#111113] p-6"
          >
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">
              Go-to-Market Steps
            </h3>
            <ol className="space-y-3">
              {report.adaptationPlan.launchSteps.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center text-gold text-xs font-bold">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </motion.div>
        </div>

        {/* Pricing */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl mt-6 rounded-2xl border border-gold/10 bg-gold/[0.02] p-6"
        >
          <h3 className="text-sm font-medium text-gold/60 uppercase tracking-wider mb-2">
            Pricing Strategy
          </h3>
          <p className="text-zinc-300">{report.adaptationPlan.pricingStrategy}</p>
        </motion.div>
      </ScrollSection>

      {/* ── Tech Stack ── */}
      <ScrollSection className="py-20 bg-white/[0.01]">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>Recommended Stack</SectionLabel>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {report.clonePlan.recommendedStack.map((tech, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="px-4 py-2 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-sm"
              >
                {tech}
              </motion.span>
            ))}
          </div>
          {report.clonePlan.requiredServices.length > 0 && (
            <div className="mt-6">
              <p className="text-xs text-zinc-600 mb-2">Required Services</p>
              <div className="flex flex-wrap justify-center gap-2">
                {report.clonePlan.requiredServices.map((svc, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.03] text-zinc-500">
                    {svc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollSection>

      {/* ── Sources ── */}
      <ScrollSection className="py-20">
        <div className="mx-auto max-w-4xl">
          <SectionLabel>Sources & Evidence</SectionLabel>
          <p className="mt-4 text-zinc-500 mb-8">
            {report.research.totalSources} sources across {report.evidence.length} research queries
          </p>
          <div className="space-y-4">
            {report.evidence.map((ev) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-xl border border-white/5 bg-[#111113] p-4"
              >
                <p className="text-xs text-zinc-600 mb-2 flex items-center gap-2">
                  <Search size={10} />
                  &ldquo;{ev.query}&rdquo; — {ev.resultCount} results
                </p>
                <div className="flex flex-wrap gap-2">
                  {ev.sources.map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.7rem] px-2.5 py-1 rounded-lg bg-white/[0.03] text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors flex items-center gap-1 max-w-[220px] truncate"
                      title={src.title}
                    >
                      <ExternalLink size={8} className="shrink-0" />
                      {src.title}
                    </a>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* ── CTA Footer ── */}
      <section className="py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-lg"
        >
          <Image
            src="/assets/aims_transparent_logo.svg"
            alt=""
            width={40}
            height={40}
            className="mx-auto mb-4 opacity-60"
          />
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">
            Ready to build this?
          </h2>
          <p className="text-zinc-500 mb-8">
            ACHEEVY can take this research and build the product. Meticulously.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/dashboard/make-it-mine/web-app?idea=${encodeURIComponent(report.idea)}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-gold/90 hover:bg-gold px-6 py-3 text-sm font-semibold text-black transition-colors"
            >
              <Zap size={16} /> Build with ACHEEVY
            </Link>
            <Link
              href="/dashboard/deep-scout"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors"
            >
              <ArrowRight size={16} /> New Research
            </Link>
          </div>
        </motion.div>

        <div className="mt-16 text-[0.6rem] text-zinc-700 uppercase tracking-widest">
          Generated by Deep Scout — Powered by ACHEEVY
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Sub-Components                                                     */
/* ─────────────────────────────────────────────────────────────────── */

/** Full-viewport scroll-triggered section */
function ScrollSection({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={`px-4 ${className}`}
    >
      {children}
    </motion.section>
  );
}

/** Hero section with parallax */
function HeroSection({ report }: { report: ReportData }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={ref} className="relative overflow-hidden min-h-[80vh] flex items-center justify-center">
      {/* Background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent"
        style={{ y }}
      />

      <motion.div style={{ opacity }} className="relative z-10 text-center px-4 pt-20">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-block text-[0.6rem] uppercase tracking-[0.2em] text-gold/60 bg-gold/5 border border-gold/10 px-3 py-1 rounded-full mb-6"
        >
          Deep Scout Research Report
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-zinc-100 max-w-3xl mx-auto leading-tight"
        >
          {report.research.facts.productName}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-6 text-lg text-zinc-400 max-w-xl mx-auto"
        >
          {report.research.facts.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-wrap justify-center gap-3 text-xs"
        >
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {report.research.totalSources} sources
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {report.research.facts.competitors.length} competitors
          </span>
          {report.industry && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {report.industry}
            </span>
          )}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="text-zinc-600 text-xs flex flex-col items-center gap-2"
          >
            <span>Scroll to explore</span>
            <ArrowLeft size={14} className="rotate-[-90deg]" />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/** Animated stat card */
function StatCard({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: 'blue' | 'emerald' | 'amber';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const colorMap = {
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      className="text-center"
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.2 }}
        className={`text-3xl sm:text-4xl font-bold ${colorMap[color]}`}
      >
        {value}
      </motion.span>
      <p className="mt-1 text-xs text-zinc-600 uppercase tracking-wider">{label}</p>
    </motion.div>
  );
}

/** Feature card with staggered animation */
function FeatureCard({ feature, index }: { feature: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-3 rounded-xl border border-white/5 bg-[#111113] p-4"
    >
      <Zap size={14} className="text-gold/60 mt-0.5 shrink-0" />
      <span className="text-sm text-zinc-300">{feature}</span>
    </motion.div>
  );
}

/** Build phase timeline card */
function PhaseCard({
  phase,
  index,
  total,
}: {
  phase: { name: string; tasks: string[]; estimatedComplexity: string };
  index: number;
  total: number;
}) {
  const complexityColor =
    phase.estimatedComplexity === 'high'
      ? 'text-red-400 bg-red-500/10 border-red-500/20'
      : phase.estimatedComplexity === 'medium'
        ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="relative pl-10 pb-8 last:pb-0"
    >
      {/* Timeline dot */}
      <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-gold/80 border-2 border-[#0A0A0B]" />

      <div className="rounded-xl border border-white/5 bg-[#111113] p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-zinc-600">PHASE {index + 1}/{total}</span>
          <span className="text-sm font-semibold text-zinc-200">{phase.name}</span>
          <span className={`ml-auto text-[0.6rem] uppercase tracking-wider px-2 py-0.5 rounded border ${complexityColor}`}>
            {phase.estimatedComplexity}
          </span>
        </div>
        <ul className="space-y-1.5">
          {phase.tasks.map((task, j) => (
            <li key={j} className="text-sm text-zinc-500 flex items-start gap-2">
              <span className="text-zinc-700 mt-0.5">→</span> {task}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

/** Section label */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 5 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="inline-block text-[0.6rem] uppercase tracking-[0.15em] text-gold/60 bg-gold/5 border border-gold/10 px-2.5 py-1 rounded"
    >
      {children}
    </motion.span>
  );
}

/** Small info chip */
function InfoChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-zinc-400">
      {icon}
      {label}
    </span>
  );
}
