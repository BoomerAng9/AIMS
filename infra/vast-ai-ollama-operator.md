# Vast.ai GPU Lane Operator Runbook (Wave 1 Step E — REVISED)

The OSS GPU lane for the FOAI/AOF stack. Three model lanes, one Vast.ai
instance, one LiteLLM-fronted chat surface, one direct video adapter:

| Lane | Where | Model | Surface |
|---|---|---|---|
| Chat (OSS) | Vast.ai instance, Ollama | **Gemma 4 31B Dense** | LiteLLM `model_name: gemma-4-max` |
| Chat (frontier) | Moonshot/Fireworks API | **Kimi K2.6** (1T MoE / 32B active) | LiteLLM `model_name: kimi-k2.6` |
| Video gen | Same Vast.ai instance | **LTX-2.3** (Lightricks audio-video DiT) | Direct adapter — NOT in LiteLLM (job/poll/download shape, not OpenAI-compat) |

Step E was scope-evaluated by Betty-Anne_Ang 2026-04-26 (revised after
owner specified Gemma + Kimi K2.6 + LTX-2.3 mix). Layer A +15/+18,
Layer B 27/30, Layer C V.I.B.E. 0.925. Example Leader, cleared.

---

## Prerequisites

- Vast.ai account, payment method, **vastai CLI installed locally** (`pip install vastai`)
- `vastai login` complete with API key
- Owner workstation SSH public key
- LITELLM_MASTER_KEY already provisioned on AIMS Core
- Step D LiteLLM healthy (`docker ps | grep aims-litellm`)
- MOONSHOT_API_KEY (free tier 100K tokens) OR FIREWORKS_API_KEY for Kimi
- Template hash `0df0db4d9bef84e51f3a514bc5a9b96e` confirmed (CUDA + Python + ssh base — owner-supplied)

## Stage 1 — Provision Vast.ai instance via CLI

```bash
vastai create instance --template_hash 0df0db4d9bef84e51f3a514bc5a9b96e \
  --disk 200 \
  --ssh-key "$(cat ~/.ssh/id_ed25519.pub)"
```

200 GB disk fits Gemma 4 31B Dense (~18 GB) + LTX-2.3 weights (~12 GB)
+ workspace + buffer.

VRAM math (one instance, 32 GB RTX 5090):
- Gemma 4 31B Dense Q4_K_M: ~22 GB resident when active
- LTX-2.3: ~10-12 GB resident when active
- Concurrent residence (~32+ GB) is **tight** — recommend model-swap-on-demand
- Cold-swap latency: ~30s per workload switch
- Alternative: 48 GB A6000 instance (~$0.5/hr, both resident concurrently)

After `vastai create instance` returns, capture the new instance id and:
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

## Stage 2 — Bootstrap Ollama + Gemma + LTX-2.3

```bash
ssh vast-gpu '
  set -euo pipefail

  # GPU sanity
  nvidia-smi | head -10

  # ---- Ollama install + Gemma pull ----
  curl -fsSL https://ollama.com/install.sh | sh
  systemctl enable --now ollama
  OLLAMA_HOST=0.0.0.0:11434 ollama pull gemma-4-max:31b
  ollama list

  # ---- LTX-2.3 install ----
  apt-get update && apt-get install -y python3.12-venv git ffmpeg
  pip install --upgrade uv huggingface_hub
  cd /opt
  git clone https://github.com/Lightricks/LTX-2 ltx
  cd ltx && uv sync
  source .venv/bin/activate
  huggingface-cli download Lightricks/LTX-2.3 --local-dir /opt/ltx/weights

  # Start LTX HTTP server (FastAPI shim — see Stage 4 adapter)
  # For Wave 1, runs as a systemd service binding 127.0.0.1:8000
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
  cloudflared tunnel create gpu-vast
  cloudflared tunnel route dns gpu-vast ollama.foai.cloud
  cloudflared tunnel route dns gpu-vast ltx.foai.cloud
  # Run as service, multi-hostname config
'
```

### Option E.b — WireGuard between AIMS Core ↔ Vast.ai

Persistent tunnel, ~30 min setup. Better for 24/7.

### Option E.c — Public ports with IP allowlist

```bash
ssh vast-gpu '
  ufw allow from 76.13.96.107 to any port 11434  # Ollama from AIMS Core
  ufw allow from 31.97.138.45 to any port 11434  # Ollama from aims-vps
  ufw allow from 76.13.96.107 to any port 8000   # LTX from AIMS Core
  ufw enable
'
```

⚠ Ollama has no built-in auth. Allowlist is the only protection. Recommend
nginx-bearer-front for any non-trivial use.

## Stage 4 — Register in LiteLLM

Edit `/root/aims/infra/litellm-config.yaml` and add THREE entries:

```yaml
model_list:
  # ...existing entries...

  # Gemma 4 via Vast.ai-hosted Ollama
  - model_name: gemma-4-max
    litellm_params:
      model: ollama/gemma-4-max:31b
      api_base: <chosen URL from Stage 3>:11434

  # Kimi K2.6 via Moonshot API (NOT hosted — frontier 1T MoE)
  - model_name: kimi-k2.6
    litellm_params:
      model: moonshot/kimi-k2.6
      api_base: https://api.moonshot.ai/v1
      api_key: os.environ/MOONSHOT_API_KEY

  # Optional Fireworks fallback for Kimi if Moonshot rate-limits
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

Stage `MOONSHOT_API_KEY` and `FIREWORKS_API_KEY` in
`/root/aims/infra/.env.production` via SSH-pipe from openclaw.

Reload:
```bash
ssh root@76.13.96.107 'cd /root/aims/infra && docker compose restart litellm'
```

## Stage 5 — LTX-2.3 video adapter (NOT LiteLLM)

Video gen is a job/poll/download shape, not OpenAI-compat. Lives as a
direct adapter in `coastal-brewing/adapters/ltx_video.py`. Surface:

```python
from coastal-brewing.adapters.ltx_video import (
    submit_video_job, poll_status, download_when_ready
)

job_id = submit_video_job(prompt="...", duration_s=10, audio=True)
result = await poll_status(job_id)  # blocks until done or fails
mp4_path = download_when_ready(job_id, target_dir="/data/video/")
```

Full adapter implementation lands as a separate PR after this runbook
merges (Betty-Anne_Ang's coaching note: "video gen has different failure
modes than chat — run it through its own scope-eval gate, don't fold it
under Step E").

## Stage 6 — V0–V5 verification

```bash
# (V0) Three models pulled / configured
ssh vast-gpu 'curl -s http://127.0.0.1:11434/api/tags | jq .models[].name'
# expect: gemma-4-max:31b
ssh vast-gpu 'ls /opt/ltx/weights/' | grep -i ltx
# expect: LTX-2.3 weight files present

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

# (V4) Failover demonstration: kill Ollama, retry gemma-4-max → openrouter-omnibus picks up
ssh vast-gpu 'systemctl stop ollama'
# Same V2 curl → should still return a completion (from openrouter)

# (V5) LTX video gen smoke (after adapter PR merges):
ssh vast-gpu 'cd /opt/ltx && source .venv/bin/activate && python -m ltx generate \
  --prompt "a coastal coffee shop, morning light" --duration 5 --output /tmp/smoke.mp4'
# expect: /tmp/smoke.mp4 produced, valid mp4 by ffprobe
```

## Stage 7 — Cost controls

Vast.ai dashboard:
- Monthly budget alert: $50 (warning), $100 (hard cap)
- Auto-stop at hard cap

Burn rate (single 32 GB RTX 5090 instance):
- Episodic 8h/day @ $0.303/hr = ~$73/mo
- 24/7 = ~$218/mo
- 48 GB A6000 alternative: ~$0.5/hr × 24/7 = ~$365/mo

LiteLLM virtual-key per-customer budgets land in Wave 1.5.

## Stage 8 — Tear-down

```bash
vastai destroy instance <instance-id>
```

LiteLLM-side:
```bash
# Comment out gemma-4-max + kimi-k2.6 entries in litellm-config.yaml
ssh root@76.13.96.107 'cd /root/aims/infra && docker compose restart litellm'
```

Consumers calling `gemma-4-max` after teardown fall through to
`openrouter-omnibus` per the failover rules. Kimi K2.6 keeps working
via Moonshot API directly (it was never on Vast.ai).

## What's the same as before

- Three network plane options (E.a Cloudflare Tunnel recommended)
- LiteLLM failover discipline preserved
- 5 owner approval gates
- Cost monitoring + tear-down clean exit

## What's different from the original runbook

| Was | Now |
|---|---|
| Web console provision | `vastai create instance --template_hash` CLI |
| Gemma + Nemotron + qwen2.5 | Gemma + Kimi K2.6 (API) + LTX-2.3 (video) |
| Single workload type (chat) | Two workload types (chat + video) |
| All models in LiteLLM | Chat in LiteLLM; video in separate adapter |
| 80 GB disk | 200 GB disk (LTX weights ~12 GB extra) |
