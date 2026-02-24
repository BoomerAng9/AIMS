---
id: "boost-space-automation"
name: "Boost.space Automation"
type: "skill"
status: "active"
triggers:
  - "boost space"
  - "boost.space"
  - "boostspace"
  - "data sync"
  - "business data"
  - "sync data"
  - "connected apps"
  - "2000 apps"
  - "single source of truth"
  - "data enrichment"
description: "Boost.space Remote MCP — query, write, and enrich business data across 2000+ connected apps in real time via AI chat."
execution:
  target: "api"
  route: "/api/mcp/boost-space"
dependencies:
  env:
    - "BOOSTSPACE_API_BASE"
    - "BOOSTSPACE_TOKEN"
  files:
    - "aims-skills/tools/boost-space-remote.tool.md"
    - "aims-skills/tools/boost-space-integrator.tool.md"
priority: "high"
---

# Boost.space Automation Skill

## When This Fires

Triggers when any agent needs to:
- Query business data from connected applications
- Create or update records across synced platforms
- Enrich data using AI-powered field mapping
- Search across CRM, project management, or invoicing data
- Pull real-time metrics from connected business tools

## What It Does

The Boost.space Remote MCP connection provides real-time access to the centralized
business data layer. It acts as a Single Source of Truth (SSOT) for all data flowing
through A.I.M.S. connected applications.

## Capabilities

### Data Operations (Read + Write)
1. **Query** — Natural language data retrieval ("Show me all leads from this week")
2. **Create** — Add new records ("Create a contact for Jane at TechCorp")
3. **Update** — Modify existing data ("Mark invoice #456 as paid")
4. **Enrich** — AI-powered data enhancement and field mapping
5. **Analyze** — Aggregate and summarize across data sources

### Connected App Categories
- **CRM** — HubSpot, Salesforce, Pipedrive
- **Project Management** — Notion, Asana, Monday.com
- **Communication** — Slack, Gmail, Microsoft Teams
- **Finance** — Stripe, QuickBooks, Xero
- **Marketing** — Mailchimp, ActiveCampaign
- **E-Commerce** — Shopify, WooCommerce
- **Storage** — Google Drive, Dropbox, OneDrive

### Data Spaces
Each Boost.space workspace organizes data into four views:
- **Data** — Record management
- **Connect** — Integration configuration
- **Share** — Team collaboration
- **Flow** — Automation pipelines

## Rules for Agents

1. **Always use structured queries** — Ask for specific fields, not "get everything"
2. **Respect data privacy** — Never expose PII in logs or chat
3. **Cache within session** — Don't re-query the same data in one conversation
4. **Confirm destructive writes** — Always verify before updating or deleting records
5. **Use enrichment** — Leverage AI field mapping for data normalization

## Fallback Chain

```
Primary:   Boost.space Remote MCP (live data)
Fallback:  Firebase/Firestore (cached local data)
Emergency: Manual CSV export from Boost.space dashboard
```

## A.I.M.S. Integration Points

| Touch Point | How Boost.space Connects |
|-------------|-------------------------|
| **Onboarding** | Pull user profile data from connected CRM |
| **HalalHub** | Sync vendor/product data to marketplace |
| **Billing** | Track subscription status via Stripe sync |
| **Support** | Query ticket history from connected helpdesk |
| **Analytics** | Real-time dashboard metrics from all sources |

## Cost Considerations

Data queries and writes consume Boost.space API quota based on plan tier.
SME_Ang tracks usage and routes through LUC cost management.
