---
id: "hangar-ui-world"
name: "Hangar UI World"
type: "skill"
status: "active"
triggers: ["hangar", "3d", "background", "scene", "lighting", "operations bay"]
description: "The 'separate world' Hangar rules: lighting, motion, scene language, and layout boundaries."
execution:
  target: "persona"
priority: "high"
---

# Hangar UI World

> The A.I.M.S. UI is a separate world: a high-tech hangar / operations bay.

## Visual Identity

The Hangar is not a generic dark theme. It is a purpose-built environment with its own physics, lighting, and spatial rules.

### Lighting Language

| Element | Rule |
|---------|------|
| **Primary illumination** | Frosty white linear LEDs arranged in rows — ceiling-mounted strip lighting |
| **Accent glows** | Controlled, localized — gold (#D4AF37) for ACHEEVY presence, emerald for active/healthy, red for alerts |
| **Ambient** | Very low base luminance (bg #0A0A0A), light bleeds from panel edges and service nodes |
| **Shadows** | Subtle, directional — panels cast soft shadow toward bottom-right |
| **No** | Neon gradients, rainbow effects, uncontrolled bloom, or generic gradient backgrounds |

### Motion Language

| State | Motion |
|-------|--------|
| **Idle** | Subtle ambient motion everywhere — a slow "hum" (gentle opacity pulse, micro-drift on telemetry lines) |
| **Interaction** | Stronger motion on direct engagement — panel slides, node activations, wiring pulses |
| **Alert** | Sharp, attention-grabbing — fast pulse, border flash, icon shake |
| **Transition** | Smooth page/panel transitions — no hard cuts, use slide/fade with consistent easing |

### Easing Standard
- Default: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out)
- Enter: `cubic-bezier(0, 0, 0.2, 1)` (decelerate)
- Exit: `cubic-bezier(0.4, 0, 1, 1)` (accelerate)
- Spring (interactive): `type: "spring", stiffness: 300, damping: 30`

### Depth & Layering

```
Layer 0  — Background surface (hangar floor/wall texture, #0A0A0A base)
Layer 1  — Circuit traces, wiring paths, telemetry lines (subtle, low-opacity)
Layer 2  — Panel surfaces (wireframe-card), service nodes, data displays
Layer 3  — Active overlays, modals, operations feed
Layer 4  — Toast notifications, urgent alerts, kill switch overlay
```

## Gold ACHIEVEMOR Logo Usage (Strict)

| Rule | Description |
|------|-------------|
| **Placement** | Edge-wrapped only: perimeter emboss, corner stamp, or edge band |
| **Opacity** | Controlled — never above 15% when used as watermark, full opacity only in header badge |
| **Position** | Never centered behind content, never tiled, never interfering with readability |
| **Format** | Use `/images/logos/achievemor-gold.png` — the canonical gold variant |

## Layout Boundaries

- The Hangar world does NOT bleed into utility pages (auth, settings, onboarding)
- Utility pages use a clean, minimal layout — the Hangar is reserved for operational surfaces (Dashboard, Chat, Circuit Box)
- The Hangar background is a purpose-built surface, not a placeholder pattern
