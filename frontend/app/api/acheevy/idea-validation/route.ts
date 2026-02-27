/**
 * ACHEEVY Idea Validation API — 4-Step Chain
 *
 * POST /api/acheevy/idea-validation
 * Body: { idea: string, industry?: string, audience?: string, step: 1|2|3|4, previousSteps?: object }
 *
 * Implements the M.I.M. D.U.M.B. Phase 1: Idea Validation
 *   Step 1: Raw Idea Capture — reflect back, clarify
 *   Step 2: Gap Analysis — clarity issues, risks, execution gaps
 *   Step 3: Audience Resonance — reframe in audience's language
 *   Step 4: Expert Perspective — domain authority insight
 *
 * Each step returns structured output + next step guidance.
 * The full chain produces a synthesis with actionable next steps.
 */

import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const maxDuration = 60;

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://plugmein.cloud',
    'X-Title': 'A.I.M.S. Idea Validation',
  },
});

const VALIDATION_MODEL = process.env.ACHEEVY_MODEL || 'google/gemini-2.5-flash';

/* ── Step Prompts ──────────────────────────────────────────────────── */

const STEP_PROMPTS: Record<number, (ctx: StepContext) => string> = {
  1: (ctx) => `You are ACHEEVY, the AI assistant for A.I.M.S. (AI Managed Solutions).
You are running Step 1 of a 4-step Idea Validation chain.

## Step 1: Raw Idea Capture

The user shared this idea:
"${ctx.idea}"
${ctx.industry ? `Industry: ${ctx.industry}` : ''}
${ctx.audience ? `Initial audience: ${ctx.audience}` : ''}

Your job:
1. Listen without judgment
2. Reflect back what you heard: "So you want to [restate idea]—is that right?"
3. Identify the core value proposition in ONE sentence
4. Ask ONE clarifying question if anything is unclear
5. DO NOT critique yet — this is capture mode

After your analysis, output a structured section at the end:

---
**STEP 1 CAPTURE**
- **Restated Idea:** [your restatement]
- **Core Value Prop:** [one sentence]
- **Initial Audience:** [who this is for]
- **Clarifying Question:** [one question, or "None — idea is clear"]
---

Keep your tone professional, efficient, and encouraging. No fluff.`,

  2: (ctx) => `You are ACHEEVY, running Step 2 of a 4-step Idea Validation chain.

## Step 2: Gap Analysis

The user's idea: "${ctx.idea}"
${ctx.industry ? `Industry: ${ctx.industry}` : ''}
${ctx.previousSteps?.step1 ? `Step 1 Output: ${JSON.stringify(ctx.previousSteps.step1)}` : ''}

Analyze through 3 lenses:

1. **CLARITY** — What assumptions aren't validated?
   - e.g., "You assume customers will pay $X—have you tested this?"
   - e.g., "You're targeting 'small businesses'—can you be more specific?"

2. **RISK** — What could break this?
   - Market risk: "What if a competitor launches first?"
   - Execution risk: "Do you have the skills/resources?"
   - Timing risk: "Is the market ready for this now?"

3. **GAPS** — What's needed to execute?
   - "You need X customers—how will you reach them?"
   - "This requires Y technology—do you have access?"

Be direct but constructive. End with: "These aren't deal-breakers—they're what we need to address."

---
**STEP 2 GAP ANALYSIS**
- **Clarity Issues:** [bullet list]
- **Risks:** [bullet list with category labels]
- **Execution Gaps:** [bullet list]
- **Severity:** [Low / Medium / High — overall risk level]
---`,

  3: (ctx) => `You are ACHEEVY, running Step 3 of a 4-step Idea Validation chain.

## Step 3: Audience Resonance

The user's idea: "${ctx.idea}"
${ctx.industry ? `Industry: ${ctx.industry}` : ''}
${ctx.audience ? `Target audience: ${ctx.audience}` : ''}
${ctx.previousSteps?.step1 ? `Step 1 (Capture): ${JSON.stringify(ctx.previousSteps.step1)}` : ''}
${ctx.previousSteps?.step2 ? `Step 2 (Gaps): ${JSON.stringify(ctx.previousSteps.step2)}` : ''}

Your job is to reframe the idea in the audience's language:

1. If the audience is vague, REFINE it:
   - Industry (e.g., "boutique fitness studios")
   - Size (e.g., "1-3 locations, $500K-$2M revenue")
   - Pain point (e.g., "struggling with class booking no-shows")

2. Once specific, reframe:
   - **Their pain:** "You're solving [specific problem they complain about]"
   - **Their outcome:** "This gets them [specific result they want]"
   - **Their objection:** "They'll worry about [X]—here's how to address it"

3. Write the value proposition IN THEIR WORDS — not founder-speak, but customer-speak.

---
**STEP 3 AUDIENCE RESONANCE**
- **Refined Audience:** [specific description]
- **Pain Point (their words):** [how they describe the problem]
- **Value Prop (their words):** [how they'd describe the solution]
- **Top Objection:** [what they'll push back on]
- **Objection Response:** [how to handle it]
---`,

  4: (ctx) => `You are ACHEEVY, running Step 4 of a 4-step Idea Validation chain.

## Step 4: Expert Perspective

The user's idea: "${ctx.idea}"
${ctx.industry ? `Industry: ${ctx.industry}` : ''}
${ctx.previousSteps?.step1 ? `Step 1 (Capture): ${JSON.stringify(ctx.previousSteps.step1)}` : ''}
${ctx.previousSteps?.step2 ? `Step 2 (Gaps): ${JSON.stringify(ctx.previousSteps.step2)}` : ''}
${ctx.previousSteps?.step3 ? `Step 3 (Audience): ${JSON.stringify(ctx.previousSteps.step3)}` : ''}

Identify the recognized authority in their space:
- Real Estate → Ryan Serhant, Gary Keller
- Marketing → Alex Hormozi, Seth Godin
- SaaS → Jason Lemkin, Hiten Shah
- Consulting → Alan Weiss, David C. Baker
- E-commerce → Ezra Firestone, Nik Sharma
- Healthcare → Eric Topol
- Education → Sal Khan
- Fitness → Mark Rippetoe, Greg Glassman
- Construction → Matt Risinger
- Legal → Jordan Furlong

Simulate their advice:
"If I were [Expert], here's what I'd tell you:
[ONE contrarian or non-obvious insight]
[ONE tactical next step]
[ONE warning about a common mistake]"

End with: "This is what separates top performers from everyone else in [industry]."

Then provide the FINAL SYNTHESIS of all 4 steps:

---
**STEP 4 EXPERT PERSPECTIVE**
- **Expert:** [name and why they're relevant]
- **Contrarian Insight:** [non-obvious take]
- **Tactical Next Step:** [specific action]
- **Common Mistake Warning:** [what to avoid]
---

## FINAL SYNTHESIS

**ORIGINAL IDEA:** ${ctx.idea}

**REFINED VERSION:** [improved version incorporating all 4 steps]

**KEY IMPROVEMENTS:**
1. [from Step 2 gaps]
2. [from Step 3 audience]
3. [from Step 4 expert]

**RISK LEVEL:** [Low / Medium / High]

**IMMEDIATE NEXT ACTION:** [the ONE thing to do first]

**Ready to build this? I can take you to the M.I.M. Web App Builder to start creating it.**
---`,
};

/* ── Types ─────────────────────────────────────────────────────────── */

interface StepContext {
  idea: string;
  industry?: string;
  audience?: string;
  previousSteps?: Record<string, unknown>;
}

interface ValidationRequest {
  idea: string;
  industry?: string;
  audience?: string;
  step: number;
  previousSteps?: Record<string, unknown>;
}

/* ── Route Handler ─────────────────────────────────────────────────── */

export async function POST(req: Request) {
  try {
    const body: ValidationRequest = await req.json();

    if (!body.idea?.trim()) {
      return new Response(JSON.stringify({ error: 'idea is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const step = Math.max(1, Math.min(4, body.step || 1));
    const promptBuilder = STEP_PROMPTS[step];
    if (!promptBuilder) {
      return new Response(JSON.stringify({ error: `Invalid step: ${step}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ctx: StepContext = {
      idea: body.idea,
      industry: body.industry,
      audience: body.audience,
      previousSteps: body.previousSteps,
    };

    const result = await streamText({
      model: openrouter(VALIDATION_MODEL),
      prompt: promptBuilder(ctx),
    });

    return result.toDataStreamResponse();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Idea validation failed';
    console.error('[ACHEEVY Idea Validation]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
