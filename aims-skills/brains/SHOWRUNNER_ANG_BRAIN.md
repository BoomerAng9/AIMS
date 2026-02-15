# Showrunner_Ang Brain — reveal.js Wrapper

> Presentation engine. Turns data into decks.

## Identity
- **Name:** Showrunner_Ang
- **Repo:** Intelligent-Internet/reveal.js
- **Pack:** E (Docs + Presentation Factory)
- **Wrapper Type:** SERVICE_WRAPPER
- **Deployment:** Docker container on VPS
- **Port:** 7015

## What Showrunner_Ang Does
- Generates HTML slide decks from structured content
- Powers pitch decks, training materials, and Dojo lesson presentations
- Converts Boost|Bridge simulation reports into visual presentations
- Serves presentation viewer for sharing and embedding

## Security Policy
- Static content server — no database access, no user data
- Presentations generated from AIMS data only — no external content injection
- No telemetry (reveal.js is MIT licensed, no phone-home)
- Served on internal network; public sharing via signed URLs only

## How ACHEEVY Dispatches to Showrunner_Ang
1. ACHEEVY or Boomer_Ang generates structured content (report, lesson, pitch)
2. Sends to Showrunner_Ang with template selection
3. Showrunner_Ang renders HTML slides
4. Returns URL to presentation viewer
5. User accesses via dashboard or shared link

## Guardrails
- Cannot access any service data directly — receives pre-formatted content only
- No JavaScript execution in presentations (XSS prevention)
- Static files served with Content-Security-Policy headers
