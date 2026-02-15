/**
 * @gateway/index
 * @version 1.0.0
 * @owner ACHEEVY
 *
 * Barrel exports + factory for the A.I.M.S. Gateway System.
 * Provides createGateway() for one-line initialization of all services.
 */

/* ----- Policy JSON imports ----- */

import gatewaySecurityPolicy from './policies/gateway-security.policy.json';
import certificationRequirements from './policies/certification-requirements.json';
import compliancePackSchema from './policies/compliance-pack-schema.json';
import gatewayConfig from './policies/gateway-config.json';

/* ----- Service imports ----- */

import { SDTService } from './sdt-service';
import { EvidenceLockerService } from './evidence-locker';
import { CertificationGateService } from './certification-gate';
import { SubmissionService, CompliancePackService } from './submission-service';
import {
  JobPacketService,
  LucQuoteService,
  OperationsFeedService,
} from './operations-engine';

/* ----- Re-exports ----- */

export { SDTService } from './sdt-service';
export { EvidenceLockerService } from './evidence-locker';
export { CertificationGateService } from './certification-gate';
export { SubmissionService, CompliancePackService } from './submission-service';
export {
  JobPacketService,
  LucQuoteService,
  OperationsFeedService,
} from './operations-engine';

/* ----- Policy exports ----- */

export const GATEWAY_SECURITY_POLICY = gatewaySecurityPolicy;
export const CERTIFICATION_REQUIREMENTS = certificationRequirements;
export const COMPLIANCE_PACK_SCHEMA = compliancePackSchema;
export const GATEWAY_CONFIG = gatewayConfig;

/* ----- Gateway Factory ----- */

export interface GatewayServices {
  sdt: SDTService;
  evidenceLocker: EvidenceLockerService;
  certification: CertificationGateService;
  submissions: SubmissionService;
  compliancePacks: CompliancePackService;
  jobPackets: JobPacketService;
  lucQuotes: LucQuoteService;
  operationsFeed: OperationsFeedService;
}

/**
 * Create a fully initialized Gateway with all services wired up.
 *
 * @example
 * ```ts
 * import { createGateway } from './gateway';
 * const gw = createGateway();
 * const token = gw.sdt.issue({ ... }, 'ACHEEVY');
 * ```
 */
export function createGateway(): GatewayServices {
  return {
    sdt: new SDTService(),
    evidenceLocker: new EvidenceLockerService(),
    certification: new CertificationGateService(),
    submissions: new SubmissionService(),
    compliancePacks: new CompliancePackService(),
    jobPackets: new JobPacketService(),
    lucQuotes: new LucQuoteService(),
    operationsFeed: new OperationsFeedService(),
  };
}
