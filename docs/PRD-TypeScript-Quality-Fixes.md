# PRD: TypeScript Quality & Build Stability Fixes

**Document Version:** 1.0
**Created:** 2026-02-06
**Priority:** High
**Status:** In Progress

---

## Executive Summary

This PRD addresses multiple TypeScript compilation errors, type inconsistencies, and code quality issues preventing reliable builds across environments. The primary goal is to ensure the AIMS platform builds consistently on all developer machines and in CI/CD pipelines.

---

## Problem Statement

The AIMS frontend has accumulated technical debt in the form of:
1. **Type inconsistencies** - Custom components with incomplete type definitions
2. **Invalid CSS properties** - Non-standard CSS properties causing TypeScript errors
3. **Missing component props** - Props used but not defined in interfaces
4. **Naming inconsistencies** - "AI Managed Systems" vs "AI Managed Solutions" branding
5. **Configuration issues** - References to old domains (plugmein.com)
6. **Cross-environment build failures** - Build passes on some machines but fails on others

---

## Goals

1. **Zero build errors** - `npm run build` passes on all environments
2. **Type safety** - All components have proper TypeScript definitions
3. **Consistent branding** - Correct "AI Managed Solutions" naming throughout
4. **Updated configuration** - Correct domain references
5. **Maintainable codebase** - Standardized patterns for custom components

---

## Detailed Issues & Solutions

### 1. Custom Icon Components Missing `style` Prop

**Problem:** Many custom SVG icon components only accept `className` but are sometimes used with `style` prop.

**Affected Files:**
- `components/navigation/AIMSNav.tsx` (5 icons)
- `components/dashboard/TechStack.tsx` (4 icons)
- `components/dashboard/CircuitBox.tsx` (4 icons)
- `components/your-space/SpaceStation.tsx` (6 icons)
- `components/chat/ChatInterface.tsx` (MicIcon)
- `components/global/FloatingACHEEVY.tsx` (SparkleIcon)

**Solution:** Create a standardized icon type and update all custom icons:

```typescript
// lib/types/icons.ts
export interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}
```

**Priority:** High
**Effort:** Medium (2-3 hours)

---

### 2. Invalid CSS Property `ringColor`

**Problem:** `ringColor` is not a valid CSS property - it's a Tailwind CSS utility.

**Files to Check:**
- `app/dashboard/model-garden/page.tsx`
- Any components using inline `style` with `ringColor`

**Solution:** Replace with valid CSS:
```typescript
// Before
style={{ ringColor: 'blue' }}

// After
className="ring-blue-500"
// OR use boxShadow for similar effect
style={{ boxShadow: '0 0 0 2px blue' }}
```

**Priority:** High
**Effort:** Low (30 mins)

---

### 3. OperationsOverlay Props Alignment

**Problem:** `OperationsOverlayProps` interface may be missing `onMinimize` in some environments.

**File:** `components/orchestration/OperationsOverlay.tsx`

**Current State (Verified):**
```typescript
interface OperationsOverlayProps {
  state: OrchestrationState;
  onClose: () => void;
  onExpand?: () => void;
  onMinimize?: () => void;  // Already present
}
```

**Action:** Verify sync between local and remote - may be a git sync issue.

**Priority:** Medium
**Effort:** Low (verification only)

---

### 4. OperationsPulse Props Mismatch

**Problem:** Component expects `phase` but may be called with `isActive` in some places.

**File:** `components/orchestration/OperationsOverlay.tsx`

**Current Interface:**
```typescript
export function OperationsPulse({ phase, onClick }: {
  phase: OrchestrationPhase;
  onClick: () => void;
})
```

**Action:** Search and fix any calls using incorrect prop names.

**Priority:** Medium
**Effort:** Low (30 mins)

---

### 5. Branding Consistency - "AI Managed Solutions"

**Problem:** Potential references to "AI Managed Systems" (incorrect) instead of "AI Managed Solutions" (correct).

**Action:**
1. Global search for "AI Managed System" (without 's')
2. Search for any "Managed Systems" references
3. Update all to "AI Managed Solutions"

**Priority:** Medium
**Effort:** Low (30 mins)

---

### 6. Domain Configuration Updates

**Problem:** References to `plugmein.com` that may need updating.

**Files with `plugmein` references:**
- `vercel.json`
- `middleware.ts`
- `components/ui/Brand.tsx`
- `components/your-space/SpaceStation.tsx`
- `lib/shopping/luc-integration.ts`
- `lib/security/config.ts`

**Action:** Determine correct domain and update configuration. Current references use `aims.plugmein.cloud` which may be intentional.

**Priority:** Low (needs clarification)
**Effort:** Medium (1 hour)

---

### 7. Chat Interface Connection Issues

**Problem:** Chat page shows "ERR_CONNECTION_REFUSED" on localhost:3000.

**Potential Causes:**
1. Dev server not running
2. Port conflict
3. API endpoints not configured
4. Environment variables missing

**Diagnostic Steps:**
1. Check if `npm run dev` is running
2. Verify port 3000 is available
3. Check `.env.local` for required variables
4. Verify API routes are properly configured

**Priority:** High
**Effort:** Variable (debugging)

---

## Implementation Plan

### Phase 1: Critical Build Fixes (Day 1)
1. Fix `ringColor` CSS properties
2. Update all custom icons with `style` prop support
3. Verify OperationsOverlay/OperationsPulse props

### Phase 2: Consistency Fixes (Day 2)
1. Branding audit - "AI Managed Solutions"
2. Domain configuration review
3. Type definition standardization

### Phase 3: Runtime Fixes (Day 2-3)
1. Chat interface debugging
2. API connectivity verification
3. Environment variable documentation

---

## Success Criteria

1. `npm run build` passes with zero errors on:
   - Linux development machines
   - Windows development machines
   - CI/CD pipeline

2. `npm run dev` starts successfully and:
   - Landing page loads at `/`
   - Chat interface loads at `/dashboard/chat`
   - All dashboard pages accessible

3. Type safety:
   - No TypeScript errors in IDE
   - No type-related runtime errors

---

## Dependencies

- Node.js 18+
- npm 9+
- TypeScript 5+
- Next.js 14

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking changes to component APIs | Add backward-compatible optional props |
| Cross-platform path issues | Use consistent path separators |
| Environment-specific issues | Document all required env variables |

---

## Appendix: Files Modified in Recent Fixes

Recent shopping module type fixes (committed):
- `lib/shopping/types.ts` - Added missing properties
- `lib/shopping/shopping-agent.ts` - Fixed type casts and iterations
- `lib/shopping/seller-types.ts` - Extended interfaces
- `lib/shopping/luc-integration.ts` - Fixed property names
- (11 more shopping module files)

---

*Document maintained by: Claude AI Assistant*
*Last updated: 2026-02-06*
