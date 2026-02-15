# Scale with ACHEEVY — Business Builder Skills

**Your AI co-founder for launching and scaling businesses.**

**Trigger:** ACHEEVY detects via NLP that user wants to start/build a business.

**Intent patterns:**
- "I want to start a business"
- "Help me with a startup idea"
- "I'm thinking of launching..."
- "Business idea for..."
- "How do I validate my idea"
- "Scale my business"

---

## Skills

| # | Skill | File | Trigger Keywords |
|---|-------|------|------------------|
| 1 | Business Idea Generator | `idea-generator.skill.ts` | "business ideas", "startup ideas", "what should I build" |
| 2 | Industry Pain Points | `pain-points.skill.ts` | "pain points", "problems in", "market gaps" |
| 3 | Brand Name Generator | `brand-name.skill.ts` | "brand name", "company name", "what to call" |
| 4 | Value Proposition | `value-prop.skill.ts` | "value proposition", "why us", "unique selling" |
| 5 | MVP Launch Plan | `mvp-plan.skill.ts` | "MVP", "launch plan", "get started", "first steps" |
| 6 | Customer Persona | `persona.skill.ts` | "target customer", "who buys", "ideal customer" |
| 7 | Social Launch Hooks | `social-hooks.skill.ts` | "launch tweet", "social post", "announce" |
| 8 | Cold Outreach | `cold-outreach.skill.ts` | "cold email", "outreach", "pitch email" |
| 9 | Task Automation | `automation.skill.ts` | "automate", "save time", "streamline" |
| 10 | Content Calendar | `content-calendar.skill.ts` | "content plan", "posting schedule", "content calendar" |

---

## Refinement Flow (Built-in)

After any skill runs, offer the 4-step refinement:

```
1. Share your original idea
2. "What's unclear, risky, or missing?"
3. "Make this resonate with [audience]" + insert their data
4. "What would the 0.01% top expert do here?"
```

---

## Integration

```typescript
// In ACHEEVY chat handler
import { detectBusinessIntent, runScaleSkill } from '@/aims-skills/skills/scale-with-acheevy';

if (detectBusinessIntent(userMessage)) {
  const skill = matchSkill(userMessage);
  const result = await runScaleSkill(skill, context);
  return result;
}
```
