/**
 * TTS Client — Text-to-Speech via ElevenLabs
 *
 * Generates audio from text for DIY voice+vision mode.
 * Primary provider: ElevenLabs v1 API
 * Fallback: Returns null (DIY mode still works, just without audio)
 *
 * Audio files are written to a temp directory and served via the
 * ACHEEVY /audio/:id route. In production, these could go to R2/GCS.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // "Adam" default
const ELEVENLABS_MODEL = process.env.ELEVENLABS_MODEL || 'eleven_monolingual_v1';
const AUDIO_DIR = process.env.TTS_AUDIO_DIR || '/tmp/aims-tts-audio';
const AUDIO_BASE_URL = process.env.TTS_AUDIO_BASE_URL || '/api/acheevy/audio';
const MAX_TEXT_LENGTH = 5000; // ElevenLabs limit per request

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TTSResult {
  audioUrl: string | null;
  audioId: string;
  durationEstimateMs: number;
  provider: 'elevenlabs' | 'none';
  error?: string;
}

// ---------------------------------------------------------------------------
// TTS Client
// ---------------------------------------------------------------------------

export class TTSClient {
  private initialized = false;

  private async ensureAudioDir(): Promise<void> {
    if (this.initialized) return;
    await fs.mkdir(AUDIO_DIR, { recursive: true });
    this.initialized = true;
  }

  /**
   * Generate speech audio from text.
   * Returns a URL to the generated audio file, or null if TTS is unavailable.
   */
  async generateSpeech(text: string): Promise<TTSResult> {
    const audioId = uuidv4();

    if (!ELEVENLABS_API_KEY) {
      return {
        audioUrl: null,
        audioId,
        durationEstimateMs: 0,
        provider: 'none',
        error: 'ELEVENLABS_API_KEY not configured',
      };
    }

    try {
      // Truncate text if too long
      const truncated = text.length > MAX_TEXT_LENGTH
        ? text.slice(0, MAX_TEXT_LENGTH) + '...'
        : text;

      // Strip markdown formatting for cleaner speech
      const cleanText = stripMarkdown(truncated);

      if (cleanText.trim().length === 0) {
        return {
          audioUrl: null,
          audioId,
          durationEstimateMs: 0,
          provider: 'none',
          error: 'Empty text after cleanup',
        };
      }

      // Call ElevenLabs API
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: ELEVENLABS_MODEL,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          audioUrl: null,
          audioId,
          durationEstimateMs: 0,
          provider: 'elevenlabs',
          error: `ElevenLabs API error ${response.status}: ${errorText}`,
        };
      }

      // Write audio to file
      await this.ensureAudioDir();
      const filename = `${audioId}.mp3`;
      const filepath = join(AUDIO_DIR, filename);
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(filepath, buffer);

      // Estimate duration (~150 words/min for TTS, ~5 chars/word)
      const wordCount = cleanText.split(/\s+/).length;
      const durationEstimateMs = Math.round((wordCount / 150) * 60 * 1000);

      return {
        audioUrl: `${AUDIO_BASE_URL}/${audioId}`,
        audioId,
        durationEstimateMs,
        provider: 'elevenlabs',
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'TTS generation failed';
      return {
        audioUrl: null,
        audioId,
        durationEstimateMs: 0,
        provider: 'elevenlabs',
        error: msg,
      };
    }
  }

  /**
   * Get the file path for a generated audio file.
   */
  getAudioPath(audioId: string): string {
    return join(AUDIO_DIR, `${audioId}.mp3`);
  }

  /**
   * Clean up old audio files (call periodically).
   */
  async cleanupOldFiles(maxAgeMs: number = 3600_000): Promise<number> {
    try {
      await this.ensureAudioDir();
      const files = await fs.readdir(AUDIO_DIR);
      const now = Date.now();
      let cleaned = 0;

      for (const file of files) {
        const filepath = join(AUDIO_DIR, file);
        const stat = await fs.stat(filepath);
        if (now - stat.mtimeMs > maxAgeMs) {
          await fs.unlink(filepath);
          cleaned++;
        }
      }

      return cleaned;
    } catch {
      return 0;
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip markdown formatting for cleaner TTS output.
 */
function stripMarkdown(text: string): string {
  return text
    // Remove bold/italic markers
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    // Remove bullet points
    .replace(/^[•\-\*]\s+/gm, '')
    // Remove numbered list markers
    .replace(/^\d+\.\s+/gm, '')
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Collapse multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const ttsClient = new TTSClient();
