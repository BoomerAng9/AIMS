# A.I.M.S. Internal OpenHands Execution Bridge — Phase 1 PRD

Date: 2026-09-24
Status: draft for owner review; no implementation or deployment authorization is inferred from this document.
Owning product repository: `BoomerAng9/AIMS`
Current isolated review branch: `codex/openhands-paperclip-adapter-main`, based on `origin/main` at `d57387b5401cbbbbedfd04bc216fa5c5d492842e`.

## 1. Product summary

Establish one internal, headless execution path from a real Paperclip assignment through an A.I.M.S.-owned broker to the OpenHands Agent Server that powers Agent Canvas. OpenHands is an internal production-line station and execution harness, not a customer-facing product UI. Paperclip remains assignment/owner/approval/receipt authority; ACHEEVY remains executive authority; A.I.M.S. owns routing and policy enforcement; OpenHands executes; Second Brain supplies scoped context; OKF supplies approved durable knowledge.

## 2. Users and problem

Primary users are the owner and internal operators/agents working through Paperclip, BUZZ, MarKit, Telegram-managed agents, or A.I.M.S. surfaces. They need an assigned task to reach a governed coding/artifact runtime without making customers interact with the OpenHands UI or giving workers broad platform credentials. Current evidence does not yet prove an end-to-end Paperclip assignment-to-Canvas execution in the managed runtime.

## 3. Requirements and traceability

| ID | Requirement | Status | Phase 1 acceptance evidence |
|---|---|---|---|
| R-01 | Use OpenHands Agent Canvas/Agent Server as the internal execution substrate; do not build a competing harness or customer-facing Canvas UI. | CONFIRMED | One Paperclip assignment produces a Canvas-backed run and inspectable artifact. |
| R-02 | Preserve Paperclip as source of assignment, agent identity, company, ownership, budget, status, approvals, and run receipt. | CONFIRMED | Live Paperclip assignment is unchanged except for adapter execution/result; read back exact run/task record. |
| R-03 | Route through an A.I.M.S.-owned broker, with owner/company/tenant mapping enforced server-side and unknown mappings denied. | CONFIRMED | Positive internal-company test and negative unknown-company/forged-tenant tests. |
| R-04 | JEV supplies typed selection/routing judgments, confidence, and escalation recommendations; it does not grant permissions, approve side effects, or replace deterministic policy. | CONFIRMED | Actual JEV request/response contract, model route, timeout/failure behavior, and decision trace verified; low confidence escalates. |
| R-05 | Load Second Brain context per run with tenant scope and provenance; include only approved OKF references and record source revisions. | CONFIRMED | Positive internal retrieval and cross-scope denial; receipt contains source IDs/revisions, not secret contents. |
| R-06 | OpenHands execution uses its authenticated native Agent Server API for conversation lifecycle, events, workspace/files, cancellation, and artifact inspection. | CONFIRMED | API-level task completion, event stream, artifact persistence, cancellation and failure checks on pinned deployed version. |
| R-07 | Model/provider selection is explicit, server-bound, and recorded; no default/provider/model promotion occurs through this integration. | CONFIRMED | Readback of selected profile/model/provider for the run and mismatch denial. |
| R-08 | External actions (publish, deploy, send, delete, credential changes) wait for the existing human/owner approval gate. | CONFIRMED | A consequential test task cannot cross its approval gate without an attributable approval. |
| R-09 | Runs are idempotent, observable, cancellable, and produce sanitized receipts with usage, provenance, status, and artifact references. | CONFIRMED | Duplicate/replay, timeout, cancellation, error, receipt completeness, and log-redaction tests. |
| R-10 | OpenClaw and Hermes remain bounded worker options; do not create duplicate Paperclip adapters if the installed Paperclip version already has native gateway adapters. | CONFIRMED | Version-specific inventory proves available adapter types and shows Canvas is a distinct adapter. |
| R-11 | OpenResearch and application-evaluation/autoresearch, Inner Cipher, NCP-inspired state transitions, RSI, BUZZ/MarKit, and broader vertical/tool delivery remain in the full goal roadmap; they are not represented as completed by this Phase 1. | CONFIRMED | Separate roadmap gates and receipts; no false completion claims. |

## 4. Assumptions, unknowns, exclusions

Assumptions: (A-01) the internal Paperclip company can install or load an external adapter; (A-02) the current Agent Server is reachable on a private authenticated route; (A-03) the first run uses an internal, non-customer repository and produces a harmless text/code artifact.

Unknown: deployed Paperclip version and adapter-plugin enablement; canonical Paperclip API endpoint and credential scope; current Agent Server release/config and auth key rotation policy; whether the installed runtime exposes the documented event/cancel/file APIs unchanged; current JEV System One endpoint/model and typed schema in the service account; approved Second Brain tenant resolver and OKF revision source; per-run budget/cost reporting; exact durable idempotency store across gateway replicas; selected internal workspace allowlist; operator’s actual signed-in verification surface; production owner approval and rollback procedure.

Phase 1 excludes customer/tenant onboarding, customer access, provider/model default changes, creating or changing Paperclip agents, live public deployment, publishing/sending/deploying artifacts, credential rotation, new UI, changes to OpenHands upstream, broad agent swarms, modifications to existing role cards, and migrations/deletions of existing data. OpenClaw and Hermes are not replaced or duplicated.

## 5. Research and reuse matrix

| Candidate | Classification | Evidence and fit | License/provenance | Risk/unknown |
|---|---|---|---|---|
| Paperclip external adapter plugin | Integrate | Official adapter authoring contract accepts execution context and returns structured status/usage/session data; external plugins load separately from Paperclip core. [Adapter guide](https://github.com/paperclipai/paperclip/blob/master/docs/adapters/creating-an-adapter.md) | Paperclip repository LICENSE reports MIT; use published interfaces and retain required notices if distributing copied portions. | Managed Paperclip version/plugin loader not verified; current docs may not match deployment. |
| Paperclip built-in Hermes/OpenClaw gateway adapters | Adopt where present | Official adapter overview lists gateway adapters; inventory the installed release before adding anything. [Adapter overview](https://github.com/paperclipai/paperclip/blob/master/docs/adapters/overview.md) | Use existing package/runtime, avoid vendoring. | Actual managed version/capabilities unverified. |
| OpenHands Agent Server | Integrate | Official HTTP/WebSocket API starts conversations, emits events, and provides workspace/file operations; server should be authenticated and private. [Agent Server guide](https://github.com/OpenHands/software-agent-sdk/blob/main/openhands/agent_server/README.md) | Software Agent SDK reports MIT; preserve notice if redistributing copied code. | API changes across deployed releases; live target version/profile/auth must be rechecked. |
| OpenHands OpenAI-compatible `/v1/responses` | Avoid for orchestration | Official implementation notes that streaming and external tool execution are not supported on that surface; use native Agent Server contract for this workflow. [Responses API limitations](https://github.com/OpenHands/software-agent-sdk/blob/main/openhands-agent-server/openhands/agent_server/openai/README.md) | First-party implementation. | Do not infer feature parity from OpenAI-compatible naming. |
| A.I.M.S. UEF Gateway | Integrate | Existing gateway provides internal-key middleware, SQLite migrations, audit/evidence stores, Express route patterns, and tests. `backend/uef-gateway/src/index.ts`, `src/db/`, `src/luc/routes.ts`. | A.I.M.S. proprietary. | Global API key is broad; existing ownership enforcer uses in-memory role assignments and is not a tenant resolver. A dedicated broker credential and durable server-side scope mapping are required. |

## 6. Recommended Phase 1 and user stories

Phase 1: a Paperclip external adapter calls a narrowly scoped A.I.M.S. broker endpoint. The broker validates the adapter identity, run/task idempotency, approved internal company/workspace mapping, JEV route result, and current human-approval state; retrieves permitted Second Brain/OKF references; then calls the authenticated OpenHands Agent Server over its native API. It waits for a terminal state or cancellation, captures events and output, independently verifies the requested artifact, and returns a structured Paperclip result/receipt. Any missing identity, mapping, source provenance, model authorization, approval, or required service fails closed.

Stories:

1. As an internal Paperclip agent, I can receive an assigned, bounded coding task and have the Canvas-backed runtime produce an artifact in the approved workspace; the run is linked to the assignment and leaves a retrievable receipt.
2. As the owner/operator, I can see the selected route, provider/model, progress, provenance references, cost/usage if available, terminal result, and failure reason without secret values or hidden reasoning.
3. As an operator, I can cancel a run; duplicate delivery cannot start a second execution; and an unknown company or workspace cannot access owner context or credentials.
4. As ACHEEVY/operator, I can require approval before any consequential external action; an agent’s JEV score or Paperclip task text cannot self-approve.

## 7. High-level architecture

```text
Paperclip assignment/heartbeat
        │ external adapter package
        ▼
A.I.M.S. UEF Gateway broker ── trusted company/workspace resolver
        ├── JEV typed route recommendation (advisory; deterministic gates win)
        ├── Second Brain retrieval + OKF revision provenance (scoped, fail closed)
        ├── approval + idempotency + audit/evidence record
        ▼ private authenticated Agent Server API
OpenHands conversation/workspace/events ── isolated execution + artifact
        │ verified terminal result + sanitized receipt
        └──────────────────────────────► Paperclip run/task
```

Do not put OpenHands Agent Server on a public unauthenticated network. Do not send raw A.I.M.S. or Paperclip credentials through task text, Canvas prompt content, logs, or receipts. Tenant IDs come from trusted server-side mappings, never browser or task body assertions. Use a dedicated least-privilege broker credential, TLS/private network, workspace allowlist, bounded resources, request timeout, cancellation propagation, and redacted logs.

## 8. Verification plan

1. Pin actual Paperclip and Agent Server versions and compare their live schemas/plugin contracts with the official docs.
2. Unit/contract tests for adapter context parsing, JEV typed decisions/confidence, schema validation, bounded prompt assembly, signing/auth, tenant mapping, approval refusal, redaction, idempotency, and Paperclip result normalization.
3. Broker integration tests with stub Paperclip/JEV/Second Brain/Canvas services; failure-injection for 401/403, timeout, duplicate delivery, partial execution, event loss, cancellation, restart, and unavailable provenance.
4. Local isolated end-to-end canary using one approved internal Paperclip assignment and non-sensitive workspace; verify actual Canvas conversation, artifact contents/hash, event timeline, run receipt, and independent artifact check.
5. Operator verification in the actual authorized Paperclip/Canvas surfaces; record exact build/runtime versions and evidence. A passing mock or local build is not live acceptance.
6. Later release gate: staged rollout, observable health/error/cost, documented rollback to prior adapter/runtime route, and explicit owner approval before production mutation.

## 9. Risks and dependencies

| Risk | Effort range (hands-on, estimate) | Mitigation / tripwire |
|---|---:|---|
| Paperclip managed version lacks external adapter loading or result contract differs | 0.5–2 days | Verify before coding; use supported built-in HTTP adapter only if it preserves needed streaming/session/cancel/receipt semantics. Stop if version cannot support secure identity mapping. |
| Canvas tasks can execute code and touch files | 1–3 days | Private network, restricted workspaces/egress/resources, separate secrets, owner-only canary. Pause on any boundary escape. |
| No trusted company/tenant resolver or Second Brain scope API | 1–5+ days | Internal-only mapping first; customer access remains disabled until resolver and isolation tests pass. |
| JEV route endpoint/schema/credential scope unverified | 0.5–3 days | Discover existing approved service path; fail closed or require deterministic operator route if unavailable; never claim JEV used. |
| Paperclip receipt and Canvas terminal state can diverge | 1–4 days | Idempotent receipt/reconciliation, durable run IDs, retries with fencing, and explicit partial-failure state. |

Tripwire: two failed corrections on one failure signature, any cross-scope access, any secret disclosure, uncontrolled execution/egress, or a missing required approval pauses the dependent path for reassessment.

Known issues record: `C:\Users\rishj\foai\docs\project-initiation\current-project\WORK.md` plus the A.I.M.S. repo integration notes to be added only after an approved implementation exists.

## 10. Model/delegation recommendation

Recommended lead: current Codex session (the runtime identifies the GPT-5 family; exact variant is not available here), because this phase couples repository, API, authorization, and test reasoning. Reviewer: an independent security/API-contract review session before any release claim. Alternative: route typed judgments through JEV as a constrained decision component, not as code author or authority. A model switch is not available/confirmed. Delegation was attempted, but the current agent-thread limit is full; no independent subagent review is claimed.

## 11. Phases beyond Phase 1

Phase 2: customer tenant resolver, per-run Second Brain/OKF, BUZZ and MarKit synchronization, external artifact destinations (CareerProof, Deploy Platform, documents/images/video/audio) with HITL controls. Phase 3: bounded OpenClaw/Hermes heavy-lifter adapters, OpenResearch session/cancel/provenance adapter, application-specific autoresearch evaluator with owner-approved held-out set/metrics, Inner Cipher mission state, NCP-inspired transition/falsification, and separately governed RSI/retrieval/routing improvement. Each phase retains Paperclip assignment/receipt authority and requires its own acceptance evidence.

## 12. Complexity, budget, approvals

Phase 1 estimate: approximately 2–6 engineer-days of implementation plus 1–3 days elapsed for environment/version coordination and verification, with low-to-medium confidence until Paperclip, JEV, Second Brain, and Agent Server contracts are verified. This is an estimate, not a guarantee. No external paid service, provider/model change, customer access, or public deployment is included. Proposed first work budget after approval: one internal task, one workspace, at most two retries per failure signature, no paid API calls unless existing owner-approved credentials and limits are confirmed.

Decisions requiring owner approval: approve this PRD and exact Phase 1 internal-only scope; approve the named canary task/workspace and selected provider/model; confirm acceptance of the evidence rubric and two-retry tripwire. Separate explicit approval remains required for Paperclip writes/agent changes if not already covered by the installed internal authority, public deployment, customer access, model-default changes, and consequential publication/deployment actions.

## 13. Project charter

1. Name/goal: A.I.M.S. Internal OpenHands Execution Bridge — route governed Paperclip work to the internal OpenHands Agent Canvas runtime.
2. Definition of done: an assigned internal task executes through the approved model and workspace, produces a verified persistent artifact, records JEV/context/provenance and cost/status evidence, updates Paperclip accurately, rejects unauthorized scope, and is observable/cancellable/rollbackable. **Not yet achieved.**
3. Operator surfaces: Paperclip (assignment/receipt), authenticated OpenHands Canvas/Agent Server (internal runtime), and A.I.M.S. UEF Gateway (broker health/audit); exact deployed versions/surfaces **UNCONFIRMED**.
4. Components/license/provenance: A.I.M.S. proprietary; Paperclip repo and OpenHands Software Agent SDK report MIT; integrate through documented interfaces, do not copy code without preserving notices. [Paperclip license](https://github.com/paperclipai/paperclip/blob/master/LICENSE), [OpenHands SDK license](https://github.com/OpenHands/software-agent-sdk/blob/main/LICENSE). Verify all transitive package licenses before distribution.
5. Smallest proof: one assigned internal task creates `hello.txt` in a dedicated test workspace, with a verified Canvas event trail and Paperclip receipt.
6. Main risks: wrong tenant/company mapping, broad API-key exposure, execution escape/egress, unauthorized model routing, stale runtime schema, missing provenance, duplicate run, and false “complete” receipts. Ranges and mitigations are above.
7. Stop tripwire: two same-signature repair failures or any auth/isolation/secret/approval breach; stop dependent execution immediately.
8. Known issues: FOAI `docs/project-initiation/current-project/WORK.md`; add implementation-specific issues after PRD approval.
9. Reporting cadence: at each meaningful verify/build/review checkpoint; separate measured active effort from elapsed time.
10. Constraints/approval: preserve dirty worktrees; do not deploy or change public/customer surfaces without target-specific authorization; do not represent presence/configuration as runtime consumption; do not alter Paperclip agent or model assignments.

## 14. Competitive-quality bar

This is an internal workflow/API integration, not a UI competition. The quality bar is the official Paperclip adapter protocol (truthful lifecycle, structured results, cancellation/session behavior) and OpenHands Agent Server contract (authenticated task execution, event/file access). Required dimensions: workflow correctness, integration behavior, tenant/security boundary, provenance, cancellation/recovery, observability, artifact usability, performance against an explicitly agreed runtime budget, and rollback. No visual score applies in Phase 1. Release target for each applicable qualitative dimension is at least 4/5, no unresolved high-severity defect, and no required check marked untested; owner acceptance is still mandatory. Comparison is a design-contract comparison, not a claim that competitors were executed side-by-side.

PRD ready for review. Implementation has not started. Please approve this PRD version and Phase 1 scope, or identify the changes required.
