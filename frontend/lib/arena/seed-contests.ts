/**
 * The Arena — Seed Contests
 *
 * Curated contest data for when the autonomous pipeline is offline.
 * These seed contests demonstrate all contest types and serve as
 * the initial experience for early access users.
 */

import type { ArenaContest, ArenaPlayer, LeaderboardEntry } from './types';

// ─────────────────────────────────────────────────────────────
// Seed Contests — Live Today
// ─────────────────────────────────────────────────────────────

const now = new Date();
const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
const in4h = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
const in8h = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString();
const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

export const SEED_CONTESTS: ArenaContest[] = [
  {
    id: 'contest-001',
    slug: 'daily-trivia-blitz',
    title: 'Daily Trivia Blitz',
    description: '10 rapid-fire questions across all categories. Top 3 split the pot. Speed matters — faster correct answers earn bonus points.',
    type: 'TRIVIA',
    category: 'MIXED',
    status: 'LIVE',
    entryFee: 5,
    prizePool: 42.50,
    rakePercent: 15,
    maxEntries: 50,
    minEntries: 5,
    currentEntries: 23,
    startsAt: now.toISOString(),
    endsAt: in2h,
    contestData: {
      timeLimit: 15,
      rules: ['10 questions', '15 seconds per question', 'Speed bonus for fast answers', 'No re-entry'],
      questions: [
        { id: 'q1', category: 'Science', difficulty: 'medium', question: 'What is the chemical symbol for gold?', correctAnswer: 'Au', incorrectAnswers: ['Ag', 'Fe', 'Gd'], type: 'multiple' },
        { id: 'q2', category: 'Sports', difficulty: 'medium', question: 'Which NFL team has won the most Super Bowls?', correctAnswer: 'New England Patriots & Pittsburgh Steelers (tied at 6)', incorrectAnswers: ['Dallas Cowboys', 'San Francisco 49ers', 'Green Bay Packers'], type: 'multiple' },
        { id: 'q3', category: 'History', difficulty: 'hard', question: 'In what year was the first email sent?', correctAnswer: '1971', incorrectAnswers: ['1969', '1975', '1983'], type: 'multiple' },
        { id: 'q4', category: 'Entertainment', difficulty: 'easy', question: 'Who directed "The Dark Knight"?', correctAnswer: 'Christopher Nolan', incorrectAnswers: ['Zack Snyder', 'Tim Burton', 'Matt Reeves'], type: 'multiple' },
        { id: 'q5', category: 'Geography', difficulty: 'medium', question: 'What is the smallest country in the world by area?', correctAnswer: 'Vatican City', incorrectAnswers: ['Monaco', 'San Marino', 'Liechtenstein'], type: 'multiple' },
        { id: 'q6', category: 'Science', difficulty: 'hard', question: 'What is the half-life of Carbon-14?', correctAnswer: '5,730 years', incorrectAnswers: ['1,200 years', '10,000 years', '3,800 years'], type: 'multiple' },
        { id: 'q7', category: 'Sports', difficulty: 'easy', question: 'How many players are on a basketball team on the court at one time?', correctAnswer: '5', incorrectAnswers: ['4', '6', '7'], type: 'multiple' },
        { id: 'q8', category: 'Technology', difficulty: 'medium', question: 'What year was the iPhone first released?', correctAnswer: '2007', incorrectAnswers: ['2005', '2008', '2006'], type: 'multiple' },
        { id: 'q9', category: 'Literature', difficulty: 'hard', question: 'Who wrote "One Hundred Years of Solitude"?', correctAnswer: 'Gabriel Garcia Marquez', incorrectAnswers: ['Jorge Luis Borges', 'Pablo Neruda', 'Isabel Allende'], type: 'multiple' },
        { id: 'q10', category: 'Science', difficulty: 'medium', question: 'What planet has the most moons in our solar system?', correctAnswer: 'Saturn', incorrectAnswers: ['Jupiter', 'Uranus', 'Neptune'], type: 'multiple' },
      ],
    },
    prizeStructure: { '1': 50, '2': 30, '3': 20 },
    generatedBy: 'SYSTEM',
    difficulty: 'MEDIUM',
    featured: true,
  },
  {
    id: 'contest-002',
    slug: 'prospect-showdown-qb-edition',
    title: "Prospect Showdown: QB Edition",
    description: "Rank the top 5 QBs in the 2026 class by their P.A.I. score. Perfect match = jackpot. Powered by Per|Form scouting data.",
    type: 'PROSPECT_RANK',
    category: 'SPORTS',
    status: 'UPCOMING',
    entryFee: 10,
    prizePool: 0,
    rakePercent: 15,
    maxEntries: 100,
    minEntries: 10,
    currentEntries: 0,
    startsAt: in4h,
    endsAt: in24h,
    contestData: {
      rules: ['Rank 5 QBs by P.A.I. score', 'Exact match = 10 pts', 'Off by 1 = 5 pts', 'Off by 2 = 2 pts', 'Per|Form data reveals at contest end'],
      prospectRanks: [
        {
          id: 'pr1',
          prompt: 'Rank these QBs by their Per|Form P.A.I. score (highest to lowest)',
          prospects: [
            { id: 'ath-009', name: 'Cameron Price', position: 'QB', school: 'IMG Academy' },
            { id: 'ath-001', name: 'Marcus Johnson', position: 'QB', school: 'Oakwood HS' },
            { id: 'ath-011', name: 'Tyrell Davis', position: 'QB', school: 'Bishop Gorman' },
            { id: 'ath-012', name: 'Jake Morrison', position: 'QB', school: 'Katy HS' },
            { id: 'ath-013', name: 'Darius Webb', position: 'QB', school: 'St. Thomas Aquinas' },
          ],
          correctOrder: ['ath-009', 'ath-001', 'ath-011', 'ath-013', 'ath-012'],
        },
      ],
    },
    prizeStructure: { '1': 40, '2': 25, '3': 15, '4': 10, '5': 10 },
    generatedBy: 'SYSTEM',
    difficulty: 'HARD',
    featured: true,
  },
  {
    id: 'contest-003',
    slug: 'nba-pickem-tonight',
    title: "NBA Pick'em: Tonight's Slate",
    description: "Pick winners for tonight's NBA games against the spread. Best record takes the pot.",
    type: 'PICKEM',
    category: 'SPORTS',
    status: 'UPCOMING',
    entryFee: 10,
    prizePool: 0,
    rakePercent: 15,
    maxEntries: 200,
    minEntries: 10,
    currentEntries: 0,
    startsAt: in8h,
    endsAt: in24h,
    contestData: {
      rules: ['Pick ATS for each game', '1 point per correct pick', 'Tiebreaker: total points in final game'],
      picks: [
        { id: 'pick1', type: 'SPREAD', prompt: 'Lakers (-3.5) vs Celtics', optionA: 'Lakers -3.5', optionB: 'Celtics +3.5' },
        { id: 'pick2', type: 'SPREAD', prompt: 'Warriors (-1.5) vs Nuggets', optionA: 'Warriors -1.5', optionB: 'Nuggets +1.5' },
        { id: 'pick3', type: 'SPREAD', prompt: 'Bucks (-5) vs Heat', optionA: 'Bucks -5', optionB: 'Heat +5' },
        { id: 'pick4', type: 'SPREAD', prompt: '76ers (-2) vs Knicks', optionA: '76ers -2', optionB: 'Knicks +2' },
        { id: 'pick5', type: 'OVER_UNDER', prompt: 'Lakers vs Celtics Total', optionA: 'Over 224.5', optionB: 'Under 224.5' },
      ],
    },
    prizeStructure: { '1': 50, '2': 30, '3': 20 },
    generatedBy: 'SYSTEM',
    difficulty: 'MEDIUM',
    featured: false,
  },
  {
    id: 'contest-004',
    slug: 'free-sports-trivia',
    title: 'Free Play: Sports Trivia',
    description: 'No entry fee — just bragging rights and XP. Perfect for warming up before the paid contests.',
    type: 'TRIVIA',
    category: 'SPORTS',
    status: 'LIVE',
    entryFee: 0,
    prizePool: 0,
    rakePercent: 0,
    maxEntries: 500,
    minEntries: 1,
    currentEntries: 87,
    startsAt: now.toISOString(),
    endsAt: in8h,
    contestData: {
      timeLimit: 20,
      rules: ['5 questions', '20 seconds each', 'Free entry', 'Earn 50 XP for participating, 200 XP for top 10'],
      questions: [
        { id: 'sq1', category: 'Sports', difficulty: 'easy', question: 'How many rings does Michael Jordan have?', correctAnswer: '6', incorrectAnswers: ['5', '7', '4'], type: 'multiple' },
        { id: 'sq2', category: 'Sports', difficulty: 'medium', question: 'Who holds the NFL record for most career passing yards?', correctAnswer: 'Tom Brady', incorrectAnswers: ['Drew Brees', 'Peyton Manning', 'Brett Favre'], type: 'multiple' },
        { id: 'sq3', category: 'Sports', difficulty: 'medium', question: 'What college did Patrick Mahomes attend?', correctAnswer: 'Texas Tech', incorrectAnswers: ['Texas A&M', 'Oklahoma', 'Clemson'], type: 'multiple' },
        { id: 'sq4', category: 'Sports', difficulty: 'hard', question: 'Who was the #1 overall pick in the 2003 NBA Draft?', correctAnswer: 'LeBron James', incorrectAnswers: ['Carmelo Anthony', 'Dwyane Wade', 'Chris Bosh'], type: 'multiple' },
        { id: 'sq5', category: 'Sports', difficulty: 'easy', question: 'How many periods are in a regulation hockey game?', correctAnswer: '3', incorrectAnswers: ['2', '4', '5'], type: 'multiple' },
      ],
    },
    prizeStructure: {},
    generatedBy: 'SYSTEM',
    difficulty: 'EASY',
    featured: true,
  },
  {
    id: 'contest-005',
    slug: 'mega-trivia-championship',
    title: 'Mega Trivia Championship',
    description: '25 questions, $25 entry, massive prize pool. Expert difficulty. Only the sharpest minds survive. Weekly flagship event.',
    type: 'TRIVIA',
    category: 'MIXED',
    status: 'UPCOMING',
    entryFee: 25,
    prizePool: 0,
    rakePercent: 15,
    maxEntries: 200,
    minEntries: 20,
    currentEntries: 0,
    startsAt: in24h,
    endsAt: in48h,
    contestData: {
      timeLimit: 20,
      rules: ['25 questions', '20 seconds each', 'Expert difficulty', 'Top 5 paid', '$25 entry', 'Minimum 20 players'],
      questions: [],
    },
    prizeStructure: { '1': 35, '2': 25, '3': 20, '4': 12, '5': 8 },
    generatedBy: 'SYSTEM',
    difficulty: 'EXPERT',
    featured: true,
  },
  {
    id: 'contest-006',
    slug: 'streak-challenge',
    title: 'The Streak: Can You Go 10-for-10?',
    description: 'Answer 10 questions in a row correctly. Miss one and you are out. Last person standing wins. Free entry, $50 prize.',
    type: 'STREAK',
    category: 'MIXED',
    status: 'UPCOMING',
    entryFee: 0,
    prizePool: 50,
    rakePercent: 0,
    maxEntries: 1000,
    minEntries: 10,
    currentEntries: 0,
    startsAt: in4h,
    endsAt: in24h,
    contestData: {
      timeLimit: 10,
      rules: ['10 questions, increasing difficulty', 'One wrong answer = eliminated', 'Last standing wins $50', 'Free entry', 'Sponsored by Per|Form'],
      questions: [],
    },
    prizeStructure: { '1': 100 },
    generatedBy: 'SYSTEM',
    difficulty: 'HARD',
    featured: false,
  },
];

// ─────────────────────────────────────────────────────────────
// Seed Leaderboard
// ─────────────────────────────────────────────────────────────

export const SEED_PLAYERS: ArenaPlayer[] = [
  { id: 'player-001', userId: 'u1', displayName: 'VibeMaster', tier: 'VETERAN', xp: 3200, level: 33, winCount: 28, totalContests: 65, winRate: 43.1, streak: 5, bestStreak: 12 },
  { id: 'player-002', userId: 'u2', displayName: 'GridironGuru', tier: 'ELITE', xp: 7800, level: 79, winCount: 64, totalContests: 120, winRate: 53.3, streak: 3, bestStreak: 18 },
  { id: 'player-003', userId: 'u3', displayName: 'TriviaKing99', tier: 'VETERAN', xp: 2900, level: 30, winCount: 22, totalContests: 48, winRate: 45.8, streak: 0, bestStreak: 9 },
  { id: 'player-004', userId: 'u4', displayName: 'ScoutSniper', tier: 'CONTENDER', xp: 1200, level: 13, winCount: 8, totalContests: 25, winRate: 32.0, streak: 2, bestStreak: 6 },
  { id: 'player-005', userId: 'u5', displayName: 'PickEmPro', tier: 'ELITE', xp: 6500, level: 66, winCount: 55, totalContests: 100, winRate: 55.0, streak: 8, bestStreak: 15 },
  { id: 'player-006', userId: 'u6', displayName: 'BullHawkFan', tier: 'CONTENDER', xp: 800, level: 9, winCount: 5, totalContests: 18, winRate: 27.8, streak: 1, bestStreak: 4 },
  { id: 'player-007', userId: 'u7', displayName: 'AetherRising', tier: 'VETERAN', xp: 3800, level: 39, winCount: 35, totalContests: 72, winRate: 48.6, streak: 4, bestStreak: 11 },
  { id: 'player-008', userId: 'u8', displayName: 'NebulaBrain', tier: 'LEGEND', xp: 18500, level: 186, winCount: 142, totalContests: 280, winRate: 50.7, streak: 12, bestStreak: 25 },
  { id: 'player-009', userId: 'u9', displayName: 'ChickenHawkJr', tier: 'CONTENDER', xp: 600, level: 7, winCount: 3, totalContests: 12, winRate: 25.0, streak: 0, bestStreak: 3 },
  { id: 'player-010', userId: 'u10', displayName: 'PAI_Prophet', tier: 'VETERAN', xp: 4200, level: 43, winCount: 38, totalContests: 80, winRate: 47.5, streak: 6, bestStreak: 14 },
];

export const SEED_LEADERBOARD: Omit<LeaderboardEntry, 'player'>[] = SEED_PLAYERS
  .sort((a, b) => b.winRate - a.winRate)
  .map((p, i) => ({
    id: `lb-${p.id}`,
    playerId: p.id,
    period: 'ALL_TIME' as const,
    periodKey: 'all',
    rank: i + 1,
    score: p.xp,
    wins: p.winCount,
    entries: p.totalContests,
    earnings: Math.round(p.winCount * 15.50 * 100) / 100,
    accuracy: p.winRate,
  }));
