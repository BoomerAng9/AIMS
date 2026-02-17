/**
 * Arena Contest Generator API
 *
 * POST /api/arena/generate — Auto-generate daily contests
 *
 * This is the autonomous contest creation engine.
 * Call this endpoint (via cron or manually) to generate the daily contest slate.
 *
 * Flow:
 * 1. Pulls fresh trivia from OpenTDB
 * 2. Pulls prospect data from Per|Form
 * 3. Generates a mix of contest types
 * 4. Returns the generated contests ready for insertion
 *
 * Designed to run autonomously via:
 *   - n8n scheduled workflow
 *   - cron job: curl -X POST https://plugmein.cloud/api/arena/generate
 *   - Manual trigger from admin dashboard
 */

import { NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface GeneratedContest {
  title: string;
  description: string;
  type: string;
  category: string;
  entryFee: number;
  maxEntries: number;
  difficulty: string;
  featured: boolean;
  startsAt: string;
  endsAt: string;
  contestData: Record<string, unknown>;
  prizeStructure: Record<string, number>;
}

export async function POST() {
  const now = new Date();
  const generated: GeneratedContest[] = [];
  const errors: string[] = [];

  // ── 1. Generate Daily Trivia Blitz (Free) ──────────────────
  try {
    const triviaRes = await fetch(`${APP_URL}/api/arena/import/trivia?amount=5&difficulty=easy`, {
      method: 'POST',
    });
    if (triviaRes.ok) {
      const triviaData = await triviaRes.json();
      const startsAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 min from now
      const endsAt = new Date(startsAt.getTime() + 4 * 60 * 60 * 1000); // 4 hours

      generated.push({
        title: `Free Trivia: ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(now)}`,
        description: 'Free daily trivia — earn XP and warm up for paid contests. No entry fee, just knowledge.',
        type: 'TRIVIA',
        category: 'MIXED',
        entryFee: 0,
        maxEntries: 500,
        difficulty: 'EASY',
        featured: true,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        contestData: {
          timeLimit: 20,
          rules: ['5 questions', '20 seconds each', 'Free entry', 'Earn 50 XP'],
          questions: triviaData.questions || [],
        },
        prizeStructure: {},
      });
    }
  } catch (e) {
    errors.push(`Free trivia generation failed: ${e instanceof Error ? e.message : 'unknown'}`);
  }

  // ── 2. Generate $5 Trivia Contest ──────────────────────────
  try {
    const triviaRes = await fetch(`${APP_URL}/api/arena/import/trivia?amount=10&difficulty=medium`, {
      method: 'POST',
    });
    if (triviaRes.ok) {
      const triviaData = await triviaRes.json();
      const startsAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const endsAt = new Date(startsAt.getTime() + 3 * 60 * 60 * 1000);

      generated.push({
        title: `Trivia Blitz: $5 Entry`,
        description: '10 rapid-fire questions. Top 3 split the pot. Speed counts.',
        type: 'TRIVIA',
        category: 'MIXED',
        entryFee: 5,
        maxEntries: 50,
        difficulty: 'MEDIUM',
        featured: true,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        contestData: {
          timeLimit: 15,
          rules: ['10 questions', '15 seconds each', '$5 entry', 'Top 3 win'],
          questions: triviaData.questions || [],
        },
        prizeStructure: { '1': 50, '2': 30, '3': 20 },
      });
    }
  } catch (e) {
    errors.push(`$5 trivia generation failed: ${e instanceof Error ? e.message : 'unknown'}`);
  }

  // ── 3. Generate $10 Trivia Contest ─────────────────────────
  try {
    const triviaRes = await fetch(`${APP_URL}/api/arena/import/trivia?amount=15&difficulty=hard`, {
      method: 'POST',
    });
    if (triviaRes.ok) {
      const triviaData = await triviaRes.json();
      const startsAt = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      const endsAt = new Date(startsAt.getTime() + 4 * 60 * 60 * 1000);

      generated.push({
        title: `Brain Brawl: $10 Entry`,
        description: '15 hard questions. Higher stakes, bigger prizes. Prove you are the smartest in the room.',
        type: 'TRIVIA',
        category: 'MIXED',
        entryFee: 10,
        maxEntries: 100,
        difficulty: 'HARD',
        featured: false,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        contestData: {
          timeLimit: 15,
          rules: ['15 questions', '15 seconds each', '$10 entry', 'Top 5 win'],
          questions: triviaData.questions || [],
        },
        prizeStructure: { '1': 35, '2': 25, '3': 20, '4': 12, '5': 8 },
      });
    }
  } catch (e) {
    errors.push(`$10 trivia generation failed: ${e instanceof Error ? e.message : 'unknown'}`);
  }

  // ── 4. Generate Prospect Rank Contest ──────────────────────
  try {
    const prospectsRes = await fetch(`${APP_URL}/api/perform/prospects`);
    if (prospectsRes.ok) {
      const prospects = await prospectsRes.json();
      if (Array.isArray(prospects) && prospects.length >= 5) {
        const top5 = prospects.slice(0, 5);
        const startsAt = new Date(now.getTime() + 6 * 60 * 60 * 1000);
        const endsAt = new Date(startsAt.getTime() + 18 * 60 * 60 * 1000);

        generated.push({
          title: `Per|Form Rank Challenge`,
          description: "Rank today's top 5 prospects by P.A.I. score. Perfect rank = jackpot.",
          type: 'PROSPECT_RANK',
          category: 'SPORTS',
          entryFee: 10,
          maxEntries: 100,
          difficulty: 'HARD',
          featured: true,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          contestData: {
            rules: ['Rank 5 prospects by P.A.I. score', 'Exact = 10pts', 'Off by 1 = 5pts', 'Off by 2 = 2pts'],
            prospectRanks: [{
              id: `pr-${Date.now()}`,
              prompt: 'Rank these prospects by their Per|Form P.A.I. score (highest to lowest)',
              prospects: top5.map((p: { id: string; name: string; position: string; school: string }) => ({
                id: p.id,
                name: p.name,
                position: p.position,
                school: p.school,
              })),
              correctOrder: top5.map((p: { id: string }) => p.id),
            }],
          },
          prizeStructure: { '1': 40, '2': 25, '3': 15, '4': 12, '5': 8 },
        });
      }
    }
  } catch (e) {
    errors.push(`Prospect rank generation failed: ${e instanceof Error ? e.message : 'unknown'}`);
  }

  // ── 5. Generate Streak Challenge (Free, Sponsored) ─────────
  try {
    const triviaRes = await fetch(`${APP_URL}/api/arena/import/trivia?amount=10`, {
      method: 'POST',
    });
    if (triviaRes.ok) {
      const triviaData = await triviaRes.json();
      const startsAt = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      const endsAt = new Date(startsAt.getTime() + 12 * 60 * 60 * 1000);

      generated.push({
        title: 'The Streak: 10-for-10 Challenge',
        description: 'Answer 10 in a row correctly. Miss one = eliminated. Last one standing wins $50. Free entry.',
        type: 'STREAK',
        category: 'MIXED',
        entryFee: 0,
        maxEntries: 1000,
        difficulty: 'MEDIUM',
        featured: false,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        contestData: {
          timeLimit: 10,
          rules: ['10 questions', 'One wrong = out', 'Free entry', '$50 prize'],
          questions: triviaData.questions || [],
        },
        prizeStructure: { '1': 100 },
      });
    }
  } catch (e) {
    errors.push(`Streak generation failed: ${e instanceof Error ? e.message : 'unknown'}`);
  }

  return NextResponse.json({
    generated: generated.length,
    contests: generated,
    errors: errors.length > 0 ? errors : undefined,
    generatedAt: now.toISOString(),
    nextRun: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  });
}
