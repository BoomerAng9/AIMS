/**
 * NLP Input Normalizer — Slang-to-Intent Pre-Processor
 *
 * Runs BEFORE the vertical trigger classifier. Takes raw user input
 * and normalizes colloquial language into platform-recognizable terms.
 *
 * Pipeline:
 *   1. Check SLANG_INTENT_PHRASES for full-sentence slang patterns → direct intent match
 *   2. Run word/phrase replacement from urban dictionaries → normalized text
 *   3. Pass normalized text to the standard classifier
 *
 * This ensures "tryna whip up a vid for my product" routes correctly
 * to the content-pipeline intent instead of falling through to
 * "conversational" default.
 */

import {
  ALL_SLANG_ENTRIES,
  SLANG_INTENT_PHRASES,
  DIALECT_REGISTRIES,
  type SlangEntry,
  type IntentPhrase,
} from './urban-dictionary';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NormalizationResult {
  /** Original input */
  original: string;
  /** Normalized text after slang replacement */
  normalized: string;
  /** Whether any slang was detected */
  slangDetected: boolean;
  /** Which dialects were detected */
  dialectsDetected: string[];
  /** Direct intent match from full-phrase patterns (skip classifier) */
  directIntent?: {
    intent: string;
    confidence: number;
    dialect: string;
    matchedPhrase: string;
  };
  /** Individual replacements made */
  replacements: Array<{ from: string; to: string; dialect: string }>;
}

// ---------------------------------------------------------------------------
// Pre-build lookup structures for performance
// ---------------------------------------------------------------------------

// Sort entries by phrase length (longest first) to prevent partial matches
const SORTED_ENTRIES = [...ALL_SLANG_ENTRIES].sort(
  (a, b) => b.phrase.length - a.phrase.length
);

// Build a word-boundary-aware regex for each entry
const ENTRY_PATTERNS: Array<{ entry: SlangEntry; regex: RegExp }> = SORTED_ENTRIES.map(entry => ({
  entry,
  regex: new RegExp(`\\b${escapeRegex(entry.phrase)}\\b`, 'gi'),
}));

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Core normalizer
// ---------------------------------------------------------------------------

/**
 * Normalize user input by replacing slang/colloquial phrases with
 * platform-standard terminology.
 */
export function normalizeInput(raw: string): NormalizationResult {
  const result: NormalizationResult = {
    original: raw,
    normalized: raw,
    slangDetected: false,
    dialectsDetected: [],
    replacements: [],
  };

  if (!raw || typeof raw !== 'string') return result;

  // ── Step 1: Check full-phrase intent patterns ─────────────────
  // These are complete sentence patterns that map directly to intents
  // (e.g., "finna whip somethin up" → paas-deploy)
  for (const phrase of SLANG_INTENT_PHRASES) {
    if (phrase.pattern.test(raw)) {
      result.directIntent = {
        intent: phrase.intent,
        confidence: phrase.confidence,
        dialect: phrase.dialect,
        matchedPhrase: phrase.pattern.source,
      };
      result.slangDetected = true;
      if (!result.dialectsDetected.includes(phrase.dialect)) {
        result.dialectsDetected.push(phrase.dialect);
      }
      logger.debug(
        { input: raw, intent: phrase.intent, dialect: phrase.dialect },
        '[NLP] Direct slang intent match'
      );
      break; // First match wins (patterns are ordered by priority)
    }
  }

  // ── Step 2: Word/phrase replacements ──────────────────────────
  // Even if we got a direct intent, still normalize the text for
  // context extraction and logging.
  let normalized = raw;

  for (const { entry, regex } of ENTRY_PATTERNS) {
    if (regex.test(normalized)) {
      // Reset regex lastIndex (stateful with 'g' flag)
      regex.lastIndex = 0;

      normalized = normalized.replace(regex, entry.normalized);
      result.slangDetected = true;
      result.replacements.push({
        from: entry.phrase,
        to: entry.normalized,
        dialect: entry.dialect,
      });

      if (!result.dialectsDetected.includes(entry.dialect)) {
        result.dialectsDetected.push(entry.dialect);
      }
    }
    // Reset for next check
    regex.lastIndex = 0;
  }

  result.normalized = normalized;

  if (result.slangDetected) {
    logger.debug(
      {
        original: raw,
        normalized,
        dialects: result.dialectsDetected,
        replacementCount: result.replacements.length,
      },
      '[NLP] Input normalized from colloquial language'
    );
  }

  return result;
}

/**
 * Quick check: does this input contain any known slang?
 * Faster than full normalization when you just need a boolean.
 */
export function containsSlang(input: string): boolean {
  if (!input) return false;
  const lower = input.toLowerCase();
  return SORTED_ENTRIES.some(entry => lower.includes(entry.phrase));
}

/**
 * Get supported dialects and their entry counts for /api/nlp/stats
 */
export function getDialectStats(): Array<{ name: string; code: string; entryCount: number }> {
  return DIALECT_REGISTRIES.map(r => ({
    name: r.name,
    code: r.code,
    entryCount: r.entries.length,
  }));
}
