---
id: "ui-model-selector-openrouter"
name: "UI Model Selector (OpenRouter)"
type: "task"
status: "active"
triggers: ["model selector", "openrouter selector", "change model", "model picker"]
description: "Map OpenRouter models into a normalized list and make them selectable in the UI. Switching model updates session state and confirms in chat."
execution:
  target: "internal"
priority: "high"
---

# UI Model Selector (OpenRouter) Task

## Objective
Give users visible control over which LLM model powers their conversation.

## Requirements

### Model Data Model
Store normalized model list in Firestore config: `config/openrouter_models`
```json
{
  "id": "openrouter:model_id",
  "label": "GPT-4o",
  "provider": "OpenAI",
  "cost_tier": "premium|standard|economy",
  "context_window": 128000,
  "supports_tools": true,
  "supports_vision": false
}
```

### Model Selector Component
- Dropdown/picker showing available models grouped by cost tier
- Each model shows: label, provider, cost tier badge
- Default: low-cost model (economy tier) until user explicitly upgrades
- Cost tier badges: "Economy" (green), "Standard" (blue), "Premium" (gold)

### On Change Behavior
1. Update `session.llm_model_key` in Redis
2. Persist to Firestore: `users/{uid}/preferences/llm_model`
3. ACHEEVY posts a short confirmation in chat:
   - "Switched to [Model Name]. This is a [tier] model."
   - If upgrading to premium: "Heads up — [Model Name] uses more resources per message."

### Layout by Device
- **Mobile**: Model icon in app bar → tap opens bottom sheet with model tree
- **Tablet**: Model dropdown in Control Panel
- **Desktop**: Model dropdown in right session panel

### Pricing Integration
- Model selection triggers `SKILL:record_usage` with the new model's cost profile
- If user selects a premium model, apply the appropriate pricing tier rules

## Implementation Checklist
- [ ] Create `ModelSelector` component with grouped dropdown
- [ ] Populate from Firestore config
- [ ] Wire to session state (`llm_model_key`)
- [ ] Persist changes to Firestore
- [ ] Add ACHEEVY confirmation message on change
- [ ] Show cost tier badge on each model
- [ ] Default to economy tier
- [ ] Responsive: bottom sheet (mobile), dropdown (tablet/desktop)
