---
name: nvidia-tools-inventory
displayName: NVIDIA Open-Source AI Tools — Complete Inventory
version: 1.0.0
type: reference
tags: [nvidia, open-source, inventory, voice, video, inference, agentic]
---

# NVIDIA Open-Source AI Tools — Complete Inventory

> Reference document for the A.I.M.S. team. Lists every NVIDIA open-source tool
> relevant to the platform, grouped by category, with license and integration notes.

---

## Currently Integrated (or Planned)

| Tool | Category | Status | Skill File |
|------|----------|--------|------------|
| **PersonaPlex** | Voice | Planned | `skills/integrations/nvidia-personaplex.skill.md` |
| **Parakeet** | ASR | Planned | `skills/integrations/nvidia-parakeet.skill.md` |

---

## A. Voice Agents / Conversational AI

| Tool | What It Does | License | Link |
|------|-------------|---------|------|
| **PersonaPlex** | 7B full-duplex speech-to-speech model. Listens and talks simultaneously. 0.07s switch latency. | MIT (code) / NVIDIA Open Model (weights) | [NVIDIA/personaplex](https://github.com/NVIDIA/personaplex) |
| **NVIDIA Riva** | Production speech AI SDK: ASR, TTS, NMT as gRPC microservices | Partial (SDK free, models via NGC) | [nvidia-riva](https://github.com/nvidia-riva) |
| **NVIDIA ACE** | Avatar Cloud Engine for digital humans — speech, animation, intelligence | Partial (Audio2Face OSS) | [NVIDIA/ACE](https://github.com/NVIDIA/ACE) |
| **Audio2Face-3D** | AI-driven facial animation from speech audio | MIT / Apache / NVIDIA Open Model | [NVIDIA/Audio2Face-3D](https://github.com/NVIDIA/Audio2Face-3D) |
| **NeMo Guardrails** | Programmable guardrails for LLM conversational systems | Apache 2.0 | [NVIDIA-NeMo/Guardrails](https://github.com/NVIDIA-NeMo/Guardrails) |

### A.I.M.S. Relevance
- **PersonaPlex** → Full-duplex voice for ACHEEVY (replaces sequential ASR→LLM→TTS)
- **Audio2Face-3D** → Potential for animated Boomer_Ang avatars in Hangar/SmelterOS
- **NeMo Guardrails** → Reinforce ACHEEVY's identity guard and prompt injection defense

---

## B. Speech Recognition (ASR) and TTS

| Tool | What It Does | License | Link |
|------|-------------|---------|------|
| **Parakeet-TDT-0.6B-v2** | #1 Open ASR Leaderboard, 6.05% WER, 3,386x real-time | CC-BY-4.0 | [HF: parakeet-tdt-0.6b-v2](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v2) |
| **Parakeet-TDT-0.6B-v3** | 25 European languages, auto-detection | CC-BY-4.0 | [HF: parakeet-tdt-0.6b-v3](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3) |
| **Parakeet-TDT-1.1B** | Higher capacity English ASR | CC-BY-4.0 | [HF](https://huggingface.co/nvidia/parakeet-tdt-1.1b) |
| **Canary-1B-v2** | Multilingual ASR + translation (25 languages) | CC-BY-4.0 | [HF: canary-1b-v2](https://huggingface.co/nvidia/canary-1b-v2) |
| **Canary-Qwen-2.5B** | English ASR with LLM integration | CC-BY-4.0 | [HF](https://huggingface.co/nvidia/canary-qwen-2.5b) |
| **NeMo Framework** | End-to-end framework for LLM, ASR, TTS, multimodal | Apache 2.0 | [NVIDIA-NeMo/NeMo](https://github.com/NVIDIA-NeMo/NeMo) |
| **Granary Dataset** | ~1M hours multilingual speech data | Open | Hugging Face |
| **NVIDIA Maxine** | Real-time audio/video effects (noise removal, enhancement) | Partial | [NVIDIA-Maxine](https://github.com/NVIDIA-Maxine) |

### A.I.M.S. Relevance
- **Parakeet** → Replace/augment Groq Whisper STT with best-in-class accuracy
- **Canary** → Multilingual support for global users
- **Maxine** → Noise removal for voice input in noisy environments (DIY mode)

---

## C. Video Generation / 3D

| Tool | What It Does | License | Link |
|------|-------------|---------|------|
| **Cosmos** | World foundation models for video gen, physical AI simulation | Apache 2.0 (code) / NVIDIA Open Model (weights) | [nvidia-cosmos](https://github.com/nvidia-cosmos) |
| **Cosmos Predict 2.5** | Text/Image/Video-to-World generation | NVIDIA Open Model | [cosmos-predict2](https://github.com/nvidia-cosmos/cosmos-predict2) |
| **Cosmos Transfer 2.5** | World-to-world style transfer (weather, lighting, terrain) | NVIDIA Open Model | Part of Cosmos |
| **Cosmos Reason 2** | Physical common sense reasoning for embodied AI | NVIDIA Open Model | Part of Cosmos |
| **Omniverse** | Platform for physical AI, digital twins | Mixed (libraries OSS) | [NVIDIA-Omniverse](https://github.com/NVIDIA-Omniverse) |
| **Audio2Face-3D** | AI facial animation from speech | MIT / Apache / NVIDIA Open Model | [NVIDIA/Audio2Face-3D](https://github.com/NVIDIA/Audio2Face-3D) |

### A.I.M.S. Relevance
- **Cosmos** → Video generation for BAMARAM deliverables, marketing content
- **Cosmos Predict** → Synthetic training data for agent simulation
- **Omniverse** → Long-term: SmelterOS 3D environment layer

---

## D. AI Inference and Serving

| Tool | What It Does | License | Link |
|------|-------------|---------|------|
| **NVIDIA Dynamo** | Datacenter-scale distributed inference, disaggregated prefill/decode | Apache 2.0 | [ai-dynamo/dynamo](https://github.com/ai-dynamo/dynamo) |
| **TensorRT-LLM** | LLM inference optimization (FlashAttention, quantization, multi-GPU) | Apache 2.0 | [NVIDIA/TensorRT-LLM](https://github.com/NVIDIA/TensorRT-LLM) |
| **Triton Inference Server** | Multi-framework model serving (TensorRT, PyTorch, ONNX) | BSD 3-Clause | [triton-inference-server](https://github.com/triton-inference-server) |
| **NIXL** | GPU-to-GPU/storage transfer library | Apache 2.0 | [ai-dynamo/nixl](https://github.com/ai-dynamo/nixl) |
| **Grove** | Kubernetes-native AI inference orchestration | Apache 2.0 | Part of Dynamo |
| **NCCL** | Multi-GPU/multi-node collective communication | BSD | [NVIDIA/nccl](https://github.com/NVIDIA/nccl) |

### A.I.M.S. Relevance
- **Triton** → Self-host multiple models (Parakeet, PersonaPlex) behind one server
- **TensorRT-LLM** → Optimize self-hosted model inference on VPS GPU
- **Dynamo** → Future: scale inference when traffic demands it

---

## E. Agentic AI / Workflow Orchestration

| Tool | What It Does | License | Link |
|------|-------------|---------|------|
| **NeMo Agent Toolkit (AgentIQ)** | Framework-agnostic agent team building, profiling, optimization | Apache 2.0 | [NVIDIA/NeMo-Agent-Toolkit](https://github.com/NVIDIA/NeMo-Agent-Toolkit) |
| **NeMo Guardrails** | Programmable LLM guardrails | Apache 2.0 | [NVIDIA-NeMo/Guardrails](https://github.com/NVIDIA-NeMo/Guardrails) |

### A.I.M.S. Relevance
- **AgentIQ** → Profile and optimize Boomer_Ang performance
- **Guardrails** → Harden ACHEEVY's identity guard and chain-of-command enforcement

---

## F. Robotics / Physical AI

| Tool | What It Does | License | Link |
|------|-------------|---------|------|
| **Isaac Lab** | Robot learning in simulation | Open source | NVIDIA Isaac GitHub |
| **GR00T** | Humanoid robot learning and reasoning | NVIDIA Open Model | Hugging Face |
| **OSMO** | Edge-to-cloud compute for robot training | Open source | NVIDIA |

### A.I.M.S. Relevance
- Low priority for now. Potential future integration for SmelterOS physical world interaction.

---

## G. Data Processing & Science

| Tool | What It Does | License | Link |
|------|-------------|---------|------|
| **RAPIDS** | GPU-accelerated data science (cuDF, cuML) | Apache 2.0 | [rapidsai](https://github.com/rapidsai) |
| **BioNeMo** | Generative AI for life sciences | Mixed | NVIDIA NGC |
| **PhysicsNeMo** | Physics-informed ML for digital twins | Open source | GitHub |

### A.I.M.S. Relevance
- **RAPIDS** → Accelerate analytics for Per|Form scouting data

---

## H. LLMs and Foundation Models

| Tool | What It Does | License | Link |
|------|-------------|---------|------|
| **Nemotron family** | Open LLMs (Nano, Super, Ultra) for reasoning/agentic tasks | NVIDIA Open Model | Hugging Face |
| **Llama Nemotron** | NVIDIA-optimized Llama variants | Llama Community License | Hugging Face |

### A.I.M.S. Relevance
- **Nemotron** → Potential addition to OpenRouter model roster for self-hosted inference
