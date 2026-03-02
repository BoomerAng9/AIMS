# Manifest & Artifact Schemas — fdh-pipeline

## Pipeline Manifest Schema

The pipeline manifest is created at the start of every FDH pipeline run and updated as phases progress.

```yaml
# fdh-manifest.yaml
apiVersion: fdh/v1
kind: PipelineManifest
metadata:
  id: fdh-<uuid>
  created: <ISO-8601 timestamp>
  owner: <user-id>
  session: <session-id>
  mode: guide_me | manage_it

spec:
  trigger:
    type: user_request | factory_event | scheduled
    source: <event source identifier>
    payload: <raw trigger data>

  foster:
    status: pending | in_progress | completed | failed
    started: <ISO-8601 timestamp>
    completed: <ISO-8601 timestamp>
    plan:
      scope: <scope description>
      agents:
        - role: <Boomer_Ang | Lil_Hawk>
          name: <agent name>
          assignment: <what they do>
      tools:
        - name: <tool/API name>
          purpose: <why it's needed>
      cost_estimate:
        luc_credits: <number>
        model_calls: <number>
        compute_minutes: <number>
      risks:
        - description: <risk>
          mitigation: <plan>
    approval:
      required: <boolean>
      approver: <user | auto>
      approved_at: <ISO-8601 timestamp>

  develop:
    status: pending | in_progress | completed | failed
    started: <ISO-8601 timestamp>
    completed: <ISO-8601 timestamp>
    artifacts: <list of artifact references>
    progress:
      - step: <step description>
        status: completed | failed
        timestamp: <ISO-8601 timestamp>
        evidence: <evidence hash>

  hone:
    status: pending | in_progress | completed | failed
    started: <ISO-8601 timestamp>
    completed: <ISO-8601 timestamp>
    oracle:
      gates:
        completeness: green | yellow | red
        correctness: green | yellow | red
        consistency: green | yellow | red
        compliance: green | yellow | red
        cost: green | yellow | red
        coverage: green | yellow | red
        clarity: green | yellow | red
        chain: green | yellow | red
      overall: pass | fail | warn
      details: <per-gate notes>
    fixes:
      - issue: <what was found>
        resolution: <what was done>
        re_verified: <boolean>

  result:
    status: completed | failed | cancelled
    bamaram_receipt_id: <receipt-id>
    evidence_hash: <SHA-256>
    artifacts: <final artifact list>
    cost_actual:
      luc_credits: <number>
      model_calls: <number>
      compute_minutes: <number>
```

## Artifact Schema

Each artifact produced during the Develop phase is tracked with this schema.

```yaml
# artifact.yaml
apiVersion: fdh/v1
kind: Artifact
metadata:
  id: art-<uuid>
  pipeline_id: fdh-<uuid>
  created: <ISO-8601 timestamp>
  created_by: <agent name>

spec:
  type: file | deployment | configuration | document | test_result
  name: <human-readable artifact name>
  path: <file path or resource URI>
  hash: <SHA-256 of artifact content>
  size_bytes: <number>

  provenance:
    source: <what generated this artifact>
    inputs:
      - artifact_id: <upstream artifact reference>
        relationship: derived_from | depends_on | replaces
    model:
      name: <LLM model used, if applicable>
      version: <model version>
      prompt_hash: <SHA-256 of the prompt used>

  validation:
    tested: <boolean>
    test_results:
      passed: <number>
      failed: <number>
      skipped: <number>
    reviewed_by: <agent or user>
    reviewed_at: <ISO-8601 timestamp>
```

## BAMARAM Receipt Schema

Generated at pipeline completion and stored in the Evidence Locker.

```yaml
# bamaram-receipt.yaml
apiVersion: fdh/v1
kind: BAMARAMReceipt
metadata:
  id: bam-<uuid>
  pipeline_id: fdh-<uuid>
  issued: <ISO-8601 timestamp>

spec:
  pipeline:
    started: <ISO-8601 timestamp>
    completed: <ISO-8601 timestamp>
    duration_ms: <number>
    mode: guide_me | manage_it
    trigger_type: user_request | factory_event | scheduled

  phases:
    foster: { status: ok | failed, duration_ms: <number> }
    develop: { status: ok | failed, duration_ms: <number> }
    hone: { status: ok | failed, duration_ms: <number> }

  oracle:
    gates:
      completeness: green | yellow | red
      correctness: green | yellow | red
      consistency: green | yellow | red
      compliance: green | yellow | red
      cost: green | yellow | red
      coverage: green | yellow | red
      clarity: green | yellow | red
      chain: green | yellow | red
    overall: pass | fail | warn
    pass_count: <0-8>

  artifacts:
    count: <number>
    items:
      - id: art-<uuid>
        name: <artifact name>
        type: <artifact type>
        hash: <SHA-256>

  cost:
    estimated:
      luc_credits: <number>
    actual:
      luc_credits: <number>
    delta_percent: <number>

  evidence:
    receipt_hash: <SHA-256 of this receipt>
    manifest_hash: <SHA-256 of the pipeline manifest>
    artifact_hashes: <concatenated SHA-256 of all artifacts>
    locker_ref: <Evidence Locker storage reference>
```

## Evidence Locker Storage

All schemas are stored in the Evidence Locker with the following path convention:

```
evidence-locker/
  pipelines/
    fdh-<uuid>/
      manifest.yaml          # Pipeline manifest
      receipt.yaml            # BAMARAM receipt
      artifacts/
        art-<uuid>.yaml       # Artifact metadata
        art-<uuid>.content    # Artifact content (if storable)
      oracle/
        gate-results.yaml     # Detailed ORACLE gate results
      failures/
        failure-report.yaml   # Generated on pipeline failure
```

All files are hashed and the hashes are chained to produce the final `evidence_hash` in the BAMARAM receipt. Any tampering with stored artifacts will break the hash chain and be detected on audit.
