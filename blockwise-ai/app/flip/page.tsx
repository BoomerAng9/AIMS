'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FlipCalculator } from '@/components/FlipCalculator';

export default function FlipPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F]" />}>
      <FlipContent />
    </Suspense>
  );
}

function FlipContent() {
  const searchParams = useSearchParams();
  const address = searchParams.get('address') ?? undefined;
  const price = searchParams.get('price')
    ? parseFloat(searchParams.get('price')!)
    : undefined;
  const arv = searchParams.get('arv')
    ? parseFloat(searchParams.get('arv')!)
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
            LUC Real Estate Calculator
          </h1>
        </div>
      </header>

      {/* ── Calculator ── */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <FlipCalculator
          initialAddress={address}
          initialPrice={price}
          initialArv={arv}
        />
      </main>
    </div>
  );
}
