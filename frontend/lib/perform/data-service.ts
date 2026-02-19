/**
 * Per|Form Data Service
 *
 * Handles prospect data persistence, Brave Search enrichment,
 * and conference/team seeding from the canonical conferences.ts dataset.
 */

import prisma from '@/lib/db/prisma';
import { CONFERENCES } from './conferences';

const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';
const BRAVE_BASE_URL = 'https://api.search.brave.com/res/v1/web/search';

// ─────────────────────────────────────────────────────────────
// Brave Search Integration
// ─────────────────────────────────────────────────────────────

interface BraveResult {
  title: string;
  url: string;
  description: string;
}

async function braveSearch(query: string, count = 10): Promise<BraveResult[]> {
  if (!BRAVE_API_KEY) {
    console.warn('[PerformData] BRAVE_API_KEY not set — skipping search');
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    count: String(count),
  });

  try {
    const res = await fetch(`${BRAVE_BASE_URL}?${params}`, {
      headers: {
        'X-Subscription-Token': BRAVE_API_KEY,
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(`[PerformData] Brave search failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return (data.web?.results ?? []).map((r: any) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    }));
  } catch (err) {
    console.error('[PerformData] Brave search error:', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// Conference & Team Seeding
// ─────────────────────────────────────────────────────────────

export async function seedConferencesAndTeams(): Promise<{ conferences: number; teams: number }> {
  let confCount = 0;
  let teamCount = 0;

  for (const conf of CONFERENCES) {
    const dbConf = await prisma.performConference.upsert({
      where: { abbreviation: conf.abbreviation },
      create: {
        name: conf.name,
        abbreviation: conf.abbreviation,
        tier: conf.tier,
        commissioner: conf.commissioner,
        hqCity: conf.hqCity,
        hqState: conf.hqState,
        founded: conf.founded,
      },
      update: {
        name: conf.name,
        tier: conf.tier,
        commissioner: conf.commissioner,
      },
    });
    confCount++;

    for (const team of conf.teams) {
      await prisma.performTeam.upsert({
        where: { schoolName_state: { schoolName: team.schoolName, state: team.state } },
        create: {
          schoolName: team.schoolName,
          commonName: team.commonName,
          abbreviation: team.abbreviation,
          mascot: team.mascot,
          city: team.city,
          state: team.state,
          stadium: team.stadium,
          stadiumCapacity: team.stadiumCapacity,
          colors: JSON.stringify(team.colors),
          headCoach: team.headCoach,
          headCoachSince: team.headCoachSince,
          bio: team.bio,
          founded: team.founded,
          enrollment: team.enrollment,
          conferenceId: dbConf.id,
        },
        update: {
          commonName: team.commonName,
          mascot: team.mascot,
          headCoach: team.headCoach,
          headCoachSince: team.headCoachSince,
          stadium: team.stadium,
          stadiumCapacity: team.stadiumCapacity,
          colors: JSON.stringify(team.colors),
          conferenceId: dbConf.id,
        },
      });
      teamCount++;
    }
  }

  return { conferences: confCount, teams: teamCount };
}

// ─────────────────────────────────────────────────────────────
// Prospect CRUD
// ─────────────────────────────────────────────────────────────

function makeSlug(firstName: string, lastName: string): string {
  return `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
}

export async function upsertProspect(data: {
  firstName: string;
  lastName: string;
  position: string;
  classYear: string;
  school: string;
  state: string;
  pool?: string;
  height?: string;
  weight?: number;
  gpa?: number;
  paiScore?: number;
  tier?: string;
  performance?: number;
  athleticism?: number;
  intangibles?: number;
  nationalRank?: number;
  stateRank?: number;
  positionRank?: number;
  trend?: string;
  previousRank?: number;
  nilEstimate?: string;
  scoutMemo?: string;
  tags?: string[];
  comparisons?: string[];
  stats?: Record<string, string | number>;
  bullCase?: string;
  bearCase?: string;
  mediationVerdict?: string;
  debateWinner?: string;
  highlightsUrl?: string;
  stars?: number;
  sourceUrls?: string[];
  enrichedBy?: string;
}) {
  const slug = makeSlug(data.firstName, data.lastName);

  return prisma.performProspect.upsert({
    where: { slug },
    create: {
      slug,
      firstName: data.firstName,
      lastName: data.lastName,
      position: data.position,
      classYear: data.classYear,
      school: data.school,
      state: data.state,
      pool: data.pool || 'HIGH_SCHOOL',
      height: data.height,
      weight: data.weight,
      gpa: data.gpa,
      paiScore: data.paiScore || 0,
      tier: data.tier || 'DEVELOPMENTAL',
      performance: data.performance || 0,
      athleticism: data.athleticism || 0,
      intangibles: data.intangibles || 0,
      nationalRank: data.nationalRank || 9999,
      stateRank: data.stateRank || 9999,
      positionRank: data.positionRank || 9999,
      trend: data.trend || 'NEW',
      previousRank: data.previousRank,
      nilEstimate: data.nilEstimate,
      scoutMemo: data.scoutMemo,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      comparisons: data.comparisons ? JSON.stringify(data.comparisons) : null,
      stats: data.stats ? JSON.stringify(data.stats) : null,
      bullCase: data.bullCase,
      bearCase: data.bearCase,
      mediationVerdict: data.mediationVerdict,
      debateWinner: data.debateWinner,
      highlightsUrl: data.highlightsUrl,
      stars: data.stars,
      sourceUrls: data.sourceUrls ? JSON.stringify(data.sourceUrls) : null,
      enrichedBy: data.enrichedBy || 'manual',
      lastEnriched: new Date(),
    },
    update: {
      position: data.position,
      classYear: data.classYear,
      school: data.school,
      state: data.state,
      pool: data.pool,
      height: data.height,
      weight: data.weight,
      gpa: data.gpa,
      paiScore: data.paiScore,
      tier: data.tier,
      performance: data.performance,
      athleticism: data.athleticism,
      intangibles: data.intangibles,
      nationalRank: data.nationalRank,
      stateRank: data.stateRank,
      positionRank: data.positionRank,
      trend: data.trend,
      previousRank: data.previousRank,
      nilEstimate: data.nilEstimate,
      scoutMemo: data.scoutMemo,
      tags: data.tags ? JSON.stringify(data.tags) : undefined,
      comparisons: data.comparisons ? JSON.stringify(data.comparisons) : undefined,
      stats: data.stats ? JSON.stringify(data.stats) : undefined,
      bullCase: data.bullCase,
      bearCase: data.bearCase,
      mediationVerdict: data.mediationVerdict,
      debateWinner: data.debateWinner,
      highlightsUrl: data.highlightsUrl,
      stars: data.stars,
      sourceUrls: data.sourceUrls ? JSON.stringify(data.sourceUrls) : undefined,
      enrichedBy: data.enrichedBy,
      lastEnriched: new Date(),
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Brave Search Enrichment
// ─────────────────────────────────────────────────────────────

/**
 * Enrich a prospect using Brave Search.
 * Searches for their recruiting profile, stats, and highlights.
 */
export async function enrichProspectViaBrave(prospectId: string): Promise<{
  sources: string[];
  snippets: string[];
}> {
  const prospect = await prisma.performProspect.findUnique({ where: { id: prospectId } });
  if (!prospect) throw new Error(`Prospect ${prospectId} not found`);

  const name = `${prospect.firstName} ${prospect.lastName}`;
  const queries = [
    `${name} ${prospect.position} ${prospect.school} ${prospect.state} football recruiting ${prospect.classYear.replace("'", "20")}`,
    `${name} ${prospect.position} high school football stats highlights`,
    `${name} football recruit 247sports rivals on3 ranking`,
  ];

  const allResults: BraveResult[] = [];
  for (const q of queries) {
    const results = await braveSearch(q, 5);
    allResults.push(...results);
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = allResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  const sourceUrls = unique.map(r => r.url);
  const snippets = unique.map(r => `${r.title}: ${r.description}`);

  // Update prospect with source URLs
  await prisma.performProspect.update({
    where: { id: prospectId },
    data: {
      sourceUrls: JSON.stringify(sourceUrls.slice(0, 10)),
      lastEnriched: new Date(),
      enrichedBy: 'brave_search',
    },
  });

  return { sources: sourceUrls, snippets };
}

/**
 * Search for new prospects via Brave and return structured results.
 * Used for discovery — finding prospects not yet in the database.
 */
export async function discoverProspectsViaBrave(options: {
  position?: string;
  state?: string;
  classYear?: string;
  query?: string;
}): Promise<BraveResult[]> {
  const parts = ['football recruiting'];
  if (options.classYear) parts.push(`class of ${options.classYear.replace("'", "20")}`);
  if (options.position) parts.push(options.position);
  if (options.state) parts.push(options.state);
  if (options.query) parts.push(options.query);

  const query = parts.join(' ') + ' 247sports on3 rivals';
  return braveSearch(query, 10);
}

// ─────────────────────────────────────────────────────────────
// Query Helpers
// ─────────────────────────────────────────────────────────────

export async function getProspects(filters?: {
  pool?: string;
  classYear?: string;
  position?: string;
  state?: string;
  tier?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  if (filters?.pool) where.pool = filters.pool;
  if (filters?.classYear) where.classYear = filters.classYear;
  if (filters?.position) where.position = filters.position;
  if (filters?.state) where.state = filters.state;
  if (filters?.tier) where.tier = filters.tier;

  return prisma.performProspect.findMany({
    where,
    orderBy: { nationalRank: 'asc' },
    take: filters?.limit || 100,
    skip: filters?.offset || 0,
  });
}

export async function getProspectBySlug(slug: string) {
  return prisma.performProspect.findUnique({ where: { slug } });
}

export async function getProspectById(id: string) {
  return prisma.performProspect.findUnique({ where: { id } });
}

export async function getTeamsWithConference() {
  return prisma.performTeam.findMany({
    include: { conference: true },
    orderBy: [{ conference: { name: 'asc' } }, { schoolName: 'asc' }],
  });
}

export async function getConferencesWithTeams() {
  return prisma.performConference.findMany({
    include: { teams: { orderBy: { schoolName: 'asc' } } },
    orderBy: { name: 'asc' },
  });
}

export async function getStats() {
  const [prospectCount, teamCount, confCount] = await Promise.all([
    prisma.performProspect.count(),
    prisma.performTeam.count(),
    prisma.performConference.count(),
  ]);
  return { prospects: prospectCount, teams: teamCount, conferences: confCount };
}
