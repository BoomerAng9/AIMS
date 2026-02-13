# A.I.M.S. Project Structure

```text
/
├── frontend/                      # Next.js 14 App (User Surface)
│   ├── app/
│   │   ├── api/
│   │   │   ├── acheevy/route.ts   # ACHEEVY API proxy
│   │   │   ├── acp/route.ts       # ACP protocol route
│   │   │   └── chat/route.ts      # Chat streaming route
│   │   ├── dashboard/
│   │   │   ├── acheevy/page.tsx   # ACHEEVY chat interface (NEW)
│   │   │   ├── circuit-box/       # Circuit Box dashboard
│   │   │   ├── chat/page.tsx      # Legacy chat
│   │   │   └── ...
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Landing page
│   ├── components/
│   │   ├── chat/
│   │   │   └── ChatInterface.tsx  # Chat UI component
│   │   ├── deploy-platform/       # Deploy Platform components (NEW)
│   │   │   └── LiveOpsTheater.tsx # Watch-only operations view
│   │   ├── orchestration/         # Glass Box orchestration
│   │   ├── ui/
│   │   │   └── CircuitBoard.tsx   # A.I.M.S. branding components
│   │   ├── DashboardNav.tsx       # Navigation
│   │   └── DashboardShell.tsx     # Dashboard layout
│   └── lib/
│       ├── chat/                  # Chat utilities
│       ├── luc/                   # LUC client
│       └── acp-client.ts          # ACP client
│
├── backend/
│   ├── uef-gateway/               # Node/TS Middleware (UEF)
│   │   ├── src/
│   │   │   ├── acp/               # Protocol definitions
│   │   │   ├── ucp/               # Commerce logic
│   │   │   ├── luc/               # LUC engine
│   │   │   ├── oracle/            # 7-Gate verification
│   │   │   ├── byterover/         # Memory context
│   │   │   ├── agents/            # Agent clients
│   │   │   └── index.ts           # Server entrypoint
│   └── acheevy/                   # ACHEEVY service
│
├── packages/
│   └── luc-sdk/                   # LUC SDK for integration
│
├── infra/                         # Infrastructure Config
│   ├── deploy-platform/           # Deploy Platform (NEW)
│   │   ├── circuit-box/           # ACHEEVY tool calling
│   │   │   ├── acheevy-tools.json       # Tool definitions
│   │   │   ├── chicken-hawk-dispatch.json   # Chicken Hawk API
│   │   │   └── circuit-box-config.json      # Hub config
│   │   ├── lore/                  # Workforce & standards
│   │   │   ├── workforce-structure.json     # Career levels
│   │   │   ├── y-iso-standards.json         # Y-ISO standards
│   │   │   ├── lil-hawk-designations.json   # Worker types
│   │   │   ├── live-ops-theater.json        # Theater config
│   │   │   ├── evolution-bounds.json        # Safe tuning
│   │   │   └── career-record-schema.json    # Career tracking
│   │   ├── contracts/             # Security contracts
│   │   │   ├── shift-contract-schema.json   # Shift contract
│   │   │   └── deploy-security-packet.json  # DSP schema
│   │   ├── registry/              # Capability registry
│   │   │   ├── capability-registry.json     # Available ops
│   │   │   └── bot-moniker-rules.json       # Naming rules
│   │   └── stitch/                # UI configurations
│   │       └── DEPLOY_PLATFORM_YARD_UI_V1.json
│   ├── boomerangs/                # Boomer_Ang configs
│   ├── agent-bridge/              # Agent integration
│   ├── docker-compose.yml         # Dev orchestration
│   ├── docker-compose.production.yml  # Prod orchestration
│   └── .env.example               # Environment config
│
├── mcp-tools/                     # MCP Tool Definitions
│
├── docs/                          # Documentation
│   ├── AIMS_OVERVIEW.md           # Architecture overview
│   ├── DEPLOY_PLATFORM.md         # Deploy Platform guide (NEW)
│   ├── LUC_INTEGRATION_GUIDE.md   # LUC integration
│   └── ORACLE_CONCEPTUAL_FRAMEWORK.md  # Oracle framework
│
├── locale-skills/                 # Locale-specific skills
│
├── PROJECT_TREE.md                # This file
└── README.md                      # Project README
```

## Key Directories

### Frontend (`frontend/`)
The user-facing Next.js 14 application where ACHEEVY lives.
- **app/dashboard/acheevy/**: New ACHEEVY chat interface with Deploy Platform integration
- **components/deploy-platform/**: Live Ops Theater for watching operations

### Backend (`backend/`)
Server-side services handling protocol translation and orchestration.
- **uef-gateway/**: Universal Experience Framework - the central nervous system
- **acheevy/**: ACHEEVY intent analyzer service

### Infrastructure (`infra/`)
Configuration and deployment settings.
- **deploy-platform/**: Complete Deploy Platform configuration
  - **circuit-box/**: ACHEEVY tool definitions and routing
  - **lore/**: Workforce structure, Y-ISO standards, career tracking
  - **contracts/**: DSP and shift contract schemas
  - **registry/**: Capability registry and naming rules
### Documentation (`docs/`)
Architectural and integration documentation.
- **AIMS_OVERVIEW.md**: System architecture with mermaid diagrams
- **DEPLOY_PLATFORM.md**: Deploy Platform detailed guide
