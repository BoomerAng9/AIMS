# Circuit Box Controls — factory-controller

## Overview

The Circuit Box is the policy enforcement layer for the Factory Controller. Each control maps an event category to an action policy, defining what the Factory Controller can do autonomously and what requires human approval.

## Controls Table

| Control ID  | Event Category            | Action                     | Auto-Approve | Escalation Trigger                  | Cooldown |
|-------------|---------------------------|----------------------------|--------------|-------------------------------------|----------|
| CB-001      | Container Health           | Restart unhealthy container | Yes          | 3 consecutive restart failures      | 30s      |
| CB-002      | Container Health           | Scale up replicas           | Yes          | Cost exceeds $50/day threshold      | 5m       |
| CB-003      | Container Health           | Scale down replicas         | No           | Always requires owner approval      | N/A      |
| CB-004      | Container Health           | Decommission container      | No           | Always requires owner approval      | N/A      |
| CB-005      | Deployment                 | Deploy to staging           | No           | Always requires owner approval      | N/A      |
| CB-006      | Deployment                 | Deploy to production        | No           | Always requires owner approval      | N/A      |
| CB-007      | Deployment                 | Rollback deployment         | Yes          | If rollback target is > 24h old     | 2m       |
| CB-008      | SSL/TLS                    | Renew certificate           | Yes          | Never (always auto-renew)           | 12h      |
| CB-009      | SSL/TLS                    | Revoke certificate          | No           | Always requires owner approval      | N/A      |
| CB-010      | Nginx                      | Reload configuration        | Yes          | Config validation failure           | 30s      |
| CB-011      | Nginx                      | Update routing rules        | No           | Always requires owner approval      | N/A      |
| CB-012      | Database                   | Run migration               | No           | Always requires owner approval      | N/A      |
| CB-013      | Database                   | Create backup               | Yes          | Never (always auto-backup)          | 1h       |
| CB-014      | Database                   | Restore from backup         | No           | Always requires owner approval      | N/A      |
| CB-015      | Monitoring                 | Clear alert                 | Yes          | If alert has been active > 1h       | 5m       |
| CB-016      | Monitoring                 | Create incident report      | Yes          | Never (always auto-create)          | 10m      |
| CB-017      | Billing                    | Send quota warning          | Yes          | Never (always auto-send)            | 24h      |
| CB-018      | Billing                    | Suspend service (non-payment) | No         | Always requires owner approval      | N/A      |
| CB-019      | Billing                    | Upgrade plan                | No           | Always requires owner approval      | N/A      |
| CB-020      | Plug Lifecycle             | Provision new instance      | No           | Always requires owner approval      | N/A      |
| CB-021      | Plug Lifecycle             | Health check remediation    | Yes          | 3 consecutive remediation failures  | 1m       |
| CB-022      | Plug Lifecycle             | Auto-scale instance         | Yes          | Cost exceeds $50/day threshold      | 5m       |
| CB-023      | Security                   | Block suspicious IP         | Yes          | If block list exceeds 100 entries   | 1m       |
| CB-024      | Security                   | Rotate API key              | No           | Always requires owner approval      | N/A      |
| CB-025      | Security                   | Enable maintenance mode     | No           | Always requires owner approval      | N/A      |

## Policy Override Rules

1. **Owner Override** — The owner can override any control to Auto-Approve or Manual at any time via `factory.policy.update()`.
2. **Emergency Mode** — When the Overseer detects a critical failure, all controls except CB-001 (container restart) and CB-013 (backup) are set to Manual until owner clears the emergency.
3. **Budget Lock** — If LUC credits are exhausted, all cost-incurring controls (CB-002, CB-005, CB-006, CB-020, CB-022) are locked to Manual regardless of policy.
4. **Audit Trail** — Every policy override and control execution is logged to the Evidence Locker with timestamp, actor, and reason.

## Circuit States per Control

Each control has an independent circuit state:

| State       | Meaning                                        | Transitions To        |
|-------------|------------------------------------------------|-----------------------|
| `closed`    | Normal operation — control is active            | `open` on failure     |
| `open`      | Control is disabled — no auto-actions           | `half-open` on cooldown |
| `half-open` | Control runs in dry-run mode for validation     | `closed` on success, `open` on failure |

State transitions follow the same pattern as the Factory Swarm circuit box policy (3 failures = open, cooldown = half-open, 3 dry-run successes = closed).
