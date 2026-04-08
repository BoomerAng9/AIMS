/**
 * A.I.M.S. — API Retry Utility
 *
 * Exponential backoff with jitter for resilient API calls.
 * Use for all non-streaming fetch calls to backend services.
 */

interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in ms (default: 500) */
  baseDelay?: number;
  /** Maximum delay cap in ms (default: 10000) */
  maxDelay?: number;
  /** HTTP status codes that should trigger a retry (default: 502, 503, 504, 408, 429) */
  retryStatuses?: number[];
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

const DEFAULT_RETRY_STATUSES = [408, 429, 502, 503, 504];

/**
 * Fetch with exponential backoff retry.
 * Retries on network errors and configurable HTTP status codes.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  opts?: RetryOptions,
): Promise<Response> {
  const maxRetries = opts?.maxRetries ?? 3;
  const baseDelay = opts?.baseDelay ?? 500;
  const maxDelay = opts?.maxDelay ?? 10_000;
  const retryStatuses = opts?.retryStatuses ?? DEFAULT_RETRY_STATUSES;

  let lastError: Error | undefined;
  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const mergedInit = opts?.signal ? { ...init, signal: opts.signal } : init;
      const response = await fetch(input, mergedInit);

      // Success or non-retryable status — return immediately
      if (response.ok || !retryStatuses.includes(response.status)) {
        return response;
      }

      lastResponse = response;

      // If rate limited, respect Retry-After header
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter && attempt < maxRetries) {
          const waitMs = Number(retryAfter) * 1000;
          if (!isNaN(waitMs) && waitMs > 0 && waitMs <= maxDelay) {
            await sleep(waitMs);
            continue;
          }
        }
      }
    } catch (err) {
      // Network error or abort
      if (opts?.signal?.aborted) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
    }

    // Don't wait after the last attempt
    if (attempt < maxRetries) {
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = delay * (0.5 + Math.random() * 0.5);
      await sleep(jitter);
    }
  }

  // All retries exhausted — return last response or throw
  if (lastResponse) return lastResponse;
  throw lastError || new Error('Fetch failed after retries');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
