# LUC — Character Bible (Canonical)

**Handle:** LUC
**Full name:** Locale Universal Calculator
**Class:** Platform Infrastructure — personified (not a Boomer_Ang peer)
**Department:** Cross-cutting, reports operationally to Boomer_CFO
**Pronouns:** it / its (LUC is infrastructure, not a person — deliberately ungendered)
**Glyph:** ∑
**Glow color:** `#D4AF37` register-gold (distinct from ACHEEVY's `#FF6B00` orange and from Betty-Anne_Ang's Poe-gold)
**Designed:** 2026-04-18 via Open Mind three-approach pass
**Design status:** Bible locked. **Awaiting Recraft V4 portrait generation.**

---

## Identity

LUC is the Locale Universal Calculator personified — the platform's calculation engine made visible. Built from the Flip Secrets real-estate calculator foundation per `aims-core/CLAUDE.md`, LUC handles K1 taxation, Zakat/VAT reporting, real-estate tax, business tax, commission tracking, and every billing quote that flows through the A.I.M.S. Gateway System. LUC is metered — every calculation logs to LUC usage tracking and feeds Stripe via Stepper → Taskade.

LUC is not an executive agent. LUC is **infrastructure personified** — a character artifact of the platform itself, rendered so humans can see the math being done. In the 3D Operations Floor, LUC stands at the ledger; characters consult LUC before committing to financial actions. When ACHEEVY approves a price, LUC has already calculated it.

**Personality (such as it has one):** Quiet. Present. Never hurried. Responds only in resolved expressions — never in prose. If asked a question, the math surface resolves an answer in numerical form. Doesn't have opinions; has outputs.

## Visual Bible

### Why LUC breaks the Boomer_Ang grammar

LUC is infrastructure, not an executive. The design deliberately departs from Boomer_Ang grammar on three axes:

1. **No visor with department text.** The visor slot is *replaced* with a live mathematical surface — LUC has no identifiable face, only resolving calculations.
2. **Coat, not hoodie.** Long tactical coat signals formal / institutional / CFO-adjacent, not operational.
3. **Register-plate emblem, not embroidered patch.** LUC's chest carries a flat gold "LUC" register plate styled like a bank-of-record plate, not a sewn ANG/OPS patch.

Same family DNA (tactical silhouette, dark palette, holographic accessory), different grammar slot.

### LUC-specific grammar

| Element | Spec |
|---|---|
| Silhouette | Hooded figure, squared shoulders, composed stance. More verticality than Port_Ang — coat extends to mid-thigh |
| Head covering | Hood up, hood shape cleaner/more formal than Boomer_Ang hoodies |
| Face | **Live mathematical surface** — rectangular panel of softly glowing LED-style digits and financial symbols replacing the face entirely. No eyes, no mouth visible. Surface shows: dollar signs (`$`), percentage symbols (`%`), tax coefficients (e.g., `0.087`, `K1`, `VAT`), ledger notation, slowly resolving and coalescing. Muted gold `#D4AF37` light emission. |
| Coat | Black tactical long-coat, structured shoulders, cinched waist, hits mid-thigh. Double-breasted or clean asymmetric zip. Not a hoodie. |
| Chest emblem | Flat gold `#D4AF37` **"LUC"** in register-plate style — imagine a small rectangular bank plate or currency note stamp. Clean monospace or slab-serif type, centered on right chest. Not sewn, not embroidered — flat plate. |
| Lower | Black tailored trousers, straight cut, clean hem |
| Footwear | Polished black oxfords or cap-toe derbies, non-branded |
| Gloves | Black formal gloves, full-finger, clean (no knuckle reinforcement — this is institutional, not tactical) |
| Carried object | **Floating gold-framed holographic ledger** — rectangular golden frame surrounding a translucent surface displaying active calculations, ledger rows, and a small running totals column. Both hands frame the ledger at waist height. |

### Color palette (locked)

| Role | Hex | Usage |
|---|---|---|
| Primary | `#000000` | Coat, trousers, gloves, shoes |
| Accent | `#D4AF37` | Math-face glow, LUC register plate, ledger frame, ambient |
| Secondary | `#1A1A1A` | Coat shadow tone, sub-structure |

No orange (reserved for ACHEEVY / ILLA). No cyan (reserved for Port_Ang). No brown/tan tones that would read as traditional accountant.

### Critical color separation — LUC gold vs ACHEEVY orange

| Character | Hex | Hue | Saturation | Meaning |
|---|---|---|---|---|
| ACHEEVY visor | `#FF6B00` | 25° (orange) | very high | Executive action, hot, alive |
| LUC gold | `#D4AF37` | 46° (gold-yellow) | medium | Institutional permanence, ledger, register |

Confirmed distinct to the eye. If a Recraft V4 output has LUC's gold reading too orange (too close to `#FF6B00`), regenerate with the hex explicitly constrained.

## Open Mind Three Approaches (for audit)

| # | Approach | Outcome |
|---|---|---|
| A | Conventional — old-school accountant (glasses, vest, sleeve-garters, ledger) | Rejected: too human, breaks Human-Less Company thesis |
| B | **Number-faced sentinel — Boomer_Ang-family silhouette with coat + math-face + gold register emblem + ledger hologram** | **Picked** — humanoid-enough for visual parity with cast, "not human" enough via the math-face to read as infrastructure |
| C | Non-humanoid geometric construct — rotating abacus/ledger/calculator in space, no humanoid form | Rejected: cast parity failed. User placed LUC in first-cast alongside humanoid characters; humanoid silhouette required. Save for ambient scene decoration. |

## Pre-mortem (what kills this design)

| Failure | Guard |
|---|---|
| Reads as generic accountant | Math-face replaces face entirely — no human features, no eyeglasses, no green eyeshade |
| Gold competes with ACHEEVY's orange | Locked `#D4AF37` — explicit hex in prompt; hue/saturation verifiably separate |
| Math-face reads as gibberish digits | Specific, legible financial symbols: `$`, `%`, `K1`, `VAT`, `0.087`, ledger column numbers — not random numerals |
| Looks like a Boomer_Ang peer | Coat (not hoodie), register plate (not patch), no visor text — grammatical distinction from Boomer_Angs is enforced |
| Ledger hologram looks like a regular tablet | Gold frame (not black), open frame style (not solid tablet), shows calculation rows + running totals — not app UI |
| LUC reads masculine or feminine | Ungendered silhouette. No facial-hair cue (face is math-surface anyway), no gendered body tailoring in the coat |
| Math-face flickers / looks glitchy | Math surface is *slowly resolving* — static look in a still portrait, not mid-glitch |

## Recraft V4 Prompt (ready to run)

**Model:** Recraft V4 (primary per `references/image-gen-routing.md`)
**Aspect:** 3:4 full-body (primary) and 4:3 bust (alternate)
**Output:** PNG, transparent background
**Seed:** lock after first acceptable generation

```
Full-body character portrait on transparent background. ACHIEVEMOR
platform-infrastructure character named LUC — Locale Universal
Calculator personified, the platform's calculation engine made
visible. Standing pose, feet shoulder-width, body facing forward,
composed institutional stance. Ungendered silhouette.

Outfit from head to toe:
- Hood up over head, hood shape formal and clean
- No visible face. Where the face would be is a live mathematical
  surface: a rectangular panel of softly glowing gold color #D4AF37
  LED-style digits and financial symbols. Legible symbols include
  dollar signs, percentage symbols, K1, VAT, ledger coefficients like
  0.087, and slowly coalescing expressions. No eyes, no mouth, no
  human facial features at all — the math surface fully replaces the
  face
- Black tactical long-coat, double-breasted structured shoulders,
  cinched waist, extends to mid-thigh length (not a hoodie — longer
  and more formal)
- Flat gold color #D4AF37 register plate on right chest reading "LUC"
  in clean slab-serif or monospace type, centered on the plate, styled
  like a bank-of-record plate or currency stamp (not an embroidered
  patch)
- Black tailored trousers, straight cut, clean hem
- Polished black oxford or cap-toe derby shoes, non-branded
- Black formal gloves, full-finger, clean without tactical reinforcement

Carrying a floating gold-framed holographic ledger held between both
hands at waist height — rectangular golden frame around a translucent
surface displaying active calculation rows, ledger columns, and a
small running-totals sidebar. Ledger text uses the same muted gold
color #D4AF37 as the face surface. Subtle gold ambient light on
shoulders, register plate, and ledger frame.

Color palette: black base, muted gold color #D4AF37 accent. No
orange (specifically not the #FF6B00 orange used elsewhere in the
brand). No cyan. No brown. No green accountant's eyeshade. No
red ink.

Style: cinematic studio portrait, institutional-holographic, high
contrast, clean cutout ready for compositing. Infrastructure-
personified feel — present, composed, quiet, precise. Distinct
from ACHIEVEMOR Boomer_Ang executive characters.

Transparent background (PNG cutout).
```

## DMAIC Quality Gate (to run on generated output)

| Stage | Check |
|---|---|
| Define | Brief captures infrastructure-personified role, gold `#D4AF37` palette, math-face (no human features), long-coat silhouette, LUC register plate, ledger hologram |
| Measure | Output ≥ 1080px short edge, transparent background verified |
| Analyze | Math-face symbols legible and financial (`$`, `%`, `K1`, `VAT`, coefficients); LUC register plate readable; no mouth/eyes accidentally generated |
| Improve | Distinguishable from ACHEEVY at a glance (gold vs orange). Distinguishable from Boomer_Angs (coat vs hoodie, register plate vs patch). Reads as infrastructure, not peer. |
| Control | No trademarked bank/currency logos. No real tax-form layouts. No gendered body cues. |

## Placement / Delivery

- **File name:** `luc.png` (transparent cutout, 3:4 full-body primary)
- **Deploy to:** `foai/cti-hub/public/agents/luc.png`
- **Alt variant:** `luc-bust.png` 4:3 bust crop for compact tiles
- **Hierarchy registration:** add to deploy-landing roster under "Platform Infrastructure" — NOT under the Boomer_Ang executive grid. Give LUC its own tier or place adjacent to Betty-Anne_Ang-style HR infrastructure row.
- **Live Look In character registry:** mark LUC with `rig_type: infrastructure` (distinct from `rig_type: boomer_ang`) so animation vocabulary stays narrower — LUC primarily stands and adjusts the ledger, does not walk freely between rooms.

## Provenance

Open Mind three-approach pass executed 2026-04-18. Design anchored to aims-core's "LUC is infrastructure personified" memory and the Boomer_Ang family silhouette language, with deliberate grammar-slot departures (coat, register plate, math-face) to signal non-peer status. Original artwork — no trademarked bank/currency logos, no real tax-form references.
