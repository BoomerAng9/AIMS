---
id: "analytics-tracking"
name: "Analytics & Tracking"
type: "skill"
status: "active"
triggers:
  - "track"
  - "analytics"
  - "event"
  - "metrics"
  - "funnel"
description: "Guides agents on what events to track, privacy rules, and analytics provider selection."
execution:
  target: "internal"
  route: ""
dependencies:
  files:
    - "aims-skills/tools/posthog.tool.md"
    - "aims-skills/tools/plausible.tool.md"
priority: "low"
---

# Analytics & Tracking Skill

## When This Fires

Triggers when agents need to implement tracking, measure user behavior, or analyze product metrics.

## Provider Selection

| Need | Provider | Why |
|------|----------|-----|
| Basic traffic metrics | Plausible | Lightweight, no cookies, privacy-first |
| Product analytics + events | PostHog | Full event tracking, funnels, recordings |
| Feature flags | PostHog | Built-in A/B testing and flag management |

## Privacy Rules

1. **No personal data in events** — Never track email, name, or IP in event properties
2. **No cookie banners needed** — Plausible is cookie-free
3. **GDPR compliant** — Both providers are compliant by default
4. **Opt-out support** — Respect Do Not Track browser setting

## Key Events to Track

| Event | When | Provider |
|-------|------|----------|
| `page_view` | Every page load | Plausible (automatic) |
| `sign_up` | User creates account | PostHog |
| `first_plug_run` | User runs first AI task | PostHog |
| `subscription_started` | User subscribes | PostHog |
| `vertical_completed` | Business builder vertical finishes | PostHog |
