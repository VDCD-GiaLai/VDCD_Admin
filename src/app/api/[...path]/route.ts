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
      Authorization: `Bearer ${accessToken}`,
    };

    // ── Build body ─────────────────────────────────────────
    const contentType = request.headers.get("content-type") ?? "";
    const isMultipart = contentType.includes("multipart/form-data");

    let body: BodyInit | undefined;

    if (request.method !== "GET" && request.method !== "HEAD") {
      if (isMultipart) {
        // Passthrough FormData (file uploads) — don't set Content-Type,
        // let fetch set it with the correct boundary
        body = await request.formData();
      } else {
        // JSON body
        headers["Content-Type"] = "application/json";
        const text = await request.text();
        if (text) {
          try {
            const parsed = JSON.parse(text);
            if (parsed && typeof parsed === "object") {
              let modified = false;
              const hasSidebarConfig = "sidebarConfig" in parsed;
              const sidebarConfigValue = hasSidebarConfig ? parsed.sidebarConfig : undefined;

              if (hasSidebarConfig) {
                if (parsed.content && typeof parsed.content === "object") {
                  parsed.content.sidebarConfig = sidebarConfigValue;
                }
                delete parsed.sidebarConfig;
                modified = true;
              }
              if (
                "publishedAt" in parsed &&
                parsed.content &&
                typeof parsed.content === "object"
              ) {
                const currentHeroMeta =
                  parsed.content.heroMeta &&
                  typeof parsed.content.heroMeta === "object" &&
                  !Array.isArray(parsed.content.heroMeta)
                    ? parsed.content.heroMeta
                    : {};
                parsed.content.heroMeta = {
                  ...currentHeroMeta,
                  publishedAt: parsed.publishedAt ?? null,
                };
                modified = true;
              }
              if (
                parsed.content &&
                typeof parsed.content === "object" &&
                Array.isArray(parsed.content.blocks) &&
                parsed.content.blocks.length > 0 &&
                parsed.content.blocks[0] &&
                typeof parsed.content.blocks[0] === "object"
              ) {
                const firstBlock = parsed.content.blocks[0] as Record<string, unknown>;
                const existingMeta =
                  firstBlock._articleMeta &&
                  typeof firstBlock._articleMeta === "object" &&
                  !Array.isArray(firstBlock._articleMeta)
                    ? (firstBlock._articleMeta as Record<string, unknown>)
                    : {};
                firstBlock._articleMeta = {
                  ...existingMeta,
                  ...("publishedAt" in parsed
                    ? { publishedAt: parsed.publishedAt ?? null }
                    : {}),
                  ...(hasSidebarConfig
                    ? { sidebarConfig: sidebarConfigValue ?? null }
                    : {}),
                  ...(parsed.content.heroMeta
                    ? { heroMeta: parsed.content.heroMeta }
                    : {}),
                };
                modified = true;
              }
              body = modified ? JSON.stringify(parsed) : text;
            } else {
              body = text;
            }
          } catch {
            body = text;
          }
        }
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
    });

    // ── Return response ────────────────────────────────────
    const contentTypeRes = res.headers.get("content-type") || "";

    if (contentTypeRes.includes("application/json")) {
      const responseData = await res.json().catch(() => null);

      // Hydrate root sidebarConfig & publishedAt from content for frontend/admin consumers
      if (responseData && typeof responseData === "object") {
        const hydrateItem = (item: unknown) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) return;
          const obj = item as Record<string, unknown>;
          if (obj.content && typeof obj.content === "object") {
            const contentObj = obj.content as Record<string, unknown>;
            const firstBlock =
              Array.isArray(contentObj.blocks) &&
              contentObj.blocks.length > 0 &&
              contentObj.blocks[0] &&
              typeof contentObj.blocks[0] === "object"
                ? (contentObj.blocks[0] as Record<string, unknown>)
                : null;
            const blockMeta =
              firstBlock?._articleMeta &&
              typeof firstBlock._articleMeta === "object" &&
              !Array.isArray(firstBlock._articleMeta)
                ? (firstBlock._articleMeta as Record<string, unknown>)
                : null;

            if (blockMeta?.heroMeta && !contentObj.heroMeta) {
              contentObj.heroMeta = blockMeta.heroMeta;
            }

            const resolvedSidebarConfig =
              contentObj.sidebarConfig ?? blockMeta?.sidebarConfig;
            if (resolvedSidebarConfig && !obj.sidebarConfig) {
              obj.sidebarConfig = resolvedSidebarConfig;
            }

            const heroMetaObj =
              contentObj.heroMeta &&
              typeof contentObj.heroMeta === "object" &&
              !Array.isArray(contentObj.heroMeta)
                ? (contentObj.heroMeta as Record<string, unknown>)
                : null;

            const customPublishedAt =
              blockMeta && "publishedAt" in blockMeta
                ? blockMeta.publishedAt
                : heroMetaObj && "publishedAt" in heroMetaObj
                  ? heroMetaObj.publishedAt
                  : undefined;

            if (typeof customPublishedAt === "string" && customPublishedAt) {
              obj.publishedAt = customPublishedAt;
            } else if (customPublishedAt === null && !obj.isPublished) {
              obj.publishedAt = null;
            }
          }
        };

        const hydratePayload = (target: unknown) => {
          if (!target || typeof target !== "object") return;
          if (Array.isArray(target)) {
            target.forEach(hydrateItem);
            return;
          }
          hydrateItem(target);
          const record = target as Record<string, unknown>;
          if (Array.isArray(record.items)) {
            record.items.forEach(hydrateItem);
          }
          if (Array.isArray(record.data)) {
            record.data.forEach(hydrateItem);
          } else if (record.data && typeof record.data === "object") {
            hydratePayload(record.data);
          }
        };

        hydratePayload(responseData);
      }

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
  } catch (error) {
    console.error(`[BFF Proxy Error] ${request.method} ${request.nextUrl.pathname}:`, error);
    return NextResponse.json(
      {
        statusCode: 500,
        message: error instanceof Error ? error.message : "Lỗi hệ thống, vui lòng thử lại",
      },
      { status: 500 },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
