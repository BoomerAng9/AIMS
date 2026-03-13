'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

/**
 * Root Error Boundary — catches unhandled errors across the entire app.
 * Next.js automatically uses this file as the error boundary for the root layout.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to observability in production (replace with real reporter)
    console.error('[A.I.M.S. Error Boundary]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-red-200 bg-red-50">
          <AlertTriangle className="h-9 w-9 text-red-500" strokeWidth={1.5} />
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
          Something went wrong
        </h2>

        {/* Description */}
        <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
          An unexpected error occurred. You can try again or return to the home page.
          {error.digest && (
            <span className="block mt-1 font-mono text-xs text-slate-400">
              Error ID: {error.digest}
            </span>
          )}
        </p>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-amber-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
