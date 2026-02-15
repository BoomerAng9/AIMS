/**
 * useUserTier — Runtime subscription tier check
 *
 * Reads the user's current 3-6-9 plan and exposes feature gates.
 * Persists tier in localStorage and refreshes from /api/stripe/subscription.
 *
 * Tier Feature Matrix:
 *   Feature          | P2P (Free) | Garage ($99) | Community ($89) | Enterprise ($67)
 *   Chat             |     ✓      |      ✓       |       ✓         |       ✓
 *   File Upload      |     ✓      |      ✓       |       ✓         |       ✓
 *   Voice STT (mic)  |     ✗      |      ✓       |       ✓         |       ✓
 *   Auto-TTS         |     ✗      |      ✓       |       ✓         |       ✓
 *   Collab Feed      |   View     |     Full     |      Full       |      Full
 *   Code Sandbox     |     ✗      |      ✓       |       ✓         |       ✓
 *   Max agents       |   Unlim.   |      3       |       10        |       50
 *   Concurrent       |     1      |      1       |        5        |       25
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

export type TierId = 'p2p' | 'garage' | 'community' | 'enterprise';

export interface UserTier {
  id: TierId;
  name: string;
  isPaid: boolean;
  monthlyPrice: number;
  tokensIncluded: number;
  tokensUsed: number;
  agents: number;
  concurrent: number;
}

export interface FeatureGates {
  chat: boolean;
  fileUpload: boolean;
  voiceStt: boolean;
  autoTts: boolean;
  collabFeedFull: boolean;
  codeSandbox: boolean;
  maxAgents: number;
  maxConcurrent: number;
}

interface UseUserTierReturn {
  tier: UserTier;
  gates: FeatureGates;
  isPaid: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Check if a specific feature is available. Shows upgrade prompt if not. */
  canUse: (feature: keyof FeatureGates) => boolean;
}

const TIER_STORAGE_KEY = 'aims_user_tier';

const DEFAULT_TIER: UserTier = {
  id: 'p2p',
  name: 'P2P (Free)',
  isPaid: false,
  monthlyPrice: 0,
  tokensIncluded: 0,
  tokensUsed: 0,
  agents: 0,
  concurrent: 1,
};

function buildGates(tier: UserTier): FeatureGates {
  const isPaid = tier.id !== 'p2p';
  return {
    chat: true,                   // All tiers
    fileUpload: true,             // All tiers
    voiceStt: isPaid,             // Paid only
    autoTts: isPaid,              // Paid only
    collabFeedFull: isPaid,       // Paid = full, free = view-only
    codeSandbox: isPaid,          // Paid only
    maxAgents: tier.agents,
    maxConcurrent: tier.concurrent,
  };
}

export function useUserTier(): UseUserTierReturn {
  const [tier, setTier] = useState<UserTier>(DEFAULT_TIER);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(TIER_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as UserTier;
        setTier(parsed);
      }
    } catch {}
    // Fetch fresh from API
    refresh();
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stripe/subscription');
      if (res.ok) {
        const data = await res.json();
        const newTier: UserTier = {
          id: data.tierId || 'p2p',
          name: data.tierName || 'P2P (Free)',
          isPaid: data.tierId !== 'p2p',
          monthlyPrice: data.monthlyPrice || 0,
          tokensIncluded: data.tokensIncluded || 0,
          tokensUsed: data.tokensUsed || 0,
          agents: data.agents || 0,
          concurrent: data.concurrent || 1,
        };
        setTier(newTier);
        try {
          localStorage.setItem(TIER_STORAGE_KEY, JSON.stringify(newTier));
        } catch {}
      } else if (res.status === 401) {
        // Not authenticated — default to P2P
        setTier(DEFAULT_TIER);
      } else {
        // API error — keep cached tier
        setError('Could not verify subscription');
      }
    } catch {
      // Network error — keep cached tier, don't block UX
      setError('Network error checking subscription');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const gates = useMemo(() => buildGates(tier), [tier]);

  const canUse = useCallback((feature: keyof FeatureGates): boolean => {
    const value = gates[feature];
    return typeof value === 'boolean' ? value : true;
  }, [gates]);

  return {
    tier,
    gates,
    isPaid: tier.isPaid,
    isLoading,
    error,
    refresh,
    canUse,
  };
}
