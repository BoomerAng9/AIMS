'use client';

/**
 * Per|Form Conference Directory
 *
 * The Athletic-tier conference browsing experience.
 * Power 4 + Group of 5 accordion navigation, team profiles,
 * coaching staffs, social media handles, and contact info.
 *
 * Purpose: Give student athletes access to schools, coaches,
 * and recruiting departments for NIL deals and transfers.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, Users, MapPin, Building, Trophy,
  Search, ExternalLink, ArrowLeft, Shield, GraduationCap,
  Twitter, Instagram, Globe, Mail, Phone, Star,
} from 'lucide-react';
import {
  CONFERENCES, INDEPENDENTS, TIER_LABELS, getAllTeams, searchTeams,
  type Conference, type Team, type ConferenceTier,
} from '@/lib/perform/conferences';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function DirectoryPage() {
  const [expandedTier, setExpandedTier] = useState<ConferenceTier | 'independent' | null>('power4');
  const [expandedConf, setExpandedConf] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter] = useState('football');

  const power4 = useMemo(() => CONFERENCES.filter(c => c.tier === 'power4'), []);
  const group5 = useMemo(() => CONFERENCES.filter(c => c.tier === 'group_of_5'), []);
  const searchResults = useMemo(() => searchQuery.length > 1 ? searchTeams(searchQuery) : [], [searchQuery]);
  const totalTeams = useMemo(() => getAllTeams().length, []);

  function toggleTier(tier: ConferenceTier | 'independent') {
    setExpandedTier(prev => prev === tier ? null : tier);
    setExpandedConf(null);
    setSelectedTeam(null);
  }

  function toggleConf(confId: string) {
    setExpandedConf(prev => prev === confId ? null : confId);
    setSelectedTeam(null);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/sandbox/perform" className="flex items-center gap-2 text-white/40 hover:text-gold transition-colors">
            <ArrowLeft size={14} />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 border border-emerald-400/20">
            <GraduationCap size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-display text-white tracking-tight">Conference Directory</h1>
            <p className="text-[0.55rem] font-mono text-white/30 uppercase tracking-widest">
              {totalTeams} programs &middot; Power 4 + Group of 5
            </p>
          </div>
        </div>

        {/* Sport Switcher (placeholder for future) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5">
          <button className="px-3 py-1.5 rounded-lg text-[0.55rem] font-mono uppercase tracking-wider bg-gold/10 text-gold border border-gold/20">
            Football
          </button>
          <button disabled className="px-3 py-1.5 rounded-lg text-[0.55rem] font-mono uppercase tracking-wider text-white/15 cursor-not-allowed">
            Basketball
          </button>
          <button disabled className="px-3 py-1.5 rounded-lg text-[0.55rem] font-mono uppercase tracking-wider text-white/15 cursor-not-allowed">
            Baseball
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
        <input
          type="text"
          placeholder="Search schools, coaches, cities..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/30 transition-colors"
        />
      </div>

      {/* Search Results */}
      {searchQuery.length > 1 && (
        <div className="mb-6 wireframe-card rounded-2xl overflow-hidden">
          <div className="px-4 py-2 border-b border-white/[0.06] text-[0.5rem] font-mono uppercase tracking-widest text-white/25">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          </div>
          {searchResults.slice(0, 15).map(team => (
            <button
              key={team.id}
              onClick={() => { setSelectedTeam(team); setSearchQuery(''); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] last:border-0 text-left"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg border text-[0.5rem] font-display font-bold"
                style={{ backgroundColor: team.colors[0]?.hex + '20', borderColor: team.colors[0]?.hex + '40', color: team.colors[0]?.hex }}
              >
                {team.abbreviation.slice(0, 3)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">{team.commonName} {team.mascot}</p>
                <p className="text-[0.5rem] text-white/25 font-mono">{team.conference} &middot; {team.city}, {team.state}</p>
              </div>
              <ChevronRight size={12} className="text-white/15" />
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column: Conference Accordion */}
        <div className="lg:col-span-2 space-y-3">
          {/* Power 4 Accordion */}
          <AccordionTier
            tier="power4"
            conferences={power4}
            expandedTier={expandedTier}
            expandedConf={expandedConf}
            onToggleTier={toggleTier}
            onToggleConf={toggleConf}
            onSelectTeam={setSelectedTeam}
            selectedTeamId={selectedTeam?.id}
          />

          {/* Group of 5 Accordion */}
          <AccordionTier
            tier="group_of_5"
            conferences={group5}
            expandedTier={expandedTier}
            expandedConf={expandedConf}
            onToggleTier={toggleTier}
            onToggleConf={toggleConf}
            onSelectTeam={setSelectedTeam}
            selectedTeamId={selectedTeam?.id}
          />

          {/* Independents */}
          <div className="wireframe-card rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleTier('independent')}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[0.5rem] font-mono ${TIER_LABELS.independent.bg} ${TIER_LABELS.independent.color}`}>
                  {TIER_LABELS.independent.label}
                </span>
                <span className="text-sm text-white/50">{INDEPENDENTS.length} programs</span>
              </div>
              <ChevronDown size={14} className={`text-white/20 transition-transform ${expandedTier === 'independent' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {expandedTier === 'independent' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  {INDEPENDENTS.map(team => (
                    <TeamRow key={team.id} team={team} selected={selectedTeam?.id === team.id} onSelect={setSelectedTeam} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Team Detail */}
        <div className="lg:col-span-3">
          {selectedTeam ? (
            <TeamDetail team={selectedTeam} />
          ) : (
            <div className="wireframe-card rounded-2xl p-12 text-center">
              <GraduationCap size={40} className="text-white/10 mx-auto mb-4" />
              <h2 className="text-lg font-display text-white/30">Select a Program</h2>
              <p className="text-xs text-white/15 mt-2 max-w-xs mx-auto">
                Browse the Power 4 and Group of 5 conferences, or search for a school to view their profile, coaching staff, and contact info.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Accordion Tier
// ─────────────────────────────────────────────────────────────

function AccordionTier({
  tier, conferences, expandedTier, expandedConf, onToggleTier, onToggleConf, onSelectTeam, selectedTeamId,
}: {
  tier: ConferenceTier;
  conferences: Conference[];
  expandedTier: ConferenceTier | 'independent' | null;
  expandedConf: string | null;
  onToggleTier: (t: ConferenceTier | 'independent') => void;
  onToggleConf: (id: string) => void;
  onSelectTeam: (t: Team) => void;
  selectedTeamId?: string;
}) {
  const style = TIER_LABELS[tier];
  const isExpanded = expandedTier === tier;

  return (
    <div className="wireframe-card rounded-2xl overflow-hidden">
      {/* Tier Header */}
      <button
        onClick={() => onToggleTier(tier)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[0.5rem] font-mono ${style.bg} ${style.color}`}>
            {style.label}
          </span>
          <span className="text-sm text-white/50">{conferences.length} conferences</span>
        </div>
        <ChevronDown size={14} className={`text-white/20 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Conference List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            {conferences.sort((a, b) => a.abbreviation.localeCompare(b.abbreviation)).map(conf => (
              <div key={conf.id}>
                {/* Conference Row */}
                <button
                  onClick={() => onToggleConf(conf.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Shield size={12} className={style.color} />
                    <span className="text-xs font-medium text-white/60">{conf.abbreviation}</span>
                    <span className="text-[0.5rem] text-white/20 font-mono">{conf.teams.length} teams</span>
                  </div>
                  <ChevronDown size={12} className={`text-white/15 transition-transform ${expandedConf === conf.id ? 'rotate-180' : ''}`} />
                </button>

                {/* Teams */}
                <AnimatePresence>
                  {expandedConf === conf.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      {conf.teams.sort((a, b) => a.commonName.localeCompare(b.commonName)).map(team => (
                        <TeamRow key={team.id} team={team} selected={selectedTeamId === team.id} onSelect={onSelectTeam} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Team Row
// ─────────────────────────────────────────────────────────────

function TeamRow({ team, selected, onSelect }: { team: Team; selected: boolean; onSelect: (t: Team) => void }) {
  return (
    <button
      onClick={() => onSelect(team)}
      className={`w-full flex items-center gap-2 px-6 py-2 text-left transition-colors ${
        selected ? 'bg-gold/5 border-l-2 border-l-gold' : 'hover:bg-white/[0.02] border-l-2 border-l-transparent'
      }`}
    >
      <div
        className="flex h-6 w-6 items-center justify-center rounded text-[0.4rem] font-display font-bold"
        style={{ backgroundColor: team.colors[0]?.hex + '20', color: team.colors[0]?.hex }}
      >
        {team.abbreviation.slice(0, 3)}
      </div>
      <span className={`text-xs ${selected ? 'text-gold' : 'text-white/50'}`}>{team.commonName}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Team Detail Panel
// ─────────────────────────────────────────────────────────────

function TeamDetail({ team }: { team: Team }) {
  const primaryColor = team.colors[0]?.hex || '#D4AF37';

  return (
    <motion.div
      key={team.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="wireframe-card rounded-2xl overflow-hidden"
    >
      {/* Team Header */}
      <div
        className="px-6 py-6 border-b border-white/[0.06]"
        style={{ background: `linear-gradient(135deg, ${primaryColor}10 0%, transparent 60%)` }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-lg font-display font-bold"
            style={{ backgroundColor: primaryColor + '20', borderColor: primaryColor + '40', color: primaryColor }}
          >
            {team.abbreviation.slice(0, 4)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-display text-white">{team.commonName} {team.mascot}</h2>
            <p className="text-xs text-white/30 font-mono">{team.schoolName}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[0.5rem] font-mono text-white/25 flex items-center gap-1">
                <MapPin size={10} /> {team.city}, {team.state}
              </span>
              <span className="text-[0.5rem] font-mono text-white/25 flex items-center gap-1">
                <Shield size={10} /> {team.conference}
              </span>
              <span className="text-[0.5rem] font-mono text-white/25">
                Est. {team.founded}
              </span>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-2 mt-4">
          {team.colors.map(c => (
            <div key={c.hex} className="flex items-center gap-1">
              <div className="h-4 w-4 rounded-full border border-white/10" style={{ backgroundColor: c.hex }} />
              <span className="text-[0.45rem] font-mono text-white/20">{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div className="px-6 py-4 border-b border-white/[0.04]">
        <p className="text-xs text-white/40 leading-relaxed">{team.bio}</p>
      </div>

      {/* Stadium */}
      <div className="px-6 py-4 border-b border-white/[0.04]">
        <h3 className="text-[0.55rem] font-mono uppercase tracking-widest text-white/25 mb-2">Stadium</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building size={14} className="text-white/20" />
            <span className="text-sm text-white/60">{team.stadium}</span>
          </div>
          <span className="text-sm font-display text-white/40">{team.stadiumCapacity.toLocaleString()}</span>
        </div>
      </div>

      {/* Coaching Staff */}
      <div className="px-6 py-4 border-b border-white/[0.04]">
        <h3 className="text-[0.55rem] font-mono uppercase tracking-widest text-white/25 mb-3">Coaching Staff</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gold/5">
            <div className="flex items-center gap-2">
              <Star size={12} className="text-gold" />
              <span className="text-sm text-white/70 font-medium">Head Coach</span>
            </div>
            <div className="text-right">
              <span className="text-sm text-gold font-display">{team.headCoach}</span>
              <p className="text-[0.45rem] text-white/20 font-mono">Since {team.headCoachSince}</p>
            </div>
          </div>
          {team.coachingStaff.map((coach, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02]">
              <span className="text-xs text-white/30">{coach.role}</span>
              <span className="text-xs text-white/50">{coach.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Social Media & Contact */}
      <div className="px-6 py-4">
        <h3 className="text-[0.55rem] font-mono uppercase tracking-widest text-white/25 mb-3">Connect</h3>
        <div className="grid gap-2 grid-cols-2">
          {team.social.twitter && (
            <a
              href={`https://x.com/${team.social.twitter.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-blue-400/20 transition-colors text-xs text-white/40 hover:text-blue-400"
            >
              <Twitter size={14} />
              <span className="truncate">{team.social.twitter}</span>
              <ExternalLink size={10} className="text-white/10 ml-auto flex-shrink-0" />
            </a>
          )}
          {team.social.instagram && (
            <a
              href={`https://instagram.com/${team.social.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-pink-400/20 transition-colors text-xs text-white/40 hover:text-pink-400"
            >
              <Instagram size={14} />
              <span className="truncate">{team.social.instagram}</span>
              <ExternalLink size={10} className="text-white/10 ml-auto flex-shrink-0" />
            </a>
          )}
          {team.social.website && (
            <a
              href={team.social.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-emerald-400/20 transition-colors text-xs text-white/40 hover:text-emerald-400 col-span-2"
            >
              <Globe size={14} />
              <span className="truncate">Official Website</span>
              <ExternalLink size={10} className="text-white/10 ml-auto flex-shrink-0" />
            </a>
          )}
        </div>

        {/* Athlete CTA */}
        <div className="mt-4 p-4 rounded-xl border border-gold/10 bg-gold/[0.03]">
          <p className="text-xs text-gold font-medium mb-1">Student Athlete?</p>
          <p className="text-[0.6rem] text-white/30 leading-relaxed">
            Share your game film, social media presence, and academic profile directly with {team.commonName}'s recruiting staff through Per|Form. Build your NIL portfolio and connect with coaches.
          </p>
          <button className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/10 border border-gold/20 text-gold text-[0.6rem] font-mono uppercase tracking-wider hover:bg-gold/15 transition-colors">
            <Mail size={12} />
            Contact Recruiting
          </button>
        </div>
      </div>
    </motion.div>
  );
}
