import { NextResponse } from "next/server";
import { getAccessToken, clearAuthCookies } from "@/lib/auth-cookies";

const API_BASE_URL = process.env.API_BASE_URL ?? "";

/**
 * POST /api/auth/logout
 *
 * BFF Route Handler: reads access token from cookie,
 * calls NestJS POST /auth/logout to revoke the session on Redis,
 * then clears both cookies regardless of BE response.
 */
export async function POST() {
  try {
    const accessToken = await getAccessToken();

    // Call NestJS logout to revoke session — best effort
    if (accessToken) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `accessToken=${accessToken}`,
        },
      }).catch(() => {
        // Ignore errors — we clear cookies anyway
      });
    }

    // Always clear cookies, even if BE call fails
    await clearAuthCookies();

    return NextResponse.json({
      statusCode: 200,
      data: { message: "Đã đăng xuất" },
    });
  } catch {
    // Still clear cookies on any error
    await clearAuthCookies();
    return NextResponse.json({
      statusCode: 200,
      data: { message: "Đã đăng xuất" },
    });
  }
}
