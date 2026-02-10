/**
 * @gateway/certification-gate
 * @version 1.0.0
 * @owner ACHEEVY
 *
 * Marketplace Certification Gate — validates Plugs (aiPLUGS) against
 * required evidence checks before installation is allowed.
 *
 * Non-negotiables enforced:
 *  - No install unless certified OR exception approved + logged
 *  - All checks produce artifacts into Evidence Locker
 *  - Badge assignment is deterministic
 */

import type {
  PlugListing,
  CertificationRecord,
  CertificationEvidence,
  CertificationException,
  CertificationBadge,
  CertificationStatus,
  EvidenceCheck,
  InstallMode,
  PlugInstallRequest,
  PlugInstallResult,
} from '../types/gateway';

import certReqs from './policies/certification-requirements.json';

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
/*  Certification Gate Service                                        */
/* ------------------------------------------------------------------ */

export class CertificationGateService {
  private plugs = new Map<string, PlugListing>();
  private installLog: Array<{ plug_id: string; tenant_id: string; workspace_id: string; install_mode: InstallMode; timestamp: string; result: string }> = [];

  /* ----- Register a Plug for listing ----- */

  registerPlug(plug: Omit<PlugListing, 'badges' | 'certification' | 'evidence_refs' | 'created_at' | 'updated_at'>): PlugListing {
    const listing: PlugListing = {
      ...plug,
      badges: [],
      certification: {
        status: 'pending',
        evidence: this.emptyEvidence(),
      },
      evidence_refs: [],
      created_at: nowISO(),
      updated_at: nowISO(),
    };

    this.plugs.set(listing.plug_id, listing);
    return listing;
  }

  /* ----- Submit for Review ----- */

  submitForReview(plug_id: string): CertificationRecord {
    const plug = this.getPlugOrThrow(plug_id);
    plug.certification.status = 'in_review';
    plug.updated_at = nowISO();
    return plug.certification;
  }

  /* ----- Run Required Checks ----- */

  runChecks(plug_id: string, results: Partial<Record<keyof CertificationEvidence, { passed: boolean; artifact_ref?: string; notes?: string }>>): CertificationEvidence {
    const plug = this.getPlugOrThrow(plug_id);
    const evidence = plug.certification.evidence;
    const now = nowISO();

    for (const [key, result] of Object.entries(results) as Array<[keyof CertificationEvidence, { passed: boolean; artifact_ref?: string; notes?: string }]>) {
      if (evidence[key]) {
        evidence[key].passed = result.passed;
        evidence[key].artifact_ref = result.artifact_ref;
        evidence[key].notes = result.notes;
        evidence[key].checked_at = now;

        if (result.artifact_ref) {
          plug.evidence_refs.push(result.artifact_ref);
        }
      }
    }

    plug.updated_at = now;
    return evidence;
  }

  /* ----- Certify ----- */

  certify(plug_id: string, certifier: string): CertificationRecord {
    const plug = this.getPlugOrThrow(plug_id);
    const evidence = plug.certification.evidence;

    // Check all required checks passed
    const failures = this.getFailedChecks(evidence);
    if (failures.length > 0) {
      throw new Error(
        `Cannot certify: the following required checks have not passed: ${failures.join(', ')}`
      );
    }

    plug.certification.status = 'certified';
    plug.certification.certified_at = nowISO();
    plug.certification.certified_by = certifier;
    plug.certification.last_reviewed_at = nowISO();

    // Assign badges
    plug.badges = this.computeBadges(plug);
    plug.updated_at = nowISO();

    return plug.certification;
  }

  /* ----- Reject ----- */

  reject(plug_id: string, reason: string): CertificationRecord {
    const plug = this.getPlugOrThrow(plug_id);
    plug.certification.status = 'rejected';
    plug.certification.last_reviewed_at = nowISO();
    plug.updated_at = nowISO();
    return plug.certification;
  }

  /* ----- Revoke ----- */

  revoke(plug_id: string, reason: string): CertificationRecord {
    const plug = this.getPlugOrThrow(plug_id);
    plug.certification.status = 'revoked';
    plug.badges = plug.badges.filter(b => b !== 'certified');
    plug.updated_at = nowISO();
    return plug.certification;
  }

  /* ----- Approve Exception ----- */

  approveException(
    plug_id: string,
    exception: Omit<CertificationException, 'approved_at'>
  ): CertificationRecord {
    const plug = this.getPlugOrThrow(plug_id);
    plug.certification.status = 'exception_approved';
    plug.certification.exception = {
      ...exception,
      approved_at: nowISO(),
    };
    plug.certification.last_reviewed_at = nowISO();
    plug.updated_at = nowISO();
    return plug.certification;
  }

  /* ----- Install Gate ----- */

  validateInstall(request: PlugInstallRequest): PlugInstallResult {
    const plug = this.plugs.get(request.plug_id);
    if (!plug) {
      return {
        success: false,
        install_id: generateId('inst'),
        plug_id: request.plug_id,
        install_mode: request.install_mode,
        error: 'Plug not found',
      };
    }

    // Enforce certification
    const { status } = plug.certification;
    const allowed: CertificationStatus[] = ['certified', 'exception_approved'];
    if (!allowed.includes(status)) {
      return {
        success: false,
        install_id: generateId('inst'),
        plug_id: request.plug_id,
        install_mode: request.install_mode,
        error: `Plug certification status '${status}' does not allow installation. Must be certified or exception_approved.`,
      };
    }

    // Validate install mode is supported
    if (!plug.install_modes.includes(request.install_mode)) {
      return {
        success: false,
        install_id: generateId('inst'),
        plug_id: request.plug_id,
        install_mode: request.install_mode,
        error: `Install mode '${request.install_mode}' not supported. Available: ${plug.install_modes.join(', ')}`,
      };
    }

    // Exception expiration check
    if (status === 'exception_approved' && plug.certification.exception?.expires_at) {
      if (new Date(plug.certification.exception.expires_at) < new Date()) {
        return {
          success: false,
          install_id: generateId('inst'),
          plug_id: request.plug_id,
          install_mode: request.install_mode,
          error: 'Certification exception has expired',
        };
      }
    }

    const install_id = generateId('inst');
    const attestation_ref = generateId('att');

    // Log install
    this.installLog.push({
      plug_id: request.plug_id,
      tenant_id: request.tenant_id,
      workspace_id: request.workspace_id,
      install_mode: request.install_mode,
      timestamp: nowISO(),
      result: 'success',
    });

    return {
      success: true,
      install_id,
      plug_id: request.plug_id,
      install_mode: request.install_mode,
      attestation_ref,
    };
  }

  /* ----- Lookup ----- */

  getPlug(plug_id: string): PlugListing | undefined {
    return this.plugs.get(plug_id);
  }

  listPlugs(filters?: { certified_only?: boolean; badges?: CertificationBadge[] }): PlugListing[] {
    let results = Array.from(this.plugs.values());

    if (filters?.certified_only) {
      results = results.filter(p =>
        p.certification.status === 'certified' || p.certification.status === 'exception_approved'
      );
    }

    if (filters?.badges?.length) {
      results = results.filter(p =>
        filters.badges!.some(b => p.badges.includes(b))
      );
    }

    return results;
  }

  /* ----- Stats ----- */

  stats(): { total: number; by_status: Record<string, number>; installs: number } {
    const by_status: Record<string, number> = {};
    for (const p of this.plugs.values()) {
      by_status[p.certification.status] = (by_status[p.certification.status] ?? 0) + 1;
    }
    return { total: this.plugs.size, by_status, installs: this.installLog.length };
  }

  /* ----- Private Helpers ----- */

  private getPlugOrThrow(plug_id: string): PlugListing {
    const plug = this.plugs.get(plug_id);
    if (!plug) throw new Error(`Plug '${plug_id}' not found`);
    return plug;
  }

  private emptyEvidence(): CertificationEvidence {
    const check = (required: boolean): EvidenceCheck => ({
      required,
      passed: false,
    });

    return {
      build_metadata: check(certReqs.required_checks.build_metadata.required),
      dependency_scan: check(certReqs.required_checks.dependency_scan.required),
      permissions_manifest: check(certReqs.required_checks.permissions_manifest.required),
      smoke_test: check(certReqs.required_checks.smoke_test.required),
      rollback_readiness: check(certReqs.required_checks.rollback_readiness.required),
    };
  }

  private getFailedChecks(evidence: CertificationEvidence): string[] {
    const failures: string[] = [];
    for (const [key, check] of Object.entries(evidence) as Array<[string, EvidenceCheck]>) {
      if (check.required && !check.passed) {
        failures.push(key);
      }
    }
    return failures;
  }

  private computeBadges(plug: PlugListing): CertificationBadge[] {
    const badges: CertificationBadge[] = [];

    // Certified badge: all required checks passed
    const failures = this.getFailedChecks(plug.certification.evidence);
    if (failures.length === 0) {
      badges.push('certified');
    }

    // Managed option: certified + has managed install mode
    if (badges.includes('certified') && plug.install_modes.includes('managed')) {
      badges.push('managed_option');
    }

    return badges;
  }
}
