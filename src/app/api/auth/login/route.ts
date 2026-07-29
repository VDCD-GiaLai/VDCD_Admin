import { NextRequest, NextResponse } from "next/server";
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "@/lib/auth-cookies";
import type { ApiResponse, ApiErrorResponse } from "@/types/api";
import type { LoginResponse } from "@/types/auth";

const API_BASE_URL = process.env.API_BASE_URL ?? "";

/**
 * POST /api/auth/login
 *
 * BFF Route Handler: receives { email, password } from the client,
 * forwards to NestJS POST /auth/login, then sets HttpOnly cookies
 * with the returned tokens. The tokens never reach client-side JS.
 *
 * Returns only { user } to the client — no tokens in the response body.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error: ApiErrorResponse = await res.json().catch(() => ({
        statusCode: res.status,
        message: "Đăng nhập thất bại",
        timestamp: new Date().toISOString(),
        path: "/auth/login",
      }));

      return NextResponse.json(
        { statusCode: error.statusCode, message: error.message },
        { status: res.status }
      );
    }

    const json: ApiResponse<LoginResponse> = await res.json();
    const { accessToken, refreshToken, user } = json.data;

    // Set HttpOnly cookies — tokens never exposed to client JS
    // accessToken: short-lived (15 minutes)
    await setAccessTokenCookie({ value: accessToken, maxAge: 15 * 60 });
    // refreshToken: longer-lived (7 days)
    await setRefreshTokenCookie({
      value: refreshToken,
      maxAge: 7 * 24 * 60 * 60,
    });

    // Return user info only — no tokens in body
    return NextResponse.json({ statusCode: 201, data: { user } });
  } catch {
    return NextResponse.json(
      { statusCode: 500, message: "Lỗi hệ thống, vui lòng thử lại" },
      { status: 500 }
    );
  }
}
