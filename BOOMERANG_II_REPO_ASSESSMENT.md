# Boomer_Ang ↔ Intelligent Internet Repo Assessment

> **Objective**: Map the best II repos to Boomer_Ang specialist roles, containerize them on the n8n VPS, and orchestrate via Docker Compose.
>
> **Excluded**: `ii-agent` (already deployed)
>
> **References**:
> - [II-Agent Deployment Docs](https://intelligent-internet.github.io/ii-agent-prod/docs/getting-started) — Docker stack setup via `./scripts/run_stack.sh --build`
> - [All Repos](https://github.com/orgs/Intelligent-Internet/repositories?type=all) — 20 repos total
> - [Laser Particle Printer Reference](https://youtu.be/yMVNJzdvLi4?si=Nn8GUQIS9sApbVgF) — visual FX inspiration for Deploy Dock

---

## Tier 1 — DEPLOY IMMEDIATELY (High Impact, Direct Boomer_Ang Fit)

### 1. `ii-researcher` → **Research_Ang** 🔬
| Field | Detail |
|---|---|
| **Repo** | `Intelligent-Internet/ii-researcher` |
| **Stars** | 487 |
| **Language** | Python |
| **What It Does** | Deep search agent — intelligent web searches (Tavily, SerpAPI), web scraping (Firecrawl, BS4), multi-step reasoning, comprehensive answer generation with references |
| **Boomer_Ang Role** | **Research_Ang** — handles all research tasks delegated by ACHEEVY: market research, competitive analysis, technology scouting, due diligence |
| **Docker Complexity** | LOW — Python app, standard pip install |
| **Port** | `3010` |
| **Integration** | ACHEEVY routes `intent: research` → n8n webhook → Research_Ang container |

### 2. `CommonGround` → **Strategy_Ang** 🧠
| Field | Detail |
|---|---|
| **Repo** | `Intelligent-Internet/CommonGround` |
| **Stars** | 410 |
| **Language** | Python |
| **What It Does** | Multi-agent team builder — 3-layer team architecture, YAML persona profiles, multi-view observability (Flow, Kanban, Timeline), persistent procedural memory |
| **Boomer_Ang Role** | **Strategy_Ang** — orchestrates complex multi-agent planning sessions. When ACHEEVY gets a big strategic ask, it delegates to Strategy_Ang who spins up a team of sub-agents to analyze, plan, and report back |
| **Docker Complexity** | MEDIUM — multiple agent configs, needs persistent storage |
| **Port** | `3011` |
| **Integration** | ACHEEVY routes `intent: strategy / planning` → Strategy_Ang |

### 3. `Common_Chronicle` → **Intel_Ang** 📊
| Field | Detail |
|---|---|
| **Repo** | `Intelligent-Internet/Common_Chronicle` |
| **Stars** | 24 |
| **Language** | Python |
| **What It Does** | Turns messy context into structured, sourced timelines. Self-learning agent with MCP server support |
| **Boomer_Ang Role** | **Intel_Ang** — business intelligence and timeline analysis. Processes client documents, news feeds, and project histories into structured timelines for decision-making |
| **Docker Complexity** | LOW — Python + MCP |
| **Port** | `3012` |
| **Integration** | ACHEEVY routes `intent: timeline / analysis / intelligence` → Intel_Ang |

### 4. `litellm-debugger` (fork of LiteLLM) → **Router_Ang** 🔀
| Field | Detail |
|---|---|
| **Repo** | `Intelligent-Internet/litellm-debugger` |
| **Stars** | 5.1k (fork of BerriAI/litellm) |
| **Language** | Python |
| **What It Does** | LLM Gateway — proxy server to call 100+ LLM APIs in OpenAI format (Bedrock, Azure, OpenAI, VertexAI, Cohere, Anthropic, Groq, etc.) |
| **Boomer_Ang Role** | **Router_Ang** — the ACHEEVY model router. Instead of hardcoding OpenRouter or individual API keys, all LLM traffic flows through Router_Ang which handles load balancing, fallbacks, cost tracking, and model selection |
| **Docker Complexity** | LOW — well-documented Docker setup |
| **Port** | `4000` (LiteLLM default) |
| **Integration** | Replace direct OpenRouter calls → `http://litellm:4000/v1/chat/completions`. This also feeds real data into LUC! |

---

## Tier 2 — DEPLOY NEXT (Good Fit, Lower Priority)

### 5. `codex` → **Code_Ang** 💻
| Field | Detail |
|---|---|
| **Repo** | `Intelligent-Internet/codex` |
| **Stars** | 7.9k |
| **Language** | Rust |
| **What It Does** | Lightweight CLI coding agent |
| **Boomer_Ang Role** | **Code_Ang** — handles code generation, review, and refactoring tasks |
| **Docker Complexity** | MEDIUM — Rust binary, needs sandbox |
| **Port** | `3013` |
| **Note** | Complements existing KiloCode/Chicken Hawk execution agents |

### 6. `ii-zenith-action` → **CI/CD_Ang** 🚀
| Field | Detail |
|---|---|
| **Repo** | `Intelligent-Internet/ii-zenith-action` |
| **Stars** | 86 |
| **Language** | TypeScript |
| **What It Does** | GitHub Actions integration — automates CI/CD workflows, deployment triggers, and pipeline management |
| **Boomer_Ang Role** | **CI/CD_Ang** — handles automated deployment pipelines, build triggers, and release management for ACHEEVY-orchestrated deployments |
| **Docker Complexity** | LOW — TypeScript, runs as a GitHub Action or standalone |
| **Port** | N/A (GitHub Actions) |
| **Integration** | Wire into Deploy Dock → when ACHEEVY triggers a launch, CI/CD_Ang runs the deployment pipeline |

### 6. `codex-as-mcp` → **MCP Bridge** 🔌
| Field | Detail |
|---|---|
| **Repo** | `Intelligent-Internet/codex-as-mcp` |
| **Stars** | 19 |
| **Language** | Python |
| **What It Does** | Converts codex CLI to an MCP server |
| **Boomer_Ang Role** | Not a standalone Ang — utility that makes Code_Ang accessible via MCP protocol for tool-use |
| **Docker Complexity** | LOW |
| **Port** | N/A (MCP stdio) |

### 7. `PPTist` → **Deck_Ang** 📑
| Field | Detail |
|---|---|
| **Repo** | `Intelligent-Internet/PPTist` (fork of pipipi-pikachu/PPTist) |
| **Stars** | 1.7k |
| **Language** | Vue |
| **What It Does** | Online PowerPoint editor with AI-powered slide generation (AIPPT) |
| **Boomer_Ang Role** | **Deck_Ang** — generates pitch decks, reports, and presentations from ACHEEVY prompts |
| **Docker Complexity** | LOW — Vue app, standard Node build |
| **Port** | `3014` |
| **Integration** | ACHEEVY routes `intent: presentation / deck / slides` → Deck_Ang |

### 8. `gemini-cli` → **Reference Only** (Not containerized)
| Field | Detail |
|---|---|
| **Repo** | `Intelligent-Internet/gemini-cli` |
| **Stars** | 10k |
| **Language** | TypeScript |
| **What It Does** | Gemini CLI agent — you already use this directly |
| **Boomer_Ang Role** | N/A — this IS your development tool, not a Boomer_Ang |

### 9. `gemini-cli-mcp-openai-bridge` → **Bridge Utility** 🌉
| Field | Detail |
|---|---|
| **Repo** | `Intelligent-Internet/gemini-cli-mcp-openai-bridge` |
| **Stars** | 121 |
| **Language** | TypeScript |
| **What It Does** | Bridges Gemini CLI to OpenAI-compatible MCP servers |
| **Boomer_Ang Role** | Utility — enables ACHEEVY to use Gemini models through OpenAI-compatible interfaces |
| **Docker Complexity** | LOW |
| **Port** | `3015` |

---

## Tier 3 — HOLD (Reference / Low Priority)

| Repo | Stars | Why Hold |
|---|---|---|
| `Symbioism-Nextra` | 41 | Documentation site (MDX) — not an agent |
| `Symbioism-TLE` | 33 | Documentation — read online |
| `reveal.js` | 17k | Presentation framework — PPTist is more capable |
| `ghost-gcp-storage-adapter` | 1 | Ghost CMS adapter — not needed |
| `ii-thought` | 31 | RL dataset — training data, not a service |
| `ii_verl` | 2.9k | RL framework — training infra, not runtime |
| `CoT-Lab-Demo` | 94 | Demo/experiment — not production-ready |
| `ii-agent-community` | 18 | Showcase projects — reference only |
| `II-Commons` | 33 | Dataset utilities — could integrate into Research_Ang |

---

## Docker Compose Deployment Plan

### Prerequisites
- n8n VPS at `76.13.96.107`
- Docker + Docker Compose installed
- Ports: 3010-3015, 4000 available

### `docker-compose.boomerangs.yml`

```yaml
version: '3.8'

services:
  # ── Tier 1: Immediate Deploy ─────────────────────────────
  
  research-ang:
    image: ghcr.io/intelligent-internet/ii-researcher:latest
    container_name: research_ang
    restart: unless-stopped
    ports:
      - "3010:8000"
    environment:
      - TAVILY_API_KEY=${TAVILY_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - FIRECRAWL_API_KEY=${FIRECRAWL_API_KEY}
    volumes:
      - research_data:/app/data
    networks:
      - boomerang-net

  strategy-ang:
    build:
      context: ./repos/CommonGround
      dockerfile: Dockerfile
    container_name: strategy_ang
    restart: unless-stopped
    ports:
      - "3011:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - strategy_data:/app/runs
    networks:
      - boomerang-net

  intel-ang:
    build:
      context: ./repos/Common_Chronicle
      dockerfile: Dockerfile
    container_name: intel_ang
    restart: unless-stopped
    ports:
      - "3012:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - intel_data:/app/data
    networks:
      - boomerang-net

  router-ang:
    image: ghcr.io/berriai/litellm:main-latest
    container_name: router_ang
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      - LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - GROQ_API_KEY=${GROQ_API_KEY}
    volumes:
      - ./litellm-config.yaml:/app/config.yaml
    command: ["--config", "/app/config.yaml", "--port", "4000"]
    networks:
      - boomerang-net

  # ── Tier 2: Next Wave ────────────────────────────────────

  deck-ang:
    build:
      context: ./repos/PPTist
      dockerfile: Dockerfile
    container_name: deck_ang
    restart: unless-stopped
    ports:
      - "3014:80"
    networks:
      - boomerang-net

volumes:
  research_data:
  strategy_data:
  intel_data:

networks:
  boomerang-net:
    driver: bridge
```

### Integration with ACHEEVY

Once deployed, update the frontend's `.env.local`:

```env
# Boomer_Ang Endpoints (n8n VPS)
RESEARCH_ANG_URL=http://76.13.96.107:3010
STRATEGY_ANG_URL=http://76.13.96.107:3011
INTEL_ANG_URL=http://76.13.96.107:3012
ROUTER_ANG_URL=http://76.13.96.107:4000
DECK_ANG_URL=http://76.13.96.107:3014
```

And update the ACHEEVY orchestrator to route intents:

```
User says "Research competitor X" 
  → ACHEEVY classifies intent: research
  → Calls Research_Ang at :3010
  → Returns structured report to user
```

### Disk Space Estimate

| Service | Approx Size |
|---|---|
| `ii-researcher` | ~500MB |
| `CommonGround` | ~800MB |
| `Common_Chronicle` | ~300MB |
| `litellm` | ~400MB |
| `PPTist` | ~200MB |
| **Total** | **~2.2 GB** |

### Next Steps

1. SSH into VPS → check disk with `df -h`
2. Clone Tier 1 repos into `/opt/boomerangs/repos/`
3. Create `litellm-config.yaml` with model routing
4. `docker compose -f docker-compose.boomerangs.yml up -d`
5. Wire ACHEEVY intent router to new endpoints
6. Update LUC to track usage through Router_Ang (real data!)
