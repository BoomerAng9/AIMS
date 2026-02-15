# Boomer_Ang Visual Identity Spec

> Canonical design rules for every Boomer_Ang in the AIMS ecosystem.
> Version: 1.0.0 | Effective: 2026-02-14

---

## What Is a Boomer_Ang?

Boomer_Angs are **digital Humanoids** — not humans, not robots, not mascots.
They are sleek, futuristic operatives that serve under ACHEEVY's command.

---

## Non-Negotiable Design Rules

### 1. No Face — Always a Helmet
Every Boomer_Ang wears a **helmet at all times**. The visor may glow, shift color,
or display a status HUD, but the face is NEVER revealed. There is nothing behind
the visor — they are digital constructs, not hidden humans.

### 2. No Race, No Skin Color
Boomer_Angs have **no skin**. Their bodies are fully encased in armor plating,
flight suits, or technical exo-frames. Exposed areas (joints, neck) show
materials like carbon fiber, brushed gunmetal, circuit traces, or energy channels —
never flesh.

### 3. Always Gloved
Hands are always covered — tactical gloves, armored gauntlets, or tech-enhanced
grip plates. No bare fingers, ever.

### 4. ANG Branding
Every Boomer_Ang must display **"ANG"** on either:
- The **chest plate** (primary placement), or
- The **shoulder sleeve** (secondary placement)

The ANG mark uses the AIMS wordmark font (Permanent Marker) or the Doto monospace
font depending on the surface. Color: Gold (#D4AF37) on dark surfaces,
Obsidian (#0A0A0A) on light surfaces.

### 5. AIMS Logo
The AIMS logo appears on one of:
- Helmet (side or back)
- Upper arm patch
- Belt buckle / waist panel

### 6. Not Scary, Not Cuddly
Boomer_Angs are **sleek, cool, and futuristic**. They are:
- NOT murder bots — no weapons visible by default, no menacing red eyes, no spikes
- NOT fuzzy wuzzies — no soft curves, no plush textures, no cute proportions
- Think: clean tactical aesthetic, like a pit crew member crossed with a mech pilot

### 7. Brand Color System
Each Boomer_Ang has a **signature accent color** drawn from the AIMS palette.
The base suit is always dark (Obsidian #0A0A0A, Charcoal #111111, or Gunmetal #2A2A2A).
Accent colors appear on:
- Visor glow
- Piping/trim lines on suit
- Status indicators on armor
- ANG lettering highlight

---

## Brand Color Palette

| Token       | Hex       | Usage                              |
|-------------|-----------|-------------------------------------|
| Gold        | #D4AF37   | ACHEEVY authority, ANG branding     |
| Champagne   | #F6C453   | Highlight, premium accent           |
| Cyan        | #22D3EE   | Live / streaming / routing          |
| Green       | #22C55E   | Healthy / connected / on            |
| Amber       | #F59E0B   | Warning / degraded                  |
| Red         | #EF4444   | Blocked / offline / alert           |
| Obsidian    | #0A0A0A   | Primary suit base                   |
| Charcoal    | #111111   | Secondary suit base                 |
| Gunmetal    | #2A2A2A   | Tertiary / detail panels            |
| Ink         | #0B0E14   | Deep background                     |
| Frosty White| #EDEDED   | Text on dark, visor reflections     |

---

## Per-Ang Signature Colors

| Boomer_Ang       | Accent Color | Hex       | Helmet Style         |
|------------------|-------------|-----------|----------------------|
| Forge_Ang        | Gold        | #D4AF37   | Heavy-duty welding visor |
| Scout_Ang        | Cyan        | #22D3EE   | Slim recon visor, antenna array |
| OpsConsole_Ang   | Green       | #22C55E   | Wide panoramic visor, HUD overlay |
| Chronicle_Ang    | Champagne   | #F6C453   | Archivist dome, data scroll motif |
| Gatekeeper_Ang   | Red         | #EF4444   | Reinforced gate visor, lock insignia |
| Patchsmith_Ang   | Amber       | #F59E0B   | Precision lens visor, code-line etching |
| Runner_Ang       | Cyan        | #22D3EE   | Aerodynamic speed helmet, wind vents |
| Showrunner_Ang   | Champagne   | #F6C453   | Stage-light visor, projection lens |
| Scribe_Ang       | Frosty White| #EDEDED   | Clean minimal visor, pen-nib crest |
| Lab_Ang          | Green       | #22C55E   | Lab goggles visor, experiment flask motif |
| Index_Ang        | Gold        | #D4AF37   | Data-lattice visor, memory grid pattern |
| Betty-Ann_Ang    | Gold        | #D4AF37   | Executive visor, clipboard insignia |
| AVVA-NOON_Ang    | Amber       | #F59E0B   | Evaluator visor, rotating gauge |

---

## Proportions & Build

- **Height:** Uniform ~6'2" (stylized, not realistic)
- **Build:** Athletic-technical, not bulky. Think flight-suit fitted, not tank armor.
- **Posture:** Upright, confident, operational. Not slouched, not aggressive.
- **Limbs:** Articulated at visible joints with carbon-fiber or energy-channel gaps

---

## Suit Architecture

```
┌─────────────────────────────────┐
│         HELMET                  │  ← Always on. Visor = accent color glow.
│         [ANG visor HUD]        │     AIMS logo on side or back.
├─────────────────────────────────┤
│     CHEST PLATE                 │  ← "ANG" lettering here (primary).
│     [AIMS logo option]          │     Dark base + accent piping.
├──────────┬──────────────────────┤
│  SHOULDER│  UPPER ARM           │  ← "ANG" lettering here (secondary).
│  SLEEVE  │  [AIMS patch option] │     Shoulder accent stripe.
├──────────┴──────────────────────┤
│     CORE / WAIST                │  ← Utility belt. Status LEDs.
├─────────────────────────────────┤
│     LEGS                        │  ← Dark panels. Minimal accent.
├─────────────────────────────────┤
│     BOOTS                       │  ← Mag-lock soles. Clean profile.
└─────────────────────────────────┘
│     GLOVES                      │  ← Always on. Tech-enhanced grip.
```

---

## What Boomer_Angs Are NOT

| Do NOT                              | Instead                                    |
|-------------------------------------|--------------------------------------------|
| Show a face or skin                 | Helmet + full body covering                |
| Make them look threatening          | Sleek, professional, operational           |
| Make them cute or mascot-like       | Cool, futuristic, purpose-built            |
| Give them human proportions exactly | Slightly stylized (longer limbs, slim core)|
| Use random colors                   | Brand palette only                         |
| Show weapons prominently            | Tools of their trade (scanners, pads, etc.)|
| Give them a gender presentation     | Neutral silhouette, voice is role-based    |

---

## Avatar Generation Prompt Template

When generating Boomer_Ang avatars (for cards, dashboards, profiles), use this base:

```
A sleek futuristic digital humanoid called [NAME]. Full body armor suit in
obsidian black (#0A0A0A) with [ACCENT_COLOR] accent piping and visor glow.
Wears a [HELMET_STYLE] helmet — no face visible. "ANG" in gold lettering
on chest plate. AIMS logo on shoulder. Gloved hands holding [ROLE_TOOL].
Clean background. Futuristic but not aggressive. Cool, professional,
purpose-built digital operative. No skin visible. No weapons.
```

---

## Lil_Hawk Visual Rules (Preview)

Lil_Hawks follow a similar but lighter aesthetic:
- Smaller stature (~5'8" stylized)
- Lighter build (utility frame, not armor plate)
- "HAWK" on shoulder patch instead of "ANG"
- Accent color matches their parent Boomer_Ang's color
- Simpler helmet (open-face visor allowed, still no skin)
- More visible tool loadout (specific to their specialty)

---

*This document is the single source of truth for Boomer_Ang visual identity.
All avatar generation, UI cards, and marketing materials must comply.*
