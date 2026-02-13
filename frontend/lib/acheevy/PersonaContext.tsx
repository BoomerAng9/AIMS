'use client';

/**
 * PersonaContext — Injects ACHEEVY persona adjectives into the React tree.
 *
 * Every prompt ACHEEVY sends to the LLM inherits the active vibe.
 * Circuit Box can toggle between SMOOTH (default) and CORPORATE.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { type PersonaMode, DEFAULT_PERSONA_MODE, VOICE_PRESETS } from './voiceConfig';

interface PersonaContextValue {
  mode: PersonaMode;
  setMode: (mode: PersonaMode) => void;
  adjectives: readonly string[];
  greeting: string;
  microCopy: { acknowledge: string; sending: string; error: string };
}

const ADJECTIVE_MAP: Record<PersonaMode, readonly string[]> = {
  SMOOTH: ['smooth', 'confident', 'playful', 'wry', 'laid-back'] as const,
  CORPORATE: ['professional', 'direct', 'efficient', 'authoritative'] as const,
};

const PersonaCtx = createContext<PersonaContextValue | null>(null);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<PersonaMode>(() => {
    if (typeof window === 'undefined') return DEFAULT_PERSONA_MODE;
    try {
      const stored = localStorage.getItem('aims_persona_mode');
      if (stored === 'CORPORATE' || stored === 'SMOOTH') return stored;
    } catch { /* ignore */ }
    return DEFAULT_PERSONA_MODE;
  });

  const setMode = useCallback((next: PersonaMode) => {
    setModeState(next);
    try { localStorage.setItem('aims_persona_mode', next); } catch { /* ignore */ }
  }, []);

  const preset = VOICE_PRESETS[mode];

  return (
    <PersonaCtx.Provider
      value={{
        mode,
        setMode,
        adjectives: ADJECTIVE_MAP[mode],
        greeting: preset.greeting,
        microCopy: preset.microCopy,
      }}
    >
      {children}
    </PersonaCtx.Provider>
  );
}

export function usePersona(): PersonaContextValue {
  const ctx = useContext(PersonaCtx);
  if (!ctx) {
    // Fallback when used outside provider — return SMOOTH defaults
    const preset = VOICE_PRESETS[DEFAULT_PERSONA_MODE];
    return {
      mode: DEFAULT_PERSONA_MODE,
      setMode: () => {},
      adjectives: ADJECTIVE_MAP[DEFAULT_PERSONA_MODE],
      greeting: preset.greeting,
      microCopy: preset.microCopy,
    };
  }
  return ctx;
}
