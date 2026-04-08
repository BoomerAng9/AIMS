#!/usr/bin/env node

/**
 * A.I.M.S. — Prompt Library Seeder
 *
 * Seeds Firebase Firestore with the prompt_library collection.
 * Contains 10 curated Gridiron content prompts following Mastery Protocols:
 *   - Higgsfield 3-Layer Separation
 *   - LTX Studio 5-Parameter Shot Control
 *   - Scouting narrative templates
 *   - Podcast script templates
 *   - Debate argument frameworks
 *
 * Usage:
 *   node scripts/seed-prompt-library.mjs
 *
 * Required env:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 *
 * Or uses Application Default Credentials if running on GCP.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ─── Firebase Init ───────────────────────────────────────────────────────

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT_ID || 'ai-managed-services';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (clientEmail && privateKey) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
} else {
  // Fallback to ADC
  initializeApp({ projectId });
}

const db = getFirestore();
const COLLECTION = 'prompt_library';

// ─── Prompt Library ──────────────────────────────────────────────────────

const prompts = [
  // ── 1. Higgsfield: Highlight Reel Hero Shot ──
  {
    id: 'hf-hero-highlight',
    name: 'Highlight Reel Hero Shot',
    tool: 'Higgsfield',
    category: 'video',
    protocol: 'Higgsfield 3-Layer Separation',
    layers: {
      image: 'Wide shot, 50mm lens, stadium night game under floodlights, shallow depth of field, bokeh on crowd',
      identity: 'High school quarterback, #7 jersey white with navy trim, mouthguard dangling, eye black, mid-throwing motion',
      motion: 'Slow motion (0.3x), tracking shot right to left, subtle camera push-in during release',
    },
    badExample: 'Football player throwing a pass, dramatic slow motion, night game, cinematic',
    notes: 'Never combine identity + motion in one line. The AI confuses subject attributes with camera behavior.',
    tags: ['highlight', 'quarterback', 'night-game', 'hero'],
    createdAt: new Date().toISOString(),
  },

  // ── 2. Higgsfield: Draft Day Reaction ──
  {
    id: 'hf-draft-reaction',
    name: 'Draft Day Reaction',
    tool: 'Higgsfield',
    category: 'video',
    protocol: 'Higgsfield 3-Layer Separation',
    layers: {
      image: 'Medium close-up, 85mm portrait lens, indoor living room, warm tungsten lighting, shallow DOF',
      identity: 'Young male athlete in polo shirt, family behind on couch, phone in hand, expression of shock and joy',
      motion: 'Real-time speed (1x), static camera with subtle handheld shake, zoom-in to face over 3 seconds',
    },
    badExample: 'Player getting drafted, emotional moment, family celebrating',
    notes: 'Emotion comes from specifics: the phone, the family positioning, the lighting warmth. Not from adjectives.',
    tags: ['draft', 'emotional', 'family', 'reaction'],
    createdAt: new Date().toISOString(),
  },

  // ── 3. Higgsfield: Training Montage ──
  {
    id: 'hf-training-montage',
    name: 'Off-Season Training Montage',
    tool: 'Higgsfield',
    category: 'video',
    protocol: 'Higgsfield 3-Layer Separation',
    layers: {
      image: 'Wide angle, 24mm lens, outdoor turf field, golden hour, long shadows, heat haze visible',
      identity: 'Two defensive backs in compression gear, agility ladder drill, sweat visible on skin',
      motion: 'Time-lapse (8x) for first 2 seconds, then snap to slow motion (0.5x) for cut move, dolly left',
    },
    badExample: 'Athletes training hard at sunset, impressive workout montage',
    notes: 'Time-lapse → slow-motion snap is a power technique. Specify the exact transition point.',
    tags: ['training', 'montage', 'golden-hour', 'agility'],
    createdAt: new Date().toISOString(),
  },

  // ── 4. LTX Studio: Stat Card Reveal ──
  {
    id: 'ltx-stat-card',
    name: 'Stat Card Cinematic Reveal',
    tool: 'LTX Studio',
    category: 'video',
    protocol: 'LTX Studio 5-Parameter',
    shotControl: {
      shotScale: 'Medium Close-Up',
      cameraAngle: 'Low Angle (15° up)',
      lighting: 'Stadium flood lights with rim light on subject, dark background',
      weather: 'Clear night, slight mist for volumetric light',
      movement: 'Slow crane up (2 seconds), hold, then push-in to stat overlay zone',
    },
    description: 'Player stands at midfield, stat card graphic materializes beside them as camera rises.',
    tags: ['stats', 'graphic', 'reveal', 'cinematic'],
    createdAt: new Date().toISOString(),
  },

  // ── 5. LTX Studio: Hot Take Debate Split Screen ──
  {
    id: 'ltx-debate-split',
    name: 'Hot Take Debate Split Screen',
    tool: 'LTX Studio',
    category: 'video',
    protocol: 'LTX Studio 5-Parameter',
    shotControl: {
      shotScale: 'Medium Shot (two subjects)',
      cameraAngle: 'Eye Level, centered',
      lighting: 'Neon rim light — blue left (Bull), red right (Bear), dark center divide',
      weather: 'Indoor studio, no weather',
      movement: 'Static hold, with subtle dolly push toward winning side at conclusion',
    },
    description: 'Split-screen debate format. Lil_Bull_Hawk vs Lil_Bear_Hawk. Camera favors winner at end.',
    tags: ['debate', 'split-screen', 'hot-take', 'vs'],
    createdAt: new Date().toISOString(),
  },

  // ── 6. LTX Studio: Film Room Breakdown ──
  {
    id: 'ltx-film-breakdown',
    name: 'Film Room Play Breakdown',
    tool: 'LTX Studio',
    category: 'video',
    protocol: 'LTX Studio 5-Parameter',
    shotControl: {
      shotScale: 'Wide Shot (full play visible)',
      cameraAngle: 'High Angle (all-22 film perspective)',
      lighting: 'Natural daylight, outdoor game, no filters',
      weather: 'Clear, slightly overcast for even lighting',
      movement: 'Static hold during play, then slow zoom to highlighted player with telestrator circle',
    },
    description: 'Simulated all-22 film view. Play runs, then isolates target player with SAM 2 overlay.',
    tags: ['film', 'breakdown', 'all-22', 'analysis'],
    createdAt: new Date().toISOString(),
  },

  // ── 7. Scouting Blog: Underrated Prospect Template ──
  {
    id: 'template-blog-underrated',
    name: 'Underrated Prospect Blog Template',
    tool: 'WriterAng',
    category: 'blog',
    protocol: 'Scouting Narrative',
    template: `# Why {PROSPECT_NAME} Is Being Slept On

## Per|Form Grade: {GRADE}/100 ({TIER})

The recruiting industry has {PROSPECT_NAME} ranked at {CURRENT_RANK}, but our adversarial scouting system tells a different story.

### What the Numbers Say
{STAT_TABLE}

### The Lil_Bull_Hawk Argument
{BULL_POINTS}

### The Lil_Bear_Hawk Counterpoint
{BEAR_POINTS}

### Our Verdict
{VERDICT_PARAGRAPH}

### Film Room Evidence
{FILM_ANALYSIS_SUMMARY}

---
*Per|Form Gridiron Sandbox — Autonomous Scouting by A.I.M.S.*`,
    variables: ['PROSPECT_NAME', 'GRADE', 'TIER', 'CURRENT_RANK', 'STAT_TABLE', 'BULL_POINTS', 'BEAR_POINTS', 'VERDICT_PARAGRAPH', 'FILM_ANALYSIS_SUMMARY'],
    tags: ['blog', 'underrated', 'scouting', 'template'],
    createdAt: new Date().toISOString(),
  },

  // ── 8. Scouting Blog: Overrated Prospect Template ──
  {
    id: 'template-blog-overrated',
    name: 'Overrated Prospect Blog Template',
    tool: 'WriterAng',
    category: 'blog',
    protocol: 'Scouting Narrative',
    template: `# Why {PROSPECT_NAME} Might Not Live Up to the Hype

## Per|Form Grade: {GRADE}/100 ({TIER})

Every recruiting cycle has prospects whose ranking doesn't match the tape. Our Lil_Hawks flagged {PROSPECT_NAME} for closer inspection.

### The Hype vs The Data
{COMPARISON_TABLE}

### What the Bear Sees
{BEAR_DEEP_DIVE}

### The Bull's Defense
{BULL_REBUTTAL}

### The Bottom Line
{VERDICT_PARAGRAPH}

### What to Watch For
{DEVELOPMENT_AREAS}

---
*Per|Form Gridiron Sandbox — Autonomous Scouting by A.I.M.S.*`,
    variables: ['PROSPECT_NAME', 'GRADE', 'TIER', 'COMPARISON_TABLE', 'BEAR_DEEP_DIVE', 'BULL_REBUTTAL', 'VERDICT_PARAGRAPH', 'DEVELOPMENT_AREAS'],
    tags: ['blog', 'overrated', 'scouting', 'template'],
    createdAt: new Date().toISOString(),
  },

  // ── 9. Podcast Script: Quick Take Template ──
  {
    id: 'template-podcast-quicktake',
    name: 'Quick Take Podcast Script',
    tool: 'Boomer_Publisher_Ang',
    category: 'podcast',
    protocol: 'Voice Script',
    template: `[INTRO — 5 seconds]
What's good, it's Per Form with another quick take.

[HOOK — 10 seconds]
{PROSPECT_NAME} just dropped a {GRADE} in our grading system, putting them in the {TIER} tier. Here's why that matters.

[BODY — 30 seconds]
Our Lil Hawks went head to head on this one. The Bull says {BULL_SUMMARY}. The Bear fires back with {BEAR_SUMMARY}.

[VERDICT — 10 seconds]
After running the GROC plus Luke formula, {VERDICT_SUMMARY}.

[CTA — 5 seconds]
That's your Per Form quick take. Follow for more autonomous scouting.`,
    voiceSettings: {
      voice: 'Adam (pNInz6obpgDQGcFmaJgB)',
      model: 'eleven_multilingual_v2',
      stability: 0.5,
      similarityBoost: 0.75,
    },
    variables: ['PROSPECT_NAME', 'GRADE', 'TIER', 'BULL_SUMMARY', 'BEAR_SUMMARY', 'VERDICT_SUMMARY'],
    tags: ['podcast', 'quick-take', 'voice', 'template'],
    createdAt: new Date().toISOString(),
  },

  // ── 10. Debate Framework: Lil_Hawk Argument Structure ──
  {
    id: 'template-debate-framework',
    name: 'Lil_Hawk Debate Argument Framework',
    tool: 'Scout Hub',
    category: 'framework',
    protocol: 'Adversarial Scouting',
    template: {
      bullHawkStructure: {
        opening: 'State the underrated thesis in one sentence',
        evidence: [
          'Cite 2-3 statistical proof points from verified sources',
          'Reference one game tape moment (specific play, specific quarter)',
          'Compare to a known successful prospect at the same stage',
        ],
        closing: 'Project ceiling with specific college/NFL comparison',
        confidenceFormula: 'statsFound * 15 + firecrawlPages * 10 + sourceAgreement * 20',
      },
      bearHawkStructure: {
        opening: 'State the overrated thesis in one sentence',
        evidence: [
          'Cite 2-3 statistical counter-points or missing data',
          'Reference one game tape concern (specific play, specific quarter)',
          'Compare to a known prospect who failed to develop similarly',
        ],
        closing: 'Project floor with specific bust comparison',
        confidenceFormula: 'statsFound * 15 + firecrawlPages * 10 + contraryEvidence * 25',
      },
      mediationRules: [
        'Winner requires 10+ confidence points over opponent',
        'Split decision if within 10 points — flag for film review',
        'Auto-reject if either side cites fewer than 2 verified stats',
      ],
    },
    tags: ['debate', 'framework', 'adversarial', 'scouting'],
    createdAt: new Date().toISOString(),
  },
];

// ─── Seed Execution ──────────────────────────────────────────────────────

async function seed() {
  console.log(`\nSeeding ${prompts.length} prompts into Firestore collection: ${COLLECTION}\n`);

  const batch = db.batch();

  for (const prompt of prompts) {
    const ref = db.collection(COLLECTION).doc(prompt.id);
    batch.set(ref, prompt, { merge: true });
    console.log(`  + ${prompt.id} — ${prompt.name} (${prompt.tool})`);
  }

  await batch.commit();
  console.log(`\nDone. ${prompts.length} prompts seeded to ${COLLECTION}.\n`);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
