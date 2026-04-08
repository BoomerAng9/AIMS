---
id: "brand-strings-enforcer"
name: "Brand Strings Enforcer"
type: "hook"
status: "active"
triggers: ["merge", "pr", "commit", "build"]
description: "Blocks merges if any forbidden brand name variants appear. Enforces exact brand actor naming."
execution:
  target: "internal"
priority: "critical"
---

# Brand Strings Enforcer Hook

> Brand actor names are constants. No variations. No creative spelling.

## Canonical Names

These are the ONLY acceptable spellings:

| Brand Actor | Exact String | Notes |
|-------------|-------------|-------|
| **A.I.M.S.** | `A.I.M.S.` | With periods. Not "AIMS" in user-facing text. Code variables may use `AIMS` or `aims`. |
| **ACHEEVY** | `ACHEEVY` | All caps, no spaces, no hyphens |
| **Chicken Hawk** | `Chicken Hawk` | Two words, space-separated, title case |
| **Boomer_Ang** | `Boomer_Ang` | Underscore, mixed case. Plural: `Boomer_Angs` |
| **Lil_*_Hawk** | `Lil_{Role}_Hawk` | Underscore-delimited. Examples: `Lil_Messenger_Hawk`, `Lil_Builder_Hawk` |
| **Circuit Box** | `Circuit Box` | Two words, title case |

## Forbidden Variants (Will Block Merge)

| Canonical | Forbidden Variants |
|-----------|-------------------|
| Chicken Hawk | `Chicken_Hawk`, `ChickenHawk`, `chicken hawk`, `chicken_hawk`, `CHICKEN HAWK`, `Chickenhawk` |
| ACHEEVY | `Acheevy`, `acheevy`, `A-C-H-E-E-V-Y`, `Achevy`, `ACHEVY`, `Achievy` |
| A.I.M.S. | `A-I-M-S`, `a.i.m.s`, `Aims` (in user-facing strings) |
| Boomer_Ang | `BoomerAng`, `Boomer Ang`, `boomer_ang`, `BOOMER_ANG` (in user-facing strings) |
| Lil_*_Hawk | `LilHawk`, `Lil Hawk`, `lil_hawk` (missing role segment) |
| Circuit Box | `CircuitBox`, `circuit_box`, `circuit box`, `CIRCUIT BOX` |

## Scan Scope

The enforcer scans:
- All `.tsx`, `.ts`, `.jsx`, `.js` files in `frontend/` and `backend/`
- All `.md` files in `aims-skills/`
- All user-facing string literals and JSX text content
- Component display names and aria labels

## Exceptions

- Code variable names (e.g., `const circuitBox = ...`) are allowed in camelCase
- Import paths and file names follow kebab-case convention (`circuit-box.tsx`)
- Internal comments may use shorthand — only user-facing strings are enforced
- The `pmo-naming.skill.ts` skill defines the full naming rules for agent handles

## Enforcement

- Runs as a pre-merge check
- Outputs a scan report listing any violations with file:line references
- PR cannot merge until all violations are resolved
