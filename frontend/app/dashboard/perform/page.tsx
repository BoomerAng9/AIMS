'use client';

/**
 * Per|Form Lobby — Dashboard Entry Point for Sports Intelligence
 *
 * Hub page that connects to:
 * - Film Room (video analysis with Twelve Labs)
 * - War Room (autonomous analytics pipeline)
 * - Sports Tracker (player careers via Brave Search + SAM)
 * - Big Board, Transfer Portal, NIL Tracker, Draft Sim
 * - Editor's Desk (content production pipeline)
 *
 * All powered by ACHEEVY's autonomous agent pipeline.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';
import {
  Film, Swords, Activity, LayoutGrid, ArrowRightLeft,
  DollarSign, Trophy, Newspaper, TrendingUp, Users,
} from 'lucide-react';

interface LobbyCard {
  title: string;
  description: string;
  href: string;
  icon: typeof Film;
  status: 'live' | 'beta' | 'coming-soon';
  accentColor: string;
}

const LOBBY_CARDS: LobbyCard[] = [
  {
    title: 'Film Room',
    description: 'AI-powered game film analysis. Upload video, run semantic search, generate scouting reports with Twelve Labs Marengo.',
    href: '/dashboard/film-room',
    icon: Film,
    status: 'live',
    accentColor: 'from-blue-500/20 to-blue-600/10',
  },
  {
    title: 'War Room',
    description: 'Autonomous sports analytics command center. Lil_Hawk debate feeds, mediation results, and Per|Form rankings.',
    href: '/dashboard/war-room',
    icon: Swords,
    status: 'live',
    accentColor: 'from-red-500/20 to-red-600/10',
  },
  {
    title: 'Sports Tracker',
    description: 'Track player careers, stats, and injuries in real-time. Nixie tube displays for live visualization.',
    href: '/dashboard/sports-tracker',
    icon: Activity,
    status: 'live',
    accentColor: 'from-emerald-500/20 to-emerald-600/10',
  },
  {
    title: 'Big Board',
    description: 'Prospect rankings across high school and college tiers. ELITE, BLUE_CHIP, PROSPECT, SLEEPER, and DEVELOPMENTAL.',
    href: '/sandbox/perform/big-board',
    icon: LayoutGrid,
    status: 'live',
    accentColor: 'from-gold/20 to-gold/10',
  },
  {
    title: 'Transfer Portal',
    description: 'Track portal entries, commitments, and decommitments across all conferences.',
    href: '/sandbox/perform/transfer-portal',
    icon: ArrowRightLeft,
    status: 'live',
    accentColor: 'from-purple-500/20 to-purple-600/10',
  },
  {
    title: 'NIL Tracker',
    description: 'Name, Image, and Likeness valuations, deals, and market trends.',
    href: '/dashboard/nil',
    icon: DollarSign,
    status: 'live',
    accentColor: 'from-green-500/20 to-green-600/10',
  },
  {
    title: 'Draft Simulator',
    description: 'Run AI-powered mock drafts with dynamic player movement and trade scenarios.',
    href: '/sandbox/perform/draft/simulator',
    icon: Trophy,
    status: 'beta',
    accentColor: 'from-amber-500/20 to-amber-600/10',
  },
  {
    title: "Editor's Desk",
    description: 'Content production pipeline. Assign stories, review drafts, publish across channels.',
    href: '/dashboard/editors-desk',
    icon: Newspaper,
    status: 'live',
    accentColor: 'from-cyan-500/20 to-cyan-600/10',
  },
];

const STATUS_BADGE = {
  'live': { label: 'LIVE', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  'beta': { label: 'BETA', className: 'bg-gold/20 text-gold border-gold/30' },
  'coming-soon': { label: 'SOON', className: 'bg-white/10 text-white/40 border-white/20' },
} as const;

interface PerFormStats {
  prospectsTracked: number;
  filmHoursAnalyzed: number;
  reportsGenerated: number;
  activeDebates: number;
}

function formatNumber(n: number): string {
  return n >= 1000 ? n.toLocaleString() : String(n);
}

export default function PerFormLobbyPage() {
  const [stats, setStats] = useState<PerFormStats>({
    prospectsTracked: 0,
    filmHoursAnalyzed: 0,
    reportsGenerated: 0,
    activeDebates: 0,
  });

  useEffect(() => {
    fetch('/api/perform/stats')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => { /* stats stay at 0 — non-blocking */ });
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-gold" />
          </div>
          <div>
            <h1 className="text-3xl font-display text-white">
              Per|Form
            </h1>
            <p className="text-sm text-white/40 font-mono uppercase tracking-widest">
              Autonomous Sports Intelligence Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Pipeline Active</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-wireframe-stroke">
            <Users className="w-3.5 h-3.5 text-white/40" />
            <span className="text-xs text-white/40 font-medium">5 Agent Roles Assigned</span>
          </div>
        </div>
      </motion.div>

      {/* Cards Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {LOBBY_CARDS.map((card) => {
          const Icon = card.icon;
          const badge = STATUS_BADGE[card.status];

          return (
            <motion.div key={card.title} variants={staggerItem}>
              <Link href={card.href}>
                <div className="group rounded-xl border border-wireframe-stroke bg-black/40 hover:bg-black/60 hover:border-gold/20 transition-all p-5 h-full flex flex-col gap-3 cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.accentColor} border border-white/10 flex items-center justify-center group-hover:border-gold/20 transition-colors`}>
                      <Icon className="w-5 h-5 text-white/70 group-hover:text-gold transition-colors" />
                    </div>
                    <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white group-hover:text-gold transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-white/30 mt-1 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Stats Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-wireframe-stroke"
      >
        {[
          { label: 'Prospects Tracked', value: formatNumber(stats.prospectsTracked) },
          { label: 'Film Hours Analyzed', value: formatNumber(stats.filmHoursAnalyzed) },
          { label: 'Reports Generated', value: formatNumber(stats.reportsGenerated) },
          { label: 'Active Debates', value: formatNumber(stats.activeDebates) },
        ].map((stat) => (
          <div key={stat.label} className="px-4 py-3 rounded-lg bg-white/[0.02] border border-wireframe-stroke">
            <p className="text-lg font-display text-white">{stat.value}</p>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
