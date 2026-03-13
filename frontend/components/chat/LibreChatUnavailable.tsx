import Link from 'next/link';

interface LibreChatUnavailableProps {
  entryLabel: string;
}

export function LibreChatUnavailable({ entryLabel }: LibreChatUnavailableProps) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#0b0b0c] px-6 py-10 text-zinc-100">
      <div className="w-full max-w-2xl rounded-3xl border border-amber-500/20 bg-[#121214] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-4 inline-flex rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-amber-300">
          CHAT W/ ACHEEVY
        </div>
        <h1 className="text-3xl font-semibold text-white">Chat w/ ACHEEVY is not configured yet.</h1>
        <p className="mt-3 text-sm leading-7 text-zinc-300">
          {entryLabel} now hands off to the external chat runtime. Set the chat runtime variables in production,
          deploy the frontend, and this route will redirect automatically.
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
          <p>Required runtime configuration:</p>
          <p className="mt-2 font-mono text-xs text-amber-200">CHAT_INTERFACE_URL=https://chat.your-domain.com</p>
          <p className="mt-1 font-mono text-xs text-amber-200">CHAT_INTERFACE_BRIDGE_SECRET=generate-a-random-secret</p>
          <p className="mt-1 font-mono text-xs text-amber-200">OPENROUTER_API_KEY=your-openrouter-key</p>
          <p className="mt-1 font-mono text-xs text-amber-200">II_AGENT_BRIDGE_URL=http://ii-agent:8000/bridge</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:border-amber-400/30 hover:text-white"
          >
            Return Home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
