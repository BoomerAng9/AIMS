# 🚀 Quick Reference: Using A.I.M.S. Services

## Import Services
```typescript
import { 
  groqService,         // Fast LLM
  elevenLabsService,   // TTS
  deepgramService,     // STT
  e2bService,          // Code sandbox
  unifiedSearch,       // Multi-provider search
  geminiResearch,      // Deep research
  klingVideo           // Video generation
} from "@/lib/services";
```

---

## Common Patterns

### 💬 Chat with Groq (Fast LLM)
```typescript
// Simple question
const answer = await groqService.quickResponse("What is Docker?");

// With system prompt
const answer = await groqService.quickResponse(
  "Explain containers",
  "You are a DevOps expert. Be concise."
);

// Streaming
for await (const chunk of groqService.chatStream([
  { role: "user", content: "Tell me a story" }
])) {
  console.log(chunk); // Print tokens as they arrive
}
```

### 🔍 Search the Web
```typescript
// Tries Tavily → Brave → Serper (whichever works first)
const results = await unifiedSearch("Next.js routing", { count: 5 });

results.forEach(r => {
  console.log(`${r.title} - ${r.url}`);
  console.log(`Source: ${r.source}`); // brave, tavily, or google
});
```

### 🎤 Speech-to-Text (Deepgram)
```typescript
// From audio file
const audioBuffer = fs.readFileSync("recording.mp3");
const transcript = await deepgramService.transcribeFile(audioBuffer);

// From URL
const transcript = await deepgramService.transcribeUrl(
  "https://example.com/audio.mp3"
);

// Live streaming
const connection = deepgramService.createLiveTranscription(
  (transcript) => console.log("Live:", transcript)
);
// Send audio chunks to connection.send()
```

### 🔊 Text-to-Speech (ElevenLabs)
```typescript
// Get audio as data URL (for <audio> tag)
const audioUrl = await elevenLabsService.textToSpeechDataUrl(
  "Welcome to A.I.M.S."
);
// Use in React: <audio src={audioUrl} controls />

// Get raw buffer (for file save)
const buffer = await elevenLabsService.textToSpeech("Hello world");
fs.writeFileSync("output.mp3", Buffer.from(buffer));
```

### 🧠 Deep Research (Gemini)
```typescript
// Get structured research
const research = await geminiResearch.research(
  "Compare n8n vs Zapier for automation",
  (chunk) => console.log(chunk) // Optional: stream progress
);

console.log(research.title);
console.log(research.summary);
research.sections.forEach(s => {
  console.log(`## ${s.heading}`);
  console.log(s.content);
});

// Generate video script from research
const script = await geminiResearch.generateVideoScript(research);
```

### 💻 Execute Code (E2B Sandbox)
```typescript
// Python
const result = await e2bService.executePython(`
print("Hello from sandbox!")
import math
print(f"Pi is {math.pi}")
`);
console.log(result.stdout); // "Hello from sandbox!\nPi is 3.14159..."

// Node.js
const result = await e2bService.executeNode(`
console.log("Running in sandbox");
console.log(process.version);
`);

// With packages
const result = await e2bService.executeWithPackages(
  "import requests; print(requests.get('https://api.github.com').status_code)",
  ["requests"],
  "python"
);
```

### 🎬 Video Generation (Kling)
```typescript
// Analyze prompt quality
const analysis = await klingVideo.analyzePrompt(
  "Basketball player dunking",
  "kling-2.6-motion"
);

console.log(analysis.quality); // "excellent", "good", "needs-improvement"
console.log(analysis.suggestions); // Array of improvement tips

// Get optimized prompt
const optimized = klingVideo.optimizePrompt(
  "Basketball player dunking",
  "kling-2.6-motion"
);
// Result: "Professional basketball player dunking from the paint, 
//          indoor arena with dramatic spotlights, smooth tracking 
//          camera following the ball, cinematic slow motion quality"

// Generate video (once you have API key)
const job = await klingVideo.generateVideo({
  prompt: optimized,
  model: "kling-2.6-motion",
  duration: 10,
  aspectRatio: "16:9"
});
// Poll job.jobId for completion
```

---

## API Routes (for Frontend)

### Test Endpoints
```bash
# Groq LLM
POST /api/test/groq
{"prompt": "Hello!"}

# Search
GET /api/test/search?q=Next.js

# Text-to-Speech
POST /api/test/tts
{"text": "Testing audio"}

# Code Execution
POST /api/test/e2b
{"code": "print('hi')", "language": "python"}
```

### Production Endpoints
```bash
# Deep Research
POST /api/research
{"prompt": "Explain Docker containers"}

# Video Prompt Analysis
POST /api/video/analyze
{"prompt": "Basketball dunk", "model": "kling-2.6-motion"}

# Video Generation
POST /api/video/generate
{"prompt": "...", "model": "kling-2.6-motion", "duration": 10}
```

---

## Environment Variables Needed

Copy to `frontend/.env.local`:
```bash
GEMINI_API_KEY=AIzaSyBwXCwmxDfKJ1dW-5Cx1HxinyqowNP2wYQ
GROQ_API_KEY=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
ELEVENLABS_API_KEY=sk-th-lK8kcLH4Qjvy1Ecl3avdSbmdbXT6sFQIsC5zo19oJU5Y3ZH9gaxTTQR9nIL3T6eJPdTdK28AymnagKmQMBmRnGJx4sUT3c02uHU3
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
DEEPGRAM_API_KEY=994f12f975faad20cd2c20d1f88d1c28ba64f056
E2B_API_KEY=e2b_1ea70b3c92c3f28c040adb724b6e474c12b91829
BRAVE_SEARCH_API_KEY=BSAWyxJDh8Ks8spCKMSrXV8Jngzp-fh
TAVILY_API_KEY=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
SERPER_API_KEY=53784f12ce2c9062600b9342a4161215f3ffb033
```

---

## Test Dashboard

Visit: **http://localhost:3000/integrations**

- Click "Test All Services" to verify everything works
- Individual test buttons for each service
- Real-time success/fail indicators
- Environment variable checker

---

**Pro Tip**: All services automatically handle errors and return structured responses. Always wrap in try/catch for production use!
