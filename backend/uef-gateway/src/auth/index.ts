/**
 * A.I.M.S. Authorization Module
 *
 * Ownership-based access control with a role/permission matrix.
 * Provides Express middleware that gates routes by required permission.
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../logger';
import { projectStore } from '../db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Role = 'owner' | 'admin' | 'member' | 'viewer';
export type Permission = 'create' | 'read' | 'update' | 'delete' | 'deploy' | 'admin';

export interface AuthContext {
  userId: string;
  role: Role;
  projectId?: string;
}

export interface AccessResult {
  allowed: boolean;
  reason?: string;
  role?: Role;
}

// ---------------------------------------------------------------------------
// Permission Matrix
// ---------------------------------------------------------------------------

export const PERMISSION_MATRIX: Record<Role, Permission[]> = {
  owner: ['create', 'read', 'update', 'delete', 'deploy', 'admin'],
  admin: ['create', 'read', 'update', 'delete', 'deploy'],
  member: ['create', 'read', 'update'],
  viewer: ['read'],
};

// ---------------------------------------------------------------------------
// Ownership Enforcer
// ---------------------------------------------------------------------------

/**
 * In-memory role assignments: Map<projectId, Map<userId, Role>>
 */
type RoleStore = Map<string, Map<string, Role>>;

export class OwnershipEnforcer {
  private readonly roles: RoleStore = new Map();

  /**
   * Check whether a user has the required permission on a project.
   */
  checkProjectAccess(
    userId: string,
    projectId: string,
    requiredPermission: Permission,
  ): AccessResult {
    logger.info(
      { userId, projectId, requiredPermission },
      '[Auth] Checking project access',
    );

    // Check explicit role assignment first (allows role checks before project is stored)
    const explicitRole = this.getExplicitRole(projectId, userId);

    // Look up the project to determine ownership
    const project = projectStore.get(projectId);

    // Determine the user's role — explicit assignment takes precedence
    let role: Role;
    if (explicitRole) {
      role = explicitRole;
    } else if (project) {
      role = this.resolveRole(projectId, userId, project.userId);
    } else {
      // No explicit role and no project found
      return { allowed: false, reason: 'Project not found and no role assigned' };
    }

    // Check the permission matrix
    const permissions = PERMISSION_MATRIX[role];
    const allowed = permissions.includes(requiredPermission);

    const result: AccessResult = {
      allowed,
      role,
      reason: allowed
        ? undefined
        : `Role '${role}' does not have '${requiredPermission}' permission`,
    };

    logger.info(
      { userId, projectId, role, allowed },
      '[Auth] Access check result',
    );

    return result;
  }

  /**
   * Grant a role to a user for a specific project.
   */
  grantRole(projectId: string, userId: string, role: Role): void {
    logger.info({ projectId, userId, role }, '[Auth] Granting role');
    let projectRoles = this.roles.get(projectId);
    if (!projectRoles) {
      projectRoles = new Map();
      this.roles.set(projectId, projectRoles);
    }
    projectRoles.set(userId, role);
  }

  /**
   * Revoke a user's role assignment for a project (returns them to default viewer).
   */
  revokeRole(projectId: string, userId: string): void {
    logger.info({ projectId, userId }, '[Auth] Revoking role');
    const projectRoles = this.roles.get(projectId);
    if (projectRoles) {
      projectRoles.delete(userId);
    }
  }

  /**
   * List all explicit role assignments for a project.
   */
  listRoles(projectId: string): Array<{ userId: string; role: Role }> {
    const projectRoles = this.roles.get(projectId);
    if (!projectRoles) return [];
    return Array.from(projectRoles.entries()).map(([userId, role]) => ({
      userId,
      role,
    }));
  }

  /**
   * Get a specific user's resolved role for a project.
   */
  getRole(projectId: string, userId: string): Role {
    const project = projectStore.get(projectId);
    const ownerId = project?.userId;
    return this.resolveRole(projectId, userId, ownerId);
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Resolve a user's effective role for a project.
   * Owner of the project always gets 'owner'. Explicit grants come next.
   * Default is 'viewer'.
   */
  private getExplicitRole(projectId: string, userId: string): Role | undefined {
    const projectRoles = this.roles.get(projectId);
    if (projectRoles) {
      return projectRoles.get(userId);
    }
    return undefined;
  }

  private resolveRole(
    projectId: string,
    userId: string,
    projectOwnerId: string | undefined,
  ): Role {
    // Project creator is always owner
    if (projectOwnerId && userId === projectOwnerId) {
      return 'owner';
    }

    // Check explicit grants
    const projectRoles = this.roles.get(projectId);
    if (projectRoles) {
      const granted = projectRoles.get(userId);
      if (granted) return granted;
    }

    // Default
    return 'viewer';
  }
}

// ---------------------------------------------------------------------------
// Express Middleware Factory
// ---------------------------------------------------------------------------

/**
 * Express middleware that requires a specific permission.
 *
 * Extracts userId from `x-user-id` header or `req.body.userId`.
 * Extracts projectId from `req.params.id` or `req.body.projectId`.
 * On success, attaches `AuthContext` to `res.locals.authContext`.
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId =
      (req.headers['x-user-id'] as string | undefined) ||
      req.body?.userId;

    const projectId =
      req.params.id ||
      req.body?.projectId;

    if (!userId) {
      res.status(401).json({ error: 'Missing user identification (x-user-id header or body.userId)' });
      return;
    }

    if (!projectId) {
      res.status(400).json({ error: 'Missing project identifier (params.id or body.projectId)' });
      return;
    }

    const result = ownershipEnforcer.checkProjectAccess(userId, projectId, permission);

    if (!result.allowed) {
      logger.warn(
        { userId, projectId, permission, reason: result.reason },
        '[Auth] Permission denied',
      );
      res.status(403).json({ error: 'Forbidden', reason: result.reason });
      return;
    }

    // Attach context for downstream handlers
    const authContext: AuthContext = {
      userId,
      role: result.role!,
      projectId,
    };
    res.locals.authContext = authContext;

    next();
  };
}

// ---------------------------------------------------------------------------
// Singletons
// ---------------------------------------------------------------------------

export const ownershipEnforcer = new OwnershipEnforcer();
