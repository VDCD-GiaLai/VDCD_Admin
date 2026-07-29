import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Public paths — accessible without authentication.
 */
const PUBLIC_PATHS = ["/login"];

/**
 * Route-level RBAC — maps route prefixes to required roles.
 * Only routes that need restriction beyond "logged in" are listed here.
 * All other authenticated routes are accessible to any logged-in user
 * (action-level RBAC is handled by usePermission in components).
 */
const RESTRICTED_ROUTES: Record<string, string[]> = {
  "/admin-users": ["superadmin"],
};

/**
 * Decode a JWT payload without verifying the signature.
 * Only extracts claims (role, exp) for proxy-level decisions.
 * Real authentication is done by NestJS on each API call.
 */
function decodeJwtPayload(
  token: string
): { role?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Base64url → Base64 → decode
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = atob(base64);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Next.js 16 proxy (formerly middleware).
 * Runs on every non-static request.
 *
 * Responsibilities:
 * 1. Allow public paths without auth
 * 2. Check for access token cookie
 * 3. Decode JWT to read role (no signature verification)
 * 4. Apply route-level RBAC for restricted routes
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Public paths — allow without auth
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. Check access token exists
  const token = request.cookies.get("vdcd_at");
  if (!token?.value) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Decode JWT to get role
  const payload = decodeJwtPayload(token.value);
  const role = payload?.role;

  // Check if token is expired (with 10s buffer)
  if (payload?.exp && payload.exp * 1000 < Date.now() - 10_000) {
    // Token expired — let the client-side refresh logic handle it
    // Don't redirect here, the API call will 401 and trigger refresh
  }

  // 4. Route-level RBAC — check restricted routes
  for (const [routePrefix, allowedRoles] of Object.entries(RESTRICTED_ROUTES)) {
    if (pathname.startsWith(routePrefix)) {
      if (!role || !allowedRoles.includes(role)) {
        // Redirect to dashboard with forbidden indication
        const dashboardUrl = new URL("/", request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
