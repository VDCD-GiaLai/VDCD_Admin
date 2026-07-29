import { useCurrentUser } from "@/features/auth/api";
import { hasPermission } from "@/lib/permissions";

/**
 * Hook to check if the current user has a specific permission.
 *
 * Usage in components:
 * ```tsx
 * const canDelete = usePermission("programs:delete");
 * if (canDelete) { <DeleteButton /> }
 * ```
 *
 * Returns false while user data is loading.
 */
export function usePermission(permission: string): boolean {
  const { data: user } = useCurrentUser();
  if (!user) return false;
  return hasPermission(user.role, permission);
}
