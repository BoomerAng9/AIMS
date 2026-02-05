---
name: Kling.ai Video Prompt Engineering
description: Guide users in crafting effective prompts for Kling video generation models
---

# Kling.ai Video Prompt Engineering Skill

This skill helps users articulate their video generation ideas effectively, tailored to the specific Kling model they are using. Each model has different strengths, criteria, and optimal prompt structures.

---

## Model-Specific Guidelines

### Kling 2.6 Motion Control

**Best For:** Complex character animation, sports footage, full-body motion transfer

**Optimal Prompt Structure:**
```
[SUBJECT] + [ACTION] + [ENVIRONMENT] + [CAMERA MOTION] + [STYLE]
```

**Example:**
> "Professional basketball player performing a crossover dribble, indoor arena with dramatic spotlights, smooth tracking shot following the ball, cinematic slow motion"

**Key Parameters:**
- `motion_reference`: URL to reference video for motion transfer
- `duration`: 5-30 seconds
- `camera_path`: "tracking", "static", "orbit", "crane"

**Tips:**
- Always specify hand/finger actions explicitly ("gripping the ball", "pointing finger")
- Include lighting direction for realism
- Reference sports footage? Use `motion_reference` for authentic movement

---

### Kling O1 (Unified Multimodal)

**Best For:** Text-based motion capture, editing existing videos, complex multi-element scenes

**Optimal Prompt Structure:**
```
[SCENE DESCRIPTION] + [MOTION INSTRUCTION] + [AUDIO CUE] + [EMOTIONAL TONE]
```

**Example:**
> "Corporate office meeting room, CEO stands and walks to whiteboard, confident body language, ambient office sounds, professional and authoritative tone"

**Key Parameters:**
- `audio_generation`: true/false (native audio)
- `elements`: Array of objects to add/remove
- `lip_sync`: true (if character speaks)

**Tips:**
- O1 excels at "motion capture from text" - describe the motion, not just the action
- Leverage native audio for ambient sound and emotional scoring
- Use for video editing: "Remove the coffee cup from the desk"

---

### Kling 2.5 Turbo Pro

**Best For:** Fast iteration, social media content, quick prototypes

**Optimal Prompt Structure:**
```
[SIMPLE SUBJECT] + [SINGLE ACTION] + [MOOD]
```

**Example:**
> "Golden retriever running through autumn leaves, playful energy"

**Key Parameters:**
- `duration`: 5-10 seconds max
- `resolution`: 1080p
- `aspect_ratio`: "16:9", "9:16", "1:1"

**Tips:**
- Keep prompts concise (under 100 words)
- Single subject, single action
- Best for A/B testing concepts before committing to 2.6

---

## Universal Best Practices

### DO:
1. **Be specific about motion** - "walks slowly with a limp" vs "walks"
2. **Describe lighting** - "golden hour sunlight from the left"
3. **Specify camera** - "handheld documentary style" vs letting it default
4. **Include audio intent** - "upbeat electronic music" or "ambient forest sounds"
5. **Reference aspect ratio** - Match to your distribution platform

### DON'T:
1. ❌ Use abstract concepts without visual grounding - "the feeling of success"
2. ❌ Overload with contradictions - "fast but slow motion"
3. ❌ Forget the subject - "running through a field" (who is running?)
4. ❌ Ignore physics - "car flying through clouds" (unless fantasy)

---

## Sports Recruiting Specific Prompts

### Athlete Highlight Reels

**Template:**
> "[SPORT] athlete demonstrating [SKILL] at [VENUE], [CAMERA ANGLE], professional broadcast quality, [TEAM COLORS] uniform, [WEATHER/LIGHTING]"

**Example:**
> "High school quarterback throwing a 40-yard spiral pass at Friday night lights game, wide angle then zoom to receiver catch, navy and gold uniform, stadium floodlights"

### Recruiting Video Intros

**Template:**
> "Dramatic slow-motion sequence of [ATHLETE SILHOUETTE] against [DRAMATIC BACKDROP], text overlay revealing [NAME/STATS], cinematic lens flares, [TEAM BRAND COLORS]"

---

## Prompt Templates Library

### Product Demo
```
Close-up of [PRODUCT] being [ACTION] by human hands, 
clean white studio background with soft shadows,
smooth 180-degree orbit revealing all angles,
premium commercial aesthetic
```

### Brand Story
```
[PROTAGONIST DESCRIPTION] in [SETTING],
narrative sequence: [BEGINNING] → [MIDDLE] → [END],
emotional arc from [EMOTION A] to [EMOTION B],
voiceover-ready with ambient audio bed
```

### Tutorial/Explainer
```
Screen recording style: [SOFTWARE/PROCESS] demonstration,
cursor movements clearly visible,
step-by-step with pause points,
professional but approachable tone
```

---

## Quality Checklist Before Generation

- [ ] Subject clearly defined?
- [ ] Action verb included?
- [ ] Camera motion specified?
- [ ] Lighting/time of day mentioned?
- [ ] Duration appropriate for model?
- [ ] Aspect ratio matches distribution?
- [ ] Audio intent (if using O1)?

---

## Integration with A.I.M.S.

This skill is managed by the **Video Production Boomer_Ang**, a specialist agent responsible for:
- Prompt optimization and validation
- Model selection (2.5 Turbo, 2.6 Motion, O1)
- Video generation job management
- Post-processing and delivery

See `backend/boomer-angs/video-production/` for implementation details.
