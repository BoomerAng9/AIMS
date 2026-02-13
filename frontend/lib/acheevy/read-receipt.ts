// frontend/lib/acheevy/read-receipt.ts

/**
 * ACHEEVY Read Receipt — Public-Safe Engagement Record
 *
 * Per ACHEEVY Process Model Memo 2:
 * - ACHEEVY runs a structured engagement workflow in the background
 * - Only shows user a sanitized, optional Read Receipt
 * - Never reveals internal artifacts, pricing logic, or implementation details
 *
 * What the Read Receipt shows (public-safe):
 * - Engagement ID
 * - Client role classification (Client | Principal)
 * - Request summary (sanitized)
 * - Detected intent category
 * - Decision checkpoints
 * - Tools used (high level only)
 * - Audit posture
 * - Status timeline
 */

// ── Types ──

export type ClientRole = "client" | "principal";

export type IntentCategory = "Build" | "Automate" | "Research" | "Deploy" | "Support";

export type EngagementStatus = "queued" | "classifying" | "routing" | "in_progress" | "review" | "delivered" | "closed";

export interface EngagementCheckpoint {
  label: string;
  status: "pending" | "passed" | "blocked";
  requiredApproval: boolean;
  passedAt?: string;
}

export interface ReadReceipt {
  engagementId: string;
  userRole: ClientRole;
  intentCategory: IntentCategory;
  summaryPublic: string;
  checkpointsPublic: EngagementCheckpoint[];
  toolsPublic: string[];
  auditFlagsPublic: string[];
  timelinePublic: {
    status: EngagementStatus;
    timestamp: string;
    label: string;
  }[];
  viewState: "hidden" | "visible";
  createdAt: string;
  updatedAt: string;
}

// ── Factory ──

let engagementCounter = 0;

export function createReadReceipt(
  message: string,
  intentCategory: IntentCategory,
  userRole: ClientRole = "client"
): ReadReceipt {
  engagementCounter++;
  const now = new Date().toISOString();
  const engagementId = `ENG-${Date.now().toString(36).toUpperCase()}-${String(engagementCounter).padStart(3, "0")}`;

  // Sanitize summary — never expose internals
  const summaryPublic = sanitizeSummary(message);

  // Determine checkpoints based on intent
  const checkpointsPublic = buildCheckpoints(intentCategory);

  // High-level tools (no internal hooks exposed)
  const toolsPublic = resolvePublicTools(intentCategory);

  // Audit flags
  const auditFlagsPublic = resolveAuditFlags(intentCategory);

  return {
    engagementId,
    userRole,
    intentCategory,
    summaryPublic,
    checkpointsPublic,
    toolsPublic,
    auditFlagsPublic,
    timelinePublic: [
      { status: "queued", timestamp: now, label: "Request received" },
    ],
    viewState: "hidden",
    createdAt: now,
    updatedAt: now,
  };
}

export function advanceReceipt(
  receipt: ReadReceipt,
  newStatus: EngagementStatus,
  label: string
): ReadReceipt {
  return {
    ...receipt,
    timelinePublic: [
      ...receipt.timelinePublic,
      { status: newStatus, timestamp: new Date().toISOString(), label },
    ],
    updatedAt: new Date().toISOString(),
  };
}

export function passCheckpoint(receipt: ReadReceipt, checkpointLabel: string): ReadReceipt {
  return {
    ...receipt,
    checkpointsPublic: receipt.checkpointsPublic.map((cp) =>
      cp.label === checkpointLabel
        ? { ...cp, status: "passed", passedAt: new Date().toISOString() }
        : cp
    ),
    updatedAt: new Date().toISOString(),
  };
}

// ── Classify intent from message ──

export function classifyIntent(message: string): IntentCategory {
  const lower = message.toLowerCase();
  if (/build|create|develop|code|app|site|website|platform/.test(lower)) return "Build";
  if (/automate|workflow|n8n|pipeline|schedule|trigger/.test(lower)) return "Automate";
  if (/research|analyze|market|data|report|competitive/.test(lower)) return "Research";
  if (/deploy|launch|ship|publish|release|docker|container/.test(lower)) return "Deploy";
  return "Support";
}

// ── Internal helpers (never exposed to user) ──

function sanitizeSummary(message: string): string {
  // Strip anything that looks like a secret, URL, or internal reference
  let clean = message
    .replace(/sk-[a-zA-Z0-9-_]{20,}/g, "[redacted]")
    .replace(/https?:\/\/[^\s]+/g, "[link]")
    .replace(/[a-f0-9]{32,}/g, "[hash]");

  // Truncate to reasonable length
  if (clean.length > 200) clean = clean.slice(0, 200) + "...";
  return clean;
}

function buildCheckpoints(intent: IntentCategory): EngagementCheckpoint[] {
  const base: EngagementCheckpoint[] = [
    { label: "Intent classified", status: "passed", requiredApproval: false, passedAt: new Date().toISOString() },
    { label: "Scope validated", status: "pending", requiredApproval: false },
  ];

  switch (intent) {
    case "Build":
      return [
        ...base,
        { label: "Architecture reviewed", status: "pending", requiredApproval: false },
        { label: "Build plan approved", status: "pending", requiredApproval: true },
        { label: "Quality gates passed", status: "pending", requiredApproval: false },
        { label: "Delivery confirmed", status: "pending", requiredApproval: false },
      ];
    case "Deploy":
      return [
        ...base,
        { label: "Deployment manifest verified", status: "pending", requiredApproval: false },
        { label: "Approval required before deploy", status: "pending", requiredApproval: true },
        { label: "Health check passed", status: "pending", requiredApproval: false },
      ];
    case "Automate":
      return [
        ...base,
        { label: "Workflow schema validated", status: "pending", requiredApproval: false },
        { label: "Failure paths identified", status: "pending", requiredApproval: false },
        { label: "Gate approval", status: "pending", requiredApproval: true },
      ];
    case "Research":
      return [
        ...base,
        { label: "Sources identified", status: "pending", requiredApproval: false },
        { label: "Analysis complete", status: "pending", requiredApproval: false },
      ];
    default:
      return base;
  }
}

function resolvePublicTools(intent: IntentCategory): string[] {
  switch (intent) {
    case "Build":
      return ["Code Generation", "Architecture Review", "Quality Verification"];
    case "Deploy":
      return ["Container Orchestration", "Health Monitoring", "SSL Provisioning"];
    case "Automate":
      return ["n8n Workflow Engine", "Schema Validation", "Webhook Management"];
    case "Research":
      return ["Web Search", "Data Analysis", "Report Generation"];
    default:
      return ["Natural Language Processing", "Knowledge Retrieval"];
  }
}

function resolveAuditFlags(intent: IntentCategory): string[] {
  const flags = ["Logged"];
  if (intent === "Build" || intent === "Deploy") flags.push("Approval-gated");
  if (intent === "Automate") flags.push("Schema-validated");
  return flags;
}
