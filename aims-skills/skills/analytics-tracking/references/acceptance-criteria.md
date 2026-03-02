# Acceptance Criteria — analytics-tracking

## Functional Requirements

### FR-1: Provider Initialization
- [ ] Plausible script loads asynchronously on all public pages
- [ ] PostHog initializes with `persistence: 'memory'` (cookieless mode)
- [ ] Provider initialization fails gracefully — no user-facing errors if a provider is unavailable

### FR-2: Event Tracking
- [ ] `trackEvent(name, properties)` wrapper exists in `frontend/lib/analytics.ts`
- [ ] All 5 key events are instrumented: `page_view`, `sign_up`, `first_plug_run`, `subscription_started`, `vertical_completed`
- [ ] Events route to the correct provider (Plausible for page_view, PostHog for behavioral events)
- [ ] Property keys are normalized to snake_case before sending

### FR-3: Privacy Compliance
- [ ] No PII is included in any event payload (verified by code review and runtime audit)
- [ ] `Do Not Track` header is honored — tracking disabled when `navigator.doNotTrack === '1'`
- [ ] No cookies are set by any tracking provider
- [ ] Privacy policy documents what data is collected

### FR-4: Server-Side Events
- [ ] Sensitive events (subscription, billing) are tracked server-side via PostHog Node SDK
- [ ] Server-side events go through UEF Gateway, not directly from client

## Non-Functional Requirements

### NFR-1: Performance
- [ ] Analytics scripts add less than 50ms to page load (measured via Lighthouse CI)
- [ ] Event dispatch is non-blocking — analytics failures never delay user interactions

### NFR-2: Reliability
- [ ] Tracking wrapper handles provider outages without throwing
- [ ] Failed events are logged locally (console.warn in dev, silent in prod)

### NFR-3: Testability
- [ ] Analytics wrapper can be stubbed in tests (no real network calls during unit tests)
- [ ] Integration test exists that verifies event shape and provider routing

### NFR-4: Compliance
- [ ] GDPR compliance verified — no personal data leaves the tracking pipeline
- [ ] DNT compliance verified with automated test
