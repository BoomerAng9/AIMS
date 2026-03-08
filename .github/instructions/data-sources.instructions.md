---
name: "Data source and notebook rules"
description: "Rules for Context Packs, Working Notebooks, and persistence"
applyTo: "**/*source*.*,**/*context*.*,**/*notebook*.*,**/*rag*.*,**/*retriev*.*"
---

# Data-source rules

- The Data Source Registry is the source of truth.
- Notebook providers are adapters.
- Context Packs are reusable assets.
- A Working Notebook is composed per session.
- Persist the Session Snapshot outside the sandbox.
- Never make the notebook provider the only source of durable state.