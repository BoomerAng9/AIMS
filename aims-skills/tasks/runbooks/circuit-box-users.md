---
id: "circuit-box-users-runbook"
name: "Circuit Box Users Runbook"
type: "task"
status: "active"
triggers: ["circuit box user", "user circuit", "connect service"]
description: "Step-by-step runbook for the Circuit Box User view: plug-and-play services, credential input, usage meters."
execution:
  target: "internal"
priority: "high"
---

# Circuit Box — Users Runbook

## Overview
The User Circuit Box shows a simplified, plug-and-play view of connected services. Users see only what they need to connect and manage their own integrations.

## What Users See

### Service Cards
Each available service appears as a card with:
- Service name and icon
- Brief description of what it does
- Connection status (connected / not connected)
- Health indicator (green/yellow/red)

### Credential Input
- Users can provide their own API keys for supported services
- Keys are stored encrypted in user tenant space
- Keys are never displayed after entry (masked with `***`)
- "Test Connection" button validates the key works

### Usage Meters
- Token usage (used / remaining for current period)
- Request count
- Storage usage (if applicable)

## User Setup Flow

### 1. First Visit
- User sees all available service categories
- Services show "Not Connected" status
- Guided tooltip: "Connect your services to unlock more capabilities"

### 2. Connecting a Service
1. User clicks a service card
2. Input form appears for credentials (API key, webhook URL, etc.)
3. User enters credentials
4. Platform validates the connection
5. Service card updates to "Connected" with green status

### 3. Managing Connections
- User can disconnect services at any time
- Disconnecting removes stored credentials
- User can update credentials (enter new key)

## What Users Do NOT See
- Internal service topology
- Provider cost breakdowns
- Other users' data
- Platform API keys
- Agent routing information
- Security policies or thresholds
- Kill switch or admin controls
