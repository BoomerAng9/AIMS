# A.I.M.S. Architecture Lanes

This directory defines the approved product architecture for A.I.M.S. and ACHEEVY.

## Purpose

The system is split into four lanes so the website, knowledge systems, orchestrator, and durable state are not merged into one conceptual surface.

## Lanes

### Experience Lane

Owns the customer-facing product surface.

- chat UI
- Bottom Composer Bezel
- Data Source Catalog UI
- Context Pack selection UI
- prototype viewer
- session dashboard
- auth, billing, and account surfaces
- bridge client SDK

### Knowledge Lane

Owns terminology, intent resolution, prompt reconstruction, and grounded knowledge composition.

- Technical Knowledge Index
- Lay-to-Technical Lexicon
- Build Intent Resolver
- Prompt Reconstruction Layer
- Context Pack definitions
- Working Notebook composition rules

### Execution Lane

Owns orchestrated action and sandbox lifecycle.

- Sandbox Control Plane
- orchestrator services
- agent workflows
- prototype generation
- sandbox provision, renew, monitor, and destroy
- artifact generation
- checkpoint writing

### Persistence Lane

Owns durable state outside disposable execution environments.

- Session Memory Store
- Session Snapshot records
- artifact storage
- conversation history
- retrieval records
- checkpoint storage
- logs and manifests

## Core Boundary Rules

- The website requests actions; the orchestrator decides and executes them.
- The bridge is a thin, versioned contract with no business logic.
- The sandbox is disposable.
- The session is durable.
- The Data Source Registry is the system of record for sources, artifacts, permissions, versions, and adapters.
- Notebook providers are adapters, not the source of truth.

## Session Model

Every user session must be recoverable without assuming the sandbox still exists.

Required durable records:

1. Session Record
2. Working Notebook Record
3. Execution Manifest
4. Artifact Store entry set
5. Conversation and Memory Store history
6. Checkpoint Store entry

## Implementation Rule

Before building deeper features, identify which lane is being changed and keep the blast radius inside that lane unless an explicit cross-lane change is required.
