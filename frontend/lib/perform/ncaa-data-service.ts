/**
 * Per|Form — NCAA Data Service
 *
 * CRUD and query helpers for Coaching Carousel, Transfer Portal,
 * NIL Tracker, and School Revenue Budget modules.
 */

import prisma from '@/lib/db/prisma';

// ─────────────────────────────────────────────────────────────
// Coaching Carousel
// ─────────────────────────────────────────────────────────────

const teamInclude = { select: { id: true, schoolName: true, commonName: true, abbreviation: true } };

export async function getCoachingChanges(filters?: {
  season?: number;
  changeType?: string;
  teamId?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  if (filters?.season) where.season = filters.season;
  if (filters?.changeType) where.changeType = filters.changeType;
  if (filters?.teamId) {
    where.OR = [{ previousTeamId: filters.teamId }, { newTeamId: filters.teamId }];
  }

  return prisma.coachingChange.findMany({
    where,
    include: { previousTeam: teamInclude, newTeam: teamInclude },
    orderBy: { effectiveDate: 'desc' },
    take: filters?.limit || 50,
    skip: filters?.offset || 0,
  });
}

export async function getCoachingChangeById(id: string) {
  return prisma.coachingChange.findUnique({
    where: { id },
    include: { previousTeam: teamInclude, newTeam: teamInclude },
  });
}

export async function getCoachingCarouselStats(season: number) {
  const [total, hired, fired, resigned, retired, interim] = await Promise.all([
    prisma.coachingChange.count({ where: { season } }),
    prisma.coachingChange.count({ where: { season, changeType: 'HIRED' } }),
    prisma.coachingChange.count({ where: { season, changeType: 'FIRED' } }),
    prisma.coachingChange.count({ where: { season, changeType: 'RESIGNED' } }),
    prisma.coachingChange.count({ where: { season, changeType: 'RETIRED' } }),
    prisma.coachingChange.count({ where: { season, changeType: 'INTERIM' } }),
  ]);
  return { total, hired, fired, resigned, retired, interim };
}

// ─────────────────────────────────────────────────────────────
// Transfer Portal
// ─────────────────────────────────────────────────────────────

export async function getTransferPortalEntries(filters?: {
  season?: number;
  status?: string;
  position?: string;
  transferWindow?: string;
  teamId?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  if (filters?.season) where.season = filters.season;
  if (filters?.status) where.status = filters.status;
  if (filters?.position) where.position = filters.position;
  if (filters?.transferWindow) where.transferWindow = filters.transferWindow;
  if (filters?.teamId) {
    where.OR = [{ previousTeamId: filters.teamId }, { newTeamId: filters.teamId }];
  }

  return prisma.transferPortalEntry.findMany({
    where,
    include: { previousTeam: teamInclude, newTeam: teamInclude },
    orderBy: [{ paiScore: 'desc' }, { enteredDate: 'desc' }],
    take: filters?.limit || 50,
    skip: filters?.offset || 0,
  });
}

export async function getTransferPortalStats(season: number) {
  const [total, inPortal, committed, withdrawn, signed] = await Promise.all([
    prisma.transferPortalEntry.count({ where: { season } }),
    prisma.transferPortalEntry.count({ where: { season, status: 'IN_PORTAL' } }),
    prisma.transferPortalEntry.count({ where: { season, status: 'COMMITTED' } }),
    prisma.transferPortalEntry.count({ where: { season, status: 'WITHDRAWN' } }),
    prisma.transferPortalEntry.count({ where: { season, status: 'SIGNED' } }),
  ]);
  return { total, inPortal, committed, withdrawn, signed };
}

// ─────────────────────────────────────────────────────────────
// NIL Tracker
// ─────────────────────────────────────────────────────────────

export async function getNilDeals(filters?: {
  season?: number;
  teamId?: string;
  dealType?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  if (filters?.season) where.season = filters.season;
  if (filters?.teamId) where.teamId = filters.teamId;
  if (filters?.dealType) where.dealType = filters.dealType;
  if (filters?.status) where.status = filters.status;

  return prisma.nilDeal.findMany({
    where,
    include: { team: teamInclude },
    orderBy: { estimatedValue: 'desc' },
    take: filters?.limit || 50,
    skip: filters?.offset || 0,
  });
}

export async function getNilTeamRankings(season: number) {
  return prisma.nilTeamRanking.findMany({
    where: { season },
    include: { team: teamInclude },
    orderBy: { rank: 'asc' },
  });
}

export async function getNilPlayerRankings(filters?: {
  season?: number;
  teamId?: string;
  limit?: number;
}) {
  const where: any = {};
  if (filters?.season) where.season = filters.season;
  if (filters?.teamId) where.teamId = filters.teamId;

  return prisma.nilPlayerRanking.findMany({
    where,
    include: { team: teamInclude },
    orderBy: { rank: 'asc' },
    take: filters?.limit || 25,
  });
}

export async function getNilStats(season: number) {
  const deals = await prisma.nilDeal.findMany({ where: { season } });
  const totalValue = deals.reduce((sum, d) => sum + (d.estimatedValue || 0), 0);
  const avgDeal = deals.length > 0 ? totalValue / deals.length : 0;
  return {
    totalDeals: deals.length,
    totalValue,
    avgDealValue: avgDeal,
    activeDealCount: deals.filter(d => d.status === 'ACTIVE').length,
  };
}

// ─────────────────────────────────────────────────────────────
// School Revenue Budget
// ─────────────────────────────────────────────────────────────

export async function getSchoolBudgets(filters?: {
  season?: number;
  spendingTier?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  if (filters?.season) where.season = filters.season;
  if (filters?.spendingTier) where.spendingTier = filters.spendingTier;

  return prisma.schoolRevenueBudget.findMany({
    where,
    include: { team: teamInclude },
    orderBy: { capSpace: 'desc' },
    take: filters?.limit || 50,
    skip: filters?.offset || 0,
  });
}

export async function getSchoolBudgetByTeam(teamId: string, season: number) {
  return prisma.schoolRevenueBudget.findUnique({
    where: { teamId_season: { teamId, season } },
    include: {
      team: teamInclude,
      transactions: { orderBy: { effectiveDate: 'desc' }, take: 20 },
    },
  });
}

export async function getBudgetLeaderboard(season: number) {
  return prisma.schoolRevenueBudget.findMany({
    where: { season },
    include: { team: teamInclude },
    orderBy: { totalRevenue: 'desc' },
  });
}

// ─────────────────────────────────────────────────────────────
// Automation Runs
// ─────────────────────────────────────────────────────────────

export async function getAutomationRuns(filters?: {
  agentName?: string;
  targetModule?: string;
  limit?: number;
}) {
  const where: any = {};
  if (filters?.agentName) where.agentName = filters.agentName;
  if (filters?.targetModule) where.targetModule = filters.targetModule;

  return prisma.performAutomationRun.findMany({
    where,
    orderBy: { startedAt: 'desc' },
    take: filters?.limit || 20,
  });
}

export async function createAutomationRun(data: {
  agentName: string;
  taskType: string;
  targetModule: string;
  triggeredBy?: string;
}) {
  return prisma.performAutomationRun.create({
    data: {
      agentName: data.agentName,
      taskType: data.taskType,
      targetModule: data.targetModule,
      status: 'RUNNING',
      triggeredBy: data.triggeredBy || 'SCHEDULE',
    },
  });
}

export async function completeAutomationRun(id: string, result: {
  status: string;
  recordsScanned?: number;
  recordsUpdated?: number;
  recordsCreated?: number;
  errorCount?: number;
  summary?: string;
  errors?: string[];
}) {
  const startedRun = await prisma.performAutomationRun.findUnique({ where: { id } });
  const durationMs = startedRun ? Date.now() - startedRun.startedAt.getTime() : 0;

  return prisma.performAutomationRun.update({
    where: { id },
    data: {
      status: result.status,
      recordsScanned: result.recordsScanned || 0,
      recordsUpdated: result.recordsUpdated || 0,
      recordsCreated: result.recordsCreated || 0,
      errorCount: result.errorCount || 0,
      summary: result.summary,
      errors: result.errors ? JSON.stringify(result.errors) : null,
      completedAt: new Date(),
      durationMs,
    },
  });
}
