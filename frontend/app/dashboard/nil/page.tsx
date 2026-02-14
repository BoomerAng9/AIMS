'use client';

/**
 * N.I.L. Dashboard — Name, Image & Likeness
 *
 * Part of the Per|Form platform. Sports. Real world.
 * Athlete empowerment, deal intelligence, valuation, compliance.
 *
 * NOT lore. NOT fantasy. This is the business of being an athlete.
 */

import { useState } from 'react';
import {
  NIL_FOUNDATION,
  DEAL_ARCHETYPES,
  VALUATION_FACTORS,
  NIL_TIERS,
  POSITION_NIL_PROFILES,
} from '@/lib/content/nil';

// ─── Color Mapping ────────────────────────────────────────────────────

const COLOR_MAP: Record<string, { border: string; bg: string; text: string }> = {
  gold:    { border: 'border-amber-500/30',   bg: 'bg-amber-500/10',   text: 'text-amber-400' },
  amber:   { border: 'border-amber-500/30',   bg: 'bg-amber-500/10',   text: 'text-amber-400' },
  emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  cyan:    { border: 'border-cyan-500/30',    bg: 'bg-cyan-500/10',    text: 'text-cyan-400' },
  purple:  { border: 'border-purple-500/30',  bg: 'bg-purple-500/10',  text: 'text-purple-400' },
  blue:    { border: 'border-blue-500/30',    bg: 'bg-blue-500/10',    text: 'text-blue-400' },
  red:     { border: 'border-red-500/30',     bg: 'bg-red-500/10',     text: 'text-red-400' },
};

function getColors(color: string) {
  return COLOR_MAP[color] || COLOR_MAP.amber;
}

// ─── Tabs ─────────────────────────────────────────────────────────────

type Tab = 'overview' | 'deals' | 'valuation' | 'tiers' | 'portal' | 'timeline';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'deals', label: 'Deal Types' },
  { id: 'valuation', label: 'Valuation' },
  { id: 'tiers', label: 'NIL Tiers' },
  { id: 'portal', label: 'Portal & Revenue' },
  { id: 'timeline', label: 'Timeline' },
];

// ─── Component ────────────────────────────────────────────────────────

export default function NILPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">N.I.L.</h1>
            <span className="text-sm font-normal text-zinc-500">Name, Image &amp; Likeness</span>
          </div>
          <p className="text-zinc-500 text-sm">
            {NIL_FOUNDATION.tagline}
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            Per|Form Platform
          </p>
        </div>

        {/* Book Reference */}
        <a
          href={NIL_FOUNDATION.book.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl hover:bg-amber-500/15 transition-colors shrink-0"
        >
          <div className="text-2xl">📕</div>
          <div>
            <p className="text-sm font-semibold text-amber-400">{NIL_FOUNDATION.book.title}</p>
            <p className="text-[10px] text-zinc-500">Available on {NIL_FOUNDATION.book.platform}</p>
          </div>
        </a>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs rounded-lg border transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'deals' && <DealsTab />}
      {activeTab === 'valuation' && <ValuationTab />}
      {activeTab === 'tiers' && <TiersTab />}
      {activeTab === 'portal' && <PortalRevenueTab />}
      {activeTab === 'timeline' && <TimelineTab />}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <p className="text-sm text-zinc-300 leading-relaxed">
          {NIL_FOUNDATION.summary}
        </p>
      </div>

      {/* Book Foundation Card */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 flex items-start gap-4">
        <div className="text-4xl shrink-0">📕</div>
        <div>
          <h2 className="text-base font-semibold text-amber-400 mb-1">{NIL_FOUNDATION.book.title}</h2>
          <p className="text-sm text-zinc-400 leading-relaxed mb-2">
            {NIL_FOUNDATION.book.description}
          </p>
          <a
            href={NIL_FOUNDATION.book.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            Available on {NIL_FOUNDATION.book.platform} &rarr;
          </a>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {NIL_FOUNDATION.sections.map(section => {
          const colors = getColors(section.color);
          return (
            <div
              key={section.id}
              className={`bg-zinc-900/50 border ${colors.border} rounded-xl p-5`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-mono uppercase tracking-wider ${colors.text}`}>
                  {section.title}
                </span>
              </div>
              <p className={`text-xs italic mb-3 ${colors.text} opacity-60`}>
                {section.subtitle}
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line line-clamp-6">
                {section.content.split('\n\n')[0]}
              </p>
            </div>
          );
        })}
      </div>

      {/* Position Dynamics */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Position NIL Dynamics</h2>
        <div className="space-y-3">
          {POSITION_NIL_PROFILES.map(profile => {
            const colors = getColors(profile.color);
            return (
              <div key={profile.position} className="flex items-start gap-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                <div className="shrink-0">
                  <span className={`px-2 py-1 rounded text-xs border font-medium ${colors.border} ${colors.bg} ${colors.text}`}>
                    {profile.nilPotential.toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{profile.position}</span>
                    <span className="text-xs text-zinc-500">{profile.sport}</span>
                  </div>
                  <p className="text-xs text-zinc-400">{profile.valueDiver}</p>
                  <p className="text-xs text-zinc-600 mt-1">{profile.challenge}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Deals Tab ────────────────────────────────────────────────────────

function DealsTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        NIL deals come in many forms. Each has different value drivers, compliance considerations, and accessibility.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEAL_ARCHETYPES.map(deal => {
          const colors = getColors(deal.color);
          return (
            <div
              key={deal.id}
              className={`bg-zinc-900/50 border ${colors.border} rounded-xl p-5`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{deal.name}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] border font-mono ${colors.border} ${colors.bg} ${colors.text}`}>
                  {deal.accessLevel.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-3">{deal.description}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Value Range</span>
                <span className={`text-xs font-mono font-bold ${colors.text}`}>{deal.valueRange}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {deal.examples.map(ex => (
                  <span key={ex} className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-400 border border-zinc-700">
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Valuation Tab ────────────────────────────────────────────────────

function ValuationTab() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-500">
        NIL valuation is part science, part market dynamics. These are the factors that determine an athlete&apos;s worth.
      </p>

      {/* Weight Bars */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold mb-2">Valuation Weight Distribution</h2>
        {VALUATION_FACTORS.map(factor => {
          const colors = getColors(factor.color);
          const pct = factor.weight * 100;
          return (
            <div key={factor.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{factor.name}</span>
                <span className={`text-xs font-mono font-bold ${colors.text}`}>{pct}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${colors.bg} border ${colors.border}`}
                  style={{ width: `${pct}%`, backgroundColor: `var(--tw-bg-opacity, 1)` }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">{factor.description}</p>
            </div>
          );
        })}
      </div>

      {/* Factor Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {VALUATION_FACTORS.map(factor => {
          const colors = getColors(factor.color);
          return (
            <div key={factor.id} className={`bg-zinc-900/50 border ${colors.border} rounded-xl p-5`}>
              <h3 className={`text-sm font-semibold mb-3 ${colors.text}`}>{factor.name}</h3>
              <ul className="space-y-1.5">
                {factor.metrics.map(metric => (
                  <li key={metric} className="flex items-center gap-2 text-xs text-zinc-400">
                    <div className={`w-1 h-1 rounded-full ${colors.bg} border ${colors.border}`} />
                    {metric}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tiers Tab ────────────────────────────────────────────────────────

function TiersTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        Not all NIL is created equal. Athlete value breaks into tiers based on performance, visibility, and market position.
      </p>
      <div className="space-y-3">
        {NIL_TIERS.map(tier => {
          const colors = getColors(tier.color);
          return (
            <div
              key={tier.id}
              className={`bg-zinc-900/50 border ${colors.border} rounded-xl p-5`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${colors.border} ${colors.bg} ${colors.text}`}>
                    {tier.name}
                  </span>
                  <span className={`text-lg font-mono font-bold ${colors.text}`}>{tier.range}</span>
                </div>
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider max-w-[200px] text-right">
                  {tier.prevalence}
                </span>
              </div>
              <p className="text-sm text-zinc-400 mb-2">{tier.description}</p>
              <p className="text-xs text-zinc-600 italic">{tier.archetype}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Portal & Revenue Tab ─────────────────────────────────────────────

function PortalRevenueTab() {
  const portalSection = NIL_FOUNDATION.sections.find(s => s.id === 'transfer-portal');
  const revenueSection = NIL_FOUNDATION.sections.find(s => s.id === 'revenue-sharing');

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-500">
        The Transfer Portal and Revenue Sharing are reshaping how NIL value flows through college athletics.
      </p>

      {portalSection && (
        <div className="bg-zinc-900/50 border border-blue-500/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-400 mb-1">{portalSection.title}</h2>
          <p className="text-xs italic text-blue-400/60 mb-4">{portalSection.subtitle}</p>
          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{portalSection.content}</p>
        </div>
      )}

      {revenueSection && (
        <div className="bg-zinc-900/50 border border-emerald-500/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-emerald-400 mb-1">{revenueSection.title}</h2>
          <p className="text-xs italic text-emerald-400/60 mb-4">{revenueSection.subtitle}</p>
          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{revenueSection.content}</p>
        </div>
      )}

      {/* GROC+Luke Formula Connection */}
      <div className="bg-zinc-900/50 border border-amber-500/30 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-amber-400 mb-3">The GROC+Luke Framework</h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-4">
          Per|Form&apos;s proprietary evaluation framework — rooted in the methodology from{' '}
          <span className="text-amber-400 font-medium">{NIL_FOUNDATION.book.title}</span> — powers
          NIL valuation, portal analysis, and revenue sharing projections.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GROC */}
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
            <h3 className="text-sm font-mono font-bold text-amber-400 mb-2">G.R.O.C.</h3>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[10px]">G</span>
                <span><strong className="text-zinc-300">Game Performance</strong> — 35% weight</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[10px]">R</span>
                <span><strong className="text-zinc-300">Raw Athletics</strong> — 25% weight</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[10px]">O</span>
                <span><strong className="text-zinc-300">Overall Production</strong> — 25% weight</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[10px]">C</span>
                <span><strong className="text-zinc-300">Competition Level</strong> — 15% weight</span>
              </li>
            </ul>
          </div>

          {/* Luke */}
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
            <h3 className="text-sm font-mono font-bold text-cyan-400 mb-2">L.U.K.E.</h3>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-[10px]">L</span>
                <span><strong className="text-zinc-300">Leadership</strong> — Multiplier (0.8-1.2)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-[10px]">U</span>
                <span><strong className="text-zinc-300">Upside/Ceiling</strong> — Score (0-100)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-[10px]">K</span>
                <span><strong className="text-zinc-300">Known Concerns</strong> — Risk flags</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-[10px]">E</span>
                <span><strong className="text-zinc-300">Evaluator Confidence</strong> — Score (0-100)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Timeline Tab ─────────────────────────────────────────────────────

function TimelineTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        The road to NIL didn&apos;t happen overnight. It took lawsuits, legislation, and a Supreme Court ruling.
      </p>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[18px] top-4 bottom-4 w-px bg-zinc-800" />

        <div className="space-y-4">
          {NIL_FOUNDATION.timeline.map((event, i) => (
            <div key={`${event.year}-${i}`} className="relative flex items-start gap-4 pl-1">
              {/* Dot */}
              <div className="relative z-10 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full bg-zinc-900 border-2 border-amber-500/50 flex items-center justify-center">
                  <div className="w-[6px] h-[6px] rounded-full bg-amber-400" />
                </div>
              </div>

              {/* Content */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono font-bold text-amber-400">{event.year}</span>
                  {event.month && (
                    <span className="text-xs text-zinc-500">{event.month}</span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-1">{event.event}</h3>
                <p className="text-xs text-zinc-400">{event.significance}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
