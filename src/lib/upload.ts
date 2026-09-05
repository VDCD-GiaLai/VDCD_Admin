/**
 * Client-side upload helpers.
 *
 * Small files (< 4 MB): go through BFF proxy `/api/upload/*` → NestJS → ImageKit.
 * Large files (≥ 4 MB): bypass Vercel's 4.5 MB limit by uploading directly
 * to the backend API with a Bearer token.
 *
 * Usage:
 *   const result = await uploadImage(file, "slide");
 *   // result.url → "https://ik.imagekit.io/..."
 *   // result.fileId → "abc123" (for later deletion)
 */

import axios from "axios";
import { ApiError } from "./api-client";

// ─── Types ───────────────────────────────────────────────────

/** Upload result returned by NestJS upload endpoints */
export interface UploadResult {
  url: string;
  fileId: string;
  name: string;
  size: number;
  width?: number;
  height?: number;
  filePath: string;
}

/**
 * Upload folder type — maps to NestJS upload endpoints.
 * - "image" → POST /upload/image (general)
 * - "thumbnail" → POST /upload/image/thumbnail
 * - "slide" → POST /upload/image/slide
 * - "slide-detail-blog" → POST /upload/image/slide-detail-blog
 * - "partner" → POST /upload/image/partner
 * - "project" → POST /upload/image/project
 * - "article" → POST /upload/image/article (under vdcd/articles/<slug>)
 */
export type UploadFolder =
  | "image"
  | "thumbnail"
  | "slide"
  | "slide-detail-blog"
  | "partner"
  | "project"
  | "article"
  | "program"
  | "solution";

/** Options for uploading an image */
export interface UploadImageOptions {
  /**
   * Optional subfolder name under the main folder (e.g. "bai-viet", "so-hoa-du-lieu").
   * Supported by "slide", "slide-detail-blog", "article", "program", and "solution" endpoints.
   */
  subfolder?: string;
  /**
   * Optional article, program, or solution slug.
   * Supported by "article", "program", and "solution" endpoints.
   */
  slug?: string;
  /**
   * Optional program, article, or solution title to be slugified if slug is not provided.
   */
  title?: string;
}

// ─── Utilities ───────────────────────────────────────────────

/**
 * Converts Vietnamese text to a URL and folder safe slug.
 * Removes diacritics, spaces to hyphens, and removes non-alphanumeric chars.
 * Example: "Số hoá dữ liệu đất đai" → "so-hoa-du-lieu-dat-dai"
 */
export function slugifyVietnamese(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[đĐ]/g, (m) => (m === "đ" ? "d" : "D"))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric to hyphens
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .slice(0, 100); // keep reasonable length
}

// ─── Constants ───────────────────────────────────────────────

/** Vercel serverless body-size limit is 4.5 MB. Use direct upload for larger files. */
const DIRECT_UPLOAD_THRESHOLD = 4 * 1024 * 1024; // 4 MB (safe margin)

// ─── Upload function ─────────────────────────────────────────

/**
 * Upload an image file.
 *
 * - Files < 4 MB: go through BFF proxy (simple, no CORS needed).
 * - Files ≥ 4 MB: uploaded directly to backend API with Bearer token
 *   to bypass Vercel's 4.5 MB serverless body limit.
 *
 * @param file - The File object to upload
 * @param folder - Target folder (maps to upload endpoint)
 * @param options - Additional upload options like subfolder
 * @returns Upload result with url, fileId, etc.
 * @throws ApiError if upload fails
 */
export async function uploadImage(
  file: File,
  folder: UploadFolder = "image",
  options?: UploadImageOptions,
): Promise<UploadResult> {
  const apiPath =
    folder === "image" ? "/upload/image" : `/upload/image/${folder}`;

  const formData = new FormData();
  formData.append("file", file);

  const subfolder = options?.subfolder?.trim();
  const slug =
    options?.slug?.trim() ||
    (folder === "article" || folder === "program" || folder === "solution"
      ? subfolder
      : undefined);
  const title = options?.title?.trim();
  if (subfolder) {
    formData.append("subfolder", subfolder);
  }
  if (slug) {
    formData.append("slug", slug);
  }
  if (title) {
    formData.append("title", title);
  }

  const params: Record<string, string> = {};
  if (subfolder) params.subfolder = subfolder;
  if (slug) params.slug = slug;
  if (title) params.title = title;
  const queryParams = Object.keys(params).length > 0 ? params : undefined;

  try {
    // Large files → direct to backend API (bypass Vercel 4.5 MB limit)
    if (file.size >= DIRECT_UPLOAD_THRESHOLD) {
      return await uploadDirect(apiPath, formData, queryParams);
    }

    // Small files → through BFF proxy
    const res = await axios.post(`/api${apiPath}`, formData, {
      params: queryParams,
      headers: { "Content-Type": "multipart/form-data" },
    });

    // NestJS wraps in { statusCode, data }
    return res.data?.data ?? res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      const body = err.response.data as {
        message?: string | string[];
        statusCode?: number;
      };
      const msg =
        typeof body?.message === "string"
          ? body.message
          : Array.isArray(body?.message)
            ? body.message.join(", ")
            : "Upload thất bại";
      throw new ApiError(err.response.status, msg, body);
    }
    throw err;
  }
}

// ─── Direct upload (bypass Vercel) ───────────────────────────

/**
 * Upload directly to the backend API using a Bearer token.
 * 1. GET /api/upload/token → retrieves access token from HttpOnly cookie via BFF
 * 2. POST directly to backend API with Authorization: Bearer header
 */
async function uploadDirect(
  apiPath: string,
  formData: FormData,
  params?: Record<string, string>,
): Promise<UploadResult> {
  // Step 1: Get access token from BFF (tiny JSON response, no body limit issue)
  const tokenRes = await axios.get("/api/upload/token");
  const token = tokenRes.data?.token;
  if (!token) {
    throw new ApiError(401, "Không thể lấy token upload. Vui lòng đăng nhập lại.");
  }

  // Step 2: Build direct backend URL
  // Use window.location.origin to determine the API URL pattern
  // Production: admin.domain → api.domain
  // Local: same origin (falls back to BFF which won't happen for large files in dev)
  const backendUrl = getBackendApiUrl();
  const url = new URL(`${backendUrl}/api/v1${apiPath}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  // Step 3: Upload directly with Bearer token
  const res = await axios.post(url.toString(), formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data?.data ?? res.data;
}

/**
 * Determines the backend API URL based on the current origin.
 * - Production: replaces "admin." with "api." in the hostname
 * - Local dev: uses the same origin (backend runs on localhost:3001)
 */
function getBackendApiUrl(): string {
  if (typeof window === "undefined") return "";

  const origin = window.location.origin;

  // Local development
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return "http://localhost:3001";
  }

  // Production: admin.doimoisangtaogialai.vn → api.doimoisangtaogialai.vn
  try {
    const url = new URL(origin);
    url.hostname = url.hostname.replace(/^admin\./, "api.");
    return url.origin;
  } catch {
    return origin;
  }
}

// ─── Validation helpers ──────────────────────────────────────

/** Max image file size: 10MB (matches BE validation) */
export const IMAGE_MAX_SIZE = 10 * 1024 * 1024;

/** Allowed image MIME types (matches BE validation) */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/**
 * Validate a file before uploading — checks type and size.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Chỉ chấp nhận file ảnh JPG, PNG, WebP, GIF";
  }
  if (file.size > IMAGE_MAX_SIZE) {
    return `File không được vượt quá 10MB. Hiện tại: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
  }
  return null;
}
