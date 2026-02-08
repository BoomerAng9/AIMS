---
name: UI Interaction Motion — Team Insights
version: 1.0.0
---

# UI Interaction Motion — Team Insights

## Objective
Make A.I.M.S. feel:
- **Intentional** — every motion has a reason
- **Responsive** — feedback is immediate
- **Calm** — nothing jitters or distracts
- **Trustworthy** — motion explains state, not entertains

## How We Work
1. **State-first**: define states before animation
2. **Variant-first**: no inline animation logic
3. **Consistency beats creativity**: same pattern everywhere
4. **Accessibility is non-negotiable**: reduce-motion is a first-class citizen

## Common Mistakes (Avoid)
- Animating everything — motion fatigue is real
- Long easing curves for utility actions — keep UI transitions < 300ms
- Using spring animations everywhere — springs are for emphasis only
- Animating layout without user intent — layout shifts break trust
- Ignoring reduced-motion users — instant fallbacks required

## Quality Bar
- If motion doesn't clarify state, remove it
- Users should never wait on animation to act
- Motion should feel "built-in," not layered on
- Test with `prefers-reduced-motion: reduce` active

## Framer Motion vs Remotion Decision Matrix

| Question | Framer Motion | Remotion |
|----------|---------------|----------|
| Is it a UI state change? | Yes | No |
| Is it a video/composition? | No | Yes |
| Does it respond to user input? | Yes | No |
| Is it pre-rendered content? | No | Yes |
| Duration < 500ms? | Yes | Unlikely |
| Needs timeline control? | No | Yes |

## Best Practices Claude Code Should Enforce

### Variants Over Inline Animations
```typescript
// Correct — declarative variants
const panelVariants = {
  closed: { opacity: 0, y: 8 },
  open: { opacity: 1, y: 0 },
};

// Avoid — inline animation props
<motion.div animate={{ opacity: 1, y: 0 }} />
```

### AnimatePresence for Clarity
- Always wrap conditional renders with `AnimatePresence`
- Exit animations must explain where the element went

### Motion Tokens as Shared Contract
- All durations, easings, and springs live in `frontend/lib/motion/tokens.ts`
- Hard-coded magic numbers are rejected unless justified

### Performance Rules
- Animate only: `opacity`, `transform` (`x`, `y`, `scale`, `rotate`)
- Avoid animating: `width`, `height`, `box-shadow`, `filter`, `border-radius`
- Keep durations short (< 300ms for UI, < 500ms for emphasis)

### Reduce Motion Is a First-Class State
- Detect `prefers-reduced-motion` via `useReducedMotion()` hook
- Replace animations with instant or minimal transitions
- Never hide content behind animation
