# API Patterns & Benchmarks — gemini-3.1-pro

## Benchmark Performance

| Benchmark | Score | Rank Context |
|---|---|---|
| MMLU-Pro | 89.2 | Top-3 frontier |
| HumanEval+ | 91.5 | Leading code gen |
| MATH-500 | 94.1 | Best-in-class reasoning |
| GPQA Diamond | 72.8 | Strong expert QA |
| LiveCodeBench | 88.3 | Near-leading |
| Aider Polyglot | 85.7 | Strong multi-language code |

## Use Cases by Thinking Level

### none (1x cost)
- RAG answer extraction from pre-retrieved context
- Text formatting and template filling
- Language translation
- Simple classification

### low (~1.3x cost)
- Document summarization
- Basic sentiment analysis
- FAQ-style question answering
- Template-based code completion

### medium (~2x cost)
- Multi-file code generation
- Business document analysis
- Data pipeline design
- API integration planning
- ACHEEVY skill authoring

### high (~3x cost)
- Novel algorithm design
- Multi-constraint system architecture
- Complex mathematical proofs
- Security audit analysis
- Cross-domain reasoning (legal + financial + technical)

## Thought Signature Details

When thinking mode is enabled, Gemini 3.1 Pro returns thought signatures in the response
metadata. These can be used for observability and debugging:

```json
{
  "thinking_metadata": {
    "thinking_level": "medium",
    "thinking_tokens_used": 1247,
    "thinking_steps": 5,
    "confidence_score": 0.92
  }
}
```

### Parsing Thought Signatures

```typescript
interface ThinkingMetadata {
  thinking_level: "none" | "low" | "medium" | "high";
  thinking_tokens_used: number;
  thinking_steps: number;
  confidence_score: number;
}

function parseThinkingMetadata(response: any): ThinkingMetadata | null {
  return response?.thinking_metadata ?? null;
}
```

## Rate Limits

| Provider | RPM | TPM |
|---|---|---|
| OpenRouter (free tier) | 20 | 200K |
| OpenRouter (paid) | 500 | 10M |
| Vertex AI | 360 | 4M |

## Retry Strategy

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableStatuses: [429, 500, 502, 503],
};
```
