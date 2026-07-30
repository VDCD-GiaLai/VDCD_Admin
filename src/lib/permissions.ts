import type { AdminRole } from "@/types/auth";

/**
 * RBAC permissions matrix — per ARCHITECT.md Section 5.
 *
 * Format: "module:action" or "module:*" for all actions.
 * Special: "*" means full access (superadmin only).
 */
export const PERMISSIONS: Record<AdminRole, readonly string[]> = {
  superadmin: ["*"],
  editor: [
    "organization:update",
    "slides:*",
    "partners:*",
    "operation-fields:create",
    "operation-fields:update",
    "programs:*:except-delete",
    "solutions:*:except-delete",
    "projects:*:except-delete",
    "articles:*:except-delete",
    "jobs:*:except-delete",
    "leads:read",
    "leads:update-status",
  ],
  viewer: [
    "*:read",
  ],
} as const;

/**
 * Check if a role has a specific permission.
 *
 * @param role - The user's role
 * @param permission - Permission string like "programs:delete" or "leads:read"
 * @returns true if the role has the permission
 *
 * Matching rules:
 * - "*" matches everything (superadmin)
 * - "module:*" matches any action on that module
 * - "module:*:except-action" matches all except the specified action
 * - "*:action" matches that action on any module (e.g., "*:read")
 * - Exact match: "module:action"
 */
export function hasPermission(role: AdminRole, permission: string): boolean {
  const rolePerms = PERMISSIONS[role];

  // Superadmin full access
  if (rolePerms.includes("*")) return true;

  const [reqModule, reqAction] = permission.split(":");

  for (const perm of rolePerms) {
    // Exact match
    if (perm === permission) return true;

    const parts = perm.split(":");
    const permModule = parts[0];
    const permAction = parts[1];
    const permExcept = parts[2]; // e.g., "except-delete"

    // Wildcard module (e.g., "*:read")
    if (permModule === "*" && permAction === reqAction) return true;

    // Module-level wildcard (e.g., "slides:*")
    if (permModule === reqModule && permAction === "*") {
      // Check except clause
      if (permExcept && permExcept === `except-${reqAction}`) return false;
      return true;
    }

    // Module match with specific action
    if (permModule === reqModule && permAction === reqAction) return true;
  }

  return false;
}

/**
 * Route-level RBAC mapping.
 * Maps route prefixes to minimum required permissions.
 * Used by proxy.ts for server-side route guarding.
 */
export const ROUTE_PERMISSIONS: Record<string, string> = {
  "/admin-users": "admin-users:read",
  "/organization": "organization:update",
};
