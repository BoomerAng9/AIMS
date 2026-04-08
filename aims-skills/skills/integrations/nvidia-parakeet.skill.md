---
name: nvidia-parakeet
displayName: NVIDIA Parakeet — State-of-the-Art ASR
version: 1.0.0
triggers: ["parakeet", "nvidia asr", "nvidia transcription", "nvidia stt"]
type: integration
status: planned
tags: [voice, nvidia, parakeet, asr, speech-to-text, transcription]
---

# NVIDIA Parakeet — State-of-the-Art Automatic Speech Recognition

## What It Is

Parakeet is NVIDIA's family of **state-of-the-art ASR models** built on the NeMo framework.
The flagship model, **Parakeet-TDT-0.6B-v2**, tops the Hugging Face Open ASR Leaderboard
with a word error rate of **6.05%** and can transcribe **1 hour of audio in ~1 second** on GPU.

## Model Variants

| Model | Params | Languages | License | Key Feature |
|-------|--------|-----------|---------|-------------|
| **Parakeet-TDT-0.6B-v2** | 600M | English | CC-BY-4.0 | #1 Open ASR Leaderboard |
| **Parakeet-TDT-0.6B-v3** | 600M | 25 European languages | CC-BY-4.0 | Auto language detection |
| **Parakeet-TDT-1.1B** | 1.1B | English | CC-BY-4.0 | Higher capacity |

## Key Specs

| Spec | Value |
|------|-------|
| **Architecture** | FastConformer-TDT (Transformer + ConvNet hybrid) |
| **Speed** | RTFx 3,386 (batch 128) — thousands of times faster than real-time |
| **Max Audio Length** | 24 min (full attention, A100 80GB), 3 hours (local attention) |
| **Features** | Punctuation, capitalization, timestamps |
| **Training Data** | Granary dataset (~120,000 hours English audio) |
| **License** | CC-BY-4.0 (fully open, commercial OK) |

## Performance vs Current Stack

| Model | WER | Speed | Cost |
|-------|-----|-------|------|
| **Parakeet-TDT-0.6B-v2** | **6.05%** | 3,386x real-time | Self-hosted (GPU) |
| Groq Whisper-large-v3-turbo (current) | ~8-10% | Fast (API) | Per-request API cost |
| Deepgram Nova-3 (fallback) | ~8-12% | Fast (API) | Per-request API cost |
| OpenAI Whisper-large-v3 (emergency) | ~8-10% | Moderate (API) | Per-request API cost |

**Parakeet wins on accuracy.** The trade-off is self-hosting a GPU instance vs API calls.

## Deployment Options

### Option A: Direct Python (Development)

```python
import nemo.collections.asr as nemo_asr

# Load model (auto-downloads from Hugging Face)
asr_model = nemo_asr.models.ASRModel.from_pretrained(
    model_name="nvidia/parakeet-tdt-0.6b-v2"
)

# Transcribe
transcriptions = asr_model.transcribe(["audio.wav"])
print(transcriptions[0].text)
```

### Option B: Docker Container (Production — Recommended)

```yaml
# docker-compose.yml addition
parakeet-asr:
  image: nvcr.io/nvidia/nemo:25.11.01
  container_name: aims-parakeet
  command: >
    python -c "
    import nemo.collections.asr as nemo_asr;
    from flask import Flask, request, jsonify;
    app = Flask(__name__);
    model = nemo_asr.models.ASRModel.from_pretrained('nvidia/parakeet-tdt-0.6b-v2');
    @app.route('/transcribe', methods=['POST'])
    def transcribe():
        audio = request.files['audio'];
        audio.save('/tmp/input.wav');
        result = model.transcribe(['/tmp/input.wav']);
        return jsonify({'text': result[0].text});
    app.run(host='0.0.0.0', port=9030)
    "
  expose:
    - 9030
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
    - "aims.service=parakeet-asr"
    - "aims.governed-by=avva-noon"
```

### Option C: Streaming / Chunked (Real-Time)

```bash
python examples/asr/asr_chunked_inference/rnnt/speech_to_text_streaming_infer_rnnt.py \
    pretrained_name="nvidia/parakeet-tdt-0.6b-v3" \
    audio_dir="<path>" batch_size=32
```

## A.I.M.S. Integration

### Architecture

```
[User Microphone]
    ↓ Audio stream (WebSocket or chunked upload)
[API Route: /api/voice/stt]
    ↓ Route to provider
    ┌──────────────────────────────────┐
    │ Primary: Parakeet (self-hosted)  │  ← New
    │ Fallback: Groq Whisper (API)     │  ← Current primary
    │ Emergency: Deepgram Nova-3 (API) │  ← Current fallback
    └──────────────────────────────────┘
    ↓ Transcription text
[ACHEEVY Orchestrator]
```

### API Integration

```typescript
// lib/services/parakeet.ts
export async function transcribeWithParakeet(audioBuffer: Buffer): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append('audio', new Blob([audioBuffer]), 'input.wav');

  const response = await fetch(`${process.env.PARAKEET_URL}/transcribe`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  return {
    text: result.text,
    provider: 'parakeet',
    model: 'parakeet-tdt-0.6b-v2',
    timestamps: result.timestamps ?? null,
  };
}
```

### Fallback Chain Update

```typescript
// Updated /api/voice/stt route
const STT_PROVIDERS = [
  { name: 'parakeet', fn: transcribeWithParakeet, selfHosted: true },
  { name: 'groq',     fn: transcribeWithGroq,     selfHosted: false },
  { name: 'deepgram', fn: transcribeWithDeepgram,  selfHosted: false },
];

for (const provider of STT_PROVIDERS) {
  try {
    return await provider.fn(audioBuffer);
  } catch (err) {
    console.warn(`STT fallback: ${provider.name} failed, trying next`);
  }
}
```

## Use Cases for A.I.M.S.

| Use Case | Why Parakeet |
|----------|-------------|
| **ACHEEVY Voice Input** | Best-in-class accuracy (6.05% WER) for voice-first interaction |
| **Call Center Analytics** | Transcribe customer calls for analysis and training |
| **Meeting Transcription** | High-accuracy transcription for business meetings |
| **Content Creation** | Transcribe podcasts, videos, interviews for content pipeline |
| **Multilingual Support (v3)** | 25 European languages with auto-detection |
| **DIY Mode** | Accurate hands-free transcription during physical tasks |
| **Per\|Form Film Room** | Transcribe coach commentary during film analysis sessions |
| **Evidence Locker** | Transcribe voice notes into searchable text artifacts |
| **Batch Processing** | Bulk transcription of audio archives (3,386x real-time) |
| **Accessibility** | Real-time captions for users with hearing impairments |

## Parakeet vs Groq Whisper — When to Use Which

| Scenario | Best Choice | Why |
|----------|------------|-----|
| Real-time chat input | **Groq Whisper** | Lower infrastructure overhead, API-based |
| Batch transcription | **Parakeet** | 3,386x speed, no per-request cost |
| High-accuracy needs | **Parakeet** | 6.05% WER vs ~8-10% |
| No GPU available | **Groq Whisper** | API-based, no GPU required |
| Multilingual | **Parakeet v3** | 25 languages with auto-detection |
| Cost optimization (high volume) | **Parakeet** | Self-hosted = fixed cost vs per-request |

## LUC Cost Considerations

| Resource | Cost Factor |
|----------|-------------|
| GPU compute (inference) | Fixed — self-hosted container |
| Per-request cost | Zero after GPU provisioning |
| Model loading | One-time on container start |
| Storage | Minimal — model is 600M params |

**Break-even:** At ~10,000 transcription requests/month, self-hosted Parakeet is cheaper
than Groq Whisper API. Below that, Groq is more cost-effective.

**AVVA NOON governs:** GPU allocation, model warm state, batch queue priority.

## Links

- Hugging Face: [nvidia/parakeet-tdt-0.6b-v2](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v2)
- Hugging Face: [nvidia/parakeet-tdt-0.6b-v3](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3)
- NeMo Framework: [NVIDIA-NeMo/NeMo](https://github.com/NVIDIA-NeMo/NeMo)
- Blog: [Pushing the Boundaries of Speech Recognition](https://developer.nvidia.com/blog/pushing-the-boundaries-of-speech-recognition-with-nemo-parakeet-asr-models/)
