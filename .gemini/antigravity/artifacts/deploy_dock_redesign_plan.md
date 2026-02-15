# Deploy Dock & UI Consolidation — Implementation Plan

## Phase 1: Wiring Audit & Fix (IMMEDIATE)

### Issues Found

| Component | Issue | Fix |
|:---|:---|:---|
| Sign-In Buttons | ✅ FIXED — Google/Discord now call `signIn()` | Done |
| `FloatingACHEEVY` header | Says "ACHEEVY" not "Chat w/ACHEEVY" | Update bezel text |
| `FloatingACHEEVY` streaming | Custom SSE parser, fragile vs Vercel AI SDK | Align to same approach |
| Back button (DashboardShell) | `router.back()` — works but no guard | Add pathname check |
| Home button | Links to `/` — correct | OK |
| Chat `ChatInterface.tsx` | Duplicate import `ChangeOrder` on line 24-25 | Remove duplicate |
| Model Selector | Renders but no bezel label ("Chat w/ACHEEVY") | Add header bar |
| Voice Selector | Not visible on chat bezel | Integrate persona into bezel |
| Persona Selector | Only shows on empty messages state | Make persistent |
| "My account" button (header) | Non-functional — no dropdown/signout | Wire to session |

### Role-Based Access (DashboardNav.tsx)

✅ Already Correct:
- `userNavItems` = what regular users see
- `adminNavItems` = Circuit Box section, only visible when `role === 'OWNER'`
- Boomer_Angs, Operations, Gates, Environments, Security = admin-only

No changes needed — the separation is already in place.

---

## Phase 2: Sign-In Redesign (Tron Ares Aesthetic)

### Design Language (from reference images)
- **Dark obsidian base** (#050508)
- **Amber/orange neon accents** (not gold — deeper orange like Tron Ares)
- **Cyan secondary glow** for data/information elements
- **Master Control room feeling**: ACHEEVY as the orchestrator figure
- **Particle effects** on authentication actions

### Components
1. Background: Animated circuit-line grid (CSS/canvas)
2. ACHEEVY character: Silhouette with amber glow lines
3. Auth card: Glass panel with orange neon border
4. Particle animation on button click

---

## Phase 3: Remotion Integration

### Scenes
1. **Deploy Dock Cutscene**: Particle laser creating Boomer_Angs
2. **ACHEEVY Delegation**: Master Control → Boomer_Ang assignment
3. **PMO Office**: Each Boomer_Ang in their industry-specific office

### Technical Approach
- Use existing `apps/media-forge` Remotion setup
- Create new compositions referencing ACHEEVY assets
- Embed via `@remotion/player` in Deploy Dock page

---

## Phase 4: Deploy Dock Polish
- Wire to real `/api/deploy-dock` backend
- ElevenLabs Agents SDK for voice during deployment
- Particle laser animation during Boomer_Ang creation
