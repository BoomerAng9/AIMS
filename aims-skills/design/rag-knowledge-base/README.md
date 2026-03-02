# Product Design Best Practices (RAG Knowledge Base)

**Source:** Agentic UI Design System by Alex Gilev (30kstrategy.com)
**License:** Non-resale, personal/team use only
**Total:** 548 best practices (UX-001 through UX-548)
**Categories:** 27

## Category Index

| # | Category | Count | Key Topics |
|---|----------|-------|------------|
| 1 | Cognitive Load | 30 | Working memory limits, extraneous load, germane load, progressive disclosure |
| 2 | Accessibility | 13 | WCAG 2.1, semantic HTML, ARIA roles, color contrast, keyboard navigation |
| 3 | Behavioral Psychology | 30 | Loss aversion, anchoring, social proof, defaults, commitment consistency |
| 4 | Cognitive Psychology | 23 | Mental models, change blindness, selective attention, chunking |
| 5 | Component Patterns | 16 | Cards, lists, tables, modals, drawers, tabs, accordions |
| 6 | Dashboard Design | 19 | KPI cards, data density, information hierarchy, real-time updates |
| 7 | Data Display & Tables | 20 | Sorting, filtering, pagination, responsive tables, data visualization |
| 8 | Design Process & Methodology | 31 | Design thinking, lean UX, agile integration, research methods |
| 9 | Design Systems & Tokens | 9 | Token architecture, component APIs, documentation, versioning |
| 10 | Desktop-Specific Patterns | 26 | Multi-panel layouts, keyboard shortcuts, power user features |
| 11 | Forms | — | Validation, error states, multi-step forms, smart defaults |
| 12 | Interaction Patterns | — | Hover states, drag-and-drop, gestures, transitions |
| 13 | Navigation | — | Information architecture, breadcrumbs, search, wayfinding |
| 14 | Gamification | — | Progress tracking, achievements, streaks, feedback loops |
| 15 | Reading Psychology | — | Typography, scanning patterns, content hierarchy |
| 16 | Human-Centered Design | — | Empathy mapping, user journeys, inclusive design |
| 17 | Gestalt Principles | — | Proximity, similarity, continuity, closure, figure-ground |

## Best Practice Format

Each entry follows a consistent structure:

```
ID: UX-{number}
Category: {category}
Tags: {tag1} {tag2}
Subcategory: {subcategory}
Practicality Score: {1-5}

### When to use
{Context trigger for when to apply this practice}

### What & Why
{Theory, cognitive science rationale, research backing}

### How to Implement
{Specific technical implementation steps}

### How to Present It
{How to communicate the practice to executives, designers, and engineers}

Sources & References: {cited sources}
```

## Usage in A.I.M.S.

These best practices are referenced by:
- **Stitch Design Skill** — Auto-applies relevant practices during UI generation
- **aims-global-ui** — Global design decisions grounded in research
- **aims-chat-ui** — Chat interface patterns backed by cognitive load research
- **aims-command-center-ui** — Dashboard layouts informed by data display best practices
- **Design review agents** — Automated design review uses these as evaluation criteria

## Key Practices for A.I.M.S.

### Most Relevant to ACHEEVY Chat Interface
- **UX-472** — Micro-Interaction Feedback: All interactive elements must produce visible state change within 100ms
- **UX-454** — Change Blindness Prevention: Use animation to signal state changes in SPAs
- **UX-464** — Visual Hierarchy as Cognitive Load Management: 3-4 levels of visual importance

### Implementation Rules (from RAG)
1. All interactive elements: visible state change within **100ms**
2. Operations >1s: loading indicator; >10s: progress bar with time estimate
3. Success states must be specific ("Project saved to Drafts" not "Success")
4. Error states must be actionable ("Email already registered — log in or reset")
5. Use **optimistic UI updates** for high-confidence actions
6. Design **undo affordances** for destructive actions
7. Apply **3-4 distinct levels** of visual importance (H1, H2, H3, body)
8. Single most important action should have highest visual weight
9. Use whitespace as cognitive separator
10. Apply Gestalt proximity: related elements closer than unrelated
11. Test hierarchy by **blurring** — primary CTA should still be visible
12. Color changes for state MUST include icon or text label (never color alone)
13. For AJAX content, use brief loading indicator then animate new content in
14. Avoid multiple simultaneous competing animations
