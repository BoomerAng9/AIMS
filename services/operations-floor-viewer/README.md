# Operations Floor Viewer — Gate 2.f MVP

Static single-page Puter-native app that plays back the composed
3D Operations Floor MP4 for the **Run a Company, Without the Company**
vertical. Closes Gate 2's dry-run loop: CRUCIBLE event →
Translator → Seedance pre-viz → Cosmos environment → Seedance
character → Compositor → Puter.fs → **this viewer**.

---

## Files

- `index.html` — single HTML file. CSP-locked (no third-party scripts,
  no network fetches beyond Google Fonts + known video origins).
  Resolves a video source from `?src=` or `window.PUTER_SRC`, renders
  a brand-coherent `<video>` player. If a future Gate-3 feature needs
  the Puter SDK (auth-gated file playback, cross-app messaging),
  reintroduce `<script src="https://js.puter.com/v2/">` alongside a CSP
  update that adds `js.puter.com` to `script-src`.

## Source resolution order

1. `?src=<url>` query string (most common — the Puter client upload
   returns a public URL, and the orchestrator passes it via query
   string when launching the viewer)
2. `window.PUTER_SRC = "<url>"` (set before `index.html` parses —
   useful when the viewer is embedded inside another Puter app)
3. Empty-state panel prompting for the parameter

## Deploy (three options, all work)

### Option A — Puter-native app (canonical for this vertical)

```bash
# From an authenticated Puter CLI session
puter app create --name operations-floor-viewer --dir services/operations-floor-viewer
puter app deploy operations-floor-viewer
# Viewer URL: https://operations-floor-viewer.puter.com
```

### Option B — Firebase Hosting (cheap, CDN-fronted)

```bash
firebase deploy --only hosting:operations-floor-viewer
# Mount services/operations-floor-viewer as a public directory in firebase.json
```

### Option C — direct open

`index.html` is a single file with no build step. Opens directly from
disk or any static host. Zero third-party scripts load (Puter SDK is
intentionally not included — see the Files section above for why).

## Launch URL shape

```
https://operations-floor-viewer.puter.com/?src=<PUBLIC_MP4_URL>
```

The public MP4 URL comes from `uploadComposedClip()` in
`backend/uef-gateway/src/operations-floor/puter-client.ts` (return
field `publicPlaybackUrl`).

## Brand canon

Uses the locked Deploy palette and typography:
- Background: `#0A0A0A` with warm-gold radial glow
- Accent warm: `#E8A020` (sodium-lamp gold)
- Accent cool: `#06B6D4` (cyan circuit grid at `0.12` opacity)
- Display type: `Barlow Condensed` 900 (wordmark + lockup)
- Mono type: `JetBrains Mono` (timecode, SRC readout, sub-labels)

Live-dot heartbeat in the footer matches the `REC · LIVE` motif from
Iller_Ang's intro sequence. No humans in the chrome — canon holds at
the presentation layer.

## End-to-end flow (Gate 2 dry-run)

```
[CRUCIBLE event]
      ↓ Translator (Gate 2.a)
[TranslatedEvent]
      ↓ Seedance 2.0 pre-viz
[storyboard video URL]
      ↓ Night Port control bundle (Gate 2.b fixture)
[proxy-video + depth + canny]
      ↓ Cosmos-Transfer2.5 (Gate 2.c)
[environment MP4 in GCS]
      ↓ parallel: Seedance i2v (Gate 2.d) from port-ang.png
[character MP4 in GCS]
      ↓ Compositor (Gate 2.e) — Remotion + FFmpeg
[composed MP4 in GCS]
      ↓ Puter client — uploadComposedClip()
[public Puter.fs URL]
      ↓ launch /?src=<url>
[THIS VIEWER plays it]
```

Gate 2 is green when a canned `planner.dispatch` event completes this
loop and the viewer plays a watchable clip showing ACHEEVY or Port_Ang
dispatching a mission in the Night Port.

## What's NOT here (Gate 3 concerns)

- Multi-window Pro Mode (full Puter desktop integration with 3D
  viewport + Higgsfield params + timeline editor)
- Live WebRTC stream (vs. pre-rendered MP4)
- Guided Lite Mode onboarding flow
- Multi-scene library beyond Night Port
- Auth / multi-tenant isolation

See `aims-skills/skills/live-look-in/references/gate-2-kickoff.md` for
the full deferred-scope list.

## Related

- Puter client: `backend/uef-gateway/src/operations-floor/puter-client.ts`
- Compositor (produces the MP4 this viewer plays): `services/operations-floor-compositor/`
- Pipeline audit: `aims-skills/skills/live-look-in/references/gate-1.6-pipeline-audit.md`
- Vertical spec: `aims-skills/skills/live-look-in/references/vertical-run-a-company-3d-engagement.md`
