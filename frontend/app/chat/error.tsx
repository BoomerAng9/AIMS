'use client';

import { useEffect } from 'react';
import { MessageSquareWarning, RotateCcw } from 'lucide-react';

/**
 * Chat Error Boundary — catches errors within /chat routes.
 * Contained to the chat interface so the rest of the app stays functional.
 */
export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Chat Error]', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-red-200 bg-red-50">
          <MessageSquareWarning className="h-6 w-6 text-red-500" strokeWidth={1.5} />
        </div>

        <h2 className="text-lg font-semibold text-slate-800">
          Chat Unavailable
        </h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          ACHEEVY encountered an error. Your conversation history is preserved.
        </p>

        <button
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Reconnect
        </button>
      </div>
    </div>
  );
}
