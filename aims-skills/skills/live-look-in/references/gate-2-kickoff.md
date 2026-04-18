# Gate 2 — Kickoff Brief

**Entry criteria met:** Gate 0, 1, 1.5, 1.6 ✓
**Starts:** 2026-04-18
**Drafted by:** Claude Opus 4.7 (1M context) during the groundwork session

---

## Gate 2 in one sentence

Build the thinnest vertical slice that takes one canned CRUCIBLE event from intake to a final MP4 delivered via Puter.fs, exercising every edge of the pipeline audit (E1–E11) with the simplest acceptable implementation at each stage.

## Scope (what Gate 2 is)

1. **Event Translator module** — first code deliverable. Python class that takes a CRUCIBLE event envelope (`{ event_id, event_type, payload, cast_hints[] }`) and emits the downstream action shape (`{ narrative, cast[], scene_hint, verb, camera_intent }`). Contract per Gate 1.6 audit edge E1/E2/E7.
2. **Proxy-World shortcut** — skip Project Lyra for the dry-run. Hand-author ONE control bundle (depth EXR + Canny PNG + camera pose JSON) for the Night Port scene. Wire it in as a fixture, not a module.
3. **Cosmos-Transfer2.5 NIM on GCP Cloud Run GPU (L4)** — stand up the first NIM container behind a REST endpoint. Input: control bundle + prompt. Output: photoreal frame sequence.
4. **Character motion via Seedance 2.0 i2v (fal.ai)** — using Port_Ang's newly-rendered canonical portrait (`/agents/port-ang.png`) as the subject-preserving reference, generate one short character clip with alpha channel.
5. **Remotion + FFmpeg composite** — server-side render stitches the environment + character into one MP4.
6. **Puter.fs upload** — final MP4 lands in Puter cloud storage. URL is the deliverable.
7. **Puter-native app shell (MINIMUM VIABLE)** — one Puter window with a `<video>` element. No Pro Mode / Lite Mode yet — that comes at Gate 2.5 or wait-for-Gate-3.

## Out of scope for Gate 2 (deliberately)

- Project Lyra / full headless 3D Proxy World Engine
- Live WebRTC streaming (MP4 from R2/Puter.fs via `<video>` only)
- daVinci-MagiHuman talking-head path
- Real-ESRGAN / AuraSR upscale (skip; use 1080p native Cosmos output)
- Real CRUCIBLE event ingestion (use a fixture)
- Backend orchestrator with Celery/Redis (one Python script driving the chain is enough)
- Pro Mode multi-window UI
- Lite Mode onboarding flow
- Billing / GPU-hour metering
- Multi-tenant isolation

Everything deferred lands at Gate 3+.

## The first file to write

`aims-core/backend/uef-gateway/src/operations-floor/event-translator.py`

Initial contract:

```python
from dataclasses import dataclass
from typing import Literal

@dataclass
class TranslatedEvent:
    narrative: str              # prompt-ready text for Seedance
    cast: list[str]             # ["port_ang", "acheevy", ...]
    scene_hint: str             # "night-port" | "conference" | ...
    verb: Literal[
        "dispatching", "typing", "walking",
        "consulting", "verdict",
    ]
    camera_intent: dict         # { orbit: bool, dolly_in: bool, ... }

def translate_crucible_event(event: dict) -> TranslatedEvent:
    """
    Planner / Generator / Judge_Hawk event → canonical action shape
    the downstream stages can consume.
    """
    ...
```

Start with three event types: `planner.dispatch`, `generator.tool_call`, `judge_hawk.verdict`. Those are the minimum that produce visibly distinct actions in the Operations Floor.

## Gate 2 exit criteria

One end-to-end dry run:

1. Feed a hard-coded `planner.dispatch` event to the Event Translator
2. Feed its output to a canned Night Port control bundle
3. Feed the bundle to Cosmos-Transfer2.5 → environment frames
4. In parallel, feed `port-ang.png` + the verb + camera_pose to Seedance 2.0 i2v → character clip with alpha
5. Composite both via Remotion
6. Encode to MP4 via FFmpeg
7. Upload to Puter.fs
8. Play the MP4 in a minimal Puter-native window

If that plays as a watchable ~5–10s clip showing Port_Ang dispatching a mission in the Night Port — Gate 2 is green. Gate 3 adds Project Lyra, the real backend orchestrator (FastAPI + Celery + Redis), Pro/Lite UI, and the live event stream from CRUCIBLE.

## Risks to watch

- **Cosmos-Transfer2.5 NIM availability:** at recon time the public NIM catalog showed Predict1. If a Transfer2.5 NIM isn't yet published, fall back to cloning the Apache-2 source from `github.com/nvidia-cosmos/cosmos-transfer1` (likely has a v2.5 branch by now) and building our own container.
- **Seedance 2.0 alpha-channel quality:** if the i2v output has halo/edge artifacts on Port_Ang's helmet, fall back to Open Higgsfield self-hosted. Budget $0.08 for two A/B test runs.
- **Puter.fs upload SDK quirks:** plan a half-session learning curve. See `puter.js` docs at puter.com for the client API.

## References

- `vertical-run-a-company-3d-engagement.md` — full build spec and extended-stack table
- `gate-1.6-pipeline-audit.md` — 11-stage diagram + E1–E11 data contracts
- `characters/port_ang.md` — Port_Ang bible (reference image for Seedance i2v)
- `characters/luc.md` — LUC bible (second-wave character, not in Gate 2 dry-run)
- `extended-stack-nvidia-research-2026-04-18.txt` — the research brief that shaped the full pipeline
- Iller_Ang skill `references/seedance-video.md` — fal.ai API usage patterns for Stage 2 + Stage 6

## What the next session should start with

Open this doc. Read the three E-edges (E1, E2, E7) in `gate-1.6-pipeline-audit.md`. Write `event-translator.py` against those contracts with three handler branches. Unit-test each handler against a canned event fixture. Then move to the canned Night Port control bundle.

Everything else waits.
