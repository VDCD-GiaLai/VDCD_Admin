/**
 * Dedicated upload proxy — runs on Edge Runtime to bypass
 * the default Node.js Route Handler body-size limit (1 MB).
 *
 * Matches: POST /api/upload/image, /api/upload/image/slide, etc.
 * Streams the raw multipart body directly to the NestJS backend.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.API_BASE_URL ?? "";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const apiPath = `/upload/${path.join("/")}`;

  try {
    // Read access token from HttpOnly cookie
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { statusCode: 401, message: "Chưa đăng nhập" },
        { status: 401 },
      );
    }

    // Build headers — preserve original Content-Type (with boundary)
    const contentType = request.headers.get("content-type") ?? "";
    const headers: Record<string, string> = {
      Cookie: `accessToken=${accessToken}`,
      "Content-Type": contentType,
    };

    // Build target URL with query params
    const url = new URL(`${API_BASE_URL}${apiPath}`);
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    // Stream raw body directly to backend — no buffering
    const res = await fetch(url.toString(), {
      method: "POST",
      headers,
      body: request.body,
      // @ts-expect-error -- Required for streaming body in fetch
      duplex: "half",
    });

    // Return backend response
    const contentTypeRes = res.headers.get("content-type") || "";
    if (contentTypeRes.includes("application/json")) {
      const data = await res.json().catch(() => null);
      return NextResponse.json(data ?? { statusCode: res.status }, {
        status: res.status,
      });
    }

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: { "Content-Type": contentTypeRes },
    });
  } catch {
    return NextResponse.json(
      { statusCode: 500, message: "Upload thất bại, vui lòng thử lại" },
      { status: 500 },
    );
  }
}
