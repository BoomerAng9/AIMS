---
name: nvidia-personaplex
displayName: NVIDIA PersonaPlex — Full-Duplex Voice Agent
version: 1.0.0
triggers: ["personaplex", "persona plex", "full duplex voice", "nvidia voice"]
type: integration
status: planned
tags: [voice, nvidia, personaplex, full-duplex, speech-to-speech]
---

# NVIDIA PersonaPlex — Full-Duplex Speech-to-Speech

## What It Is

PersonaPlex is NVIDIA's **7-billion-parameter, full-duplex speech-to-speech model**.
Unlike traditional voice pipelines (ASR -> LLM -> TTS), PersonaPlex is a **single
unified model** that listens and speaks simultaneously. It enables natural interruptions,
barge-ins, overlaps, and rapid turn-taking — 0.07s speaker switch latency vs 1.3s for
Gemini Live.

## Key Specs

| Spec | Value |
|------|-------|
| **Parameters** | 7B |
| **Architecture** | Moshi-based (Kyutai) with Mimi speech encoder/decoder |
| **Audio** | 24kHz sample rate, ~80ms per frame |
| **Protocol** | WebSocket (real-time bidirectional audio) |
| **Port** | 8998 (HTTPS) |
| **License (code)** | MIT |
| **License (weights)** | NVIDIA Open Model License (commercial OK) |
| **GPU Required** | NVIDIA RTX 2000+, 32GB RAM, 40GB+ VRAM recommended |

## Performance

| Metric | PersonaPlex | Gemini Live |
|--------|-------------|-------------|
| Dialog naturalness | 3.90 | 3.72 |
| Speaker switch latency | **0.07s** | 1.3s |
| Interruption handling | **100%** | Lower |
| Voice cloning similarity | **0.57** | ~0 |

## How It Works

1. **Dual persona conditioning** — before conversation starts, PersonaPlex receives:
   - A **voice prompt** (audio tokens establishing vocal characteristics)
   - A **text prompt** (persona attributes: role, background, scenario)
2. **Full-duplex processing** — incoming user audio is incrementally encoded while
   the model simultaneously generates outgoing speech
3. **Mimi encoder/decoder** — ConvNet + Transformer converts audio to/from tokens

## A.I.M.S. Integration

### Architecture

```
[User Browser / Mobile]
    ↕ WebSocket (wss://voice.plugmein.cloud:8998)
[PersonaPlex Server — Docker Container]
    ↕ Internal API
[AVVA NOON — SmelterOS Overseer]
    ↕ Resource governance, session management
[ACHEEVY — Persona injection, conversation context]
```

### Persona Mapping

PersonaPlex's dual persona conditioning maps directly to ACHEEVY's persona system:

| ACHEEVY Persona | PersonaPlex Voice Prompt | PersonaPlex Text Prompt |
|-----------------|-------------------------|------------------------|
| ProConsultant | Professional, measured tone | "You are a professional business consultant..." |
| Strategist | Thoughtful, deliberate pace | "You are a strategic advisor..." |
| Entertainer | Energetic, dynamic range | "You are an engaging storyteller..." |
| HeadCoach | Motivational, assertive | "You are a head coach pushing for action..." |
| SportsInsider | Analyst cadence, data-forward | "You are a sports analyst grading performance..." |

### Deployment

```yaml
# docker-compose.yml addition
personaplex:
  image: nvidia/personaplex:latest
  container_name: aims-personaplex
  ports:
    - "8998:8998"  # WebSocket
  environment:
    - HF_TOKEN=${HF_TOKEN}
    - SSL_DIR=/ssl
  volumes:
    - personaplex-ssl:/ssl
    - personaplex-models:/models
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
  networks:
    - backendnet
  labels:
    - "aims.service=personaplex"
    - "aims.governed-by=avva-noon"
```

### Client Integration

```typescript
// Frontend WebSocket connection to PersonaPlex
const connectPersonaPlex = (persona: AcheevyPersona) => {
  const ws = new WebSocket('wss://voice.plugmein.cloud:8998/ws');

  ws.onopen = () => {
    // Send persona conditioning
    ws.send(JSON.stringify({
      type: 'persona_config',
      voice_prompt: persona.voicePromptAudioUrl,
      text_prompt: persona.systemPrompt,
    }));
  };

  // Bidirectional audio streaming
  ws.onmessage = (event) => {
    // Incoming audio from PersonaPlex
    playAudioChunk(event.data);
  };

  // Stream user microphone audio
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    const processor = new AudioWorkletNode(audioContext, 'pcm-processor');
    processor.port.onmessage = (e) => ws.send(e.data);
  });
};
```

## Use Cases for A.I.M.S.

| Use Case | Description |
|----------|-------------|
| **ACHEEVY Voice Chat** | Replace sequential ASR→LLM→TTS with single full-duplex model |
| **LiveSim Agent Voices** | Give each Boomer_Ang a unique voice persona in simulation |
| **DIY Mode** | Hands-free project guidance with natural interruption support |
| **Onboarding** | Voice-guided new user setup with real-time conversation |
| **Per\|Form Scouting** | Voice-driven athlete evaluation discussions |

## Fallback Chain

```
Primary:   PersonaPlex (full-duplex, lowest latency)
Fallback:  ElevenLabs TTS + Groq Whisper STT (sequential, proven stable)
Emergency: Browser SpeechSynthesis + Web Speech API (zero cost, works offline)
```

## LUC Cost Considerations

| Resource | Cost Factor |
|----------|-------------|
| GPU compute (inference) | High — dedicated NVIDIA GPU required |
| Audio bandwidth | Medium — real-time bidirectional audio stream |
| Model loading | One-time — model stays warm in GPU memory |

**AVVA NOON governs:** GPU allocation, session limits, idle timeout, model warm/cold state.

## Links

- GitHub: [NVIDIA/personaplex](https://github.com/NVIDIA/personaplex)
- Hugging Face: [nvidia/personaplex-7b-v1](https://huggingface.co/nvidia/personaplex-7b-v1)
- Research: [NVIDIA ADLR PersonaPlex](https://research.nvidia.com/labs/adlr/personaplex/)
