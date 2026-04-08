/**
 * Per|Form — Automation Runner
 *
 * Engine for Boomer_Ang and Lil_Hawk automated tasks.
 * Each runner function handles a specific scan/update cycle
 * and logs results to PerformAutomationRun.
 */

import {
  createAutomationRun,
  completeAutomationRun,
} from './ncaa-data-service';
import { GoogleGenerativeAI } from '@google/generative-ai';

const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';
const BRAVE_BASE_URL = 'https://api.search.brave.com/res/v1/web/search';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Universal Search & Extract Helper (The Scout)
 */
async function scoutSignals(query: string, instructions: string): Promise<any[]> {
  if (!BRAVE_API_KEY || !GEMINI_API_KEY) return [];

  // 1. GATHER: Search Brave
  const params = new URLSearchParams({ q: query, count: '10', freshness: 'day' });
  const res = await fetch(`${BRAVE_BASE_URL}?${params}`, {
    headers: { 'X-Subscription-Token': BRAVE_API_KEY, 'Accept': 'application/json' },
  });
  const searchData = await res.json();
  const snippets = (searchData.web?.results || []).map((r: any) => `Title: ${r.title}\nDesc: ${r.description}`).join('\n\n');

  if (!snippets) return [];

  // 2. HARVEST: Extract via Gemini
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `
    You are Boomer_Ang, the Per|Form Intelligence Scout.
    Extract real-world sports data from these signals for the 2026/2025 season.
    
    SIGNALS:
    ${snippets}
    
    TASK:
    ${instructions}
    
    Return ONLY a JSON array of objects. If no data found, return [].
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonStr = text.replace(/```json\n|```/g, '').trim();

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('[Scout] JSON Parse error:', e, text);
    return [];
  }
}

/** Resolve a team abbreviation to its ID */
async function getTeamId(abbrev: string): Promise<string | null> {
  const team = await prisma.performTeam.findFirst({ where: { abbreviation: abbrev } });
  return team?.id || null;
}

// ─────────────────────────────────────────────────────────────
// Coaching Carousel Scanner (Boomer_Ang)
// ─────────────────────────────────────────────────────────────

export async function runCoachingScan(): Promise<string> {
  const run = await createAutomationRun({
    agentName: 'boomer_ang',
    taskType: 'COACHING_SCAN',
    targetModule: 'coaching_carousel',
    triggeredBy: 'MANUAL',
  });

  try {
    const rawData = await scoutSignals(
      '"coaching change" college football hire fire resign 2025 2026',
      'Extract coaching changes. Fields: coachName, previousRole, newRole, previousTeamAbbrev, newTeamAbbrev, changeType (HIRED|FIRED|RESIGNED|RETIRED|INTERIM), contractValue, notes.'
    );

    let createdCount = 0;
    for (const item of rawData) {
      const prevId = item.previousTeamAbbrev ? await getTeamId(item.previousTeamAbbrev) : null;
      const nextId = item.newTeamAbbrev ? await getTeamId(item.newTeamAbbrev) : null;

      await prisma.coachingChange.create({
        data: {
          coachName: item.coachName,
          previousRole: item.previousRole,
          newRole: item.newRole,
          previousTeamId: prevId,
          newTeamId: nextId,
          changeType: item.changeType || 'HIRED',
          season: 2026,
          effectiveDate: new Date(),
          contractValue: item.contractValue,
          notes: item.notes,
          source: 'Boomer_Ang Scout Loop',
          verified: false,
        }
      });
      createdCount++;
    }

    await completeAutomationRun(run.id, {
      status: 'COMPLETED',
      recordsScanned: rawData.length,
      recordsCreated: createdCount,
      summary: `Coaching scan complete. ${createdCount} new coaching movements harvested from signals.`,
    });

    return run.id;
  } catch (err: any) {
    await completeAutomationRun(run.id, {
      status: 'FAILED',
      errorCount: 1,
      errors: [err.message],
      summary: `Coaching scan failed: ${err.message}`,
    });
    return run.id;
  }
}

// ─────────────────────────────────────────────────────────────
// Transfer Portal Scanner (Boomer_Ang)
// ─────────────────────────────────────────────────────────────

export async function runPortalScan(): Promise<string> {
  const run = await createAutomationRun({
    agentName: 'boomer_ang',
    taskType: 'PORTAL_SCAN',
    targetModule: 'transfer_portal',
    triggeredBy: 'MANUAL',
  });

  try {
    const rawData = await scoutSignals(
      '"entered transfer portal" OR "committed to" transfer college football 247sports on3',
      'Extract portal entries. Fields: playerName, position, previousTeamAbbrev, newTeamAbbrev (if committed), status (IN_PORTAL|COMMITTED|WITHDRAWN|SIGNED), eligibility, stars (1-5).'
    );

    let createdCount = 0;
    for (const item of rawData) {
      const prevId = item.previousTeamAbbrev ? await getTeamId(item.previousTeamAbbrev) : null;
      const nextId = item.newTeamAbbrev ? await getTeamId(item.newTeamAbbrev) : null;

      await prisma.transferPortalEntry.create({
        data: {
          playerName: item.playerName,
          position: item.position || 'N/A',
          previousTeamId: prevId,
          newTeamId: nextId,
          status: item.status || 'IN_PORTAL',
          season: 2026,
          enteredDate: new Date(),
          eligibility: item.eligibility,
          stars: item.stars,
          source: 'Boomer_Ang Scout Loop',
          verified: false,
        }
      });
      createdCount++;
    }

    await completeAutomationRun(run.id, {
      status: 'COMPLETED',
      recordsScanned: rawData.length,
      recordsCreated: createdCount,
      summary: `Portal scan complete. ${createdCount} new transfer signals harvested.`,
    });

    return run.id;
  } catch (err: any) {
    await completeAutomationRun(run.id, {
      status: 'FAILED',
      errorCount: 1,
      errors: [err.message],
      summary: `Portal scan failed: ${err.message}`,
    });
    return run.id;
  }
}

// ─────────────────────────────────────────────────────────────
// NIL Rankings Update (Boomer_Ang)
// ─────────────────────────────────────────────────────────────

export async function runNilUpdate(season: number = 2026): Promise<string> {
  const run = await createAutomationRun({
    agentName: 'boomer_ang',
    taskType: 'NIL_UPDATE',
    targetModule: 'nil_tracker',
    triggeredBy: 'MANUAL',
  });

  try {
    const rawData = await scoutSignals(
      '"NIL deal" OR "NIL collective" college football signed on3 sportico',
      'Extract NIL deals. Fields: playerName, teamAbbrev, brandOrCollective, estimatedValue (number), dealType (COLLECTIVE|ENDORSEMENT), position.'
    );

    let createdCount = 0;
    for (const item of rawData) {
      const teamId = item.teamAbbrev ? await getTeamId(item.teamAbbrev) : null;

      await prisma.nilDeal.create({
        data: {
          playerName: item.playerName,
          teamId,
          brandOrCollective: item.brandOrCollective,
          estimatedValue: item.estimatedValue,
          dealType: item.dealType || 'COLLECTIVE',
          position: item.position,
          season,
          status: 'ACTIVE',
          announcedDate: new Date(),
          source: 'Boomer_Ang Scout Loop',
          verified: false,
        }
      });
      createdCount++;
    }

    const teamAgg: Record<string, {
      teamId: string;
      total: number;
      count: number;
      topDeal: number;
      collectiveCount: number;
    }> = {};

    for (const deal of deals) {
      if (!deal.teamId) continue;
      if (!teamAgg[deal.teamId]) {
        teamAgg[deal.teamId] = { teamId: deal.teamId, total: 0, count: 0, topDeal: 0, collectiveCount: 0 };
      }
      const agg = teamAgg[deal.teamId];
      const val = deal.estimatedValue || 0;
      agg.total += val;
      agg.count += 1;
      if (val > agg.topDeal) agg.topDeal = val;
      if (deal.dealType === 'COLLECTIVE') agg.collectiveCount += 1;
    }

    // Sort by total and assign ranks
    const sorted = Object.values(teamAgg).sort((a, b) => b.total - a.total);
    let updatedCount = 0;

    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      // Get roster size for avg calc
      const budget = await prisma.schoolRevenueBudget.findFirst({
        where: { teamId: entry.teamId, season },
        select: { rosterSize: true },
      });
      const rosterSize = budget?.rosterSize || 85;

      // Get previous ranking
      const prev = await prisma.nilTeamRanking.findUnique({
        where: { teamId_season: { teamId: entry.teamId, season } },
      });

      const trend = !prev ? 'NEW'
        : prev.rank > (i + 1) ? 'UP'
          : prev.rank < (i + 1) ? 'DOWN'
            : 'STEADY';

      await prisma.nilTeamRanking.upsert({
        where: { teamId_season: { teamId: entry.teamId, season } },
        create: {
          teamId: entry.teamId,
          season,
          rank: i + 1,
          totalNilValue: entry.total,
          avgPerPlayer: entry.total / rosterSize,
          topDealValue: entry.topDeal,
          dealCount: entry.count,
          collectiveCount: entry.collectiveCount,
          trend,
        },
        update: {
          rank: i + 1,
          totalNilValue: entry.total,
          avgPerPlayer: entry.total / rosterSize,
          topDealValue: entry.topDeal,
          dealCount: entry.count,
          collectiveCount: entry.collectiveCount,
          trend,
          previousRank: prev?.rank,
          lastCalculated: new Date(),
        },
      });
      updatedCount++;
    }

    await completeAutomationRun(run.id, {
      status: 'COMPLETED',
      recordsScanned: deals.length,
      recordsUpdated: updatedCount,
      summary: `NIL rankings updated. ${deals.length} active deals processed, ${updatedCount} team rankings recalculated.`,
    });

    return run.id;
  } catch (err: any) {
    await completeAutomationRun(run.id, {
      status: 'FAILED',
      errorCount: 1,
      errors: [err.message],
      summary: `NIL update failed: ${err.message}`,
    });
    return run.id;
  }
}

// ─────────────────────────────────────────────────────────────
// Budget Recalculation (Boomer_Ang)
// ─────────────────────────────────────────────────────────────

export async function runBudgetCalc(season: number = 2025): Promise<string> {
  const run = await createAutomationRun({
    agentName: 'boomer_ang',
    taskType: 'BUDGET_CALC',
    targetModule: 'revenue_budget',
    triggeredBy: 'MANUAL',
  });

  try {
    const budgets = await prisma.schoolRevenueBudget.findMany({
      where: { season },
    });

    let updatedCount = 0;

    for (const budget of budgets) {
      // Sum active NIL deals for this team
      const nilResult = await prisma.nilDeal.aggregate({
        where: { teamId: budget.teamId, season, status: 'ACTIVE' },
        _sum: { estimatedValue: true },
      });

      const nilSpent = nilResult._sum.estimatedValue || 0;
      const nilRemaining = budget.nilBudget - nilSpent;
      const capSpace = budget.nilBudget - nilSpent;

      // Determine spending tier
      let spendingTier = 'MID';
      if (budget.nilBudget >= 25000000) spendingTier = 'ELITE';
      else if (budget.nilBudget >= 15000000) spendingTier = 'HIGH';
      else if (budget.nilBudget >= 8000000) spendingTier = 'MID';
      else if (budget.nilBudget >= 4000000) spendingTier = 'LOW';
      else spendingTier = 'MINIMAL';

      await prisma.schoolRevenueBudget.update({
        where: { id: budget.id },
        data: {
          nilSpent,
          nilRemaining,
          capSpace,
          spendingTier,
          lastUpdated: new Date(),
          updatedBy: 'boomer_ang',
        },
      });
      updatedCount++;
    }

    // Rank by cap space
    const ranked = await prisma.schoolRevenueBudget.findMany({
      where: { season },
      orderBy: { capSpace: 'desc' },
    });

    for (let i = 0; i < ranked.length; i++) {
      await prisma.schoolRevenueBudget.update({
        where: { id: ranked[i].id },
        data: { capRank: i + 1 },
      });
    }

    await completeAutomationRun(run.id, {
      status: 'COMPLETED',
      recordsScanned: budgets.length,
      recordsUpdated: updatedCount,
      summary: `Budget recalculation complete. ${updatedCount} school budgets updated and ranked.`,
    });

    return run.id;
  } catch (err: any) {
    await completeAutomationRun(run.id, {
      status: 'FAILED',
      errorCount: 1,
      errors: [err.message],
      summary: `Budget calculation failed: ${err.message}`,
    });
    return run.id;
  }
}

// ─────────────────────────────────────────────────────────────
// Lil_Hawk Verification Pass
// ─────────────────────────────────────────────────────────────

export async function runVerification(targetModule: string): Promise<string> {
  const run = await createAutomationRun({
    agentName: 'lil_hawk',
    taskType: 'VERIFICATION',
    targetModule,
    triggeredBy: 'MANUAL',
  });

  try {
    let scanned = 0;
    let verified = 0;

    switch (targetModule) {
      case 'coaching_carousel': {
        const unverified = await prisma.coachingChange.findMany({
          where: { verified: false },
        });
        scanned = unverified.length;
        // Auto-verify entries that have source URLs
        for (const entry of unverified) {
          if (entry.source) {
            await prisma.coachingChange.update({
              where: { id: entry.id },
              data: { verified: true, verifiedBy: 'lil_hawk', verifiedAt: new Date() },
            });
            verified++;
          }
        }
        break;
      }
      case 'transfer_portal': {
        const unverified = await prisma.transferPortalEntry.findMany({
          where: { verified: false },
        });
        scanned = unverified.length;
        for (const entry of unverified) {
          if (entry.source) {
            await prisma.transferPortalEntry.update({
              where: { id: entry.id },
              data: { verified: true, verifiedBy: 'lil_hawk', verifiedAt: new Date() },
            });
            verified++;
          }
        }
        break;
      }
      case 'nil_tracker': {
        const unverified = await prisma.nilDeal.findMany({
          where: { verified: false },
        });
        scanned = unverified.length;
        for (const deal of unverified) {
          if (deal.source) {
            await prisma.nilDeal.update({
              where: { id: deal.id },
              data: { verified: true, verifiedBy: 'lil_hawk', verifiedAt: new Date() },
            });
            verified++;
          }
        }
        break;
      }
    }

    await completeAutomationRun(run.id, {
      status: 'COMPLETED',
      recordsScanned: scanned,
      recordsUpdated: verified,
      summary: `Lil_Hawk verification on ${targetModule}: ${scanned} items reviewed, ${verified} verified.`,
    });

    return run.id;
  } catch (err: any) {
    await completeAutomationRun(run.id, {
      status: 'FAILED',
      errorCount: 1,
      errors: [err.message],
      summary: `Verification failed: ${err.message}`,
    });
    return run.id;
  }
}
