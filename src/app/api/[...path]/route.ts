import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.API_BASE_URL ?? "";

/**
 * Generic BFF catch-all proxy.
 *
 * Forwards any `/api/{path}` request (except `/api/auth/*`) to the NestJS
 * backend at `API_BASE_URL/{path}` with the access token from HttpOnly cookies.
 *
 * Supports JSON and multipart/form-data (for image uploads).
 *
 * Auth routes (`/api/auth/*`) are handled by their dedicated route handlers
 * because they need special cookie logic (set/clear tokens).
 */

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const apiPath = `/${path.join("/")}`;

  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { statusCode: 401, message: "Chưa đăng nhập" },
        { status: 401 },
      );
    }

    // ── Build headers ──────────────────────────────────────
    const headers: Record<string, string> = {
      Cookie: `accessToken=${accessToken}`,
    };

    // ── Build body ─────────────────────────────────────────
    const contentType = request.headers.get("content-type") ?? "";
    const isMultipart = contentType.includes("multipart/form-data");

    let body: BodyInit | undefined;

    if (request.method !== "GET" && request.method !== "HEAD") {
      if (isMultipart) {
        // Stream raw body directly to backend — avoids Next.js body-size limit
        // by not calling request.formData() which buffers the entire payload.
        body = request.body as ReadableStream<Uint8Array>;
        // Preserve the original Content-Type (with boundary) for multipart
        headers["Content-Type"] = contentType;
      } else {
        // JSON body
        headers["Content-Type"] = "application/json";
        const text = await request.text();
        if (text) body = text;
      }
    } else {
      headers["Content-Type"] = "application/json";
    }

    // ── Forward to NestJS ──────────────────────────────────
    const url = new URL(`${API_BASE_URL}${apiPath}`);

    // Forward query params
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const res = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      // @ts-expect-error -- Node.js fetch requires duplex for streaming body
      duplex: "half",
    });

    // ── Return response ────────────────────────────────────
    const contentTypeRes = res.headers.get("content-type") || "";

    if (contentTypeRes.includes("application/json")) {
      const responseData = await res.json().catch(() => null);
      return NextResponse.json(responseData ?? { statusCode: res.status }, {
        status: res.status,
      });
    }

    // Pass through raw binary/text (e.g. CSV, PDFs, etc.)
    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: {
        "Content-Type": contentTypeRes,
        "Content-Disposition": res.headers.get("content-disposition") || "",
      },
    });
  } catch {
    return NextResponse.json(
      { statusCode: 500, message: "Lỗi hệ thống, vui lòng thử lại" },
      { status: 500 },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
