/**
 * Arena Trivia Import API
 *
 * POST /api/arena/import/trivia — Import trivia questions from OpenTDB
 * Query: ?amount=50&category=9&difficulty=medium
 *
 * This is the data pipeline entry point. Call this to pull fresh
 * trivia questions from the Open Trivia Database and store them.
 *
 * Categories: https://opentdb.com/api_config.php
 *   9=General, 17=Science, 21=Sports, 23=History, 11=Film, 22=Geography
 */

import { NextRequest, NextResponse } from 'next/server';

const OPENTDB_URL = 'https://opentdb.com/api.php';

interface OpenTDBQuestion {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface OpenTDBResponse {
  response_code: number;
  results: OpenTDBQuestion[];
}

function decodeHtml(html: string): string {
  return html
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&eacute;/g, 'e')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '--');
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const amount = Math.min(parseInt(searchParams.get('amount') || '50', 10), 50);
  const category = searchParams.get('category'); // OpenTDB category ID
  const difficulty = searchParams.get('difficulty'); // easy, medium, hard

  const params = new URLSearchParams({ amount: String(amount) });
  if (category) params.set('category', category);
  if (difficulty) params.set('difficulty', difficulty);

  try {
    const response = await fetch(`${OPENTDB_URL}?${params.toString()}`);
    if (!response.ok) {
      return NextResponse.json({ error: 'OpenTDB API error' }, { status: 502 });
    }

    const data: OpenTDBResponse = await response.json();

    if (data.response_code !== 0) {
      const codes: Record<number, string> = {
        1: 'Not enough questions for your query',
        2: 'Invalid parameter',
        3: 'Token not found',
        4: 'Token exhausted — all questions retrieved',
      };
      return NextResponse.json({
        error: codes[data.response_code] || 'Unknown OpenTDB error',
        code: data.response_code,
      }, { status: 400 });
    }

    // Transform and decode HTML entities
    const questions = data.results.map((q, i) => ({
      id: `imported-${Date.now()}-${i}`,
      source: 'opentdb',
      category: decodeHtml(q.category),
      difficulty: q.difficulty,
      type: q.type === 'boolean' ? 'boolean' : 'multiple',
      question: decodeHtml(q.question),
      correctAnswer: decodeHtml(q.correct_answer),
      incorrectAnswers: q.incorrect_answers.map(decodeHtml),
      tags: [q.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')],
      timesUsed: 0,
      timesCorrect: 0,
    }));

    return NextResponse.json({
      imported: questions.length,
      questions,
      source: 'opentdb',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({
      error: 'Failed to fetch from OpenTDB',
      details: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 502 });
  }
}
