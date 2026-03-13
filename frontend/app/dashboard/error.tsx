'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, LayoutDashboard } from 'lucide-react';

/**
 * Dashboard Error Boundary — catches errors within /dashboard routes.
 * Contained to the dashboard shell so header/nav remain functional.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl border border-amber-200 bg-amber-50">
          <AlertTriangle className="h-7 w-7 text-amber-600" strokeWidth={1.5} />
        </div>

        <h2 className="text-lg font-semibold text-slate-800">
          Dashboard Error
        </h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
          Something went wrong loading this section. Your data is safe.
          {error.digest && (
            <span className="block mt-1 font-mono text-xs text-slate-400">
              Ref: {error.digest}
            </span>
          )}
        </p>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
