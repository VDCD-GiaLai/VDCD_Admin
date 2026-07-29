import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth-cookies";
import type { ApiResponse } from "@/types/api";
import type { AdminUser } from "@/types/auth";

const API_BASE_URL = process.env.API_BASE_URL ?? "";

/**
 * GET /api/auth/me
 *
 * BFF Route Handler: reads access token from HttpOnly cookie,
 * forwards to NestJS GET /auth/me to get current user info.
 */
export async function GET() {
  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { statusCode: 401, message: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: `accessToken=${accessToken}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { statusCode: res.status, message: "Không thể lấy thông tin người dùng" },
        { status: res.status }
      );
    }

    const json: ApiResponse<AdminUser> = await res.json();

    return NextResponse.json({ statusCode: 200, data: json.data });
  } catch {
    return NextResponse.json(
      { statusCode: 500, message: "Lỗi hệ thống, vui lòng thử lại" },
      { status: 500 }
    );
  }
}
