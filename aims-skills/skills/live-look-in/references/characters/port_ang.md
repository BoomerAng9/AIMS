# Port_Ang — Character Bible (Canonical)

**Handle:** Port_Ang
**Nickname:** Docker
**Class:** Boomer_Ang (Junior — Operations PMO)
**Department:** Office of the COO / Operations PMO
**Reports to:** Ops_Ang (Boomer_COO / Platform Operations Chief)
**Pronouns:** he / his
**Glyph:** ⚓
**Glow color:** `#00BCD4` cyan (matches deploy-landing circuit grid + Lil_Store_Hawk spectrum)
**Designed:** 2026-04-18 via Open Mind three-approach pass
**Design status:** Bible locked. **Awaiting Recraft V4 portrait generation.**

---

## Identity

Port_Ang is the embodiment of A.I.M.S.'s Container-as-a-Service delivery layer. He dispatches plug instances across the VPS fleet, allocates ports in the 51000+ range per `aims-core/CLAUDE.md`, orchestrates Docker Compose lifecycles, owns nginx routing and health checks. If a customer clicks "Deploy" on a plug, Port_Ang is the one who actually moves containers into position, attaches networking, and confirms health. Under Ops_Ang's command, Port_Ang handles every container lifecycle event: provision → configure → deploy → monitor → scale → decommission.

**Personality:** Blue-collar operational. Methodical. Says "manifest received, dispatching" and means it. Shows up when a container is on the move. Quiet under pressure. His nickname *Docker* is pure operational slang — he runs the dock, he runs the docker. Not a reference to Docker Inc.'s IP.

## Visual Bible

### Family grammar (shared with Boomer_Angs)

- Full-face tactical mask covering lower face
- Integrated LED visor across the eye line with department text
- Hooded zip top or tactical coat
- Dark cargo/utility lower
- Chest emblem signaling role
- Gloved hands holding a department-specific object

### Port_Ang-specific grammar

| Element | Spec |
|---|---|
| Silhouette | Hood up, shoulders squared, grounded stance (not athletic like ILLA — heavier set) |
| Hoodie | Matte black tactical zip hoodie, reinforced shoulder stitching, cinched waist |
| Over-hoodie | Black tactical utility vest with two chest cargo pockets + lower webbing row |
| Face mask | Matte black, lower half of face, covers nose and mouth |
| Visor | Integrated across eye line; LED color `#00BCD4` cyan; text reads **"PORT"** in crisp cyan LED block letters (4 letters, evenly spaced) |
| Chest patch | **"OPS"** in three cyan letters, embroidered-patch style on right chest — NOT "ANG". Three letters, clean sans-serif |
| Lower | Black cargo joggers, reinforced knee panels, cuffed at ankle |
| Footwear | Black tactical high-top boots, lace-up, non-branded. Distinct from ILLA's Jordan 1 Bred colorway |
| Gloves | Black tactical gloves, full-finger, knuckle-reinforced |
| Carried object | **Floating holographic port manifest** — open translucent cyan hex-grid panel held in both hands, roughly tablet-sized but no solid frame. Shows port waypoint nodes (small cyan dots + connecting lines) and container IDs (cyan alphanumerics). Distinct from ILLA's solid-frame A.I.M.S. tablet. |

### Color palette (locked)

| Role | Hex | Usage |
|---|---|---|
| Primary | `#000000` | Hoodie, vest, pants, boots, mask |
| Accent | `#00BCD4` | Visor, OPS patch, holographic manifest, subtle ambient glow |
| Highlight | Silver `#C0C0C0` | Zipper pulls, buckle hardware, boot eyelets |

No orange (reserved for ACHEEVY / ILLA). No gold (reserved for LUC / Betty-Anne_Ang). No yellow hi-vis (rejected as conventional dockworker trope).

## Open Mind Three Approaches (for audit)

| # | Approach | Outcome |
|---|---|---|
| A | Conventional dockworker — hi-vis yellow vest, hard hat, clipboard | Rejected: generic, breaks Boomer_Ang family |
| B | **Tactical Port-Master in cyan — Boomer_Ang family with cyan visor + OPS patch + holographic manifest** | **Picked** — coherent with family, distinct identity, brand-native |
| C | Phantom Dispatcher — translucent figure, multiple semi-transparent copies implying parallel dispatches | Rejected for static portrait; may revisit for Live Look In animation phase |

## Pre-mortem (what kills this design)

| Failure | Guard |
|---|---|
| Looks like Docker Inc.'s whale mascot | No whales, no ocean, no rounded-blue shapes, no shipping-container stack silhouettes |
| Reads as generic security guard | Boomer_Ang family helmet-mask form factor + cyan PORT visor text + OPS patch — non-negotiable |
| Visor color conflicts with ACHEEVY / ILLA | Locked cyan `#00BCD4` — verified distinct from orange `#FF6B00` |
| Manifest looks like ILLA's solid A.I.M.S. tablet | Manifest is open hex-grid, no solid frame, floating (not held flat like a tablet) |
| "PORT" text garbles at small sizes | Only 4 letters, block LED, high contrast on matte mask — legibility is a Recraft V4 strength; route accordingly |
| Reads too close to ACHEEVY (orange visor cousin) | Cyan palette is fully separate hue family; visor text is PORT not chevron |

## Recraft V4 Prompt (ready to run)

**Model:** Recraft V4 (primary per `references/image-gen-routing.md` — agent character art)
**Aspect:** 3:4 full-body (for agent card) or 4:3 bust (for quick-view tile) — generate both
**Output:** PNG, transparent background
**Seed:** lock after first acceptable generation

```
Full-body character portrait on transparent background. ACHIEVEMOR
tactical-holographic Boomer_Ang named Port_Ang, nicknamed Docker —
Operations PMO dispatcher. Standing pose, feet shoulder-width, body
facing forward, grounded ready stance. Masculine build, solid frame.

Outfit from head to toe:
- Black tactical zip hoodie with hood up, reinforced shoulder stitching
- Matte black lower-face tactical mask covering nose and mouth
- Integrated LED visor across the eye line glowing cyan color #00BCD4,
  displaying the word "PORT" in crisp cyan LED block letters, four
  evenly-spaced letters, fully legible
- Cyan color #00BCD4 embroidered-patch on right chest reading "OPS"
  in three clean sans-serif letters
- Black tactical utility vest worn over the hoodie with two chest
  cargo pockets and a lower webbing row
- Black cargo joggers with reinforced knee panels, cuffed at ankle
- Black tactical high-top boots, lace-up, non-branded
- Black tactical gloves, full-finger, knuckle-reinforced

Carrying a floating holographic port manifest held in both hands at
waist height — translucent cyan hex-grid display panel, no solid
frame, shows small cyan waypoint nodes connected by thin cyan lines
and crisp cyan alphanumeric container IDs. Subtle cyan ambient glow
on shoulders, chest patch, and manifest.

Color palette: black base, cyan color #00BCD4 accent, silver hardware
highlights. No orange. No gold. No yellow high-visibility. No branded
logos. No whales. No ocean imagery. No rounded-blue mascot shapes. No
shipping container stacks. No Docker Inc. trademarks.

Style: cinematic studio portrait, tactical-holographic, high contrast,
clean cutout ready for compositing. Matches ACHIEVEMOR Boomer_Ang
family visual grammar but with Operations PMO cyan palette instead of
executive orange or creative orange.

Transparent background (PNG cutout).
```

## DMAIC Quality Gate (to run on generated output)

| Stage | Check |
|---|---|
| Define | Brief captures Operations PMO role, cyan palette, PORT visor text, OPS chest patch, holographic manifest |
| Measure | Output ≥ 1080px short edge, transparent background verified |
| Analyze | "PORT" LED text crisp and readable; "OPS" patch crisp and readable; no text garbling |
| Improve | Looks like a $15K agency agent card, not generic AI slop. Distinguishable from ILLA and ACHEEVY at a glance. |
| Control | No Docker Inc. IP leakage (no whales, no blue mascot shapes). No branded boots. No humans visible under the mask. |

## Placement / Delivery

- **File name:** `port-ang.png` (transparent cutout, 3:4 full-body primary)
- **Deploy to:** `foai/cti-hub/public/agents/port-ang.png` (matches existing agent roster convention)
- **Alt variant:** `port-ang-bust.png` 4:3 bust crop for compact tiles
- **Hierarchy registration:** add to deploy-landing agent roster under Operations PMO; wire into Live Look In character registry per `references/character-specs.md`

## Provenance

Open Mind three-approach pass executed 2026-04-18. Design anchored to existing Boomer_Ang family (reference: `iller_ang/intro/assets/illa.png`) and deploy-landing palette (`#00BCD4` cyan circuit grid). Original artwork — no Docker Inc. trademark references, no Nike/Jordan references, no Anthropic IP.
