'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { K1Form } from '@/components/K1Form';

export default function K1Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F]" />}>
      <K1Content />
    </Suspense>
  );
}

function K1Content() {
  const searchParams = useSearchParams();
  const address = searchParams.get('address') ?? undefined;
  const price = searchParams.get('price')
    ? parseFloat(searchParams.get('price')!)
    : undefined;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-zinc-400 hover:text-white transition-colors text-sm"
          >
            &larr; Back
          </Link>
          <h1 className="text-xl font-bold text-[#D4A843]">
            K1 Tax Generator
          </h1>
        </div>
      </header>

      {/* ── K1 Form ── */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <K1Form initialAddress={address} initialPrice={price} />
      </main>
    </div>
  );
}
