/**
 * Project — content module with gallery.
 * Maps to DB `project` + `project_image` tables + /projects API.
 */
export interface ProjectImage {
  id: string;
  url: string;
  fileId: string | null;
  caption: string | null;
  order: number;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  overview: string | null;
  thumbnail: string | null;
  thumbnailFileId: string | null;
  field: { id: string; name: string; slug: string } | null;
  province: { id: string; name: string; code: string } | null;
  year: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  images: ProjectImage[];
  createdAt: string;
  updatedAt: string;
}
