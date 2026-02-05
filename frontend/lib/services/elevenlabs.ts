/**
 * ElevenLabs Service - Text-to-Speech
 */

export interface TTSOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

export class ElevenLabsService {
  private apiKey: string;
  private defaultVoiceId: string;
  private baseUrl = "https://api.elevenlabs.io/v1";

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || "";
    this.defaultVoiceId = process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";
  }

  /**
   * Convert text to speech and return audio buffer
   */
  async textToSpeech(text: string, options: TTSOptions = {}): Promise<ArrayBuffer> {
    const {
      voiceId = this.defaultVoiceId,
      modelId = "eleven_monolingual_v1",
      stability = 0.5,
      similarityBoost = 0.75,
    } = options;

    const response = await fetch(
      `${this.baseUrl}/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Convert text to speech and return base64 data URL
   */
  async textToSpeechDataUrl(text: string, options: TTSOptions = {}): Promise<string> {
    const audioBuffer = await this.textToSpeech(text, options);
    const base64 = Buffer.from(audioBuffer).toString("base64");
    return `data:audio/mpeg;base64,${base64}`;
  }

  /**
   * List available voices
   */
  async getVoices(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        "xi-api-key": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    return response.json();
  }
}

export const elevenLabsService = new ElevenLabsService();
