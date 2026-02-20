/**
 * Per|Form — Automation Runner
 *
 * Engine for Boomer_Ang and Lil_Hawk automated tasks.
 * Each runner function handles a specific scan/update cycle
 * and logs results to PerformAutomationRun.
 */

import prisma from '@/lib/db/prisma';
import {
  createAutomationRun,
  completeAutomationRun,
} from './ncaa-data-service';

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
    // Count existing unverified entries needing verification
    const unverified = await prisma.coachingChange.count({
      where: { verified: false },
    });

    const total = await prisma.coachingChange.count();

    await completeAutomationRun(run.id, {
      status: 'COMPLETED',
      recordsScanned: total,
      recordsUpdated: 0,
      recordsCreated: 0,
      summary: `Coaching scan complete. ${total} records in database, ${unverified} awaiting Lil_Hawk verification.`,
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
    const [total, inPortal, unverified] = await Promise.all([
      prisma.transferPortalEntry.count(),
      prisma.transferPortalEntry.count({ where: { status: 'IN_PORTAL' } }),
      prisma.transferPortalEntry.count({ where: { verified: false } }),
    ]);

    await completeAutomationRun(run.id, {
      status: 'COMPLETED',
      recordsScanned: total,
      recordsUpdated: 0,
      recordsCreated: 0,
      summary: `Portal scan complete. ${total} entries tracked, ${inPortal} currently in portal, ${unverified} awaiting verification.`,
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

export async function runNilUpdate(season: number = 2025): Promise<string> {
  const run = await createAutomationRun({
    agentName: 'boomer_ang',
    taskType: 'NIL_UPDATE',
    targetModule: 'nil_tracker',
    triggeredBy: 'MANUAL',
  });

  try {
    // Aggregate NIL deals by team
    const deals = await prisma.nilDeal.findMany({
      where: { season, status: 'ACTIVE' },
      include: { team: { select: { id: true } } },
    });

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
