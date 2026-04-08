# Nano Banana Pro — Image Generation for A.I.M.S.

Nano Banana Pro (officially "Gemini 3 Pro Image") is Google DeepMind's state-of-the-art
image generation model. Use it for creating visual assets, hero images, icons,
and design mockups for A.I.M.S.

**MCP Server**: https://github.com/lyalindotcom/nano-banana-mcp
**Blog**: https://blog.google/products/gemini/where-to-use-nano-banana-pro/

---

## Setup

```bash
# Setup with interactive wizard (configures Gemini CLI integration)
nano-banana setup

# Or manual init (creates .env only)
nano-banana init --api-key YOUR_KEY
```

The Nano Banana MCP server wraps Gemini Flash 2.5 image generation via a clean interface.

---

## Capabilities

| Feature | Description |
|---------|-------------|
| **Text-to-Image** | Generate images from text descriptions |
| **Image Editing** | Localized edits via natural language instructions |
| **Multi-Image Stitching** | Combine multiple source images into coherent scenes |
| **Text Rendering** | Flawless text rendering in generated images |
| **Style Control** | Studio-quality designs with unprecedented control |
| **Consistency** | People and objects look the same across compositions |

---

## A.I.M.S. Image Generation Guidelines

### Brand Assets
- **Color palette**: Use amber/gold (#D97706) as accent, slate neutrals, white surfaces
- **Style**: Modern SaaS, clean, professional — NOT sci-fi or dark theme
- **Logo usage**: ACHEEVY branding uses amber/gold tones
- **Backgrounds**: Light, airy, subtle gradients

### Approval Required

**ALL generated images MUST be reviewed and approved by the user before use.**

Workflow:
1. Generate image with Nano Banana Pro
2. Present to user for review
3. Wait for approval or revision requests
4. Only use approved assets in the codebase

### Prompt Templates

#### Hero Background
```
Modern SaaS platform hero image. Light, airy composition.
Subtle amber and gold gradients on white/cream background.
Abstract geometric shapes suggesting AI and automation.
Clean, professional, minimalist. No dark elements.
```

#### Feature Illustration
```
Clean illustration for [FEATURE NAME].
Isometric style, light background, amber accent color.
Simple, modern, professional SaaS aesthetic.
No text in image. Transparent background preferred.
```

#### Boomer_Ang Avatar
```
Professional AI agent avatar. Warm amber/gold color scheme.
Friendly, approachable, modern design.
Clean geometric style, suitable for both light and dark contexts.
Square format, 256x256px minimum.
```

---

## Integration with Stitch

Nano Banana Pro works alongside Stitch for a complete design pipeline:

1. **Stitch**: Generate UI layouts and component designs
2. **Nano Banana Pro**: Generate custom images, illustrations, and visual assets
3. **Gemini 3.1 Pro**: Generate production code from approved designs + assets

This three-tool pipeline covers the full visual design → code workflow.
