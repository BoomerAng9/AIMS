/**
 * @gateway/sdt-service
 * @version 1.0.0
 * @owner ACHEEVY
 *
 * Secure Drop Token (SDT) service — issuance, validation, revocation,
 * rate limiting, and audit logging for the A.I.M.S. Gateway.
 *
 * Non-negotiables enforced:
 *  - Expiration required on every token
 *  - Scope minimization (explicit artifact set, explicit permissions)
 *  - Instant revocation
 *  - Full audit trail
 */

import type {
  SecureDropToken,
  SDTIssuanceRequest,
  SDTAccessLog,
  SDTPermission,
  SDTStatus,
  SessionRestriction,
  GatewayConfig,
} from '../types/gateway';

import gatewayConfigJson from './policies/gateway-config.json';

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
/*  Rate Limiter (in-memory, per-tenant)                              */
/* ------------------------------------------------------------------ */

interface RateBucket {
  count: number;
  window_start: number;
}

class RateLimiter {
  private buckets = new Map<string, RateBucket>();
  constructor(private readonly limit: number, private readonly windowMs: number = 60_000) {}

  check(key: string): boolean {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || now - bucket.window_start >= this.windowMs) {
      this.buckets.set(key, { count: 1, window_start: now });
      return true;
    }
    if (bucket.count >= this.limit) {
      return false;
    }
    bucket.count++;
    return true;
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }
}

/* ------------------------------------------------------------------ */
/*  SDT Service                                                       */
/* ------------------------------------------------------------------ */

export class SDTService {
  private tokens = new Map<string, SecureDropToken>();
  private accessLogs = new Map<string, SDTAccessLog[]>();
  private issuanceLimiter: RateLimiter;
  private accessLimiter: RateLimiter;
  private config: GatewayConfig;

  constructor(config?: Partial<GatewayConfig>) {
    const defaults = gatewayConfigJson.sdt_defaults;
    this.config = {
      default_sdt_ttl_seconds: defaults.default_ttl_seconds,
      max_sdt_ttl_seconds: defaults.max_ttl_seconds,
      sdt_rate_limit_per_minute: defaults.rate_limit_issuance_per_minute,
      sdt_access_rate_limit_per_minute: defaults.rate_limit_access_per_minute,
      max_artifact_size_bytes: gatewayConfigJson.evidence_locker.max_artifact_size_bytes,
      default_retention_period: gatewayConfigJson.evidence_locker.default_retention_period,
      managed_installs_enabled: gatewayConfigJson.marketplace.managed_installs_enabled,
      partner_webhooks_enabled: gatewayConfigJson.partner_portal.webhooks_enabled,
      max_webhook_payload_bytes: gatewayConfigJson.partner_portal.max_webhook_payload_bytes,
      ...config,
    };
    this.issuanceLimiter = new RateLimiter(this.config.sdt_rate_limit_per_minute);
    this.accessLimiter = new RateLimiter(this.config.sdt_access_rate_limit_per_minute);
  }

  /* ----- Issue ----- */

  issue(request: SDTIssuanceRequest, issued_by: string): SecureDropToken {
    // Rate limit check
    if (!this.issuanceLimiter.check(request.tenant_id)) {
      throw new Error(`SDT issuance rate limit exceeded for tenant ${request.tenant_id}`);
    }

    // Validate TTL bounds
    const ttl = Math.min(request.expires_in_seconds, this.config.max_sdt_ttl_seconds);
    if (ttl <= 0) {
      throw new Error('SDT TTL must be positive');
    }

    // Validate artifact refs are non-empty
    if (!request.artifact_refs.length) {
      throw new Error('SDT must be bound to at least one artifact');
    }

    // Validate permissions
    if (!request.permissions.length) {
      throw new Error('SDT must have at least one permission');
    }

    // Build session restrictions
    const session_restrictions: SessionRestriction | undefined = request.session_restrictions
      ? { ...request.session_restrictions, current_access_count: 0 }
      : undefined;

    const token: SecureDropToken = {
      token_id: generateId('sdt'),
      tenant_id: request.tenant_id,
      workspace_id: request.workspace_id,
      project_id: request.project_id,
      artifact_refs: [...request.artifact_refs],
      permissions: [...request.permissions],
      delivery_method: request.delivery_method,
      expires_at: new Date(Date.now() + ttl * 1000).toISOString(),
      issued_at: nowISO(),
      issued_by,
      status: 'active',
      partner_id: request.partner_id,
      webhook_endpoint: request.webhook_endpoint,
      session_restrictions,
      audit_trail: [],
    };

    this.tokens.set(token.token_id, token);
    this.accessLogs.set(token.token_id, []);

    // Audit
    token.audit_trail.push(generateId('evt'));

    return token;
  }

  /* ----- Validate ----- */

  validate(token_id: string): { valid: boolean; reason?: string } {
    const token = this.tokens.get(token_id);
    if (!token) return { valid: false, reason: 'Token not found' };
    if (token.status === 'revoked') return { valid: false, reason: 'Token revoked' };
    if (token.status === 'expired') return { valid: false, reason: 'Token expired' };
    if (new Date(token.expires_at) <= new Date()) {
      token.status = 'expired';
      return { valid: false, reason: 'Token expired' };
    }
    // Session restriction: max access count
    if (token.session_restrictions?.max_access_count != null) {
      if (token.session_restrictions.current_access_count >= token.session_restrictions.max_access_count) {
        token.status = 'consumed';
        return { valid: false, reason: 'Max access count reached' };
      }
    }
    return { valid: true };
  }

  /* ----- Revoke ----- */

  revoke(token_id: string, reason: string): void {
    const token = this.tokens.get(token_id);
    if (!token) throw new Error(`Token ${token_id} not found`);
    token.status = 'revoked';
    token.audit_trail.push(generateId('evt'));
  }

  /* ----- Rotate ----- */

  rotate(token_id: string, issued_by: string): SecureDropToken {
    const old = this.tokens.get(token_id);
    if (!old) throw new Error(`Token ${token_id} not found`);

    // Revoke old
    this.revoke(token_id, 'Rotated');

    // Issue new with same scope
    const remainingSeconds = Math.max(
      1,
      Math.floor((new Date(old.expires_at).getTime() - Date.now()) / 1000)
    );

    return this.issue(
      {
        tenant_id: old.tenant_id,
        workspace_id: old.workspace_id,
        project_id: old.project_id,
        artifact_refs: old.artifact_refs,
        permissions: old.permissions,
        delivery_method: old.delivery_method,
        expires_in_seconds: remainingSeconds,
        partner_id: old.partner_id,
        webhook_endpoint: old.webhook_endpoint,
      },
      issued_by
    );
  }

  /* ----- Access (permission check + logging) ----- */

  access(
    token_id: string,
    accessor_id: string,
    action: SDTPermission,
    artifact_ref: string,
    ip_address?: string
  ): SDTAccessLog {
    const log: SDTAccessLog = {
      token_id,
      accessor_id,
      action,
      artifact_ref,
      timestamp: nowISO(),
      ip_address,
      result: 'allowed',
    };

    // Rate limit
    if (!this.accessLimiter.check(token_id)) {
      log.result = 'rate_limited';
      log.denial_reason = 'Access rate limit exceeded';
      this.appendLog(token_id, log);
      return log;
    }

    // Validate token
    const validation = this.validate(token_id);
    if (!validation.valid) {
      log.result = 'denied';
      log.denial_reason = validation.reason;
      this.appendLog(token_id, log);
      return log;
    }

    const token = this.tokens.get(token_id)!;

    // Check permission
    if (!token.permissions.includes(action)) {
      log.result = 'denied';
      log.denial_reason = `Permission '${action}' not granted`;
      this.appendLog(token_id, log);
      return log;
    }

    // Check artifact scope
    if (!token.artifact_refs.includes(artifact_ref)) {
      log.result = 'denied';
      log.denial_reason = `Artifact '${artifact_ref}' not in token scope`;
      this.appendLog(token_id, log);
      return log;
    }

    // Check IP allowlist
    if (token.session_restrictions?.ip_allowlist?.length) {
      if (ip_address && !token.session_restrictions.ip_allowlist.includes(ip_address)) {
        log.result = 'denied';
        log.denial_reason = `IP '${ip_address}' not in allowlist`;
        this.appendLog(token_id, log);
        return log;
      }
    }

    // Increment access count
    if (token.session_restrictions) {
      token.session_restrictions.current_access_count++;
    }

    token.audit_trail.push(generateId('evt'));
    this.appendLog(token_id, log);
    return log;
  }

  /* ----- Access Logs ----- */

  getAccessLog(token_id: string): SDTAccessLog[] {
    return this.accessLogs.get(token_id) ?? [];
  }

  /* ----- Lookup ----- */

  getToken(token_id: string): SecureDropToken | undefined {
    return this.tokens.get(token_id);
  }

  /* ----- Stats ----- */

  stats(): { total: number; active: number; revoked: number; expired: number } {
    let active = 0, revoked = 0, expired = 0;
    for (const t of this.tokens.values()) {
      if (t.status === 'active') active++;
      else if (t.status === 'revoked') revoked++;
      else if (t.status === 'expired' || t.status === 'consumed') expired++;
    }
    return { total: this.tokens.size, active, revoked, expired };
  }

  /* ----- Private ----- */

  private appendLog(token_id: string, log: SDTAccessLog): void {
    const logs = this.accessLogs.get(token_id);
    if (logs) logs.push(log);
    else this.accessLogs.set(token_id, [log]);
  }
}
