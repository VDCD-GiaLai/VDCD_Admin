import type { DocumentContent } from "@/shared/content-editor";
import type { SidebarConfig } from "./sidebar-config";

/**
 * Program — content module.
 * Maps to DB `program` table + /programs API.
 */
export interface Program {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  content: DocumentContent | string | null;
  thumbnail: string | null;
  thumbnailFileId: string | null;
  field: { id: string; name: string; slug: string } | null;
  metaTitle: string | null;
  metaDescription: string | null;
  order?: number;
  sidebarConfig?: SidebarConfig | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
