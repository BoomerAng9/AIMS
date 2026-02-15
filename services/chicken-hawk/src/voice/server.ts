// =============================================================================
// Chicken Hawk — Voice Gateway (port 4004)
// Routes voice I/O for spoken deployment commands through the same
// policy gates as text commands.
//
// Flow: User speaks → STT → ACHEEVY intent → Manifest → TTS → Audio playback
//
// Providers (controlled by Circuit Box voice_provider_routing lever):
//   STT: Groq Whisper (primary) / Deepgram Nova-3 (fallback)
//   TTS: ElevenLabs (primary) / Deepgram Aura-2 (fallback)
//
// Endpoints:
//   GET  /health          — Health check
//   POST /api/stt         — Speech-to-text (accepts audio buffer)
//   POST /api/tts         — Text-to-speech (returns audio buffer)
//   POST /api/voice-command — Full voice command pipeline
//   GET  /api/providers   — Current provider routing status
// =============================================================================

import express, { Request, Response } from "express";

const app = express();
const PORT = parseInt(process.env.PORT || "4004", 10);
const startTime = Date.now();

// Provider config
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB"; // Adam
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

// Determine active providers from Circuit Box config
let voiceProvider: "elevenlabs" | "deepgram" | "browser" = "elevenlabs";

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.raw({ type: "audio/*", limit: "10mb" }));
app.use((_req: Request, res: Response, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (_req.method === "OPTIONS") { res.sendStatus(204); return; }
  next();
});

// ---------------------------------------------------------------------------
// GET /health
// ---------------------------------------------------------------------------
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "chickenhawk-voice-gateway",
    version: "1.0.0",
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    providers: {
      stt: GROQ_API_KEY ? "groq-whisper" : DEEPGRAM_API_KEY ? "deepgram-nova3" : "unavailable",
      tts: voiceProvider === "elevenlabs" && ELEVENLABS_API_KEY
        ? "elevenlabs"
        : DEEPGRAM_API_KEY ? "deepgram-aura2" : "unavailable",
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/stt — Speech-to-Text
// Accepts audio buffer, returns transcript
// ---------------------------------------------------------------------------
app.post("/api/stt", async (req: Request, res: Response) => {
  try {
    const audioBuffer = req.body as Buffer;

    if (!audioBuffer || audioBuffer.length === 0) {
      res.status(400).json({ error: "No audio data provided" });
      return;
    }

    // Try Groq Whisper first (primary)
    if (GROQ_API_KEY) {
      try {
        const transcript = await sttGroqWhisper(audioBuffer);
        res.json({ transcript, provider: "groq-whisper", duration_ms: 0 });
        return;
      } catch (err) {
        console.warn("[voice] Groq Whisper failed, falling back to Deepgram:", err);
      }
    }

    // Fallback: Deepgram Nova-3
    if (DEEPGRAM_API_KEY) {
      const transcript = await sttDeepgram(audioBuffer);
      res.json({ transcript, provider: "deepgram-nova3", duration_ms: 0 });
      return;
    }

    res.status(503).json({ error: "No STT provider available" });
  } catch (err) {
    console.error("[voice] STT error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "STT failed" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/tts — Text-to-Speech
// Accepts { text, voice_id? }, returns audio buffer
// ---------------------------------------------------------------------------
app.post("/api/tts", async (req: Request, res: Response) => {
  try {
    const { text, voice_id } = req.body as { text: string; voice_id?: string };

    if (!text) {
      res.status(400).json({ error: "No text provided" });
      return;
    }

    // ElevenLabs primary
    if (voiceProvider === "elevenlabs" && ELEVENLABS_API_KEY) {
      try {
        const audio = await ttsElevenLabs(text, voice_id || ELEVENLABS_VOICE_ID);
        res.setHeader("Content-Type", "audio/mpeg");
        res.send(Buffer.from(audio));
        return;
      } catch (err) {
        console.warn("[voice] ElevenLabs failed, falling back to Deepgram:", err);
      }
    }

    // Fallback: Deepgram Aura-2
    if (DEEPGRAM_API_KEY) {
      const audio = await ttsDeepgram(text);
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(Buffer.from(audio));
      return;
    }

    res.status(503).json({ error: "No TTS provider available" });
  } catch (err) {
    console.error("[voice] TTS error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "TTS failed" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/voice-command — Full voice pipeline
// Audio in → STT → forward to core → TTS → audio out
// ---------------------------------------------------------------------------
app.post("/api/voice-command", async (req: Request, res: Response) => {
  try {
    const { audio_base64, shift_id } = req.body as { audio_base64: string; shift_id?: string };

    if (!audio_base64) {
      res.status(400).json({ error: "No audio_base64 provided" });
      return;
    }

    const audioBuffer = Buffer.from(audio_base64, "base64");

    // Step 1: STT
    let transcript: string;
    if (GROQ_API_KEY) {
      transcript = await sttGroqWhisper(audioBuffer);
    } else if (DEEPGRAM_API_KEY) {
      transcript = await sttDeepgram(audioBuffer);
    } else {
      res.status(503).json({ error: "No STT provider available" });
      return;
    }

    console.log(`[voice] Transcript: "${transcript}"`);

    // Step 2: Forward to chickenhawk-core as a text command
    const coreUrl = process.env.CORE_URL || "http://chickenhawk-core:4001";
    const coreRes = await fetch(`${coreUrl}/api/manifest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        manifest_id: `MF-VOICE-${Date.now()}`,
        requested_by: "ACHEEVY-VOICE",
        approved_by: "voice-gateway",
        shift_id: shift_id || `SFT-V${String(Date.now() % 1000).padStart(3, "0")}`,
        plan: { waves: [] }, // ACHEEVY would populate this from the transcript
        budget_limit_usd: 1.0,
        timeout_seconds: 60,
        created_at: new Date().toISOString(),
        metadata: { source: "voice", transcript },
      }),
    });

    const coreResult = await coreRes.json();

    // Step 3: TTS the response
    const responseText = formatResponse(coreResult);
    let audioResponse: ArrayBuffer | null = null;

    if (voiceProvider === "elevenlabs" && ELEVENLABS_API_KEY) {
      audioResponse = await ttsElevenLabs(responseText, ELEVENLABS_VOICE_ID);
    } else if (DEEPGRAM_API_KEY) {
      audioResponse = await ttsDeepgram(responseText);
    }

    res.json({
      transcript,
      response_text: responseText,
      audio_base64: audioResponse ? Buffer.from(audioResponse).toString("base64") : null,
      core_result: coreResult,
    });
  } catch (err) {
    console.error("[voice] Voice command error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Voice command failed" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/providers — Current provider status
// ---------------------------------------------------------------------------
app.get("/api/providers", (_req: Request, res: Response) => {
  res.json({
    voice_provider_routing: voiceProvider,
    stt: {
      primary: { provider: "groq-whisper", model: "whisper-large-v3-turbo", available: !!GROQ_API_KEY },
      fallback: { provider: "deepgram-nova3", model: "nova-3", available: !!DEEPGRAM_API_KEY },
    },
    tts: {
      primary: { provider: "elevenlabs", voice_id: ELEVENLABS_VOICE_ID, available: !!ELEVENLABS_API_KEY },
      fallback: { provider: "deepgram-aura2", model: "aura-asteria-en", available: !!DEEPGRAM_API_KEY },
    },
  });
});

// ---------------------------------------------------------------------------
// Provider implementations
// ---------------------------------------------------------------------------
async function sttGroqWhisper(audio: Buffer): Promise<string> {
  const formData = new FormData();
  formData.append("file", new Blob([audio], { type: "audio/webm" }), "audio.webm");
  formData.append("model", "whisper-large-v3-turbo");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    body: formData,
  });

  if (!res.ok) throw new Error(`Groq STT failed: ${res.status}`);
  const data = await res.json() as { text: string };
  return data.text;
}

async function sttDeepgram(audio: Buffer): Promise<string> {
  const res = await fetch("https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true", {
    method: "POST",
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
      "Content-Type": "audio/webm",
    },
    body: audio,
  });

  if (!res.ok) throw new Error(`Deepgram STT failed: ${res.status}`);
  const data = await res.json() as { results: { channels: Array<{ alternatives: Array<{ transcript: string }> }> } };
  return data.results.channels[0]?.alternatives[0]?.transcript || "";
}

async function ttsElevenLabs(text: string, voiceId: string): Promise<ArrayBuffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2_5",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!res.ok) throw new Error(`ElevenLabs TTS failed: ${res.status}`);
  return res.arrayBuffer();
}

async function ttsDeepgram(text: string): Promise<ArrayBuffer> {
  const res = await fetch("https://api.deepgram.com/v1/speak?model=aura-asteria-en", {
    method: "POST",
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) throw new Error(`Deepgram TTS failed: ${res.status}`);
  return res.arrayBuffer();
}

function formatResponse(result: Record<string, unknown>): string {
  if (result.error) return `Execution failed: ${result.error}`;
  if (result.status === "completed") return "Deployment completed successfully.";
  if (result.status === "failed") return "Deployment failed. Check audit logs for details.";
  if (result.queued) return "Manifest accepted and queued for execution.";
  return "Command processed.";
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[chickenhawk-voice-gateway] Voice Gateway on port ${PORT}`);
  console.log(`[chickenhawk-voice-gateway] Provider: ${voiceProvider}`);
  console.log(`[chickenhawk-voice-gateway] STT: ${GROQ_API_KEY ? "Groq Whisper" : DEEPGRAM_API_KEY ? "Deepgram" : "NONE"}`);
  console.log(`[chickenhawk-voice-gateway] TTS: ${ELEVENLABS_API_KEY ? "ElevenLabs" : DEEPGRAM_API_KEY ? "Deepgram" : "NONE"}`);
});
