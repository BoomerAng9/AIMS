'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { K1Form } from '@/components/K1Form';
import { NavBar } from '@/components/NavBar';

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
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <K1Form initialAddress={address} initialPrice={price} />
      </main>
    </div>
  );
}
