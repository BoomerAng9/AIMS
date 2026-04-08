/**
 * useLucBalance — Lightweight hook for sidebar LUC balance display.
 * Fetches current balance and tier from /api/luc/usage once on mount.
 *
 * For full quota tracking with per-category breakdowns, use useLuc from hooks/useLuc.ts.
 * For cost estimation before actions, use useLuc from lib/luc/use-luc.ts.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface LucBalanceData {
  balance: string;
  tier: string;
  loading: boolean;
}

interface UseLucBalanceOptions {
  /** Whether to fetch on mount (default: true) */
  enabled?: boolean;
}

export function useLucBalance(options: UseLucBalanceOptions = {}): LucBalanceData & { refresh: () => Promise<void> } {
  const { enabled = true } = options;
  const [balance, setBalance] = useState<string>('...');
  const [tier, setTier] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/luc/usage');
      if (!res.ok) throw new Error('Failed to fetch LUC balance');
      const data = await res.json();
      setBalance(data.balance ?? '$0.00');
      setTier(data.name ?? 'Explorer');
    } catch {
      setBalance('$0.00');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    fetch('/api/luc/usage')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (mounted) {
          setBalance(data.balance ?? '$0.00');
          setTier(data.name ?? 'Explorer');
        }
      })
      .catch(() => {
        if (mounted) setBalance('$0.00');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [enabled]);

  return { balance, tier, loading, refresh };
}
