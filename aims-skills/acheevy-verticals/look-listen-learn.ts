/**
 * Look-Listen-Learn Engine — The Engagement Triad
 *
 * This engine runs CONTINUOUSLY during every ACHEEVY engagement.
 * It's not a sequential process — all three modes operate in parallel.
 *
 * LOOK  → Visual intelligence. Document upload → OCR → structure extraction.
 *          Don't ask "what's in this file?" — analyze it and TELL the user.
 *
 * LISTEN → Active listening. NLP intent + subtext + emotional signals + triggers.
 *          When a user says "I need a website" → don't jump to templates.
 *          LISTEN for requirements. Detect direction changes. Read the room.
 *
 * LEARN  → Adaptation. Store patterns, preferences, outcomes.
 *          Every interaction makes the next one better.
 *
 * "A good consultant notices everything but only speaks when they have
 *  something valuable to add."
 */

import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** What the LOOK phase detected in uploaded content */
export interface LookAnalysis {
  id: string;
  timestamp: string;
  sourceType: 'document' | 'image' | 'spreadsheet' | 'pdf' | 'code' | 'url' | 'unknown';
  ocrApplied: boolean;
  extractedEntities: ExtractedEntity[];
  structureType: string;            // e.g., 'invoice', 'contract', 'resume', 'wireframe'
  keyFindings: string[];             // Top-level takeaways
  dataPoints: Record<string, string | number>; // Named data extracted
  confidence: number;                // 0-1 confidence in extraction
  suggestedActions: string[];        // What ACHEEVY should do with this
}

/** Entity extracted from document analysis */
export interface ExtractedEntity {
  type: 'person' | 'company' | 'date' | 'amount' | 'email' | 'phone' | 'url' | 'address' | 'product' | 'metric' | 'requirement';
  value: string;
  context: string;                   // Surrounding text for disambiguation
  confidence: number;
}

/** What the LISTEN phase detected in user messages */
export interface ListenAnalysis {
  id: string;
  timestamp: string;
  messageText: string;

  // Explicit intent
  explicitIntent: string;           // What they directly asked for
  intentConfidence: number;

  // Implicit signals
  implicitNeeds: string[];          // What they probably also need
  subtext: string;                  // Reading between the lines

  // Emotional temperature
  emotionalSignals: EmotionalSignal[];
  overallSentiment: 'positive' | 'neutral' | 'frustrated' | 'confused' | 'excited' | 'urgent';

  // Trigger detection
  triggers: EngagementTrigger[];

  // Direction change detection
  directionChange: {
    detected: boolean;
    from?: string;
    to?: string;
    acknowledgement?: string;
  };
}

/** Emotional signal detected in user message */
export interface EmotionalSignal {
  emotion: string;                   // e.g., 'frustration', 'excitement', 'confusion'
  intensity: number;                 // 0-1
  evidence: string;                  // The words/phrases that indicate this
  suggestedResponse: string;         // How ACHEEVY should respond to this emotion
}

/** Engagement trigger — something the user said that should activate a specific response */
export interface EngagementTrigger {
  type: 'build_intent' | 'deploy_intent' | 'research_intent' | 'help_needed'
    | 'methodology_signal' | 'vertical_signal' | 'pricing_question'
    | 'complaint' | 'direction_change' | 'upload_reference';
  phrase: string;                    // The trigger phrase
  confidence: number;
  suggestedAction: string;           // What to do about it
  suggestedMethodology?: string;     // Which methodology to activate
}

/** What the LEARN phase stores for future interactions */
export interface LearnEntry {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: string;
  category: 'preference' | 'pattern' | 'outcome' | 'feedback' | 'context';
  key: string;                       // What was learned
  value: string;                     // The learning
  confidence: number;
  source: 'look' | 'listen' | 'interaction' | 'explicit'; // How we learned it
}

/** User profile built from accumulated LEARN entries */
export interface UserLearningProfile {
  userId: string;
  industry?: string;
  primaryGoals: string[];
  preferredTone: string;
  technicalLevel: 'non-technical' | 'basic' | 'intermediate' | 'developer';
  communicationStyle: 'brief' | 'detailed' | 'visual' | 'data-driven';
  pastProjects: string[];
  knownPreferences: Record<string, string>;
  interactionCount: number;
  lastInteraction: string;
}

// ---------------------------------------------------------------------------
// LOOK Engine — Visual Intelligence & Document Analysis
// ---------------------------------------------------------------------------

/** Pattern rules for detecting document structure */
const DOCUMENT_PATTERNS: Array<{
  type: string;
  signals: string[];
  suggestedActions: string[];
}> = [
  {
    type: 'invoice',
    signals: ['invoice', 'bill to', 'amount due', 'payment terms', 'total', 'subtotal'],
    suggestedActions: ['Extract line items and totals', 'Identify vendor and client', 'Check payment terms'],
  },
  {
    type: 'contract',
    signals: ['agreement', 'parties', 'terms and conditions', 'effective date', 'signatures', 'whereas'],
    suggestedActions: ['Extract key terms and dates', 'Identify parties and obligations', 'Flag renewal/termination clauses'],
  },
  {
    type: 'resume',
    signals: ['experience', 'education', 'skills', 'objective', 'references', 'employment'],
    suggestedActions: ['Extract skills and experience', 'Identify key qualifications', 'Map to potential roles'],
  },
  {
    type: 'wireframe',
    signals: ['header', 'navigation', 'footer', 'button', 'input', 'layout', 'sidebar'],
    suggestedActions: ['Identify UI components', 'Map layout structure', 'Extract design requirements'],
  },
  {
    type: 'business_plan',
    signals: ['executive summary', 'market analysis', 'revenue model', 'financial projections', 'competitive advantage'],
    suggestedActions: ['Extract key metrics and projections', 'Identify market positioning', 'Assess financial viability'],
  },
  {
    type: 'requirements_doc',
    signals: ['requirements', 'user stories', 'acceptance criteria', 'functional', 'non-functional', 'shall'],
    suggestedActions: ['Extract all requirements', 'Categorize by priority', 'Identify gaps or ambiguities'],
  },
  {
    type: 'spreadsheet_data',
    signals: ['row', 'column', 'total', 'average', 'sum', 'data', 'table'],
    suggestedActions: ['Parse structure and headers', 'Identify key metrics', 'Detect patterns and trends'],
  },
];

/**
 * Analyze uploaded content — the LOOK phase.
 * This runs BEFORE asking the user about the document.
 */
export function analyzeLook(content: string, sourceType: LookAnalysis['sourceType']): LookAnalysis {
  const lower = content.toLowerCase();

  // Detect document structure type
  let bestMatch = { type: 'general', score: 0, actions: ['Summarize key content'] };
  for (const pattern of DOCUMENT_PATTERNS) {
    const score = pattern.signals.filter(s => lower.includes(s)).length;
    if (score > bestMatch.score) {
      bestMatch = { type: pattern.type, score, actions: pattern.suggestedActions };
    }
  }

  // Extract entities
  const entities = extractEntities(content);

  // Key findings based on document type
  const keyFindings: string[] = [];
  if (entities.length > 0) {
    const entityTypes = [...new Set(entities.map(e => e.type))];
    keyFindings.push(`Found ${entities.length} entities: ${entityTypes.join(', ')}`);
  }
  if (bestMatch.type !== 'general') {
    keyFindings.push(`Document appears to be a ${bestMatch.type}`);
  }

  // Extract data points
  const dataPoints: Record<string, string | number> = {};
  for (const entity of entities) {
    if (entity.type === 'amount') {
      dataPoints[`amount_${entity.value}`] = entity.value;
    }
    if (entity.type === 'date') {
      dataPoints[`date_${entity.value}`] = entity.value;
    }
  }

  return {
    id: `look-${uuidv4()}`,
    timestamp: new Date().toISOString(),
    sourceType,
    ocrApplied: sourceType === 'image' || sourceType === 'pdf',
    extractedEntities: entities,
    structureType: bestMatch.type,
    keyFindings,
    dataPoints,
    confidence: Math.min(bestMatch.score / 3, 0.95),
    suggestedActions: bestMatch.actions,
  };
}

/** Extract named entities from text content */
function extractEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  // Email extraction
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  for (const match of text.matchAll(emailRegex)) {
    entities.push({
      type: 'email',
      value: match[0],
      context: text.slice(Math.max(0, match.index! - 20), match.index! + match[0].length + 20),
      confidence: 0.95,
    });
  }

  // URL extraction
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  for (const match of text.matchAll(urlRegex)) {
    entities.push({
      type: 'url',
      value: match[0],
      context: text.slice(Math.max(0, match.index! - 20), match.index! + match[0].length + 20),
      confidence: 0.95,
    });
  }

  // Phone extraction
  const phoneRegex = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  for (const match of text.matchAll(phoneRegex)) {
    entities.push({
      type: 'phone',
      value: match[0],
      context: text.slice(Math.max(0, match.index! - 20), match.index! + match[0].length + 20),
      confidence: 0.85,
    });
  }

  // Dollar amounts
  const amountRegex = /\$[\d,]+(?:\.\d{2})?/g;
  for (const match of text.matchAll(amountRegex)) {
    entities.push({
      type: 'amount',
      value: match[0],
      context: text.slice(Math.max(0, match.index! - 20), match.index! + match[0].length + 20),
      confidence: 0.9,
    });
  }

  // Date patterns
  const dateRegex = /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\w+ \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2})\b/g;
  for (const match of text.matchAll(dateRegex)) {
    entities.push({
      type: 'date',
      value: match[0],
      context: text.slice(Math.max(0, match.index! - 20), match.index! + match[0].length + 20),
      confidence: 0.85,
    });
  }

  // Requirements (sentences with "shall", "must", "should", "need to")
  const reqRegex = /[^.]*\b(?:shall|must|should|need to|required to)\b[^.]*/gi;
  for (const match of text.matchAll(reqRegex)) {
    entities.push({
      type: 'requirement',
      value: match[0].trim(),
      context: match[0].trim(),
      confidence: 0.75,
    });
  }

  return entities;
}

// ---------------------------------------------------------------------------
// LISTEN Engine — Active Listening & Trigger Detection
// ---------------------------------------------------------------------------

/** Trigger detection patterns */
const TRIGGER_PATTERNS: Array<{
  type: EngagementTrigger['type'];
  patterns: RegExp[];
  action: string;
  methodology?: string;
}> = [
  {
    type: 'build_intent',
    patterns: [
      /\b(?:build|create|make|develop|code|implement)\s+(?:a|an|the|my|our)\s+\w+/i,
      /\bI\s+(?:want|need)\s+(?:a|an|to build)\b/i,
      /\bcan you (?:build|create|make|develop)\b/i,
    ],
    action: 'Enter LISTEN mode — gather requirements before jumping to templates or execution.',
    methodology: 'develop',
  },
  {
    type: 'deploy_intent',
    patterns: [
      /\b(?:deploy|launch|ship|go live|push to prod|spin up|provision)\b/i,
      /\bput (?:it|this) (?:live|online|in production)\b/i,
    ],
    action: 'Check deployment readiness. Run PaaS pipeline if target is identified.',
    methodology: 'develop',
  },
  {
    type: 'research_intent',
    patterns: [
      /\b(?:research|analyze|investigate|look into|find out|explore)\b/i,
      /\bwhat (?:do you know|can you find) about\b/i,
    ],
    action: 'Dispatch research via Scout_Ang or Lab_Ang.',
  },
  {
    type: 'help_needed',
    patterns: [
      /\b(?:help|stuck|confused|don't know|not sure|lost)\b/i,
      /\bhow do I\b/i,
      /\bwhat should I\b/i,
    ],
    action: 'Slow down. Clarify the obstacle. Guide step by step.',
  },
  {
    type: 'methodology_signal',
    patterns: [
      /\b(?:fix|broken|not working|improve|optimize)\b/i,
    ],
    action: 'DMAIC methodology — something exists but needs improvement.',
    methodology: 'dmaic',
  },
  {
    type: 'methodology_signal',
    patterns: [
      /\b(?:idea|concept|what if|thinking about|brainstorm)\b/i,
    ],
    action: 'FOSTER methodology — early-stage idea nurturing.',
    methodology: 'foster',
  },
  {
    type: 'methodology_signal',
    patterns: [
      /\b(?:refine|polish|sharpen|tweak|fine-tune)\b/i,
    ],
    action: 'HONE methodology — refine what already works.',
    methodology: 'hone',
  },
  {
    type: 'pricing_question',
    patterns: [
      /\b(?:how much|pricing|cost|price|budget|expensive|affordable)\b/i,
      /\bwhat (?:does it|will it) cost\b/i,
    ],
    action: 'Run LUC estimate. Present transparent pricing with breakdown.',
  },
  {
    type: 'complaint',
    patterns: [
      /\b(?:broken|doesn't work|failed|error|bug|wrong|terrible|awful|frustrated)\b/i,
      /\bthis is (?:not|isn't) (?:working|right)\b/i,
    ],
    action: 'Acknowledge frustration. Diagnose. Fix. DMAIC if recurring.',
    methodology: 'dmaic',
  },
  {
    type: 'direction_change',
    patterns: [
      /\b(?:actually|never mind|forget that|let's do|instead|wait|change of plans|pivot)\b/i,
      /\bI (?:changed my mind|want to do something else)\b/i,
    ],
    action: 'Acknowledge the pivot. Don\'t fight it. Adapt to new direction.',
  },
  {
    type: 'upload_reference',
    patterns: [
      /\b(?:uploaded|attached|here's the|check this|look at this|see this|this file|this document)\b/i,
    ],
    action: 'Enter LOOK mode — analyze the upload BEFORE asking about it.',
  },
];

/** Emotional signal detection patterns */
const EMOTION_PATTERNS: Array<{
  emotion: string;
  patterns: RegExp[];
  suggestedResponse: string;
}> = [
  {
    emotion: 'frustration',
    patterns: [
      /\b(?:frustrated|annoying|annoyed|ugh|aargh|why (?:does|doesn't|can't|won't)|come on)\b/i,
      /!{2,}/,
    ],
    suggestedResponse: 'Slow down. Acknowledge the frustration. Focus on fixing, not explaining.',
  },
  {
    emotion: 'excitement',
    patterns: [
      /\b(?:excited|amazing|awesome|perfect|love it|yes!|let's go|can't wait)\b/i,
    ],
    suggestedResponse: 'Match the energy. Channel excitement into action.',
  },
  {
    emotion: 'confusion',
    patterns: [
      /\b(?:confused|don't understand|what do you mean|huh|unclear|lost)\b/i,
      /\?{2,}/,
    ],
    suggestedResponse: 'Simplify. Use a concrete example. Ask what specifically is unclear.',
  },
  {
    emotion: 'urgency',
    patterns: [
      /\b(?:asap|urgent|deadline|immediately|right now|hurry|time-sensitive|emergency)\b/i,
    ],
    suggestedResponse: 'Prioritize speed. Cut ceremonies. Get to execution fast.',
  },
  {
    emotion: 'satisfaction',
    patterns: [
      /\b(?:thank|great|works|nice|good job|well done|impressed)\b/i,
    ],
    suggestedResponse: 'Acknowledge briefly. Transition to next steps or close cleanly.',
  },
];

/**
 * Analyze a user message — the LISTEN phase.
 * Runs on every user input to detect intent, triggers, and emotional signals.
 */
export function analyzeListen(message: string): ListenAnalysis {
  const triggers: EngagementTrigger[] = [];
  const emotionalSignals: EmotionalSignal[] = [];

  // Detect triggers
  for (const triggerDef of TRIGGER_PATTERNS) {
    for (const pattern of triggerDef.patterns) {
      const match = message.match(pattern);
      if (match) {
        triggers.push({
          type: triggerDef.type,
          phrase: match[0],
          confidence: 0.8,
          suggestedAction: triggerDef.action,
          suggestedMethodology: triggerDef.methodology,
        });
        break; // One match per trigger type is enough
      }
    }
  }

  // Detect emotional signals
  for (const emotionDef of EMOTION_PATTERNS) {
    for (const pattern of emotionDef.patterns) {
      const match = message.match(pattern);
      if (match) {
        emotionalSignals.push({
          emotion: emotionDef.emotion,
          intensity: 0.7,
          evidence: match[0],
          suggestedResponse: emotionDef.suggestedResponse,
        });
        break;
      }
    }
  }

  // Determine overall sentiment
  let overallSentiment: ListenAnalysis['overallSentiment'] = 'neutral';
  if (emotionalSignals.some(s => s.emotion === 'frustration')) overallSentiment = 'frustrated';
  else if (emotionalSignals.some(s => s.emotion === 'urgency')) overallSentiment = 'urgent';
  else if (emotionalSignals.some(s => s.emotion === 'confusion')) overallSentiment = 'confused';
  else if (emotionalSignals.some(s => s.emotion === 'excitement')) overallSentiment = 'excited';
  else if (emotionalSignals.some(s => s.emotion === 'satisfaction')) overallSentiment = 'positive';

  // Detect direction changes
  const directionChange = {
    detected: triggers.some(t => t.type === 'direction_change'),
  };

  // Determine explicit intent from highest-confidence trigger
  const sortedTriggers = [...triggers].sort((a, b) => b.confidence - a.confidence);
  const primaryTrigger = sortedTriggers[0];

  // Derive implicit needs
  const implicitNeeds: string[] = [];
  if (triggers.some(t => t.type === 'build_intent')) {
    implicitNeeds.push('Likely needs architecture review before building');
    implicitNeeds.push('May need deployment plan after build');
  }
  if (triggers.some(t => t.type === 'deploy_intent')) {
    implicitNeeds.push('May need health monitoring after deployment');
    implicitNeeds.push('May need rollback plan');
  }
  if (triggers.some(t => t.type === 'complaint')) {
    implicitNeeds.push('Root cause analysis, not just a quick fix');
    implicitNeeds.push('Assurance that it won\'t happen again');
  }

  return {
    id: `listen-${uuidv4()}`,
    timestamp: new Date().toISOString(),
    messageText: message,
    explicitIntent: primaryTrigger?.suggestedAction || 'General conversation',
    intentConfidence: primaryTrigger?.confidence || 0.3,
    implicitNeeds,
    subtext: deriveSubtext(message, triggers, emotionalSignals),
    emotionalSignals,
    overallSentiment,
    triggers,
    directionChange,
  };
}

/** Derive subtext from a combination of signals */
function deriveSubtext(
  message: string,
  triggers: EngagementTrigger[],
  emotions: EmotionalSignal[],
): string {
  const parts: string[] = [];

  if (triggers.some(t => t.type === 'help_needed') && emotions.some(e => e.emotion === 'frustration')) {
    parts.push('User is struggling and may need a simpler approach.');
  }
  if (triggers.some(t => t.type === 'build_intent') && emotions.some(e => e.emotion === 'excitement')) {
    parts.push('User is enthusiastic about building — channel into structured requirements.');
  }
  if (triggers.some(t => t.type === 'pricing_question')) {
    parts.push('User may be budget-conscious — lead with value before presenting cost.');
  }
  if (triggers.some(t => t.type === 'direction_change')) {
    parts.push('User is pivoting — previous context may be partially invalidated.');
  }

  return parts.length > 0 ? parts.join(' ') : 'No significant subtext detected.';
}

// ---------------------------------------------------------------------------
// LEARN Engine — Adaptation & Knowledge Storage
// ---------------------------------------------------------------------------

class LearnEngine {
  private entries: LearnEntry[] = [];
  private profiles: Map<string, UserLearningProfile> = new Map();

  /**
   * Record a learning from an interaction.
   */
  record(params: {
    userId: string;
    sessionId: string;
    category: LearnEntry['category'];
    key: string;
    value: string;
    confidence: number;
    source: LearnEntry['source'];
  }): LearnEntry {
    const entry: LearnEntry = {
      id: `learn-${uuidv4()}`,
      userId: params.userId,
      sessionId: params.sessionId,
      timestamp: new Date().toISOString(),
      category: params.category,
      key: params.key,
      value: params.value,
      confidence: params.confidence,
      source: params.source,
    };

    this.entries.push(entry);
    this.updateProfile(params.userId, entry);
    return entry;
  }

  /**
   * Get a user's learning profile — accumulated knowledge about them.
   */
  getProfile(userId: string): UserLearningProfile | undefined {
    return this.profiles.get(userId);
  }

  /**
   * Get all learnings for a user.
   */
  getUserEntries(userId: string): LearnEntry[] {
    return this.entries.filter(e => e.userId === userId);
  }

  /**
   * Get learnings by category for a user.
   */
  getUserEntriesByCategory(userId: string, category: LearnEntry['category']): LearnEntry[] {
    return this.entries.filter(e => e.userId === userId && e.category === category);
  }

  /**
   * Auto-learn from a LISTEN analysis result.
   * Extracts and stores preferences, patterns, and context.
   */
  learnFromListen(userId: string, sessionId: string, analysis: ListenAnalysis): void {
    // Learn communication style from sentiment
    if (analysis.overallSentiment !== 'neutral') {
      this.record({
        userId,
        sessionId,
        category: 'context',
        key: 'recent_sentiment',
        value: analysis.overallSentiment,
        confidence: 0.7,
        source: 'listen',
      });
    }

    // Learn methodology preference from triggers
    for (const trigger of analysis.triggers) {
      if (trigger.suggestedMethodology) {
        this.record({
          userId,
          sessionId,
          category: 'preference',
          key: 'methodology_fit',
          value: trigger.suggestedMethodology,
          confidence: trigger.confidence,
          source: 'listen',
        });
      }
    }

    // Learn intent patterns
    if (analysis.explicitIntent && analysis.intentConfidence > 0.6) {
      this.record({
        userId,
        sessionId,
        category: 'pattern',
        key: 'intent_pattern',
        value: analysis.explicitIntent,
        confidence: analysis.intentConfidence,
        source: 'listen',
      });
    }
  }

  /**
   * Auto-learn from a LOOK analysis result.
   * Extracts and stores context from uploaded documents.
   */
  learnFromLook(userId: string, sessionId: string, analysis: LookAnalysis): void {
    // Learn document type preference
    this.record({
      userId,
      sessionId,
      category: 'context',
      key: 'document_type_uploaded',
      value: analysis.structureType,
      confidence: analysis.confidence,
      source: 'look',
    });

    // Learn from extracted entities
    for (const entity of analysis.extractedEntities) {
      if (entity.type === 'company') {
        this.record({
          userId,
          sessionId,
          category: 'context',
          key: 'company_reference',
          value: entity.value,
          confidence: entity.confidence,
          source: 'look',
        });
      }
    }
  }

  /**
   * Update user profile from a new learning entry.
   */
  private updateProfile(userId: string, entry: LearnEntry): void {
    const profile = this.profiles.get(userId) || {
      userId,
      primaryGoals: [],
      preferredTone: 'professional',
      technicalLevel: 'basic' as const,
      communicationStyle: 'detailed' as const,
      pastProjects: [],
      knownPreferences: {},
      interactionCount: 0,
      lastInteraction: entry.timestamp,
    };

    profile.interactionCount++;
    profile.lastInteraction = entry.timestamp;

    if (entry.category === 'preference') {
      profile.knownPreferences[entry.key] = entry.value;
    }

    this.profiles.set(userId, profile);
  }
}

// ---------------------------------------------------------------------------
// Singleton Exports
// ---------------------------------------------------------------------------

export const learnEngine = new LearnEngine();

// ---------------------------------------------------------------------------
// Composite LLL Analysis — Run all three in one call
// ---------------------------------------------------------------------------

/**
 * Run the full Look-Listen-Learn analysis on a user turn.
 * This is called on every user message by the orchestrator.
 */
export function analyzeEngagement(params: {
  userId: string;
  sessionId: string;
  message: string;
  uploadedContent?: string;
  uploadSourceType?: LookAnalysis['sourceType'];
}): {
  look?: LookAnalysis;
  listen: ListenAnalysis;
  suggestedMethodology: string | null;
  suggestedAction: string;
  emotionalTemperature: string;
  userProfile?: UserLearningProfile;
} {
  // LOOK — if there's uploaded content
  let look: LookAnalysis | undefined;
  if (params.uploadedContent) {
    look = analyzeLook(params.uploadedContent, params.uploadSourceType || 'unknown');
    learnEngine.learnFromLook(params.userId, params.sessionId, look);
  }

  // LISTEN — always
  const listen = analyzeListen(params.message);
  learnEngine.learnFromListen(params.userId, params.sessionId, listen);

  // Determine suggested methodology from triggers
  const methodologyTrigger = listen.triggers.find(t => t.suggestedMethodology);
  const suggestedMethodology = methodologyTrigger?.suggestedMethodology || null;

  // Determine primary suggested action
  const primaryTrigger = listen.triggers.sort((a, b) => b.confidence - a.confidence)[0];
  const suggestedAction = primaryTrigger?.suggestedAction || 'Continue conversation';

  // Get user profile
  const userProfile = learnEngine.getProfile(params.userId);

  return {
    look,
    listen,
    suggestedMethodology,
    suggestedAction,
    emotionalTemperature: listen.overallSentiment,
    userProfile,
  };
}
