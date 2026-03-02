// Blockwise AI — Brave Search API Client (Tier 2 Data Pipeline)

import { meterLucUsage } from './aims-api';

const BRAVE_KEY = process.env.BRAVE_API_KEY || '';

interface BraveResult {
  title: string;
  url: string;
  description: string;
  snippet?: string;
}

async function searchBrave(query: string): Promise<BraveResult[]> {
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`,
    { headers: { 'X-Subscription-Token': BRAVE_KEY, Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error(`Brave search failed: ${res.status}`);
  const data = await res.json();

  // Meter via LUC
  await meterLucUsage('BRAVE_QUERIES', 1, { query }).catch(() => {});

  return (data.web?.results || []).map((r: Record<string, unknown>) => ({
    title: r.title as string,
    url: r.url as string,
    description: r.description as string,
    snippet: (r.extra_snippets as string[] | undefined)?.[0],
  }));
}

export async function searchPropertyRecords(address: string) {
  return searchBrave(`${address} property records tax deed`);
}

export async function searchCrimeStats(neighborhood: string, zip: string) {
  return searchBrave(`${neighborhood} ${zip} crime statistics safety`);
}

export async function searchBuildingPermits(zip: string) {
  return searchBrave(`${zip} building permits 2025 2026`);
}

export async function searchComps(address: string) {
  return searchBrave(`${address} recent sales comparable properties`);
}

export async function searchGentrification(neighborhood: string) {
  return searchBrave(`${neighborhood} gentrification development trend`);
}

export { searchBrave };
