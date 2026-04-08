/**
 * P2P Training Dojo — "The Standard"
 *
 * Peer-to-Peer training with AI-evaluated accreditation.
 * Users teach users. AI enforces "Black Belt" quality standards.
 *
 * Flow:
 *   1. SUBMIT    — Instructor submits curriculum (lesson plan, resources)
 *   2. EVALUATE  — AI evaluates against Black Belt standards
 *   3. CERTIFY   — Issue blockchain-backed "Boost Badges" for verified skills
 *   4. TRACK     — Learner progress tracking and feedback loops
 *   5. RANK      — Community leaderboards and expertise verification
 *
 * Badge tiers:
 *   White Belt  — Completed a course
 *   Blue Belt   — Passed assessment with 80%+
 *   Black Belt  — Created and taught a certified course
 *   Sensei      — 3+ Black Belt certifications with 4.5+ rating
 */

import { callLLM } from '../server.js';

// ─── Types ────────────────────────────────────────────────────────────────

export type BeltTier = 'white' | 'blue' | 'black' | 'sensei';

export interface Curriculum {
  id: string;
  instructorId: string;
  instructorName: string;
  title: string;
  description: string;
  domain: string;             // e.g., "marketing", "product", "engineering"
  lessons: Lesson[];
  assessment: Assessment;
  status: 'draft' | 'under_review' | 'certified' | 'rejected';
  certificationScore: number | null;  // 0-100
  evaluationNotes: string | null;
  createdAt: string;
  certifiedAt: string | null;
}

export interface Lesson {
  order: number;
  title: string;
  content: string;
  resources: string[];
  estimatedMinutes: number;
  learningObjectives: string[];
}

export interface Assessment {
  questions: AssessmentQuestion[];
  passingScore: number;       // percent needed to pass
}

export interface AssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'short_answer' | 'practical';
  question: string;
  options?: string[];
  correctAnswer?: string;
  rubric?: string;            // for practical/short_answer grading
  points: number;
}

export interface BoostBadge {
  badgeId: string;
  recipientId: string;
  recipientName: string;
  tier: BeltTier;
  domain: string;
  curriculumId: string;
  curriculumTitle: string;
  earnedAt: string;
  score: number;
  hash: string;               // SHA-256 for integrity verification
  verificationUrl: string;
}

export interface LearnerProgress {
  learnerId: string;
  curriculumId: string;
  lessonsCompleted: number[];
  assessmentScore: number | null;
  assessmentAttempts: number;
  badge: BoostBadge | null;
  startedAt: string;
  completedAt: string | null;
}

export interface CurriculumEvaluation {
  overallScore: number;       // 0-100
  passes: boolean;
  criteria: Array<{
    name: string;
    score: number;
    maxScore: number;
    feedback: string;
  }>;
  strengths: string[];
  improvements: string[];
  recommendation: string;
}

// ─── Black Belt Standards ─────────────────────────────────────────────────

const BLACK_BELT_CRITERIA = [
  { name: 'Content Depth', maxScore: 20, description: 'Does the curriculum go beyond surface level? Does it teach frameworks, not just facts?' },
  { name: 'Practical Application', maxScore: 20, description: 'Can a learner apply this to a real project immediately after completing?' },
  { name: 'Assessment Quality', maxScore: 15, description: 'Do the assessments actually test understanding, not just memorization?' },
  { name: 'Structure & Flow', maxScore: 15, description: 'Does the curriculum build logically? Does each lesson prepare you for the next?' },
  { name: 'Clarity & Accessibility', maxScore: 15, description: 'Is the language clear? Could someone without domain expertise follow along?' },
  { name: 'Resource Quality', maxScore: 10, description: 'Are the supplementary resources current, relevant, and actionable?' },
  { name: 'Originality', maxScore: 5, description: 'Does this bring a unique perspective or framework not found in generic tutorials?' },
];

// ─── Curriculum Evaluation ────────────────────────────────────────────────

export async function evaluateCurriculum(curriculum: Curriculum): Promise<CurriculumEvaluation> {
  const lessonsText = curriculum.lessons
    .map(l => `Lesson ${l.order}: "${l.title}" — Objectives: ${l.learningObjectives.join(', ')}. Content: ${l.content.slice(0, 300)}...`)
    .join('\n');

  const assessmentText = curriculum.assessment.questions
    .map(q => `Q: "${q.question}" (${q.type}, ${q.points}pts)`)
    .join('\n');

  const response = await callLLM(
    `You are a Boost|Bridge Curriculum Evaluator — "The Standard." You enforce Black Belt quality. Be fair but demanding. This isn't a participation trophy system. If the curriculum is mid, say it's mid. If it's top tier, give it flowers.

Evaluate against these criteria (output JSON):
${BLACK_BELT_CRITERIA.map(c => `- ${c.name} (max ${c.maxScore}): ${c.description}`).join('\n')}

Minimum 70/100 to certify. Be specific in feedback.`,
    `Evaluate this curriculum:

Title: "${curriculum.title}"
Domain: ${curriculum.domain}
Instructor: ${curriculum.instructorName}
Description: "${curriculum.description}"

LESSONS:
${lessonsText}

ASSESSMENT:
${assessmentText}

Output ONLY JSON:
{
  "criteria": [
    { "name": "criteria name", "score": number, "maxScore": number, "feedback": "specific feedback" }
  ],
  "strengths": ["what works well"],
  "improvements": ["what needs work"],
  "recommendation": "1-2 sentence final verdict"
}`,
  );

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const overallScore = parsed.criteria.reduce((sum: number, c: { score: number }) => sum + c.score, 0);
      return {
        overallScore,
        passes: overallScore >= 70,
        criteria: parsed.criteria,
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        recommendation: parsed.recommendation || '',
      };
    }
  } catch {
    // Fallback
  }

  return {
    overallScore: 0,
    passes: false,
    criteria: BLACK_BELT_CRITERIA.map(c => ({
      name: c.name,
      score: 0,
      maxScore: c.maxScore,
      feedback: 'Evaluation failed — please resubmit.',
    })),
    strengths: [],
    improvements: ['Evaluation could not be completed. Resubmit curriculum.'],
    recommendation: 'Unable to evaluate. Please try again.',
  };
}

// ─── Badge Issuance ───────────────────────────────────────────────────────

export async function issueBadge(
  recipientId: string,
  recipientName: string,
  tier: BeltTier,
  domain: string,
  curriculumId: string,
  curriculumTitle: string,
  score: number,
): Promise<BoostBadge> {
  const badgeId = `BADGE-${tier.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const earnedAt = new Date().toISOString();

  // Create integrity hash
  const payload = `${badgeId}:${recipientId}:${tier}:${domain}:${curriculumId}:${score}:${earnedAt}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    badgeId,
    recipientId,
    recipientName,
    tier,
    domain,
    curriculumId,
    curriculumTitle,
    earnedAt,
    score,
    hash,
    verificationUrl: `/api/badge/verify/${badgeId}`,
  };
}

// ─── Assessment Grading ───────────────────────────────────────────────────

export async function gradeAssessment(
  curriculum: Curriculum,
  answers: Array<{ questionId: string; answer: string }>,
): Promise<{ totalScore: number; maxScore: number; percent: number; passed: boolean; details: Array<{ questionId: string; earned: number; max: number; feedback: string }> }> {
  const details: Array<{ questionId: string; earned: number; max: number; feedback: string }> = [];

  for (const question of curriculum.assessment.questions) {
    const userAnswer = answers.find(a => a.questionId === question.id);
    if (!userAnswer) {
      details.push({ questionId: question.id, earned: 0, max: question.points, feedback: 'No answer submitted.' });
      continue;
    }

    if (question.type === 'multiple_choice') {
      const correct = userAnswer.answer === question.correctAnswer;
      details.push({
        questionId: question.id,
        earned: correct ? question.points : 0,
        max: question.points,
        feedback: correct ? 'Correct.' : `Incorrect. Expected: ${question.correctAnswer}`,
      });
    } else {
      // Use LLM for short_answer and practical grading
      const gradeResponse = await callLLM(
        `You are grading an assessment response. Be fair. Output JSON only: { "earned": number, "feedback": "brief explanation" }`,
        `Question: "${question.question}"
Rubric: "${question.rubric || 'Grade for accuracy, depth, and practical understanding.'}"
Max points: ${question.points}
Student answer: "${userAnswer.answer}"

Grade this response. Partial credit allowed.`,
      );

      try {
        const jsonMatch = gradeResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          details.push({
            questionId: question.id,
            earned: Math.min(parsed.earned || 0, question.points),
            max: question.points,
            feedback: parsed.feedback || '',
          });
          continue;
        }
      } catch {
        // Fallback
      }

      details.push({ questionId: question.id, earned: 0, max: question.points, feedback: 'Grading failed — manual review needed.' });
    }
  }

  const totalScore = details.reduce((sum, d) => sum + d.earned, 0);
  const maxScore = details.reduce((sum, d) => sum + d.max, 0);
  const percent = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return {
    totalScore,
    maxScore,
    percent: Math.round(percent),
    passed: percent >= curriculum.assessment.passingScore,
    details,
  };
}
