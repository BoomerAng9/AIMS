---
id: "owners-vs-users-surface-map"
name: "Owners vs Users Surface Map"
type: "task"
status: "active"
triggers: ["surface map", "owner view", "user view", "visibility"]
description: "Explicitly lists what Owners see in Circuit Box vs what Users see, and what is hidden."
execution:
  target: "internal"
priority: "high"
---

# Owners vs Users Surface Map

> Every surface in A.I.M.S. has a visibility rule. This map makes it explicit.

## Circuit Box

| Element | Owner View | User View |
|---------|-----------|-----------|
| **Service Nodes** | All providers + internal services | Only user-connected services |
| **Wiring / Connections** | Full topology with request flow | Simplified connection indicators |
| **Telemetry** | Latency, token burn, error rates per service | Overall health status (green/yellow/red) |
| **Provider API Keys** | Masked but accessible (click to reveal) | Not visible |
| **Provider Costs** | Full cost breakdown per operation | Not visible |
| **Policy Levers** | Rate limits, cost caps, tier thresholds | Not visible |
| **Kill Switch** | Active, one-click | Not visible |
| **Audit Trail** | Full event log (agent routing, tool calls) | Not visible |
| **User Management** | View/manage all users | Not visible |
| **Credential Input** | N/A (platform manages) | User provides their own API keys |
| **Usage Meters** | Global + per-user breakdown | Own usage only |
| **Security Console** | Anomaly alerts, violations | Not visible |

## Chat w/ACHEEVY

| Element | Owner View | User View |
|---------|-----------|-----------|
| **Chat Messages** | Full conversation | Full conversation |
| **Read Receipt** | Full internal record + public receipt | Public receipt only (optional toggle) |
| **Agent Routing** | Visible in operations overlay | Not visible |
| **LUC Cost** | Exact cost per message | Not visible |
| **Intent Classification** | Full analysis (confidence, capabilities) | Intent category only (in receipt) |
| **Operations Overlay** | Full Glass Box view | Not visible |

## Dashboard

| Element | Owner View | User View |
|---------|-----------|-----------|
| **Revenue Metrics** | LUC revenue, subscription MRR | Not visible |
| **Platform Health** | Service status, uptime, error rates | Not visible |
| **User Activity** | Aggregated user metrics | Own activity only |
| **Billing** | All user billing, revenue reports | Own subscription/usage |

## Settings

| Element | Owner View | User View |
|---------|-----------|-----------|
| **Platform Config** | All settings, feature flags | Not visible |
| **Provider Config** | Add/remove/configure all providers | Not visible |
| **User Profile** | Own profile | Own profile |
| **Integrations** | Platform-level integrations | Own connected services |
| **Security Settings** | Full security console | Password/2FA only |

## Hidden Surfaces (Owner-Only, No User Equivalent)

| Surface | Purpose |
|---------|---------|
| **Internal Engagement Records** | Full unsanitized engagement data |
| **Agent Chain Viewer** | Real-time agent dispatch visualization |
| **Cost Calculator** | LUC formula editor, margin controls |
| **Deployment Console** | Docker, Nginx, SSL management |
| **Anomaly Dashboard** | Security event timeline |
