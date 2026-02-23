/**
 * Per|Form Gridiron Live Data API
 *
 * GET /api/perform/gridiron — Aggregated live gridiron data for the lobby
 *
 * Returns: conference standings, latest portal moves, recent coaching changes,
 * upcoming/recent games, top draft prospects, and NIL leaders — all from Prisma.
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

const CURRENT_SEASON = new Date().getFullYear();

export async function GET() {
  try {
    const [
      standings,
      portalMoves,
      coachingChanges,
      recentGames,
      topDraftProspects,
      nilLeaders,
      portalStats,
    ] = await Promise.all([
      // Conference standings — top 25 teams by wins this season
      prisma.performTeamSeason.findMany({
        where: { season: { in: [CURRENT_SEASON, CURRENT_SEASON - 1] } },
        include: {
          team: {
            select: {
              schoolName: true,
              commonName: true,
              abbreviation: true,
              mascot: true,
              conference: { select: { name: true, abbreviation: true } },
            },
          },
        },
        orderBy: [{ wins: 'desc' }, { confWins: 'desc' }],
        take: 25,
      }).catch(() => []),

      // Latest transfer portal moves (last 10)
      prisma.transferPortalEntry.findMany({
        where: { season: { in: [CURRENT_SEASON, CURRENT_SEASON - 1] } },
        include: {
          previousTeam: { select: { commonName: true, abbreviation: true } },
          newTeam: { select: { commonName: true, abbreviation: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }).catch(() => []),

      // Recent coaching changes
      prisma.coachingChange.findMany({
        where: { season: { in: [CURRENT_SEASON, CURRENT_SEASON - 1] } },
        include: {
          previousTeam: { select: { commonName: true, abbreviation: true } },
          newTeam: { select: { commonName: true, abbreviation: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 8,
      }).catch(() => []),

      // Recent/upcoming games
      prisma.sportsPick.findMany({
        where: { sport: { in: ['CFB', 'NFL'] } },
        orderBy: { eventDate: 'desc' },
        take: 12,
      }).catch(() => []),

      // Top draft prospects (first round projected)
      prisma.draftProspect.findMany({
        where: { projectedRound: { lte: 2 } },
        orderBy: { overallRank: 'asc' },
        take: 10,
      }).catch(() => []),

      // NIL team leaders
      prisma.nilTeamRanking.findMany({
        where: { season: { in: [CURRENT_SEASON, CURRENT_SEASON - 1] } },
        include: {
          team: { select: { commonName: true, abbreviation: true } },
        },
        orderBy: { rank: 'asc' },
        take: 10,
      }).catch(() => []),

      // Portal aggregate stats
      prisma.transferPortalEntry.groupBy({
        by: ['status'],
        where: { season: { in: [CURRENT_SEASON, CURRENT_SEASON - 1] } },
        _count: true,
      }).catch(() => []),
    ]);

    // Aggregate portal stats into a summary
    const portalSummary = {
      inPortal: 0,
      committed: 0,
      withdrawn: 0,
      signed: 0,
      total: 0,
    };
    for (const group of portalStats as any[]) {
      const count = group._count ?? 0;
      portalSummary.total += count;
      switch (group.status) {
        case 'IN_PORTAL': portalSummary.inPortal = count; break;
        case 'COMMITTED': portalSummary.committed = count; break;
        case 'WITHDRAWN': portalSummary.withdrawn = count; break;
        case 'SIGNED': portalSummary.signed = count; break;
      }
    }

    return NextResponse.json({
      standings: standings.map((s: any) => ({
        team: s.team?.commonName || 'Unknown',
        abbreviation: s.team?.abbreviation || '???',
        conference: s.team?.conference?.abbreviation || '',
        conferenceName: s.team?.conference?.name || '',
        wins: s.wins,
        losses: s.losses,
        confWins: s.confWins,
        confLosses: s.confLosses,
        apRank: s.apRank,
        cfpRank: s.cfpRank,
        bowlGame: s.bowlGame,
        bowlResult: s.bowlResult,
        season: s.season,
      })),
      portalMoves: portalMoves.map((p: any) => ({
        playerName: p.playerName,
        position: p.position,
        status: p.status,
        stars: p.stars,
        paiScore: p.paiScore,
        tier: p.tier,
        nilValuation: p.nilValuation,
        from: p.previousTeam?.commonName || 'Unknown',
        fromAbbr: p.previousTeam?.abbreviation || '???',
        to: p.newTeam?.commonName || null,
        toAbbr: p.newTeam?.abbreviation || null,
        enteredDate: p.enteredDate,
        committedDate: p.committedDate,
      })),
      coachingChanges: coachingChanges.map((c: any) => ({
        coachName: c.coachName,
        changeType: c.changeType,
        previousTeam: c.previousTeam?.commonName || null,
        newTeam: c.newTeam?.commonName || null,
        contractValue: c.contractValue,
        effectiveDate: c.effectiveDate,
        record: c.record,
      })),
      scoreboard: recentGames.map((g: any) => ({
        sport: g.sport,
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        homeScore: g.homeScore,
        awayScore: g.awayScore,
        status: g.status,
        spread: g.spread,
        overUnder: g.overUnder,
        eventDate: g.eventDate,
        result: g.result,
      })),
      draftBoard: topDraftProspects.map((d: any) => ({
        name: `${d.firstName} ${d.lastName}`,
        position: d.position,
        college: d.college,
        paiScore: d.paiScore,
        tier: d.tier,
        overallRank: d.overallRank,
        projectedRound: d.projectedRound,
        projectedPick: d.projectedPick,
        projectedTeam: d.projectedTeam,
        trend: d.trend,
        combineInvite: d.combineInvite,
      })),
      nilLeaders: nilLeaders.map((n: any) => ({
        team: n.team?.commonName || 'Unknown',
        abbreviation: n.team?.abbreviation || '???',
        rank: n.rank,
        totalNilValue: n.totalNilValue,
        avgPerPlayer: n.avgPerPlayer,
        dealCount: n.dealCount,
        trend: n.trend,
      })),
      portalSummary,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Per|Form Gridiron] Error:', err.message);
    return NextResponse.json({
      standings: [],
      portalMoves: [],
      coachingChanges: [],
      scoreboard: [],
      draftBoard: [],
      nilLeaders: [],
      portalSummary: { inPortal: 0, committed: 0, withdrawn: 0, signed: 0, total: 0 },
      updatedAt: new Date().toISOString(),
    });
  }
}
