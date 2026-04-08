# Per|Form Boomer_Angs Roster & n8n Integration
## Specialist Agents for The Per|Form Platform

---

## Hierarchy (from README.md)

```
User → ACHEEVY → Boomer_Ang → Chicken Hawk → Squad → Lil_Hawks
```

1. **ACHEEVY** approves plan and presents to user (Lead Color Analyst for Per|Form)
2. **Boomer_Ang** validates scope against DSP limits (specialist analysts below)
3. **Contract** issued to Chicken Hawk with ShiftId
4. **Chicken Hawk** spawns Squad with Lil_Hawks
5. **Lil_Hawks** execute and report (logs only) — Lil_Bull_Hawk, Lil_Bear_Hawk
6. **ACHEEVY** verifies receipt and closes

---

## Per|Form Specialist Boomer_Angs

### Content & Analysis Angs

| Boomer_Ang | Function | Powered By | Description |
|------------|----------|-----------|-------------|
| **Scout_Ang** | Player Research | ii-researcher + Firecrawl | Gathers stats, bio data, game logs from ESPN, MaxPreps, 247Sports, CBS. Feeds the P component of P.A.I. |
| **Film_Ang** | Video Analysis | SAM 2 + Vertex AI | Analyzes film for speed, route running, separation distance. Feeds the A component of P.A.I. |
| **Intel_Ang** | Intangibles Research | Brave Search + OpenRouter | Scrapes news, interviews, social media, character data. Feeds the I component of P.A.I. |
| **Draft_Ang** | Mock Draft Engine | mock-draft-engine.ts | Generates 7-round mock drafts using BPA vs Team Need scoring, position value tiers, fit scoring |
| **NIL_Ang** | NIL Valuation | II-Medical + ii-researcher | Calculates NIL value using Per|Form's weight distribution model |
| **Chronicle_Ang** | Audit Trail | Custom | Logs full session timeline, ensures evidence compliance |
| **Showrunner_Ang** | Content Presentation | OpenRouter + Remotion | Formats articles, generates social clips, assembles presentations |

### Infrastructure & Automation Angs

| Boomer_Ang | Function | Powered By | Description |
|------------|----------|-----------|-------------|
| **Node_Trig_Ang** | n8n Trigger Expert | n8n API + Node.js | Designs, deploys, and manages n8n workflow triggers. Knows every n8n node type, webhook pattern, and scheduling option. The specialist for "when should this run and what triggers it." |
| **JSON_Ang** | JSON Expert | Custom | Structures all data payloads — AthleteCardJSON, scouting reports, API responses. Ensures schema compliance, validates payloads, and handles data transformation between services. |
| **Index_Ang** | Data Indexing | Embeddings + Vector | Creates embeddings, manages datasets, handles search and retrieval for prospect data |
| **Scrape_Ang** | Web Scraping | Firecrawl + Brave | Handles all web scraping operations — rate limiting, proxy rotation, data extraction, error recovery |

---

## n8n Workflow Integration

### Per|Form Automated Pipelines

```
┌─────────────────────────────────────────────────────────────────┐
│  n8n INSTANCE: http://76.13.96.107:5678                         │
│  Auth: N8N_API_KEY via infra/.env                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WORKFLOW 1: prospect-scout-pipeline                            │
│  Trigger: Cron (every 6 hours) OR Webhook (manual)             │
│  ┌────────┐   ┌──────────┐   ┌────────┐   ┌──────────┐        │
│  │ Trigger│──▶│Scout_Ang │──▶│Intel_Ang│──▶│ P.A.I.   │        │
│  │(Cron)  │   │(Stats)   │   │(Intang)│   │ Scorer   │        │
│  └────────┘   └──────────┘   └────────┘   └──────────┘        │
│                                                │               │
│                                                ▼               │
│  ┌──────────┐   ┌──────────────┐   ┌────────────────┐         │
│  │Chronicle │◀──│Showrunner_Ang│◀──│ Article Gen    │         │
│  │  _Ang    │   │(Format)      │   │ (OpenRouter)   │         │
│  └──────────┘   └──────────────┘   └────────────────┘         │
│                                                                 │
│  WORKFLOW 2: combine-tracker                                    │
│  Trigger: Cron (every 30 min during combine week)              │
│  ┌────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │ Trigger│──▶│Scrape_Ang│──▶│ Film_Ang │──▶│  Update  │     │
│  │(Cron)  │   │(Results) │   │(Analysis)│   │  P.A.I.  │     │
│  └────────┘   └──────────┘   └──────────┘   └──────────┘     │
│                                                                 │
│  WORKFLOW 3: comparison-table-updater                           │
│  Trigger: Cron (daily) OR Webhook                              │
│  ┌────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │ Trigger│──▶│Scrape_Ang│──▶│ JSON_Ang │──▶│ Publish  │     │
│  │(Daily) │   │(ESPN,CBS)│   │(Normalize)│  │  to CDN  │     │
│  └────────┘   └──────────┘   └──────────┘   └──────────┘     │
│                                                                 │
│  WORKFLOW 4: article-publisher                                  │
│  Trigger: Webhook (from Showrunner_Ang)                        │
│  ┌────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │Webhook │──▶│ JSON_Ang │──▶│ Validate │──▶│ Publish  │     │
│  │(POST)  │   │(Format)  │   │(Quality) │   │ to Feed  │     │
│  └────────┘   └──────────┘   └──────────┘   └──────────┘     │
│                                                                 │
│  WORKFLOW 5: war-room-debate                                    │
│  Trigger: Webhook (from ACHEEVY or scheduled)                  │
│  ┌────────┐   ┌────────────┐   ┌────────────┐   ┌─────────┐  │
│  │Webhook │──▶│Lil_Bull_   │──▶│Lil_Bear_   │──▶│ Chicken │  │
│  │(POST)  │   │Hawk (Bull) │   │Hawk (Bear) │   │  Hawk   │  │
│  └────────┘   └────────────┘   └────────────┘   │(Mediate)│  │
│                                                   └─────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Node_Trig_Ang Responsibilities

Node_Trig_Ang is the **n8n specialist Boomer_Ang**. It handles:

1. **Workflow Design** — Knows all n8n node types (HTTP Request, Code, Webhook, Cron, etc.)
2. **Trigger Configuration** — Sets up cron schedules, webhook endpoints, event listeners
3. **Error Handling** — Configures retry logic, fallback paths, error notifications
4. **Deployment** — Uses the `n8n-bridge.ts` client to deploy workflows to VPS
5. **Monitoring** — Watches execution logs, identifies failures, alerts ACHEEVY

```typescript
// Node_Trig_Ang deploys via n8n-bridge.ts
import { n8nFetch, triggerPmoWebhook } from '@/lib/n8n-bridge';

// Deploy a new workflow
await n8nFetch({
  path: '/api/v1/workflows',
  method: 'POST',
  body: workflowDefinition,
});

// Trigger a webhook-based workflow
await n8nFetch({
  path: '/webhook/prospect-scout-pipeline',
  method: 'POST',
  body: { athleteId: 'prospect-001', sessionType: 'SCOUT_RUN' },
});
```

### JSON_Ang Responsibilities

JSON_Ang is the **data structure specialist**. It handles:

1. **Schema Enforcement** — Validates AthleteCardJSON, ScourtingReport, DebateTranscript
2. **Data Normalization** — Converts different source formats (ESPN, CBS, 247) into unified Per|Form schema
3. **API Response Formatting** — Ensures all API responses follow consistent structure
4. **Payload Optimization** — Minimizes data size for mobile delivery

```typescript
// AthleteCardJSON schema (maintained by JSON_Ang)
interface AthleteCard {
  id: string;
  name: string;
  position: string;
  school: string;
  classYear: string;
  heightWeight: string;
  
  // P.A.I. Scoring (display only — never expose formula)
  paiScore: number;          // 0-101+
  paiTier: 'PRIME' | 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C';
  paiTierLabel: string;      // "Elite Prospect", etc.
  paiTierColor: string;      // Hex color for display
  
  // AGI breakdown (display only)
  agi: {
    game: number;
    rawAthletics: number;
    overallProduction: number;
    competitionLevel: number;
  };
  
  // AGI Modifiers (display only)
  agiModifiers: {
    leadership: number;
    upsideCeiling: number;
    knownConcerns: number;
    evaluatorConfidence: number;
  };
  
  // NIL Valuation
  nilValue: number;
  nilTier: string;
  
  // Cross-platform comparison
  externalGrades: {
    espn?: string;
    cbs?: string;
    nflNetwork?: string;
    pff?: number;
    on3Nil?: number;
    composite247?: number;
  };
  
  // Content
  scoutingReport?: string;    // Written by Boomer_Ang
  acheevySummary?: string;    // Written by ACHEEVY
  debateTranscript?: string;  // Bull vs Bear from Lil_Hawks
  
  // Metadata
  lastUpdated: string;
  sources: string[];
  complianceFlags: string[];
}
```

---

## First Batch: Per|Form Color Analysts (Boomer_Angs)

### 1. "THE PROFESSOR" — Film_First_Ang

**Inspiration Blend:** Daniel Jeremiah (precision) + Lance Zierlein (creative comps)

```yaml
character:
  name: "The Professor"
  ang_id: "Film_First_Ang"
  type: "Boomer_Ang"
  
  traits:
    confidence: 75
    contrarian: 40
    humor: 35
    drama: 20
    data_reliance: 95
    loyalty: 15
    volatility: 20
    storytelling: 60
    provocateur: 15

  voice:
    catchphrases: ["Watch the tape.", "The film doesn't lie.", "I see a lot of..."]
    tone: "measured"
    vocabulary: "academic"
    delivery: "breakdown"
    
  content:
    specializes_in: ["film analysis", "player comparisons", "technique breakdowns"]
    avoids: ["hot takes", "personal drama"]
    
  grading_filter: "PAI_V1 + AGI"
  # This Boomer_Ang's personality wraps around the P.A.I. score
  # The grade is the grade. The personality is how he delivers it.
```

### 2. "PRIMETIME JR." — Swagger_Ang

**Inspiration Blend:** Deion Sanders (confidence) + Stuart Scott (cultural references) + Ocho Cinco (showmanship)

```yaml
character:
  name: "PrimeTime Jr."
  ang_id: "Swagger_Ang"
  type: "Boomer_Ang"
  
  traits:
    confidence: 98
    contrarian: 60
    humor: 85
    drama: 90
    data_reliance: 45
    loyalty: 50
    volatility: 70
    storytelling: 95
    provocateur: 75

  voice:
    catchphrases: ["You can't cover me!", "That boy DIFFERENT.", "I knew it before everybody knew it."]
    tone: "bombastic"
    vocabulary: "colorful"
    delivery: "monologue"
    
  content:
    specializes_in: ["skill position players", "draft risers", "bold predictions"]
    avoids: ["boring stats-only analysis"]
    
  grading_filter: "PAI_V1 + AGI"
```

### 3. "THE STRATEGIST" — Scheme_Ang

**Inspiration Blend:** Todd McShay (scheme-fit focus) + Ryan Clark (cerebral leadership evaluation)

```yaml
character:
  name: "The Strategist"
  ang_id: "Scheme_Ang"
  type: "Boomer_Ang"
  
  traits:
    confidence: 70
    contrarian: 55
    humor: 30
    drama: 25
    data_reliance: 80
    loyalty: 20
    volatility: 30
    storytelling: 50
    provocateur: 20

  voice:
    catchphrases: ["It's about the fit.", "Look at the scheme demands.", "You have to understand what they're asking him to do."]
    tone: "calm"
    vocabulary: "professional"
    delivery: "dialogue"
    
  content:
    specializes_in: ["scheme fit analysis", "team needs assessment", "coaching impact"]
    avoids: ["personality-driven takes"]
    
  grading_filter: "PAI_V1 + AGI"
```

### 4. "UNCLE BLAZE" — Heat_Ang

**Inspiration Blend:** Shannon Sharpe (storytelling) + Stephen A. Smith (drama) + Marcus Spears (energy)

```yaml
character:
  name: "Uncle Blaze"
  ang_id: "Heat_Ang"
  type: "Boomer_Ang"
  
  traits:
    confidence: 92
    contrarian: 75
    humor: 70
    drama: 95
    data_reliance: 35
    loyalty: 65
    volatility: 85
    storytelling: 98
    provocateur: 90

  voice:
    catchphrases: ["Let me tell you something!", "I been saying this since DAY ONE.", "Y'all wasn't listening!"]
    tone: "passionate"
    vocabulary: "street"
    delivery: "rant"
    
  content:
    specializes_in: ["hot takes", "player comparisons", "draft controversies"]
    avoids: ["nothing — this Boomer_Ang will talk about ANYTHING"]
    
  grading_filter: "PAI_V1 + AGI"
```

### 5. "THE ANCHOR" — Balance_Ang

**Inspiration Blend:** Molly Qerim (moderator) + Damian Woody (blue-collar perspective)

```yaml
character:
  name: "The Anchor"
  ang_id: "Balance_Ang"
  type: "Boomer_Ang"
  
  traits:
    confidence: 65
    contrarian: 30
    humor: 45
    drama: 15
    data_reliance: 70
    loyalty: 10
    volatility: 15
    storytelling: 55
    provocateur: 10

  voice:
    catchphrases: ["Let's look at this from both sides.", "The question is...", "Here's what the data actually says."]
    tone: "professional"
    vocabulary: "professional"
    delivery: "interview"
    
  content:
    specializes_in: ["debate moderation", "balanced analysis", "summary pieces"]
    avoids: ["taking extreme positions"]
    
  grading_filter: "PAI_V1 + AGI"
```

---

## ACHEEVY's Team Structure (Per|Form Context)

```
ACHEEVY (Lead Color Analyst)
├── The Professor (Film_First_Ang) — Film breakdowns, technique
├── PrimeTime Jr. (Swagger_Ang) — Bold calls, entertainment
├── The Strategist (Scheme_Ang) — Scheme fit, team needs
├── Uncle Blaze (Heat_Ang) — Hot takes, controversy
├── The Anchor (Balance_Ang) — Moderation, summaries
│
├── Node_Trig_Ang — n8n workflow triggers & scheduling
├── JSON_Ang — Data structure & payload management
├── Scout_Ang — Stats & data gathering
├── Film_Ang — Video analysis (SAM 2)
├── Intel_Ang — Intangibles research
├── Draft_Ang — Mock draft engine
├── NIL_Ang — NIL valuation
├── Index_Ang — Data indexing & search
├── Scrape_Ang — Web scraping operations
├── Chronicle_Ang — Audit trail
└── Showrunner_Ang — Content formatting & publishing
    │
    ├── Chicken Hawk (Mediator/Dispatcher)
    │   ├── Lil_Bull_Hawk (Bullish case)
    │   └── Lil_Bear_Hawk (Bearish case)
    │
    └── Additional Lil_Hawks (spawned as needed)
```

---

*All Boomer_Angs deliver their analysis through their unique personality lens, 
but the underlying grades ALWAYS come from the P.A.I. + AGI formula. 
The personality is the wrapper. The formula is the truth.*
