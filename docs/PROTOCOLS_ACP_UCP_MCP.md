# A.I.M.S. Protocols: ACP, UCP, MCP

## 1. ACP (Agentic Communication Protocol)
**Purpose**: Typed interface between Humans, UEF, and Agents.

### Payload Structure (Request)
```json
{
  "reqId": "uuid-123",
  "intent": "BUILD_PLUG",
  "naturalLanguage": "Build a CRM for real estate agents",
  "userId": "user_01",
  "budget": { "maxUsd": 50.00 }
}
```

### Payload Structure (Response)
```json
{
  "reqId": "uuid-123",
  "status": "SUCCESS",
  "quote": { ...UCP Quote... },
  "executionPlan": {
    "steps": ["Plan", "Build", "Verify"],
    "estimatedDuration": "5m"
  }
}
```

## 2. UCP (Universal Commerce Protocol)
**Purpose**: Real-time cost estimation and settlement.
**Key Concept**: LUC (Locale Usage Calculator).

### Quote Example
```json
{
  "totalUsd": 1.25,
  "breakdown": [
    { "component": "Planning", "usd": 0.10, "model": "claude-sonnet-4.5" },
    { "component": "Execution", "usd": 1.05, "model": "claude-opus-4.6" }
  ],
  "byteRoverDiscountApplied": true
}
```

## 3. MCP (Model Context Protocol)
**Purpose**: Tools used by Agents during execution.
**Tools**:
- `byterover.retrieve_context`: Fetches "Corporate Memory".
- `vljepa.embed`: Vision/Text embeddings for hallucination checks.
