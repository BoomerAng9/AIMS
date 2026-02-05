---
id: "gemini-research"
name: "Gemini Deep Research"
type: "task"
status: "active"
triggers:
  - "research"
  - "deep research"
  - "analyze"
  - "report"
  - "investigate"
  - "study"
  - "gemini"
  - "findings"
description: "Run deep research queries using Gemini with streaming output and structured report generation."
execution:
  target: "api"
  route: "/api/research"
  command: ""
dependencies:
  env:
    - "GEMINI_API_KEY"
  packages:
    - "@google/generative-ai"
  files:
    - "frontend/lib/gemini-research.ts"
    - "frontend/app/api/research/route.ts"
priority: "high"
---

# Gemini Deep Research Task

## Endpoint
**POST** `/api/research`

```json
{
  "prompt": "Analyze the benefits of n8n workflow automation"
}
```

**Response:**
```json
{
  "research": {
    "title": "Research Report Title",
    "summary": "Executive summary paragraph",
    "sections": [
      { "heading": "Section Name", "content": "..." }
    ]
  },
  "script": "[Scene 1: Intro]\n...",
  "success": true
}
```

## Model
Currently: `gemini-2.0-flash-exp`
Planned upgrade: `deep-research-pro-preview` when available

## Pipeline
1. **Research** -- Streams content from Gemini, accumulates full text
2. **Parse** -- Splits into title, summary, and heading/content sections
3. **Video Script** -- Generates 60-90 second narration script from research output

## Programmatic Usage
```typescript
import { geminiResearch } from "@/lib/gemini-research";

// With streaming callback
const result = await geminiResearch.research(
  "Your research prompt",
  (chunk) => console.log("Streaming:", chunk)
);

// Generate video script from research
const script = await geminiResearch.generateVideoScript(result);
```

## Environment
Add to `frontend/.env.local`:
```
GEMINI_API_KEY=your_key_here
```

Get key from: https://aistudio.google.com/app/apikey
