'use client';

/**
 * AcheevyWelcomeHero — Welcome screen for the ACHEEVY chat interface
 *
 * Shown when no messages exist. Features:
 * - ACHEEVY helmet hero image with gold glow
 * - Context Pack selector pills
 * - "CHAT W/ ACHEEVY" label in the welcome card
 * - Welcome message text
 * - Onboarding gate banner integration
 *
 * Extracted from ChatInterface.tsx for modularity and reuse.
 */

import { motion } from 'framer-motion';
import Image from 'next/image';
import { spring, transition } from '@/lib/motion/tokens';
import { OnboardingGateBanner } from '@/components/chat/OnboardingGateBanner';
import type { ContextPackOption } from '@/lib/context-packs/contracts';

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

export interface AcheevyWelcomeHeroProps {
  welcomeMessage?: string;
  contextPacks: ContextPackOption[];
  selectedContextPackId: string;
  onContextPackChange: (contextPackId: string) => void;
  showOnboardingBanner?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function AcheevyWelcomeHero({
  welcomeMessage,
  contextPacks,
  selectedContextPackId,
  onContextPackChange,
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
          className="py-8 text-center md:py-12"
        >
          <div className="aims-agentic-panel mx-auto max-w-3xl overflow-hidden rounded-[32px] px-6 py-8 md:px-10 md:py-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring.gentle}
              className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-[22px] border border-gold/20 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_65%),linear-gradient(180deg,rgba(24,24,27,0.95),rgba(17,17,19,0.95))] p-1 shadow-[0_0_40px_rgba(212,175,55,0.14)]"
            >
              <Image
                src="/images/acheevy/acheevy-helmet.png"
                alt="ACHEEVY"
                width={64}
                height={64}
                className="h-16 w-16 rounded-[18px] object-cover"
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition.normal, delay: 0.05 }}
              className="aims-agentic-kicker mb-4"
            >
              CHAT W/ ACHEEVY
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring.gentle, delay: 0.12 }}
              className="aims-agentic-title mx-auto mb-4 max-w-2xl text-4xl leading-none md:text-5xl"
            >
              {welcomeMessage}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...transition.slow, delay: 0.2 }}
              className="aims-agentic-copy mx-auto mb-8 max-w-xl text-sm leading-6 md:text-base"
            >
              Choose a Context Pack, shape the prompt, and let ACHEEVY orchestrate the next move.
            </motion.p>

            {contextPacks.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...transition.normal, delay: 0.1 }}
                className="flex justify-center"
              >
                <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-black/20 px-2 py-2 backdrop-blur-xl">
                  {contextPacks.map((contextPack) => (
                    <button
                      key={contextPack.id}
                      onClick={() => onContextPackChange(contextPack.id)}
                      className={`rounded-full px-4 py-2 text-[11px] transition-all font-label ${selectedContextPackId === contextPack.id
                        ? 'bg-gold text-black shadow-lg shadow-gold/20'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                      }`}
                    >
                      {contextPack.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}
