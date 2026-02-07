# A.I.M.S. Architectural Overview

## System Map

```mermaid
graph TD
    User((User)) -->|Voice/Chat| Frontend[Next.js 14 Frontend\n(ACHEEVY)]
    Frontend -->|ACP Request\nPOST /api/acp| UEF[UEF Gateway\n(Node.js Orchestrator)]
    
    subgraph "UEF Layer 2"
        UEF -->|1. Validate| ACP[ACP Logic]
        UEF -->|2. Price| LUC[LUC Engine]
        UEF -->|3. Verify| ORACLE[ORACLE 7-Gates]
        LUC -.->|Discount Lookup| ByteRover[ByteRover Context]
    end
    
    subgraph "Layer 3 Execution"
        UEF -->|Route Task| AgentZero[Agent Zero\n(Planning)]
        UEF -->|Route Task| OpenClaw[OpenClaw\n(Architecture)]
        UEF -->|Route Task| ChickHawk[Chicken Hawk\n(Coding)]
        UEF -->|Route Task| N8N[n8n\n(Automation)]
    end
    
    subgraph "Layer 4 Persistence"
        ChickHawk -->|Deploy| Firebase[Firebase Hosting/Functions]
        UEF -->|Log| Firestore[Firestore DB]
    end
```

## Core Components

1.  **Frontend (ACHEEVY)**: A "thin" client. It does not contain complex business logic. It handles the NLP interface and displays ACP responses (Quotes, Status).
2.  **UEF Gateway**: The brain. It enforces the AI Managed Solutions protocols. It must Approve (KYB), Price (LUC), and Route (Router) every request.
3.  **Agents**: Standalone containers (Agent Zero, OpenClaw) that receive high-level ACP tasks (`ACPAgentTask`) and return artifacts.
