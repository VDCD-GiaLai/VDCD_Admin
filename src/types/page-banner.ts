/**
 * Page Banner — banner assigned to specific pages.
 * Maps to DB `page_banner` table + /page-banners API.
 */
export interface PageBanner {
  id: string;
  pageKey: string;
  title: string;
  subtitle: string | null;
  tag: string | null;
  imageUrl: string;
  imageFileId: string | null;
  ctaButtons: { label: string; href: string; variant?: string; ariaLabel?: string }[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
