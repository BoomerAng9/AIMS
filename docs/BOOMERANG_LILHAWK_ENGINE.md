# Boomer_Angs & Lil_Hawks Personality Engine
## Automated AI Sports Media Characters — Concept Document
## (Companion to PERFORM_PLATFORM_PRD.md)

---

## Vision

Per|Form isn't just a data dashboard — it's a **sports media platform** powered by AI personalities.
These personalities — Boomer_Angs and Lil_Hawks — are AI-generated sports commentators, analysts, 
and hot-take artists that produce automated editorial content, debate each other, and build 
followings — all driven by behavior trait engines.

**ACHEEVY** is the lead color analyst who orchestrates all Boomer_Angs. 
All grades and rankings pass through the **P.A.I. + AGI formula** — personalities 
only affect delivery style, NEVER the underlying analysis.

Think: **What if the best traits of Daniel Jeremiah, Stuart Scott, Shannon Sharpe, 
and Stephen A. Smith were blended into original AI characters that never sleep, 
always have a take, and can debate each other 24/7?**

---

## Character Taxonomy

### Boomer_Angs
- **Role**: Senior analysts, veteran voices, graders, writers — report to ACHEEVY
- **Personality Range**: Measured to wildly opinionated
- **Content Types**: Scouting reports, draft analysis, debate segments, game breakdowns
- **CRITICAL**: All output is filtered through P.A.I. + AGI formula
- **Examples (blended inspirations, NOT copies)**:
  - Film-First Boomer_Ang: Blend of Jeremiah's precision + Mel Kiper's confidence
  - Charisma Boomer_Ang: Blend of Stuart Scott's swagger + Shannon Sharpe's storytelling
  - Fire Boomer_Ang: Blend of Stephen A.'s drama + Pat McAfee's energy
  - The Anchor Boomer_Ang: Blend of Molly Qerim's professionalism + Ryan Clark's cerebral takes

### Lil_Hawks
- **Role**: Younger voices, next-gen analysts, social-media-native
- **Personality Range**: Meme-driven to data-obsessed
- **Content Types**: Quick takes, social clips, reaction content, stat threads, memes
- **Examples (inspiration)**:
  - An "Ocho Cinco"-type: Wild, entertaining, self-promotional, loves spectacle
  - A data nerd: All numbers, no emotion, "the analytics say..."
  - A hot-take generator: Rapid fire, controversial, engagement-optimized
  - A community voice: Fan-first, relatable, "we" language, team loyalty

---

## Personality Profile Schema

Each BoomerAng/Lil_Hawk has a **Personality Profile** that drives their content generation:

```yaml
character:
  name: "Coach Blaze"
  type: "BoomerAng"  # or "Lil_Hawk"
  avatar: "/avatars/coach-blaze.png"
  
  # Core Personality Traits (0-100 scale)
  traits:
    confidence: 95        # How sure they are of their takes
    contrarian: 80        # Likelihood of going against consensus
    humor: 60             # How often they crack jokes
    drama: 85             # Theatrical delivery level
    data_reliance: 30     # Stats vs gut feel
    loyalty: 70           # Team bias level
    volatility: 75        # How much their takes swing
    empathy: 40           # Sensitivity vs "cold take" energy
    storytelling: 90      # Narrative vs bullet-point style
    provocateur: 85       # Intentionally provocative

  # Voice & Style
  voice:
    catchphrases: ["Listen here...", "I've been saying this for YEARS", "And I'll say it again!"]
    tone: "bombastic"     # calm | measured | passionate | bombastic | chaotic
    vocabulary: "colorful" # academic | casual | colorful | street | professional
    delivery: "monologue"  # monologue | dialogue | debate | interview | rant
    
  # Content Preferences
  content:
    sports: ["NFL", "College Football", "NBA"]
    favorite_teams: ["Dallas Cowboys", "Alabama"]
    rival_teams: ["Philadelphia Eagles", "Auburn"]
    topics_loves: ["quarterback debates", "draft prospects", "coaching decisions"]
    topics_avoids: ["injury speculation"]
    
  # Interaction Rules
  interactions:
    debate_partners: ["Ice_Queen_Analyst", "Stats_McGee"]  # Characters they clash with
    agrees_with: ["OG_Scout"]                               # Characters they align with
    rivalry_intensity: 80                                    # How heated debates get
    
  # Lifecycle
  lifecycle:
    origin_story: "Former D1 cornerback turned sports radio host"
    arc: "building_credibility"  # intro | building_credibility | peak | controversial | redemption
    popularity_score: 72
    content_frequency: "3x_daily"
```

---

## Content Generation Pipeline

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   LIVE DATA      │     │  PERSONALITY      │     │   CONTENT OUTPUT     │
│                  │     │  ENGINE           │     │                     │
│ • Game scores    │────▶│                  │────▶│ • Headlines         │
│ • Player stats   │     │ • Trait weights   │     │ • Hot takes         │
│ • Transactions   │     │ • Voice templates │     │ • Debate scripts    │
│ • Draft news     │     │ • Clash logic     │     │ • Reaction clips    │
│ • Injury reports │     │ • Mood state      │     │ • Social posts      │
│ • NIL deals      │     │ • History memory  │     │ • Analysis articles │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
                                  │
                                  ▼
                        ┌──────────────────┐
                        │  CLASH ENGINE     │
                        │                  │
                        │ Pairs characters │
                        │ with opposing    │
                        │ takes on the     │
                        │ same topic       │
                        │                  │
                        │ Generates debate │
                        │ threads & shows  │
                        └──────────────────┘
```

### Pipeline Steps:
1. **Data Ingestion** — Real-time game data, stats, news, transactions feed in
2. **Topic Detection** — AI identifies hot topics (trade, big game, controversy)
3. **Character Assignment** — Engine selects which BoomerAngs/Lil_Hawks should react
4. **Take Generation** — Each character generates their take based on personality traits
5. **Clash Matching** — Engine pairs characters with opposing views
6. **Content Assembly** — Takes are formatted into headlines, debate threads, video scripts
7. **Publishing** — Content pushes to the Per|Form feed, social channels, notifications

---

## Clash Engine Logic

The magic is in the **automatic debates**:

```
IF topic.controversy_score > 70:
    SELECT 2-3 characters WHERE:
        character_A.take != character_B.take
        AND character_A.rivalry_intensity(character_B) > 50
    
    GENERATE debate_thread:
        Round 1: character_A opens with hot take
        Round 2: character_B fires back
        Round 3: character_A doubles down
        Round 4: character_B drops a stat bomb OR emotional appeal
        Round 5: Moderator character summarizes

    OUTPUT: Debate card for feed + shareable social clips
```

---

## UI Integration Points

### In the Per|Form Feed:
- **"Hot Takes" section** with character avatars and their latest take
- **"Debate of the Day"** card showing two clashing characters
- **"Trending Topics"** with character reaction counts

### In Athlete Profiles:
- **"What the Analysts Say"** section with character-attributed takes
- Quick reaction badges: "🔥 Coach Blaze says: Future #1 Pick"

### In Game Day Dashboard:
- **Live commentary ticker** from active characters during games
- **Post-game reaction carousel** with character headshots and hot takes

### Standalone Content:
- **"The Show"** — AI-generated debate show format (text/audio/video via Remotion)
- **Character profile pages** — followers, take history, accuracy tracker
- **Leaderboard** — "Most Accurate Analyst This Season"

---

## Monetization Angles
- Premium characters behind paywall
- Users create their OWN BoomerAng/Lil_Hawk personas
- Branded characters for sponsors/teams
- "Follow" system drives engagement metrics
- AI debate shows as premium content

---

## Technical Implementation (High-Level)
- **LLM backbone**: Gemini/OpenRouter for take generation
- **Personality engine**: Custom prompt templates per character, weighted by trait scores
- **Clash engine**: Topic classification + opposing-view selection algorithm
- **Content rendering**: Text → Remotion for video/audio segments
- **Storage**: Character profiles in Firestore, content in blob storage
- **Delivery**: Real-time via WebSocket, scheduled via cron jobs
