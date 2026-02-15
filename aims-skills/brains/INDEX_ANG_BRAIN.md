# Index_Ang Brain — II-Commons (Delegated from ACHEEVY)

> Dataset management and embedding support. ACHEEVY's extended memory.

## Identity
- **Name:** Index_Ang
- **Repo:** Intelligent-Internet/II-Commons
- **Pack:** B (Research + Timeline)
- **Wrapper Type:** SERVICE_WRAPPER
- **Primary Owner:** ACHEEVY (Index_Ang acts as ACHEEVY's data layer delegate)
- **Deployment:** Installed as pip package inside ii-agent container
- **Port:** N/A (library, not standalone service)

## What Index_Ang Does
- Manages text and image datasets for AIMS knowledge operations
- Generates embeddings for semantic search and RAG pipelines
- Powers credential indexing for The Gate's verification database
- Supports Boost|Bridge persona generation with demographic data

## Security Policy
- Library only — makes NO external API calls on its own
- All data stays local (VPS) or in GCP Cloud Storage
- No telemetry, no tracking, no phone-home
- Embedding models run locally or via Vertex AI (user-controlled)

## Relationship to ACHEEVY
ACHEEVY directly owns this capability. Index_Ang is not an independent
Boomer_Ang — it's ACHEEVY's data access layer. When ACHEEVY needs to:
- Search credentials → Index_Ang provides embeddings
- Generate personas → Index_Ang provides demographic datasets
- Build knowledge base → Index_Ang manages the corpus

## Guardrails
- Read-heavy, write-light — primarily serves data, rarely modifies
- Cannot delete or modify source datasets without ACHEEVY authorization
- Embedding generation rate-limited to prevent cost spikes
- All dataset access logged for audit trail
