---
name: playground-sandbox
type: skill
triggers:
  - "playground"
  - "sandbox"
  - "code sandbox"
  - "try code"
  - "test code"
  - "run code"
  - "prompt playground"
  - "test agent"
  - "training data"
  - "student workspace"
execution:
  target: UEF_GATEWAY
  endpoint: /playground
  method: POST
---

# Skill: Playground / Sandbox

> Isolated execution environments for code, prompts, agents, training data, and education.
> Competes with: Manus VM viewport, GenSpark AI Developer, Replit, E2B, Outlier.

## Overview

The Playground system provides five types of isolated environments:

| Type | Purpose | Use Case |
|------|---------|----------|
| **code** | Execute code safely | Students, developers, testing |
| **prompt** | Test LLM prompts | Prompt engineering, A/B testing |
| **agent** | Test Custom Lil_Hawks | Pre-deployment hawk testing |
| **training** | Annotate/evaluate data | Training contracts, AI alignment |
| **education** | Student workspaces | Teachers, students, grading |

## Playground Types

### Code Playground
- Isolated E2B sandbox per session
- Supports: Python, JavaScript, TypeScript, Bash, Go, Rust
- Pre-installed packages configurable
- Network access toggle (on/off)
- Memory and execution time limits
- File system with read/write
- Real-time output streaming

### Prompt Playground
- Multi-model comparison (side-by-side)
- Temperature/parameter sweeping
- Token usage and cost tracking
- System prompt editing
- Response caching for A/B comparison
- Export results as report

### Agent Playground
- Test Custom Lil_Hawks before deploying
- Sandboxed tool access (subset of hawk's tools)
- Verbose logging of all reasoning steps
- Max turn limits for cost control
- Compare different hawk configurations

### Training Playground
- Annotation tasks (label data, rate quality)
- Evaluation tasks (score model outputs)
- Comparison tasks (A vs B preference)
- Generation tasks (write examples)
- Quality metrics and inter-annotator agreement
- **Revenue opportunity:** Compete with Outlier/Scale for annotation contracts

### Education Playground
- Student workspaces per subject
- Difficulty levels: beginner, intermediate, advanced
- AI tutor (optional) for guided learning
- Assignment submission and auto-grading
- Rubric-based evaluation
- **Revenue opportunity:** Sell to schools, bootcamps, corporate training

## User Flow (ACHEEVY Conversation)

### Step 1: Choose Type
ACHEEVY: "What kind of playground? Code sandbox, prompt testing, agent testing, training data, or education workspace?"

### Step 2: Configure
Based on type, ACHEEVY collects:
- **Code:** Language, packages, network access
- **Prompt:** Models to compare, system prompt
- **Agent:** Which hawk to test, tools to enable
- **Training:** Task type, dataset, labels
- **Education:** Subject, difficulty, tutor on/off

### Step 3: Launch
ACHEEVY creates the session and provides the workspace.

### Step 4: Execute
User sends code/prompts/annotations. Each execution is:
- Isolated (no cross-session contamination)
- Metered (LUC cost tracking)
- Logged (full audit trail)
- Time-limited (expiry enforced)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/playground` | Create session |
| GET | `/playground?userId=` | List user's sessions |
| GET | `/playground/stats` | Global stats |
| GET | `/playground/:id?userId=` | Get session details |
| POST | `/playground/:id/execute` | Execute in session |
| POST | `/playground/:id/pause` | Pause session |
| POST | `/playground/:id/resume` | Resume session |
| POST | `/playground/:id/complete` | Complete session |
| POST | `/playground/:id/files` | Add/update files |

## Session Limits

| Limit | Value |
|-------|-------|
| Sessions per user | 5 active |
| Executions per session | 100 |
| Files per session | 50 |
| Default duration | 60 minutes |
| Max duration | Configurable per plan |

## Revenue Model

| Plan | Playgrounds | Duration | Features |
|------|------------|----------|----------|
| Starter | 1 active | 30 min | Code + Prompt only |
| Professional | 3 active | 2 hours | All types |
| Business | 5 active | 8 hours | All types + scheduling + team sharing |
| Enterprise | Unlimited | Custom | + dedicated E2B instances + training contracts |

## Edge AI & Enterprise Use Cases

1. **AI Training Contracts** — Companies pay AIMS to annotate/evaluate their model outputs using the Training Playground. Users earn per annotation.
2. **Corporate Training** — Companies set up Education Playgrounds for employee upskilling. AI tutor handles Q&A.
3. **Student Assignments** — Teachers create assignments, students work in sandboxed environments, auto-grading via rubric.
4. **Agent QA** — Test Custom Lil_Hawks in sandbox before deploying to production. Catch edge cases safely.
5. **Prompt Engineering** — A/B test prompts across multiple models before committing to a pipeline.
