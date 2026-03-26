# Live Look In — Asset Pipeline Reference

## The Problem

The POC uses procedural Canvas 2D drawing (bezier curves, gradients, arc calls) to approximate character designs. This works for proof of concept but:

1. Cannot faithfully reproduce the reference artwork (wood grain texture, metallic armor, feather detail)
2. Gets expensive at scale — each agent = dozens of draw calls per frame
3. Cannot easily add new characters without writing complex draw code

## The Solution: Spritesheet-Based Rendering

Replace canvas draw functions with pre-rendered PNG/WebP spritesheets loaded as Image objects, drawn via `ctx.drawImage()` or Pixi.js sprites.

## Asset Specifications

### Boomer_Ang Spritesheet

**Source**: The reference image (`assets/boomer_ang_reference.png`) shows the canonical design.

**Spritesheet layout**: Single horizontal strip of rotation frames.

```
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│  0°  │  15° │  30° │  45° │  60° │  75° │  90° │ ...  │
│frame0│frame1│frame2│frame3│frame4│frame5│frame6│      │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
```

| Property         | Value                                        |
|------------------|----------------------------------------------|
| Frame size       | 128x128px (standard), 64x64px (thumbnail)    |
| Rotation frames  | 24 (every 15 deg)                             |
| Total strip size | 3072x128px                                   |
| Format           | WebP (with PNG fallback)                      |
| Transparency     | Yes (alpha channel)                           |
| Variants         | One per glow color (6 variants for 6 agents)  |

**Glyph overlay**: The center neon glyph is NOT baked into the spritesheet. It is rendered as a separate text draw on top, so it can change dynamically. The spritesheet has a transparent center window.

**Generating the spritesheet:**

```bash
# Example ImageMagick rotation generation
for i in $(seq 0 15 345); do
  convert boomer_ang_base.png -rotate $i -background none frame_${i}.png
done
# Pack into strip
convert frame_*.png +append boomer_ang_spritesheet.png
```

### ACHEEVY Sprite

**Source**: `assets/acheevy_reference.png`

Not a spritesheet — single static image with animation overlays.

| Property  | Value                                            |
|-----------|--------------------------------------------------|
| Size      | 128x256px (standing figure)                      |
| Format    | WebP with alpha                                  |
| Animation | Visor glow is a CSS/canvas overlay, not baked in |
| Cube      | Separate 48x48 sprite with glow animation        |

**Rendering approach:**
- Draw base ACHEEVY sprite (static)
- Overlay visor glow rectangle with pulsing opacity (canvas globalAlpha)
- Draw cube sprite at hand position with pulsing blue glow (shadowBlur)

### Chicken Hawk Sprite

**Source**: `assets/chickenhawk_reference.png`

| Property       | Value                            |
|----------------|----------------------------------|
| Size           | 192x192px (with wings spread)    |
| Wing animation | 4-6 frames of wing positions     |
| Spritesheet    | 1152x192px (6 frames horizontal) |
| Format         | WebP with alpha                  |
| Eye glow       | Canvas overlay, not baked        |

### Lil_Hawk Spritesheet

Miniaturized Chicken Hawk design.

| Property         | Value                                   |
|------------------|-----------------------------------------|
| Frame size       | 48x48px                                 |
| Rotation frames  | 12 (every 30 deg) for travel animation  |
| Wing flap frames | 4 for working animation                 |
| Total sheet      | 576x96px (12 rotation + 4 flap, 2 rows) |
| Format           | WebP with alpha                         |

### State Overlays

Overlays are composited on top of the base sprite:

| State   | Overlay                           |
|---------|-----------------------------------|
| idle    | None                              |
| working | Glow ring (agent's glowColor)     |
| moving  | Motion blur trail (3px)           |
| break   | Dim filter (opacity 0.5)          |
| alert   | Red pulse ring (2-frame loop)     |

## Loading Strategy

### Preload at App Init

```javascript
const ASSET_MANIFEST = {
  boomer_ang:  { src: '/assets/boomer_ang_sheet.webp', frameW: 128, frameH: 128, frames: 24 },
  acheevy:     { src: '/assets/acheevy.webp', frameW: 128, frameH: 256, frames: 1 },
  chickenhawk: { src: '/assets/chickenhawk_sheet.webp', frameW: 192, frameH: 192, frames: 6 },
  lilhawk:     { src: '/assets/lilhawk_sheet.webp', frameW: 48, frameH: 48, frames: 16 },
};

async function preloadAssets(manifest) {
  const loaded = {};
  await Promise.all(Object.entries(manifest).map(([key, cfg]) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { loaded[key] = { img, ...cfg }; resolve(); };
      img.onerror = reject;
      img.src = cfg.src;
    });
  }));
  return loaded;
}
```

### Drawing a Sprite Frame

```javascript
function drawSpriteFrame(ctx, asset, frameIndex, x, y, scale = 1) {
  const sx = frameIndex * asset.frameW;
  const dw = asset.frameW * scale;
  const dh = asset.frameH * scale;
  ctx.drawImage(asset.img, sx, 0, asset.frameW, asset.frameH,
                x - dw/2, y - dh/2, dw, dh);
}
```

### Rotation Without Spritesheet (Fallback)

If spritesheets aren't available, use canvas rotation on a single image:

```javascript
ctx.save();
ctx.translate(x, y);
ctx.rotate(angle);
ctx.drawImage(img, -w/2, -h/2, w, h);
ctx.restore();
```

This is slower than spritesheets but works as an intermediate step.

## Pixi.js Migration Path

When moving from Canvas 2D to Pixi.js for WebGL acceleration:

```javascript
import * as PIXI from 'pixi.js';

// Load spritesheet
const sheet = await PIXI.Assets.load('boomer_ang_sheet.json');

// Create animated sprite
const boomer = new PIXI.AnimatedSprite(sheet.animations['spin']);
boomer.animationSpeed = 0.3;
boomer.play();
boomer.position.set(x, y);
stage.addChild(boomer);
```

**Benefits over Canvas 2D:**
- GPU-accelerated sprite batching (1000+ agents at 60fps)
- Built-in spritesheet animation
- Efficient hit detection with interaction manager
- Particle effects for visual polish

## Asset Production Workflow

1. **Design** — Create/refine character art in design tool (Figma, Photoshop, Blender)
2. **Export** — Transparent PNG at 2x target resolution
3. **Process** — Generate rotation frames, tint variants, pack spritesheets
4. **Optimize** — Convert to WebP, generate multiple sizes (1x, 2x for retina)
5. **Upload** — Push to CDN (Cloudflare R2 or S3)
6. **Manifest** — Update `ASSET_MANIFEST` with new URLs and frame counts
7. **Test** — Verify rendering at all zoom levels and on mobile

## CDN Storage

### Cloudflare R2 (Production)

```
r2://achievemor-assets/live-look-in/sprites/
  ├── acheevy.png
  ├── acheevy.json
  ├── chicken-hawk.png
  ├── chicken-hawk.json
  ├── boomer-ang/
  │   ├── api_ang.png
  │   ├── api_ang.json
  │   ├── crypt_ang.png
  │   └── ...
  └── lil-hawk/
      ├── lil_code_hawk.png
      ├── lil_code_hawk.json
      └── ...
```

### Cache Headers

```
Cache-Control: public, max-age=31536000, immutable
```

Sprites are versioned by filename hash — cache-bust on asset update.
