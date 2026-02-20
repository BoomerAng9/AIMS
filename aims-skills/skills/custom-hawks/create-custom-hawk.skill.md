---
name: create-custom-hawk
type: skill
triggers:
  - "create a hawk"
  - "make my own hawk"
  - "custom hawk"
  - "custom bot"
  - "create a bot"
  - "my own lil hawk"
  - "build me a hawk"
  - "personal assistant"
  - "custom agent"
execution:
  target: UEF_GATEWAY
  endpoint: /custom-hawks
  method: POST
---

# Skill: Create Custom Lil_Hawk

> Let users create their own Lil_Hawks — named, configured, and deployed by ACHEEVY.
> "Lil_Increase_My_Money_Hawk", "Lil_Grade_My_Essay_Hawk", "Lil_Find_Me_Leads_Hawk" — unlimited possibility.

## Overview

Custom Lil_Hawks are user-created bots that live inside the A.I.M.S. platform.
Users name them, define what they do, pick their tools, and deploy them.

Every Custom Lil_Hawk:
- Follows the `Lil_<Name>_Hawk` naming pattern
- Is supervised by the domain-matched Boomer_Ang
- Routes through ACHEEVY (users never see internal orchestration)
- Is metered via LUC billing
- Has evidence requirements (no proof, no done)

## User Flow (ACHEEVY Conversation)

### Step 1: Name Your Hawk
ACHEEVY asks: "What should we call your hawk? It follows the pattern `Lil_<YourName>_Hawk`. Be creative — this is YOUR bot."

**Rules:**
- Must match: `Lil_[A-Za-z0-9_]+_Hawk`
- Max 60 characters
- Cannot use reserved system hawk names
- Must be unique per user

**Examples:**
- `Lil_Track_My_Stocks_Hawk` (trading)
- `Lil_Write_My_Blogs_Hawk` (content)
- `Lil_Grade_Papers_Hawk` (education)
- `Lil_Find_Me_Clients_Hawk` (marketing)
- `Lil_Monitor_My_Site_Hawk` (automation)
- `Lil_Research_Competitors_Hawk` (research)

### Step 2: Define Purpose
ACHEEVY asks: "What does this hawk DO? One sentence. Be specific."

**Good:** "Monitor my cryptocurrency portfolio and alert me when any holding moves more than 5% in a day"
**Bad:** "Do stuff with money"

### Step 3: Pick Domain
ACHEEVY presents domains and auto-assigns the supervisor Boomer_Ang:

| Domain | Supervisor | Use Cases |
|--------|-----------|-----------|
| trading | Analyst_Ang | Stocks, crypto, portfolio, financial analysis |
| research | Scout_Ang | Web research, competitive analysis, data mining |
| content | Marketer_Ang | Blog posts, social media, copywriting |
| code | Patchsmith_Ang | Code generation, debugging, deployment |
| automation | OpsConsole_Ang | Workflows, API integrations, scheduling |
| education | Scribe_Ang | Tutoring, grading, lesson planning |
| marketing | Marketer_Ang | Ads, campaigns, SEO, outreach |
| data | Index_Ang | Data processing, ETL, visualization |
| communication | Runner_Ang | Email, messaging, scheduling |
| creative | Showrunner_Ang | Design, video, audio generation |
| custom | Forge_Ang | User-defined — anything goes |

### Step 4: Select Tools
ACHEEVY shows available tools:

| Tool | Description |
|------|------------|
| web_search | Search the web |
| web_scrape | Scrape websites |
| code_sandbox | Execute code in sandbox |
| llm_chat | AI conversation |
| file_generate | Create documents |
| email_send | Send emails |
| telegram_send | Telegram notifications |
| discord_send | Discord notifications |
| n8n_workflow | Trigger automations |
| data_analyze | Analyze data |
| image_generate | Generate images |
| video_generate | Generate videos |
| calendar | Manage calendar |
| crm_update | Update CRM records |

### Step 5: Set Budget & Autonomy
- **Budget cap:** Max USD per execution ($0.01 – $100)
- **Autonomy level:**
  - `manual` — hawk asks before every action
  - `semi-auto` — hawk acts on pre-approved tasks, asks for new ones
  - `full-auto` — hawk acts autonomously within budget

### Step 6: (Optional) Schedule
Set recurring execution:
- Cron expression (e.g., "every weekday at 9am")
- Task description for scheduled runs
- Notification preference on completion

### Step 7: Deploy
ACHEEVY creates the hawk, assigns the supervisor, compiles the system prompt, and activates.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/custom-hawks` | Create a new custom hawk |
| GET | `/custom-hawks?userId=` | List user's hawks |
| GET | `/custom-hawks/domains` | Get available domains + tools |
| GET | `/custom-hawks/:hawkId?userId=` | Get hawk details |
| PATCH | `/custom-hawks/:hawkId/status` | Pause/activate/retire |
| DELETE | `/custom-hawks/:hawkId?userId=` | Delete hawk |
| POST | `/custom-hawks/:hawkId/execute` | Execute hawk with a message |
| GET | `/custom-hawks/:hawkId/history` | Get execution history |

## Revenue Model

Custom Lil_Hawks are a premium feature:
- **Starter plan:** 1 custom hawk, manual only
- **Professional plan:** 5 custom hawks, semi-auto
- **Business plan:** 20 custom hawks, full-auto + scheduling
- Each execution metered via LUC

## Security Rules

1. Hawks CANNOT access other users' data
2. Hawks CANNOT exceed their budget cap
3. Hawks CANNOT use tools not in their config
4. All hawk actions route through UEF Gateway (Port Authority)
5. Audit trail for every hawk creation and execution
6. Supervisor Boomer_Ang can override/pause hawk at any time

## Think Bigger

Users aren't just creating bots — they're creating a **team**.
- A user with 5 hawks has a micro-agency inside AIMS
- Hawks can be shared (future: hawk marketplace)
- Hawks can be tested in Playground sandboxes before going live
- Hawks can participate in LiveSim rooms
- Think: "I have Lil_Research_Hawk, Lil_Write_Hawk, and Lil_Publish_Hawk — they handle my entire content pipeline"
