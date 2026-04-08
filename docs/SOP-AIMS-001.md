# SOP-AIMS-001: A.I.M.S. Project Lifecycle

## Phase 0 – Intake & Discovery (FOSTER)

1. Read the entire conversation / brief.
2. Extract:
   - Objectives
   - Constraints (stack, budget, time)
   - Target users & verticals
3. Ask clarifying questions (if gaps).
4. Produce:
   - Draft PRD
   - High-level architecture sketch
   - Initial risk list

## Phase 1 – Scoping & Estimation (FOSTER)

1. Refine PRD with:
   - Functional requirements
   - Non-functional requirements
   - Success criteria
2. Estimate:
   - Tokens / compute
   - Time (runtime hours)
   - Complexity score
3. Present scope to owner:
   - Options: ACCEPT / SIMPLIFY / DEFER
4. On ACCEPT:
   - Lock PRD v1.0

## Phase 2 – Design (DEVELOP)

1. Architecture design:
   - Frontend components (Next.js + Stitch templates)
   - Backend services (VPS / Docker containers)
   - Data models (Firestore schemas)
   - Agent topology (Boomer_Angs + Lil Hawks)
2. Integration design:
   - Voice stack (PersonaPlex + Deepgram)
   - OpenRouter, Brave API, Stripe, etc.
3. Deployment design:
   - VPS services vs CDN
4. Output:
   - Technical Design Doc (TDD)
   - Updated PRD (design-confirmed)

## Phase 3 – Implementation (DEVELOP)

1. Create TTD-DR tasks for:
   - Frontend
   - Backend
   - Agents
   - Autonomy (Docker containers on VPS)
   - Deploy pipeline
2. Chicken Hawk and Boomer_Angs implement:
   - Code
   - Infra configs
   - Workflows (n8n, LangGraph/CrewAI)
3. Stream progress:
   - SSE / logs to Live Job Monitor
4. Keep mapping:
   - Tasks <-> PRD requirements

## Phase 4 – Verification & Governance (HONE)

1. Run tests:
   - Unit, integration, E2E as appropriate
2. Run governance gates:
   - Technical completion
   - V.I.B.E. alignment
   - Security & privacy
   - Cost envelope
   - Observability & rollback
3. Fix issues, repeat until all gates pass.

## Phase 5 – Deployment

1. For apps/sites:
   - Build frontend -> deploy to CDN
   - Wire custom domain (CNAME)
2. For autonomous jobs:
   - Deploy pipelines to Docker containers on VPS
   - Connect triggers (cron / events)
3. For platform services:
   - Deploy containers on Hostinger VPS

4. On success:
   - Emit BAMARAM signal
   - Notify user (voice + UI)
   - Update job status to COMPLETE

## Phase 6 – Operation & Iteration

1. Monitor:
   - Logs, metrics, token costs
2. Autonomy:
   - Ensure Docker jobs and agents run on schedule
3. Collect feedback from users.
4. Feed back into:
   - PRD updates
   - SOP improvements
   - Agent behaviors (Boomer_Angs / Lil Hawks)
