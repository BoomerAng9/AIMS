# Video Production Boomer_Ang

**Role:** AI Video Generation Specialist  
**Primary Tool:** Kling.ai (2.5 Turbo, 2.6 Motion Control, O1 Multimodal)  
**Responsibility:** Transform user ideas into production-ready video content

---

## Core Capabilities

### 1. Prompt Engineering
- Analyze user input for missing components (subject, action, environment, camera, style)
- Optimize prompts for specific Kling models
- Provide quality scores and actionable suggestions

### 2. Model Selection
Recommend the right Kling model based on requirements:
- **2.5 Turbo**: Fast iteration, social media, A/B testing
- **2.6 Motion Control**: Complex animation, sports, motion transfer
- **O1 Multimodal**: Audio generation, video editing, multi-element scenes

### 3. Job Management
- Submit generation requests to Kling API
- Poll for job status and completion
- Download and store generated videos
- Integrate with Remotion for post-processing

### 4. Specialized Use Cases
- **Sports Recruiting**: Athlete highlight reels, recruiting intros
- **Product Marketing**: Demos, brand stories, tutorials
- **Social Content**: Instagram Reels, TikTok, YouTube Shorts

---

## API Integration

### Environment Variables
```bash
KLING_API_KEY=your_kling_api_key_here
```

### Endpoints

#### Analyze Prompt
```bash
POST /api/video/analyze
{
  "prompt": "Basketball player shooting a three-pointer",
  "model": "kling-2.6-motion"
}
```

**Response:**
```json
{
  "original": "Basketball player shooting a three-pointer",
  "optimized": "Professional basketball player shooting a three-pointer from the arc, indoor arena with dramatic spotlights, smooth tracking camera following the ball, cinematic slow motion quality",
  "analysis": {
    "subject": "Basketball player",
    "action": "shooting",
    "quality": "good",
    "suggestions": [
      "⚠️ 2.6 Motion works best with camera path specified",
      "💡 Add environment details for better context"
    ]
  }
}
```

#### Generate Video
```bash
POST /api/video/generate
{
  "prompt": "Basketball player shooting a three-pointer...",
  "model": "kling-2.6-motion",
  "duration": 10,
  "aspectRatio": "16:9",
  "cameraPath": "tracking"
}
```

**Response:**
```json
{
  "jobId": "kling_1738649234567",
  "status": "queued",
  "estimatedTime": 120
}
```

#### Check Status
```bash
GET /api/video/generate?jobId=kling_1738649234567
```

**Response:**
```json
{
  "jobId": "kling_1738649234567",
  "status": "completed",
  "videoUrl": "https://cdn.kling.ai/videos/...",
  "thumbnailUrl": "https://cdn.kling.ai/thumbs/..."
}
```

---

## Workflow Example

### User Request:
> "Create a highlight reel for a high school quarterback"

### Boomer_Ang Processing:

1. **Skill Invocation**: Load `kling-video-prompt-engineering.md`
2. **Template Selection**: Sports Recruiting → Athlete Highlight Reel
3. **Prompt Construction**:
   ```
   High school quarterback throwing a 40-yard spiral pass at Friday night lights game,
   wide angle then zoom to receiver catch,
   navy and gold uniform,
   stadium floodlights,
   professional broadcast quality
   ```
4. **Model Selection**: Kling 2.6 Motion Control (best for sports)
5. **Optimization**: Add camera path, lighting details
6. **API Call**: Submit to `/api/video/generate`
7. **Polling**: Check status every 10s
8. **Delivery**: Return video URL to user

---

## Integration with Remotion

Once Kling generates the raw video, optionally pass to Remotion for:
- Adding title cards/overlays
- Compositing multiple clips
- Custom branding/watermarks
- Audio track mixing

**Pipeline:**
```
User Idea → Kling.ai (raw video) → Remotion (polish) → Final Export
```

---

## Future Enhancements

- [ ] Batch generation for multi-scene videos
- [ ] Motion reference library (upload common sports moves)
- [ ] A/B testing: generate 3 variants, user picks best
- [ ] Integration with athlete recruitment CRM
- [ ] Auto-detect aspect ratio based on distribution platform

---

## Status
🔨 **In Development** - API integration pending Kling credentials
