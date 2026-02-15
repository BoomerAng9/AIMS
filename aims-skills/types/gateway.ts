/**
 * @types/gateway
 * @version 1.0.0
 * @owner ACHEEVY
 *
 * Canonical type definitions for the A.I.M.S. Gateway System.
 * Covers Secure Drop Tokens, Evidence Locker, Submissions, Certification Gates,
 * Compliance Packs, Job Packets, Receipts, and all Gateway service primitives.
 *
 * @see AIMS_GATEWAY_SYSTEM_MEMO 02/09/2026
 */

import type {
  RoleType,
  PipelineStage,
  EventType,
  OverlayEvent,
} from './chain-of-command';

/* ================================================================== */
/*  1. Tenant & Workspace Isolation                                   */
/* ================================================================== */

export type TenantRole = 'owner' | 'admin' | 'member' | 'viewer';

export type WorkspaceEnvironment = 'development' | 'staging' | 'production';

export interface TenantBoundary {
  tenant_id: string;
  display_name: string;
  billing_plan_id: string;
  policy_overrides: Record<string, unknown>;
  created_at: string;
  /** Region for data residency enforcement */
  data_region: string;
}

export interface Workspace {
  workspace_id: string;
  tenant_id: string;
  name: string;
  environment: WorkspaceEnvironment;
  members: WorkspaceMember[];
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  user_id: string;
  role: TenantRole;
  joined_at: string;
  /** Attribute-based access for sensitive evidence */
  attribute_tags?: string[];
}

/* ================================================================== */
/*  2. Secure Drop Token (SDT) Primitives                             */
/* ================================================================== */

export type SDTPermission = 'view' | 'download' | 'acknowledge' | 'comment';

export type SDTDeliveryMethod = 'partner_portal' | 'webhook_push' | 'signed_export';

export type SDTStatus = 'active' | 'expired' | 'revoked' | 'consumed';

export interface SecureDropToken {
  token_id: string;
  tenant_id: string;
  workspace_id: string;
  project_id: string;
  /** Explicit artifact set this token grants access to */
  artifact_refs: string[];
  permissions: SDTPermission[];
  delivery_method: SDTDeliveryMethod;
  /** ISO 8601 expiration — required */
  expires_at: string;
  /** ISO 8601 creation timestamp */
  issued_at: string;
  /** Handle that issued the token */
  issued_by: string;
  status: SDTStatus;
  /** Optional partner identity (for partner-portal delivery) */
  partner_id?: string;
  /** Optional allowlisted webhook endpoint */
  webhook_endpoint?: string;
  /** Optional device/session restriction (policy-driven) */
  session_restrictions?: SessionRestriction;
  /** Audit event IDs tied to this token */
  audit_trail: string[];
}

export interface SessionRestriction {
  ip_allowlist?: string[];
  device_fingerprint?: string;
  max_access_count?: number;
  current_access_count: number;
}

export interface SDTIssuanceRequest {
  tenant_id: string;
  workspace_id: string;
  project_id: string;
  artifact_refs: string[];
  permissions: SDTPermission[];
  delivery_method: SDTDeliveryMethod;
  expires_in_seconds: number;
  partner_id?: string;
  webhook_endpoint?: string;
  session_restrictions?: Omit<SessionRestriction, 'current_access_count'>;
}

export interface SDTAccessLog {
  token_id: string;
  accessor_id: string;
  action: SDTPermission;
  artifact_ref: string;
  timestamp: string;
  ip_address?: string;
  result: 'allowed' | 'denied' | 'rate_limited';
  denial_reason?: string;
}

/* ================================================================== */
/*  3. Evidence Locker                                                */
/* ================================================================== */

export type ArtifactType =
  | 'document'
  | 'receipt'
  | 'attestation'
  | 'log'
  | 'scan_result'
  | 'deploy_proof'
  | 'signed_export'
  | 'build_provenance'
  | 'dependency_manifest'
  | 'permission_manifest'
  | 'smoke_test_result'
  | 'rollback_plan'
  | 'screenshot'
  | 'user_upload';

export type ArtifactStatus = 'pending' | 'verified' | 'superseded' | 'redacted';

export interface EvidenceArtifact {
  artifact_id: string;
  tenant_id: string;
  workspace_id: string;
  project_id?: string;
  type: ArtifactType;
  /** Human-readable label */
  label: string;
  /** Content hash (SHA-256) for integrity verification */
  content_hash: string;
  /** Storage URI (tenant-scoped bucket) */
  storage_uri: string;
  /** Size in bytes */
  size_bytes: number;
  mime_type: string;
  status: ArtifactStatus;
  /** Handle that created this artifact */
  created_by: string;
  created_at: string;
  /** Chain-of-custody entries */
  custody_chain: CustodyEntry[];
  /** Retention policy (ISO 8601 duration or 'indefinite') */
  retention: string;
  /** Metadata bag for scan results, build info, etc. */
  metadata: Record<string, unknown>;
}

export interface CustodyEntry {
  action: 'created' | 'accessed' | 'exported' | 'signed' | 'verified' | 'superseded' | 'redacted';
  actor: string;
  timestamp: string;
  details?: string;
}

export interface EvidenceLockerQuery {
  tenant_id: string;
  workspace_id?: string;
  project_id?: string;
  artifact_types?: ArtifactType[];
  status?: ArtifactStatus[];
  created_after?: string;
  created_before?: string;
  limit?: number;
  cursor?: string;
}

export interface EvidenceLockerResult {
  artifacts: EvidenceArtifact[];
  total_count: number;
  next_cursor?: string;
}

/* ================================================================== */
/*  4. Receipts                                                       */
/* ================================================================== */

export interface Receipt {
  receipt_id: string;
  tenant_id: string;
  workspace_id: string;
  job_packet_id: string;
  /** Summary of what was executed */
  summary: string;
  /** Artifact hash references (tied to Evidence Locker) */
  artifact_hashes: Array<{ artifact_id: string; hash: string }>;
  /** Event log pointer IDs */
  event_log_refs: string[];
  /** Digital signature (base64-encoded) */
  signature: string;
  /** Role that signed the receipt */
  signed_by: string;
  issued_at: string;
  /** Pipeline stage this receipt covers */
  stage: PipelineStage;
}

/* ================================================================== */
/*  5. Job Packets (Deterministic Execution Bundles)                  */
/* ================================================================== */

export type JobStatus =
  | 'pending_approval'
  | 'approved'
  | 'in_progress'
  | 'awaiting_evidence'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'escalated';

export interface JobStep {
  step_number: number;
  description: string;
  assigned_to: string;
  /** Required artifacts to prove step completion */
  required_artifacts: ArtifactType[];
  /** Constraints on execution (timeouts, resource limits) */
  constraints: JobConstraints;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  receipt_id?: string;
}

export interface JobConstraints {
  timeout_seconds?: number;
  max_cost_usd?: number;
  max_tokens?: number;
  sandbox_required?: boolean;
  approval_required?: boolean;
  /** Allowed tools for this step */
  allowed_tools?: string[];
}

export interface JobPacket {
  job_id: string;
  tenant_id: string;
  workspace_id: string;
  project_id?: string;
  /** Human-readable job title */
  title: string;
  /** Intent description from user */
  intent: string;
  /** Pipeline phase mapping */
  current_stage: PipelineStage;
  status: JobStatus;
  /** LUC quote reference */
  luc_quote_id?: string;
  /** Ordered execution steps */
  steps: JobStep[];
  /** Approvals received */
  approvals: JobApproval[];
  /** Chain-of-command routing */
  routing: JobRouting;
  /** All receipts emitted during execution */
  receipts: string[];
  /** Evidence artifacts produced */
  evidence_refs: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface JobApproval {
  approver_handle: string;
  approved_at: string;
  scope: string;
  conditions?: string[];
}

export interface JobRouting {
  /** Who created the job */
  originated_by: string;
  /** Current assignee (chain-of-command handle) */
  current_assignee: string;
  /** Routing history */
  route_log: Array<{
    from: string;
    to: string;
    action: string;
    timestamp: string;
  }>;
}

/* ================================================================== */
/*  6. LUC Quote (Gateway Extension)                                  */
/* ================================================================== */

export interface LucQuote {
  quote_id: string;
  tenant_id: string;
  workspace_id: string;
  job_id?: string;
  /** Estimated token burn */
  estimated_tokens: number;
  /** Cost range (USD) */
  cost_range: { min: number; max: number };
  /** Estimated timeline (ISO 8601 duration) */
  estimated_duration: string;
  /** Risk flags */
  risk_flags: RiskFlag[];
  /** Approval requirements derived from tenant policy */
  approval_requirements: ApprovalRequirement[];
  /** Whether the user has approved this quote */
  approved: boolean;
  approved_at?: string;
  created_at: string;
  expires_at: string;
}

export interface RiskFlag {
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface ApprovalRequirement {
  type: 'policy_based' | 'budget_based' | 'security_based';
  description: string;
  approver_roles: TenantRole[];
  satisfied: boolean;
}

/* ================================================================== */
/*  7. Marketplace + Certification Gate                               */
/* ================================================================== */

export type CertificationBadge = 'certified' | 'verified_publisher' | 'managed_option';

export type InstallMode = 'one_click' | 'sandbox' | 'managed';

export type CertificationStatus =
  | 'pending'
  | 'in_review'
  | 'certified'
  | 'rejected'
  | 'revoked'
  | 'exception_approved';

export interface PlugListing {
  plug_id: string;
  name: string;
  version: string;
  publisher_id: string;
  publisher_name: string;
  description: string;
  category: string;
  tags: string[];
  badges: CertificationBadge[];
  install_modes: InstallMode[];
  certification: CertificationRecord;
  /** Evidence Locker artifact IDs for certification evidence */
  evidence_refs: string[];
  pricing?: PlugPricing;
  created_at: string;
  updated_at: string;
}

export interface PlugPricing {
  model: 'free' | 'one_time' | 'subscription' | 'usage_based';
  price_usd?: number;
  stripe_price_id?: string;
}

export interface CertificationRecord {
  status: CertificationStatus;
  /** Required listing evidence */
  evidence: CertificationEvidence;
  /** Exception details (if status is exception_approved) */
  exception?: CertificationException;
  certified_at?: string;
  certified_by?: string;
  last_reviewed_at?: string;
}

export interface CertificationEvidence {
  build_metadata: EvidenceCheck;
  dependency_scan: EvidenceCheck;
  permissions_manifest: EvidenceCheck;
  smoke_test: EvidenceCheck;
  rollback_readiness: EvidenceCheck;
}

export interface EvidenceCheck {
  required: boolean;
  passed: boolean;
  artifact_ref?: string;
  checked_at?: string;
  notes?: string;
}

export interface CertificationException {
  approved_by: string;
  approved_at: string;
  justification: string;
  scope: string;
  expires_at?: string;
}

export interface PlugInstallRequest {
  plug_id: string;
  tenant_id: string;
  workspace_id: string;
  install_mode: InstallMode;
  /** For managed installs, a job packet is created */
  create_job_packet?: boolean;
}

export interface PlugInstallResult {
  success: boolean;
  install_id: string;
  plug_id: string;
  install_mode: InstallMode;
  /** Evidence Locker reference for install attestation */
  attestation_ref?: string;
  error?: string;
}

/* ================================================================== */
/*  8. Submissions + Partner Portal                                   */
/* ================================================================== */

export type SubmissionStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'delivered'
  | 'acknowledged'
  | 'rejected';

export interface Submission {
  submission_id: string;
  tenant_id: string;
  workspace_id: string;
  /** Title of the submission */
  title: string;
  /** External party this is being delivered to */
  partner_id: string;
  status: SubmissionStatus;
  /** Form data (key-value) */
  form_data: Record<string, unknown>;
  /** Evidence artifacts attached */
  evidence_refs: string[];
  /** SDT for delivery */
  sdt_token_id?: string;
  /** Submission thread (optional structured communications) */
  thread: SubmissionThread[];
  /** Audit trail */
  audit_log: SubmissionAuditEntry[];
  created_at: string;
  updated_at: string;
  delivered_at?: string;
  acknowledged_at?: string;
}

export interface SubmissionThread {
  message_id: string;
  author_id: string;
  author_type: 'tenant' | 'partner';
  content: string;
  attachments: string[];
  timestamp: string;
}

export interface SubmissionAuditEntry {
  action: string;
  actor: string;
  timestamp: string;
  details?: string;
}

export interface ExternalParty {
  partner_id: string;
  tenant_id: string;
  name: string;
  type: 'partner' | 'auditor' | 'regulator' | 'sponsor' | 'enterprise_customer' | 'institution';
  contact_email?: string;
  /** Partner-specific API token (scoped) */
  api_token_ref?: string;
  /** Allowlisted webhook endpoints */
  webhook_endpoints: string[];
  portal_access_enabled: boolean;
  created_at: string;
}

/* ================================================================== */
/*  9. Compliance Packs                                               */
/* ================================================================== */

export type CompliancePackStatus = 'draft' | 'in_progress' | 'review' | 'approved' | 'delivered';

export interface CompliancePack {
  pack_id: string;
  tenant_id: string;
  workspace_id: string;
  /** Pack template ID */
  template_id: string;
  /** Region / industry context */
  region: string;
  industry: string;
  name: string;
  status: CompliancePackStatus;
  /** Required fields with completion status */
  required_fields: ComplianceField[];
  /** Required evidence types */
  required_evidence: RequiredEvidence[];
  /** Retention requirements (ISO 8601 duration) */
  retention_period: string;
  /** Delivery constraints */
  delivery_constraints: DeliveryConstraints;
  /** Evidence Locker references for attached artifacts */
  evidence_refs: string[];
  /** Workflow state */
  workflow: ComplianceWorkflow;
  created_at: string;
  updated_at: string;
}

export interface ComplianceField {
  field_id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'file' | 'attestation';
  required: boolean;
  value?: unknown;
  completed: boolean;
}

export interface RequiredEvidence {
  evidence_type: ArtifactType;
  description: string;
  /** Has a matching artifact been attached? */
  satisfied: boolean;
  artifact_ref?: string;
}

export interface DeliveryConstraints {
  /** Is portal-only delivery enforced? */
  portal_only: boolean;
  /** Are push/webhooks allowed? */
  push_enabled: boolean;
  /** Allowed export formats */
  allowed_formats: string[];
}

export interface ComplianceWorkflow {
  current_stage: 'draft' | 'review' | 'approve' | 'deliver';
  /** Internal approvers (tenant users) */
  approvers: string[];
  approved_by?: string;
  approved_at?: string;
}

export interface CompliancePackTemplate {
  template_id: string;
  name: string;
  region: string;
  industry: string;
  version: string;
  required_fields: Omit<ComplianceField, 'value' | 'completed'>[];
  required_evidence_types: Array<{ type: ArtifactType; description: string }>;
  retention_period: string;
  delivery_constraints: DeliveryConstraints;
}

/* ================================================================== */
/*  10. Gateway Event Bus                                             */
/* ================================================================== */

export type GatewayEventType =
  | 'sdt.issued'
  | 'sdt.accessed'
  | 'sdt.revoked'
  | 'sdt.expired'
  | 'evidence.created'
  | 'evidence.verified'
  | 'evidence.exported'
  | 'submission.created'
  | 'submission.submitted'
  | 'submission.delivered'
  | 'submission.acknowledged'
  | 'plug.certified'
  | 'plug.installed'
  | 'plug.updated'
  | 'plug.removed'
  | 'job.created'
  | 'job.approved'
  | 'job.step_completed'
  | 'job.completed'
  | 'job.failed'
  | 'job.escalated'
  | 'compliance.pack_started'
  | 'compliance.pack_approved'
  | 'compliance.pack_delivered'
  | 'quote.generated'
  | 'quote.approved'
  | 'quote.expired';

export interface GatewayEvent {
  event_id: string;
  event_type: GatewayEventType;
  tenant_id: string;
  workspace_id?: string;
  /** Actor identity (user ID or role handle) */
  actor: string;
  actor_type: 'user' | 'role' | 'system';
  /** Subject entity ID */
  subject_id: string;
  subject_type: 'sdt' | 'artifact' | 'submission' | 'plug' | 'job' | 'compliance_pack' | 'quote';
  /** Event payload */
  payload: Record<string, unknown>;
  timestamp: string;
  /** Overlay event if this should surface to user */
  overlay?: OverlayEvent;
}

/* ================================================================== */
/*  11. Operations Surface (User-Safe "Glass Box")                    */
/* ================================================================== */

export type OperationPhase = 'ingest' | 'route' | 'delegate' | 'verify' | 'deliver';

export interface OperationsFeedEntry {
  entry_id: string;
  job_id: string;
  phase: OperationPhase;
  /** Role that produced this entry (displayed as verified event) */
  role_handle: string;
  /** User-safe display text (no internal reasoning) */
  display_text: string;
  /** Linked artifact in Evidence Locker */
  artifact_ref?: string;
  /** Proof type for artifact link */
  proof_type?: string;
  timestamp: string;
}

export interface OperationsFeed {
  job_id: string;
  tenant_id: string;
  workspace_id: string;
  current_phase: OperationPhase;
  entries: OperationsFeedEntry[];
  receipts: string[];
}

/* ================================================================== */
/*  12. Gateway Service Interfaces (Contract Shapes)                  */
/* ================================================================== */

export interface TokenServiceAPI {
  issue(request: SDTIssuanceRequest): Promise<SecureDropToken>;
  revoke(token_id: string, reason: string): Promise<void>;
  rotate(token_id: string): Promise<SecureDropToken>;
  validate(token_id: string): Promise<{ valid: boolean; reason?: string }>;
  getAccessLog(token_id: string): Promise<SDTAccessLog[]>;
}

export interface SubmissionServiceAPI {
  create(submission: Omit<Submission, 'submission_id' | 'audit_log' | 'created_at' | 'updated_at'>): Promise<Submission>;
  submit(submission_id: string): Promise<Submission>;
  deliver(submission_id: string, delivery_method: SDTDeliveryMethod): Promise<{ sdt: SecureDropToken; submission: Submission }>;
  acknowledge(submission_id: string, partner_id: string): Promise<Submission>;
}

export interface CertificationServiceAPI {
  submitForReview(plug_id: string): Promise<CertificationRecord>;
  runChecks(plug_id: string): Promise<CertificationEvidence>;
  certify(plug_id: string, certifier: string): Promise<CertificationRecord>;
  revokeOrReject(plug_id: string, reason: string): Promise<CertificationRecord>;
  approveException(plug_id: string, exception: Omit<CertificationException, 'approved_at'>): Promise<CertificationRecord>;
}

export interface EvidenceLockerAPI {
  store(artifact: Omit<EvidenceArtifact, 'artifact_id' | 'custody_chain' | 'created_at'>): Promise<EvidenceArtifact>;
  query(query: EvidenceLockerQuery): Promise<EvidenceLockerResult>;
  verify(artifact_id: string): Promise<{ valid: boolean; hash_match: boolean }>;
  export(artifact_ids: string[], format: 'pdf' | 'csv' | 'json'): Promise<{ bundle_uri: string; manifest_hash: string }>;
  addCustodyEntry(artifact_id: string, entry: Omit<CustodyEntry, 'timestamp'>): Promise<EvidenceArtifact>;
}

export interface BillingMeteringAPI {
  generateQuote(request: Omit<LucQuote, 'quote_id' | 'approved' | 'created_at' | 'expires_at'>): Promise<LucQuote>;
  approveQuote(quote_id: string): Promise<LucQuote>;
  checkBudget(tenant_id: string, estimated_cost: number): Promise<{ allowed: boolean; remaining: number; policy_flags: string[] }>;
  recordUsage(tenant_id: string, service: string, quantity: number): Promise<void>;
}

/* ================================================================== */
/*  13. Gateway Configuration                                        */
/* ================================================================== */

export interface GatewayConfig {
  /** Default SDT expiration in seconds */
  default_sdt_ttl_seconds: number;
  /** Maximum SDT TTL (safety cap) */
  max_sdt_ttl_seconds: number;
  /** Rate limit: max token issuances per minute per tenant */
  sdt_rate_limit_per_minute: number;
  /** Rate limit: max accesses per SDT per minute */
  sdt_access_rate_limit_per_minute: number;
  /** Maximum artifact size in bytes */
  max_artifact_size_bytes: number;
  /** Default retention period for evidence */
  default_retention_period: string;
  /** Whether managed installs are enabled */
  managed_installs_enabled: boolean;
  /** Whether partner webhooks are enabled */
  partner_webhooks_enabled: boolean;
  /** Maximum webhook payload size */
  max_webhook_payload_bytes: number;
}
