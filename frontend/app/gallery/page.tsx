'use client';

/**
 * Character Gallery — Meet the A.I.M.S. Universe
 *
 * Full character roster: The Elder, SOLAYNJ, Aether Vos, ACHEEVY,
 * Boomer_Angs, Chicken Hawk, Lil_Hawks, and The Void.
 *
 * Plus the five Races of the Aether.
 *
 * Lives on plugmein.cloud — the lore & learn domain.
 */

import Image from 'next/image';
import { motion } from 'framer-motion';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/landing/Footer';
import { CHARACTERS, RACES } from '@/lib/content/lore';

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  gold: { border: 'border-gold/30', bg: 'bg-gold/5', text: 'text-gold', badge: 'bg-gold/10 text-gold border-gold/30' },
  cyan: { border: 'border-cyan-500/30', bg: 'bg-cyan-500/5', text: 'text-cyan-400', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  blue: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', text: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  amber: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  rose: { border: 'border-rose-500/30', bg: 'bg-rose-500/5', text: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  indigo: { border: 'border-indigo-500/30', bg: 'bg-indigo-500/5', text: 'text-indigo-400', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  purple: { border: 'border-purple-500/30', bg: 'bg-purple-500/5', text: 'text-purple-400', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  slate: { border: 'border-slate-500/30', bg: 'bg-slate-500/5', text: 'text-slate-400', badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
};

export default function GalleryPage() {
  return (
    <main className="flex flex-col min-h-full bg-ink text-white">
      <SiteHeader />

      {/* Hero */}
      <section className="relative py-16 md:py-24 text-center">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.05) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <div className="text-5xl mb-4">🖼</div>
          <h1
            className="text-4xl md:text-6xl font-bold mb-3 tracking-tight"
            style={{ fontFamily: 'var(--font-marker), "Permanent Marker", cursive' }}
          >
            Character Gallery
          </h1>
          <p className="text-sm text-white/40 max-w-lg mx-auto">
            The beings, forces, and entities that shape the V.I.B.E. universe.
            From The Void to the Executive Orchestrator.
          </p>
        </div>
      </section>

      {/* Character Cards */}
      <section className="max-w-6xl mx-auto px-4 pb-12 space-y-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <span
            className="text-xs tracking-[0.3em] uppercase text-gold/50"
            style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}
          >
            Characters
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        </div>

        {CHARACTERS.map((char, i) => {
          const colors = COLOR_MAP[char.color] || COLOR_MAP.gold;
          return (
            <motion.article
              key={char.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={`wireframe-card p-6 md:p-8 ${colors.border} hover:${colors.bg} transition-colors`}
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image */}
                <div className={`w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border ${colors.border} flex-shrink-0 mx-auto md:mx-0`}>
                  <Image
                    src={char.image}
                    alt={char.name}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h2 className="text-xl md:text-2xl font-bold text-white">{char.name}</h2>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${colors.badge}`}>
                      {char.title}
                    </span>
                  </div>
                  <p className={`text-xs ${colors.text} mb-1 font-mono uppercase tracking-wider`}>
                    {char.role}
                  </p>
                  <p className="text-[10px] text-white/25 mb-3 font-mono uppercase tracking-wider">
                    {char.race}
                  </p>
                  <p className="text-sm text-white/50 leading-relaxed mb-4">
                    {char.bio}
                  </p>

                  {/* Abilities */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {char.abilities.map((ability) => (
                      <span
                        key={ability}
                        className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-white/60 border border-wireframe-stroke"
                      >
                        {ability}
                      </span>
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className={`text-sm italic ${colors.text}/70 border-l-2 ${colors.border} pl-3`}>
                    &ldquo;{char.quote}&rdquo;
                  </blockquote>
                </div>
              </div>
            </motion.article>
          );
        })}
      </section>

      {/* Races of the Aether */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
          <span
            className="text-xs tracking-[0.3em] uppercase text-purple-400/50"
            style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}
          >
            Races of the Aether
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {RACES.map((race, i) => {
            const colors = COLOR_MAP[race.color] || COLOR_MAP.gold;
            return (
              <motion.div
                key={race.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`wireframe-card p-5 ${colors.border}`}
              >
                <h3 className={`text-base font-bold ${colors.text} mb-1`}>{race.name}</h3>
                <p className="text-[10px] text-white/25 font-mono uppercase tracking-wider mb-3">
                  {race.harmonic}
                </p>
                <p className="text-xs text-white/50 leading-relaxed mb-3">
                  {race.description}
                </p>
                <div className={`text-[10px] ${colors.text}/60 border-t border-wireframe-stroke pt-2 mt-auto`}>
                  <span className="text-white/25 uppercase tracking-wider">Trait:</span> {race.trait}
                </div>
                <div className="text-[10px] text-white/25 mt-1.5">
                  <span className="uppercase tracking-wider">Known:</span> {race.examples}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <Footer />
    </main>
  );
}
