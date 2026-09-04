/**
 * Returns the current access token to the client so it can upload
 * files directly to the backend API (bypassing Vercel's 4.5 MB body limit).
 *
 * Security: The token is short-lived (JWT). This endpoint is only accessible
 * to authenticated admin users who already own the token.
 */

import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { statusCode: 401, message: "Chưa đăng nhập" },
        { status: 401 },
      );
    }

    return NextResponse.json({ token: accessToken });
  } catch {
    return NextResponse.json(
      { statusCode: 500, message: "Lỗi hệ thống" },
      { status: 500 },
    );
  }
}
