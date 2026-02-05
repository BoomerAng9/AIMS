# Perform Plug - Sports Analytics & Scouting Platform

**Plug ID:** `perform`
**Status:** Priority Build
**Vertical:** Sports Analytics
**Type:** Full-Stack Platform Plug

## Overview
Perform is the flagship "Per Form" analytics plug for athlete scouting, video analysis, and recruitment pipeline management. It connects coaches, scouts, and recruiters with AI-powered athlete evaluation tools.

## Data Models

### Athlete Profile
```json
{
  "id": "string (UUID)",
  "firstName": "string",
  "lastName": "string",
  "sport": "string (football | basketball | soccer | baseball | track)",
  "position": "string",
  "age": "number",
  "height": "string",
  "weight": "number",
  "school": "string",
  "graduationYear": "number",
  "gpa": "number",
  "location": { "city": "string", "state": "string" },
  "stats": "Record<string, number>",
  "scoutingGrade": "number (0-100)",
  "videoReels": ["{ url, title, duration, uploadedAt }"],
  "recruitmentStatus": "prospect | contacted | evaluating | offered | committed | signed",
  "tags": ["string"],
  "notes": "string",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

### Scouting Report
```json
{
  "id": "string (UUID)",
  "athleteId": "string (FK → Athlete)",
  "scoutId": "string (FK → User)",
  "date": "ISO date",
  "event": "string (game, combine, camp, film-review)",
  "grades": {
    "overall": "number (0-100)",
    "athleticism": "number (0-100)",
    "technique": "number (0-100)",
    "gameIQ": "number (0-100)",
    "coachability": "number (0-100)",
    "intangibles": "number (0-100)"
  },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "projection": "elite | starter | rotational | developmental | undrafted",
  "comparison": "string (pro comparison)",
  "narrative": "string (AI-generated scouting narrative)",
  "videoTimestamps": [{ "time": "string", "note": "string" }]
}
```

### Recruitment Pipeline
```json
{
  "id": "string (UUID)",
  "athleteId": "string (FK → Athlete)",
  "organizationId": "string",
  "stage": "identified | scouted | shortlisted | offer-pending | committed",
  "priority": "high | medium | low",
  "assignedScout": "string (FK → User)",
  "deadline": "ISO date",
  "offers": [{ "amount": "string", "type": "scholarship | contract", "status": "draft | sent | accepted | declined" }],
  "communications": [{ "date": "ISO date", "type": "email | call | visit", "summary": "string" }]
}
```

## Vertex AI / LLM Instructions (Hidden Brain)

### Prompt Chain 1: Athlete Evaluation
```
SYSTEM: You are a professional sports scout AI assistant for the Perform platform.
Given raw athlete statistics and video analysis data, generate a comprehensive
scouting report. Use industry-standard grading (20-80 scale normalized to 0-100).
Compare to known professional archetypes. Be objective and data-driven.

INPUT: { athleteProfile, rawStats, videoAnalysisOutput }
OUTPUT: { grades, strengths, weaknesses, projection, comparison, narrative }
```

### Prompt Chain 2: Video Analysis Summarizer
```
SYSTEM: Analyze the timestamped annotations from video footage of an athlete.
Identify recurring patterns (positive plays, mistakes, tendencies).
Output a structured summary with key moments and an overall assessment.

INPUT: { videoTimestamps[], sport, position }
OUTPUT: { highlights[], concerns[], tendencies[], overallAssessment }
```

### Prompt Chain 3: Recruitment Intelligence
```
SYSTEM: Given a recruitment pipeline with multiple athletes at various stages,
provide strategic recommendations. Factor in positional needs, budget,
timeline constraints, and athlete availability. Output prioritized actions.

INPUT: { pipeline[], teamNeeds, budgetConstraints, deadline }
OUTPUT: { prioritizedActions[], riskFlags[], recommendations }
```

## UI Sections
1. **Dashboard** - Pipeline overview, top prospects, upcoming evaluations
2. **Athlete Database** - Searchable/filterable athlete profiles with scout grades
3. **Scouting Reports** - AI-assisted report generation with video timestamps
4. **Recruitment Board** - Kanban-style pipeline tracker
5. **Analytics** - Stat comparisons, trend charts, grade distributions

## Design Notes
- Use `font-display` (Doto) for all numerical grades and statistics
- Glass cards with amber accent borders for athlete cards
- Status badges: emerald (committed), amber (evaluating), cyan (prospect), red (passed)
- Minimal glassmorphism on data panels
- Dark theme consistent with A.I.M.S. obsidian palette

## Infrastructure
- **Frontend:** Next.js route at `/plugs/perform`
- **API:** `/api/plugs/perform` for CRUD + AI operations
- **Storage:** Firestore collection `plugs/perform/athletes`, `plugs/perform/reports`
- **AI:** Vertex AI / OpenRouter for scouting narratives
- **Video:** Integration-ready for video upload + timestamp annotation
