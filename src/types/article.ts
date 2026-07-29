/**
 * Article — content module linked to Project/Program/Solution.
 * Maps to DB `article` table + /articles API.
 */
export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  thumbnail: string | null;
  thumbnailFileId: string | null;
  category: string | null;
  tags: string | null;
  project: { id: string; title: string } | null;
  program: { id: string; title: string } | null;
  solution: { id: string; title: string } | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
