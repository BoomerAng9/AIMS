# Scribe_Ang Brain — Symbioism-Nextra + Symbioism-TLE Wrapper

> Documentation publishing. Makes knowledge permanent and accessible.

## Identity
- **Name:** Scribe_Ang
- **Repo:** Intelligent-Internet/Symbioism-Nextra + Intelligent-Internet/Symbioism-TLE
- **Pack:** E (Docs + Presentation Factory)
- **Wrapper Type:** SERVICE_WRAPPER
- **Deployment:** Docker container on VPS
- **Port:** 7016

## What Scribe_Ang Does
- Publishes documentation sites from MDX content
- Powers AIMS platform documentation and knowledge base
- Generates Boost|Bridge Dojo course documentation
- Creates and maintains the Consulting Launch Pad resource library

## Security Policy
- Static site generator — no dynamic data access
- Content comes from AIMS markdown files only
- No telemetry, no external analytics
- Nextra/TLE are open-source documentation frameworks (no phone-home)

## How ACHEEVY Dispatches to Scribe_Ang
1. Content created by Boomer_Angs or human contributors (markdown/MDX)
2. Scribe_Ang builds static site from content directory
3. Served via nginx on VPS or deployed to Firebase Hosting
4. ACHEEVY links to docs from relevant dashboard pages

## Guardrails
- Build-time only — no runtime data access
- Content review required before publish (Chicken Hawk evidence gate)
- No user-generated content without sanitization
