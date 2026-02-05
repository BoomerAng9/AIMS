'use client';

import { useState, useEffect, useCallback } from 'react';
import { LucEstimate, getLucEstimateStub } from './luc.stub';

interface UseLucOptions {
  /** Message to estimate cost for */
  message: string;
  /** Whether to fetch immediately (default: true) */
  enabled?: boolean;
  /** Fall back to stub data on error (default: true) */
  fallbackToStub?: boolean;
}

interface UseLucReturn {
  estimate: LucEstimate | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useLuc({
  message,
  enabled = true,
  fallbackToStub = true,
}: UseLucOptions): UseLucReturn {
  const [estimate, setEstimate] = useState<LucEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !message) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const { fetchRealLucQuote } = await import('./luc-client');
        const data = await fetchRealLucQuote(message);
        if (!cancelled) {
          setEstimate(data);
        }
      } catch (err) {
        if (!cancelled) {
          const e = err instanceof Error ? err : new Error(String(err));
          setError(e);
          if (fallbackToStub) {
            setEstimate(getLucEstimateStub());
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [message, enabled, fallbackToStub, fetchKey]);

  return { estimate, loading, error, refetch };
}
