// Blockwise AI — Firecrawl Scraping Client (Tier 3 Data Pipeline)

import { meterLucUsage } from './aims-api';

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY || '';
const FIRECRAWL_URL = 'https://api.firecrawl.dev/v1';

async function scrapeUrl(url: string, prompt?: string): Promise<string> {
  const res = await fetch(`${FIRECRAWL_URL}/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FIRECRAWL_KEY}`,
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      ...(prompt ? { extract: { prompt } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Firecrawl scrape failed: ${res.status}`);
  const data = await res.json();

  // Meter via LUC
  await meterLucUsage('API_CALLS', 1, { provider: 'firecrawl', url }).catch(() => {});

  return data.data?.markdown || '';
}

export async function scrapeGreatSchools(zip: string) {
  return scrapeUrl(
    `https://www.greatschools.org/search/search.page?zip=${zip}`,
    'Extract school names, ratings (1-10), grade levels, and addresses'
  );
}

export async function scrapeCrimeData(lat: number, lng: number) {
  return scrapeUrl(
    `https://www.crimemapping.com/map/location/${lat},${lng}`,
    'Extract crime incidents, types, counts, and date range'
  );
}

export async function scrapeWalkScore(address: string) {
  const slug = address.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
  return scrapeUrl(
    `https://www.walkscore.com/score/${slug}`,
    'Extract walk score, transit score, bike score'
  );
}

export async function scrapeCensusData(zip: string) {
  return scrapeUrl(
    `https://data.census.gov/profile?q=${zip}`,
    'Extract population, median income, median age, owner-occupancy rate'
  );
}

export { scrapeUrl };
