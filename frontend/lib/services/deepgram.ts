/**
 * Deepgram Service - Speech-to-Text
 */

import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

export interface STTOptions {
  model?: string;
  language?: string;
  punctuate?: boolean;
  diarize?: boolean;
}

export class DeepgramService {
  private client;

  constructor() {
    this.client = createClient(process.env.DEEPGRAM_API_KEY || "");
  }

  /**
   * Transcribe audio file
   */
  async transcribeFile(
    audioBuffer: Buffer,
    options: STTOptions = {}
  ): Promise<string> {
    const {
      model = "nova-2",
      language = "en-US",
      punctuate = true,
      diarize = false,
    } = options;

    const { result, error } = await this.client.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model,
        language,
        punctuate,
        diarize,
      }
    );

    if (error) {
      throw new Error(`Deepgram transcription error: ${error.message}`);
    }

    return result.results.channels[0]?.alternatives[0]?.transcript || "";
  }

  /**
   * Transcribe from URL
   */
  async transcribeUrl(
    audioUrl: string,
    options: STTOptions = {}
  ): Promise<string> {
    const {
      model = "nova-2",
      language = "en-US",
      punctuate = true,
      diarize = false,
    } = options;

    const { result, error } = await this.client.listen.prerecorded.transcribeUrl(
      { url: audioUrl },
      {
        model,
        language,
        punctuate,
        diarize,
      }
    );

    if (error) {
      throw new Error(`Deepgram transcription error: ${error.message}`);
    }

    return result.results.channels[0]?.alternatives[0]?.transcript || "";
  }

  /**
   * Create live transcription connection
   */
  createLiveTranscription(
    onTranscript: (transcript: string) => void,
    options: STTOptions = {}
  ) {
    const {
      model = "nova-2",
      language = "en-US",
      punctuate = true,
    } = options;

    const connection = this.client.listen.live({
      model,
      language,
      punctuate,
      interim_results: true,
    });

    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      const transcript = data.channel.alternatives[0]?.transcript;
      if (transcript && transcript.trim() !== "") {
        onTranscript(transcript);
      }
    });

    return connection;
  }
}

export const deepgramService = new DeepgramService();
