/**
 * Per|Form State Boards API
 *
 * GET /api/perform/state-boards
 *   Returns state-level prospect aggregations from the database.
 *   ?state=TX — Get prospects for a specific state
 *   ?limit=50 — Limit results per state
 *
 * Data sourced from PerformProspect table (pool = HS or TRANSFER).
 * Returns empty if no state data is indexed yet.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    try {
        if (state) {
            // Return prospects for a specific state
            const prospects = await prisma.performProspect.findMany({
                where: { state: state.toUpperCase() },
                orderBy: { paiScore: 'desc' },
                take: limit,
            });

            return NextResponse.json({
                source: prospects.length > 0 ? 'database' : 'none',
                state: state.toUpperCase(),
                total: prospects.length,
                prospects: prospects.map((p: any, idx: number) => ({
                    rank: idx + 1,
                    id: p.id,
                    name: `${p.firstName} ${p.lastName}`,
                    position: p.position,
                    school: p.school,
                    classYear: p.classYear,
                    paiScore: p.paiScore,
                    tier: p.tier,
                    stats: p.stats ? JSON.parse(p.stats) : null,
                    scoutMemo: p.scoutMemo,
                    tags: p.tags ? JSON.parse(p.tags) : [],
                    pool: p.pool,
                })),
            });
        }

        // Return aggregated counts per state
        const stateCounts = await prisma.performProspect.groupBy({
            by: ['state'],
            _count: { _all: true },
            orderBy: { _count: { state: 'desc' } },
        });

        // For each state, get the top prospect
        const stateData = [];
        for (const sc of stateCounts) {
            if (!sc.state) continue;
            const topProspect = await prisma.performProspect.findFirst({
                where: { state: sc.state },
                orderBy: { paiScore: 'desc' },
                select: { firstName: true, lastName: true, position: true, paiScore: true },
            });

            stateData.push({
                code: sc.state,
                count: sc._count._all,
                topProducer: topProspect ? `${topProspect.firstName} ${topProspect.lastName}` : null,
                topPosition: topProspect?.position || null,
                topPai: topProspect?.paiScore || null,
            });
        }

        return NextResponse.json({
            source: stateData.length > 0 ? 'database' : 'none',
            total: stateData.reduce((s, d) => s + d.count, 0),
            stateCount: stateData.length,
            states: stateData,
        });
    } catch (err) {
        console.warn('[State Boards] Error:', err);
        return NextResponse.json({
            source: 'none',
            total: 0,
            stateCount: 0,
            states: [],
            message: 'No state-level data indexed yet. Activate the State Boards indexer to begin harvesting.',
        });
    }
}
