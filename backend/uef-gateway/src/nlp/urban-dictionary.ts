/**
 * Urban Language Dictionaries — Colloquial → Intent Normalization
 *
 * Maps informal, slang, AAVE (African American Vernacular English),
 * Gen Z, and general colloquial language into platform-recognizable
 * trigger words so users don't lose ideas over vocabulary gaps.
 *
 * Philosophy: "We mustn't let ideas go to waste over a creative not
 * knowing the words to use." — Every synonym here is a bridge from
 * how real people talk to what the system understands.
 *
 * Extensible: Add new dictionaries (Spanish, Portuguese, etc.) by
 * following the same { phrase → normalized } pattern and registering
 * in the DIALECT_REGISTRIES array.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SlangEntry {
  /** The colloquial phrase or word (lowercase) */
  phrase: string;
  /** What it normalizes to — a term the classifier recognizes */
  normalized: string;
  /** Which domain this mapping belongs to */
  domain: 'action' | 'object' | 'emotion' | 'quality' | 'money' | 'social' | 'general';
  /** Which dialect/register this comes from */
  dialect: string;
}

export interface DialectRegistry {
  name: string;
  code: string;
  entries: SlangEntry[];
}

// ---------------------------------------------------------------------------
// AAVE / Ebonics Dictionary
// ---------------------------------------------------------------------------

const AAVE_ENTRIES: SlangEntry[] = [
  // ── Actions / Verbs ──────────────────────────────────────────────
  { phrase: 'spin somethin up', normalized: 'deploy a tool', domain: 'action', dialect: 'aave' },
  { phrase: 'whip somethin up', normalized: 'build quickly', domain: 'action', dialect: 'aave' },
  { phrase: 'whip up', normalized: 'build quickly', domain: 'action', dialect: 'aave' },
  { phrase: 'cook somethin up', normalized: 'create something', domain: 'action', dialect: 'aave' },
  { phrase: 'cook', normalized: 'create', domain: 'action', dialect: 'aave' },
  { phrase: 'cooking', normalized: 'creating', domain: 'action', dialect: 'aave' },
  { phrase: 'finna', normalized: 'going to', domain: 'action', dialect: 'aave' },
  { phrase: 'bout to', normalized: 'about to', domain: 'action', dialect: 'aave' },
  { phrase: 'tryna', normalized: 'trying to', domain: 'action', dialect: 'aave' },
  { phrase: 'lemme', normalized: 'let me', domain: 'action', dialect: 'aave' },
  { phrase: 'gimme', normalized: 'give me', domain: 'action', dialect: 'aave' },
  { phrase: 'put me on', normalized: 'show me', domain: 'action', dialect: 'aave' },
  { phrase: 'put on', normalized: 'introduce to', domain: 'action', dialect: 'aave' },
  { phrase: 'plug me in', normalized: 'connect me', domain: 'action', dialect: 'aave' },
  { phrase: 'hook me up', normalized: 'set up for me', domain: 'action', dialect: 'aave' },
  { phrase: 'run it', normalized: 'execute it', domain: 'action', dialect: 'aave' },
  { phrase: 'run that', normalized: 'execute that', domain: 'action', dialect: 'aave' },
  { phrase: 'slide me', normalized: 'send me', domain: 'action', dialect: 'aave' },
  { phrase: 'tap in', normalized: 'connect', domain: 'action', dialect: 'aave' },
  { phrase: 'pull up', normalized: 'show', domain: 'action', dialect: 'aave' },
  { phrase: 'link up', normalized: 'connect', domain: 'action', dialect: 'aave' },
  { phrase: 'hip me to', normalized: 'teach me about', domain: 'action', dialect: 'aave' },
  { phrase: 'school me on', normalized: 'teach me about', domain: 'action', dialect: 'aave' },
  { phrase: 'peep this', normalized: 'look at this', domain: 'action', dialect: 'aave' },
  { phrase: 'peep game', normalized: 'understand the strategy', domain: 'action', dialect: 'aave' },
  { phrase: 'drop', normalized: 'release', domain: 'action', dialect: 'aave' },
  { phrase: 'cop', normalized: 'get', domain: 'action', dialect: 'aave' },
  { phrase: 'flex', normalized: 'showcase', domain: 'action', dialect: 'aave' },
  { phrase: 'finesse', normalized: 'optimize', domain: 'action', dialect: 'aave' },
  { phrase: 'lock in', normalized: 'focus on', domain: 'action', dialect: 'aave' },
  { phrase: 'crash out', normalized: 'fail', domain: 'action', dialect: 'aave' },
  { phrase: 'dead it', normalized: 'stop it', domain: 'action', dialect: 'aave' },
  { phrase: 'kill it', normalized: 'stop it', domain: 'action', dialect: 'aave' },
  { phrase: 'murk it', normalized: 'destroy it', domain: 'action', dialect: 'aave' },
  { phrase: 'body it', normalized: 'dominate it', domain: 'action', dialect: 'aave' },

  // ── Objects / Nouns ──────────────────────────────────────────────
  { phrase: 'jawn', normalized: 'thing', domain: 'object', dialect: 'aave' },
  { phrase: 'joint', normalized: 'thing', domain: 'object', dialect: 'aave' },
  { phrase: 'plug', normalized: 'tool', domain: 'object', dialect: 'aave' },
  { phrase: 'wave', normalized: 'trend', domain: 'object', dialect: 'aave' },
  { phrase: 'drip', normalized: 'style', domain: 'object', dialect: 'aave' },
  { phrase: 'bag', normalized: 'money', domain: 'money', dialect: 'aave' },
  { phrase: 'bread', normalized: 'money', domain: 'money', dialect: 'aave' },
  { phrase: 'guap', normalized: 'money', domain: 'money', dialect: 'aave' },
  { phrase: 'paper', normalized: 'money', domain: 'money', dialect: 'aave' },
  { phrase: 'bands', normalized: 'money', domain: 'money', dialect: 'aave' },
  { phrase: 'racks', normalized: 'money', domain: 'money', dialect: 'aave' },
  { phrase: 'stacks', normalized: 'money', domain: 'money', dialect: 'aave' },
  { phrase: 'gwop', normalized: 'money', domain: 'money', dialect: 'aave' },
  { phrase: 'crib', normalized: 'website', domain: 'object', dialect: 'aave' },

  // ── Emotions / Quality ──────────────────────────────────────────
  { phrase: 'fire', normalized: 'excellent', domain: 'quality', dialect: 'aave' },
  { phrase: 'heat', normalized: 'excellent', domain: 'quality', dialect: 'aave' },
  { phrase: 'cold', normalized: 'impressive', domain: 'quality', dialect: 'aave' },
  { phrase: 'hard', normalized: 'impressive', domain: 'quality', dialect: 'aave' },
  { phrase: 'goes hard', normalized: 'is impressive', domain: 'quality', dialect: 'aave' },
  { phrase: 'slaps', normalized: 'is impressive', domain: 'quality', dialect: 'aave' },
  { phrase: 'buss', normalized: 'is excellent', domain: 'quality', dialect: 'aave' },
  { phrase: 'gas', normalized: 'hype', domain: 'quality', dialect: 'aave' },
  { phrase: 'trash', normalized: 'bad', domain: 'quality', dialect: 'aave' },
  { phrase: 'mid', normalized: 'mediocre', domain: 'quality', dialect: 'aave' },
  { phrase: 'janky', normalized: 'unreliable', domain: 'quality', dialect: 'aave' },
  { phrase: 'busted', normalized: 'broken', domain: 'quality', dialect: 'aave' },
  { phrase: 'trippin', normalized: 'malfunctioning', domain: 'quality', dialect: 'aave' },
  { phrase: 'buggin', normalized: 'having issues', domain: 'quality', dialect: 'aave' },
  { phrase: 'wildin', normalized: 'acting unexpectedly', domain: 'quality', dialect: 'aave' },
  { phrase: 'cappin', normalized: 'lying', domain: 'quality', dialect: 'aave' },
  { phrase: 'no cap', normalized: 'for real', domain: 'quality', dialect: 'aave' },

  // ── Money / Business ────────────────────────────────────────────
  { phrase: 'get the bag', normalized: 'make money', domain: 'money', dialect: 'aave' },
  { phrase: 'secure the bag', normalized: 'make money', domain: 'money', dialect: 'aave' },
  { phrase: 'chase the bag', normalized: 'pursue revenue', domain: 'money', dialect: 'aave' },
  { phrase: 'get my bread up', normalized: 'increase income', domain: 'money', dialect: 'aave' },
  { phrase: 'stack up', normalized: 'accumulate money', domain: 'money', dialect: 'aave' },
  { phrase: 'flip', normalized: 'resell for profit', domain: 'money', dialect: 'aave' },
  { phrase: 'flip it', normalized: 'resell for profit', domain: 'money', dialect: 'aave' },
  { phrase: 'hustle', normalized: 'business', domain: 'money', dialect: 'aave' },
  { phrase: 'side hustle', normalized: 'side business', domain: 'money', dialect: 'aave' },
  { phrase: 'grind', normalized: 'work hard', domain: 'money', dialect: 'aave' },
  { phrase: 'on my grind', normalized: 'working hard', domain: 'money', dialect: 'aave' },
  { phrase: 'eat', normalized: 'profit', domain: 'money', dialect: 'aave' },
  { phrase: 'eatin', normalized: 'profiting', domain: 'money', dialect: 'aave' },

  // ── Social / Growth ─────────────────────────────────────────────
  { phrase: 'blow up', normalized: 'go viral', domain: 'social', dialect: 'aave' },
  { phrase: 'go crazy', normalized: 'go viral', domain: 'social', dialect: 'aave' },
  { phrase: 'pop off', normalized: 'go viral', domain: 'social', dialect: 'aave' },
  { phrase: 'catch a vibe', normalized: 'engage audience', domain: 'social', dialect: 'aave' },
  { phrase: 'in the cut', normalized: 'in stealth mode', domain: 'social', dialect: 'aave' },
  { phrase: 'clout', normalized: 'influence', domain: 'social', dialect: 'aave' },
  { phrase: 'clout up', normalized: 'gain influence', domain: 'social', dialect: 'aave' },
  { phrase: 'mob', normalized: 'team', domain: 'social', dialect: 'aave' },
  { phrase: 'squad', normalized: 'team', domain: 'social', dialect: 'aave' },
  { phrase: 'gang', normalized: 'team', domain: 'social', dialect: 'aave' },
];

// ---------------------------------------------------------------------------
// Gen Z Dictionary
// ---------------------------------------------------------------------------

const GENZ_ENTRIES: SlangEntry[] = [
  // ── Actions ──────────────────────────────────────────────────────
  { phrase: 'vibe check', normalized: 'health check', domain: 'action', dialect: 'genz' },
  { phrase: 'bet', normalized: 'okay do it', domain: 'action', dialect: 'genz' },
  { phrase: 'say less', normalized: 'understood do it', domain: 'action', dialect: 'genz' },
  { phrase: 'slay', normalized: 'execute perfectly', domain: 'action', dialect: 'genz' },
  { phrase: 'ate', normalized: 'performed excellently', domain: 'action', dialect: 'genz' },
  { phrase: 'ate that', normalized: 'did great', domain: 'action', dialect: 'genz' },
  { phrase: 'ate and left no crumbs', normalized: 'executed flawlessly', domain: 'action', dialect: 'genz' },
  { phrase: 'understood the assignment', normalized: 'completed correctly', domain: 'action', dialect: 'genz' },
  { phrase: 'its giving', normalized: 'it looks like', domain: 'action', dialect: 'genz' },
  { phrase: 'lowkey', normalized: 'somewhat', domain: 'action', dialect: 'genz' },
  { phrase: 'highkey', normalized: 'definitely', domain: 'action', dialect: 'genz' },
  { phrase: 'deadass', normalized: 'seriously', domain: 'action', dialect: 'genz' },
  { phrase: 'fr fr', normalized: 'for real', domain: 'action', dialect: 'genz' },
  { phrase: 'no cap', normalized: 'seriously', domain: 'action', dialect: 'genz' },
  { phrase: 'ong', normalized: 'on god seriously', domain: 'action', dialect: 'genz' },
  { phrase: 'ngl', normalized: 'honestly', domain: 'action', dialect: 'genz' },
  { phrase: 'iykyk', normalized: 'if you know you know', domain: 'action', dialect: 'genz' },
  { phrase: 'rent free', normalized: 'constantly thinking about', domain: 'action', dialect: 'genz' },
  { phrase: 'touch grass', normalized: 'take a break', domain: 'action', dialect: 'genz' },
  { phrase: 'stan', normalized: 'strongly support', domain: 'action', dialect: 'genz' },
  { phrase: 'yeet', normalized: 'remove quickly', domain: 'action', dialect: 'genz' },
  { phrase: 'ghost', normalized: 'stop responding', domain: 'action', dialect: 'genz' },
  { phrase: 'finesse', normalized: 'optimize cleverly', domain: 'action', dialect: 'genz' },

  // ── Objects / Concepts ──────────────────────────────────────────
  { phrase: 'main character energy', normalized: 'standout brand presence', domain: 'object', dialect: 'genz' },
  { phrase: 'side quest', normalized: 'secondary task', domain: 'object', dialect: 'genz' },
  { phrase: 'npc', normalized: 'basic user', domain: 'object', dialect: 'genz' },
  { phrase: 'lore', normalized: 'backstory', domain: 'object', dialect: 'genz' },
  { phrase: 'rizz', normalized: 'charisma', domain: 'object', dialect: 'genz' },
  { phrase: 'aura', normalized: 'brand presence', domain: 'object', dialect: 'genz' },
  { phrase: 'era', normalized: 'phase', domain: 'object', dialect: 'genz' },
  { phrase: 'villain era', normalized: 'aggressive growth phase', domain: 'object', dialect: 'genz' },
  { phrase: 'flop era', normalized: 'failure period', domain: 'object', dialect: 'genz' },
  { phrase: 'glow up', normalized: 'major improvement', domain: 'object', dialect: 'genz' },
  { phrase: 'ick', normalized: 'dealbreaker', domain: 'object', dialect: 'genz' },
  { phrase: 'tea', normalized: 'information', domain: 'object', dialect: 'genz' },
  { phrase: 'receipts', normalized: 'evidence', domain: 'object', dialect: 'genz' },
  { phrase: 'vibes', normalized: 'brand feel', domain: 'object', dialect: 'genz' },

  // ── Quality ─────────────────────────────────────────────────────
  { phrase: 'bussin', normalized: 'excellent', domain: 'quality', dialect: 'genz' },
  { phrase: 'fire', normalized: 'excellent', domain: 'quality', dialect: 'genz' },
  { phrase: 'mid', normalized: 'mediocre', domain: 'quality', dialect: 'genz' },
  { phrase: 'sus', normalized: 'suspicious', domain: 'quality', dialect: 'genz' },
  { phrase: 'valid', normalized: 'good', domain: 'quality', dialect: 'genz' },
  { phrase: 'based', normalized: 'correct and confident', domain: 'quality', dialect: 'genz' },
  { phrase: 'cringe', normalized: 'embarrassingly bad', domain: 'quality', dialect: 'genz' },
  { phrase: 'basic', normalized: 'unoriginal', domain: 'quality', dialect: 'genz' },
  { phrase: 'extra', normalized: 'over the top', domain: 'quality', dialect: 'genz' },
  { phrase: 'snatched', normalized: 'perfectly done', domain: 'quality', dialect: 'genz' },
  { phrase: 'slept on', normalized: 'underrated', domain: 'quality', dialect: 'genz' },
  { phrase: 'goated', normalized: 'best in class', domain: 'quality', dialect: 'genz' },
  { phrase: 'elite', normalized: 'top tier', domain: 'quality', dialect: 'genz' },
  { phrase: 'hits different', normalized: 'uniquely good', domain: 'quality', dialect: 'genz' },
  { phrase: 'chefs kiss', normalized: 'perfect', domain: 'quality', dialect: 'genz' },
  { phrase: 'immaculate vibes', normalized: 'excellent quality', domain: 'quality', dialect: 'genz' },
  { phrase: 'on point', normalized: 'precisely done', domain: 'quality', dialect: 'genz' },

  // ── Money ───────────────────────────────────────────────────────
  { phrase: 'bag secured', normalized: 'deal closed', domain: 'money', dialect: 'genz' },
  { phrase: 'flexin', normalized: 'showing off success', domain: 'money', dialect: 'genz' },
  { phrase: 'drip', normalized: 'premium branding', domain: 'money', dialect: 'genz' },
  { phrase: 'bougie', normalized: 'premium tier', domain: 'money', dialect: 'genz' },
  { phrase: 'broke', normalized: 'free tier', domain: 'money', dialect: 'genz' },

  // ── Social / Growth ─────────────────────────────────────────────
  { phrase: 'main character', normalized: 'featured brand', domain: 'social', dialect: 'genz' },
  { phrase: 'caught in 4k', normalized: 'documented proof', domain: 'social', dialect: 'genz' },
  { phrase: 'ratio', normalized: 'outperform in engagement', domain: 'social', dialect: 'genz' },
  { phrase: 'l take', normalized: 'bad strategy', domain: 'social', dialect: 'genz' },
  { phrase: 'w take', normalized: 'winning strategy', domain: 'social', dialect: 'genz' },
  { phrase: 'fomo', normalized: 'urgency marketing', domain: 'social', dialect: 'genz' },
  { phrase: 'ratioed', normalized: 'outperformed', domain: 'social', dialect: 'genz' },
  { phrase: 'cancelled', normalized: 'reputation crisis', domain: 'social', dialect: 'genz' },
  { phrase: 'unhinged', normalized: 'creative unconventional', domain: 'social', dialect: 'genz' },
  { phrase: 'chronically online', normalized: 'very active on social', domain: 'social', dialect: 'genz' },
];

// ---------------------------------------------------------------------------
// Internet / Tech Slang (cross-generational)
// ---------------------------------------------------------------------------

const TECH_SLANG_ENTRIES: SlangEntry[] = [
  { phrase: 'ship it', normalized: 'deploy it', domain: 'action', dialect: 'tech' },
  { phrase: 'nuke it', normalized: 'delete everything', domain: 'action', dialect: 'tech' },
  { phrase: 'yolo deploy', normalized: 'deploy without testing', domain: 'action', dialect: 'tech' },
  { phrase: 'rage quit', normalized: 'abandon and restart', domain: 'action', dialect: 'tech' },
  { phrase: 'scope creep', normalized: 'expanding requirements', domain: 'object', dialect: 'tech' },
  { phrase: 'bikeshed', normalized: 'overthink trivial decisions', domain: 'action', dialect: 'tech' },
  { phrase: 'yak shaving', normalized: 'doing prerequisite tasks', domain: 'action', dialect: 'tech' },
  { phrase: 'dogfood', normalized: 'use our own product', domain: 'action', dialect: 'tech' },
  { phrase: 'rubber duck', normalized: 'explain the problem', domain: 'action', dialect: 'tech' },
  { phrase: 'bike shed it', normalized: 'discuss trivially', domain: 'action', dialect: 'tech' },
  { phrase: 'on fire', normalized: 'critical error', domain: 'quality', dialect: 'tech' },
  { phrase: 'dumpster fire', normalized: 'completely broken', domain: 'quality', dialect: 'tech' },
  { phrase: 'spaghetti', normalized: 'messy code', domain: 'quality', dialect: 'tech' },
  { phrase: 'duct tape', normalized: 'quick fix', domain: 'action', dialect: 'tech' },
  { phrase: 'pixel perfect', normalized: 'exactly right', domain: 'quality', dialect: 'tech' },
  { phrase: 'automagically', normalized: 'automatically', domain: 'action', dialect: 'tech' },
];

// ---------------------------------------------------------------------------
// Composite Intent Phrases
// These are full sentence patterns in slang that map to specific intents.
// ---------------------------------------------------------------------------

export interface IntentPhrase {
  pattern: RegExp;
  intent: string;
  confidence: number;
  dialect: string;
}

export const SLANG_INTENT_PHRASES: IntentPhrase[] = [
  // ── Deploy / Build ──────────────────────────────────────────────
  { pattern: /finna\s*(whip|cook|spin|build|make|set)\s*(up|somethin|something)?/i, intent: 'paas-deploy', confidence: 0.85, dialect: 'aave' },
  { pattern: /tryna\s*(get|set|build|spin|whip|make)\s*(up|somethin|something)?/i, intent: 'paas-deploy', confidence: 0.8, dialect: 'aave' },
  { pattern: /hook\s*me\s*up\s*with\s*(a|an|the|some)?\s*(tool|app|bot|agent|site|website)/i, intent: 'paas-deploy', confidence: 0.9, dialect: 'aave' },
  { pattern: /spin\s*somethin\s*up/i, intent: 'paas-deploy', confidence: 0.9, dialect: 'aave' },
  { pattern: /lemme\s*get\s*(a|an|that)?\s*(tool|app|bot|agent|service)/i, intent: 'paas-deploy', confidence: 0.85, dialect: 'aave' },
  { pattern: /put\s*me\s*on\s*(to|with)?\s*(a|an|some)?\s*(tool|app|game|service)/i, intent: 'paas-catalog', confidence: 0.85, dialect: 'aave' },
  { pattern: /ship\s*it/i, intent: 'paas-deploy', confidence: 0.85, dialect: 'tech' },
  { pattern: /just\s*ship/i, intent: 'paas-deploy', confidence: 0.8, dialect: 'tech' },
  { pattern: /say\s*less.*build/i, intent: 'paas-deploy', confidence: 0.85, dialect: 'genz' },
  { pattern: /bet.*deploy/i, intent: 'paas-deploy', confidence: 0.85, dialect: 'genz' },
  { pattern: /set\s*(up|me\s*up)\s*(with|a|some)/i, intent: 'paas-deploy', confidence: 0.8, dialect: 'general' },

  // ── Content / Video ─────────────────────────────────────────────
  { pattern: /make\s*(it|that|some|a)?\s*(vid|video|clip|reel|content)\s*(bussin|fire|go\s*crazy)?/i, intent: 'content-pipeline', confidence: 0.9, dialect: 'genz' },
  { pattern: /cook\s*(up|me)?\s*(a|some)?\s*(vid|video|content|ad|clip)/i, intent: 'content-pipeline', confidence: 0.9, dialect: 'aave' },
  { pattern: /whip\s*up\s*(a|some)?\s*(vid|video|content|ad)/i, intent: 'content-pipeline', confidence: 0.9, dialect: 'aave' },
  { pattern: /need\s*(some|a)?\s*(fire|bussin|hard|crazy)?\s*(content|vid|video|ad|creative)/i, intent: 'content-pipeline', confidence: 0.85, dialect: 'general' },
  { pattern: /turn\s*this.*into\s*(a|some)?\s*(vid|video|content|ad)/i, intent: 'content-pipeline', confidence: 0.9, dialect: 'general' },
  { pattern: /i\s*got\s*(a|this)?\s*(product|link|item).*make\s*(a|some)?\s*(vid|video|ad)/i, intent: 'content-pipeline', confidence: 0.95, dialect: 'general' },
  { pattern: /tiktok\s*(vid|video|content|ad)/i, intent: 'content-pipeline', confidence: 0.9, dialect: 'general' },
  { pattern: /reels?\s*(content|video)/i, intent: 'content-pipeline', confidence: 0.9, dialect: 'general' },

  // ── Money / Revenue ─────────────────────────────────────────────
  { pattern: /tryna\s*(get|secure|chase)\s*(the|my|this)?\s*(bag|bread|money|gwop)/i, intent: 'vertical:idea-generator', confidence: 0.85, dialect: 'aave' },
  { pattern: /finna\s*(get|secure|stack)\s*(my|this|the)?\s*(money|bag|bread|paper)/i, intent: 'vertical:idea-generator', confidence: 0.85, dialect: 'aave' },
  { pattern: /how\s*(do\s*i|can\s*i|to)\s*(get|make|stack|secure)\s*(more\s*)?(money|bread|bag|income|paper|bands)/i, intent: 'vertical:idea-generator', confidence: 0.9, dialect: 'general' },
  { pattern: /need\s*(to|a)?\s*(side|new)?\s*hustle/i, intent: 'vertical:idea-generator', confidence: 0.9, dialect: 'aave' },
  { pattern: /start\s*(a|my)?\s*(side)?\s*hustle/i, intent: 'vertical:idea-generator', confidence: 0.9, dialect: 'aave' },
  { pattern: /level\s*up\s*(my)?\s*(income|money|business|game)/i, intent: 'vertical:idea-generator', confidence: 0.85, dialect: 'general' },

  // ── Status / Health ─────────────────────────────────────────────
  { pattern: /vibe\s*check\s*(on|my|the)?/i, intent: 'paas-status', confidence: 0.85, dialect: 'genz' },
  { pattern: /how('s|s)?\s*(my\s*)?jawn(s)?\s*(doing|looking|running)?/i, intent: 'paas-status', confidence: 0.85, dialect: 'aave' },
  { pattern: /what('s|s)?\s*good\s*with\s*(my|the)/i, intent: 'paas-status', confidence: 0.8, dialect: 'aave' },
  { pattern: /is\s*(it|my\s*\w+)\s*(still\s*)?(up|running|alive|good|bussin)/i, intent: 'paas-status', confidence: 0.85, dialect: 'general' },
  { pattern: /everything\s*(still\s*)?(good|gucci|straight|cool|aight)/i, intent: 'paas-status', confidence: 0.8, dialect: 'general' },

  // ── Stop / Remove ───────────────────────────────────────────────
  { pattern: /kill\s*(it|that|this|the\s*\w+)/i, intent: 'paas-stop', confidence: 0.85, dialect: 'general' },
  { pattern: /dead\s*(it|that|this)/i, intent: 'paas-stop', confidence: 0.85, dialect: 'aave' },
  { pattern: /yeet\s*(it|that|this)/i, intent: 'paas-stop', confidence: 0.85, dialect: 'genz' },
  { pattern: /nuke\s*(it|that|this|the)/i, intent: 'paas-stop', confidence: 0.85, dialect: 'tech' },
  { pattern: /shut\s*(it|this|that)\s*(down|off)/i, intent: 'paas-stop', confidence: 0.9, dialect: 'general' },

  // ── Frustration (help detect user mood) ─────────────────────────
  { pattern: /this\s*(jawn|thing|app|tool|shit)\s*(is\s*)?(busted|broke|janky|trash|mid|buggin|trippin|wildin)/i, intent: 'refine:frustration', confidence: 0.85, dialect: 'general' },
  { pattern: /bruh\s*(it|this|that|what)('s|\s*is)?\s*(not|ain't)?\s*(working|broken)/i, intent: 'refine:frustration', confidence: 0.85, dialect: 'general' },
  { pattern: /smh.*broken/i, intent: 'refine:frustration', confidence: 0.8, dialect: 'general' },
  { pattern: /wtf\s*(is|happened)/i, intent: 'refine:frustration', confidence: 0.8, dialect: 'general' },

  // ── Catalog / Exploration ───────────────────────────────────────
  { pattern: /what\s*(you|yall|y'all)\s*(got|have)/i, intent: 'paas-catalog', confidence: 0.85, dialect: 'general' },
  { pattern: /show\s*me\s*what\s*you\s*(got|have)/i, intent: 'paas-catalog', confidence: 0.9, dialect: 'general' },
  { pattern: /whatchu\s*got/i, intent: 'paas-catalog', confidence: 0.85, dialect: 'aave' },
  { pattern: /what\s*can\s*i\s*do\s*(with\s*this|here|up\s*in\s*here)/i, intent: 'paas-catalog', confidence: 0.85, dialect: 'general' },
  { pattern: /put\s*me\s*on\s*(to\s*)?(something|somethin|the\s*game)/i, intent: 'paas-catalog', confidence: 0.85, dialect: 'aave' },

  // ── Growth / Social ─────────────────────────────────────────────
  { pattern: /how\s*(do\s*i|can\s*i|to)\s*(blow\s*up|go\s*viral|pop\s*off|get\s*clout)/i, intent: 'refine:growth', confidence: 0.9, dialect: 'general' },
  { pattern: /tryna\s*(blow\s*up|go\s*viral|get\s*clout|pop\s*off)/i, intent: 'refine:growth', confidence: 0.85, dialect: 'aave' },
  { pattern: /make\s*(my|this|the)\s*(brand|page|account|business)\s*(pop|blow\s*up|go\s*crazy)/i, intent: 'refine:growth', confidence: 0.9, dialect: 'general' },

  // ── Automation / Workflow ───────────────────────────────────────
  { pattern: /make\s*(it|this|that)\s*(do\s*itself|automatic|automagic|run\s*itself)/i, intent: 'workflow-pipeline', confidence: 0.85, dialect: 'general' },
  { pattern: /set\s*it\s*and\s*forget\s*it/i, intent: 'workflow-pipeline', confidence: 0.9, dialect: 'general' },
  { pattern: /i\s*(don't|dont)\s*wanna\s*(do|touch|deal\s*with)\s*(this|that|it)\s*(anymore|again|no\s*more)/i, intent: 'workflow-pipeline', confidence: 0.85, dialect: 'general' },
  { pattern: /on\s*autopilot/i, intent: 'workflow-pipeline', confidence: 0.85, dialect: 'general' },
];

// ---------------------------------------------------------------------------
// Registry & Exports
// ---------------------------------------------------------------------------

export const DIALECT_REGISTRIES: DialectRegistry[] = [
  { name: 'AAVE / Ebonics', code: 'aave', entries: AAVE_ENTRIES },
  { name: 'Gen Z', code: 'genz', entries: GENZ_ENTRIES },
  { name: 'Tech Slang', code: 'tech', entries: TECH_SLANG_ENTRIES },
];

/** All slang entries flattened into a single array */
export const ALL_SLANG_ENTRIES: SlangEntry[] = DIALECT_REGISTRIES.flatMap(r => r.entries);

/** Total count for stats */
export const SLANG_ENTRY_COUNT = ALL_SLANG_ENTRIES.length;
export const INTENT_PHRASE_COUNT = SLANG_INTENT_PHRASES.length;
