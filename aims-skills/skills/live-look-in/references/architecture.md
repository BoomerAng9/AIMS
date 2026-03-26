# Live Look In — Architecture Reference

## System Layers

### 1. Renderer (Client)

| Component | POC                  | Production              |
|-----------|----------------------|-------------------------|
| Engine    | HTML5 Canvas 2D      | PixiJS 8 (WebGL)        |
| Framework | React 18 + Next.js   | React 18 + Next.js      |
| State     | Zustand              | Zustand + middleware     |
| Styling   | Tailwind CSS         | Tailwind CSS             |

**Renderer scaling path:**

| Agent Count | Recommended Renderer          | Why                                                 |
|-------------|-------------------------------|-----------------------------------------------------|
| < 20        | HTML Canvas 2D (current)      | Simple, no dependencies                             |
| 20-100      | Pixi.js (WebGL 2D)            | Hardware-accelerated sprites, batched rendering      |
| 100-500     | Pixi.js + viewport culling    | Only render visible agents in scrollable floor plan  |
| 500+        | Custom WebGL or Three.js 2D   | Full GPU control, instanced rendering                |

**Performance budget:** 60fps with < 16ms frame time.

### 2. State Engine (Server)

| Component | POC                  | Production              |
|-----------|----------------------|-------------------------|
| Runtime   | Browser-only (none)  | FastAPI or Express       |
| State     | In-memory JS         | Redis + PostgreSQL       |
| API       | None                 | REST + WebSocket         |

### 3. Event Bus (Transport)

| Component | POC                  | Production              |
|-----------|----------------------|-------------------------|
| Transport | Simulated timers     | Redis Pub/Sub            |
| Client    | None                 | WebSocket (socket.io)    |
| SDK       | None                 | Python/Node Agent SDK    |

### 4. Asset Layer (CDN/Store)

| Component | POC                  | Production              |
|-----------|----------------------|-------------------------|
| Assets    | Canvas draw calls    | Spritesheets (PNG/WebP)  |
| Storage   | Inline code          | Cloudflare R2 or S3      |
| Pipeline  | None                 | ImageMagick + TexturePacker |

## Zustand Store Shape

```typescript
interface LiveLookInStore {
  // World state
  agents: AgentState[];
  rooms: RoomDefinition[];
  corridor: CorridorDefinition;
  desks: DeskState[];

  // Selection
  selectedAgentId: string | null;
  hoveredRoomId: string | null;

  // Activity feed
  events: ActivityEvent[];
  maxEvents: number; // ring buffer (default 100)

  // PCP tracking
  activePCPs: PCPDocument[];

  // View controls
  zoom: number;
  panOffset: { x: number; y: number };
  showOrgChart: boolean;
  showPCPBadges: boolean;
  showKPIs: boolean;

  // Connection
  connectionStatus: "simulated" | "polling" | "sse" | "websocket" | "disconnected";
  lastUpdate: number;

  // Actions
  updateAgentState: (id: string, patch: Partial<AgentState>) => void;
  dispatchTask: (agentId: string, task: TaskAssignment) => void;
  moveAgent: (agentId: string, targetRoom: string) => void;
  pushEvent: (event: ActivityEvent) => void;
  selectAgent: (id: string | null) => void;
}

interface AgentState {
  id: string;
  name: string;
  tier: "executive" | "boomer_ang" | "lil_hawk";
  glyph?: string;              // single letter for Boomer_Ang window
  department: string;           // PMO-ECHO, PMO-SHIELD, etc.
  specialty: string;
  glowColor: string;            // hex color
  spriteState: "idle" | "working" | "moving" | "break" | "alert";
  currentRoom: string;
  targetRoom: string | null;
  position: { x: number; y: number };
  rotation: number;             // degrees, for Boomer_Ang spin
  currentTask: string | null;
  kpis: AgentKPIs;
  lastActive: number;
}

interface AgentKPIs {
  tasksCompleted: number;
  averageScore: number;
  averageTimeSeconds: number;
  efficiencyPct: number;
}

interface PCPDocument {
  id: string;                   // PCP-{timestamp_base36}
  task: string;
  agentId: string;
  complexity: "low" | "medium" | "high";
  vision: string;
  mission: string;
  objectives: string[];
  startTime: number;
  endTime: number | null;
  score: number | null;         // 0-100
  grade: "S" | "A" | "B" | "C" | "D" | null;
}

interface RoomDefinition {
  id: string;
  label: string;
  department?: string;
  bounds: { x: number; y: number; width: number; height: number };
  doorPosition: { x: number; y: number };  // connects to corridor
  color: string;
  desks: DeskDefinition[];
}

interface DeskDefinition {
  id: string;
  position: { x: number; y: number };  // relative to room
  occupied: boolean;
  assignedAgent: string | null;
}

interface CorridorDefinition {
  y: number;          // centerline Y coordinate
  startX: number;
  endX: number;
  height: number;     // corridor width in pixels
}

interface ActivityEvent {
  id: string;
  timestamp: number;
  agentId: string;
  type: "task_start" | "task_complete" | "room_move" | "alert" | "gate_pass" | "dispatch" | "break_start" | "break_end";
  message: string;
  pcpId?: string;
}
```

## Component Tree

```
<LiveLookIn>
  <FloorPlanCanvas>            — renders rooms, corridor, walls, doors
    <RoomRenderer />           — per-room: background, label, desks
    <AgentSprite />            — per-agent: position, state, animation, glyph
    <CorridorRenderer />       — horizontal main hallway
  </FloorPlanCanvas>
  <ActivityTicker />           — scrolling event log (bottom bar)
  <AgentDetailPanel />         — click-to-expand: PCP, KPIs, task history
  <OrgChartOverlay />          — PMO hierarchy mini-map (toggleable)
  <KPIDashboard />             — workforce-level OKR metrics (toggleable)
</LiveLookIn>
```

## API Endpoints (Phase 3+)

```
GET  /api/live-look-in/state        → full world state snapshot
GET  /api/live-look-in/agents       → agent list with KPIs
GET  /api/live-look-in/pcp/:id      → single PCP document
POST /api/live-look-in/dispatch     → manually assign task to agent
WS   /ws/live-look-in              → real-time event stream
```

## World State Schema (Server)

```json
{
  "timestamp": 1711000000000,
  "agents": [
    {
      "id": "ba-0",
      "name": "API_Ang",
      "type": "boomerang",
      "state": "working",
      "position": { "room": "engineering", "x": 0.45, "y": 0.32 },
      "task": { "id": "task-xyz", "title": "API Gateway Refactor", "progress": 67.2 },
      "kpis": { "tasksCompleted": 12, "avgScore": 89, "efficiency": 93 }
    }
  ],
  "rooms": [],
  "stats": { "totalCompleted": 142, "activeCount": 4, "orgEfficiency": 87 }
}
```

**Positions use normalized coordinates** (0.0-1.0 within room bounds) so the renderer can scale to any viewport size.

## Security Considerations

- WebSocket connections authenticated via JWT
- Each tenant's world state is isolated (multi-tenant)
- Event Bus channels are namespaced per org: `livelookin:{org_id}:events`
- No raw agent output is sent to the viewer — only structured state
- Rate limiting on WebSocket connections (max 100 state updates/sec per client)
- CORS restricted to known frontend domains

## Data Flow

```
Agent SDKs / Factory Controller
         │ emit structured events
         ▼
   Redis Pub/Sub
         │
         ▼
   State Engine (aggregation)
         │ world state model
         ▼
   /api/live-look-in/state  OR  WebSocket push
         │
         ▼
   Zustand Store (client)
         │ reactive subscriptions
         ▼
   Canvas Renderer (requestAnimationFrame @ 60fps)
```
