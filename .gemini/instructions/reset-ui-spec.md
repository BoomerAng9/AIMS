# SYSTEM RESET — FRONTEND DESIGN AUTHORITY

This spec **supersedes ALL previous UI / design instructions** for A.I.M.S., including:
- Any "Apple glassmorphic", "Hybrid Business Architect" auth card samples
- Any Book Of Vibe, lore-based, or sci-fi metaphors
- Any dark theme (#0A0A0A, obsidian, ink) base designs
- Any earlier Locale / Brick-and-Window visual specs

The ONLY valid design spec is below.

---

## 1. Layout & Responsiveness

- **Mobile-first**: every page must be designed for 375–430px wide screens first, then scale up with clean breakpoints (sm, md, lg).
- Text must **NEVER** overflow or get cut off. Use `flex-wrap`, `max-width`, and proper `line-height`.
- All body text: ≥14px mobile, ≥16px desktop.
- Margins and padding: 16 / 24 / 32 px scale. Nothing smaller than 12px for padding.
- Every screen must be fully responsive for:
  - Phone (≤ 640px)
  - Tablet (641–1024px)
  - Desktop (≥ 1025px)

## 2. Visual Style

- **Background**: Light, calm base (#F8FAFC). Clean white surfaces (#FFFFFF).
- **Foreground**: Clean cards with readable contrast. 1px borders (slate-200), subtle shadows.
- **Typography**: Use the repo font stack (Doto for headings, system sans for body). Prioritize legibility.
- **Colors**:
  - Background: #F8FAFC (slate-50)
  - Surface: #FFFFFF
  - Text primary: #0F172A (slate-900)
  - Text secondary: #475569 (slate-600)
  - Text muted: #94A3B8 (slate-400)
  - Accent: #D97706 (amber-600) — the modernized gold
  - Borders: #E2E8F0 (slate-200)
  - Success: #16A34A, Warning: #D97706, Error: #DC2626

## 3. Component Rules

- **Buttons**: minimum 40–44px height, large tap targets on mobile
  - Primary: `bg-amber-600 text-white hover:bg-amber-700`
  - Secondary: `bg-white border-slate-200 text-slate-700 hover:bg-slate-50`
  - Ghost: `text-slate-500 hover:text-slate-700 hover:bg-slate-50`
- **Inputs**: full width on mobile, clear labels, 14px+ font
  - `bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500`
- **Cards**: `bg-white border border-slate-200 rounded-2xl shadow-sm`
  - Max-width 420px for auth, 960–1200px grids for main pages
  - Consistent padding: 16–24px
- **Navigation**:
  - Active: `text-amber-700 border-amber-600 bg-amber-50`
  - Default: `text-slate-500 hover:bg-slate-50`
  - Borders: `border-slate-200`

## 4. Routing & Code Quality

- DO NOT invent routes. Use only routes that actually exist in the Next.js app.
- If a route, layout, or component is missing, you MUST say so and propose the exact file(s) to create.
- If TypeScript or routing errors exist, you MUST show the error and propose a concrete fix.

## 5. BAN LIST — DO NOT USE

- "Book Of Vibe" themed visuals in product UI
- "Subframe", "The Void", "MetaAuth Gateway" or similar sci-fi labels
- Dark backgrounds (#0A0A0A, bg-black, bg-obsidian) for page backgrounds
- White text on dark backgrounds (text-white on bg-black)
- Old Apple-style glassmorphism
- Any hybrid lore language unless explicitly requested for marketing copy

**Brand primitives that ARE allowed**: ACHEEVY, AVVA NOON, Chicken Hawk, Boomer_Angs, Lil_Hawks, Betty Ann Ang.
