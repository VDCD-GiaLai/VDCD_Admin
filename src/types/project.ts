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
  size: string;
}

export interface TechnicalHighlight {
  label: string;
  value: string;
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
  // Detail fields
  challenge: string | null;
  challengeImage: string | null;
  challengeImageFileId: string | null;
  services: string[] | null;
  discipline: string | null;
  transformationBefore: string | null;
  transformationBeforeFileId: string | null;
  transformationAfter: string | null;
  transformationAfterFileId: string | null;
  technicalHighlights: TechnicalHighlight[] | null;
  nextProjectSlug: string | null;
  // SEO
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  images: ProjectImage[];
  createdAt: string;
  updatedAt: string;
}
