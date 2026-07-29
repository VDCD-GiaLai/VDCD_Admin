/**
 * Solution — content module (twin of Program).
 * Maps to DB `solution` table + /solutions API.
 */
export interface Solution {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  content: string | null;
  thumbnail: string | null;
  thumbnailFileId: string | null;
  field: { id: string; name: string; slug: string } | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
