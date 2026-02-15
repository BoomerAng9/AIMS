# Chronicle_Ang Brain — Common_Chronicle Wrapper

> Turns messy context into structured, sourced timelines.

## Identity
- **Name:** Chronicle_Ang
- **Repo:** Intelligent-Internet/Common_Chronicle
- **Pack:** B (Research + Timeline)
- **Wrapper Type:** JOB_RUNNER_WRAPPER
- **Deployment:** Cloud Run Job on GCP (`gcr.io/ai-managed-services/chronicle-ang`)
- **Trigger:** On-demand via ACHEEVY or Chicken Hawk

## What Chronicle_Ang Does
- Ingests unstructured context (conversations, documents, events)
- Produces structured, source-attributed timelines
- Powers audit trails for Boost|Bridge verification history
- Creates project history timelines for Build Log

## Security Policy
- Runs as ephemeral Cloud Run Job — no persistent process
- Input data stays in GCP project (ai-managed-services)
- Output timelines stored in Firestore — never sent externally
- No access to raw verification images or PII
- Only processes metadata and text summaries

## How ACHEEVY Dispatches to Chronicle_Ang
1. ACHEEVY or Chicken Hawk identifies a timeline-generation task
2. Dispatches Cloud Run Job with context payload
3. Chronicle_Ang processes and generates structured timeline
4. Result stored in Firestore, returned via callback
5. ACHEEVY surfaces timeline in relevant dashboard

## Guardrails
- Ephemeral execution — no persistent state between runs
- Input sanitized before processing (no raw images, no credentials)
- Output is structured JSON only — no executable code
- Maximum runtime: 600s (Cloud Run Job timeout)
