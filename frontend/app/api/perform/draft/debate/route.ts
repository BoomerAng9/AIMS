/**
 * Per|Form War Room Debate API
 *
 * POST /api/perform/draft/debate
 * 
 * Takes a news item / update headline and generates a Bull vs Bear
 * debate cutscene between a Boomer_Ang and a Lil_Hawk.
 *
 * Uses the real analyst personalities from PERFORM_BOOMERANGS_ROSTER:
 * - Boomer_Ang analysts: PrimeTime Jr. (Swagger_Ang), Uncle Blaze (Heat_Ang),
 *   The Professor (Film_First_Ang), The Strategist (Scheme_Ang)
 * - Lil_Hawks: Lil_Bull_Hawk (bullish), Lil_Bear_Hawk (bearish)
 *
 * The debate is generated from the prospect's actual data in the DB.
 * If no AI model is configured, returns pre-structured takes based
 * on the prospect's bull/bear cases from the seed data.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCollegeInfo } from '@/lib/perform/cfb-data';

interface AnalystProfile {
    name: string;
    angId: string;
    role: 'bull' | 'bear';
    avatar: string;
    style: string;
    catchphrases: string[];
}

const BULL_ANALYSTS: AnalystProfile[] = [
    {
        name: 'PrimeTime Jr.',
        angId: 'Swagger_Ang',
        role: 'bull',
        avatar: '/images/perform/boomer-ang-debate.png',
        style: 'bombastic',
        catchphrases: ['That boy DIFFERENT.', "I knew it before everybody knew it.", "You can't cover me!"],
    },
    {
        name: 'Uncle Blaze',
        angId: 'Heat_Ang',
        role: 'bull',
        avatar: '/images/perform/boomer-ang-debate.png',
        style: 'passionate',
        catchphrases: ['Let me tell you something!', "I been saying this since DAY ONE.", "Y'all wasn't listening!"],
    },
];

const BEAR_ANALYSTS: AnalystProfile[] = [
    {
        name: 'The Professor',
        angId: 'Film_First_Ang',
        role: 'bear',
        avatar: '/images/perform/lil-hawk-debate.png',
        style: 'measured',
        catchphrases: ['Watch the tape.', "The film doesn't lie.", "I see a lot of..."],
    },
    {
        name: 'The Strategist',
        angId: 'Scheme_Ang',
        role: 'bear',
        avatar: '/images/perform/lil-hawk-debate.png',
        style: 'calm',
        catchphrases: ["It's about the fit.", "Look at the scheme demands.", "You have to understand what they're asking him to do."],
    },
];

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { headline, prospectName, teamAbbrev, type } = body;

        if (!headline) {
            return NextResponse.json({ error: 'headline is required' }, { status: 400 });
        }

        // Pick random analysts for the debate
        const bullAnalyst = pickRandom(BULL_ANALYSTS);
        const bearAnalyst = pickRandom(BEAR_ANALYSTS);

        // Try to find the prospect in the DB for real bull/bear cases
        let bullTake = '';
        let bearTake = '';
        let verdict = '';

        if (prospectName) {
            const nameParts = prospectName.trim().split(' ');
            const prospect = await prisma.draftProspect.findFirst({
                where: {
                    OR: [
                        { lastName: nameParts[nameParts.length - 1] },
                        { firstName: nameParts[0] },
                    ],
                },
            });

            if (prospect) {
                // Fetch dynamic metadata from the CFB datasets
                const collegeData = prospect.college ? getCollegeInfo(prospect.college) : null;
                const stadiumCallout = collegeData ? ` Playing in front of those ${collegeData.mascot} fans in ${collegeData.city}, ${collegeData.state} built different!` : '';
                const schemeCallout = collegeData ? ` Even in the ${collegeData.conference}, there are concerns.` : '';

                // Use REAL bull/bear cases from the seed data
                if (prospect.bullCase) {
                    bullTake = `${pickRandom(bullAnalyst.catchphrases)} ${prospect.bullCase}${stadiumCallout}`;
                }
                if (prospect.bearCase) {
                    bearTake = `${pickRandom(bearAnalyst.catchphrases)} ${prospect.bearCase}${schemeCallout}`;
                }
                if (prospect.mediationVerdict) {
                    verdict = prospect.mediationVerdict;
                }
            }
        }

        // Fallback: generate takes from the headline context
        if (!bullTake) {
            const phrases = bullAnalyst.catchphrases;
            if (type === 'combine') {
                bullTake = `${pickRandom(phrases)} This player showed up at the combine ready. The measurables don't lie — this is a Day 1 impact player. This is what separates the talkers from the players.`;
            } else if (type === 'projection') {
                bullTake = `${pickRandom(phrases)} This fit is PERFECT. The scheme, the roster need, the talent level — it all lines up. This team is getting a steal.`;
            } else {
                bullTake = `${pickRandom(phrases)} Everybody sleeping on this development. Trust me — by April, you'll remember I said this first.`;
            }
        }

        if (!bearTake) {
            const phrases = bearAnalyst.catchphrases;
            if (type === 'combine') {
                bearTake = `${pickRandom(phrases)} Combine numbers are great, but they don't tell the full story. I need to see the game tape. Production matters more than any 40 time.`;
            } else if (type === 'projection') {
                bearTake = `${pickRandom(phrases)} The fit looks good on paper, but there are scheme concerns. This team has other holes to fill first. Don't force a pick based on name recognition.`;
            } else {
                bearTake = `${pickRandom(phrases)} Let's not overreact. This changes the calculus slightly, but the fundamentals of the evaluation remain the same.`;
            }
        }

        if (!verdict) {
            verdict = 'Both sides make compelling points. The P.A.I. score remains the ultimate arbiter — personality is the wrapper, the formula is the truth.';
        }

        return NextResponse.json({
            debate: {
                topic: headline,
                bull: {
                    analyst: bullAnalyst.name,
                    angId: bullAnalyst.angId,
                    avatar: bullAnalyst.avatar,
                    style: bullAnalyst.style,
                    take: bullTake,
                },
                bear: {
                    analyst: bearAnalyst.name,
                    angId: bearAnalyst.angId,
                    avatar: bearAnalyst.avatar,
                    style: bearAnalyst.style,
                    take: bearTake,
                },
                verdict,
                mediator: 'Chicken Hawk',
                timestamp: new Date().toISOString(),
            },
        });
    } catch (err) {
        console.error('[Debate API]', err);
        return NextResponse.json({ error: 'Failed to generate debate' }, { status: 500 });
    }
}
