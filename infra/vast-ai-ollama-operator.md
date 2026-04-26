# Vast.ai GPU Lane Operator Runbook (Wave 1 Step E)

The chat-lane Vast.ai deploy for the Coastal Brewing CwoaC stack. Two
chat model lanes through one LiteLLM-fronted surface:

| Lane | Where | Model | Surface |
|---|---|---|---|
| Chat (OSS) | Vast.ai instance, Ollama | **Gemma 4 31B Dense** | LiteLLM `model_name: gemma-4-max` |
| Chat (frontier) | Moonshot/Fireworks API | **Kimi K2.6** (1T MoE / 32B active) | LiteLLM `model_name: kimi-k2.6` |

**Scope boundary:** This runbook is **Coastal Brewing's chat-lane**.
Video generation (LTX-2.3, Cosmos-Transfer2.5, Lyra 2.0) is **Broad|Cast
Studio's product** and lives under that platform's deploy plan, not
this one. If Coastal ever needs video, it calls Broad|Cast as a vendor
API — not by co-hosting Broad|Cast's models on Coastal's GPU.

Step E was scope-evaluated by Betty-Anne_Ang 2026-04-26. Layer A +14/+18,
Layer B 27/30, Layer C V.I.B.E. 0.925. Example Leader, cleared.

---

## Prerequisites

- Vast.ai account, payment method, **vastai CLI installed locally** (`pip install vastai`)
- `vastai login` complete with API key
- Owner workstation SSH public key
- LITELLM_MASTER_KEY already provisioned on AIMS Core
- Step D LiteLLM healthy (`docker ps | grep aims-litellm`)
- MOONSHOT_API_KEY (free tier 100K tokens) AND/OR FIREWORKS_API_KEY for Kimi
- Template hash `0df0db4d9bef84e51f3a514bc5a9b96e` confirmed (CUDA + Python + ssh base — owner-supplied)

## Stage 1 — Provision Vast.ai instance via CLI

```bash
vastai create instance --template_hash 0df0db4d9bef84e51f3a514bc5a9b96e \
  --disk 80 \
  --ssh-key "$(cat ~/.ssh/id_ed25519.pub)"
```

80 GB disk fits Gemma 4 31B Dense (~18 GB pull) + workspace + buffer.

VRAM math (32 GB RTX 5090):
- Gemma 4 31B Dense Q4_K_M: ~22 GB resident
- KV cache @ 8K context: ~3 GB
- ~7 GB headroom on 32 GB. Single-model-resident — no swap concerns.

After `vastai create instance`:
```bash
vastai show instances   # find instance public IP + SSH port
```

Add to `~/.ssh/config`:
```
Host vast-gpu
    HostName <vast-public-ip>
    User root
    Port <vast-ssh-port>
    IdentityFile ~/.ssh/id_ed25519
```

## Stage 2 — Bootstrap Ollama + Gemma

```bash
ssh vast-gpu '
  set -euo pipefail
  nvidia-smi | head -10
  curl -fsSL https://ollama.com/install.sh | sh
  systemctl enable --now ollama
  OLLAMA_HOST=0.0.0.0:11434 ollama pull gemma-4-max:31b
  ollama list
'
```

Idempotent — re-running skips installed packages.

## Stage 3 — Network access plane (pick ONE)

### Option E.a — Cloudflare Tunnel (recommended)

```bash
ssh vast-gpu '
  curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  dpkg -i cloudflared.deb
  cloudflared tunnel login
  cloudflared tunnel create coastal-gpu
  cloudflared tunnel route dns coastal-gpu ollama.foai.cloud
'
```

LiteLLM `api_base`: `https://ollama.foai.cloud`

### Option E.b — WireGuard between AIMS Core ↔ Vast.ai

Persistent tunnel, ~30 min setup. Better for 24/7.

### Option E.c — Public Ollama with IP allowlist

```bash
ssh vast-gpu '
  ufw allow from 76.13.96.107 to any port 11434  # AIMS Core
  ufw allow from 31.97.138.45 to any port 11434  # aims-vps
  ufw enable
'
```

⚠ Ollama has no built-in auth. Allowlist is the only protection.
Recommend nginx-bearer-front for any non-trivial use.

## Stage 4 — Register in LiteLLM

Edit `/root/aims/infra/litellm-config.yaml`:

```yaml
model_list:
  # ...existing entries...

  - model_name: gemma-4-max
    litellm_params:
      model: ollama/gemma-4-max:31b
      api_base: <chosen URL from Stage 3>:11434

  - model_name: kimi-k2.6
    litellm_params:
      model: moonshot/kimi-k2.6
      api_base: https://api.moonshot.ai/v1
      api_key: os.environ/MOONSHOT_API_KEY

  - model_name: kimi-k2.6-fireworks
    litellm_params:
      model: fireworks_ai/fireworks/kimi-k2p6
      api_key: os.environ/FIREWORKS_API_KEY

litellm_settings:
  fallbacks:
    # ...existing entries...
    - gemma-4-max: ["openrouter-omnibus"]
    - kimi-k2.6: ["kimi-k2.6-fireworks", "claude-opus-4-7"]
```

Stage `MOONSHOT_API_KEY` and `FIREWORKS_API_KEY` in `/root/aims/infra/.env.production`
via SSH-pipe from openclaw.

Reload:
```bash
ssh root@76.13.96.107 'cd /root/aims/infra && docker compose restart litellm'
```

## Stage 5 — V0–V4 verification

```bash
# (V0) Gemma pulled
ssh vast-gpu 'curl -s http://127.0.0.1:11434/api/tags | jq .models[].name'
# expect: gemma-4-max:31b

# (V1) Direct Ollama completion
ssh vast-gpu 'curl -X POST http://127.0.0.1:11434/api/generate \
  -d "{\"model\":\"gemma-4-max:31b\",\"prompt\":\"reply pong\",\"stream\":false}" | jq .response'

# (V2) Through LiteLLM proxy: Gemma 4
KEY=$(ssh root@76.13.96.107 "grep ^LITELLM_MASTER_KEY= /root/aims/infra/.env.production | cut -d= -f2-")
ssh root@76.13.96.107 "docker exec aims-litellm python3 -c '
import urllib.request, json
body = json.dumps({\"model\":\"gemma-4-max\", \"messages\":[{\"role\":\"user\",\"content\":\"pong\"}]}).encode()
req = urllib.request.Request(\"http://127.0.0.1:4000/v1/chat/completions\", data=body,
  headers={\"Authorization\":\"Bearer $KEY\",\"Content-Type\":\"application/json\"})
print(json.loads(urllib.request.urlopen(req,timeout=60).read())[\"choices\"][0][\"message\"][\"content\"][:200])
'"

# (V3) Through LiteLLM proxy: Kimi K2.6
ssh root@76.13.96.107 "docker exec aims-litellm python3 -c '
import urllib.request, json
body = json.dumps({\"model\":\"kimi-k2.6\", \"messages\":[{\"role\":\"user\",\"content\":\"pong\"}]}).encode()
req = urllib.request.Request(\"http://127.0.0.1:4000/v1/chat/completions\", data=body,
  headers={\"Authorization\":\"Bearer $KEY\",\"Content-Type\":\"application/json\"})
print(json.loads(urllib.request.urlopen(req,timeout=60).read())[\"choices\"][0][\"message\"][\"content\"][:200])
'"

# (V4) Failover: kill Ollama, retry gemma-4-max → openrouter-omnibus picks up
ssh vast-gpu 'systemctl stop ollama'
# Same V2 curl → still returns a completion, from openrouter
```

Per Betty-Anne_Ang's coaching: capture V4 output as the AOF buyer
demonstration (kill GPU mid-request, prove fallback lands within
acceptable latency).

## Stage 6 — Cost controls

Vast.ai dashboard:
- Monthly budget alert: $50 (warning), $100 (hard cap)
- Auto-stop at hard cap

Burn rate (32 GB RTX 5090):
- Episodic 8h/day @ $0.303/hr ≈ $73/mo
- 24/7 ≈ $218/mo

LiteLLM virtual-key per-customer budgets land in Wave 1.5.

## Stage 7 — Tear-down

```bash
vastai destroy instance <instance-id>

# LiteLLM-side: comment out gemma-4-max entry, keep Kimi (Moonshot
# API works regardless of Vast.ai state)
ssh root@76.13.96.107 'cd /root/aims/infra && docker compose restart litellm'
```

Consumers calling `gemma-4-max` after teardown fall through to
`openrouter-omnibus` per the failover rules.

## Why this runbook covers chat ONLY

Wave 1 plan + 2026-04-26 owner directive: **Coastal Brewing's product is
humanless brewing, not video.** Video generation is Broad|Cast Studio's
product — different platform, different deployment plan, different Vast.ai
instance when that platform's deploy thaws (currently a side quest).

If Coastal needs a promo video down the line, it calls Broad|Cast's API
the same way an external customer would — through Broad|Cast's surface,
not by sharing GPU memory.

---

## Owner action gates

1. ✋ Provision authorization (Vast CLI command + template hash confirmed)
2. ✋ Network plane: E.a Cloudflare Tunnel (recommended) / E.b WireGuard / E.c IP allowlist
3. ✋ Burn cap: $50 / $100 / $200 / unlimited
4. ✋ MOONSHOT_API_KEY (free tier covers Wave 1 testing)
5. ✋ Workstation SSH public key for Vast.ai
