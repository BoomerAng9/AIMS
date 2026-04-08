/**
 * Trial Run Orchestrator — "The Proving Ground"
 *
 * Onboards real trial users to test actual products. Manages:
 *   1. RECRUIT   — Generate recruitment criteria + outreach templates
 *   2. ONBOARD   — Automated onboarding flow with checkpoints
 *   3. OBSERVE   — Track user sessions and log friction/delight signals
 *   4. DEBRIEF   — Collect structured feedback via guided interviews
 *   5. REPORT    — "Field Report" with friction maps and win highlights
 *
 * This is the bridge between synthetic simulation and real-world validation.
 */

import { callLLM } from '../server.js';

// ─── Types ────────────────────────────────────────────────────────────────

export interface TrialConfig {
  productName: string;
  productUrl?: string;
  targetDemo: string;
  trialDurationDays: number;
  maxUsers: number;
  keyMetrics: string[];       // What are we measuring?
  hypotheses: string[];       // What are we testing?
}

export interface TrialParticipant {
  id: string;
  name: string;
  email: string;
  enrolledAt: string;
  status: 'invited' | 'onboarding' | 'active' | 'completed' | 'dropped';
  checkpoints: TrialCheckpoint[];
  feedback?: TrialFeedback;
}

export interface TrialCheckpoint {
  step: number;
  label: string;
  completedAt: string | null;
  frictionNotes: string | null;
}

export interface TrialFeedback {
  overallRating: number;      // 1-10
  wouldContinue: boolean;
  topFriction: string;
  topDelight: string;
  rawComments: string;
  suggestedPrice: number | null;
}

export interface TrialRun {
  id: string;
  config: TrialConfig;
  status: 'draft' | 'recruiting' | 'active' | 'debriefing' | 'complete';
  createdAt: string;
  participants: TrialParticipant[];
  recruitmentPlan?: RecruitmentPlan;
  onboardingFlow?: OnboardingFlow;
  fieldReport?: FieldReport;
}

export interface RecruitmentPlan {
  criteria: string[];
  outreachTemplate: string;
  channels: string[];
  incentive: string;
}

export interface OnboardingFlow {
  steps: Array<{
    order: number;
    title: string;
    instruction: string;
    successCriteria: string;
    estimatedMinutes: number;
  }>;
}

export interface FieldReport {
  reportId: string;
  completedAt: string;
  totalParticipants: number;
  completionRate: number;
  avgRating: number;
  wouldContinuePercent: number;
  avgSuggestedPrice: number | null;
  frictionMap: Array<{ checkpoint: string; dropoffPercent: number; topIssue: string }>;
  wins: string[];
  risks: string[];
  executiveSummary: string;
  nextSteps: string[];
}

// ─── Trial Creation ───────────────────────────────────────────────────────

export async function createTrialRun(config: TrialConfig): Promise<TrialRun> {
  const trialId = `TRIAL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // Generate recruitment plan
  const recruitResponse = await callLLM(
    `You are a Boost|Bridge Companion specializing in user research. Be practical and specific. Output JSON only.`,
    `Create a recruitment plan for a trial run:

Product: "${config.productName}"
Target: "${config.targetDemo}"
Duration: ${config.trialDurationDays} days
Max users: ${config.maxUsers}

Output JSON:
{
  "criteria": ["3-5 specific screening criteria"],
  "outreachTemplate": "A chill, professional recruitment message. Not corporate — approachable. Include what they'll get out of it.",
  "channels": ["where to find these people"],
  "incentive": "what we're offering for participation"
}`,
  );

  let recruitmentPlan: RecruitmentPlan | undefined;
  try {
    const jsonMatch = recruitResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) recruitmentPlan = JSON.parse(jsonMatch[0]);
  } catch {
    // Will be generated later
  }

  // Generate onboarding flow
  const onboardResponse = await callLLM(
    `You are a Boost|Bridge Companion specializing in product onboarding. Create a step-by-step onboarding flow that real users can follow. Keep it tight — no more than 6 steps. Output JSON only.`,
    `Create an onboarding flow for trial users testing:

Product: "${config.productName}"
Key metrics we're tracking: ${config.keyMetrics.join(', ')}
Hypotheses being tested: ${config.hypotheses.join(', ')}

Output JSON:
{
  "steps": [
    {
      "order": 1,
      "title": "step name",
      "instruction": "what the user does",
      "successCriteria": "how we know they completed it",
      "estimatedMinutes": number
    }
  ]
}`,
  );

  let onboardingFlow: OnboardingFlow | undefined;
  try {
    const jsonMatch = onboardResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) onboardingFlow = JSON.parse(jsonMatch[0]);
  } catch {
    // Will be generated later
  }

  return {
    id: trialId,
    config,
    status: 'draft',
    createdAt: new Date().toISOString(),
    participants: [],
    recruitmentPlan,
    onboardingFlow,
  };
}

// ─── Field Report Generation ──────────────────────────────────────────────

export async function generateFieldReport(trial: TrialRun): Promise<FieldReport> {
  const participants = trial.participants.filter(p => p.status === 'completed');
  const totalParticipants = trial.participants.length;
  const completionRate = totalParticipants > 0
    ? (participants.length / totalParticipants) * 100
    : 0;

  const feedbacks = participants.filter(p => p.feedback).map(p => p.feedback!);
  const avgRating = feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.overallRating, 0) / feedbacks.length
    : 0;
  const wouldContinuePercent = feedbacks.length > 0
    ? (feedbacks.filter(f => f.wouldContinue).length / feedbacks.length) * 100
    : 0;

  const pricedFeedback = feedbacks.filter(f => f.suggestedPrice !== null && f.suggestedPrice! > 0);
  const avgSuggestedPrice = pricedFeedback.length > 0
    ? pricedFeedback.reduce((sum, f) => sum + (f.suggestedPrice || 0), 0) / pricedFeedback.length
    : null;

  // Checkpoint drop-off analysis
  const frictionMap: FieldReport['frictionMap'] = [];
  if (trial.onboardingFlow) {
    for (const step of trial.onboardingFlow.steps) {
      const completedCount = trial.participants.filter(p =>
        p.checkpoints.some(c => c.step === step.order && c.completedAt !== null)
      ).length;
      const dropoffPercent = totalParticipants > 0
        ? ((totalParticipants - completedCount) / totalParticipants) * 100
        : 0;
      const frictionNotes = trial.participants
        .map(p => p.checkpoints.find(c => c.step === step.order)?.frictionNotes)
        .filter(Boolean);

      frictionMap.push({
        checkpoint: step.title,
        dropoffPercent: Math.round(dropoffPercent),
        topIssue: frictionNotes[0] || 'No friction reported',
      });
    }
  }

  // LLM synthesis
  const summaryResponse = await callLLM(
    `You are a Boost|Bridge Companion. Write a field report executive summary. Be direct, use data. Frame it like you're debriefing a founder over coffee, not presenting to a board.`,
    `Field report for "${trial.config.productName}" trial run:

- ${totalParticipants} enrolled, ${participants.length} completed (${completionRate.toFixed(0)}% completion)
- Avg rating: ${avgRating.toFixed(1)}/10
- Would continue: ${wouldContinuePercent.toFixed(0)}%
- Avg suggested price: ${avgSuggestedPrice ? `$${avgSuggestedPrice.toFixed(2)}` : 'N/A'}
- Hypotheses tested: ${trial.config.hypotheses.join(', ')}
- Key friction points: ${frictionMap.filter(f => f.dropoffPercent > 20).map(f => `${f.checkpoint} (${f.dropoffPercent}% drop)`).join(', ') || 'None significant'}
- Raw user feedback: ${feedbacks.slice(0, 5).map(f => `"${f.rawComments}"`).join(' | ')}

Write 2-3 paragraphs. Be real about what the data says.`,
  );

  const nextStepsResponse = await callLLM(
    `You are a Boost|Bridge Companion. Give 3-5 specific next steps based on trial results. Output a JSON array of strings.`,
    `Trial results for "${trial.config.productName}":
- Completion: ${completionRate.toFixed(0)}%, Rating: ${avgRating.toFixed(1)}/10
- Top friction: ${frictionMap.slice(0, 3).map(f => f.topIssue).join(', ')}
- User sentiment: ${feedbacks.slice(0, 3).map(f => f.rawComments).join(' | ')}

Output JSON array of actionable next steps.`,
  );

  let nextSteps: string[] = [];
  try {
    const jsonMatch = nextStepsResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) nextSteps = JSON.parse(jsonMatch[0]);
  } catch {
    nextSteps = ['Review friction map and prioritize fixes for highest drop-off checkpoints.'];
  }

  return {
    reportId: `BB-FIELD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    completedAt: new Date().toISOString(),
    totalParticipants,
    completionRate: Math.round(completionRate),
    avgRating: Math.round(avgRating * 10) / 10,
    wouldContinuePercent: Math.round(wouldContinuePercent),
    avgSuggestedPrice: avgSuggestedPrice ? Math.round(avgSuggestedPrice * 100) / 100 : null,
    frictionMap,
    wins: feedbacks.flatMap(f => [f.topDelight]).filter(Boolean).slice(0, 10),
    risks: feedbacks.flatMap(f => [f.topFriction]).filter(Boolean).slice(0, 10),
    executiveSummary: summaryResponse,
    nextSteps,
  };
}
