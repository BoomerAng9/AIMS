/**
 * useLuc — React hook for LUC quota tracking.
 * Fetches the user's current quota status from the UEF Gateway
 * and provides helper methods for the dashboard.
 */

import { useState, useEffect, useCallback } from 'react';

interface QuotaEntry {
  used: number;
  limit: number;
  pct: number;
}

interface LucStatus {
  userId: string;
  tier: string;
  billingCycleStart: string;
  billingCycleEnd: string;
  quotas: Record<string, QuotaEntry>;
  canExecute: boolean;
  blockingQuotas: string[];
}

interface UseLucReturn {
  status: LucStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const QUOTA_LABELS: Record<string, string> = {
  api_calls: 'API Calls',
  brave_searches: 'Brave Searches',
  container_hours: 'Container Hours',
  storage_gb: 'Storage (GB)',
  elevenlabs_chars: 'ElevenLabs Characters',
  n8n_executions: 'N8N Executions',
};

export { QUOTA_LABELS };

export function useLuc(userId: string): UseLucReturn {
  const [status, setStatus] = useState<LucStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/luc/status?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`LUC status fetch failed: ${res.statusText}`);
      const data = await res.json();

      setStatus({
        userId: data.userId,
        tier: data.tier,
        billingCycleStart: data.billing_cycle_start,
        billingCycleEnd: data.billing_cycle_end,
        quotas: data.usage_summary || {},
        canExecute: data.can_execute ?? true,
        blockingQuotas: data.blocking_quotas || [],
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, error, refresh };
}
