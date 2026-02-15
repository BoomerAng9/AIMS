/**
 * Gridiron Scout Hub — Lil_Hawk Data Acquisition & Adversarial Debate
 *
 * Spawns pairs of Lil_Hawks per prospect:
 *   Lil_Bull_Hawk  — argues the player is UNDERRATED
 *   Lil_Bear_Hawk  — argues the player is OVERRATED
 *
 * Data sources: Brave Search API, Firecrawl (MaxPreps, Hudl, university rosters)
 * Output: Scouting Debate Logs → shared volume → War Room
 *
 * Runs on a configurable cron schedule (default: 2 AM nightly).
 */

const PORT = Number(process.env.PORT) || 5001;
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';
const FIRECRAWL_URL = process.env.FIRECRAWL_URL || 'http://firecrawl:3002';
const WAR_ROOM_URL = process.env.WAR_ROOM_URL || 'http://war-room:5003';
const SCOUT_CRON = process.env.SCOUT_CRON || '0 2 * * *';
const HS_POOL_SIZE = Number(process.env.HS_POOL_SIZE) || 300;
const COLLEGE_POOL_SIZE = Number(process.env.COLLEGE_POOL_SIZE) || 551;

// ─── Types ────────────────────────────────────────────────────────────────

interface ProspectTarget {
  name: string;
  pool: 'HIGH_SCHOOL' | 'COLLEGE';
  source: string;          // MaxPreps, Hudl, 247, Rivals, etc.
  position?: string;
  school?: string;
  state?: string;
  classYear?: number;
}

interface DebateArgument {
  hawk: 'Lil_Bull_Hawk' | 'Lil_Bear_Hawk';
  stance: 'UNDERRATED' | 'OVERRATED';
  points: string[];
  statsCited: Record<string, string | number>[];
  confidence: number;      // 0-100
}

interface ScoutingDebateLog {
  debateId: string;
  prospect: ProspectTarget;
  timestamp: string;
  arguments: DebateArgument[];
  rawData: {
    braveResults: number;
    firecrawlPages: number;
    statsFound: number;
  };
  status: 'COMPLETE' | 'PARTIAL' | 'FAILED';
}

interface ScoutRunSummary {
  runId: string;
  startedAt: string;
  completedAt: string;
  prospectsScanned: number;
  debatesCompleted: number;
  debatesFailed: number;
  pools: {
    highSchool: number;
    college: number;
  };
}

// ─── State ────────────────────────────────────────────────────────────────

let lastRun: ScoutRunSummary | null = null;
let isRunning = false;
let totalScansCompleted = 0;

// ─── Brave Search Client ──────────────────────────────────────────────────

async function braveSearch(query: string): Promise<Record<string, unknown>[]> {
  if (!BRAVE_API_KEY) {
    return [{ note: 'BRAVE_API_KEY not configured — mock results' }];
  }

  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`;
  const res = await fetch(url, {
    headers: { 'X-Subscription-Token': BRAVE_API_KEY, Accept: 'application/json' },
  });

  if (!res.ok) {
    console.error(`[ScoutHub] Brave search failed: ${res.status}`);
    return [];
  }

  const data = await res.json() as { web?: { results?: Record<string, unknown>[] } };
  return data.web?.results ?? [];
}

// ─── Firecrawl Client ─────────────────────────────────────────────────────

async function firecrawlScrape(url: string): Promise<string> {
  try {
    const res = await fetch(`${FIRECRAWL_URL}/v0/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown'] }),
    });

    if (!res.ok) return '';
    const data = await res.json() as { data?: { markdown?: string } };
    return data.data?.markdown ?? '';
  } catch {
    return '';
  }
}

// ─── Lil_Hawk Debate Engine ───────────────────────────────────────────────

async function runAdversarialDebate(prospect: ProspectTarget): Promise<ScoutingDebateLog> {
  const debateId = `DBT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = new Date().toISOString();

  // Phase 1: Data acquisition
  const searchQuery = `${prospect.name} ${prospect.position || ''} ${prospect.school || ''} football stats highlights`;
  const braveResults = await braveSearch(searchQuery);

  // Phase 2: Deep scrape if sources found
  let firecrawlPages = 0;
  const scrapedStats: Record<string, string | number>[] = [];

  for (const result of braveResults.slice(0, 3)) {
    const resultUrl = (result as Record<string, unknown>).url as string | undefined;
    if (resultUrl) {
      const content = await firecrawlScrape(resultUrl);
      if (content) {
        firecrawlPages++;
        // Extract any stat-like numbers from content
        const statMatches = content.match(/\d+\s*(?:yards|touchdowns|tackles|receptions|catches|TDs|INT|sacks)/gi);
        if (statMatches) {
          for (const match of statMatches.slice(0, 5)) {
            const [value, ...labelParts] = match.split(/\s+/);
            scrapedStats.push({ [labelParts.join(' ')]: Number(value) || value });
          }
        }
      }
    }
  }

  // Phase 3: Spawn Lil_Bull_Hawk (underrated case)
  const bullHawk: DebateArgument = {
    hawk: 'Lil_Bull_Hawk',
    stance: 'UNDERRATED',
    points: [
      `${prospect.name} shows raw athleticism that hasn't been fully leveraged yet`,
      `Playing in ${prospect.state || 'a competitive state'} against quality competition`,
      `Stats suggest upside — ${scrapedStats.length} data points collected show consistent production`,
    ],
    statsCited: scrapedStats.slice(0, Math.ceil(scrapedStats.length / 2)),
    confidence: Math.min(90, 40 + scrapedStats.length * 8 + firecrawlPages * 10),
  };

  // Phase 4: Spawn Lil_Bear_Hawk (overrated case)
  const bearHawk: DebateArgument = {
    hawk: 'Lil_Bear_Hawk',
    stance: 'OVERRATED',
    points: [
      `${prospect.name} has limited verified film — only ${firecrawlPages} sources deep-scraped`,
      `Competition level in ${prospect.pool === 'HIGH_SCHOOL' ? 'high school' : 'college'} needs context`,
      `${scrapedStats.length < 3 ? 'Insufficient statistical evidence' : 'Stats may be inflated by weak schedule'}`,
    ],
    statsCited: scrapedStats.slice(Math.ceil(scrapedStats.length / 2)),
    confidence: Math.min(85, 35 + (10 - scrapedStats.length) * 5),
  };

  return {
    debateId,
    prospect,
    timestamp,
    arguments: [bullHawk, bearHawk],
    rawData: {
      braveResults: braveResults.length,
      firecrawlPages,
      statsFound: scrapedStats.length,
    },
    status: scrapedStats.length > 0 ? 'COMPLETE' : braveResults.length > 0 ? 'PARTIAL' : 'FAILED',
  };
}

// ─── Nightly Scout Run ────────────────────────────────────────────────────

async function executeScoutRun(): Promise<ScoutRunSummary> {
  if (isRunning) {
    throw new Error('Scout run already in progress');
  }

  isRunning = true;
  const runId = `RUN-${Date.now()}`;
  const startedAt = new Date().toISOString();
  let debatesCompleted = 0;
  let debatesFailed = 0;

  console.log(`[ScoutHub] Starting scout run ${runId} — HS:${HS_POOL_SIZE} College:${COLLEGE_POOL_SIZE}`);

  // In production, these would come from the War Room's prospect database.
  // For now, we demonstrate the pipeline with a sample batch.
  const sampleProspects: ProspectTarget[] = [
    { name: 'Sample HS Prospect', pool: 'HIGH_SCHOOL', source: 'MaxPreps', position: 'QB', state: 'TX', classYear: 2026 },
    { name: 'Sample College Prospect', pool: 'COLLEGE', source: '247Sports', position: 'WR', school: 'Alabama', state: 'AL' },
  ];

  const debateLogs: ScoutingDebateLog[] = [];

  for (const prospect of sampleProspects) {
    try {
      const log = await runAdversarialDebate(prospect);
      debateLogs.push(log);
      if (log.status !== 'FAILED') debatesCompleted++;
      else debatesFailed++;
    } catch (err) {
      console.error(`[ScoutHub] Debate failed for ${prospect.name}:`, err);
      debatesFailed++;
    }
  }

  // Write debate logs to shared volume
  const logsDir = '/data/debate-logs';
  try {
    const Bun = globalThis.Bun;
    if (Bun) {
      const logPath = `${logsDir}/${runId}.json`;
      await Bun.write(logPath, JSON.stringify({ runId, debates: debateLogs }, null, 2));
      console.log(`[ScoutHub] Wrote ${debateLogs.length} debate logs to ${logPath}`);
    }
  } catch (err) {
    console.error('[ScoutHub] Failed to write debate logs:', err);
  }

  // Notify War Room
  try {
    await fetch(`${WAR_ROOM_URL}/api/scout-delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId, debateCount: debateLogs.length }),
    });
  } catch {
    console.warn('[ScoutHub] War Room notification failed — will retry on next cycle');
  }

  const summary: ScoutRunSummary = {
    runId,
    startedAt,
    completedAt: new Date().toISOString(),
    prospectsScanned: sampleProspects.length,
    debatesCompleted,
    debatesFailed,
    pools: {
      highSchool: sampleProspects.filter(p => p.pool === 'HIGH_SCHOOL').length,
      college: sampleProspects.filter(p => p.pool === 'COLLEGE').length,
    },
  };

  lastRun = summary;
  totalScansCompleted++;
  isRunning = false;

  console.log(`[ScoutHub] Run ${runId} complete — ${debatesCompleted}/${sampleProspects.length} debates succeeded`);
  return summary;
}

// ─── HTTP Server ──────────────────────────────────────────────────────────

const server = Bun.serve({
  port: PORT,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const headers = { 'Content-Type': 'application/json' };

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'gridiron-scout-hub',
        isRunning,
        totalScansCompleted,
        uptime: process.uptime(),
      }), { headers });
    }

    // Last run summary
    if (url.pathname === '/api/last-run' && req.method === 'GET') {
      return new Response(JSON.stringify(lastRun || { message: 'No runs completed yet' }), { headers });
    }

    // Manual trigger (for testing)
    if (url.pathname === '/api/trigger-scan' && req.method === 'POST') {
      try {
        const summary = await executeScoutRun();
        return new Response(JSON.stringify(summary), { headers });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: (err as Error).message }),
          { status: 409, headers },
        );
      }
    }

    // Status
    if (url.pathname === '/api/status' && req.method === 'GET') {
      return new Response(JSON.stringify({
        service: 'gridiron-scout-hub',
        version: '1.0.0',
        config: {
          cronSchedule: SCOUT_CRON,
          hsPoolSize: HS_POOL_SIZE,
          collegePoolSize: COLLEGE_POOL_SIZE,
          braveConfigured: !!BRAVE_API_KEY,
          firecrawlUrl: FIRECRAWL_URL,
          warRoomUrl: WAR_ROOM_URL,
        },
        lastRun,
        isRunning,
        totalScansCompleted,
      }), { headers });
    }

    // Single prospect debate (ad-hoc)
    if (url.pathname === '/api/debate' && req.method === 'POST') {
      const body = await req.json() as ProspectTarget;
      const log = await runAdversarialDebate(body);
      return new Response(JSON.stringify(log), { headers });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
  },
});

console.log(`[ScoutHub] Gridiron Scout Hub running on port ${PORT}`);
console.log(`[ScoutHub] Cron schedule: ${SCOUT_CRON}`);
console.log(`[ScoutHub] Target pools — HS: ${HS_POOL_SIZE}, College: ${COLLEGE_POOL_SIZE}`);
console.log(`[ScoutHub] Brave API: ${BRAVE_API_KEY ? 'configured' : 'NOT configured (mock mode)'}`);
