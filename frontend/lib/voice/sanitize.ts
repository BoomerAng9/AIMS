/**
 * TTS Sanitizer — Strip markdown, icons, and formatting before speech synthesis.
 *
 * The LLM returns markdown-formatted text (**, ##, *, code blocks, etc.)
 * which TTS engines read literally ("star star", "pound sign", "wrench").
 * This module converts markdown to clean, speakable prose.
 */

/**
 * Strip all markdown formatting and return clean text suitable for TTS.
 *
 * Handles: headings, bold, italic, strikethrough, links, images,
 * code blocks, inline code, blockquotes, horizontal rules, lists,
 * tables, HTML tags, and common emoji/icon artifacts.
 */
export function sanitizeForTTS(text: string): string {
  if (!text) return '';

  let clean = text;

  // Remove code blocks (fenced) — these shouldn't be spoken
  clean = clean.replace(/```[\s\S]*?```/g, '');

  // Remove inline code — keep the text inside
  clean = clean.replace(/`([^`]+)`/g, '$1');

  // Remove images ![alt](url)
  clean = clean.replace(/!\[([^\]]*)\]\([^)]*\)/g, '');

  // Convert links [text](url) → just the text
  clean = clean.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // Remove horizontal rules
  clean = clean.replace(/^[-*_]{3,}\s*$/gm, '');

  // Remove headings markers (keep the text)
  clean = clean.replace(/^#{1,6}\s+/gm, '');

  // Remove bold/italic markers (keep the text)
  // Order matters: bold+italic first, then bold, then italic
  clean = clean.replace(/\*\*\*(.+?)\*\*\*/g, '$1');
  clean = clean.replace(/___(.+?)___/g, '$1');
  clean = clean.replace(/\*\*(.+?)\*\*/g, '$1');
  clean = clean.replace(/__(.+?)__/g, '$1');
  clean = clean.replace(/\*(.+?)\*/g, '$1');
  clean = clean.replace(/_(.+?)_/g, '$1');

  // Remove strikethrough
  clean = clean.replace(/~~(.+?)~~/g, '$1');

  // Remove blockquote markers
  clean = clean.replace(/^>\s+/gm, '');

  // Remove unordered list markers
  clean = clean.replace(/^[\s]*[-*+]\s+/gm, '');

  // Remove ordered list numbers (keep the text)
  clean = clean.replace(/^[\s]*\d+\.\s+/gm, '');

  // Remove table formatting
  clean = clean.replace(/\|/g, ', ');
  clean = clean.replace(/^[-:|\s]+$/gm, '');

  // Remove HTML tags
  clean = clean.replace(/<[^>]+>/g, '');

  // Remove HTML entities
  clean = clean.replace(/&amp;/g, 'and');
  clean = clean.replace(/&lt;/g, '');
  clean = clean.replace(/&gt;/g, '');
  clean = clean.replace(/&nbsp;/g, ' ');
  clean = clean.replace(/&mdash;/g, ' — ');
  clean = clean.replace(/&ndash;/g, ' – ');
  clean = clean.replace(/&bull;/g, ', ');
  clean = clean.replace(/&#?\w+;/g, '');

  // Remove leftover asterisks and pound signs that might slip through
  clean = clean.replace(/(?<!\w)\*+(?!\w)/g, '');
  clean = clean.replace(/(?<!\w)#+(?!\w)/g, '');

  // Remove task list markers
  clean = clean.replace(/\[[ x]\]\s*/gi, '');

  // Collapse multiple newlines into periods for natural pauses
  clean = clean.replace(/\n{2,}/g, '. ');
  clean = clean.replace(/\n/g, ' ');

  // Collapse multiple spaces
  clean = clean.replace(/\s{2,}/g, ' ');

  // Remove leading/trailing whitespace and periods
  clean = clean.trim();

  // Remove sequences of just punctuation/spaces
  clean = clean.replace(/^[.,;:\s]+/, '');
  clean = clean.replace(/[.,;:\s]+$/, '');

  return clean;
}
