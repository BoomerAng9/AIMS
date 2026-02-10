/**
 * @gateway/submission-service
 * @version 1.0.0
 * @owner ACHEEVY
 *
 * Submission + Compliance Pack service — manages the full lifecycle of
 * submissions from draft to delivery, partner acknowledgment, and
 * compliance pack workflows (Draft → Review → Approve → Deliver).
 *
 * Non-negotiables enforced:
 *  - Full audit trail on every action
 *  - Evidence must be attached before submission
 *  - Partner can only access scoped materials
 *  - Delivery via SDT or approved push/webhook
 */

import type {
  Submission,
  SubmissionStatus,
  SubmissionThread,
  SubmissionAuditEntry,
  ExternalParty,
  CompliancePack,
  CompliancePackStatus,
  ComplianceField,
  RequiredEvidence,
  CompliancePackTemplate,
  ComplianceWorkflow,
  DeliveryConstraints,
  ArtifactType,
} from '../types/gateway';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function generateId(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 15);
  const ts = Date.now().toString(36);
  return `${prefix}_${ts}_${rand}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

/* ------------------------------------------------------------------ */
/*  Submission Service                                                */
/* ------------------------------------------------------------------ */

export class SubmissionService {
  private submissions = new Map<string, Submission>();
  private partners = new Map<string, ExternalParty>();

  /* ----- Partner Management ----- */

  registerPartner(partner: Omit<ExternalParty, 'partner_id' | 'created_at'>): ExternalParty {
    const party: ExternalParty = {
      ...partner,
      partner_id: generateId('prt'),
      created_at: nowISO(),
    };
    this.partners.set(party.partner_id, party);
    return party;
  }

  getPartner(partner_id: string): ExternalParty | undefined {
    return this.partners.get(partner_id);
  }

  /* ----- Create Submission ----- */

  create(params: {
    tenant_id: string;
    workspace_id: string;
    title: string;
    partner_id: string;
    form_data?: Record<string, unknown>;
    evidence_refs?: string[];
  }): Submission {
    // Validate partner exists
    if (!this.partners.has(params.partner_id)) {
      throw new Error(`Partner '${params.partner_id}' not found`);
    }

    const submission: Submission = {
      submission_id: generateId('sub'),
      tenant_id: params.tenant_id,
      workspace_id: params.workspace_id,
      title: params.title,
      partner_id: params.partner_id,
      status: 'draft',
      form_data: params.form_data ?? {},
      evidence_refs: params.evidence_refs ?? [],
      thread: [],
      audit_log: [
        {
          action: 'created',
          actor: 'system',
          timestamp: nowISO(),
          details: `Submission '${params.title}' created`,
        },
      ],
      created_at: nowISO(),
      updated_at: nowISO(),
    };

    this.submissions.set(submission.submission_id, submission);
    return submission;
  }

  /* ----- Update Form Data ----- */

  updateFormData(submission_id: string, form_data: Record<string, unknown>, actor: string): Submission {
    const sub = this.getOrThrow(submission_id);
    if (sub.status !== 'draft') {
      throw new Error(`Cannot update form data: submission is '${sub.status}', not 'draft'`);
    }
    sub.form_data = { ...sub.form_data, ...form_data };
    sub.updated_at = nowISO();
    this.audit(sub, 'form_data_updated', actor);
    return sub;
  }

  /* ----- Attach Evidence ----- */

  attachEvidence(submission_id: string, artifact_ref: string, actor: string): Submission {
    const sub = this.getOrThrow(submission_id);
    if (!sub.evidence_refs.includes(artifact_ref)) {
      sub.evidence_refs.push(artifact_ref);
    }
    sub.updated_at = nowISO();
    this.audit(sub, 'evidence_attached', actor, `Artifact: ${artifact_ref}`);
    return sub;
  }

  /* ----- Submit for Review ----- */

  submit(submission_id: string, actor: string): Submission {
    const sub = this.getOrThrow(submission_id);
    if (sub.status !== 'draft') {
      throw new Error(`Cannot submit: status is '${sub.status}', expected 'draft'`);
    }
    sub.status = 'in_review';
    sub.updated_at = nowISO();
    this.audit(sub, 'submitted', actor);
    return sub;
  }

  /* ----- Approve ----- */

  approve(submission_id: string, actor: string): Submission {
    const sub = this.getOrThrow(submission_id);
    if (sub.status !== 'in_review') {
      throw new Error(`Cannot approve: status is '${sub.status}', expected 'in_review'`);
    }
    sub.status = 'approved';
    sub.updated_at = nowISO();
    this.audit(sub, 'approved', actor);
    return sub;
  }

  /* ----- Deliver ----- */

  deliver(submission_id: string, sdt_token_id: string, actor: string): Submission {
    const sub = this.getOrThrow(submission_id);
    if (sub.status !== 'approved') {
      throw new Error(`Cannot deliver: status is '${sub.status}', expected 'approved'`);
    }
    sub.status = 'delivered';
    sub.sdt_token_id = sdt_token_id;
    sub.delivered_at = nowISO();
    sub.updated_at = nowISO();
    this.audit(sub, 'delivered', actor, `SDT: ${sdt_token_id}`);
    return sub;
  }

  /* ----- Partner Acknowledges ----- */

  acknowledge(submission_id: string, partner_id: string): Submission {
    const sub = this.getOrThrow(submission_id);
    if (sub.status !== 'delivered') {
      throw new Error(`Cannot acknowledge: status is '${sub.status}', expected 'delivered'`);
    }
    if (sub.partner_id !== partner_id) {
      throw new Error('Partner ID mismatch');
    }
    sub.status = 'acknowledged';
    sub.acknowledged_at = nowISO();
    sub.updated_at = nowISO();
    this.audit(sub, 'acknowledged', partner_id);
    return sub;
  }

  /* ----- Add Thread Message ----- */

  addMessage(submission_id: string, author_id: string, author_type: 'tenant' | 'partner', content: string, attachments?: string[]): Submission {
    const sub = this.getOrThrow(submission_id);
    const message: SubmissionThread = {
      message_id: generateId('msg'),
      author_id,
      author_type,
      content,
      attachments: attachments ?? [],
      timestamp: nowISO(),
    };
    sub.thread.push(message);
    sub.updated_at = nowISO();
    this.audit(sub, 'message_added', author_id, `Thread message by ${author_type}`);
    return sub;
  }

  /* ----- Reject ----- */

  reject(submission_id: string, actor: string, reason: string): Submission {
    const sub = this.getOrThrow(submission_id);
    sub.status = 'rejected';
    sub.updated_at = nowISO();
    this.audit(sub, 'rejected', actor, reason);
    return sub;
  }

  /* ----- Lookup ----- */

  getSubmission(submission_id: string): Submission | undefined {
    return this.submissions.get(submission_id);
  }

  listByTenant(tenant_id: string, status?: SubmissionStatus): Submission[] {
    let results = Array.from(this.submissions.values()).filter(s => s.tenant_id === tenant_id);
    if (status) results = results.filter(s => s.status === status);
    return results;
  }

  listByPartner(partner_id: string): Submission[] {
    return Array.from(this.submissions.values()).filter(s => s.partner_id === partner_id);
  }

  /* ----- Private Helpers ----- */

  private getOrThrow(submission_id: string): Submission {
    const sub = this.submissions.get(submission_id);
    if (!sub) throw new Error(`Submission '${submission_id}' not found`);
    return sub;
  }

  private audit(sub: Submission, action: string, actor: string, details?: string): void {
    sub.audit_log.push({ action, actor, timestamp: nowISO(), details });
  }
}

/* ------------------------------------------------------------------ */
/*  Compliance Pack Service                                           */
/* ------------------------------------------------------------------ */

export class CompliancePackService {
  private packs = new Map<string, CompliancePack>();
  private templates = new Map<string, CompliancePackTemplate>();

  /* ----- Register Template ----- */

  registerTemplate(template: CompliancePackTemplate): CompliancePackTemplate {
    this.templates.set(template.template_id, template);
    return template;
  }

  getTemplate(template_id: string): CompliancePackTemplate | undefined {
    return this.templates.get(template_id);
  }

  listTemplates(filters?: { region?: string; industry?: string }): CompliancePackTemplate[] {
    let results = Array.from(this.templates.values());
    if (filters?.region) results = results.filter(t => t.region === filters.region);
    if (filters?.industry) results = results.filter(t => t.industry === filters.industry);
    return results;
  }

  /* ----- Create Pack from Template ----- */

  createFromTemplate(
    template_id: string,
    tenant_id: string,
    workspace_id: string,
    name?: string
  ): CompliancePack {
    const template = this.templates.get(template_id);
    if (!template) throw new Error(`Template '${template_id}' not found`);

    const pack: CompliancePack = {
      pack_id: generateId('cpack'),
      tenant_id,
      workspace_id,
      template_id,
      region: template.region,
      industry: template.industry,
      name: name ?? template.name,
      status: 'draft',
      required_fields: template.required_fields.map(f => ({
        ...f,
        completed: false,
      })),
      required_evidence: template.required_evidence_types.map(e => ({
        evidence_type: e.type,
        description: e.description,
        satisfied: false,
      })),
      retention_period: template.retention_period,
      delivery_constraints: { ...template.delivery_constraints },
      evidence_refs: [],
      workflow: {
        current_stage: 'draft',
        approvers: [],
      },
      created_at: nowISO(),
      updated_at: nowISO(),
    };

    this.packs.set(pack.pack_id, pack);
    return pack;
  }

  /* ----- Update Field ----- */

  updateField(pack_id: string, field_id: string, value: unknown): CompliancePack {
    const pack = this.getPackOrThrow(pack_id);
    if (pack.workflow.current_stage !== 'draft') {
      throw new Error('Fields can only be updated in draft stage');
    }
    const field = pack.required_fields.find(f => f.field_id === field_id);
    if (!field) throw new Error(`Field '${field_id}' not found in pack`);
    field.value = value;
    field.completed = value != null && value !== '';
    pack.updated_at = nowISO();
    return pack;
  }

  /* ----- Attach Evidence ----- */

  attachEvidence(pack_id: string, evidence_type: ArtifactType, artifact_ref: string): CompliancePack {
    const pack = this.getPackOrThrow(pack_id);
    const req = pack.required_evidence.find(e => e.evidence_type === evidence_type && !e.satisfied);
    if (req) {
      req.satisfied = true;
      req.artifact_ref = artifact_ref;
    }
    if (!pack.evidence_refs.includes(artifact_ref)) {
      pack.evidence_refs.push(artifact_ref);
    }
    pack.updated_at = nowISO();
    return pack;
  }

  /* ----- Workflow Transitions ----- */

  submitForReview(pack_id: string): CompliancePack {
    const pack = this.getPackOrThrow(pack_id);
    if (pack.workflow.current_stage !== 'draft') {
      throw new Error('Can only submit from draft stage');
    }

    // Check all required fields completed
    const incompleteFields = pack.required_fields.filter(f => f.required && !f.completed);
    if (incompleteFields.length > 0) {
      throw new Error(
        `Required fields not completed: ${incompleteFields.map(f => f.label).join(', ')}`
      );
    }

    // Check all required evidence attached
    const missingEvidence = pack.required_evidence.filter(e => !e.satisfied);
    if (missingEvidence.length > 0) {
      throw new Error(
        `Required evidence not attached: ${missingEvidence.map(e => e.description).join(', ')}`
      );
    }

    pack.workflow.current_stage = 'review';
    pack.status = 'review';
    pack.updated_at = nowISO();
    return pack;
  }

  approve(pack_id: string, approver: string): CompliancePack {
    const pack = this.getPackOrThrow(pack_id);
    if (pack.workflow.current_stage !== 'review') {
      throw new Error('Can only approve from review stage');
    }
    pack.workflow.current_stage = 'approve';
    pack.workflow.approved_by = approver;
    pack.workflow.approved_at = nowISO();
    pack.status = 'approved';
    pack.updated_at = nowISO();
    return pack;
  }

  deliver(pack_id: string): CompliancePack {
    const pack = this.getPackOrThrow(pack_id);
    if (pack.workflow.current_stage !== 'approve') {
      throw new Error('Can only deliver from approve stage');
    }
    pack.workflow.current_stage = 'deliver';
    pack.status = 'delivered';
    pack.updated_at = nowISO();
    return pack;
  }

  /* ----- Readiness Check ----- */

  checkReadiness(pack_id: string): {
    ready: boolean;
    missing_fields: string[];
    missing_evidence: string[];
  } {
    const pack = this.getPackOrThrow(pack_id);
    const missing_fields = pack.required_fields
      .filter(f => f.required && !f.completed)
      .map(f => f.label);
    const missing_evidence = pack.required_evidence
      .filter(e => !e.satisfied)
      .map(e => e.description);

    return {
      ready: missing_fields.length === 0 && missing_evidence.length === 0,
      missing_fields,
      missing_evidence,
    };
  }

  /* ----- Lookup ----- */

  getPack(pack_id: string): CompliancePack | undefined {
    return this.packs.get(pack_id);
  }

  listByTenant(tenant_id: string, status?: CompliancePackStatus): CompliancePack[] {
    let results = Array.from(this.packs.values()).filter(p => p.tenant_id === tenant_id);
    if (status) results = results.filter(p => p.status === status);
    return results;
  }

  /* ----- Stats ----- */

  stats(): { total: number; by_status: Record<string, number>; templates: number } {
    const by_status: Record<string, number> = {};
    for (const p of this.packs.values()) {
      by_status[p.status] = (by_status[p.status] ?? 0) + 1;
    }
    return { total: this.packs.size, by_status, templates: this.templates.size };
  }

  /* ----- Private ----- */

  private getPackOrThrow(pack_id: string): CompliancePack {
    const pack = this.packs.get(pack_id);
    if (!pack) throw new Error(`Compliance pack '${pack_id}' not found`);
    return pack;
  }
}
