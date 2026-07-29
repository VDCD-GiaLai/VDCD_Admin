import { cookies } from "next/headers";

/**
 * Cookie configuration constants for auth tokens.
 * Per ARCHITECT.md Section 4: HttpOnly, Secure, SameSite=Lax.
 */

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Access token cookie name */
export const AT_COOKIE = "vdcd_at";
/** Refresh token cookie name */
export const RT_COOKIE = "vdcd_rt";

interface CookieOptions {
  value: string;
  maxAge: number;
}

/**
 * Set the access token HttpOnly cookie.
 */
export async function setAccessTokenCookie({ value, maxAge }: CookieOptions) {
  const cookieStore = await cookies();
  cookieStore.set(AT_COOKIE, value, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge,
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  });
}

/**
 * Set the refresh token HttpOnly cookie.
 */
export async function setRefreshTokenCookie({ value, maxAge }: CookieOptions) {
  const cookieStore = await cookies();
  cookieStore.set(RT_COOKIE, value, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge,
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  });
}

/**
 * Clear both auth cookies (used during logout or failed refresh).
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(AT_COOKIE);
  cookieStore.delete(RT_COOKIE);
}

/**
 * Read access token from cookie. Returns undefined if not set.
 */
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AT_COOKIE)?.value;
}

/**
 * Read refresh token from cookie. Returns undefined if not set.
 */
export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(RT_COOKIE)?.value;
}
