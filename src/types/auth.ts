/** Roles matching DB `admin_user.role` CHECK constraint (viewer excluded — not allowed to log in to admin panel) */
export type AdminRole = "superadmin" | "editor";

/**
 * AdminUser — maps to DB `admin_user` table.
 * Field names use camelCase matching NestJS API responses.
 */
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Response body from POST /auth/login (NestJS) */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Pick<AdminUser, "id" | "username" | "email" | "role">;
}
