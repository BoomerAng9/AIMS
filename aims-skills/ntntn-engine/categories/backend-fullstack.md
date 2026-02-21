# NtNtN Engine — Category 8: Backend & Fullstack

> What powers the server side when creatives need more than frontend.

---

## Node.js / Express

### Overview
JavaScript runtime + minimal web framework. The most popular backend for JS/TS teams.
Middleware-based architecture, massive ecosystem.

- **Current:** Node.js 24 LTS "Krypton" (Active), Node.js 22 LTS "Jod" (Maintenance until 2027-04), Express 5.x
- **⚠️ Node.js 20 EOL:** April 30, 2026 — migrate off Node 20 now
- **A.I.M.S. Status:** Default backend runtime (UEF Gateway uses Express)

### Key Patterns

#### REST API
```ts
const app = express();
app.use(express.json());

app.get('/api/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const user = await prisma.user.create({ data: req.body });
  res.status(201).json(user);
});
```

#### Middleware
```ts
// Auth middleware
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
};
```

### Picker_Ang Notes
- **A.I.M.S. default backend** — existing stack
- Choose when: JS/TS team, real-time (WebSocket), microservices
- Avoid when: ML/data pipelines (use Python), ultra-performance (use Go/Rust)

---

## Next.js API Routes / Server Actions

### Overview
Built-in server-side logic within Next.js. Route Handlers for REST-style APIs,
Server Actions for form mutations and data writes.

- **Current:** Next.js 16 (App Router, Turbopack default)
- **Approach:** Server-side code co-located with frontend

### Key Patterns

#### Route Handlers
```ts
// app/api/users/route.ts
export async function GET() {
  const users = await prisma.user.findMany();
  return Response.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await prisma.user.create({ data: body });
  return Response.json(user, { status: 201 });
}
```

#### Server Actions
```ts
// actions.ts
'use server';
export async function createUser(formData: FormData) {
  const user = await prisma.user.create({
    data: { name: formData.get('name') as string },
  });
  revalidatePath('/users');
  return user;
}
```

### Picker_Ang Notes
- **Default for fullstack in one framework** — no separate backend needed
- Choose when: Next.js project that needs data mutations, form handling
- Avoid when: Separate API service needed, microservices architecture

---

## Python / FastAPI

### Overview
Modern Python web framework with automatic OpenAPI documentation generation.
Async-first, Pydantic validation, excellent for ML/data backends.

- **Current:** FastAPI 0.115+
- **Approach:** Decorator-based routing + Pydantic models + async/await

### Key Patterns
```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class User(BaseModel):
    name: str
    email: str

@app.post("/users", response_model=User)
async def create_user(user: User):
    return await db.users.create(user.dict())
```

### Picker_Ang Notes
- Choose when: ML/AI backend, data pipelines, Python team, auto-docs needed
- Avoid when: Simple CRUD (Next.js Server Actions), JS/TS-only team

---

## tRPC

### Overview
End-to-end typesafe APIs for TypeScript. Define API procedures on the server,
call them from the client with full type inference — no code generation.

- **Current:** tRPC v11.10 (non-JSON content types, SSE subscriptions, improved RSC support)
- **Approach:** Shared types between client and server (no REST/GraphQL schema)

### Key Patterns
```ts
// server/routers/user.ts
export const userRouter = router({
  getAll: publicProcedure.query(() => prisma.user.findMany()),
  create: protectedProcedure
    .input(z.object({ name: z.string(), email: z.string().email() }))
    .mutation(({ input }) => prisma.user.create({ data: input })),
});

// Client — fully typed, autocomplete on every field
const users = trpc.user.getAll.useQuery();
const createUser = trpc.user.create.useMutation();
```

### Picker_Ang Notes
- Choose when: Fullstack TypeScript, want type safety without schema files
- Avoid when: Public API (tRPC is for internal client-server, not external consumers)

---

## Hono

### Overview
Ultrafast web framework that runs everywhere — Node.js, Deno, Bun, Cloudflare Workers,
Vercel Edge, AWS Lambda. Designed for edge-first development.

- **Current:** Hono 4.12 (28K+ GitHub stars, 2K+ dependents)
- **Bundle:** ~12KB (`hono/tiny` preset, zero dependencies)
- **Performance:** Fastest JS web framework in most benchmarks

### Key Patterns
```ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';

const app = new Hono();
app.use('/api/*', cors());
app.use('/api/protected/*', jwt({ secret: 'mysecret' }));

app.get('/api/health', (c) => c.json({ status: 'ok' }));
```

### Picker_Ang Notes
- Choose when: Edge-first, multi-runtime, ultra-performance, API-only services
- Avoid when: Need full framework features (use Next.js), team unfamiliar

---

## Go

### Overview
Compiled, concurrent systems language. Produces single static binaries. Excellent
for high-throughput microservices, CLI tools, and infrastructure software.

- **Current:** Go 1.24+
- **Approach:** Standard library `net/http` or frameworks (Gin, Echo, Fiber)
- **Concurrency:** Goroutines + channels for effortless parallelism

### Picker_Ang Notes
- Choose when: Maximum throughput, microservices, CLI tools, infrastructure
- Avoid when: Rapid prototyping (slower development cycle), frontend-heavy projects

---

## Rust (Actix / Axum)

### Overview
Memory-safe systems language for the most demanding web services. Zero-cost abstractions,
async runtime (Tokio), compiles to native code or WASM.

- **Current:** Rust 2024 edition, Axum 0.8+
- **Performance:** Fastest possible (no GC, no runtime overhead)

### Picker_Ang Notes
- Choose when: Ultra-performance APIs, security-critical services, WASM targets
- Avoid when: Rapid prototyping, small team (steep learning curve)

---

## Edge Functions

### Overview
Server-side code executed at CDN edge locations — closest to the user.
Sub-millisecond cold starts, global distribution, limited runtime.

### Providers
| Provider | Runtime | Cold Start | Limits |
|----------|---------|-----------|--------|
| **Vercel Edge** | V8 isolates | <1ms | 128MB, 25s |
| **Cloudflare Workers** | V8 isolates | <1ms | 128MB, 30s |
| **Deno Deploy** | Deno runtime | <10ms | Generous |
| **AWS Lambda@Edge** | Node.js | 50-500ms | 50MB, 30s |

### Picker_Ang Notes
- Choose when: Low-latency APIs, personalization, A/B testing, geo-routing
- Avoid when: Long-running tasks, large memory needs, database-heavy operations

---

## TypeScript

### Overview
The language foundation for all A.I.M.S. TypeScript code. Major transition underway.

- **Current:** TypeScript 5.9.3 (stable)
- **Beta:** TypeScript 6.0 (released Feb 11, 2026) — last JavaScript-based release
- **Coming:** TypeScript 7.0 — compiler rewritten in Go, up to 10x faster
- **6.0 Changes:** `target: es5` deprecated (lowest is ES2015), `es2025` target/lib, subpath `#/` imports, Temporal types
- **Note:** No TypeScript 6.1 planned — only 6.0.x patches, then straight to 7.0

### Picker_Ang Notes
- Pin to 5.9.x for production stability today
- Prepare for 6.0 deprecations (especially `es5` target removal)
- The Go-based 7.0 compiler will be a game-changer for large monorepos

---

## Database Layer

### Prisma ORM v7 (A.I.M.S. Default)
Prisma v7 migrated away from Rust — rebuilt in TypeScript. 98% fewer types to evaluate,
70% faster type checking. Config now via `prisma.config.ts`. No more auto-seeding or auto-generate.
Client middleware API removed (use Client Extensions instead). MCP server available for AI dev environments.
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Drizzle ORM (Alternative)
TypeScript-first, SQL-like syntax, lighter than Prisma. v0.45 stable, v1.0 beta available.
7.4KB minified+gzipped, zero dependencies, supports MSSQL in v1 beta.
```ts
const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
```

### Database Options
| Database | Type | Best For | Hosting |
|----------|------|----------|---------|
| **PostgreSQL** | Relational | Production default | Supabase, Neon, Railway |
| **SQLite** | Embedded | Development, edge | Turso (libSQL), local |
| **MySQL** | Relational | WordPress ecosystem | PlanetScale |
| **MongoDB** | Document | Flexible schema | Atlas |
| **Redis** | Key-Value | Caching, sessions, queues | Upstash, self-hosted |

### Picker_Ang Notes
- **A.I.M.S. default:** Prisma v7 + PostgreSQL (production), SQLite (development)
- Choose Drizzle when: Maximum SQL control, smaller bundle, edge/serverless deploys

---

## Backend Comparison Matrix

| Technology | Language | Performance | Learning Curve | Best For |
|-----------|---------|-------------|---------------|----------|
| **Express** | JS/TS | Good | Low | General backend (default) |
| **Next.js Actions** | JS/TS | Good | Low | Fullstack in one |
| **FastAPI** | Python | Good | Low | ML/data backends |
| **tRPC** | TS | Good | Medium | Type-safe fullstack |
| **Hono** | JS/TS | Excellent | Low | Edge-first APIs |
| **Go** | Go | Excellent | Medium | High-throughput services |
| **Rust** | Rust | Best | High | Ultra-performance |

---

## A.I.M.S. Default: Next.js Server Actions + Express

For fullstack builds within Next.js, use **Server Actions** for mutations
and **Route Handlers** for REST APIs. For standalone backend services,
use **Express** on Node.js (existing A.I.M.S. infrastructure).
