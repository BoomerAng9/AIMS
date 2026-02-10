---
name: Stitch + Nano Banana Pro Design Plan
description: A comprehensive design plan that auto-loads A.I.M.S. Skill Packs and Design Assets, and outputs production-ready UI/UX directives for Stitch and Nano Banana Pro.
version: 1.0.0
---

# A.I.M.S. Stitch + Nano Banana Pro Design Plan

## To-Do: Produce a Stitch + Nano Banana Pro design plan that auto-loads (1) A.I.M.S. Skill Packs and (2) A.I.M.S. Design Assets, and outputs production-ready UI/UX directives (including motion + image usage)

---

## 1) Design Intent (what we are building visually)

**Target vibe:** retro-futurism with controlled imperfection (polished, not sterile).
**References (in plain terms):** “Mr. Robot” tension + lo-fi/MTV-era grit + modern AI glass-box UI.

**Non-negotiables**

* Dark UI foundation + gold accents (A.I.M.S. brand).
* “Glass box” operational transparency (status, proofs, attestation).
* Intentional texture: subtle noise, scanlines, slight vignette, micro-wear (design only; not typography/grammar).

---

## 2) Style System for A.I.M.S. (usable as the single source of truth)

### A) Color + Contrast

* **Base:** near-black / charcoal range (primary surfaces).
* **Accent:** A.I.M.S. gold (primary CTA + key highlights).
* **Utility:** muted grays for secondary text; error/warn colors reserved for security and compliance states.

**Rules**

* Gold is **rare**: only one primary CTA per view.
* All body text passes WCAG contrast targets (no “aesthetic dim text” for critical UI).

### B) Typography

* **Primary:** modern geometric sans (dashboard + product UI).
* **Secondary:** “marker” style for controlled highlights (labels, stamps, badges).
* **Tertiary:** “handwritten” for micro-annotations (sparingly).

**Rules**

* Hand/marker fonts never used for dense paragraphs.
* Numbers (tokens, cost, timelines) always use primary sans.

### C) Layout + Spacing (prevents the cut-off issues)

* Use **dynamic viewport height** behavior (mobile + desktop friendly).
* All primary pages must:

  * Render header immediately (no layout shift that hides nav).
  * Keep the chat composer/input fully visible without cropping.
  * Use safe padding around edges (no content glued to borders).

### D) Texture (the “blemish” layer)

* Subtle noise overlay at low opacity.
* Optional scanline banding (very faint).
* Light vignette + soft bloom around gold highlights.

**Rules**

* Texture must never reduce readability.
* Texture is disabled automatically for accessibility “reduce motion/contrast” modes.

---

## 3) What “Stitch” does in this workflow

**Stitch role:** UI assembly + design-to-component directives.
It takes:

1. **AIMS Style Pack** (rules above)
2. **Screen intent** (Chat w/ACHEEVY, Plugs, Integrations, etc.)
3. **Asset Manifest** (logo, textures, background tiles, hero images)
4. **Motion Rules** (Framer Motion spec)
   …and outputs:

* Page-level layout directives (grid, margins, responsive breakpoints)
* Component recipes (header, cards, buttons, chat composer)
* Motion choreography (entry/exit, hover, loading states)
* Acceptance criteria checklist for QA

---

## 4) What “Nano Banana Pro” does in this workflow (design assets)

**Nano Banana Pro role:** generate/edit the visual layer (textures, background tiles, UI decals, subtle retro elements) while staying on-brand. TechRadar describes Nano Banana Pro as an image-editing leap integrated with Gemini, including higher fidelity, improved text rendering, multi-image blending, and “studio-quality controls.”

**Use it for**

* Background tile variants (your gold logo tile treatments, softened edges, different densities)
* Noise/scanline overlays (exported as PNG layers)
* Micro-decals (badges, stamps, “verified” marks)
* Button/icon texture variants (NOT replacing icons—adding subtle wear)

**Do NOT use it for**

* Core logotype changes (brand integrity risk)
* Dense UI text rendering inside images (keep UI text native for accessibility)

---

## 5) The “Skill Pack Trigger” system (how ACHEEVY auto-loads skills + design files)

### A) Skill Packs (examples)

When the user requests anything UI-related, ACHEEVY automatically attaches:

1. **AIMS_UI_SYSTEM**

* Layout rules, spacing, responsive requirements, accessibility constraints

2. **AIMS_MOTION_FRAMER**

* Motion rules, reduced-motion compliance, loading choreography

3. **AIMS_BRAND_ASSETS**

* Logo usage rules, gold accent limits, background tiling constraints

4. **AIMS_TEXTURE_RETROFUTURE**

* Noise/scanline/vignette layer rules, export formats

5. **AIMS_PERFORMANCE_LOADING**

* “header must render immediately,” layout shift prevention, image optimization rules

6. **AIMS_SECURITY_UI**

* No leaking internal agent dialogue; “glass box” events only; redaction rules

### B) Design File Triggers (Asset Manifest)

Create a single manifest that Stitch and Nano Banana both reference:

* **Brand**

  * Gold ACHIEVEMOR logo (tile source)
  * A.I.M.S. mark variants (light/dark)
* **Background layers**

  * Tile pattern (default)
  * Noise overlay (optional)
  * Scanline overlay (optional)
* **UI decals**

  * Verified badge
  * Certified badge
  * Managed install badge
* **Photography/hero**

  * Any hero imagery you already approved
* **Motion references**

  * “Framer Motion patterns” library (entry/hover/loading)

**Trigger behavior**

* If the prompt includes: *“retro”, “lo-fi”, “Mr. Robot”, “polished but imperfect”, “motion”*
  → attach **AIMS_TEXTURE_RETROFUTURE** + **AIMS_MOTION_FRAMER** automatically.
* If the prompt includes: *“cut off”, “header not visible”, “loading issue”, “mobile”*
  → attach **AIMS_PERFORMANCE_LOADING** automatically.

---

## 6) Production prompt templates (no code)

### A) Stitch prompt template (UI screen)

**Title:** `STITCH • A.I.M.S. Screen Build • [ScreenName]`

**Inputs**

* Screen intent (what the screen must do)
* Constraints (responsive, safe areas, “header always visible,” chat composer never cropped)
* Style Pack: AIMS v1
* Asset Manifest: [list asset IDs/names]
* Motion Rules: Framer Motion pack

**Outputs required**

* Layout map (sections, spacing, breakpoints)
* Component inventory (reusable components + variants)
* State map (loading/empty/error/success)
* Motion spec (entry/exit/hover/loading)
* QA acceptance checklist

### B) Nano Banana Pro prompt template (asset)

**Title:** `NANOBANANA • A.I.M.S. Asset Variant • [AssetName]`

**Inputs**

* Source image(s): [asset IDs]
* Target usage: (background tile / overlay / decal)
* Brand constraints: (gold palette fidelity, no text-as-image, subtle texture only)
* Export constraints: (transparent PNG for overlays; 2x sizes)

**Outputs required**

* Variant set (3–6 options)
* Notes per variant (intended UI placement + opacity guidance)

---

## 7) How to explain the loading issue (header not seen + chat box cut off)

Use this wording as a bug ticket:

### Bug Title

**Header intermittently not visible on initial load; chat composer cropped at bottom**

### Steps to Reproduce

1. Open `/chat` on desktop and mobile (fresh load + hard refresh).
2. Observe first render before fonts/images settle.
3. Resize window or rotate device; repeat.

### Expected

* Header is visible immediately.
* Main content respects header height (no overlap).
* Chat composer is fully visible; send button never clipped.

### Actual

* Header sometimes renders off-screen or is overlapped.
* Chat composer container is cropped at the bottom.

### Likely Causes (plain language)

* Viewport height math or fixed-height containers not accounting for header + safe area.
* Overflow settings clipping content during initial render.
* Layout shift from late-loading fonts/images pushing the content.

### Acceptance Criteria (fix is “done” when)

* No load path hides the header.
* No viewport size crops the chat composer.
* Lighthouse layout shift is controlled (CLS stays low).

---

## 8) “Use my images + Framer Motion” directive (how to explain it to the builder)

### Image usage directive

* All A.I.M.S. images must be referenced from the **Asset Manifest** (no ad-hoc imports).
* Logo tile is a **background layer**, not a content element.
* All overlays (noise/scanlines) must be toggleable and opacity-controlled.

### Motion directive

* Framer Motion is used for:

  * **Entrance choreography:** subtle, fast, never theatrical
  * **Hover feedback:** micro-lift + glow, minimal travel
  * **Loading:** skeleton + pulse, no spinners unless critical
* Reduced-motion mode disables non-essential animations.

---

## 9) Delivery outputs (what you should get back from the team/tools)

1. **AIMS Style Pack v1** (this doc section 2, frozen)
2. **Asset Manifest v1** (single list of approved files + intended usage)
3. **Motion Library v1** (Framer Motion patterns by component type)
4. **Stitch Build Sheets** for:

   * Chat w/ACHEEVY
   * Plugs
   * Integrations
   * Registration/Sign up
5. **Nano Banana Pro Asset Variants**:

   * Tile density set
   * Noise overlay set
   * Scanline overlay set
   * Badge/decal set
