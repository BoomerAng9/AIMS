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

// ─────────────────────────────────────────────────────────────
// Seeding — NCAA Data Ingest
// ─────────────────────────────────────────────────────────────

/** Resolve a team abbreviation to its PerformTeam.id, or null */
async function resolveTeamId(abbrev: string | null): Promise<string | null> {
  if (!abbrev) return null;
  const team = await prisma.performTeam.findFirst({ where: { abbreviation: abbrev } });
  return team?.id || null;
}

export async function seedCoachingChanges(entries: Array<{
  coachName: string;
  previousRole: string | null;
  newRole: string | null;
  previousTeamAbbrev: string | null;
  newTeamAbbrev: string | null;
  changeType: string;
  season: number;
  effectiveDate: string;
  contractYears?: number | null;
  contractValue?: string | null;
  buyout?: string;
  record?: string;
  notes?: string;
  verified: boolean;
  verifiedBy: string | null;
}>) {
  let created = 0;
  let skipped = 0;

  for (const entry of entries) {
    const previousTeamId = await resolveTeamId(entry.previousTeamAbbrev);
    const newTeamId = await resolveTeamId(entry.newTeamAbbrev);

    // Skip if already exists (same coach + season + changeType)
    const existing = await prisma.coachingChange.findFirst({
      where: { coachName: entry.coachName, season: entry.season, changeType: entry.changeType },
    });
    if (existing) { skipped++; continue; }

    await prisma.coachingChange.create({
      data: {
        coachName: entry.coachName,
        previousRole: entry.previousRole,
        newRole: entry.newRole,
        previousTeamId,
        newTeamId,
        changeType: entry.changeType,
        season: entry.season,
        effectiveDate: new Date(entry.effectiveDate),
        contractYears: entry.contractYears ?? null,
        contractValue: entry.contractValue ?? null,
        buyout: entry.buyout ?? null,
        record: entry.record ?? null,
        notes: entry.notes ?? null,
        verified: entry.verified,
        verifiedBy: entry.verifiedBy,
        verifiedAt: entry.verified ? new Date() : null,
        source: 'seed-ncaa-data',
      },
    });
    created++;
  }

  return { created, skipped };
}

export async function seedTransferPortalEntries(entries: Array<{
  playerName: string;
  position: string;
  eligibility: string;
  previousTeamAbbrev: string;
  newTeamAbbrev: string | null;
  status: string;
  season: number;
  enteredDate: string;
  committedDate?: string;
  stars: number;
  previousStats: Record<string, number>;
  nilValuation: string;
  paiScore: number;
  tier: string;
  transferWindow: string;
  verified: boolean;
  verifiedBy: string | null;
}>) {
  let created = 0;
  let skipped = 0;

  for (const entry of entries) {
    const previousTeamId = await resolveTeamId(entry.previousTeamAbbrev);
    const newTeamId = await resolveTeamId(entry.newTeamAbbrev);

    const existing = await prisma.transferPortalEntry.findFirst({
      where: { playerName: entry.playerName, season: entry.season },
    });
    if (existing) { skipped++; continue; }

    await prisma.transferPortalEntry.create({
      data: {
        playerName: entry.playerName,
        position: entry.position,
        eligibility: entry.eligibility,
        previousTeamId,
        newTeamId,
        status: entry.status,
        season: entry.season,
        enteredDate: new Date(entry.enteredDate),
        committedDate: entry.committedDate ? new Date(entry.committedDate) : null,
        stars: entry.stars,
        previousStats: JSON.stringify(entry.previousStats),
        nilValuation: entry.nilValuation,
        paiScore: entry.paiScore,
        tier: entry.tier,
        transferWindow: entry.transferWindow,
        verified: entry.verified,
        verifiedBy: entry.verifiedBy,
        verifiedAt: entry.verified ? new Date() : null,
        source: 'seed-ncaa-data',
      },
    });
    created++;
  }

  return { created, skipped };
}

export async function seedNilDeals(entries: Array<{
  playerName: string;
  teamAbbrev: string;
  position: string;
  dealType: string;
  brandOrCollective: string;
  estimatedValue: number;
  duration: string;
  status: string;
  announcedDate: string;
  season: number;
}>) {
  let created = 0;
  let skipped = 0;

  for (const entry of entries) {
    const teamId = await resolveTeamId(entry.teamAbbrev);

    const existing = await prisma.nilDeal.findFirst({
      where: { playerName: entry.playerName, brandOrCollective: entry.brandOrCollective, season: entry.season },
    });
    if (existing) { skipped++; continue; }

    await prisma.nilDeal.create({
      data: {
        playerName: entry.playerName,
        teamId,
        position: entry.position,
        dealType: entry.dealType,
        brandOrCollective: entry.brandOrCollective,
        estimatedValue: entry.estimatedValue,
        duration: entry.duration,
        status: entry.status,
        announcedDate: new Date(entry.announcedDate),
        season: entry.season,
        verified: true,
        verifiedBy: 'seed-ncaa-data',
        verifiedAt: new Date(),
        source: 'seed-ncaa-data',
      },
    });
    created++;
  }

  return { created, skipped };
}

export async function seedNilTeamRankings(entries: Array<{
  teamAbbrev: string;
  rank: number;
  totalNilValue: number;
  avgPerPlayer: number;
  topDealValue: number;
  dealCount: number;
  collectiveCount: number;
  trend: string;
  previousRank: number;
}>, season: number = 2025) {
  let created = 0;
  let skipped = 0;

  for (const entry of entries) {
    const teamId = await resolveTeamId(entry.teamAbbrev);
    if (!teamId) { skipped++; continue; }

    await prisma.nilTeamRanking.upsert({
      where: { teamId_season: { teamId, season } },
      update: {
        rank: entry.rank,
        totalNilValue: entry.totalNilValue,
        avgPerPlayer: entry.avgPerPlayer,
        topDealValue: entry.topDealValue,
        dealCount: entry.dealCount,
        collectiveCount: entry.collectiveCount,
        trend: entry.trend,
        previousRank: entry.previousRank,
        lastCalculated: new Date(),
      },
      create: {
        teamId,
        season,
        rank: entry.rank,
        totalNilValue: entry.totalNilValue,
        avgPerPlayer: entry.avgPerPlayer,
        topDealValue: entry.topDealValue,
        dealCount: entry.dealCount,
        collectiveCount: entry.collectiveCount,
        trend: entry.trend,
        previousRank: entry.previousRank,
      },
    });
    created++;
  }

  return { created, skipped };
}

export async function seedSchoolBudgets(entries: Array<{
  teamAbbrev: string;
  totalRevenue: number;
  footballRevenue: number;
  nilBudget: number;
  nilSpent: number;
  coachingSalary: number;
  operatingBudget: number;
  tvRevenue: number;
  ticketRevenue: number;
  donorRevenue: number;
  merchandiseRev: number;
  conferenceShare: number;
  spendingTier: string;
  rosterSize: number;
}>, season: number = 2025) {
  let created = 0;
  let skipped = 0;

  for (const entry of entries) {
    const teamId = await resolveTeamId(entry.teamAbbrev);
    if (!teamId) { skipped++; continue; }

    const capSpace = entry.nilBudget - entry.nilSpent;

    await prisma.schoolRevenueBudget.upsert({
      where: { teamId_season: { teamId, season } },
      update: {
        totalRevenue: entry.totalRevenue,
        footballRevenue: entry.footballRevenue,
        nilBudget: entry.nilBudget,
        nilSpent: entry.nilSpent,
        nilRemaining: capSpace,
        coachingSalary: entry.coachingSalary,
        operatingBudget: entry.operatingBudget,
        capSpace,
        spendingTier: entry.spendingTier,
        tvRevenue: entry.tvRevenue,
        ticketRevenue: entry.ticketRevenue,
        donorRevenue: entry.donorRevenue,
        merchandiseRev: entry.merchandiseRev,
        conferenceShare: entry.conferenceShare,
        rosterSize: entry.rosterSize,
        lastUpdated: new Date(),
        updatedBy: 'seed-ncaa-data',
      },
      create: {
        teamId,
        season,
        totalRevenue: entry.totalRevenue,
        footballRevenue: entry.footballRevenue,
        nilBudget: entry.nilBudget,
        nilSpent: entry.nilSpent,
        nilRemaining: capSpace,
        coachingSalary: entry.coachingSalary,
        operatingBudget: entry.operatingBudget,
        scholarships: 85,
        rosterSize: entry.rosterSize,
        capSpace,
        spendingTier: entry.spendingTier,
        tvRevenue: entry.tvRevenue,
        ticketRevenue: entry.ticketRevenue,
        donorRevenue: entry.donorRevenue,
        merchandiseRev: entry.merchandiseRev,
        conferenceShare: entry.conferenceShare,
        updatedBy: 'seed-ncaa-data',
      },
    });
    created++;
  }

  // Calculate cap ranks
  const budgets = await prisma.schoolRevenueBudget.findMany({
    where: { season },
    orderBy: { capSpace: 'desc' },
  });
  for (let i = 0; i < budgets.length; i++) {
    await prisma.schoolRevenueBudget.update({
      where: { id: budgets[i].id },
      data: { capRank: i + 1 },
    });
  }

  return { created, skipped };
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
