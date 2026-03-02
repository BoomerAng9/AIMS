'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BlockScoreCard } from '@/components/BlockScoreCard';
import { NeighborhoodGrid } from '@/components/NeighborhoodGrid';
import { VerdictCard } from '@/components/VerdictCard';
import { ExportMenu } from '@/components/ExportMenu';
import { NavBar } from '@/components/NavBar';
import type { NeighborhoodReport } from '@/lib/types';

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F]" />}>
      <AnalyzeContent />
    </Suspense>
  );
}

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const address = searchParams.get('address') ?? '';
  const lat = parseFloat(searchParams.get('lat') ?? '0');
  const lng = parseFloat(searchParams.get('lng') ?? '0');

  const [report, setReport] = useState<NeighborhoodReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  useEffect(() => {
    if (!address) return;

    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, lat, lng }),
        });
        if (!res.ok) throw new Error(`Analysis failed (${res.status})`);
        const data: NeighborhoodReport = await res.json();
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [address, lat, lng]);

  const handleGenerateAudio = useCallback(async () => {
    if (!report) return;
    setIsGeneratingAudio(true);
    try {
      await fetch('/api/notebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyAddress: address,
          sources: [
            { type: 'text', title: 'Block Score Report', content: JSON.stringify(report.blockScore) },
            { type: 'text', title: 'Neighborhood Data', content: report.verdictText },
          ],
          generateAudio: true,
        }),
      });
    } catch {
      // Silent fail — NotebookLM may not be configured
    } finally {
      setIsGeneratingAudio(false);
    }
  }, [report, address]);

  const exportData = report
    ? {
        Address: address,
        'Block Score': report.blockScore.overall,
        Verdict: report.verdict,
        'Schools Score': report.blockScore.schools,
        'Safety Score': report.blockScore.safety,
        'Appreciation Score': report.blockScore.appreciation,
        'Livability Score': report.blockScore.livability,
        'Development Score': report.blockScore.development,
        Population: report.demographics.population,
        'Median Income': `$${report.demographics.medianIncome.toLocaleString()}`,
        'Walk Score': report.walkability.walkScore,
      }
    : {};

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <NavBar>
        {address && (
          <p className="text-sm text-zinc-400 truncate max-w-md hidden lg:block">
            {address}
          </p>
        )}
        {report && (
          <>
            <button
              type="button"
              onClick={handleGenerateAudio}
              disabled={isGeneratingAudio}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-40"
            >
              {isGeneratingAudio ? 'Generating...' : 'Audio Briefing'}
            </button>
            <ExportMenu
              title={`Blockwise AI — ${address}`}
              data={exportData}
            />
          </>
        )}
      </NavBar>

      {/* ── Content ── */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* No address */}
        {!address && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-zinc-500 text-lg mb-4">
              No address provided. Search for a property first.
            </p>
            <Link
              href="/"
              className="px-6 py-3 rounded-lg bg-[#D4A843] text-black font-medium hover:bg-[#c49a3a] transition-colors"
            >
              Go to Search
            </Link>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-3 border-[#D4A843] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-400 text-sm">
              Running deep neighborhood analysis...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Report */}
        {report && (
          <>
            <BlockScoreCard
              blockScore={report.blockScore}
              verdict={report.verdict}
            />

            <VerdictCard
              verdict={report.verdict}
              verdictText={report.verdictText}
              address={address}
              lat={lat}
              lng={lng}
              price={report.property.price}
              arv={report.property.estimatedArv ?? undefined}
            />

            <NeighborhoodGrid
              schools={report.schools}
              safety={report.safety}
              demographics={report.demographics}
              appreciation={report.appreciation}
              walkability={report.walkability}
              development={report.development}
            />

            {/* Comps Table */}
            {report.comps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
              >
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">
                  Comparable Sales
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-zinc-500 border-b border-white/10">
                        <th className="pb-3 pr-4">Address</th>
                        <th className="pb-3 pr-4">Sale Price</th>
                        <th className="pb-3 pr-4">$/sqft</th>
                        <th className="pb-3 pr-4">Date</th>
                        <th className="pb-3 pr-4">Beds/Bath</th>
                        <th className="pb-3 pr-4">Delta</th>
                        <th className="pb-3">Distance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.comps.map((comp, i) => (
                        <tr
                          key={i}
                          className="border-b border-white/5 last:border-0"
                        >
                          <td className="py-3 pr-4 text-zinc-300 truncate max-w-[200px]">
                            {comp.address}
                          </td>
                          <td className="py-3 pr-4 text-white font-medium">
                            ${comp.salePrice.toLocaleString()}
                          </td>
                          <td className="py-3 pr-4 text-zinc-300">
                            ${comp.pricePerSqft.toFixed(0)}
                          </td>
                          <td className="py-3 pr-4 text-zinc-400">
                            {comp.saleDate}
                          </td>
                          <td className="py-3 pr-4 text-zinc-300">
                            {comp.bedrooms}/{comp.bathrooms}
                          </td>
                          <td
                            className="py-3 pr-4 font-medium"
                            style={{
                              color:
                                comp.deltaPercent >= 0 ? '#22c55e' : '#ef4444',
                            }}
                          >
                            {comp.deltaPercent >= 0 ? '+' : ''}
                            {comp.deltaPercent.toFixed(1)}%
                          </td>
                          <td className="py-3 text-zinc-400">
                            {comp.distanceMiles.toFixed(1)} mi
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
