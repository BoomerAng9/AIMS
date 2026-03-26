# Live Look In — Character Specifications

## Design Language

All Live Look In characters follow a **tactical-tech aesthetic**: military/industrial forms enhanced with glowing circuit elements and neon accents. The palette is dark backgrounds with high-contrast neon highlights.

## Naming Conventions (Mandatory)

| Tier         | Pattern                | Example                    |
|--------------|------------------------|----------------------------|
| Executive    | Proper name            | ACHEEVY, Chicken Hawk      |
| Boomer_Ang   | `{Skill}_Ang`          | API_Ang, Crypt_Ang         |
| Lil_Hawk     | `Lil_{Skill}_Hawk`     | Lil_Code_Hawk              |

**Never**: `Credential_Hawk` (missing `Lil_` prefix), `boomerang` (it's `Boomer_Ang`).

## Character Definitions

### ACHEEVY (Digital CEO)

- **Visual**: Helmeted figure — black tactical helmet with glowing orange visor slit, brown/rust jacket, camo pants, tech gloves, holding glowing blue "Plug Me In" cube
- **Behavior**: Stationary in CEO Office. Visor pulses on dispatch events. Cube glows when Factory Controller active.
- **Sprite size**: 128x256px (standing figure)
- **Reference**: `assets/acheevy_reference.png`

**Animation Details:**

| Element | Animation                                            |
|---------|------------------------------------------------------|
| Visor   | Sine-wave opacity pulse, 0.7-1.0, ~3s cycle         |
| Cube    | Blue glow pulse, 0.5-1.0, ~2s cycle, slight bob     |
| Body    | Subtle breathing motion (+/-2px Y on torso), ~4s cycle |
| Overall | Stationary — ACHEEVY never leaves the CEO office     |

**Rendering Notes:**
- Rendered ONLY in the CEO office, always centered
- Larger than other entities (~2x agent height)
- Cube glow should cast subtle blue ambient light on the jacket
- At scale: single static sprite + overlay effects (visor, cube)

### Chicken Hawk (Commander)

- **Visual**: Armored gold mech-hawk — dark metallic body, massive gold spread wings, hawk helmet with gold crest, glowing gold eyes, chest armor with slash marks, A.I.M.S. branding
- **Behavior**: Stationary in Hawk Nest. Wings subtly flap. Eyes pulse gold on Lil_Hawk activity.
- **Sprite size**: 192x192px (with wings spread)
- **Reference**: `assets/chickenhawk_reference.png`

**Animation Details:**

| Element       | Animation                                        |
|---------------|--------------------------------------------------|
| Wings         | Subtle flap, +/-5 deg rotation on wing root, 4s cycle |
| Eyes          | Gold glow pulse, 0.6-1.0, 3s cycle              |
| Chest slashes | Subtle gold shimmer, staggered timing            |
| Overall       | Stationary — always in Hawk Nest, facing forward |

**Rendering Notes:**
- Rendered ONLY in the Hawk Nest room
- Largest entity in the system (~2.5x agent height with wings)
- Wings should extend slightly beyond room bounds for dramatic effect
- At scale: 4-6 frame wing-flap spritesheet + eye glow overlay

### Boomer_Angs ({Skill}_Ang)

- **Visual**: Aussie boomerang shape — wood-grain body (#8B6914 to #C49A3C gradient), 3 circuit-board windows with neon glyphs, LED edge dots
- **Glyph**: Each Boomer_Ang has a single-letter glyph displayed in the center window
- **Behavior**: Spin clockwise while working/traveling. Stop spinning on break.
- **Sprite size**: 128x128px (standard), 64x64px (thumbnail)
- **Reference**: `assets/boomer_ang_reference.png`

**Design Elements (from reference image):**

1. **Body**: Classic Australian boomerang V-shape, ~120 deg angle between arms
2. **Material**: Wood-grain texture — warm brown tones (#8B6914 to #C49A3C gradient)
3. **Circuit Windows**: Three recessed oval panels with visible circuit board traces
   - **Left arm window**: Amber/orange neon glow (#FF8C00)
   - **Center window**: Agent-specific glow color with single-letter glyph
   - **Right arm window**: Blue/cyan neon glow (#00BFFF)
4. **LED Edge Dots**: 5-6 small blue-white LED points along the outer edge
5. **Edge Trim**: Subtle metallic blue rim highlight

**Registered Boomer_Angs:**

| Name       | Glyph | Glow Color           | Department  | Specialty         |
|------------|-------|----------------------|-------------|-------------------|
| API_Ang    | A     | #FF8C00 (amber)      | Engineering | API & Integration |
| UI_Ang     | U     | #00E5FF (cyan)       | Engineering | Frontend Systems  |
| Crypt_Ang  | C     | #FF3CAC (pink)       | Security    | Auth & Encryption |
| Data_Ang   | D     | #7CFF01 (green)      | Data Ops    | Pipeline & ETL    |
| Deploy_Ang | P     | #FFD600 (gold)       | Deployment  | CI/CD & Infra     |
| QA_Ang     | Q     | #A78BFA (purple)     | QA/Review   | Testing & Audit   |
| SME_Ang    | S     | #4169E1 (royal blue) | Engineering | Subject Matter    |
| Flow_Ang   | F     | #8A2BE2 (blue violet)| Engineering | Workflow Mgmt     |
| Design_Ang | X     | #FF1493 (deep pink)  | Engineering | UI/UX Design      |

**Future naming examples:** Net_Ang, Log_Ang, Auth_Ang, Parse_Ang, Scale_Ang

**Rendering at Scale:** Each glow color variant needs its own spritesheet (circuit windows tinted to match). The center glyph is rendered as a text overlay, NOT baked into the sprite, so it can change if an agent is reassigned.

### Lil_x_Hawks (Minions)

- **Visual**: Smaller gold hawk minions — same dark metallic armor as Chicken Hawk, miniaturized
- **Wings**: Smaller gold wings, proportionally larger relative to body
- **Head**: Single glowing gold eye (cyclops-style, simplified from Chicken Hawk)
- **Scale**: ~40% the size of a Boomer_Ang
- **Behavior**: Same movement rules as Boomer_Angs. **1.5x faster** travel speed.
- **Sprite size**: 48x48px

**Registered Lil_Hawks:**

| Agent              | Department    | Backend       | Glow Color |
|--------------------|---------------|---------------|------------|
| Lil_Code_Hawk      | PMO-ECHO      | OpenCode      | #FFD700    |
| Lil_TRAE_Hawk      | PMO-ECHO      | TRAE Agent    | #FFC107    |
| Lil_Vuln_Hawk      | PMO-SHIELD    | Security scan | #FF4444    |
| Lil_Crawl_Hawk     | PMO-PULSE     | Web scraping  | #44FF44    |
| Lil_Agent_Hawk     | PMO-ECHO      | Agent Zero    | #44FFAA    |
| Lil_Flow_Hawk      | PMO-ECHO      | n8n           | #AA44FF    |
| Lil_Sand_Hawk      | PMO-ECHO      | OpenSandbox   | #FFAA44    |
| Lil_Memory_Hawk    | PMO-PULSE     | CoPaw/ReMe    | #44AAFF    |
| Lil_Graph_Hawk     | PMO-PULSE     | LangGraph     | #6366F1    |
| Lil_Back_Hawk      | PMO-LAUNCH    | InsForge      | #EF4444    |
| Lil_Viz_Hawk       | PMO-ECHO      | SimStudio     | #EC4899    |
| Lil_Blend_Hawk     | PMO-ECHO      | Blender 3D    | #EAB308    |
| Lil_Deep_Hawk      | PMO-PULSE     | DeerFlow 2.0  | #F43F5E    |

**Future naming examples:** Lil_Scan_Hawk, Lil_Parse_Hawk, Lil_Watch_Hawk

## Sprite States

| State    | Visual                                | Trigger                     |
|----------|---------------------------------------|-----------------------------|
| idle     | Seated at desk, no glow               | No active task              |
| working  | At desk + glow pulse + Ang spin       | Task assigned               |
| moving   | Walking corridor path between rooms   | Room transition             |
| break    | In Break Room, no spin, dimmed        | Break scheduled             |
| alert    | Red pulse overlay                     | Error, review gate, blocked |

## Animation Specs

### Boomer_Ang Spin

| State     | Rotation                                      | Glow Intensity              | LED State       |
|-----------|-----------------------------------------------|-----------------------------|-----------------|
| Working   | Clockwise, 0.08-0.12 rad/frame               | Pulsing (0.5-1.0 sine wave) | On, pulsing     |
| Traveling | Clockwise, same speed                         | Full brightness             | On, steady      |
| Break     | Stopped (angle = 0 or last angle)             | Dim (0.3 opacity)           | Off or very dim |
| Returning | Spinning (slowing to stop)                    | Fading                      | Dimming         |

### Movement
- **Boomer_Ang speed**: 1.0x base (2px per frame at 60fps = 120px/s)
- **Lil_Hawk speed**: 1.5x base (3px per frame at 60fps = 180px/s)
- **Path**: Door -> corridor centerline -> destination door (waypoint-based)
- **Easing**: Linear along corridor, ease-out into room

### State Transitions
- idle -> working: 300ms glow fade-in
- working -> moving: 200ms desk stand-up
- moving -> idle: 300ms sit-down at desk
- any -> alert: 0ms instant red pulse
- any -> break: 500ms fade to dimmed

## Color Palette Summary

| Entity          | Primary                              | Accent                 | Glow            |
|-----------------|--------------------------------------|------------------------|-----------------|
| Boomer_Ang body | #8B6914-#C49A3C (wood)               | #00BFFF (LED)          | Per-agent       |
| ACHEEVY         | #8B5E2B-#C4843C (jacket)             | #1a1a2e (helmet)       | #FF8C00 (visor) |
| Chicken Hawk    | #2a2a3e (armor)                      | #DAA520-#FFD700 (gold) | #FFD700 (eyes)  |
| Lil_Hawk        | #2a2a3e (armor)                      | #DAA520 (wings)        | #FFD700 (eye)   |
| Floor/BG        | #060b16-#0b1020                      | -                      | -               |
| Corridor        | rgba(60,90,140,0.06)                 | -                      | -               |
| Departments     | Per-dept accent color at low opacity | -                      | -               |

## Adding New Characters

1. Choose tier (Executive, Boomer_Ang, Lil_Hawk)
2. Follow naming convention: `{Skill}_Ang` or `Lil_{Skill}_Hawk`
3. Assign glyph (Boomer_Ang only), department, specialty, glowColor
4. Add to character registry in this file
5. Add desk assignment in `references/floor-plan.md`
6. If using sprites: add frames to spritesheet, update `references/asset-pipeline.md`
