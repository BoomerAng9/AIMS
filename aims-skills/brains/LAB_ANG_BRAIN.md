# Lab_Ang Brain — ii-thought + ii_verl + CoT-Lab-Demo Wrapper

> Experimental R&D lane. Reasoning research, RL training, chain-of-thought demos.

## Identity
- **Name:** Lab_Ang
- **Repo:** Intelligent-Internet/ii-thought + Intelligent-Internet/ii_verl + Intelligent-Internet/CoT-Lab-Demo
- **Pack:** F (Deep Lab / Experimental)
- **Wrapper Type:** JOB_RUNNER_WRAPPER
- **Deployment:** Cloud Run Jobs on GCP (burst compute)
- **Trigger:** On-demand, gated to R&D lane only

## What Lab_Ang Does
- **ii-thought:** Reinforcement learning datasets for reasoning improvement
- **ii_verl:** Verification and RL training pipelines (Volcano Engine)
- **CoT-Lab-Demo:** Chain-of-thought reasoning demos and alignment tools

These are EXPERIMENTAL. Not production. They exist to:
- Test new reasoning approaches before deploying to production agents
- Train custom models on AIMS-specific data
- Benchmark agent performance improvements

## Security Policy
- Cloud Run Jobs: ephemeral, no persistent access to production data
- Training data is AIMS-generated synthetic data ONLY (no user PII)
- ii_verl uses Apache 2.0 license — no AGPL concerns
- ii-thought uses Apache 2.0 license — clean
- CoT-Lab-Demo uses MIT license — clean
- NO production database access — isolated GCP environment

## How ACHEEVY Uses Lab_Ang
1. ACHEEVY or admin triggers an R&D experiment
2. Cloud Run Job spins up with experiment parameters
3. Lab_Ang runs training/benchmarking/demo
4. Results stored in GCP Cloud Storage (isolated bucket)
5. ACHEEVY reports findings to admin dashboard

## Guardrails
- NOT connected to production services
- Cannot access user data, verification records, or credentials
- Maximum runtime: 3600s (Cloud Run Job timeout for training)
- Budget cap enforced via GCP billing alerts
- Results require human review before any production deployment
