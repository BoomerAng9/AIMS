/**
 * Per|Form — Draft Prospect Enrichment Service
 *
 * Unified CFBD + Brave API pipeline for enriching NFL draft prospects
 * with real data. Used by Lil_Scout_Hawk stepper automation.
 *
 * Data Sources:
 *   - CFBD API (Primary): Structured historical data — stats, recruiting, draft history
 *   - Brave Search (Secondary): Real-time news, scouting reports, combine intel
 *   - Serper: DEPRECATED — do not use as primary
 *
 * This service replaces mock data with verified, production-ready data.
 */

import prisma from '@/lib/db/prisma';
import { getPlayerSeasonStats, getRecruitingPlayers, getDraftPicks } from './cfbd-client';
import type { SeedDraftProspect } from './seed-draft-data';

const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';
const BRAVE_BASE_URL = 'https://api.search.brave.com/res/v1/web/search';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface EnrichmentResult {
  prospectSlug: string;
  cfbdData: CFBDEnrichment | null;
  braveData: BraveEnrichment | null;
  sources: string[];
  enrichedAt: Date;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  errors: string[];
}

interface CFBDEnrichment {
  stats: Record<string, string | number> | null;
  recruitingRank: number | null;
  recruitingStars: number | null;
  recruitingRating: number | null;
  historicalDraftPicks: number;
}

interface BraveEnrichment {
  scoutingSnippets: string[];
  newsHeadlines: string[];
  sourceUrls: string[];
  combineNotes: string | null;
}

// ─────────────────────────────────────────────────────────────
// Brave Search (internal)
// ─────────────────────────────────────────────────────────────

interface BraveResult {
  title: string;
  url: string;
  description: string;
}

async function braveSearch(query: string, count = 5): Promise<BraveResult[]> {
  if (!BRAVE_API_KEY) return [];

  const params = new URLSearchParams({ q: query, count: String(count) });

  try {
    const res = await fetch(`${BRAVE_BASE_URL}?${params}`, {
      headers: {
        'X-Subscription-Token': BRAVE_API_KEY,
        Accept: 'application/json',
        'Accept-Encoding': 'gzip',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    return (data.web?.results ?? []).map((r: any) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    }));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// CFBD Enrichment
// ─────────────────────────────────────────────────────────────

async function enrichFromCFBD(
  firstName: string,
  lastName: string,
  college: string,
  position: string,
  year = 2025,
): Promise<CFBDEnrichment | null> {
  try {
    // Get player stats from CFBD
    const positionCategory = mapPositionToCategory(position);
    const stats = await getPlayerSeasonStats(year, undefined, undefined, positionCategory).catch(() => []);

    // Find this player's stats
    const playerStats = stats.find(
      (s: any) =>
        s.player?.toLowerCase().includes(lastName.toLowerCase()) &&
        s.team?.toLowerCase().includes(college.toLowerCase()),
    );

    // Get recruiting data
    const recruits = await getRecruitingPlayers(year - 3, undefined, undefined).catch(() => []);
    const recruitData = recruits.find(
      (r: any) =>
        r.name?.toLowerCase().includes(lastName.toLowerCase()),
    );

    // Get historical draft picks from this school
    const draftPicks = await getDraftPicks(year - 1).catch(() => []);
    const schoolPicks = draftPicks.filter(
      (p: any) => p.collegeTeam?.toLowerCase() === college.toLowerCase(),
    );

    return {
      stats: playerStats ? extractPlayerStats(playerStats, position) : null,
      recruitingRank: recruitData?.ranking ?? null,
      recruitingStars: recruitData?.stars ?? null,
      recruitingRating: recruitData?.rating ?? null,
      historicalDraftPicks: schoolPicks.length,
    };
  } catch (err) {
    console.error(`[DraftEnrichment] CFBD error for ${firstName} ${lastName}:`, err);
    return null;
  }
}

function mapPositionToCategory(position: string): string {
  const map: Record<string, string> = {
    QB: 'passing',
    RB: 'rushing',
    WR: 'receiving',
    TE: 'receiving',
    OT: 'passing', // OL stats come from passing context
    OG: 'passing',
    IOL: 'passing',
    'OT/OG': 'passing',
    EDGE: 'defensive',
    DT: 'defensive',
    DE: 'defensive',
    LB: 'defensive',
    CB: 'defensive',
    S: 'defensive',
    DB: 'defensive',
    'EDGE/LB': 'defensive',
  };
  return map[position] || 'defensive';
}

function extractPlayerStats(
  playerData: any,
  position: string,
): Record<string, string | number> {
  const stats: Record<string, string | number> = {};

  if (['QB'].includes(position)) {
    stats.passingYards = playerData.stat_1 || 0;
    stats.passingTDs = playerData.stat_2 || 0;
    stats.interceptions = playerData.stat_3 || 0;
  } else if (['RB'].includes(position)) {
    stats.rushingYards = playerData.stat_1 || 0;
    stats.rushingTDs = playerData.stat_2 || 0;
    stats.yardsPerCarry = playerData.stat_3 || 0;
  } else if (['WR', 'TE'].includes(position)) {
    stats.receptions = playerData.stat_1 || 0;
    stats.receivingYards = playerData.stat_2 || 0;
    stats.receivingTDs = playerData.stat_3 || 0;
  } else {
    stats.tackles = playerData.stat_1 || 0;
    stats.sacks = playerData.stat_2 || 0;
    stats.TFLs = playerData.stat_3 || 0;
  }

  return stats;
}

// ─────────────────────────────────────────────────────────────
// Brave Enrichment
// ─────────────────────────────────────────────────────────────

async function enrichFromBrave(
  firstName: string,
  lastName: string,
  college: string,
  position: string,
): Promise<BraveEnrichment | null> {
  try {
    const name = `${firstName} ${lastName}`;

    // Parallel searches for different aspects
    const [scoutResults, newsResults, combineResults] = await Promise.all([
      braveSearch(`${name} ${college} ${position} 2026 NFL Draft scouting report`, 5),
      braveSearch(`${name} ${college} NFL Draft news latest`, 3),
      braveSearch(`${name} NFL Combine 2026 measurements workout results`, 3),
    ]);

    const allUrls = new Set<string>();
    const scoutingSnippets: string[] = [];
    const newsHeadlines: string[] = [];

    for (const r of scoutResults) {
      allUrls.add(r.url);
      scoutingSnippets.push(`${r.title}: ${r.description}`);
    }

    for (const r of newsResults) {
      allUrls.add(r.url);
      newsHeadlines.push(r.title);
    }

    // Extract combine notes from search results
    let combineNotes: string | null = null;
    if (combineResults.length > 0) {
      combineNotes = combineResults
        .map((r) => r.description)
        .join(' | ')
        .substring(0, 500);
      for (const r of combineResults) allUrls.add(r.url);
    }

    return {
      scoutingSnippets,
      newsHeadlines,
      sourceUrls: Array.from(allUrls).slice(0, 15),
      combineNotes,
    };
  } catch (err) {
    console.error(`[DraftEnrichment] Brave error for ${firstName} ${lastName}:`, err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Unified Enrichment Pipeline
// ─────────────────────────────────────────────────────────────

/**
 * Enrich a single draft prospect using CFBD + Brave.
 * This is the core function used by Lil_Scout_Hawk stepper.
 */
export async function enrichDraftProspect(
  prospect: SeedDraftProspect,
): Promise<EnrichmentResult> {
  const slug = `${prospect.firstName}-${prospect.lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
  const errors: string[] = [];

  // Run CFBD and Brave enrichment in parallel
  const [cfbdData, braveData] = await Promise.all([
    enrichFromCFBD(
      prospect.firstName,
      prospect.lastName,
      prospect.college,
      prospect.position,
    ).catch((err) => {
      errors.push(`CFBD: ${err.message}`);
      return null;
    }),
    enrichFromBrave(
      prospect.firstName,
      prospect.lastName,
      prospect.college,
      prospect.position,
    ).catch((err) => {
      errors.push(`Brave: ${err.message}`);
      return null;
    }),
  ]);

  const sources: string[] = [];
  if (cfbdData) sources.push('CFBD');
  if (braveData) {
    sources.push('Brave Search');
    sources.push(...(braveData.sourceUrls || []));
  }

  const status: EnrichmentResult['status'] =
    cfbdData && braveData ? 'SUCCESS' : cfbdData || braveData ? 'PARTIAL' : 'FAILED';

  return {
    prospectSlug: slug,
    cfbdData,
    braveData,
    sources,
    enrichedAt: new Date(),
    status,
    errors,
  };
}

/**
 * Persist enrichment results to the DraftProspect database.
 */
export async function persistEnrichment(
  prospect: SeedDraftProspect,
  enrichment: EnrichmentResult,
): Promise<void> {
  const slug = enrichment.prospectSlug;

  const updateData: any = {
    enrichedBy: `Lil_Scout_Hawk (${enrichment.sources.filter((s) => !s.startsWith('http')).join('+')})`,
    lastEnriched: enrichment.enrichedAt,
    sourceUrls: JSON.stringify(enrichment.sources.filter((s) => s.startsWith('http')).slice(0, 10)),
  };

  // Merge CFBD stats if available
  if (enrichment.cfbdData?.stats) {
    updateData.collegeStats = JSON.stringify(enrichment.cfbdData.stats);
  }

  // Merge Brave scouting data if we don't already have a scout memo
  if (enrichment.braveData?.scoutingSnippets?.length && !prospect.scoutMemo) {
    updateData.scoutMemo = enrichment.braveData.scoutingSnippets.slice(0, 3).join(' ');
  }

  try {
    await prisma.draftProspect.update({
      where: { slug },
      data: updateData,
    });
  } catch {
    // Record may not exist yet — try upsert
    await prisma.draftProspect.upsert({
      where: { slug },
      create: {
        slug,
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        position: prospect.position,
        college: prospect.college,
        conference: prospect.conference,
        classYear: prospect.classYear,
        eligibility: prospect.eligibility,
        height: prospect.height,
        weight: prospect.weight,
        paiScore: prospect.paiScore,
        performScore: prospect.performScore,
        tier: prospect.tier,
        performance: prospect.performance,
        athleticism: prospect.athleticism,
        intangibles: prospect.intangibles,
        overallRank: prospect.overallRank,
        positionRank: prospect.positionRank,
        trend: prospect.trend,
        scoutMemo: prospect.scoutMemo,
        tags: prospect.tags,
        comparisons: prospect.comparisons,
        collegeStats: enrichment.cfbdData?.stats
          ? JSON.stringify(enrichment.cfbdData.stats)
          : prospect.collegeStats,
        combineInvite: prospect.combineInvite,
        seniorBowl: prospect.seniorBowl,
        projectedRound: prospect.projectedRound,
        projectedPick: prospect.projectedPick,
        projectedTeam: prospect.projectedTeam,
        bullCase: prospect.bullCase,
        bearCase: prospect.bearCase,
        mediationVerdict: prospect.mediationVerdict,
        debateWinner: prospect.debateWinner,
        sourceUrls: JSON.stringify(
          enrichment.sources.filter((s) => s.startsWith('http')).slice(0, 10),
        ),
        enrichedBy: updateData.enrichedBy,
        lastEnriched: enrichment.enrichedAt,
      },
      update: updateData,
    });
  }
}

/**
 * Batch enrich multiple draft prospects.
 * Respects CFBD rate limits (1,000 calls/month free tier).
 */
export async function batchEnrichDraftProspects(
  prospects: SeedDraftProspect[],
  options?: {
    delayMs?: number;
    onProgress?: (completed: number, total: number, current: string) => void;
  },
): Promise<EnrichmentResult[]> {
  const results: EnrichmentResult[] = [];
  const delay = options?.delayMs ?? 2000; // 2s between prospects for rate limiting

  for (let i = 0; i < prospects.length; i++) {
    const prospect = prospects[i];
    const name = `${prospect.firstName} ${prospect.lastName}`;

    options?.onProgress?.(i, prospects.length, name);

    const result = await enrichDraftProspect(prospect);
    results.push(result);

    // Persist each result immediately
    await persistEnrichment(prospect, result).catch((err) =>
      console.error(`[DraftEnrichment] Persist error for ${name}:`, err),
    );

    // Rate limit delay (skip for last item)
    if (i < prospects.length - 1 && delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return results;
}
