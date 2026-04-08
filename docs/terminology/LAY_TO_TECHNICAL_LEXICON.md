# Lay-to-Technical Lexicon

This file maps common user-language phrases to approved canonical technical terms.

## Required Record Shape

Each mapping should eventually include:

- user phrase
- canonical term
- confidence
- ambiguity flag
- context rules
- fallback mappings

## Seed Mappings

| User Phrase | Canonical Term | Notes |
| --- | --- | --- |
| left menu | navigation rail | Use `sidebar` only when the layout is actually a sidebar pattern. |
| save spot | checkpoint | Prefer `Session Snapshot` when referring to restored session state. |
| user type | role-based access | Map to role and permission language in auth flows. |
| persona switcher | Data Source Picker | Persona is not the top-level product primitive. |
| notebook for this session | Working Notebook | Session-specific composition, not a reusable catalog item. |
| reusable source bundle | Context Pack | Portable and user-selectable. |
| all my saved sources | Data Source Catalog | User-facing library surface. |
| technical word library | Technical Knowledge Index | Canonical source of terminology. |
| plain English to technical | Lay-to-Technical Lexicon | Crosswalk, not the canonical source itself. |
| what the user wants to build | Build Intent Resolver | Intent classification layer. |
| rewrite my prompt correctly | Prompt Reconstruction Layer | Build-ready prompt generation. |
| container manager | Sandbox Control Plane | Execution lifecycle system. |
| memory outside the sandbox | Session Memory Store | Durable state outside disposable compute. |

## Ambiguity Rule

If a layman phrase could map to more than one canonical term, keep the ambiguity explicit until additional context is available.
