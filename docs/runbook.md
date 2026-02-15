# LUC Runbook

## Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install dependencies
cd frontend
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required variables:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET=<generate-random-secret>
```

## Database

### Run Migrations

```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

### Reset Database

```bash
npx prisma migrate reset
```

### View Data

```bash
npx prisma studio
```

## Testing

### Run All Tests

```bash
npm test
```

### Run LUC Tests

```bash
npm run test:luc
```

### Run Preset Tests

```bash
npm run test:luc:presets
```

## API Endpoints

### Check Can Execute
```bash
curl -X POST http://localhost:3000/api/luc/can-execute \
  -H "Content-Type: application/json" \
  -d '{"workspaceId":"test","serviceKey":"llm_tokens_in","units":100}'
```

### Get Summary
```bash
curl "http://localhost:3000/api/luc/summary?workspaceId=test"
```

### Record Usage
```bash
curl -X POST http://localhost:3000/api/luc/record \
  -H "Content-Type: application/json" \
  -d '{"workspaceId":"test","serviceKey":"llm_tokens_in","units":100}'
```

## Evidence

### Location
Evidence artifacts are stored in:
```
/evidence/<gate-name>/<timestamp>/
```

### Gates
- `lint` - ESLint check
- `format` - Prettier check
- `test:unit` - Unit tests
- `test:integration` - Integration tests
- `security:deps` - Dependency audit
- `security:secrets` - Secret scanning
- `smoke` - Smoke tests

### View Evidence
Navigate to `/admin/evidence` in the UI (requires admin role).

## Troubleshooting

### Database Connection Failed
- Check DATABASE_URL in .env.local
- Ensure Prisma client is generated: `npx prisma generate`
- Run migrations: `npx prisma migrate dev`

### LUC Account Not Found
- Accounts are auto-created on first API call
- Check workspace ID is correct
- Verify authentication is working

### Quota Exceeded
- Check current usage via /api/luc/summary
- Review plan limits in policy storage
- Consider plan upgrade or usage credit

### Preset Calculation Errors
- Check formula syntax in formulas.json
- Verify all input fields have values
- Check for circular dependencies in formulas

## Monitoring

### Key Metrics
- Usage events per minute
- Quota utilization by service
- API response times
- Error rates

### Alerts
- Quota exceeded events
- API error rate > 1%
- Response time > 1s

## Backup and Recovery

### Database Backup
```bash
# SQLite
cp frontend/prisma/dev.db frontend/prisma/dev.db.backup

# PostgreSQL (production)
pg_dump $DATABASE_URL > backup.sql
```

### Policy Rollback
1. Go to /admin/policy
2. View version history
3. Select target version
4. Click "Rollback"
5. Confirm with reason

## Contact

For issues, create a GitHub issue at:
https://github.com/BoomerAng9/AIMS/issues
