/**
 * Client-side upload helpers — wraps file upload calls to BFF proxy → NestJS → ImageKit.
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
 */
export type UploadFolder =
  | "image"
  | "thumbnail"
  | "slide"
  | "slide-detail-blog"
  | "partner"
  | "project";

/** Options for uploading an image */
export interface UploadImageOptions {
  /**
   * Optional subfolder name under the main folder (e.g. "bai-viet", "so-hoa-du-lieu").
   * Supported by "slide" and "slide-detail-blog" endpoints.
   */
  subfolder?: string;
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

// ─── Upload function ─────────────────────────────────────────

/**
 * Upload an image file via the BFF proxy.
 *
 * @param file - The File object to upload
 * @param folder - Target folder (maps to upload endpoint)
 * @param options - Additional upload options like subfolder
 * @returns Upload result with url, fileId, etc.
 * @throws ApiError if upload fails
 *
 * @example
 * ```ts
 * const result = await uploadImage(file, "slide-detail-blog", { subfolder: "bai-viet" });
 * // Result uploaded to /vdcd/slides/bai-viet/ on ImageKit
 * ```
 */
export async function uploadImage(
  file: File,
  folder: UploadFolder = "image",
  options?: UploadImageOptions,
): Promise<UploadResult> {
  const endpoint =
    folder === "image" ? "/api/upload/image" : `/api/upload/image/${folder}`;

  const formData = new FormData();
  formData.append("file", file);

  const subfolder = options?.subfolder?.trim();
  if (subfolder) {
    formData.append("subfolder", subfolder);
  }

  try {
    const res = await axios.post(endpoint, formData, {
      params: subfolder ? { subfolder } : undefined,
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
