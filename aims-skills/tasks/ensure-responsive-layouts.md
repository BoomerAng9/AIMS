---
id: "ensure-responsive-layouts"
name: "Ensure Responsive Layouts"
type: "task"
status: "active"
triggers: ["responsive", "breakpoints", "mobile layout", "tablet layout"]
description: "Apply and verify breakpoints and layout rules for mobile, tablet, and desktop across all ACHEEVY UI surfaces."
execution:
  target: "internal"
priority: "high"
---

# Ensure Responsive Layouts Task

## Objective
Every ACHEEVY UI surface must render correctly across all breakpoints with no clipping, overflow, or broken layouts.

## Breakpoints

| Name | Range | Layout Strategy |
|------|-------|-----------------|
| **Mobile** | < 768px | Full-height stacked, bottom-anchored input |
| **Tablet** | 768px - 1024px | Two-column (70/30 split, collapsible panel) |
| **Desktop** | > 1024px | Three-region (sidebar + center + right panel) |

## Surfaces to Verify

### 1. Conversation Shell (Chat)
- [ ] Mobile: full-height stack, mic-centric input bar, bottom sheets for selectors
- [ ] Tablet: chat 70% + control panel 30%, collapsible
- [ ] Desktop: left sidebar + center chat + right session panel

### 2. LiveSim Page
- [ ] Mobile: stacked timeline + ask button
- [ ] Tablet: timeline 70% + explainer 30%
- [ ] Desktop: side-by-side transcript + explanation panel

### 3. Chicken Hawk View
- [ ] Mobile: stacked build status + log stream
- [ ] Tablet: two-column with task progress
- [ ] Desktop: full developer layout with code/terminal aesthetics

### 4. Circuit Box
- [ ] Mobile: list view of services
- [ ] Tablet: category-grouped cards
- [ ] Desktop: full grid map with zoom/pan (owner only)

### 5. Dashboard
- [ ] Mobile: stacked metric cards
- [ ] Tablet: 2-column grid
- [ ] Desktop: full dashboard with sidebar navigation

## Quality Checks (All Surfaces)
- [ ] No primary content clipped off-screen on first paint
- [ ] No unbounded horizontal scroll
- [ ] All interactive elements are touch-friendly on mobile (min 44px tap target)
- [ ] Bottom sheets don't obscure critical content
- [ ] Scrollable containers have bounded height
- [ ] Safe-area handling for notch devices (iOS)
- [ ] Text remains readable at all breakpoints (no truncation of critical info)

## Testing Protocol
1. Test each surface at: 375px (iPhone SE), 768px (iPad), 1440px (Desktop)
2. Use browser DevTools responsive mode
3. Verify no layout shifts during orientation change (mobile/tablet)
4. Check that all modals/sheets close properly at each breakpoint
