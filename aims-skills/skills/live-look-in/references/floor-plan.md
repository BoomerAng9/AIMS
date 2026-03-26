# Live Look In — Floor Plan Reference

## Layout Structure

The floor plan uses a **two-row + corridor** layout:

```
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ ENGINEERING│ │  SECURITY  │ │  DATA OPS  │ │ DEPLOYMENT │ │  QA/REVIEW │
│ PMO-ECHO   │ │ PMO-SHIELD │ │ PMO-PULSE  │ │ PMO-LAUNCH │ │  PMO-LENS  │
│  🚪        │ │  🚪        │ │  🚪        │ │  🚪        │ │  🚪        │
└────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘
═══════════════════════════ MAIN CORRIDOR ═══════════════════════════════════
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ BREAK ROOM │ │ HAWK NEST  │ │     HR     │ │ CEO OFFICE │
│            │ │ (Chicken   │ │ DEPARTMENT │ │ (ACHEEVY)  │
│  🚪        │ │  Hawk) 🚪  │ │  🚪        │ │  🚪        │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
```

## Room Definitions

```typescript
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const CORRIDOR_Y = 340;
const CORRIDOR_HEIGHT = 60;
const ROOM_GAP = 20;

const ROOMS: RoomDefinition[] = [
  // ── Top Row: Department Rooms ──
  {
    id: "engineering",
    label: "Engineering",
    department: "PMO-ECHO",
    bounds: { x: 20, y: 20, width: 210, height: 280 },
    doorPosition: { x: 120, y: 300 },
    color: "#DBEAFE",
    desks: [
      { id: "eng-1", position: { x: 40, y: 60 }, occupied: false, assignedAgent: null },
      { id: "eng-2", position: { x: 120, y: 60 }, occupied: false, assignedAgent: null },
      { id: "eng-3", position: { x: 40, y: 160 }, occupied: false, assignedAgent: null },
      { id: "eng-4", position: { x: 120, y: 160 }, occupied: false, assignedAgent: null },
    ],
  },
  {
    id: "security",
    label: "Security",
    department: "PMO-SHIELD",
    bounds: { x: 250, y: 20, width: 210, height: 280 },
    doorPosition: { x: 350, y: 300 },
    color: "#FEE2E2",
    desks: [
      { id: "sec-1", position: { x: 40, y: 60 }, occupied: false, assignedAgent: null },
      { id: "sec-2", position: { x: 120, y: 60 }, occupied: false, assignedAgent: null },
    ],
  },
  {
    id: "data-ops",
    label: "Data Ops",
    department: "PMO-PULSE",
    bounds: { x: 480, y: 20, width: 210, height: 280 },
    doorPosition: { x: 580, y: 300 },
    color: "#D1FAE5",
    desks: [
      { id: "data-1", position: { x: 40, y: 60 }, occupied: false, assignedAgent: null },
      { id: "data-2", position: { x: 120, y: 60 }, occupied: false, assignedAgent: null },
    ],
  },
  {
    id: "deployment",
    label: "Deployment",
    department: "PMO-LAUNCH",
    bounds: { x: 710, y: 20, width: 210, height: 280 },
    doorPosition: { x: 810, y: 300 },
    color: "#FFF7ED",
    desks: [
      { id: "dep-1", position: { x: 40, y: 60 }, occupied: false, assignedAgent: null },
      { id: "dep-2", position: { x: 120, y: 60 }, occupied: false, assignedAgent: null },
    ],
  },
  {
    id: "qa-review",
    label: "QA / Review",
    department: "PMO-LENS",
    bounds: { x: 940, y: 20, width: 210, height: 280 },
    doorPosition: { x: 1040, y: 300 },
    color: "#F0FDF4",
    desks: [
      { id: "qa-1", position: { x: 40, y: 60 }, occupied: false, assignedAgent: null },
      { id: "qa-2", position: { x: 120, y: 60 }, occupied: false, assignedAgent: null },
    ],
  },

  // ── Bottom Row: Special Rooms ──
  {
    id: "break-room",
    label: "Break Room",
    bounds: { x: 20, y: 440, width: 270, height: 280 },
    doorPosition: { x: 150, y: 440 },
    color: "#FEF9C3",
    desks: [], // no desks — lounge seating only
  },
  {
    id: "hawk-nest",
    label: "Hawk Nest",
    bounds: { x: 310, y: 440, width: 270, height: 280 },
    doorPosition: { x: 440, y: 440 },
    color: "#FEF3C7",
    desks: [
      { id: "nest-1", position: { x: 130, y: 140 }, occupied: false, assignedAgent: "chicken-hawk" },
    ],
  },
  {
    id: "hr-dept",
    label: "HR Department",
    bounds: { x: 600, y: 440, width: 270, height: 280 },
    doorPosition: { x: 730, y: 440 },
    color: "#FCE7F3",
    desks: [
      { id: "hr-1", position: { x: 40, y: 60 }, occupied: false, assignedAgent: null },
    ],
  },
  {
    id: "ceo-office",
    label: "CEO Office",
    bounds: { x: 890, y: 440, width: 270, height: 280 },
    doorPosition: { x: 1020, y: 440 },
    color: "#FFF7ED",
    desks: [
      { id: "ceo-1", position: { x: 130, y: 140 }, occupied: false, assignedAgent: "acheevy" },
    ],
  },
];

const CORRIDOR: CorridorDefinition = {
  y: CORRIDOR_Y,
  startX: 20,
  endX: CANVAS_WIDTH - 20,
  height: CORRIDOR_HEIGHT,
};
```

## Pathfinding

### Movement Algorithm

```
function getPath(agent, targetRoom):
  1. currentRoom = findRoom(agent.currentRoom)
  2. Walk agent to currentRoom.doorPosition
  3. Move onto corridor centerline (CORRIDOR_Y + CORRIDOR_HEIGHT/2)
  4. Walk horizontally along corridor to targetRoom.doorPosition.x
  5. Move from corridor to targetRoom.doorPosition
  6. Walk to assigned desk inside targetRoom
  return waypoints[]
```

### Constraints

- Agents MUST follow door → corridor → door paths
- No wall clipping, no diagonal shortcuts
- Multiple agents on corridor: slight Y offset to avoid overlap
- Door is the only entry/exit point per room

## Adding New Rooms

1. Define `RoomDefinition` with bounds, door, desks
2. Place in appropriate row (top = department, bottom = special)
3. Ensure door Y coordinate aligns with `CORRIDOR_Y` (top row) or `CORRIDOR_Y + CORRIDOR_HEIGHT` (bottom row)
4. Add desks with unique IDs
5. Update `CANVAS_WIDTH` if needed to fit new rooms
