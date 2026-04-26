# Vast.ai Ollama Operator Runbook (Wave 1 Step E)

The OSS GPU lane for the FOAI/AOF stack. Ollama runs on a Vast.ai-rented
instance hosting Gemma 4 31B Dense and Nemotron-Nano-30B-A3B. Registered
as one entry in LiteLLM's `model_list` so any consumer (Hermes, ACHEEVY,
chicken-hawk gateway, AOF children) reaches OSS models via the same
`http://litellm.foai.cloud/v1/chat/completions` URL.

Step E was scope-evaluated by Betty-Anne_Ang 2026-04-26 (Layer A +14/+18,
Layer B 27/30, Layer C V.I.B.E. 0.925) — Example Leader, cleared.
Owner-action gates: provision authorization, network plane choice, burn
cap, SSH key handoff.

---

## Prerequisites

- Vast.ai account with payment method on file
- Owner workstation SSH public key (~/.ssh/id_ed25519.pub or similar)
- LITELLM_MASTER_KEY already provisioned at `/root/aims/infra/.env.production`
- Step D LiteLLM running healthy on AIMS Core (`docker ps | grep aims-litellm`)

## Stage 1 — Provision Vast.ai instance

Recommended target: **#35475259** (1× RTX 5090, 32 GB VRAM, California, $0.303/hr).

VRAM math (verified):
- Gemma 4 31B Dense @ Q4_K_M: ~22 GB weights + ~3 GB KV cache @ 8K context = ~25 GB
- Nemotron-Nano-30B-A3B @ Q4_K_M: ~20 GB (MoE — 3B active params)
- Headroom on 32 GB: ~7-10 GB
- One-model-at-a-time pattern fits cleanly

Provision via Vast.ai web console OR CLI:
```bash
vastai create instance 35475259 \
  --image ollama/ollama:0.21.0 \
  --disk 80 \
  --env "OLLAMA_HOST=0.0.0.0" \
  --ssh-key "$(cat ~/.ssh/id_ed25519.pub)"
```

Record the assigned public IP and SSH port. Add to your `~/.ssh/config`:
```
Host vast-ai-ollama
    HostName <vast-public-ip>
    User root
    Port <vast-ssh-port>
    IdentityFile ~/.ssh/id_ed25519
```

## Stage 2 — Bootstrap Ollama + pre-pull models

```bash
ssh vast-ai-ollama '
  # Verify GPU available
  nvidia-smi | head -10

  # Ollama daemon is running from the image entrypoint; confirm
  curl -s http://127.0.0.1:11434/api/version

  # Pre-pull the three models (~38 GB total download, ~15 min)
  ollama pull gemma-4-max:31b
  ollama pull nemotron-nano:30b-a3b
  ollama pull qwen2.5:7b   # small fallback for warm-restart sanity

  # Verify
  ollama list
'
```

## Stage 3 — Network access plane (pick ONE)

Owner must pick one of these three at provision time:

### Option E.a — Cloudflare Tunnel (recommended)

Zero open ports, OAuth-gated, free for low traffic. Best for episodic use.

```bash
ssh vast-ai-ollama '
  curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  dpkg -i cloudflared.deb
  cloudflared tunnel login   # opens browser on workstation for OAuth
  cloudflared tunnel create ollama-vast
  cloudflared tunnel route dns ollama-vast ollama.foai.cloud
  cloudflared tunnel --url http://127.0.0.1:11434 run ollama-vast
'
```

DNS A-record `ollama.foai.cloud` → CF tunnel target (added by `cloudflared tunnel route dns`).

LiteLLM `api_base`: `https://ollama.foai.cloud`

### Option E.b — WireGuard between AIMS Core ↔ Vast.ai

Persistent tunnel between the two boxes. Higher operator burden; better for 24/7.

```bash
# On AIMS Core (76.13.96.107)
apt install -y wireguard
wg genkey | tee /etc/wireguard/aims-core.key | wg pubkey > /etc/wireguard/aims-core.pub
# Configure /etc/wireguard/wg0.conf with peer = vast-ai-ollama public key
systemctl enable --now wg-quick@wg0

# On Vast.ai
# Symmetric config
```

LiteLLM `api_base`: `http://10.13.13.2:11434` (WireGuard internal IP for vast-ai)

### Option E.c — Public Ollama with IP allowlist

Simplest. Open port 11434 on Vast.ai's firewall, allow ONLY AIMS Core's IP.

```bash
ssh vast-ai-ollama '
  apt install -y ufw
  ufw default deny incoming
  ufw allow from <YOUR_WORKSTATION_IP> to any port 22
  ufw allow from 76.13.96.107 to any port 11434
  ufw enable
'
```

LiteLLM `api_base`: `http://<vast-public-ip>:11434`

⚠ This option exposes Ollama publicly with no auth (Ollama has no built-in
auth). The IP allowlist is the only protection. Recommend nginx-in-front
with bearer auth before any non-trivial use.

## Stage 4 — Register in LiteLLM

Edit `/root/aims/infra/litellm-config.yaml` and uncomment the `gpt-oss-20b`
block, plus add Gemma 4 + Nemotron-Nano entries:

```yaml
model_list:
  # ... existing entries ...

  - model_name: gemma-4-max
    litellm_params:
      model: ollama/gemma-4-max:31b
      api_base: <chosen api_base from Stage 3>

  - model_name: nemotron-nano
    litellm_params:
      model: ollama/nemotron-nano:30b-a3b
      api_base: <chosen api_base from Stage 3>

  - model_name: gpt-oss-20b   # alias used by AOF Tier-Pro buyers
    litellm_params:
      model: ollama/gemma-4-max:31b
      api_base: <chosen api_base from Stage 3>

litellm_settings:
  fallbacks:
    # ... existing entries ...
    - gemma-4-max: ["openrouter-omnibus"]      # OSS down → OpenRouter
    - nemotron-nano: ["openrouter-omnibus"]    # same
    - gpt-oss-20b: ["openrouter-omnibus"]      # AOF buyer-facing fallback
```

Reload LiteLLM:
```bash
ssh root@76.13.96.107 'cd /root/aims/infra && docker compose restart litellm'
```

## Stage 5 — V0–V5 verification

```bash
# (V0) Vast.ai instance up + 3 models pulled
ssh vast-ai-ollama 'curl -s http://127.0.0.1:11434/api/tags | jq .models[].name'
# expect: gemma-4-max:31b, nemotron-nano:30b-a3b, qwen2.5:7b

# (V1) Direct Ollama completion
ssh vast-ai-ollama 'curl -X POST http://127.0.0.1:11434/api/generate \
  -d "{\"model\":\"gemma-4-max:31b\",\"prompt\":\"reply pong\",\"stream\":false}" | jq .response'

# (V2) Through LiteLLM proxy (from AIMS Core)
ssh root@76.13.96.107 '
  KEY=$(grep ^LITELLM_MASTER_KEY= /root/aims/infra/.env.production | cut -d= -f2-)
  docker exec aims-litellm python3 -c "
import urllib.request, json
body = json.dumps({\"model\":\"gemma-4-max\", \"messages\":[{\"role\":\"user\",\"content\":\"reply pong\"}]}).encode()
req = urllib.request.Request(\"http://127.0.0.1:4000/v1/chat/completions\", data=body,
  headers={\"Authorization\":\"Bearer \"+'\"\"$KEY\"'\"',\"Content-Type\":\"application/json\"})
print(json.loads(urllib.request.urlopen(req,timeout=60).read())[\"choices\"][0][\"message\"][\"content\"][:200])
"
'

# (V3) Failover: kill Ollama, retry — should land on openrouter-omnibus
ssh vast-ai-ollama 'pkill -f ollama'
# Same V2 curl → should still return a response, but from OpenRouter

# (V4) Cost monitoring alert configured (manual verify in Vast.ai dashboard)

# (V5) Cross-VPS — chicken-hawk gateway can call gemma via litellm.foai.cloud
ssh myclaw-vps '
  docker exec chicken-hawk-hawk-gateway-1 python -c "
import urllib.request, json, os
key = os.environ[\"LITELLM_API_KEY\"]
body = json.dumps({\"model\":\"gemma-4-max\", \"messages\":[{\"role\":\"user\",\"content\":\"ping\"}]}).encode()
req = urllib.request.Request(os.environ[\"LITELLM_BASE_URL\"]+\"/chat/completions\", data=body,
  headers={\"Authorization\":\"Bearer \"+key, \"Content-Type\":\"application/json\"})
print(json.loads(urllib.request.urlopen(req,timeout=60).read())[\"model\"])
"
'
# expect: gemma-4-max
```

Per Betty-Anne_Ang's coaching note: **V3 (failover when Ollama dies)
becomes the AOF buyer demonstration**. Capture a screenshot of the
trace ID landing on openrouter-omnibus and store in
`~/iCloudDrive/ACHIEVEMOR_/Projects_/The Deploy Platform_/Claude Code/`.

## Stage 6 — Cost controls

In Vast.ai dashboard:
- Monthly budget alert: $50 (warning), $100 (hard cap)
- Auto-stop at hard cap

In LiteLLM (Wave 1.5 — requires virtual key generation):
- Per-virtual-key `max_budget` for AOF Tier-Pro customers using OSS lane
- Per-virtual-key `models` allowlist (Tier-1 free buyers don't get gpt-oss-20b)

## Stage 7 — Tear-down

```bash
ssh vast-ai-ollama 'shutdown -h now'   # graceful
# Then in Vast.ai dashboard: destroy instance to stop billing
```

LiteLLM-side cleanup:
```bash
ssh root@76.13.96.107 '
  cd /root/aims/infra
  # Comment out gemma-4-max, nemotron-nano, gpt-oss-20b entries in litellm-config.yaml
  docker compose restart litellm
'
```

Consumers calling `gemma-4-max` after teardown will fall through to
openrouter-omnibus per the failover rules — no code changes required.

## Operational notes

- **Cold start**: First request to a freshly-pulled model takes ~30-60s as Ollama loads weights into VRAM. Subsequent requests are fast (<2s for 1024-token reply on Gemma 4 31B Dense).
- **Episodic burn rate**: 8h/day at $0.303/hr ≈ $73/mo. 24/7 ≈ $218/mo. Vast.ai allows pause/resume with state preservation; bill only when running.
- **Model swap**: To change models, edit `litellm-config.yaml` model_list entries, restart LiteLLM. Ollama can host as many models as fit on disk; switch happens at request-time based on `model_name`.
- **Multi-instance scale**: Wave 2 — when concurrent multi-tenant load justifies, provision a second Vast.ai instance and add it as a parallel entry in `model_list` for the same `model_name`. LiteLLM round-robins.
