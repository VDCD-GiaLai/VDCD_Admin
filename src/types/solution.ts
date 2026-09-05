import type { DocumentContent } from "@/shared/content-editor";

/**
 * Solution — content module (twin of Program).
 * Maps to DB `solution` table + /solutions API.
 */
export interface Solution {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  content: DocumentContent | string | null;
  thumbnail: string | null;
  thumbnailFileId: string | null;
  websiteUrl: string | null;
  field: { id: string; name: string; slug: string } | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
