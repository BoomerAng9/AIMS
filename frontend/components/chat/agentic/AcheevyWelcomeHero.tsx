'use client';

/**
 * AcheevyWelcomeHero — Welcome screen for the ACHEEVY chat interface
 *
 * Shown when no messages exist. Features:
 * - ACHEEVY helmet hero image with gold glow
 * - Persona selector pills using agentic-ui Badge
 * - "chat w/ ACHEEVY" gold gradient title in glass card
 * - Welcome message text
 * - Onboarding gate banner integration
 *
 * Extracted from ChatInterface.tsx for modularity and reuse.
 */

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Badge } from 'agentic-ui';
import { spring, transition } from '@/lib/motion/tokens';
import { OnboardingGateBanner } from '@/components/chat/OnboardingGateBanner';
import type { AchievyPersona } from '@/lib/acheevy/persona';

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

export interface AcheevyWelcomeHeroProps {
  welcomeMessage?: string;
  personas: AchievyPersona[];
  selectedPersona: string;
  onPersonaChange: (personaId: string) => void;
  showOnboardingBanner?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function AcheevyWelcomeHero({
  welcomeMessage,
  personas,
  selectedPersona,
  onPersonaChange,
  showOnboardingBanner = true,
}: AcheevyWelcomeHeroProps) {
  return (
    <>
      {/* Onboarding Gate Banner */}
      {showOnboardingBanner && <OnboardingGateBanner />}

      {/* Welcome Hero */}
      {welcomeMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition.normal}
          className="text-center py-12"
        >
          {/* ACHEEVY Helmet Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={spring.gentle}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gold/10 border border-gold/20 overflow-hidden shadow-[0_0_24px_rgba(217,119,6,0.15)]"
          >
            <Image
              src="/images/acheevy/acheevy-helmet.png"
              alt="ACHEEVY"
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Persona Selector Pill Group — only when multiple */}
          {personas.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition.normal, delay: 0.1 }}
              className="flex justify-center mb-4"
            >
              <div className="flex items-center gap-2 bg-surface rounded-full px-1 py-1 border border-wireframe-stroke">
                {personas.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onPersonaChange(p.id)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium transition-all
                      ${selectedPersona === p.id
                        ? 'bg-gold text-black shadow-lg shadow-gold/20'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                      }
                    `}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Title Glass Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring.gentle, delay: 0.15 }}
            className="flex justify-center mb-6"
          >
            <div className="glass-card px-6 py-2 rounded-full border border-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <h2 className="text-sm font-doto tracking-[0.3em] text-gold-gradient uppercase glitch-text-hover">
                chat w/ A C H E E V Y
              </h2>
            </div>
          </motion.div>

          {/* Welcome Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...transition.slow, delay: 0.25 }}
            className="text-zinc-400 max-w-md mx-auto"
          >
            {welcomeMessage}
          </motion.p>
        </motion.div>
      )}
    </>
  );
}
