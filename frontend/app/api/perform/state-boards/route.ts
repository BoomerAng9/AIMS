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
import { SEED_PROSPECTS } from '@/lib/perform/seed-prospects';
import { SEED_DRAFT_PROSPECTS } from '@/lib/perform/seed-draft-data';

/** Build state board data from seed prospects */
function getSeedStateData(stateFilter?: string, limit = 50) {
    // Combine both seed sources into a unified prospect list
    const allProspects = [
        ...SEED_PROSPECTS.map(p => ({
            id: `seed-${p.firstName}-${p.lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
            firstName: p.firstName,
            lastName: p.lastName,
            position: p.position,
            school: p.school,
            state: p.state,
            classYear: p.classYear,
            paiScore: p.paiScore,
            tier: p.tier,
            stats: p.stats || {},
            scoutMemo: p.scoutMemo,
            tags: p.tags || [],
            pool: p.pool,
        })),
        ...SEED_DRAFT_PROSPECTS.map(p => ({
            id: `seed-draft-${p.firstName}-${p.lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
            firstName: p.firstName,
            lastName: p.lastName,
            position: p.position,
            school: p.college,
            state: '',
            classYear: p.classYear,
            paiScore: p.paiScore,
            tier: p.tier,
            stats: typeof p.collegeStats === 'string' ? JSON.parse(p.collegeStats) : (p.collegeStats || {}),
            scoutMemo: p.scoutMemo,
            tags: typeof p.tags === 'string' ? p.tags.split(',') : (p.tags || []),
            pool: 'NFL_DRAFT',
        })),
    ].filter(p => p.state); // Only include prospects with state info

    if (stateFilter) {
        const filtered = allProspects
            .filter(p => p.state.toUpperCase() === stateFilter.toUpperCase())
            .sort((a, b) => (b.paiScore || 0) - (a.paiScore || 0))
            .slice(0, limit);

        return {
            source: filtered.length > 0 ? 'seed-data' : 'none',
            state: stateFilter.toUpperCase(),
            total: filtered.length,
            prospects: filtered.map((p, idx) => ({
                rank: idx + 1,
                id: p.id,
                name: `${p.firstName} ${p.lastName}`,
                position: p.position,
                school: p.school,
                classYear: p.classYear,
                paiScore: p.paiScore,
                tier: p.tier,
                stats: p.stats,
                scoutMemo: p.scoutMemo,
                tags: p.tags,
                pool: p.pool,
            })),
        };
    }

    // Aggregate by state
    const stateMap = new Map<string, typeof allProspects>();
    for (const p of allProspects) {
        const st = p.state.toUpperCase();
        if (!stateMap.has(st)) stateMap.set(st, []);
        stateMap.get(st)!.push(p);
    }

    const stateData = Array.from(stateMap.entries())
        .map(([code, prospects]) => {
            const sorted = prospects.sort((a, b) => (b.paiScore || 0) - (a.paiScore || 0));
            const top = sorted[0];
            return {
                code,
                count: prospects.length,
                topProducer: top ? `${top.firstName} ${top.lastName}` : null,
                topPosition: top?.position || null,
                topPai: top?.paiScore || null,
            };
        })
        .sort((a, b) => b.count - a.count);

    return {
        source: stateData.length > 0 ? 'seed-data' : 'none',
        total: allProspects.length,
        stateCount: stateData.length,
        states: stateData,
    };
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    try {
        // Check if DB has prospect data
        const dbCount = await prisma.performProspect.count().catch(() => 0);

        if (dbCount > 0) {
            if (state) {
                // Return prospects for a specific state
                const prospects = await prisma.performProspect.findMany({
                    where: { state: state.toUpperCase() },
                    orderBy: { paiScore: 'desc' },
                    take: limit,
                });

                if (prospects.length > 0) {
                    return NextResponse.json({
                        source: 'database',
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
            } else {
                // Return aggregated counts per state
                const stateCounts = await prisma.performProspect.groupBy({
                    by: ['state'],
                    _count: { _all: true },
                    orderBy: { _count: { state: 'desc' } },
                });

                if (stateCounts.length > 0) {
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
                        source: 'database',
                        total: stateData.reduce((s, d) => s + d.count, 0),
                        stateCount: stateData.length,
                        states: stateData,
                    });
                }
            }
        }

        // DB empty — fall through to seed data
    } catch (err) {
        console.warn('[State Boards] DB error, falling back to seed data:', err);
    }

    // Fallback to seed data
    return NextResponse.json(getSeedStateData(state || undefined, limit));
}
