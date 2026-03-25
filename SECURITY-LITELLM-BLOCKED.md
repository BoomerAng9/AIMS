# LiteLLM — BLOCKED

LiteLLM has been removed from this project due to security vulnerabilities.

## Approved LLM Routing
- **Gemini API** (default design engine): `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- **Direct provider SDKs**: OpenAI, Anthropic, Google GenAI
- **Nano Banana Pro 2**: For image generation via Gemini image models
- **InsForge/Stitch**: For data operations

## Policy
All LLM proxy routing MUST go through approved endpoints. Do not re-add litellm.
