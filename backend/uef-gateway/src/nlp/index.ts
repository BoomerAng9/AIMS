/**
 * NLP Module — Colloquial Language Normalization + Intent Detection
 *
 * Bridges the gap between how real people talk and what the classifier
 * understands. Supports AAVE/Ebonics, Gen Z slang, and tech jargon.
 */

export { normalizeInput, containsSlang, getDialectStats } from './normalizer';
export type { NormalizationResult } from './normalizer';

export {
  ALL_SLANG_ENTRIES,
  SLANG_INTENT_PHRASES,
  DIALECT_REGISTRIES,
  SLANG_ENTRY_COUNT,
  INTENT_PHRASE_COUNT,
} from './urban-dictionary';
export type { SlangEntry, IntentPhrase, DialectRegistry } from './urban-dictionary';
