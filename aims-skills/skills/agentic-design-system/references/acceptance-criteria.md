# Agentic Design System — Acceptance Criteria

## Functional Requirements

| ID | Requirement | Verification |
|----|-------------|--------------|
| F-1 | All agentic-ui components render with A.I.M.S. dark theme (no white/light backgrounds) | Visual inspection |
| F-2 | ChatInput supports tool selection mapped to ACHEEVY skill registry | Send message with tool selected |
| F-3 | ChatInput supports file upload via drag-and-drop and button | Upload file, verify attachment badge |
| F-4 | ChatMessage renders user/assistant/system roles with correct styling | Send messages in all roles |
| F-5 | StreamingText displays real-time token output from ACHEEVY responses | Test with streaming endpoint |
| F-6 | AgentCard shows ACHEEVY status (online/thinking/busy) accurately | Verify status transitions |
| F-7 | UsageMetrics displays token count, cost, and response time | Verify against actual API metrics |
| F-8 | Badge variants (default/secondary/destructive/outline) render with gold/obsidian theme | Visual inspection |
| F-9 | Button variants (default/destructive/outline/secondary/ghost/link) render themed | Visual inspection |
| F-10 | Deep Research toggle activates extended context mode | Toggle and verify mode change |

## Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NF-1 | Chat input interaction latency | < 50ms |
| NF-2 | Theme CSS override load time | < 5ms (single CSS file) |
| NF-3 | Component bundle size impact | < 50KB gzipped |
| NF-4 | WCAG 2.1 AA compliance | All components |
| NF-5 | prefers-reduced-motion support | All animated components |
| NF-6 | Mobile responsiveness | 320px+ viewport |

## Failure Modes

| Failure | Impact | Recovery |
|---------|--------|----------|
| Theme CSS not imported | White/light components on dark background | Import `@/lib/agentic-theme.css` |
| `.aims-agentic` wrapper missing | Components unstyled | Wrap parent in `aims-agentic` class |
| agentic-ui version mismatch | Component API changes | Pin version in package.json |
| Tool selection not connected | Users can't select skills | Wire SKILL_REGISTRY to tools prop |
