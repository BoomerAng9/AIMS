---
id: "e2b-sandbox"
name: "E2B Code Sandbox Execution"
type: "task"
status: "active"
triggers:
  - "run code"
  - "execute code"
  - "sandbox"
  - "run python"
  - "run javascript"
  - "run bash"
  - "code execution"
description: "Execute Python, Node.js, or Bash code in a secure E2B cloud sandbox."
execution:
  target: "api"
  route: "/api/code/execute"
  command: ""
dependencies:
  env:
    - "E2B_API_KEY"
  packages:
    - "@e2b/sdk"
  files:
    - "frontend/lib/services/e2b.ts"
    - "aims-skills/tools/e2b.tool.md"
priority: "high"
---

# E2B Code Sandbox Execution Task

## Endpoint
**POST** `/api/code/execute`

```json
{
  "code": "print('Hello from AIMS')",
  "language": "python",
  "packages": ["requests", "pandas"]
}
```

**Response:**
```json
{
  "stdout": "Hello from AIMS\n",
  "stderr": "",
  "exitCode": 0,
  "error": null,
  "success": true
}
```

## Supported Languages

| Language | Value | Package Manager |
|----------|-------|-----------------|
| Python | `"python"` | pip |
| Node.js | `"node"` | npm |
| Bash | `"bash"` | apt-get |

## Pipeline
1. **Validate** — Check language, code length, `E2B_API_KEY` present
2. **Create sandbox** — Spin up isolated E2B container (~2-5s)
3. **Install packages** — If `packages` array provided, install first
4. **Execute** — Run code in Jupyter kernel
5. **Collect output** — stdout, stderr, exit code
6. **Cleanup** — Kill sandbox to stop billing

## Programmatic Usage
```typescript
import { E2BService } from '@/lib/services/e2b';

const e2b = new E2BService();

// Simple execution
const result = await e2b.executePython('print(1 + 1)');

// With packages
const result = await e2b.executeWithPackages(
  'import pandas as pd; print(pd.__version__)',
  ['pandas'],
  'python'
);
```

## Safety
- Code runs in isolated containers — no access to AIMS infrastructure
- Sandboxes auto-terminate after 5 min idle
- No network access to internal services
- File system is ephemeral — destroyed on sandbox kill

## API Key
Set `E2B_API_KEY` in environment. Get key from: https://e2b.dev/dashboard

## Limits
- Free: 100 sandbox hours/month
- Pro: $0.10/sandbox-hour
- Max execution time: 5 min (configurable)
