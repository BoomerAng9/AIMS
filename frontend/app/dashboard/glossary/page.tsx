// frontend/app/dashboard/glossary/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { usePlatformMode } from '@/lib/platform-mode';
import { TERMS, type GlossaryCategory } from '@/lib/terminology';
import { Search, BookOpen, Filter, ChevronDown, Hash, Cpu, Layers, Zap, CreditCard, Palette, ShieldCheck, BrainCircuit } from 'lucide-react';

/* ─── Category metadata ──────────────────────────────────── */
const CATEGORY_META: Record<GlossaryCategory, { label: string; icon: React.ReactNode; color: string }> = {
  agents:         { label: 'Agents',         icon: <BrainCircuit className="w-4 h-4" />, color: 'text-amber-400' },
  infrastructure: { label: 'Infrastructure', icon: <Cpu className="w-4 h-4" />,          color: 'text-blue-400' },
  features:       { label: 'Features',       icon: <Layers className="w-4 h-4" />,       color: 'text-emerald-400' },
  operations:     { label: 'Operations',     icon: <Zap className="w-4 h-4" />,          color: 'text-orange-400' },
  billing:        { label: 'Billing',        icon: <CreditCard className="w-4 h-4" />,   color: 'text-yellow-400' },
  design:         { label: 'Design',         icon: <Palette className="w-4 h-4" />,      color: 'text-pink-400' },
  governance:     { label: 'Governance',     icon: <ShieldCheck className="w-4 h-4" />,  color: 'text-violet-400' },
  nlp:            { label: 'NLP',            icon: <Hash className="w-4 h-4" />,          color: 'text-cyan-400' },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as GlossaryCategory[];

export default function GlossaryPage() {
  const { mode } = usePlatformMode();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<GlossaryCategory | 'all'>('all');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  /* ─── Filtered + grouped terms ─────────────────────────── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return Object.entries(TERMS).filter(([_key, entry]) => {
      // category filter
      if (activeCategory !== 'all' && entry.category !== activeCategory) return false;
      // search filter
      if (!q) return true;
      return (
        entry.technical.toLowerCase().includes(q) ||
        entry.simple.toLowerCase().includes(q) ||
        entry.definition.toLowerCase().includes(q) ||
        entry.aliases.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [search, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map<GlossaryCategory, [string, typeof TERMS[string]][]>();
    for (const item of filtered) {
      const cat = item[1].category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return map;
  }, [filtered]);

  /* ─── Category counts ──────────────────────────────────── */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: Object.keys(TERMS).length };
    for (const entry of Object.values(TERMS)) {
      counts[entry.category] = (counts[entry.category] || 0) + 1;
    }
    return counts;
  }, []);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#09090B] text-zinc-100 p-6 md:p-10"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-6 h-6 text-[#D4AF37]" />
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === 'PRIVATE' ? 'Platform Glossary' : 'Help & Terminology'}
          </h1>
        </div>
        <p className="text-zinc-400 text-sm max-w-2xl">
          {mode === 'PRIVATE'
            ? 'Full technical glossary of A.I.M.S. platform terms, infrastructure, agents, and operations — with NLP aliases for the SME-NLP pipeline.'
            : 'Browse all the terms used across the platform. Click any term to see what it means.'}
        </p>
      </motion.div>

      {/* Search bar */}
      <motion.div variants={staggerItem} className="mb-6">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={mode === 'PRIVATE' ? 'Search terms, aliases, definitions…' : 'Search…'}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-colors"
          />
        </div>
      </motion.div>

      {/* Category pills */}
      <motion.div variants={staggerItem} className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
            activeCategory === 'all'
              ? 'bg-[#D4AF37]/20 border-[#D4AF37]/40 text-[#D4AF37]'
              : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
          }`}
        >
          <Filter className="w-3 h-3 inline mr-1.5 -mt-0.5" />
          All ({categoryCounts.all})
        </button>
        {ALL_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat];
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border flex items-center gap-1.5 ${
                activeCategory === cat
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37]/40 text-[#D4AF37]'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
              }`}
            >
              {meta.icon}
              {meta.label} ({categoryCounts[cat] || 0})
            </button>
          );
        })}
      </motion.div>

      {/* Results */}
      {filtered.length === 0 ? (
        <motion.div variants={staggerItem} className="text-center py-16">
          <Search className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No terms match your search.</p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries())
            .sort(([a], [b]) => ALL_CATEGORIES.indexOf(a) - ALL_CATEGORIES.indexOf(b))
            .map(([category, items]) => {
              const meta = CATEGORY_META[category];
              return (
                <motion.section key={category} variants={staggerItem}>
                  {/* Category header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={meta.color}>{meta.icon}</span>
                    <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                      {meta.label}
                    </h2>
                    <span className="text-xs text-zinc-600">({items.length})</span>
                  </div>

                  {/* Term cards */}
                  <div className="grid gap-2">
                    {items.map(([key, entry]) => {
                      const isExpanded = expandedKey === key;
                      const label = mode === 'PRIVATE' ? entry.technical : entry.simple;

                      return (
                        <motion.div
                          key={key}
                          layout
                          className="bg-white/[0.03] border border-white/[0.06] rounded-lg overflow-hidden hover:border-white/10 transition-colors"
                        >
                          <button
                            onClick={() => setExpandedKey(isExpanded ? null : key)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-sm font-medium text-zinc-100 truncate">
                                {label}
                              </span>
                              {mode === 'PRIVATE' && entry.technical !== entry.simple && (
                                <span className="text-xs text-zinc-500 truncate hidden sm:inline">
                                  → {entry.simple}
                                </span>
                              )}
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 space-y-2 border-t border-white/[0.04] pt-3">
                                  <p className="text-sm text-zinc-300 leading-relaxed">
                                    {entry.definition}
                                  </p>

                                  {mode === 'PRIVATE' && entry.aliases.length > 0 && (
                                    <div>
                                      <span className="text-xs text-zinc-500 font-medium">
                                        NLP Aliases:{' '}
                                      </span>
                                      <span className="text-xs text-zinc-400">
                                        {entry.aliases.map((alias, i) => (
                                          <React.Fragment key={alias}>
                                            {i > 0 && ', '}
                                            <span className="inline-block bg-white/5 px-1.5 py-0.5 rounded text-zinc-300">
                                              {alias}
                                            </span>
                                          </React.Fragment>
                                        ))}
                                      </span>
                                    </div>
                                  )}

                                  {mode === 'PRIVATE' && (
                                    <div className="flex items-center gap-3 text-xs text-zinc-600">
                                      <span>Key: <code className="text-zinc-500">{key}</code></span>
                                      <span>Category: <code className="text-zinc-500">{entry.category}</code></span>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.section>
              );
            })}
        </div>
      )}

      {/* Footer stats */}
      <motion.div variants={staggerItem} className="mt-12 pt-6 border-t border-white/[0.06]">
        <p className="text-xs text-zinc-600 text-center">
          {filtered.length} of {Object.keys(TERMS).length} terms
          {search && ` matching "${search}"`}
          {activeCategory !== 'all' && ` in ${CATEGORY_META[activeCategory].label}`}
        </p>
      </motion.div>
    </motion.div>
  );
}
