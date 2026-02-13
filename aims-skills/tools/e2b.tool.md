---
id: "e2b"
name: "E2B Code Sandbox"
type: "tool"
category: "ai"
provider: "E2B"
description: "Secure cloud sandbox for executing Python, Node.js, and Bash code in isolated containers."
env_vars:
  - "E2B_API_KEY"
docs_url: "https://e2b.dev/docs"
aims_files:
  - "frontend/lib/services/e2b.ts"
---

# E2B Code Sandbox — Tool Reference

## Overview

E2B provides secure, isolated cloud sandboxes for executing arbitrary code. In AIMS, the E2BService class wraps the SDK for Python, Node.js, and Bash execution. This is the primary code execution backend for developer Boomer_Angs and Lil_Hawks that need to run/test code.

## API Key Setup

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `E2B_API_KEY` | Yes | https://e2b.dev/dashboard |

**Apply in:** `frontend/.env.local` or `infra/.env.production`

## API Reference

### Base URL
```
https://api.e2b.dev
```

### Auth
API key passed to SDK constructor (not HTTP header).

### Key Operations
1. **Create sandbox** — Spins up isolated container
2. **Execute code** — Run Python/Node/Bash in sandbox
3. **Install packages** — pip/npm install before execution
4. **Kill sandbox** — Cleanup after execution

## AIMS Usage

```typescript
import { E2BService } from '@/lib/services/e2b';

const e2b = new E2BService();

// Execute Python
const result = await e2b.executePython(`
import pandas as pd
df = pd.DataFrame({'x': [1,2,3]})
print(df.describe())
`);
// result.stdout, result.stderr, result.exitCode

// Execute Node.js
const nodeResult = await e2b.executeNode(`
const fs = require('fs');
console.log('Hello from Node');
`);

// Execute with package installation
const withPkgs = await e2b.executeWithPackages(
  'import requests; print(requests.get("https://httpbin.org/ip").json())',
  ['requests'],
  'python'
);
```

## Supported Languages

| Language | Cell Magic | Package Manager |
|----------|-----------|-----------------|
| Python | (default) | pip |
| Node.js | `%%javascript` | npm |
| Bash | `%%bash` | apt-get |

## Sandbox Lifecycle
1. `CodeInterpreter.create()` — Spins up sandbox (~2-5s)
2. `notebook.execCell()` — Execute code in Jupyter kernel
3. `sandbox.kill()` / `sandbox.close()` — Cleanup

**Important:** Always kill sandboxes after use to avoid billing for idle time.

## Pricing
- Free tier: 100 sandbox hours/month
- Pro: $0.10/sandbox-hour
- Sandboxes auto-terminate after 5 min of inactivity

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Check `E2B_API_KEY` is set |
| Sandbox creation timeout | E2B may be under load; retry after 5s |
| Package install fails | Check package name; some system packages need `%%bash apt-get` |
| Code hangs | Set timeout; infinite loops consume sandbox hours |
