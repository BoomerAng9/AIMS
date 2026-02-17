'use client';

/**
 * Arena Contest Detail & Entry Page
 *
 * Full contest view with:
 * - Contest info, rules, prize structure
 * - Live entry form (trivia answers, picks, rankings)
 * - Current standings
 * - Entry confirmation flow
 */

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Trophy, Clock, Users, ArrowLeft, Check, X, ChevronRight,
  AlertCircle, Zap, Lock, Award, Star,
} from 'lucide-react';
import type { ArenaContest, TriviaQuestionData } from '@/lib/arena/types';
import {
  CONTEST_TYPE_STYLES, STATUS_STYLES, DIFFICULTY_STYLES,
  formatCurrency, getTimeRemaining,
} from '@/lib/arena/types';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function ContestDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [contest, setContest] = useState<ArenaContest | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'info' | 'playing' | 'results'>('info');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    fetch(`/api/arena/contests/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setContest(null);
        } else {
          setContest(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || !contest?.contestData?.timeLimit) return;
    setTimeLeft(contest.contestData.timeLimit);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAnswer('');
          return contest.contestData.timeLimit || 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentQuestion]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-xs text-white/30 mt-4 font-mono">Loading contest...</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <AlertCircle size={40} className="text-white/20 mx-auto mb-4" />
        <h2 className="text-xl font-display text-white mb-2">Contest Not Found</h2>
        <p className="text-sm text-white/40 mb-6">This contest may have ended or doesn't exist.</p>
        <Link href="/arena" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold/10 border border-gold/20 text-gold text-sm">
          <ArrowLeft size={14} /> Back to Lobby
        </Link>
      </div>
    );
  }

  const typeStyle = CONTEST_TYPE_STYLES[contest.type];
  const statusStyle = STATUS_STYLES[contest.status];
  const diffStyle = DIFFICULTY_STYLES[contest.difficulty];
  const questions = contest.contestData.questions || [];
  const totalQuestions = questions.length;
  const prizeEntries = Object.entries(contest.prizeStructure);

  function handleStartContest() {
    setPhase('playing');
    setCurrentQuestion(0);
    setAnswers([]);
    setScore(0);
  }

  function handleAnswer(answer: string) {
    const q = questions[currentQuestion];
    const isCorrect = q && answer === q.correctAnswer;
    const newScore = score + (isCorrect ? 100 : 0);
    const newAnswers = [...answers, answer];

    setScore(newScore);
    setAnswers(newAnswers);

    if (currentQuestion + 1 >= totalQuestions) {
      setPhase('results');
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  }

  // ── INFO PHASE ─────────────────────────────────────────
  if (phase === 'info') {
    return (
      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Back Link */}
        <motion.div variants={fadeUp}>
          <Link href="/arena" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-gold transition-colors">
            <ArrowLeft size={14} /> Back to Lobby
          </Link>
        </motion.div>

        {/* Contest Header */}
        <motion.div variants={fadeUp} className={`wireframe-card rounded-3xl p-8 md:p-10 ${typeStyle.glow}`}>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${typeStyle.bg} ${typeStyle.border} border ${typeStyle.color} text-sm font-display font-bold`}>
                {typeStyle.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[0.55rem] font-mono uppercase tracking-wider ${typeStyle.color}`}>{typeStyle.label}</span>
                  <span className="text-white/10">/</span>
                  <span className={`text-[0.55rem] font-mono ${diffStyle.color}`}>{diffStyle.label}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-display text-white tracking-tight">{contest.title}</h1>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${statusStyle.bg}`}>
              {statusStyle.pulse && <span className={`h-2 w-2 rounded-full ${statusStyle.color.replace('text-', 'bg-')} animate-pulse`} />}
              <span className={`text-xs font-mono ${statusStyle.color}`}>{statusStyle.label}</span>
            </div>
          </div>

          <p className="text-sm text-white/40 leading-relaxed max-w-2xl mb-8">{contest.description}</p>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <p className="text-xl font-display text-gold">{contest.entryFee === 0 ? 'FREE' : formatCurrency(contest.entryFee)}</p>
              <p className="text-[0.5rem] font-mono text-white/25 uppercase mt-1">Entry Fee</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <p className="text-xl font-display text-emerald-400">{contest.prizePool > 0 ? formatCurrency(contest.prizePool) : 'Grows'}</p>
              <p className="text-[0.5rem] font-mono text-white/25 uppercase mt-1">Prize Pool</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <p className="text-xl font-display text-white/60">{contest.currentEntries}/{contest.maxEntries}</p>
              <p className="text-[0.5rem] font-mono text-white/25 uppercase mt-1">Entries</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <p className="text-xl font-display text-blue-400">{getTimeRemaining(contest.status === 'LIVE' ? contest.endsAt : contest.startsAt)}</p>
              <p className="text-[0.5rem] font-mono text-white/25 uppercase mt-1">{contest.status === 'LIVE' ? 'Ends In' : 'Starts In'}</p>
            </div>
          </div>

          {/* Enter Button */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {contest.status === 'LIVE' && questions.length > 0 ? (
              <button
                onClick={handleStartContest}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gold/10 border-2 border-gold/30 text-gold text-sm font-display font-medium hover:bg-gold/20 hover:border-gold/50 transition-all animate-pulse-gold"
              >
                <Zap size={18} />
                Enter Contest
              </button>
            ) : contest.status === 'UPCOMING' ? (
              <button
                disabled
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-400/10 border border-blue-400/20 text-blue-400 text-sm font-display opacity-60 cursor-not-allowed"
              >
                <Clock size={18} />
                Opens in {getTimeRemaining(contest.startsAt)}
              </button>
            ) : (
              <button
                disabled
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white/30 text-sm font-display cursor-not-allowed"
              >
                <Lock size={18} />
                Contest Ended
              </button>
            )}
            {contest.entryFee > 0 && (
              <p className="text-[0.6rem] text-white/25 font-mono">
                {formatCurrency(contest.entryFee)} will be deducted from your wallet upon entry
              </p>
            )}
          </div>
        </motion.div>

        {/* Rules & Prizes Side by Side */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Rules */}
          <motion.div variants={fadeUp} className="wireframe-card rounded-2xl p-6">
            <h2 className="text-xs uppercase tracking-widest text-white/30 font-mono mb-4">Rules</h2>
            <ul className="space-y-2">
              {(contest.contestData.rules || []).map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/50">
                  <ChevronRight size={12} className="text-gold/40 mt-0.5 flex-shrink-0" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
            {totalQuestions > 0 && (
              <p className="text-[0.55rem] font-mono text-white/20 mt-4 pt-3 border-t border-white/[0.04]">
                {totalQuestions} questions &middot; {contest.contestData.timeLimit || 15}s per question
              </p>
            )}
          </motion.div>

          {/* Prize Structure */}
          <motion.div variants={fadeUp} className="wireframe-card rounded-2xl p-6">
            <h2 className="text-xs uppercase tracking-widest text-white/30 font-mono mb-4">Prizes</h2>
            {prizeEntries.length > 0 ? (
              <div className="space-y-2">
                {prizeEntries.map(([place, pct]) => (
                  <div key={place} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      {place === '1' && <Trophy size={14} className="text-gold" />}
                      {place === '2' && <Award size={14} className="text-zinc-300" />}
                      {place === '3' && <Award size={14} className="text-amber-600" />}
                      {Number(place) > 3 && <Star size={14} className="text-white/20" />}
                      <span className="text-sm text-white/60 font-mono">
                        {place === '1' ? '1st' : place === '2' ? '2nd' : place === '3' ? '3rd' : `${place}th`}
                      </span>
                    </div>
                    <span className="text-sm font-display text-gold">{pct}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-400/5 border border-amber-400/10">
                <Award size={20} className="text-amber-400" />
                <div>
                  <p className="text-sm text-amber-400 font-medium">XP Reward</p>
                  <p className="text-[0.6rem] text-white/30">Earn XP and climb the leaderboard</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // ── PLAYING PHASE ──────────────────────────────────────
  if (phase === 'playing') {
    const q: TriviaQuestionData | undefined = questions[currentQuestion];
    if (!q) {
      setPhase('results');
      return null;
    }

    const allAnswers = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5);
    const progress = ((currentQuestion) / totalQuestions) * 100;

    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[0.55rem] font-mono text-white/30">
            <span>Question {currentQuestion + 1} of {totalQuestions}</span>
            <span className="text-gold">{score} pts</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-gold/40 to-gold/70 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Timer */}
        <div className="flex justify-center">
          <div className={`flex items-center justify-center h-16 w-16 rounded-full border-2 ${
            timeLeft > 5 ? 'border-gold/30 text-gold' : 'border-red-400/30 text-red-400 animate-pulse'
          }`}>
            <span className="text-2xl font-display">{timeLeft}</span>
          </div>
        </div>

        {/* Question */}
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="wireframe-card rounded-2xl p-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-[0.5rem] font-mono uppercase tracking-wider ${DIFFICULTY_STYLES[q.difficulty.toUpperCase() as keyof typeof DIFFICULTY_STYLES]?.color || 'text-white/30'}`}>
              {q.difficulty}
            </span>
            <span className="text-white/10">/</span>
            <span className="text-[0.5rem] font-mono text-white/30">{q.category}</span>
          </div>

          <h2 className="text-lg md:text-xl text-white font-medium leading-relaxed mb-8">
            {q.question}
          </h2>

          <div className="grid gap-3">
            {allAnswers.map((answer, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(answer)}
                className="w-full text-left px-5 py-4 rounded-xl border border-white/10 bg-white/[0.02] text-sm text-white/70 hover:bg-gold/5 hover:border-gold/20 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-[0.6rem] font-mono text-white/30 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{answer}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── RESULTS PHASE ──────────────────────────────────────
  const correctCount = answers.filter((a, i) => questions[i] && a === questions[i].correctAnswer).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="max-w-2xl mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Score Card */}
      <motion.div variants={fadeUp} className="wireframe-card rounded-3xl p-8 md:p-10 text-center shadow-[0_0_40px_rgba(212,175,55,0.08)]">
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/10 border-2 border-gold/20">
            <Trophy size={36} className="text-gold" />
          </div>
        </div>
        <h2 className="text-3xl font-display text-white mb-2">Contest Complete!</h2>
        <p className="text-white/40 text-sm mb-8">{contest.title}</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-3xl font-display text-gold">{score}</p>
            <p className="text-[0.5rem] font-mono text-white/25 uppercase mt-1">Points</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-3xl font-display text-emerald-400">{correctCount}/{totalQuestions}</p>
            <p className="text-[0.5rem] font-mono text-white/25 uppercase mt-1">Correct</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-3xl font-display text-blue-400">{accuracy}%</p>
            <p className="text-[0.5rem] font-mono text-white/25 uppercase mt-1">Accuracy</p>
          </div>
        </div>

        {/* Answer Review */}
        <div className="text-left space-y-2 mb-8">
          <h3 className="text-[0.6rem] font-mono uppercase tracking-wider text-white/25 mb-3">Answer Review</h3>
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.correctAnswer;
            return (
              <div key={q.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isCorrect ? 'bg-emerald-400/5' : 'bg-red-400/5'}`}>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${isCorrect ? 'bg-emerald-400/20 text-emerald-400' : 'bg-red-400/20 text-red-400'}`}>
                  {isCorrect ? <Check size={12} /> : <X size={12} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/50 truncate">{q.question}</p>
                  {!isCorrect && (
                    <p className="text-[0.55rem] text-emerald-400/60 mt-0.5">Correct: {q.correctAnswer}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/arena"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gold/10 border border-gold/20 text-gold text-sm font-medium hover:bg-gold/20 transition-all"
          >
            <Trophy size={16} />
            Back to Lobby
          </Link>
          <Link
            href="/arena/leaderboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 transition-all"
          >
            View Leaderboard
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
