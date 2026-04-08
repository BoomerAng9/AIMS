'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FlipCalculator } from '@/components/FlipCalculator';
import { NavBar } from '@/components/NavBar';

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
      <NavBar />
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
