# Firebase Data — Acceptance Criteria

## Functional Requirements

1. **Tenant isolation**: Every query scoped to user/workspace — zero cross-tenant reads
2. **Collection convention**: Top-level `{entity}`, nested `{entity}/{id}/{subcollection}`
3. **Audit trail**: All write operations logged as append-only records
4. **Role enforcement**: Access matrix enforced before every operation
5. **Subcollections for user data**: `users/{uid}/conversations/{cid}` pattern
6. **Role cards read-only**: Only admin role can modify role card documents

## Non-Functional Requirements

1. **Latency**: P95 Firestore read < 500ms
2. **Write reliability**: 99.9% write success rate
3. **Isolation violations**: Zero tolerance — any cross-tenant query is a critical bug

## Role-Based Access Matrix

| Role | Read | Write | Delete | Target Collections |
|------|------|-------|--------|-------------------|
| Primary Orchestrator | All | All | Soft-delete only | conversations, vertical_progress, workspaces |
| Specialist Executor | Own domain | Own domain | No | workspaces (scoped to domain) |
| Code Generation Executor | All | No | No | role_cards, policies (read-only) |
| Worker Executor | No | Append-only | No | audit_log |
| Automation Executor | Scoped | Scoped | No | automation_runs, scheduled_tasks |

## Error Handling

| Error | Response |
|-------|----------|
| `FIREBASE_PROJECT_ID` missing | Return config error, do not attempt connection |
| `FIREBASE_PRIVATE_KEY` missing | Return auth error, do not attempt connection |
| Document not found | Return null/empty, not exception |
| Permission denied | Return structured 403, log violation |
| Quota exceeded | Return structured 429, alert ops |
