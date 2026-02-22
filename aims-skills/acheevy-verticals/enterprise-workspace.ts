/**
 * Enterprise Workspace Model — Organizations on A.I.M.S.
 *
 * An Enterprise Workspace is an organization-level container that holds:
 *   - Multiple members with role-based access control
 *   - Multiple Plug instances (the fleet)
 *   - Shared LUC billing at the workspace level
 *   - Security policies, compliance requirements, and audit trails
 *   - Isolated network segments and data boundaries
 *
 * This is how A.I.M.S. goes from "solo user spins up a tool" to
 * "Fortune 500 deploys 40 managed instances across 3 departments."
 *
 * The workspace is the billing boundary, security boundary, and
 * organizational boundary. Everything inside it is metered together,
 * audited together, and isolated from everything outside it.
 *
 * "One organization. Many instances. One bill. Complete isolation."
 */

import { v4 as uuidv4 } from 'uuid';

// Local type aliases to avoid cross-boundary imports
// Mirrors: backend/uef-gateway/src/plug-catalog/types.ts
type SecurityLevel = 'standard' | 'hardened' | 'enterprise';

// ---------------------------------------------------------------------------
// Workspace Types
// ---------------------------------------------------------------------------

/** Workspace lifecycle states */
export type WorkspaceStatus =
  | 'provisioning'     // Being set up (onboarding flow)
  | 'active'           // Fully operational
  | 'suspended'        // Payment issue or policy violation
  | 'deactivating'     // Graceful shutdown in progress
  | 'archived';        // Preserved for audit, no active resources

/** Member roles within a workspace */
export type WorkspaceRole =
  | 'owner'            // Full control. Billing, members, all instances. One per workspace.
  | 'admin'            // Everything except billing changes and workspace deletion
  | 'operator'         // Deploy, monitor, scale instances. No member management.
  | 'developer'        // Access to dev/staging instances. Read-only on production.
  | 'viewer'           // Read-only dashboard access. No deployments.
  | 'auditor';         // Read-only access to audit logs, compliance reports.

/** Workspace member */
export interface WorkspaceMember {
  userId: string;
  email: string;
  displayName: string;
  role: WorkspaceRole;
  department?: string;
  invitedBy: string;
  invitedAt: string;
  joinedAt?: string;
  lastActiveAt?: string;
  status: 'invited' | 'active' | 'suspended' | 'removed';
  permissions: WorkspacePermission[];
  mfaEnabled: boolean;
}

/** Granular permissions beyond role defaults */
export type WorkspacePermission =
  | 'instance:deploy'
  | 'instance:configure'
  | 'instance:monitor'
  | 'instance:scale'
  | 'instance:decommission'
  | 'instance:export'
  | 'billing:view'
  | 'billing:manage'
  | 'members:invite'
  | 'members:manage'
  | 'members:remove'
  | 'audit:view'
  | 'audit:export'
  | 'security:manage'
  | 'compliance:view'
  | 'workspace:settings'
  | 'workspace:delete';

/** Role → Default permissions mapping */
export const ROLE_PERMISSIONS: Record<WorkspaceRole, WorkspacePermission[]> = {
  owner: [
    'instance:deploy', 'instance:configure', 'instance:monitor', 'instance:scale',
    'instance:decommission', 'instance:export',
    'billing:view', 'billing:manage',
    'members:invite', 'members:manage', 'members:remove',
    'audit:view', 'audit:export',
    'security:manage', 'compliance:view',
    'workspace:settings', 'workspace:delete',
  ],
  admin: [
    'instance:deploy', 'instance:configure', 'instance:monitor', 'instance:scale',
    'instance:decommission', 'instance:export',
    'billing:view',
    'members:invite', 'members:manage',
    'audit:view', 'audit:export',
    'security:manage', 'compliance:view',
    'workspace:settings',
  ],
  operator: [
    'instance:deploy', 'instance:configure', 'instance:monitor', 'instance:scale',
    'instance:decommission', 'instance:export',
    'billing:view',
    'audit:view',
    'compliance:view',
  ],
  developer: [
    'instance:configure', 'instance:monitor',
    'audit:view',
  ],
  viewer: [
    'instance:monitor',
    'billing:view',
    'compliance:view',
  ],
  auditor: [
    'audit:view', 'audit:export',
    'compliance:view',
    'billing:view',
  ],
};

/** Workspace environment (instances are tagged to environments) */
export type WorkspaceEnvironment = 'production' | 'staging' | 'development' | 'sandbox';

/** Enterprise compliance framework */
export interface ComplianceProfile {
  frameworks: string[];          // 'SOC2', 'HIPAA', 'GDPR', 'PCI-DSS', 'ISO-27001', 'FEDRAMP'
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
  dataResidency?: string;        // 'us', 'eu', 'ap' — where data must live
  retentionDays: number;         // Audit log retention requirement
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  mfaRequired: boolean;
  ipAllowlist?: string[];        // If set, only these IPs can access
  ssoProvider?: string;          // 'okta', 'azure-ad', 'google', 'custom-saml'
  auditExportSchedule?: string;  // Cron for automated audit exports
}

/** Network isolation configuration */
export interface NetworkIsolation {
  vpcId: string;                 // Virtual network segment ID
  subnetRange: string;           // e.g., '10.51.0.0/16'
  ingressPolicy: 'public' | 'vpn-only' | 'allowlist';
  egressPolicy: 'unrestricted' | 'allowlist-only' | 'blocked';
  allowedEgressDomains: string[];
  internalDns: boolean;          // Instances can resolve each other by name
  tlsEnforced: boolean;
}

/** Workspace resource limits */
export interface WorkspaceResourceLimits {
  maxInstances: number;          // Max concurrent running instances
  maxCpuCores: number;           // Total CPU allocation
  maxMemoryGb: number;           // Total memory allocation
  maxStorageGb: number;          // Total persistent storage
  maxBandwidthGbMonth: number;   // Monthly bandwidth cap
  portRange: { start: number; end: number }; // Allocated port range
}

// ---------------------------------------------------------------------------
// Enterprise Workspace — The Core Model
// ---------------------------------------------------------------------------

export interface EnterpriseWorkspace {
  id: string;                    // Workspace UUID
  name: string;                  // Organization display name
  slug: string;                  // URL-safe: aims-workspace-acme-corp
  status: WorkspaceStatus;

  // ── Ownership ─────────────────────────────────────────────────────────
  ownerId: string;               // Owner's user ID
  createdAt: string;
  activatedAt?: string;

  // ── Billing ───────────────────────────────────────────────────────────
  lucAccountId: string;          // Links to LUC workspace account
  planId: string;                // 'enterprise' or custom plan
  billingEmail: string;
  stripeCustomerId?: string;

  // ── Members ───────────────────────────────────────────────────────────
  members: WorkspaceMember[];
  maxMembers: number;            // Plan-based limit

  // ── Security ──────────────────────────────────────────────────────────
  securityLevel: SecurityLevel;
  compliance: ComplianceProfile;
  network: NetworkIsolation;

  // ── Resources ─────────────────────────────────────────────────────────
  resourceLimits: WorkspaceResourceLimits;

  // ── Fleet ─────────────────────────────────────────────────────────────
  instanceIds: string[];         // All instance IDs in this workspace
  environments: WorkspaceEnvironment[];

  // ── Onboarding ────────────────────────────────────────────────────────
  onboardingComplete: boolean;
  needsAnalysisId?: string;      // Links to needs analysis result

  // ── Metadata ──────────────────────────────────────────────────────────
  industry?: string;
  description?: string;
  tags: string[];
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Enterprise Plan Tiers
// ---------------------------------------------------------------------------

export interface EnterprisePlanDefinition {
  id: string;
  name: string;
  description: string;
  maxInstances: number;
  maxMembers: number;
  maxCpuCores: number;
  maxMemoryGb: number;
  maxStorageGb: number;
  maxBandwidthGbMonth: number;
  securityLevel: SecurityLevel;
  complianceFrameworks: string[];
  slaUptime: string;             // e.g., '99.9%', '99.99%'
  supportLevel: string;
  monthlyBasePrice: number;      // USD
  perInstancePrice: number;      // USD per running instance per month
  features: string[];
}

export const ENTERPRISE_PLANS: EnterprisePlanDefinition[] = [
  {
    id: 'enterprise-starter',
    name: 'Enterprise Starter',
    description: 'For teams getting started with managed AI services.',
    maxInstances: 10,
    maxMembers: 25,
    maxCpuCores: 16,
    maxMemoryGb: 32,
    maxStorageGb: 100,
    maxBandwidthGbMonth: 500,
    securityLevel: 'hardened',
    complianceFrameworks: ['SOC2'],
    slaUptime: '99.9%',
    supportLevel: 'priority-support',
    monthlyBasePrice: 499,
    perInstancePrice: 49,
    features: [
      'Up to 10 concurrent instances',
      'RBAC with 25 members',
      'SOC2-ready compliance',
      'Priority support',
      'Audit log export',
      'Custom domain per instance',
    ],
  },
  {
    id: 'enterprise-professional',
    name: 'Enterprise Professional',
    description: 'For organizations running production AI workloads.',
    maxInstances: 50,
    maxMembers: 100,
    maxCpuCores: 64,
    maxMemoryGb: 128,
    maxStorageGb: 500,
    maxBandwidthGbMonth: 2000,
    securityLevel: 'enterprise',
    complianceFrameworks: ['SOC2', 'HIPAA', 'GDPR'],
    slaUptime: '99.95%',
    supportLevel: 'dedicated-account',
    monthlyBasePrice: 1999,
    perInstancePrice: 39,
    features: [
      'Up to 50 concurrent instances',
      'RBAC with 100 members',
      'SOC2 + HIPAA + GDPR compliance',
      'Dedicated account manager',
      'Network isolation (VPC)',
      'SSO integration',
      'Automated audit exports',
      'Environment management (prod/staging/dev)',
    ],
  },
  {
    id: 'enterprise-critical',
    name: 'Enterprise Critical',
    description: 'For mission-critical deployments with maximum security and scale.',
    maxInstances: 200,
    maxMembers: 500,
    maxCpuCores: 256,
    maxMemoryGb: 512,
    maxStorageGb: 2000,
    maxBandwidthGbMonth: 10000,
    securityLevel: 'enterprise',
    complianceFrameworks: ['SOC2', 'HIPAA', 'GDPR', 'PCI-DSS', 'ISO-27001', 'FEDRAMP'],
    slaUptime: '99.99%',
    supportLevel: 'dedicated-account',
    monthlyBasePrice: 4999,
    perInstancePrice: 29,
    features: [
      'Up to 200 concurrent instances',
      'RBAC with 500 members',
      'Full compliance suite (SOC2/HIPAA/GDPR/PCI-DSS/ISO/FEDRAMP)',
      'Dedicated infrastructure',
      'IP allowlisting',
      'Data residency controls',
      'Custom SLA',
      '24/7 dedicated support',
      'Quarterly security review',
    ],
  },
];

// ---------------------------------------------------------------------------
// Enterprise Workspace Manager
// ---------------------------------------------------------------------------

class EnterpriseWorkspaceManager {
  private workspaces: Map<string, EnterpriseWorkspace> = new Map();

  /**
   * Provision a new enterprise workspace.
   * This is the entry point for enterprise onboarding.
   */
  provision(params: {
    name: string;
    ownerId: string;
    ownerEmail: string;
    ownerName: string;
    planId: string;
    industry?: string;
    description?: string;
    needsAnalysisId?: string;
  }): EnterpriseWorkspace {
    const plan = ENTERPRISE_PLANS.find(p => p.id === params.planId);
    if (!plan) {
      throw new Error(`Unknown enterprise plan: ${params.planId}`);
    }

    const id = `ws-${uuidv4()}`;
    const slug = `aims-workspace-${params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const now = new Date().toISOString();

    const workspace: EnterpriseWorkspace = {
      id,
      name: params.name,
      slug,
      status: 'provisioning',

      ownerId: params.ownerId,
      createdAt: now,

      lucAccountId: `luc-${uuidv4()}`,
      planId: params.planId,
      billingEmail: params.ownerEmail,

      members: [{
        userId: params.ownerId,
        email: params.ownerEmail,
        displayName: params.ownerName,
        role: 'owner',
        invitedBy: 'system',
        invitedAt: now,
        joinedAt: now,
        status: 'active',
        permissions: ROLE_PERMISSIONS['owner'],
        mfaEnabled: false,
      }],
      maxMembers: plan.maxMembers,

      securityLevel: plan.securityLevel,
      compliance: {
        frameworks: plan.complianceFrameworks,
        dataClassification: 'confidential',
        retentionDays: 365,
        encryptionAtRest: true,
        encryptionInTransit: true,
        mfaRequired: plan.complianceFrameworks.includes('HIPAA')
          || plan.complianceFrameworks.includes('FEDRAMP'),
      },
      network: {
        vpcId: `vpc-${uuidv4().slice(0, 8)}`,
        subnetRange: `10.51.${Math.floor(Math.random() * 255)}.0/24`,
        ingressPolicy: 'public',
        egressPolicy: 'unrestricted',
        allowedEgressDomains: [],
        internalDns: true,
        tlsEnforced: true,
      },

      resourceLimits: {
        maxInstances: plan.maxInstances,
        maxCpuCores: plan.maxCpuCores,
        maxMemoryGb: plan.maxMemoryGb,
        maxStorageGb: plan.maxStorageGb,
        maxBandwidthGbMonth: plan.maxBandwidthGbMonth,
        portRange: { start: 51000, end: 51000 + (plan.maxInstances * 10) },
      },

      instanceIds: [],
      environments: ['production', 'staging', 'development'],

      onboardingComplete: false,
      needsAnalysisId: params.needsAnalysisId,

      industry: params.industry,
      description: params.description,
      tags: [],
      updatedAt: now,
    };

    this.workspaces.set(id, workspace);
    return workspace;
  }

  /**
   * Activate a workspace after onboarding is complete.
   */
  activate(workspaceId: string): EnterpriseWorkspace {
    const ws = this.requireWorkspace(workspaceId);
    ws.status = 'active';
    ws.activatedAt = new Date().toISOString();
    ws.onboardingComplete = true;
    ws.updatedAt = new Date().toISOString();
    return ws;
  }

  // ── Member Management ─────────────────────────────────────────────────

  /**
   * Invite a member to the workspace.
   */
  inviteMember(
    workspaceId: string,
    invitedBy: string,
    params: {
      userId: string;
      email: string;
      displayName: string;
      role: WorkspaceRole;
      department?: string;
    },
  ): WorkspaceMember {
    const ws = this.requireWorkspace(workspaceId);
    this.requirePermission(ws, invitedBy, 'members:invite');

    if (ws.members.length >= ws.maxMembers) {
      throw new Error(`Workspace ${workspaceId} has reached member limit (${ws.maxMembers}).`);
    }

    if (params.role === 'owner') {
      throw new Error('Cannot invite as owner. Transfer ownership instead.');
    }

    const member: WorkspaceMember = {
      userId: params.userId,
      email: params.email,
      displayName: params.displayName,
      role: params.role,
      department: params.department,
      invitedBy,
      invitedAt: new Date().toISOString(),
      status: 'invited',
      permissions: ROLE_PERMISSIONS[params.role],
      mfaEnabled: false,
    };

    ws.members.push(member);
    ws.updatedAt = new Date().toISOString();
    return member;
  }

  /**
   * Update a member's role.
   */
  updateMemberRole(
    workspaceId: string,
    updatedBy: string,
    targetUserId: string,
    newRole: WorkspaceRole,
  ): void {
    const ws = this.requireWorkspace(workspaceId);
    this.requirePermission(ws, updatedBy, 'members:manage');

    const member = ws.members.find(m => m.userId === targetUserId);
    if (!member) throw new Error(`Member ${targetUserId} not found in workspace.`);
    if (member.role === 'owner') throw new Error('Cannot change owner role. Transfer ownership instead.');
    if (newRole === 'owner') throw new Error('Cannot promote to owner. Transfer ownership instead.');

    member.role = newRole;
    member.permissions = ROLE_PERMISSIONS[newRole];
    ws.updatedAt = new Date().toISOString();
  }

  /**
   * Remove a member from the workspace.
   */
  removeMember(
    workspaceId: string,
    removedBy: string,
    targetUserId: string,
  ): void {
    const ws = this.requireWorkspace(workspaceId);
    this.requirePermission(ws, removedBy, 'members:remove');

    const member = ws.members.find(m => m.userId === targetUserId);
    if (!member) throw new Error(`Member ${targetUserId} not found in workspace.`);
    if (member.role === 'owner') throw new Error('Cannot remove workspace owner.');

    member.status = 'removed';
    ws.updatedAt = new Date().toISOString();
  }

  // ── Instance Management ───────────────────────────────────────────────

  /**
   * Register an instance in the workspace fleet.
   */
  registerInstance(workspaceId: string, instanceId: string): void {
    const ws = this.requireWorkspace(workspaceId);

    if (ws.instanceIds.length >= ws.resourceLimits.maxInstances) {
      throw new Error(
        `Workspace ${workspaceId} has reached instance limit (${ws.resourceLimits.maxInstances}).` +
        ` Upgrade your plan or decommission unused instances.`,
      );
    }

    ws.instanceIds.push(instanceId);
    ws.updatedAt = new Date().toISOString();
  }

  /**
   * Deregister an instance from the workspace fleet.
   */
  deregisterInstance(workspaceId: string, instanceId: string): void {
    const ws = this.requireWorkspace(workspaceId);
    ws.instanceIds = ws.instanceIds.filter(id => id !== instanceId);
    ws.updatedAt = new Date().toISOString();
  }

  // ── Security ──────────────────────────────────────────────────────────

  /**
   * Update compliance profile.
   */
  updateCompliance(
    workspaceId: string,
    updatedBy: string,
    updates: Partial<ComplianceProfile>,
  ): ComplianceProfile {
    const ws = this.requireWorkspace(workspaceId);
    this.requirePermission(ws, updatedBy, 'security:manage');

    ws.compliance = { ...ws.compliance, ...updates };
    ws.updatedAt = new Date().toISOString();
    return ws.compliance;
  }

  /**
   * Update network isolation settings.
   */
  updateNetwork(
    workspaceId: string,
    updatedBy: string,
    updates: Partial<NetworkIsolation>,
  ): NetworkIsolation {
    const ws = this.requireWorkspace(workspaceId);
    this.requirePermission(ws, updatedBy, 'security:manage');

    ws.network = { ...ws.network, ...updates };
    ws.updatedAt = new Date().toISOString();
    return ws.network;
  }

  // ── Authorization ─────────────────────────────────────────────────────

  /**
   * Check if a user has a specific permission in a workspace.
   */
  hasPermission(
    workspaceId: string,
    userId: string,
    permission: WorkspacePermission,
  ): boolean {
    const ws = this.workspaces.get(workspaceId);
    if (!ws) return false;

    const member = ws.members.find(m => m.userId === userId && m.status === 'active');
    if (!member) return false;

    return member.permissions.includes(permission);
  }

  // ── Queries ───────────────────────────────────────────────────────────

  get(workspaceId: string): EnterpriseWorkspace | undefined {
    return this.workspaces.get(workspaceId);
  }

  getByOwner(ownerId: string): EnterpriseWorkspace[] {
    return Array.from(this.workspaces.values())
      .filter(ws => ws.ownerId === ownerId);
  }

  getByMember(userId: string): EnterpriseWorkspace[] {
    return Array.from(this.workspaces.values())
      .filter(ws => ws.members.some(m => m.userId === userId && m.status === 'active'));
  }

  getActiveWorkspaces(): EnterpriseWorkspace[] {
    return Array.from(this.workspaces.values())
      .filter(ws => ws.status === 'active');
  }

  /**
   * Get workspace utilization summary.
   */
  getUtilization(workspaceId: string): {
    instanceCount: number;
    instanceLimit: number;
    memberCount: number;
    memberLimit: number;
    instanceUtilization: number;
    memberUtilization: number;
  } {
    const ws = this.requireWorkspace(workspaceId);
    const activeMembers = ws.members.filter(m => m.status === 'active').length;

    return {
      instanceCount: ws.instanceIds.length,
      instanceLimit: ws.resourceLimits.maxInstances,
      memberCount: activeMembers,
      memberLimit: ws.maxMembers,
      instanceUtilization: ws.resourceLimits.maxInstances > 0
        ? Math.round((ws.instanceIds.length / ws.resourceLimits.maxInstances) * 100) : 0,
      memberUtilization: ws.maxMembers > 0
        ? Math.round((activeMembers / ws.maxMembers) * 100) : 0,
    };
  }

  // ── Internal Helpers ──────────────────────────────────────────────────

  private requireWorkspace(id: string): EnterpriseWorkspace {
    const ws = this.workspaces.get(id);
    if (!ws) throw new Error(`Workspace ${id} not found.`);
    return ws;
  }

  private requirePermission(
    ws: EnterpriseWorkspace,
    userId: string,
    permission: WorkspacePermission,
  ): void {
    const member = ws.members.find(m => m.userId === userId && m.status === 'active');
    if (!member) {
      throw new Error(`User ${userId} is not an active member of workspace ${ws.id}.`);
    }
    if (!member.permissions.includes(permission)) {
      throw new Error(`User ${userId} lacks permission '${permission}' in workspace ${ws.id}.`);
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

export const workspaceManager = new EnterpriseWorkspaceManager();
