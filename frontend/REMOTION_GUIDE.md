# A.I.M.S. Remotion + Gemini Deep Research Integration

## Quick Start

### 1. Open Remotion Studio
```bash
cd frontend
npm run remotion:studio
```
Visit: http://localhost:3001

### 2. Available Compositions

#### **AIMSIntro** (5 seconds)
Landing intro with A.I.M.S. branding, gold/obsidian theme

#### **FeatureShowcase** (10 seconds)
Displays 3 platform features with staggered card animations

#### **Deployment** (8 seconds)
Terminal-style deployment animation showing live progress

### 3. Render a Video
```bash
npm run remotion:render
```

## Gemini Deep Research Integration

### Example: Research to Video Pipeline

```typescript
// 1. Create research request
const response = await fetch('/api/research', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "Explain how containerized AI deployment works"
  })
});

const { research, script } = await response.json();

// 2. Use the script to generate a video composition
// The script contains scene breakdowns like:
// [Scene 1: Intro]
// Containerized deployment allows...
// 
// [Scene 2: How it Works]
// Docker containers package everything...
```

### Environment Setup

Add to `frontend/.env.local`:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your key from: https://aistudio.google.com/app/apikey

### Programmatic Research

```typescript
import { geminiResearch } from "@/lib/gemini-research";

// Stream research results
const result = await geminiResearch.research(
  "Analyze the benefits of n8n workflow automation",
  (chunk) => {
    console.log("Streaming:", chunk);
  }
);

console.log("Title:", result.title);
console.log("Sections:", result.sections.length);

// Generate video script
const script = await geminiResearch.generateVideoScript(result);
```

## Next Steps

1. **Create Custom Compositions**: Add new files to `remotion/compositions/`
2. **Integrate with ACHEEVY**: Use research to auto-generate deployment videos
3. **Export for Social**: Render at different aspect ratios (9:16 for Stories, 1:1 for Instagram)

## Troubleshooting

- **Port Conflict**: Remotion Studio uses port 3001 (configurable in `remotion.config.ts`)
- **Build Errors**: Run `npm run build` to check for TypeScript errors
- **Missing API Key**: Check that `GEMINI_API_KEY` is set in `.env.local`
