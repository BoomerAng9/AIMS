---
name: analytics-tracking
description: |
  Analytics & Tracking skill for privacy-first event tracking.
  Use when: adding analytics providers, instrumenting user events,
  configuring traffic dashboards, or auditing privacy compliance.
role: Specialist Executor
intent: Track user behavior events using privacy-first analytics providers.
kpis:
  - event_tracking_coverage
  - page_load_impact_ms
  - privacy_compliance_rate
status: active
priority: low
triggers:
  - analytics setup requested
  - new page or feature requires event tracking
  - privacy audit on tracking providers
execution: sequential
dependencies:
  - posthog.tool.md
  - plausible.tool.md
---

# Analytics & Tracking

## Provider Selection

| Provider   | Purpose                     | When to Use                         |
|------------|-----------------------------|-------------------------------------|
| Plausible  | Traffic analytics, pageviews | Lightweight traffic dashboards      |
| PostHog    | Events, feature flags, funnels | Behavioral tracking, A/B tests    |

- Plausible is the default for simple traffic metrics (page views, referrers, geography).
- PostHog handles granular event tracking, feature flags, and funnel analysis.
- Never run both providers for the same metric — pick one source of truth per metric.

## Privacy Rules

1. **No PII** — Never track personally identifiable information (name, email, IP) in event payloads.
2. **No Cookies** — Use cookieless tracking modes. Plausible is cookieless by default; PostHog must be configured with `persistence: 'memory'`.
3. **GDPR Compliant** — All tracking must comply with GDPR. No data leaves the EU region unless explicitly configured.
4. **DNT Respected** — Honor `Do Not Track` browser headers. If `navigator.doNotTrack === '1'`, disable all tracking.
5. **Consent not required** — Because we use no cookies and no PII, explicit consent banners are not required. However, a privacy policy must document what is collected.

## Key Events Table

| Event Name            | Provider | Trigger                              | Properties                     |
|-----------------------|----------|--------------------------------------|--------------------------------|
| `page_view`           | Plausible | Every route navigation              | `path`, `referrer`             |
| `sign_up`             | PostHog  | User completes registration          | `provider` (google/github/discord) |
| `first_plug_run`      | PostHog  | User runs their first plug instance  | `plug_id`, `plug_category`     |
| `subscription_started`| PostHog  | User subscribes to a paid plan       | `plan_id`, `billing_cycle`     |
| `vertical_completed`  | PostHog  | User completes an ACHEEVY vertical   | `vertical_id`, `duration_ms`   |

## Implementation Notes

- All event calls go through a unified `trackEvent(name, properties)` wrapper in `frontend/lib/analytics.ts`.
- The wrapper checks DNT, selects the correct provider, and normalizes property keys.
- Server-side events (backend) use PostHog's Node SDK via the UEF Gateway — never call PostHog directly from client-side for sensitive events.
- Page load impact must stay under 50ms (measured via Lighthouse CI).
