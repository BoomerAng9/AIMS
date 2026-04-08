/**
 * useUserTier — Runtime subscription tier check
 *
 * Reads the user's current plan and exposes feature gates.
 * Persists tier in localStorage and refreshes from /api/stripe/subscription.
 *
 * 5-tier model: p2p | coffee | data_entry | pro | enterprise
 * The 3-6-9 commitment duration applies as a separate axis for token markup.
 *
 * Tier Feature Matrix:
 *   Feature          | P2P       | Coffee    | Data Entry | Pro        | Enterprise
 *   Chat             |     Y     |     Y     |     Y      |     Y      |     Y
 *   File Upload      |     Y     |     Y     |     Y      |     Y      |     Y
 *   Voice STT (mic)  |     N     |     Y     |     Y      |     Y      |     Y
 *   Auto-TTS         |     N     |     Y     |     Y      |     Y      |     Y
 *   Collab Feed      |   View    |   View    |    Full    |    Full    |    Full
 *   Code Sandbox     |     N     |     N     |     Y      |     Y      |     Y
 *   Max agents       |     0     |     5     |     15     |     50     |    100
 *   Concurrent       |     1     |     1     |      3     |     10     |     25
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

export type TierId = 'p2p' | 'coffee' | 'data_entry' | 'pro' | 'enterprise';

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
  name: 'Pay-per-Use',
  isPaid: false,
  monthlyPrice: 0,
  tokensIncluded: 0,
  tokensUsed: 0,
  agents: 0,
  concurrent: 1,
};

function buildGates(tier: UserTier): FeatureGates {
  const isPaid = tier.id !== 'p2p';
  const isDataEntryPlus = ['data_entry', 'pro', 'enterprise'].includes(tier.id);
  return {
    chat: true,                         // All tiers
    fileUpload: true,                   // All tiers
    voiceStt: isPaid,                   // Coffee+
    autoTts: isPaid,                    // Coffee+
    collabFeedFull: isDataEntryPlus,    // Data Entry+ = full, below = view-only
    codeSandbox: isDataEntryPlus,       // Data Entry+
    maxAgents: tier.agents,
    maxConcurrent: tier.concurrent,
  };
}

export function useUserTier(): UseUserTierReturn {
  const [tier, setTier] = useState<UserTier>(DEFAULT_TIER);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stripe/subscription');
      if (res.ok) {
        const data = await res.json();
        const newTier: UserTier = {
          id: data.tierId || 'p2p',
          name: data.tierName || 'Pay-per-Use',
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

  // Load from localStorage on mount, then fetch fresh
  useEffect(() => {
    try {
      const cached = localStorage.getItem(TIER_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as UserTier;
        setTier(parsed);
      }
    } catch {}
    refresh();
  }, [refresh]);

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
