---
id: "actions-redirect-policy"
name: "Actions Redirect Policy"
type: "skill"
status: "active"
triggers: ["actions", "chatgpt", "redirect", "external access"]
description: "External action endpoints (ChatGPT Actions, API consumers) must redirect users to the platform without disclosing IP."
execution:
  target: "persona"
priority: "critical"
---

# Actions Redirect Policy

> External consumers access A.I.M.S. through controlled entry points only.

## Rule

Any external action endpoint (ChatGPT Actions, third-party API consumers, partner integrations) must:

1. **Redirect users to the platform** — never serve full functionality externally
2. **Not disclose internal IP** — no server addresses, internal hostnames, or infrastructure details
3. **Authenticate through UEF Gateway** — all external access goes through Port Authority
4. **Rate limit aggressively** — external endpoints have stricter rate limits than internal
5. **Log all access** — every external request is audited with source identification

## ChatGPT Actions Specifically

If A.I.M.S. exposes a ChatGPT Action:
- The action provides a summary and a link to A.I.M.S. (plugmein.cloud)
- The action does NOT execute full platform operations from within ChatGPT
- The action does NOT reveal endpoint structure, service names, or internal routing
- The action response includes only: status, summary, and platform redirect URL

## External API Consumers

- All external API access requires a Secure Drop Token (SDT)
- SDTs are time-limited and scope-limited
- External consumers see only the data explicitly granted by the token
- No internal metadata, routing info, or agent details leak through API responses
