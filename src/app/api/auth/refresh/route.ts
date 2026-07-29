import { NextResponse } from "next/server";
import {
  getRefreshToken,
  setAccessTokenCookie,
  clearAuthCookies,
} from "@/lib/auth-cookies";

const API_BASE_URL = process.env.API_BASE_URL ?? "";

/**
 * POST /api/auth/refresh
 *
 * BFF Route Handler: reads the refresh token from HttpOnly cookie,
 * sends it to NestJS POST /auth/refresh, and sets a new access token cookie.
 *
 * If refresh fails (401), both cookies are cleared.
 */
export async function POST() {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      await clearAuthCookies();
      return NextResponse.json(
        { statusCode: 401, message: "Phiên đăng nhập đã hết hạn" },
        { status: 401 }
      );
    }

    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refreshToken=${refreshToken}`,
      },
    });

    if (!res.ok) {
      await clearAuthCookies();
      return NextResponse.json(
        { statusCode: 401, message: "Phiên đăng nhập đã hết hạn" },
        { status: 401 }
      );
    }

    // NestJS may return a new accessToken in the response body or set-cookie
    // Try to read from body first, then from set-cookie header
    const json = await res.json().catch(() => null);
    const newAccessToken = json?.data?.accessToken;

    if (newAccessToken) {
      await setAccessTokenCookie({ value: newAccessToken, maxAge: 15 * 60 });
    } else {
      // If NestJS uses set-cookie instead, extract from response headers
      const setCookieHeader = res.headers.get("set-cookie");
      const match = setCookieHeader?.match(/accessToken=([^;]+)/);
      if (match?.[1]) {
        await setAccessTokenCookie({ value: match[1], maxAge: 15 * 60 });
      }
    }

    return NextResponse.json({ statusCode: 200, data: { success: true } });
  } catch {
    await clearAuthCookies();
    return NextResponse.json(
      { statusCode: 500, message: "Lỗi hệ thống, vui lòng thử lại" },
      { status: 500 }
    );
  }
}
