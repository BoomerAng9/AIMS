---
name: needs-analysis
type: skill
triggers:
  - "needs analysis"
  - "business intake"
  - "what do I need"
  - "assess my needs"
  - "help me choose"
  - "which tools"
  - "recommend tools"
execution:
  target: frontend
  route: /dashboard/needs-analysis
  fallback: api
  api_endpoint: /api/needs-analysis
---

# Business Client Needs Analysis Skill

## Purpose
Guide business clients through a formal intake process before recommending
or deploying any tools. We gather information first, digest it, then create.

## When to Activate
- User is a new business client
- User doesn't know which tools they need
- User asks for recommendations
- User mentions compliance, security, or enterprise requirements

## The 5 Sections

### 1. Business (Company Context)
- Company name and industry
- Team size (determines tier)
- Primary goal (automation, agents, research, content, etc.)
- Specific workflows to automate

### 2. Technical (Current Stack)
- Existing tools (Slack, Jira, Salesforce, etc.)
- Data sources (databases, APIs, spreadsheets, legacy)
- Legacy systems without APIs → triggers computer-use recommendation
- Technical comfort level

### 3. Security (Data & Compliance)
- Data sensitivity (PII, financial, health, legal)
- Compliance requirements (GDPR, HIPAA, SOC2, PCI-DSS)
- Role-based access control needs
- → Determines security level: standard / hardened / enterprise

### 4. Delivery (Hosting & Support)
- Hosting preference: AIMS-hosted / self-hosted / hybrid
- Uptime requirements (best-effort → 99.99%)
- Support level (self-service → dedicated account)

### 5. Budget (Cost & Scaling)
- Monthly budget range
- Scaling expectations

## Output: The Blueprint
After analysis, the engine produces:
- Recommended plugs (ranked by fit score)
- Recommended tier (starter / pro / enterprise)
- Recommended delivery mode (hosted / exported / hybrid)
- Security level determination
- Risk assessment
- Data classification
- Compliance requirements list
- Estimated monthly cost

## Behavioral Rules
- NEVER recommend tools before completing the analysis
- ALWAYS present the blueprint before deployment
- If user wants to skip → warn that recommendations may not fit
- For enterprise clients → always recommend hardened or enterprise security
- For health/legal/finance → always flag compliance requirements
