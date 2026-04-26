# LiteLLM — Operator Runbook (Wave 1 Step D)

LiteLLM v1.83.7-stable.patch.1 runs on AIMS Core VPS (76.13.96.107) as the central
OpenAI-compatible model gateway. Every downstream consumer (Hermes Agent,
ACHEEVY, AgentScope, ii-agent, AOF children) hits a single URL instead
of bespoke per-provider clients. Failover + cost tracking + key rotation
centralized here.

## Lessons from the 2026-04-26 first deploy

Three corrections discovered during live deploy that the original Step D
PR (#242) didn't catch — folded back into this runbook:

1. **Tag**: original PR pinned `v1.83.4` which doesn't exist as a published
   tag. Verified upstream via `gh api repos/BerriAI/litellm/releases`.
   Canonical post-hack stable is `v1.83.7-stable.patch.1` (published
   2026-04-23). Image SHA: `sha256:95d4bd975e39d33c3d5e0add0439d9a9e40f534ec79b2132133e96b3994d3192`.

2. **Healthcheck tool**: original PR used `wget --spider`, but the v1.83.7
   image has neither `wget` nor `curl` in PATH — only `python3`. Updated
   healthcheck uses `python3 -c "import urllib.request; ..."`.

3. **env_file scope**: original PR used `env_file: - .env.production`,
   which inherits the broader AIMS `DATABASE_URL` pointing at host
   Postgres on `76.13.96.107:5432`. LiteLLM's Prisma migration tried that
   DB and failed (P1001 — not reachable from bridge). Fix: drop
   `env_file`, set explicit env vars only, set `DISABLE_PRISMA_SCHEMA_UPDATE=true`
   and `DATABASE_URL=` empty so LiteLLM runs stateless.

## Why `v1.83.7-stable.patch.1` is the floor

The 2026-03-24 hack exploited an unauthenticated `/config/update`
endpoint to swap model configs and redirect provider traffic to attacker
endpoints (often exfiltrating prompts/PII in the process). v1.83.7-stable.patch.1 is
the first stable patch release after upstream's hardening pass. We pin
specific patches, never `:latest` or `:main`.

## Pre-deploy: pin SHA + cosign verify

```bash
ssh aims-vps-core
docker pull ghcr.io/berriai/litellm:v1.83.7-stable.patch.1
docker inspect ghcr.io/berriai/litellm:v1.83.7-stable.patch.1 --format '{{.Id}}'
# record the SHA — paste into PR description for audit
```

If cosign is installed and upstream signs releases:
```bash
cosign verify ghcr.io/berriai/litellm:v1.83.7-stable.patch.1 \
  --certificate-identity-regexp '.*berri.*' \
  --certificate-oidc-issuer-regexp '.*github.*'
```

(Skip cosign verify if upstream isn't yet signing; document the gap.)

## Pre-deploy: env file

`infra/.env.production` on AIMS Core VPS must have:

```bash
LITELLM_MASTER_KEY=<32-byte hex, fresh per deploy>
ANTHROPIC_API_KEY=<from openclaw on myclaw>
OPENAI_API_KEY=<from openclaw on myclaw>
GEMINI_API_KEY=<from openclaw on myclaw>
OPENROUTER_API_KEY=<from openclaw on myclaw>
```

Generate the master key:
```bash
openssl rand -hex 32
```

Pull provider keys via SSH pipe (never lands on local disk):
```bash
ssh myclaw-vps "docker exec openclaw-sop5-openclaw-1 printenv Anthropic_API_Key" \
  | ssh aims-vps-core 'VAL=$(cat); echo "ANTHROPIC_API_KEY=$VAL" >> ~/AIMS/infra/.env.production'
```
(Repeat for OpenAI, Gemini, OpenRouter.)

## Pre-deploy: operator IP allowlist for /config/update

Edit `infra/nginx/conf.d/litellm.foai.cloud.conf`:

```nginx
geo $config_update_blocked {
    default 1;
    203.0.113.42 0;   # <- replace with your workstation public IP
}
```

Find your IP: `curl https://api.ipify.org`

If you don't want a public allowlist (recommended), leave the geo block
default-deny. `/config/update` then becomes SSH-only — edit the config
file and `docker compose restart litellm`.

## First-time deploy

```bash
ssh aims-vps-core
cd ~/AIMS

# Pull latest main (this PR + downstream changes)
git pull origin main

# Build cert for litellm.foai.cloud (only if first deploy)
sudo certbot certonly --webroot -w /var/www/certbot \
  -d litellm.foai.cloud --email acheevy@aimanagedsolutions.cloud \
  --agree-tos --non-interactive

# Bring up just litellm
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.production \
  up -d litellm

# Reload nginx to pick up the new conf.d file
docker compose -f infra/docker-compose.prod.yml exec nginx nginx -s reload
```

## V0–V7 verification chain

```bash
# (V0) Image SHA matches what we pinned
docker inspect ghcr.io/berriai/litellm:v1.83.7-stable.patch.1 --format '{{.Id}}'

# (V1) Container healthy, master key required
docker compose -f infra/docker-compose.prod.yml ps litellm | grep healthy
docker exec aims-litellm wget -qO- http://127.0.0.1:4000/health/liveliness
# expect: {"status":"healthy"}

# (V2) Models registered
curl -s http://litellm.foai.cloud/v1/models \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" | jq '.data | length'
# expect: ≥ 8 (claude×3 + gpt×2 + gemini×2 + openrouter)

# (V3) Auth required (anonymous calls rejected)
curl -i -X POST http://litellm.foai.cloud/v1/chat/completions \
  -d '{"model":"claude-opus-4-7","messages":[{"role":"user","content":"ping"}]}'
# expect: 401

# (V4) Authenticated request succeeds
curl -s -X POST http://litellm.foai.cloud/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -d '{"model":"claude-opus-4-7","messages":[{"role":"user","content":"reply with one word"}]}' \
  | jq '.choices[0].message.content'
# expect: a one-word completion

# (V5) /config/update BLOCKED at nginx (the 2026-03-24 hack vector)
curl -i https://litellm.foai.cloud/config/update
# expect: 444 (closed connection — NOT 200, 401, or 403)

# (V6) X-Forwarded-For spoofing does not bypass the geo block
curl -i https://litellm.foai.cloud/config/update -H "X-Forwarded-For: 1.2.3.4"
# expect: 444 still — geo reads $remote_addr (peer IP), not headers

# (V7) Fleet consumer reaches LiteLLM
ssh aims-vps "docker exec hermes wget -qO- \
  --header='Authorization: Bearer $LITELLM_MASTER_KEY' \
  http://litellm.foai.cloud/v1/models | head -c 200"
# expect: model list returned (not 444 / not 401)
```

## Rotate master key

Quarterly minimum, or on any suspicion of leak:

```bash
NEW_KEY=$(openssl rand -hex 32)
sed -i "s|^LITELLM_MASTER_KEY=.*|LITELLM_MASTER_KEY=$NEW_KEY|" infra/.env.production
docker compose -f infra/docker-compose.prod.yml restart litellm

# Then update every downstream consumer's key:
#   - Hermes Agent on aims-vps (LITELLM_MASTER_KEY env)
#   - ACHEEVY (ACHEEVY_BRAIN.md model lane secret)
#   - ii-agent (LITELLM_MASTER_KEY env)
#   - AOF customers (notify in advance)
```

## Add a new model lane

Edit `infra/litellm-config.yaml`:

```yaml
model_list:
  - model_name: <stable-name-downstream-consumers-use>
    litellm_params:
      model: <provider/model-id>
      api_key: os.environ/<KEY_VAR>
```

Then:
```bash
docker compose -f infra/docker-compose.prod.yml restart litellm
# Verify: curl /v1/models, confirm new model_name appears
```

(LiteLLM ALSO supports `/config/update` for hot-reload, but our nginx
returns 444 on that path. SSH-only edits + restart is the discipline.)

## Step E hand-off — Vast.ai Ollama

When Step E provisions the Vast.ai instance, uncomment the
`gpt-oss-20b` block in `litellm-config.yaml` and set the api_base to
the Vast.ai instance's IP. No code changes anywhere downstream — every
consumer that already calls `/v1/chat/completions` with model
`gpt-oss-20b` immediately reaches the new backend.

## Rollback

```bash
docker compose -f infra/docker-compose.prod.yml stop litellm
docker compose -f infra/docker-compose.prod.yml rm -f litellm
```

Downstream consumers fall back to direct provider clients (Hermes uses
its `OPENROUTER_API_KEY` env, ACHEEVY uses its existing model bindings).
LiteLLM's "central swap point" claim degrades to "Wave 1 was a try"
without breaking anything in the running fleet.
